// One-shot: re-deliver kit + library link to Blessing.
// She paid $47 Reset Kit on 2026-05-20 (ch_3TZ0ujHseZnO3rRZ1ZspdBI0).
// KV claims Day 0/2/4 emails fired but she says she received nothing —
// likely Gmail Promotions tab. This is the surgical resend with the
// library link, tonight's private Zoom invite, and a deliverability ask.
// Reviewed in chat 2026-05-25.

import { Resend } from 'resend';

const TO = 'blessingwarmate@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Blessing — your BP Reset Kit, in one place';
const LIBRARY = 'https://bpquiz.com/library';
const ZOOM = 'https://us06web.zoom.us/j/85623218549?pwd=MZ4U1hQ6E0xB72Btd67hPllOjpC3ex.1';

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
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi Blessing,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Got your message. Let me make sure you have everything right now, in one click.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You&#8217;re confirmed as a paid customer &mdash; <strong>$47 Reset Kit, purchased 5/20.</strong> A handful of emails have gone to you since then with the protocols and the downloads, but it sounds like they landed somewhere you didn&#8217;t see them (Gmail&#8217;s Promotions tab is usually the culprit).
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Here&#8217;s the library &mdash; every PDF you paid for, in one place:
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

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Also &mdash; you scored high on the quiz</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I looked at your quiz answers. All three pressures elevated, 10+ year history, wanting off meds, 60+, with complex barriers in the way. That&#8217;s the exact profile the Reset Kit was built for. You&#8217;re in the right room.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Tonight at 10 PM Eastern &mdash; private Zoom for paid customers</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          That includes you. Come on:
        </p>
        <div style="background:#2E3A30;border-radius:14px;padding:20px;text-align:center;margin:0 0 14px;">
          <a href="${ZOOM}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:14px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Join the Zoom &rarr;</a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:10px;">Meeting ID: 856 2321 8549</div>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Bring your home BP log if you have one, your med list, and one question. Door opens 9:55 PM EST.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">One ask going forward</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          To make sure my emails don&#8217;t disappear into Promotions, please:
        </p>
        <ol style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li>Open this email</li>
          <li>Tap reply (you don&#8217;t have to send anything)</li>
          <li>Or move it to your Primary inbox</li>
        </ol>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          That tells Gmail you actually want to hear from me.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:14px 0 14px;">
          If anything else feels stuck &mdash; a PDF that won&#8217;t open, a protocol question, anything &mdash; reply right here and I&#8217;ll personally walk you through it.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">Praying for you on this one.</p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0;">Joel Polley, RN &middot; BraveWorks RN</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Blessing,

Got your message. Let me make sure you have everything right now, in one click.

You're confirmed as a paid customer — $47 Reset Kit, purchased 5/20. A handful of emails have gone to you since then with the protocols and the downloads, but it sounds like they landed somewhere you didn't see them (Gmail's Promotions tab is usually the culprit).

Here's the library — every PDF you paid for, in one place:

👉 ${LIBRARY}

Click any title and the PDF lands on your phone or computer. Here's the order I'd suggest:

1. Master Blood Pressure Document — the full protocol. Start here.
2. Top 10 Herbs Deep Dive — each herb matched to the drug it mimics
3. 10-Day BP Reset Protocol — daily checklists, follow it like a recipe
4. Cook For Life Cookbook — meals built around the herbs
5. Overmedicated Boomers Book (your bonus) — read it on the plane or before bed

ALSO — YOU SCORED HIGH ON THE QUIZ

I looked at your quiz answers. All three pressures elevated, 10+ year history, wanting off meds, 60+, with complex barriers in the way. That's the exact profile the Reset Kit was built for. You're in the right room.

TONIGHT AT 10 PM EASTERN — PRIVATE ZOOM FOR PAID CUSTOMERS

That includes you. Come on:

${ZOOM}

Meeting ID: 856 2321 8549

Bring your home BP log if you have one, your med list, and one question. Door opens 9:55 PM EST.

ONE ASK GOING FORWARD

To make sure my emails don't disappear into Promotions, please:

1. Open this email
2. Tap reply (you don't have to send anything)
3. Or move it to your Primary inbox

That tells Gmail you actually want to hear from me.

If anything else feels stuck — a PDF that won't open, a protocol question, anything — reply right here and I'll personally walk you through it.

Praying for you on this one.

— Joel
Joel Polley, RN · BraveWorks RN`;

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY missing'); process.exit(1); }
const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: FROM,
  to: [TO],
  replyTo: REPLY_TO,
  subject: SUBJECT,
  html,
  text,
});

if (error) { console.error('✗', error); process.exit(1); }
console.log(`✓ Sent to ${TO} → Resend ID: ${data.id}`);
