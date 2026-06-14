const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../models/db');
const { authenticate, isSezTeam } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const audit   = require('../services/auditService');
const assign  = require('../services/assignmentService');

const VALID_STATUSES    = ['New','Pending','In Review','Approved','Rejected','Closed'];
const CLOSED_STATUSES   = ['Approved','Rejected','Closed'];
const TERMINAL_STATUSES = ['Rejected','Closed'];

async function enrichRequest(req) {
  if (!req) return null;
  const docs = await pool.query(`SELECT * FROM documents WHERE request_id = $1 ORDER BY uploaded_at ASC`, [req.id]);
  const member = req.assigned_to
    ? await pool.query(`SELECT m.*, u.name, u.email FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = $1`, [req.assigned_to])
    : null;
  const requester = await pool.query(`SELECT id, name, email, department FROM users WHERE id = $1`, [req.requester_id]);
  return {
    ...req,
    dynamic_fields: req.dynamic_fields ? JSON.parse(req.dynamic_fields) : {},
    assignee: member?.rows[0] || null,
    requester: requester.rows[0] || null,
    documents: docs.rows,
  };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, priority, assignedTo, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const clauses = [];
    const params  = [];
    let i = 1;

    if (req.user.role === 'requester') { clauses.push(`r.requester_id = $${i++}`); params.push(req.user.id); }
    if (status)     { clauses.push(`r.status = $${i++}`);            params.push(status); }
    if (category)   { clauses.push(`r.request_category = $${i++}`);  params.push(category); }
    if (priority)   { clauses.push(`r.priority = $${i++}`);          params.push(priority); }
    if (assignedTo) { clauses.push(`r.assigned_to = $${i++}`);       params.push(assignedTo); }
    if (search) {
      clauses.push(`(r.id ILIKE $${i} OR r.request_type ILIKE $${i} OR u.name ILIKE $${i} OR r.department ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }

    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const rows = await pool.query(
      `SELECT r.*, u.name AS requester_name FROM requests r JOIN users u ON u.id = r.requester_id ${where} ORDER BY r.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );
    const total = await pool.query(
      `SELECT COUNT(*) AS count FROM requests r JOIN users u ON u.id = r.requester_id ${where}`,
      params
    );
    res.json({ data: rows.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authenticate, isSezTeam, async (req, res) => {
  try {
    const counts     = await pool.query(`SELECT status, COUNT(*) AS count FROM requests GROUP BY status`);
    const byCategory = await pool.query(`SELECT request_category, COUNT(*) AS count FROM requests GROUP BY request_category`);
    const byMember   = await pool.query(`SELECT m.id, u.name, m.queue_count AS active FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.is_active = 1`);
    const monthly    = await pool.query(`SELECT TO_CHAR(created_at::timestamp, 'YYYY-MM') AS month, COUNT(*) AS count FROM requests GROUP BY month ORDER BY month DESC LIMIT 6`);
    res.json({ counts: counts.rows, byCategory: byCategory.rows, byMember: byMember.rows, monthly: monthly.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { requestType, requestCategory, direction, description, priority = 'Normal', dynamicFields, referenceNo, idempotencyKey } = req.body;
    if (!requestType || !requestCategory || !description) return res.status(400).json({ error: 'requestType, requestCategory, and description are required' });

    if (idempotencyKey) {
      const existing = await pool.query(`SELECT id FROM requests WHERE idempotency_key = $1`, [idempotencyKey]);
      if (existing.rows[0]) return res.json({ id: existing.rows[0].id, idempotent: true });
    }

    const countRes = await pool.query(`SELECT COUNT(*) AS c FROM requests`);
    const id = `SEZ-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].c) + 1).padStart(3,'0')}`;
    const memberId = await assign.autoAssign();
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO requests (id, idempotency_key, request_type, request_category, direction, requester_id, department, priority, status, assigned_to, description, dynamic_fields, reference_no, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'New',$9,$10,$11,$12,$13,$14)`,
      [id, idempotencyKey||null, requestType, requestCategory, direction||null, req.user.id, req.user.department, priority, memberId, description, dynamicFields ? JSON.stringify(dynamicFields) : null, referenceNo||null, now, now]
    );

    if (memberId) await assign.incrementCount(memberId);
    await audit.log({ requestId: id, actor: req.user, action: 'REQUEST_CREATED', newValue: 'New' });
    if (memberId) {
      const m = await pool.query(`SELECT u.name FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = $1`, [memberId]);
      await audit.log({ requestId: id, actor: req.user, action: 'AUTO_ASSIGNED', newValue: m.rows[0]?.name });
    }

    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM requests WHERE id = $1`, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Request not found' });
    if (req.user.role === 'requester' && row.requester_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const comments   = await pool.query(`SELECT * FROM comments WHERE request_id = $1 ORDER BY created_at ASC`, [req.params.id]);
    const auditTrail = await audit.forRequest(req.params.id);
    const enriched   = await enrichRequest(row);
    res.json({ ...enriched, comments: comments.rows, audit: auditTrail });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', authenticate, isSezTeam, async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(`SELECT * FROM requests WHERE id = $1`, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Request not found' });
    if (TERMINAL_STATUSES.includes(row.status)) return res.status(409).json({ error: `Request is already ${row.status}` });

    await pool.query(`UPDATE requests SET status = $1, updated_at = $2 WHERE id = $3`, [status, new Date().toISOString(), req.params.id]);
    await audit.log({ requestId: req.params.id, actor: req.user, action: 'STATUS_CHANGED', oldValue: row.status, newValue: status });
    if (CLOSED_STATUSES.includes(status) && row.assigned_to) await assign.decrementCount(row.assigned_to);

    res.json({ id: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/assign', authenticate, isSezTeam, async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId required' });

    const member = await pool.query(`SELECT m.*, u.name FROM sez_members m JOIN users u ON u.id = m.user_id WHERE m.id = $1`, [memberId]);
    if (!member.rows[0]) return res.status(404).json({ error: 'SEZ member not found' });

    const row = await pool.query(`SELECT * FROM requests WHERE id = $1`, [req.params.id]);
    if (!row.rows[0]) return res.status(404).json({ error: 'Request not found' });

    await assign.reassign(req.params.id, memberId);
    await audit.log({ requestId: req.params.id, actor: req.user, action: 'REASSIGNED', oldValue: row.rows[0].assigned_to, newValue: member.rows[0].name });

    res.json({ id: req.params.id, assignedTo: memberId, assigneeName: member.rows[0].name });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' });

    const row = await pool.query(`SELECT id FROM requests WHERE id = $1`, [req.params.id]);
    if (!row.rows[0]) return res.status(404).json({ error: 'Request not found' });

    const id  = uuidv4();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO comments (id, request_id, author_id, author_name, body, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, req.params.id, req.user.id, req.user.name, body.trim(), now]
    );
    await audit.log({ requestId: req.params.id, actor: req.user, action: 'COMMENT_ADDED' });
    res.status(201).json({ id, author: req.user.name, body: body.trim(), created_at: now });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/documents',
  authenticate,
  (req, res, next) => { req.params.requestId = req.params.id; next(); },
  upload.array('files', 10),
  async (req, res) => {
    try {
      const row = await pool.query(`SELECT id FROM requests WHERE id = $1`, [req.params.id]);
      if (!row.rows[0]) return res.status(404).json({ error: 'Request not found' });

      const uploaded = [];
      const now = new Date().toISOString();
      for (const file of req.files) {
        const docId = uuidv4();
        await pool.query(
          `INSERT INTO documents (id, request_id, filename, stored_name, mime_type, size_bytes, uploaded_by, uploaded_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [docId, req.params.id, file.originalname, file.filename, file.mimetype, file.size, req.user.id, now]
        );
        await audit.log({ requestId: req.params.id, actor: req.user, action: 'DOCUMENT_UPLOADED', newValue: file.originalname });
        uploaded.push({ id: docId, filename: file.originalname, size_bytes: file.size });
      }
      res.status(201).json({ uploaded });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/:id/documents/:docId', authenticate, async (req, res) => {
  try {
    const doc = await pool.query(`SELECT * FROM documents WHERE id = $1 AND request_id = $2`, [req.params.docId, req.params.id]);
    if (!doc.rows[0]) return res.status(404).json({ error: 'Document not found' });

    const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(UPLOAD_DIR, req.params.id, doc.rows[0].stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    res.setHeader('Content-Disposition', `attachment; filename="${doc.rows[0].filename}"`);
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;