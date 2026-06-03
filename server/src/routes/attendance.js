/**
 * server/src/routes/attendance.js
 */

const router = require('express').Router();
const controller = require('../controllers/attendance');
const { authenticate, authorize } = require('../middleware');
const { validate, schemas } = require('../validators');
const { ROLES } = require('../config/constants');

const ALL_ROLES = [ROLES.IT_ADMIN, ROLES.HR_ADMIN, ROLES.TIME_OFFICE];

// All attendance routes require auth
router.use(authenticate);

// GET /api/v1/attendance/today
router.get('/today', authorize(...ALL_ROLES), controller.getTodaySummary);

// GET /api/v1/attendance/daily
router.get('/daily', authorize(...ALL_ROLES), validate(schemas.attendanceDailyQuery, 'query'), controller.getDaily);

// GET /api/v1/attendance/monthly
router.get('/monthly', authorize(...ALL_ROLES), validate(schemas.attendanceMonthlyQuery, 'query'), controller.getMonthly);

// GET /api/v1/attendance/department-breakdown
router.get('/department-breakdown', authorize(...ALL_ROLES), controller.getDepartmentBreakdown);

// GET /api/v1/attendance/miss-punch
router.get('/miss-punch', authorize(...ALL_ROLES), validate(schemas.missPunchQuery, 'query'), controller.getMissPunch);

// GET /api/v1/attendance/overtime
router.get('/overtime', authorize(ROLES.IT_ADMIN, ROLES.HR_ADMIN), validate(schemas.overtimeQuery, 'query'), controller.getOvertime);

module.exports = router;
