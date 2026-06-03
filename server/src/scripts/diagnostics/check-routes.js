/**
 * server/src/scripts/diagnostics/check-routes.js
 *
 * Starts the Express app (without the DB or cron) and verifies that
 * every route is registered and responds with the expected HTTP status.
 *
 * What each status means here:
 *   401 — route exists, auth guard is working (no token sent)
 *   400 — route exists, validation is working (bad input sent)
 *   404 — route does NOT exist (a real problem)
 *   200 — route exists and is publicly accessible (only /ping and /auth/login)
 *
 * Usage:  node src/scripts/diagnostics/check-routes.js
 *
 * NOTE: This does NOT need MongoDB to be running.
 *       It only tests route registration, not business logic.
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const http   = require('http');
const app    = require('../../app');

const PORT   = 5099; // use a test port so it does not conflict with the real server

// [ method, path, expectedStatus, description ]
const ROUTE_CHECKS = [
  // Public
  ['GET',  '/ping',                              200, 'Health check — no auth'],
  // Auth
  ['POST', '/api/v1/auth/login',                 400, 'Login — missing body → validation 400'],
  ['GET',  '/api/v1/auth/me',                    401, 'Get me — no token → 401'],
  // Attendance — all require auth
  ['GET',  '/api/v1/attendance/today',           401, 'Attendance today — no token'],
  ['GET',  '/api/v1/attendance/daily',           401, 'Attendance daily — no token'],
  ['GET',  '/api/v1/attendance/monthly',         401, 'Attendance monthly — no token'],
  ['GET',  '/api/v1/attendance/miss-punch',      401, 'Miss punch — no token'],
  ['GET',  '/api/v1/attendance/overtime',        401, 'Overtime — no token'],
  ['GET',  '/api/v1/attendance/department-breakdown', 401, 'Dept breakdown — no token'],
  // Analytics
  ['GET',  '/api/v1/analytics/dashboard',        401, 'Dashboard KPIs — no token'],
  ['GET',  '/api/v1/analytics/trend',            401, 'Trend — no token'],
  ['GET',  '/api/v1/analytics/shift-breakdown',  401, 'Shift breakdown — no token'],
  ['GET',  '/api/v1/analytics/dept-rate',        401, 'Dept rate — no token'],
  // Employees
  ['GET',  '/api/v1/employees',                  401, 'Employees list — no token'],
  ['GET',  '/api/v1/employees/departments',      401, 'Departments — no token'],
  ['GET',  '/api/v1/employees/EMP1001',          401, 'Employee detail — no token'],
  // Exports
  ['GET',  '/api/v1/exports/monthly-attendance', 401, 'Export monthly — no token'],
  ['GET',  '/api/v1/exports/overtime',           401, 'Export overtime — no token'],
  // Monitoring
  ['GET',  '/api/v1/monitoring/health',          401, 'System health — no token'],
  ['GET',  '/api/v1/monitoring/jobs',            401, 'Jobs overview — no token'],
  ['GET',  '/api/v1/monitoring/job-logs',        401, 'Job logs — no token'],
  ['GET',  '/api/v1/monitoring/audit-logs',      401, 'Audit logs — no token'],
  ['POST', '/api/v1/monitoring/jobs/trigger/attendance-live', 401, 'Trigger job — no token'],
  // Non-existent routes → 404
  ['GET',  '/api/v1/nonexistent',                404, 'Unknown route → 404'],
  ['GET',  '/api/v2/anything',                   404, 'Unknown version → 404'],
];

function request(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port:     PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, res => {
      res.resume(); // drain
      resolve(res.statusCode);
    });
    req.on('error', reject);
    if (method === 'POST') req.write('{}');
    req.end();
  });
}

async function run() {
  console.log('\n━━━━  Route Check  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Start server on test port (no DB, no cron — app.js only)
  const server = http.createServer(app);
  await new Promise(r => server.listen(PORT, r));
  console.log(`  Test server started on port ${PORT}\n`);

  let passed = 0, failed = 0;
  const errors = [];

  for (const [method, path, expected, desc] of ROUTE_CHECKS) {
    try {
      const status = await request(method, path);
      if (status === expected) {
        console.log(`  ✔  ${method.padEnd(5)} ${path.padEnd(50)} ${status}  ${desc}`);
        passed++;
      } else {
        console.log(`  ✖  ${method.padEnd(5)} ${path.padEnd(50)} got ${status}, expected ${expected}  — ${desc}`);
        errors.push({ method, path, expected, got: status, desc });
        failed++;
      }
    } catch (err) {
      console.log(`  ✖  ${method.padEnd(5)} ${path.padEnd(50)} REQUEST ERROR: ${err.message}`);
      errors.push({ method, path, error: err.message });
      failed++;
    }
  }

  server.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Result: ${passed} passed  |  ${failed} failed`);

  if (errors.length > 0) {
    console.log('\n  Issues found:');
    for (const e of errors) {
      console.log(`    ${e.method} ${e.path} — ${e.error || `expected ${e.expected}, got ${e.got}`}`);
    }
    console.log('');
    process.exit(1);
  } else {
    console.log('\n  All routes responding correctly.\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});