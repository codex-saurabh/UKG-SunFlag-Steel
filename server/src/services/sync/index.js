/**
 * server/src/services/sync/index.js
 *
 * Public API of the sync service.
 * Uses ukgClient.js for HTTP calls and hasher.js for change detection.
 * Called by scheduler/registry.js and monitoring controller (manual trigger).
 */

const Employee   = require('../../models/Employee');
const { PunchRaw } = require('../../models/Attendance');
const { Leave, ShiftSchedule, JobLog } = require('../../models/index');
const { JOB_STATUS, SYNC_SOURCE }      = require('../../config/constants');
const logger     = require('../../logger');
const ukgClient  = require('./ukgClient');
const { hashRecord, hasChanged } = require('./hasher');

// ── Job log helpers ───────────────────────────────────────────────────────────

async function startLog(jobName) {
  return JobLog.create({ jobName, status: JOB_STATUS.RUNNING, startedAt: new Date() });
}

async function endLog(logDoc, { processed = 0, created = 0, updated = 0, error, meta } = {}) {
  const endedAt    = new Date();
  const durationMs = endedAt - logDoc.startedAt;

  await JobLog.findByIdAndUpdate(logDoc._id, {
    status:           error ? JOB_STATUS.FAILED : JOB_STATUS.SUCCESS,
    endedAt,
    durationMs,
    recordsProcessed: processed,
    recordsCreated:   created,
    recordsUpdated:   updated,
    error:            error   || undefined,
    meta:             meta    || undefined,
  });
}

async function skipLog(logDoc, reason) {
  await JobLog.findByIdAndUpdate(logDoc._id, {
    status:   JOB_STATUS.SKIPPED,
    endedAt:  new Date(),
    durationMs: Date.now() - logDoc.startedAt,
    meta:     { reason },
  });
}

// ── Sync functions ────────────────────────────────────────────────────────────

async function syncEmployees() {
  const log = await startLog('employee_sync');
  try {
    const records = await ukgClient.fetchEmployees();

    if (records.length === 0) {
      await skipLog(log, 'UKG_API_AVAILABLE=false — using seeded data');
      return;
    }

    let created = 0, updated = 0;
    for (const r of records) {
      const ukgHash  = hashRecord(r);
      const existing = await Employee.findOne({ ukgId: r.ukgId }).lean();

      if (!existing) {
        await Employee.create({ ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API, lastSyncedAt: new Date() });
        created++;
      } else if (hasChanged(r, existing.ukgHash)) {
        await Employee.updateOne({ ukgId: r.ukgId }, { ...r, ukgHash, lastSyncedAt: new Date() });
        updated++;
      }
    }

    logger.info(`[sync] employee_sync — ${created} created, ${updated} updated`);
    await endLog(log, { processed: records.length, created, updated });
  } catch (err) {
    logger.error('[sync] employee_sync failed', { error: err.message });
    await endLog(log, { error: err.message });
  }
}

async function syncAttendanceLive() {
  const log = await startLog('attendance_live_sync');
  try {
    const now      = new Date();
    const fromDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // last 2 hours
    const records  = await ukgClient.fetchPunches({ fromDate, toDate: now });

    if (records.length === 0) {
      await skipLog(log, 'UKG_API_AVAILABLE=false — using seeded data');
      return;
    }

    let created = 0;
    for (const r of records) {
      const ukgHash = hashRecord(r);
      try {
        await PunchRaw.findOneAndUpdate(
          { employeeCode: r.employeeCode, punchTime: r.punchTime, punchType: r.punchType },
          { ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API },
          { upsert: true }
        );
        created++;
      } catch (_) { /* duplicate key — expected, skip */ }
    }

    logger.info(`[sync] attendance_live_sync — ${created} punches processed`);
    await endLog(log, { processed: records.length, created });
  } catch (err) {
    logger.error('[sync] attendance_live_sync failed', { error: err.message });
    await endLog(log, { error: err.message });
  }
}

async function syncLeaves() {
  const log = await startLog('leave_sync');
  try {
    const now      = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const records  = await ukgClient.fetchLeaves({ fromDate, toDate: now });

    if (records.length === 0) {
      await skipLog(log, 'UKG_API_AVAILABLE=false — using seeded data');
      return;
    }

    let created = 0, updated = 0;
    for (const r of records) {
      const ukgHash  = hashRecord(r);
      const existing = await Leave.findOne({ ukgLeaveId: r.ukgLeaveId }).lean();

      if (!existing) {
        await Leave.create({ ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API });
        created++;
      } else if (hasChanged(r, existing.ukgHash)) {
        await Leave.updateOne({ ukgLeaveId: r.ukgLeaveId }, { ...r, ukgHash });
        updated++;
      }
    }

    logger.info(`[sync] leave_sync — ${created} created, ${updated} updated`);
    await endLog(log, { processed: records.length, created, updated });
  } catch (err) {
    logger.error('[sync] leave_sync failed', { error: err.message });
    await endLog(log, { error: err.message });
  }
}

