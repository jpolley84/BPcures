// api/triangle-lead-cron.js — LEAD nurture sequence + its daily cron.
//
// 2026-07-16 Annie-v2 rewrite: the lead arc is now the 7-email "Hidden
// Triggers" sequence (Annie's spec, implemented for BOTH quiz funnels).
// Email 1 (deliver the Blood Pressure Blueprint + confirm hope) is sent
// IMMEDIATELY at capture by api/lead-magnet.js, which also marks
// leadDay0Sent on the record; Day 0 here is the cron's safety net for
// captures whose immediate send failed (link version, no attachment).
// The rest of the arc:
//   Day 2  — teaching: the layering myth (zero offer)
//   Day 4  — Joel's story (epiphany bridge, zero offer)
//   Day 6  — introduce the $17 Reset Kit (first offer)
//   Day 9  — the other 4 triggers + gentle second kit ask
//   Day 12 — soft bridge to Steady tea (bpquiz.com/tea)
//   Day 15 — invitation to coaching (bpquiz.com/coaching) + handoff
//
// Personalization: ctx.trigger / ctx.triggerName come from the 5 Hidden
// Triggers quiz (stress / sugar / sodium / sleep / stillness). Triangle-quiz
// leads get them derived from their corner by lead-magnet.js. Records from
// before 2026-07-16 have neither; every body falls back to "your loudest
// trigger" and a safe kit URL.
//
// This file is BOTH the cron HTTP handler (default export, scheduled in
// vercel.json) AND the sequence definition. The shared engine
// (_triangle-state-cron.js) does the scanning / sending / idempotency, and
// the per-state transition (lead -> buyer) happens on purchase in
// triangle-webhook.js, never on a timer.
//
// Voice + compliance: warm, clinical-but-accessible, gratitude-first,
// NEWSTART-aligned. Education ALONGSIDE the doctor, never instead. No
// treat/cure/prescribe claims, never "stop your meds." ZERO em-dashes in body
// copy. Sign-off on every email: "One trigger at a time." The CAN-SPAM postal
// line + one-click unsubscribe are appended by buildEmail's shared footer.

import { runStateCron, cronConfig } from './_triangle-state-cron.js';
import {
  FROM, REPLY_TO, SITE_URL, PALETTE,
  p, h2, bigQuote, ctaButton, callout, buildEmail,
} from './_triangle-email.js';

export { FROM, REPLY_TO, SITE_URL };

// ─── The 5 hidden triggers ─────────────────────────────────────────────
export const TRIGGER_NAMES = {
  stress: 'The Stress Spike',
  sugar: 'The Sugar Surge',
  sodium: 'The Sodium Trap',
  sleep: 'The Midnight Drift',
  stillness: 'The Stillness Trigger',
};

// Resolve the lead's trigger slug: the stored trigger, else their Triangle
// corner (same slugs), else null.
function triggerOf(ctx) {
  if (ctx?.trigger && TRIGGER_NAMES[ctx.trigger]) return ctx.trigger;
  if (ctx?.corner && TRIGGER_NAMES[ctx.corner]) return ctx.corner;
  return null;
}

// Display name with graceful fallback for pre-2026-07-16 records.
function triggerNameOf(ctx) {
  const t = triggerOf(ctx);
  if (ctx?.triggerName && typeof ctx.triggerName === 'string') return ctx.triggerName;
  return t ? TRIGGER_NAMES[t] : null;
}

// The single ask of emails 4 and 5: the $17 Reset Kit at the LEAD'S OWN
// trigger. All 5 slugs are valid corners on /pay since 2026-07-16.
export function kitUrl(ctx) {
  const t = triggerOf(ctx) || 'stress';
  return `${SITE_URL}/pay?tier=corner&corner=${t}`;
}

