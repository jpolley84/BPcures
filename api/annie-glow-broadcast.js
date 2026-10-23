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

const FIRE_DATES = {"1": "2026-10-21", "2": "2026-10-22", "3": "2026-10-23", "4": "2026-10-25", "5": "2026-10-25", "6": "2026-10-26", "7": "2026-10-26"};
const CRON_FIRE_DATE = '2026-10-21';
const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'annie@restoreherhormones.com';
const REGISTER_URL = 'https://restoreherhormones.com/masterclass';
const UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const RATE_LIMIT_MS = 90; // matches the local script's pace (0 failures on 8.5k); Resend latency adds ~100ms per send
const MAX_RUN_MS = 250 * 1000;
const SEGMENT_KEY = 'rhhmc:segment';
const SENT_SET_PREFIX = 'annieglow:sent:';

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
    subject: () => "I got an email in the dead of the night",
    preheader: "She looked at something she had been avoiding.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p><strong>I got an email in the dead of the night.</strong></p><p>My husband showed it to me at 4:03 AM</p><p>He had already responded to it...</p><p>Here's the backstory.</p><p>We had just finished Day 1 of our live Change My Life Challenge.</p><p>And later that night, a woman wrote to us flustered</p><p>She was in angst because an exercise we had done in class plus the homework had made her stop and look at things she hadn't really wanted to face.</p><p>Not another diet.</p><p>Not another workout.</p><p>Not another long list of things to do.</p><p>Just a simple exercise that is designed to help women find the stuck points that have been keeping them stuck.</p><p>And THAT was the hard part. because sometimes seeing the boulders that seem to have us trapped can be difficult.</p><p>Can I be honest?</p><p>Recently Joel and I joined a coaching group for 23,000 for the year because hey...even coaches need coaches</p><p>At some point I thought... have we made a mistake?</p><p>there's nothing tangible in the coaching... it's not like how we coach women to get rid of blood pressure and as a side effect they drop diabetes, lose weight, balance hormones and more...</p><p>Research says when a woman gets her blood pressure under control it can add and average of 5 great years to her life... that's priceless!</p><p>But the truth is investing in myself at that high level made me feel kinda like that woman who wrote the email. Really flustered to finally see the reality of <strong>everything</strong> that needs to be worked on</p><p>Maybe you feel overwhelmed.</p><p>Holidays are coming</p><p><em>Life is happening.</em></p><p>Everybody needs something.</p><p>You are tired.</p><p>And before you know it, you're making that same promise to yourself all over again.</p><p>"I'll face it all after this season is over"</p><p>But what if the answer isn't simply trying harder?</p><p><strong>What if part of moving forward is finally understanding what's been holding you back?</strong></p><p>Maybe your hair, your skin, your weight, or your sleep changed too.</p><p>But none of those changes means your story is over.</p><p>You still have a whole life to live.</p><p>And I want you to think about something tonight.</p><p><strong>If you could feel different in just ONE area of your life before this year ends, what would it be?</strong></p><p>Because the girl in you still has dreams, plans, and a whole lot of living to do.</p><p>Please do me a favor and something nice for you today...</p><p>...Love the Girl You're In. She's worth it.</p><p>I'm cheering for you!</p><p>Everyday Nurse Annie</p><p>P.S. Sometimes the biggest change begins with one question you finally give yourself permission to answer.</p>`, email, "She looked at something she had been avoiding."),
    text: (name, email) => `Hey ${name},

I got an email in the dead of the night.

My husband showed it to me at 4:03 AM

He had already responded to it...

Here's the backstory.

We had just finished Day 1 of our live Change My Life Challenge.

And later that night, a woman wrote to us flustered

She was in angst because an exercise we had done in class plus the homework had made her stop and look at things she hadn't really wanted to face.

Not another diet.

Not another workout.

Not another long list of things to do.

Just a simple exercise that is designed to help women find the stuck points that have been keeping them stuck.

And THAT was the hard part. because sometimes seeing the boulders that seem to have us trapped can be difficult.

Can I be honest?

Recently Joel and I joined a coaching group for 23,000 for the year because hey...even coaches need coaches

