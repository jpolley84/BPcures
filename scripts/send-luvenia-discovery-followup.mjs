// One-shot: post-discovery-call follow-up for Luvenia Truss
// (luvenia.truss@aol.com). 30-min Zoom completed today; she's 71, BP +
// pre-diabetes + weight + stress, 40yr preschool teacher considering
// retirement. Joel pitched 30-day ($297) and 90-day ($1,997) programs.
// Reviewed in chat 2026-05-26.

import { Resend } from 'resend';

const TO = 'luvenia.truss@aol.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Luvenia — your protocol + the next 30 days';
const STRIPE_297 = 'https://buy.stripe.com/00weVddEnca2ajx0oVfnO0O';

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
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi Luvenia,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Thank you for showing up today. Forty years teaching preschool, the blood pressure, the pre-diabetes, the weight, the work stress, the question about retirement &mdash; you&#8217;ve been carrying a lot for a long time. The fact that you&#8217;re choosing to look at the root cause now, instead of just adding another pill on top, says something about you. Honor that.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Here&#8217;s our conversation in one place so you have it to come back to.
        </p>
      </td></tr>

      <tr><td style="padding:8px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">The big picture</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Your blood pressure, blood sugar, weight, and stress aren&#8217;t four separate problems. They&#8217;re one problem wearing four different shirts. The shirt is called <strong>chronic stress</strong>, and after 40 years of being the strong one for everyone else, your body is signaling that it can&#8217;t carry it anymore. The good news: when we cut stress by half, every one of those other numbers starts moving in the right direction at the same time.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The medications your doctor is offering will manage the symptoms. They won&#8217;t touch the cause. That&#8217;s not a criticism of your doctor &mdash; it&#8217;s just not what pills are designed to do. What we work on goes underneath that layer.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Your 4 actions &mdash; start tomorrow</h2>
        <ol style="font-size:15px;line-height:1.75;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Cut your stress by half.</strong> Sit with a piece of paper this week and write down every source of stress in your life right now. Then circle the top three. We&#8217;ll tackle them one by one. The teaching job. The retirement decision. Whatever&#8217;s loudest. <strong>Naming them is half the battle.</strong></li>
          <li><strong>Water = half your body weight in ounces, daily.</strong> If you weigh 160 lbs, that&#8217;s 80 oz a day. <strong>Sip it slow</strong> &mdash; small mouthfuls, spread out from waking until 7 PM. Don&#8217;t chug. Add a tiny pinch of Celtic or Redmond&#8217;s salt under the tongue once a day so your body actually holds the water and the minerals.</li>
          <li><strong>25 gratitudes before bed, every night.</strong> Out loud or written. The catch: when something hurts &mdash; your knees, your back, your blood pressure &mdash; put gratitude on THAT specifically. &#8220;Thank you for my knees that have held me up for 71 years.&#8221; This is the cortisol intervention that no medication can do.</li>
          <li><strong>Magnesium powder before bed.</strong> You said you already ordered citrate &mdash; that&#8217;s fine to start. Long-term, <strong>glycinate + citrate blend</strong> is what we want (gentle on bowels, deep on sleep). Sleep is when your body rebuilds the lining of every blood vessel. Magnesium is the foundation.</li>
        </ol>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Keep taking your prescribed medications exactly as your doctor instructed. We do nothing to those without your doctor in the loop. Ever.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">About working together</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I want to lay both options out in writing so you can sit with them. No pressure on timing &mdash; the work I gave you above is free and yours regardless.
        </p>

        <div style="background:#FAF5FF;border:1px solid #E9D5FF;border-radius:14px;padding:22px;margin:0 0 16px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6C3483;font-weight:700;margin-bottom:6px;">30-Day Reset</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#2C3E50;margin-bottom:10px;">$297</div>
          <ul style="font-size:14.5px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;padding-left:20px;">
            <li>Weekly 1:1 Zoom sessions (4 calls)</li>
            <li>Access to my private Zoom hot-seat rooms (Monday nights)</li>
            <li>Email access to me between calls</li>
            <li>Designed to: get your numbers moving, identify your loudest stress driver, build a sleep + hydration rhythm that sticks</li>
          </ul>
          <p style="font-size:13.5px;color:#5B3B6E;font-style:italic;margin:0 0 12px;">Best for: someone who wants a real start with accountability, before deciding on something deeper.</p>
          <a href="${STRIPE_297}" style="display:inline-block;background:#6C3483;color:#FBF8F1;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Start the 30-Day Reset &rarr;</a>
        </div>

        <div style="background:#2E3A30;border-radius:14px;padding:22px;color:#FBF8F1;margin:0 0 16px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:6px;">90-Day Transformation</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#FBF8F1;margin-bottom:10px;">$1,997</div>
          <ul style="font-size:14.5px;line-height:1.65;color:#D8D4C5;margin:0 0 14px;padding-left:20px;">
            <li>Monthly 1:1 Zoom sessions (3 deep dives)</li>
            <li>WhatsApp office hours Sunday&ndash;Thursday (text me when something comes up &mdash; I read every one)</li>
            <li>Hot-seat Zoom room access</li>
            <li>The goals on paper: <strong>reduce or eliminate your BP medication</strong> (alongside your prescribing doctor), <strong>lose 20+ pounds</strong>, and <strong>fix your sleep</strong></li>
          </ul>
          <p style="font-size:13.5px;color:#C7A95E;font-style:italic;margin:0 0 12px;">Best for: someone ready to finish the job &mdash; not manage it, finish it.</p>
          <p style="font-size:14px;color:#FBF8F1;margin:0;">
            To enroll, <strong>reply to this email</strong> with &#8220;YES, 90-DAY&#8221; and I&#8217;ll send you a private Stripe invoice. Payment plans (3 monthly payments) available if that helps.
          </p>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">One more thing &mdash; what we talked about on the call</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m going to say this once and then leave it alone:
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You said money was tight. I hear that. And I want to plant something next to that thought &mdash; not over it.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The 40 years you&#8217;ve poured into other people&#8217;s children, your husband, your home &mdash; none of that came back to you in dollars. It came back in love and meaning, which is the only currency that matters. But your body has been on the giving end of that math for a long time, and the bill is coming due in the form of these diagnoses.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The question isn&#8217;t <em>&#8220;can I afford $297 or $1,997?&#8221;</em> The question is:
        </p>
        <p style="font-size:16px;line-height:1.6;color:#2C3E50;margin:0 0 14px;font-weight:600;background:#FCEED9;padding:14px 18px;border-radius:10px;">
          What would the version of you, three years into retirement, who never has to think about her blood pressure again &mdash; what would SHE pay today to make that come true?
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Not pressure. Not a sales line. Just a frame to sit with. Most women I work with realize the money was always there. What was missing was permission to put themselves on the list.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          For now &mdash; start with the four actions above. Tonight. Water, gratitudes, magnesium, sit with the stress list. If you want to keep going together, I&#8217;m here. If you don&#8217;t, you have everything you need to make a real start.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:14px 0 14px;">
          Praying for you, Luvenia. Your retirement is supposed to be the dessert, not another shift.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">Joel Polley, RN &middot; BraveWorks RN</p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0;">
            <strong style="color:#2C3E50;">P.S.</strong> If at any point in the next two weeks your BP spikes or you feel something really off (chest pain, vision changes, real shortness of breath) &mdash; ER first. We work on root cause AFTER you&#8217;re stable. Never instead of.
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Luvenia,

