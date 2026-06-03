/**
 * server/src/services/intelligence/liveHeadcount.js
 *
 * Live shift headcount — answers "who is currently clocked in, per shift?"
 *
 * Logic:
 *   For each active shift (based on current time), look at punch records
 *   from the last 10 hours. An employee is "currently IN" if their most
 *   recent punch is type IN with no subsequent OUT.
 *
 * This does NOT depend on attendance_daily (which is a processed collection).
 * It reads punches_raw directly for maximum freshness.
 *
 * Shift windows used for "currently active" determination:
 *   Shift A: 06:00 → 14:00  (active if time is 06:00–16:00, 2hr grace)
 *   Shift B: 14:00 → 22:00  (active if time is 14:00–00:00, 2hr grace)
 *   Shift C: 22:00 → 06:00  (active if time is 22:00–08:00, 2hr grace)
 *   General: 09:00 → 18:00  (active if time is 09:00–20:00, 2hr grace)
 */

const { PunchRaw } = require('../../models/Attendance');
const Employee = require('../../models/Employee');
const { ShiftSchedule } = require('../../models/index');
const { SHIFTS } = require('../../config/constants');
const { toDateStr } = require('../../utils/date');

/**
 * getLiveHeadcount()
 * Returns headcount per shift with lists of who is IN and who is missing.
 */
async function getLiveHeadcount() {
  const now       = new Date();
  const lookback  = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours back
  const todayStr  = toDateStr(now);

  // Fetch all punch records in the last 10 hours
  const recentPunches = await PunchRaw.find({
    punchTime: { $gte: lookback, $lte: now },
  }).sort({ employeeCode: 1, punchTime: 1 }).lean();

  // For each employee, determine their current punch state (IN or OUT)
  const punchStateByEmp = {};
  for (const punch of recentPunches) {
    if (!punchStateByEmp[punch.employeeCode]) {
      punchStateByEmp[punch.employeeCode] = { lastPunch: null, isIn: false };
    }
    punchStateByEmp[punch.employeeCode].lastPunch = punch.punchTime;
    punchStateByEmp[punch.employeeCode].isIn = punch.punchType === 'IN';
  }

  // Get all active employees with their scheduled shifts for today
  const employees = await Employee.find({ status: 'Active' })
    .select('employeeCode name department defaultShift')
    .lean();

  // Check for daily shift overrides
  const overrides = await ShiftSchedule.find({ dateStr: todayStr }).lean();
  const overrideMap = Object.fromEntries(overrides.map(o => [o.employeeCode, o.shiftCode]));

  // Determine which shifts are currently "active" based on time of day
  const activeShifts = getActiveShifts(now);

  // Build headcount per shift
  const headcountByShift = {};

  for (const shiftCode of Object.keys(SHIFTS)) {
    const shift = SHIFTS[shiftCode];
    const isActive = activeShifts.includes(shiftCode);

    // Employees scheduled for this shift today
    const shiftEmployees = employees.filter(emp => {
      const assignedShift = overrideMap[emp.employeeCode] || emp.defaultShift;
      return assignedShift === shiftCode;
    });

    const presentList  = [];
    const absentList   = [];

    for (const emp of shiftEmployees) {
      const state = punchStateByEmp[emp.employeeCode];
      if (state?.isIn) {
        presentList.push({
          employeeCode: emp.employeeCode,
          name:         emp.name,
          department:   emp.department,
          lastPunchAt:  state.lastPunch,
        });
      } else {
        absentList.push({
          employeeCode: emp.employeeCode,
          name:         emp.name,
          department:   emp.department,
          lastPunchAt:  state?.lastPunch || null,
        });
      }
    }

    headcountByShift[shiftCode] = {
      shiftCode,
      shiftLabel:   shift.label,
      shiftTiming:  `${String(shift.startHour).padStart(2,'0')}:00 → ${String(shift.endHour).padStart(2,'0')}:00`,
      isActive,
      scheduled:    shiftEmployees.length,
      present:      presentList.length,
      absent:       absentList.length,
      attendancePct: shiftEmployees.length > 0
        ? Math.round((presentList.length / shiftEmployees.length) * 100)
        : 0,
      presentList,
      absentList,
    };
  }

  // Overall summary
  const allScheduled = employees.length;
  const allPresent   = Object.values(punchStateByEmp).filter(s => s.isIn).length;

  return {
    asOf:          now,
    activeShifts,
    overall: {
      scheduled:    allScheduled,
      present:      allPresent,
      absent:       allScheduled - allPresent,
      attendancePct: allScheduled > 0 ? Math.round((allPresent / allScheduled) * 100) : 0,
    },
    byShift: headcountByShift,
  };
}

/**
 * getActiveShifts(now)
 * Returns shift codes that are currently in their active window (with 2hr grace).
 */
function getActiveShifts(now) {
  const hour   = now.getHours();
  const active = [];

  // Shift A: 06:00–14:00, active window 05:00–16:00
  if (hour >= 5 && hour < 16) active.push('A');

  // Shift B: 14:00–22:00, active window 13:00–00:00
  if (hour >= 13) active.push('B');

  // Shift C: 22:00–06:00, active window 21:00–08:00 (crosses midnight)
  if (hour >= 21 || hour < 8) active.push('C');

  // General: 09:00–18:00, active window 08:00–20:00
  if (hour >= 8 && hour < 20) active.push('G');

  return active;
}

module.exports = { getLiveHeadcount };