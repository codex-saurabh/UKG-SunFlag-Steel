/**
 * server/src/services/intelligence/syncStaleness.js
 *
 * Sync health monitoring — two distinct checks:
 *
 * 1. Staleness check:
 *    The last SUCCESSFUL sync run was more than SYNC_STALE_THRESHOLD_MINUTES ago.
 *    This means the dashboard is showing outdated attendance data.
 *    Users need to know this — they should not trust "current" data that is 2 hours old.
 *
 * 2. Consecutive failure check:
 *    The last N job runs for a sync job all have status 'failed'.
 *    The UKG connection may be broken. IT Admin needs to investigate.
 *
 * Both checks run every 15 minutes via the scheduler.
 */

const { JobLog } = require('../../models/index');
const Alert  = require('../../models/Alert');
const logger = require('../../logger');
const {
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_STATUS,
  SYNC_STALE_THRESHOLD_MINUTES,
  SYNC_FAILURE_THRESHOLD,
} = require('../../config/constants');

// Only check the live sync job for staleness — others are less time-critical
const LIVE_SYNC_JOB = 'attendance_live_sync';
const ALL_SYNC_JOBS = ['attendance_live_sync', 'leave_sync', 'shift_sync', 'employee_sync'];

/**
 * checkSyncHealth()
 * Main entry point — runs both staleness and failure checks.
 * Returns summary of alerts created/resolved.
 */
async function checkSyncHealth() {
  const [stalenessResult, failureResult] = await Promise.all([
    checkStaleness(),
    checkConsecutiveFailures(),
  ]);

  return {
    staleness: stalenessResult,
    failures:  failureResult,
  };
}

/**
 * checkStaleness()
 * Checks if attendance_live_sync last succeeded within the threshold window.
 */
async function checkStaleness() {
  const lastSuccess = await JobLog.findOne({
    jobName: LIVE_SYNC_JOB,
    status:  'success',
  }).sort({ startedAt: -1 }).lean();

  const lastSkipped = await JobLog.findOne({
    jobName: LIVE_SYNC_JOB,
    status:  'skipped',
  }).sort({ startedAt: -1 }).lean();

  // When UKG API is not available, jobs run as 'skipped' — that is expected,
  // treat most recent skipped as equivalent to success for staleness purposes
  const lastHealthy = [lastSuccess, lastSkipped]
    .filter(Boolean)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

  const existingAlert = await Alert.findOne({
    type:   ALERT_TYPE.SYNC_STALE,
    status: ALERT_STATUS.ACTIVE,
  });

  if (!lastHealthy) {
    // Never run successfully — create critical alert
    await upsertAlert(existingAlert, {
      type:     ALERT_TYPE.SYNC_STALE,
      severity: ALERT_SEVERITY.CRITICAL,
      title:    'Attendance sync has never completed successfully',
      message:  'The attendance live sync job has no successful run on record. Data may be missing.',
      meta:     { jobName: LIVE_SYNC_JOB, lastSuccessAt: null, staleMinutes: null },
    });
    return { stale: true, staleMinutes: null };
  }

  const staleMinutes = Math.round((Date.now() - new Date(lastHealthy.startedAt).getTime()) / 60000);
  const isStale = staleMinutes > SYNC_STALE_THRESHOLD_MINUTES;

  if (isStale) {
    await upsertAlert(existingAlert, {
      type:     ALERT_TYPE.SYNC_STALE,
      severity: staleMinutes > 120 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
      title:    `Attendance data is ${staleMinutes} minutes old`,
      message:  `Last successful sync was at ${new Date(lastHealthy.startedAt).toLocaleTimeString('en-IN')}. Data shown may not reflect current attendance.`,
      meta:     { jobName: LIVE_SYNC_JOB, lastSuccessAt: lastHealthy.startedAt, staleMinutes },
    });
    return { stale: true, staleMinutes };
  }

  // Data is fresh — resolve any existing staleness alert
  if (existingAlert) {
    await Alert.findByIdAndUpdate(existingAlert._id, {
      status: ALERT_STATUS.RESOLVED, resolvedAt: new Date(),
    });
  }
  return { stale: false, staleMinutes };
}