Thank you for showing up today. Forty years teaching preschool, the blood pressure, the pre-diabetes, the weight, the work stress, the question about retirement — you've been carrying a lot for a long time. The fact that you're choosing to look at the root cause now, instead of just adding another pill on top, says something about you. Honor that.

Here's our conversation in one place so you have it to come back to.

THE BIG PICTURE

Your blood pressure, blood sugar, weight, and stress aren't four separate problems. They're one problem wearing four different shirts. The shirt is called chronic stress, and after 40 years of being the strong one for everyone else, your body is signaling that it can't carry it anymore. The good news: when we cut stress by half, every one of those other numbers starts moving in the right direction at the same time.

The medications your doctor is offering will manage the symptoms. They won't touch the cause. That's not a criticism of your doctor — it's just not what pills are designed to do. What we work on goes underneath that layer.

YOUR 4 ACTIONS — START TOMORROW

1. CUT YOUR STRESS BY HALF. Sit with a piece of paper this week and write down every source of stress in your life right now. Then circle the top three. We'll tackle them one by one. The teaching job. The retirement decision. Whatever's loudest. Naming them is half the battle.

2. WATER = HALF YOUR BODY WEIGHT IN OUNCES, DAILY. If you weigh 160 lbs, that's 80 oz a day. Sip it slow — small mouthfuls, spread out from waking until 7 PM. Don't chug. Add a tiny pinch of Celtic or Redmond's salt under the tongue once a day so your body actually holds the water and the minerals.

