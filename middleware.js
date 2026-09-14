// Edge Middleware (Vercel).
//
// Two jobs, both of which must run BEFORE the filesystem:
//   1. changemylifechallenge.com root shell swap (original reason this exists)
//   2. /tea traffic split between the legacy page and the Shopify store
//
// ── 1. changemylifechallenge.com ────────────────────────────────────────
// dist/index.html carries BPQuiz's <title>/og:* tags, and crawlers do not run
// JS, so shares of changemylifechallenge.com showed the BP quiz card. A
// vercel.json rewrite of "/" cannot fix this because the filesystem match for
// index.html wins before rewrites are evaluated. Middleware runs BEFORE the
// filesystem, so the challenge domain's root is rewritten to /cmlc.html, the
// crawler-correct copy of the shell emitted by scripts/cmlc-meta.mjs at build
// time. Same JS bundle, same page; only the static <head> differs.
//
// ── 2. /tea split (2026-08-16, Joel) ────────────────────────────────────
// Tea moved to Shopify (hormoneteas.com) and /tea was pointed there wholesale.
// Joel wants to split traffic back across the legacy long-form page to see
// which converts. The two vercel.json redirects that used to own /tea were
// REMOVED and replaced by this, because config redirects and a middleware
// rewrite of the same path fight each other and the winner is not obvious.
// One owner for /tea is worth more than a clever two-layer setup.
//
// ⛔ SPLIT ENDED 2026-09-14 (Joel): "stop the split and push just to the 60 bag."
// Two weeks of arm-tagged data showed revenue per visitor tied ($1.11 vs $1.10)
// and a gap that would need ~590 weeks of traffic to prove, so it was called on
// margin instead. TEA_SPLIT_PCT is set to 0 in Vercel production. Do not raise
// it again without Joel: the legacy page still sells the $48 / 100 g bag.
//
// ⚠️ DEFAULTS TO OFF. With TEA_SPLIT_PCT unset or 0, every visitor is sent to
// Shopify, byte for byte the behavior /tea had before this file changed. The
// split only starts when someone sets the env var on purpose.
//
// ⚠️ READ BEFORE TURNING IT ON: as of 2026-08-16 the legacy page sells a
// DIFFERENT product at a DIFFERENT price ($48 / $120 for a 100 g pouch, vs
// $60 / $150 for 150 g on Shopify). Running the split in that state is not a
// page test: price, product size and page all change at once, so the result
// is uninterpretable, AND half of buyers would purchase a 100 g bag that is
// no longer stocked. Align public/tea/index.html to $60 / $150 / 150 g first,
// or accept that you are running a deliberate discount test.

// 2026-09-14: '/tea/' and '/tea/index.html' added. Before this, only the bare
// '/tea' passed through the split. The trailing-slash form — which every tea
// link in the email drips uses (triangle-lead-cron, _evergreen-emails,
// TeaOneClickOffer) — skipped middleware entirely and always served the $48
// legacy page. So email buyers were never in the test, and turning the split
// off would not have moved them to the $60 bag. Emails already sitting in
// inboxes can only be caught here, server-side, which is why this is fixed in
// routing rather than by rewriting the links.
export const config = { matcher: ['/', '/tea', '/tea/', '/tea/index.html', '/allin'] };

const SHOPIFY_URL = 'https://hormoneteas.com/products/steady';
const COOKIE = 'tea_arm';
const COOKIE_DAYS = 90;

// Percent of /tea visitors held on the LEGACY page. 0 (or unset) = everyone
// goes to Shopify. Clamped, and any unparseable value is treated as 0 so a
// typo can never silently start an experiment.
function legacyPct() {
  const raw = parseInt(process.env.TEA_SPLIT_PCT || '0', 10);
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, raw));
}

