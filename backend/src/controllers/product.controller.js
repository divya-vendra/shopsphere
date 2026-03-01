const Product      = require('../models/Product.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const APIFeatures  = require('../utils/apiFeatures');
const { cloudinary } = require('../config/cloudinary');
const cache        = require('../utils/cache');

// .lean() does not include Mongoose virtuals; add stock + inStock so frontend can show availability
const withStock = (p) => ({
  ...p,
  stock:   p.stock ?? 0,
  inStock: (p.stock ?? 0) > 0,
});

// ── GET /api/v1/products ──────────────────────────────────────────────────────
// Public/shop listing: only returns products where isActive is not false (model pre-find hook).
// Supports: ?search=nike&category=Footwear&price[gte]=50&price[lte]=200
//           &sort=-price&page=2&limit=12&fields=name,price,images
exports.getAllProducts = asyncHandler(async (req, res) => {
  const features = new APIFeatures(Product.find(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [products, total] = await Promise.all([
    // .lean() returns plain JS objects instead of Mongoose Documents.
    // ~40% faster for read-only endpoints — no prototype overhead, no change tracking.
    features.query.lean(),
    new APIFeatures(Product.find(), req.query).search().filter().query.countDocuments(),
  ]);

  const { page, limit } = features.pagination;

  res.status(200).json({
    status:  'success',
    results: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products: products.map(withStock),
  });
});

// ── GET /api/v1/admin/products ────────────────────────────────────────────────
// Admin-only: returns all products (including inactive) so admin can manage them.
// Same query params as getAllProducts; uses adminQuery so pre-find hook does not filter by isActive.
exports.getAdminProducts = asyncHandler(async (req, res) => {
  const baseQuery = Product.find().setOptions({ adminQuery: true });
  const features  = new APIFeatures(baseQuery, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [products, total] = await Promise.all([
    features.query.lean(),
    new APIFeatures(Product.find().setOptions({ adminQuery: true }), req.query)
      .search()
      .filter()
      .query.countDocuments(),
  ]);

  const { page, limit } = features.pagination;

  res.status(200).json({
    status:  'success',
    results: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products: products.map(withStock),
  });
});

// ── GET /api/v1/products/:id ──────────────────────────────────────────────────
exports.getProduct = asyncHandler(async (req, res, next) => {
  // Populate reviews with basic user info (name + avatar only)
  const product = await Product.findOne({ _id: req.params.id })
    .populate({ path: 'createdBy', select: 'name' });

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ status: 'success', product });
});

// ── GET /api/v1/products/slug/:slug ──────────────────────────────────────────
exports.getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate({ path: 'createdBy', select: 'name' });

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ status: 'success', product });
});

// ── POST /api/v1/products  (admin) ────────────────────────────────────────────
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Attach uploaded Cloudinary images
  if (!req.files || req.files.length === 0) {
    return next(new AppError('At least one product image is required.', 400));
  }

  const images = req.files.map((file) => ({
    url:      file.path,
    publicId: file.filename,
  }));

  const product = await Product.create({
    ...req.body,
    images,
    createdBy: req.user.id,
    isActive:  req.body.isActive !== false, // ensure new products are visible on the shop
  });

  // Bust all product listing caches so the new product appears immediately
  cache.delByPrefix('route:/api/v1/products');

  res.status(201).json({ status: 'success', product });
});

// ── PATCH /api/v1/products/:id  (admin) ───────────────────────────────────────
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).setOptions({ adminQuery: true });
  if (!product) return next(new AppError('Product not found.', 404));

  // If new images uploaded, append to existing (or replace — here we append)
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url:      file.path,
      publicId: file.filename,
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  Object.assign(product, req.body);
  await product.save();

  cache.delByPrefix('route:/api/v1/products');

  res.status(200).json({ status: 'success', product });
});

// ── DELETE /api/v1/products/:id  (admin) ──────────────────────────────────────
// Soft delete — sets isActive: false so existing orders still reference the product.
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).setOptions({ adminQuery: true });
  if (!product) return next(new AppError('Product not found.', 404));

  product.isActive = false;
  await product.save();

  // Bust product list caches so the shop no longer shows this product
  cache.delByPrefix('route:/api/v1/products');

  res.status(204).json({ status: 'success', data: null });
});

// ── DELETE /api/v1/products/:id/images/:publicId  (admin) ────────────────────
// Remove a single image from a product and delete from Cloudinary
exports.deleteProductImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).setOptions({ adminQuery: true });
  if (!product) return next(new AppError('Product not found.', 404));

  const { publicId } = req.params;
  const imageIndex   = product.images.findIndex((img) => img.publicId === publicId);
  if (imageIndex === -1) return next(new AppError('Image not found.', 404));

  await cloudinary.uploader.destroy(publicId);
  product.images.splice(imageIndex, 1);
  await product.save();

  res.status(200).json({ status: 'success', product });
});

// ── GET /api/v1/products/featured ────────────────────────────────────────────
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true }).limit(8);
  res.status(200).json({ status: 'success', results: products.length, products });
});
