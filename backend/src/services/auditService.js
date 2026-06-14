// src/services/auditService.js
// All writes to audit_log go through here.
// The audit_log table has no UPDATE or DELETE — this is intentional.

const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

const INSERT = db.prepare(`
  INSERT INTO audit_log (id, request_id, actor_id, actor_name, action, old_value, new_value, metadata, created_at)
  VALUES (@id, @request_id, @actor_id, @actor_name, @action, @old_value, @new_value, @metadata, @created_at)
`);

/**
 * Append an audit entry.
 * @param {object} params
 * @param {string} params.requestId
 * @param {object} params.actor        - req.user
 * @param {string} params.action       - e.g. 'STATUS_CHANGED', 'ASSIGNED', 'DOCUMENT_UPLOADED'
 * @param {string} [params.oldValue]
 * @param {string} [params.newValue]
 * @param {object} [params.metadata]   - any extra JSON context
 */
function log({ requestId, actor, action, oldValue = null, newValue = null, metadata = null }) {
  INSERT.run({
    id:          uuidv4(),
    request_id:  requestId || null,
    actor_id:    actor?.id   || 'system',
    actor_name:  actor?.name || 'System',
    action,
    old_value:   oldValue  ? String(oldValue)          : null,
    new_value:   newValue  ? String(newValue)          : null,
    metadata:    metadata  ? JSON.stringify(metadata)  : null,
    created_at:  new Date().toISOString(),
  });
}

/**
 * Get full audit trail for a request (newest first).
 */
function forRequest(requestId) {
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE request_id = ?
    ORDER BY created_at DESC
  `).all(requestId);
}

/**
 * Global audit log (newest first, paginated).
 */
function global({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT * FROM audit_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

module.exports = { log, forRequest, global };
