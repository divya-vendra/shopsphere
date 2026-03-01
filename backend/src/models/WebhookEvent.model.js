const mongoose = require('mongoose');

/**
 * WebhookEvent — idempotency log for Stripe webhook events.
 *
 * Why this exists:
 *   Stripe guarantees at-least-once delivery, NOT exactly-once.
 *   Network failures, retries, and redeployments can cause the same event
 *   to arrive multiple times. Without this guard:
 *     - An order could be marked paid twice
 *     - Cart could be cleared twice
 *     - Confirmation emails could be sent twice
 *
 * Before processing any event, we attempt to create a document with the
 * Stripe event ID. MongoDB's unique index makes this atomic — a duplicate
 * insert throws code 11000, which we catch and silently skip.
 *
 * TTL index automatically purges records older than 30 days to control storage.
 */
const webhookEventSchema = new mongoose.Schema({
  stripeEventId: {
    type:     String,
    required: true,
    unique:   true,  // atomic duplicate guard
    index:    true,
  },
  type:       { type: String, required: true },  // e.g. 'checkout.session.completed'
  status:     {
    type:    String,
    enum:    ['processed', 'failed', 'skipped'],
    default: 'processed',
  },
  error:      { type: String, default: null },   // error message if status === 'failed'
  processedAt:{ type: Date, default: Date.now },
});

// Auto-delete records after 30 days — Stripe's retry window is 72 hours,
// so 30 days gives ample buffer for manual investigation.
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
module.exports = WebhookEvent;
