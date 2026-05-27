// One-shot: send Francesca Serra (fbserra69@gmail.com) her post-consult
// summary after her 5/25 Intake Call. Includes tonight's 10 PM TikTok/FB
// live, the four nighttime actions, the free Skool community + BPQuiz
// links, and the worth-it / future-self frame teaching the cost-of-staying
// principle. Reviewed and approved in chat 2026-05-25.

import { Resend } from 'resend';

const TO = 'fbserra69@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Francesca — what we talked about + tonight at 10 PM';

const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
const BPQUIZ_URL = 'https://bpquiz.com';
const TIKTOK_URL = 'https://tiktok.com/@braveworksrn/live';
const FACEBOOK_URL = 'https://facebook.com/braveworksrn';

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
          Hi Francesca,
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Thank you for trusting me with everything you carried into our call today. MS. The thyroid cancer history. The hospital stay you just walked out of. The brand-new AFib. That&#8217;s not a small list. The fact that you&#8217;re still showing up, asking the right questions, telling the truth about what&#8217;s been happening &mdash; that already tells me a lot about you.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Here&#8217;s what we covered, in one place, so you have it to come back to.
        </p>
      </td></tr>

      <tr><td style="padding:8px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">The big picture</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Your body didn&#8217;t break this week. It started signaling a long time ago and we just hit a moment loud enough that the hospital noticed. The high blood pressure, the AFib, the sleep apnea &mdash; those are downstream of three things we can actually move:
        </p>
        <ol style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li><strong>Chronic stress</strong> your nervous system has been swimming in for years</li>
          <li><strong>Dehydration</strong> that&#8217;s been quietly running every system at half-power</li>
          <li><strong>Sleep</strong> that&#8217;s been broken so long your body forgot what restored feels like</li>
        </ol>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The meds will hold the line while we work upstream. They can&#8217;t fix what they&#8217;re not designed to touch.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Tonight at 10 PM Eastern &mdash; come on</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          I&#8217;m live on TikTok and Facebook at 10 PM EST tonight. Come listen, even if you don&#8217;t say a word. Bring tea. Sit in bed. Just be in the room.
        </p>
        <ul style="font-size:15px;line-height:1.8;color:#3A3A3A;margin:0 0 14px;padding-left:22px;list-style:none;">
          <li><strong>TikTok:</strong> <a href="${TIKTOK_URL}" style="color:#B85A36;">tiktok.com/@braveworksrn/live</a></li>
          <li><strong>Facebook:</strong> <a href="${FACEBOOK_URL}" style="color:#B85A36;">facebook.com/braveworksrn</a></li>
        </ul>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Tonight&#8217;s four actions &mdash; start before bed</h2>
        <ol style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;padding-left:22px;">
          <li style="margin-bottom:8px;"><strong>Sleep on your LEFT side.</strong> Helps the heart, helps the airway, helps the kidneys filter overnight. Single biggest free change you can make tonight.</li>
          <li style="margin-bottom:8px;"><strong>Pillow off (or way down).</strong> Most necks are too kinked, which closes the airway and feeds the apnea. Try one night without it. Just one.</li>
          <li style="margin-bottom:8px;"><strong>Water &mdash; work toward a gallon a day.</strong> Sip steadily; don&#8217;t chug. Add a pinch of Celtic or Redmond&#8217;s salt under the tongue once or twice. Your blood needs the minerals more than your kidneys need the sodium-restriction lecture.</li>
          <li><strong>Magnesium powder before bed.</strong> Glycinate + citrate blend if you can find it &mdash; Walmart or GNC have powders. Helps sleep, helps blood pressure, helps the AFib electrical system. Not a cure. A foundation.</li>
        </ol>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Keep taking everything your doctors have prescribed. Bring your labs and your home log to your next doctor appointment.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:18px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">Two free resources I want you to use</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">
          <strong>The 10-Day Blood Pressure Challenge (free, inside our community):</strong><br />
          <a href="${SKOOL_URL}" style="color:#B85A36;word-break:break-all;">${SKOOL_URL}</a><br />
          1,100+ of us in there doing this work together. Worth nothing on paper. Worth everything in practice.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:14px 0;">
          <strong>The 3-minute BP Triangle quiz:</strong><br />
          <a href="${BPQUIZ_URL}" style="color:#B85A36;">bpquiz.com</a><br />
          It tells you which of the three corners is loudest in YOUR body &mdash; vascular, cortisol, or blood sugar. Mostly cortisol-driven hypertension is what I heard today, but the quiz will confirm.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#2C3E50;margin:24px 0 10px;border-bottom:1px solid #E8E2D4;padding-bottom:8px;">One more thing &mdash; and I say this with love</h2>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          When we talked about deeper support and the words &#8220;I don&#8217;t have the money&#8221; came up, I want to come back to that. Not to push. To teach.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The body keeps the score of every decision we make about our own worth. When a woman has been the strong one for her husband, her kids, her parents, her job for forty years and never once spent on herself the way she spent on them &mdash; her nervous system gets the memo. Cortisol stays high. Sleep stays shallow. Blood pressure stays up. AFib starts firing. The body absorbs the signal <em>&#8220;I&#8217;m not worth this&#8221;</em> and converts it into the exact diagnoses you&#8217;re now carrying.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m not saying go spend money you don&#8217;t have. I&#8217;m saying the question isn&#8217;t <em>can I afford this.</em> The real questions are:
        </p>
        <div style="background:#FAF5FF;border-left:3px solid #6C3483;padding:14px 18px;margin:14px 0;border-radius:4px;">
          <p style="font-size:15.5px;line-height:1.6;color:#2C3E50;margin:0 0 12px;font-style:italic;">
            <strong>What is it already costing me &mdash; in meds, in ER visits, in lost days, in lost joy &mdash; to stay where I am?</strong>
          </p>
          <p style="font-size:15.5px;line-height:1.6;color:#2C3E50;margin:0;font-style:italic;">
            <strong>What would the version of me, one year from now, who never has to deal with this again &mdash; what would SHE pay today to make that come true?</strong>
          </p>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          That&#8217;s not a sales pitch. That&#8217;s a frame I want you to sit with this week. Most women I work with realize the money has always been there. What was missing was <em>permission to put themselves on the list.</em>
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You can do everything I just laid out &mdash; the four nighttime actions, the free Skool community, the quiz, the 10 PM lives &mdash; without ever spending a dollar with me. That path works. A lot of women change their numbers from inside the free community alone.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          But I&#8217;ll be straight with you about what the free path is and what it isn&#8217;t.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          The free path moves at the speed of <em>you</em> &mdash; your discipline, your interpretation, your ability to course-correct when something stops working. No one is watching your numbers. No one is in your ear when you slide. No one is rebuilding the protocol when your body says &#8220;that&#8217;s not it.&#8221;
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#2C3E50;margin:0 0 14px;font-weight:600;">
          Coaching is what changes that.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Coaching is where you stop guessing and start moving with <strong>support, accountability, and someone holding the map for you</strong> week after week. It&#8217;s faster. It&#8217;s cleaner. It costs less, in the end, than the years of half-results the free path takes for most people who try to white-knuckle it alone.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          If and when you&#8217;re ready for that, I&#8217;m here. We&#8217;ll talk about what fits your life. <strong>Today was the free version of meeting me &mdash; there isn&#8217;t another one of those.</strong> The next conversation, if there is one, is the coaching one. No pressure on the timing. Just clarity on the door.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 24px;">
        <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:18px 0 14px;">
          For tonight &mdash; left side, no pillow, water, magnesium, 10 PM live. That&#8217;s the whole list.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          Praying for you on this one. You&#8217;re not as far from the other side of this as you feel.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">
          Joel Polley, RN &middot; BraveWorks RN
        </p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0;">
            <strong style="color:#2C3E50;">P.S.</strong> If anything tonight feels wrong &mdash; chest pain that won&#8217;t pass, vision changes, real shortness of breath &mdash; go to the ER, no hesitation. We work on root cause AFTER you&#8217;re stable. Never instead of.
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Francesca,

