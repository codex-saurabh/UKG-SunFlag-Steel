/**
 * server/src/routes/analytics.js
 */

const router = require('express').Router();
const controller = require('../controllers/analytics');
const { authenticate, authorize } = require('../middleware');
const { validate, schemas } = require('../validators');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(authorize(ROLES.IT_ADMIN, ROLES.HR_ADMIN));

// GET /api/v1/analytics/dashboard
router.get('/dashboard', controller.getDashboardKPIs);

// GET /api/v1/analytics/trend
router.get('/trend', validate(schemas.trendQuery, 'query'), controller.getAttendanceTrend);

// GET /api/v1/analytics/shift-breakdown
router.get('/shift-breakdown', validate(schemas.shiftBreakdownQuery, 'query'), controller.getShiftBreakdown);

// GET /api/v1/analytics/dept-rate
router.get('/dept-rate', validate(schemas.shiftBreakdownQuery, 'query'), controller.getDeptAttendanceRate);

module.exports = router;