const BLUEPRINT_URL = `${SITE_URL}/downloads/bp-blueprint.pdf`;
// Trailing slash on /tea/ matters: the bare /tea redirect in vercel.json
// appends its own manychat utm_source, which would clobber this attribution.
const TEA_URL = 'https://bpquiz.com/tea/?utm_source=email&utm_medium=lead-arc&utm_campaign=tea';
const COACHING_URL = `${SITE_URL}/coaching?utm_source=email&utm_medium=lead-arc&utm_campaign=bethere`;

// Per-day sent-flag field name (idempotency key on the drip record).
// lead-magnet.js writes leadDay0Sent when the immediate Email 1 succeeds.
export function leadSentFlag(day) {
  return `leadDay${day}Sent`;
}

const signoff = () => [p('One trigger at a time.', { margin: '0 0 6px' }), p('Joel Polley, RN')].join('');
const SIGNOFF_TEXT = 'One trigger at a time.\nJoel Polley, RN';

// ─── DAY 0 — Safety net: Blueprint delivery for failed immediate sends ──
// Only reaches a lead whose capture-time Email 1 failed (leadDay0Sent unset).
// Same copy as Email 1, with a download link instead of the attachment.
const day0 = {
  subject: 'The trigger driving your numbers up',
  preheader: 'Your result, plus the full Blueprint, like I promised.',
  htmlBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return [
      p(`Hey ${ctx.firstName || 'there'},`),
      p('Your results are in.'),
      name
        ? p(`Based on what you told me, your loudest driver right now is <strong>${name}</strong>.`)
        : p('Based on what you told me, your loudest driver is the one your quiz named on your result screen.'),
      p('Not a guess. Not a generic list. That is the pattern your own answers pointed to.'),
      p(`Here is your full <strong>Blood Pressure Blueprint</strong>: all 5 hidden triggers, not just yours. Because most people are carrying two or three of these at once, and I would rather you see the whole picture than just the loudest piece of it.`),
      ctaButton('Download your Blueprint (PDF)', BLUEPRINT_URL),
      p('Here is what I want you to do with it: open it, find your trigger, and start with the 3 things on that page. An herb, a food swap, a lifestyle shift. Nothing complicated. Nothing you need to buy today. Just start.'),
      p('One more thing, before you go.'),
      p('You did not do this to yourself. I have spent 20 years in ICU and ER medicine watching good, careful people do everything right and still watch their numbers climb. It is never because they did not try hard enough. It is because nobody showed them where to actually look.'),
      p('That is what this is for.'),
      p('In my next note I want to show you why almost nobody I meet is dealing with just one trigger, and why that is actually good news.'),
      signoff(),
      p('P.S. Save this email, you will want the Blueprint again later. And before you open it, hit reply and tell me one word: which trigger did your quiz name? I read every reply, and it helps me know who I am writing to.'),
    ].join('');
  },
  textBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return `Hey ${ctx.firstName || 'there'},

Your results are in.

${name ? `Based on what you told me, your loudest driver right now is ${name}.` : 'Based on what you told me, your loudest driver is the one your quiz named on your result screen.'}

Not a guess. Not a generic list. That is the pattern your own answers pointed to.

Here is your full Blood Pressure Blueprint (all 5 hidden triggers, not just yours):
${BLUEPRINT_URL}

Open it, find your trigger, and start with the 3 things on that page. An herb, a food swap, a lifestyle shift. Nothing complicated. Nothing you need to buy today. Just start.

One more thing. You did not do this to yourself. I have spent 20 years in ICU and ER medicine watching good, careful people do everything right and still watch their numbers climb. It is never because they did not try hard enough. It is because nobody showed them where to actually look.

In my next note I want to show you why almost nobody I meet is dealing with just one trigger, and why that is actually good news.

${SIGNOFF_TEXT}

P.S. Save this email, you will want the Blueprint again later. And before you open it, hit reply and tell me one word: which trigger did your quiz name? I read every reply, and it helps me know who I am writing to.`;
  },
};

