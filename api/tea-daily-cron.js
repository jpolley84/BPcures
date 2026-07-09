// api/tea-daily-cron.js — nightly SVUTU Steady tea shipping digest.
//
// Runs at the end of every day (vercel.json: 30 4 * * * UTC = 11:30 PM Central
// during daylight time). Reads the day's tea sales the webhook recorded in KV
// (tea:sales:<Chicago-date>, written by processTeaPurchase in
// triangle-webhook.js) and emails the shipping list to Joel + Annie.
//
// Behavior notes:
//   - ZERO sales -> no email (Joel's rule: no notification noise).
//   - Idempotent per day (tea:digest-sent:<date> marker) so a manual re-fire
//     never double-sends.
//   - Subscription RENEWALS do not fire checkout.session.completed, so only
//     new purchases (including a sub's FIRST order) appear here. Monthly
//     renewal shipments come from the Stripe subscriptions dashboard.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { FROM, REPLY_TO } from './_triangle-email.js';
import { chicagoDateKey } from './triangle-webhook.js';

const RECIPIENTS = ['braveworksrn@gmail.com', 'annie@everydaynurse.com'];

function fmtAddress(a) {
  const parts = [a.line1, a.line2, `${a.city}${a.state ? ', ' + a.state : ''} ${a.postal_code}`.trim(), a.country !== 'US' ? a.country : ''];
  return parts.filter(Boolean).join(', ');
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

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });

  const day = typeof req.query?.day === 'string' ? req.query.day : chicagoDateKey();
  const dayKey = `tea:sales:${day}`;
  const sentKey = `tea:digest-sent:${day}`;

  const force = req.query?.force === '1';
  if (!force) {
    const already = await kv.get(sentKey).catch(() => null);
    if (already) return res.status(200).json({ sent: false, reason: 'already_sent', day });
  }

  const raw = (await kv.lrange(dayKey, 0, -1).catch(() => [])) || [];
  const sales = raw
    .map((r) => { try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return null; } })
    .filter(Boolean);

  if (!sales.length) {
    return res.status(200).json({ sent: false, reason: 'no_sales', day });
  }

  const totalCents = sales.reduce((s, x) => s + (x.amountCents || 0), 0);
  const rows = sales.map((s, i) => {
    const badName = nameLooksLikeAddress(s.name, s.address);
    const nameCell = badName
      ? `<strong style="color:#B85A36;">${s.name || ''}</strong><br/><span style="color:#B85A36;font-size:12px;font-weight:700;">&#9888; name looks like an address — confirm with buyer before shipping</span><br/>${s.email || ''}`
      : `<strong>${s.name || ''}</strong><br/>${s.email || ''}`;
    return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${nameCell}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${(s.items || []).map((it) => `${it.qty} x ${it.name}`).join('<br/>') || 'Tea'}${s.subscription ? '<br/><em>(subscription, first order)</em>' : ''}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">${fmtAddress(s.address || {})}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E8E1D1;font-size:14px;">$${((s.amountCents || 0) / 100).toFixed(2)}</td>
    </tr>`;
  }).join('');

  const html = `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:720px;margin:0 auto;">
    <h2 style="color:#121110;">Steady tea: ${sales.length} order${sales.length === 1 ? '' : 's'} to ship (${day})</h2>
    <p style="color:#2B2824;font-size:14px;">Total collected: <strong>$${(totalCents / 100).toFixed(2)}</strong>. Addresses below are exactly as the buyer entered them at checkout.</p>
    <table style="border-collapse:collapse;width:100%;">
      <tr>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">#</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Buyer</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Items</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Ship to</th>
        <th align="left" style="padding:8px 10px;border-bottom:2px solid #121110;font-size:13px;">Paid</th>
      </tr>
      ${rows}
    </table>
    <p style="color:#7A7061;font-size:12px;margin-top:16px;">Automated end-of-day digest from bpquiz.com/tea. Subscription renewals do not appear here; ship those from the Stripe subscriptions dashboard.</p>
  </div>`;

  const text = `Steady tea: ${sales.length} order(s) to ship (${day})\nTotal: $${(totalCents / 100).toFixed(2)}\n\n` +
    sales.map((s, i) => `${i + 1}. ${s.name} <${s.email}>${nameLooksLikeAddress(s.name, s.address) ? '\n   ⚠ NAME LOOKS LIKE AN ADDRESS — confirm with buyer before shipping' : ''}\n   ${(s.items || []).map((it) => `${it.qty} x ${it.name}`).join('; ')}${s.subscription ? ' (subscription, first order)' : ''}\n   Ship to: ${fmtAddress(s.address || {})}\n   Paid: $${((s.amountCents || 0) / 100).toFixed(2)}`).join('\n\n');

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: RECIPIENTS,
    replyTo: REPLY_TO,
    subject: `Tea shipping: ${sales.length} order${sales.length === 1 ? '' : 's'} today (${day})`,
    html,
    text,
  });

  await kv.set(sentKey, { sentAt: new Date().toISOString(), count: sales.length }, { ex: 60 * 60 * 24 * 30 }).catch(() => {});
  return res.status(200).json({ sent: true, day, orders: sales.length, totalCents });
}
