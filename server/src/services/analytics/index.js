/**
 * server/src/services/analytics/index.js
 *
 * Public API of the analytics service.
 * Dashboard now includes alerts summary and sync freshness.
 */

const { AttendanceDaily, AttendanceMonthly } = require('../../models/Attendance');
const Employee  = require('../../models/Employee');
const { ATTENDANCE_STATUS } = require('../../config/constants');
const { getCurrentMonthYear, startOfDay, endOfDay } = require('../../utils/date');
const {
  computeTodayKPIs,
  computeMonthKPIs,
  getRecentJobRuns,
  getAlertSummaryForDashboard,
  getLastSyncTimes,
} = require('./kpis');
const { getCache, setCache } = require('./cache');

async function getDashboardKPIs() {
  const cacheKey = `dashboard_kpis_${new Date().toISOString().slice(0, 13)}`;
  const cached   = await getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const { month, year } = getCurrentMonthYear();

  const [today, currentMonth, recentJobs, alerts, syncStatus] = await Promise.all([
    computeTodayKPIs(),
    computeMonthKPIs(month, year),
    getRecentJobRuns(5),
    getAlertSummaryForDashboard(),
    getLastSyncTimes(),
  ]);

  const result = {
    today,
    currentMonth,
    recentJobs: recentJobs.map(j => ({
      name: j.jobName, status: j.status,
      startedAt: j.startedAt, durationMs: j.durationMs,
    })),
    // New fields — alerts and sync freshness
    alerts,
    syncStatus,
    generatedAt: new Date(),
    fromCache:   false,
  };

  await setCache(cacheKey, result);
  return result;
}

async function getAttendanceTrend(days = 30) {
  const cacheKey = `attendance_trend_${days}d`;
  const cached   = await getCache(cacheKey);
  if (cached) return { data: cached, fromCache: true };

  const from = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
  const to   = endOfDay(new Date());

  const rows = await AttendanceDaily.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id:       '$dateStr',
        present:   { $sum: { $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.PRESENT]    }, 1, 0] } },
        absent:    { $sum: { $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.ABSENT]     }, 1, 0] } },
        leave:     { $sum: { $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.LEAVE]      }, 1, 0] } },
        missPunch: { $sum: { $cond: [{ $eq: ['$status', ATTENDANCE_STATUS.MISS_PUNCH] }, 1, 0] } },
        ot:        { $sum: { $cond: [{ $gt:  ['$otMinutes', 0]                        }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  await setCache(cacheKey, rows, 10 * 60 * 1000);
  return { data: rows, fromCache: false };
}

async function getShiftBreakdown({ year, month } = {}) {
  const { month: m, year: y } = (year && month)
    ? { month: parseInt(month), year: parseInt(year) }
    : getCurrentMonthYear();

  return AttendanceDaily.aggregate([
    {
      $match: {
        date: { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) },
        status: ATTENDANCE_STATUS.PRESENT,
      },
    },
    {
      $group: {
        _id:     '$shift',
        count:   { $sum: 1 },
        otCount: { $sum: { $cond: [{ $gt: ['$otMinutes', 0] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function getDeptAttendanceRate({ year, month } = {}) {
  const { month: m, year: y } = (year && month)
    ? { month: parseInt(month), year: parseInt(year) }
    : getCurrentMonthYear();

  const [deptStats, headcounts] = await Promise.all([
    AttendanceMonthly.aggregate([
      { $match: { year: y, month: m } },
      { $lookup: { from: 'employees_raw', localField: 'employeeCode', foreignField: 'employeeCode', as: 'emp' } },
      { $unwind: '$emp' },
      {
        $group: {
          _id:          '$emp.department',
          totalPresent: { $sum: '$presentDays' },
          totalOt:      { $sum: '$totalOtMinutes' },
          headcount:    { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Employee.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
  ]);

  const headcountMap = Object.fromEntries(headcounts.map(d => [d._id, d.count]));
  const workingDays  = 26;

  return deptStats.map(d => {
    const hc      = headcountMap[d._id] || d.headcount;
    const maxDays = hc * workingDays;
    return {
      department:     d._id,
      headcount:      hc,
      totalPresent:   d.totalPresent,
      attendanceRate: maxDays > 0 ? Math.round((d.totalPresent / maxDays) * 100) : 0,
      totalOtHours:   Math.round(d.totalOt / 60),
    };
  });
}

module.exports = {
  getDashboardKPIs,
  getAttendanceTrend,
  getShiftBreakdown,
  getDeptAttendanceRate,
};
