/**
 * server/src/validators/export.schema.js
 *
 * Zod schemas for export-related request validation.
 */

const { z } = require('zod');
const { DEPARTMENTS } = require('../config/constants');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const monthNum = z.coerce.number().int().min(1).max(12);
const yearNum  = z.coerce.number().int().min(2020).max(2099);

// ── Monthly attendance export ──────────────────────────────────────────────
const exportMonthlyQuery = z.object({
  month:      monthNum,
  year:       yearNum,
  department: z.enum(DEPARTMENTS).optional(),
});

// ── Overtime export ────────────────────────────────────────────────────────
const exportOvertimeQuery = z.object({
  dateFrom:     dateString,
  dateTo:       dateString,
  minOtMinutes: z.coerce.number().int().min(0).default(60),
});

module.exports = {
  exportMonthlyQuery,
  exportOvertimeQuery,
};
