const AppError = require('../utils/AppError');

// ─── Specific error transformers ──────────────────────────────────────────────
// These convert Mongoose / JWT native errors into our AppError format
// so the global handler always sends a consistent JSON response shape.

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field   = Object.keys(err.keyValue)[0];
  const value   = err.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors  = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// ─── Response senders ─────────────────────────────────────────────────────────

const sendErrorDev = (err, res) => {
  // In development: expose full error details for easier debugging
  res.status(err.statusCode).json({
    status:  err.status,
    message: err.message,
    stack:   err.stack,
    error:   err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational, trusted error: send safe message to client
    res.status(err.statusCode).json({
      status:  err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak details
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({
      status:  'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Global error handling middleware ─────────────────────────────────────────
// Express identifies this as an error handler because it has 4 parameters.
// Must be registered AFTER all routes in app.js.
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    if (err.name === 'CastError')                  error = handleCastErrorDB(error);
    if (err.code === 11000)                         error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError')             error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError')           error = handleJWTError();
    if (err.name === 'TokenExpiredError')           error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
