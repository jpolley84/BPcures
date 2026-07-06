// api/triangle-lead-cron.js — LEAD nurture sequence + its daily cron.
//
// Audience: just gave email on the result page (state 'lead'). Goal: teach the
// BP Triangle (Stress / Sugar / Sodium) in Joel's RN voice and make the $17
// entry corner the primary ask, then a graceful exit into the weekly letter.
// The arc: Day 0 welcome, Day 2 stress, Day 4 sugar, Day 6 sodium + close,
// Day 9 last honest note + newsletter handoff.
//
// This file is BOTH the cron HTTP handler (default export, scheduled in
// vercel.json at /api/_lead-emails) AND the sequence definition. The shared
// engine (_state-cron.js) does the scanning / sending / idempotency, and the
// per-state transition (lead -> buyer) happens on purchase in
// stripe-webhook.js, never on a timer.
//
// Voice + compliance: warm, clinical-but-accessible, gratitude-first,
// NEWSTART-aligned. Education ALONGSIDE the doctor, never instead. No
// treat/cure/prescribe claims, never "stop your meds." ZERO em-dashes in body
// copy. Resend sender is joel@bpquiz.com (the live verified domain). The
// CAN-SPAM postal line + one-click unsubscribe are appended by the shared
// footer (see _email-shared.js) so every day carries them automatically.

import crypto from 'node:crypto';
import { runStateCron, cronConfig } from './_triangle-state-cron.js';
import {
  FROM, REPLY_TO, SITE_URL, PALETTE,
  p, h2, bigQuote, ctaButton, callout, buildEmail,
} from './_triangle-email.js';

export { FROM, REPLY_TO, SITE_URL };

// The single ask of the whole lead arc: the $17 entry-corner reset, at the
// LEAD'S OWN corner (the CTA text personalizes to their corner, so the URL
// must too — a Sugar lead lands on the Sugar kit, not the Stress one).
function entryUrl(corner) {
  const c = ['stress', 'sugar', 'sodium'].includes(corner) ? corner : 'stress';
  return `${SITE_URL}/pay?tier=corner&corner=${c}`;
}
const QUIZ_URL = `${SITE_URL}/quiz`;

// ─── /score re-open link (Day 0) ──────────────────────────────────────
// "Re-open your result" must reopen their SAVED result, not restart the quiz.
// /score?e=<email>&t=<token> where the token is the same HMAC the unsubscribe
// link uses (triangle-unsubscribe.js): sha256 HMAC of the lowercased email,
// hex, first 24 chars, keyed by UNSUB_SECRET (fallback CRON_SECRET).
const SCORE_SECRET = process.env.UNSUB_SECRET || process.env.CRON_SECRET || 'dev-unsub-secret';

function scoreToken(email) {
  const e = String(email || '').trim().toLowerCase();
  return crypto.createHmac('sha256', SCORE_SECRET).update(e).digest('hex').slice(0, 24);
}

// The engine's ctx may not carry the raw email, but ctx.unsubUrl always does
// (its token is base64url of "email:sig"). Prefer ctx.email when present,
// otherwise recover the address from the unsubscribe token.
function emailFromCtx(ctx) {
  if (ctx?.email) return String(ctx.email).trim().toLowerCase();
  try {
    const token = new URL(ctx.unsubUrl).searchParams.get('token');
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const idx = decoded.lastIndexOf(':');
    return idx > 0 ? decoded.slice(0, idx) : null;
  } catch {
    return null;
  }
}

function resultUrl(ctx) {
  const email = emailFromCtx(ctx);
  if (!email) return QUIZ_URL;
  return `${SITE_URL}/score?e=${encodeURIComponent(email)}&t=${scoreToken(email)}`;
}

// Per-day sent-flag field name (idempotency key on the drip record).
export function leadSentFlag(day) {
  return `leadDay${day}Sent`;
}

// Personalize on the lead's quiz corner when we have it; otherwise speak to
// "your loudest corner" generically. ctx.corner is one of stress|sugar|sodium.
function cornerLabel(corner) {
  const map = { stress: 'Stress', sugar: 'Sugar', sodium: 'Sodium' };
  return map[corner] || null;
}

