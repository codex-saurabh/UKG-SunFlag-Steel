/**
 * server/src/controllers/intelligence.js
 */

const intelligenceService = require('../services/intelligence');
const { asyncHandler }    = require('../middleware');
const { ok, paginate, paginateMeta } = require('../utils');

/**
 * GET /api/v1/intelligence/alerts
 * Active alerts list with optional filters.
 */
const getAlerts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { severity, type }    = req.query;

  const { alerts, total } = await intelligenceService.getActiveAlerts({
    severity, type, page, limit, skip,
  });

  ok(res, alerts, paginateMeta(total, page, limit));
});

/**
 * GET /api/v1/intelligence/alerts/summary
 * Count of active alerts by severity — for dashboard badge.
 */
const getAlertSummary = asyncHandler(async (req, res) => {
  const summary = await intelligenceService.getAlertSummary();
  ok(res, summary);
});

/**
 * PATCH /api/v1/intelligence/alerts/:id/dismiss
 * Dismiss a specific alert.
 */
const dismissAlert = asyncHandler(async (req, res) => {
  const alert = await intelligenceService.dismissAlert(
    req.params.id,
    req.user.email
  );
  ok(res, alert);
});

/**
 * GET /api/v1/intelligence/live-headcount
 * Real-time shift headcount.
 */
const getLiveHeadcount = asyncHandler(async (req, res) => {
  const data = await intelligenceService.getLiveHeadcountData();
  ok(res, data);
});

/**
 * GET /api/v1/intelligence/sync-status
 * Sync health for each job — last run, last success, staleness.
 */
const getSyncStatus = asyncHandler(async (req, res) => {
  const data = await intelligenceService.getSyncStatusData();
  ok(res, data);
});

/**
 * POST /api/v1/intelligence/run/consecutive-absence
 * Manually trigger the consecutive absence scan (IT Admin only).
 */
const triggerConsecutiveAbsenceScan = asyncHandler(async (req, res) => {
  // Fire and return immediately — scan runs in background
  intelligenceService.runConsecutiveAbsenceScan()
    .catch(err => require('../logger').error('[controller] Consecutive absence scan error', { error: err.message }));

  ok(res, { message: 'Consecutive absence scan started. Check alerts in a moment.' });
});

/**
 * POST /api/v1/intelligence/run/sync-health
 * Manually trigger the sync health check (IT Admin only).
 */
const triggerSyncHealthCheck = asyncHandler(async (req, res) => {
  intelligenceService.runSyncHealthCheck()
    .catch(err => require('../logger').error('[controller] Sync health check error', { error: err.message }));

  ok(res, { message: 'Sync health check started.' });
});

module.exports = {
  getAlerts,
  getAlertSummary,
  dismissAlert,
  getLiveHeadcount,
  getSyncStatus,
  triggerConsecutiveAbsenceScan,
  triggerSyncHealthCheck,
};