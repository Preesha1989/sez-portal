// src/routes/requests.js
const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const path    = require('path');
const fs      = require('fs');
const db      = require('../models/db');
const { authenticate, isSezTeam } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const audit   = require('../services/auditService');
const assign  = require('../services/assignmentService');

const VALID_STATUSES   = ['New','Pending','In Review','Approved','Rejected','Closed'];
const CLOSED_STATUSES  = ['Approved','Rejected','Closed'];
const TERMINAL_STATUSES = ['Rejected','Closed'];

// ── Helper: enrich a request row with assignee + docs ──────────────────────
function enrichRequest(req) {
  if (!req) return null;
  const docs = db.prepare(`SELECT * FROM documents WHERE request_id = ? ORDER BY uploaded_at ASC`).all(req.id);
  const member = req.assigned_to
    ? db.prepare(`SELECT m.*, u.name, u.email FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = ?`).get(req.assigned_to)
    : null;
  const requester = db.prepare(`SELECT id, name, email, department FROM users WHERE id = ?`).get(req.requester_id);
  return {
    ...req,
    dynamic_fields: req.dynamic_fields ? JSON.parse(req.dynamic_fields) : {},
    assignee: member,
    requester,
    documents: docs,
  };
}

// ── GET /api/v1/requests — list with filters ───────────────────────────────
router.get('/', authenticate, (req, res) => {
  const {
    status, category, priority, assignedTo,
    search, page = 1, limit = 20,
  } = req.query;

  const offset  = (parseInt(page) - 1) * parseInt(limit);
  const clauses = [];
  const params  = [];

  // Requesters only see their own requests
  if (req.user.role === 'requester') {
    clauses.push('r.requester_id = ?');
    params.push(req.user.id);
  }

  if (status)     { clauses.push('r.status = ?');            params.push(status); }
  if (category)   { clauses.push('r.request_category = ?');  params.push(category); }
  if (priority)   { clauses.push('r.priority = ?');          params.push(priority); }
  if (assignedTo) { clauses.push('r.assigned_to = ?');       params.push(assignedTo); }
  if (search) {
    clauses.push('(r.id LIKE ? OR r.request_type LIKE ? OR u.name LIKE ? OR r.department LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT r.*, u.name AS requester_name
    FROM requests r
    JOIN users u ON u.id = r.requester_id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) AS count
    FROM requests r
    JOIN users u ON u.id = r.requester_id
    ${where}
  `).get(...params).count;

  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// ── GET /api/v1/requests/stats — dashboard metrics ────────────────────────
router.get('/stats', authenticate, isSezTeam, (req, res) => {
  const counts = db.prepare(`
    SELECT status, COUNT(*) AS count FROM requests GROUP BY status
  `).all();

  const byCategory = db.prepare(`
    SELECT request_category, COUNT(*) AS count FROM requests GROUP BY request_category
  `).all();

  const byMember = db.prepare(`
    SELECT m.id, u.name, m.queue_count AS active
    FROM sez_members m JOIN users u ON u.id = m.user_id
    WHERE m.is_active = 1
  `).all();

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
    FROM requests
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all();

  res.json({ counts, byCategory, byMember, monthly });
});

// ── POST /api/v1/requests — create new request ────────────────────────────
router.post('/', authenticate, (req, res) => {
  const {
    requestType, requestCategory, direction,
    description, priority = 'Normal',
    dynamicFields, referenceNo,
    idempotencyKey,
  } = req.body;

  if (!requestType || !requestCategory || !description) {
    return res.status(400).json({ error: 'requestType, requestCategory, and description are required' });
  }
  if (priority && !['Normal','High','Urgent'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  // Idempotency check
  if (idempotencyKey) {
    const existing = db.prepare(`SELECT id FROM requests WHERE idempotency_key = ?`).get(idempotencyKey);
    if (existing) return res.json({ id: existing.id, idempotent: true });
  }

  const id = `SEZ-${new Date().getFullYear()}-${String(db.prepare('SELECT COUNT(*) AS c FROM requests').get().c + 1).padStart(3,'0')}`;
  const memberId = assign.autoAssign();
  const now = new Date().toISOString();

  const txn = db.transaction(() => {
    db.prepare(`
      INSERT INTO requests (id, idempotency_key, request_type, request_category, direction,
        requester_id, department, priority, status, assigned_to, description,
        dynamic_fields, reference_no, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?)
    `).run(
      id, idempotencyKey || null, requestType, requestCategory, direction || null,
      req.user.id, req.user.department, priority, memberId,
      description, dynamicFields ? JSON.stringify(dynamicFields) : null,
      referenceNo || null, now, now
    );

    if (memberId) assign.incrementCount(memberId);

    audit.log({ requestId: id, actor: req.user, action: 'REQUEST_CREATED', newValue: 'New' });
    if (memberId) {
      const member = db.prepare(`SELECT u.name FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = ?`).get(memberId);
      audit.log({ requestId: id, actor: req.user, action: 'AUTO_ASSIGNED', newValue: member?.name });
    }
  });

  txn();
  res.status(201).json({ id });
});

// ── GET /api/v1/requests/:id — get single request with full detail ─────────
router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  // Requesters can only see their own
  if (req.user.role === 'requester' && row.requester_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const comments  = db.prepare(`SELECT * FROM comments WHERE request_id = ? ORDER BY created_at ASC`).all(req.params.id);
  const auditTrail = audit.forRequest(req.params.id);

  res.json({ ...enrichRequest(row), comments, audit: auditTrail });
});

// ── PATCH /api/v1/requests/:id/status — change status ────────────────────
router.patch('/:id/status', authenticate, isSezTeam, (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const row = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (TERMINAL_STATUSES.includes(row.status)) {
    return res.status(409).json({ error: `Request is already ${row.status} and cannot be changed` });
  }

  db.prepare(`UPDATE requests SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, new Date().toISOString(), req.params.id);

  audit.log({
    requestId: req.params.id, actor: req.user,
    action: 'STATUS_CHANGED', oldValue: row.status, newValue: status,
  });

  // Decrement queue count when closed
  if (CLOSED_STATUSES.includes(status) && row.assigned_to) {
    assign.decrementCount(row.assigned_to);
  }

  res.json({ id: req.params.id, status });
});

