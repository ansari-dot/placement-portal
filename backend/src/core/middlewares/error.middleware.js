import logger from '../utils/logger.js';
import { AppError } from '../errors/AppError.js';

/**
 * Centralized Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  // 1. Zod Validation Errors
  if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    const issues = err.issues || err.errors || [];
    const message = issues.map((i) => `${i.path?.join('.') || 'field'}: ${i.message}`).join(', ') || 'Validation error';
    return res.status(400).json({
      success: false,
      message,
      errors: issues,
    });
  }

  // 2. Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      message: message || 'Invalid data provided',
    });
  }

  // 3. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier: ${err.value}`,
    });
  }

  // 4. MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate entry: A record with this ${field} already exists.`,
    });
  }

  // 5. Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 6. Generic application errors
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error. Please try again later.'
    : err.message || 'An unexpected error occurred';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
