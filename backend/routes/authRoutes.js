// ============================================
// HerGuardian — Auth Routes
// Base URL: /api/auth
// ============================================

const express = require('express');
const router  = express.Router();
const {
  register, login, getProfile,
  updateTrustedContacts, verifyEmail, resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');

// Public routes (rate-limited per IP to slow password guessing / signup spam)
router.post('/register',             authLimiter, register);
router.post('/login',                authLimiter, login);
router.get('/verify-email',          authLimiter, verifyEmail);
router.post('/resend-verification',  authLimiter, resendVerification);

// Protected routes
router.get('/profile',  protect, getProfile);
router.put('/contacts', protect, updateTrustedContacts);

module.exports = router;
