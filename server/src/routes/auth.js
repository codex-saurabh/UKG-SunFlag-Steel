/**
 * server/src/routes/auth.js
 */

const router = require('express').Router();
const controller = require('../controllers/auth');
const { authenticate } = require('../middleware');
const { validate, schemas } = require('../validators');

// POST /api/v1/auth/login
router.post('/login', validate(schemas.loginSchema), controller.login);

// GET /api/v1/auth/me  — requires valid JWT
router.get('/me', authenticate, controller.getMe);

module.exports = router;
