/**
 * server/src/database/connection.js
 *
 * MongoDB connection handler.
 * Options and URI come from config/connection.js.
 */

const mongoose = require('mongoose');
const dbConfig = require('../config/connection');
const logger   = require('../logger');

async function connect(retries = dbConfig.retryAttempts) {
  try {
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    logger.info(`MongoDB connected → ${mongoose.connection.host} / ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    if (retries > 0) {
      logger.warn(
        `MongoDB connection failed. Retrying in ${dbConfig.retryDelayMs / 1000}s... (${retries} left)`,
        { error: err.message }
      );
      await new Promise(r => setTimeout(r, dbConfig.retryDelayMs));
      return connect(retries - 1);
    }
    logger.error('MongoDB connection permanently failed', { error: err.message });
    throw err;
  }
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));
mongoose.connection.on('error',        err => logger.error('MongoDB error', { error: err.message }));

async function disconnect() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connect, disconnect, isConnected };
