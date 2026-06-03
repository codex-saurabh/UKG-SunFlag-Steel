/**
 * server/src/scheduler/registry.js
 *
 * Job registry — defines every scheduled job in one place.
 * The runner (scheduler/index.js) reads this registry and starts the crons.
 */

const syncService        = require('../services/sync');
const intelligenceService = require('../services/intelligence');

const JOB_REGISTRY = [
  // ── UKG sync jobs ──────────────────────────────────────────────────────────
  {
    name:       'attendance_live_sync',
    expression: '*/5 * * * *',   // every 5 minutes
    fn:         syncService.syncAttendanceLive,
    enabled:    true,
    runOnStart: false,
  },
  {
    name:       'leave_sync',
    expression: '*/30 * * * *',  // every 30 minutes
    fn:         syncService.syncLeaves,
    enabled:    true,
    runOnStart: false,
  },
  {
    name:       'shift_sync',
    expression: '0 * * * *',     // top of every hour
    fn:         syncService.syncShifts,
    enabled:    true,
    runOnStart: false,
  },
  {
    name:       'employee_sync',
    expression: '0 1 * * *',     // daily at 01:00
    fn:         syncService.syncEmployees,
    enabled:    true,
    runOnStart: false,
  },

  // ── Intelligence jobs ──────────────────────────────────────────────────────
  {
    name:       'consecutive_absence_scan',
    expression: '0 2 * * *',     // nightly at 02:00 — after reconciliation
    fn:         intelligenceService.runConsecutiveAbsenceScan,
    enabled:    true,
    runOnStart: false,
  },
  {
    name:       'sync_health_check',
    expression: '*/15 * * * *',  // every 15 minutes
    fn:         intelligenceService.runSyncHealthCheck,
    enabled:    true,
    runOnStart: true,            // run immediately on server start to catch stale state
  },
];

module.exports = JOB_REGISTRY;