At some point I thought... have we made a mistake?

there's nothing tangible in the coaching... it's not like how we coach women to get rid of blood pressure and as a side effect they drop diabetes, lose weight, balance hormones and more...

Research says when a woman gets her blood pressure under control it can add and average of 5 great years to her life... that's priceless!

But the truth is investing in myself at that high level made me feel kinda like that woman who wrote the email. Really flustered to finally see the reality of everything that needs to be worked on

Maybe you feel overwhelmed.

Holidays are coming

Life is happening.

Everybody needs something.

You are tired.

And before you know it, you're making that same promise to yourself all over again.

"I'll face it all after this season is over"

But what if the answer isn't simply trying harder?

What if part of moving forward is finally understanding what's been holding you back?

Maybe your hair, your skin, your weight, or your sleep changed too.

But none of those changes means your story is over.

You still have a whole life to live.

And I want you to think about something tonight.

If you could feel different in just ONE area of your life before this year ends, what would it be?

Because the girl in you still has dreams, plans, and a whole lot of living to do.

Please do me a favor and something nice for you today...

...Love the Girl You're In. She's worth it.

I'm cheering for you!

Everyday Nurse Annie

P.S. Sometimes the biggest change begins with one question you finally give yourself permission to answer.

${DISCLAIMER_TEXT(email)}`,
  },
  2: {
    subject: () => "When was the last time you loved a picture of yourself?",
    preheader: "You do not need to be 25 again.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Can I ask you something?</p><p>When was the last time someone took a picture of you, and you actually LOVED it?</p><p>Not after finding the perfect angle.</p><p>Not after putting a filter on it.</p><p>Not after taking 15 pictures and deleting 14.</p><p>Just you.</p><p>Smiling.</p><p>Looking like a woman who's happy to be in the picture.</p><p>Girl, I know.</p><p>Sometimes you look at an old photograph and think...</p><p><em>There she is.</em></p><p><em>That's the woman I remember.</em></p><p>Maybe her hair was fuller.</p><p>Maybe she had more energy.</p><p>Maybe she loved getting dressed up.</p><p>Or maybe it wasn't even how she looked.</p><p><strong>Maybe it was how she FELT.</strong></p><p>She laughed more.</p><p>She went places.</p><p>She didn't spend so much time worrying about what people thought about her.</p><p>She had a certain spark. a light about her atmosphere</p><p>And somewhere between raising children, working, building a life, caring for everybody else, and going through all these changes in her body...</p><p>She stopped feeling like THAT girl.</p><p>But let me tell you something.</p><p><strong>You do not have to be 25 again to feel beautiful at 55, 65, or 75.</strong></p><p>You don't need somebody else's face.</p><p>You don't need somebody else's body.</p><p>You JUST want to feel good in YOURS.</p><p>That's something I've talked about for years in our Restore Her Glow and Bring Sexy Back teachings.</p><p>Because getting your glow back is about more than what you put on your skin.</p><p>But I love how we as women would almost rather restore our GLOW than fix blood sugar issues.</p><p>BOTH ARE NECESSARY.</p><p>You are not wrong for wanting your skin to have life in it again. your hair to bounce. your eyes to sparkle.</p><p>So imagine something for me.</p><p>The holidays are coming.</p><p>What if you could actually look forward to the family pictures this year?</p><p>What if, instead of finding a place behind everybody else, you felt happy stepping into the picture?</p><p>Not because you suddenly became perfect.</p><p>But because you were learning to love and care for yourself again.</p><p><strong>That's the kind of glow I want us to talk about.</strong></p><p>And before this week is over, I have something special I want to share with you.</p><p>nothing to do with coaching this time. The year is winding down and joel and I need to rest up a bit.</p><p>So look out for the next emails</p><p>I can't wait to share.</p><p>Don't Forget to Love the Girl You're In today.</p><p>Everyday Nurse Annie</p><p>P.S. You are not too old to feel like THAT girl again. And you don't need to look like anybody else to do it.</p>`, email, "You do not need to be 25 again."),
    text: (name, email) => `Hey ${name},

Can I ask you something?

When was the last time someone took a picture of you, and you actually LOVED it?

Not after finding the perfect angle.

Not after putting a filter on it.

Not after taking 15 pictures and deleting 14.

Just you.

Smiling.

Looking like a woman who's happy to be in the picture.

Girl, I know.

Sometimes you look at an old photograph and think...

There she is.

That's the woman I remember.

Maybe her hair was fuller.

Maybe she had more energy.

Maybe she loved getting dressed up.

Or maybe it wasn't even how she looked.

Maybe it was how she FELT.

She laughed more.

She went places.

She didn't spend so much time worrying about what people thought about her.

She had a certain spark. a light about her atmosphere

And somewhere between raising children, working, building a life, caring for everybody else, and going through all these changes in her body...

She stopped feeling like THAT girl.

But let me tell you something.

You do not have to be 25 again to feel beautiful at 55, 65, or 75.

You don't need somebody else's face.

You don't need somebody else's body.

You JUST want to feel good in YOURS.

That's something I've talked about for years in our Restore Her Glow and Bring Sexy Back teachings.

Because getting your glow back is about more than what you put on your skin.

But I love how we as women would almost rather restore our GLOW than fix blood sugar issues.

BOTH ARE NECESSARY.

You are not wrong for wanting your skin to have life in it again. your hair to bounce. your eyes to sparkle.

So imagine something for me.

The holidays are coming.

What if you could actually look forward to the family pictures this year?

What if, instead of finding a place behind everybody else, you felt happy stepping into the picture?

Not because you suddenly became perfect.

But because you were learning to love and care for yourself again.

That's the kind of glow I want us to talk about.

And before this week is over, I have something special I want to share with you.

nothing to do with coaching this time. The year is winding down and joel and I need to rest up a bit.

So look out for the next emails

I can't wait to share.

Don't Forget to Love the Girl You're In today.

Everyday Nurse Annie

P.S. You are not too old to feel like THAT girl again. And you don't need to look like anybody else to do it.

${DISCLAIMER_TEXT(email)}`,
  },
  3: {
    subject: () => "Should we do this? Reply YES",
    preheader: "One time only, and I want your opinion first.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Can you feel the holidays coming?</p><p>I'm totally cheesing as I write this....</p><p>Thanksgiving...</p><p>Then Christmas.</p><p>Then the new year... a fresh start!</p><p>The family gatherings.</p><p>The pictures.</p><p>The people you haven't seen in months or years</p><p>And you know there's always that ONE relative who has something to say about everybody!</p><p>But I want you to imagine something different this year.</p><p>What if you walked into that room feeling GOOD about yourself?</p><p>Not wondering if everybody can see how tired you've been.</p><p>Just walking in with your head up.</p><p>Loving the body that has held you up... well it's held EVERYBODY up.</p><p>Your smile.</p><p>Your energy.</p><p>Your confidence.</p><p>And someone looks at you and says...</p><p><strong>"Girl, something is different about you!"</strong></p><p>Wouldn't that feel good?</p><p>But here's what would feel even better.</p><p>If You already knew.</p><p>If You noticed it when you looked in the mirror that morning.</p><p>And you didn't need anybody else to tell you.</p><p>Girl, that's what I mean when I talk about getting your GLOW back.</p><p>Not trying to be somebody else.</p><p>Not chasing the woman you were at 25.</p><p><strong>But feeling alive, beautiful, and at home in your own body again.</strong></p><p>And here's the thing.</p><p>You don't have to wait until January to start working toward that.</p><p>In fact, I have something exciting I'm thinking about doing</p><p>Literally A ONE TIME THING EVER!</p><p><strong>Monday, October 26, I am thinking about ditching all the medical talk for a second and doing a masterclass on how you can restore your glow from the inside out!</strong></p><p>So you can glow out of control</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p><em>Glow Out of Control; From the Inside Out!</em></p><p>A No cost masterclass... well it will cost us both our time and time is infinitely more valuable than money.</p><p>But I want to step away from our usual blood pressure conversations to talk about something so many women have been quietly missing.</p><p>Their spark.</p><p>Their energy.</p><p>Their confidence.</p><p>That feeling of being beautiful and alive in their own skin.</p><p>And how to begin caring for the woman underneath all those changes.</p><p>No need to wait for another New Year's resolution.</p><p>If you think it's a good idea, or if this would be something you would be interested in let me know by responding ... just reply YES.</p><p>Because the holidays are coming, my friend.</p><p>And this year, I want YOU to enjoy being part of the celebration.</p><p>I want you to Love the Girl You're In,</p><p>Everyday Nurse Annie</p><p>P.S. What if next year's holiday pictures told a whole different story? It starts with the way you choose to care for yourself today.</p>`, email, "One time only, and I want your opinion first."),
    text: (name, email) => `Hey ${name},

Can you feel the holidays coming?

I'm totally cheesing as I write this....

Thanksgiving...

Then Christmas.

Then the new year... a fresh start!

The family gatherings.

The pictures.

The people you haven't seen in months or years

And you know there's always that ONE relative who has something to say about everybody!

But I want you to imagine something different this year.

What if you walked into that room feeling GOOD about yourself?

Not wondering if everybody can see how tired you've been.

Just walking in with your head up.

Loving the body that has held you up... well it's held EVERYBODY up.

Your smile.

Your energy.

Your confidence.

And someone looks at you and says...

"Girl, something is different about you!"

Wouldn't that feel good?

But here's what would feel even better.

If You already knew.

If You noticed it when you looked in the mirror that morning.

And you didn't need anybody else to tell you.

Girl, that's what I mean when I talk about getting your GLOW back.

Not trying to be somebody else.

Not chasing the woman you were at 25.

But feeling alive, beautiful, and at home in your own body again.

And here's the thing.

You don't have to wait until January to start working toward that.

In fact, I have something exciting I'm thinking about doing

Literally A ONE TIME THING EVER!

Monday, October 26, I am thinking about ditching all the medical talk for a second and doing a masterclass on how you can restore your glow from the inside out!

So you can glow out of control

RESTORE YOUR GLOW FOR THE HOLIDAYS

Glow Out of Control; From the Inside Out!

A No cost masterclass... well it will cost us both our time and time is infinitely more valuable than money.

But I want to step away from our usual blood pressure conversations to talk about something so many women have been quietly missing.

Their spark.

Their energy.

Their confidence.

That feeling of being beautiful and alive in their own skin.

And how to begin caring for the woman underneath all those changes.

No need to wait for another New Year's resolution.

If you think it's a good idea, or if this would be something you would be interested in let me know by responding ... just reply YES.

Because the holidays are coming, my friend.

And this year, I want YOU to enjoy being part of the celebration.

I want you to Love the Girl You're In,

Everyday Nurse Annie

P.S. What if next year's holiday pictures told a whole different story? It starts with the way you choose to care for yourself today.

${DISCLAIMER_TEXT(email)}`,
  },
  4: {
    subject: () => "We're doing it. Monday night.",
    preheader: "You helped me decide.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Remember Thursday?</p><p>I asked you whether Joel and I should do something completely different for our Monday masterclass.</p><p>Something a little less about what's WRONG with your body...</p><p>And a whole lot more about what's still RIGHT with the woman living inside it.</p><p>Well...</p><p><strong>I'VE DECIDED. WE'RE DOING IT!</strong></p><p>And I have a feeling this is going to be one of my FAVORITE conversations of the year.</p><p>Because, girl, I want to talk about YOU.</p><p>Not just your blood pressure.</p><p>Not just your weight.</p><p>Not just the symptoms you've been trying to figure out.</p><p><strong>I want to talk about the woman underneath all of that.</strong></p><p>The one who still wants to feel beautiful.</p><p>Who still wants her hair to bounce and her eyes to sparkle.</p><p>Who wants to wake up with energy instead of already feeling exhausted.</p><p>Who wants to get dressed up and feel FABULOUS.</p><p>And who wants to enjoy the holidays without feeling like her own body is holding her back.</p><p>You know, there's something I've noticed.</p><p>Sometimes we get so busy trying to fix what's wrong with our bodies that we forget what we're trying to get BETTER FOR.</p><p>Think about that.</p><p>What's the point of better health if you never get around to enjoying your life?</p><p>Girl, I want BOTH for you.</p><p><strong>That's why tomorrow night we're doing:</strong></p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS!</strong></p><p><em>Glow Out of Control; From the Inside Out!</em></p><p>A special, one-time LIVE masterclass with Joel and me.</p><p><strong>Monday, October 26</strong></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p>And there's no cost to attend.</p><p>YES! SAVE MY SEAT FOR THE GLOW MASTERCLASS:<br><a href="https://restoreherhormones.com/masterclass" style="color:#112d4d;font-weight:700">https://restoreherhormones.com/masterclass</a></p><p>We're going to talk about what it means to get your glow back from the inside out.</p><p>And I'm going to show you why the woman you've been missing may not be as far away as you think.</p><p>Oh, and one more thing...</p><p>Joel and I have something special we're going to reveal tomorrow night.</p><p>But I'm not telling you about that yet!</p><p>First, I want you to come and see what's possible for YOU.</p><p>Don't Forget to Love the Girl You're In!</p><p>Everyday Nurse Annie</p><p>P.S. If you replied YES to my email Friday, here's your invitation! Make sure you actually reserve your seat so you get the details for tomorrow night.</p>`, email, "You helped me decide."),
    text: (name, email) => `Hey ${name},

Remember Thursday?

I asked you whether Joel and I should do something completely different for our Monday masterclass.

Something a little less about what's WRONG with your body...

And a whole lot more about what's still RIGHT with the woman living inside it.

Well...

I'VE DECIDED. WE'RE DOING IT!

And I have a feeling this is going to be one of my FAVORITE conversations of the year.

Because, girl, I want to talk about YOU.

Not just your blood pressure.

Not just your weight.

Not just the symptoms you've been trying to figure out.

I want to talk about the woman underneath all of that.

The one who still wants to feel beautiful.

Who still wants her hair to bounce and her eyes to sparkle.

Who wants to wake up with energy instead of already feeling exhausted.

Who wants to get dressed up and feel FABULOUS.

And who wants to enjoy the holidays without feeling like her own body is holding her back.

You know, there's something I've noticed.

Sometimes we get so busy trying to fix what's wrong with our bodies that we forget what we're trying to get BETTER FOR.

Think about that.

What's the point of better health if you never get around to enjoying your life?

Girl, I want BOTH for you.

That's why tomorrow night we're doing:

RESTORE YOUR GLOW FOR THE HOLIDAYS!

Glow Out of Control; From the Inside Out!

A special, one-time LIVE masterclass with Joel and me.

Monday, October 26

7 PM Eastern / 6 PM Central

And there's no cost to attend.

YES! SAVE MY SEAT FOR THE GLOW MASTERCLASS:
https://restoreherhormones.com/masterclass

We're going to talk about what it means to get your glow back from the inside out.

And I'm going to show you why the woman you've been missing may not be as far away as you think.

Oh, and one more thing...

Joel and I have something special we're going to reveal tomorrow night.

But I'm not telling you about that yet!

First, I want you to come and see what's possible for YOU.

Don't Forget to Love the Girl You're In!

Everyday Nurse Annie

P.S. If you replied YES to my email Friday, here's your invitation! Make sure you actually reserve your seat so you get the details for tomorrow night.

${DISCLAIMER_TEXT(email)}`,
  },
  5: {
    subject: () => "Bring three things with you Monday",
    preheader: "Non-registrants only.",
    only: 'nonregistrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Tomorrow night, we're doing our special Restore Your Glow masterclass.</p><p>And I want you to bring three things.</p><p><strong>1. A picture of the woman you want to be.</strong></p><p>Not somebody else's picture.</p><p>I'm talking about the YOU who wakes up with energy, feels confident in her body, and actually enjoys getting dressed in the morning.</p><p><strong>2. One thing you wish you could change.</strong></p><p>Maybe it's your hair.</p><p>Your skin.</p><p>Your weight.</p><p>Your energy.</p><p>Or maybe it's simply wanting to look in the mirror and smile again.</p><p>Whatever it is, I want you to think about it before you come.</p><p><strong>3. An open mind.</strong></p><p>Because sometimes we've told ourselves a story for so long that we start believing it's the only story possible.</p><p>"I'm too old."</p><p>"This is just menopause."</p><p>"I'll never feel like myself again."</p><p>Girl, what if there's another way to look at it?</p><p>That's what I want us to explore tomorrow.</p><p>And I have a very special announcement waiting for you too.</p><p><strong>Monday, October 26</strong></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p>YES, ANNIE! SAVE MY SEAT:<br><a href="https://restoreherhormones.com/masterclass" style="color:#112d4d;font-weight:700">https://restoreherhormones.com/masterclass</a></p><p>Come with that one thing you wish could change.</p><p>I want you thinking about it throughout our time together.</p><p>Because tomorrow, we're talking about HER.</p><p>The woman you still get to become.</p><p>Love the Girl You're In,</p><p>Everyday Nurse Annie</p><p>P.S. This is a special LIVE class, not one of our regular Monday presentations. I'd love for you to be there.</p>`, email, "Non-registrants only."),
    text: (name, email) => `Hey ${name},

Tomorrow night, we're doing our special Restore Your Glow masterclass.

And I want you to bring three things.

1. A picture of the woman you want to be.

Not somebody else's picture.

I'm talking about the YOU who wakes up with energy, feels confident in her body, and actually enjoys getting dressed in the morning.

2. One thing you wish you could change.

Maybe it's your hair.

Your skin.

Your weight.

Your energy.

Or maybe it's simply wanting to look in the mirror and smile again.

Whatever it is, I want you to think about it before you come.

3. An open mind.

Because sometimes we've told ourselves a story for so long that we start believing it's the only story possible.

"I'm too old."

"This is just menopause."

"I'll never feel like myself again."

Girl, what if there's another way to look at it?

That's what I want us to explore tomorrow.

And I have a very special announcement waiting for you too.

Monday, October 26

7 PM Eastern / 6 PM Central

YES, ANNIE! SAVE MY SEAT:
https://restoreherhormones.com/masterclass

Come with that one thing you wish could change.

I want you thinking about it throughout our time together.

Because tomorrow, we're talking about HER.

The woman you still get to become.

Love the Girl You're In,

Everyday Nurse Annie

P.S. This is a special LIVE class, not one of our regular Monday presentations. I'd love for you to be there.

${DISCLAIMER_TEXT(email)}`,
  },
  6: {
    subject: () => "Tonight is the night",
    preheader: "And we have something brand new to reveal.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)}!</p><p>Girl, today's the day!</p><p>And I have been looking forward to this one ALL WEEK!</p><p>You know, for the past few weeks, Joel and I have talked a lot about health.</p><p>Blood pressure.</p><p>Blood sugar.</p><p>Hormones.</p><p>Weight.</p><p>All the things that start changing in our bodies as we get older.</p><p>And you know what?</p><p>We're not stopping those conversations.</p><p>Because your health MATTERS.</p><p>But tonight...</p><p><strong>I want to talk about the woman we're trying to get healthy in the FIRST PLACE!</strong></p><p>Come on, girl!</p><p>Because you don't just want better numbers at your next doctor's appointment.</p><p>You want enough energy to enjoy your grandchildren.</p><p>You want to go on that trip.</p><p>You want to feel good when your husband looks at you.</p><p>You want beautiful, healthy-looking skin.</p><p>You want your hair to have some LIFE in it!</p><p>You want to take a picture without spending ten minutes finding the perfect filter.</p><p>And you want to walk into a room feeling like THAT girl again!</p><p>Am I right?</p><p><strong>Girl, you want your GLOW back!</strong></p><p>And I'm not talking about trying to look 25.</p><p>I'm talking about looking in the mirror and loving the woman you've become.</p><p>Feeling ALIVE.</p><p>Feeling confident.</p><p>Having the energy to enjoy the life you've worked so hard to build.</p><p>And still having a little sparkle left over for yourself!</p><p>That's what tonight is about.</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS!</strong></p><p><em>Glow Out of Control; From the Inside Out!</em></p><p>Tonight, Joel and I are going to help you look at what's been dimming your glow.</p><p>We're going to talk about the woman underneath all those symptoms.</p><p>And we're going to explore how you can begin caring for her from the inside out.</p><p>So you can stop feeling like you're watching your best years disappear...</p><p>And start looking forward to everything you still get to enjoy.</p><p>And YES...</p><p><strong>We've got something brand-new to reveal tonight!</strong></p><p>Something we've been working on behind the scenes.</p><p>Something I'm really excited about.</p><p>But you'll have to come tonight to hear about it first!</p><p><strong>TONIGHT, Monday, October 26</strong></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p><strong>LIVE with Annie and Joel</strong></p><p>No cost to attend.</p><p>YES! I WANT TO GLOW OUT OF CONTROL:<br><a href="https://restoreherhormones.com/masterclass" style="color:#112d4d;font-weight:700">https://restoreherhormones.com/masterclass</a></p><p>And before you come, I want you to think about one question.</p><p><strong>If you woke up tomorrow feeling like THAT girl again, what would you do differently?</strong></p><p>Would you wear the dress?</p><p>Book the trip?</p><p>Take the picture?</p><p>Go on that date?</p><p>Or simply walk past the mirror and smile?</p><p>Hold on to that answer.</p><p>Because tonight, we're talking about the woman who deserves to live that life.</p><p>I cannot WAIT to see you!</p><p>Don't Forget to Love the Girl You're In!</p><p>Everyday Nurse Annie</p><p>P.S. This is our special one-time Glow masterclass. Clear a little space for yourself tonight. You've spent enough evenings taking care of everybody else!</p>`, email, "And we have something brand new to reveal."),
    text: (name, email) => `Hey ${name}!

Girl, today's the day!

And I have been looking forward to this one ALL WEEK!

You know, for the past few weeks, Joel and I have talked a lot about health.

Blood pressure.

Blood sugar.

Hormones.

Weight.

All the things that start changing in our bodies as we get older.

And you know what?

We're not stopping those conversations.

Because your health MATTERS.

But tonight...

I want to talk about the woman we're trying to get healthy in the FIRST PLACE!

Come on, girl!

Because you don't just want better numbers at your next doctor's appointment.

You want enough energy to enjoy your grandchildren.

You want to go on that trip.

You want to feel good when your husband looks at you.

You want beautiful, healthy-looking skin.

You want your hair to have some LIFE in it!

You want to take a picture without spending ten minutes finding the perfect filter.

And you want to walk into a room feeling like THAT girl again!

Am I right?

Girl, you want your GLOW back!

And I'm not talking about trying to look 25.

I'm talking about looking in the mirror and loving the woman you've become.

Feeling ALIVE.

Feeling confident.

Having the energy to enjoy the life you've worked so hard to build.

And still having a little sparkle left over for yourself!

That's what tonight is about.

RESTORE YOUR GLOW FOR THE HOLIDAYS!

Glow Out of Control; From the Inside Out!

Tonight, Joel and I are going to help you look at what's been dimming your glow.

We're going to talk about the woman underneath all those symptoms.

And we're going to explore how you can begin caring for her from the inside out.

So you can stop feeling like you're watching your best years disappear...

And start looking forward to everything you still get to enjoy.

And YES...

We've got something brand-new to reveal tonight!

Something we've been working on behind the scenes.

Something I'm really excited about.

But you'll have to come tonight to hear about it first!

TONIGHT, Monday, October 26

7 PM Eastern / 6 PM Central

LIVE with Annie and Joel

No cost to attend.

YES! I WANT TO GLOW OUT OF CONTROL:
https://restoreherhormones.com/masterclass

And before you come, I want you to think about one question.

If you woke up tomorrow feeling like THAT girl again, what would you do differently?

Would you wear the dress?

Book the trip?

Take the picture?

Go on that date?

Or simply walk past the mirror and smile?

Hold on to that answer.

Because tonight, we're talking about the woman who deserves to live that life.

I cannot WAIT to see you!

Don't Forget to Love the Girl You're In!

Everyday Nurse Annie

P.S. This is our special one-time Glow masterclass. Clear a little space for yourself tonight. You've spent enough evenings taking care of everybody else!

${DISCLAIMER_TEXT(email)}`,
  },
  7: {
    subject: () => "We're about to go live",
    preheader: "Registrants only. Here is your room.",
    only: 'registrants',
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)}!</p><p>Girl, are you READY?</p><p>We're about to go LIVE!</p><p>Tonight, we're setting aside all those things you've been worried about...</p><p>And giving some attention to the woman underneath them.</p><p>Your energy.</p><p>Your confidence.</p><p>Your beauty.</p><p>Your GLOW!</p><p><strong>RESTORE YOUR GLOW FOR THE HOLIDAYS</strong></p><p><em>Glow Out of Control; From the Inside Out!</em></p><p><strong>7 PM Eastern / 6 PM Central</strong></p><p>CLICK HERE TO JOIN US LIVE:<br><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="color:#112d4d;font-weight:700">https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1</a></p><p>Meeting ID: 828 5171 5003<br>Passcode: 027302</p><p>Grab your notebook.</p><p>Bring that ONE thing you wish could change.</p><p>And come on in!</p><p>We've got a special evening planned, and something brand-new to reveal.</p><p>See you inside!</p><p>Annie and Joel</p>`, email, "Registrants only. Here is your room."),
    text: (name, email) => `Hey ${name}!

