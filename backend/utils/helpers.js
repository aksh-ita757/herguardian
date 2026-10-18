// ============================================
// HerGuardian — Shared helpers
// ============================================

// Escape user-supplied text before putting it inside an HTML email.
// Without this, a name like <script> or <a href=...> would be rendered as HTML
// in the emails that trusted contacts receive.
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Remove CR/LF so a value can never inject extra email headers.
const singleLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

// Convert a phone number to E.164 (+<country><number>), which Twilio requires.
// Accepts: "+91 98765 43210", "98765-43210", "09876543210", "919876543210", "+14155552671"
// Returns null if the number cannot be understood.
const normalizePhone = (raw) => {
  if (typeof raw !== 'string') return null;
  const p = raw.replace(/[\s\-().]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(p)) return p;                       // already E.164
  if (/^00[1-9]\d{7,14}$/.test(p)) return `+${p.slice(2)}`;        // 0091...
  if (/^91[6-9]\d{9}$/.test(p)) return `+${p}`;                    // 91XXXXXXXXXX
  if (/^0?[6-9]\d{9}$/.test(p)) return `+91${p.replace(/^0/, '')}`; // Indian mobile
  return null;
};

const isValidEmail = (value) =>
  typeof value === 'string' &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

module.exports = { escapeHtml, singleLine, normalizePhone, isValidEmail };
