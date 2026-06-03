const ROLES = {
  IT_ADMIN: 'IT_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  TIME_OFFICE: 'TIME_OFFICE',
};

const SHIFTS = {
  A: { code: 'A', label: 'Shift A', startHour: 6,  endHour: 14, crossDate: false },
  B: { code: 'B', label: 'Shift B', startHour: 14, endHour: 22, crossDate: false },
  C: { code: 'C', label: 'Shift C', startHour: 22, endHour: 6,  crossDate: true  },
  G: { code: 'G', label: 'General', startHour: 9,  endHour: 18, crossDate: false },
};

const ATTENDANCE_STATUS = {
  PRESENT:     'Present',
  ABSENT:      'Absent',
  LEAVE:       'Leave',
  HALF_DAY:    'Half Day',
  WEEKLY_OFF:  'Weekly Off',
  HOLIDAY:     'Holiday',
  MISS_PUNCH:  'Miss Punch',
  OD:          'OD',
  SHORT_LEAVE: 'Short Leave',
};

const LEAVE_TYPES = {
  CL:  'Casual Leave',
  SL:  'Sick Leave',
  EL:  'Earned Leave',
  ML:  'Medical Leave',
  LWP: 'Leave Without Pay',
  PL:  'Privilege Leave',
  COF: 'Comp Off',
};

const DEPARTMENTS = [
  'Blast Furnace',
  'Steel Melting Shop',
  'Rolling Mill',
  'Power Plant',
  'Maintenance',
  'Quality Control',
  'Safety',
  'HR & Admin',
  'IT',
  'Finance',
];

const DESIGNATIONS = [
  'Plant Operator',
  'Senior Operator',
  'Shift Supervisor',
  'Assistant Manager',
  'Manager',
  'Deputy Manager',
  'General Manager',
  'Engineer',
  'Senior Engineer',
  'Technician',
  'Helper',
  'Clerk',
];

// Overtime kicks in after minimum 4 hours beyond shift
const OT_MIN_HOURS = 4;

// Job names — used in job_logs collection
const JOB_NAMES = {
  ATTENDANCE_LIVE_SYNC:        'attendance_live_sync',
  LEAVE_SYNC:                  'leave_sync',
  SHIFT_SYNC:                  'shift_sync',
  EMPLOYEE_SYNC:               'employee_sync',
  ATTENDANCE_RECONCILIATION:   'attendance_reconciliation',
  DAILY_SUMMARY_BUILD:         'daily_summary_build',
  MONTHLY_SUMMARY_BUILD:       'monthly_summary_build',
  DASHBOARD_CACHE_REFRESH:     'dashboard_cache_refresh',
  BACKUP:                      'backup',
  CLEANUP:                     'cleanup',
};

const JOB_STATUS = {
  RUNNING:   'running',
  SUCCESS:   'success',
  FAILED:    'failed',
  SKIPPED:   'skipped',
};

const SYNC_SOURCE = {
  UKG_API:   'ukg_api',
  SEED:      'seed',
  MANUAL:    'manual',
};

// ─── Alert types ──────────────────────────────────────────────────────────────
const ALERT_TYPE = {
  CONSECUTIVE_ABSENCE:  'consecutive_absence',
  SYNC_STALE:           'sync_stale',
  SYNC_FAILURE:         'sync_failure',
  LOW_ATTENDANCE:       'low_attendance',
  HEADCOUNT_SHORTFALL:  'headcount_shortfall',
};

const ALERT_SEVERITY = {
  INFO:     'info',
  WARNING:  'warning',
  CRITICAL: 'critical',
};

const ALERT_STATUS = {
  ACTIVE:     'active',
  RESOLVED:   'resolved',
  DISMISSED:  'dismissed',
};

// Consecutive absence threshold — flag after this many days in a row
const CONSECUTIVE_ABSENCE_THRESHOLD = 3;

// Sync staleness threshold — warn after this many minutes with no successful sync
const SYNC_STALE_THRESHOLD_MINUTES = 30;

// Sync failure threshold — alert after this many consecutive failures
const SYNC_FAILURE_THRESHOLD = 3;

module.exports = {
  ROLES,
  SHIFTS,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  DEPARTMENTS,
  DESIGNATIONS,
  OT_MIN_HOURS,
  JOB_NAMES,
  JOB_STATUS,
  SYNC_SOURCE,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_STATUS,
  CONSECUTIVE_ABSENCE_THRESHOLD,
  SYNC_STALE_THRESHOLD_MINUTES,
  SYNC_FAILURE_THRESHOLD
};
