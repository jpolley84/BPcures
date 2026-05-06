#!/usr/bin/env node
// scripts/webhook-health.mjs
//
// On-demand webhook delivery audit. Run from the bpquiz-site directory:
//
//   node scripts/webhook-health.mjs                # last 7 days
//   node scripts/webhook-health.mjs --days 30      # last N days
//   node scripts/webhook-health.mjs --resend phyllisrene26@gmail.com  # resend ONE
//
// What it does:
//   1. Pulls Stripe charges in the window
//   2. Cross-references each buyer email against Mailchimp (looking for the
//      'Purchased' tag added at purchase time)
//   3. Reports buyers who likely missed the welcome email (no tag, or tag
//      added > 6h after purchase = backfilled rather than auto-tagged)
//   4. Optionally resends a SINGLE buyer's welcome email via the
//      /api/test-purchase-email endpoint
//
// Use this whenever:
//   - A buyer says "I never got my kit"
//   - Joel wants a sanity check that the webhook is healthy
//   - After deploying webhook changes, to confirm next purchases land tags
//
// Reads env from .env (Stripe + Mailchimp keys).

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');

// ─── env loader (avoid dotenv dep) ────────────────────────────────────
function loadEnv() {
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const STRIPE_KEY = env.STRIPE_SECRET_KEY;
const MC_KEY = env.MAILCHIMP_API_KEY;
const MC_LIST = env.MAILCHIMP_LIST_ID || '1550e2956c';

if (!STRIPE_KEY) { console.error('Missing STRIPE_SECRET_KEY'); process.exit(1); }
if (!MC_KEY) { console.error('Missing MAILCHIMP_API_KEY'); process.exit(1); }

const STRIPE_AUTH = 'Basic ' + Buffer.from(`${STRIPE_KEY}:`).toString('base64');
const MC_AUTH = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');
const MC_DC = MC_KEY.split('-').pop();

// ─── args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let days = 7;
let resendEmail = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--days') days = parseInt(args[++i], 10);
  else if (args[i] === '--resend') resendEmail = args[++i];
}

// ─── helpers ──────────────────────────────────────────────────────────
async function stripeCall(path, params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const r = await fetch(`https://api.stripe.com/v1${path}${qs}`, { headers: { Authorization: STRIPE_AUTH } });
  if (!r.ok) throw new Error(`stripe ${path}: ${r.status}`);
  return r.json();
}

async function mcMember(email) {
  const h = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  const r = await fetch(`https://${MC_DC}.api.mailchimp.com/3.0/lists/${MC_LIST}/members/${h}`, {
    headers: { Authorization: MC_AUTH },
  });
  if (r.status === 404) return null;
  if (!r.ok) return null;
  return r.json();
}

const TIER_LABELS = {
  1200: '$12 Bump (PT Stack)',
  1299: '$13 BP Cures (alt)',
  1700: '$17 BP Starter',
  2200: '$22 BS Starter',
  2700: '$27 Bundle',
  2900: '$29 ($17 + bump)',
  3000: '$30 Kit upgrade',
  3700: '$37',
  4700: '$47 BP Reset Kit',
  5900: '$59 ($47 + bump)',
  9700: '$97 VIP',
  19700: '$197 Premium (legacy)',
  29700: '$297 Premium (legacy)',
  39700: '$397 Premium (current)',
};

const AMOUNT_TO_TIER_KEY = {
  1200: '1', 1299: '1', 1700: '1', 2200: '1', 2700: '1', 3700: '1',
  2900: '1+pt-stack', 3000: '2',
  4700: '2', 5900: '2+pt-stack',
  9700: 'vip',
  19700: '3', 29700: '3', 39700: '3',
};

