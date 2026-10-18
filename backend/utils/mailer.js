// ============================================
// HerGuardian — Mailer
//
// Two providers, one interface:
//
//   EMAIL_PROVIDER=brevo  → Brevo HTTPS API  (RECOMMENDED for cloud hosting)
//                           Works on Render free tier, Railway, Vercel, etc.
//                           because it uses normal HTTPS (port 443).
//
//   EMAIL_PROVIDER=smtp   → Gmail / any SMTP server (nodemailer)
//                           Fine for local development, VPS, or paid hosts.
//                           ⚠ Render's FREE tier blocks SMTP ports 25/465/587,
//                             so SMTP will time out there.
//
// If EMAIL_PROVIDER is not set it is auto-detected:
//   BREVO_API_KEY present            → brevo
//   GMAIL_USER + GMAIL_APP_PASSWORD  → smtp
//   neither                          → none (email features disabled, never crashes)
// ============================================
const axios      = require('axios');
const nodemailer = require('nodemailer');
const { singleLine } = require('./helpers');

const getProvider = () => {
  const explicit = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'smtp';
  return 'none';
};

const isEmailConfigured = () => {
  const p = getProvider();
  if (p === 'brevo') return Boolean(process.env.BREVO_API_KEY && (process.env.EMAIL_FROM || process.env.GMAIL_USER));
  if (p === 'smtp')  return Boolean((process.env.SMTP_USER || process.env.GMAIL_USER) && (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD));
  return false;
};

const fromAddress = () => process.env.EMAIL_FROM || process.env.GMAIL_USER || '';
const fromName    = () => singleLine(process.env.EMAIL_FROM_NAME || 'HerGuardian').replace(/"/g, '');

// ── SMTP (lazy, with short timeouts so it fails fast instead of hanging) ──
let smtpTransport = null;
const getSmtp = () => {
  if (smtpTransport) return smtpTransport;
  const port = Number(process.env.SMTP_PORT) || 465;
  smtpTransport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     20000,
  });
  return smtpTransport;
};

/**
 * Send an email.
 * @param {{to: string, subject: string, html: string,
 *          attachments?: {filename: string, contentBase64: string, contentType?: string}[]}} mail
 * Throws on failure — callers decide whether that is fatal.
 */
const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const provider = getProvider();

  if (!isEmailConfigured()) {
    throw new Error('Email is not configured (set BREVO_API_KEY + EMAIL_FROM, or GMAIL_USER + GMAIL_APP_PASSWORD)');
  }

  if (provider === 'brevo') {
    const body = {
      sender:      { name: fromName(), email: fromAddress() },
      to:          [{ email: to }],
      subject:     singleLine(subject),
      htmlContent: html,
    };
    if (attachments.length) {
      body.attachment = attachments.map((a) => ({ name: a.filename, content: a.contentBase64 }));
    }
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', body, {
        headers: {
          'api-key':      process.env.BREVO_API_KEY,
          'content-type': 'application/json',
          accept:         'application/json',
        },
        timeout: 15000,
      });
    } catch (err) {
      // Surface Brevo's own error message (e.g. "sender not verified") in the logs
      const detail = err.response?.data?.message || err.message;
      throw new Error(`Brevo API error: ${detail}`);
    }
    return;
  }

  if (provider === 'smtp') {
    await getSmtp().sendMail({
      from:    `"${fromName()}" <${fromAddress()}>`,
      to,
      subject: singleLine(subject),
      html,
      attachments: attachments.map((a) => ({
        filename:    a.filename,
        content:     a.contentBase64,
        encoding:    'base64',
        contentType: a.contentType || 'application/octet-stream',
      })),
    });
    return;
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}" (use "brevo" or "smtp")`);
};

module.exports = { sendMail, isEmailConfigured, getProvider };
