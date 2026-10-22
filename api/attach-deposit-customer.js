// api/attach-deposit-customer.js — saves the buyer's details on the Life
// Change Activated deposit PaymentIntent right before it is confirmed.
//
// Only touches an UNPAID intent that this program created (metadata check), so
// it cannot be used to edit any other payment on the shared Stripe account.
// Creates a Stripe Customer so Joel can send the $1,800 balance plan later,
// and sets receipt_email so Stripe sends the buyer's standard receipt.

import Stripe from 'stripe';
import { PROGRAMS } from './create-deposit-payment-intent.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clean = (v, n) => String(v || '').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = req.body || {};
  const id = clean(b.paymentIntentId, 80);
  const first = clean(b.first_name, 100);
  const last = clean(b.last_name, 100);
  const email = clean(b.email, 254).toLowerCase();
  const phone = clean(b.phone, 30);
  if (!/^pi_[A-Za-z0-9]+$/.test(id) || !first || !last || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please complete every field.' });
  }
  try {
    const pi = await stripe.paymentIntents.retrieve(id);
    if (!PROGRAMS[pi.metadata?.program] || pi.metadata?.kind !== 'deposit') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (!['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)) {
      return res.status(409).json({ error: 'This payment has already been processed.' });
    }
    let customer = pi.customer;
    if (!customer) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customer = found.data[0]?.id
        || (await stripe.customers.create({ email, name: `${first} ${last}`, phone, metadata: { source: pi.metadata.program } })).id;
    }
    await stripe.paymentIntents.update(id, {
      customer,
      receipt_email: email,
      metadata: { ...pi.metadata, first_name: first, last_name: last, email, phone },
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('attach-deposit-customer failed', err.message);
    return res.status(500).json({ error: 'We could not save your details. Please try again.' });
  }
}
