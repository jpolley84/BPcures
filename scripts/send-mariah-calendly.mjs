// One-shot: send Rev. Mariah Brown the Calendly link in response to her
// /1on1 application submitted 2026-05-20 19:04 UTC.
// Reviewed in chat 2026-05-20.

import { Resend } from 'resend';

const TO = 'maribro3@aol.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = "Mariah — got your application, let's pick a time";
const CALENDLY = 'https://calendly.com/braveworksrn/60min';

const html = `<!doctype html>
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
          Hi Mariah,
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Thank you for reaching out. I read everything you wrote this afternoon, and I want to talk with you.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          What you described &mdash; the high blood pressure, the diabetes, the back and leg pain, kidneys spilling protein, the move from cane to walker &mdash; that&#8217;s a lot for one body to carry. I&#8217;m not going to promise you anything I can&#8217;t deliver. But I want an hour with you on Zoom to sit with your situation, look at what you&#8217;ve already tried, and walk through your real options together.
        </p>
        <p style="font-size:16px;line-height:1.6;color:#2C3E50;margin:0 0 20px;font-weight:600;">
          There&#8217;s no charge for this first conversation.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 4px;">
        <div style="background:#2E3A30;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:12px;">Pick a time that works for you</div>
          <a href="${CALENDLY}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
            Schedule our call &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:14px;line-height:1.5;word-break:break-all;">
            ${CALENDLY}
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 24px;">
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          If nothing on the calendar works for you, just reply to this email and we&#8217;ll find something that does.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">
          Joel Polley, RN &middot; BraveWorks RN
        </p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0;">
            <strong style="color:#2C3E50;">P.S.</strong> If you have your most recent labs handy &mdash; A1c, kidney function (creatinine / eGFR / urine protein), and your full prescription list &mdash; bring them to the call. If you don&#8217;t have them yet, we&#8217;ll work with whatever you&#8217;ve got. Doesn&#8217;t matter.
          </p>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 28px;"></td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Mariah,

Thank you for reaching out. I read everything you wrote this afternoon, and I want to talk with you.

What you described — the high blood pressure, the diabetes, the back and leg pain, kidneys spilling protein, the move from cane to walker — that's a lot for one body to carry. I'm not going to promise you anything I can't deliver. But I want an hour with you on Zoom to sit with your situation, look at what you've already tried, and walk through your real options together.

There's no charge for this first conversation.

Pick a time that works for you here:

${CALENDLY}

If nothing on the calendar works for you, just reply to this email and we'll find something that does.

— Joel
Joel Polley, RN · BraveWorks RN

P.S. If you have your most recent labs handy — A1c, kidney function (creatinine / eGFR / urine protein), and your full prescription list — bring them to the call. If you don't have them yet, we'll work with whatever you've got. Doesn't matter.`;

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from: FROM,
  to: [TO],
  replyTo: REPLY_TO,
  subject: SUBJECT,
  html,
  text,
});

if (error) {
  console.error('✗ Send failed:', error);
  process.exit(1);
}

console.log(`✓ Sent to ${TO} → Resend ID: ${data.id}`);
