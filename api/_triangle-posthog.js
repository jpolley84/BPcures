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

// Fire the canonical revenue event. Non-fatal by contract — a failed analytics
// call must never break a paid customer's fulfillment.
export async function capturePurchase({ email, amountCents, tier, product, source, sessionId }) {
  try {
    const client = getClient();
    if (!client || !email) return;
    const distinctId = String(email).trim().toLowerCase();
    client.capture({
      distinctId,
      event: 'purchase',
      properties: {
        value: amountCents != null ? amountCents / 100 : null,
        amount_cents: amountCents ?? null,
        currency: 'usd',
        tier: tier != null ? String(tier) : null,
        product: product || null,
        source: source || 'checkout',   // 'checkout' | 'upgrade' | 'case_review' | 'one_click_upsell'
        stripe_session_id: sessionId || null,
        site_version: 'braveworks-bp',
        $set: { is_paid_customer: true, last_purchase_at: new Date().toISOString() },
      },
    });
    await client.flush();   // ensure delivery before the function freezes
  } catch (err) {
    console.error('posthog capturePurchase failed (non-fatal):', err.message);
  }
}
