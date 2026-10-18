// ============================================
// HerGuardian — Rate limiters
//
// IMPORTANT: server.js sets `app.set('trust proxy', 1)`. Without it, on Render/Railway
// every user appears to come from the platform's proxy IP, so ONE limit would be shared
// by ALL users (and express-rate-limit would log validation errors).
// ============================================
const rateLimit = require('express-rate-limit');

const base = { standardHeaders: 'draft-7', legacyHeaders: false };

// Whole API, per IP
const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

// Login / register / resend-verification, per IP (slows password guessing + signup spam)
const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// The limiters below run AFTER `protect`, so they are keyed per logged-in user.
const perUser = (req) => String(req.user._id);

// AI calls cost money — cap per user
const aiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  keyGenerator: perUser,
  message: { error: 'AI request limit reached. Please try again in a few minutes. For emergencies call 112 or Mahila Helpline 181.' },
});

// SOS: per-minute burst cap + hourly cap (every SOS can send up to 5 SMS + 5 emails)
const sosBurstLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: perUser,
  message: { error: 'SOS limit reached. Wait a minute before resending — or call 112 directly.' },
});
const sosHourlyLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: perUser,
  message: { error: 'Hourly SOS limit reached. Please call 112 directly.' },
});

module.exports = { globalLimiter, authLimiter, aiLimiter, sosBurstLimiter, sosHourlyLimiter };