// ─── single-buyer resend ─────────────────────────────────────────────
async function resendOne(email) {
  // Find the buyer's most recent successful charge to determine tier
  const charges = await stripeCall('/charges', { limit: 100 });
  const buyerCharges = charges.data
    .filter((c) => c.status === 'succeeded' && !c.refunded)
    .filter((c) => (c.billing_details?.email || '').toLowerCase() === email.toLowerCase())
    .sort((a, b) => b.created - a.created);
  if (buyerCharges.length === 0) {
    console.error(`No successful charge found for ${email}`);
    process.exit(1);
  }
  const last = buyerCharges[0];
  const tier = AMOUNT_TO_TIER_KEY[last.amount];
  if (!tier) {
    console.error(`No tier mapping for amount ${last.amount} (${TIER_LABELS[last.amount] || '?'})`);
    process.exit(1);
  }
  const name = last.billing_details?.name || '';
  console.log(`Found charge: ${TIER_LABELS[last.amount]} on ${new Date(last.created * 1000).toISOString().slice(0, 10)}`);
  console.log(`Resending tier=${tier} welcome to ${email} (name=${name || '(none)'})`);
  const r = await fetch('https://bpquiz.com/api/test-purchase-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, email, name }),
  });
  const body = await r.text();
  if (r.ok) console.log(`✓ Sent: ${body}`);
  else console.error(`✗ Failed (${r.status}): ${body}`);
}

// ─── audit ────────────────────────────────────────────────────────────
async function audit() {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const charges = [];
  let startingAfter;
  while (true) {
    const params = { limit: 100, 'created[gte]': since };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripeCall('/charges', params);
    charges.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  const ok = charges.filter((c) => c.status === 'succeeded' && !c.refunded);
  console.log(`\nWindow: last ${days} days · ${ok.length} successful charges\n`);

  const seen = new Set();
  const onTime = [];
  const late = [];
  const noTag = [];
  const noMC = [];

  for (const c of ok) {
    const email = (c.billing_details?.email || '').toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const purchaseTs = new Date(c.created * 1000);
    const member = await mcMember(email);
    const row = {
      email,
      name: c.billing_details?.name || '',
      amount: c.amount,
      tierLabel: TIER_LABELS[c.amount] || `$${c.amount / 100}`,
      purchaseTs,
    };
    if (!member) { noMC.push(row); continue; }
    const tags = (member.tags || []).map((t) => t.name);
    if (!tags.includes('Purchased')) { noTag.push({ ...row, tags }); continue; }
    const lc = member.last_changed ? new Date(member.last_changed) : null;
    if (!lc) { noTag.push({ ...row, tags }); continue; }
    const gapHours = (lc - purchaseTs) / 3600000;
    if (gapHours > 6) late.push({ ...row, gapHours, lastChanged: lc });
    else onTime.push(row);
  }

  console.log(`On-time delivery (tag within 6h):  ${onTime.length}`);
  console.log(`Late-tagged (>6h after purchase):  ${late.length}  ← likely missed email`);
  console.log(`No Purchased tag at all:           ${noTag.length}  ← definitely missed`);
  console.log(`Buyer not in Mailchimp list:       ${noMC.length}  ← definitely missed\n`);

  const concerning = [...noTag, ...noMC, ...late];
  if (concerning.length === 0) {
    console.log('No suspected webhook misses in this window. ✓\n');
    return;
  }

  console.log('Buyers who likely need their welcome email resent:\n');
  for (const r of concerning.sort((a, b) => b.purchaseTs - a.purchaseTs)) {
    const ts = r.purchaseTs.toISOString().slice(0, 16).replace('T', ' ');
    const cat = r.gapHours ? `late ${r.gapHours.toFixed(0)}h` : (noMC.includes(r) ? 'not in MC' : 'no Purchased tag');
    console.log(`  ${ts}  ${r.tierLabel.padEnd(20)}  ${r.email.padEnd(36)}  [${cat}]`);
  }
  console.log(`\nTo resend a specific buyer's welcome:`);
  console.log(`  node scripts/webhook-health.mjs --resend <email>\n`);
}

// ─── main ─────────────────────────────────────────────────────────────
if (resendEmail) {
  await resendOne(resendEmail);
} else {
  await audit();
}
