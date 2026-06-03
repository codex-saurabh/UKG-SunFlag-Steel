/**
 * server/src/database/indexes.js
 *
 * Explicit index creation — called once during server startup after
 * the DB connection is established.
 *
 * Why a separate file instead of relying on Mongoose schema indexes?
 * Mongoose's autoIndex is disabled in production for safety. This file
 * gives us full control: we can log which indexes were created, handle
 * failures gracefully, and add compound/text indexes that are harder
 * to express cleanly inside schema definitions.
 */

const mongoose = require('mongoose');
const logger   = require('../logger');

async function ensureIndexes() {
  const db = mongoose.connection.db;

  const indexDefs = [
    // ── employees_raw ──────────────────────────────────────────────
    {
      collection: 'employees_raw',
      indexes: [
        { key: { ukgId: 1 },                   options: { unique: true, name: 'idx_ukgId' } },
        { key: { employeeCode: 1 },             options: { unique: true, name: 'idx_empCode' } },
        { key: { department: 1, status: 1 },    options: { name: 'idx_dept_status' } },
        { key: { status: 1 },                   options: { name: 'idx_status' } },
      ],
    },

    // ── punches_raw ────────────────────────────────────────────────
    {
      collection: 'punches_raw',
      indexes: [
        {
          key: { employeeCode: 1, punchTime: 1, punchType: 1 },
          options: { unique: true, name: 'idx_emp_time_type' },
        },
        { key: { employeeCode: 1, punchTime: 1 }, options: { name: 'idx_emp_time' } },
        { key: { punchTime: 1 },                  options: { name: 'idx_punch_time' } },
      ],
    },

    // ── attendance_daily ───────────────────────────────────────────
    {
      collection: 'attendance_daily',
      indexes: [
        {
          key: { employeeCode: 1, date: 1 },
          options: { unique: true, name: 'idx_emp_date_unique' },
        },
        { key: { dateStr: 1, status: 1 },      options: { name: 'idx_datestr_status' } },
        { key: { date: 1, shift: 1 },          options: { name: 'idx_date_shift' } },
        { key: { status: 1, date: 1 },         options: { name: 'idx_status_date' } },
        { key: { isMissPunch: 1, date: 1 },    options: { name: 'idx_misspunch_date' } },
        { key: { otMinutes: 1 },               options: { name: 'idx_ot_minutes' } },
      ],
    },

    // ── attendance_monthly ─────────────────────────────────────────
    {
      collection: 'attendance_monthly',
      indexes: [
        {
          key: { employeeCode: 1, year: 1, month: 1 },
          options: { unique: true, name: 'idx_emp_year_month' },
        },
        { key: { year: 1, month: 1 }, options: { name: 'idx_year_month' } },
      ],
    },

    // ── leaves_raw ─────────────────────────────────────────────────
    {
      collection: 'leaves_raw',
      indexes: [
        { key: { employeeCode: 1, fromDate: 1 }, options: { name: 'idx_emp_from' } },
        { key: { fromDate: 1, toDate: 1, status: 1 }, options: { name: 'idx_date_range_status' } },
        {
          key: { ukgLeaveId: 1 },
          options: { unique: true, sparse: true, name: 'idx_ukg_leave_id' },
        },
      ],
    },

    // ── shift_schedules_raw ────────────────────────────────────────
    {
      collection: 'shift_schedules_raw',
      indexes: [
        {
          key: { employeeCode: 1, date: 1 },
          options: { unique: true, name: 'idx_emp_date' },
        },
        { key: { date: 1, shiftCode: 1 }, options: { name: 'idx_date_shift' } },
      ],
    },

    // ── users ──────────────────────────────────────────────────────
    {
      collection: 'users',
      indexes: [
        { key: { email: 1 }, options: { unique: true, name: 'idx_email' } },
        { key: { email: 1, isActive: 1 }, options: { name: 'idx_email_active' } },
      ],
    },

    // ── audit_logs ─────────────────────────────────────────────────
    {
      collection: 'audit_logs',
      indexes: [
        { key: { userId: 1, createdAt: -1 },  options: { name: 'idx_user_date' } },
        { key: { action: 1, createdAt: -1 },  options: { name: 'idx_action_date' } },
        { key: { createdAt: -1 },             options: { name: 'idx_created_at' } },
      ],
    },

    // ── job_logs ───────────────────────────────────────────────────
    {
      collection: 'job_logs',
      indexes: [
        { key: { jobName: 1, startedAt: -1 }, options: { name: 'idx_job_started' } },
        { key: { status: 1, startedAt: -1 },  options: { name: 'idx_status_started' } },
      ],
    },

    // ── dashboard_cache ────────────────────────────────────────────
    {
      collection: 'dashboard_cache',
      indexes: [
        { key: { key: 1 },        options: { unique: true, name: 'idx_cache_key' } },
        { key: { expiresAt: 1 },  options: { expireAfterSeconds: 0, name: 'idx_ttl' } },
      ],
    },
  ];

  let totalCreated = 0;

  for (const { collection, indexes } of indexDefs) {
    const coll = db.collection(collection);
    for (const { key, options } of indexes) {
      try {
        await coll.createIndex(key, options);
        totalCreated++;
      } catch (err) {
        // Index already exists with same definition — safe to ignore
        if (err.code === 85 || err.code === 86 || err.codeName === 'IndexOptionsConflict') {
          logger.debug(`Index already exists: ${collection}.${options.name}`);
        } else {
          logger.error(`Failed to create index ${collection}.${options.name}`, { error: err.message });
        }
      }
    }
  }

  logger.info(`Indexes ensured — ${totalCreated} created/verified across ${indexDefs.length} collections`);
}

module.exports = { ensureIndexes };
