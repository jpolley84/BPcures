// api/deposit-confirmed.js — tells Joel a Life Change Activated deposit landed.
//
// Called by the page after a card payment succeeds, and by the confirmation
// page after a Klarna redirect. It re-reads the PaymentIntent from Stripe, so
// the notice only goes out for a real, succeeded deposit, and only once
// (metadata.joel_notified). Internal email to Joel only; nothing goes to the
// buyer from here (Stripe sends the buyer's receipt).

import Stripe from 'stripe';
import { PROGRAMS } from './create-deposit-payment-intent.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const NOTIFY_TO = 'braveworksrn@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const id = String((req.body && req.body.paymentIntentId) || '').trim();
  if (!/^pi_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Bad request' });
  try {
    const pi = await stripe.paymentIntents.retrieve(id, { expand: ['latest_charge'] });
    const md = pi.metadata || {};
    if (!PROGRAMS[md.program] || md.kind !== 'deposit') return res.status(403).json({ error: 'Not allowed' });
    if (pi.status !== 'succeeded') return res.status(200).json({ ok: true, status: pi.status });
    if (md.joel_notified === '1') return res.status(200).json({ ok: true, status: pi.status, already: true });
    await stripe.paymentIntents.update(id, { metadata: { ...md, joel_notified: '1' } });
    const method = pi.latest_charge?.payment_method_details?.type || 'card';
    const key = process.env.RESEND_API_KEY;
    if (key) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BPQuiz Alerts <alerts@bpquiz.com>',
          to: [NOTIFY_TO],
          reply_to: md.email || undefined,
          subject: `New Life Change Activated deposit: ${md.first_name || ''} ${md.last_name || ''} ($200)`.replace(/\s+/g, ' '),
          text: [
            `Program:  Life Change Activated ($2,000 tuition)`,
            `Deposit:  $${(pi.amount / 100).toFixed(2)} via ${method}`,
            `Name:     ${md.first_name || ''} ${md.last_name || ''}`,
            `Email:    ${md.email || ''}`,
            `Phone:    ${md.phone || ''}`,
            `Balance:  $1,800 · plan page: https://bpquiz.com/life-change-activated/balance/`,
            `Stripe:   https://dashboard.stripe.com/payments/${pi.id}`,
          ].join('\n'),
        }),
      }).catch((e) => console.error('deposit-confirmed notify failed', e.message));
    }
    return res.status(200).json({ ok: true, status: pi.status });
  } catch (err) {
    console.error('deposit-confirmed failed', err.message);
    return res.status(500).json({ error: 'Check failed' });
  }
}
