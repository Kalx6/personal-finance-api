import AppError from '../utils/AppError.js';

// validate(schema, 'body' | 'query' | 'params')
// Replaces the request part with the parsed (trimmed / coerced) data.
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }

  req[source] = result.data;
  next();
};

export default validate;
