/**
 * server/src/config/cors.js
 *
 * CORS configuration.
 * In development → allow all origins (Vite dev server).
 * In production  → restrict to LAN IP range only (192.168.x.x).
 */

const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (env.isDev) {
      // Dev: allow all
      return callback(null, true);
    }

    // Prod: LAN only — 192.168.x.x or 10.x.x.x
    const lanPattern = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    if (lanPattern.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'], // needed for file download filename
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
