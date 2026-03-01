const Order         = require('../models/Order.model');
const Cart          = require('../models/Cart.model');
const User          = require('../models/User.model');
const WebhookEvent  = require('../models/WebhookEvent.model');
const AppError      = require('../utils/AppError');
const asyncHandler  = require('../utils/asyncHandler');
const stripeService = require('../utils/stripeService');
const Email         = require('../utils/email');

// ── POST /api/v1/payments/create-checkout-session ────────────────────────────
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) return next(new AppError('Order ID is required.', 400));

  const order = await Order.findById(orderId);
  if (!order)  return next(new AppError('Order not found.', 404));

  if (order.user.toString() !== req.user.id.toString()) {
    return next(new AppError('Not authorised.', 403));
  }
  if (order.paymentStatus === 'paid') {
    return next(new AppError('This order has already been paid.', 400));
  }

  // If a prior session exists and hasn't expired, reuse it instead of
  // creating a duplicate. This handles cases where the user clicks
  // "Checkout" twice in quick succession.
  if (order.stripeSessionId) {
    try {
      const existingSession = await stripeService.retrieveSession(order.stripeSessionId);
      if (existingSession.status === 'open') {
        return res.status(200).json({
          status:      'success',
          checkoutUrl: existingSession.url,
          sessionId:   existingSession.id,
        });
      }
    } catch {
      // Session no longer valid — fall through to create a new one
    }
  }

  // Build line items from the already server-validated order snapshot
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency:     'usd',
      unit_amount:  Math.round(item.price * 100),
      product_data: {
        name:   item.name,
        images: item.image ? [item.image] : [],
      },
    },
    quantity: item.quantity,
  }));

  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency:     'usd',
        unit_amount:  Math.round(order.shippingCost * 100),
        product_data: { name: 'Shipping' },
      },
      quantity: 1,
    });
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency:     'usd',
        unit_amount:  Math.round(order.tax * 100),
        product_data: { name: 'Tax (8%)' },
      },
      quantity: 1,
    });
  }

  const { sessionId, checkoutUrl } = await stripeService.createCheckoutSession({
    lineItems,
    customerEmail: req.user.email,
    orderId:       order._id.toString(),
    userId:        req.user.id.toString(),
    successUrl:    `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl:     `${process.env.CLIENT_URL}/cart`,
  });

  order.stripeSessionId = sessionId;
  await order.save();

  res.status(200).json({ status: 'success', checkoutUrl, sessionId });
});

// ── POST /api/v1/payments/webhook ─────────────────────────────────────────────
// Raw body required — registered with express.raw() in app.js.
exports.handleWebhook = async (req, res) => {
  // 1. Verify Stripe signature
  let event;
  try {
    event = stripeService.constructWebhookEvent(
      req.body,
      req.headers['stripe-signature']
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Idempotency guard — skip already-processed events
  try {
    await WebhookEvent.create({ stripeEventId: event.id, type: event.type });
  } catch (dupErr) {
    if (dupErr.code === 11000) {
      // Duplicate event — Stripe retry; already handled
      console.log(`Duplicate webhook event skipped: ${event.id}`);
      return res.status(200).json({ received: true, skipped: true });
    }
    // Non-duplicate DB error — log but don't block processing
    console.error('WebhookEvent insert error:', dupErr.message);
  }

  // 3. Handle event types
  try {
    switch (event.type) {

      // ── Payment succeeded ──────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const order   = await Order.findOne({ stripeSessionId: session.id });

        if (!order) {
          console.error('Webhook: order not found for session', session.id);
          break;
        }

        // Guard: don't mark paid twice if somehow processed before
        if (order.paymentStatus === 'paid') break;

        order.paymentStatus   = 'paid';
        order.orderStatus     = 'processing';
        order.paymentIntentId = session.payment_intent;
        order.paidAt          = new Date();
        await order.save();

        // Clear cart
        await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

        // Send confirmation email (non-blocking)
        try {
          const user = await User.findById(order.user);
          if (user) await new Email(user).sendOrderConfirmation(order);
        } catch (emailErr) {
          console.error('Confirmation email failed:', emailErr.message);
        }

        console.log(`✓ Order ${order._id} marked paid via webhook.`);
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi    = event.data.object;
        const order = await Order.findOne({ paymentIntentId: pi.id });
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
          console.log(`✗ Order ${order._id} payment failed.`);
        }
        break;
      }

      // ── Session expired without payment ────────────────────────────────────
      case 'checkout.session.expired': {
        const session = event.data.object;
        const order   = await Order.findOne({ stripeSessionId: session.id });
        if (order && order.paymentStatus === 'pending') {
          order.paymentStatus = 'failed';
          order.orderStatus   = 'cancelled';
          await order.save();
          console.log(`Session expired — order ${order._id} cancelled.`);
        }
        break;
      }

      // ── Refund completed ───────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object;
        const order  = await Order.findOne({ paymentIntentId: charge.payment_intent });
        if (order) {
          order.paymentStatus = 'refunded';
          order.orderStatus   = 'cancelled';
          await order.save();
          console.log(`Refund processed — order ${order._id} updated.`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    // Mark as processed in the idempotency log
    await WebhookEvent.findOneAndUpdate(
      { stripeEventId: event.id },
      { status: 'processed' }
    );
  } catch (err) {
    console.error('Webhook handler error:', err);
    await WebhookEvent.findOneAndUpdate(
      { stripeEventId: event.id },
      { status: 'failed', error: err.message }
    ).catch(() => {});
    // Return 200 — a 5xx would cause Stripe to retry the same event
    return res.status(200).json({ received: true, error: err.message });
  }

  res.status(200).json({ received: true });
};

// ── GET /api/v1/payments/session/:sessionId ───────────────────────────────────
exports.getSessionStatus = asyncHandler(async (req, res, next) => {
  const session = await stripeService.retrieveSession(req.params.sessionId);
  const order   = await Order.findOne({ stripeSessionId: req.params.sessionId })
    .populate({ path: 'user', select: 'name email' });

  if (!order) return next(new AppError('Order not found.', 404));

  if (order.user._id.toString() !== req.user.id.toString()) {
    return next(new AppError('Not authorised.', 403));
  }

  res.status(200).json({
    status:        'success',
    paymentStatus: session.payment_status,
    order,
  });
});

// ── POST /api/v1/payments/refund  (admin) ──────────────────────────────────────
// Issues a full or partial refund and updates the order status.
exports.createRefund = asyncHandler(async (req, res, next) => {
  const { orderId, amountCents, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found.', 404));

  if (order.paymentStatus !== 'paid') {
    return next(new AppError('Only paid orders can be refunded.', 400));
  }
  if (!order.paymentIntentId) {
    return next(new AppError('No payment intent found for this order.', 400));
  }

  const refund = await stripeService.createRefund(
    order.paymentIntentId,
    amountCents,
    reason
  );

  // Full refund — update order immediately.
  // Partial refunds are confirmed via the 'charge.refunded' webhook.
  const isFullRefund = !amountCents || amountCents >= Math.round(order.totalPrice * 100);
  if (isFullRefund) {
    order.paymentStatus = 'refunded';
    order.orderStatus   = 'cancelled';
    await order.save();
  }

  res.status(200).json({
    status: 'success',
    refund: {
      id:     refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    },
    order,
  });
});
