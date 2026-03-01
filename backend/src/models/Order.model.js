const mongoose = require('mongoose');

// ─── Embedded item snapshot ───────────────────────────────────────────────────
// Items are embedded (not referenced) so that order history is immutable.
// If a product is later edited or deleted, past orders still show correct data.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Product',
      // Not required — product may be deleted after order is placed
    },
    name:     { type: String, required: true },   // snapshot
    price:    { type: Number, required: true },   // snapshot (price at purchase time)
    quantity: { type: Number, required: true, min: 1 },
    image:    { type: String },                   // snapshot (primary image URL)
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    address:  { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    zipCode:  { type: String, required: true },
    country:  { type: String, required: true, default: 'US' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    items:           { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod:   { type: String, default: 'stripe' },

    // Stripe identifiers — used for webhook lookup and reconciliation
    stripeSessionId:  { type: String, default: null },
    paymentIntentId:  { type: String, default: null },

    paymentStatus: {
      type:    String,
      enum:    ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type:    String,
      enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    subtotal:     { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax:          { type: Number, default: 0, min: 0 },
    totalPrice:   { type: Number, required: true, min: 0 },

    paidAt:       { type: Date, default: null },
    deliveredAt:  { type: Date, default: null },

    // Admin notes / tracking
    trackingNumber: { type: String, default: null },
    notes:          { type: String, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });          // order history queries
orderSchema.index({ stripeSessionId: 1 });               // webhook lookup (must be fast)
orderSchema.index({ orderStatus: 1, createdAt: -1 });    // admin dashboard filters
orderSchema.index({ paymentStatus: 1 });                 // reconciliation queries

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