// ─── DAY 2 — Teaching: the layering myth (zero offer) ─────────────────
const day2 = {
  subject: 'The blood pressure myth almost everyone believes',
  preheader: 'This is the part your doctor does not have time to explain.',
  htmlBody: (ctx) => [
    p(`${ctx.firstName ? `${ctx.firstName}, can` : 'Can'} I tell you something that took me years to see clearly?`),
    bigQuote('"Eat better. Move more. Stress less."'),
    p('That is the advice almost everyone gets. It is not wrong. It is just too vague to actually work.'),
    p('Here is why: blood pressure is not one dial. It is five, and they are all connected.'),
    p('Stress spikes cortisol. Cortisol makes you crave sugar. Sugar swings trigger more stress hormones. Poor sleep makes the sugar cravings worse. And through all of it, if you are not moving, your vessels lose the flexibility they need to handle any of it well.'),
    p('One trigger feeds the next. That is why generic advice feels like it is not working. You are aiming at the whole board when you only needed to hit the one piece that was loudest for you.'),
    p(`You already know your #1. It is in your Blueprint. <a href="${BLUEPRINT_URL}" style="color:${PALETTE.accentClay};font-weight:700;">(Here is a fresh copy if you need it.)</a>`),
    p('What most people do not realize, and what I want you sitting with today, is that the #1 is rarely acting alone. It usually has one or two quieter triggers riding along with it, making it worse.'),
    p('We will get to those. For now, just start with the one you know.'),
    signoff(),
    p('P.S. Hit reply with the word STACKED if you recognized a second trigger riding along with your first. One word is plenty. In my next note I want to tell you about a patient I have never been able to forget. She is part of why BraveWorks RN exists at all.'),
  ].join(''),
  textBody: (ctx) => `${ctx.firstName ? `${ctx.firstName}, can` : 'Can'} I tell you something that took me years to see clearly?

"Eat better. Move more. Stress less."

That is the advice almost everyone gets. It is not wrong. It is just too vague to actually work.

Here is why: blood pressure is not one dial. It is five, and they are all connected. Stress spikes cortisol. Cortisol makes you crave sugar. Sugar swings trigger more stress hormones. Poor sleep makes the sugar cravings worse. And if you are not moving, your vessels lose the flexibility they need to handle any of it well.

One trigger feeds the next. That is why generic advice feels like it is not working. You are aiming at the whole board when you only needed to hit the one piece that was loudest for you.

You already know your #1. It is in your Blueprint. Fresh copy if you need it: ${BLUEPRINT_URL}

What most people do not realize is that the #1 is rarely acting alone. It usually has one or two quieter triggers riding along with it, making it worse. We will get to those. For now, just start with the one you know.

${SIGNOFF_TEXT}

P.S. Hit reply with the word STACKED if you recognized a second trigger riding along with your first. One word is plenty. In my next note I want to tell you about a patient I have never been able to forget. She is part of why BraveWorks RN exists at all.`,
};

