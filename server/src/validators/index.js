/**
 * server/src/validators/index.js
 *
 * Barrel export — import all schemas and the validate middleware factory
 * from one place.
 *
 * Usage:
 *   const { validate, schemas } = require('../validators');
 *   router.get('/route', validate(schemas.attendanceDailyQuery, 'query'), controller);
 */

const { z } = require('zod');
const { ROLES } = require('../config/constants');

// ── Auth schemas (small enough to live here) ──────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ── Analytics schemas ─────────────────────────────────────────────────────
const trendQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

const shiftBreakdownQuery = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year:  z.coerce.number().int().min(2020).max(2099).optional(),
});

// ── User management schemas ───────────────────────────────────────────────
const createUserSchema = z.object({
  name:         z.string().min(2).max(80),
  email:        z.string().email(),
  password:     z.string()
    .min(8,  'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role:         z.enum(Object.values(ROLES)),
  employeeCode: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

// ── Employee query schema ─────────────────────────────────────────────────
const employeeListQuery = z.object({
  department: z.string().optional(),
  status:     z.enum(['Active','Inactive','Resigned','Retired']).optional(),
  search:     z.string().optional(),
  page:       z.coerce.number().int().positive().default(1),
  limit:      z.coerce.number().int().positive().max(200).default(50),
});

// ── validate middleware factory ───────────────────────────────────────────
/**
 * validate(schema, source)
 * Returns Express middleware that runs Zod validation on req[source].
 * On success: coerced/defaulted values are written back to req[source].
 * On failure: returns 400 with structured field-level errors.
 *
 * source: 'body' | 'query' | 'params'  (default: 'body')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join('.') || 'root',
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Request validation failed',
          errors,
        },
      });
    }

    // Write coerced + defaulted values back so controllers see clean data
    req[source] = result.data;
    next();
  };
}

module.exports = {
  validate,
  schemas: {
    // Auth
    loginSchema,

    // Attendance — from attendance.schema.js
    ...require('./attendance.schema'),

    // Exports — from export.schema.js
    ...require('./export.schema'),

    // Analytics
    trendQuery,
    shiftBreakdownQuery,

    // Users / Employees
    createUserSchema,
    updateUserSchema,
    employeeListQuery,
  },
};
