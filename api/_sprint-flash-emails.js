// api/_sprint-flash-emails.js — the buyer-only $97 flash arc for the $297
// Sprint ("Joel's Eyes On Your Case", 1:1 call NOW INCLUDED).
//
// 2026-07-17 (Joel): built on the email-sequence-mastery dissections.
//   Email 1 = Martell Confession -> Framework -> Soft Ask + Myron diagnosis
//   Email 2 = Deedee story-parable -> law -> single arrow CTA
//   Email 3 = Brunson final call: honest scarcity (5 cases/month is REAL,
//             enforced by the case-review capacity counter) + the truth that
//             the $97 price exists ONLY inside these three emails.
// Every subject ships with a hand-written preview line (second subject).
// Voice: warm ICU nurse. ZERO em dashes. No invented proof: Doreen's numbers
// were approved by Joel 2026-05-18 with the original upsell arc.
//
// Consumed by api/sprint-flash-cron.js. Days are relative to sprintAnchorAt
// on the bwbp:drip record: [10, 14, 17] (new buyers anchor at purchase;
// backfilled past buyers get an anchor that starts the arc immediately).
import { p, h2, callout, ctaButton, buildEmail } from './_triangle-email.js';

// The $97 buyer-only flash payment link (Stripe, created 2026-07-17, LIVE:
// price_1TuF2LHseZnO3rRZw28x7xLa on the Case Review product; metadata
// kind:'case-review' plan:'flash97' so the webhook fulfills + alerts Joel
// exactly like a full-price purchase). REUSE, never recreate.
export const FLASH_97_LINK =
  process.env.SPRINT_FLASH_97_LINK || 'https://buy.stripe.com/dRmcN5fMv1vodvJc7DfnO1F';

export const SPRINT_FLASH_DAYS = [10, 14, 17];
export const flashSentFlag = (day) => `sprintFlash${day}Sent`;

const first = (ctx) => ctx.firstName || 'friend';

// ── Email 1 · Day 10 · did the kit move your numbers? ─────────────────
function email1(ctx) {
  const subject = 'did the kit move your numbers?';
  const preheader = 'If yes, read this. If no, definitely read this.';
  const bodyHtml = [
    p(`Hey ${first(ctx)},`),
    p(`It has been about ten days since you opened your kit. So let me ask you the question I used to ask at the bedside.`),
    p(`<strong>Did your numbers move?</strong>`),
    p(`If they did, do not stop reading. This email matters more for you, not less.`),
    p(`Here is something I learned the hard way in 20 years of ICU and ER nursing. The people who struggled most were almost never the ones who did nothing. They were the ones doing the right things in the wrong order. Walking every day while their sleep stole the progress back every night. Cutting salt while stress kept the pressure pinned.`),
    p(`It was never a willpower problem. It was a <strong>which order</strong> problem.`),
    p(`The kit gives you the plan. What it cannot give you is my eyes on YOUR case. So I built one thing that does:`),
    h2(`The 30-Day Sprint: Joel's Eyes On Your Case`),
    p(`You send me your numbers, your history, and what you have tried. I sit down with your case the way I used to sit down with a chart, and I build your next 30 days, day by day, in plain language. And now it includes something it never did before: <strong>a 1:1 call with me</strong>, so we walk through your plan together and you leave with zero guesses.`),
    p(`The page price is $297. But you already did the thing most people never do. You started. That earns you the buyer price:`),
    callout({
      kicker: 'Buyer only, inside this email',
      body: `$97, one time. The full case review, the 30-day plan built for you, and the 1:1 call. This price is not on the website. It only lives in these emails, because you already own the kit.`,
    }),
    ctaButton('Get My 30-Day Plan and Call, $97', FLASH_97_LINK),
    p(`Talk soon,`),
    p(`Joel Polley, RN`),
  ].join('');
  const bodyText = `Hey ${first(ctx)},

It has been about ten days since you opened your kit. So let me ask you the question I used to ask at the bedside.

Did your numbers move?

If they did, do not stop reading. This email matters more for you, not less.

Here is something I learned the hard way in 20 years of ICU and ER nursing. The people who struggled most were almost never the ones who did nothing. They were the ones doing the right things in the wrong order. Walking every day while their sleep stole the progress back every night. Cutting salt while stress kept the pressure pinned.

It was never a willpower problem. It was a WHICH ORDER problem.

The kit gives you the plan. What it cannot give you is my eyes on YOUR case. So I built one thing that does.

THE 30-DAY SPRINT: JOEL'S EYES ON YOUR CASE
You send me your numbers, your history, and what you have tried. I sit down with your case the way I used to sit down with a chart, and I build your next 30 days, day by day, in plain language. And now it includes something it never did before: a 1:1 call with me, so we walk through your plan together and you leave with zero guesses.

The page price is $297. But you already did the thing most people never do. You started. That earns you the buyer price:

BUYER ONLY, INSIDE THIS EMAIL
$97, one time. The full case review, the 30-day plan built for you, and the 1:1 call. This price is not on the website. It only lives in these emails, because you already own the kit.

Get my 30-day plan and call, $97: ${FLASH_97_LINK}

Talk soon,
Joel Polley, RN

P.S. If your numbers already moved, this is how you keep them moving. The first drop is the easy part. The order of what comes next is where most people lose it.`;
  return { subject, render: (unsubUrl) => buildEmail({ preheader, bodyHtml: bodyHtml + psHtml(`If your numbers already moved, this is how you keep them moving. The first drop is the easy part. The order of what comes next is where most people lose it.`), bodyText, unsubUrl, corner: ctx.corner }) };
}

