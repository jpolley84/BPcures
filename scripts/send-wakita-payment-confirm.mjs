// scripts/send-wakita-payment-confirm.mjs
//
// One-shot: BraveWorks-branded payment confirmation to Wakita. Sent
// AFTER the Stripe records were corrected (charge email was originally
// joel@enlightenedinformatics.com — see Stripe pi_3TWgimHseZnO3rRZ1F4fY3W8
// metadata for the audit trail).
//
// USAGE: node --env-file=.env.production scripts/send-wakita-payment-confirm.mjs --send

import { Resend } from 'resend';

const SEND = process.argv.includes('--send');
if (!SEND) { console.error('Need --send'); process.exit(1); }

const ZOOM = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';
const STRIPE_RECEIPT = 'https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFURTlpRUhzZVpuTzNyUloos6WT0AYyBoEG0zWFOTosFiqGSE1Ncjrw-mvY-5soKMCCdQB-Ah08s08ka8n3o--Jo_kFRARLrEmaklU';

const SUBJECT = 'Payment confirmed — see you Sunday at noon';

const TEXT = `Wakita,

Just a quick note from me directly — your $1,997 founding-cohort enrollment is confirmed in our books. Stripe is sending a clean receipt to this email; my admin entered the wrong email on the original transaction and I corrected it on my end.

Stripe receipt (for your records):
${STRIPE_RECEIPT}

Nothing on your end changes. Everything we set up earlier this week is still on the books:

• Sunday, May 17 at 12:00 PM ET — official intake call (60 min)
• Mondays at 8:00 PM ET — your weekly 1:1, starting May 18 (12 sessions)
• WhatsApp office hours go live after Sunday's call
• Daily tailored emails start this week
• Your tailored offer PDF + welcome email are already in your inbox

Zoom (same link for both calls):
${ZOOM}

Before Sunday:
1. Baseline BP today + Saturday morning — write numbers + times down
2. Photo your supplement drawer — all of it on the counter
3. Send me anything new you remember from the Mexico clinic visit

See you Sunday at noon Eastern.

Joel Polley, RN
BraveWorks
`;

const HTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#2C2A26;line-height:1.65;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF7;border-radius:12px;border:1px solid #E6DECE;">
      <tr><td style="padding:32px 28px 8px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin-bottom:6px;">
          ✓ Payment confirmed
        </div>
        <h1 style="font-family:Georgia,serif;font-size:22px;line-height:1.3;margin:14px 0 18px;color:#2C2A26;">
          Welcome to the founding cohort, Wakita.
        </h1>
        <p style="font-size:15px;margin:0 0 14px;">
          Quick note from me directly — your <strong>$1,997 founding-cohort enrollment is confirmed</strong> in our books.
        </p>
        <p style="font-size:14px;color:#5B564C;margin:0 0 18px;font-style:italic;line-height:1.6;">
          Stripe is sending a clean receipt to this email; my admin entered the wrong email on the original transaction and I corrected it on my end. Nothing on your end changes.
        </p>
        <p style="margin:8px 0 22px;text-align:center;">
          <a href="${STRIPE_RECEIPT}" style="display:inline-block;padding:11px 22px;background:#FFFDF7;color:#3F5A3C;text-decoration:none;border:1.5px solid #3F5A3C;border-radius:8px;font-size:13px;font-weight:600;">
            View your Stripe receipt →
          </a>
        </p>

        <h2 style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;margin:24px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">
          What's already on the books
        </h2>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6EBE0;border:1px solid #3F5A3C;border-radius:8px;margin:8px 0 10px;">
          <tr><td style="padding:12px 14px;">
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:700;">Official intake — Sunday, May 17 · 12:00 PM ET</div>
            <div style="font-size:13px;color:#5B564C;margin-top:3px;">60 minutes. Full chart walkthrough + weeks 1-2 plan.</div>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6EBE0;border:1px solid #3F5A3C;border-radius:8px;margin:0 0 16px;">
          <tr><td style="padding:12px 14px;">
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#3F5A3C;font-weight:700;">Weekly 1:1 — Mondays at 8:00 PM ET (12 sessions)</div>
            <div style="font-size:13px;color:#5B564C;margin-top:3px;">First one Monday, May 18. Right before the live VIP group.</div>
          </td></tr>
        </table>

        <p style="margin:0 0 18px;text-align:center;">
          <a href="${ZOOM}" style="display:inline-block;padding:13px 26px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
            Open Zoom for Sunday →
          </a>
        </p>

        <h2 style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;margin:24px 0 8px;border-bottom:1px solid #F5E4DA;padding-bottom:6px;">
          Three things before Sunday
        </h2>
        <ol style="font-size:14px;margin:0 0 20px;padding-left:22px;line-height:1.65;">
          <li style="margin-bottom:8px;"><strong>Baseline BP today + Saturday morning.</strong> Write down numbers + times.</li>
          <li style="margin-bottom:8px;"><strong>Pull every supplement bottle onto the counter and photo it.</strong> We'll go through it on the call.</li>
          <li style="margin-bottom:8px;"><strong>Send me anything you remember from the Mexico clinic visit</strong> — what they said, what they recommended beyond the supplements.</li>
        </ol>

        <p style="font-size:15px;margin:20px 0 4px;">See you Sunday at noon Eastern.</p>
        <p style="font-size:15px;margin:0 0 2px;font-weight:600;">Joel Polley, RN</p>
        <p style="font-size:13px;margin:0 0 24px;color:#5B564C;font-style:italic;">BraveWorks</p>
      </td></tr>
    </table>
    <p style="font-size:11px;color:#9C9485;margin:14px 0 0;">BraveWorks RN  ·  braveworksrn@gmail.com  ·  bpquiz.com</p>
  </td></tr>
</table>
</body></html>`;

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: 'Joel Polley, RN <joel@bpquiz.com>',
  to: 'wconssandra@gmail.com',
  replyTo: 'braveworksrn@gmail.com',
  subject: SUBJECT,
  text: TEXT,
  html: HTML,
});
if (error) { console.error('✗', error); process.exit(1); }
console.log('✓ Sent. id:', data?.id);
