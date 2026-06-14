// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ? AND is_active = 1`).get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  // Return token + user profile (never return password)
  const { password: _pw, ...profile } = user;
  res.json({ token, user: profile });
});

// GET /api/v1/auth/me — returns current user profile
router.get('/me', authenticate, (req, res) => {
  const { password: _pw, ...profile } = req.user;

  // If SEZ team, also return member profile
  const member = db.prepare(`SELECT * FROM sez_members WHERE user_id = ?`).get(req.user.id);
  res.json({ user: profile, member: member || null });
});

module.exports = router;
