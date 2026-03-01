/**
 * Custom error class that extends the native Error.
 *
 * Why? Express's default error handling works with any Error, but having
 * a dedicated class lets us:
 *   1. Distinguish operational errors (bad input, 404s) from
 *      programming errors (bugs) in the global error handler.
 *   2. Carry an HTTP status code right on the error object.
 *   3. Keep all error-shaping logic in one place.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode  = statusCode;
    this.status      = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // flag: errors we anticipated and handled

    // Capture stack trace without polluting it with this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
