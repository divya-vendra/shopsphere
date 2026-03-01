/**
 * Wraps an async route handler and forwards any rejected promise to
 * Express's next(err) — eliminating try/catch boilerplate in every controller.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res, next) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
