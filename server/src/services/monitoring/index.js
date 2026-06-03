/**
 * server/src/services/monitoring/index.js
 *
 * Public API of the monitoring service.
 * Orchestrates healthCheck.js and backupRunner.js.
 * Controllers import only from here.
 */

const { runAllChecks } = require('./healthCheck');
const { runBackup, cleanOldBackups, listBackups } = require('./backupRunner');
const { JobLog, AuditLog } = require('../../models/index');
const { JOB_NAMES } = require('../../config/constants');

// ─── System health ─────────────────────────────────────────────────────────
async function getSystemHealth() {
  return runAllChecks();
}

// ─── Job overview ──────────────────────────────────────────────────────────
async function getJobsOverview() {
  const jobNames = Object.values(JOB_NAMES);

  const [latestRuns, failureCounts] = await Promise.all([
    JobLog.aggregate([
      { $sort: { startedAt: -1 } },
      { $group: { _id: '$jobName', latest: { $first: '$$ROOT' } } },
    ]),
    JobLog.aggregate([
      {
        $match: {
          status:    'failed',
          startedAt: { $gte: new Date(Date.now() - 86400000) },
        },
      },
      { $group: { _id: '$jobName', count: { $sum: 1 } } },
    ]),
  ]);

  const latestMap  = Object.fromEntries(latestRuns.map(r  => [r._id, r.latest]));
  const failureMap = Object.fromEntries(failureCounts.map(r => [r._id, r.count]));

  return jobNames.map(name => ({
    jobName:          name,
    lastStatus:       latestMap[name]?.status    || 'never_run',
    lastRunAt:        latestMap[name]?.startedAt || null,
    lastDurationMs:   latestMap[name]?.durationMs|| null,
    failuresLast24h:  failureMap[name]           || 0,
    lastError:        latestMap[name]?.error      || null,
  }));
}

// ─── Job logs ──────────────────────────────────────────────────────────────
async function getJobLogs({ jobName, status, skip, limit }) {
  const match = {};
  if (jobName) match.jobName = jobName;
  if (status)  match.status  = status;

  const [logs, total] = await Promise.all([
    JobLog.find(match).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
    JobLog.countDocuments(match),
  ]);
  return { logs, total };
}

// ─── Audit logs ────────────────────────────────────────────────────────────
async function getAuditLogs({ userId, action, skip, limit }) {
  const match = {};
  if (userId) match.userId = userId;
  if (action) match.action = new RegExp(action, 'i');

  const [logs, total] = await Promise.all([
    AuditLog.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(match),
  ]);
  return { logs, total };
}

// ─── Audit write ───────────────────────────────────────────────────────────
async function writeAudit({ userId, userName, role, action, entity, entityId, meta, ip, userAgent }) {
  try {
    await AuditLog.create({ userId, userName, role, action, entity, entityId, meta, ip, userAgent });
  } catch (_) {
    // Audit failures must never crash a request
  }
}

// ─── Backup operations ─────────────────────────────────────────────────────
async function triggerBackup()    { return runBackup(); }
async function runBackupCleanup() { return cleanOldBackups(); }
async function getBackupList()    { return listBackups(); }

module.exports = {
  getSystemHealth,
  getJobsOverview,
  getJobLogs,
  getAuditLogs,
  writeAudit,
  triggerBackup,
  runBackupCleanup,
  getBackupList,
};

// const mongoose = require('mongoose');
// const os = require('os');
// const fs = require('fs');
// const path = require('path');
// const { JobLog, AuditLog } = require('../../models/index');
// const { JOB_NAMES } = require('../../config/constants');
// const env = require('../../config/env');

// /**
//  * System health — MongoDB, disk, memory, uptime
//  */
// async function getSystemHealth() {
//   const dbState = mongoose.connection.readyState;
//   const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

//   // Disk check on export dir
//   let diskOk = true;
//   try {
//     fs.accessSync(path.resolve(env.EXPORT_DIR), fs.constants.W_OK);
//   } catch { diskOk = false; }

