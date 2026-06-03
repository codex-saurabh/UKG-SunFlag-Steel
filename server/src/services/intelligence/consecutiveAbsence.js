/**
 * server/src/services/intelligence/consecutiveAbsence.js
 *
 * Detects employees with 3+ consecutive absent days.
 * Runs nightly as a scheduled job.
 *
 * Logic:
 *   1. Look at the last 14 days of attendance for every active employee
 *   2. Find runs of ABSENT status (excludes Weekly Off and Holiday — those break a run)
 *   3. If a run of 3+ exists ending yesterday or today → create/update alert
 *   4. Resolve alerts for employees whose run has ended
 */

const { AttendanceDaily } = require('../../models/Attendance');
const Employee  = require('../../models/Employee');
const Alert     = require('../../models/Alert');
const logger    = require('../../logger');
const {
  ATTENDANCE_STATUS,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_STATUS,
  CONSECUTIVE_ABSENCE_THRESHOLD,
} = require('../../config/constants');
const { startOfDay, toDateStr } = require('../../utils/date');

// Statuses that count as "absent" for run detection
const ABSENT_STATUSES = new Set([
  ATTENDANCE_STATUS.ABSENT,
  ATTENDANCE_STATUS.MISS_PUNCH,
]);

// Statuses that BREAK a consecutive run (employee was present in some form)
const BREAK_STATUSES = new Set([
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.HALF_DAY,
  ATTENDANCE_STATUS.LEAVE,
  ATTENDANCE_STATUS.OD,
  ATTENDANCE_STATUS.WEEKLY_OFF,
  ATTENDANCE_STATUS.HOLIDAY,
]);

/**
 * detectConsecutiveAbsences()
 * Main entry point — called by the intelligence job.
 * Returns { alertsCreated, alertsResolved, alertsUpdated }
 */
async function detectConsecutiveAbsences() {
  const today     = startOfDay(new Date());
  const lookback  = new Date(today.getTime() - 14 * 86400000); // 14 days back

  const employees = await Employee.find({ status: 'Active' }, 'employeeCode name department').lean();
  const empCodes  = employees.map(e => e.employeeCode);
  const empMap    = Object.fromEntries(employees.map(e => [e.employeeCode, e]));

  // Fetch last 14 days attendance for all employees in one query
  const records = await AttendanceDaily.find({
    employeeCode: { $in: empCodes },
    date: { $gte: lookback, $lte: today },
  })
    .sort({ employeeCode: 1, date: 1 })
    .lean();

  // Group by employee
  const byEmployee = {};
  for (const rec of records) {
    if (!byEmployee[rec.employeeCode]) byEmployee[rec.employeeCode] = [];
    byEmployee[rec.employeeCode].push(rec);
  }

  let alertsCreated = 0, alertsResolved = 0, alertsUpdated = 0;

  for (const code of empCodes) {
    const empRecords = byEmployee[code] || [];
    const run = findCurrentAbsenceRun(empRecords, today);

    const existingAlert = await Alert.findOne({
      type:         ALERT_TYPE.CONSECUTIVE_ABSENCE,
      employeeCode: code,
      status:       ALERT_STATUS.ACTIVE,
    });

    if (run && run.days >= CONSECUTIVE_ABSENCE_THRESHOLD) {
      const emp = empMap[code];
      const alertData = {
        type:         ALERT_TYPE.CONSECUTIVE_ABSENCE,
        severity:     run.days >= 5 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        status:       ALERT_STATUS.ACTIVE,
        employeeCode: code,
        employeeName: emp.name,
        department:   emp.department,
        title:        `${emp.name} absent for ${run.days} consecutive days`,
        message:      `${emp.name} (${code}) from ${emp.department} has been absent since ${run.fromDate}. Total consecutive days: ${run.days}.`,
        meta: {
          absentDays: run.days,
          fromDate:   run.fromDate,
          toDate:     run.toDate,
          dates:      run.dates,
        },
      };

      if (existingAlert) {
        // Update existing alert with latest run data
        await Alert.findByIdAndUpdate(existingAlert._id, {
          ...alertData,
          detectedAt: existingAlert.detectedAt, // preserve original detection time
        });
        alertsUpdated++;
      } else {
        await Alert.create({ ...alertData, detectedAt: new Date() });
        alertsCreated++;
        logger.warn(`[intelligence] Consecutive absence alert: ${emp.name} — ${run.days} days from ${run.fromDate}`);
      }
    } else if (existingAlert) {
      // Run has ended — auto-resolve
      await Alert.findByIdAndUpdate(existingAlert._id, {
        status:     ALERT_STATUS.RESOLVED,
        resolvedAt: new Date(),
      });
      alertsResolved++;
      logger.info(`[intelligence] Consecutive absence resolved: ${code}`);
    }
  }

  logger.info(`[intelligence] Consecutive absence scan complete — ${alertsCreated} created, ${alertsUpdated} updated, ${alertsResolved} resolved`);
  return { alertsCreated, alertsResolved, alertsUpdated };
}

/**
 * findCurrentAbsenceRun(records, today)
 * Given sorted attendance records, finds the most recent consecutive absence run
 * that is ongoing (ends on today or yesterday).
 * Returns { days, fromDate, toDate, dates } or null.
 */
function findCurrentAbsenceRun(records, today) {
  if (!records.length) return null;

  // Work backwards from the most recent record
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

  // The most recent record must be absent for a run to be "current"
  if (!ABSENT_STATUSES.has(sorted[0].status)) return null;

  const runDates = [];
  for (const rec of sorted) {
    if (ABSENT_STATUSES.has(rec.status)) {
      runDates.push(toDateStr(rec.date));
    } else if (BREAK_STATUSES.has(rec.status)) {
      break; // run ends here
    }
    // Unknown status — skip but don't break the run
  }

  if (!runDates.length) return null;

  return {
    days:     runDates.length,
    fromDate: runDates[runDates.length - 1], // oldest date first
    toDate:   runDates[0],                   // most recent date
    dates:    runDates.reverse(),             // chronological order
  };
}

module.exports = { detectConsecutiveAbsences };