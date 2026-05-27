// audit_stripe_14d.mjs — Pull last 14 days of charge.succeeded, group by tier
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) { console.error('NO STRIPE_SECRET_KEY'); process.exit(1); }

const now = Math.floor(Date.now() / 1000);
const fourteenDaysAgo = now - 14 * 86400;
const sevenDaysAgo = now - 7 * 86400;

async function fetchEvents(type, after, startingAfter) {
  const url = new URL('https://api.stripe.com/v1/events');
  url.searchParams.set('type', type);
  url.searchParams.set('limit', '100');
  url.searchParams.set('created[gte]', String(after));
  if (startingAfter) url.searchParams.set('starting_after', startingAfter);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${STRIPE_KEY}` } });
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${await r.text()}`);
  return r.json();
}

const charges = [];
let cursor = null;
let page = 0;
while (true) {
  page++;
  const data = await fetchEvents('charge.succeeded', fourteenDaysAgo, cursor);
  for (const ev of data.data) {
    const c = ev.data.object;
    if (c.status === 'succeeded') {
      charges.push({
        amount: c.amount / 100,
        created: c.created,
        currency: c.currency,
        refunded: c.refunded,
        amount_refunded: c.amount_refunded / 100,
        id: c.id,
      });
    }
  }
  if (!data.has_more) break;
  cursor = data.data[data.data.length - 1].id;
  if (page > 10) break;
}

// Refunds — separate event type
const refundEvents = [];
cursor = null;
page = 0;
while (true) {
  page++;
  const data = await fetchEvents('charge.refunded', fourteenDaysAgo, cursor);
  for (const ev of data.data) refundEvents.push(ev.data.object);
  if (!data.has_more) break;
  cursor = data.data[data.data.length - 1].id;
  if (page > 5) break;
}

function tierFor(amount) {
  if (amount >= 12 && amount <= 22) return 't1_$17';
  if (amount === 29) return 't1_bump_$29';
  if (amount === 30 || amount === 47) return 't2_$47';
  if (amount === 59) return 't2_bump_$59';
  if (amount === 97) return 't3_vip_$97';
  if (amount === 297 || amount === 397) return 't4_premium';
  return `other_$${amount}`;
}

const tiers = {};
const week1 = {}; // older
const week2 = {}; // recent
let total = 0;
let count = 0;
for (const c of charges) {
  const tier = tierFor(c.amount);
  if (!tiers[tier]) tiers[tier] = { count: 0, total: 0 };
  tiers[tier].count++;
  tiers[tier].total += c.amount;
  total += c.amount;
  count++;
  const bucket = c.created >= sevenDaysAgo ? week2 : week1;
  bucket[tier] = bucket[tier] || { count: 0, total: 0 };
  bucket[tier].count++;
  bucket[tier].total += c.amount;
}

console.log(JSON.stringify({
  total_count: count,
  total_amount: total.toFixed(2),
  refunds_count: refundEvents.length,
  refunds_total: refundEvents.reduce((s, r) => s + (r.amount_refunded || 0) / 100, 0).toFixed(2),
  tiers,
  week1_recent_pre: week1,
  week2_most_recent: week2,
  raw_count: charges.length,
}, null, 2));
