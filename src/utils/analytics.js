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

// Ties the anonymous device to the lead's email at the quiz email gate, so
// the funnel (and revenue) can be analyzed per-person across sessions.
export function identify(email, props) {
  try {
    if (enabled && email) posthog.identify(email.trim().toLowerCase(), props);
  } catch { /* noop */ }
}
