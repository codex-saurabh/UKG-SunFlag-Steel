/**
 * server/src/scheduler/index.js
 *
 * Cron runner — reads JOB_REGISTRY and starts each enabled job.
 * Job definitions (name, expression, fn) live in scheduler/registry.js.
 */

const cron     = require('node-cron');
const logger   = require('../logger');
const registry = require('./registry');

const activeTasks = new Map(); // jobName → cron.ScheduledTask

function startAll() {
  for (const job of registry) {
    if (!job.enabled) {
      logger.info(`[scheduler] Skipped (disabled): ${job.name}`);
      continue;
    }

    if (!cron.validate(job.expression)) {
      logger.error(`[scheduler] Invalid cron expression for "${job.name}": ${job.expression}`);
      continue;
    }

    const task = cron.schedule(job.expression, async () => {
      logger.info(`[scheduler] ▶ Starting: ${job.name}`);
      try {
        await job.fn();
      } catch (err) {
        // Services handle their own job_log entries.
        // This catch is a final safety net only.
        logger.error(`[scheduler] ✖ Unhandled error in ${job.name}`, { error: err.message });
      }
    });

    activeTasks.set(job.name, task);
    logger.info(`[scheduler] ✔ Registered: ${job.name}  (${job.expression})`);

    // Run immediately on startup if configured
    if (job.runOnStart) {
      logger.info(`[scheduler] Running on startup: ${job.name}`);
      job.fn().catch(err =>
        logger.error(`[scheduler] Startup run failed: ${job.name}`, { error: err.message })
      );
    }
  }

  logger.info(`[scheduler] ${activeTasks.size} jobs active`);
}

function stopAll() {
  for (const [name, task] of activeTasks) {
    task.stop();
    logger.info(`[scheduler] Stopped: ${name}`);
  }
  activeTasks.clear();
}

function getStatus() {
  return registry.map(job => ({
    name:     job.name,
    enabled:  job.enabled,
    cron:     job.expression,
    running:  activeTasks.has(job.name),
  }));
}

module.exports = { startAll, stopAll, getStatus };
