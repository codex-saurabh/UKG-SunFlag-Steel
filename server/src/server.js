/**
 * server/src/server.js
 *
 * Entry point — sole responsibilities:
 *   1. Connect to MongoDB
 *   2. Ensure indexes
 *   3. Start cron scheduler
 *   4. Start HTTP server
 *   5. Handle graceful shutdown
 */

const app       = require('./app');
const { connect, disconnect } = require('./database/connection');
const { ensureIndexes }       = require('./database/indexes');
const scheduler               = require('./scheduler');
const env                     = require('./config/env');
const logger                  = require('./logger');

// Safety net — if process exits with no output at all,
// these catch anything Winston missed before it was initialized
process.on('uncaughtException',  err => { console.error('[FATAL] Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', err => { console.error('[FATAL] Unhandled Rejection:', err); process.exit(1); });

async function start() {
  // Use console.log here deliberately — logger may not be ready yet
  console.log(`[server] Starting HR Analytics API (${env.NODE_ENV})...`);
  console.log(`[server] MongoDB URI: ${env.MONGO_URI}`);
  console.log(`[server] Port: ${env.PORT}`);

  try {
    // 1. Database
    console.log('[server] Connecting to MongoDB...');
    await connect();

    // 2. Indexes
    console.log('[server] Ensuring indexes...');
    await ensureIndexes();

    // 3. Cron jobs
    console.log('[server] Starting scheduler...');
    scheduler.startAll();

    // 4. HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`  HR Analytics API  —  http://localhost:${env.PORT}`);
      logger.info(`  Environment  : ${env.NODE_ENV}`);
      logger.info(`  MongoDB      : ${require('mongoose').connection.host}`);
      logger.info(`  UKG API      : ${env.UKG_API_AVAILABLE ? '🟢 LIVE' : '🟡 SEED MODE'}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    server.on('error', (err) => {
      // Catches port-in-use and other listen errors
      console.error(`[server] Failed to bind port ${env.PORT}:`, err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`[server] Port ${env.PORT} is already in use. Stop the other process or change PORT in .env`);
      }
      process.exit(1);
    });

    // 5. Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        scheduler.stopAll();
        await disconnect();
        logger.info('Shutdown complete');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    // This is the critical block — log to both console AND file
    console.error('[server] STARTUP FAILED:', err.message);
    console.error(err.stack);
    logger.error('Server failed to start', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
