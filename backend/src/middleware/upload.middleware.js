const multer = require('multer');
const AppError = require('../utils/AppError');
const { productStorage, avatarStorage } = require('../config/cloudinary');

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new AppError('Only image files are allowed.', 400), false);
  }
  cb(null, true);
};

// ── Product image uploader (up to 5 images) ──────────────────────────────────
const uploadProductImages = multer({
  storage:  productStorage,
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
}).array('images', 5);

// ── Avatar uploader (single file) ────────────────────────────────────────────
const uploadAvatar = multer({
  storage:  avatarStorage,
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
}).single('avatar');

// ── Multer error handler wrapper ─────────────────────────────────────────────
// Multer errors are not Express AppErrors, so we catch and convert them.
const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 5 MB.', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum is 5 images.', 400));
    }
    next(new AppError(err.message || 'File upload error.', 400));
  });
};

module.exports = {
  uploadProductImages: handleMulterError(uploadProductImages),
  uploadAvatar:        handleMulterError(uploadAvatar),
};