// ─── DAY 4 — Joel's story (epiphany bridge, zero offer) ───────────────
const day4 = {
  subject: 'The patient I could not stop thinking about',
  preheader: 'She asked me the same question everyone asks. I finally answered it.',
  htmlBody: (ctx) => [
    p('I still remember her face.'),
    p('Mid-50s. In for chest pain that turned out to be a blood pressure crisis, not a heart attack, but close enough to scare her badly.'),
    p('She looked at me from the bed and said the same thing I had heard probably a thousand times by then:'),
    bigQuote('"I don’t understand. I take my medication. I’ve cut back on salt. What am I doing wrong?"'),
    p('And for a long time, I did not have a real answer for her. I had the standard one, "keep doing what you are doing, follow up with your doctor," but standing there, I knew that was not actually going to change anything for her.'),
    p('She was going to go home. Keep doing the same things. And probably end up back in a bed like that one again.'),
    p('That conversation happened more times than I can count over 20 years in ICU and emergency medicine. Different faces. Same question. Same helpless feeling on my end, handing out generic advice that was not built for anyone’s specific pattern.'),
    p('At some point I stopped accepting that as just how it is.'),
    p('I started paying attention to what actually separated the people whose numbers improved from the people whose numbers did not. And it was never willpower. It was whether someone had ever shown them which trigger was actually theirs.'),
    p('That is the entire idea behind BraveWorks RN. Not another generic checklist. A way to actually find your own pattern, in minutes, instead of guessing for years.'),
    p(`You have already done that part. Your Blueprint is sitting in your inbox right now. <a href="${BLUEPRINT_URL}" style="color:${PALETTE.accentClay};font-weight:700;">(Or grab a fresh copy here.)</a>`),
    p('The next step, actually building a plan around your trigger instead of managing it alone, is something I built specifically for this. I will show you in my next note.'),
    signoff(),
    p('P.S. If any part of her story sounded like yours, reply with the word ME. That is all. I will know what it means, and it is the whole reason I do this.'),
  ].join(''),
  textBody: (ctx) => `I still remember her face.

Mid-50s. In for chest pain that turned out to be a blood pressure crisis, not a heart attack, but close enough to scare her badly.

She looked at me from the bed and said the same thing I had heard probably a thousand times by then: "I don't understand. I take my medication. I've cut back on salt. What am I doing wrong?"

And for a long time, I did not have a real answer for her. I had the standard one, "keep doing what you are doing, follow up with your doctor," but standing there, I knew that was not actually going to change anything for her. She was going to go home, keep doing the same things, and probably end up back in a bed like that one again.

That conversation happened more times than I can count over 20 years in ICU and emergency medicine. Different faces. Same question. Same helpless feeling on my end.

At some point I stopped accepting that as just how it is. I started paying attention to what actually separated the people whose numbers improved from the people whose numbers did not. And it was never willpower. It was whether someone had ever shown them which trigger was actually theirs.

That is the entire idea behind BraveWorks RN. Not another generic checklist. A way to actually find your own pattern, in minutes, instead of guessing for years.

You have already done that part. Your Blueprint is in your inbox (fresh copy: ${BLUEPRINT_URL}).

The next step, actually building a plan around your trigger instead of managing it alone, is something I built specifically for this. I will show you in my next note.

${SIGNOFF_TEXT}

P.S. If any part of her story sounded like yours, reply with the word ME. That is all. I will know what it means, and it is the whole reason I do this.`,
};

