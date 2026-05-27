// One-shot: send the private Zoom invite to all 278 paid customers
// ($12+ in last 90 days, deduped by email) for tonight's 10 PM EST room.
//
// Approved in chat 2026-05-25.
// Source list: tmp/paid-12plus.json (pulled via Stripe charges API).
// Zoom URL: https://us06web.zoom.us/j/85623218549?pwd=...
//
// Safety:
//   - One Resend send per recipient (no BCC exposure)
//   - Per-email KV flag `private-zoom-2026-05-25-sent:<email>` (7-day TTL)
//     prevents duplicate send if this script is re-run
//   - 200ms delay between sends to stay well under Resend's rate limit
//   - First-name personalization from drip:<email> if available

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import fs from 'fs';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Tonight 10 PM EST — your private Zoom room is open';
const ZOOM_URL = 'https://us06web.zoom.us/j/85623218549?pwd=MZ4U1hQ6E0xB72Btd67hPllOjpC3ex.1';
const ZOOM_ID = '856 2321 8549';
const FLAG_PREFIX = 'private-zoom-2026-05-25-sent:';

function renderHtml(firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi friend,';
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">Joel Polley, RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">BraveWorks RN</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">
          ${greeting}
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You bought in. That puts you in a different room than the rest of the internet &mdash; and tonight I&#8217;m opening that room.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          <strong>Tonight at 10 PM Eastern</strong>, I&#8217;m hosting a private Zoom for everyone who&#8217;s invested in their own health with me. The public live on TikTok and Facebook runs at the same time, but this Zoom is yours. Smaller. More direct. No algorithm in the way.
        </p>
      </td></tr>

      <tr><td style="padding:8px 28px 0;">
        <div style="background:#2E3A30;border-radius:14px;padding:28px 24px;text-align:center;margin:0 0 22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:14px;">
            🔒 Private Zoom &middot; Paid customers only
          </div>
          <div style="font-size:15px;color:#FBF8F1;margin-bottom:6px;">
            <strong>Tonight &mdash; Monday, May 25</strong>
          </div>
          <div style="font-size:14px;color:#A8AC9F;margin-bottom:18px;">
            10:00 PM Eastern &middot; 9:00 PM Central &middot; 7:00 PM Pacific
          </div>
          <a href="${ZOOM_URL}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
            Join the Zoom room &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:14px;">
            Meeting ID: ${ZOOM_ID}
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">What this room is for</h2>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Real questions about your protocol.</strong> Whatever&#8217;s working, whatever&#8217;s stuck, whatever you&#8217;ve been afraid to ask in the comments.</li>
          <li><strong>The hot seat.</strong> If you want me to look at YOUR numbers, your meds, your situation &mdash; raise your hand. I&#8217;ll work through as many as we have time for.</li>
          <li><strong>The conversation between the videos.</strong> What I can&#8217;t fit in 60-second TikToks. The middle layer most people never get.</li>
        </ul>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">What to bring</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          Open the room with whatever&#8217;s in front of you. Doesn&#8217;t have to be perfect.
        </p>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li>Your home BP log (even a week of readings)</li>
          <li>Your current med list</li>
          <li>Two questions written down before we start</li>
          <li>A glass of water with a pinch of salt &mdash; we&#8217;ll be working</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          If you can&#8217;t make it live, no worries &mdash; there&#8217;s no replay this time. Just the people in the room.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Come on early if you want to chat. Door opens 9:55 PM EST.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:18px 0 14px;">
          See you tonight.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">
          Joel Polley, RN &middot; BraveWorks RN
        </p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0;">
            <strong style="color:#2C3E50;">P.S.</strong> This is the room I&#8217;m building the deeper community around. If you&#8217;ve been on the fence about coaching, sit in tonight &mdash; you&#8217;ll see what the work feels like from the inside before any conversation happens.
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderText(firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi friend,';
  return `${greeting}

You bought in. That puts you in a different room than the rest of the internet — and tonight I'm opening that room.

Tonight at 10 PM Eastern, I'm hosting a private Zoom for everyone who's invested in their own health with me. The public live on TikTok and Facebook runs at the same time, but this Zoom is yours. Smaller. More direct. No algorithm in the way.

🔒 PRIVATE ZOOM — PAID CUSTOMERS ONLY

Tonight — Monday, May 25
10:00 PM Eastern · 9:00 PM Central · 7:00 PM Pacific

Join: ${ZOOM_URL}
Meeting ID: ${ZOOM_ID}

WHAT THIS ROOM IS FOR

- Real questions about your protocol. Whatever's working, whatever's stuck, whatever you've been afraid to ask in the comments.
- The hot seat. If you want me to look at YOUR numbers, your meds, your situation — raise your hand. I'll work through as many as we have time for.
- The conversation between the videos. What I can't fit in 60-second TikToks. The middle layer most people never get.

WHAT TO BRING

Open the room with whatever's in front of you. Doesn't have to be perfect.

- Your home BP log (even a week of readings)
- Your current med list
- Two questions written down before we start
- A glass of water with a pinch of salt — we'll be working

If you can't make it live, no worries — there's no replay this time. Just the people in the room.

Come on early if you want to chat. Door opens 9:55 PM EST.

See you tonight.

— Joel
Joel Polley, RN · BraveWorks RN

P.S. This is the room I'm building the deeper community around. If you've been on the fence about coaching, sit in tonight — you'll see what the work feels like from the inside before any conversation happens.`;
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY missing'); process.exit(1); }
const resend = new Resend(apiKey);

const recipients = JSON.parse(fs.readFileSync('tmp/paid-12plus.json', 'utf8'));
console.log(`Loaded ${recipients.length} recipients from tmp/paid-12plus.json`);

let sent = 0;
let skipped = 0;
let failed = 0;
const failures = [];

for (const r of recipients) {
  const email = r.email.toLowerCase().trim();
  if (!email || !email.includes('@')) { skipped++; continue; }

  // Dedupe — skip if already sent
  try {
    const flag = await kv.get(FLAG_PREFIX + email);
    if (flag) { skipped++; continue; }
  } catch { /* if KV check fails, attempt send anyway */ }

  // First name from drip record if we have one
  let firstName = '';
  try {
    const drip = await kv.get(`drip:${email}`);
    if (drip?.firstName) firstName = String(drip.firstName).split(/\s+/)[0];
  } catch { /* fallback to no name */ }
  // Also try from the Stripe billing name
  if (!firstName && r.name) firstName = String(r.name).split(/\s+/)[0];

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email],
      replyTo: REPLY_TO,
      subject: SUBJECT,
      html: renderHtml(firstName),
      text: renderText(firstName),
    });
    if (error) {
      failed++;
      failures.push({ email, error: error.message || String(error) });
      console.error(`  ✗ ${email} — ${error.message || error}`);
      continue;
    }
    sent++;
    try { await kv.set(FLAG_PREFIX + email, { sentAt: new Date().toISOString(), resendId: data.id }, { ex: 7 * 86400 }); } catch {}
    if (sent % 25 === 0) console.log(`  ... ${sent} sent`);
  } catch (err) {
    failed++;
    failures.push({ email, error: err.message });
    console.error(`  ✗ ${email} — ${err.message}`);
  }

  // 200ms delay = 5/sec, well under Resend's rate limit
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n✓ Sent: ${sent}`);
console.log(`⊘ Skipped (already sent or invalid): ${skipped}`);
console.log(`✗ Failed: ${failed}`);
if (failures.length) {
  fs.writeFileSync('tmp/private-zoom-failures.json', JSON.stringify(failures, null, 2));
  console.log(`  → failures written to tmp/private-zoom-failures.json`);
}
