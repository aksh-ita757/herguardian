// ============================================
// HerGuardian — Health Routes
// Base URL: /api/health
// ============================================

const express = require('express');
const router  = express.Router();
const { logPeriod, getCycleData, logMood, getMoodHistory } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cycle', protect, logPeriod);
router.get('/cycle',  protect, getCycleData);
router.post('/mood',  protect, logMood);
router.get('/mood',   protect, getMoodHistory);

module.exports = router;
