// api/_posthog.js — server-side PostHog capture for revenue attribution.
//
// The browser SDK can't reliably fire a purchase event: buyers land on
// Stripe-hosted Checkout (off our domain) and the post-payment redirect
// chain (/upsell-bp-cure-book → /upsell-bp-reset-kit → /library) is easy
// to abandon mid-flight. So the authoritative `purchase` event is emitted
// HERE, from the Stripe webhook + one-click charge handlers — every paid
// dollar, every path (quiz, homepage, /shop, email payment links).
//
// distinct_id = lowercased email, matching the client-side identify(email)
// at the quiz email gate, so purchases attach to the same PostHog person
// and the full ad → visit → quiz → lead → $ funnel resolves.
//
// Env: VITE_POSTHOG_KEY / VITE_POSTHOG_HOST are available to the Node
// runtime regardless of the VITE_ prefix (that prefix only governs client
// bundling). No key set → every function here is a silent no-op.

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

// Fire the canonical revenue event. Non-fatal by contract — a failed
// analytics call must never break a paid customer's fulfillment.
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
        source: source || 'checkout',   // 'checkout' | 'launcher' | 'one_click_upsell'
        stripe_session_id: sessionId || null,
        $set: { is_paid_customer: true, last_purchase_at: new Date().toISOString() },
      },
    });
    await client.flush();   // ensure delivery before the function freezes
  } catch (err) {
    console.error('posthog capturePurchase failed (non-fatal):', err.message);
  }
}
