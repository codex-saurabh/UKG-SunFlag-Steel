/**
 * server/src/services/monitoring/healthCheck.js
 *
 * System health checks — MongoDB status, memory, disk, uptime.
 * Called by monitoring/index.js, not directly by controllers.
 */

const mongoose = require('mongoose');
const os   = require('os');
const fs   = require('fs');
const path = require('path');
const env  = require('../../config/env');
const { formatUptime } = require('../../utils/date');

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * checkMongoDB()
 * Returns MongoDB connection status and basic stats.
 */
async function checkMongoDB() {
  const state = mongoose.connection.readyState;
  const status = DB_STATES[state] || 'unknown';

  let stats = null;
  if (state === 1) {
    try {
      stats = await mongoose.connection.db.stats();
    } catch (_) { /* non-critical */ }
  }

  return {
    status,
    isHealthy: state === 1,
    host:      mongoose.connection.host  || null,
    dbName:    mongoose.connection.name  || null,
    collections: stats?.collections      || null,
    dataSize:    stats ? `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB` : null,
  };
}

/**
 * checkMemory()
 * Returns OS memory usage as percentages and absolute values.
 */
function checkMemory() {
  const total = os.totalmem();
  const free  = os.freemem();
  const used  = total - free;

  return {
    totalGB:  +(total / 1e9).toFixed(2),
    usedGB:   +(used  / 1e9).toFixed(2),
    freeGB:   +(free  / 1e9).toFixed(2),
    usedPct:  Math.round((used / total) * 100),
    isHealthy: Math.round((used / total) * 100) < 90,
  };
}

/**
 * checkDisk()
 * Verifies the export directory is writable.
 */
function checkDisk() {
  const exportDir = path.resolve(env.EXPORT_DIR);
  let writable = false;

  try {
    fs.accessSync(exportDir, fs.constants.W_OK);
    writable = true;
  } catch (_) { /* not writable */ }

  return {
    exportDir,
    writable,
    isHealthy: writable,
  };
}

/**
 * checkServer()
 * Returns Node.js process info and server uptime.
 */
function checkServer() {
  const uptimeSeconds = process.uptime();
  return {
    uptime:      Math.round(uptimeSeconds),
    uptimeHuman: formatUptime(uptimeSeconds),
    nodeVersion: process.version,
    platform:    os.platform(),
    arch:        os.arch(),
    hostname:    os.hostname(),
    cpuCount:    os.cpus().length,
    pid:         process.pid,
  };
}

/**
 * runAllChecks()
 * Runs all health checks and returns a unified health report.
 */
async function runAllChecks() {
  const [mongodb, memory, disk, server] = await Promise.all([
    checkMongoDB(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkDisk()),
    Promise.resolve(checkServer()),
  ]);

  const overallHealthy = mongodb.isHealthy && disk.isHealthy;

  return {
    status:    overallHealthy ? 'healthy' : 'degraded',
    mongodb,
    memory,
    disk,
    server,
    checkedAt: new Date(),
  };
}

module.exports = { runAllChecks, checkMongoDB, checkMemory, checkDisk, checkServer };