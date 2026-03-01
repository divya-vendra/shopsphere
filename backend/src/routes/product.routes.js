const express        = require('express');
const router         = express.Router();
const productCtrl    = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadProductImages } = require('../middleware/upload.middleware');
const validate       = require('../middleware/validate.middleware');
const cacheResponse  = require('../middleware/cache.middleware');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');

// Public routes — cache product listings for 2 minutes, single products for 5 minutes.
// Cache is busted automatically when admin creates/updates/deletes via the controller.
router.get('/',           cacheResponse(120), productCtrl.getAllProducts);
router.get('/featured',   cacheResponse(300), productCtrl.getFeaturedProducts);
router.get('/slug/:slug', cacheResponse(300), productCtrl.getProductBySlug);
router.get('/:id',        cacheResponse(300), productCtrl.getProduct);

// Admin-only routes — mutations that bust the cache
router.use(protect, restrictTo('admin'));

router.post(
  '/',
  uploadProductImages,
  validate(createProductSchema),
  productCtrl.createProduct
);
router.patch(
  '/:id',
  uploadProductImages,
  validate(updateProductSchema),
  productCtrl.updateProduct
);
router.delete('/:id',                  productCtrl.deleteProduct);
router.delete('/:id/images/:publicId', productCtrl.deleteProductImage);

module.exports = router;
