/**
 * server/src/services/attendance/shiftResolver.js
 *
 * Shift resolution — answers "which shift was this employee on for this date?"
 *
 * Priority order:
 *   1. ShiftSchedule collection (daily override uploaded via UKG)
 *   2. Employee.defaultShift (fallback when no daily override exists)
 *
 * Also provides shift timing helpers used by the attendance computation.
 */

const { ShiftSchedule } = require('../../models/index');
const Employee = require('../../models/Employee');
const { SHIFTS } = require('../../config/constants');
const { toDateStr, addMinutes, normalizeToMidnight } = require('../../utils/date');

/**
 * resolveShift(employeeCode, date)
 *
 * Returns the shift code ('A' | 'B' | 'C' | 'G') for the given employee/date.
 * Checks ShiftSchedule override first, falls back to Employee.defaultShift.
 */
async function resolveShift(employeeCode, date) {
  const dateStr = toDateStr(date);

  // Check for a daily shift schedule override
  const schedule = await ShiftSchedule.findOne({ employeeCode, dateStr }).lean();
  if (schedule?.shiftCode) return schedule.shiftCode;

  // Fall back to employee's default shift
  const emp = await Employee.findOne({ employeeCode }, 'defaultShift').lean();
  return emp?.defaultShift || 'G';
}

/**
 * resolveShiftBulk(employeeCodes, date)
 *
 * Resolves shifts for multiple employees at once — one DB call each.
 * Returns a Map<employeeCode, shiftCode>.
 *
 * More efficient than calling resolveShift() in a loop when processing
 * an entire day's worth of attendance records.
 */
async function resolveShiftBulk(employeeCodes, date) {
  const dateStr = toDateStr(date);

  const [schedules, employees] = await Promise.all([
    ShiftSchedule.find({ employeeCode: { $in: employeeCodes }, dateStr }).lean(),
    Employee.find({ employeeCode: { $in: employeeCodes } }, 'employeeCode defaultShift').lean(),
  ]);

  const scheduleMap = Object.fromEntries(schedules.map(s => [s.employeeCode, s.shiftCode]));
  const defaultMap  = Object.fromEntries(employees.map(e => [e.employeeCode, e.defaultShift || 'G']));

  const result = new Map();
  for (const code of employeeCodes) {
    result.set(code, scheduleMap[code] || defaultMap[code] || 'G');
  }
  return result;
}

/**
 * getShiftWindow(shiftCode, shiftDate)
 *
 * Returns the expected IN and OUT times for a shift on a given date.
 * Handles cross-date Shift C (OUT falls on the next calendar day).
 *
 * Returns: { inTime, outTime, durationMinutes } | null
 */
function getShiftWindow(shiftCode, shiftDate) {
  const shift = SHIFTS[shiftCode];
  if (!shift) return null;

  const base = normalizeToMidnight(shiftDate);

  const inTime = addMinutes(base, shift.startHour * 60);

  const outTime = shift.crossDate
    ? addMinutes(new Date(base.getTime() + 86400000), shift.endHour * 60) // next day
    : addMinutes(base, shift.endHour * 60);

  const durationMinutes = (outTime - inTime) / 60000;

  return { inTime, outTime, durationMinutes };
}

module.exports = { resolveShift, resolveShiftBulk, getShiftWindow };