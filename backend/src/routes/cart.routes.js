const express  = require('express');
const router   = express.Router();
const cartCtrl = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

// All cart routes require authentication
router.use(protect);

router.get('/',          cartCtrl.getCart);
router.post('/',         cartCtrl.addToCart);
router.delete('/',       cartCtrl.clearCart);
router.patch('/:itemId', cartCtrl.updateCartItem);
router.delete('/:itemId', cartCtrl.removeCartItem);

module.exports = router;
