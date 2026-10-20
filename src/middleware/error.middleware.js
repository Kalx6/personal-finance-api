import AppError from '../utils/AppError.js';

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  }

  // Prisma unique constraint (e.g. duplicate email)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Prisma "record not found" on update/delete
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Unexpected errors: log them, hide details from the client
  if (statusCode === 500) {
    console.error(err);
    message = 'Internal server error';
    errors = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
