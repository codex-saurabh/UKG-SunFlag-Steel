/**
 * server/src/services/intelligence/index.js
 *
 * Public API of the intelligence service.
 * Controllers import only from here — never from sub-files directly.
 *
 * Sub-files:
 *   consecutiveAbsence.js — detects 3+ day absence runs
 *   syncStaleness.js      — monitors sync health and staleness
 *   liveHeadcount.js      — real-time shift headcount from punch data
 */

const { detectConsecutiveAbsences }  = require('./consecutiveAbsence');
const { checkSyncHealth, getSyncStatus } = require('./syncStaleness');
const { getLiveHeadcount }           = require('./liveHeadcount');
const Alert  = require('../../models/Alert');
const logger = require('../../logger');
const { ALERT_STATUS, ALERT_SEVERITY } = require('../../config/constants');

// ── Job functions — called by scheduler ──────────────────────────────────────

/**
 * runConsecutiveAbsenceScan()
 * Nightly job — scans for employees absent 3+ consecutive days.
 */
async function runConsecutiveAbsenceScan() {
  try {
    return await detectConsecutiveAbsences();
  } catch (err) {
    logger.error('[intelligence] Consecutive absence scan failed', { error: err.message });
    throw err;
  }
}

/**
 * runSyncHealthCheck()
 * Every 15 minutes — checks sync staleness and consecutive failures.
 */
async function runSyncHealthCheck() {
  try {
    return await checkSyncHealth();
  } catch (err) {
    logger.error('[intelligence] Sync health check failed', { error: err.message });
    throw err;
  }
}

// ── API functions — called by controllers ─────────────────────────────────────

/**
 * getActiveAlerts({ severity, type, page, limit, skip })
 * Returns all active alerts, newest first.
 */
async function getActiveAlerts({ severity, type, page, limit, skip } = {}) {
  const match = { status: ALERT_STATUS.ACTIVE };
  if (severity) match.severity = severity;
  if (type)     match.type     = type;

  const [alerts, total] = await Promise.all([
    Alert.find(match).sort({ severity: 1, detectedAt: -1 }).skip(skip || 0).limit(limit || 50).lean(),
    Alert.countDocuments(match),
  ]);

  return { alerts, total };
}

/**
 * getAlertSummary()
 * Returns count of active alerts by severity — used on dashboard.
 */
async function getAlertSummary() {
  const rows = await Alert.aggregate([
    { $match: { status: ALERT_STATUS.ACTIVE } },
    { $group: { _id: '$severity', count: { $sum: 1 } } },
  ]);

  const summary = { critical: 0, warning: 0, info: 0, total: 0 };
  for (const row of rows) {
    summary[row._id] = row.count;
    summary.total += row.count;
  }
  return summary;
}

/**
 * dismissAlert(alertId, userEmail)
 * Manually dismiss an alert — it will not reappear until the condition is re-detected.
 */
async function dismissAlert(alertId, userEmail) {
  const alert = await Alert.findByIdAndUpdate(
    alertId,
    {
      status:      ALERT_STATUS.DISMISSED,
      dismissedAt: new Date(),
      dismissedBy: userEmail,
    },
    { new: true }
  );

  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });
  logger.info(`[intelligence] Alert dismissed: ${alertId} by ${userEmail}`);
  return alert;
}

/**
 * getLiveHeadcountData()
 * Returns real-time shift headcount.
 */
async function getLiveHeadcountData() {
  return getLiveHeadcount();
}

/**
 * getSyncStatusData()
 * Returns current sync health for each job — used on dashboard.
 */
async function getSyncStatusData() {
  return getSyncStatus();
}

module.exports = {
  // Job runners
  runConsecutiveAbsenceScan,
  runSyncHealthCheck,
  // API
  getActiveAlerts,
  getAlertSummary,
  dismissAlert,
  getLiveHeadcountData,
  getSyncStatusData,
};