/**
 * server/src/utils/date.js
 *
 * Date and time utility functions used across services and controllers.
 * Pure functions — no DB calls, no imports from other app modules.
 */

/**
 * toDateStr(date) → "YYYY-MM-DD"
 * Safe with Date objects, ISO strings, and timestamps.
 */
function toDateStr(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * startOfDay / endOfDay — midnight boundaries for MongoDB date range queries
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * startOfMonth / endOfMonth — first/last millisecond of a calendar month
 * month is 1-based (January = 1)
 */
function startOfMonth(year, month) {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function endOfMonth(year, month) {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

/**
 * getCurrentMonthYear() → { month, year }
 */
function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * addMinutes(date, minutes) — returns new Date
 */
function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60000);
}

/**
 * minutesToHHMM(minutes) → "H:MM"
 * e.g. 90 → "1:30", 0 → "0:00"
 */
function minutesToHHMM(minutes) {
  if (!minutes || minutes < 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * normalizeToMidnight(date) — strips time, returns midnight local time
 */
function normalizeToMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * formatUptime(seconds) → "2d 3h 15m"
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

module.exports = {
  toDateStr,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  getCurrentMonthYear,
  addMinutes,
  minutesToHHMM,
  normalizeToMidnight,
  formatUptime,
};
