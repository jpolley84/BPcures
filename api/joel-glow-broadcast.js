// api/joel-heart-month-broadcast.js - October heart-health opener, Joel's list.
//
// One email, no offer and no lead magnet, on Joel's explicit instruction
// 2026-10-04: the whole ask is a one-letter reply (A/B/C/D) that decides what
// he teaches first. A link would compete with the vote, and a pure reply-ask
// lifts deliverability for everything sent after it.
//
// Audience: drip:* + bwbp:drip:* minus unsubscribed, paused, and current
// coaching clients (state === 'tier-4'). Joel confirmed clients are excluded.
//
// Cloned from api/joel-masterclass-broadcast.js. Everything below the EMAILS
// block is that file byte for byte, because that scan/resume/cron-guard code
// moved 10,999 emails with zero failures on 2026-09-14. Only the constants
// and the copy changed.
//
// Scheduled: 2026-10-05 08:00 America/New_York = 12:00 UTC.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { neverSendGuard } from './_never_send.js';

const REGISTER_URL = 'https://bpquiz.com/masterclass/v3/';
// ARMED 2026-10-05 on Joel's go after he read both dry runs.
// Guard compares this to today's date in America/Chicago. Fires at
// 12:00 UTC = 08:00 America/New_York = 07:00 America/Chicago, so the
// date matches on every window in vercel.json and on no other day.
// Per-email fire dates, America/Chicago. Option 1 schedule Joel
// approved 2026-10-06: Fri 10-09 and Sat 10-10 are rest days, and
// Day 6 + Day 7 both land on class day 10-12.

const FIRE_DATES = {"1": "2026-10-21", "2": "2026-10-22", "3": "2026-10-23", "4": "2026-10-23", "5": "2026-10-25", "6": "2026-10-26", "7": "2026-10-26", "8": "2026-10-26", "9": "2026-10-27", "10": "2026-10-27", "11": "2026-10-27"};
const CRON_FIRE_DATE = '2026-10-21';
const RATE_LIMIT_MS = 70;
const MAX_RUN_MS = Number(process.env.GLOW_MAX_RUN_MS || 250 * 1000);
const SENT_FLAG_PREFIX = 'joelGlowOct26'; // + emailNum, e.g. joelMcInvite1Sent
const SENT_SET_PREFIX = 'joelglow:sent:'; // + emailNum

