// Client-side phone validation, shared by every form on the site.
//
// 2026-08-10 (Joel): "make phone numbers universally required where all our
// forms are". Before this, phone was on 6 of 19 forms and required on 2, so
// the same number was validated three different ways or not at all. One
// implementation now, here, matched by api/_phone.js on the server.
//
// THE RULE: 7 to 15 digits after stripping formatting. That is the E.164
// range. It accepts (502) 555-0142, 5025550142, +44 7700 900123 and
// 011-44-7700-900123 without arguing, because this audience is largely 45+
// and typing on a phone, and rejecting a real number over punctuation costs
// a lead for nothing.
//
// It deliberately does NOT try to be clever about country codes. A leading 0
// is a national trunk prefix that cannot be resolved without knowing the
// country, so it is accepted here and flagged at export time rather than
// guessed at. See scripts/export-phones-e164.mjs for that reasoning.

export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

export function phoneDigits(input) {
  return String(input || '').replace(/\D/g, '');
}

export function isValidPhone(input) {
  const d = phoneDigits(input);
  return d.length >= PHONE_MIN_DIGITS && d.length <= PHONE_MAX_DIGITS;
}

// What to show her when it fails. Never "invalid phone number": say what is
// wrong so she can fix it in one try.
export function phoneError(input) {
  const d = phoneDigits(input);
  if (!d) return 'Please add your phone number.';
  if (d.length < PHONE_MIN_DIGITS) return 'That phone number looks too short. Please check it.';
  if (d.length > PHONE_MAX_DIGITS) return 'That phone number looks too long. Please check it.';
  return '';
}

// Trimmed value to send. Keeps a leading + (country code) and drops nothing
// else: the server normalizes, and the raw form is preserved for humans.
export function cleanPhone(input) {
  return String(input || '').trim();
}
