/**
 * server/src/scripts/diagnostics/check-exports.js
 *
 * Verifies that every module exports the functions callers expect.
 * Catches the case where a file loads fine but a function was
 * accidentally removed or renamed.
 *
 * Usage:  node src/scripts/diagnostics/check-exports.js
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// [ modulePath, [ expectedExports ] ]
const checks = [
  // Config
  ['../../config/index',           ['env', 'corsOptions', 'ROLES', 'SHIFTS', 'ATTENDANCE_STATUS', 'DEPARTMENTS', 'JOB_NAMES']],
  ['../../config/cors',            ['origin', 'credentials', 'methods']],  // object keys
  // Database
  ['../../database/connection',    ['connect', 'disconnect', 'isConnected']],
  ['../../database/indexes',       ['ensureIndexes']],
  // Logger
  ['../../logger/streams',         ['morganStream', 'stdoutStream']],
  // Middleware
  ['../../middleware/authenticate', []],   // default export (function), no named
  ['../../middleware/authorize',    []],   // default export (function), no named
  ['../../middleware/errorHandler', ['notFound', 'errorHandler']],
  ['../../middleware/index',        ['authenticate', 'authorize', 'notFound', 'errorHandler', 'asyncHandler']],
  // Utils
  ['../../utils/date',             ['toDateStr', 'startOfDay', 'endOfDay', 'startOfMonth', 'endOfMonth', 'getCurrentMonthYear', 'addMinutes', 'minutesToHHMM', 'normalizeToMidnight', 'formatUptime']],
  ['../../utils/paginate',         ['paginate', 'paginateMeta']],
  ['../../utils/response',         ['ok', 'created', 'noContent']],
  ['../../utils/index',            ['ok', 'created', 'noContent', 'paginate', 'paginateMeta', 'toDateStr', 'startOfDay', 'endOfDay', 'minutesToHHMM', 'getCurrentMonthYear']],
  // Validators
  ['../../validators/attendance.schema', ['attendanceDailyQuery', 'attendanceMonthlyQuery', 'missPunchQuery', 'overtimeQuery']],
  ['../../validators/export.schema',     ['exportMonthlyQuery', 'exportOvertimeQuery']],
  ['../../validators/index',             ['validate', 'schemas']],
  // Services — auth
  ['../../services/auth/tokens',   ['signToken', 'verifyToken', 'decodeTokenUnsafe']],
  ['../../services/auth/index',    ['login', 'verifyToken', 'getMe']],
  // Services — sync
  ['../../services/sync/hasher',   ['hashRecord', 'hasChanged']],
  ['../../services/sync/ukgClient',['fetchEmployees', 'fetchPunches', 'fetchLeaves', 'fetchShiftSchedules']],
  ['../../services/sync/index',    ['syncEmployees', 'syncAttendanceLive', 'syncLeaves', 'syncShifts']],
  // Services — attendance
  ['../../services/attendance/normalizer',   ['normalizePunches', 'deduplicatePunches']],
  ['../../services/attendance/shiftResolver',['resolveShift', 'resolveShiftBulk', 'getShiftWindow']],
  ['../../services/attendance/index',        ['getDailyAttendance', 'getTodaySummary', 'getMonthlySummary', 'getDepartmentBreakdown', 'getMissPunchList', 'getOvertimeList']],
  // Services — analytics
  ['../../services/analytics/cache', ['getCache', 'setCache', 'invalidateCache', 'invalidatePattern']],
  ['../../services/analytics/kpis',  ['computeTodayKPIs', 'computeMonthKPIs', 'getRecentJobRuns']],
  ['../../services/analytics/index', ['getDashboardKPIs', 'getAttendanceTrend', 'getShiftBreakdown', 'getDeptAttendanceRate']],
  // Services — exports
  ['../../services/exports/excel',   ['buildMonthlyAttendanceExcel', 'buildOvertimeExcel']],
  ['../../services/exports/pdf',     ['buildMonthlyAttendancePdf']],
  ['../../services/exports/index',   ['exportMonthlyAttendanceExcel', 'exportOvertimeExcel', 'exportMonthlyAttendancePdf']],
  // Services — monitoring
  ['../../services/monitoring/healthCheck',  ['runAllChecks', 'checkMongoDB', 'checkMemory', 'checkDisk', 'checkServer']],
  ['../../services/monitoring/backupRunner', ['runBackup', 'cleanOldBackups', 'listBackups']],
  ['../../services/monitoring/index',        ['getSystemHealth', 'getJobsOverview', 'getJobLogs', 'getAuditLogs', 'writeAudit', 'triggerBackup', 'runBackupCleanup', 'getBackupList']],
  // Scheduler
  ['../../scheduler/registry', []],   // array export
  ['../../scheduler/index',    ['startAll', 'stopAll', 'getStatus']],
];

let passed = 0;
let failed = 0;
const errors = [];

console.log('\n━━━━  Export Check  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const [modPath, expectedExports] of checks) {
  try {
    const mod = require(modPath);

    if (expectedExports.length === 0) {
      // Just verify it loads — no named export check
      console.log(`  ✔  ${modPath}  (load only)`);
      passed++;
      continue;
    }

    const missing = expectedExports.filter(fn => typeof mod[fn] === 'undefined');

    if (missing.length > 0) {
      console.log(`  ✖  ${modPath}`);
      console.log(`       Missing exports: ${missing.join(', ')}`);
      errors.push({ modPath, missing });
      failed++;
    } else {
      console.log(`  ✔  ${modPath}  [${expectedExports.join(', ')}]`);
      passed++;
    }
  } catch (err) {
    console.log(`  ✖  ${modPath}  → LOAD ERROR: ${err.message}`);
    errors.push({ modPath, loadError: err.message });
    failed++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Result: ${passed} passed  |  ${failed} failed`);

if (errors.length > 0) {
  console.log('\n  Fix the missing exports above before running the server.\n');
  process.exit(1);
} else {
  console.log('  All exports verified.\n');
  process.exit(0);
}