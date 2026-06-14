const pool = require('../models/db');

async function autoAssign() {
  const res = await pool.query(`
    SELECT m.id FROM sez_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.is_active = 1 AND u.is_active = 1
    ORDER BY m.queue_count ASC, m.created_at ASC
    LIMIT 1
  `);
  return res.rows[0]?.id || null;
}

async function incrementCount(memberId) {
  await pool.query(
    `UPDATE sez_members SET queue_count = queue_count + 1 WHERE id = $1`,
    [memberId]
  );
}

async function decrementCount(memberId) {
  await pool.query(
    `UPDATE sez_members SET queue_count = GREATEST(0, queue_count - 1) WHERE id = $1`,
    [memberId]
  );
}

async function reassign(requestId, newMemberId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const req = await client.query(`SELECT assigned_to FROM requests WHERE id = $1`, [requestId]);
    if (!req.rows[0]) throw new Error('Request not found');
    const oldMember = req.rows[0].assigned_to;
    if (oldMember && oldMember !== newMemberId) {
      await client.query(`UPDATE sez_members SET queue_count = GREATEST(0, queue_count - 1) WHERE id = $1`, [oldMember]);
    }
    if (!oldMember || oldMember !== newMemberId) {
      await client.query(`UPDATE sez_members SET queue_count = queue_count + 1 WHERE id = $1`, [newMemberId]);
    }
    await client.query(`UPDATE requests SET assigned_to = $1, updated_at = $2 WHERE id = $3`,
      [newMemberId, new Date().toISOString(), requestId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { autoAssign, incrementCount, decrementCount, reassign };