// api/create-hosted-checkout.js: the two big buttons on /allin.
//
// 2026-09-27 (Joel): "Two ways you can work with us", one Stripe checkout
// button under each tier, hosted (Stripe's page), not the embedded form.
//
//   sprint-1997    Life Change Sprint, 6 weeks, $1,997 paid in full. No
//                  bonuses, no guarantee, no one-on-one, not a full year. Every
//                  dollar is credited if she upgrades to the Accelerator.
//                  Product + price were created 2026-09-27 on Joel's go:
//                  prod_VL6yKZvUoq4P69 / price_1UKQklHseZnO3rRZzGTIqroW.
//   allin-deposit  The Accelerator's $500 deposit, credited toward $7,500.
//                  Same price, metadata and /payment hand-off as the embedded
//                  path in create-embedded-checkout.js, so the webhook and
//                  the balance page treat both routes identically.
//
// Returns { url }. The page sends the browser there. No session is created on
// page load: one per click, so no dead sessions pile up.
import Stripe from 'stripe';
import { recentPurchase } from './_dupe-guard.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const PM_CONFIG_CARD_NO_LINK = process.env.STRIPE_PM_CONFIG_CARD_ONLY || 'pmc_1U4LDUHseZnO3rRZx9nEqowD';

const TIERS = {
  'sprint-1997': {
    price: process.env.SPRINT_1997_PRICE_ID || 'price_1UKQklHseZnO3rRZzGTIqroW',
    plan: 'sprint',
    success: '/allin-welcome?plan=sprint&session_id={CHECKOUT_SESSION_ID}',
  },
  'allin-deposit': {
    price: process.env.ALLIN_DEPOSIT_PRICE_ID || 'price_1TvOULHseZnO3rRZZG8iyG9S',
    plan: 'deposit',
    success: '/payment?session_id={CHECKOUT_SESSION_ID}',
  },
};

function siteUrlFrom(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'bpquiz.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return process.env.VITE_SITE_URL || `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const tier = String(body.tier || '');
  const cfg = TIERS[tier];
  if (!cfg) return res.status(400).json({ error: 'Unknown tier' });

  const siteUrl = siteUrlFrom(req);
  const email = typeof body.email === 'string' && body.email.includes('@') ? body.email.trim().toLowerCase() : '';

  // Same guard the embedded path uses: a double click must not double charge.
  if (email) {
    try {
      const dup = await recentPurchase(email, tier);
      if (dup) return res.status(409).json({ error: 'duplicate', message: 'You already completed this purchase.' });
    } catch { /* guard unavailable: proceed */ }
  }

  const metadata = {
    funnel: 'braveworks-bp',
    brand: 'braveworks-bp',
    offer: 'all-in',
    plan: cfg.plan,
    tier,
    source: 'allin-two-tier',
    ...(body.distinctId ? { ph_distinct_id: String(body.distinctId).slice(0, 80) } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_configuration: PM_CONFIG_CARD_NO_LINK,
      line_items: [{ price: cfg.price, quantity: 1 }],
      metadata,
      customer_creation: 'always',
      phone_number_collection: { enabled: true },
      allow_promotion_codes: false,
      success_url: `${siteUrl}${cfg.success}`,
      cancel_url: `${siteUrl}/allin#tiers`,
      ...(email ? { customer_email: email } : {}),
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-hosted-checkout error:', tier, err.message);
    return res.status(500).json({ error: 'Failed to start checkout' });
  }
}
