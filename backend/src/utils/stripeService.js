const stripe    = require('../config/stripe');
const AppError  = require('./AppError');

function ensureStripe() {
  if (!stripe) {
    throw new AppError('Stripe is not configured. Set STRIPE_SECRET_KEY in .env', 503);
  }
}

/**
 * stripeService — thin abstraction over the Stripe SDK.
 *
 * Design decisions:
 *  - All Stripe calls go through this module so we have a single place
 *    to add retry logic, logging, or swap providers in the future.
 *  - Errors are converted to AppErrors so the global error handler can
 *    return consistent JSON responses.
 *  - Each function is async and returns only the data the caller needs,
 *    rather than the full Stripe response object.
 */
const stripeService = {

  /**
   * Create a Stripe Checkout Session.
   * @param {Object} params
   * @param {Array}  params.lineItems   - Stripe line_items array
   * @param {string} params.customerEmail
   * @param {string} params.orderId     - Our DB order ID (stored in metadata)
   * @param {string} params.userId
   * @param {string} params.successUrl
   * @param {string} params.cancelUrl
   * @returns {{ sessionId: string, checkoutUrl: string }}
   */
  async createCheckoutSession({ lineItems, customerEmail, orderId, userId, successUrl, cancelUrl }) {
    ensureStripe();
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode:                 'payment',
        line_items:           lineItems,
        customer_email:       customerEmail,
        success_url:          successUrl,
        cancel_url:           cancelUrl,
        metadata:             { orderId, userId },
        expires_at:           Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
        // Collect billing address for fraud prevention
        billing_address_collection: 'auto',
        // Enable automatic tax calculation (configure in Stripe Dashboard)
        // automatic_tax: { enabled: true },
        payment_intent_data: {
          // Store metadata on the PaymentIntent too — useful for reconciliation
          metadata: { orderId, userId },
        },
      });
      return { sessionId: session.id, checkoutUrl: session.url };
    } catch (err) {
      throw new AppError(`Stripe session creation failed: ${err.message}`, 500);
    }
  },

  /**
   * Retrieve a Checkout Session by ID.
   * @param {string} sessionId
   * @returns {Stripe.CheckoutSession}
   */
  async retrieveSession(sessionId) {
    ensureStripe();
    try {
      return await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer'],
      });
    } catch (err) {
      throw new AppError(`Failed to retrieve Stripe session: ${err.message}`, 500);
    }
  },

  /**
   * Construct and verify a webhook event from the raw request body.
   * MUST receive the raw Buffer — not parsed JSON.
   * @param {Buffer} rawBody
   * @param {string} signature  - value of 'stripe-signature' header
   * @returns {Stripe.Event}
   */
  constructWebhookEvent(rawBody, signature) {
    ensureStripe();
    try {
      return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new AppError(`Webhook verification failed: ${err.message}`, 400);
    }
  },

  /**
   * Issue a full or partial refund for a PaymentIntent.
   * @param {string} paymentIntentId
   * @param {number} [amountCents]  - omit to refund the full amount
   * @param {string} [reason]       - 'duplicate' | 'fraudulent' | 'requested_by_customer'
   * @returns {Stripe.Refund}
   */
  async createRefund(paymentIntentId, amountCents, reason = 'requested_by_customer') {
    ensureStripe();
    try {
      const params = { payment_intent: paymentIntentId, reason };
      if (amountCents) params.amount = amountCents;
      return await stripe.refunds.create(params);
    } catch (err) {
      throw new AppError(`Refund failed: ${err.message}`, 500);
    }
  },

  /**
   * Cancel a Checkout Session that has not yet been completed.
   * Useful if the user changes their cart before paying.
   * @param {string} sessionId
   */
  async expireSession(sessionId) {
    ensureStripe();
    try {
      return await stripe.checkout.sessions.expire(sessionId);
    } catch (err) {
      // Silently ignore if already expired
      if (err.code !== 'resource_already_exists') {
        throw new AppError(`Failed to expire session: ${err.message}`, 500);
      }
    }
  },

  /**
   * List recent charges for admin reconciliation.
   * @param {number} limit
   */
  async listRecentCharges(limit = 10) {
    ensureStripe();
    try {
      const charges = await stripe.charges.list({ limit });
      return charges.data.map((c) => ({
        id:        c.id,
        amount:    c.amount / 100,
        currency:  c.currency,
        status:    c.status,
        email:     c.billing_details?.email,
        createdAt: new Date(c.created * 1000),
      }));
    } catch (err) {
      throw new AppError(`Failed to list charges: ${err.message}`, 500);
    }
  },
};

module.exports = stripeService;