// ─── DAY 6 — Introduce the $17 Reset Kit (first offer) ────────────────
const day6 = {
  subject: (ctx) => (ctx.firstName ? `Your Reset Kit is ready, ${ctx.firstName}` : 'The $17 next step'),
  preheader: 'Everything in your Blueprint, turned into an actual plan.',
  htmlBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return [
      p(`${ctx.firstName ? `${ctx.firstName}, quick` : 'Quick'} question.`),
      p('Have you started on your Blueprint yet? The herb, the food swap, the lifestyle shift for your trigger?'),
      p('If yes: good. Genuinely, that is the hardest part. Most people never even start.'),
      p('If not yet, that is normal too. Knowing what to do and having a plan that actually fits into your day are two different things. That gap is where most good intentions quietly die.'),
      p('That is exactly why I built the <strong>BraveWorks BP Reset Kit</strong>.'),
      p('It is not a bigger version of the Blueprint. It is what comes after it: the specific, step-by-step 10-day plan for actually addressing your #1 trigger, built the way I would build it for a patient sitting in front of me. Not a 40-page course. Not a subscription. A real starting point.'),
      p('$17. Less than what most people spend on a single takeout order.'),
      name
        ? p(`You already know your trigger is <strong>${name}</strong>. This kit picks up exactly there.`)
        : p('You already know your loudest trigger. This kit picks up exactly there.'),
      ctaButton('Get the BP Reset Kit, $17', kitUrl(ctx)),
      p('I built this to be the easiest "yes" I could make it. If it helps you take the next real step, it has done its job.'),
      signoff(),
      p('P.S. You do not need to have this all figured out today. Even one trigger, handled well, changes more than people expect.'),
    ].join('');
  },
  textBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return `${ctx.firstName ? `${ctx.firstName}, quick` : 'Quick'} question.

Have you started on your Blueprint yet? The herb, the food swap, the lifestyle shift for your trigger?

If yes: good. Genuinely, that is the hardest part. Most people never even start.

If not yet, that is normal too. Knowing what to do and having a plan that actually fits into your day are two different things. That gap is where most good intentions quietly die.

That is exactly why I built the BraveWorks BP Reset Kit. It is not a bigger version of the Blueprint. It is what comes after it: the specific, step-by-step 10-day plan for actually addressing your #1 trigger, built the way I would build it for a patient sitting in front of me. Not a 40-page course. Not a subscription. A real starting point.

$17. Less than what most people spend on a single takeout order.

${name ? `You already know your trigger is ${name}. This kit picks up exactly there.` : 'You already know your loudest trigger. This kit picks up exactly there.'}

Get the BP Reset Kit ($17): ${kitUrl(ctx)}

I built this to be the easiest "yes" I could make it. If it helps you take the next real step, it has done its job.

${SIGNOFF_TEXT}

P.S. You do not need to have this all figured out today. Even one trigger, handled well, changes more than people expect.`;
  },
  // Martell A4: same-day evening resend for anyone still in 'lead' state
  // (i.e. has not purchased). Swapped subject + short body, same single CTA.
  resend: {
    afterHours: 8,
    windowHours: 30,
    subject: (ctx) => (ctx.firstName ? `Left this open for you, ${ctx.firstName}` : 'Left this open for you'),
    preheader: 'The $17 starting point from this morning, in case the day ran off with you.',
    htmlBody: (ctx) => {
      const name = triggerNameOf(ctx);
      return [
        p('Quick one, because days have a way of eating emails.'),
        p('Earlier today I sent you the note about the <strong>BraveWorks BP Reset Kit</strong>. Short version: your Blueprint told you the what. The kit is the day-by-day how, for your exact trigger, for $17.'),
        name ? p(`Yours is <strong>${name}</strong>. The kit picks up exactly there.`) : p('It picks up exactly where your quiz result left off.'),
        ctaButton('Get the BP Reset Kit, $17', kitUrl(ctx)),
        signoff(),
        p('P.S. If today was not the day, that is fine. It will still be here tomorrow.'),
      ].join('');
    },
    textBody: (ctx) => {
      const name = triggerNameOf(ctx);
      return `Quick one, because days have a way of eating emails.

Earlier today I sent you the note about the BraveWorks BP Reset Kit. Short version: your Blueprint told you the what. The kit is the day-by-day how, for your exact trigger, for $17.

${name ? `Yours is ${name}. The kit picks up exactly there.` : 'It picks up exactly where your quiz result left off.'}

Get the BP Reset Kit, $17: ${kitUrl(ctx)}

${SIGNOFF_TEXT}

P.S. If today was not the day, that is fine. It will still be here tomorrow.`;
    },
  },
};

