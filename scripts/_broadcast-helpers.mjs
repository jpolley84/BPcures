// scripts/_broadcast-helpers.mjs
//
// Shared helpers for one-shot cohort broadcasts. Pulls from drip:* KV,
// filters to engaged, signs unsubscribe tokens, and rate-limits sends.
// Used by:
//   - send-cohort-announcement.mjs       (Wed broadcast — fired)
//   - send-cohort-reminder-saturday.mjs  (Sat 24-hr-left)
//   - send-cohort-reminder-sunday.mjs    (Sun door-closes-tonight)

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import crypto from 'node:crypto';
import fs from 'node:fs';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY = 'braveworksrn@gmail.com';
export const APPLY_URL = 'https://bpquiz.com/coaching';
export const SITE_URL = 'https://bpquiz.com';

export function signUnsubToken(email) {
  const secret = process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';
  const ts = Date.now();
  const sig = crypto.createHmac('sha256', secret).update(`${email}.${ts}`).digest('hex').slice(0, 16);
  return Buffer.from(`${email}.${ts}.${sig}`).toString('base64url');
}

export function unsubUrl(email) {
  return `${SITE_URL}/api/unsubscribe?token=${signUnsubToken(email)}`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export async function pullRecipients() {
  const keys = await kv.keys('drip:*');
  const recipients = [];
  const stats = { total: 0, unsub: 0, paused: 0, complete: 0, noEmail: 0 };
  for (const k of keys) {
    stats.total++;
    const r = await kv.get(k);
    if (!r || !r.email) { stats.noEmail++; continue; }
    if (r.unsubscribed) { stats.unsub++; continue; }
    if (r.paused) { stats.paused++; continue; }
    if (r.complete) { stats.complete++; continue; }
    recipients.push({ email: r.email, firstName: r.firstName || '' });
  }
  return { recipients, stats };
}

// Reusable value-stack table HTML — drop into any reminder email.
export function valueStackHtml() {
  const items = [
    { name: 'Weekly 1:1 with Joel — 12 sessions (Mondays 8 PM ET)', value: '$5,964' },
    { name: 'Biweekly hormone coaching with Annie — 6 sessions', value: '$1,782' },
    { name: 'Full supplement + diet audit (live, 60 min)', value: '$697' },
    { name: 'Daily schedule audit', value: '$497' },
    { name: 'WhatsApp office hours (Sun–Thu 9–5 ET) × 90 days', value: '$1,997' },
    { name: 'Skool VIP membership (90-day access)', value: '$297' },
    { name: 'All BraveWorks courses — lifetime', value: '$1,997' },
    { name: 'eBook library — lifetime', value: '$497' },
    { name: 'Daily tailored email coaching', value: '$497' },
    { name: 'Tracker suite (BP / symptom / food / sleep)', value: '$97' },
    { name: 'Partner inclusion guide', value: '$97' },
    { name: "Barbara O'Neill LIVE Event — 20% off", value: '$197' },
  ];
  const rows = items.map((it) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#2C2A26;line-height:1.5;border-bottom:1px solid #F0EDE5;">${escapeHtml(it.name)}</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#A88A4A;font-weight:600;border-bottom:1px solid #F0EDE5;white-space:nowrap;padding-left:14px;">${it.value}</td></tr>`
  ).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">${rows}
    <tr><td style="padding:10px 0 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#2C2A26;font-weight:700;">Total stack value</td><td style="padding:10px 0 0;text-align:right;font-size:17px;color:#2C2A26;font-weight:800;">$14,616</td></tr>
  </table>`;
}

export function priceBlockHtml() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2F3E4E;border-radius:10px;margin:18px 0;">
    <tr><td style="padding:18px;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:6px;">Founding cohort — closes Sunday 11:59 PM ET</div>
      <div style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);text-decoration:line-through;">$6,997 after Sunday</div>
      <div style="font-family:Georgia,serif;font-size:32px;font-weight:800;color:#FBF8F1;line-height:1.1;margin-top:2px;">$1,997</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">or three monthly payments of $697</div>
    </td></tr>
  </table>`;
}

export function ctaButtonHtml(label = 'Apply for the founding cohort →') {
  return `<p style="margin:0 0 24px;text-align:center;">
    <a href="${APPLY_URL}" style="display:inline-block;padding:16px 32px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${escapeHtml(label)}</a>
  </p>`;
}

// Full template wrapper for branded emails (matches the announcement HTML)
export function wrap({ kicker, body, footerExtra = '', firstName, unsubUrl: u }) {
  const hi = firstName ? `${escapeHtml(firstName)},` : 'Friend,';
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,serif;color:#2C2A26;line-height:1.7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
      <tr><td style="padding:36px 30px 8px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;margin-bottom:18px;">
          ${kicker}
        </div>
        <p style="font-family:Georgia,serif;font-size:18px;font-style:italic;color:#5B564C;margin:0 0 24px;">${hi}</p>
        ${body}
        ${footerExtra}
      </td></tr>
    </table>
    <p style="font-size:11px;color:#9C9485;margin:18px 0 0;font-family:-apple-system,sans-serif;">
      BraveWorks RN  ·  braveworksrn@gmail.com  ·  <a href="${SITE_URL}" style="color:#9C9485;">bpquiz.com</a>
    </p>
    <p style="font-size:10px;color:#B5AC9C;margin:8px 0 0;font-family:-apple-system,sans-serif;">
      <a href="${u}" style="color:#B5AC9C;">Unsubscribe</a>
    </p>
  </td></tr>
</table>
</body></html>`;
}

// Send one-by-one with rate limit. Logs progress every 50, dumps failures.
export async function broadcast({ targets, subject, renderText, renderHtml, label }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0, failed = 0;
  const failures = [];
  console.log(`SENDING "${subject}" to ${targets.length} subscribers...`);
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    try {
      const u = unsubUrl(r.email);
      const result = await resend.emails.send({
        from: FROM, to: r.email, replyTo: REPLY, subject,
        text: renderText(r.firstName),
        html: renderHtml(r.firstName, u),
        headers: {
          'List-Unsubscribe': `<${u}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      if (result.error) {
        failed++;
        failures.push({ email: r.email, error: result.error.message || JSON.stringify(result.error) });
      } else {
        sent++;
        if (sent % 50 === 0) console.log(`  ${sent}/${targets.length}...`);
      }
    } catch (err) {
      failed++;
      failures.push({ email: r.email, error: err.message });
    }
    await new Promise((res) => setTimeout(res, 110));
  }
  console.log(`\nDONE — sent: ${sent}, failed: ${failed}`);
  if (failures.length) {
    const path = `C:/Users/jpoll/AppData/Local/Temp/${label || 'broadcast'}-failures.json`;
    fs.writeFileSync(path, JSON.stringify(failures, null, 2));
    console.log(`Failures: ${path}`);
  }
  return { sent, failed };
}
