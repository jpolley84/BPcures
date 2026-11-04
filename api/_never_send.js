// api/_never_send.js - SINGLE SOURCE OF TRUTH for who must never receive a
// marketing or sales email. Deployable port of scripts/_never_send.mjs.
//
// WHY THIS FILE EXISTS
// On 2026-09-28 a four-email close campaign and a downsell blast reached eleven
// current coaching clients. Brenda replied "i am already in." Shirley replied
// "Call me." Both had been paying customers since August. The lists were built
// from masterclass:reg, challenge:*:reg and the application stores, all of which
// contain clients like everybody else, and nothing subtracted them. Each script
// carried its own ad hoc exclusion set and they drifted out of date.
//
// WHY IT LIVES IN api/ AND NOT ONLY IN scripts/
// scripts/ is in .gitignore (it holds customer PII), so a git-based build can
// never import scripts/_never_send.mjs; only a working-tree CLI deploy happens
// to carry it. Every broadcast handler is served from api/, so the list has to
// live here too. scripts/_never_send.mjs stays for local one-off scripts. Keep
// the two files in step.
//
// RULE
//   Every bulk send calls neverSendGuard() or excludeNeverSend() and subtracts
//   the result. No handler keeps its own hardcoded list. If someone new must be
//   protected, add them to the KV set bwbp:neversend and every send picks them
//   up on its next run.
//
// The four sources, resolved fresh on every call so nothing goes stale:
//   1. ACCELERATOR_ROSTER   the cohort as coded in api/_accelerator-roster.js
//   2. bwbp:allin:*         anyone enrolled through the /allin page
//   3. Stripe               coaching payments only: >= $200 with a coaching tier
//   4. bwbp:neversend       manual permanent opt-outs, plus every STOP reply
//
// Resend enforces its own unsubscribes, but buildExcluded() folds them in too so
// a dry run reports the real send size instead of a number that shrinks later.
//
// FAIL CLOSED: a KV failure throws out of buildExcluded(). Callers return 500
// and send nothing. Stripe and Resend failures are logged and skipped, because
// KV + roster alone still cover every known client.
//
// EXCEPTIONS: a send that is addressed TO the cohort on purpose (the Wednesday
// Zoom reminder in api/accelerator-reminder.js, the cohort helper in
// api/_cohort-broadcast.js) passes { includeClients: false }. That skips
// sources 1-3 and keeps bwbp:neversend + unsubscribes.

import { ACCELERATOR_ROSTER } from './_accelerator-roster.js';

// A coaching payment is at least the $200 Sprint deposit AND carries a coaching
// tier in its Stripe metadata. The amount alone is not enough: on 2026-09-28 a
// $197 challenge VIP purchase (Paula Hawkins, empty metadata) was misread as a
// coaching client and nearly received an apology telling her she was enrolled.
const CLIENT_CENTS = 20000;
const COACHING_TIERS = /allin|accelerator|sprint|coaching|deposit/i;

const norm = (e) => String(e || '').trim().toLowerCase();

// Upstash REST, one command per call. Env is read at call time so a local
// test with --env-file and a Vercel function behave the same.
async function kv(...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN missing');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`KV ${r.status}`);
  return (await r.json()).result;
}

async function scanKeys(pattern) {
  let cursor = '0';
  const keys = [];
  do {
    const [next, batch] = await kv('SCAN', cursor, 'MATCH', pattern, 'COUNT', '4000');
    cursor = String(next);
    keys.push(...(batch || []));
  } while (cursor !== '0');
  return keys;
}

/** The Accelerator cohort, straight from the file the reminder cron already uses.
 *  Withdrawn members are INCLUDED on purpose: a past client must not be sold to. */
export function rosterEmails() {
  return new Set(ACCELERATOR_ROSTER.map((m) => norm(m.email)).filter(Boolean));
}

/** Everyone enrolled through /allin. Throws if KV is unreachable (fail closed). */
export async function allinEmails() {
  const keys = await scanKeys('bwbp:allin:*');
  return new Set(
    keys.map((k) => norm(k.slice('bwbp:allin:'.length))).filter((e) => e.includes('@')),
  );
}

/** Anyone who has paid >= $200 with a coaching tier. Non-fatal if Stripe is unreachable. */
export async function payingCustomers() {
  const out = new Set();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return out;
  const endpoints = [
    'https://api.stripe.com/v1/checkout/sessions?limit=100',
    'https://api.stripe.com/v1/charges?limit=100',
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) continue;
      const { data = [] } = await r.json();
      for (const row of data) {
        const amount = row.amount_total ?? row.amount ?? 0;
        const paid = row.payment_status === 'paid' || row.paid === true;
        const email = norm(row.customer_details?.email || row.billing_details?.email);
        const meta = JSON.stringify(row.metadata || {});
        const isCoaching = COACHING_TIERS.test(meta);
        if (paid && email && amount >= CLIENT_CENTS && isCoaching) out.add(email);
      }
    } catch (err) {
      console.warn('[never-send] stripe pull failed, continuing:', err.message);
    }
  }
  return out;
}

