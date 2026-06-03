/**
 * server/src/services/auth/tokens.js
 *
 * JWT token creation and verification.
 * Separated from auth/index.js so token logic can be tested
 * and reused independently of the database layer.
 */

const jwt = require('jsonwebtoken');
const env  = require('../../config/env');

/**
 * signToken(payload)
 * Creates a signed JWT for a user session.
 * payload should include: { id, email, role, name }
 */
function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer:    'hr-analytics',
    audience:  'hr-analytics-client',
  });
}

/**
 * verifyToken(token)
 * Verifies and decodes a JWT.
 * Throws with statusCode 401 on invalid or expired tokens.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer:   'hr-analytics',
      audience: 'hr-analytics-client',
    });
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Session expired — please login again'
      : err.name === 'JsonWebTokenError' ? 'Invalid token'
      : 'Token verification failed';

    throw Object.assign(new Error(message), { statusCode: 401, code: 'INVALID_TOKEN' });
  }
}

/**
 * decodeTokenUnsafe(token)
 * Decodes WITHOUT verifying signature — used only for logging/debugging.
 * Never use this for access control.
 */
function decodeTokenUnsafe(token) {
  return jwt.decode(token);
}

module.exports = { signToken, verifyToken, decodeTokenUnsafe };