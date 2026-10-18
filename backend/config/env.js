// ============================================
// HerGuardian — Environment validation
// Fails FAST (with a clear message) if something critical is missing, instead of
// crashing later with a confusing stack trace on the first user request.
// ============================================
const { isEmailConfigured, getProvider } = require('../utils/mailer');

const isProd = process.env.NODE_ENV === 'production';
const PLACEHOLDER = /(change[_-]?me|your[_-]|_here|example|xxxx|secret_key|placeholder)/i;

const validateEnv = () => {
  const errors   = [];
  const warnings = [];

  // ── Required ──────────────────────────────
  if (!process.env.MONGO_URI?.trim()) errors.push('MONGO_URI is not set (MongoDB Atlas connection string).');

  const jwt = process.env.JWT_SECRET || '';
  if (!jwt.trim()) {
    errors.push('JWT_SECRET is not set.');
  } else if (isProd && (jwt.length < 32 || PLACEHOLDER.test(jwt))) {
    errors.push(
      'JWT_SECRET is too short or still a placeholder. Generate one with:\n' +
      '    node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  } else if (jwt.length < 32 || PLACEHOLDER.test(jwt)) {
    warnings.push('JWT_SECRET looks weak/placeholder — fine for local dev, NOT for production.');
  }

  if (isProd && !process.env.CLIENT_URL?.trim()) {
    errors.push('CLIENT_URL is not set (your deployed frontend URL, e.g. https://herguardian.vercel.app). Needed for CORS + email links.');
  }

  if (errors.length) {
    console.error('\n❌ Cannot start — configuration problems:\n');
    errors.forEach((e) => console.error('  • ' + e));
    console.error('\nSee backend/.env.example and DEPLOYMENT.md.\n');
    process.exit(1);
  }

  // ── Optional integrations (warn only — app still runs) ──
  const hasTwilio = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'].every((k) => process.env[k]?.trim());
  if (!hasTwilio) warnings.push('Twilio not configured → SOS will send EMAIL only (no SMS).');

  if (!isEmailConfigured()) {
    warnings.push('Email not configured → verification emails and SOS emails are disabled. Set BREVO_API_KEY + EMAIL_FROM (recommended) or GMAIL_USER + GMAIL_APP_PASSWORD.');
  } else if (isProd && getProvider() === 'smtp') {
    warnings.push('EMAIL_PROVIDER=smtp in production. Render FREE tier blocks SMTP ports — if you are on it, switch to EMAIL_PROVIDER=brevo.');
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) warnings.push('ANTHROPIC_API_KEY not set → AI Assistant and Smart Health Insights are disabled.');

  warnings.forEach((w) => console.warn('⚠️  ' + w));
};

module.exports = { validateEnv, isProd };
