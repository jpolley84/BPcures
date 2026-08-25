// PostHog product analytics — funnel events for the bpquiz funnel.
// No-ops entirely unless VITE_POSTHOG_KEY is set at build time, so local dev
// and preview builds without a key produce zero network traffic. Every call
// is try/caught: analytics must never block or break the buyer's UX.
import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let enabled = false;

export function initAnalytics() {
  if (!KEY || typeof window === 'undefined') return;
  try {
    posthog.init(KEY, {
      api_host: HOST,
      // '2025-05-24' defaults = SPA pageviews on history change (this is a
      // react-router app — without it only the first landing fires a pageview).
      defaults: '2025-05-24',
      capture_pageleave: true,
      autocapture: true,
    });
    enabled = true;

    // Record the first-touch utm_* for this device before anything navigates
    // away. Runs on every page load; only the first hit that carries UTMs wins.
    captureFirstTouchUtm();

    // 2026-07-26: 'funnel_version' was briefly registered as a PERSISTENT
    // super property. posthog.register() writes for the cookie lifetime
    // (~365 days), so one visit to a foods101 page permanently relabelled
    // every later event on that device, including events from every other
    // funnel. funnel_version is an EVENT property now (PayPage derives it
    // per view). Clearing it once at boot drains devices already carrying
    // the stale value; it is a no-op on devices that never had it.
    unregisterSuperProp('funnel_version');

    // Resolve + stamp the homepage A/B variant in the SAME task as init().
    // posthog schedules the first $pageview with setTimeout(fn, 1), so
    // anything synchronous here wins the race and the device's FIRST event
    // already carries ab_home_variant. Waiting for React to mount HomeSplit
    // always lost that race, which is how the last test ended up with a large
    // share of pageviews carrying no variant at all. HomeSplit calls this
    // again on mount (it is memoized, so the second call is free) and that is
    // the fallback when there is no PostHog key.
    if (isHomeSplitRoute()) resolveHomeVariant();
  } catch { /* analytics never blocks UX */ }
}

export function track(event, props) {
  try { if (enabled) posthog.capture(event, props); } catch { /* noop */ }
}

/* ── first-touch UTM attribution ──────────────────────────────────────────
 * 2026-08-25: the ManyChat DM engine drives ~61% of quiz starts, but the
 * server-side `purchase` event carried NO utm_* at all (it is emitted from
 * api/stripe-webhook.js, which never sees the browser). Every sale therefore
 * bucketed as "untagged" and revenue-per-DM-flow was unknowable.
 *
 * The DM link lands on / or /quiz carrying ?utm_source=...; by the time the
 * buyer reaches /pay the query string is long gone, so the values must be
 * persisted at first touch and threaded through Stripe session metadata.
 *
 * FIRST touch, not last: the question this answers is "did the DM engine
 * produce this buyer", and a later click from a drip email must not steal
 * the credit. Once written, the record is never overwritten until it expires.
 */
const UTM_KEY = 'bpq_ft_utm';
const UTM_TTL_MS = 90 * 24 * 60 * 60 * 1000;  // 90 days
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Stripe metadata values cap at 500 chars; keep each field far below that and
// strip control characters so nothing downstream has to sanitize again.
function cleanUtm(v) {
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 120);
}

// Reads utm_* off the current URL and stores them if this device has no
// unexpired record yet. Safe to call on every page load. Never throws.
export function captureFirstTouchUtm() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const params = new URLSearchParams(window.location.search);
    const found = {};
    for (const f of UTM_FIELDS) {
      const v = params.get(f);
      if (v) found[f] = cleanUtm(v);
    }
    if (!Object.keys(found).length) return;   // nothing to record on this hit

    const existing = getFirstTouchUtm();
    if (Object.keys(existing).length) return; // first touch already won

    found.utm_landing = cleanUtm(window.location.pathname);
    window.localStorage.setItem(UTM_KEY, JSON.stringify({ t: Date.now(), v: found }));
  } catch { /* analytics never blocks UX */ }
}

// The stored first-touch UTM object, or {} when absent/expired/unreadable.
// Threaded into checkout POST bodies -> Stripe session metadata -> the
// server-side purchase event (api/_posthog.js capturePurchase).
export function getFirstTouchUtm() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(UTM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.v) return {};
    if (!parsed.t || Date.now() - parsed.t > UTM_TTL_MS) {
      window.localStorage.removeItem(UTM_KEY);
      return {};
    }
    return parsed.v;
  } catch { return {}; }
}


// Current browser distinct id, threaded through Stripe checkout metadata so
// server-side purchase events land on the same PostHog person as the clicks.
// Returns '' when analytics is disabled or anything throws.
export function getDistinctId() {
  try {
    if (enabled) return posthog.get_distinct_id() || '';
  } catch { /* noop */ }
  return '';
}

