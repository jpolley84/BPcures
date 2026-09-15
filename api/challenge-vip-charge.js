// api/challenge-vip-charge.js — one-click $100 VIP upgrade for a paid $97
// Change My Life Challenge seat (Sept 22-24 cohort).
//
// Sits behind public/challenge-vip/ (the page every cmlc-97 buyer lands on
// after paying). Charges the card Stripe just saved on the original session
// (customer_creation:'always' + payment_intent_data.setup_future_usage:
// 'off_session' in the cmlc-97 branch — added 2026-09-11, without it there is
// nothing to charge). Modeled on api/kit-oto-charge.js, the proven twin.
//
// $100 is charged as a raw amount (off_session PIs bill an amount, not a
// Price) — no new Stripe catalog objects. Total VIP price = $97 + $100 = $197,
// matching Joel's upsell page.
//
// Idempotent forever on the session id: one VIP upgrade per Challenge order,
// a reload or double-click can never double-charge.

import Stripe from 'stripe';
import { VIP_SEAT_CAP } from './_challenge-vip-cap.js';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const VIP = {
  amount: 10000, // $100 upgrade on top of the $97 seat
  cohort: '2026-09-22',
  description: 'Change My Life Challenge — VIP upgrade (Sept 22-24 cohort)',
  // 2026-09-11 (expert panel + Joel "fix all"): the page says VIP is capped at
  // 30 because the Q&A room only works small. A scarcity claim the server
  // does not enforce is a lie, so the server enforces it.
  seatCap: VIP_SEAT_CAP, // shared, see _challenge-vip-cap.js (14 as of 2026-09-14)
};

const JOEL_EMAIL = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';

async function alertJoel(subject, text) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'BraveWorks Ops <noreply@bpquiz.com>', to: [JOEL_EMAIL], subject, text }),
    });
  } catch (err) { console.error('challenge-vip: alert failed', err.message); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const sessionId = String(b?.session_id || '').trim();
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ error: 'bad_session' });

  const idemKey = `vip:challenge:${sessionId}`;
  try {
    const done = await kv.get(idemKey);
    if (done) return res.status(200).json({ ok: true, already: true });
  } catch (err) { console.warn('challenge-vip: idem read failed, continuing', err.message); }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer', 'payment_intent'] });
  } catch (err) {
    return res.status(404).json({ error: 'session_not_found' });
  }

  // Trust Stripe, not the URL: only a PAID cmlc seat can upgrade.
  if (session.payment_status !== 'paid') return res.status(402).json({ error: 'not_paid' });
  if (session.metadata?.offer !== 'challenge') return res.status(400).json({ error: 'wrong_flow' });

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const paymentMethodId = session.payment_intent?.payment_method;
  const cardSaved = session.payment_intent?.setup_future_usage === 'off_session';
  if (!customerId || !paymentMethodId || !cardSaved) {
    // Sessions minted before the 2026-09-11 saved-card patch. The page falls
    // back to its decline path; the buyer keeps the regular seat.
    return res.status(409).json({ error: 'no_saved_card' });
  }

  const email = (session.customer_details?.email || '').trim().toLowerCase();
  const name = (session.customer_details?.name || '').trim();

  // Enforce the 30-seat cap BEFORE charging. Fail closed on the count: if KV
  // cannot be read we refuse the charge rather than risk selling seat 31 —
  // an upsell lost beats a scarcity claim broken.
  try {
    const taken = await kv.scard(`challenge:${VIP.cohort}:vip`);
    if (Number(taken) >= VIP.seatCap) {
      return res.status(409).json({ error: 'vip_sold_out' });
    }
  } catch (err) {
    console.error('challenge-vip: seat count read failed, refusing charge', err.message);
    return res.status(503).json({ error: 'try_again' });
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount: VIP.amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: VIP.description,
      metadata: {
        kind: 'upgrade',
        funnel: 'braveworks-bp',
        offer: 'challenge-vip',
        flow: 'challenge_vip_one_click',
        cohort: VIP.cohort,
        original_session: sessionId,
        ...(session.metadata?.ph_distinct_id ? { ph_distinct_id: session.metadata.ph_distinct_id } : {}),
      },
    }, { idempotencyKey: idemKey });
  } catch (err) {
    if (err.code === 'authentication_required' || err.code === 'card_declined') {
      return res.status(402).json({ error: err.code });
    }
    console.error('challenge-vip stripe error:', err.message);
    return res.status(500).json({ error: 'charge_failed' });
  }

  // PERMANENT idempotency (kit-oto precedent): a TTL plus a bookmarked
  // revisit is a double-charge.
  try {
    await kv.set(idemKey, { payment_intent_id: pi.id, charged_at: new Date().toISOString(), amount: VIP.amount, email });
  } catch (err) { console.warn('challenge-vip: idem write failed', err.message); }

  // VIP roster. challenge-signup.js 'register' (fired by /challenge-confirmed)
  // owns the GA seat record; this marks the upgrade on top.
  try {
    if (email) {
      await kv.sadd(`challenge:${VIP.cohort}:vip`, email);
      await kv.set(`challenge:${VIP.cohort}:vip:${email}`, JSON.stringify({
        email, name, sessionId, paymentIntent: pi.id, upgradedAt: new Date().toISOString(),
      }), { ex: 60 * 60 * 24 * 120 });
    }
  } catch (err) { console.error('challenge-vip: roster write failed', err.message); }

  // The VIP room has its OWN Zoom link and its own email, which is not
  // automated yet — so a human must send the VIP details. Never silent.
  await alertJoel(
    `VIP upgrade: ${name || email} paid $100 (${VIP.cohort} cohort)`,
    `One-click VIP upgrade succeeded.\n\nName: ${name || '(none)'}\nEmail: ${email || '(none)'}\nSession: ${sessionId}\nPaymentIntent: ${pi.id}\n\nACTION: send them the VIP room details (VIP Zoom link + extended replay note). The GA welcome email goes out automatically; the VIP email does not exist yet.`
  );

  return res.status(200).json({ ok: true });
}
