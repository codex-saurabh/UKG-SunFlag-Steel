/**
 * server/src/routes/index.js
 *
 * Central route registry — mounts all feature routers under /api/v1
 */

const router = require('express').Router();

router.use('/auth',         require('./auth'));
router.use('/attendance',   require('./attendance'));
router.use('/analytics',    require('./analytics'));
router.use('/exports',      require('./exports'));
router.use('/monitoring',   require('./monitoring'));
router.use('/employees',    require('./employees'));
router.use('/intelligence', require('./intelligence'));

module.exports = router;