// Registers PostHog super properties (attached to every subsequent event on
// this device). Used by the homepage A/B split so 'ab_home_variant' rides on
// every event without threading it through each track() call. No-ops when
// analytics is disabled (no VITE_POSTHOG_KEY) or anything throws.
export function registerSuperProps(props) {
  try { if (enabled && props) posthog.register(props); } catch { /* noop */ }
}

// Drops a previously registered super property from this device's persistent
// store. Used at boot to clear 'funnel_version', which must never have been
// device-global. Safe to call for a name that was never registered.
export function unregisterSuperProp(name) {
  try { if (enabled && name) posthog.unregister(name); } catch { /* noop */ }
}

/* ── homepage A/B assignment ──────────────────────────────────────────────
   Lives here, not in HomeSplit.jsx, for ONE reason: it has to run before
   posthog fires the device's first $pageview, and a React component cannot.
   initAnalytics() calls it synchronously at boot on the split route;
   HomeSplit calls it again on mount for its render decision.
   Storage key 'bpq_ab_home' is shared with getAbHomeVariant() below, which is
   what threads the variant into Stripe metadata. */

const AB_HOME_KEY = 'bpq_ab_home';

// Hostnames whose '/' is NOT HomeSplit (App.jsx SUBDOMAIN_PAGE serves a client
// intake there instead). Keep in sync with that map: cohorting a visitor who
// never saw either arm just adds noise to the counts.
const AB_HOME_SKIP_HOSTS = new Set(['wakita.bpquiz.com', 'waitlist.bpquiz.com']);

let abHomeResolved = false;
let abHomeVariant = 'a';
let abHomeCohorted = false;

function isHomeSplitRoute() {
  try {
    return window.location.pathname === '/' && !AB_HOME_SKIP_HOSTS.has(window.location.hostname);
  } catch {
    return false;
  }
}

function readStoredHomeVariant() {
  try {
    const v = localStorage.getItem(AB_HOME_KEY);
    return v === 'a' || v === 'b' ? v : null;
  } catch {
    return null;
  }
}

function persistHomeVariant(variant) {
  try {
    localStorage.setItem(AB_HOME_KEY, variant);
    return true;
  } catch {
    return false;
  }
}

// Resolves the sticky 50/50 homepage variant ONCE per page load and registers
// it as a super property before anything else fires. Returns the variant to
// RENDER. Forced preview: ?ab=a / ?ab=b renders that arm without touching the
// stored assignment, unless ?ab_persist=1 is also set.
export function resolveHomeVariant() {
  if (abHomeResolved) return abHomeVariant;
  abHomeResolved = true;

  let params = null;
  try { params = new URLSearchParams(window.location.search); } catch { /* noop */ }
  const forced = params ? params.get('ab') : null;
  const forcedValid = forced === 'a' || forced === 'b' ? forced : null;
  const forcePersist = params ? params.get('ab_persist') === '1' : false;

  if (forcedValid) {
    if (forcePersist) persistHomeVariant(forcedValid);
    abHomeVariant = forcedValid;
    abHomeCohorted = true;
    registerSuperProps({ ab_home_variant: forcedValid });
    return abHomeVariant;
  }

  let stored = readStoredHomeVariant();
  let assignedNow = false;

  // Self-heal any device stuck on 'b' from before the kill shipped. The test
  // is over and A won decisively, so nobody should keep seeing B just because
  // they were bucketed in before this date. Falls through to the same
  // (re)assignment path below, which re-persists 'a'. The explicit ?ab=b
  // forced-preview branch above already returned, so this never fights it.
  if (stored === 'b') stored = null;

  if (!stored) {
    // 2026-07-30 (Joel): test concluded, A won on lead->sale conversion
    // (6.1% vs 3.8%) and revenue per lead (+69%). All new traffic goes to A;
    // ?ab=b still works as a forced preview override above.
    const assigned = 'a';
    if (!persistHomeVariant(assigned)) {
      // Private mode / storage blocked: render 'a' but leave the device
      // UNCOHORTED. The assignment could never be sticky, and stamping it
      // would inflate arm A with traffic whose purchases carry no variant
      // (getAbHomeVariant reads the same blocked storage and returns '').
      abHomeVariant = 'a';
      abHomeCohorted = false;
      return abHomeVariant;
    }
    stored = assigned;
    assignedNow = true;
  }

  abHomeVariant = stored;
  abHomeCohorted = true;
  // Register BEFORE the assignment event so that event carries the property
  // too (the old order left ab_home_assigned itself unattributed).
  registerSuperProps({ ab_home_variant: stored });
  if (assignedNow) track('ab_home_assigned', { variant: stored });
  return abHomeVariant;
}

