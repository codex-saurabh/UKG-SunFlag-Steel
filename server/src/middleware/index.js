/**
 * server/src/middleware/index.js
 *
 * Barrel re-export — import all middleware from one place.
 *
 * Usage:
 *   const { authenticate, authorize, errorHandler, notFound, asyncHandler } = require('../middleware');
 */

const authenticate            = require('./authenticate');
const authorize               = require('./authorize');
const { notFound, errorHandler } = require('./errorHandler');

/**
 * asyncHandler — wraps async route handlers so rejected promises
 * are forwarded to next(err) automatically.
 * Eliminates try/catch boilerplate in every controller.
 *
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  authenticate,
  authorize,
  notFound,
  errorHandler,
  asyncHandler,
};
 

//const authService = require('../services/auth');
// const { ROLES } = require('../config/constants');
// const logger = require('../logger');

// // ─── Async handler wrapper — eliminates try/catch boilerplate in controllers
// const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// // ─── JWT authentication
// const authenticate = asyncHandler(async (req, res, next) => {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith('Bearer ')) {
//     return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } });
//   }
//   const token = header.slice(7);
//   req.user = authService.verifyToken(token);
//   next();
// });

// // ─── Role-based authorization — pass one or more allowed roles
// const authorize = (...roles) => (req, res, next) => {
//   if (!req.user) return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Not authenticated' } });
//   if (!roles.includes(req.user.role)) {
//     logger.warn('Unauthorized access attempt', { user: req.user.email, role: req.user.role, required: roles, path: req.path });
//     return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission for this resource' } });
//   }
//   next();
// };

// // ─── Global error handler — must be last middleware
// // eslint-disable-next-line no-unused-vars
// const errorHandler = (err, req, res, next) => {
//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Internal server error';

//   if (statusCode >= 500) {
//     logger.error('Unhandled error', {
//       message: err.message,
//       stack: err.stack,
//       path: req.path,
//       method: req.method,
//       user: req.user?.email,
//     });
//   }

//   res.status(statusCode).json({
//     success: false,
//     error: {
//       code: err.code || (statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'),
//       message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 'Internal server error' : message,
//     },
//   });
// };

// // ─── Not found handler
// const notFound = (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
//   });
// };

// // ─── Request logger (attaches to morgan stream)
// const morganStream = {
//   write: (message) => logger.info(message.trim()),
// };

// module.exports = { authenticate, authorize, errorHandler, notFound, asyncHandler, morganStream, ROLES };