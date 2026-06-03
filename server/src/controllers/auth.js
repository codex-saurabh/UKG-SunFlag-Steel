/**
 * server/src/controllers/auth.js
 */

const authService = require('../services/auth');
const { asyncHandler } = require('../middleware');
const { ok } = require('../utils');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  ok(res, result);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ok(res, user);
});

module.exports = { login, getMe };
