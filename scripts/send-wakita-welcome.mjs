// scripts/send-wakita-welcome.mjs
//
// One-shot Resend send: welcomes Wakita to the 90-Day BP Triangle
// Freedom Sprint, attaches the tailored offer PDF, confirms the Sunday
// 12pm ET intake call + recurring Monday 8pm ET weekly 1:1, and gives
// her the Zoom link.
//
// USAGE:
//   node --env-file=.env.production scripts/send-wakita-welcome.mjs --send

import { Resend } from 'resend';
import fs from 'node:fs';

const SEND = process.argv.includes('--send');
const DRY = process.argv.includes('--dry-run');
if (!SEND && !DRY) {
  console.error('Pass --send or --dry-run');
  process.exit(1);
}
if (SEND && !process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY missing — load .env.production');
  process.exit(1);
}

const PDF_PATH = 'C:/Users/jpoll/AppData/Local/Temp/wakita-offer.pdf';
const TO = 'wconssandra@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY = 'braveworksrn@gmail.com';
const ZOOM = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';
const SUBJECT = 'You\'re in, Wakita — your program docs + schedule inside';

const TEXT = `Wakita,

You said yes to a 90-day reset. I said yes to walking it with you. Here's everything you need to start.

YOUR PROGRAM DOCUMENT
The tailored offer PDF is attached. Print it, save it, share it with your husband — it's the map of everything that's now yours.

TWO CALLS ALREADY ON THE BOOKS

1. OFFICIAL INTAKE — Sunday, May 17 — 12:00 PM ET (60 min)
   This is where we lay the foundation. I'll walk you through your full chart, the protocol map for the next 90 days, and exactly what we're doing in weeks 1 and 2 (PPI wean planning and supplement consolidation).

2. WEEKLY 1:1 — Mondays at 8:00 PM ET (recurring, 12 weeks)
   First one is Monday, May 18. Same Zoom link as the intake. Right before the live VIP group call, so you go straight from private session into community.

Calendar invites for both are coming separately — accept them and they'll land on your phone.

ZOOM (same link for both calls)
${ZOOM}

WHATSAPP OFFICE HOURS
Sunday through Thursday, 9 AM to 5 PM ET. I'll share my WhatsApp number on the intake call Sunday — once it's in, text me directly. I respond inside office hours, usually within the hour.

DAILY EMAILS START THIS WEEK
Tailored to your protocol. Reminders, encouragement, the next small move, and the why behind it. Watch your inbox.

THREE THINGS YOU CAN DO BEFORE SUNDAY
1. Take a baseline blood pressure today and write the number + time down. Do it again Saturday morning. We'll talk about both on the call.
2. Pull every supplement bottle out of the drawer and onto the counter. Photo it. Bring it to Sunday — we're going through them together.
3. Sleep on it. Literally. Your sleep score on the intake was below 5 hours. The single biggest move in week 1 is getting you to 6.

See you Sunday at noon Eastern.

Joel Polley, RN
BraveWorks
`;

const HTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#2C2A26;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF7;border-radius:12px;border:1px solid #E6DECE;">
      <tr><td style="padding:32px 28px 8px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:600;margin-bottom:6px;">
          BraveWorks RN · You're in
        </div>
        <h1 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:14px 0 18px;color:#2C2A26;">
          Welcome to the Sprint, Wakita.
        </h1>
        <p style="font-size:15px;margin:0 0 14px;">
          You said yes to a 90-day reset. I said yes to walking it with you. Here's everything you need to start.
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;margin:26px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          Your program document
        </h2>
        <p style="font-size:14px;margin:0 0 10px;">
          The tailored offer PDF is <strong>attached to this email</strong>. Print it, save it, share it with your husband — it's the map of everything that's now yours.
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;margin:26px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          Two calls already on the books
        </h2>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6EBE0;border:1px solid #3F5A3C;border-radius:8px;margin:8px 0 14px;">
          <tr><td style="padding:14px 16px;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:600;margin-bottom:4px;">Official intake</div>
            <div style="font-size:15px;font-weight:700;color:#2C2A26;margin-bottom:4px;">Sunday, May 17 — 12:00 PM Eastern</div>
            <div style="font-size:13px;color:#5B564C;">60 minutes. Full chart walkthrough, 90-day protocol map, and your weeks 1-2 plan (PPI wean + supplement consolidation).</div>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6EBE0;border:1px solid #3F5A3C;border-radius:8px;margin:8px 0 14px;">
          <tr><td style="padding:14px 16px;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:600;margin-bottom:4px;">Weekly 1:1 (recurring, 12 weeks)</div>
            <div style="font-size:15px;font-weight:700;color:#2C2A26;margin-bottom:4px;">Mondays at 8:00 PM Eastern</div>
            <div style="font-size:13px;color:#5B564C;">First one Monday, May 18. Right before the live VIP group call — you go straight from private session into community.</div>
          </td></tr>
        </table>

        <p style="font-size:13px;color:#5B564C;margin:0 0 14px;font-style:italic;">
          Google Calendar invites for both are coming separately — accept them and they'll land on your phone.
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;margin:26px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          Zoom (same link for both calls)
        </h2>
        <p style="margin:8px 0 16px;text-align:center;">
          <a href="${ZOOM}" style="display:inline-block;padding:12px 24px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
            Open Zoom →
          </a>
        </p>
        <p style="font-size:12px;color:#9C9485;margin:0 0 18px;word-break:break-all;">
          ${ZOOM}
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;margin:26px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          WhatsApp office hours
        </h2>
        <p style="font-size:14px;margin:0 0 14px;">
          Sunday through Thursday, 9 AM to 5 PM ET. I'll share my WhatsApp number on the intake call Sunday. Once it's in, text me directly — I respond inside office hours, usually within the hour.
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;margin:26px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          Daily emails start this week
        </h2>
        <p style="font-size:14px;margin:0 0 14px;">
          Tailored to your protocol. Reminders, encouragement, the next small move, and the why behind it. Watch your inbox.
        </p>

        <h2 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;margin:26px 0 8px;border-bottom:1px solid #F5E4DA;padding-bottom:6px;">
          Three things you can do before Sunday
        </h2>
        <ol style="font-size:14px;margin:0 0 16px;padding-left:22px;line-height:1.65;">
          <li style="margin-bottom:10px;"><strong>Take a baseline blood pressure today and write the number + time down.</strong> Do it again Saturday morning. We'll talk about both on the call.</li>
          <li style="margin-bottom:10px;"><strong>Pull every supplement bottle out of the drawer and onto the counter. Photo it.</strong> Bring it to Sunday — we're going through them together.</li>
          <li style="margin-bottom:10px;"><strong>Sleep on it. Literally.</strong> Your sleep score on the intake was below 5 hours. The single biggest move in week 1 is getting you to 6.</li>
        </ol>

        <p style="font-size:15px;margin:24px 0 8px;">
          See you Sunday at noon Eastern.
        </p>
        <p style="font-size:15px;margin:0 0 4px;font-weight:600;">Joel Polley, RN</p>
        <p style="font-size:13px;color:#5B564C;margin:0 0 24px;font-style:italic;">BraveWorks</p>
      </td></tr>
    </table>
    <p style="font-size:11px;color:#9C9485;margin:14px 0 0;">
      BraveWorks RN  ·  braveworksrn@gmail.com  ·  bpquiz.com
    </p>
  </td></tr>
</table>
</body></html>`;

const pdfBuffer = fs.readFileSync(PDF_PATH);
console.log(`→ TO: ${TO}`);
console.log(`→ SUBJECT: ${SUBJECT}`);
console.log(`→ ATTACHMENT: ${PDF_PATH} (${pdfBuffer.length.toLocaleString()} bytes)`);
console.log(`→ MODE: ${SEND ? 'SEND' : 'DRY RUN'}`);
console.log('');

if (DRY) {
  console.log('— TEXT BODY —');
  console.log(TEXT);
  console.log('--- (HTML body suppressed; pass --send to actually send) ---');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: FROM,
  to: TO,
  replyTo: REPLY,
  subject: SUBJECT,
  text: TEXT,
  html: HTML,
  attachments: [{
    filename: 'Wakita-90-Day-Sprint-Offer.pdf',
    content: pdfBuffer.toString('base64'),
  }],
});
if (error) {
  console.error('✗ Resend error:', error);
  process.exit(1);
}
console.log(`✓ Sent. Message id: ${data?.id || '(no id)'}`);
