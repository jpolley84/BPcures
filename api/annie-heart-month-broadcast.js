// api/annie-heart-month-broadcast.js - October heart-health opener, Annie's list.
//
// One email, no offer and no lead magnet, on Joel's explicit instruction
// 2026-10-04: the whole ask is a one-letter reply (A/B/C/D).
//
// Audience: KV hash rhhmc:segment, minus the Resend suppression audience.
// Anyone on Joel's list was already removed from that segment, so nobody
// receives both emails (feedback_overlap_joels_list_wins).
//
// Cloned from api/annie-masterclass-broadcast.js, byte for byte below the
// EMAILS block. Only the constants and the copy changed.
//
// Scheduled: 2026-10-05 08:00 America/New_York = 12:00 UTC.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { escapeHtml } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { neverSendGuard } from './_never_send.js';

// ARMED 2026-10-05 on Joel's go after he read both dry runs.
// Guard compares this to today's date in America/Chicago. Fires at
// 12:00 UTC = 08:00 America/New_York = 07:00 America/Chicago, so the
// date matches on every window in vercel.json and on no other day.
// Per-email fire dates, America/Chicago. Option 1 schedule Joel
// approved 2026-10-06: Fri 10-09 and Sat 10-10 are rest days, and
// Day 6 + Day 7 both land on class day 10-12.
const FIRE_DATES = {
  '2': '2026-10-06',
  '3': '2026-10-07',
  '4': '2026-10-08',
  '5': '2026-10-11',
  '6': '2026-10-12',
  '7': '2026-10-12'
};
const CRON_FIRE_DATE = '2026-10-05'; // Day 1, already sent
const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'annie@restoreherhormones.com';
const REGISTER_URL = 'https://restoreherhormones.com/masterclass';
const UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const RATE_LIMIT_MS = 90; // matches the local script's pace (0 failures on 8.5k); Resend latency adds ~100ms per send
const MAX_RUN_MS = 250 * 1000;
const SEGMENT_KEY = 'rhhmc:segment';
const SENT_SET_PREFIX = 'rhhheart:sent:';

function unsubUrl(email) {
  return `https://restoreherhormones.com/api/unsubscribe?email=${encodeURIComponent(email)}`;
}

const DISCLAIMER_HTML = (email) => `
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
  Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.<br/>
  It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC &middot; 240 W Dixie Ave Ste 5 &middot; Elizabethtown, KY 42701<br/>
  <a href="${unsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a>
</p>`;

const DISCLAIMER_TEXT = (email) => `---
Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.
It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC · 240 W Dixie Ave Ste 5 · Elizabethtown, KY 42701

Unsubscribe: ${unsubUrl(email)}`;