async function syncShifts() {
  const log = await startLog('shift_sync');
  try {
    const now      = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const records  = await ukgClient.fetchShiftSchedules({ fromDate, toDate: now });

    if (records.length === 0) {
      await skipLog(log, 'UKG_API_AVAILABLE=false — using seeded data');
      return;
    }

    let created = 0, updated = 0;
    for (const r of records) {
      const ukgHash  = hashRecord(r);
      const existing = await ShiftSchedule.findOne({ employeeCode: r.employeeCode, dateStr: r.dateStr }).lean();

      if (!existing) {
        await ShiftSchedule.create({ ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API });
        created++;
      } else if (hasChanged(r, existing.ukgHash)) {
        await ShiftSchedule.updateOne({ employeeCode: r.employeeCode, dateStr: r.dateStr }, { ...r, ukgHash });
        updated++;
      }
    }

    logger.info(`[sync] shift_sync — ${created} created, ${updated} updated`);
    await endLog(log, { processed: records.length, created, updated });
  } catch (err) {
    logger.error('[sync] shift_sync failed', { error: err.message });
    await endLog(log, { error: err.message });
  }
}

module.exports = { syncEmployees, syncAttendanceLive, syncLeaves, syncShifts };

// /**
//  * server/src/services/sync/index.js
//  *
//  * UKG Sync Engine
//  * ───────────────
//  * The public API of this module (syncAttendance, syncEmployees, etc.)
//  * is the same regardless of whether we're hitting the real UKG API or
//  * returning seeded data.
//  *
//  * When UKG_API_AVAILABLE=false  →  ukgClient returns empty arrays (data
//  *   already lives in MongoDB from the seed script; jobs log as 'skipped').
//  *
//  * When UKG_API_AVAILABLE=true  →  ukgClient makes real HTTP calls and
//  *   the upsert logic writes/updates records. No other file changes.
//  */

// const crypto = require('crypto');
// const Employee = require('../../models/Employee');
// const { PunchRaw, AttendanceDaily } = require('../../models/Attendance');
// const { Leave, ShiftSchedule, JobLog } = require('../../models/index');
// const env = require('../../config/env');
// const logger = require('../../logger');
// const { JOB_STATUS, SYNC_SOURCE } = require('../../config/constants');

// // ─── UKG HTTP client (stub until API is available) ────────────────────────────

// const ukgClient = {
//   /**
//    * Fetch employees from UKG.
//    * Replace this body with real axios calls when API is ready.
//    */
//   async fetchEmployees() {
//     if (!env.UKG_API_AVAILABLE) return [];
//     // TODO: implement when UKG credentials arrive
//     // const res = await axios.get(`${env.UKG_BASE_URL}/personnel/v1/employees`, { headers: await getHeaders() });
//     // return res.data.data;
//     return [];
//   },

//   async fetchPunches({ fromDate, toDate }) {
//     if (!env.UKG_API_AVAILABLE) return [];
//     // TODO: implement
//     return [];
//   },

//   async fetchLeaves({ fromDate, toDate }) {
//     if (!env.UKG_API_AVAILABLE) return [];
//     // TODO: implement
//     return [];
//   },

