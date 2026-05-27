// scripts/send-cohort-announcement.mjs
//
// One-shot Resend broadcast: announces the 90-Day BP Triangle Freedom
// Sprint to the entire engaged drip:* KV list. Hardy "future self" frame
// + Myron Golden imagination level + Hormozi hard urgency.
//
// FLAGS:
//   --dry-run         Show counts + preview, send nothing
//   --test-only       Send a single copy to brave.works.marketing@gmail.com
//   --send            Send to all engaged subscribers (skips unsub/paused/complete)
//   --limit=<N>       Cap the number of recipients (useful for staged rollouts)
//
// Skips records where: unsubscribed=true, paused=true, complete=true.
// Rate-limited to 110ms between sends to stay inside Resend bursts.
// Outputs a per-recipient log + failure JSON for audit.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const TEST_ONLY = argv.includes('--test-only');
const SEND = argv.includes('--send');
const LIMIT = parseInt(argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10);

if (!DRY_RUN && !TEST_ONLY && !SEND) {
  console.error('Required flag: --dry-run | --test-only | --send');
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY missing — load .env.production');
  process.exit(1);
}

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY = 'braveworksrn@gmail.com';
const SUBJECT = 'Picture August. Sunday is the door.';
const APPLY_URL = 'https://bpquiz.com/coaching';
const SITE_URL = 'https://bpquiz.com';

