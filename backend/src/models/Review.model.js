const mongoose = require('mongoose');
const Product  = require('./Product.model');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Review must belong to a user'],
    },
    product: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: [true, 'Review must belong to a product'],
    },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },
    title: {
      type:      String,
      required:  [true, 'Review title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    body: {
      type:      String,
      required:  [true, 'Review body is required'],
      trim:      true,
      maxlength: [1000, 'Review body cannot exceed 1000 characters'],
    },
    // Set to true if we confirm user purchased this product via Order model
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound unique: one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

// ─── Static method: recalculate product ratings ──────────────────────────────
// Called after save and after remove to keep Product.ratings accurate.
// Using a static method (not a hook) keeps the logic reusable and testable.
reviewSchema.statics.recalcProductRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id:       '$product',
        avgRating: { $avg: '$rating' },
        count:     { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings:    Math.round(stats[0].avgRating * 10) / 10, // 1 decimal place
      numReviews: stats[0].count,
    });
  } else {
    // No reviews left — reset to defaults
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
};

// ─── Hooks: trigger recalculation ────────────────────────────────────────────
reviewSchema.post('save', function () {
  this.constructor.recalcProductRatings(this.product);
});

// For findByIdAndDelete — 'this' is the query, not the document
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Store the document on 'this' so the post hook can access productId
  this._doc = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this._doc) {
    await this._doc.constructor.recalcProductRatings(this._doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
