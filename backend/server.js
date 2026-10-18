// ============================================
// HerGuardian v2 — Main Server Entry Point (production-ready)
// ============================================
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const mongoose   = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');

const { validateEnv, isProd } = require('./config/env');
validateEnv();                                   // exits with a clear message if misconfigured

const connectDB = require('./config/db');
const { globalLimiter } = require('./middleware/rateLimiters');

const app = express();

// ── Behind a proxy (Render / Railway / Nginx) ─────────────────────────
// Required so req.ip is the real client IP (rate limiting) and https is detected.
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────
app.use(helmet());

// ── Liveness probe — BEFORE CORS / rate limiting so platform health checks and
// uptime pingers are never blocked. Always 200 if the process is alive.
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    uptime: Math.round(process.uptime()),
  });
});

// ── CORS ──────────────────────────────────────────────────────────────
// CLIENT_URL may hold several origins, comma-separated. Trailing slashes are ignored
// (a trailing "/" in CLIENT_URL is the #1 cause of "CORS error" after deploying).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);                       // curl, server-to-server, health checks
    return cb(null, allowedOrigins.includes(origin));         // false → no CORS headers → browser blocks
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ── Body parsing ──────────────────────────────────────────────────────
// Only /api/sos may send big bodies (Base64 evidence photo). Everything else: 100 KB.
// (Order matters: the first parser to run marks the body as parsed.)
app.use('/api/sos', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Strip "$" and "." keys from req.body/query/params → blocks NoSQL-injection payloads
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────────────
app.use('/api/', globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/sos',    require('./routes/sosRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/legal',  require('./routes/legalRoutes'));
app.use('/api/forum',  require('./routes/forumRoutes'));
app.use('/api/map',    require('./routes/mapRoutes'));
app.use('/api/ai',     require('./routes/aiRoutes'));

app.get('/api/ping', (req, res) =>
  res.json({ message: '🌸 HerGuardian v2 server running!', timestamp: new Date().toISOString() })
);

// ── 404 + error handling ──────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large')   return res.status(413).json({ error: 'Request is too large.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON in request body.' });
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start: connect to DB first, then accept traffic ───────────────────
const PORT = process.env.PORT || 5000;
let server;

(async () => {
  await connectDB();                                  // exits(1) on failure → platform shows the error
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 HerGuardian v2 listening on port ${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`   Allowed origin(s): ${allowedOrigins.join(', ')}`);
  });
})();

// ── Graceful shutdown (Render sends SIGTERM on redeploy / spin-down) ───
const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully…`);
  const force = setTimeout(() => process.exit(1), 10000);
  force.unref();
  if (!server) return process.exit(0);
  server.close(async () => {
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

module.exports = app;
