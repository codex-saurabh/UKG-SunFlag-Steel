/**
 * server/src/services/auth/index.js
 *
 * Public API of the auth service.
 * Uses tokens.js for JWT operations.
 * Controllers and middleware import from here.
 */

const bcrypt = require('bcryptjs');
const { User } = require('../../models/index');
const { signToken, verifyToken } = require('./tokens');
const logger = require('../../logger');

/**
 * login(email, password)
 * Validates credentials, updates lastLoginAt, returns { token, user }.
 */
async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');

  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  // Update last login timestamp (non-blocking)
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

  const payload = {
    id:    user._id.toString(),
    email: user.email,
    role:  user.role,
    name:  user.name,
  };

  const token = signToken(payload);
  logger.info('User login success', { email: user.email, role: user.role });

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
}

/**
 * verifyToken(token) — re-exported from tokens.js
 * Used by the authenticate middleware.
 */
module.exports.verifyToken = verifyToken;

/**
 * getMe(userId)
 * Returns the full user document (minus password) for the /auth/me endpoint.
 */
async function getMe(userId) {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}

module.exports = { login, verifyToken, getMe };