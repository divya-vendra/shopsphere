const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Signs a short-lived access token (15 min default).
 * Payload only includes id and role — minimum needed for authorization.
 */
const signAccessToken = (userId, role) =>
  jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

/**
 * Signs a long-lived refresh token (7 days default).
 * Payload only includes id — role is not needed here.
 */
const signRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

/**
 * Hashes a raw token string using SHA-256.
 * Stored in DB so raw tokens are never persisted.
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Sets the refresh token as an httpOnly cookie and returns both tokens.
 * httpOnly prevents JS access (XSS-proof).
 * Secure: true means HTTPS-only in production.
 * SameSite: 'strict' prevents CSRF.
 */
const issueTokens = async (user, res) => {
  const accessToken  = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // Store hashed refresh token in DB for validation during rotation
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return { accessToken };
};

module.exports = { signAccessToken, signRefreshToken, hashToken, issueTokens };