/** Manual permanent opt-outs. Every STOP reply lands here. Throws if KV is unreachable. */
export async function neverSendSet() {
  const members = await kv('SMEMBERS', 'bwbp:neversend');
  return new Set((members || []).map(norm));
}

/** Everyone Resend has marked unsubscribed, across every audience, all pages.
 *  Non-fatal if Resend is unreachable: Resend suppresses its own unsubscribes
 *  at send time anyway, so the only cost is a dry-run count that is slightly high. */
export async function resendUnsubscribed() {
  const out = new Set();
  const key = process.env.RESEND_API_KEY;
  if (!key) return out;
  const headers = { Authorization: `Bearer ${key}`, 'User-Agent': 'curl/8.4.0' };
  const pause = () => new Promise((r) => setTimeout(r, 120)); // Resend allows ~2 req/s
  try {
    const a = await fetch('https://api.resend.com/audiences', { headers }).then((r) => r.json());
    for (const aud of a.data || []) {
      let after;
      for (;;) {
        await pause();
        const qs = new URLSearchParams({ limit: '100', ...(after ? { after } : {}) });
        const cs = await fetch(`https://api.resend.com/audiences/${aud.id}/contacts?${qs}`, {
          headers,
        }).then((r) => r.json());
        const items = cs.data || [];
        for (const c of items) if (c.unsubscribed) out.add(norm(c.email));
        if (!cs.has_more || items.length === 0) break;
        after = items[items.length - 1].id;
      }
    }
  } catch (err) {
    console.warn('[never-send] resend unsub pull failed, continuing:', err.message);
  }
  return out;
}

/**
 * The one function every bulk send must call.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.includeClients=true] Pass false only for a send that is
 *        deliberately addressed to clients, such as a cohort announcement.
 * @returns {Promise<{excluded: Set<string>, breakdown: object}>}
 */
export async function buildExcluded({ includeClients = true } = {}) {
  const [allin, paying, never, unsub] = await Promise.all([
    includeClients ? allinEmails() : Promise.resolve(new Set()),
    includeClients ? payingCustomers() : Promise.resolve(new Set()),
    neverSendSet(),
    resendUnsubscribed(),
  ]);
  const roster = includeClients ? rosterEmails() : new Set();
  const excluded = new Set([...roster, ...allin, ...paying, ...never, ...unsub]);
  const breakdown = {
    includeClients,
    roster: roster.size,
    allin: allin.size,
    stripePayers: paying.size,
    neverSend: never.size,
    resendUnsubscribed: unsub.size,
    total: excluded.size,
  };
  return { excluded, breakdown };
}

/**
 * The guard the streaming broadcast loops use. Build it ONCE before the loop,
 * then ask guard.blocks(email) per record. report() returns the dry-run fields:
 *   excludedCount    how many distinct candidates this run removed
 *   excludedSample   the first 5 of them
 *   neverSendSources the per-source sizes behind the list
 */
export async function neverSendGuard(opts) {
  const { excluded, breakdown } = await buildExcluded(opts);
  const hits = new Set();
  return {
    excluded,
    breakdown,
    blocks(email) {
      const e = norm(email);
      if (!e || !excluded.has(e)) return false;
      hits.add(e);
      return true;
    },
    report() {
      return { excludedCount: hits.size, excludedSample: [...hits].slice(0, 5), neverSendSources: breakdown };
    },
  };
}

/**
 * The guard for a send that already holds its list. Accepts plain addresses
 * or objects with an `email` field; returns the survivors in their original
 * order plus the same report fields as neverSendGuard().report().
 */
export async function excludeNeverSend(candidates, opts) {
  const guard = await neverSendGuard(opts);
  const emailOf = (c) => (typeof c === 'string' ? c : c && c.email);
  const kept = (candidates || []).filter((c) => !guard.blocks(emailOf(c)));
  return { kept, ...guard.report() };
}

/**
 * Convenience wrapper kept for parity with scripts/_never_send.mjs. Subtracts
 * the excluded set from a candidate list of addresses and prints what it
 * removed, so every dry run shows the real number.
 */
export async function filterRecipients(candidates, opts) {
  const { excluded, breakdown } = await buildExcluded(opts);
  const before = new Set(candidates.map(norm));
  const after = [...before].filter((e) => !excluded.has(e)).sort();
  console.log(
    `[never-send] ${before.size} candidates, ${before.size - after.length} removed, ${after.length} will send`,
  );
  console.log('[never-send] sources:', JSON.stringify(breakdown));
  return after;
}
