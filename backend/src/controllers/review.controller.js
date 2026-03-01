const Review       = require('../models/Review.model');
const Order        = require('../models/Order.model');
const Product      = require('../models/Product.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── POST /api/v1/reviews ──────────────────────────────────────────────────────
exports.createReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, title, body } = req.body;

  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found.', 404));

  // Check if user already reviewed this product (also enforced by DB index)
  const existing = await Review.findOne({ user: req.user.id, product: productId });
  if (existing) {
    return next(new AppError('You have already reviewed this product.', 400));
  }

  // Check if this is a verified purchase
  const hasPurchased = await Order.findOne({
    user:          req.user.id,
    'items.product': productId,
    paymentStatus: 'paid',
  });

  const review = await Review.create({
    user:     req.user.id,
    product:  productId,
    rating,
    title,
    body,
    verified: !!hasPurchased,
  });

  await review.populate({ path: 'user', select: 'name avatar' });

  res.status(201).json({ status: 'success', review });
});

// ── GET /api/v1/reviews/product/:productId ────────────────────────────────────
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
  const skip  = (page - 1) * limit;

  const product = await Product.findById(req.params.productId);
  if (!product) return next(new AppError('Product not found.', 404));

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId })
      .populate({ path: 'user', select: 'name avatar' })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: req.params.productId }),
  ]);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    reviews,
  });
});

// ── DELETE /api/v1/reviews/:id ────────────────────────────────────────────────
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  // Allow owner or admin to delete
  if (
    review.user.toString() !== req.user.id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorised to delete this review.', 403));
  }

  await review.deleteOne();
  // Post-remove hook on the model recalculates product ratings

  res.status(204).json({ status: 'success', data: null });
});
