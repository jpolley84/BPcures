// api/cuff-checkout.js — Life Beyond the Cuff ($297) embedded checkout for
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

const PRICE_ID = 'price_1UUVIFHseZnO3rRZM1w3vFct'; // $297, prod_VVWKKYkCupbPnE
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

  const raw = String((req.body && req.body.code) || '').trim().toUpperCase();
  let discounts;
  if (raw) {
    if (!COURSE_CODES[raw]) return res.status(400).json({ error: 'That code is not valid for this course.' });
    discounts = [{ promotion_code: COURSE_CODES[raw] }];
  }
  const site = ALLOWED_ORIGINS.has(origin) ? origin : 'https://bloodpressurerepair.com';
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      payment_method_configuration: PM_CONFIG_CARD_NO_LINK,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      customer_creation: 'always',
      phone_number_collection: { enabled: true },
      metadata: { funnel: FUNNEL, brand: FUNNEL, product: 'course-297', code: raw || '' },
      payment_intent_data: { metadata: { funnel: FUNNEL, product: 'course-297', code: raw || '' } },
      return_url: `${site}/thanks/?session_id={CHECKOUT_SESSION_ID}`,
    });
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: PUBLISHABLE_KEY, code: raw || null });
  } catch (err) {
    console.error('cuff-checkout failed', err.message);
    return res.status(500).json({ error: 'Checkout could not start. Please try again in a moment.' });
  }
}
