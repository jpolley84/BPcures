// api/tea-daily-cron.js — nightly SVUTU Steady tea shipping digest.
//
// Runs at the end of every day (vercel.json: 30 4 * * * UTC = 11:30 PM Central
// during daylight time). Reads the permanent per-order ledger (tea:order:<id>,
// written by recordTeaSale() in triangle-webhook.js — no TTL, one key per
// order, matching the drip:<email>/waitlist:app:<email> convention elsewhere)
// and emails ONE digest with three lists, so fulfillment starts and ends with
// a single email:
//   1. NEW      — orders placed in the last rolling 24 hours.
//   2. TO DATE  — every order not yet marked fulfilled (the open worklist),
//                 oldest first, so the longest-waiting order surfaces top.
//   3. FULFILLED — orders marked fulfilled (most recently fulfilled first).
//                 Capped in the email at FULFILLED_DISPLAY_CAP rows; the full
//                 history stays in KV regardless.
//
// Marking fulfilled: Joel/Annie tell Claude which orders shipped (by name,
// email, or the short Order # printed on each row) and Claude runs
// scripts/tea-mark-fulfilled.mjs, which flips fulfilled:true + fulfilledAt on
// the matching tea:order:<id> record(s). Nothing else ever sets that flag —
// an order only leaves "To date" because a human said it shipped.
//
// Behavior notes:
//   - Sends only if there is something to act on: at least one NEW order or
//     at least one open (unfulfilled) order. A day with zero new sales and a
//     fully-cleared backlog sends nothing (Joel's original no-noise rule).
//   - Idempotent per day (tea:digest-sent:<date> marker) so a manual re-fire
//     never double-sends; pass ?force=1 to resend anyway.
//   - Subscription RENEWALS do not fire checkout.session.completed, so only
//     new purchases (including a sub's FIRST order) appear here. Monthly
//     renewal shipments come from the Stripe subscriptions dashboard.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { FROM, REPLY_TO } from './_triangle-email.js';
import { chicagoDateKey } from './triangle-webhook.js';

const RECIPIENTS = ['braveworksrn@gmail.com', 'annie@everydaynurse.com'];
const FULFILLED_DISPLAY_CAP = 50;
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

function fmtAddress(a) {
  const parts = [a.line1, a.line2, `${a.city}${a.state ? ', ' + a.state : ''} ${a.postal_code}`.trim(), a.country !== 'US' ? a.country : ''];
  return parts.filter(Boolean).join(', ');
}

// Short, stable reference Joel/Annie can quote back ("mark 0UTBYBAE
// fulfilled") without needing the full Stripe session/charge id.
function orderRef(id) {
  return String(id || '').slice(-8).toUpperCase();
}

// 2026-07-09: Stripe's hosted checkout has no field-level validation we can
// add, and a buyer's street address occasionally lands in the Name field
// (confirmed case: ccllns793@gmail.com, both billing_details.name AND
// shipping.name = "127 Sugarberry Drive"). We can't fix Stripe's hosted page,
// so we flag it here instead — surface the anomaly to a human before a
// shipping label gets printed with a street address as the addressee name.
const STREET_SUFFIX_RE = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way|place|pl|terrace|ter|parkway|pkwy|highway|hwy|trail|trl)\b\.?/i;
function nameLooksLikeAddress(name, address) {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  const line1 = (address?.line1 || '').trim().toLowerCase();
  if (line1 && n === line1) return true; // exact match to street line — the confirmed failure mode
  return /^\d+\s/.test(name.trim()) && STREET_SUFFIX_RE.test(name); // "123 Something Drive"-shaped
}

// Clearly separate the two blends at a glance. Records written before the
// 2026-07-10 blend split have no `blend` field — treat those as Steady.
function blendLabel(blend) {
  return String(blend || 'steady').toLowerCase() === 'satin' ? 'Satin' : 'Steady';
}
function blendBadge(blend) {
  const isSatin = blendLabel(blend) === 'Satin';
  const bg = isSatin ? '#7C3B52' : '#8C3127'; // Satin plum vs Steady ruby
  return `<span style="display:inline-block;padding:2px 9px;border-radius:11px;background:${bg};color:#fff;font-size:11px;font-weight:700;letter-spacing:.03em;">${isSatin ? 'Satin' : 'Steady'}</span>`;
}
function blendSplit(list) {
  const satin = list.filter((s) => blendLabel(s.blend) === 'Satin').length;
  const steady = list.length - satin;
  return `${steady} Steady · ${satin} Satin`;
}

