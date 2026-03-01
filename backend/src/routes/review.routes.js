const express    = require('express');
const router     = express.Router();
const reviewCtrl = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const validate   = require('../middleware/validate.middleware');
const { reviewSchema } = require('../validators/product.validator');

router.get('/product/:productId', reviewCtrl.getProductReviews);

router.use(protect);
router.post('/',    validate(reviewSchema), reviewCtrl.createReview);
router.delete('/:id', reviewCtrl.deleteReview);

module.exports = router;
