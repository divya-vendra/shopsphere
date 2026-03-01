const express      = require('express');
const router       = express.Router();
const paymentCtrl  = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// ── CRITICAL: webhook MUST be registered BEFORE any body parsing middleware ───
// express.raw() is applied at the app level for this exact path in app.js.
// Any route that runs express.json() first will break signature verification.
router.post('/webhook', paymentCtrl.handleWebhook);

// ── Authenticated customer routes ─────────────────────────────────────────────
router.use(protect);
router.post('/create-checkout-session', paymentCtrl.createCheckoutSession);
router.get('/session/:sessionId',       paymentCtrl.getSessionStatus);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post('/refund', restrictTo('admin'), paymentCtrl.createRefund);

module.exports = router;
