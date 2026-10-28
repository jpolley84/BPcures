// api/cuff-checkout.js — Life Beyond the Cuff founding enrollment embedded checkout for
// bloodpressurerepair.com (a static Vercel project with no API of its own, so
// the page calls this endpoint cross-origin).
//
// 2026-10-25 (Joel): "add a coupon code ... 10% off with code SUBS. For my
// subscribers." The page has its own code box. ONLY codes in COURSE_CODES are
// accepted here; Stripe's open promo-code box is NOT enabled, because the
// account has unrestricted codes (SUB50 = 50% off, JOEL25, HORMONES) that
// would otherwise work on this course.
//
// Card only (no Link), same payment method configuration as the kit checkout.
// Every session carries metadata funnel 'life-beyond-the-cuff', which the
// bpquiz, triangle, and RestoreHER webhooks skip by name (29700 collides with
// bpquiz 'diagnostic' and RestoreHER '30day-reset' amount mappings).

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 2026-10-28 (Joel): founding enrollment $997 pay-in-full or 2 x $599, closing
// Friday, October 30 at 5 PM CT. The old $297 price (price_1UUVIFHseZnO3rRZM1w3vFct)
// is no longer sold here. The 2-pay rides a monthly subscription that
// triangle-webhook caps after the second charge (cancel_at).
// After the close the course sells at the regular price, $1,997 or 2 x $1,099
// (Joel, 2026-10-28), so the $1,997 shown on the page is a real price.
const PHASES = {
  founding: {
    full: { price: 'price_1UVX8fHseZnO3rRZnONmFMgl', mode: 'payment', product: 'course-997', each: 997 },
    split: { price: 'price_1UVX8fHseZnO3rRZ6TVjx0CS', mode: 'subscription', product: 'course-2x599', each: 599 },
  },
  regular: {
    full: { price: 'price_1UVXl4HseZnO3rRZPVbvV3WW', mode: 'payment', product: 'course-1997', each: 1997 },
    split: { price: 'price_1UVXl4HseZnO3rRZy2XY6WuM', mode: 'subscription', product: 'course-2x1099', each: 1099 },
  },
};
const usd = (n) => '$' + n.toLocaleString('en-US');
const CLOSES_AT = Date.parse('2026-10-30T17:00:00-05:00');
const MODULE1_OPENS = Date.parse('2026-11-02T11:00:00Z');
const COURSE_CODES = { SUBS: 'promo_1UUVIFHseZnO3rRZ6gYQvopz' }; // 10% off, this product only
const PM_CONFIG_CARD_NO_LINK = process.env.STRIPE_PM_CONFIG_CARD_ONLY || 'pmc_1U4LDUHseZnO3rRZx9nEqowD';
// Full publishable key (the server copy of VITE_STRIPE_PUBLISHABLE_KEY is cut
// short; see create-deposit-payment-intent.js).
const PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY_FULL || 'pk_live_51TE9iEHseZnO3rRZ1xXgqstXEEeFIyy8m37WCHYcgRsh1hqEwD7gdK3IUo2yaKSXaiJvw9wyXez7izjv8dP0zOR300VmC8VCao';
const ALLOWED_ORIGINS = new Set(['https://bloodpressurerepair.com', 'https://www.bloodpressurerepair.com']);
const FUNNEL = 'life-beyond-the-cuff';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const founding = Date.now() < CLOSES_AT;
  // 2026-10-28 (Joel): full refund until Module 1 opens, then all sales final.
  const refundLine = Date.now() < MODULE1_OPENS
    ? 'Full refund if you ask before Monday, November 2, when Module 1 opens. After that, all sales are final.'
    : 'All sales are final.';
  const planKey = req.body && req.body.plan === 'split' ? 'split' : 'full';
  const plan = PHASES[founding ? 'founding' : 'regular'][planKey];
  const raw = String((req.body && req.body.code) || '').trim().toUpperCase();
  let discounts;
  if (raw) {
    if (!COURSE_CODES[raw]) return res.status(400).json({ error: 'That code is not valid for this course.' });
    discounts = [{ promotion_code: COURSE_CODES[raw] }];
  }
  const site = ALLOWED_ORIGINS.has(origin) ? origin : 'https://bloodpressurerepair.com';
  try {
    const md = { funnel: FUNNEL, product: plan.product, plan: planKey, code: raw || '' };
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: plan.mode,
      payment_method_configuration: PM_CONFIG_CARD_NO_LINK,
      line_items: [{ price: plan.price, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      phone_number_collection: { enabled: true },
      // Stripe labels the 2-pay "$599.00 per month"; say plainly that it stops.
      custom_text: {
        submit: {
          message: planKey === 'split'
            ? `Two payments of ${usd(plan.each)}: one today and one a month from today (${usd(plan.each * 2)} total). Then the plan ends on its own. There is no third charge. ${refundLine}`
            : `One payment of ${usd(plan.each)}. Your login link arrives by email when your modules open. ${refundLine}`,
        },
      },
      metadata: { ...md, brand: FUNNEL },
      ...(plan.mode === 'payment'
        ? { customer_creation: 'always', payment_intent_data: { metadata: md } }
        : { subscription_data: { metadata: md, description: `Life Beyond the Cuff ${founding ? 'founding ' : ''}plan: 2 payments of ${usd(plan.each)}, then it ends` } }),
      return_url: `${site}/thanks/?session_id={CHECKOUT_SESSION_ID}`,
      // Stripe keeps a session payable for 24 h by default. Near the close, end
      // it at the deadline (Stripe's floor is 30 minutes from now).
      ...(founding ? { expires_at: Math.max(Math.floor(Date.now() / 1000) + 1860, Math.min(Math.floor(Date.now() / 1000) + 86000, Math.floor(CLOSES_AT / 1000))) } : {}),
    });
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: PUBLISHABLE_KEY, code: raw || null });
  } catch (err) {
    console.error('cuff-checkout failed', err.message);
    return res.status(500).json({ error: 'Checkout could not start. Please try again in a moment.' });
  }
}