// 2026-10-19: buyers type their own names at checkout, so the store holds
// "MAMIE", "Shirley." and the occasional handle. Printing those verbatim in a
// greeting reads as shouting or as a mistake, so normalise before rendering.
function tidyName(raw) {
  const s = String(raw || '').trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  if (!s) return 'there';
  const first = s.split(/\s+/)[0];
  if (!/^[\p{L}][\p{L}'\-]*$/u.test(first)) return 'there';
  if (first.length < 2) return 'there';
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return first;
}

function unsubUrl(email) {
  return `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;
}

function disclaimerHtml(email) {
  const safeUnsub = unsubUrl(email);
  return `<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
    BraveWorks RN &middot; Joel Polley, RN &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a><br />
    Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.<br />
    <a href="${safeUnsub}" style="color:#9A9A9A;">Unsubscribe</a> &middot; You're on the BraveWorks RN list at ${escapeHtml(email)}.
  </p>`;
}

function disclaimerText(email) {
  return `---
BraveWorks RN · Joel Polley, RN · bpquiz.com
Educational content only. Not medical advice. Always complement — never replace — care from your physician.
Unsubscribe: ${unsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;
}

function wrapHtml(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);"><tr><td style="padding:30px 28px;font-size:15px;line-height:1.65;color:#2C3E50;">
${bodyHtml}
${disclaimerHtml(email)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const EMAILS = {
  1: {
    subject: "A woman wrote to us at 4 in the morning",
    preheader: "She looked at something she had been avoiding.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p><strong>An email came in the dead of the night.</strong></p><p>I read it at 4:03 AM and answered it before Annie ever saw it.</p><p>Here's the backstory.</p><p>We had just finished Day 1 of our live Change My Life Challenge.</p><p>And later that night, a woman wrote to us flustered.</p><p>She was in angst because an exercise we did in class, plus the homework, made her stop and look at things she had not really wanted to face.</p><p>Not another diet.</p><p>Not another workout.</p><p>Not another long list of things to do.</p><p>Just a simple exercise designed to help people find the stuck points that have been keeping them stuck.</p><p>And THAT was the hard part. Because sometimes seeing the boulders that have us trapped is the most difficult part of the whole thing.</p><p>Can I be honest with you?</p><p>Recently Annie and I joined a coaching group for 23,000 for the year, because even coaches need coaches.</p><p>At some point I thought, have we made a mistake?</p><p>There is nothing tangible in it. It is not like what we do, where we coach somebody to get their blood pressure down and as a side effect the diabetes improves, the weight comes off, the hormones settle.</p><p>Research says getting your blood pressure under control can add an average of 5 good years to your life. That is priceless.</p><p>But the truth is, investing in myself at that level left me feeling exactly like the woman who wrote that email. Flustered, looking straight at <strong>everything</strong> that still needs work.</p><p>Maybe you know that feeling.</p><p>The holidays are coming.</p><p><em>Life is happening.</em></p><p>Everybody needs something from you.</p><p>You are tired.</p><p>And before you know it, you are making that same promise to yourself all over again.</p><p>"I'll deal with all of it after this season is over."</p><p>But what if the answer is not simply trying harder?</p><p><strong>What if part of moving forward is finally understanding what has been holding you back?</strong></p><p>Maybe your hair, your skin, your weight, or your sleep changed too.</p><p>None of that means your story is over.</p><p>You still have a whole life to live.</p><p>So think about something tonight.</p><p><strong>If you could feel different in just ONE area of your life before this year ends, what would it be?</strong></p><p>Because the person you were built to be still has dreams, plans, and a lot of living left to do.</p><p>Do yourself a favor today and do one kind thing for yourself. You are worth it.</p><p>I'm cheering for you.</p><p>Joel Polley, RN</p><p>P.S. Sometimes the biggest change starts with one question you finally give yourself permission to answer.</p>`, "She looked at something she had been avoiding.", email),
    text: (name, email) => `Hey ${name},

An email came in the dead of the night.

I read it at 4:03 AM and answered it before Annie ever saw it.

Here's the backstory.

We had just finished Day 1 of our live Change My Life Challenge.

And later that night, a woman wrote to us flustered.

She was in angst because an exercise we did in class, plus the homework, made her stop and look at things she had not really wanted to face.

Not another diet.

Not another workout.

Not another long list of things to do.

Just a simple exercise designed to help people find the stuck points that have been keeping them stuck.

And THAT was the hard part. Because sometimes seeing the boulders that have us trapped is the most difficult part of the whole thing.

Can I be honest with you?

Recently Annie and I joined a coaching group for 23,000 for the year, because even coaches need coaches.

At some point I thought, have we made a mistake?

There is nothing tangible in it. It is not like what we do, where we coach somebody to get their blood pressure down and as a side effect the diabetes improves, the weight comes off, the hormones settle.

Research says getting your blood pressure under control can add an average of 5 good years to your life. That is priceless.

But the truth is, investing in myself at that level left me feeling exactly like the woman who wrote that email. Flustered, looking straight at everything that still needs work.

Maybe you know that feeling.

The holidays are coming.

Life is happening.

Everybody needs something from you.

You are tired.

And before you know it, you are making that same promise to yourself all over again.

"I'll deal with all of it after this season is over."

But what if the answer is not simply trying harder?

What if part of moving forward is finally understanding what has been holding you back?

Maybe your hair, your skin, your weight, or your sleep changed too.

None of that means your story is over.

You still have a whole life to live.

So think about something tonight.

If you could feel different in just ONE area of your life before this year ends, what would it be?

Because the person you were built to be still has dreams, plans, and a lot of living left to do.

Do yourself a favor today and do one kind thing for yourself. You are worth it.

I'm cheering for you.

Joel Polley, RN

P.S. Sometimes the biggest change starts with one question you finally give yourself permission to answer.`,
  },
  2: {
    subject: "The version of you that you miss",
    preheader: "You do not have to be 25 again.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Let me ask you something.</p><p>When was the last time somebody took a picture of you and you actually liked it?</p><p>Not after finding the right angle.</p><p>Not after a filter.</p><p>Not after taking fifteen and deleting fourteen.</p><p>Just you, looking like somebody glad to be in the photo.</p><p>I know how that goes.</p><p>Sometimes you see an old picture and think, there I am. That is the person I remember.</p><p>Maybe there was more hair. Maybe more energy. Maybe you actually liked getting dressed.</p><p>Or maybe it had nothing to do with how you looked.</p><p><strong>Maybe it was how you FELT.</strong></p><p>You laughed more.</p><p>You went places.</p><p>You did not spend so much time wondering what people thought.</p><p>There was a spark there.</p><p>And somewhere between raising kids, working, building a life, carrying everybody else, and your body changing underneath you...</p><p>That person got quiet.</p><p>Here is what I want you to hear.</p><p><strong>You do not have to be 25 again to feel good at 55, 65, or 75.</strong></p><p>You do not need somebody else's body.</p><p>You want to feel good in your own.</p><p>Annie has taught this for years in her Restore Her Glow and Bring Sexy Back work, and I used to think it sat beside the real medicine.</p><p>I was wrong about that.</p><p>Because getting your spark back is not vanity. It is the reason anybody bothers getting healthy in the first place.</p><p>I have watched people fight their blood pressure for a year, win, and still not enjoy their own life. The numbers moved and nothing else did.</p><p><strong>Both matter. The numbers and the person carrying them.</strong></p><p>So picture something.</p><p>The holidays are coming.</p><p>What if you were actually looking forward to the pictures this year?</p><p>What if instead of finding a spot behind everybody else, you stepped into the frame?</p><p>Not because anything got perfect.</p><p>Because you finally started taking care of yourself again.</p><p><strong>That is the conversation I want to have with you.</strong></p><p>And before this week is out I have something to tell you about.</p><p>Nothing to do with coaching this time. The year is winding down and Annie and I need some rest ourselves.</p><p>Watch for the next email.</p><p>Joel Polley, RN</p><p>P.S. You are not too old to feel like that person again, and you do not have to look like anybody else to do it.</p>`, "You do not have to be 25 again.", email),
    text: (name, email) => `Hey ${name},

Let me ask you something.

When was the last time somebody took a picture of you and you actually liked it?

Not after finding the right angle.

Not after a filter.

Not after taking fifteen and deleting fourteen.

Just you, looking like somebody glad to be in the photo.

I know how that goes.

Sometimes you see an old picture and think, there I am. That is the person I remember.

Maybe there was more hair. Maybe more energy. Maybe you actually liked getting dressed.

Or maybe it had nothing to do with how you looked.

Maybe it was how you FELT.

You laughed more.

You went places.

You did not spend so much time wondering what people thought.

There was a spark there.

And somewhere between raising kids, working, building a life, carrying everybody else, and your body changing underneath you...

That person got quiet.

Here is what I want you to hear.

You do not have to be 25 again to feel good at 55, 65, or 75.

You do not need somebody else's body.

You want to feel good in your own.

Annie has taught this for years in her Restore Her Glow and Bring Sexy Back work, and I used to think it sat beside the real medicine.

I was wrong about that.

Because getting your spark back is not vanity. It is the reason anybody bothers getting healthy in the first place.

I have watched people fight their blood pressure for a year, win, and still not enjoy their own life. The numbers moved and nothing else did.

Both matter. The numbers and the person carrying them.

So picture something.

The holidays are coming.

What if you were actually looking forward to the pictures this year?

What if instead of finding a spot behind everybody else, you stepped into the frame?

Not because anything got perfect.

Because you finally started taking care of yourself again.

That is the conversation I want to have with you.

And before this week is out I have something to tell you about.

Nothing to do with coaching this time. The year is winding down and Annie and I need some rest ourselves.

Watch for the next email.

Joel Polley, RN

P.S. You are not too old to feel like that person again, and you do not have to look like anybody else to do it.`,
  },
  3: {
    subject: "I need your opinion on something",
    preheader: "A one-time class, if you want it.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Can you feel the holidays coming?</p><p>Thanksgiving. Then Christmas. Then a new year and a fresh start.</p><p>The gatherings. The pictures. People you have not seen in months, sometimes years.</p><p>And there is always that one relative with something to say about everybody.</p><p>But picture something different this year.</p><p>What if you walked into that room feeling good about yourself?</p><p>Not wondering whether everybody can tell how tired you have been.</p><p>Just walking in with your head up.</p><p>Your energy. Your confidence. Your smile.</p><p>And somebody looks at you and says, <strong>something is different about you.</strong></p><p>That would feel good.</p><p>But here is what would feel better.</p><p>You already knew.</p><p>You noticed it in the mirror that morning, and you did not need anybody to confirm it.</p><p>That is what Annie means when she talks about getting your glow back.</p><p>Not trying to be someone else. Not chasing who you were at 25.</p><p><strong>Feeling alive and at home in your own body again.</strong></p><p>And you do not have to wait until January to start.</p><p>So here is what I am thinking about doing.</p><p>Something we have never done before and probably will not do again.</p><p><strong>Monday, October 26, putting the medical talk down for one night and letting Annie teach how you restore your glow from the inside out.</strong></p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p><em>Glow Out of Control; From the Inside Out</em></p><p>No cost to attend. It costs us both our time, and time is worth more than money.</p><p>I want to step away from the usual blood pressure conversation and talk about what a lot of people have quietly been missing.</p><p>Their spark. Their energy. Their confidence. The feeling of being alive in their own skin.</p><p>And how to start caring for the person underneath all the changes.</p><p>No waiting for another New Year's resolution.</p><p>If you think that is a good idea, or you would want to be there, tell me. <strong>Just reply YES.</strong></p><p>The holidays are coming, friend.</p><p>This year I want you enjoying them.</p><p>Joel Polley, RN</p><p>P.S. What if next year's holiday pictures told a different story? It starts with how you choose to take care of yourself today.</p>`, "A one-time class, if you want it.", email),
    text: (name, email) => `Hey ${name},

Can you feel the holidays coming?

Thanksgiving. Then Christmas. Then a new year and a fresh start.

The gatherings. The pictures. People you have not seen in months, sometimes years.

And there is always that one relative with something to say about everybody.

But picture something different this year.

What if you walked into that room feeling good about yourself?

Not wondering whether everybody can tell how tired you have been.

Just walking in with your head up.

Your energy. Your confidence. Your smile.

And somebody looks at you and says, something is different about you.

That would feel good.

But here is what would feel better.

You already knew.

You noticed it in the mirror that morning, and you did not need anybody to confirm it.

That is what Annie means when she talks about getting your glow back.

Not trying to be someone else. Not chasing who you were at 25.

Feeling alive and at home in your own body again.

And you do not have to wait until January to start.

So here is what I am thinking about doing.

Something we have never done before and probably will not do again.

Monday, October 26, putting the medical talk down for one night and letting Annie teach how you restore your glow from the inside out.

RESTORE YOUR GLOW FOR THE HOLIDAYS

Glow Out of Control; From the Inside Out

No cost to attend. It costs us both our time, and time is worth more than money.

I want to step away from the usual blood pressure conversation and talk about what a lot of people have quietly been missing.

Their spark. Their energy. Their confidence. The feeling of being alive in their own skin.

And how to start caring for the person underneath all the changes.

No waiting for another New Year's resolution.

If you think that is a good idea, or you would want to be there, tell me. Just reply YES.

The holidays are coming, friend.

This year I want you enjoying them.

Joel Polley, RN

P.S. What if next year's holiday pictures told a different story? It starts with how you choose to take care of yourself today.`,
  },
  4: {
    subject: "You spoke. We listened.",
    preheader: "Monday, October 26. Free, live, no replay.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p><strong>You spoke. We listened.</strong></p><p>This morning, I asked you a simple question.</p><p><strong>Should we do a special free class before the holidays?</strong> One about getting your spark back, and about the speedy aging nobody warns you is coming.</p><p>The replies started landing within minutes.</p><p>Yes. Yes. Yes.</p><p>Not everybody. But most of you.</p><p><strong>So we're doing it.</strong></p><p>This Monday, October 26, Annie and I are hosting a free live masterclass:</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p>Here is what twenty years of this work has taught me.</p><p>It is not only about the blood pressure, the weight, the hormones, or the nights you lie there awake.</p><p><strong>It is about the person living underneath all those symptoms.</strong></p><p>The one who still wants to feel good, have energy, and enjoy the life they built.</p><p>The one who wants to look in the mirror and recognize who is looking back.</p><p>Imagine what changes once you finally understand what your body needs in this season.</p><p>That is the conversation we are having Monday.</p><p>Why your body changed, what is getting in the way of feeling like yourself, and where to start.</p><p><strong>Monday, October 26</strong></p><p><strong>6 PM Central, 7 PM Eastern</strong></p><p>Free. Live. No replay.</p><p>SAVE MY FREE SEAT:<br><a href="https://bpquiz.com/masterclass" style="color:#112d4d;font-weight:700">https://bpquiz.com/masterclass</a></p><p>One more thing before you go.</p><p><strong>Can you do me a favor?</strong></p><p>I am giving you this class as a gift. I would like you to hand that same gift to somebody else.</p><p>Your best friend. Your church family. Your sister. Somebody who follows you and has been quietly struggling.</p><p>Think of five people who deserve to feel good in their own body again.</p><p><strong>Would you forward this to them?</strong></p><p>It is not too early to spread a little cheer, and they will thank you for it.</p><p><strong>Register first, then copy the link and send it to whoever comes to mind. They get to decide for themselves.</strong></p><p>SHARE THE GIFT:<br><a href="https://bpquiz.com/masterclass" style="color:#112d4d;font-weight:700">https://bpquiz.com/masterclass</a></p><p>Let's get healthier, feel better, and do it together this holiday season.</p><p>You asked for it. We are making room for it.</p><p>See you Monday.</p><p>Joel Polley, RN</p>`, "Monday, October 26. Free, live, no replay.", email),
    text: (name, email) => `Hey ${name},

You spoke. We listened.

This morning, I asked you a simple question.

Should we do a special free class before the holidays? One about getting your spark back, and about the speedy aging nobody warns you is coming.

The replies started landing within minutes.

Yes. Yes. Yes.

Not everybody. But most of you.

So we're doing it.

This Monday, October 26, Annie and I are hosting a free live masterclass:

RESTORE YOUR GLOW FOR THE HOLIDAYS

Here is what twenty years of this work has taught me.

It is not only about the blood pressure, the weight, the hormones, or the nights you lie there awake.

It is about the person living underneath all those symptoms.

The one who still wants to feel good, have energy, and enjoy the life they built.

The one who wants to look in the mirror and recognize who is looking back.

Imagine what changes once you finally understand what your body needs in this season.

That is the conversation we are having Monday.

Why your body changed, what is getting in the way of feeling like yourself, and where to start.

Monday, October 26

6 PM Central, 7 PM Eastern

Free. Live. No replay.

SAVE MY FREE SEAT:
https://bpquiz.com/masterclass

One more thing before you go.

Can you do me a favor?

I am giving you this class as a gift. I would like you to hand that same gift to somebody else.

Your best friend. Your church family. Your sister. Somebody who follows you and has been quietly struggling.

Think of five people who deserve to feel good in their own body again.

Would you forward this to them?

It is not too early to spread a little cheer, and they will thank you for it.

Register first, then copy the link and send it to whoever comes to mind. They get to decide for themselves.

SHARE THE GIFT:
https://bpquiz.com/masterclass

Let's get healthier, feel better, and do it together this holiday season.

You asked for it. We are making room for it.

See you Monday.

Joel Polley, RN`,
  },
  5: {
    subject: "Three things to bring Monday night",
    preheader: "Non-registrants only.",
    only: 'nonregistrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Tomorrow night is the Restore Your Glow masterclass.</p><p>Bring three things with you.</p><p><strong>1. A picture in your head of who you want to be.</strong></p><p>Not somebody else. You, with energy, comfortable in your own body, not dreading the morning.</p><p><strong>2. One thing you wish you could change.</strong></p><p>Your weight. Your energy. Your skin. Your sleep.</p><p>Or maybe just wanting to look in the mirror and not wince.</p><p>Whatever it is, think about it before you come.</p><p><strong>3. An open mind.</strong></p><p>Because some of us have told ourselves a story so long that it starts sounding like the only one available.</p><p>"I'm too old."</p><p>"This is just what happens."</p><p>"I'll never feel like myself again."</p><p>What if there is another way to read that?</p><p>That is what we are getting into tomorrow.</p><p>And there is an announcement waiting for you too.</p><p><strong>Monday, October 26</strong></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p>SAVE MY SEAT:<br><a href="https://bpquiz.com/masterclass" style="color:#112d4d;font-weight:700">https://bpquiz.com/masterclass</a></p><p>Come with that one thing you wish could change. Keep it in front of you the whole hour.</p><p>Because tomorrow we are talking about the person you still get to become.</p><p>Joel Polley, RN</p><p>P.S. This is a special live class, not one of our regular Monday sessions. I want you in the room.</p>`, "Non-registrants only.", email),
    text: (name, email) => `Hey ${name},

Tomorrow night is the Restore Your Glow masterclass.

Bring three things with you.

1. A picture in your head of who you want to be.

Not somebody else. You, with energy, comfortable in your own body, not dreading the morning.

2. One thing you wish you could change.

Your weight. Your energy. Your skin. Your sleep.

Or maybe just wanting to look in the mirror and not wince.

Whatever it is, think about it before you come.

3. An open mind.

Because some of us have told ourselves a story so long that it starts sounding like the only one available.

"I'm too old."

"This is just what happens."

"I'll never feel like myself again."

What if there is another way to read that?

That is what we are getting into tomorrow.

And there is an announcement waiting for you too.

Monday, October 26

7 PM Eastern / 6 PM Central

SAVE MY SEAT:
https://bpquiz.com/masterclass

Come with that one thing you wish could change. Keep it in front of you the whole hour.

Because tomorrow we are talking about the person you still get to become.

Joel Polley, RN

P.S. This is a special live class, not one of our regular Monday sessions. I want you in the room.`,
  },
  6: {
    subject: "Tonight, 6 PM Central",
    preheader: "And something brand new to reveal.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Today is the day, and I have been looking forward to this one all week.</p><p>For weeks now Annie and I have talked about health with you.</p><p>Blood pressure. Blood sugar. Hormones. Weight.</p><p>Everything that starts shifting in a body as the years add up.</p><p>We are not stopping those conversations. Your health matters.</p><p>But tonight...</p><p><strong>I want to talk about the person we are trying to get healthy in the first place.</strong></p><p>Because you do not just want better numbers at your next appointment.</p><p>You want the energy to keep up with your grandkids.</p><p>You want to take the trip.</p><p>You want to feel good when somebody looks at you.</p><p>You want skin that looks alive and hair with something left in it.</p><p>You want to be in a picture without hunting for the right filter.</p><p>You want to walk into a room feeling like yourself again.</p><p><strong>You want your spark back.</strong></p><p>And I am not talking about looking 25.</p><p>I mean looking in the mirror and being glad about the person who has made it this far.</p><p>Feeling alive. Feeling confident. Having enough energy left over to enjoy the life you built.</p><p>That is what tonight is about.</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p><em>Glow Out of Control; From the Inside Out</em></p><p>Tonight Annie and I are going to look at what has been dimming it.</p><p>We are going to talk about the person underneath the symptoms.</p><p>And how you start caring for them from the inside out.</p><p>So you can stop feeling like you are watching your best years go by, and start looking at what you still get to enjoy.</p><p><strong>And we have something brand new to reveal tonight.</strong></p><p>Something we have been building behind the scenes.</p><p>You have to be there to hear it first.</p><p><strong>TONIGHT, Monday, October 26</strong></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p><strong>Live with Annie and me</strong></p><p>No cost to attend.</p><p>SAVE MY SEAT:<br><a href="https://bpquiz.com/masterclass" style="color:#112d4d;font-weight:700">https://bpquiz.com/masterclass</a></p><p>Before you come, sit with one question.</p><p><strong>If you woke up tomorrow feeling like yourself again, what would you do differently?</strong></p><p>Wear the thing. Book the trip. Take the picture. Make the call.</p><p>Or just walk past the mirror without looking away.</p><p>Hold on to that answer.</p><p>Because tonight we are talking about the person who deserves that life.</p><p>See you at 6.</p><p>Joel Polley, RN</p><p>P.S. This is the one-time Glow masterclass. Clear a little space for yourself tonight. You have spent enough evenings on everybody else.</p>`, "And something brand new to reveal.", email),
    text: (name, email) => `Hey ${name},

Today is the day, and I have been looking forward to this one all week.

For weeks now Annie and I have talked about health with you.

Blood pressure. Blood sugar. Hormones. Weight.

Everything that starts shifting in a body as the years add up.

We are not stopping those conversations. Your health matters.

But tonight...

I want to talk about the person we are trying to get healthy in the first place.

Because you do not just want better numbers at your next appointment.

You want the energy to keep up with your grandkids.

You want to take the trip.

You want to feel good when somebody looks at you.

You want skin that looks alive and hair with something left in it.

You want to be in a picture without hunting for the right filter.

You want to walk into a room feeling like yourself again.

You want your spark back.

And I am not talking about looking 25.

I mean looking in the mirror and being glad about the person who has made it this far.

Feeling alive. Feeling confident. Having enough energy left over to enjoy the life you built.

That is what tonight is about.

RESTORE YOUR GLOW FOR THE HOLIDAYS

Glow Out of Control; From the Inside Out

Tonight Annie and I are going to look at what has been dimming it.

We are going to talk about the person underneath the symptoms.

And how you start caring for them from the inside out.

So you can stop feeling like you are watching your best years go by, and start looking at what you still get to enjoy.

And we have something brand new to reveal tonight.

Something we have been building behind the scenes.

You have to be there to hear it first.

TONIGHT, Monday, October 26

7 PM Eastern / 6 PM Central

Live with Annie and me

No cost to attend.

SAVE MY SEAT:
https://bpquiz.com/masterclass

Before you come, sit with one question.

If you woke up tomorrow feeling like yourself again, what would you do differently?

Wear the thing. Book the trip. Take the picture. Make the call.

Or just walk past the mirror without looking away.

Hold on to that answer.

Because tonight we are talking about the person who deserves that life.

See you at 6.

Joel Polley, RN

P.S. This is the one-time Glow masterclass. Clear a little space for yourself tonight. You have spent enough evenings on everybody else.`,
  },
  7: {
    subject: "We are live in 15 minutes",
    preheader: "Registrants only. Here is your room.",
    only: 'registrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>We are about to go live.</p><p>Tonight we are setting down everything you have been worried about and paying attention to the person underneath it.</p><p>Your energy. Your confidence. Your spark.</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p><em>Glow Out of Control; From the Inside Out</em></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p>JOIN US LIVE:<br><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="color:#112d4d;font-weight:700">https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1</a></p><p>Meeting ID: 828 5171 5003<br>Passcode: 027302</p><p>Grab a notebook.</p><p>Bring that one thing you wish could change.</p><p>Come on in. We have something brand new to reveal.</p><p>See you inside.</p><p>Joel and Annie</p>`, "Registrants only. Here is your room.", email),
    text: (name, email) => `Hey ${name},

We are about to go live.

Tonight we are setting down everything you have been worried about and paying attention to the person underneath it.

Your energy. Your confidence. Your spark.

RESTORE YOUR GLOW FOR THE HOLIDAYS

Glow Out of Control; From the Inside Out

7 PM Eastern / 6 PM Central

JOIN US LIVE:
https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1

Meeting ID: 828 5171 5003
Passcode: 027302

Grab a notebook.

Bring that one thing you wish could change.

Come on in. We have something brand new to reveal.

See you inside.

Joel and Annie`,
  },
  10: {
    subject: "There is no finish line",
    preheader: "What if you could do LESS, in the right order?",
    only: 'nonregistrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Something happened in our masterclass last night that I haven't stopped thinking about.</p><p>We were talking about blood pressure, hormones, weight, energy, and getting our GLOW back.</p><p>But the conversation went somewhere deeper.</p><p>And I want to share one thing with you.</p><p><strong>There is NO finish line.</strong></p><p>You know the one I'm talking about?</p><p>When the kids are settled...</p><p>When the holidays are over...</p><p>When work slows down...</p><p>When I finally have more time, more money, more energy...</p><p>THEN I'll take care of me.</p><p>Girl, WHEN?!</p><p>Because there's always going to be another responsibility. Another person who needs you. Another reason to wait.</p><p>And while you're waiting for life to settle down, life is still happening.</p><p>Here's something I want you to think about.</p><p><strong>What if getting healthier didn't mean doing MORE?</strong></p><p>What if some of the same small changes that support your heart could also support your energy, your weight, and how you feel about yourself?</p><p>What if you could do LESS, but in the RIGHT order?</p><p>Now THAT'S a conversation worth having!</p><p>Last night, I shared something that made me think about the VALUE of our health.</p><p>There's a woman offering a 90-day diabetes program for <strong>$36,000.</strong></p><p>Yes. THIRTY-SIX THOUSAND DOLLARS!</p><p>And you know what I said?</p><p><strong>Is it worth it? ABSOLUTELY. If it delivers what it promises!</strong></p><p>I've been a nurse long enough to see what uncontrolled diabetes can cost.</p><p>Your eyesight. Your kidneys. Your mobility. Your independence.</p><p>The years you want to spend traveling, dancing at your daughter's wedding, playing with your grandchildren.</p><p>When you think about what's at stake, $36,000 starts to look very different, doesn't it?</p><p>So what is the high blood pressure, the extra weight, and the hormone changes costing you?</p><p><strong>But here's a BETTER question...</strong></p><p>What if you DIDN'T have to spend $36,000 to learn how to start taking meaningful steps toward better health?</p><p>What if you could understand the things that affect your blood pressure, your blood sugar, your weight, and your energy, TOGETHER?</p><p>What if, instead of collecting another supplement, another product, another temporary solution, you could begin working on the everyday habits and patterns that support your health from the INSIDE OUT?</p><p>Not another box full of supplements.</p><p>Not another complicated routine you can't maintain.</p><p><strong>LESS. In the RIGHT order.</strong></p><p>Because that's the part so many women are missing!</p><p>And it's one of the things that made last night's masterclass so special.</p><p>We weren't just talking about healthier numbers.</p><p>We were talking about the WOMAN who gets to enjoy the life those healthier choices are helping her build.</p><p>So here's a little something for you today:</p><p><strong>Choose ONE thing you want back before this year ends.</strong></p><p>Then choose ONE small health habit you can begin practicing today.</p><p>Not seven things. Not a complete life overhaul.</p><p>ONE.</p><p>Because the seed begins to grow long before you ever see the flower.</p><p>And speaking of growing...</p><p>Tomorrow, Joel and I are sharing some exciting news with you.</p><p><strong>Watch your inbox tomorrow.</strong></p><p>Because this holiday, you get to be the girl who glows from the inside out.</p><p>The one in all of the pictures.</p><p>The centerpiece of the family.</p><p>The warm glow in the home.</p><p>Can't wait to give you your gift for the holidays.</p><p>Joel &amp; Annie</p><p>Everyday Nurse</p><p>ps. Its time to rise. Join us for the rising.</p>`, "What if you could do LESS, in the right order?", email),
    text: (name, email) => `Hey ${name},

Something happened in our masterclass last night that I haven't stopped thinking about.

We were talking about blood pressure, hormones, weight, energy, and getting our GLOW back.

But the conversation went somewhere deeper.

And I want to share one thing with you.

There is NO finish line.

You know the one I'm talking about?

When the kids are settled...

When the holidays are over...

When work slows down...

When I finally have more time, more money, more energy...

THEN I'll take care of me.

Girl, WHEN?!

Because there's always going to be another responsibility. Another person who needs you. Another reason to wait.

And while you're waiting for life to settle down, life is still happening.

Here's something I want you to think about.

What if getting healthier didn't mean doing MORE?

What if some of the same small changes that support your heart could also support your energy, your weight, and how you feel about yourself?

What if you could do LESS, but in the RIGHT order?

Now THAT'S a conversation worth having!

Last night, I shared something that made me think about the VALUE of our health.

There's a woman offering a 90-day diabetes program for $36,000.

Yes. THIRTY-SIX THOUSAND DOLLARS!

And you know what I said?

Is it worth it? ABSOLUTELY. If it delivers what it promises!

I've been a nurse long enough to see what uncontrolled diabetes can cost.

Your eyesight. Your kidneys. Your mobility. Your independence.

The years you want to spend traveling, dancing at your daughter's wedding, playing with your grandchildren.

When you think about what's at stake, $36,000 starts to look very different, doesn't it?

So what is the high blood pressure, the extra weight, and the hormone changes costing you?

But here's a BETTER question...

What if you DIDN'T have to spend $36,000 to learn how to start taking meaningful steps toward better health?

What if you could understand the things that affect your blood pressure, your blood sugar, your weight, and your energy, TOGETHER?

What if, instead of collecting another supplement, another product, another temporary solution, you could begin working on the everyday habits and patterns that support your health from the INSIDE OUT?

Not another box full of supplements.

Not another complicated routine you can't maintain.

LESS. In the RIGHT order.

Because that's the part so many women are missing!

And it's one of the things that made last night's masterclass so special.

We weren't just talking about healthier numbers.

We were talking about the WOMAN who gets to enjoy the life those healthier choices are helping her build.

So here's a little something for you today:

Choose ONE thing you want back before this year ends.

Then choose ONE small health habit you can begin practicing today.

Not seven things. Not a complete life overhaul.

ONE.

Because the seed begins to grow long before you ever see the flower.

And speaking of growing...

Tomorrow, Joel and I are sharing some exciting news with you.

Watch your inbox tomorrow.

Because this holiday, you get to be the girl who glows from the inside out.

The one in all of the pictures.

The centerpiece of the family.

The warm glow in the home.

Can't wait to give you your gift for the holidays.

Joel & Annie

Everyday Nurse

ps. Its time to rise. Join us for the rising.`,
  },
  11: {
    subject: "Your $250 call, free until tomorrow at 5",
    preheader: "Two things I need from you first.",
    only: 'registrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Last night, I made an invitation that I don't normally make.</p><p>And I wanted to make sure you had a chance to take advantage of it.</p><p>Remember when we talked about the woman offering a $36,000 diabetes program?</p><p>And I asked whether it could be worth that investment?</p><p>Because when you're thinking about your health, your future, your independence, and the people you want to be here for...</p><p><strong>What is getting your health back worth to you?</strong></p><p>And what if your next step didn't have to begin with thousands of dollars, another supplement, or another promise?</p><p>What if it started with understanding where you are, what you want back, and what deserves your attention FIRST?</p><p>That's why I made this invitation.</p><p>For those who are serious about getting their health back and ready to RISE, Joel and I offered to waive our regular <strong>$250 consultation fee</strong>.</p><p>That's right.</p><p>A complimentary 30-minute strategy call with one of us.</p><p>Not another masterclass. Not another video.</p><p>An opportunity for us to hear where you are, understand what you want back, and talk about what your next steps could look like.</p><p><strong>This closes tomorrow at 5 PM Central.</strong></p><p>After that the fee goes back on, so if you want one of these, today or tomorrow morning is your window.</p><p>But there's something I need from you.</p><p><strong>Two things, actually.</strong></p><p><strong>FIRST: You have to be READY TO RISE.</strong></p><p>You don't need to have everything figured out. You don't even have to know exactly where to begin.</p><p>But you must be ready to take your health and your future seriously.</p><p><strong>SECOND: You have to SHOW UP.</strong></p><p>We're setting aside time from our personal coaching calendars for these conversations.</p><p>And because we're waiving the consultation fee, I'm asking you to honor that time by showing up for the appointment you choose.</p><p>That's it!</p><p>If you haven't had a chance to book yet, here's your invitation.</p><p><a href="https://calendly.com/braveworksrn/discovery-call" style="color:#112d4d;font-weight:700">https://calendly.com/braveworksrn/discovery-call</a></p><p>We have limited appointments available and the calendar closes tomorrow at 5 PM Central, so please choose a time you can genuinely commit to.</p><p>We'll talk about your goals, your biggest challenges, and whether there's a way we can help you move forward.</p><p>Because remember what I said last night?</p><p><strong>Nobody can make the decision to rise for you.</strong></p><p>But that doesn't mean you have to figure out the journey alone.</p><p>I would love to hear your story.</p><p>Annie</p><p>Everyday Nurse</p><p>ps. If you already booked your call, you are set, nothing else to do. I will see you on the call.</p>`, "Two things I need from you first.", email),
    text: (name, email) => `Hey ${name},

Last night, I made an invitation that I don't normally make.

And I wanted to make sure you had a chance to take advantage of it.

Remember when we talked about the woman offering a $36,000 diabetes program?

And I asked whether it could be worth that investment?

Because when you're thinking about your health, your future, your independence, and the people you want to be here for...

What is getting your health back worth to you?

And what if your next step didn't have to begin with thousands of dollars, another supplement, or another promise?

What if it started with understanding where you are, what you want back, and what deserves your attention FIRST?

That's why I made this invitation.

For those who are serious about getting their health back and ready to RISE, Joel and I offered to waive our regular $250 consultation fee.

That's right.

A complimentary 30-minute strategy call with one of us.

Not another masterclass. Not another video.

An opportunity for us to hear where you are, understand what you want back, and talk about what your next steps could look like.

This closes tomorrow at 5 PM Central.

After that the fee goes back on, so if you want one of these, today or tomorrow morning is your window.

But there's something I need from you.

Two things, actually.

FIRST: You have to be READY TO RISE.

You don't need to have everything figured out. You don't even have to know exactly where to begin.

But you must be ready to take your health and your future seriously.

SECOND: You have to SHOW UP.

We're setting aside time from our personal coaching calendars for these conversations.

And because we're waiving the consultation fee, I'm asking you to honor that time by showing up for the appointment you choose.

That's it!

If you haven't had a chance to book yet, here's your invitation.

https://calendly.com/braveworksrn/discovery-call

We have limited appointments available and the calendar closes tomorrow at 5 PM Central, so please choose a time you can genuinely commit to.

We'll talk about your goals, your biggest challenges, and whether there's a way we can help you move forward.

Because remember what I said last night?

Nobody can make the decision to rise for you.

But that doesn't mean you have to figure out the journey alone.

I would love to hear your story.

Annie

Everyday Nurse

ps. If you already booked your call, you are set, nothing else to do. I will see you on the call.`,
  },
  9: {
    subject: "I heard you last night",
    preheader: "You don't rise in pieces.",
    only: 'registrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>The Masterclass was FIRE!<br>The room was safe and honest.</p><p>I heard you last night. ❤️</p><p>And I want you to know something.</p><p>When I asked what you wanted back, you didn't hold back.</p><p>Some of you said your hair.</p><p>Some said your energy. Your confidence. Your peace.</p><p>Some of you wanted to lose the weight that's been holding on for dear life.</p><p>Others wanted better blood pressure numbers, better blood sugar, or simply to stop feeling tired all the time.</p><p>But then there were the answers that went even deeper.</p><p>You wanted to travel again.</p><p>To feel beautiful again.</p><p>To be there for your children and grandchildren.</p><p>To stay strong and independent well into your 80s.</p><p>To look in the mirror and recognize that girl again.</p><p><strong>And girl, I LOVE that you still want those things for yourself!</strong></p><p>I love that you still have dreams.</p><p>I love that you're thinking about your future.</p><p>I love that after everything life has thrown at you, there's still a part of you saying, <em>"I want more life!"</em></p><p>And I heard the fears, too.</p><p>The fear of trying again.</p><p>The fear of not being consistent.</p><p>The fear of hoping for change and being disappointed one more time.</p><p>Thank you for trusting me with those things.</p><p>But remember what we talked about last night?</p><p><strong>You don't rise in pieces.</strong></p><p>You don't have to choose between caring for your heart and feeling beautiful.</p><p>Between getting healthier and getting your confidence back.</p><p>Between being there for everybody else and finally being there for YOU.</p><p>You get to want ALL of it.</p><p>And that false finish line we talked about? The one where you finally take care of yourself after everyone and everything else is settled?</p><p>girl, that finish line doesn't exist.</p><p>So today, before this day gets away from you, I want you to do one thing.</p><p>Write down ONE thing you want back before this year is over.</p><p>Not what somebody else wants for you.</p><p>What YOU want.</p><p>And if you feel like sharing it, hit reply and tell me.</p><p>Because A Declaration of the future is necessary for you</p><p><strong>Tomorrow, Joel and I have something special to share with you.</strong></p><p>check your email.</p><p>It might be the best news you have received in a while.</p><p>But today?</p><p>I just want you to know that I heard you.</p><p>And I'm rooting for the woman you're becoming.</p><p><strong>Girl, it's time to rise.</strong></p><p>With love,</p><p>Annie ❤️<br>Everyday Nurse</p>`, "You don't rise in pieces.", email),
    text: (name, email) => `Hey ${name},

The Masterclass was FIRE!
The room was safe and honest.

I heard you last night. ❤️

And I want you to know something.

When I asked what you wanted back, you didn't hold back.

Some of you said your hair.

Some said your energy. Your confidence. Your peace.

Some of you wanted to lose the weight that's been holding on for dear life.

Others wanted better blood pressure numbers, better blood sugar, or simply to stop feeling tired all the time.

But then there were the answers that went even deeper.

You wanted to travel again.

To feel beautiful again.

To be there for your children and grandchildren.

To stay strong and independent well into your 80s.

To look in the mirror and recognize that girl again.

And girl, I LOVE that you still want those things for yourself!

I love that you still have dreams.

I love that you're thinking about your future.

I love that after everything life has thrown at you, there's still a part of you saying, "I want more life!"

And I heard the fears, too.

The fear of trying again.

The fear of not being consistent.

The fear of hoping for change and being disappointed one more time.

Thank you for trusting me with those things.

But remember what we talked about last night?

You don't rise in pieces.

You don't have to choose between caring for your heart and feeling beautiful.

Between getting healthier and getting your confidence back.

Between being there for everybody else and finally being there for YOU.

You get to want ALL of it.

And that false finish line we talked about? The one where you finally take care of yourself after everyone and everything else is settled?

girl, that finish line doesn't exist.

So today, before this day gets away from you, I want you to do one thing.

Write down ONE thing you want back before this year is over.

Not what somebody else wants for you.

What YOU want.

And if you feel like sharing it, hit reply and tell me.

Because A Declaration of the future is necessary for you

Tomorrow, Joel and I have something special to share with you.

check your email.

It might be the best news you have received in a while.

But today?

I just want you to know that I heard you.

And I'm rooting for the woman you're becoming.

Girl, it's time to rise.

With love,

Annie ❤️
Everyday Nurse`,
  },
  8: {
    subject: "We are live right now",
    preheader: "The door is open. Come on in.",
    only: 'nonregistrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>We just went live.</p><p><strong>Restore Your Glow for the Holidays</strong> is happening right now, and the door is open.</p><p>JOIN US LIVE:<br><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="color:#112d4d;font-weight:700">https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1</a></p><p>Meeting ID: 828 5171 5003<br>Passcode: 027302</p><p>You did not register ahead of time, and that is fine. Come in anyway. Nobody is going to make you catch up.</p><p>Grab a notebook if one is close by. Bring yourself either way.</p><p>See you inside.</p><p>Joel and Annie</p>`, "The door is open. Come on in.", email),
    text: (name, email) => `Hey ${name},

We just went live.

Restore Your Glow for the Holidays is happening right now, and the door is open.

JOIN US LIVE:
https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1

Meeting ID: 828 5171 5003
Passcode: 027302

You did not register ahead of time, and that is fine. Come in anyway. Nobody is going to make you catch up.

Grab a notebook if one is close by. Bring yourself either way.

See you inside.

Joel and Annie`,
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

async function scanKeys(pattern) {
  const keys = [];
  let cursor = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: pattern, count: 500 });
    keys.push(...batch);
    cursor = next;
  } while (String(cursor) !== '0');
  return keys;
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


// Tonight's encore adds two exclusions the heart runway did not have:
// the challenge waitlist (they get their own $97 VIP sequence) and anyone
// who typed their email into last night's Zoom chat. Both were loaded into
// KV from Joel's local files, because a serverless function cannot read
// his Zoom recording folder.
const LAUNCH_SKIP = new Set(["aprilj@yorku.ca", "arvandersh@gmail.com", "bankablefinancial@gmail.com", "boydwanda@mail.com", "brightnessmalo482@gmail.com", "cc_sanders@comcast.net", "dclarepurpose2@gmail.com", "despitetheirony@icloud.com", "dssatlanta@live.com", "grahamjoanne2@gmail.com", "ivawmoore@yahoo.com", "jonmarksmom@yahoo.com", "kathy022254@yahoo.com", "keyb81@gmail.com", "ladylee4200@gmail.com", "lavbennett@yahoo.com", "lee36330@hotmail.com", "linda.berry@mac.com", "lionahalliman@gmail.com", "llady1_2000@yahoo.com", "maybelline_torres@yahoo.com", "monica.fogle@yahoo.com", "ngwitozzi@yahoo.com", "nikosanders1@gmail.com", "reikiway@comcast.net", "rmitchhood2@outlook.com", "roxanneauguste@yahoo.com", "sgldblndl@hotmail.com", "sophiankosi4sibongile@gmail.com", "t1412@hotmail.com", "tamarabeckfordmd@gmail.com", "travelconsult@mega.bw", "tsbeckford@gmail.com", "vernesterhodge@yahoo.com", "wilhelminajohn815@yahoo.com", "wordmomma55@gmail.com", "yraaid@gmail.com"]);

async function challengeBuyers() {
  const out = new Set();
  for (const key of ['challenge:2026-10-19:vip', 'challenge:2026-10-19:ga']) {
    try { const members = await kv.smembers(key);
      for (const m of members || []) out.add(String(m).trim().toLowerCase());
    } catch { /* non-fatal */ }
  }
  // 2026-10-18: people already spoken to tonight get skipped. The /coach
  // registrants had their own two emails, and tonight's Zoom and Facebook
  // audience got the gift plus a deadline email.
  for (const e of LAUNCH_SKIP) out.add(e);
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const emailNum = Number(req.query?.email);
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(emailNum)) {
    return res.status(400).json({ error: 'pass ?email=1..11' });
  }
  const template = EMAILS[emailNum];
  const SENT_FLAG = `${SENT_FLAG_PREFIX}${emailNum}Sent`;
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  if (cronMode) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
    if (today !== fireDate) return res.status(200).json({ ok: true, skipped: 'cron date guard', today, fireDate, emailNum });
  }
  const manualSend =
    req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-LAUNCH-${emailNum}`;
  const sendMode = cronMode || manualSend;

  let allKeys = [];
  try {
    allKeys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  } catch (err) {
    return res.status(500).json({ error: 'kv scan failed', detail: err.message });
  }

  // Emails 5 and 7 split on who registered for the masterclass (2026-10-21).
  // Additive filter: the send loop below is untouched.
  if (template.only) {
    const regKeys = await scanKeys('masterclass:reg:*');
    const registrants = new Set(regKeys.map((k) => k.slice(k.lastIndexOf(':') + 1).trim().toLowerCase()));
    const before = allKeys.length;
    const isReg = (k) => registrants.has(k.slice(k.lastIndexOf(':') + 1).trim().toLowerCase());
    allKeys = template.only === 'registrants' ? allKeys.filter(isReg) : allKeys.filter((k) => !isReg(k));
    console.log(`glow email ${emailNum}: only=${template.only} registrants=${registrants.size} keys ${before} -> ${allKeys.length}`);
    if (template.only === 'registrants' && allKeys.length === 0) {
      return res.status(200).json({ ok: true, skipped: 'no registrants yet', emailNum });
    }
  }
  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const encoreSkip = await challengeBuyers();
  // Never-send guard (2026-10-07): Accelerator roster + bwbp:allin:* + Stripe
  // coaching payers + bwbp:neversend + Resend unsubscribes, built fresh per run.
  // Fails closed: if the list cannot be built, nothing sends.
  let guard;
  try { guard = await neverSendGuard(); }
  catch (err) { return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message }); }
  const stats = { total: 0, eligible: 0, alreadySent: 0, unsub: 0, paused: 0, neverSend: 0, coachingClient: 0, noEmail: 0, duplicate: 0, invalidEmail: 0, dupSuppressed: 0 };
  const seen = new Set();
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const resend = sendMode ? getResend() : null;

  // Read records in mget batches (one KV round trip per 500 keys) instead of
  // one kv.get per key — per-key reads capped a 250s fire at ~1,300 sends.
  const CHUNK = 500;
  outer:
  for (let ci = 0; ci < allKeys.length; ci += CHUNK) {
    const keyChunk = allKeys.slice(ci, ci + CHUNK);
    let recs;
    try { recs = await kv.mget(...keyChunk); } catch { continue; }
    for (let ri = 0; ri < keyChunk.length; ri++) {
    const k = keyChunk[ri];
    const rec = recs[ri];
    stats.total++;
    if (sendMode && Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break outer; }

    if (!rec || !rec.email) { stats.noEmail++; continue; }
    if (rec.unsubscribed) { stats.unsub++; continue; }
    if (rec.paused) { stats.paused++; continue; }
    if (guard.blocks(rec.email)) { stats.neverSend++; continue; }
    if (rec.state === 'tier-4' || coachingClients.has(String(rec.email || '').trim().toLowerCase())) { stats.coachingClient++; continue; }
    if (encoreSkip.has(String(rec.email || '').trim().toLowerCase())) { stats.encoreSkip = (stats.encoreSkip || 0) + 1; continue; }

    const emailKey = String(rec.email).toLowerCase().trim();
    if (rec[SENT_FLAG]) { stats.alreadySent++; continue; }
    if (!EMAIL_RE.test(emailKey)) { stats.invalidEmail++; continue; }
    if (seen.has(emailKey)) { stats.duplicate++; continue; }
    seen.add(emailKey);

    if (sendMode) {
      let inSet = 0;
      try { inSet = await kv.sismember(SENT_SET, emailKey); } catch { /* treat as not-sent */ }
      if (inSet) {
        stats.dupSuppressed++;
        try { await kv.set(k, { ...rec, [SENT_FLAG]: true }); } catch { /* next fire re-checks */ }
        continue;
      }
    }
    stats.eligible++;

    if (!sendMode) {
      if (samples.length < 3) {
        const name = tidyName(rec.firstName);
        const subject = typeof template.subject === 'function' ? template.subject(name) : template.subject;
        samples.push({ email: rec.email, firstName: rec.firstName || null, subject, text: template.text(name, rec.email) });
      }
      continue;
    }

    const name = tidyName(rec.firstName);
    const subject = typeof template.subject === 'function' ? template.subject(name) : template.subject;
    try {
      await resend.emails.send({
        from: FROM,
        to: rec.email,
        replyTo: REPLY,
        subject,
        html: template.html(name, rec.email),
        text: template.text(name, rec.email),
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, emailKey); } catch (err) { console.warn('joelmc-blast: sadd failed', err.message); }
      try { await kv.set(k, { ...rec, [SENT_FLAG]: true }); } catch (err) { console.warn('joelmc-blast: flag write failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: rec.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  return res.status(200).json({
    ok: true,
    emailNum,
    mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN',
    from: FROM,
    stats,
    ...guard.report(),
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
