const express      = require('express');
const router       = express.Router();
const wishlistCtrl = require('../controllers/wishlist.controller');
const { protect }  = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',                      wishlistCtrl.getWishlist);
router.post('/:productId',           wishlistCtrl.addToWishlist);
router.delete('/:productId',         wishlistCtrl.removeFromWishlist);

module.exports = router;
