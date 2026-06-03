/**
 * server/src/services/attendance/index.js
 *
 * Public API of the attendance service.
 * Orchestrates normalizer.js and shiftResolver.js.
 * Controllers import only from here.
 */

const { AttendanceDaily, AttendanceMonthly } = require('../../models/Attendance');
const Employee  = require('../../models/Employee');
const { ATTENDANCE_STATUS } = require('../../config/constants');
const { startOfDay, endOfDay, toDateStr } = require('../../utils/date');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function enrichWithEmployee(records) {
  const codes  = [...new Set(records.map(r => r.employeeCode))];
  const empMap = await Employee
    .find({ employeeCode: { $in: codes } }, 'employeeCode name department designation')
    .lean()
    .then(list => Object.fromEntries(list.map(e => [e.employeeCode, e])));

  return records.map(r => ({
    ...r,
    employeeName: empMap[r.employeeCode]?.name        || r.employeeCode,
    department:   empMap[r.employeeCode]?.department  || null,
    designation:  empMap[r.employeeCode]?.designation || null,
  }));
}

async function deptToEmpCodes(department) {
  const emps = await Employee.find({ department, status: 'Active' }, 'employeeCode').lean();
  return emps.map(e => e.employeeCode);
}

// ─── Daily attendance list ────────────────────────────────────────────────────
async function getDailyAttendance({ date, dateFrom, dateTo, department, shift, status, employeeCode, skip, limit }) {
  const match = {};

  if (date) {
    match.date = { $gte: startOfDay(date), $lte: endOfDay(date) };
  } else if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = startOfDay(dateFrom);
    if (dateTo)   match.date.$lte = endOfDay(dateTo);
  }

  if (status)       match.status       = status;
  if (shift)        match.shift        = shift;
  if (employeeCode) match.employeeCode = employeeCode;

  if (department) {
    const codes = await deptToEmpCodes(department);
    match.employeeCode = { $in: codes };
  }

  const [records, total] = await Promise.all([
    AttendanceDaily.find(match).sort({ date: -1, employeeCode: 1 }).skip(skip).limit(limit).lean(),
    AttendanceDaily.countDocuments(match),
  ]);

  return { records: await enrichWithEmployee(records), total };
}

