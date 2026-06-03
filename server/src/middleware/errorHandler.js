/**
 * server/src/middleware/errorHandler.js
 *
 * Global error handling middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * Two exports:
 *   notFound     — catches unmatched routes → 404
 *   errorHandler — catches all errors thrown or passed to next(err)
 */

const logger = require('../logger');
const env    = require('../config/env');

/**
 * notFound — must be registered after all routes.
 * Converts unmatched requests into structured 404 errors.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

/**
 * errorHandler — Express 4-argument error middleware.
 * Handles:
 *   - Mongoose validation errors (400)
 *   - Mongoose duplicate key errors (409)
 *   - JWT errors (401)
 *   - Custom errors with .statusCode property
 *   - Everything else (500)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code       = err.code       || 'SERVER_ERROR';
  let message    = err.message    || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code       = 'VALIDATION_ERROR';
    message    = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code       = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message    = `Duplicate value for ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; code = 'INVALID_TOKEN'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; code = 'TOKEN_EXPIRED'; }

  // Log server errors with full stack
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message:    err.message,
      stack:      err.stack,
      path:       req.originalUrl,
      method:     req.method,
      user:       req.user?.email || 'unauthenticated',
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      // In production, hide internal details on 5xx
      message: env.isProd && statusCode >= 500 ? 'Internal server error' : message,
      // Include validation errors array if present
      ...(err.errors && { errors: err.errors }),
    },
  });
};

module.exports = { notFound, errorHandler };
