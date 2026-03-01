const express       = require('express');
const router        = express.Router();
const adminCtrl     = require('../controllers/admin.controller');
const productCtrl   = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('admin'));

router.get('/analytics',    adminCtrl.getAnalytics);
router.get('/products',     productCtrl.getAdminProducts);
router.get('/low-stock',    adminCtrl.getLowStockProducts);
router.get('/cache-stats',  adminCtrl.getCacheStats);
router.delete('/cache',     adminCtrl.flushCache);

module.exports = router;
