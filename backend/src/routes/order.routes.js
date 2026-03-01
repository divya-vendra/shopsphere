const express   = require('express');
const router    = express.Router();
const orderCtrl = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate  = require('../middleware/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

router.use(protect);

router.post('/',    validate(createOrderSchema), orderCtrl.createOrder);
router.get('/me',   orderCtrl.getMyOrders);
router.get('/:id',  orderCtrl.getOrderById);

// Admin-only
router.get('/', restrictTo('admin'), orderCtrl.getAllOrders);
router.patch(
  '/:id/status',
  restrictTo('admin'),
  validate(updateOrderStatusSchema),
  orderCtrl.updateOrderStatus
);

module.exports = router;
