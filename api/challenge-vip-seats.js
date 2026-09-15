// api/challenge-vip-seats.js — how many VIP seats are LEFT for the Sept 22-24
// cohort. Read by public/vip/index.html so the "N spots left" line on the
// page is the same number the server enforces, never a typed-in claim.
//
// Cap and roster key are shared with create-embedded-checkout.js (cmlc-97-vip)
// and challenge-vip-charge.js (+$100 path). Change VIP_SEAT_CAP in one place:
// _challenge-vip-cap.js.

import { kv } from '@vercel/kv';
import { VIP_SEAT_CAP, VIP_ROSTER_KEY } from './_challenge-vip-cap.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const taken = await kv.scard(VIP_ROSTER_KEY);
    return res.status(200).json({ cap: VIP_SEAT_CAP, taken, left: Math.max(0, VIP_SEAT_CAP - taken) });
  } catch (err) {
    console.error('challenge-vip-seats: count failed', err.message);
    return res.status(503).json({ error: 'unavailable' });
  }
}
