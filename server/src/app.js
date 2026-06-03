/**
 * server/src/app.js
 *
 * Express application factory.
 * Middleware wiring, route mounting, error handling.
 * No server.listen() here — that lives in server.js.
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const rateLimit = require('express-rate-limit');

const env               = require('./config/env');
const corsOptions       = require('./config/cors');
const { morganStream }  = require('./logger/streams');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes            = require('./routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logging ──────────────────────────────────────────────────
app.use(morgan(env.isDev ? 'dev' : 'combined', { stream: morganStream }));

// ── Rate limiting ─────────────────────────────────────────────────────────
// 500 requests per 15 minutes per IP — very generous for internal LAN use
app.use('/api', rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            500,
  standardHeaders:true,
  legacyHeaders:  false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' },
  },
}));

// ── Static exports folder ─────────────────────────────────────────────────
// Files can be served directly if needed (e.g. printing from browser)
app.use('/files', express.static(path.resolve(env.EXPORT_DIR)));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Health check — no auth required ──────────────────────────────────────
app.get('/ping', (req, res) => res.json({ ok: true, ts: new Date(), env: env.NODE_ENV }));

// ── 404 + global error handler ────────────────────────────────────────────
// MUST be last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
