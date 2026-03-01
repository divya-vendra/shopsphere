const Order        = require('../models/Order.model');
const Cart         = require('../models/Cart.model');
const Product      = require('../models/Product.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── POST /api/v1/orders ───────────────────────────────────────────────────────
// Creates a pending order from the user's cart.
// Called before redirecting to Stripe. The Stripe webhook later marks it paid.
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;

  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  // Server-side price validation — NEVER trust prices from the client
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return next(new AppError(`Product "${item.product?.name || 'Unknown'}" is no longer available.`, 400));
    }
    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for "${product.name}". Only ${product.stock} left.`, 400));
    }
    orderItems.push({
      product:  product._id,
      name:     product.name,
      price:    product.price,        // use DB price, not cart snapshot
      quantity: item.quantity,
      image:    product.images[0]?.url || null,
    });
  }

  const subtotal     = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 50 ? 0 : 9.99;   // free shipping over $50
  const taxRate      = 0.08;                          // 8% tax
  const tax          = parseFloat((subtotal * taxRate).toFixed(2));
  const totalPrice   = parseFloat((subtotal + shippingCost + tax).toFixed(2));

  const order = await Order.create({
    user:            req.user.id,
    items:           orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    tax,
    totalPrice,
    paymentStatus:   'pending',
    orderStatus:     'pending',
  });

  res.status(201).json({ status: 'success', order });
});

// ── GET /api/v1/orders/me ─────────────────────────────────────────────────────
exports.getMyOrders = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id }).sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments({ user: req.user.id }),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// ── GET /api/v1/orders/:id ────────────────────────────────────────────────────
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate({ path: 'user', select: 'name email' });

  if (!order) return next(new AppError('Order not found.', 404));

  // Customers can only view their own orders
  if (
    req.user.role !== 'admin' &&
    order.user._id.toString() !== req.user.id.toString()
  ) {
    return next(new AppError('You are not authorised to view this order.', 403));
  }

  res.status(200).json({ status: 'success', order });
});

// ── GET /api/v1/orders  (admin) ───────────────────────────────────────────────
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page         = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit        = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip         = (page - 1) * limit;
  const { orderStatus, paymentStatus } = req.query;

  const filter = {};
  if (orderStatus)   filter.orderStatus   = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate({ path: 'user', select: 'name email' })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// ── PATCH /api/v1/orders/:id/status  (admin) ──────────────────────────────────
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderStatus, trackingNumber, notes } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found.', 404));

  // Prevent status regression (e.g. delivered → pending)
  const statusFlow = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const currentIdx = statusFlow.indexOf(order.orderStatus);
  const newIdx     = statusFlow.indexOf(orderStatus);

  if (newIdx < currentIdx && orderStatus !== 'cancelled') {
    return next(new AppError(`Cannot change status from "${order.orderStatus}" to "${orderStatus}".`, 400));
  }

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (notes)          order.notes          = notes;
  if (orderStatus === 'delivered') order.deliveredAt = new Date();

  // Decrement product stock when order moves to 'processing'
  if (orderStatus === 'processing' && order.paymentStatus === 'paid') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  await order.save();
  res.status(200).json({ status: 'success', order });
});
