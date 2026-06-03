/**
 * server/src/services/analytics/cache.js
 *
 * Dashboard cache helpers.
 * Uses the dashboard_cache MongoDB collection with a TTL index.
 * Keeps heavy aggregation results out of repeated API calls.
 */

const { DashboardCache } = require('../../models/index');
const logger = require('../../logger');

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * getCache(key)
 * Returns cached data if it exists and has not expired.
 * Returns null on miss or expiry.
 */
async function getCache(key) {
  try {
    const doc = await DashboardCache.findOne({ key }).lean();
    if (!doc) return null;
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return null;
    return doc.data;
  } catch (err) {
    logger.warn('[cache] getCache failed — cache miss treated as null', { key, error: err.message });
    return null;
  }
}

/**
 * setCache(key, data, ttlMs?)
 * Upserts a cache document with an expiry timestamp.
 * Failures are swallowed — a broken cache must never crash a request.
 */
async function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    await DashboardCache.findOneAndUpdate(
      { key },
      { key, data, builtAt: new Date(), expiresAt },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.warn('[cache] setCache failed — continuing without cache', { key, error: err.message });
  }
}

/**
 * invalidateCache(key)
 * Deletes a single cache key — call after data-changing operations.
 */
async function invalidateCache(key) {
  try {
    await DashboardCache.deleteOne({ key });
  } catch (err) {
    logger.warn('[cache] invalidateCache failed', { key, error: err.message });
  }
}

/**
 * invalidatePattern(prefix)
 * Deletes all cache keys that start with the given prefix.
 * e.g. invalidatePattern('dashboard_kpis') clears all KPI cache entries.
 */
async function invalidatePattern(prefix) {
  try {
    await DashboardCache.deleteMany({ key: { $regex: `^${prefix}` } });
  } catch (err) {
    logger.warn('[cache] invalidatePattern failed', { prefix, error: err.message });
  }
}

module.exports = { getCache, setCache, invalidateCache, invalidatePattern };