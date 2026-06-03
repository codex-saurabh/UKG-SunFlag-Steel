/**
 * server/src/utils/paginate.js
 *
 * Pagination helpers.
 * paginate()     — extracts page/limit/skip from query params
 * paginateMeta() — builds the meta object returned in API responses
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT     = 500;

/**
 * paginate(query)
 * Reads page and limit from Express req.query (or any plain object).
 * Returns { page, limit, skip } ready for Mongoose .skip().limit().
 */
function paginate(query = {}) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * paginateMeta(total, page, limit)
 * Returns the meta block included in paginated API responses.
 */
function paginateMeta(total, page, limit) {
  const pages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

module.exports = { paginate, paginateMeta };