function wrapHtml(bodyHtml, email, preheader) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f4f1;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.06);"><tr><td style="padding:30px 28px;font-size:16px;line-height:1.65;color:#222;">
${bodyHtml}
${DISCLAIMER_HTML(email)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const BTN = (label) => `<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:#ecd88d;color:#1f1a16;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">${label} &rarr;</a></p>`;

const EMAILS = {
  1: {
    subject: () => 'This kills more women than all cancers combined',
    preheader: 'Reply A, B, C or D and I will start where you actually are.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>You know I talk about hormones a lot around here.</p>
<p>The belly that will not move. The chin hair. The thinning hair. The sleep that changed. The exhaustion. The blood sugar. The mood. The things that make you look in the mirror and know your body is not responding the way it used to.</p>
<p>And if you are reading this email, watching my videos, paying attention to symptoms, checking your numbers, asking questions, trying to understand what your body is doing...</p>
<p><strong>You are already doing something most people do not do until much later.</strong></p>
<p>You are paying attention.</p>
<p>You are taking charge of your health before somebody has to force you to.</p>
<p>And that matters, especially because 48% of women in this country are already dealing with high blood pressure, and heart disease kills more women than ALL the types of cancer combined!</p>
<p>So while women are afraid of that breast cancer diagnosis, I react the same way to someone telling me they are noticing higher blood pressure numbers or heart palpitations.</p>
<p>It&rsquo;s WAY more serious.</p>
<p>That is not me trying to scare you.</p>
<p>It is actually the opposite.</p>
<p>It means this conversation matters.</p>
<p>Because while you should absolutely care about the hair, the weight, the hormones, the energy, the sleep, and all the things that affect how you feel every day...</p>
<p><strong>you also need to protect the thing that gives you the time to keep dealing with all of it.</strong></p>
<p>Your heart.</p>
<p>Your circulation.</p>
<p>Your life source.</p>
<p>Your future.</p>
<p>So this month, join us to lean into heart health.</p>
<p>It&rsquo;s not your average heart health information.</p>
<p>We are taking it to the next level like we always do. So you can win.</p>
<p>October is Sudden Cardiac Arrest (heart attack) Awareness Month. And while everybody is talking about what to do when the heart stops, I want to spend this month with you talking about the warning signs, numbers, and patterns that show up long before that moment.</p>
<p>Because I want to spend October on the part that happens <strong>BEFORE</strong> the emergency.</p>
<p>The part where you prevent.</p>
<p>The part where you help a family member.</p>
<p>The part where you change the family pattern.</p>
<p>The part where you say:</p>
<p><strong>&ldquo;This may have run in my family, but it does not have to keep running through my family.&rdquo;</strong></p>
<p>This month you have the power to prevent what you can prevent, improve what you can improve, and take back your future.</p>
<p>Because you do not just want to exist. You want to thrive!</p>
<p>You want to overflow with energy.</p>
<p>With presence.</p>
<p>With enough life in you to travel, laugh, work, build, love your people, raise your babies, enjoy your grandchildren, and keep becoming the woman you are supposed to become.</p>
<p>So let me ask you something, because I want to know where I need to start.</p>
<p>Which one is most true for you right now?</p>
<p><strong>A. My blood pressure is high and I do not really understand why.</strong></p>
<p><strong>B. My numbers go up and down and I cannot figure out the pattern.</strong></p>
<p><strong>C. I have a family history of heart disease, stroke, or high blood pressure and I want to prevent it.</strong></p>
<p><strong>D. My numbers are great right now, and I want to keep them that way.</strong></p>
<p>Hit reply with <strong>A, B, C, or D.</strong></p>
<p>That will tell me what I need to talk about first, based on what the most popular response is. Please vote, so that yours becomes popular.</p>
<p>It&rsquo;s going to be an exciting month. I will not JUST cheer you, I will walk with you through it so you can love the girl you&rsquo;re in.</p>
<p>Annie</p>`, email, 'Reply A, B, C or D and I will start where you actually are.'),
    text: (name, email) => `${name},

You know I talk about hormones a lot around here.

The belly that will not move. The chin hair. The thinning hair. The sleep that changed. The exhaustion. The blood sugar. The mood. The things that make you look in the mirror and know your body is not responding the way it used to.

And if you are reading this email, watching my videos, paying attention to symptoms, checking your numbers, asking questions, trying to understand what your body is doing...

You are already doing something most people do not do until much later.

You are paying attention.

You are taking charge of your health before somebody has to force you to.

And that matters, especially because 48% of women in this country are already dealing with high blood pressure, and heart disease kills more women than ALL the types of cancer combined!

So while women are afraid of that breast cancer diagnosis, I react the same way to someone telling me they are noticing higher blood pressure numbers or heart palpitations.

It's WAY more serious.

That is not me trying to scare you.

It is actually the opposite.

It means this conversation matters.

Because while you should absolutely care about the hair, the weight, the hormones, the energy, the sleep, and all the things that affect how you feel every day...

you also need to protect the thing that gives you the time to keep dealing with all of it.

Your heart.

Your circulation.

Your life source.

Your future.

So this month, join us to lean into heart health.

It's not your average heart health information.

We are taking it to the next level like we always do. So you can win.

October is Sudden Cardiac Arrest (heart attack) Awareness Month. And while everybody is talking about what to do when the heart stops, I want to spend this month with you talking about the warning signs, numbers, and patterns that show up long before that moment.

Because I want to spend October on the part that happens BEFORE the emergency.

The part where you prevent.

The part where you help a family member.

The part where you change the family pattern.

The part where you say:

"This may have run in my family, but it does not have to keep running through my family."

This month you have the power to prevent what you can prevent, improve what you can improve, and take back your future.

Because you do not just want to exist. You want to thrive!

You want to overflow with energy.

With presence.

With enough life in you to travel, laugh, work, build, love your people, raise your babies, enjoy your grandchildren, and keep becoming the woman you are supposed to become.

So let me ask you something, because I want to know where I need to start.

Which one is most true for you right now?

A. My blood pressure is high and I do not really understand why.

B. My numbers go up and down and I cannot figure out the pattern.

C. I have a family history of heart disease, stroke, or high blood pressure and I want to prevent it.

D. My numbers are great right now, and I want to keep them that way.

Hit reply with A, B, C, or D.

That will tell me what I need to talk about first, based on what the most popular response is. Please vote, so that yours becomes popular.

It's going to be an exciting month. I will not JUST cheer you, I will walk with you through it so you can love the girl you're in.

Annie
${DISCLAIMER_TEXT(email)}`,
  },
  2: {
    subject: () => "Why your numbers keep moving",
    preheader: "One reading is not the whole story. Here is what to write down.",
    html: (name, email) => wrapHtml(`<p>Have you ever checked your blood pressure and thought:</p><p><strong>"Okay... that's not bad."</strong></p><p>Then checked it another day and thought:</p><p><strong>"Where did THAT come from?"</strong></p><p>That is one of the most frustrating things about blood pressure. You want the number to behave like a grade: good or bad, pass or fail.</p><p>But your body does not work like that.</p><p>Your blood pressure changes because <strong>you are changing all day.</strong></p><p>Maybe you slept differently, had coffee, rushed out the door, argued with somebody, went for a walk, or took your medicine later than usual.</p><p>Maybe you are in perimenopause and sleep suddenly became a completely different experience. Or you are in menopause and your body does not respond to stress, food, or weight exactly like it did ten years ago.</p><p>That is why one reading is not the whole story.</p><p>Think about your weather app.</p><p>One 62-degree day tells you almost nothing about the climate. But if you watch morning and night for a month, you start seeing a pattern.</p><p>Your numbers work a little like that.</p><p>And that is why we are leaning into heart health this month. Not to give you one more thing to worry about, but to help you understand your body <strong>before</strong> a frightening number or emergency forces you to.</p><p>So today, do not try to fix anything.</p><p>Just get curious.</p><p>Next time you check your pressure, write down:</p><ul style="margin:0 0 1em 1.1em;padding:0;"><li style="margin:.3em 0;">the number</li><li style="margin:.3em 0;">the time</li><li style="margin:.3em 0;">how you slept</li><li style="margin:.3em 0;">what happened in the two hours before</li><li style="margin:.3em 0;">how you felt</li></ul><p>If your pressure is already high, you are collecting context. If it bounces around, you are looking for patterns. If heart disease runs in your family, you are learning what to watch.</p><p>And if your numbers look great?</p><p>You are learning what healthy looks like in YOUR body so you can protect it.</p><p>This kind of pattern awareness fits the same basic idea behind evidence-based lifestyle medicine: understand what your body is responding to, then make useful changes instead of throwing everything at it.</p><p>And THAT is the bigger goal.</p><p>Not just prettier numbers.</p><p>Enough health to take the trip, keep up with the people you love, and live without wondering what your body is going to do next.</p><p>Tomorrow I want to talk about a sentence that quietly steals hope from a lot of women:</p><p><strong>"Everybody in my family has it."</strong></p><p>You may not control every card you were handed.</p><p>But you can learn how to play your hand differently.</p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "One reading is not the whole story. Here is what to write down."),
    text: (name, email) => `Have you ever checked your blood pressure and thought:

"Okay... that's not bad."

Then checked it another day and thought:

"Where did THAT come from?"

That is one of the most frustrating things about blood pressure. You want the number to behave like a grade: good or bad, pass or fail.

But your body does not work like that.

Your blood pressure changes because you are changing all day.

Maybe you slept differently, had coffee, rushed out the door, argued with somebody, went for a walk, or took your medicine later than usual.

Maybe you are in perimenopause and sleep suddenly became a completely different experience. Or you are in menopause and your body does not respond to stress, food, or weight exactly like it did ten years ago.

That is why one reading is not the whole story.

Think about your weather app.

One 62-degree day tells you almost nothing about the climate. But if you watch morning and night for a month, you start seeing a pattern.

Your numbers work a little like that.

And that is why we are leaning into heart health this month. Not to give you one more thing to worry about, but to help you understand your body before a frightening number or emergency forces you to.

So today, do not try to fix anything.

Just get curious.

Next time you check your pressure, write down:

- the number
- the time
- how you slept
- what happened in the two hours before
- how you felt

If your pressure is already high, you are collecting context. If it bounces around, you are looking for patterns. If heart disease runs in your family, you are learning what to watch.

And if your numbers look great?

You are learning what healthy looks like in YOUR body so you can protect it.

This kind of pattern awareness fits the same basic idea behind evidence-based lifestyle medicine: understand what your body is responding to, then make useful changes instead of throwing everything at it.

And THAT is the bigger goal.

Not just prettier numbers.

Enough health to take the trip, keep up with the people you love, and live without wondering what your body is going to do next.

Tomorrow I want to talk about a sentence that quietly steals hope from a lot of women:

"Everybody in my family has it."

You may not control every card you were handed.

But you can learn how to play your hand differently.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
  3: {
    subject: () => "\"It just runs in my family\"",
    preheader: "Family history is not a diagnosis. It is information.",
    html: (name, email) => wrapHtml(`<p><strong>"High blood pressure just runs in my family."</strong></p><p>I hear that sentence all the time.</p><p>Mom had it. Dad had it. Grandma had a stroke. Your sisters are on medicine.</p><p>After seeing enough of that, the ending can start feeling like it has already been written for you.</p><p>But family history is not a diagnosis.</p><p>It is information.</p><p>Important information.</p><p>It can tell you where to pay closer attention and what you may want to understand earlier than the generation before you did.</p><p>And sometimes that is exactly how the family story changes.</p><p>Not because one woman got lucky, but because one woman started paying attention sooner.</p><p>Maybe that is you.</p><p>Maybe you noticed your pressure changing around the same time your sleep changed, your blood sugar started moving, your weight settled differently, or your hormones began shifting.</p><p>Maybe perimenopause made you realize the old rules do not explain everything anymore.</p><p>That is not a reason to panic.</p><p>It is a reason to get smarter about your body.</p><p>Because the real question is not:</p><p><strong>"Am I destined to get this?"</strong></p><p>It is:</p><p><strong>"What can I understand now that maybe nobody in my family understood then?"</strong></p><p>That is where prevention starts.</p><p>And this is why October matters.</p><p>We can talk about heart emergencies after they happen, but I would much rather help you build the kind of life that supports your health before you ever get there.</p><p>Movement. Sleep. Food that supports you. Stress management. Connection. Knowing your numbers.</p><p>Those are not random wellness tips. They are core parts of evidence-based lifestyle medicine for a reason.</p><p>And when you normalize those things, you are not just changing your own routine. You may be changing the language of your family.</p><p>Maybe the new sentence becomes:</p><p><strong>"In our family, we pay attention early."</strong></p><p><strong>"We check our numbers."</strong></p><p><strong>"We do not wait until something breaks."</strong></p><p>Tomorrow I want to show you one clue your cuff may already be giving you that most people completely miss.</p><p><strong>You may not have come from a healthy family. But a healthier family can come from you.</strong></p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "Family history is not a diagnosis. It is information."),
    text: (name, email) => `"High blood pressure just runs in my family."

I hear that sentence all the time.

Mom had it. Dad had it. Grandma had a stroke. Your sisters are on medicine.

After seeing enough of that, the ending can start feeling like it has already been written for you.

But family history is not a diagnosis.

It is information.

Important information.

It can tell you where to pay closer attention and what you may want to understand earlier than the generation before you did.

And sometimes that is exactly how the family story changes.

Not because one woman got lucky, but because one woman started paying attention sooner.

Maybe that is you.

Maybe you noticed your pressure changing around the same time your sleep changed, your blood sugar started moving, your weight settled differently, or your hormones began shifting.

Maybe perimenopause made you realize the old rules do not explain everything anymore.

That is not a reason to panic.

It is a reason to get smarter about your body.

Because the real question is not:

"Am I destined to get this?"

It is:

"What can I understand now that maybe nobody in my family understood then?"

That is where prevention starts.

And this is why October matters.

We can talk about heart emergencies after they happen, but I would much rather help you build the kind of life that supports your health before you ever get there.

Movement. Sleep. Food that supports you. Stress management. Connection. Knowing your numbers.

Those are not random wellness tips. They are core parts of evidence-based lifestyle medicine for a reason.

And when you normalize those things, you are not just changing your own routine. You may be changing the language of your family.

Maybe the new sentence becomes:

"In our family, we pay attention early."

"We check our numbers."

"We do not wait until something breaks."

Tomorrow I want to show you one clue your cuff may already be giving you that most people completely miss.

You may not have come from a healthy family. But a healthier family can come from you.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
  4: {
    subject: () => "Your cuff is not a judge",
    preheader: "One sentence to add every time you check.",
    html: (name, email) => wrapHtml(`<p>Most people use a blood pressure cuff like a judge.</p><p>Put it on. Wait. Look at the number.</p><p>Good or bad?</p><p>But what if the cuff is more useful as a <strong>detective</strong>?</p><p>Because the number itself is only part of the clue. The interesting part is what was happening around it.</p><p>Maybe your pressure is higher after a bad night of sleep or looks different after coffee. Maybe it is lower after your walk but rises on the days you are rushing.</p><p>Maybe your morning and evening numbers are consistently different.</p><p>Or maybe you started noticing changes during perimenopause, around the same time your sleep, stress, weight, or blood sugar started changing too.</p><p>The point is not to turn yourself into a science project.</p><p>The point is to stop throwing away useful information.</p><p>So here is your experiment for the next 24 hours.</p><p>Every time you check your pressure, add one sentence:</p><p><strong>"The two hours before this looked like..."</strong></p><p>Then finish it.</p><p>That's it.</p><p>You may start seeing something. And even if you do not see a pattern immediately, you are training yourself to ask a much better question than:</p><p><strong>"Is this number bad?"</strong></p><p>The better question is:</p><p><strong>"What is my body responding to?"</strong></p><p>That question works whether your pressure is high, inconsistent, your family history has you paying attention early, or your numbers are great and you want to keep them that way.</p><p>It also works far beyond blood pressure.</p><p>Why did your sleep change? Why did the belly weight show up? Why did your blood sugar shift? Why does your body feel different now than it did before menopause?</p><p>Your body leaves clues.</p><p>Most people have simply never been taught how to look for them.</p><p>And that is the point of all of this: the more clues you understand now, the less helpless you have to feel later.</p><p>You can walk into your next appointment knowing what you noticed instead of trying to remember how you felt three weeks ago. You can stop treating every new symptom as if it came out of nowhere and begin seeing your body as something you can work WITH again.</p><p>Imagine how different that feels.</p><p>Not standing in the bathroom mirror wondering what happened to you. Not jumping to the next random thing because somebody online said it worked for them.</p><p>Instead, you start recognizing your own patterns.</p><p>You start trusting yourself again.</p><p>That is what taking charge of your health can look like.</p><p>I am putting together a live class because some of these connections are much easier to SEE than explain in an email.</p><p>I'll send you the registration link in a couple of days.</p><p>For now, keep collecting clues.</p><p><strong>Your body is not trying to confuse you. You may just be learning its language again.</strong></p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "One sentence to add every time you check."),
    text: (name, email) => `Most people use a blood pressure cuff like a judge.

Put it on. Wait. Look at the number.

Good or bad?

But what if the cuff is more useful as a detective?

Because the number itself is only part of the clue. The interesting part is what was happening around it.

Maybe your pressure is higher after a bad night of sleep or looks different after coffee. Maybe it is lower after your walk but rises on the days you are rushing.

Maybe your morning and evening numbers are consistently different.

Or maybe you started noticing changes during perimenopause, around the same time your sleep, stress, weight, or blood sugar started changing too.

The point is not to turn yourself into a science project.

The point is to stop throwing away useful information.

So here is your experiment for the next 24 hours.

Every time you check your pressure, add one sentence:

"The two hours before this looked like..."

Then finish it.

That's it.

You may start seeing something. And even if you do not see a pattern immediately, you are training yourself to ask a much better question than:

"Is this number bad?"

The better question is:

"What is my body responding to?"

That question works whether your pressure is high, inconsistent, your family history has you paying attention early, or your numbers are great and you want to keep them that way.

It also works far beyond blood pressure.

Why did your sleep change? Why did the belly weight show up? Why did your blood sugar shift? Why does your body feel different now than it did before menopause?

Your body leaves clues.

Most people have simply never been taught how to look for them.

And that is the point of all of this: the more clues you understand now, the less helpless you have to feel later.

You can walk into your next appointment knowing what you noticed instead of trying to remember how you felt three weeks ago. You can stop treating every new symptom as if it came out of nowhere and begin seeing your body as something you can work WITH again.

Imagine how different that feels.

Not standing in the bathroom mirror wondering what happened to you. Not jumping to the next random thing because somebody online said it worked for them.

Instead, you start recognizing your own patterns.

You start trusting yourself again.

That is what taking charge of your health can look like.

I am putting together a live class because some of these connections are much easier to SEE than explain in an email.

I'll send you the registration link in a couple of days.

For now, keep collecting clues.

Your body is not trying to confuse you. You may just be learning its language again.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
  5: {
    subject: () => "You only have one body",
    preheader: "Your blood pressure and your hormones are not separate problems.",
    html: (name, email) => wrapHtml(`<p>You only have one body.</p><p>I know that sounds obvious, but look at how health gets talked about.</p><p>Your blood pressure goes in one box. Your hormones go in another. Blood sugar gets its own conversation, while sleep, weight, and stress each become another separate problem to "fix."</p><p>Pretty soon, you are carrying six different problems around.</p><p>But the woman waking up at 3:00 AM is the same woman checking her blood pressure at 8:00.</p><p>The woman whose hormones are changing is the same woman noticing her belly changed. The woman whose blood sugar is creeping up is the same woman wondering why her energy disappeared.</p><p>And the woman carrying everybody else's stress is the same woman whose heart and blood vessels are carrying her through the day.</p><p><strong>One body. Many signals.</strong></p><p>That does not mean every symptom has the same cause. It means the pieces deserve to be looked at together.</p><p>This is especially important in perimenopause and menopause because this season can involve changes in sleep, body composition, cholesterol, blood sugar, stress response, and cardiovascular risk.</p><p>So if your body seems to be "changing the rules," you are not crazy for noticing it.</p><p>And you do not need to chase every symptom separately.</p><p>You need to understand the bigger picture.</p><p>That is why Menopause Month matters to me too. Menopause deserves a bigger conversation than hot flashes.</p><p>Because the woman who wants her hair back, wants the belly to move, wants to sleep through the night, and wants her energy back also needs enough cardiovascular health to enjoy those wins when they come.</p><p>The point is not just to look better in the dress.</p><p>Although yes, I want you to put the dress on and LOVE the girl wearing it.</p><p>The point is having enough life in you to actually go somewhere in that dress.</p><p>Dance. Travel. Laugh with the friends you have been avoiding because you have not felt like yourself.</p><p>Come home with enough energy left to enjoy your husband.</p><p>Be present with your daughter instead of distracted by how tired or uncomfortable you feel in your own body.</p><p>THAT is why the pieces matter.</p><p>That is what I want to start showing you in the live class.</p><p>Not another list of foods. Not another "just lose weight." Not another generic lecture about salt.</p><p>I want to help you understand why your numbers may be changing, what else may be connected, and how to think through what deserves your attention first.</p><p>If you want to join me live:</p><p style="text-align:center;margin:26px 0;"><a href="https://restoreherhormones.com/masterclass" style="display:inline-block;background:#ecd88d;color:#1f1a16;text-decoration:none;font-weight:800;padding:15px 32px;border-radius:999px;">REGISTER HERE &rarr;</a></p><p>Your body changing does not mean your best years are behind you.</p><p><strong>You can learn the new rules and still become the woman who feels good in her own life again.</strong></p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "Your blood pressure and your hormones are not separate problems."),
    text: (name, email) => `You only have one body.

I know that sounds obvious, but look at how health gets talked about.

Your blood pressure goes in one box. Your hormones go in another. Blood sugar gets its own conversation, while sleep, weight, and stress each become another separate problem to "fix."

Pretty soon, you are carrying six different problems around.

But the woman waking up at 3:00 AM is the same woman checking her blood pressure at 8:00.

The woman whose hormones are changing is the same woman noticing her belly changed. The woman whose blood sugar is creeping up is the same woman wondering why her energy disappeared.

And the woman carrying everybody else's stress is the same woman whose heart and blood vessels are carrying her through the day.

One body. Many signals.

That does not mean every symptom has the same cause. It means the pieces deserve to be looked at together.

This is especially important in perimenopause and menopause because this season can involve changes in sleep, body composition, cholesterol, blood sugar, stress response, and cardiovascular risk.

So if your body seems to be "changing the rules," you are not crazy for noticing it.

And you do not need to chase every symptom separately.

You need to understand the bigger picture.

That is why Menopause Month matters to me too. Menopause deserves a bigger conversation than hot flashes.

Because the woman who wants her hair back, wants the belly to move, wants to sleep through the night, and wants her energy back also needs enough cardiovascular health to enjoy those wins when they come.

The point is not just to look better in the dress.

Although yes, I want you to put the dress on and LOVE the girl wearing it.

The point is having enough life in you to actually go somewhere in that dress.

Dance. Travel. Laugh with the friends you have been avoiding because you have not felt like yourself.

Come home with enough energy left to enjoy your husband.

Be present with your daughter instead of distracted by how tired or uncomfortable you feel in your own body.

THAT is why the pieces matter.

That is what I want to start showing you in the live class.

Not another list of foods. Not another "just lose weight." Not another generic lecture about salt.

I want to help you understand why your numbers may be changing, what else may be connected, and how to think through what deserves your attention first.

If you want to join me live:

REGISTER HERE: https://restoreherhormones.com/masterclass

Your body changing does not mean your best years are behind you.

You can learn the new rules and still become the woman who feels good in her own life again.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
  6: {
    subject: () => "\"Just reduce your stress.\" Thanks. Very helpful.",
    preheader: "Your body hears your stress too.",
    html: (name, email) => wrapHtml(`<p>"Just reduce your stress."</p><p>Great. Very helpful.</p><p>If stress disappeared because somebody told you to stop having it, everybody would be healed by Tuesday.</p><p>But there is something important hiding underneath that bad advice:</p><p><strong>Your body hears your stress too.</strong></p><p>Someone scares you and your heart speeds up before you even think about it. You get angry and your muscles tighten. You rush through the house trying to get somewhere and your breathing changes.</p><p>Your body responds.</p><p>That system is supposed to protect you. The problem is when your body keeps getting the message that something is chasing you all day long.</p><p>Bills. Work. Caring for everybody else. Bad sleep. Worry. Family. Your phone. The conversation you keep replaying.</p><p>Then add perimenopause or menopause on top of it.</p><p>Maybe your sleep is already disrupted. Maybe anxiety feels different. Maybe hot flashes are waking you up, or your weight and blood sugar are changing.</p><p>Your body does not put all of those things into separate folders.</p><p>It responds to the whole environment.</p><p>And this is why I do not want heart health to become another item on your to-do list this month.</p><p>This is about building a life your body can actually thrive inside: better sleep, more movement, real food, connection, time outside, and learning how to come down from stress instead of living permanently revved up.</p><p>These are simple things.</p><p>But simple does not mean powerless.</p><p>So try something today.</p><p>Before your next blood pressure reading, do not grab the cuff while you are moving around. Sit down, put your feet on the floor, let your shoulders drop, take a few slow breaths, and give yourself a few quiet minutes.</p><p>Then check.</p><p>This is not a "breathing cure" for high blood pressure.</p><p>It is an experiment.</p><p>You are learning how the conditions around the number can matter.</p><p>Whether you are trying to bring high numbers down, understand why they move, prevent what runs in your family, or protect the good health you already have, you need to know what your body responds to.</p><p>Because you are building more than a better blood pressure reading.</p><p>You are building the capacity to enjoy your own life.</p><p>To stop being the woman who is too tired to go, too overwhelmed to enjoy the evening, or too depleted to be present with the people she loves.</p><p>You deserve enough energy left at the end of the day for YOU.</p><p>Tonight we are going deeper into this live.</p><p style="text-align:center;margin:26px 0;"><a href="https://restoreherhormones.com/masterclass" style="display:inline-block;background:#ecd88d;color:#1f1a16;text-decoration:none;font-weight:800;padding:15px 32px;border-radius:999px;">REGISTER HERE &rarr;</a></p><p>You do not have to eliminate every stressful thing from your life.</p><p><strong>But you can stop letting stress be the only thing your body hears.</strong></p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "Your body hears your stress too."),
    text: (name, email) => `"Just reduce your stress."

Great. Very helpful.

If stress disappeared because somebody told you to stop having it, everybody would be healed by Tuesday.

But there is something important hiding underneath that bad advice:

Your body hears your stress too.

Someone scares you and your heart speeds up before you even think about it. You get angry and your muscles tighten. You rush through the house trying to get somewhere and your breathing changes.

Your body responds.

That system is supposed to protect you. The problem is when your body keeps getting the message that something is chasing you all day long.

Bills. Work. Caring for everybody else. Bad sleep. Worry. Family. Your phone. The conversation you keep replaying.

Then add perimenopause or menopause on top of it.

Maybe your sleep is already disrupted. Maybe anxiety feels different. Maybe hot flashes are waking you up, or your weight and blood sugar are changing.

Your body does not put all of those things into separate folders.

It responds to the whole environment.

And this is why I do not want heart health to become another item on your to-do list this month.

This is about building a life your body can actually thrive inside: better sleep, more movement, real food, connection, time outside, and learning how to come down from stress instead of living permanently revved up.

These are simple things.

But simple does not mean powerless.

So try something today.

Before your next blood pressure reading, do not grab the cuff while you are moving around. Sit down, put your feet on the floor, let your shoulders drop, take a few slow breaths, and give yourself a few quiet minutes.

Then check.

This is not a "breathing cure" for high blood pressure.

It is an experiment.

You are learning how the conditions around the number can matter.

Whether you are trying to bring high numbers down, understand why they move, prevent what runs in your family, or protect the good health you already have, you need to know what your body responds to.

Because you are building more than a better blood pressure reading.

You are building the capacity to enjoy your own life.

To stop being the woman who is too tired to go, too overwhelmed to enjoy the evening, or too depleted to be present with the people she loves.

You deserve enough energy left at the end of the day for YOU.

Tonight we are going deeper into this live.

REGISTER HERE: https://restoreherhormones.com/masterclass

You do not have to eliminate every stressful thing from your life.

But you can stop letting stress be the only thing your body hears.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
  7: {
    subject: () => "What if you are doing the right things in the wrong order?",
    preheader: "The faucet is still running. Monday we find it.",
    html: (name, email) => wrapHtml(`<p><strong>What if you're doing the right things in the wrong order?</strong></p><p>Drink more water. Walk more. Eat better. Cut the salt. Lose weight. Sleep. Manage stress. Take your medicine. Take magnesium. Eat more vegetables.</p><p>You have probably heard most of that before.</p><p>And here is the frustrating part:</p><p>A lot of it is GOOD advice.</p><p>So why can you do so many right things and still feel like your body is not giving you the result you expected?</p><p>Maybe your pressure is still high or unpredictable.</p><p>Maybe everything looks okay now, but you are watching closely because heart disease runs through your family.</p><p>Maybe perimenopause or menopause came along and suddenly your sleep, weight, blood sugar, energy, and numbers started behaving differently.</p><p>That does not automatically mean you are doing something wrong.</p><p>Sometimes the missing question is:</p><p><strong>"What needs my attention FIRST?"</strong></p><p>Imagine your kitchen sink is overflowing.</p><p>Water is everywhere, so you grab towels, mop the floor, move the chairs, and put down a bucket.</p><p>All useful things.</p><p>But if the faucet is still running, you are going to work very hard and still have a wet floor.</p><p>Health can feel like that.</p><p>You are doing useful things, but nobody helped you figure out where YOUR water is coming from.</p><p>That is the question I want to help you answer.</p><p>Not:</p><p>"What else should I add?"</p><p>But:</p><p><strong>"What is driving my pattern, and what deserves my attention first?"</strong></p><p>And THAT is the bigger reason for everything we have been talking about this month.</p><p>You do not need another pile of health information. You need enough understanding to make the information useful, enough understanding to stop guessing, and enough understanding to make your next move with confidence.</p><p>Because the goal is not to spend the next twenty years thinking about your health all day.</p><p>The goal is to build enough health that you can go LIVE.</p><p>Take the trip. Wear the dress. Say yes when your friends invite you out.</p><p>Have energy for your marriage. Be present for your children. Hold the grandbaby. Build the business. Serve at church.</p><p>Sit on the beach.</p><p>Laugh hard.</p><p>And not have your body be the first thing you think about every morning.</p><p>That is what we are unpacking live.</p><p><strong>The 4 Biggest Mistakes</strong><br><strong>Tonight at 6:00 PM Central, 7:00 PM Eastern</strong></p><p>I am going to show you:</p><ul style="margin:0 0 1em 1.1em;padding:0;"><li style="margin:.3em 0;">why blood pressure can keep changing even when you are trying to do the right things</li><li style="margin:.3em 0;">why family history matters without becoming your destiny</li><li style="margin:.3em 0;">where menopause and hormone changes fit into the bigger cardiovascular picture</li><li style="margin:.3em 0;">why one healthy plan can work differently in two different bodies</li><li style="margin:.3em 0;">and how to start figuring out what YOUR body may be asking for first</li></ul><p>There are pieces I have deliberately not tried to teach through email because they make much more sense when you can see them together.</p><p>That is what tonight is for.</p><p>Already registered? You are good.</p><p>If not:</p><p style="text-align:center;margin:26px 0;"><a href="https://restoreherhormones.com/masterclass" style="display:inline-block;background:#ecd88d;color:#1f1a16;text-decoration:none;font-weight:800;padding:15px 32px;border-radius:999px;">REGISTER HERE &rarr;</a></p><p>Come if your pressure is high, if it moves around, if your family history worries you, or if menopause changed your body and you want to understand what is happening.</p><p>And come if your numbers are great and you intend to keep them that way.</p><p>You do not have to wait for an emergency before you become a student of your own body.</p><p>You can learn while you still have choices.</p><p>And maybe this is the month the story starts changing.</p><p><strong>You were not given all these years just to exist through them. You are allowed to feel alive in them.</strong></p><p>Take Charge of your health. I'm Cheering for you!</p><p>Everyday Nurse Annie<br>(p.s Love The Girl You're In)</p>`, email, "The faucet is still running. Monday we find it."),
    text: (name, email) => `What if you're doing the right things in the wrong order?

Drink more water. Walk more. Eat better. Cut the salt. Lose weight. Sleep. Manage stress. Take your medicine. Take magnesium. Eat more vegetables.

You have probably heard most of that before.

And here is the frustrating part:

A lot of it is GOOD advice.

So why can you do so many right things and still feel like your body is not giving you the result you expected?

Maybe your pressure is still high or unpredictable.

Maybe everything looks okay now, but you are watching closely because heart disease runs through your family.

Maybe perimenopause or menopause came along and suddenly your sleep, weight, blood sugar, energy, and numbers started behaving differently.

That does not automatically mean you are doing something wrong.

Sometimes the missing question is:

"What needs my attention FIRST?"

Imagine your kitchen sink is overflowing.

Water is everywhere, so you grab towels, mop the floor, move the chairs, and put down a bucket.

All useful things.

But if the faucet is still running, you are going to work very hard and still have a wet floor.

Health can feel like that.

You are doing useful things, but nobody helped you figure out where YOUR water is coming from.

That is the question I want to help you answer.

Not:

"What else should I add?"

But:

"What is driving my pattern, and what deserves my attention first?"

And THAT is the bigger reason for everything we have been talking about this month.

You do not need another pile of health information. You need enough understanding to make the information useful, enough understanding to stop guessing, and enough understanding to make your next move with confidence.

Because the goal is not to spend the next twenty years thinking about your health all day.

The goal is to build enough health that you can go LIVE.

Take the trip. Wear the dress. Say yes when your friends invite you out.

Have energy for your marriage. Be present for your children. Hold the grandbaby. Build the business. Serve at church.

Sit on the beach.

Laugh hard.

And not have your body be the first thing you think about every morning.

That is what we are unpacking live.

The 4 Biggest Mistakes
Tonight at 6:00 PM Central, 7:00 PM Eastern

I am going to show you:

- why blood pressure can keep changing even when you are trying to do the right things
- why family history matters without becoming your destiny
- where menopause and hormone changes fit into the bigger cardiovascular picture
- why one healthy plan can work differently in two different bodies
- and how to start figuring out what YOUR body may be asking for first

There are pieces I have deliberately not tried to teach through email because they make much more sense when you can see them together.

That is what tonight is for.

Already registered? You are good.

If not:

REGISTER HERE: https://restoreherhormones.com/masterclass

Come if your pressure is high, if it moves around, if your family history worries you, or if menopause changed your body and you want to understand what is happening.

And come if your numbers are great and you intend to keep them that way.

You do not have to wait for an emergency before you become a student of your own body.

You can learn while you still have choices.

And maybe this is the month the story starts changing.

You were not given all these years just to exist through them. You are allowed to feel alive in them.

Take Charge of your health. I'm Cheering for you!

Everyday Nurse Annie
(p.s Love The Girl You're In)
${DISCLAIMER_TEXT(email)}`,
  },
};

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function loadUnsubSet() {
  const resend = getResend();
  const set = new Set();
  let after;
  for (;;) {
    const { data, error } = await resend.contacts.list({ audienceId: UNSUB_AUDIENCE_ID, limit: 100, ...(after ? { after } : {}) });
    if (error) throw new Error('suppression list unavailable: ' + error.message);
    const items = data?.data || [];
    for (const c of items) set.add(String(c.email).toLowerCase());
    if (!data?.has_more || items.length === 0) break;
    after = items[items.length - 1].id;
  }
  return set;
}