// ── Email 2 · Day 14 · the two gardens ────────────────────────────────
function email2(ctx) {
  const subject = 'two patients, same kit, different story';
  const preheader = 'The difference was never effort.';
  const bodyHtml = [
    p(`Stay with me, ${first(ctx)}. This starts with two patients, but it is about you.`),
    p(`Years ago I watched two people leave the same hospital floor with the same discharge plan. Same age. Same numbers. Same paper in their hands.`),
    p(`One went home and did everything on the list, in whatever order the day allowed. Some weeks were good. Some weeks undid the good ones. A year later her numbers were right back where they started, and she decided the plan did not work.`),
    p(`The other one asked a nurse to look at her case first. Ten minutes with her chart changed the order of everything. Sleep first, because her pressure never dipped at night. Then the food. Then the movement. Same list. Different order. Her numbers moved and stayed moved.`),
    p(`<strong>A plan is not a pile of good habits. A plan is the order the habits go in.</strong> The body is a system, and the parts talk to each other. Work them in the wrong order and one hand quietly undoes the other.`),
    p(`One buyer named Doreen went from 142/88 to 128/80 on her Sprint. Her cardiologist dropped a pill. Not because she worked harder than you. Because someone put her steps in the right order.`),
    p(`That is what I do in the 30-Day Sprint. Your case, my eyes, your 30 days in order, and a 1:1 call to walk it together. Still $97 for you, inside these emails only:`),
    p(`<a href="${FLASH_97_LINK}" style="color:#B85A36;font-weight:700;">&rarr; Put my next 30 days in order, $97</a>`),
    p(`One trigger at a time,`),
    p(`Joel Polley, RN`),
  ].join('');
  const bodyText = `Stay with me, ${first(ctx)}. This starts with two patients, but it is about you.

Years ago I watched two people leave the same hospital floor with the same discharge plan. Same age. Same numbers. Same paper in their hands.

One went home and did everything on the list, in whatever order the day allowed. Some weeks were good. Some weeks undid the good ones. A year later her numbers were right back where they started, and she decided the plan did not work.

The other one asked a nurse to look at her case first. Ten minutes with her chart changed the order of everything. Sleep first, because her pressure never dipped at night. Then the food. Then the movement. Same list. Different order. Her numbers moved and stayed moved.

A plan is not a pile of good habits. A plan is the order the habits go in. The body is a system, and the parts talk to each other. Work them in the wrong order and one hand quietly undoes the other.

One buyer named Doreen went from 142/88 to 128/80 on her Sprint. Her cardiologist dropped a pill. Not because she worked harder than you. Because someone put her steps in the right order.

That is what I do in the 30-Day Sprint. Your case, my eyes, your 30 days in order, and a 1:1 call to walk it together. Still $97 for you, inside these emails only:

-> Put my next 30 days in order, $97: ${FLASH_97_LINK}

One trigger at a time,
Joel Polley, RN

P.S. If this rearranged how you have been thinking about your own plan, hit reply and tell me. I read every one.`;
  return { subject, render: (unsubUrl) => buildEmail({ preheader, bodyHtml: bodyHtml + psHtml(`If this rearranged how you have been thinking about your own plan, hit reply and tell me. I read every one.`), bodyText, unsubUrl, corner: ctx.corner }) };
}

