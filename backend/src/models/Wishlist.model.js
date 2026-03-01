const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one wishlist per user
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Product',
      },
    ],
  },
  { timestamps: true }
);

// user has unique: true in schema — no separate index needed

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
