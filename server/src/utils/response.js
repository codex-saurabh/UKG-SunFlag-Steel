/**
 * server/src/utils/response.js
 *
 * Standardized response envelope.
 *
 * Every API response follows one of two shapes:
 *
 * Success:
 *   { success: true, data: <payload>, meta: { page, total, ... } }
 *
 * Error (handled by errorHandler middleware, not here):
 *   { success: false, error: { code, message, errors? } }
 */

/**
 * ok(res, data, meta?)
 * Standard 200 response.
 */
function ok(res, data, meta = {}) {
  const body = { success: true, data };
  if (Object.keys(meta).length > 0) body.meta = meta;
  return res.status(200).json(body);
}

/**
 * created(res, data)
 * 201 response for successful resource creation.
 */
function created(res, data) {
  return res.status(201).json({ success: true, data });
}

/**
 * noContent(res)
 * 204 — successful with no body (e.g. DELETE).
 */
function noContent(res) {
  return res.status(204).end();
}

module.exports = { ok, created, noContent };
