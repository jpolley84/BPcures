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
