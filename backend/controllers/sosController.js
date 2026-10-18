// ============================================
// HerGuardian — SOS Controller v2 (production-hardened)
// SMS (Twilio) + Email (Brevo API / SMTP)
// Evidence photo, GPS fallback, voice trigger
//
// Reliability notes
//  • All contacts, and both channels per contact, are contacted IN PARALLEL
//    (seconds matter in an emergency).
//  • If NOTHING could be delivered we return an error — we never tell a user
//    "SOS sent" when it wasn't.
//  • A missing Twilio/email config degrades gracefully instead of crashing.
// ============================================
const twilio = require('twilio');
const User   = require('../models/User');
const SOS    = require('../models/SOS');
const { sendMail, isEmailConfigured } = require('../utils/mailer');
const { escapeHtml, singleLine, normalizePhone } = require('../utils/helpers');

// ── Twilio (lazy; returns null if not configured) ────────────────────
let twilioClient;
const getTwilio = () => {
  if (twilioClient !== undefined) return twilioClient;
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_PHONE_NUMBER: from } = process.env;
  if (!sid?.trim() || !token?.trim() || !from?.trim()) {
    twilioClient = null;
  } else {
    try { twilioClient = twilio(sid, token); }
    catch (e) { console.error('Twilio init failed:', e.message); twilioClient = null; }
  }
  return twilioClient;
};

const JPEG_PREFIX = 'data:image/jpeg;base64,';
const MAX_EVIDENCE_B64 = 6_000_000; // ~4.5 MB of image

const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

const buildEmailHtml = ({ name, message, locationDisplay, mapsLink, directionsLink, triggerLabel, hasEvidence }) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #eee;">
  <div style="background:linear-gradient(135deg,#8b1a3a,#c0395c);padding:28px;text-align:center;">
    <div style="font-size:48px;">🚨</div>
    <h1 style="color:white;margin:8px 0 4px;">EMERGENCY ALERT</h1>
    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:13px;">HerGuardian · ${escapeHtml(triggerLabel)}</p>
  </div>
  <div style="padding:28px;background:#fff;">
    <h2 style="color:#8b1a3a;margin-top:0;">${escapeHtml(name)} needs your immediate help!</h2>
    <div style="background:#fff5f7;border-left:4px solid #c0395c;padding:16px;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0;font-size:16px;">"${escapeHtml(message)}"</p>
    </div>
    <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 6px;font-weight:700;color:#8b1a3a;">📍 Her Location:</p>
      <p style="margin:0;color:#333;">${escapeHtml(locationDisplay)}</p>
    </div>
    ${mapsLink ? `
      <a href="${mapsLink}" style="display:block;background:linear-gradient(135deg,#e8758a,#c0395c);color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;margin-bottom:10px;">📍 View on Google Maps</a>
      <a href="${directionsLink}" style="display:block;background:linear-gradient(135deg,#4285f4,#2d6ee8);color:white;text-align:center;padding:12px;border-radius:12px;text-decoration:none;font-weight:700;">🧭 Get Directions</a>` : ''}
    <div style="background:#fff3cd;border-radius:8px;padding:14px;text-align:center;margin-top:16px;">
      <b>Police: 100 | Emergency: 112 | Mahila Helpline: 181</b>
    </div>
    ${hasEvidence ? '<p style="color:#555;font-size:13px;margin-top:12px;">📷 Auto-captured evidence photo attached.</p>' : ''}
  </div>