// ── PATCH /api/v1/requests/:id/assign — reassign to SEZ member ────────────
router.patch('/:id/assign', authenticate, isSezTeam, (req, res) => {
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ error: 'memberId required' });

  const member = db.prepare(`SELECT m.*, u.name FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = ?`).get(memberId);
  if (!member) return res.status(404).json({ error: 'SEZ member not found' });

  const row = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  assign.reassign(req.params.id, memberId);
  audit.log({
    requestId: req.params.id, actor: req.user,
    action: 'REASSIGNED', oldValue: row.assigned_to, newValue: member.name,
  });

  res.json({ id: req.params.id, assignedTo: memberId, assigneeName: member.name });
});

// ── POST /api/v1/requests/:id/comments — add comment ──────────────────────
router.post('/:id/comments', authenticate, (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' });

  const row = db.prepare(`SELECT id FROM requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO comments (id, request_id, author_id, author_name, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user.id, req.user.name, body.trim(), now);

  audit.log({ requestId: req.params.id, actor: req.user, action: 'COMMENT_ADDED' });
  res.status(201).json({ id, author: req.user.name, body: body.trim(), created_at: now });
});

// ── POST /api/v1/requests/:id/documents — upload files ────────────────────
router.post('/:id/documents',
  authenticate,
  (req, res, next) => { req.params.requestId = req.params.id; next(); },
  upload.array('files', 10),
  (req, res) => {
    const row = db.prepare(`SELECT id FROM requests WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Request not found' });

    const uploaded = [];
    const now = new Date().toISOString();

    for (const file of req.files) {
      const docId = uuidv4();
      db.prepare(`
        INSERT INTO documents (id, request_id, filename, stored_name, mime_type, size_bytes, uploaded_by, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(docId, req.params.id, file.originalname, file.filename, file.mimetype, file.size, req.user.id, now);

      audit.log({
        requestId: req.params.id, actor: req.user,
        action: 'DOCUMENT_UPLOADED', newValue: file.originalname,
      });
      uploaded.push({ id: docId, filename: file.originalname, size_bytes: file.size });
    }

    res.status(201).json({ uploaded });
  }
);

// ── GET /api/v1/requests/:id/documents/:docId — download file ─────────────
router.get('/:id/documents/:docId', authenticate, (req, res) => {
  const doc = db.prepare(`SELECT * FROM documents WHERE id = ? AND request_id = ?`).get(req.params.docId, req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  const filePath = path.join(UPLOAD_DIR, req.params.id, doc.stored_name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
  res.sendFile(path.resolve(filePath));
});

module.exports = router;
