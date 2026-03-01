const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // never returned in queries by default
    },
    role: {
      type:    String,
      enum:    ['customer', 'admin'],
      default: 'customer',
    },
    avatar: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },
    // Hashed refresh token — raw token lives only in the httpOnly cookie.
    // Storing the hash means a compromised DB doesn't expose valid tokens.
    refreshToken: {
      type:   String,
      select: false,
    },
    passwordChangedAt: Date,
    resetPasswordToken: {
      type:   String,
      select: false,
    },
    resetPasswordExpires: {
      type:   Date,
      select: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
      select:  false,
    },
  },
  { timestamps: true }
);

// email has unique: true in schema — no separate index needed

// ─── Pre-save hook: hash password ────────────────────────────────────────────
// Only runs when password field is modified, preventing re-hashing on other
// document saves (e.g., updating name or email).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Pre-save hook: set passwordChangedAt ────────────────────────────────────
// Used to invalidate tokens issued before a password change.
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // Subtract 1s to ensure token iat > passwordChangedAt
  // (DB write can be slightly slower than JWT signing)
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ─── Query middleware: exclude inactive users ─────────────────────────────────
// Soft-delete: isActive:false users are invisible to all find queries.
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

/** Compare a plain-text candidate with the stored hash */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Returns true if password was changed after the JWT was issued */
userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtIssuedAt < changedAt;
  }
  return false;
};

/** Generate a raw reset token (stored as its SHA-256 hash) */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken; // returned raw — sent in the email link
};

const User = mongoose.model('User', userSchema);
module.exports = User;