// ─── Today summary ────────────────────────────────────────────────────────────
async function getTodaySummary() {
  const today    = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [rows, totalEmployees] = await Promise.all([
    AttendanceDaily.aggregate([
      { $match: { date: { $gte: today, $lte: todayEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Employee.countDocuments({ status: 'Active' }),
  ]);

  const map = {};
  for (const r of rows) map[r._id] = r.count;

  return {
    totalEmployees,
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

// ─── Monthly summary ──────────────────────────────────────────────────────────
async function getMonthlySummary({ year, month, employeeCode, department }) {
  const match = { year: parseInt(year), month: parseInt(month) };
  if (employeeCode) match.employeeCode = employeeCode;
  if (department) {
    const codes = await deptToEmpCodes(department);
    match.employeeCode = { $in: codes };
  }

  const records = await AttendanceMonthly.find(match).lean();
  return enrichWithEmployee(records);
}

// ─── Department breakdown ─────────────────────────────────────────────────────
async function getDepartmentBreakdown({ year, month }) {
  return AttendanceMonthly.aggregate([
    { $match: { year: parseInt(year), month: parseInt(month) } },
    {
      $lookup: {
        from: 'employees_raw', localField: 'employeeCode',
        foreignField: 'employeeCode', as: 'emp',
      },
    },
    { $unwind: { path: '$emp', preserveNullAndEmpty: false } },
    {
      $group: {
        _id:              '$emp.department',
        headcount:        { $sum: 1 },
        totalPresent:     { $sum: '$presentDays' },
        totalAbsent:      { $sum: '$absentDays' },
        totalLeave:       { $sum: '$leaveDays' },
        totalOtMinutes:   { $sum: '$totalOtMinutes' },
        totalWorkMinutes: { $sum: '$totalWorkMinutes' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

// ─── Miss punch list ──────────────────────────────────────────────────────────
async function getMissPunchList({ dateFrom, dateTo }) {
  const match = {
    isMissPunch: true,
    date: {
      $gte: startOfDay(dateFrom || new Date()),
      $lte: endOfDay(dateTo   || new Date()),
    },
  };
  const records = await AttendanceDaily.find(match).sort({ date: -1 }).lean();
  return enrichWithEmployee(records);
}

// ─── Overtime list ────────────────────────────────────────────────────────────
async function getOvertimeList({ dateFrom, dateTo, minOtMinutes = 60 }) {
  const match = {
    otMinutes: { $gte: minOtMinutes },
    date: {
      $gte: startOfDay(dateFrom || new Date()),
      $lte: endOfDay(dateTo   || new Date()),
    },
  };
  const records = await AttendanceDaily.find(match).sort({ otMinutes: -1 }).lean();
  return enrichWithEmployee(records);
}

module.exports = {
  getDailyAttendance,
  getTodaySummary,
  getMonthlySummary,
  getDepartmentBreakdown,
  getMissPunchList,
  getOvertimeList,
};

// const { AttendanceDaily, AttendanceMonthly, PunchRaw } = require('../../models/Attendance');
// const Employee = require('../../models/Employee');
// const { ATTENDANCE_STATUS } = require('../../config/constants');
// const { startOfDay, endOfDay, startOfMonth, endOfMonth, toDateStr } = require('../../utils');

// /**
//  * Get daily attendance list with filters — used by the main attendance grid
//  */
// async function getDailyAttendance({ date, dateFrom, dateTo, department, shift, status, employeeCode, page, limit, skip }) {
//   const match = {};

//   if (date) {
//     match.date = { $gte: startOfDay(date), $lte: endOfDay(date) };
//   } else if (dateFrom || dateTo) {
//     match.date = {};
//     if (dateFrom) match.date.$gte = startOfDay(dateFrom);
//     if (dateTo)   match.date.$lte = endOfDay(dateTo);
//   }

//   if (status)        match.status = status;
//   if (shift)         match.shift  = shift;
//   if (employeeCode)  match.employeeCode = employeeCode;

//   // Department filter requires joining Employee
//   let employeeCodes = null;
//   if (department) {
//     const emps = await Employee.find({ department, status: 'Active' }, 'employeeCode').lean();
//     employeeCodes = emps.map(e => e.employeeCode);
//     match.employeeCode = { $in: employeeCodes };
//   }

//   const [records, total] = await Promise.all([
//     AttendanceDaily.find(match)
//       .sort({ date: -1, employeeCode: 1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(),
//     AttendanceDaily.countDocuments(match),
//   ]);

//   // Enrich with employee name and department
//   const codes = [...new Set(records.map(r => r.employeeCode))];
//   const empMap = await Employee.find({ employeeCode: { $in: codes } }, 'employeeCode name department designation')
//     .lean()
//     .then(list => Object.fromEntries(list.map(e => [e.employeeCode, e])));

//   const enriched = records.map(r => ({
//     ...r,
//     employeeName: empMap[r.employeeCode]?.name || r.employeeCode,
//     department:   empMap[r.employeeCode]?.department || null,
//     designation:  empMap[r.employeeCode]?.designation || null,
//   }));

//   return { records: enriched, total };
// }

// /**
//  * Get today's attendance summary — counts by status
//  */
// async function getTodaySummary() {
//   const today = startOfDay(new Date());
//   const tomorrow = endOfDay(new Date());

//   const pipeline = [
//     { $match: { date: { $gte: today, $lte: tomorrow } } },
//     { $group: { _id: '$status', count: { $sum: 1 } } },
//   ];

//   const rows = await AttendanceDaily.aggregate(pipeline);
//   const summary = {};
//   for (const row of rows) summary[row._id] = row.count;

//   const totalEmployees = await Employee.countDocuments({ status: 'Active' });

//   return {
//     totalEmployees,
//     present:    summary[ATTENDANCE_STATUS.PRESENT]    || 0,
//     absent:     summary[ATTENDANCE_STATUS.ABSENT]     || 0,
//     onLeave:    summary[ATTENDANCE_STATUS.LEAVE]       || 0,
//     halfDay:    summary[ATTENDANCE_STATUS.HALF_DAY]    || 0,
//     missPunch:  summary[ATTENDANCE_STATUS.MISS_PUNCH]  || 0,
//     weeklyOff:  summary[ATTENDANCE_STATUS.WEEKLY_OFF]  || 0,
//     holiday:    summary[ATTENDANCE_STATUS.HOLIDAY]     || 0,
//     od:         summary[ATTENDANCE_STATUS.OD]          || 0,
//   };
// }

// /**
//  * Get monthly summary for an employee or all employees
//  */
// async function getMonthlySummary({ year, month, employeeCode, department }) {
//   const match = { year: parseInt(year), month: parseInt(month) };
//   if (employeeCode) match.employeeCode = employeeCode;

//   if (department) {
//     const emps = await Employee.find({ department, status: 'Active' }, 'employeeCode').lean();
//     match.employeeCode = { $in: emps.map(e => e.employeeCode) };
//   }

//   const records = await AttendanceMonthly.find(match).lean();

//   const codes = records.map(r => r.employeeCode);
//   const empMap = await Employee.find({ employeeCode: { $in: codes } }, 'employeeCode name department designation')
//     .lean()
//     .then(list => Object.fromEntries(list.map(e => [e.employeeCode, e])));

//   return records.map(r => ({
//     ...r,
//     employeeName: empMap[r.employeeCode]?.name || r.employeeCode,
//     department:   empMap[r.employeeCode]?.department || null,
//     designation:  empMap[r.employeeCode]?.designation || null,
//   }));
// }

// /**
//  * Department-wise attendance for the analytics dashboard
//  */
// async function getDepartmentBreakdown({ year, month }) {
//   const pipeline = [
//     { $match: { year: parseInt(year), month: parseInt(month) } },
//     {
//       $lookup: {
//         from: 'employees_raw',
//         localField: 'employeeCode',
//         foreignField: 'employeeCode',
//         as: 'emp',
//       },
//     },
//     { $unwind: { path: '$emp', preserveNullAndEmpty: false } },
//     {
//       $group: {
//         _id: '$emp.department',
//         headcount:       { $sum: 1 },
//         totalPresent:    { $sum: '$presentDays' },
//         totalAbsent:     { $sum: '$absentDays' },
//         totalLeave:      { $sum: '$leaveDays' },
//         totalOtMinutes:  { $sum: '$totalOtMinutes' },
//         totalWorkMinutes:{ $sum: '$totalWorkMinutes' },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ];

//   return AttendanceMonthly.aggregate(pipeline);
// }

// /**
//  * Miss punch list — employees with missing punches in a date range
//  */
// async function getMissPunchList({ dateFrom, dateTo }) {
//   const match = {
//     isMissPunch: true,
//     date: {
//       $gte: startOfDay(dateFrom || new Date()),
//       $lte: endOfDay(dateTo || new Date()),
//     },
//   };

//   const records = await AttendanceDaily.find(match).sort({ date: -1 }).lean();
//   const codes = [...new Set(records.map(r => r.employeeCode))];
//   const empMap = await Employee.find({ employeeCode: { $in: codes } }, 'employeeCode name department designation')
//     .lean()
//     .then(list => Object.fromEntries(list.map(e => [e.employeeCode, e])));

//   return records.map(r => ({
//     ...r,
//     employeeName: empMap[r.employeeCode]?.name || r.employeeCode,
//     department:   empMap[r.employeeCode]?.department || null,
//   }));
// }

// /**
//  * Overtime list — employees who worked OT
//  */
// async function getOvertimeList({ dateFrom, dateTo, minOtMinutes = 60 }) {
//   const match = {
//     otMinutes: { $gte: minOtMinutes },
//     date: {
//       $gte: startOfDay(dateFrom || new Date()),
//       $lte: endOfDay(dateTo || new Date()),
//     },
//   };

//   const records = await AttendanceDaily.find(match).sort({ otMinutes: -1 }).lean();
//   const codes = [...new Set(records.map(r => r.employeeCode))];
//   const empMap = await Employee.find({ employeeCode: { $in: codes } }, 'employeeCode name department designation')
//     .lean()
//     .then(list => Object.fromEntries(list.map(e => [e.employeeCode, e])));

//   return records.map(r => ({
//     ...r,
//     employeeName: empMap[r.employeeCode]?.name || r.employeeCode,
//     department:   empMap[r.employeeCode]?.department || null,
//   }));
// }

// module.exports = {
//   getDailyAttendance,
//   getTodaySummary,
//   getMonthlySummary,
//   getDepartmentBreakdown,
//   getMissPunchList,
//   getOvertimeList,
// };
