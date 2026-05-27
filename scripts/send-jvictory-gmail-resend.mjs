// One-shot: resend kit downloads to jvictory7@gmail.com.
// She paid via Amazon Pay 2026-05-17 ($17 Kit, ch_3TY8nRHseZnO3rRZ0Yj9uL4x).
// Her Amazon Pay billing email is tjvictory@msn.com — that's where all her
// drips have been going (and where she's not seeing them). She messaged
// Joel from jvictory7@gmail.com saying she still hasn't gotten anything.
// This sends the library + Zoom invite to her actual Gmail, AND creates
// a mirror KV drip record at drip:jvictory7@gmail.com so future broadcasts
// reach her real inbox.
// Reviewed in chat 2026-05-26.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const TO = 'jvictory7@gmail.com';
const MSN_EMAIL = 'tjvictory@msn.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Your BP Reset Kit — all downloads inside';
const LIBRARY = 'https://bpquiz.com/library';

const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">Joel Polley, RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">BraveWorks RN</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Got your message. Sorry about the confusion &mdash; let me get you sorted right now.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You paid via <strong>Amazon Pay on May 17th</strong> ($17 Kit). The issue: Amazon Pay uses the email on file with your Amazon account &mdash; in your case <strong>${MSN_EMAIL}</strong> &mdash; which is where every welcome email and download link has been going. That MSN inbox is the reason nothing showed up here.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Going forward I&#8217;m sending everything to <strong>this Gmail address</strong> instead. Here&#8217;s your kit, fresh:
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <div style="background:#2E3A30;border-radius:14px;padding:24px;text-align:center;margin:0 0 22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:12px;">All your downloads, one click</div>
          <a href="${LIBRARY}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">Open your library &rarr;</a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:14px;">bpquiz.com/library</div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 12px;">Click any title and the PDF lands on your phone or computer. Here&#8217;s the order I&#8217;d suggest:</p>
        <ol style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Master Blood Pressure Document</strong> &mdash; the full protocol. Start here.</li>
          <li><strong>Top 10 Herbs Deep Dive</strong> &mdash; each herb matched to the drug it mimics</li>
          <li><strong>10-Day BP Reset Protocol</strong> &mdash; daily checklists, follow it like a recipe</li>
          <li><strong>Cook For Life Cookbook</strong> &mdash; meals built around the herbs</li>
          <li><strong>Overmedicated Boomers Book</strong> (your bonus) &mdash; read it on the plane or before bed</li>
        </ol>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:14px 0 14px;">
          If anything feels stuck &mdash; a PDF that won&#8217;t open, a protocol question, anything &mdash; reply right here and I&#8217;ll personally walk you through it.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">Praying for you on this one.</p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0;">Joel Polley, RN &middot; BraveWorks RN</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi,

Got your message. Sorry about the confusion — let me get you sorted right now.

You paid via Amazon Pay on May 17th ($17 Kit). The issue: Amazon Pay uses the email on file with your Amazon account — in your case ${MSN_EMAIL} — which is where every welcome email and download link has been going. That MSN inbox is the reason nothing showed up here.

Going forward I'm sending everything to this Gmail address instead. Here's your kit, fresh:

👉 ${LIBRARY}

Click any title and the PDF lands on your phone or computer. Here's the order I'd suggest:

1. Master Blood Pressure Document — the full protocol. Start here.
2. Top 10 Herbs Deep Dive — each herb matched to the drug it mimics
3. 10-Day BP Reset Protocol — daily checklists, follow it like a recipe
4. Cook For Life Cookbook — meals built around the herbs
5. Overmedicated Boomers Book (your bonus) — read it on the plane or before bed

If anything feels stuck — a PDF that won't open, a protocol question, anything — reply right here and I'll personally walk you through it.

Praying for you on this one.

— Joel
Joel Polley, RN · BraveWorks RN`;

// ─── 1. Send email ─────────────────────────────────────────────────
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY missing'); process.exit(1); }
const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: FROM, to: [TO], replyTo: REPLY_TO, subject: SUBJECT, html, text,
});
if (error) { console.error('✗ Email failed:', error); process.exit(1); }
console.log(`✓ Email sent → Resend ID: ${data.id}`);

// ─── 2. Mirror her paid status to drip:jvictory7@gmail.com so future
//      paid-customer broadcasts reach the gmail address she actually reads
try {
  const msnDrip = await kv.get(`drip:${MSN_EMAIL}`);
  if (msnDrip) {
    const gmailDrip = {
      ...msnDrip,
      email: TO,
      mirrorOf: MSN_EMAIL,
      mirroredAt: new Date().toISOString(),
      mirrorReason: 'amazon-pay-msn-undeliverable; customer reads gmail',
      tags: Array.from(new Set([...(msnDrip.tags || []), 'amazon-pay-mirror'])),
    };
    await kv.set(`drip:${TO}`, gmailDrip);
    console.log(`✓ KV mirror created: drip:${TO} (mirrored from drip:${MSN_EMAIL})`);
  } else {
    console.warn('No MSN drip found to mirror from');
  }
} catch (err) {
  console.error('✗ KV mirror failed:', err.message);
}

console.log('\nDone.');