/**
 * checkConsecutiveFailures()
 * For each sync job, checks if the last N runs all failed.
 */
async function checkConsecutiveFailures() {
  const results = [];

  for (const jobName of ALL_SYNC_JOBS) {
    const recentRuns = await JobLog.find({ jobName })
      .sort({ startedAt: -1 })
      .limit(SYNC_FAILURE_THRESHOLD)
      .lean();

    // Need at least THRESHOLD runs to evaluate
    if (recentRuns.length < SYNC_FAILURE_THRESHOLD) continue;

    // Skip jobs that are intentionally skipped (UKG not available)
    const nonSkipped = recentRuns.filter(r => r.status !== 'skipped');
    if (nonSkipped.length < SYNC_FAILURE_THRESHOLD) continue;

    const lastN = nonSkipped.slice(0, SYNC_FAILURE_THRESHOLD);
    const allFailed = lastN.every(r => r.status === 'failed');

    const existingAlert = await Alert.findOne({
      type: ALERT_TYPE.SYNC_FAILURE,
      'meta.jobName': jobName,
      status: ALERT_STATUS.ACTIVE,
    });

    if (allFailed) {
      const lastError = lastN[0]?.error || 'Unknown error';
      await upsertAlert(existingAlert, {
        type:     ALERT_TYPE.SYNC_FAILURE,
        severity: ALERT_SEVERITY.CRITICAL,
        title:    `${jobName} failing consecutively`,
        message:  `${jobName} has failed ${SYNC_FAILURE_THRESHOLD} times in a row. Last error: ${lastError}`,
        meta:     { jobName, consecutiveFailures: SYNC_FAILURE_THRESHOLD, lastError, lastRunAt: lastN[0]?.startedAt },
      });
      logger.error(`[intelligence] Sync failure alert: ${jobName} — ${SYNC_FAILURE_THRESHOLD} consecutive failures`);
      results.push({ jobName, failing: true });
    } else if (existingAlert) {
      await Alert.findByIdAndUpdate(existingAlert._id, {
        status: ALERT_STATUS.RESOLVED, resolvedAt: new Date(),
      });
      results.push({ jobName, failing: false });
    }
  }

  return results;
}

/**
 * getSyncStatus()
 * Returns current sync health for the dashboard API.
 * Does NOT create/modify alerts — read-only.
 */
async function getSyncStatus() {
  const jobs = ['attendance_live_sync', 'leave_sync', 'shift_sync', 'employee_sync'];

  const results = await Promise.all(
    jobs.map(async (jobName) => {
      const last = await JobLog.findOne({ jobName })
        .sort({ startedAt: -1 })
        .lean();

      const lastSuccess = await JobLog.findOne({ jobName, status: { $in: ['success', 'skipped'] } })
        .sort({ startedAt: -1 })
        .lean();

      const staleMinutes = lastSuccess
        ? Math.round((Date.now() - new Date(lastSuccess.startedAt).getTime()) / 60000)
        : null;

      return {
        jobName,
        lastStatus:    last?.status    || 'never_run',
        lastRunAt:     last?.startedAt || null,
        lastSuccessAt: lastSuccess?.startedAt || null,
        staleMinutes,
        isStale:       staleMinutes !== null && staleMinutes > SYNC_STALE_THRESHOLD_MINUTES,
      };
    })
  );

  return results;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function upsertAlert(existing, data) {
  if (existing) {
    await Alert.findByIdAndUpdate(existing._id, {
      ...data,
      detectedAt: existing.detectedAt,
    });
  } else {
    await Alert.create({ ...data, detectedAt: new Date() });
  }
}

module.exports = { checkSyncHealth, getSyncStatus };