function renderRow(s, i) {
  const badName = nameLooksLikeAddress(s.name, s.address);
  const nameCell = badName
    ? `<strong style="color:#B85A36;">${s.name || ''}</strong><br/><span style="color:#B85A36;font-size:12px;font-weight:700;">&#9888; name looks like an address — confirm with buyer before shipping</span><br/>${s.email || ''}`
    : `<strong>${s.name || ''}</strong><br/>${s.email || ''}`;
  return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:12px;color:#7A7061;font-family:monospace;">${orderRef(s.sessionId)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${blendBadge(s.blend)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${nameCell}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${(s.items || []).map((it) => `${it.qty} x ${it.name}`).join('<br/>') || 'Tea'}${s.subscription ? '<br/><em>(subscription, first order)</em>' : ''}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${fmtAddress(s.address || {})}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">$${((s.amountCents || 0) / 100).toFixed(2)}</td>
    </tr>`;
}

function renderTable(rowsHtml) {
  return `
    <table style="border-collapse:collapse;width:100%;margin-bottom:8px;">
      <tr>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">#</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Order #</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Blend</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Buyer</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Items</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Ship to</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Paid</th>
      </tr>
      ${rowsHtml || `<tr><td colspan="7" style="padding:10px;color:#9A9186;font-size:13px;font-style:italic;">None right now.</td></tr>`}
    </table>`;
}

function renderTextSection(title, list, { withFulfilledAt } = {}) {
  if (!list.length) return `${title}\n(none right now)\n`;
  return `${title}\n` + list.map((s, i) =>
    `${i + 1}. [${blendLabel(s.blend).toUpperCase()}] [${orderRef(s.sessionId)}] ${s.name} <${s.email}>${nameLooksLikeAddress(s.name, s.address) ? '\n   ⚠ NAME LOOKS LIKE AN ADDRESS — confirm with buyer before shipping' : ''}\n   ${(s.items || []).map((it) => `${it.qty} x ${it.name}`).join('; ')}${s.subscription ? ' (subscription, first order)' : ''}\n   Ship to: ${fmtAddress(s.address || {})}\n   Paid: $${((s.amountCents || 0) / 100).toFixed(2)}${withFulfilledAt && s.fulfilledAt ? `\n   Fulfilled: ${s.fulfilledAt}` : ''}`
  ).join('\n\n') + '\n';
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });

  const day = typeof req.query?.day === 'string' ? req.query.day : chicagoDateKey();
  const sentKey = `tea:digest-sent:${day}`;

  const force = req.query?.force === '1';
  if (!force) {
    const already = await kv.get(sentKey).catch(() => null);
    if (already) return res.status(200).json({ sent: false, reason: 'already_sent', day });
  }

  // Read the full permanent ledger. One key per order, no TTL — this is the
  // single source of truth for all three lists (not the 21-day day-bucket,
  // which stays write-only now, kept only as a redundant short-term log).
  const orderKeys = await kv.keys('tea:order:*').catch(() => []);
  const allOrders = (await Promise.all(orderKeys.map((k) => kv.get(k).catch(() => null))))
    .filter(Boolean)
    .filter((o) => o.sessionId); // guard against any malformed record

  const now = Date.now();
  const newOrders = allOrders
    .filter((o) => now - new Date(o.at).getTime() <= NEW_WINDOW_MS)
    .sort((a, b) => new Date(b.at) - new Date(a.at)); // newest first
  const openOrders = allOrders
    .filter((o) => !o.fulfilled)
    .sort((a, b) => new Date(a.at) - new Date(b.at)); // oldest first — clear the backlog in order
  const fulfilledOrdersAll = allOrders
    .filter((o) => o.fulfilled)
    .sort((a, b) => new Date(b.fulfilledAt || b.at) - new Date(a.fulfilledAt || a.at)); // most recently done first
  const fulfilledOrders = fulfilledOrdersAll.slice(0, FULFILLED_DISPLAY_CAP);
  const fulfilledOverflow = fulfilledOrdersAll.length - fulfilledOrders.length;

  if (!newOrders.length && !openOrders.length) {
    return res.status(200).json({ sent: false, reason: 'nothing_to_do', day });
  }

  const openTotalCents = openOrders.reduce((s, x) => s + (x.amountCents || 0), 0);
  const newTotalCents = newOrders.reduce((s, x) => s + (x.amountCents || 0), 0);

  const html = `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:820px;margin:0 auto;">
    <h2 style="color:#121110;margin-bottom:4px;">Tea fulfillment digest &mdash; Steady + Satin (${day})</h2>
    <p style="color:#7A7061;font-size:12.5px;margin-top:0;">One email, three lists, both blends (<strong>Steady</strong> = bpquiz.com/tea, <strong>Satin</strong> = hormoneteas.com) &mdash; each row is tagged by blend. Mark an order fulfilled by telling Joel's assistant the Order # or buyer name/email — it moves to the Fulfilled list starting with tomorrow's digest.</p>

    <h3 style="color:#B85A36;margin:22px 0 4px;">1. New — last 24 hours (${newOrders.length})</h3>
    <p style="color:#2B2824;font-size:13px;margin:0 0 8px;">${blendSplit(newOrders)} &nbsp;·&nbsp; Total: <strong>$${(newTotalCents / 100).toFixed(2)}</strong></p>
    ${renderTable(newOrders.map(renderRow).join(''))}

    <h3 style="color:#121110;margin:26px 0 4px;">2. To date — open orders, oldest first (${openOrders.length})</h3>
    <p style="color:#2B2824;font-size:13px;margin:0 0 8px;">Everything not yet marked fulfilled. ${blendSplit(openOrders)} &nbsp;·&nbsp; Total: <strong>$${(openTotalCents / 100).toFixed(2)}</strong></p>
    ${renderTable(openOrders.map(renderRow).join(''))}

    <h3 style="color:#4A6741;margin:26px 0 4px;">3. Fulfilled (${fulfilledOrdersAll.length}${fulfilledOverflow > 0 ? `, showing most recent ${FULFILLED_DISPLAY_CAP}` : ''})</h3>
    ${renderTable(fulfilledOrders.map(renderRow).join(''))}
    ${fulfilledOverflow > 0 ? `<p style="color:#9A9186;font-size:12px;">+${fulfilledOverflow} earlier fulfilled order${fulfilledOverflow === 1 ? '' : 's'} not shown (full history stays in the system).</p>` : ''}

    <p style="color:#7A7061;font-size:12px;margin-top:16px;">Automated digest for both tea storefronts (Steady = bpquiz.com/tea, Satin = hormoneteas.com). Addresses are exactly as the buyer entered them at checkout. Subscription renewals do not appear here; ship those from the Stripe subscriptions dashboard.</p>
  </div>`;

  const text =
    `Tea fulfillment digest — Steady + Satin (${day})\n` +
    `One email, three lists, both blends (Steady = bpquiz.com/tea, Satin = hormoneteas.com). Each row is tagged [STEADY] or [SATIN]. Tell Joel's assistant an Order # or buyer name/email to mark it fulfilled.\n\n` +
    renderTextSection(`1. NEW — last 24 hours (${newOrders.length}) — ${blendSplit(newOrders)}, total $${(newTotalCents / 100).toFixed(2)}`, newOrders) + '\n' +
    renderTextSection(`2. TO DATE — open orders, oldest first (${openOrders.length}), total $${(openTotalCents / 100).toFixed(2)}`, openOrders) + '\n' +
    renderTextSection(`3. FULFILLED (${fulfilledOrdersAll.length}${fulfilledOverflow > 0 ? `, showing most recent ${FULFILLED_DISPLAY_CAP}` : ''})`, fulfilledOrders, { withFulfilledAt: true }) +
    (fulfilledOverflow > 0 ? `\n+${fulfilledOverflow} earlier fulfilled order(s) not shown (full history stays in the system).\n` : '');

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: RECIPIENTS,
    replyTo: REPLY_TO,
    subject: `Tea fulfillment: ${newOrders.length} new, ${openOrders.length} open (${day})`,
    html,
    text,
  });

  await kv.set(sentKey, { sentAt: new Date().toISOString(), new: newOrders.length, open: openOrders.length, fulfilled: fulfilledOrdersAll.length }, { ex: 60 * 60 * 24 * 30 }).catch(() => {});
  return res.status(200).json({ sent: true, day, new: newOrders.length, open: openOrders.length, fulfilled: fulfilledOrdersAll.length });
}
