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
    fullAmount: 200000,
    fullDescription: 'Life Change Activated: $2,000 tuition paid in full',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const program = (req.body && req.body.program) || '';
  const p = PROGRAMS[program];
  if (!p) return res.status(400).json({ error: 'Unknown program' });
  // 2026-10-22 (Joel): a checkbox on the page switches to paying the whole
  // $2,000 today (card or Klarna). Deposit stays the default.
  const full = req.body && req.body.option === 'full';
  const amount = full ? p.fullAmount : p.amount;
  const kind = full ? 'full' : 'deposit';
  // The server-side copy of VITE_STRIPE_PUBLISHABLE_KEY is cut short (100 of
  // 107 chars, Stripe answers "Invalid API Key"), so use the full public key
  // for this account (same one restoreherhormones.com ships). Publishable keys
  // are public by design.
  const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY_FULL || 'pk_live_51TE9iEHseZnO3rRZ1xXgqstXEEeFIyy8m37WCHYcgRsh1hqEwD7gdK3IUo2yaKSXaiJvw9wyXez7izjv8dP0zOR300VmC8VCao').trim();
  if (!publishableKey) return res.status(500).json({ error: 'Payment service not configured' });
  try {
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card', 'klarna'],
      description: full ? p.fullDescription : p.description,
      metadata: { funnel: program, program, kind, tuition_cents: '200000' },
    });
    return res.status(200).json({ publishableKey, clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (err) {
    console.error('create-deposit-payment-intent failed', err.message);
    return res.status(500).json({ error: 'Could not start payment' });
  }
}
