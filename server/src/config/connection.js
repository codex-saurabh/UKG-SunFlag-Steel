// const mongoose = require('mongoose');
// const env = require('../config/env');
// const logger = require('../logger');

// const RETRY_DELAY_MS = 5000;
// const MAX_RETRIES = 5;

// async function connect(retries = MAX_RETRIES) {
//   try {
//     await mongoose.connect(env.MONGO_URI, {
//       serverSelectionTimeoutMS: 5000,
//     });
//     logger.info(`MongoDB connected: ${mongoose.connection.host}`);
//     return mongoose.connection;
//   } catch (err) {
//     if (retries > 0) {
//       logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} attempts left)`);
//       await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
//       return connect(retries - 1);
//     }
//     logger.error('MongoDB connection failed permanently', { error: err.message });
//     throw err;
//   }
// }

// mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
// mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

// async function disconnect() {
//   await mongoose.disconnect();
//   logger.info('MongoDB disconnected gracefully');
// }

// function isConnected() {
//   return mongoose.connection.readyState === 1;
// }

// module.exports = { connect, disconnect, isConnected };

/**
 * server/src/config/connection.js
 *
 * MongoDB connection configuration — options, URI, and pool settings.
 * The actual connect/disconnect logic lives in database/connection.js.
 * This file only exports configuration objects so they can be reused
 * or overridden per environment without touching the connection handler.
 */

const env = require('./env');

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS:          45000,
  maxPoolSize:              10,      // max concurrent connections
  minPoolSize:              2,
  heartbeatFrequencyMS:     10000,
};

const dbConfig = {
  uri:     env.MONGO_URI,
  options: mongooseOptions,
  dbName:  'hr_analytics',           // explicit DB name — not parsed from URI
  retryAttempts:  5,
  retryDelayMs:   5000,
};

module.exports = dbConfig;