Girl, are you READY?

We're about to go LIVE!

Tonight, we're setting aside all those things you've been worried about...

And giving some attention to the woman underneath them.

Your energy.

Your confidence.

Your beauty.

Your GLOW!

RESTORE YOUR GLOW FOR THE HOLIDAYS

Glow Out of Control; From the Inside Out!

7 PM Eastern / 6 PM Central

CLICK HERE TO JOIN US LIVE:
https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1

Meeting ID: 828 5171 5003
Passcode: 027302

Grab your notebook.

Bring that ONE thing you wish could change.

And come on in!

We've got a special evening planned, and something brand-new to reveal.

See you inside!

Annie and Joel

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
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![1, 2, 3, 4, 5, 6, 7].includes(emailNum)) return res.status(400).json({ error: 'pass ?email=1..7' });
  const template = EMAILS[emailNum];
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
  if (cronMode && todayChicago() !== fireDate) {
    return res.status(200).json({ ok: true, skipped: 'cron date guard', today: todayChicago(), fireDate, emailNum });
  }
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-LAUNCH-${emailNum}`;
  const sendMode = cronMode || manualSend;

  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const encoreSkip = await challengeBuyers();
  const segment = (await kv.hgetall(SEGMENT_KEY)) || {};
  // Emails 5 and 7 split on who registered (2026-10-21). Annie's registrations
  // live in the Resend "Joint Monday Masterclass" audience, not KV, because
  // restoreherhormones has no KV.
  let emails = Object.keys(segment);
  if (template.only) {
    let registrants = new Set();
    try {
      const r = await fetch('https://api.resend.com/audiences/f345f465-7a00-4d92-8f4a-9788b4feb8ff/contacts', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      const j = await r.json();
      for (const c of (j.data || [])) {
        if (c?.email && c.unsubscribed !== true) registrants.add(String(c.email).trim().toLowerCase());
      }
    } catch (err) {
      return res.status(500).json({ error: 'registrant audience unavailable; refusing to send', detail: err.message });
    }
    const before = emails.length;
    emails = template.only === 'registrants'
      ? emails.filter((e) => registrants.has(String(e).trim().toLowerCase()))
      : emails.filter((e) => !registrants.has(String(e).trim().toLowerCase()));
    console.log(`glow email ${emailNum}: only=${template.only} registrants=${registrants.size} audience ${before} -> ${emails.length}`);
    if (template.only === 'registrants' && emails.length === 0) {
      return res.status(200).json({ ok: true, skipped: 'no registrants yet', emailNum });
    }
  }
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
    if (encoreSkip.has(String(email).trim().toLowerCase())) { stats.encoreSkip = (stats.encoreSkip || 0) + 1; continue; }
    stats.eligible++;
    const name = tidyName(segment[email]);
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
