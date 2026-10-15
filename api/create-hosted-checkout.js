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

// 2026-09-27 (Joel): the Sprint starts with a $200 NON-REFUNDABLE deposit.
// The $1,797 balance settles on /sprint-balance: in full (a 1:1 session is
// added) or 3 x $649 EVERY 2 WEEKS, inside the 6 weeks (day 0, 14, 28;
// the webhook caps it after the 3rd charge). Joel, 2026-09-30.
// Prices live on prod_VL6yKZvUoq4P69, created 2026-09-27 on Joel's go.
// 2026-10-05 (Joel): a Sprint deposit that lands before the end of the
// masterclass Q&A earns a 1:1 Fast-Track Call. Decided HERE, at session
// creation, and stamped on the session so the webhook can tell Joel and the
// buyer. 9:00 pm ET on class night (Monday 7:00 pm ET class). Mirror of
// FASTTRACK_UNTIL in src/pages/SprintPage.jsx, which only shows the timer.
const FASTTRACK_UNTIL = Date.parse('2026-10-05T21:00:00-04:00');

const TIERS = {
  'sprint-deposit': {
    price: process.env.SPRINT_DEPOSIT_PRICE_ID || 'price_1UKQxkHseZnO3rRZSOtVjcH5',
    plan: 'sprint-deposit',
    mode: 'payment',
    success: '/sprint-balance?session_id={CHECKOUT_SESSION_ID}',
  },
  'sprint-balance-full': {
    price: process.env.SPRINT_BALANCE_FULL_PRICE_ID || 'price_1UKQxlHseZnO3rRZB6HCbTWq',
    plan: 'sprint-balance-full',
    mode: 'payment',
    success: '/allin-welcome?plan=sprint-balance-full&session_id={CHECKOUT_SESSION_ID}',
  },
  'sprint-balance-3pay': {
    price: process.env.SPRINT_BALANCE_3PAY_PRICE_ID || 'price_1ULOAXHseZnO3rRZR4s1AJ3O', // bi-weekly; monthly price_1UKQxlHseZnO3rRZT6mgipol archived 09-30
    plan: 'sprint-balance-3pay',
    mode: 'subscription',
    success: '/allin-welcome?plan=sprint-balance-3pay&session_id={CHECKOUT_SESSION_ID}',
  },
  'allin-deposit': {
    price: process.env.ALLIN_DEPOSIT_PRICE_ID || 'price_1TvOULHseZnO3rRZZG8iyG9S',
    plan: 'deposit',
    mode: 'payment',
    success: '/payment?session_id={CHECKOUT_SESSION_ID}',
  },
  // 2026-10-12 (Joel): changemylifechallenge.com/vip, "VIP for 97 just for
  // tonight". Existing $97 challenge price (no Stripe write). Its OWN funnel
  // marker so triangle-webhook's amount map never reads 9700 as a BP kit, and
  // NOT the cmlc-97-vip embedded path, which seats buyers into the Sept 22
  // cohort and emails them those dates. Cut off server-side at `until`.
  'cmlc-vip-97-tonight': {
    price: process.env.CMLC_97_PRICE_ID || 'price_1U4NSeHseZnO3rRZfxzUCAjk',
    plan: 'challenge-vip-97',
    mode: 'payment',
    success: '/vip/?paid=1&session_id={CHECKOUT_SESSION_ID}',
    cancel: '/vip/#secure-order',
    funnel: 'cmlc-vip-oct',
    offer: 'challenge-vip',
    source: 'vip-97-tonight',
    // 2026-10-13 (Joel): reopened for the challenge waitlist, 48 hours.
    until: Date.parse('2026-10-15T23:59:59-05:00'), // 11:59:59 PM CDT Thu Oct 15 (Joel 10-14: page shows Wed, then rolls to Thu)
    origin: 'https://changemylifechallenge.com',
    lineItem: {
      amount: 9700,
      name: 'Change My Life Challenge: VIP Experience',
      description: '5-day LIVE Blood Pressure Challenge with Annie Chitate, RN and Joel Polley, RN. VIP seat: extended coaching and Q&A room, priority questions, bonus numbers session, VIP workbook. Regularly $197.',
    },
  },
  // 2026-10-13 (Joel): changemylifechallenge.com main page = the 5-day
  // conversion page, General $97 / VIP $197, Oct 19-23. Same funnel marker as
  // the VIP night (restoreher's webhook skips it), amounts sent inline so no
  // Stripe object is created or edited. Closes 11:59 PM ET Mon Oct 19.
  'cmlc-oct-ga': {
    price: 'inline', plan: 'challenge-ga', mode: 'payment',
    success: '/?paid=1&ticket=general&session_id={CHECKOUT_SESSION_ID}', cancel: '/#secure-order',
    funnel: 'cmlc-vip-oct', offer: 'challenge', source: 'cmlc-oct19-page',
    origin: 'https://changemylifechallenge.com',
    until: Date.parse('2026-10-19T23:59:59-04:00'),
    lineItem: { amount: 9700, name: 'Change My Life Challenge: General Admission', description: '5-day LIVE Blood Pressure Challenge with Annie Chitate, RN and Joel Polley, RN. Monday, October 19 to Friday, October 23, 7:00 PM Eastern.' },
  },
  'cmlc-oct-vip': {
    price: 'inline', plan: 'challenge-vip', mode: 'payment',
    success: '/?paid=1&ticket=vip&session_id={CHECKOUT_SESSION_ID}', cancel: '/#secure-order',
    funnel: 'cmlc-vip-oct', offer: 'challenge-vip', source: 'cmlc-oct19-page',
    origin: 'https://changemylifechallenge.com',
    until: Date.parse('2026-10-19T23:59:59-04:00'),
    lineItem: { amount: 19700, name: 'Change My Life Challenge: VIP Experience', description: '5-day LIVE Blood Pressure Challenge with Annie Chitate, RN and Joel Polley, RN, October 19 to 23, 7:00 PM Eastern. VIP: extended coaching and Q&A room, priority questions, bonus numbers session, VIP workbook.' },
  },
  // 2026-10-07: the $47 Client-Ready Blueprint behind bpquiz.com/engine/results.
  // Its own funnel so the BP webhook branches leave it alone. The Stripe price
  // does not exist yet (money write, Joel's go): until EEE_BLUEPRINT_PRICE_ID
  // is set the button answers 503 notReady and the page says so.
  'engine-blueprint': {
    price: process.env.EEE_BLUEPRINT_PRICE_ID || '',
    plan: 'engine-blueprint',
    mode: 'payment',
    success: '/engine/results?purchased=1&session_id={CHECKOUT_SESSION_ID}',
    cancel: '/engine/results',
    funnel: 'everyday-nurse-engine',
    offer: 'engine-blueprint',
    source: 'engine-results',
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
  if (cfg.until && Date.now() > cfg.until) return res.status(410).json({ error: 'ended', message: 'This offer has ended.' });
  if (!cfg.price) return res.status(503).json({ error: 'notReady', message: 'Checkout for this offer is not open yet.' });

  const siteUrl = siteUrlFrom(req);
  const sid = String(body.sid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  const email = typeof body.email === 'string' && body.email.includes('@') ? body.email.trim().toLowerCase() : '';

  // Same guard the embedded path uses: a double click must not double charge.
  if (email) {
    try {
      const dup = await recentPurchase(email, tier);
      if (dup) return res.status(409).json({ error: 'duplicate', message: 'You already completed this purchase.' });
    } catch { /* guard unavailable: proceed */ }
  }

  const metadata = {
    funnel: cfg.funnel || 'braveworks-bp',
    brand: cfg.funnel || 'braveworks-bp',
    offer: cfg.offer || 'all-in',
    plan: cfg.plan,
    tier,
    source: typeof body.source === 'string' && body.source.length <= 40 ? body.source : (cfg.source || 'allin-two-tier'),
    ...(sid ? { sid } : {}),
    ...(tier === 'sprint-deposit' && Date.now() <= FASTTRACK_UNTIL ? { fasttrack: '1' } : {}),
    ...(body.distinctId ? { ph_distinct_id: String(body.distinctId).slice(0, 80) } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: cfg.mode,
      ...(cfg.mode === 'subscription' ? { subscription_data: { metadata } } : {}),
      payment_method_configuration: PM_CONFIG_CARD_NO_LINK,
      // A tier may override what the buyer reads on Stripe's page. The $97 price's
      // product still describes the Sept 22-24 three-day cohort, so the VIP sale
      // sends its own name/description at the same amount (no Stripe object edited).
      line_items: [cfg.lineItem
        ? { price_data: { currency: 'usd', unit_amount: cfg.lineItem.amount, product_data: { name: cfg.lineItem.name, description: cfg.lineItem.description } }, quantity: 1 }
        : { price: cfg.price, quantity: 1 }],
      metadata,
      ...(cfg.mode === 'payment' ? { customer_creation: 'always' } : {}),
      phone_number_collection: { enabled: true },
      allow_promotion_codes: false,
      success_url: `${cfg.origin || siteUrl}${cfg.success}${sid && cfg.offer === 'engine-blueprint' ? `&sid=${sid}` : ''}`,
      cancel_url: `${cfg.origin || siteUrl}${cfg.cancel || (tier.startsWith('sprint-balance') ? '/sprint-balance' : '/allin#tiers')}${sid && cfg.offer === 'engine-blueprint' ? `?sid=${sid}` : ''}`,
      ...(email ? { customer_email: email } : {}),
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-hosted-checkout error:', tier, err.message);
    return res.status(500).json({ error: 'Failed to start checkout' });
  }
}