3. 25 GRATITUDES BEFORE BED, EVERY NIGHT. Out loud or written. The catch: when something hurts — your knees, your back, your blood pressure — put gratitude on THAT specifically. "Thank you for my knees that have held me up for 71 years." This is the cortisol intervention that no medication can do.

4. MAGNESIUM POWDER BEFORE BED. You said you already ordered citrate — that's fine to start. Long-term, glycinate + citrate blend is what we want (gentle on bowels, deep on sleep). Sleep is when your body rebuilds the lining of every blood vessel. Magnesium is the foundation.

Keep taking your prescribed medications exactly as your doctor instructed. We do nothing to those without your doctor in the loop. Ever.

ABOUT WORKING TOGETHER

I want to lay both options out in writing so you can sit with them. No pressure on timing — the work I gave you above is free and yours regardless.

30-DAY RESET · $297
- Weekly 1:1 Zoom sessions (4 calls)
- Access to my private Zoom hot-seat rooms (Monday nights)
- Email access to me between calls
- Designed to: get your numbers moving, identify your loudest stress driver, build a sleep + hydration rhythm that sticks
- Best for: someone who wants a real start with accountability, before deciding on something deeper

Enroll: ${STRIPE_297}

90-DAY TRANSFORMATION · $1,997
- Monthly 1:1 Zoom sessions (3 deep dives)
- WhatsApp office hours Sunday-Thursday (text me when something comes up — I read every one)
- Hot-seat Zoom room access
- The goals on paper: reduce or eliminate your BP medication (alongside your prescribing doctor), lose 20+ pounds, and fix your sleep
- Best for: someone ready to finish the job — not manage it, finish it

To enroll, reply to this email with "YES, 90-DAY" and I'll send you a private Stripe invoice. Payment plans (3 monthly payments) available if that helps.

ONE MORE THING — WHAT WE TALKED ABOUT ON THE CALL

I'm going to say this once and then leave it alone:

You said money was tight. I hear that. And I want to plant something next to that thought — not over it.

The 40 years you've poured into other people's children, your husband, your home — none of that came back to you in dollars. It came back in love and meaning, which is the only currency that matters. But your body has been on the giving end of that math for a long time, and the bill is coming due in the form of these diagnoses.

The question isn't "can I afford $297 or $1,997?" The question is:

What would the version of you, three years into retirement, who never has to think about her blood pressure again — what would SHE pay today to make that come true?

Not pressure. Not a sales line. Just a frame to sit with. Most women I work with realize the money was always there. What was missing was permission to put themselves on the list.

For now — start with the four actions above. Tonight. Water, gratitudes, magnesium, sit with the stress list. If you want to keep going together, I'm here. If you don't, you have everything you need to make a real start.

Praying for you, Luvenia. Your retirement is supposed to be the dessert, not another shift.

— Joel
Joel Polley, RN · BraveWorks RN

P.S. If at any point in the next two weeks your BP spikes or you feel something really off (chest pain, vision changes, real shortness of breath) — ER first. We work on root cause AFTER you're stable. Never instead of.`;

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY missing'); process.exit(1); }
const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: FROM, to: [TO], replyTo: REPLY_TO, subject: SUBJECT, html, text,
});

if (error) { console.error('✗', error); process.exit(1); }
console.log(`✓ Sent to ${TO} → Resend ID: ${data.id}`);
