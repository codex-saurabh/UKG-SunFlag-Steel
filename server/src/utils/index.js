/**
 * server/src/utils/index.js
 *
 * Barrel re-export — import any utility from one place.
 *
 * Usage:
 *   const { ok, paginate, toDateStr, minutesToHHMM } = require('../utils');
 */

module.exports = {
  ...require('./response'),
  ...require('./paginate'),
  ...require('./date'),
};


// // ─── Standardized API response envelope
// const ok = (res, data, meta = {}) =>
//   res.status(200).json({ success: true, data, ...(Object.keys(meta).length ? { meta } : {}) });

// const created = (res, data) =>
//   res.status(201).json({ success: true, data });

// const noContent = (res) =>
//   res.status(204).end();

// // ─── Pagination helper
// function paginate(query = {}) {
//   const page  = Math.max(1, parseInt(query.page)  || 1);
//   const limit = Math.min(500, Math.max(1, parseInt(query.limit) || 50));
//   const skip  = (page - 1) * limit;
//   return { page, limit, skip };
// }

// function paginateMeta(total, page, limit) {
//   return {
//     total,
//     page,
//     limit,
//     pages: Math.ceil(total / limit),
//     hasNext: page * limit < total,
//     hasPrev: page > 1,
//   };
// }

// // ─── Date helpers
// function toDateStr(date) {
//   if (!date) return null;
//   const d = new Date(date);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');
//   return `${y}-${m}-${day}`;
// }

// function startOfDay(date) {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d;
// }

// function endOfDay(date) {
//   const d = new Date(date);
//   d.setHours(23, 59, 59, 999);
//   return d;
// }

// function startOfMonth(year, month) {
//   return new Date(year, month - 1, 1, 0, 0, 0, 0);
// }

// function endOfMonth(year, month) {
//   return new Date(year, month, 0, 23, 59, 59, 999);
// }

// function minutesToHHMM(minutes) {
//   if (!minutes) return '0:00';
//   const h = Math.floor(minutes / 60);
//   const m = Math.floor(minutes % 60);
//   return `${h}:${String(m).padStart(2, '0')}`;
// }

// function getCurrentMonthYear() {
//   const now = new Date();
//   return { month: now.getMonth() + 1, year: now.getFullYear() };
// }

// module.exports = {
//   ok, created, noContent,
//   paginate, paginateMeta,
//   toDateStr, startOfDay, endOfDay, startOfMonth, endOfMonth,
//   minutesToHHMM, getCurrentMonthYear,
// };