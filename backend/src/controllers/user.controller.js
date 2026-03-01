const User         = require('../models/User.model');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { cloudinary } = require('../config/cloudinary');

// Helper to filter only allowed fields from req.body for profile updates.
// Prevents customers from escalating their own role or modifying protected fields.
const filterBody = (body, ...allowed) => {
  const filtered = {};
  allowed.forEach((key) => { if (body[key] !== undefined) filtered[key] = body[key]; });
  return filtered;
};

// ── GET /api/v1/users/me ──────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ status: 'success', user });
});

// ── PATCH /api/v1/users/me ────────────────────────────────────────────────────
exports.updateMe = asyncHandler(async (req, res, next) => {
  // Block password changes through this route
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError('This route is not for password updates. Use /auth/reset-password.', 400)
    );
  }

  const filteredBody = filterBody(req.body, 'name', 'email');

  // Handle avatar upload if a file was provided
  if (req.file) {
    // Delete old avatar from Cloudinary if it exists
    const currentUser = await User.findById(req.user.id);
    if (currentUser.avatar?.publicId) {
      await cloudinary.uploader.destroy(currentUser.avatar.publicId);
    }
    filteredBody.avatar = {
      url:      req.file.path,
      publicId: req.file.filename,
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({ status: 'success', user: updatedUser });
});

// ── DELETE /api/v1/users/me ───────────────────────────────────────────────────
// Soft delete: sets isActive to false rather than destroying the record.
// This preserves order history and audit trails.
exports.deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });
  res.status(204).json({ status: 'success', data: null });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /api/v1/users  (admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).sort('-createdAt'),
    User.countDocuments(),
  ]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

// GET /api/v1/users/:id  (admin)
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ status: 'success', user });
});

// PATCH /api/v1/users/:id  (admin)
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Admins can update role and isActive status
  const filteredBody = filterBody(req.body, 'name', 'email', 'role', 'isActive');

  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true, runValidators: true,
  });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ status: 'success', user });
});

// DELETE /api/v1/users/:id  (admin) — hard delete
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.status(204).json({ status: 'success', data: null });
});
