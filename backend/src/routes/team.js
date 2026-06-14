// src/routes/team.js
const router = require('express').Router();
const db = require('../models/db');
const { authenticate, isSezTeam, isSezAdmin } = require('../middleware/auth');

// GET /api/v1/team — list all SEZ members with user details
router.get('/', authenticate, (req, res) => {
  const members = db.prepare(`
    SELECT
      m.id, m.role_title, m.speciality, m.queue_count, m.is_active, m.created_at,
      u.id AS user_id, u.name, u.email, u.department
    FROM sez_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.is_active = 1
    ORDER BY m.created_at ASC
  `).all();

  // For each member, count their active requests
  const enriched = members.map(m => {
    const active = db.prepare(`
      SELECT COUNT(*) AS c FROM requests
      WHERE assigned_to = ? AND status NOT IN ('Closed','Rejected','Approved')
    `).get(m.id).c;
    const total = db.prepare(`SELECT COUNT(*) AS c FROM requests WHERE assigned_to = ?`).get(m.id).c;
    return { ...m, active_requests: active, total_requests: total };
  });

  res.json(enriched);
});

// PATCH /api/v1/team/:memberId/active — activate / deactivate member (admin only)
router.patch('/:memberId/active', authenticate, isSezAdmin, (req, res) => {
  const { isActive } = req.body;
  db.prepare(`UPDATE sez_members SET is_active = ? WHERE id = ?`).run(isActive ? 1 : 0, req.params.memberId);
  res.json({ ok: true });
});

module.exports = router;
