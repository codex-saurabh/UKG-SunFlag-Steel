/**
 * server/src/services/analytics/kpis.js
 *
 * Dashboard KPI computation.
 * Now includes alert summary and sync status on the dashboard response.
 */

const { AttendanceDaily, AttendanceMonthly } = require('../../models/Attendance');
const Employee = require('../../models/Employee');
const { JobLog } = require('../../models/index');
const Alert = require('../../models/Alert');
const { ATTENDANCE_STATUS, ALERT_STATUS } = require('../../config/constants');
const { getCurrentMonthYear, startOfDay, endOfDay } = require('../../utils/date');

async function computeTodayKPIs() {
  const today    = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [statusCounts, totalActive] = await Promise.all([
    AttendanceDaily.aggregate([
      { $match: { date: { $gte: today, $lte: todayEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Employee.countDocuments({ status: 'Active' }),
  ]);

  const map = {};
  for (const row of statusCounts) map[row._id] = row.count;

  return {
    totalActive,
    present:   map[ATTENDANCE_STATUS.PRESENT]    || 0,
    absent:    map[ATTENDANCE_STATUS.ABSENT]      || 0,
    onLeave:   map[ATTENDANCE_STATUS.LEAVE]       || 0,
    halfDay:   map[ATTENDANCE_STATUS.HALF_DAY]    || 0,
    missPunch: map[ATTENDANCE_STATUS.MISS_PUNCH]  || 0,
    weeklyOff: map[ATTENDANCE_STATUS.WEEKLY_OFF]  || 0,
    holiday:   map[ATTENDANCE_STATUS.HOLIDAY]     || 0,
    od:        map[ATTENDANCE_STATUS.OD]          || 0,
  };
}

async function computeMonthKPIs(month, year) {
  const result = await AttendanceMonthly.aggregate([
    { $match: { month, year } },
    {
      $group: {
        _id:              null,
        totalPresent:     { $sum: '$presentDays' },
        totalAbsent:      { $sum: '$absentDays' },
        totalLeave:       { $sum: '$leaveDays' },
        totalOtMinutes:   { $sum: '$totalOtMinutes' },
        totalWorkMinutes: { $sum: '$totalWorkMinutes' },
        totalMissPunch:   { $sum: '$missPunchDays' },
        employeeCount:    { $sum: 1 },
      },
    },
  ]);

  const data        = result[0] || {};
  const totalActive = await Employee.countDocuments({ status: 'Active' });
  const workingDays = 26;
  const maxPossible = totalActive * workingDays;

  return {
    month,
    year,
    totalPresent:     data.totalPresent     || 0,
    totalAbsent:      data.totalAbsent      || 0,
    totalLeave:       data.totalLeave       || 0,
    totalMissPunch:   data.totalMissPunch   || 0,
    totalOtMinutes:   data.totalOtMinutes   || 0,
    totalWorkMinutes: data.totalWorkMinutes || 0,
    attendanceRate:   maxPossible > 0
      ? Math.round(((data.totalPresent || 0) / maxPossible) * 100)
      : 0,
  };
}

async function getRecentJobRuns(limit = 5) {
  return JobLog.find({})
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('jobName status startedAt durationMs error')
    .lean();
}

/**
 * getAlertSummaryForDashboard()
 * Returns count of active alerts by severity for the dashboard header.
 * New: added to dashboard so frontend always knows alert state.
 */
async function getAlertSummaryForDashboard() {
  const rows = await Alert.aggregate([
    { $match: { status: ALERT_STATUS.ACTIVE } },
    { $group: { _id: '$severity', count: { $sum: 1 } } },
  ]);

  const summary = { critical: 0, warning: 0, info: 0, total: 0 };
  for (const row of rows) {
    summary[row._id] = row.count;
    summary.total   += row.count;
  }
  return summary;
}

/**
 * getLastSyncTimes()
 * Returns last successful (or skipped) run time for each sync job.
 * Surfaces sync freshness on the dashboard.
 */
async function getLastSyncTimes() {
  const jobs = ['attendance_live_sync', 'leave_sync', 'shift_sync', 'employee_sync'];

  const results = await Promise.all(
    jobs.map(async (jobName) => {
      const last = await JobLog.findOne({
        jobName,
        status: { $in: ['success', 'skipped'] },
      }).sort({ startedAt: -1 }).lean();

      const staleMinutes = last
        ? Math.round((Date.now() - new Date(last.startedAt).getTime()) / 60000)
        : null;

      return {
        jobName,
        lastSuccessAt: last?.startedAt || null,
        staleMinutes,
        isStale:       staleMinutes !== null && staleMinutes > 30,
      };
    })
  );

  return results;
}

module.exports = {
  computeTodayKPIs,
  computeMonthKPIs,
  getRecentJobRuns,
  getAlertSummaryForDashboard,
  getLastSyncTimes,
};