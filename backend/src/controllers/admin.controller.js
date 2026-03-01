const Order        = require('../models/Order.model');
const Product      = require('../models/Product.model');
const User         = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const cache        = require('../utils/cache');

// ── GET /api/v1/admin/analytics ───────────────────────────────────────────────
// Summary stats for the admin dashboard header cards
exports.getAnalytics = asyncHandler(async (req, res) => {
  const now        = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue,
    monthlyRevenue,
    totalOrders,
    monthlyOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    topProducts,
    salesByMonth,
  ] = await Promise.all([

    // Total revenue (all paid orders)
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),

    // This month's revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),

    // Total orders
    Order.countDocuments({ paymentStatus: 'paid' }),

    // This month's orders
    Order.countDocuments({ paymentStatus: 'paid', createdAt: { $gte: startOfMonth } }),

    // Total registered users
    User.countDocuments(),

    // Active products
    Product.countDocuments({ isActive: true }).setOptions({ adminQuery: true }),

    // 5 most recent orders
    Order.find({ paymentStatus: 'paid' })
      .sort('-createdAt')
      .limit(5)
      .populate({ path: 'user', select: 'name email' }),

    // Top 5 best-selling products by quantity sold
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id:        '$items.product',
          name:       { $first: '$items.name' },
          image:      { $first: '$items.image' },
          totalSold:  { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),

    // Monthly sales for the past 12 months (for the sales chart)
    Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.status(200).json({
    status: 'success',
    analytics: {
      totalRevenue:   totalRevenue[0]?.total    || 0,
      monthlyRevenue: monthlyRevenue[0]?.total  || 0,
      totalOrders,
      monthlyOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      topProducts,
      salesByMonth,
    },
  });
});

// ── GET /api/v1/admin/low-stock ───────────────────────────────────────────────
// Products with stock at or below a configurable threshold
exports.getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || 10;

  const products = await Product.find({ stock: { $lte: threshold }, isActive: true })
    .setOptions({ adminQuery: true })
    .select('name stock category brand images')
    .sort('stock');

  res.status(200).json({
    status: 'success',
    results: products.length,
    threshold,
    products,
  });
});

// ── GET /api/v1/admin/cache-stats ─────────────────────────────────────────────
// Exposes in-process cache metrics for monitoring
exports.getCacheStats = asyncHandler(async (req, res) => {
  res.status(200).json({ status: 'success', cache: cache.stats() });
});

// ── DELETE /api/v1/admin/cache ────────────────────────────────────────────────
// Force-flush the entire in-process cache (useful after bulk data imports)
exports.flushCache = asyncHandler(async (req, res) => {
  cache.flush();
  res.status(200).json({ status: 'success', message: 'Cache flushed.' });
});
