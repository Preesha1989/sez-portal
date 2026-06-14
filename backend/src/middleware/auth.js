// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models/db');

// ── Verify JWT ─────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach fresh user from DB (catches deactivated accounts)
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found or deactivated' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

// ── Role guards ─────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
  }
  next();
};

const isSezTeam  = requireRole('sez_team', 'sez_admin');
const isSezAdmin = requireRole('sez_admin');

module.exports = { authenticate, requireRole, isSezTeam, isSezAdmin };
