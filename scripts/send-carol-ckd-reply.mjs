// One-shot: reply to Carol's stage-3 CKD question.
// She replied to the Monday "3 lies" newsletter asking what to do.
// CKD is serious; reply gives general principles + the free discovery
// call link. Reviewed in chat 2026-05-26.

import { Resend } from 'resend';

const TO = 'carolnrick22@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Re: 3 lies your doctor told you about your BP';
const COACHING_PAGE = 'https://bpquiz.com/coaching';
const CALENDLY = 'https://calendly.com/braveworksrn/30min';

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
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi Carol,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Thank you for trusting me with that question. Stage 3 CKD is something I take seriously &mdash; it&#8217;s the stage where what you do every day actually moves the needle, but it&#8217;s also the stage where generic advice can hurt instead of help. So I&#8217;m not going to email you a one-size protocol.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          A few general principles I can say in writing, because they apply to nearly everyone at your stage:
        </p>
        <ol style="font-size:15px;line-height:1.75;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Blood pressure control is the #1 lever.</strong> Every point you drop protects the kidneys. If you&#8217;re on a BP med, take it. We work alongside it, not against it.</li>
          <li><strong>Hydration matters &mdash; but with minerals, not plain water.</strong> Stage 3 changes how the kidneys handle sodium and potassium. The right balance is specific to YOU, your labs, and your meds. The &#8220;drink a gallon&#8221; advice that works for everyone else needs modification at your stage.</li>
          <li><strong>Protein quality and quantity both matter.</strong> Animal protein loads the kidneys harder than plant protein. Most stage-3 patients do better shifting some (not all) protein toward beans, lentils, fish.</li>
          <li><strong>Avoid NSAIDs</strong> (ibuprofen, naproxen, Aleve). They&#8217;re harder on stage-3 kidneys than most people realize. Tylenol is the safer OTC route for pain.</li>
          <li><strong>Track these labs every 3&ndash;6 months:</strong> eGFR, creatinine, BUN, urine albumin/creatinine ratio, potassium, phosphorus, vitamin D. The numbers tell us what&#8217;s working before symptoms show up.</li>
        </ol>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          But here&#8217;s where I have to stop with general advice and meet you specifically: <strong>what&#8217;s the best thing for YOU depends on your numbers, your meds, your other diagnoses, and what your nephrologist (if you have one) has already said.</strong>
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;d rather sit with you for 30 minutes and actually walk through your situation than send you a generic list that might be wrong for your case.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <div style="background:#2E3A30;border-radius:14px;padding:24px;text-align:center;margin:0 0 22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:8px;">It&#8217;s free</div>
          <div style="font-size:18px;color:#FBF8F1;margin-bottom:16px;font-family:Georgia,serif;">30 minutes with a real nurse</div>
          <a href="${CALENDLY}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
            Pick your time &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:14px;">
            <a href="${COACHING_PAGE}" style="color:#A8AC9F;">bpquiz.com/coaching</a>
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Bring your most recent labs if you have them (eGFR, creatinine, A1c, BP log), your med list, and whatever&#8217;s been on your mind. If you don&#8217;t have labs handy, we work with what you&#8217;ve got.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          If 30 minutes isn&#8217;t enough or doesn&#8217;t work &mdash; reply right here and we&#8217;ll find another path.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:14px 0 14px;">
          Praying for you on this one. Stage 3 is not a sentence. It&#8217;s a signal.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">Joel Polley, RN &middot; BraveWorks RN</p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0;">
            <strong style="color:#2C3E50;">P.S.</strong> This is education, not a diagnosis. Always loop in your nephrologist or PCP before changing anything we discuss.
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Carol,

Thank you for trusting me with that question. Stage 3 CKD is something I take seriously — it's the stage where what you do every day actually moves the needle, but it's also the stage where generic advice can hurt instead of help. So I'm not going to email you a one-size protocol.

A few general principles I can say in writing, because they apply to nearly everyone at your stage:

1. BLOOD PRESSURE CONTROL IS THE #1 LEVER. Every point you drop protects the kidneys. If you're on a BP med, take it. We work alongside it, not against it.

2. HYDRATION MATTERS — BUT WITH MINERALS, NOT PLAIN WATER. Stage 3 changes how the kidneys handle sodium and potassium. The right balance is specific to YOU, your labs, and your meds. The "drink a gallon" advice that works for everyone else needs modification at your stage.

3. PROTEIN QUALITY AND QUANTITY BOTH MATTER. Animal protein loads the kidneys harder than plant protein. Most stage-3 patients do better shifting some (not all) protein toward beans, lentils, fish.

4. AVOID NSAIDS (ibuprofen, naproxen, Aleve). They're harder on stage-3 kidneys than most people realize. Tylenol is the safer OTC route for pain.

5. TRACK THESE LABS EVERY 3-6 MONTHS: eGFR, creatinine, BUN, urine albumin/creatinine ratio, potassium, phosphorus, vitamin D. The numbers tell us what's working before symptoms show up.

But here's where I have to stop with general advice and meet you specifically: what's the best thing for YOU depends on your numbers, your meds, your other diagnoses, and what your nephrologist (if you have one) has already said.

I'd rather sit with you for 30 minutes and actually walk through your situation than send you a generic list that might be wrong for your case.

IT'S FREE. PICK A TIME:

👉 ${COACHING_PAGE}

Or go straight to the calendar: ${CALENDLY}

Bring your most recent labs if you have them (eGFR, creatinine, A1c, BP log), your med list, and whatever's been on your mind. If you don't have labs handy, we work with what you've got.

If 30 minutes isn't enough or doesn't work — reply right here and we'll find another path.

Praying for you on this one. Stage 3 is not a sentence. It's a signal.

— Joel
Joel Polley, RN · BraveWorks RN

P.S. This is education, not a diagnosis. Always loop in your nephrologist or PCP before changing anything we discuss.`;

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY missing'); process.exit(1); }
const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: FROM, to: [TO], replyTo: REPLY_TO, subject: SUBJECT, html, text,
});

if (error) { console.error('✗', error); process.exit(1); }
console.log(`✓ Sent to ${TO} → Resend ID: ${data.id}`);