// ─── DAY 9 — The other 4 triggers + gentle second ask ─────────────────
const day9 = {
  subject: 'What about the other 4?',
  preheader: 'Most people are surprised by which one shows up second.',
  htmlBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return [
      p('Remember what I said about triggers rarely acting alone?'),
      p(`${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the email where we come back to that.`),
      name
        ? p(`Your quiz pointed to <strong>${name}</strong> as the loudest. But here is what twenty years at the bedside taught me: it is almost never just one. Read through all 5 in your Blueprint and there is a good chance you will recognize yourself in at least one more. Not because I am telling you to, but because it will be sitting right there on the page and it will click.`)
        : p('Your quiz named your loudest trigger. But here is what twenty years at the bedside taught me: it is almost never just one. Read through all 5 in your Blueprint and there is a good chance you will recognize yourself in at least one more.'),
      p('That is not a flaw in the quiz. That is just how blood pressure actually works. It is rarely one clean cause. It is two or three quieter ones, stacked.'),
      p(`Open your Blueprint again. This time, read past your own trigger. <a href="${BLUEPRINT_URL}" style="color:${PALETTE.accentClay};font-weight:700;">(Need a fresh copy? It is here.)</a>`),
      p('Which one else sounds a little too familiar?'),
      p('That is usually the one worth addressing second, once the first one is underway, not before. You do not need to fix everything simultaneously. That is how people burn out and quit in week two.'),
      p('If you have already started on the Reset Kit for your #1 trigger, here is something worth knowing: the second trigger usually gets easier to address, because the first one is no longer draining your capacity.'),
      p('If you have not grabbed the kit yet, it is still here:'),
      ctaButton('Get the BP Reset Kit, $17', kitUrl(ctx)),
      p('One trigger at a time. That is not just a sign-off. It is the whole method.'),
      p('Joel Polley, RN'),
      p('P.S. No rush on any of this. Slow and real beats fast and abandoned, every time.'),
    ].join('');
  },
  textBody: (ctx) => {
    const name = triggerNameOf(ctx);
    return `Remember what I said about triggers rarely acting alone?

${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the email where we come back to that.

${name ? `Your quiz pointed to ${name} as the loudest.` : 'Your quiz named your loudest trigger.'} But here is what twenty years at the bedside taught me: it is almost never just one. Read through all 5 in your Blueprint and there is a good chance you will recognize yourself in at least one more. Not because I am telling you to, but because it will be sitting right there on the page and it will click.

That is not a flaw in the quiz. That is just how blood pressure actually works. It is rarely one clean cause. It is two or three quieter ones, stacked.

Open your Blueprint again and read past your own trigger (fresh copy: ${BLUEPRINT_URL}). Which one else sounds a little too familiar? That is usually the one worth addressing second, once the first one is underway, not before. You do not need to fix everything simultaneously. That is how people burn out and quit in week two.

If you have not grabbed the kit yet, it is still here: ${kitUrl(ctx)}

One trigger at a time. That is not just a sign-off. It is the whole method.
Joel Polley, RN

P.S. No rush on any of this. Slow and real beats fast and abandoned, every time.`;
  },
  resend: {
    afterHours: 8,
    windowHours: 30,
    subject: 'Circling back once (then I will drop it)',
    preheader: 'This morning’s note about the second trigger, in case it slipped past.',
    htmlBody: (ctx) => [
      p('One more pass on this morning’s note, then I will leave it alone.'),
      p('The short version: your loudest trigger almost never works alone. There is usually a quieter second one stacked underneath it, and your Blueprint already names all 5.'),
      p('If you want the day-by-day plan for your #1, it is still $17 and still here:'),
      ctaButton('Get the BP Reset Kit, $17', kitUrl(ctx)),
      signoff(),
      p('P.S. Either way, read past your own trigger in the Blueprint tonight. Three minutes. You will learn something about yourself.'),
    ].join(''),
    textBody: (ctx) => `One more pass on this morning's note, then I will leave it alone.

The short version: your loudest trigger almost never works alone. There is usually a quieter second one stacked underneath it, and your Blueprint already names all 5.

If you want the day-by-day plan for your #1, it is still $17 and still here:
${kitUrl(ctx)}

${SIGNOFF_TEXT}

P.S. Either way, read past your own trigger in the Blueprint tonight. Three minutes. You will learn something about yourself.`,
  },
};

