const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    quantity: {
      type:     Number,
      required: true,
      min:      [1, 'Quantity must be at least 1'],
      default:  1,
    },
    // Price snapshot taken at time of add-to-cart.
    // Prevents price drift issues during checkout and ensures the
    // server-side total matches what the customer saw.
    price: {
      type:     Number,
      required: true,
      min:      [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one cart per user
    },
    items: [cartItemSchema],
  },
  {
    timestamps:  true,
    toJSON:      { virtuals: true },
    toObject:    { virtuals: true },
  }
);

// user has unique: true in schema — no separate index needed

// ─── Virtual: total cart price ────────────────────────────────────────────────
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// ─── Virtual: total items count ───────────────────────────────────────────────
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
