const jwt      = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User     = require('../models/User.model');

/**
 * protect — verifies the access token on every authenticated request.
 *
 * Token is read from:
 *   1. Authorization: Bearer <token>  (preferred for API clients)
 *   2. cookies.accessToken             (fallback for browser same-site requests)
 *
 * After verification we attach req.user so downstream middleware/controllers
 * can read the authenticated user without hitting the DB again.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // Check user still exists (could have been deleted since token was issued)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check user hasn't changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed their password. Please log in again.', 401)
    );
  }

  req.user = currentUser; // attach for downstream use
  next();
});

/**
 * optionalProtect — same as protect but never returns 401.
 * If a valid token is present, sets req.user; otherwise leaves req.user undefined.
 * Used on public routes (e.g. GET /products) so the handler can tailor response for admins.
 */
exports.optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return next();
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser || currentUser.changedPasswordAfter(decoded.iat)) {
    return next();
  }

  req.user = currentUser;
  next();
});

/**
 * restrictTo — role-based access control gate.
 *
 * Usage:  router.delete('/users/:id', protect, restrictTo('admin'), handler)
 *
 * Returns a middleware closure so we can pass roles at route-definition time.
 */
exports.restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
