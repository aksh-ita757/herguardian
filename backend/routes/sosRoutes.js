// ============================================
// HerGuardian — SOS Routes
// Base URL: /api/sos
// All routes are protected (need JWT)
// ============================================

const express = require('express');
const router  = express.Router();
const { sendSOS, getSOSHistory } = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');
const { sosBurstLimiter, sosHourlyLimiter } = require('../middleware/rateLimiters');

// Limiters run AFTER protect so they are per-user (not per-IP).
router.post('/send',   protect, sosBurstLimiter, sosHourlyLimiter, sendSOS);
router.get('/history', protect, getSOSHistory);

module.exports = router;
