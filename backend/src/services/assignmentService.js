// src/services/assignmentService.js
// Round-robin auto-assignment across active SEZ members.
// Picks the member with the lowest current queue_count.

const db = require('../models/db');

/**
 * Returns the sez_member id to assign a new request to.
 * Strategy: pick the active member with the lowest queue_count.
 * Ties broken by member creation order (oldest member first).
 */
function autoAssign() {
  const member = db.prepare(`
    SELECT m.id
    FROM sez_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.is_active = 1 AND u.is_active = 1
    ORDER BY m.queue_count ASC, m.created_at ASC
    LIMIT 1
  `).get();

  return member ? member.id : null;
}

/**
 * Increment queue_count for a member (called when a request is assigned).
 */
function incrementCount(memberId) {
  db.prepare(`UPDATE sez_members SET queue_count = queue_count + 1 WHERE id = ?`).run(memberId);
}

/**
 * Decrement queue_count for a member (called when closed/rejected or reassigned away).
 */
function decrementCount(memberId) {
  db.prepare(`
    UPDATE sez_members
    SET queue_count = MAX(0, queue_count - 1)
    WHERE id = ?
  `).run(memberId);
}

/**
 * Reassign a request from one member to another.
 * Updates queue counts and the request row atomically.
 */
function reassign(requestId, newMemberId) {
  const txn = db.transaction(() => {
    const req = db.prepare(`SELECT assigned_to FROM requests WHERE id = ?`).get(requestId);
    if (!req) throw new Error('Request not found');

    if (req.assigned_to && req.assigned_to !== newMemberId) {
      decrementCount(req.assigned_to);
    }
    if (!req.assigned_to || req.assigned_to !== newMemberId) {
      incrementCount(newMemberId);
    }

    db.prepare(`
      UPDATE requests SET assigned_to = ?, updated_at = ? WHERE id = ?
    `).run(newMemberId, new Date().toISOString(), requestId);
  });
  txn();
}

module.exports = { autoAssign, incrementCount, decrementCount, reassign };
