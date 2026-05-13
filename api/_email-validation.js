// api/_email-validation.js — shared email shape + injection-safety check.
//
// 2026-05-13 hardening sprint: extracted from the per-handler implementations
// in lead-magnet.js / purchase-confirmation.js / waitlist-submit.js /
// challenge-signup.js so all four use the same definition. The audit caught
// drift — some endpoints used `email.includes('@')` (too loose) and others
// used the full regex. This is the single source of truth.
//
// Two checks layered:
//   1. RFC-ish shape: local@host.tld (no whitespace, no missing pieces)
//   2. Header-injection safety: rejects CRLF (\r\n) chars, which an attacker
//      could use to inject Bcc / Reply-To / arbitrary mail headers when the
//      address is used in a Resend `to:` / `reply_to:` field.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER_INJECTION_RE = /[\r\n\0]/;

export function looksLikeValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (v.length > 254) return false; // RFC 5321 max
  if (HEADER_INJECTION_RE.test(v)) return false; // CRLF defense for header fields
  return EMAIL_RE.test(v);
}

// Returns the trimmed/normalized email if valid, throws otherwise.
// Use when you need an exception path (e.g., before a Resend send where
// silent rejection costs sender reputation).
export function requireValidEmail(value, fieldName = 'email') {
  if (!looksLikeValidEmail(value)) {
    const err = new Error(`Invalid ${fieldName} shape: ${JSON.stringify(value)}`);
    err.code = 'INVALID_EMAIL_SHAPE';
    throw err;
  }
  return value.trim();
}
