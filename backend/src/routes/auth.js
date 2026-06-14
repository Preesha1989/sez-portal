const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const result = await pool.query(`SELECT * FROM users WHERE email = $1 AND is_active = 1`, [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const { password: _pw, ...profile } = user;
    res.json({ token, user: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const member = await pool.query(`SELECT * FROM sez_members WHERE user_id = $1`, [req.user.id]);
    const { password: _pw, ...profile } = req.user;
    res.json({ user: profile, member: member.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;