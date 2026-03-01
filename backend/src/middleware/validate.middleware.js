const AppError = require('../utils/AppError');

/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register)
 *
 * Validates req.body against the provided Zod schema.
 * On failure, returns 400 with a structured list of field errors.
 * On success, replaces req.body with the parsed (and type-coerced) data.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      status:  'fail',
      message: 'Validation failed',
      errors,
    });
  }

  req.body = result.data; // use parsed/sanitised data going forward
  next();
};

module.exports = validate;
