// src/routes/auditLog.js
const router = require('express').Router();
const { authenticate, isSezTeam } = require('../middleware/auth');
const auditService = require('../services/auditService');

// GET /api/v1/audit — global audit log (SEZ team only)
router.get('/', authenticate, isSezTeam, (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  || '50'),  200);
  const offset = parseInt(req.query.offset || '0');
  const entries = auditService.global({ limit, offset });
  res.json(entries);
});

module.exports = router;
