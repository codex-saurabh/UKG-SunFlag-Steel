/**
 * server/src/middleware/authorize.js
 *
 * Role-based access control middleware.
 * Usage: router.get('/route', authenticate, authorize('IT_ADMIN', 'HR_ADMIN'), controller)
 *
 * Must be used AFTER authenticate so req.user is populated.
 */

const logger = require('../logger');

/**
 * authorize(...roles) — returns middleware that allows only the specified roles.
 * Pass one or more role strings.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' },
    });
  }

  if (!roles.includes(req.user.role)) {
    logger.warn('Unauthorized access attempt', {
      user:     req.user.email,
      role:     req.user.role,
      required: roles,
      path:     req.originalUrl,
      method:   req.method,
    });

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' },
    });
  }

  next();
};

module.exports = authorize;
