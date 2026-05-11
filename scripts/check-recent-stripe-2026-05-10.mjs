#!/usr/bin/env node
/**
 * One-off post-deploy sales-flow health check.
 * Lists checkout sessions from the last N hours and reports paid/open/expired
 * counts so we can confirm the funnel is still landing payments after the
 * 2026-05-10 copy + Stripe-description rewrite.
 */
import 'dotenv/config';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) { console.error('NO STRIPE_SECRET_KEY'); process.exit(1); }

const HOURS = Number(process.argv[2] || 6);
const since = Math.floor(Date.now() / 1000) - HOURS * 3600;

const HEADERS = {
  Authorization: `Bearer ${STRIPE_KEY}`,
  'Stripe-Version': '2024-04-10',
};

async function listSessions() {
  const sessions = [];
  let startingAfter = null;
  for (let i = 0; i < 5; i++) {
    const qs = new URLSearchParams({
      'created[gte]': String(since),
      limit: '100',
    });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${qs}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
    const j = await res.json();
    sessions.push(...j.data);
    if (!j.has_more) break;
    startingAfter = j.data[j.data.length - 1]?.id;
  }
  return sessions;
}

const sessions = await listSessions();
const paid = sessions.filter(s => s.payment_status === 'paid');
const unpaid = sessions.filter(s => s.payment_status === 'unpaid');
const noPayment = sessions.filter(s => s.payment_status === 'no_payment_required');
const open = sessions.filter(s => s.status === 'open');
const expired = sessions.filter(s => s.status === 'expired');
const complete = sessions.filter(s => s.status === 'complete');

console.log(`\nLast ${HOURS}h of Stripe Checkout sessions:`);
console.log(`  Total sessions:       ${sessions.length}`);
console.log(`  ✅ Paid:               ${paid.length}`);
console.log(`  📂 Open (in flight):  ${open.length}`);
console.log(`  ⏳ Unpaid:            ${unpaid.length}`);
console.log(`  ⌛ Expired:           ${expired.length}`);
console.log(`  ✔️  Complete:          ${complete.length}`);
console.log('');

if (paid.length) {
  console.log('Paid sessions (most recent first):');
  for (const s of paid.sort((a, b) => b.created - a.created).slice(0, 15)) {
    const when = new Date(s.created * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const amt = (s.amount_total / 100).toFixed(2);
    const sub = s.amount_subtotal != null ? (s.amount_subtotal / 100).toFixed(2) : '—';
    const email = s.customer_details?.email || '(no email)';
    console.log(`  ${when}  $${amt.padStart(7)} (sub $${sub})  ${email}`);
  }
} else {
  console.log('No paid sessions in this window.');
}

console.log('');

// Final sanity: any 5xx-shaped errors via session.payment_intent.last_payment_error?
const failures = sessions.filter(s => s.payment_intent?.last_payment_error);
if (failures.length) {
  console.log(`⚠️  ${failures.length} sessions with last_payment_error:`);
  for (const s of failures.slice(0, 5)) {
    console.log(`  ${s.id}  ${s.payment_intent?.last_payment_error?.code} — ${s.payment_intent?.last_payment_error?.message}`);
  }
}