// False when storage was blocked, i.e. the device renders an arm but is not
// part of the test. Lets the view event carry its own exclusion flag.
export function isHomeVariantCohorted() {
  return abHomeCohorted;
}

// Reads the sticky homepage A/B assignment directly from localStorage
// (same key HomeSplit.jsx writes: 'bpq_ab_home'). Threaded through Stripe
// checkout metadata so the server-side purchase event can be broken down by
// variant — the client super-property alone never reaches server-side
// captures, since posthog-node fires purchase from the webhook, not the
// browser. Returns '' when unset/blocked (private mode, non-homepage entry).
export function getAbHomeVariant() {
  try {
    const v = localStorage.getItem('bpq_ab_home');
    return v === 'a' || v === 'b' ? v : '';
  } catch { /* noop */ }
  return '';
}

// Ties the anonymous device to the lead's email at the quiz email gate, so
// the funnel (and revenue) can be analyzed per-person across sessions.
export function identify(email, props) {
  try {
    if (enabled && email) posthog.identify(email.trim().toLowerCase(), props);
  } catch { /* noop */ }
}

// ─── Ad-pixel fan-out ─────────────────────────────────────────────────
// One call fires the same conversion to every pixel that is actually
// loaded. Each loader in index.html is env-gated, so an unconfigured
// pixel simply is not on window and is skipped here — no errors, no
// need to touch call sites when a pixel is switched on or off.
//
// Event-name mapping (the three networks disagree on naming):
//   canonical            Meta (fbq)          TikTok (ttq)        GA4 (gtag)
//   'add_to_cart'        AddToCart           AddToCart           add_to_cart
//   'begin_checkout'     InitiateCheckout    InitiateCheckout    begin_checkout
//   'purchase'           Purchase            CompletePayment     purchase
//
// PostHog is NOT called here. It has its own richer track() and its
// event names are already established in dashboards.
const PIXEL_EVENTS = {
  add_to_cart: { fb: 'AddToCart', tt: 'AddToCart', ga: 'add_to_cart' },
  begin_checkout: { fb: 'InitiateCheckout', tt: 'InitiateCheckout', ga: 'begin_checkout' },
  purchase: { fb: 'Purchase', tt: 'CompletePayment', ga: 'purchase' },
};

// `eventId` is the browser half of server-side conversion deduplication. The
// Stripe webhook reports the same purchase to TikTok's Events API stamped with
// the Stripe checkout session id (see api/_tiktok-events.js); passing the same
// id here lets TikTok collapse the two into one conversion.
//
// The guard below is deliberate and load-bearing: for a 'purchase' with NO
// eventId we skip TikTok entirely rather than send an unkeyed duplicate. The
// server copy always fires and is the more reliable of the two, so skipping
// costs nothing, while sending would inflate reported conversions and quietly
// corrupt the ad account's optimization signal. Meta and GA4 are unaffected —
// nothing is sent to them server-side, so their browser event is the only one.
export function trackPixels(event, { value, currency = 'USD', contentName, eventId, ...extra } = {}) {
  const names = PIXEL_EVENTS[event];
  if (!names || typeof window === 'undefined') return;
  const tiktokWouldDouble = event === 'purchase' && !eventId;

  // Each pixel is wrapped separately: one network throwing (blocked by an
  // ad blocker, script half-loaded) must never stop the others, and must
  // never bubble into checkout navigation.
  try {
    if (window.fbq) {
      window.fbq(
        'track',
        names.fb,
        {
          ...(value != null ? { value, currency } : {}),
          ...(contentName ? { content_name: contentName } : {}),
          ...extra,
        },
        // Meta's dedupe key lives in a third argument, not the payload.
        // Harmless today (nothing is sent to Meta server-side) and already
        // correct if a Conversions API is ever added.
        ...(eventId ? [{ eventID: String(eventId) }] : []),
      );
    }
  } catch { /* pixel errors never block UX */ }

  try {
    if (window.ttq && !tiktokWouldDouble) {
      window.ttq.track(
        names.tt,
        {
          ...(value != null ? { value, currency } : {}),
          ...(contentName ? { content_name: contentName } : {}),
        },
        ...(eventId ? [{ event_id: String(eventId) }] : []),
      );
    }
  } catch { /* pixel errors never block UX */ }

  try {
    if (window.gtag) {
      window.gtag('event', names.ga, {
        ...(value != null ? { value, currency } : {}),
        ...(contentName ? { items: [{ item_name: contentName }] } : {}),
        ...extra,
      });
    }
  } catch { /* pixel errors never block UX */ }
}