Thank you for trusting me with everything you carried into our call today. MS. The thyroid cancer history. The hospital stay you just walked out of. The brand-new AFib. That's not a small list. The fact that you're still showing up, asking the right questions, telling the truth about what's been happening — that already tells me a lot about you.

Here's what we covered, in one place, so you have it to come back to.

THE BIG PICTURE

Your body didn't break this week. It started signaling a long time ago and we just hit a moment loud enough that the hospital noticed. The high blood pressure, the AFib, the sleep apnea — those are downstream of three things we can actually move:

1. Chronic stress your nervous system has been swimming in for years
2. Dehydration that's been quietly running every system at half-power
3. Sleep that's been broken so long your body forgot what restored feels like

The meds will hold the line while we work upstream. They can't fix what they're not designed to touch.

TONIGHT AT 10 PM EASTERN — COME ON

I'm live on TikTok and Facebook at 10 PM EST tonight. Come listen, even if you don't say a word. Bring tea. Sit in bed. Just be in the room.

- TikTok: ${TIKTOK_URL}
- Facebook: ${FACEBOOK_URL}

TONIGHT'S FOUR ACTIONS — START BEFORE BED

1. Sleep on your LEFT side. Helps the heart, helps the airway, helps the kidneys filter overnight. Single biggest free change you can make tonight.
2. Pillow off (or way down). Most necks are too kinked, which closes the airway and feeds the apnea. Try one night without it. Just one.
3. Water — work toward a gallon a day. Sip steadily; don't chug. Add a pinch of Celtic or Redmond's salt under the tongue once or twice. Your blood needs the minerals more than your kidneys need the sodium-restriction lecture.
4. Magnesium powder before bed. Glycinate + citrate blend if you can find it — Walmart or GNC have powders. Helps sleep, helps blood pressure, helps the AFib electrical system. Not a cure. A foundation.