// ─── DAY 12 — Soft bridge to Steady tea ───────────────────────────────
const day12 = {
  subject: 'The piece I almost did not mention',
  preheader: 'This is not something I usually talk about, but it is too relevant not to.',
  htmlBody: (ctx) => [
    p(`${ctx.firstName ? `${ctx.firstName}, I` : 'I'} want to tell you about something a little outside my usual lane.`),
    p('My wife Annie is a nurse too. She spends her time on hormone health, not blood pressure. Different focus, same instinct: find the root cause instead of managing symptoms forever.'),
    p('Here is why I am bringing her up.'),
    p('For a lot of women, the years when blood pressure starts climbing are the exact same years hormones start shifting: perimenopause, menopause, the whole stretch most doctors gloss over in a 12-minute appointment. Nobody usually connects those two conversations. They happen in completely separate rooms, with completely separate doctors, like they are unrelated.'),
    p('They are often not.'),
    p('Annie makes a botanical tea called <strong>Steady</strong>, built around hibiscus and hawthorn, the same two herbs I mentioned in your Blueprint for fluid balance and circulation support. I would already have recommended those two on their own. She just happened to build something that makes them easy to actually have daily, instead of one more thing to remember.'),
    p('I am not going to pretend this fixes everything. It does not replace your Reset Kit, and it is not a substitute for anything your doctor has you on.'),
    p('But if the hormone piece of this has been quietly nagging at you too, it is worth a look.'),
    ctaButton('See Steady', TEA_URL),
    signoff(),
    p('P.S. No pressure here. This one is genuinely just a "thought you should know this exists," not a sales pitch.'),
  ].join(''),
  textBody: (ctx) => `${ctx.firstName ? `${ctx.firstName}, I` : 'I'} want to tell you about something a little outside my usual lane.

My wife Annie is a nurse too. She spends her time on hormone health, not blood pressure. Different focus, same instinct: find the root cause instead of managing symptoms forever.

Here is why I am bringing her up. For a lot of women, the years when blood pressure starts climbing are the exact same years hormones start shifting: perimenopause, menopause, the whole stretch most doctors gloss over in a 12-minute appointment. Nobody usually connects those two conversations. They are often not unrelated.

Annie makes a botanical tea called Steady, built around hibiscus and hawthorn, the same two herbs I mentioned in your Blueprint for fluid balance and circulation support. I would already have recommended those two on their own. She just happened to build something that makes them easy to actually have daily.

I am not going to pretend this fixes everything. It does not replace your Reset Kit, and it is not a substitute for anything your doctor has you on. But if the hormone piece of this has been quietly nagging at you too, it is worth a look:
${TEA_URL}

${SIGNOFF_TEXT}

P.S. No pressure here. This one is genuinely just a "thought you should know this exists," not a sales pitch.`,
};

