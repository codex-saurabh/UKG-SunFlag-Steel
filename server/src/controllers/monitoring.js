/**
 * server/src/controllers/monitoring.js
 */

const monitoringService = require('../services/monitoring');
const syncService = require('../services/sync');
const { asyncHandler } = require('../middleware');
const { ok, paginate, paginateMeta } = require('../utils');

const getSystemHealth = asyncHandler(async (req, res) => {
  const data = await monitoringService.getSystemHealth();
  ok(res, data);
});

const getJobsOverview = asyncHandler(async (req, res) => {
  const data = await monitoringService.getJobsOverview();
  ok(res, data);
});

const getJobLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { logs, total } = await monitoringService.getJobLogs({ ...req.query, page, limit, skip });
  ok(res, logs, paginateMeta(total, page, limit));
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { logs, total } = await monitoringService.getAuditLogs({ ...req.query, page, limit, skip });
  ok(res, logs, paginateMeta(total, page, limit));
});

// Manual job triggers — IT Admin only
const triggerSync = asyncHandler(async (req, res) => {
  const { job } = req.params;
  const jobMap = {
    'attendance-live': syncService.syncAttendanceLive,
    'employees':       syncService.syncEmployees,
    'leaves':          syncService.syncLeaves,
    'shifts':          syncService.syncShifts,
  };

  if (!jobMap[job]) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_JOB', message: `Unknown job: ${job}` } });
  }

  // Fire and forget — don't await; return immediately so the UI isn't blocked
  jobMap[job]().catch(err => console.error(`Manual job ${job} failed:`, err.message));

  ok(res, { message: `Job "${job}" triggered. Check job logs for status.` });
});

module.exports = { getSystemHealth, getJobsOverview, getJobLogs, getAuditLogs, triggerSync };
