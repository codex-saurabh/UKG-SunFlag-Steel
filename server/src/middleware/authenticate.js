/**
 * server/src/middleware/authenticate.js
 *
 * Verifies the Bearer JWT on every protected route.
 * Attaches decoded payload to req.user.
 */

const authService = require('../services/auth');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authentication required' },
    });
  }

  try {
    const token = header.slice(7);
    req.user = authService.verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: err.message || 'Token invalid or expired' },
    });
  }
};

module.exports = authenticate;
