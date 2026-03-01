const mongoose = require('mongoose');
const slugify  = require('slugify');

const CATEGORIES = [
  'Electronics', 'Clothing', 'Footwear', 'Home & Garden',
  'Sports', 'Beauty', 'Books', 'Toys', 'Automotive', 'Other',
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    // Auto-generated from name. Used for SEO-friendly URLs.
    slug: {
      type:   String,
      unique: true,
      lowercase: true,
    },
    description: {
      type:      String,
      required:  [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type:     Number,
      required: [true, 'Product price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    // Original / compare-at price for "was $X" display
    comparePrice: {
      type:    Number,
      default: null,
      min:     [0, 'Compare price cannot be negative'],
    },
    category: {
      type:     String,
      required: [true, 'Product category is required'],
      enum:     { values: CATEGORIES, message: '{VALUE} is not a valid category' },
    },
    brand: {
      type:     String,
      required: [true, 'Brand is required'],
      trim:     true,
    },
    // Each image has a CDN url + Cloudinary publicId (needed for deletion)
    images: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    stock: {
      type:     Number,
      required: [true, 'Stock quantity is required'],
      min:      [0, 'Stock cannot be negative'],
      default:  0,
    },
    // Denormalised — recalculated by Review post-save/post-remove hooks
    ratings:    { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },

    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
    tags: [{ type: String, lowercase: true, trim: true }],
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// slug has unique: true in schema — no separate index needed
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
// Text index with field weights: name matches rank higher than description
productSchema.index(
  { name: 'text', description: 'text', brand: 'text' },
  { weights: { name: 10, brand: 5, description: 1 }, name: 'product_text_search' }
);

// ─── Virtual: discount percentage ────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// ─── Virtual: inStock flag ────────────────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// ─── Pre-save hook: generate slug ─────────────────────────────────────────────
// Appends a timestamp suffix to handle duplicate names gracefully.
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// ─── Query middleware: hide inactive products for non-admin queries ────────────
// Only exclude when isActive is explicitly false. Missing field (e.g. docs added
// via Compass) is treated as active so they show on the frontend.
productSchema.pre(/^find/, function (next) {
  if (!this.getOptions().adminQuery) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
