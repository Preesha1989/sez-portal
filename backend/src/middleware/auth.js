const jwt = require('jsonwebtoken');
const pool = require('../models/db');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(`SELECT * FROM users WHERE id = $1 AND is_active = 1`, [payload.sub]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found or deactivated' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
  }
  next();
};

const isSezTeam  = requireRole('sez_team', 'sez_admin');
const isSezAdmin = requireRole('sez_admin');

module.exports = { authenticate, requireRole, isSezTeam, isSezAdmin };