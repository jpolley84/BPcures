// api/case-review-slots.js — public monthly case-review capacity.
//
// GET → 200 { cap, taken, remaining, month, threePayAvailable }
//
// Joel reviews at most CAP cases per month by hand ($297 "Joel's Eyes On Your
// Case"). api/triangle-webhook.js increments bwbp:casereview:count:<YYYY-MM>
// (UTC month) on every fulfilled case-review purchase, full or 3-pay; this
// endpoint reads that counter so the offer page can show REAL remaining
// capacity. Honest scarcity only: the cap is a true one-operator limit and the
// counter rolls over naturally each calendar month (fresh key, no reset job).
//
// Public, no auth: numbers only, no PII. Cached 60 seconds at the edge.

import { kv } from '@vercel/kv';

// True monthly hand-review capacity (one operator). Change here + on the offer
// page together if Joel ever raises it.
const CAP = 5;

// 3-pay plan price id seam. Keep in sync with CASE_REVIEW_3PAY_PRICE_ID in
// api/create-embedded-checkout.js (env STRIPE_CASE_REVIEW_3PAY_PRICE_ID
// overrides; the const is the fallback, filled after Stripe price creation).
const CASE_REVIEW_3PAY_PRICE_ID = ''; // filled after Stripe price creation

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // UTC month, matching the webhook's counter key exactly.
  const ym = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [year, month] = ym.split('-');

  let taken = 0;
  try {
    const count = await kv.get(`bwbp:casereview:count:${ym}`);
    taken = Number(count) || 0;
  } catch (err) {
    // Fail open at 0 taken: worse to hide a real open slot than to show one.
    console.warn('case-review-slots: KV read failed (returning taken 0)', err.message);
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
  return res.status(200).json({
    cap: CAP,
    taken,
    remaining: Math.max(0, CAP - taken),
    month: `${MONTH_NAMES[Number(month) - 1]} ${year}`, // e.g. 'July 2026'
    threePayAvailable: Boolean(
      process.env.STRIPE_CASE_REVIEW_3PAY_PRICE_ID || CASE_REVIEW_3PAY_PRICE_ID
    ),
  });
}
