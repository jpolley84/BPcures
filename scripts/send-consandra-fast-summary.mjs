// One-shot: send Consandra her post-consultation summary
// covering the lemonade fast protocol + magnesium recommendations.
// Reviewed in chat 2026-05-24.

import { Resend } from 'resend';

const TO = 'wconssandra@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Consandra — your fasting protocol + magnesium notes';

const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">Joel Polley, RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">BraveWorks RN</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">
          Hi Consandra,
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Good talking today. Here&#8217;s everything we covered, in one place, so you have it for tomorrow.
        </p>
      </td></tr>

      <tr><td style="padding:8px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">The fast &mdash; starts tomorrow morning</h2>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Minimum 3 days.</strong> Goal is up to 10 if you feel good. We re-evaluate daily &mdash; text me how you&#8217;re doing each morning.</li>
          <li><strong>Morning:</strong> saltwater flush first thing (2 tsp sea salt in 32 oz warm water, drink it down).</li>
          <li><strong>All day:</strong> the lemonade mixture only &mdash; fresh lemon juice + grade B maple syrup + cayenne in water. 6&ndash;12 glasses through the day as you get hungry/thirsty. <strong>Drink the lemonade, not plain water</strong> &mdash; that&#8217;s the whole point of this cleanse.</li>
          <li><strong>Aloe vera gel:</strong> 2&ndash;3 times daily during the fast, with a little lemon juice.</li>
        </ul>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Magnesium &mdash; what to look for</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          This matters: you want <strong>POWDER, not pills</strong>. Look for:
        </p>
        <ol style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Magnesium glycinate + magnesium citrate blend</strong> (this combo is what we want)</li>
          <li>Or <strong>MaxCalm</strong> if you see it on the shelf</li>
        </ol>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Try <strong>Walmart or GNC</strong> first. If they only have one of the two forms, glycinate alone is fine to start. Take it in the <strong>evening</strong> &mdash; it helps with sleep and bowel motility, both of which we need during the fast.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">The spiritual side</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          While you fast, do the work I asked:
        </p>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Gratitude on the parts that hurt.</strong> When the abdomen acts up, thank God for that part of your body specifically. Sounds backwards. It isn&#8217;t.</li>
          <li><strong>Sit with the question:</strong> what was happening in your life &mdash; emotionally, spiritually, relationally &mdash; when the abdominal symptoms first started? Not what doctors asked. What were YOU carrying then? Write it down as it comes.</li>
          <li><strong>The vision you shared.</strong> Keep praying on it. Don&#8217;t dismiss it, don&#8217;t dramatize it. Just listen.</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The labs are clean. BP is good. Hormones and cortisol are postmenopausal-normal &mdash; nothing urgent. Which means the gut symptoms aren&#8217;t going to be solved by a pill. We have to look at the whole picture.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">This week</h2>
        <ul style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Live Zoom call</strong> &mdash; I&#8217;ll send the link. Come on if you can, even just to listen. If you want the hot seat, say the word.</li>
          <li><strong>Our next consult:</strong> Sunday at 3:00 PM Central. I&#8217;ll send the Zoom link separately.</li>
          <li><strong>Reading</strong> &mdash; I&#8217;ll send the fasting guide separately so you have it on your phone.</li>
        </ul>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:18px 0 14px;">
          If you feel rough at any point during the fast &mdash; light-headed, weak, heart racing &mdash; text me before you make a decision. We adjust together.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Praying for you on this one.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 0;">
          Joel Polley, RN &middot; BraveWorks RN
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Consandra,

Good talking today. Here's everything we covered, in one place, so you have it for tomorrow.

THE FAST — STARTS TOMORROW MORNING

- Minimum 3 days. Goal is up to 10 if you feel good. We re-evaluate daily — text me how you're doing each morning.
- Morning: saltwater flush first thing (2 tsp sea salt in 32 oz warm water, drink it down).
- All day: the lemonade mixture only — fresh lemon juice + grade B maple syrup + cayenne in water. 6–12 glasses through the day as you get hungry/thirsty. Drink the lemonade, not plain water — that's the whole point of this cleanse.
- Aloe vera gel: 2–3 times daily during the fast, with a little lemon juice.

MAGNESIUM — WHAT TO LOOK FOR

This matters: you want POWDER, not pills. Look for:

1. Magnesium glycinate + magnesium citrate blend (this combo is what we want)
2. Or MaxCalm if you see it on the shelf

Try Walmart or GNC first. If they only have one of the two forms, glycinate alone is fine to start. Take it in the evening — it helps with sleep and bowel motility, both of which we need during the fast.

THE SPIRITUAL SIDE

While you fast, do the work I asked:

- Gratitude on the parts that hurt. When the abdomen acts up, thank God for that part of your body specifically. Sounds backwards. It isn't.
- Sit with the question: what was happening in your life — emotionally, spiritually, relationally — when the abdominal symptoms first started? Not what doctors asked. What were YOU carrying then? Write it down as it comes.
- The vision you shared. Keep praying on it. Don't dismiss it, don't dramatize it. Just listen.

The labs are clean. BP is good. Hormones and cortisol are postmenopausal-normal — nothing urgent. Which means the gut symptoms aren't going to be solved by a pill. We have to look at the whole picture.

THIS WEEK

- Live Zoom call — I'll send the link. Come on if you can, even just to listen. If you want the hot seat, say the word.
- Our next consult: Sunday at 3:00 PM Central. I'll send the Zoom link separately.
- Reading — I'll send the fasting guide separately so you have it on your phone.

If you feel rough at any point during the fast — light-headed, weak, heart racing — text me before you make a decision. We adjust together.

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