Keep taking everything your doctors have prescribed. Bring your labs and your home log to your next doctor appointment.

TWO FREE RESOURCES I WANT YOU TO USE

The 10-Day Blood Pressure Challenge (free, inside our community):
${SKOOL_URL}
1,100+ of us in there doing this work together. Worth nothing on paper. Worth everything in practice.

The 3-minute BP Triangle quiz:
${BPQUIZ_URL}
It tells you which of the three corners is loudest in YOUR body — vascular, cortisol, or blood sugar. Mostly cortisol-driven hypertension is what I heard today, but the quiz will confirm.

ONE MORE THING — AND I SAY THIS WITH LOVE

When we talked about deeper support and the words "I don't have the money" came up, I want to come back to that. Not to push. To teach.

The body keeps the score of every decision we make about our own worth. When a woman has been the strong one for her husband, her kids, her parents, her job for forty years and never once spent on herself the way she spent on them — her nervous system gets the memo. Cortisol stays high. Sleep stays shallow. Blood pressure stays up. AFib starts firing. The body absorbs the signal "I'm not worth this" and converts it into the exact diagnoses you're now carrying.

I'm not saying go spend money you don't have. I'm saying the question isn't can I afford this. The real questions are:

  What is it already costing me — in meds, in ER visits, in lost days, in lost joy — to stay where I am?

  What would the version of me, one year from now, who never has to deal with this again — what would SHE pay today to make that come true?

That's not a sales pitch. That's a frame I want you to sit with this week. Most women I work with realize the money has always been there. What was missing was permission to put themselves on the list.

You can do everything I just laid out — the four nighttime actions, the free Skool community, the quiz, the 10 PM lives — without ever spending a dollar with me. That path works. A lot of women change their numbers from inside the free community alone.

But I'll be straight with you about what the free path is and what it isn't.

The free path moves at the speed of YOU — your discipline, your interpretation, your ability to course-correct when something stops working. No one is watching your numbers. No one is in your ear when you slide. No one is rebuilding the protocol when your body says "that's not it."

Coaching is what changes that.

Coaching is where you stop guessing and start moving with support, accountability, and someone holding the map for you week after week. It's faster. It's cleaner. It costs less, in the end, than the years of half-results the free path takes for most people who try to white-knuckle it alone.

If and when you're ready for that, I'm here. We'll talk about what fits your life. Today was the free version of meeting me — there isn't another one of those. The next conversation, if there is one, is the coaching one. No pressure on the timing. Just clarity on the door.

For tonight — left side, no pillow, water, magnesium, 10 PM live. That's the whole list.

Praying for you on this one. You're not as far from the other side of this as you feel.

— Joel
Joel Polley, RN · BraveWorks RN

P.S. If anything tonight feels wrong — chest pain that won't pass, vision changes, real shortness of breath — go to the ER, no hesitation. We work on root cause AFTER you're stable. Never instead of.`;

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
