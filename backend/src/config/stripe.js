const Stripe = require('stripe');

/**
 * Initialise the Stripe client once and export it.
 * Using a singleton prevents creating multiple instances across modules.
 * apiVersion is pinned so upgrades are explicit and intentional.
 * If STRIPE_SECRET_KEY is missing, export null so the app can start (e.g. dev without .env);
 * payment routes will return 503 when Stripe is not configured.
 */
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

module.exports = stripe;
