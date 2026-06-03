/**
 * server/src/scripts/diagnostics/check-db.js
 *
 * Tests the full database layer:
 *   1. Connects to MongoDB using config from .env
 *   2. Verifies all required collections exist
 *   3. Verifies all required indexes are in place
 *   4. Reports collection document counts
 *   5. Disconnects cleanly
 *
 * Run AFTER seeding:  node src/scripts/diagnostics/check-db.js
 * Run BEFORE seeding: will show empty collections (that is expected)
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const env      = require('../../config/env');

const REQUIRED_COLLECTIONS = [
  'employees_raw',
  'punches_raw',
  'attendance_daily',
  'attendance_monthly',
  'leaves_raw',
  'shift_schedules_raw',
  'holidays',
  'users',
  'audit_logs',
  'job_logs',
  'dashboard_cache',
];

// Indexes we expect — [ collection, indexKey ]
const REQUIRED_INDEXES = [
  ['employees_raw',        { ukgId: 1 }],
  ['employees_raw',        { employeeCode: 1 }],
  ['punches_raw',          { employeeCode: 1, punchTime: 1, punchType: 1 }],
  ['attendance_daily',     { employeeCode: 1, date: 1 }],
  ['attendance_monthly',   { employeeCode: 1, year: 1, month: 1 }],
  ['users',                { email: 1 }],
  ['audit_logs',           { createdAt: -1 }],
  ['job_logs',             { jobName: 1, startedAt: -1 }],
];

async function run() {
  console.log('\n━━━━  Database Check  ━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. Connect ──────────────────────────────────────────────────────────
  console.log(`Connecting to: ${env.MONGO_URI}\n`);
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`  ✔  Connected to: ${mongoose.connection.host} / ${mongoose.connection.name}\n`);
  } catch (err) {
    console.log(`  ✖  Connection FAILED: ${err.message}`);
    console.log('     → Is MongoDB running? Check: mongod --version');
    process.exit(1);
  }

  const db = mongoose.connection.db;

  // ── 2. Collections ──────────────────────────────────────────────────────
  console.log('Collections:\n');
  const existingColls = await db.listCollections().toArray();
  const existingNames = existingColls.map(c => c.name);

  let collPass = 0, collFail = 0;
  for (const name of REQUIRED_COLLECTIONS) {
    const exists = existingNames.includes(name);
    let count = 0;
    if (exists) {
      count = await db.collection(name).countDocuments();
    }
    if (exists) {
      console.log(`  ✔  ${name.padEnd(28)} ${String(count).padStart(6)} docs`);
      collPass++;
    } else {
      console.log(`  ✖  ${name.padEnd(28)} MISSING — run: npm run seed`);
      collFail++;
    }
  }

  // ── 3. Indexes ──────────────────────────────────────────────────────────
  console.log('\nIndexes:\n');
  let idxPass = 0, idxFail = 0;

  for (const [collName, keyPattern] of REQUIRED_INDEXES) {
    try {
      const indexes = await db.collection(collName).indexes();
      const keyStr  = JSON.stringify(keyPattern);
      const found   = indexes.some(idx => JSON.stringify(idx.key) === keyStr);
      if (found) {
        console.log(`  ✔  ${collName}.${keyStr}`);
        idxPass++;
      } else {
        console.log(`  ✖  ${collName}.${keyStr}  — MISSING — run: npm start (indexes created on startup)`);
        idxFail++;
      }
    } catch (err) {
      console.log(`  ✖  ${collName}  — index check failed: ${err.message}`);
      idxFail++;
    }
  }

  // ── 4. Data sanity check (only if seeded) ──────────────────────────────
  const empCount = await db.collection('employees_raw').countDocuments();
  if (empCount > 0) {
    console.log('\nData sanity:\n');
    const attCount  = await db.collection('attendance_daily').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    const jobCount  = await db.collection('job_logs').countDocuments();

    console.log(`  Employees    : ${empCount}`);
    console.log(`  Attendance   : ${attCount}  (expected ~${empCount * 90} for 90-day seed)`);
    console.log(`  System users : ${userCount}  (expected 3)`);
    console.log(`  Job logs     : ${jobCount}`);

    if (userCount < 3)  console.log('  ⚠  Less than 3 system users — re-run: npm run seed');
    if (attCount === 0) console.log('  ⚠  No attendance data — run: npm run seed');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Collections : ${collPass} ok  |  ${collFail} missing`);
  console.log(`  Indexes     : ${idxPass} ok  |  ${idxFail} missing`);

  await mongoose.disconnect();

  if (collFail > 0 || idxFail > 0) {
    console.log('\n  Action required — see items marked ✖ above.\n');
    process.exit(1);
  } else {
    console.log('\n  Database is healthy.\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});