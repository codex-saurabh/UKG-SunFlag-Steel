/**
 * server/src/services/monitoring/backupRunner.js
 *
 * MongoDB backup using mongodump.
 * Creates timestamped backup folders under BACKUP_DIR.
 * Cleans up backups older than the retention period.
 */

const { exec }  = require('child_process');
const { promisify } = require('util');
const path = require('fs').promises ? require('path') : require('path');
const fs   = require('fs');
const env  = require('../../config/env');
const logger = require('../../logger');
const { JobLog } = require('../../models/index');

const execAsync = promisify(exec);
const BACKUP_DIR      = path.resolve(env.BACKUP_DIR || './src/backups');
const RETENTION_DAYS  = 30;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

/**
 * runBackup()
 * Executes mongodump and writes result to job_logs.
 * Returns { success, backupPath, durationMs }.
 */
async function runBackup() {
  const startedAt  = new Date();
  const timestamp  = startedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);

  // Derive host/port/dbName from MONGO_URI
  const uri    = env.MONGO_URI;
  const dbName = uri.split('/').pop().split('?')[0] || 'hr_analytics';

  let logDoc;
  try {
    logDoc = await JobLog.create({
      jobName:   'backup',
      status:    'running',
      startedAt,
    });

    logger.info(`[backup] Starting mongodump → ${backupPath}`);

    const cmd = `mongodump --uri="${uri}" --out="${backupPath}" --gzip`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 5 * 60 * 1000 }); // 5 min timeout

    const durationMs = Date.now() - startedAt.getTime();

    await JobLog.findByIdAndUpdate(logDoc._id, {
      status:    'success',
      endedAt:   new Date(),
      durationMs,
      meta:      { backupPath, dbName },
    });

    logger.info(`[backup] Completed in ${durationMs}ms → ${backupPath}`);
    return { success: true, backupPath, durationMs };

  } catch (err) {
    const durationMs = Date.now() - startedAt.getTime();
    logger.error('[backup] Failed', { error: err.message });

    if (logDoc) {
      await JobLog.findByIdAndUpdate(logDoc._id, {
        status:    'failed',
        endedAt:   new Date(),
        durationMs,
        error:     err.message,
      });
    }

    return { success: false, error: err.message, durationMs };
  }
}

/**
 * cleanOldBackups()
 * Deletes backup folders older than RETENTION_DAYS.
 */
async function cleanOldBackups() {
  try {
    const entries  = fs.readdirSync(BACKUP_DIR);
    const cutoff   = Date.now() - RETENTION_DAYS * 86400000;
    let   deleted  = 0;

    for (const entry of entries) {
      const fullPath = path.join(BACKUP_DIR, entry);
      const stat     = fs.statSync(fullPath);
      if (stat.isDirectory() && entry.startsWith('backup_') && stat.mtimeMs < cutoff) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        deleted++;
        logger.info(`[backup] Deleted old backup: ${entry}`);
      }
    }

    logger.info(`[backup] Cleanup complete — ${deleted} old backups removed`);
    return { deleted };
  } catch (err) {
    logger.error('[backup] Cleanup failed', { error: err.message });
    return { deleted: 0, error: err.message };
  }
}

/**
 * listBackups()
 * Returns list of existing backup folders with metadata.
 */
function listBackups() {
  try {
    const entries = fs.readdirSync(BACKUP_DIR);
    return entries
      .filter(e => e.startsWith('backup_'))
      .map(e => {
        const fullPath = path.join(BACKUP_DIR, e);
        const stat     = fs.statSync(fullPath);
        return {
          name:      e,
          path:      fullPath,
          createdAt: stat.mtime,
          sizeBytes: getFolderSize(fullPath),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (_) {
    return [];
  }
}

function getFolderSize(folderPath) {
  let size = 0;
  try {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        const st = fs.statSync(fp);
        if (st.isDirectory()) walk(fp);
        else size += st.size;
      }
    };
    walk(folderPath);
  } catch (_) {}
  return size;
}

module.exports = { runBackup, cleanOldBackups, listBackups };