//   const totalMem = os.totalmem();
//   const freeMem  = os.freemem();
//   const memUsedPct = Math.round(((totalMem - freeMem) / totalMem) * 100);

//   return {
//     status: dbState === 1 ? 'healthy' : 'degraded',
//     mongodb: {
//       status: dbStatus[dbState] || 'unknown',
//       host: mongoose.connection.host || null,
//       name: mongoose.connection.name || null,
//     },
//     server: {
//       uptime:      Math.round(process.uptime()),
//       uptimeHuman: formatUptime(process.uptime()),
//       nodeVersion: process.version,
//       platform:    os.platform(),
//       hostname:    os.hostname(),
//       cpus:        os.cpus().length,
//       memUsedPct,
//       memFreeGB:   +(freeMem  / 1e9).toFixed(2),
//       memTotalGB:  +(totalMem / 1e9).toFixed(2),
//     },
//     disk: { exportDirWritable: diskOk },
//     checkedAt: new Date(),
//   };
// }

// /**
//  * Job status overview — last run of each known job + failure count
//  */
// async function getJobsOverview() {
//   const jobNames = Object.values(JOB_NAMES);

//   const [latestRuns, failureCounts] = await Promise.all([
//     // Latest run per job
//     JobLog.aggregate([
//       { $sort: { startedAt: -1 } },
//       { $group: { _id: '$jobName', latest: { $first: '$$ROOT' } } },
//     ]),
//     // Failures in last 24h
//     JobLog.aggregate([
//       {
//         $match: {
//           status: 'failed',
//           startedAt: { $gte: new Date(Date.now() - 86400000) },
//         },
//       },
//       { $group: { _id: '$jobName', count: { $sum: 1 } } },
//     ]),
//   ]);

//   const latestMap   = Object.fromEntries(latestRuns.map(r => [r._id, r.latest]));
//   const failureMap  = Object.fromEntries(failureCounts.map(r => [r._id, r.count]));

//   return jobNames.map(name => {
//     const latest = latestMap[name];
//     return {
//       jobName:       name,
//       lastStatus:    latest?.status    || 'never_run',
//       lastRunAt:     latest?.startedAt || null,
//       lastDurationMs:latest?.durationMs|| null,
//       failuresLast24h: failureMap[name] || 0,
//       lastError:     latest?.error     || null,
//     };
//   });
// }

// /**
//  * Recent job logs with pagination
//  */
// async function getJobLogs({ jobName, status, page, limit, skip }) {
//   const match = {};
//   if (jobName) match.jobName = jobName;
//   if (status)  match.status  = status;

//   const [logs, total] = await Promise.all([
//     JobLog.find(match).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
//     JobLog.countDocuments(match),
//   ]);

//   return { logs, total };
// }

// /**
//  * Audit log list
//  */
// async function getAuditLogs({ userId, action, page, limit, skip }) {
//   const match = {};
//   if (userId) match.userId = userId;
//   if (action) match.action = new RegExp(action, 'i');

//   const [logs, total] = await Promise.all([
//     AuditLog.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
//     AuditLog.countDocuments(match),
//   ]);

//   return { logs, total };
// }

// /**
//  * Write an audit log entry — called from controllers
//  */
// async function writeAudit({ userId, userName, role, action, entity, entityId, meta, ip, userAgent }) {
//   try {
//     await AuditLog.create({ userId, userName, role, action, entity, entityId, meta, ip, userAgent });
//   } catch (_) {
//     // Audit log failures must never crash a request
//   }
// }

// function formatUptime(seconds) {
//   const d = Math.floor(seconds / 86400);
//   const h = Math.floor((seconds % 86400) / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   return `${d}d ${h}h ${m}m`;
// }

// module.exports = {
//   getSystemHealth,
//   getJobsOverview,
//   getJobLogs,
//   getAuditLogs,
//   writeAudit,
// };
