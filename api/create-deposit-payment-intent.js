// api/create-deposit-payment-intent.js — Life Change Activated $200 deposit.
//
// 2026-10-22 (Joel): "wire this up and attach a stripe link and make sure its
// an embedded fill out form with klarna activated." The page at
// /life-change-activated renders Stripe's Payment Element ON the page, so this
// creates the PaymentIntent it mounts on.
//
// Card + Klarna only, pinned with payment_method_types (no Link wall). The
// amount is server-owned: the page cannot change it.
//
// Raw PaymentIntents fire no checkout.session.completed, so no funnel webhook
// (bpquiz, triangle, RestoreHER, Engine, erquiz) acts on this sale. Joel's
// notice is sent by api/deposit-confirmed.js after the payment succeeds.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PROGRAMS = {
  'life-change-activated': {
    amount: 20000, // $200 non-refundable deposit toward the $2,000 tuition
    description: 'Life Change Activated: $200 non-refundable deposit (credited toward $2,000 tuition)',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const program = (req.body && req.body.program) || '';
  const p = PROGRAMS[program];
  if (!p) return res.status(400).json({ error: 'Unknown program' });
  const publishableKey = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!publishableKey) return res.status(500).json({ error: 'Payment service not configured' });
  try {
    const pi = await stripe.paymentIntents.create({
      amount: p.amount,
      currency: 'usd',
      payment_method_types: ['card', 'klarna'],
      description: p.description,
      metadata: { funnel: program, program, kind: 'deposit', tuition_cents: '200000' },
    });
    return res.status(200).json({ publishableKey, clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (err) {
    console.error('create-deposit-payment-intent failed', err.message);
    return res.status(500).json({ error: 'Could not start payment' });
  }
}
