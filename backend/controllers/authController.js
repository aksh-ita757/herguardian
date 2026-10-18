// ============================================
// HerGuardian v2 — Auth Controller (production-hardened)
// Email goes through utils/mailer.js (Brevo HTTPS API or SMTP)
// ============================================

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const { sendMail, isEmailConfigured } = require('../utils/mailer');
const { escapeHtml, normalizePhone, isValidEmail } = require('../utils/helpers');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const clientUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');

const publicUser = (user, extra = {}) => ({
  id:              user._id,
  name:            user.name,
  email:           user.email,
  phone:           user.phone,
  isEmailVerified: user.isEmailVerified,
  trustedContacts: user.trustedContacts || [],
  ...extra,
});

// ── SEND VERIFICATION EMAIL ──────────────────
const sendVerificationEmail = async (user, token) => {
  const verifyURL = `${clientUrl()}/verify-email?token=${token}`;
  const safeName  = escapeHtml(user.name);

  await sendMail({
    to:      user.email,
    subject: '🌸 Verify your HerGuardian email',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#6b2d45,#c0395c);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:26px;">🌸 HerGuardian</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your Safe Space</p>
        </div>
        <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #eee;">
          <h2 style="color:#6b2d45;margin-top:0;">Hello, ${safeName}! 👋</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Thank you for creating your HerGuardian account. Please verify your email address to activate all features including SOS alerts and health tracking.
          </p>
          <a href="${verifyURL}"
             style="display:block;background:linear-gradient(135deg,#e8758a,#c0395c);color:white;text-align:center;padding:16px 24px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;margin:24px 0;">
            ✅ Verify My Email Address
          </a>
          <p style="color:#999;font-size:13px;text-align:center;">
            This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #f0e8ee;margin:24px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">
            Or paste this link in your browser:<br/>
            <span style="color:#e8758a;word-break:break-all;">${verifyURL}</span>
          </p>
        </div>
      </div>
    `,
  });
};

// ── REGISTER ─────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (![name, email, phone, password].every((v) => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must be 128 characters or fewer.' });
    }
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Please enter a valid phone number, e.g. +91 98765 43210.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered. Please sign in.' });
    }

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name:  name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password,
      emailVerifyToken:   verifyToken,
      emailVerifyExpires: verifyExpires,
      isEmailVerified:    false,
    });

    // Don't fail registration if the email provider is down — user can hit "resend".
    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        await sendVerificationEmail(user, verifyToken);
        emailSent = true;
      } catch (emailErr) {
        console.error('Verification email failed to send:', emailErr.message);
      }
    } else {
      console.warn('Verification email NOT sent — email provider not configured.');
    }

    res.status(201).json({
      success:              true,
      message:              'Account created! Please check your email to verify your account.',
      requiresVerification: true,
      emailSent,
      token:                generateToken(user._id),
      user:                 publicUser(user, { isEmailVerified: false, trustedContacts: [] }),
    });
  } catch (error) {
    if (error.code === 11000) { // race: two signups with same email at once
      return res.status(400).json({ error: 'Email already registered. Please sign in.' });
    }
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ── VERIFY EMAIL ─────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // SECURITY: must be a plain string. Without this check, "?token[$ne]=x" is parsed by
    // Express into an object and would match the first unverified user → account takeover.
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'Invalid or missing verification token.' });
    }

    const user = await User.findOne({
      emailVerifyToken:   token,
      emailVerifyExpires: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification link. Please request a new one.',
      });
    }

    user.isEmailVerified    = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to HerGuardian 🌸',
      token:   generateToken(user._id),
      user:    publicUser(user, { isEmailVerified: true }),
    });
  } catch (error) {
    console.error('Verify email error:', error.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// ── RESEND VERIFICATION ──────────────────────
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Same response whether or not the account exists (prevents email enumeration)
    if (!user) {
      return res.json({ success: true, message: 'If this email exists, a verification link has been sent.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This email is already verified. Please sign in.' });
    }

    const verifyToken       = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken   = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user, verifyToken);
    } catch (emailErr) {
      console.error('Resend verification email failed:', emailErr.message); // details stay in server logs
      return res.status(502).json({ error: 'We could not send the email right now. Please try again in a few minutes.' });
    }
    res.json({ success: true, message: 'Verification email resent! Please check your inbox.' });
  } catch (error) {
    console.error('Resend verify error:', error.message);
    res.status(500).json({ error: 'Could not resend verification email.' });
  }
};

// ── LOGIN ─────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.isActive === false) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token:   generateToken(user._id),
      user:    publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ── GET PROFILE ──────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
};

// ── UPDATE TRUSTED CONTACTS ──────────────────
const updateTrustedContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array.' });
    }
    if (contacts.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 trusted contacts allowed.' });
    }

    const cleaned = [];
    for (const c of contacts) {
      const name  = typeof c?.name === 'string' ? c.name.trim().slice(0, 80) : '';
      const phone = normalizePhone(c?.phone);
      const email = typeof c?.email === 'string' ? c.email.trim().toLowerCase() : '';

      if (!name || !email) {
        return res.status(400).json({ error: 'Each contact must have a name, phone, and email.' });
      }
      // Twilio needs international format; we convert 98765 43210 → +919876543210 automatically.
      if (!phone) {
        return res.status(400).json({
          error: `"${name}": phone number is not valid. Use international format, e.g. +91 98765 43210.`,
        });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: `"${name}": email address is not valid.` });
      }
      cleaned.push({ name, phone, email });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { trustedContacts: cleaned },
      { new: true, runValidators: true }
    );
    res.json({ success: true, trustedContacts: user.trustedContacts, message: 'Contacts saved successfully!' });
  } catch (error) {
    console.error('Update contacts error:', error.message);
    res.status(500).json({ error: 'Could not update contacts.' });
  }
};

module.exports = {
  register, login, getProfile,
  updateTrustedContacts, verifyEmail, resendVerification,
};
