/**
 * server/src/config/env.js
 *
 * Environment variable loader.
 * All other files import from here — never from process.env directly.
 *
 * isDev fix: evaluate isDev AFTER applying the default value,
 * not against the raw process.env which may be undefined.
 */

require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const env = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT) || 5000,

  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/UKG',

  JWT_SECRET:     process.env.JWT_SECRET     || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  UKG_BASE_URL:      process.env.UKG_BASE_URL      || null,
  UKG_CLIENT_ID:     process.env.UKG_CLIENT_ID      || null,
  UKG_CLIENT_SECRET: process.env.UKG_CLIENT_SECRET  || null,
  UKG_COMPANY_ID:    process.env.UKG_COMPANY_ID     || null,
  UKG_API_AVAILABLE: process.env.UKG_API_AVAILABLE === 'true',

  LOG_LEVEL:  process.env.LOG_LEVEL  || 'info',
  LOG_DIR:    process.env.LOG_DIR    || './src/logs',
  EXPORT_DIR: process.env.EXPORT_DIR || './src/exports',
  BACKUP_DIR: process.env.BACKUP_DIR || './src/backups',

  // isDev now correctly uses the resolved NODE_ENV, not raw process.env
  isDev:  NODE_ENV === 'development',
  isProd: NODE_ENV === 'production',
};

module.exports = env;
