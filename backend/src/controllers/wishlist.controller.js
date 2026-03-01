const Wishlist     = require('../models/Wishlist.model');
const Product      = require('../models/Product.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── GET /api/v1/wishlist ──────────────────────────────────────────────────────
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate({ path: 'products', select: 'name images price ratings stock slug isActive' });

  if (!wishlist) {
    return res.status(200).json({ status: 'success', wishlist: { products: [] } });
  }

  // Filter out soft-deleted products
  wishlist.products = wishlist.products.filter((p) => p && p.isActive);

  res.status(200).json({ status: 'success', wishlist });
});

// ── POST /api/v1/wishlist/:productId ─────────────────────────────────────────
exports.addToWishlist = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new AppError('Product not found.', 404));

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $addToSet: { products: req.params.productId } }, // $addToSet prevents duplicates
    { new: true, upsert: true }
  ).populate({ path: 'products', select: 'name images price ratings stock slug' });

  res.status(200).json({ status: 'success', wishlist });
});

// ── DELETE /api/v1/wishlist/:productId ────────────────────────────────────────
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { products: req.params.productId } },
    { new: true }
  ).populate({ path: 'products', select: 'name images price ratings stock slug' });

  if (!wishlist) return next(new AppError('Wishlist not found.', 404));

  res.status(200).json({ status: 'success', wishlist });
});