// Format the ownable three-number BP Triangle Score for the email open. Returns
// a phrase like "Stress 70, Sugar 45, Sodium 30" or null when scores are
// missing/malformed (older leads), so the body can fall back to the corner-only
// line. A driver/intensity reading, never a clinical or BP number.
function scoreLine(scores) {
  if (!scores || typeof scores !== 'object') return null;
  const parts = [];
  for (const [key, label] of [['stress', 'Stress'], ['sugar', 'Sugar'], ['sodium', 'Sodium']]) {
    const v = scores[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    parts.push(`${label} ${Math.max(0, Math.min(100, Math.round(v)))}`);
  }
  return parts.join(', ');
}

function entryCta(corner) {
  const label = cornerLabel(corner);
  const text = label
    ? `Yes, start my ${label} reset today`
    : 'Yes, start my reset today';
  return ctaButton(text, entryUrl(corner));
}

// ─── App waitlist (secondary CTA, Days 0/2/4) ─────────────────────────
// One primary CTA per email stays the rule; the waitlist rides as a short
// callout with a text link (never a competing button). Copy makes no health
// claims: the app logs, charts, and reports. Spot numbers are real (KV INCR).
const WAITLIST_URL = 'https://bpquiz.com/waitlist?utm_source=email&utm_medium=lead-arc&utm_campaign=app-waitlist';

const WAITLIST_CALLOUTS = {
  day0: {
    kicker: 'New: the BraveWorksRN app',
    html: `I am building the BraveWorksRN iPhone app: log your reading in seconds, see your 30 day pattern, and hand your doctor a clean one page report. The waitlist just opened and every spot has a real number. <a href="${WAITLIST_URL}" style="color:${PALETTE.accentClay};font-weight:700;">Save your spot in line here.</a>`,
    text: `NEW: THE BRAVEWORKSRN APP\nLog your reading in seconds, see your 30 day pattern, hand your doctor a one page report. The waitlist just opened and every spot has a real number: ${WAITLIST_URL}`,
  },
  day2: {
    kicker: 'While you practice the breath',
    html: `A notebook works. The BraveWorksRN app will work better: seconds to log a reading, your 30 day pattern on one screen, a doctor report in one tap. Spots in line are numbered. <a href="${WAITLIST_URL}" style="color:${PALETTE.accentClay};font-weight:700;">Save yours here.</a>`,
    text: `WHILE YOU PRACTICE THE BREATH\nThe BraveWorksRN app: seconds to log a reading, your 30 day pattern on one screen, a doctor report in one tap. Save your numbered spot: ${WAITLIST_URL}`,
  },
  day4: {
    kicker: 'Your readings, on one page',
    html: `The BraveWorksRN app turns your daily readings into the one page your doctor actually wants to see. Coming first to iPhone. <a href="${WAITLIST_URL}" style="color:${PALETTE.accentClay};font-weight:700;">Join the waitlist here.</a>`,
    text: `YOUR READINGS, ON ONE PAGE\nThe BraveWorksRN app turns daily readings into the one page your doctor actually wants. Coming first to iPhone. Join the waitlist: ${WAITLIST_URL}`,
  },
};

function waitlistCallout(key) {
  const c = WAITLIST_CALLOUTS[key];
  return callout({ kicker: c.kicker, body: c.html });
}

// ─── DAY 0 — Welcome + the Triangle (three faucets, one sink) ─────────
const day0 = {
  subject: 'Three faucets, one sink',
  preheader: 'Your blood pressure is not one problem. It is three corners feeding one number, and your quiz found the loudest.',
  htmlBody: (ctx) => {
    const { firstName, corner, scores } = ctx;
    const label = cornerLabel(corner);
    const line = scoreLine(scores);
    // Prefer the ownable three-number open when we have the score. Otherwise
    // fall back to the corner-only line, then the generic line.
    const cornerLine = line
      ? p(`Here is your BP Triangle Score from the quiz: <strong>${line}</strong>${label ? `, which makes <strong>${label}</strong> your loudest corner right now` : ''}. That is a driver reading, how hard each corner is pushing your numbers, not a blood pressure number. Good. It means we already know where to start, and we start there together.`)
      : label
        ? p(`Your quiz pointed at the <strong>${label}</strong> corner as the loudest one driving your numbers right now. Good. That means we already know where to start, and we start there together.`)
        : p(`Your quiz pointed at the corner driving your numbers most right now. Good. That means we already know where to start.`);
    return [
      p(`Hi ${firstName || 'there'},`),
      p(`First, thank you. You put your email in, and most people scroll right past. You stopped. That small decision is the part most people never make.`),
      p(`I am Joel. I spent twenty years as a nurse, most of it in the ICU and the emergency room, managing blood pressure from the crash cart side of the bed. Then I crossed over and trained as a naturopathic practitioner. The people I walk with are mostly tired of being told their pressure is "just genetic." It is not just genetic, and over the next few days I am going to show you why.`),
      cornerLine,
      h2('Your number is really three numbers'),
      p(`Here is the picture I want you to carry. Your blood pressure is not one problem. It is a loop with three corners, and they feed each other:`),
      p(`<strong>Stress</strong> sends out cortisol, and cortisol tells your kidneys to hold sodium. <strong>Sugar</strong> spikes insulin, and insulin tells your kidneys to hold sodium too. <strong>Sodium</strong> holds water, water raises your blood volume, and volume pushes the number on your cuff up. Three faucets, one sink.`),
      bigQuote('The system treats the symptom. The pill hides the number. The Triangle calms the loop, the cause.'),
      p(`That is why you cannot fix this by attacking one corner and ignoring the other two. We walk the whole loop. Over the next few emails I will take you through each corner, one at a time, in plain English you can explain to a friend.`),
      callout({
        kicker: 'What to do first',
        body: `If you have not read your full result yet, it is waiting for you. It names your loudest corner and the one first move for it. <a href="${resultUrl(ctx)}" style="color:${PALETTE.accentClay};font-weight:700;">Re-open your result here.</a>`,
      }),
      waitlistCallout('day0'),
      p(`Tomorrow we open the first corner. Rest well tonight.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const { firstName, corner, scores } = ctx;
    const label = cornerLabel(corner);
    const line = scoreLine(scores);
    const cornerLine = line
      ? `Here is your BP Triangle Score from the quiz: ${line}${label ? `, which makes ${label} your loudest corner right now` : ''}. That is a driver reading (how hard each corner pushes your numbers), not a blood pressure number.`
      : label
        ? `Your quiz pointed at the ${label} corner as the loudest one driving your numbers right now.`
        : `Your quiz pointed at the corner driving your numbers most right now.`;
    return `Hi ${firstName || 'there'},

First, thank you. You put your email in, and most people scroll right past. You stopped.

I am Joel, a nurse for twenty years (most of it ICU and ER), now a naturopathic practitioner. Your blood pressure is not "just genetic," and over the next few days I will show you why.

${cornerLine}

YOUR NUMBER IS REALLY THREE NUMBERS
Stress sends out cortisol, which tells your kidneys to hold sodium. Sugar spikes insulin, which tells your kidneys to hold sodium too. Sodium holds water, water raises your blood volume, and volume pushes your cuff up. Three faucets, one sink.

The system treats the symptom and the pill hides the number. The Triangle calms the loop, the cause.

Re-open your full result: ${resultUrl(ctx)}

${WAITLIST_CALLOUTS.day0.text}

Tomorrow we open the first corner. Rest well tonight.
Joel Polley, RN`;
  },
};

// ─── DAY 2 — The STRESS corner (cortisol) ─────────────────────────────
const day2 = {
  subject: 'The first faucet: cortisol',
  preheader: 'A bear in the road and a 2 AM worry look the same to your body. Here is the free move that calms both.',
  htmlBody: ({ firstName, corner }) => [
    p(`Hi ${firstName || 'there'},`),
    p(`Let me take you into the first corner: stress.`),
    p(`Your body does not know the difference between a bear in the road and a 2 AM worry about money. It pumps out a hormone called cortisol either way. Cortisol does two things that lift your pressure. It tightens your blood vessels, so the same blood has to push through narrower pipes. And it tells your kidneys to hold onto sodium, so you carry more fluid, and more fluid means more pressure against the walls.`),
    p(`There is a third thing, and it is the doorway to the next corner. Cortisol also spikes your blood sugar. That is the hand off. Stress feeds sugar, sugar feeds sodium, and the loop keeps turning.`),
    h2('The one first move'),
    p(`In a healthy body cortisol rises, the threat passes, and it falls. The trouble is that modern life never lets it stop. The alarm is stuck on high. So the first lever is not a pill, it is your own breath.`),
    callout({
      kicker: 'Try this today',
      body: `Paced breathing. Breathe in through your nose for a count of 4, then let the breath out slow and unhurried for a count of 6. Five minutes, once in the afternoon when cortisol tends to spike, and once before bed. The long exhale pulls the brake on your stress nerve directly. It is free, it travels with you, and most people feel their sleep deepen within a few nights.`,
    }),
    p(`That is the corner in miniature. Find the cause, take out what feeds it, add what calms it. Your own 10 day reset walks your loudest corner the same way, day by day, including the foods and the herbs I actually trust, with the safety cautions spelled out.`),
    entryCta(corner),
    waitlistCallout('day2'),
    p(`Tomorrow, the corner most people never suspect. Rest well.`),
    p(`Joel Polley, RN`),
  ].join(''),
  textBody: ({ firstName, corner }) => `Hi ${firstName || 'there'},

The first corner is stress.

Your body cannot tell a bear in the road from a 2 AM worry. It releases cortisol either way. Cortisol tightens your vessels (narrower pipes, higher pressure) and tells your kidneys to hold sodium (more fluid, higher pressure). It also spikes your blood sugar, which is the hand off to the next corner.

THE ONE FIRST MOVE
Paced breathing. Breathe in through your nose for 4, then let the breath out slow for 6. Five minutes in the afternoon and again before bed. The long exhale pulls the brake on your stress nerve. Free, and most people sleep deeper within a few nights.

Your own 10 day reset walks your loudest corner day by day, with the foods and the herbs I trust and the cautions spelled out:
${entryUrl(corner)}

${WAITLIST_CALLOUTS.day2.text}

Tomorrow, the corner most people never suspect.
Joel Polley, RN`,
};

// ─── DAY 4 — The SUGAR corner (insulin) ───────────────────────────────
const day4 = {
  subject: 'The faucet hiding in your bread',
  preheader: 'It is not just the candy. Bread, white rice, and cereal quietly feed a sodium problem. And it is reversible.',
  htmlBody: ({ firstName, corner }) => [
    p(`Hi ${firstName || 'there'},`),
    p(`The second corner surprises almost everyone, because it is not just the candy. It is the bread, the white rice, the cereal, the "healthy" snacks. Sugar.`),
    p(`Here is the chain. You eat refined sugar or refined carbs. Your blood sugar spikes. Your pancreas answers by pouring out insulin. And insulin, like cortisol, reaches over to your kidneys and tells them to hold onto sodium. Where sodium goes, water follows, your blood volume rises, and your pressure climbs. Your sugar habit has been quietly feeding a sodium problem the whole time, behind the scenes.`),
    p(`The good news is the part most people are never told. This is reversible. Your body was engineered to regulate blood sugar, and it starts the moment you stop overwhelming it.`),
    h2('The one first move'),
    callout({
      kicker: 'Try this today',
      body: `A morning walk, about 20 minutes, within an hour of waking, outside. Walking opens a back door on your muscle cells that lets glucose leave your blood without needing insulin to unlock it. The morning light helps reset the same rhythm that tangles with cortisol. Your legs are a blood sugar tool you already own, and you can use them as many times a day as you like.`,
    }),
    p(`Your own 10 day reset does the same for your loudest corner: one plain move each morning, the foods, and the herbs I trust, all with the doctor conversation built in (because if you take medication, that dial belongs to your doctor, never to you alone).`),
    entryCta(corner),
    waitlistCallout('day4'),
    p(`Tomorrow we reach the corner where all three rivers meet. Rest well.`),
    p(`Joel Polley, RN`),
  ].join(''),
  textBody: ({ firstName, corner }) => `Hi ${firstName || 'there'},

The second corner surprises almost everyone, because it is not just the candy. It is the bread, the white rice, the cereal. Sugar.

You eat refined sugar or refined carbs. Blood sugar spikes. Your pancreas pours out insulin. Insulin, like cortisol, tells your kidneys to hold sodium. Water follows sodium, blood volume rises, pressure climbs. Your sugar habit has been feeding a sodium problem the whole time.

The good news: this is reversible. Your body was built to regulate blood sugar once you stop overwhelming it.

THE ONE FIRST MOVE
A morning walk, about 20 minutes, within an hour of waking, outside. Walking lets glucose leave your blood without insulin, and the morning light resets the rhythm that tangles with cortisol.

Your own 10 day reset does the same for your loudest corner, one plain move each morning, with the doctor conversation built in:
${entryUrl(corner)}

${WAITLIST_CALLOUTS.day4.text}

Tomorrow, the corner where all three rivers meet.
Joel Polley, RN`,
};

// Readiness-aware line for the Day 6 close. ctx.readiness is the tag the quiz
// stored on the lead's record (capture-lead.js). It is OPTIONAL, so when it is
// absent we add nothing and the close reads exactly as before. Education
// alongside the doctor, never advice to change medication on their own.
//   on_meds_want_off  -> they told us they want to work toward less medication
//   borderline_avoid  -> borderline and wanting to avoid starting medication
//   newly_diagnosed   -> a fresh diagnosis, wanting to understand it
function readinessLineHtml(readiness) {
  if (readiness === 'on_meds_want_off') {
    return p(`You told me you want to work toward less medication. Here is how, with your doctor in the loop the whole way. The reset gives you the lifestyle levers that lower the pressure at its source, and as your numbers come down your doctor is the one who decides if and when anything about your prescription changes. We never touch that on our own. Your job is to bring them better numbers, their job is the dial.`);
  }
  if (readiness === 'borderline_avoid') {
    return p(`You told me your numbers are borderline and you want to avoid medication if you can. This is exactly the window where the corners matter most, because the loop is still early and the most responsive to lifestyle. Working it now, alongside your doctor, is the honest shot at keeping it from becoming a daily pill.`);
  }
  if (readiness === 'newly_diagnosed') {
    return p(`You told me this diagnosis is new. That is a lot to take in, and you are already doing the right first thing, understanding what is actually driving the number instead of just reacting to it. Walk the corners alongside your doctor, bring them what you learn, and you turn a scary label into a plan you understand.`);
  }
  return '';
}

function readinessLineText(readiness) {
  if (readiness === 'on_meds_want_off') {
    return `You told me you want to work toward less medication. Here is how, with your doctor in the loop. The reset gives you the lifestyle levers that lower pressure at its source, and your doctor is the one who decides if and when anything about your prescription changes. We never touch that on our own.\n\n`;
  }
  if (readiness === 'borderline_avoid') {
    return `You told me your numbers are borderline and you want to avoid medication if you can. This is the window where the corners matter most, because the loop is still early and most responsive to lifestyle. Working it now, alongside your doctor, is the honest shot at keeping it from becoming a daily pill.\n\n`;
  }
  if (readiness === 'newly_diagnosed') {
    return `You told me this diagnosis is new. You are already doing the right first thing, understanding what is driving the number instead of just reacting to it. Walk the corners alongside your doctor and you turn a scary label into a plan you understand.\n\n`;
  }
  return '';
}

// ─── DAY 6 — The SODIUM corner + the close ────────────────────────────
const day6 = {
  subject: 'Three rivers, one lake',
  htmlBody: ({ firstName, corner, readiness }) => {
    const label = cornerLabel(corner);
    const startLine = label
      ? p(`Your loudest corner is <strong>${label}</strong>, so that is where your reset begins. You do not have to fix all three at once. You start where your body is shouting loudest, and the relief from that one corner is what carries you into the rest.`)
      : p(`You do not have to fix all three at once. You start at your loudest corner, the one your quiz found, and the relief from that one corner is what carries you into the rest.`);
    const readyLine = readinessLineHtml(readiness);
    return [
      p(`Hi ${firstName || 'there'},`),
      p(`Here is where the whole Triangle comes together: sodium.`),
      p(`Sodium pulls water. Where sodium goes, water follows, so when there is too much sodium in your bloodstream, your body holds extra water, your blood volume rises, and the number on your cuff goes up. But remember the other two corners. Stress sends cortisol that tells your kidneys to hold sodium. Sugar spikes insulin that tells your kidneys to hold sodium. Three rivers, one lake. Sodium is the downstream meeting point where stress and sugar both empty out, plus the salt you actually eat.`),
      p(`And the salt shaker is almost never the real problem. The large majority of the sodium people eat is already baked into packaged and restaurant food before it ever reaches the table. The bread, the canned soup, the deli meat, the sauces.`),
      h2('The one first move'),
      callout({
        kicker: 'Try this today',
        body: `Drink your body weight in pounds as ounces of water across the day, water only, starting with about 16 ounces the moment you wake. People assume more water makes you hold water. The opposite is true. Proper hydration turns down the very hormone that makes your kidneys hoard fluid and squeeze your vessels, and it gives your kidneys what they need to flush the extra sodium out.`,
      }),
      h2('Where to start'),
      startLine,
      readyLine,
      p(`Here is the whole week in one breath. Your pressure is not a life sentence written into your genes. It is a loop with three corners, and a loop can be calmed. You already know which corner is loudest, because your quiz found it. That is the part most people never reach, and you already have it.`),
      p(`So the 10 day reset is not a leap, it is the next step in something you already believe. For $17 you get ten days, one plain move each morning, the foods and the herbs I trust for your corner, walked beside you and alongside your doctor. If you ever want the whole loop closed, the full 30 day Triangle is one easy click away right after.`),
      entryCta(corner),
      p(`Whatever you decide, you already understand your own body better than you did a week ago, and no one can take that back. Thank you for letting me walk these days with you.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: ({ firstName, corner, readiness }) => {
    const label = cornerLabel(corner);
    const startLine = label
      ? `Your loudest corner is ${label}, so that is where your reset begins. You start where your body is shouting loudest.`
      : `You start at your loudest corner, the one your quiz found.`;
    const readyText = readinessLineText(readiness);
    return `Hi ${firstName || 'there'},

The whole Triangle comes together at sodium.

Sodium pulls water. Too much sodium means your body holds extra water, blood volume rises, the cuff goes up. And remember: stress (cortisol) and sugar (insulin) BOTH tell your kidneys to hold sodium. Three rivers, one lake. The salt shaker is almost never the real problem; most sodium is already baked into packaged and restaurant food.

THE ONE FIRST MOVE
Drink your body weight in pounds as ounces of water across the day, water only, starting with about 16 oz on waking. More water actually helps your body release water and flush sodium, not hold it.

WHERE TO START
${startLine}

${readyText}Here is the whole week in one breath: your pressure is not a life sentence in your genes, it is a loop with three corners, and a loop can be calmed. You already know which corner is loudest, because your quiz found it. So the 10 day reset is not a leap, it is the next step in something you already believe: for $17, ten days of one plain move each morning, the foods and the herbs I trust for your corner, alongside your doctor. The full 30 day Triangle is one easy click away right after.

Start here: ${entryUrl(corner)}

Thank you for letting me walk these days with you.
Joel Polley, RN`;
  },
};

// ─── DAY 9 — The gentle close + weekly-letter handoff ─────────────────
// The last note of this series. One honest CTA at the lead's own corner, no
// countdown, no tricks, then the handoff: from here they hear from Joel in the
// weekly letter. If the record shows they already bought the $297 case review
// (ctx.caseReview === true), we sell nothing at all and just hand off warmly.
const day9 = {
  subject: 'My last note (and what happens next)',
  htmlBody: (ctx) => {
    const { firstName, corner } = ctx;
    if (ctx.caseReview === true) {
      return [
        p(`Hi ${firstName || 'there'},`),
        p(`This is the last note in this little series, and it is a thank you, not a pitch. You already have my eyes on your case, so there is nothing here to sell you. Your next moves are coming from me directly.`),
        p(`From here on, you will hear from me in my weekly letter: what I am seeing work, plain answers, no noise. You are on that list, and you can step off anytime with one click.`),
        p(`Thank you for trusting me with your case. I do not take that lightly.`),
        p(`Joel Polley, RN`),
      ].join('');
    }
    return [
      p(`Hi ${firstName || 'there'},`),
      p(`This is the last note in this little series, so let me be straight with you, the way I would at the bedside.`),
      p(`Nothing about your blood pressure changed because these emails ended. The three corners are still doing what they do. And the 10 day reset is still the simplest way I know to start calming your loudest one: one plain move each morning, the foods and the herbs I trust, alongside your doctor. It is $17.`),
      entryCta(corner),
      p(`No countdown, no tricks. The door is open tonight, and it will still be open in three months.`),
      p(`From here on, you will hear from me in my weekly letter: what I am seeing work, honest answers to reader questions, no noise. You are on that list, and you can step off anytime with one click.`),
      p(`Thank you for giving me a week of your attention. That is not a small thing.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const { firstName, corner } = ctx;
    if (ctx.caseReview === true) {
      return `Hi ${firstName || 'there'},

This is the last note in this little series, and it is a thank you, not a pitch. You already have my eyes on your case, so there is nothing here to sell you. Your next moves are coming from me directly.

From here on, you will hear from me in my weekly letter: what I am seeing work, plain answers, no noise. You can step off anytime with one click.

Thank you for trusting me with your case.
Joel Polley, RN`;
    }
    return `Hi ${firstName || 'there'},

This is the last note in this little series, so let me be straight with you, the way I would at the bedside.

Nothing about your blood pressure changed because these emails ended. The three corners are still doing what they do. And the 10 day reset is still the simplest way I know to start calming your loudest one: one plain move each morning, the foods and the herbs I trust, alongside your doctor. It is $17.

Start here: ${entryUrl(corner)}

No countdown, no tricks. The door is open tonight, and it will still be open in three months.

From here on, you will hear from me in my weekly letter: what I am seeing work, honest answers to reader questions, no noise. You can step off anytime with one click.

Thank you for giving me a week of your attention.
Joel Polley, RN`;
  },
};

// Each day exports { subject, htmlBody(ctx), textBody(ctx) }. The engine calls
// these with ctx = { firstName, unsubUrl }; we additionally read ctx.corner,
// which capture-lead.js stores on the drip record (the engine spreads the full
// record fields where available via firstName, and corner is passed through by
// _state-cron through the sub object). To keep the bodies pure we wrap each day
// so the engine's ctx (firstName, unsubUrl) plus the record's corner both reach
// the body, and buildEmail appends the compliance footer + shell.
function wrap(day) {
  // Preheader completes the subject's thought (never repeats it) — inbox
  // preview text is the cheapest open-rate lift available. Falls back to the
  // subject for any day that has not authored one yet.
  return {
    subject: day.subject,
    htmlBody: (ctx) =>
      buildEmail({
        preheader: day.preheader || day.subject,
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
      }).html,
    textBody: (ctx) =>
      buildEmail({
        preheader: day.preheader || day.subject,
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
      }).text,
  };
}

export const LEAD_DAYS = {
  0: wrap(day0),
  2: wrap(day2),
  4: wrap(day4),
  6: wrap(day6),
  9: wrap(day9),
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
