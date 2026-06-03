/**
 * server/src/controllers/analytics.js
 */

const analyticsService = require('../services/analytics');
const { asyncHandler } = require('../middleware');
const { ok } = require('../utils');

const getDashboardKPIs = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboardKPIs();
  ok(res, data);
});

const getAttendanceTrend = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const result = await analyticsService.getAttendanceTrend(parseInt(days) || 30);
  ok(res, result.data, { fromCache: result.fromCache });
});

const getShiftBreakdown = asyncHandler(async (req, res) => {
  const data = await analyticsService.getShiftBreakdown(req.query);
  ok(res, data);
});

const getDeptAttendanceRate = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDeptAttendanceRate(req.query);
  ok(res, data);
});

module.exports = { getDashboardKPIs, getAttendanceTrend, getShiftBreakdown, getDeptAttendanceRate };
