// scripts/send-wakita-week1-intake-link.mjs
//
// One-shot Resend send: emails Wakita the Week-1 deep-dive intake link
// ahead of today's (2026-05-17) Sunday coaching call with Joel Polley, RN.
//
// USAGE:
//   node --env-file=.env.production scripts/send-wakita-week1-intake-link.mjs --dry-run
//   node --env-file=.env.production scripts/send-wakita-week1-intake-link.mjs --send
//
// Uses the bpquiz.com/wakita fallback path (NOT wakita.bpquiz.com) because
// the subdomain alias picked up Vercel SSO protection during the 2026-05-17
// re-alias. The path-based URL serves the same page without an auth wall.
// The ?token=... query string is required — without it, /api/wakita-intake
// rejects her submission with 401.

import { Resend } from 'resend';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const SEND = argv.includes('--send');

if (!DRY_RUN && !SEND) {
  console.error('Required flag: --dry-run or --send');
  process.exit(1);
}
if (SEND && !process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set — load .env.production');
  process.exit(1);
}
if (SEND && !process.env.WAKITA_INTAKE_SECRET) {
  console.error('WAKITA_INTAKE_SECRET not set — load .env.local');
  process.exit(1);
}

const TO_EMAIL = 'wconssandra@gmail.com';
const FIRST_NAME = 'Wakita';
const TOKEN = process.env.WAKITA_INTAKE_SECRET || 'MISSING';
const INTAKE_URL = `https://bpquiz.com/wakita?token=${TOKEN}`;
const ZOOM_URL = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Quick deep-dive intake before today\'s call';

const TEXT = `Hi ${FIRST_NAME},

Quick one before we hop on today.

Last Tuesday we anchored the big picture. This week I want to go deeper on the four things I couldn't fully reach in 60 minutes the first time — what you actually eat every day, which foods are most likely behind your GI pain, your hormone picture, and how open you are to fasting + detox techniques.

Walk through this Week-1 deep-dive before we meet. Almost entirely tap-the-answer — about 10–12 minutes on your phone:

${INTAKE_URL}

It's confidential. Your answers come straight to me — not shared with anyone, not even Annie.

Zoom for today's call:
${ZOOM_URL}

Be honest in every answer. The more honest, the better the protocol I can build for you.

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
            BraveWorks RN · Week 1 deep-dive
          </div>
          <p style="font-size:17px;margin:18px 0 14px;">Hi ${FIRST_NAME},</p>
          <p style="font-size:15px;margin:0 0 14px;">
            Quick one before we hop on today.
          </p>
          <p style="font-size:15px;margin:0 0 14px;">
            Last Tuesday we anchored the big picture. This week I want to go deeper on the four things I couldn't fully reach in 60 minutes the first time — <strong>what you actually eat every day</strong>, <strong>which foods are most likely behind your GI pain</strong>, <strong>your hormone picture</strong>, and <strong>how open you are to fasting + detox techniques</strong>.
          </p>
          <p style="font-size:15px;margin:0 0 18px;">
            Walk through this Week-1 deep-dive before we meet. Almost entirely tap-the-answer — about <strong>10–12 minutes</strong> on your phone:
          </p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${INTAKE_URL}" style="display:inline-block;padding:14px 28px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
              Open your deep-dive intake →
            </a>
          </p>
          <p style="font-size:13px;color:#9C9485;margin:0 0 18px;text-align:center;font-style:italic;">
            (Or copy this URL into your browser — make sure to keep the whole thing including the part after ?token)
          </p>
          <p style="font-size:15px;margin:0 0 14px;">
            It's <strong>confidential</strong> — your answers come straight to me. Not shared with anyone, not even Annie. When you submit, you'll get a clean PDF copy for your own records.
          </p>
          <div style="background:#E6EBE0;border-left:3px solid #3F5A3C;padding:14px 16px;border-radius:6px;margin:18px 0;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:600;margin-bottom:4px;">Zoom — today's call</div>
            <a href="${ZOOM_URL}" style="font-size:13px;color:#3F5A3C;word-break:break-all;text-decoration:none;">${ZOOM_URL}</a>
          </div>
          <p style="font-size:15px;margin:18px 0 6px;">Be honest in every answer. The more honest, the better the protocol I can build for you.</p>
          <p style="font-size:15px;margin:18px 0 2px;font-weight:600;">Joel Polley, RN</p>
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
