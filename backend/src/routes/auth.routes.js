const express  = require('express');
const router   = express.Router();
const authCtrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

router.post('/register',        validate(registerSchema),       authCtrl.register);
router.post('/login',           validate(loginSchema),          authCtrl.login);
router.post('/logout',          protect,                        authCtrl.logout);
router.post('/refresh-token',                                   authCtrl.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authCtrl.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), authCtrl.resetPassword);

module.exports = router;
