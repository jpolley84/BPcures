// One-shot: reply to Vernetha (vernetha4462@att.net) who asked for a refund
// because she "can't figure this out." Stripe confirms she PAID on 2026-05-21
// ($17 Kit, py_3TZWCbHseZnO3rRZ1s7ZIFWi). She also has a 2nd customer record
// with a failed charge — which is what triggered the erroneous abandoned-cart
// email she replied to.
//
// Tone: warm, gentle, NOT defensive about the bad email. Resends the library
// link, offers to walk her through anything specific, keeps refund offer on
// the table. Adds an invite to tonight's 10 PM EST live on TikTok/Facebook.
// Reviewed in chat 2026-05-25.

import { Resend } from 'resend';

const TO = 'vernetha4462@att.net';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Re: You got distracted — your BP Reset Kit is still here';

const LIBRARY_URL = 'https://bpquiz.com/library';
const TIKTOK_URL = 'https://tiktok.com/@braveworksrn/live';
const FACEBOOK_URL = 'https://facebook.com/braveworksrn';

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
          Hi Vernetha,
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m so glad you wrote back. Before we talk about a refund, let me see if I can help you first &mdash; because looking at your account, <strong>your purchase did go through.</strong> You paid for the Kit on May 21st, and everything&#8217;s been delivered to your inbox.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Here&#8217;s a fresh copy of everything you bought, in one place:
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <div style="background:#2E3A30;border-radius:14px;padding:24px;text-align:center;margin:0 0 22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:12px;">All your downloads, one click</div>
          <a href="${LIBRARY_URL}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
            Open your library &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:14px;">
            bpquiz.com/library
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Click any title on that page and the PDF lands on your phone or computer. Start with <strong>&#8220;Master Blood Pressure Document&#8221;</strong> and <strong>&#8220;Top 10 Herbs Deep Dive&#8221;</strong> &mdash; those two are the heart of the protocol. The rest are bonuses you can read at your own pace.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You should have also received two welcome emails from me &mdash; one on May 21st (the day you paid) and one this past Saturday. They have the same links inside. Check your inbox for &#8220;Joel Polley&#8221; or &#8220;BraveWorks RN&#8221; &mdash; sometimes Yahoo Mail puts them in a Promotions folder.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          About the &#8220;you didn&#8217;t finish your order&#8221; email I sent on the 22nd &mdash; that was my system getting confused because you tried to checkout twice (the second card got declined, which it thought meant you hadn&#8217;t paid yet). <strong>You paid. That email was wrong.</strong> I&#8217;m sorry it added confusion.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">If you&#8217;re stuck on something specific</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          Tell me what it is and I&#8217;ll walk you through it personally &mdash; whether that&#8217;s:
        </p>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li>Finding or opening the PDFs</li>
          <li>Where to start in the protocol</li>
          <li>Whether the BP advice is safe with your meds</li>
          <li>Anything else getting in your way</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Just reply here with what&#8217;s stuck and I&#8217;ll respond directly. No bot, no auto-reply &mdash; me.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Come on live tonight &mdash; 10 PM Eastern</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m live on TikTok and Facebook tonight at 10 PM EST. Come listen, even just to put a face to the protocol. I answer questions in real time and walk through the most common &#8220;I&#8217;m stuck on this part&#8221; moments women run into. No pressure, no pitch &mdash; just nursing.
        </p>
        <ul style="font-size:15px;line-height:1.8;color:#3A3A3A;margin:0 0 14px;padding-left:22px;list-style:none;">
          <li><strong>TikTok:</strong> <a href="${TIKTOK_URL}" style="color:#B85A36;">tiktok.com/@braveworksrn/live</a></li>
          <li><strong>Facebook:</strong> <a href="${FACEBOOK_URL}" style="color:#B85A36;">facebook.com/braveworksrn</a></li>
        </ul>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:18px 0 14px;">
          If after all that you still want the $17 back, I&#8217;ll send it without another word. The refund offer stands. But I&#8217;d rather get you using what you already paid for, because the women who actually run the protocol are the ones whose numbers move.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Praying for you on this one.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0;">
          Joel Polley, RN &middot; BraveWorks RN
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Vernetha,

I'm so glad you wrote back. Before we talk about a refund, let me see if I can help you first — because looking at your account, your purchase did go through. You paid for the Kit on May 21st, and everything's been delivered to your inbox.

Here's a fresh copy of everything you bought, in one place:

👉 All your downloads: ${LIBRARY_URL}

Click any title on that page and the PDF lands on your phone or computer. Start with "Master Blood Pressure Document" and "Top 10 Herbs Deep Dive" — those two are the heart of the protocol. The rest are bonuses you can read at your own pace.

You should have also received two welcome emails from me — one on May 21st (the day you paid) and one this past Saturday. They have the same links inside. Check your inbox for "Joel Polley" or "BraveWorks RN" — sometimes Yahoo Mail puts them in a Promotions folder.

About the "you didn't finish your order" email I sent on the 22nd — that was my system getting confused because you tried to checkout twice (the second card got declined, which it thought meant you hadn't paid yet). You paid. That email was wrong. I'm sorry it added confusion.

IF YOU'RE STUCK ON SOMETHING SPECIFIC

Tell me what it is and I'll walk you through it personally — whether that's:

- Finding or opening the PDFs
- Where to start in the protocol
- Whether the BP advice is safe with your meds
- Anything else getting in your way

Just reply here with what's stuck and I'll respond directly. No bot, no auto-reply — me.

COME ON LIVE TONIGHT — 10 PM EASTERN

I'm live on TikTok and Facebook tonight at 10 PM EST. Come listen, even just to put a face to the protocol. I answer questions in real time and walk through the most common "I'm stuck on this part" moments women run into. No pressure, no pitch — just nursing.

- TikTok: ${TIKTOK_URL}
- Facebook: ${FACEBOOK_URL}

If after all that you still want the $17 back, I'll send it without another word. The refund offer stands. But I'd rather get you using what you already paid for, because the women who actually run the protocol are the ones whose numbers move.

Praying for you on this one.

— Joel
Joel Polley, RN · BraveWorks RN`;

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
