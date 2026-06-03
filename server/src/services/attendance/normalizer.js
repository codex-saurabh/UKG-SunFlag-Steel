/**
 * server/src/services/attendance/normalizer.js
 *
 * Punch normalization logic.
 * Takes an array of raw punch documents for one employee on one date
 * and returns a clean { inPunch, outPunch } pair.
 *
 * Handles:
 *   - Duplicate punches (face recognition noise)
 *   - Multiple IN punches → keep the earliest
 *   - Multiple OUT punches → keep the latest
 *   - Cross-date Shift C punches (OUT falls on next calendar day)
 */

const { SHIFTS } = require('../../config/constants');
const { addMinutes } = require('../../utils/date');

/**
 * normalizePunches(rawPunches, shiftCode, shiftDate)
 *
 * rawPunches  — array of PunchRaw documents for this employee/date
 * shiftCode   — 'A' | 'B' | 'C' | 'G'
 * shiftDate   — the shift's reference date (midnight Date object)
 *
 * Returns: { inPunch: Date|null, outPunch: Date|null, isDuplicate: boolean }
 */
function normalizePunches(rawPunches, shiftCode, shiftDate) {
  if (!rawPunches || rawPunches.length === 0) {
    return { inPunch: null, outPunch: null, isDuplicate: false };
  }

  const shift = SHIFTS[shiftCode];
  if (!shift) return { inPunch: null, outPunch: null, isDuplicate: false };

  // Build the expected shift window to filter out stray punches
  const shiftStart = addMinutes(shiftDate, shift.startHour * 60 - 60);  // 1hr grace before
  const shiftEnd   = shift.crossDate
    ? addMinutes(new Date(shiftDate.getTime() + 86400000), shift.endHour * 60 + 120)  // next day + 2hr grace
    : addMinutes(shiftDate, shift.endHour * 60 + 120);  // same day + 2hr grace

  // Filter punches within the shift window
  const windowPunches = rawPunches.filter(p => {
    const t = new Date(p.punchTime);
    return t >= shiftStart && t <= shiftEnd;
  });

  // If no punches fall in window, use all punches (avoid over-filtering)
  const punches = windowPunches.length > 0 ? windowPunches : rawPunches;

  const inPunches  = punches.filter(p => p.punchType === 'IN')
    .map(p => new Date(p.punchTime))
    .sort((a, b) => a - b);

  const outPunches = punches.filter(p => p.punchType === 'OUT')
    .map(p => new Date(p.punchTime))
    .sort((a, b) => b - a); // descending — we want the latest OUT

  const isDuplicate = inPunches.length > 1 || outPunches.length > 1;

  return {
    inPunch:     inPunches[0]  || null,   // earliest IN
    outPunch:    outPunches[0] || null,   // latest OUT
    isDuplicate,
  };
}

/**
 * deduplicatePunches(rawPunches)
 *
 * Removes exact duplicate timestamps (same employee, same time, same type).
 * Returns a de-duplicated array.
 * Used before inserting a batch of raw punches from UKG.
 */
function deduplicatePunches(rawPunches) {
  const seen = new Set();
  return rawPunches.filter(p => {
    const key = `${p.employeeCode}|${new Date(p.punchTime).toISOString()}|${p.punchType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { normalizePunches, deduplicatePunches };