//   async fetchShiftSchedules({ fromDate, toDate }) {
//     if (!env.UKG_API_AVAILABLE) return [];
//     // TODO: implement
//     return [];
//   },
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function makeHash(obj) {
//   return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
// }

// async function startJobLog(jobName) {
//   return JobLog.create({ jobName, status: JOB_STATUS.RUNNING, startedAt: new Date() });
// }

// async function endJobLog(logDoc, result) {
//   const endedAt = new Date();
//   Object.assign(logDoc, {
//     status:          result.error ? JOB_STATUS.FAILED : JOB_STATUS.SUCCESS,
//     endedAt,
//     durationMs:      endedAt - logDoc.startedAt,
//     recordsProcessed:result.processed || 0,
//     recordsCreated:  result.created   || 0,
//     recordsUpdated:  result.updated   || 0,
//     error:           result.error     || undefined,
//     meta:            result.meta      || undefined,
//   });
//   await logDoc.save();
// }

// // ─── Sync functions ───────────────────────────────────────────────────────────

// async function syncEmployees() {
//   const log = await startJobLog('employee_sync');
//   let created = 0, updated = 0;

//   try {
//     const records = await ukgClient.fetchEmployees();

//     if (records.length === 0) {
//       log.status = JOB_STATUS.SKIPPED;
//       log.endedAt = new Date();
//       log.meta = { reason: 'UKG_API_AVAILABLE=false — using seeded data' };
//       await log.save();
//       logger.info('[sync] employee_sync skipped — UKG API not available');
//       return;
//     }

//     for (const r of records) {
//       const ukgHash = makeHash(r);
//       const existing = await Employee.findOne({ ukgId: r.ukgId });

//       if (!existing) {
//         await Employee.create({ ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API, lastSyncedAt: new Date() });
//         created++;
//       } else if (existing.ukgHash !== ukgHash) {
//         await Employee.updateOne({ ukgId: r.ukgId }, { ...r, ukgHash, lastSyncedAt: new Date() });
//         updated++;
//       }
//     }

//     logger.info(`[sync] employee_sync done — ${created} created, ${updated} updated`);
//     await endJobLog(log, { processed: records.length, created, updated });
//   } catch (err) {
//     logger.error('[sync] employee_sync failed', { error: err.message });
//     await endJobLog(log, { error: err.message });
//   }
// }

// async function syncAttendanceLive() {
//   const log = await startJobLog('attendance_live_sync');

//   try {
//     const now = new Date();
//     const fromDate = new Date(now - 2 * 60 * 60 * 1000); // last 2 hours
//     const records = await ukgClient.fetchPunches({ fromDate, toDate: now });

//     if (records.length === 0) {
//       log.status = JOB_STATUS.SKIPPED;
//       log.endedAt = new Date();
//       log.meta = { reason: 'UKG_API_AVAILABLE=false — using seeded data' };
//       await log.save();
//       return;
//     }

//     let created = 0;
//     for (const r of records) {
//       const ukgHash = makeHash(r);
//       try {
//         await PunchRaw.findOneAndUpdate(
//           { employeeCode: r.employeeCode, punchTime: r.punchTime, punchType: r.punchType },
//           { ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API },
//           { upsert: true, new: true }
//         );
//         created++;
//       } catch (dupErr) {
//         // duplicate — expected, ignore
//       }
//     }

//     logger.info(`[sync] attendance_live_sync done — ${created} punches processed`);
//     await endJobLog(log, { processed: records.length, created });
//   } catch (err) {
//     logger.error('[sync] attendance_live_sync failed', { error: err.message });
//     await endJobLog(log, { error: err.message });
//   }
// }

// async function syncLeaves() {
//   const log = await startJobLog('leave_sync');

//   try {
//     const now = new Date();
//     const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const records = await ukgClient.fetchLeaves({ fromDate, toDate: now });

//     if (records.length === 0) {
//       log.status = JOB_STATUS.SKIPPED;
//       log.endedAt = new Date();
//       log.meta = { reason: 'UKG_API_AVAILABLE=false — using seeded data' };
//       await log.save();
//       return;
//     }

//     let created = 0, updated = 0;
//     for (const r of records) {
//       const ukgHash = makeHash(r);
//       await Leave.findOneAndUpdate(
//         { ukgLeaveId: r.ukgLeaveId },
//         { ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API },
//         { upsert: true }
//       );
//     }

//     await endJobLog(log, { processed: records.length, created, updated });
//   } catch (err) {
//     logger.error('[sync] leave_sync failed', { error: err.message });
//     await endJobLog(log, { error: err.message });
//   }
// }

// async function syncShifts() {
//   const log = await startJobLog('shift_sync');

//   try {
//     const now = new Date();
//     const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
//     const records = await ukgClient.fetchShiftSchedules({ fromDate, toDate: now });

//     if (records.length === 0) {
//       log.status = JOB_STATUS.SKIPPED;
//       log.endedAt = new Date();
//       log.meta = { reason: 'UKG_API_AVAILABLE=false — using seeded data' };
//       await log.save();
//       return;
//     }

//     for (const r of records) {
//       const ukgHash = makeHash(r);
//       await ShiftSchedule.findOneAndUpdate(
//         { employeeCode: r.employeeCode, date: r.date },
//         { ...r, ukgHash, syncSource: SYNC_SOURCE.UKG_API },
//         { upsert: true }
//       );
//     }

//     await endJobLog(log, { processed: records.length });
//   } catch (err) {
//     logger.error('[sync] shift_sync failed', { error: err.message });
//     await endJobLog(log, { error: err.message });
//   }
// }

// module.exports = {
//   syncEmployees,
//   syncAttendanceLive,
//   syncLeaves,
//   syncShifts,
// };
