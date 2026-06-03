/**
 * server/src/controllers/attendance.js
 */

const attendanceService = require('../services/attendance');
const { asyncHandler } = require('../middleware');
const { ok, paginate, paginateMeta } = require('../utils');

const getDaily = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { records, total } = await attendanceService.getDailyAttendance({ ...req.query, page, limit, skip });
  ok(res, records, paginateMeta(total, page, limit));
});

const getTodaySummary = asyncHandler(async (req, res) => {
  const data = await attendanceService.getTodaySummary();
  ok(res, data);
});

const getMonthly = asyncHandler(async (req, res) => {
  const records = await attendanceService.getMonthlySummary(req.query);
  ok(res, records);
});

const getDepartmentBreakdown = asyncHandler(async (req, res) => {
  const data = await attendanceService.getDepartmentBreakdown(req.query);
  ok(res, data);
});

const getMissPunch = asyncHandler(async (req, res) => {
  const records = await attendanceService.getMissPunchList(req.query);
  ok(res, records);
});

const getOvertime = asyncHandler(async (req, res) => {
  const records = await attendanceService.getOvertimeList(req.query);
  ok(res, records);
});

module.exports = { getDaily, getTodaySummary, getMonthly, getDepartmentBreakdown, getMissPunch, getOvertime };