// Plain-text body for accessibility + spam-score balance
function text(firstName) {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Picture August.

You wake up before the alarm because your body is rested for the first time in years. The bottle drawer has three bottles in it, not eighteen. The afternoon pain you used to brace for hasn't shown up in sixty days. You finally have a primary care doctor — a real one — who looked at your labs and said whatever you're doing, keep doing it. Your spouse watches you laugh on a Tuesday at 2 PM because you have energy left.

That's the destination.

This week I opened applications for the 90-Day BP Triangle Freedom Sprint — the first cohort of a coaching program I built for adults whose health gave up on them before they gave up on themselves.

Two RNs walking with you for 90 days. Weekly 1:1 with me on Mondays. Biweekly hormone work with Annie. WhatsApp access Sunday through Thursday. Supplement audit in week 1 — most members save $200-400 a month starting week 2. Lab pull at week 6. Doctor-cleared protocol handoff at week 12.

Five slots. Founding-cohort price. The first slot is already filled — a woman who told me on her intake she came home from the hospital worse than she went in. If you've ever known that feeling, this is built for you.

I'm not going to sell you the program. I'm going to sell you the version of yourself that exists 90 days from now — and tell you the door to her closes this Sunday at 11:59 PM Eastern.

After Sunday, it's $6,997.

Until then, founding cohort: $1,997 (or three monthly payments of $697).

Apply: ${APPLY_URL}

If you've been reading every email and waiting for me to build the thing — this is it.
If you've been hoping I'd never make you choose — this is the choice.

Joel Polley, RN
BraveWorks

P.S. Pills manage output. Protocol fixes input. Sunday at 11:59 PM ET is the door. After that, same protocol, same daily emails — at three and a half times the price.
`;
}

function html(firstName, unsubUrl) {
  const hi = firstName ? `${escapeHtml(firstName)},` : 'Friend,';
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,serif;color:#2C2A26;line-height:1.7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
      <tr><td style="padding:36px 30px 8px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;margin-bottom:18px;">
          BraveWorks RN  ·  Founding cohort
        </div>
        <p style="font-family:Georgia,serif;font-size:18px;font-style:italic;color:#5B564C;margin:0 0 24px;">
          ${hi}
        </p>
        <p style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C2A26;line-height:1.35;margin:0 0 18px;">
          Picture August.
        </p>
        <p style="font-size:15.5px;margin:0 0 16px;">
          You wake up before the alarm because your body is rested for the first time in years. The bottle drawer has three bottles in it, not eighteen. The afternoon pain you used to brace for hasn't shown up in sixty days. You finally have a primary care doctor — a real one — who looked at your labs and said <em>whatever you're doing, keep doing it</em>. Your spouse watches you laugh on a Tuesday at 2 PM because you have energy left.
        </p>
        <p style="font-size:15.5px;margin:0 0 24px;color:#3F5A3C;font-weight:600;">
          That's the destination.
        </p>

        <hr style="border:none;border-top:1px solid #E6DECE;margin:24px 0;" />

        <p style="font-size:15px;margin:0 0 16px;">
          This week I opened applications for the <strong>90-Day BP Triangle Freedom Sprint</strong> — the first cohort of a coaching program I built for adults whose health gave up on them before they gave up on themselves.
        </p>
        <p style="font-size:15px;margin:0 0 16px;">
          Two RNs walking with you for 90 days. Weekly 1:1 with me on Mondays. Biweekly hormone work with Annie. WhatsApp access Sunday through Thursday. Supplement audit in week 1 — most members save <strong>$200–400 a month</strong> starting week 2. Lab pull at week 6. Doctor-cleared handoff at week 12.
        </p>
        <p style="font-size:15px;margin:0 0 16px;">
          <strong>Five slots.</strong> Founding-cohort price. The first slot is already filled — a woman who told me on her intake she came home from the hospital worse than she went in. If you've ever known that feeling, this is built for you.
        </p>

        <p style="font-size:15px;margin:0 0 16px;">
          I'm not going to sell you the program. I'm going to sell you the version of yourself that exists 90 days from now — and tell you the door to her <strong style="color:#B85A36;">closes Sunday at 11:59 PM Eastern</strong>.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;border:2px solid #B85A36;border-radius:10px;margin:18px 0 22px;">
          <tr><td style="padding:18px;text-align:center;">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:6px;">Founding cohort — closes Sunday</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#9C9485;text-decoration:line-through;">$6,997 after Sunday</div>
            <div style="font-family:Georgia,serif;font-size:32px;font-weight:800;color:#2C2A26;line-height:1.1;margin-top:2px;">$1,997</div>
            <div style="font-size:13px;color:#5B564C;margin-top:4px;">or three monthly payments of $697</div>
          </td></tr>
        </table>

        <p style="margin:0 0 28px;text-align:center;">
          <a href="${APPLY_URL}" style="display:inline-block;padding:16px 32px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
            Apply for the founding cohort →
          </a>
        </p>

        <p style="font-size:14px;color:#5B564C;margin:0 0 12px;line-height:1.65;">
          If you've been reading every email and waiting for me to build the thing — this is it.
        </p>
        <p style="font-size:14px;color:#5B564C;margin:0 0 28px;line-height:1.65;">
          If you've been hoping I'd never make you choose — this is the choice.
        </p>

        <p style="font-size:15.5px;margin:0 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">
          Joel Polley, RN
        </p>
        <p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">
          BraveWorks
        </p>

        <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />

        <p style="font-size:13px;color:#5B564C;line-height:1.7;margin:0 0 12px;font-style:italic;">
          <strong style="color:#2C2A26;font-style:normal;">P.S.</strong> Pills manage output. Protocol fixes input. Sunday at 11:59 PM ET is the door. After that, same protocol, same daily emails — at three and a half times the price.
        </p>
      </td></tr>
    </table>
    <p style="font-size:11px;color:#9C9485;margin:18px 0 0;font-family:-apple-system,sans-serif;">
      BraveWorks RN  ·  braveworksrn@gmail.com  ·  <a href="${SITE_URL}" style="color:#9C9485;">bpquiz.com</a>
    </p>
    <p style="font-size:10px;color:#B5AC9C;margin:8px 0 0;font-family:-apple-system,sans-serif;">
      <a href="${unsubUrl}" style="color:#B5AC9C;">Unsubscribe</a>
    </p>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Pull all drip:* records, filter to engaged
async function pullRecipients() {
  const keys = await kv.keys('drip:*');
  const recipients = [];
  let stats = { total: 0, unsub: 0, paused: 0, complete: 0, noEmail: 0 };
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

// Use existing /api/unsubscribe HMAC scheme.
// signUnsubToken is in api/unsubscribe.js — we reproduce it inline so this
// script doesn't import server-side modules.
import crypto from 'node:crypto';
function signUnsubToken(email) {
  const secret = process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';
  const ts = Date.now();
  const sig = crypto.createHmac('sha256', secret).update(`${email}.${ts}`).digest('hex').slice(0, 16);
  return Buffer.from(`${email}.${ts}.${sig}`).toString('base64url');
}
function unsubUrl(email) {
  return `${SITE_URL}/api/unsubscribe?token=${signUnsubToken(email)}`;
}

// MAIN
const { recipients, stats } = await pullRecipients();
const targets = LIMIT > 0 ? recipients.slice(0, LIMIT) : recipients;

console.log('━━━ BroadcastAudit ━━━');
console.log(`Total drip:* records: ${stats.total}`);
console.log(`  unsubscribed:       ${stats.unsub}`);
console.log(`  paused:             ${stats.paused}`);
console.log(`  complete:           ${stats.complete}`);
console.log(`  no email:           ${stats.noEmail}`);
console.log(`  ENGAGED (target):   ${recipients.length}`);
if (LIMIT) console.log(`  capped at:          ${targets.length} (--limit=${LIMIT})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

if (DRY_RUN) {
  console.log('— SUBJECT —');
  console.log(SUBJECT);
  console.log('');
  console.log('— FROM —');
  console.log(FROM);
  console.log('');
  console.log('— TEXT BODY PREVIEW (first recipient) —');
  console.log(text(targets[0]?.firstName || ''));
  console.log('');
  console.log(`DRY RUN — no emails sent. Pass --send to broadcast to ${targets.length} engaged subscribers.`);
  process.exit(0);
}

if (TEST_ONLY) {
  const testEmail = 'brave.works.marketing@gmail.com';
  console.log(`TEST ONLY — sending to ${testEmail}`);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM, to: testEmail, replyTo: REPLY,
    subject: SUBJECT,
    text: text('Joel'),
    html: html('Joel', unsubUrl(testEmail)),
    headers: {
      'List-Unsubscribe': `<${unsubUrl(testEmail)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) { console.error('✗', error); process.exit(1); }
  console.log(`✓ Sent test. id: ${data?.id || '(no id)'}`);
  process.exit(0);
}

// FULL SEND
console.log(`SENDING to ${targets.length} subscribers...`);
const resend = new Resend(process.env.RESEND_API_KEY);
let sent = 0, failed = 0;
const failures = [];

for (let i = 0; i < targets.length; i++) {
  const r = targets[i];
  try {
    const u = unsubUrl(r.email);
    const result = await resend.emails.send({
      from: FROM, to: r.email, replyTo: REPLY,
      subject: SUBJECT,
      text: text(r.firstName),
      html: html(r.firstName, u),
      headers: {
        'List-Unsubscribe': `<${u}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (result.error) {
      failed++;
      failures.push({ email: r.email, error: result.error.message || JSON.stringify(result.error) });
      console.error(`  ✗ ${r.email}: ${result.error.message}`);
    } else {
      sent++;
      if (sent % 50 === 0) console.log(`  ${sent}/${targets.length} sent...`);
    }
  } catch (err) {
    failed++;
    failures.push({ email: r.email, error: err.message });
    console.error(`  ✗ ${r.email}: ${err.message}`);
  }
  // Rate limit: ~9 emails/sec stays well below Resend's burst limit
  await new Promise((res) => setTimeout(res, 110));
}

console.log('');
console.log('━━━ DONE ━━━');
console.log(`Sent:    ${sent}`);
console.log(`Failed:  ${failed}`);
if (failures.length) {
  const path = 'C:/Users/jpoll/AppData/Local/Temp/cohort-broadcast-failures.json';
  fs.writeFileSync(path, JSON.stringify(failures, null, 2));
  console.log(`Failures logged: ${path}`);
}
