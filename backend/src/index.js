// src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// Ensure upload dir exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(path.resolve(UPLOAD_DIR), { recursive: true });

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging (simple) ───────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     require('./routes/auth'));
app.use('/api/v1/requests', require('./routes/requests'));
app.use('/api/v1/team',     require('./routes/team'));
app.use('/api/v1/audit',    require('./routes/auditLog'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 20} MB.` });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀  SEZ Portal backend running on http://localhost:${PORT}`);
  console.log(`    API base: http://localhost:${PORT}/api/v1\n`);
});
