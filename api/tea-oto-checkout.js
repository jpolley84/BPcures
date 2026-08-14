// api/tea-oto-checkout.js — status + checkout for the $67 Challenge OTO that
// rides on a paid Shopify tea order.
//
// GET  /api/tea-oto-checkout?t=<token>
//        Tells the page what to render. Env vars are server-only, so the page
//        cannot decide "is this offer live" on its own; it asks here first.
//        Never 500s on a bad token: an expired or forged link renders a calm
//        page, not an error.
//
// POST /api/tea-oto-checkout  { t }
//        Verifies the signed token + window, then creates a one-time Stripe
//        Checkout Session for $67 and returns its url.
//
// SECURITY NOTE: the 24 hour deadline is enforced HERE, from the HMAC-signed
// issue time inside the token. The page's countdown is decoration. Editing the
// URL, reloading, or waiting out the clock cannot buy the OTO price late.
//
// The session is stamped { funnel: 'challenge-oto' }, which stripe-webhook.js
// lists in FOREIGN_FUNNELS. That is deliberate: the kit webhook must NOT try to
// deliver a Triangle kit for 6700. Delivery for this purchase is owned by
// api/tea-oto-confirm.js.

import Stripe from 'stripe';
import { otoStatus, verifyOtoToken, OTO_PRICE, OTO_ANCHOR, SITE_URL } from './_challenge-oto.js';

export default async function handler(req, res) {
  const token = req.method === 'GET'
    ? String(req.query?.t || '')
    : String(req.body?.t || '');

  const status = otoStatus();
  const claim = token ? verifyOtoToken(token) : null;

  if (req.method === 'GET') {
    // Shape the page renders from. `state` is a single word so the page has one
    // switch instead of a pile of booleans that can contradict each other.
    let state = 'live';
    if (!status.live) state = 'closed';
    else if (!token) state = 'no_token';
    else if (!claim) state = 'bad_token';
    else if (claim.expired) state = 'expired';

    return res.status(200).json({
      state,
      price: OTO_PRICE,
      anchor: OTO_ANCHOR,
      // Cohort details are only meaningful when the offer is actually live.
      startLabel: status.startLabel || null,
      timeLabel: status.timeLabel || null,
      daysAway: status.daysAway ?? null,
      expiresMs: claim?.expiresMs ?? null,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!status.live) {
    // Reason is logged, not returned: the buyer does not need to know whether
    // it was a missing price id or a cohort that already started.
    console.warn('tea-oto: checkout attempted while closed', status.reason);
    return res.status(409).json({ error: 'offer_closed' });
  }
  if (!claim) return res.status(400).json({ error: 'bad_token' });
  if (claim.expired) return res.status(410).json({ error: 'expired' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('tea-oto: STRIPE_SECRET_KEY missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: status.priceId, quantity: 1 }],
      // Prefill so a tea buyer never retypes the address we already have, and
      // so the confirmation lands in the same inbox as the tea order.
      customer_email: claim.email,
      success_url: `${SITE_URL}/tea-oto-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/tea-oto?t=${encodeURIComponent(token)}&declined=1`,
      metadata: {
        funnel: 'challenge-oto',       // FOREIGN_FUNNELS -> kit webhook skips
        flow: 'tea-oto',
        offer: 'change-my-life-challenge',
        oto_email: claim.email,
        cohort_start: String(status.startMs),
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('tea-oto: stripe session failed', err.message);
    return res.status(500).json({ error: 'checkout_failed' });
  }
}
