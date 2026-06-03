/**
 * server/src/validators/attendance.schema.js
 *
 * Zod schemas for all attendance-related request validation.
 */

const { z } = require('zod');
const { ATTENDANCE_STATUS, SHIFTS, DEPARTMENTS } = require('../config/constants');

// ── Reusable primitives ──────────────────────────────────────────────────────
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const monthNum = z.coerce.number().int().min(1).max(12);
const yearNum  = z.coerce.number().int().min(2020).max(2099);

// ── Daily attendance query ────────────────────────────────────────────────────
const attendanceDailyQuery = z
  .object({
    // Single date OR a range — not both
    date:         dateString.optional(),
    dateFrom:     dateString.optional(),
    dateTo:       dateString.optional(),

    department:   z.enum(DEPARTMENTS).optional(),
    shift:        z.enum(Object.keys(SHIFTS)).optional(),
    status:       z.enum(Object.values(ATTENDANCE_STATUS)).optional(),
    employeeCode: z.string().trim().optional(),

    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(50),
  })
  .refine(
    d => !(d.date && (d.dateFrom || d.dateTo)),
    { message: 'Use either "date" or "dateFrom/dateTo" range — not both' }
  );

// ── Monthly attendance query ──────────────────────────────────────────────────
const attendanceMonthlyQuery = z.object({
  month:        monthNum,
  year:         yearNum,
  department:   z.enum(DEPARTMENTS).optional(),
  employeeCode: z.string().trim().optional(),
});

// ── Department breakdown query ────────────────────────────────────────────────
const departmentBreakdownQuery = z.object({
  month: monthNum.optional(),
  year:  yearNum.optional(),
});

// ── Miss punch query ──────────────────────────────────────────────────────────
const missPunchQuery = z.object({
  dateFrom: dateString.optional(),
  dateTo:   dateString.optional(),
});

// ── Overtime query ────────────────────────────────────────────────────────────
const overtimeQuery = z.object({
  dateFrom:     dateString.optional(),
  dateTo:       dateString.optional(),
  minOtMinutes: z.coerce.number().int().min(0).default(60),
});

module.exports = {
  attendanceDailyQuery,
  attendanceMonthlyQuery,
  departmentBreakdownQuery,
  missPunchQuery,
  overtimeQuery,
};
