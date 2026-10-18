// ============================================
// HerGuardian — AI Routes
// Handles: Legal Chatbot + Smart Health Insights
// Powered by Anthropic Claude API
// Base URL: /api/ai
// ============================================

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiters');
const { chatLegal, getHealthInsights } = require('../controllers/aiController');

// Limiter runs after protect → per-user (AI calls cost money)
router.post('/chat',            protect, aiLimiter, chatLegal);
router.post('/health-insights', protect, aiLimiter, getHealthInsights);

module.exports = router;
