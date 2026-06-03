/**
 * server/src/controllers/exports.js
 */

const path = require('path');
const exportsService = require('../services/exports');
const monitoringService = require('../services/monitoring');
const { asyncHandler } = require('../middleware');

const downloadMonthlyAttendance = asyncHandler(async (req, res) => {
  const { filepath, filename } = await exportsService.exportMonthlyAttendanceExcel(req.query);

  await monitoringService.writeAudit({
    userId:   req.user.id,
    userName: req.user.name,
    role:     req.user.role,
    action:   'export.monthly_attendance',
    meta:     { filename, filters: req.query },
    ip:       req.ip,
  });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.sendFile(filepath);
});

const downloadOvertimeReport = asyncHandler(async (req, res) => {
  const { filepath, filename } = await exportsService.exportOvertimeExcel(req.query);

  await monitoringService.writeAudit({
    userId:   req.user.id,
    userName: req.user.name,
    role:     req.user.role,
    action:   'export.overtime',
    meta:     { filename, filters: req.query },
    ip:       req.ip,
  });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.sendFile(filepath);
});

module.exports = { downloadMonthlyAttendance, downloadOvertimeReport };
