const express    = require('express');
const router     = express.Router();
const userCtrl   = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

// All user routes require authentication
router.use(protect);

router.get('/me',    userCtrl.getMe);
router.patch('/me',  uploadAvatar, userCtrl.updateMe);
router.delete('/me', userCtrl.deleteMe);

// Admin-only routes
router.use(restrictTo('admin'));
router.get('/',     userCtrl.getAllUsers);
router.get('/:id',  userCtrl.getUserById);
router.patch('/:id', userCtrl.updateUser);
router.delete('/:id', userCtrl.deleteUser);

module.exports = router;
