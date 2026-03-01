const crypto        = require('crypto');
const jwt           = require('jsonwebtoken');
const User          = require('../models/User.model');
const AppError      = require('../utils/AppError');
const asyncHandler  = require('../utils/asyncHandler');
const { issueTokens, hashToken } = require('../utils/generateTokens');
const Email         = require('../utils/email');

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Prevent duplicate emails (also enforced by unique index, but explicit check
  // gives a cleaner error message than a Mongoose duplicate key error)
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ name, email, password });

  // Send welcome email (non-blocking — don't fail registration if email fails)
  try {
    await new Email(user).sendWelcome();
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }

  const { accessToken } = await issueTokens(user, res);

  res.status(201).json({
    status: 'success',
    accessToken,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Select password explicitly (it has select:false on the schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    // Deliberately vague message — don't reveal whether email exists
    return next(new AppError('Invalid email or password.', 401));
  }

  const { accessToken } = await issueTokens(user, res);

  res.status(200).json({
    status: 'success',
    accessToken,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      avatar: user.avatar,
    },
  });
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res, next) => {
  // Null out stored refresh token in DB
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

  // Clear the httpOnly cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires:  new Date(0),
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

// ── POST /api/v1/auth/refresh-token ──────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return next(new AppError('No refresh token provided.', 401));
  }

  // Verify JWT signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }

  // Look up user and compare hashed tokens
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== hashToken(token)) {
    // Token reuse detected (hash mismatch) — possible theft
    // Invalidate all sessions by clearing the stored token
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    return next(new AppError('Refresh token is invalid or has been reused.', 401));
  }

  // Refresh token rotation: issue new pair, invalidate old refresh token
  const { accessToken } = await issueTokens(user, res);

  res.status(200).json({ status: 'success', accessToken });
});

// ── POST /api/v1/auth/forgot-password ────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  // Always respond with 200 regardless of whether email exists
  // (prevents user enumeration attacks)
  if (!user) {
    return res.status(200).json({
      status:  'success',
      message: 'If that email is registered, a reset link has been sent.',
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status:  'success',
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    // Clean up tokens if email fails so user can retry
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send reset email. Please try again.', 500));
  }
});

// ── POST /api/v1/auth/reset-password/:token ───────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash the incoming raw token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // must not be expired
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password             = req.body.password;
  user.resetPasswordToken   = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const { accessToken } = await issueTokens(user, res);

  res.status(200).json({ status: 'success', accessToken });
});
