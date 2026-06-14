const { v4: uuidv4 } = require('uuid');
const pool = require('../models/db');

async function log({ requestId, actor, action, oldValue = null, newValue = null, metadata = null }) {
  await pool.query(
    `INSERT INTO audit_log (id, request_id, actor_id, actor_name, action, old_value, new_value, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      uuidv4(),
      requestId || null,
      actor?.id || 'system',
      actor?.name || 'System',
      action,
      oldValue ? String(oldValue) : null,
      newValue ? String(newValue) : null,
      metadata ? JSON.stringify(metadata) : null,
      new Date().toISOString(),
    ]
  );
}

async function forRequest(requestId) {
  const res = await pool.query(
    `SELECT * FROM audit_log WHERE request_id = $1 ORDER BY created_at DESC`,
    [requestId]
  );
  return res.rows;
}

async function global({ limit = 50, offset = 0 } = {}) {
  const res = await pool.query(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

module.exports = { log, forRequest, global };