// GET /go/:product?mcp=<manychat contact id> — the attribution interstitial.
//
// ManyChat rebuild, 2026-08-14. Three of the six DM keywords point at products
// that do NOT live on bpquiz.com:
//   /tea       302 -> hormoneteas.com   (vercel.json redirects)
//   /magnesium 302 -> tiktok.com
//   /saffron   302 -> tiktok.com
// So a TEA, MAGNESIUM or SAFFRON tapper never arrives on this site, the
// `bw-landed` tag can never be written for her, and two things break that the
// design assumes work:
//   1. The 20h nudge is suppressed by `bw-landed`. Without it every tea clicker
//      gets "I do not think that link ever opened for you" — a false statement
//      sent to the segment that buys most. (Scale, from the live audit: the FB
//      Tea flow alone has sent 8,919 DMs and its one-tap tea button took 2,349
//      of them straight to the store. Revenue-share and AOV figures quoted
//      during the 2026-08-14 research were not reproducible against the audit
//      file, so they are deliberately not repeated here.)
//   2. The design's headline metric is dollars per 1,000 sends split TEA vs
//      everything else. With no landing signal it stays an inference forever.
//
// This route closes both: the DM button points here, we write the tag, then we
// hand her onward to the real destination.
//
// FAIL-OPEN IS THE WHOLE POINT. Tea is roughly 44% of revenue. A tagging call
// must never be able to cost a sale, so:
//   - the ManyChat write is bounded by TAG_TIMEOUT_MS and the redirect happens
//     regardless of whether it won;
//   - an unknown product, a missing mcp, a dead ManyChat, a missing API key and
//     a thrown exception all still redirect;
//   - the only path that does NOT redirect is an unknown product, which 302s to
//     the site root rather than 404ing at someone holding a phone.
//
// Wired in vercel.json as a rewrite: /go/:product -> /api/go?product=:product
// The destination table below MUST match the vercel.json redirects for the bare
// paths. tests/verify-go-destinations.mjs asserts that and fails the build if
// they drift.
import { addTagBySubscriberId } from './_manychat-tag.js';

// Keep in sync with vercel.json `redirects`. The parity test enforces it.
export const DESTINATIONS = {
  tea: 'https://hormoneteas.com/products/steady?utm_source=bpquiz&utm_medium=redirect&utm_campaign=tea',
  magnesium: 'https://www.tiktok.com/t/ZP9Mo41fRtHnU-pux7n/',
  saffron: 'https://www.tiktok.com/t/ZP9rebBAGVd8G-duWOM/',
};

const SITE_ROOT = 'https://bpquiz.com/';

// Same shape rule as api/mc-tag.js. Deliberately wider than "digits only" so a
// change in what {{cuid}} renders degrades to an untagged redirect rather than
// silently switching nudge suppression off with no error anywhere.
const CID_RE = /^[A-Za-z0-9_-]{5,64}$/;

// She is standing there waiting. ManyChat's addTagByName normally answers in
// well under this; if it does not, she goes on to the product page and we lose
// one tag. That is the correct trade every time.
const TAG_TIMEOUT_MS = 700;

function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req, res) {
  const product = String(firstParam(req.query?.product) || '').trim().toLowerCase();
  const destination = DESTINATIONS[product];

  // Unknown product: never 404 someone mid-tap. Send them somewhere real.
  if (!destination) {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, SITE_ROOT);
  }

  const cid = String(firstParam(req.query?.mcp) || '').trim();

  if (CID_RE.test(cid)) {
    try {
      // addTagBySubscriberId never throws and no-ops without MANYCHAT_API_KEY,
      // so this race only ever guards latency, not failure. No KV dedupe here
      // on purpose: ManyChat's addTagByName is idempotent, this path runs once
      // per tap, and every extra moving part on a money route is a liability.
      await Promise.race([
        addTagBySubscriberId(cid, 'bw-landed'),
        new Promise((resolve) => setTimeout(resolve, TAG_TIMEOUT_MS)),
      ]);
    } catch (err) {
      console.warn('go: tagging best-effort failure', err?.message);
    }
  }

  // 302, never 301: a permanent redirect would be cached by her browser and
  // every later tap would skip this route entirely, silently killing the tag.
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, destination);
}
