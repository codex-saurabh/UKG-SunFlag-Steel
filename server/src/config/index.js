/**
 * server/src/config/index.js
 *
 * Barrel export — import any config value from '@/config' or '../config'
 * instead of drilling into individual files.
 *
 * Usage:
 *   const { env, corsOptions, ROLES } = require('../config');
 */

const env         = require('./env');
const corsOptions = require('./cors');
const {
  ROLES,
  SHIFTS,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  DEPARTMENTS,
  DESIGNATIONS,
  OT_MIN_HOURS,
  JOB_NAMES,
  JOB_STATUS,
  SYNC_SOURCE,
} = require('./constants');

module.exports = {
  env,
  corsOptions,
  ROLES,
  SHIFTS,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  DEPARTMENTS,
  DESIGNATIONS,
  OT_MIN_HOURS,
  JOB_NAMES,
  JOB_STATUS,
  SYNC_SOURCE,
};
