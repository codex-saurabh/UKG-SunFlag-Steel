/**
 * server/src/logger/streams.js
 *
 * Log stream adapters.
 * Separates stream wiring from the Winston logger instance
 * so logger/index.js stays focused on transport configuration.
 */

const logger = require('./index');

/**
 * morganStream — plugs into Morgan's `stream` option so HTTP request
 * logs go through Winston instead of process.stdout.
 * Morgan appends a newline; we trim it before passing to Winston.
 */
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

/**
 * stdoutStream — fallback plain stream for tools that expect a writable.
 * Not used in normal operation but useful for debugging pipe issues.
 */
const stdoutStream = {
  write: (message) => process.stdout.write(message),
};

module.exports = { morganStream, stdoutStream };
