// api/_challenge-oto.js — the $67 Change My Life Challenge one-time offer that
// rides on every paid Shopify tea order.
//
// WHY THIS FILE EXISTS (2026-08-13, Joel): "wire up an OTO on all tea purchases
// for the Change My Life Challenge, normally 97 but OTO of 67."
//
// ── READ THIS BEFORE YOU TURN IT ON ──────────────────────────────────────
// When this was built, the Challenge was NOT a sellable product:
//   * no CHALLENGE_PRICE_ID / GA / VIP price existed in env (verified)
//   * bpquiz.com/challenge 307s to /masterclass (see vercel.json)
//   * changemylifechallenge.com 307s to bpquiz.com/masterclass
//   * api/challenge-signup.js was still configured for the Aug 4-6 cohort,
//     which had already finished a week earlier
// So there was no live $97 seat to anchor against and no cohort to deliver.
//
// Rather than invent a charge for an undefined thing, the OTO is gated behind
// TWO env vars and stays completely invisible until BOTH are set:
//
//   CHALLENGE_OTO_PRICE_ID       Stripe price for $67 (6700, one time)
//   CHALLENGE_OTO_COHORT_START   ET wall time the cohort starts,
//                                e.g. 2026-08-17T19:00:00
//
// Until then: the email drops the OTO block entirely and /tea-oto shows the
// free masterclass instead. Nothing lies, nothing charges, nothing 404s. This
// is the same honest-degrade pattern ChallengePage.jsx and challenge-signup.js
// already use when a price is missing.
//
// ── WHY COHORT DATES ARE ENV, NOT CONSTANTS ──────────────────────────────
// The last three cohorts all went stale in code (Aug 4-6 was still hardcoded
// in challenge-signup.js on Aug 13). A tea order can arrive at 2am on any day
// forever, so an OTO with a baked-in date WILL eventually promise a cohort
// that already ran. Here the date lives in one env var, and every label,
// countdown and expiry is derived from it. Roll the cohort by changing one
// value in Vercel, not by editing four files.

import crypto from 'node:crypto';

// ─── The offer ────────────────────────────────────────────────────────────
export const OTO_PRICE = 67;
export const OTO_ANCHOR = 97;      // CHALLENGE.PRICE in src/pages/ChallengePage.jsx
export const OTO_AMOUNT_CENTS = 6700;

// How long the buyer has after their tea order. A real one-time offer needs a
// real deadline, and the deadline has to be one we can actually enforce, so it
// is signed into the token rather than trusted from the page.
export const OTO_WINDOW_HOURS = 24;

export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── Signing (lazy, never at module scope) ────────────────────────────────
// 2026-08-02 lesson, see the header of triangle-unsubscribe.js: local scripts
// import this BEFORE dotenv.config() runs, so a module-scope secret read locks
// in the dev fallback and mints tokens production rejects. Read at call time.
const signingSecret = () => process.env.UNSUB_SECRET || process.env.CRON_SECRET || 'dev-unsub-secret';
const verifySecrets = () => [
  process.env.UNSUB_SECRET,
  process.env.CRON_SECRET,
  'dev-unsub-secret',
].filter(Boolean);

/**
 * Mint the OTO link token. The issue time is signed IN, so the 24 hour window
 * cannot be extended by editing the URL.
 */
export function signOtoToken({ email, issuedMs = Date.now() }) {
  const e = String(email || '').trim().toLowerCase();
  const t = String(issuedMs);
  const sig = crypto.createHmac('sha256', signingSecret()).update(`${e}:${t}`).digest('hex').slice(0, 24);
  return Buffer.from(`${e}:${t}:${sig}`).toString('base64url');
}

/**
 * @returns {{email: string, issuedMs: number, expiresMs: number, expired: boolean}|null}
 *          null means forged or malformed. An EXPIRED token still verifies and
 *          is returned with expired:true so the page can say "this ran out"
 *          instead of the scarier "that link did not work".
 */
export function verifyOtoToken(token) {
  try {
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const t = parts.pop();
    const email = parts.join(':'); // emails cannot contain ':' but rejoin defensively
    const issuedMs = Number(t);
    if (!email || !Number.isFinite(issuedMs)) return null;
    for (const secret of verifySecrets()) {
      const expected = crypto.createHmac('sha256', secret).update(`${email}:${t}`).digest('hex').slice(0, 24);
      if (sig === expected) {
        const expiresMs = issuedMs + OTO_WINDOW_HOURS * 3600_000;
        return { email, issuedMs, expiresMs, expired: Date.now() > expiresMs };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Cohort resolution ────────────────────────────────────────────────────
// CHALLENGE_OTO_COHORT_START is an ET WALL TIME string (2026-08-17T19:00:00),
// matching START_ISO_ET in ChallengePage.jsx. August is inside EDT (UTC-4);
// January is EST (UTC-5). Resolving the offset by month rather than assuming
// -04:00 is what keeps a winter cohort from being an hour off.
function etOffsetFor(isoWall) {
  const m = Number(String(isoWall).slice(5, 7));
  // Rough but correct for every cohort we have ever run (all start well inside
  // a month, never on a DST changeover weekend). March and November are the
  // only ambiguous months; both resolve to the side we have historically used.
  return m >= 3 && m <= 10 ? '-04:00' : '-05:00';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Everything the page and the email need to describe the offer, derived from
 * ONE env var so no two surfaces can disagree about the date.
 *
 * @returns {{live: boolean, reason?: string, priceId?: string, startMs?: number,
 *            startLabel?: string, timeLabel?: string, daysAway?: number}}
 */
export function otoStatus(now = Date.now()) {
  const priceId = (process.env.CHALLENGE_OTO_PRICE_ID || '').trim();
  const startWall = (process.env.CHALLENGE_OTO_COHORT_START || '').trim();

  if (!priceId) return { live: false, reason: 'no_price' };
  if (!startWall) return { live: false, reason: 'no_cohort' };

  const startMs = Date.parse(`${startWall}${etOffsetFor(startWall)}`);
  if (!Number.isFinite(startMs)) return { live: false, reason: 'bad_cohort_date' };

  // A cohort that already started is not something to sell to a tea buyer at
  // 2am. Silently stand down rather than take money for a class in the past.
  if (now >= startMs) return { live: false, reason: 'cohort_started' };

  // Label the start date in ET, the way every other Challenge surface does.
  const d = new Date(startMs);
  const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const startLabel = `${DAYS[et.getDay()]}, ${MONTHS[et.getMonth()]} ${et.getDate()}`;
  const h = et.getHours();
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  const timeLabel = `${hr12}:${String(et.getMinutes()).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'} ET`;

  return {
    live: true,
    priceId,
    startMs,
    startLabel,
    timeLabel,
    daysAway: Math.max(0, Math.ceil((startMs - now) / 86_400_000)),
  };
}

/** The tokenized OTO link that goes in the tea welcome email. */
export function otoUrl({ email, issuedMs }) {
  return `${SITE_URL}/tea-oto?t=${signOtoToken({ email, issuedMs })}`;
}
