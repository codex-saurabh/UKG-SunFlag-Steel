/**
 * server/src/scripts/diagnostics/check-imports.js
 *
 * Verifies every backend file can be loaded without import errors.
 * Run this after adding new files or changing require() paths.
 *
 * Usage:  node src/scripts/diagnostics/check-imports.js
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const files = [
  // Config
  '../../config/env',
  '../../config/constants',
  '../../config/cors',
  '../../config/connection',
  '../../config/index',
  // Database
  '../../database/connection',
  '../../database/indexes',
  // Logger
  '../../logger/index',
  '../../logger/streams',
  // Middleware
  '../../middleware/authenticate',
  '../../middleware/authorize',
  '../../middleware/errorHandler',
  '../../middleware/index',
  // Models
  '../../models/Employee',
  '../../models/Attendance',
  '../../models/AuditLog',
  '../../models/index',
  // Utils
  '../../utils/date',
  '../../utils/paginate',
  '../../utils/response',
  '../../utils/index',
  // Validators
  '../../validators/attendance.schema',
  '../../validators/export.schema',
  '../../validators/index',
  // Services
  '../../services/auth/tokens',
  '../../services/auth/index',
  '../../services/sync/hasher',
  '../../services/sync/ukgClient',
  '../../services/sync/index',
  '../../services/attendance/normalizer',
  '../../services/attendance/shiftResolver',
  '../../services/attendance/index',
  '../../services/analytics/cache',
  '../../services/analytics/kpis',
  '../../services/analytics/index',
  '../../services/exports/excel',
  '../../services/exports/pdf',
  '../../services/exports/index',
  '../../services/monitoring/healthCheck',
  '../../services/monitoring/backupRunner',
  '../../services/monitoring/index',
  // Controllers
  '../../controllers/auth',
  '../../controllers/attendance',
  '../../controllers/analytics',
  '../../controllers/employees',
  '../../controllers/exports',
  '../../controllers/monitoring',
  // Routes
  '../../routes/auth',
  '../../routes/attendance',
  '../../routes/analytics',
  '../../routes/employees',
  '../../routes/exports',
  '../../routes/monitoring',
  '../../routes/index',
  // Scheduler
  '../../scheduler/registry',
  '../../scheduler/index',
  // App
  '../../app',
];

let passed = 0;
let failed = 0;
const errors = [];

console.log('\n━━━━  Import Check  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const file of files) {
  try {
    require(file);
    console.log(`  ✔  ${file}`);
    passed++;
  } catch (err) {
    console.log(`  ✖  ${file}`);
    console.log(`       → ${err.message}`);
    errors.push({ file, error: err.message, stack: err.stack });
    failed++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Result: ${passed} passed  |  ${failed} failed`);

if (errors.length > 0) {
  console.log('\n━━━━  Error Details  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  for (const { file, stack } of errors) {
    console.log(`File: ${file}`);
    console.log(stack);
    console.log('');
  }
  process.exit(1);
} else {
  console.log('  All imports clean.\n');
  process.exit(0);
}