// ── Email 3 · Day 17 · honest close ───────────────────────────────────
function email3(ctx) {
  const subject = 'last note about your $97 (then I drop it)';
  const preheader = 'I take 5 cases a month. That is not marketing. That is my calendar.';
  const bodyHtml = [
    p(`Hey ${first(ctx)},`),
    p(`This is the last email I will send you about the Sprint. After this, I go back to just teaching, and I am glad to have you either way.`),
    p(`But I want to be straight with you before I do, because two things about this are true and neither is a marketing trick.`),
    p(`<strong>First: I take 5 cases a month.</strong> Not because a guru told me scarcity sells. Because I read every case myself and I get on every call myself, and 5 is what I can do well. When the month fills, the door closes until the 1st.`),
    p(`<strong>Second: the $97 price only exists inside these emails.</strong> The page says $297 and it stays $297. You get the buyer price because you already bought the kit and did the work. That was the deal, and this is the last time I offer it.`),
    p(`What you get has not changed. I read your full case. I build your next 30 days in order, for your body and your life. And we get on a 1:1 call and walk through it together, so you leave with a plan you understand instead of a PDF you file away.`),
    ctaButton('Take one of the 5 spots, $97', FLASH_97_LINK),
    p(`If the answer is no, that is truly fine. Keep running your kit. Keep taking your readings. I will keep showing up in your inbox with the free teaching either way.`),
    p(`Make the wise decision,`),
    p(`Joel Polley, RN`),
  ].join('');
  const bodyText = `Hey ${first(ctx)},

This is the last email I will send you about the Sprint. After this, I go back to just teaching, and I am glad to have you either way.

But I want to be straight with you before I do, because two things about this are true and neither is a marketing trick.

First: I take 5 cases a month. Not because a guru told me scarcity sells. Because I read every case myself and I get on every call myself, and 5 is what I can do well. When the month fills, the door closes until the 1st.

Second: the $97 price only exists inside these emails. The page says $297 and it stays $297. You get the buyer price because you already bought the kit and did the work. That was the deal, and this is the last time I offer it.

What you get has not changed. I read your full case. I build your next 30 days in order, for your body and your life. And we get on a 1:1 call and walk through it together, so you leave with a plan you understand instead of a PDF you file away.

Take one of the 5 spots, $97: ${FLASH_97_LINK}

If the answer is no, that is truly fine. Keep running your kit. Keep taking your readings. I will keep showing up in your inbox with the free teaching either way.

Make the wise decision,
Joel Polley, RN

P.S. Tomorrow this price is gone from your inbox and there is nowhere to find it again. If you have been on the fence, this is the day to get off it.`;
  return { subject, render: (unsubUrl) => buildEmail({ preheader, bodyHtml: bodyHtml + psHtml(`Tomorrow this price is gone from your inbox and there is nowhere to find it again. If you have been on the fence, this is the day to get off it.`), bodyText, unsubUrl, corner: ctx.corner }) };
}

function psHtml(text) {
  return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> ${text}</p>`;
}

export const SPRINT_FLASH_EMAILS = { 10: email1, 14: email2, 17: email3 };