</div>`;

const sendSOS = async (req, res) => {
  const startTime = Date.now();
  try {
    const { latitude, longitude, address, message, evidenceImage, triggeredBy: rawTrigger } = req.body;
    const triggeredBy = ['manual', 'voice', 'timer'].includes(rawTrigger) ? rawTrigger : 'manual';

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    // Anti-abuse: stops throw-away accounts from using SOS to message arbitrary numbers.
    // Set SOS_REQUIRE_VERIFIED_EMAIL=false to allow unverified users.
    if (process.env.SOS_REQUIRE_VERIFIED_EMAIL !== 'false' && !user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before using SOS alerts. In an emergency call 112 directly.',
      });
    }

    if (!user.trustedContacts || user.trustedContacts.length === 0) {
      return res.status(400).json({ error: 'No trusted contacts saved. Please add contacts in your profile first.' });
    }

    // ── Sanitise inputs ──────────────────────
    const lat = toNum(latitude);
    const lng = toNum(longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    const mapsLink       = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : null;
    const directionsLink = hasCoords ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null;
    const cleanAddress   = typeof address === 'string' ? singleLine(address).slice(0, 200) : '';
    const locationDisplay = cleanAddress || (hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Location unavailable');
    const cleanMessage   = (typeof message === 'string' && message.trim() ? message.trim() : 'I need immediate help!').slice(0, 300);
    const userName       = singleLine(user.name);
    const triggerLabel   = triggeredBy === 'voice' ? '🎙️ Voice-Activated' : triggeredBy === 'timer' ? '⏱️ Auto-Timer' : '👆 Manual Tap';

    let evidenceB64 = null;
    if (typeof evidenceImage === 'string' && evidenceImage.startsWith(JPEG_PREFIX)) {
      const b64 = evidenceImage.slice(JPEG_PREFIX.length);
      if (b64.length <= MAX_EVIDENCE_B64 && /^[A-Za-z0-9+/=]+$/.test(b64)) evidenceB64 = b64;
    }

    const smsBody = [
      `🚨 EMERGENCY ALERT from ${userName}!`, ``,
      cleanMessage, ``,
      `📍 Location:`, hasCoords ? mapsLink : locationDisplay, ``,
      `Trigger: ${triggerLabel}`,
      `Please respond or call 100/112.`,
      `— HerGuardian`,
    ].join('\n');

    const html = buildEmailHtml({
      name: userName, message: cleanMessage, locationDisplay,
      mapsLink, directionsLink, triggerLabel, hasEvidence: Boolean(evidenceB64),
    });
    const emailAttachments = evidenceB64
      ? [{ filename: `evidence_${Date.now()}.jpg`, contentBase64: evidenceB64, contentType: 'image/jpeg' }]
      : [];

    const client = getTwilio();
    const emailOn = isEmailConfigured();

    // ── Notify one contact on both channels at once ──
    const notifyContact = async (contact) => {
      const result = { name: contact.name, phone: contact.phone, email: contact.email, smsSent: false, emailSent: false };

      const sms = (async () => {
        if (!client) return;
        await client.messages.create({
          body: smsBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to:   normalizePhone(contact.phone) || contact.phone,
        });
        result.smsSent = true;
      })().catch((e) => console.error('SMS failed:', e.message));

      const mail = (async () => {
        if (!emailOn) return;
        await sendMail({
          to:      contact.email,
          subject: `🚨 EMERGENCY — ${userName} needs help RIGHT NOW!`,
          html,
          attachments: emailAttachments,
        });
        result.emailSent = true;
      })().catch((e) => console.error('Email failed:', e.message));

      await Promise.all([sms, mail]);
      return result;
    };

    const alertsSent = await Promise.all(user.trustedContacts.map(notifyContact));

    const delivered = alertsSent.filter((a) => a.smsSent || a.emailSent).length;
    const status = delivered === alertsSent.length ? 'sent' : delivered > 0 ? 'partial' : 'failed';
    const responseTime = Date.now() - startTime;

    const sosRecord = await SOS.create({
      user: req.user._id,
      location: { latitude: hasCoords ? lat : null, longitude: hasCoords ? lng : null, address: locationDisplay },
      alertsSent, responseTime, status,
      message: cleanMessage,
      triggeredBy, hasEvidence: Boolean(evidenceB64),
    });

    // Never claim success if nothing was delivered.
    if (delivered === 0) {
      return res.status(502).json({
        error: '🚨 We could not deliver your alert. Call 112 or 100 immediately!',
        alertsSent, sosId: sosRecord._id,
      });
    }

    res.json({
      success: true,
      message: `🚨 SOS delivered to ${delivered} of ${alertsSent.length} contacts in ${responseTime}ms`,
      status, responseTime, alertsSent, mapsLink, sosId: sosRecord._id,
    });

  } catch (error) {
    console.error('SOS Error:', error.message);
    res.status(500).json({ error: 'SOS failed. Call 100 or 112 directly.' });
  }
};

const getSOSHistory = async (req, res) => {
  try {
    const history = await SOS.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, history });
  } catch { res.status(500).json({ error: 'Could not fetch SOS history' }); }
};

module.exports = { sendSOS, getSOSHistory };
