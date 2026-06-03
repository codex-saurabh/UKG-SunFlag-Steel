/**
 * server/src/routes/intelligence.js
 */

const router     = require('express').Router();
const controller = require('../controllers/intelligence');
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../config/constants');

const ALL_ROLES  = [ROLES.IT_ADMIN, ROLES.HR_ADMIN, ROLES.TIME_OFFICE];
const ADMIN_HR   = [ROLES.IT_ADMIN, ROLES.HR_ADMIN];

router.use(authenticate);

// ── Alerts ────────────────────────────────────────────────────────────────────
// GET  /api/v1/intelligence/alerts
router.get('/alerts',             authorize(...ALL_ROLES), controller.getAlerts);

// GET  /api/v1/intelligence/alerts/summary
router.get('/alerts/summary',     authorize(...ALL_ROLES), controller.getAlertSummary);

// PATCH /api/v1/intelligence/alerts/:id/dismiss
router.patch('/alerts/:id/dismiss', authorize(...ADMIN_HR), controller.dismissAlert);

// ── Live headcount ────────────────────────────────────────────────────────────
// GET  /api/v1/intelligence/live-headcount
router.get('/live-headcount',     authorize(...ALL_ROLES), controller.getLiveHeadcount);

// ── Sync status ───────────────────────────────────────────────────────────────
// GET  /api/v1/intelligence/sync-status
router.get('/sync-status',        authorize(...ALL_ROLES), controller.getSyncStatus);

// ── Manual job triggers — IT Admin only ──────────────────────────────────────
// POST /api/v1/intelligence/run/consecutive-absence
router.post('/run/consecutive-absence', authorize(ROLES.IT_ADMIN), controller.triggerConsecutiveAbsenceScan);

// POST /api/v1/intelligence/run/sync-health
router.post('/run/sync-health',         authorize(ROLES.IT_ADMIN), controller.triggerSyncHealthCheck);

module.exports = router;