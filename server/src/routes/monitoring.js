/**
 * server/src/routes/monitoring.js
 */

const router = require('express').Router();
const controller = require('../controllers/monitoring');
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// System health — all roles can view
router.get('/health', controller.getSystemHealth);

// Jobs — IT Admin only
router.get('/jobs', authorize(ROLES.IT_ADMIN), controller.getJobsOverview);
router.get('/job-logs', authorize(ROLES.IT_ADMIN), controller.getJobLogs);
router.post('/jobs/trigger/:job', authorize(ROLES.IT_ADMIN), controller.triggerSync);

// Audit logs — IT Admin + HR Admin
router.get('/audit-logs', authorize(ROLES.IT_ADMIN, ROLES.HR_ADMIN), controller.getAuditLogs);

module.exports = router;