// ─── DAY 15 — Invitation to coaching + handoff ────────────────────────
// If the record shows they already bought the $297 case review
// (ctx.caseReview === true), we sell nothing and just hand off warmly.
const day15 = {
  subject: (ctx) => (ctx.firstName ? `An invitation, ${ctx.firstName}` : 'An invitation'),
  preheader: 'This one is for the people who are ready to stop doing this alone.',
  htmlBody: (ctx) => {
    if (ctx.caseReview === true) {
      return [
        p(`${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the last email in this particular series, and it is a thank you, not a pitch. You already have my eyes on your case, so there is nothing here to sell you. Your next moves are coming from me directly.`),
        p('From here on, you will keep hearing from me, just less often, and usually because I found something worth sharing.'),
        p('Thank you for trusting me with this. I do not take that lightly.'),
        signoff(),
      ].join('');
    }
    return [
      p(`${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the last email in this particular series, so I want to make it count.`),
      p('Over the last couple weeks, you have gotten your trigger, your Blueprint, and a real starting plan. That is more clarity than most people ever get.'),
      p('For some people, that is genuinely enough. You take what you learned, you apply it, and you check back in with your doctor in a few months with better numbers and better questions. If that is you: that is a win. Truly.'),
      p('But some people read all of this and think: <em>I know what I need to do. I just do not want to do it alone, and I do not trust myself to stay consistent without someone checking in.</em>'),
      p('If that is you, I want you to know there is more available than what is in your inbox.'),
      p('I work with a small number of people directly, alongside the broader BraveWorks RN community. Real accountability, real check-ins, not just another course sitting unfinished on a hard drive.'),
      p('It is not for everyone, and it is not something I offer to everyone who takes the quiz. But if this resonates, I would rather you know it exists than wonder later if you missed it.'),
      ctaButton('Learn more and apply here', COACHING_URL),
      p('Whatever you decide: thank you for trusting me with this. I do not take that lightly.'),
      signoff(),
      p('P.S. You will keep hearing from me after this, just less often, and usually because I found something worth sharing, not because I am selling something.'),
    ].join('');
  },
  textBody: (ctx) => {
    if (ctx.caseReview === true) {
      return `${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the last email in this particular series, and it is a thank you, not a pitch. You already have my eyes on your case, so there is nothing here to sell you. Your next moves are coming from me directly.

From here on, you will keep hearing from me, just less often, and usually because I found something worth sharing.

Thank you for trusting me with this. I do not take that lightly.

${SIGNOFF_TEXT}`;
    }
    return `${ctx.firstName ? `${ctx.firstName}, this` : 'This'} is the last email in this particular series, so I want to make it count.

Over the last couple weeks, you have gotten your trigger, your Blueprint, and a real starting plan. That is more clarity than most people ever get.

For some people, that is genuinely enough. You take what you learned, you apply it, and you check back in with your doctor in a few months with better numbers and better questions. If that is you: that is a win. Truly.

But some people read all of this and think: I know what I need to do. I just do not want to do it alone, and I do not trust myself to stay consistent without someone checking in.

If that is you, I want you to know there is more available than what is in your inbox. I work with a small number of people directly, alongside the broader BraveWorks RN community. Real accountability, real check-ins, not just another course sitting unfinished on a hard drive.

It is not for everyone, and it is not something I offer to everyone who takes the quiz. But if this resonates, I would rather you know it exists than wonder later if you missed it:
${COACHING_URL}

Whatever you decide: thank you for trusting me with this. I do not take that lightly.

${SIGNOFF_TEXT}

P.S. You will keep hearing from me after this, just less often, and usually because I found something worth sharing, not because I am selling something.`;
  },
};

// Each day exports { subject, htmlBody(ctx), textBody(ctx) }. The engine calls
// these with ctx = { firstName, corner, trigger, triggerName, readiness,
// scores, paidTier, caseReview, email, unsubUrl }; buildEmail appends the
// compliance footer + shell.
function wrap(day) {
  const wrapped = {
    subject: day.subject,
    htmlBody: (ctx) =>
      buildEmail({
        preheader: day.preheader || (typeof day.subject === 'string' ? day.subject : ''),
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
      }).html,
    textBody: (ctx) =>
      buildEmail({
        preheader: day.preheader || (typeof day.subject === 'string' ? day.subject : ''),
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
      }).text,
  };
  // 2026-07-20: optional Martell-A4 resend variant. The engine sends this to
  // records whose first send is afterHours..windowHours old and who are still
  // in state (non-buyers), once, flagged `${sentFlag}Resent`.
  if (day.resend) {
    wrapped.resend = {
      afterHours: day.resend.afterHours,
      windowHours: day.resend.windowHours,
      subject: day.resend.subject,
      htmlBody: (ctx) =>
        buildEmail({
          preheader: day.resend.preheader || '',
          bodyHtml: day.resend.htmlBody(ctx),
          bodyText: day.resend.textBody(ctx),
          unsubUrl: ctx.unsubUrl,
        }).html,
      textBody: (ctx) =>
        buildEmail({
          preheader: day.resend.preheader || '',
          bodyHtml: day.resend.htmlBody(ctx),
          bodyText: day.resend.textBody(ctx),
          unsubUrl: ctx.unsubUrl,
        }).text,
    };
  }
  return wrapped;
}

export const LEAD_DAYS = {
  0: wrap(day0),
  2: wrap(day2),
  4: wrap(day4),
  6: wrap(day6),
  9: wrap(day9),
  12: wrap(day12),
  15: wrap(day15),
};

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req, res,
    state: 'lead',
    daysMap: LEAD_DAYS,
    sentFlag: leadSentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'LEAD_CRON_DRY_RUN',
    label: 'lead-emails',
  });
}
