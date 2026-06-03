/**
 * server/src/routes/exports.js
 */

const router = require('express').Router();
const controller = require('../controllers/exports');
const { authenticate, authorize } = require('../middleware');
const { validate, schemas } = require('../validators');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(authorize(ROLES.IT_ADMIN, ROLES.HR_ADMIN));

// GET /api/v1/exports/monthly-attendance
router.get('/monthly-attendance', validate(schemas.exportMonthlyQuery, 'query'), controller.downloadMonthlyAttendance);

// GET /api/v1/exports/overtime
router.get('/overtime', validate(schemas.exportOvertimeQuery, 'query'), controller.downloadOvertimeReport);

module.exports = router;