function readCookie(request, name) {
  const jar = request.headers.get('cookie') || '';
  for (const part of jar.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function teaSplit(request, url) {
  const pct = legacyPct();

  // Manual override for testing, mirroring the ?sabbath=force convention
  // already used across this codebase. Does NOT set the cookie: a forced view
  // must never pin a real visitor into an arm.
  const forced = url.searchParams.get('tea');
  if (forced === 'legacy') return serveLegacy(url, null);
  if (forced === 'shopify') return sendToShopify(url, 'forced', null);

  if (pct === 0) return sendToShopify(url, 'off', null);

  // Sticky: once bucketed, a visitor sees the same arm for COOKIE_DAYS. Without
  // this, a reload reshuffles them and the conversion data is meaningless.
  let arm = readCookie(request, COOKIE);
  let setCookie = null;
  if (arm !== 'legacy' && arm !== 'shopify') {
    arm = Math.random() * 100 < pct ? 'legacy' : 'shopify';
    setCookie = `${COOKIE}=${arm}; Path=/; Max-Age=${COOKIE_DAYS * 86400}; SameSite=Lax; Secure`;
  }

  return arm === 'legacy' ? serveLegacy(url, setCookie) : sendToShopify(url, 'split', setCookie);
}

// Rewrite, not redirect: the visitor stays on bpquiz.com/tea so the URL they
// were sent is the URL they see, and inbound links/QRs keep working.
function serveLegacy(url, setCookie) {
  const dest = new URL('/tea/index.html', url);
  const headers = { 'x-middleware-rewrite': dest.toString() };
  if (setCookie) headers['set-cookie'] = setCookie;
  return new Response(null, { headers });
}

// 307, deliberately not 308: a permanent redirect gets hard-cached by browsers
// and would strand that visitor on Shopify forever, outliving the experiment.
function sendToShopify(url, reason, setCookie) {
  const dest = new URL(SHOPIFY_URL);
  dest.searchParams.set('utm_source', 'bpquiz');
  dest.searchParams.set('utm_medium', 'redirect');
  dest.searchParams.set('utm_campaign', 'tea');
  dest.searchParams.set('arm', reason === 'split' ? 'shopify' : reason);
  // Preserve any campaign params the visitor arrived with, without letting
  // them clobber the attribution above.
  for (const [k, v] of url.searchParams) {
    if (!dest.searchParams.has(k)) dest.searchParams.set(k, v);
  }
  const headers = { location: dest.toString() };
  if (setCookie) headers['set-cookie'] = setCookie;
  return new Response(null, { status: 307, headers });
}

export default function middleware(request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  if (url.pathname === '/tea' || url.pathname === '/tea/' || url.pathname === '/tea/index.html') {
    return teaSplit(request, url);
  }

  if (host === 'changemylifechallenge.com' || host === 'www.changemylifechallenge.com') {
    // 2026-09-01 (Joel): shares of changemylifechallenge.com/allin showed the
    // BPQuiz card (crawlers read the SPA shell's head). Rewrite that ONE path
    // on this host to dist/allin-share.html — same bundle, Accelerator og:*
    // tags, duo photo. bpquiz.com/allin is untouched (host-guarded here).
    if (url.pathname === '/allin') {
      const dest = new URL('/allin-share.html', url);
      return new Response(null, { headers: { 'x-middleware-rewrite': dest.toString() } });
    }
    if (url.pathname !== '/') return undefined;
    // 2026-08-17 (Joel): the domain root now serves the NEW static challenge
    // page (Joel's B design, $97 seat, cohort 2026-08-17) instead of the SPA
    // shell /cmlc.html. Same rewrite mechanism as before: middleware runs
    // before the filesystem, visitor keeps the changemylifechallenge.com URL,
    // and the static file carries its own crawler-correct <head>. Every other
    // path on this host still falls through to the SPA (/payment,
    // /challenge-confirmed, /challenge). NOTE (2026-08-21, Joel): this domain
    // NOW CARRIES a Sabbath gate (public/sabbath-gate.js, loaded by the
    // static page itself), reversing the earlier keep-it-off decision.
    const dest = new URL('/challenge-b/index.html', url);
    return new Response(null, { headers: { 'x-middleware-rewrite': dest.toString() } });
  }
  return undefined;
}