function todayChicago() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}


// Current coaching clients never receive a bulk send. Do not rely on
// state === 'tier-4' for this: an /allin purchase writes state:'buyer', so
// the tier check silently matches nobody. On 2026-09-28 that is how 13
// clients were emailed an offer for the program they were already paying
// for. The bwbp:allin:* key space is the roster, and this load fails closed.
async function loadCoachingClients() {
  const emails = new Set();
  let cursor = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'bwbp:allin:*', count: 500 });
    cursor = next;
    for (const k of batch) {
      if (k.startsWith('bwbp:allindone:')) continue;
      emails.add(k.slice('bwbp:allin:'.length).trim().toLowerCase());
    }
  } while (String(cursor) !== '0');
  if (!emails.size) throw new Error('coaching-client exclusion list came back empty; refusing to send');
  return emails;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![1, 2, 3, 4, 5, 6, 7].includes(emailNum)) return res.status(400).json({ error: 'pass ?email=1-7' });
  const template = EMAILS[emailNum];
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
  if (cronMode && todayChicago() !== fireDate) {
    return res.status(200).json({ ok: true, skipped: 'cron date guard', today: todayChicago(), fireDate, emailNum });
  }
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-HEART-${emailNum}`;
  const sendMode = cronMode || manualSend;

  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const segment = (await kv.hgetall(SEGMENT_KEY)) || {};
  const emails = Object.keys(segment);
  if (emails.length === 0) return res.status(500).json({ error: 'segment empty — run scripts/load-annie-masterclass-segment-2026-09-14.mjs' });

  let unsub;
  try { unsub = await loadUnsubSet(); }
  catch (err) { return res.status(500).json({ error: err.message }); } // never send without the suppression list

  // Never-send guard (2026-10-07): Accelerator roster + bwbp:allin:* + Stripe
  // coaching payers + bwbp:neversend + Resend unsubscribes, built fresh per run.
  // Fails closed: if the list cannot be built, nothing sends.
  let guard;
  try { guard = await neverSendGuard(); }
  catch (err) { return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message }); }

  const alreadySentList = await kv.smembers(SENT_SET);
  const alreadySent = new Set((alreadySentList || []).map((e) => String(e).toLowerCase()));

  const stats = { segment: emails.length, unsub: 0, neverSend: 0, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;

  for (const email of emails) {
    if (unsub.has(email)) { stats.unsub++; continue; }
    if (guard.blocks(email)) { stats.neverSend++; continue; }
    if (alreadySent.has(email)) { stats.alreadySent++; continue; }
    if (coachingClients.has(String(email).trim().toLowerCase())) { stats.coachingClient = (stats.coachingClient || 0) + 1; continue; }
    stats.eligible++;
    const name = (segment[email] || '').trim() || 'there';
    const subject = template.subject(name);

    if (!sendMode) {
      if (samples.length < 3) samples.push({ email, firstName: segment[email] || null, subject, text: template.text(name, email) });
      continue;
    }
    if (Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }
    try {
      await resend.emails.send({
        from: FROM, to: email, replyTo: REPLY_TO, subject,
        html: template.html(name, email), text: template.text(name, email),
        headers: { 'List-Unsubscribe': `<${unsubUrl(email)}>` },
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, email); } catch (err) { console.warn('annie-mc: sadd failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log('[annie-masterclass-broadcast]', JSON.stringify({ emailNum, mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN', stats, results: sendMode ? results : undefined }));
  return res.status(200).json({
    ok: true, emailNum,
    mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN',
    from: FROM, stats,
    ...guard.report(),
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
