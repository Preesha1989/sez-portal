const router = require('express').Router();
const pool = require('../models/db');
const { authenticate, isSezTeam, isSezAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.role_title, m.speciality, m.queue_count, m.is_active, m.created_at,
             u.id AS user_id, u.name, u.email, u.department
      FROM sez_members m
      JOIN users u ON u.id = m.user_id
      WHERE m.is_active = 1
      ORDER BY m.created_at ASC
    `);

    const members = await Promise.all(result.rows.map(async (m) => {
      const active = await pool.query(
        `SELECT COUNT(*) AS c FROM requests WHERE assigned_to = $1 AND status NOT IN ('Closed','Rejected','Approved')`,
        [m.id]
      );
      const total = await pool.query(
        `SELECT COUNT(*) AS c FROM requests WHERE assigned_to = $1`,
        [m.id]
      );
      return {
        ...m,
        active_requests: parseInt(active.rows[0].c),
        total_requests: parseInt(total.rows[0].c),
      };
    }));

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:memberId/active', authenticate, isSezAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    await pool.query(`UPDATE sez_members SET is_active = $1 WHERE id = $2`, [isActive ? 1 : 0, req.params.memberId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;