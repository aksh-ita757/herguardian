// ============================================
// HerGuardian — Legal Routes
// Base URL: /api/legal
// ============================================
const express = require('express');
const legalRouter = express.Router();
const { Legal, Helpline } = require('../models/Legal');

// Get all legal articles (public)
legalRouter.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const articles = await Legal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch legal content' });
  }
});

// Get all helplines (public)
legalRouter.get('/helplines', async (req, res) => {
  try {
    const helplines = await Helpline.find({ isActive: true });
    res.json({ success: true, helplines });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch helplines' });
  }
});

module.exports = legalRouter;

// ============================================
// Save forum routes separately
// ============================================
