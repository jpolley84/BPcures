// Server-side phone normalization, shared by every API that accepts one.
//
// 2026-08-10 (Joel): phone is now required on every form, so every endpoint
// that takes an email takes a phone too. This is the single implementation.
// api/challenge-signup.js and api/coaching-apply.js each had their own inline
// copy of exactly this logic; they now import from here so the rule cannot
// drift between endpoints.
//
// Mirrors src/utils/phone.js on the client. 7 to 15 digits after stripping
// formatting, which is the E.164 range.

export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

// Returns the trimmed phone, or '' when it is not a usable shape.
//
// RETURNS EMPTY RATHER THAN THROWING, on purpose. The client already blocks
// an empty or malformed phone, so anything reaching here that fails is either
// a stale cached client or somebody posting directly. In both cases the EMAIL
// is the thing we cannot afford to lose, and silently storing '' beats
// rejecting a real lead over a formatting edge case. Endpoints that genuinely
// must have a phone should check the return value and 400 themselves.
export function normalizePhone(input) {
  const raw = String(input || '').replace(/[^\d+]/g, '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) return '';
  return raw;
}

export function isValidPhone(input) {
  return normalizePhone(input) !== '';
}
