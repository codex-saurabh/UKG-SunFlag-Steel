/**
 * server/src/services/exports/excel.js
 *
 * Excel report generation using ExcelJS.
 * Called by exports/index.js — not directly by controllers.
 */

const ExcelJS = require('exceljs');
const path    = require('path');
const env     = require('../../config/env');
const { minutesToHHMM, toDateStr } = require('../../utils/date');

// ── Style constants ────────────────────────────────────────────────────────
const HEADER_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
const HEADER_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
const THIN_BORDER  = {
  top:    { style: 'thin', color: { argb: 'FFCDD5DF' } },
  left:   { style: 'thin', color: { argb: 'FFCDD5DF' } },
  bottom: { style: 'thin', color: { argb: 'FFCDD5DF' } },
  right:  { style: 'thin', color: { argb: 'FFCDD5DF' } },
};

function applyBordersAndBanding(worksheet, headerRows = 1) {
  worksheet.eachRow((row, rowNum) => {
    if (rowNum > headerRows && rowNum % 2 === 0) {
      row.fill = ALT_ROW_FILL;
    }
    row.eachCell(cell => {
      cell.border = THIN_BORDER;
    });
  });
}

// ── Monthly Attendance Register ────────────────────────────────────────────
async function buildMonthlyAttendanceExcel(records, { month, year, department }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator  = 'HR Analytics System';
  workbook.created  = new Date();

  const ws = workbook.addWorksheet(
    `Attendance ${String(month).padStart(2,'0')}-${year}`,
    { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 } }
  );

  // Title row
  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const title     = `Monthly Attendance Register — ${monthName}${department ? `  (${department})` : ''}`;
  ws.mergeCells('A1:R1');
  const titleCell = ws.getCell('A1');
  titleCell.value     = title;
  titleCell.font      = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // Column definitions
  ws.columns = [
    { header: 'Emp Code',    key: 'employeeCode',  width: 12 },
    { header: 'Name',        key: 'employeeName',  width: 26 },
    { header: 'Department',  key: 'department',    width: 22 },
    { header: 'Designation', key: 'designation',   width: 22 },
    { header: 'Present',     key: 'presentDays',   width: 10 },
    { header: 'Absent',      key: 'absentDays',    width: 10 },
    { header: 'Half Day',    key: 'halfDays',      width: 10 },
    { header: 'Leave',       key: 'leaveDays',     width: 10 },
    { header: 'WO',          key: 'weeklyOffDays', width: 8  },
    { header: 'Holiday',     key: 'holidayDays',   width: 10 },
    { header: 'Miss Punch',  key: 'missPunchDays', width: 12 },
    { header: 'OD',          key: 'odDays',        width: 8  },
    { header: 'Work Hrs',    key: 'workHours',     width: 12 },
    { header: 'OT Hrs',      key: 'otHours',       width: 10 },
    { header: 'Late (min)',  key: 'lateMinutes',   width: 12 },
    { header: 'CL',          key: 'cl',            width: 7  },
    { header: 'SL',          key: 'sl',            width: 7  },
    { header: 'EL',          key: 'el',            width: 7  },
  ];

  // Style column header row (row 2 — row 1 is the title)
  const headerRow = ws.getRow(2);
  headerRow.font      = HEADER_FONT;
  headerRow.fill      = HEADER_FILL;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height    = 22;

  // Data rows
  for (const rec of records) {
    const lb = rec.leaveBreakdown || {};
    ws.addRow({
      employeeCode:  rec.employeeCode,
      employeeName:  rec.employeeName,
      department:    rec.department    || '',
      designation:   rec.designation   || '',
      presentDays:   rec.presentDays   || 0,
      absentDays:    rec.absentDays    || 0,
      halfDays:      rec.halfDays      || 0,
      leaveDays:     rec.leaveDays     || 0,
      weeklyOffDays: rec.weeklyOffDays || 0,
      holidayDays:   rec.holidayDays   || 0,
      missPunchDays: rec.missPunchDays || 0,
      odDays:        rec.odDays        || 0,
      workHours:     minutesToHHMM(rec.totalWorkMinutes),
      otHours:       minutesToHHMM(rec.totalOtMinutes),
      lateMinutes:   rec.totalLateMinutes || 0,
      cl:            lb.CL || 0,
      sl:            lb.SL || 0,
      el:            lb.EL || 0,
    });
  }

  applyBordersAndBanding(ws, 2);

  // Freeze panes below header rows
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  // Auto-filter on header row
  ws.autoFilter = { from: 'A2', to: 'R2' };

  const filename = `attendance_${year}_${String(month).padStart(2,'0')}${department ? `_${department.replace(/\s+/g,'_')}` : ''}_${Date.now()}.xlsx`;
  const filepath = path.join(path.resolve(env.EXPORT_DIR, 'attendance'), filename);
  await workbook.xlsx.writeFile(filepath);

  return { filepath, filename };
}

// ── Overtime Report ────────────────────────────────────────────────────────
async function buildOvertimeExcel(records, { dateFrom, dateTo }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HR Analytics System';

  const ws = workbook.addWorksheet('Overtime Report');

  ws.columns = [
    { header: 'Emp Code',   key: 'employeeCode', width: 12 },
    { header: 'Name',       key: 'employeeName', width: 26 },
    { header: 'Department', key: 'department',   width: 22 },
    { header: 'Date',       key: 'dateStr',      width: 12 },
    { header: 'Shift',      key: 'shift',        width: 8  },
    { header: 'IN Time',    key: 'inTime',       width: 20 },
    { header: 'OUT Time',   key: 'outTime',      width: 20 },
    { header: 'Work Hrs',   key: 'workHours',    width: 12 },
    { header: 'OT Hrs',     key: 'otHours',      width: 12 },
    { header: 'OT Min',     key: 'otMinutes',    width: 10 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font      = HEADER_FONT;
  headerRow.fill      = HEADER_FILL;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height    = 22;

  for (const rec of records) {
    ws.addRow({
      employeeCode: rec.employeeCode,
      employeeName: rec.employeeName,
      department:   rec.department || '',
      dateStr:      rec.dateStr,
      shift:        rec.shift || '',
      inTime:       rec.inTime  ? new Date(rec.inTime).toLocaleString('en-IN')  : '',
      outTime:      rec.outTime ? new Date(rec.outTime).toLocaleString('en-IN') : '',
      workHours:    minutesToHHMM(rec.workMinutes),
      otHours:      minutesToHHMM(rec.otMinutes),
      otMinutes:    rec.otMinutes,
    });
  }

  applyBordersAndBanding(ws, 1);
  ws.autoFilter = { from: 'A1', to: 'J1' };

  const label    = `${toDateStr(dateFrom)}_to_${toDateStr(dateTo)}`;
  const filename = `overtime_${label}_${Date.now()}.xlsx`;
  const filepath = path.join(path.resolve(env.EXPORT_DIR, 'overtime'), filename);
  await workbook.xlsx.writeFile(filepath);

  return { filepath, filename };
}

module.exports = { buildMonthlyAttendanceExcel, buildOvertimeExcel };