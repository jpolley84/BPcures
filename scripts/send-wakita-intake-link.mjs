// scripts/send-wakita-intake-link.mjs
//
// One-shot Resend send: emails Wakita the link to her pre-call intake
// at https://bpquiz.com/wakita ahead of the 2026-05-13 12:00 PM coaching
// call with Joel Polley, RN.
//
// USAGE:
//   node --env-file=.env.production scripts/send-wakita-intake-link.mjs \
//     --email=wakita@example.com --dry-run
//   node --env-file=.env.production scripts/send-wakita-intake-link.mjs \
//     --email=wakita@example.com --send
//
// Sends via the same Resend account + verified domain that drives the
// drip emails. From: Joel Polley, RN <joel@bpquiz.com>. ReplyTo:
// braveworksrn@gmail.com so her reply lands in Joel's main Gmail.

import { Resend } from 'resend';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const SEND = argv.includes('--send');
const TO_EMAIL = argv.find((a) => a.startsWith('--email='))?.split('=')[1];
const FIRST_NAME = argv.find((a) => a.startsWith('--first-name='))?.split('=')[1] || 'Wakita';

if (!DRY_RUN && !SEND) {
  console.error('Required flag: --dry-run or --send');
  process.exit(1);
}
if (!TO_EMAIL || !TO_EMAIL.includes('@')) {
  console.error('Required flag: --email=<her address>');
  process.exit(1);
}
if (SEND && !process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set — load .env.production');
  process.exit(1);
}

const INTAKE_URL = 'https://bpquiz.com/wakita';
const ZOOM_URL = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Quick intake before today at noon';

const TEXT = `Hi ${FIRST_NAME},

Got your files — all of them. The Orlando Health workup from December, the Mexico ultrasound, the Bio Life nano scan list, and the photo of the bottles. Spending tonight reading through everything so when we hop on Zoom today at 12:00 PM Central we're using the time on you instead of catching me up.

Before we talk, walk through this quick pre-call intake I put together for you. It's almost entirely tap-the-answer — about 10 minutes on your phone or laptop:

${INTAKE_URL}

It references your actual reports so you know I've read them. When you submit, you'll automatically get a clean PDF copy of everything for your own records.

Zoom link for today at 12:00 PM Central:
${ZOOM_URL}

Looking forward to it.

Joel Polley, RN
BraveWorks
`;

const HTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#2C2A26;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF7;border-radius:12px;border:1px solid #E6DECE;">
        <tr><td style="padding:32px 28px 8px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:600;margin-bottom:6px;">
            BraveWorks RN · Pre-call intake
          </div>
          <p style="font-size:17px;margin:18px 0 14px;">Hi ${FIRST_NAME},</p>
          <p style="font-size:15px;margin:0 0 14px;">
            Got your files — all of them. The Orlando Health workup from December, the Mexico ultrasound, the Bio Life nano scan list, and the photo of the bottles. Spending tonight reading through everything so when we hop on Zoom today at 12:00 PM Central we're using the time on <em>you</em> instead of catching me up.
          </p>
          <p style="font-size:15px;margin:0 0 18px;">
            Before we talk, walk through this quick pre-call intake I put together for you. It's almost entirely tap-the-answer — about <strong>10 minutes</strong> on your phone or laptop:
          </p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${INTAKE_URL}" style="display:inline-block;padding:14px 28px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
              Open your intake →
            </a>
          </p>
          <p style="font-size:14px;color:#5B564C;margin:0 0 18px;">
            (Or paste this URL: <a href="${INTAKE_URL}" style="color:#3F5A3C;">${INTAKE_URL}</a>)
          </p>
          <p style="font-size:15px;margin:0 0 14px;">
            It references your actual reports so you know I've read them. When you submit, you'll automatically get a clean PDF copy of everything for your own records.
          </p>
          <div style="background:#E6EBE0;border-left:3px solid #3F5A3C;padding:14px 16px;border-radius:6px;margin:16px 0 18px;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:600;margin-bottom:4px;">Zoom — today at 12:00 PM Central</div>
            <a href="${ZOOM_URL}" style="font-size:13px;color:#3F5A3C;word-break:break-all;text-decoration:none;">${ZOOM_URL}</a>
          </div>
          <p style="font-size:15px;margin:0 0 6px;">Looking forward to it.</p>
          <p style="font-size:15px;margin:0 0 2px;font-weight:600;">Joel Polley, RN</p>
          <p style="font-size:13px;margin:0 0 24px;color:#5B564C;font-style:italic;">BraveWorks</p>
        </td></tr>
      </table>
      <p style="font-size:11px;color:#9C9485;margin:14px 0 0;">
        BraveWorks RN · braveworksrn@gmail.com · bpquiz.com
      </p>
    </td></tr>
  </table>
</body></html>`;

console.log(`→ TO: ${TO_EMAIL}`);
console.log(`→ FROM: ${FROM}`);
console.log(`→ SUBJECT: ${SUBJECT}`);
console.log(`→ INTAKE URL: ${INTAKE_URL}`);
console.log(`→ MODE: ${DRY_RUN ? 'DRY RUN (no send)' : 'SEND'}`);
console.log('');

if (DRY_RUN) {
  console.log('— TEXT BODY —');
  console.log(TEXT);
  console.log('--- (HTML body suppressed in dry run; pass --send to actually send) ---');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
try {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO_EMAIL,
    replyTo: REPLY_TO,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
  });
  if (error) {
    console.error('✗ Resend error:', error);
    process.exit(1);
  }
  console.log(`✓ Sent. Resend message id: ${data?.id || '(no id returned)'}`);
} catch (err) {
  console.error('✗ Threw:', err.message);
  process.exit(1);
}
