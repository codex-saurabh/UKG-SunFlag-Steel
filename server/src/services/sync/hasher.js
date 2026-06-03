/**
 * server/src/services/sync/hasher.js
 *
 * Record hash utility for the sync engine.
 *
 * When a record arrives from UKG, we compute a short hash of its content
 * and store it as ukgHash on the MongoDB document.
 * On the next sync, we re-hash the incoming record and compare.
 * If the hashes match → record unchanged → skip the write.
 * If they differ    → record changed  → update the document.
 *
 * This prevents unnecessary DB writes and keeps updatedAt accurate.
 */

const crypto = require('crypto');

/**
 * hashRecord(obj)
 * Returns a 16-character hex string (first 16 chars of SHA-256).
 * Short enough to store cheaply, long enough to be collision-resistant
 * for this use case (~2^64 space).
 *
 * The object is JSON-serialized with sorted keys so field order doesn't
 * affect the hash.
 */
function hashRecord(obj) {
  const normalized = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 16);
}

/**
 * hasChanged(incomingObj, storedHash)
 * Returns true if the incoming object's hash differs from the stored hash.
 * A true result means the record should be updated in MongoDB.
 */
function hasChanged(incomingObj, storedHash) {
  if (!storedHash) return true; // no previous hash → always write
  return hashRecord(incomingObj) !== storedHash;
}

module.exports = { hashRecord, hasChanged };