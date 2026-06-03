/**
 * server/src/services/exports/index.js
 *
 * Public API of the exports service.
 * Fetches data then delegates to excel.js or pdf.js for file generation.
 * Controllers import only from here.
 */

const fs   = require('fs');
const path = require('path');
const env  = require('../../config/env');
const logger = require('../../logger');
const attendanceService = require('../attendance');
const { buildMonthlyAttendanceExcel, buildOvertimeExcel } = require('./excel');
const { buildMonthlyAttendancePdf }  = require('./pdf');

// Ensure all output directories exist at module load time
const DIRS = ['attendance', 'overtime', 'temp'].map(d => path.resolve(env.EXPORT_DIR, d));
for (const dir of DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Monthly Attendance Excel ──────────────────────────────────────────────
async function exportMonthlyAttendanceExcel({ year, month, department }) {
  const records = await attendanceService.getMonthlySummary({ year, month, department });

  if (!records.length) {
    throw Object.assign(
      new Error('No data found for the selected filters'),
      { statusCode: 404 }
    );
  }

  const result = await buildMonthlyAttendanceExcel(records, { month: parseInt(month), year: parseInt(year), department });
  logger.info(`[exports] Monthly attendance Excel: ${result.filename} (${records.length} records)`);
  return result;
}

// ─── Overtime Excel ────────────────────────────────────────────────────────
async function exportOvertimeExcel({ dateFrom, dateTo, minOtMinutes = 60 }) {
  const records = await attendanceService.getOvertimeList({ dateFrom, dateTo, minOtMinutes });

  if (!records.length) {
    throw Object.assign(
      new Error('No overtime records found for the selected date range'),
      { statusCode: 404 }
    );
  }

  const result = await buildOvertimeExcel(records, { dateFrom, dateTo });
  logger.info(`[exports] Overtime Excel: ${result.filename} (${records.length} records)`);
  return result;
}

// ─── Monthly Attendance PDF ────────────────────────────────────────────────
async function exportMonthlyAttendancePdf({ year, month, department }) {
  const records = await attendanceService.getMonthlySummary({ year, month, department });

  if (!records.length) {
    throw Object.assign(
      new Error('No data found for the selected filters'),
      { statusCode: 404 }
    );
  }

  const result = await buildMonthlyAttendancePdf(records, { month: parseInt(month), year: parseInt(year), department });
  logger.info(`[exports] Monthly attendance PDF: ${result.filename} (${records.length} records)`);
  return result;
}

module.exports = {
  exportMonthlyAttendanceExcel,
  exportOvertimeExcel,
  exportMonthlyAttendancePdf,
};

// /**
//  * server/src/services/exports/index.js
//  */

// const ExcelJS = require('exceljs');
// const path = require('path');
// const fs = require('fs');
// const env = require('../../config/env');
// const logger = require('../../logger');
// const attendanceService = require('../attendance');
// const { minutesToHHMM, toDateStr, getCurrentMonthYear } = require('../../utils');

// // Ensure export directories exist
// const DIRS = {
//   attendance: path.resolve(env.EXPORT_DIR, 'attendance'),
//   overtime:   path.resolve(env.EXPORT_DIR, 'overtime'),
//   temp:       path.resolve(env.EXPORT_DIR, 'temp'),
// };
// for (const dir of Object.values(DIRS)) {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// }

// // ─── Excel: Monthly Attendance Register ───────────────────────────────────────
// async function exportMonthlyAttendanceExcel({ year, month, department }) {
//   const { year: y, month: m } = { year: parseInt(year), month: parseInt(month) } || getCurrentMonthYear();

//   const records = await attendanceService.getMonthlySummary({ year: y, month: m, department });
//   if (!records.length) throw Object.assign(new Error('No data for selected filters'), { statusCode: 404 });

//   const workbook  = new ExcelJS.Workbook();
//   workbook.creator = 'HR Analytics System';
//   workbook.created = new Date();

//   const ws = workbook.addWorksheet(`Attendance ${m}-${y}`, {
//     pageSetup: { orientation: 'landscape', fitToPage: true },
//   });

//   // ── Header row ──
//   const monthName = new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
//   ws.mergeCells('A1:R1');
//   ws.getCell('A1').value = `Monthly Attendance Register — ${monthName}${department ? ` — ${department}` : ''}`;
//   ws.getCell('A1').font = { bold: true, size: 14 };
//   ws.getCell('A1').alignment = { horizontal: 'center' };

//   // ── Column definitions ──
//   ws.columns = [
//     { header: 'Emp Code',      key: 'employeeCode',     width: 12 },
//     { header: 'Name',          key: 'employeeName',     width: 24 },
//     { header: 'Department',    key: 'department',       width: 20 },
//     { header: 'Designation',   key: 'designation',      width: 20 },
//     { header: 'Present',       key: 'presentDays',      width: 10 },
//     { header: 'Absent',        key: 'absentDays',       width: 10 },
//     { header: 'Half Day',      key: 'halfDays',         width: 10 },
//     { header: 'Leave',         key: 'leaveDays',        width: 10 },
//     { header: 'Weekly Off',    key: 'weeklyOffDays',    width: 11 },
//     { header: 'Holiday',       key: 'holidayDays',      width: 10 },
//     { header: 'Miss Punch',    key: 'missPunchDays',    width: 11 },
//     { header: 'OD',            key: 'odDays',           width: 8  },
//     { header: 'Work Hours',    key: 'workHours',        width: 12 },
//     { header: 'OT Hours',      key: 'otHours',          width: 10 },
//     { header: 'Late (min)',     key: 'lateMinutes',      width: 11 },
//     { header: 'CL',            key: 'cl',               width: 7  },
//     { header: 'SL',            key: 'sl',               width: 7  },
//     { header: 'EL',            key: 'el',               width: 7  },
//   ];

//   // Style the column header row (row 2 — row 1 is merged title)
//   ws.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
//   ws.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
//   ws.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
//   ws.getRow(2).height = 20;

//   // ── Data rows ──
//   for (const rec of records) {
//     const lb = rec.leaveBreakdown || {};
//     ws.addRow({
//       employeeCode:   rec.employeeCode,
//       employeeName:   rec.employeeName,
//       department:     rec.department,
//       designation:    rec.designation,
//       presentDays:    rec.presentDays,
//       absentDays:     rec.absentDays,
//       halfDays:       rec.halfDays,
//       leaveDays:      rec.leaveDays,
//       weeklyOffDays:  rec.weeklyOffDays,
//       holidayDays:    rec.holidayDays,
//       missPunchDays:  rec.missPunchDays,
//       odDays:         rec.odDays,
//       workHours:      minutesToHHMM(rec.totalWorkMinutes),
//       otHours:        minutesToHHMM(rec.totalOtMinutes),
//       lateMinutes:    rec.totalLateMinutes,
//       cl:             lb.CL || 0,
//       sl:             lb.SL || 0,
//       el:             lb.EL || 0,
//     });
//   }

//   // Alternate row banding
//   ws.eachRow((row, rowNum) => {
//     if (rowNum > 2 && rowNum % 2 === 0) {
//       row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
//     }
//     row.eachCell(cell => {
//       cell.border = {
//         top: { style: 'thin' }, left: { style: 'thin' },
//         bottom: { style: 'thin' }, right: { style: 'thin' },
//       };
//     });
//   });

//   // Freeze header rows
//   ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

//   const filename = `attendance_${y}_${String(m).padStart(2, '0')}${department ? `_${department.replace(/\s+/g, '_')}` : ''}_${Date.now()}.xlsx`;
//   const filepath = path.join(DIRS.attendance, filename);
//   await workbook.xlsx.writeFile(filepath);

//   logger.info(`[exports] Monthly attendance Excel generated: ${filename}`);
//   return { filepath, filename };
// }

// // ─── Excel: Overtime Report ───────────────────────────────────────────────────
// async function exportOvertimeExcel({ dateFrom, dateTo, minOtMinutes = 60 }) {
//   const records = await attendanceService.getOvertimeList({ dateFrom, dateTo, minOtMinutes });
//   if (!records.length) throw Object.assign(new Error('No OT records for selected range'), { statusCode: 404 });

//   const workbook = new ExcelJS.Workbook();
//   workbook.creator = 'HR Analytics System';

//   const ws = workbook.addWorksheet('Overtime Report');

//   ws.columns = [
//     { header: 'Emp Code',    key: 'employeeCode',  width: 12 },
//     { header: 'Name',        key: 'employeeName',  width: 24 },
//     { header: 'Department',  key: 'department',    width: 20 },
//     { header: 'Date',        key: 'dateStr',       width: 12 },
//     { header: 'Shift',       key: 'shift',         width: 8  },
//     { header: 'IN Time',     key: 'inTime',        width: 18 },
//     { header: 'OUT Time',    key: 'outTime',       width: 18 },
//     { header: 'Work Hours',  key: 'workHours',     width: 12 },
//     { header: 'OT Hours',    key: 'otHours',       width: 12 },
//     { header: 'OT Minutes',  key: 'otMinutes',     width: 12 },
//   ];

//   ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
//   ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

//   for (const rec of records) {
//     ws.addRow({
//       employeeCode: rec.employeeCode,
//       employeeName: rec.employeeName,
//       department:   rec.department,
//       dateStr:      rec.dateStr,
//       shift:        rec.shift,
//       inTime:       rec.inTime ? new Date(rec.inTime).toLocaleString('en-IN') : '',
//       outTime:      rec.outTime ? new Date(rec.outTime).toLocaleString('en-IN') : '',
//       workHours:    minutesToHHMM(rec.workMinutes),
//       otHours:      minutesToHHMM(rec.otMinutes),
//       otMinutes:    rec.otMinutes,
//     });
//   }

//   const label = `${toDateStr(dateFrom)}_to_${toDateStr(dateTo)}`;
//   const filename = `overtime_${label}_${Date.now()}.xlsx`;
//   const filepath = path.join(DIRS.overtime, filename);
//   await workbook.xlsx.writeFile(filepath);

//   logger.info(`[exports] OT Excel generated: ${filename}`);
//   return { filepath, filename };
// }

// module.exports = {
//   exportMonthlyAttendanceExcel,
//   exportOvertimeExcel,
// };
