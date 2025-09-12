const express = require('express');
const router = express.Router();
const RecommendedSparePart = require('../models/RecommendedSparePart');
const { authenticateToken } = require('./auth');

// List with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, siteId, projectorSerial } = req.query;
    const q = {};
    if (status) q.status = status;
    if (siteId) q.siteId = siteId;
    if (projectorSerial) q.projectorSerial = projectorSerial;
    const items = await RecommendedSparePart.find(q).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recommended spares', details: e.message });
  }
});

// Create a new recommended spare (used by Admin UI or AI generation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const payload = req.body || {};
    // Attach requester if available
    if (req.user) {
      payload.requestedBy = payload.requestedBy || {
        userId: req.user.userId,
        name: req.user.username,
        role: req.user.role
      };
    }
    const item = await RecommendedSparePart.create(payload);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: 'Failed to create item', details: e.message });
  }
});

// Update status/notes/quantity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await RecommendedSparePart.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: 'Failed to update item', details: e.message });
  }
});

module.exports = router;

