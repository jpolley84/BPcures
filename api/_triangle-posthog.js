// api/_posthog.js — server-side PostHog capture for revenue attribution.
//
// Cloned from bpquiz-site/api/_posthog.js. The browser SDK can't reliably fire
// a purchase event: buyers land on Stripe-hosted Checkout (off our domain) and
// the post-payment redirect to /welcome is easy to abandon mid-flight. So the
// authoritative `purchase` event is emitted HERE, from the Stripe webhook +
// the one-click $20 upsell charge handler — every paid dollar, every path
// (tier checkout, $297 case review, /welcome upgrades, one-click OTO).
//
// distinct_id = lowercased email, matching the client-side identify(email) at
// the result-page email gate, so purchases attach to the same PostHog person
// and the full visit → quiz → lead → $ funnel resolves. Events land in the
// SAME PostHog project as the client (BPQuiz.com, id 467819).
//
// site_version: 'braveworks-bp' is stamped on every purchase so server revenue
// segments alongside the client super-property of the same name in the shared
// project.
//
// Env: VITE_POSTHOG_KEY / VITE_POSTHOG_HOST are available to the Node runtime
// regardless of the VITE_ prefix (that prefix only governs client bundling).
// No key set → every function here is a silent no-op.

import { PostHog } from 'posthog-node';
import { kv } from '@vercel/kv';

let _client = null;
function getClient() {
  const key = process.env.VITE_POSTHOG_KEY || process.env.POSTHOG_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new PostHog(key, {
      host: process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,        // serverless: deliver immediately, don't batch
      flushInterval: 0,
    });
  }
  return _client;
}

// ph:purchase:<id> marker TTL — long enough for the nightly 48h reconciliation
// window plus a generous audit tail.
const PURCHASE_MARKER_TTL_SECONDS = 60 * 60 * 24 * 45;

// Fire the canonical revenue event. Non-fatal by contract — a failed analytics
// call must never break a paid customer's fulfillment (the webhook returns 500
// only for FULFILLMENT failures; analytics gaps are backfilled by the nightly
// api/reconcile-purchases.js cron, which reads the ph:purchase:<id> marker).
//
// markSession: opt-in for callers where sessionId is the PRIMARY sale id for
// this purchase (the Stripe webhooks + the reconciliation cron). When set:
//   - an existing ph:purchase:<sessionId> marker skips the capture (so a
//     Stripe retry of a partially-failed webhook never double-counts revenue)
//   - the marker is written ONLY after a successful capture + flush.
// Callers that attribute a DIFFERENT charge to a session they have in scope
// (e.g. the one-click OTO in charge-saved-card.js) must NOT set it, or they
// would mask / be masked by the session's own purchase event.
//
// Returns true when the event was captured, false when skipped or failed.
export async function capturePurchase({ email, amountCents, tier, product, source, sessionId, markSession = false, deviceDistinctId = null }) {
  let client;
  try {
    client = getClient();
  } catch (err) {
    console.error('posthog capturePurchase: client init failed (non-fatal):', err.message);
    return false;
  }
  if (!client || !email) return false;
  const emailId = String(email).trim().toLowerCase();
  // When the checkout session carried the browser's PostHog distinct id
  // (metadata.ph_distinct_id, threaded via api/create-embedded-checkout.js),
  // capture under THAT id so the buyer and the clicking device resolve to one
  // PostHog person; the email is preserved on the person via $set + property.
  const deviceId = deviceDistinctId ? String(deviceDistinctId).trim() : '';
  const distinctId = deviceId || emailId;
  const markerKey = markSession && sessionId ? `ph:purchase:${sessionId}` : null;

  if (markerKey) {
    try {
      const already = await kv.get(markerKey);
      if (already) return false; // this session's purchase already reached PostHog
    } catch (err) {
      console.warn('posthog capturePurchase: marker read failed (capturing anyway)', err.message);
    }
  }

  try {
    if (deviceId) {
      // Merge the historical email-keyed person into the device person before
      // the capture. Non-fatal: a failed alias must never lose the purchase.
      try {
        client.alias({ distinctId: deviceId, alias: emailId });
      } catch (err) {
        console.warn('posthog capturePurchase: alias failed (non-fatal)', err.message);
      }
    }
    client.capture({
      distinctId,
      event: 'purchase',
      properties: {
        value: amountCents != null ? amountCents / 100 : null,
        amount_cents: amountCents ?? null,
        currency: 'usd',
        tier: tier != null ? String(tier) : null,
        product: product || null,
        source: source || 'checkout',   // 'checkout' | 'upgrade' | 'case_review' | 'one_click_upsell' | 'reconciliation'
        stripe_session_id: sessionId || null,
        site_version: 'braveworks-bp',
        ...(deviceId ? { buyer_email: emailId } : {}),
        $set: {
          is_paid_customer: true,
          last_purchase_at: new Date().toISOString(),
          ...(deviceId ? { email: emailId } : {}),
        },
      },
    });
    await client.flush();   // ensure delivery before the function freezes
  } catch (err) {
    // LOUD on purpose: this sale is now invisible to analytics until the
    // nightly reconciliation cron backfills it from Stripe.
    console.error('posthog capturePurchase FAILED (purchase event lost until reconciliation backfill):', err.message, 'session', sessionId || 'n/a');
    return false;
  }

  if (markerKey) {
    try {
      await kv.set(markerKey, { capturedAt: new Date().toISOString(), source: source || 'checkout' }, { ex: PURCHASE_MARKER_TTL_SECONDS });
    } catch (err) {
      console.warn('posthog capturePurchase: marker write failed (reconciliation may re-capture this session once)', err.message);
    }
  }
  return true;
}
