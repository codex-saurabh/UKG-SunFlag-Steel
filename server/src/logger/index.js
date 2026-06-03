/**
 * server/src/logger/index.js
 *
 * Winston logger with daily rotating file transports.
 * Console transport always active in development.
 * Stream adapters live in logger/streams.js.
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs   = require('fs');
const env  = require('../config/env');

// Ensure log directory exists before any transport tries to write
const logDir = path.resolve(env.LOG_DIR);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom levels — adds 'http' between info and verbose
const customLevels = {
  levels: { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 },
  colors: { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue', verbose: 'cyan' },
};
winston.addColors(customLevels.colors);

const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `  ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase().padEnd(7)}] ${stack || message}${metaStr}`;
});

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `  ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase().padEnd(7)}] ${stack || message}${metaStr}`;
});

const makeRotatingTransport = (filename, level) =>
  new DailyRotateFile({
    filename:    path.join(logDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxFiles:    '30d',
    maxSize:     '20m',
    level,
    format:      combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), fileFormat),
  });

const logger = winston.createLogger({
  levels: customLevels.levels,
  level:  env.LOG_LEVEL || 'info',
  transports: [
    makeRotatingTransport('app',   'info'),
    makeRotatingTransport('error', 'error'),
    makeRotatingTransport('http',  'http'),
  ],
  exceptionHandlers: [
    makeRotatingTransport('exceptions', 'error'),
    // Also print uncaught exceptions to console so they are never invisible
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),
  ],
  rejectionHandlers: [
    makeRotatingTransport('rejections', 'error'),
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),
  ],
});

// Console transport — always on in development, off in production
if (env.isDev) {
  logger.add(new winston.transports.Console({
    level:  'debug',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    ),
  }));
}

module.exports = logger;
