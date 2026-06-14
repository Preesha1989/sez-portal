const router = require('express').Router();
const { authenticate, isSezTeam } = require('../middleware/auth');
const auditService = require('../services/auditService');

router.get('/', authenticate, isSezTeam, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
    const offset = parseInt(req.query.offset || '0');
    const entries = await auditService.global({ limit, offset });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;