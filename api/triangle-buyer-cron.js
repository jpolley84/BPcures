// api/triangle-buyer-cron.js — BUYER delivery / onboarding sequence + cron.
//
// Audience: bought on the 3-tier ladder, corner ($17) / top2 ($47) / complete
// ($97) (state 'buyer', set by stripe-webhook.js on purchase). Goal: walk the
// buyer through their 30-day Triangle journey, going DEEPER on the science than
// the PDFs do. The kit links go out IMMEDIATELY in the at-purchase email from
// stripe-webhook.js (Day 0). This cron handles every day after.
//
// ─── The 30-day arc (days-since-purchase) ─────────────────────────────
// The journey is 3 corners x 10 days. The buyer starts at their LOUDEST corner,
// then the next, then the third, in their Triangle-Score order (derived from
// ctx.scores, descending, via orderedCorners()). Each corner gets ONE deeper
// "science" email at the START of its 10-day block, the in-depth companion to
// that corner's PDF, a notch more scientific than the daily protocol:
//
//   Day 1   Welcome + your one first move           (all tiers)
//   Day 2   Corner 1 science deep-dive              (all tiers)
//   Day 3   Daily protocol prompt (one tiny move)   (all tiers)
//   Day 4   Daily protocol prompt                   (all tiers)
//   Day 5   Early check-in (what to watch)          (all tiers)
//   Day 6   Daily protocol prompt                   (all tiers)
//   Day 7   Pure check-in (reply and tell me)       (all tiers, zero selling)
//   Day 8   Daily protocol prompt                   (all tiers)
//   Day 9   Daily protocol prompt + cuff teaser     (all tiers)
//   Day 10  Milestone: two readings, hit reply      (all tiers, zero selling)
//   Day 11  Corner 2 science deep-dive              (top2 + complete only)
//   Day 12  Upgrade moment (post felt-result)       (tier-branched; see day12)
//   Day 21  Corner 3 science deep-dive              (complete only)
//   Day 30  Graduation                              (ALL tiers, complete-flavored)
//
// Days 3 through 10 are the ADHERENCE ENGINE: the protocol's core window. Each
// sends ONE tiny corner-aware action, a reply-DONE micro-commitment, and
// celebration copy. Zero selling in that window. The ascension ask lives at
// Day 12, after the Day 10 readings (the felt-result moment), at the honest
// difference prices ($20 / $50 / $70), with a soft $297 case-review door for
// every tier. Records with caseReview:true never see a case-review pitch.
//
// Tier gating (which corners a buyer's tier includes):
//   corner   -> just corner 1            (Day 11/21 science skips via shouldSend)
//   top2     -> corners 1 + 2            (Day 21 science skips via shouldSend)
//   complete -> all 3 + Freedom Finale   (gets every day; Day 12 skips only
//                                         when they also bought the case review)
// The shared engine (_state-cron.js) sends daysMap[day] to everyone in state
// 'buyer' on that day, so the corner-2 / corner-3 / graduation days carry a
// shouldSend(ctx) gate that opts out tiers which do not include that slot. Days
// without shouldSend always send.
//
// Branching is by paidTier (carried on the drip record, surfaced as ctx.paidTier
// by _state-cron.js), normalized to corner / top2 / complete (legacy 'entry' and
// 'triangle' map to corner / complete). Corner order + which corner sits in each
// slot is derived from ctx.scores; everything falls back gracefully when the
// scores or corner are missing (orderedCorners() anchors on ctx.corner, then on
// the sodium-first convergence order).
//
// This file is BOTH the cron HTTP handler (default export, scheduled in
// vercel.json at /api/buyer-cron) AND the sequence definition. The shared engine
// (_state-cron.js) does scanning / sending / idempotency. State only changes on
// purchase, never on a timer.
//
// Voice + compliance: Joel Polley, RN. Education ALONGSIDE the doctor, never
// instead. Education only, no per-person doses in the email (the doses live in
// the purchased PDF), research numbers framed as "in studies" not promises, no
// treat/cure/prescribe, never "stop your meds," NEWSTART-aligned. ZERO em-dashes.
// Resend sender is joel@bpquiz.com. CAN-SPAM postal line + one-click unsubscribe
// are appended by the shared footer automatically.

import { runStateCron, cronConfig } from './_triangle-state-cron.js';
import {
  FROM, REPLY_TO, SITE_URL, PALETTE,
  p, h2, bigQuote, callout, ctaButton, buildEmail,
} from './_triangle-email.js';
import { entryModuleFor, normalizeTier, orderedCorners } from './_kit-manifest.js';

export { FROM, REPLY_TO, SITE_URL };

const LIBRARY_URL = `${SITE_URL}/library`;

// Day 12 upgrade links: the buyer pays only the DIFFERENCE, never twice for
// what they already own. These are the same live Stripe payment links /welcome
// uses (one price per rung, everywhere). Do not swap in the full-price $97
// link here; the full-price path double-charges upgraders for owned content.
// 2026-07 ladder: ONE kit upgrade, the corner -> complete OTO for $27 additional
// (Joel: better psychological number than the raw $30 difference). Legacy top2
// owners use the same link. The upsell from complete is the $97 1:1 call with
// Joel (Calendly after pay).
const UPGRADE_TO_COMPLETE_OTO_URL = process.env.UPGRADE_CORNER_TO_COMPLETE_OTO_LINK || 'https://buy.stripe.com/fZu9AT9o71vo0IXc7DfnO1s'; // +$27
const CALL_97_URL = process.env.CALL_97_LINK || 'https://buy.stripe.com/3cI9AT9o7a1U2R58VrfnO1q'; // $97 1:1 call

// The $297 "Joel's Eyes On Your Case" personal case review. Soft, secondary
// door for EVERY tier (Day 12 + Day 30), pointing at the on-site page (which
// holds the story, the honest 5-a-month capacity line, and the buy button).
// Records with caseReview:true (they already bought it) never see this pitch.
const CASE_REVIEW_PAGE_URL = `${SITE_URL}/case-review`;

// Has this buyer already purchased the $297 case review? The drip record
// carries caseReview:true when they have (set by triangle-webhook). Defensive:
// absent field means "has not bought it" and the soft pitch shows as normal.
function boughtCaseReview(ctx) {
  return ctx.caseReview === true;
}

export function buyerSentFlag(day) {
  return `buyerDay${day}Sent`;
}

// ─── Tier helpers ─────────────────────────────────────────────────────
// Did the buyer already get the whole loop? Only the Complete tier ($97, all
// three corners + the Freedom Finale) means "no upsell." corner + top2 still
// have room to grow into Complete.
function isComplete(ctx) {
  return normalizeTier(ctx.paidTier) === 'complete';
}

// The top2 buyer ($47) has their two loudest corners + the Skool trial, but not
// the third corner or the Freedom Finale. Their Day 7 nudge is different from a
// single-corner buyer's: they are one corner away from the closed loop.
function isTop2(ctx) {
  return normalizeTier(ctx.paidTier) === 'top2';
}

// How many corners the buyer's tier includes: corner -> 1, top2 -> 2,
// complete -> 3. Used by the science-email gates so a slot-2 / slot-3 deep-dive
// only ships to a tier that actually owns that corner.
function cornersIncluded(ctx) {
  const t = normalizeTier(ctx.paidTier);
  if (t === 'complete') return 3;
  if (t === 'top2') return 2;
  return 1;
}

// Display name for a corner key.
const CORNER_NAME = { stress: 'Stress', sugar: 'Sugar', sodium: 'Sodium' };

// The buyer's corners in walk order (loudest first), from their quiz scores.
// Falls back through ctx.corner to the convergence order when scores are absent.
function cornersFor(ctx) {
  return orderedCorners(ctx.scores, ctx.corner);
}

// Per-corner "what to do first" keystone move, so Day 1 speaks to the exact
// corner an entry buyer received.
const FIRST_MOVE = {
  stress: 'paced breathing, five minutes, breathe in slowly through your nose for a count of 4 and let the exhale out long and unhurried for a count of 6, once in the afternoon when cortisol tends to spike and once before bed; the long exhale is what pulls the brake on your stress nerve',
  sugar: 'a 20 minute walk outside within an hour of waking',
  sodium: 'drinking your body weight in pounds as ounces of water across the day, water only, starting with 16 ounces on waking',
};

// ─── DAY 1 — What to do first ─────────────────────────────────────────
const day1 = {
  subject: 'Open this first (your first move is one thing)',
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    if (isComplete(ctx)) {
      return [
        p(`Hi ${firstName},`),
        p(`Your full 30 day Triangle is in your hands. Each of the three corners comes as a set of three pieces (the day by day protocol, that corner's Herb Formulary, and its one page Bring This To Your Doctor sheet), and the Freedom Finale closes the loop. It can look like a lot at once, so let me make your first move simple.`),
        h2('Do not start all three corners at the same time'),
        p(`Start at your loudest corner, the one your quiz pointed to, and give it the first ten days. The relief from calming that one corner is what carries you into the next. Then you walk the second corner, then the third, then the Freedom Finale teaches you how to step back and let your body hold the gains. One corner at a time, building day on day. Consistency beats intensity, every time.`),
        callout({
          kicker: 'Today',
          body: `Open your loudest corner's module, read Day 1, and take your baseline blood pressure (sit quietly five minutes, feet flat, same arm, average two or three readings). No judgment, just data. That number is your starting line, and you will measure everything against it.`,
        }),
        p(`Over the next few weeks I will send you one deeper email per corner, the science behind what the daily steps are doing, so you understand the why and not just the what. Your kit lives here and your access never expires: <a href="${LIBRARY_URL}" style="color:${PALETTE.accentClay};font-weight:700;">your library</a>.`),
        p(`I am proud of you for going after the cause instead of just the number. More tomorrow.`),
        p(`Joel Polley, RN`),
      ].join('');
    }
    const mod = entryModuleFor(ctx.corner);
    const move = FIRST_MOVE[mod.corner] || FIRST_MOVE.sodium;
    const cornerName = mod.title.replace(', 10-Day Reset', '');
    return [
      p(`Hi ${firstName},`),
      p(`Your ${cornerName} reset is in your hands, and it comes as three pieces: the day by day protocol, the Herb Formulary for your corner (every herb with its dose, why it helps, and the cautions), and a one page Bring This To Your Doctor sheet you can take to your next visit. I want your first move to be one simple thing, not ten.`),
      h2('Your one first move'),
      p(`Today, do this: ${move}. That single lever starts calming this corner before you change anything else. It is free, it travels with you, and it is the kind of thing your body responds to faster than people expect.`),
      callout({
        kicker: 'Also today',
        body: `Read Day 1 of your module and take your baseline blood pressure (sit quietly five minutes, feet flat, same arm, average two or three readings). Write it down. That number is your starting line for the next ten days.`,
      }),
      p(`Tomorrow I will send you the deeper science behind this corner, the why under the daily steps. Your kit lives here and your access never expires: <a href="${LIBRARY_URL}" style="color:${PALETTE.accentClay};font-weight:700;">your library</a>.`),
      p(`Follow it day by day. Nothing gets ripped away. Each day stacks on the one before it. More tomorrow.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    if (isComplete(ctx)) {
      return `Hi ${firstName},

Your full 30 day Triangle is in your hands. Each corner is a set of three (the protocol, that corner's Herb Formulary, and its one page Bring This To Your Doctor sheet), plus the Freedom Finale. Let me make your first move simple.

DO NOT START ALL THREE CORNERS AT ONCE
Start at your loudest corner (the one your quiz pointed to) and give it the first ten days. Then the second corner, then the third, then the Freedom Finale. One corner at a time. Consistency beats intensity.

TODAY
Open your loudest corner's module, read Day 1, and take your baseline blood pressure (sit quietly five minutes, same arm, average two or three readings). That number is your starting line.

Over the next few weeks I will send one deeper email per corner, the science behind the daily steps.

Your library (access never expires): ${LIBRARY_URL}

More tomorrow.
Joel Polley, RN`;
    }
    const mod = entryModuleFor(ctx.corner);
    const move = FIRST_MOVE[mod.corner] || FIRST_MOVE.sodium;
    const cornerName = mod.title.replace(', 10-Day Reset', '');
    return `Hi ${firstName},

Your ${cornerName} reset is in your hands, and it comes as three pieces: the day by day protocol, your corner's Herb Formulary (every herb with dose, why, and cautions), and a one page Bring This To Your Doctor sheet for your next visit. Your first move is one simple thing, not ten.

YOUR ONE FIRST MOVE
Today: ${move}. That single lever starts calming this corner before you change anything else.

ALSO TODAY
Read Day 1 of your module and take your baseline blood pressure (sit quietly five minutes, same arm, average two or three readings). That number is your starting line.

Tomorrow I will send the deeper science behind this corner.

Your library (access never expires): ${LIBRARY_URL}

Follow it day by day. Each day stacks on the one before it.
Joel Polley, RN`;
  },
};

// ─── CORNER SCIENCE DEEP-DIVES ────────────────────────────────────────
// One per corner, the in-depth companion to that corner's PDF. Each goes a
// notch deeper than the daily protocol on the mechanism + the research, then
// points back into that corner's PDF and forward to the next corner. Education
// only: no per-person doses (those live in the purchased PDF), research numbers
// framed as "in studies." Rendered corner-colored (buildEmail receives the
// corner key, which tints the top rule + header accent).

// The corner-specific BODY of each science email, keyed by corner. `nextCorner`
// is the name of the corner the buyer walks next, or null if this is their last
// corner (so the closer points to the Freedom Finale or to holding the gains).
const SCIENCE = {
  stress: {
    subject: 'The science of your Stress corner (cortisol, explained)',
    html: (firstName, nextCorner) => [
      p(`Hi ${firstName},`),
      p(`You are a couple of days into your Stress corner. The protocol is giving you the daily moves. This email goes a layer deeper, into the why, because once you understand the machine you are working on, the daily steps stop feeling like a checklist and start feeling like leverage.`),
      h2('The chain: cortisol to your kidneys'),
      p(`Stress, real or just remembered, fires your adrenal glands to release cortisol. Your body cannot tell a bear in the road from a 2 AM worry about money, so it pours out the same hormone either way. Cortisol runs along what physiologists call the HPA axis, the hypothalamus to pituitary to adrenal chain that is your master stress-response system. And it lifts your pressure through three doors at once.`),
      p(`First, it tightens your blood vessels, so the same blood has to push through narrower pipes. Second, it amplifies a signal called aldosterone, which tells your kidneys to reabsorb sodium instead of letting it go. Where sodium stays, water stays, so your blood volume rises and there is more fluid pushing on your vessel walls. Third, cortisol spikes your blood sugar, which pulls in insulin, and insulin tells your kidneys to hold even more sodium. That third door is the hand-off to your next corner. Stress feeds sugar, sugar feeds sodium, and the loop keeps turning.`),
      bigQuote('The problem is not that your body makes cortisol. It is that modern life never lets it stop. The alarm is stuck on HIGH.'),
      h2('The cortisol curve, and why your sleep moves first'),
      p(`Cortisol is meant to follow a clock: high in the morning to wake you, falling to its lowest overnight so your body can do deep repair and your pressure can dip the way it is designed to. Chronic stress inverts that curve. Cortisol surges in the evening, gives you that wired second wind, suppresses your melatonin, then bolts you awake at 2 or 3 AM with your heart racing. This is why, when the corner starts working, your sleep is usually the very first thing to shift. The overnight surge settling down is the earliest and most reliable sign your cortisol is coming back under its clock.`),
      h2('Magnesium, the relaxation mineral'),
      p(`There is a reason your protocol leans on magnesium. Barbara O'Neill calls it "the relaxation mineral," and it earns the name, it is involved in more than 300 functions in the body. Here is the mechanism worth sitting with: when you are under stress, the body dumps magnesium to protect the cells from adrenaline. So the harder your life runs, the more of your relaxation mineral you lose, exactly when you need it most. Replacing it calms the nervous system through a pathway called GABA and helps your vessels relax. And magnesium is the throughline of your whole Triangle, it shows up again in the Sodium corner doing a related job on your vessel walls. When a remedy keeps reappearing across the corners, that is your body telling you what it has been missing.`),
      p(`On the botanical side, the research that anchors this corner is on ashwagandha. In a gold-standard randomized, placebo-controlled trial it lowered serum cortisol by about 28 to 30 percent in the people studied. Because cortisol drives every one of your pressure doors at once, easing it eases all of them together. That is a study result, not a promise about your number, but it tells you the lever is real.`),
      callout({
        kicker: 'Today’s move is in your Stress reset',
        body: `The exact daily steps, the breathing that pulls the vagus brake, the magnesium and ashwagandha protocol with the safe dosing and the cautions, and what to track, all live in your Stress corner module. This email is the why. Your module is the what. Read them side by side.`,
      }),
      stressCloser(nextCorner),
      p(`Keep walking it day by day. The body keeps its appointments.`),
      p(`Joel Polley, RN`),
    ].join(''),
    text: (firstName, nextCorner) => `Hi ${firstName},

You are a couple of days into your Stress corner. The protocol gives you the daily moves; this email goes deeper into the why.

THE CHAIN: CORTISOL TO YOUR KIDNEYS
Stress fires cortisol from your adrenal glands, along the HPA axis (your master stress-response chain). Cortisol lifts pressure three ways: it tightens your vessels; it amplifies aldosterone, which tells your kidneys to hold sodium (water follows sodium, so blood volume rises); and it spikes blood sugar, which pulls in insulin, and insulin tells your kidneys to hold even more sodium. That third door is the hand-off to your next corner.

THE CORTISOL CURVE
Cortisol should ride high in the morning and fall overnight so your body repairs and your pressure dips. Chronic stress inverts that curve, surging at night, suppressing melatonin, bolting you awake at 2 to 3 AM. That is why your SLEEP is usually the first thing to move when this corner works.

MAGNESIUM, THE RELAXATION MINERAL
Barbara O'Neill calls magnesium "the relaxation mineral" (300+ functions in the body). Under stress, the body dumps magnesium to protect cells from adrenaline, so the harder life runs, the more you lose. Replacing it calms the nervous system (the GABA pathway) and relaxes vessels. It is the throughline of your whole Triangle, returning in the Sodium corner.

The botanical anchor here is ashwagandha: in a gold-standard randomized, placebo-controlled trial it lowered serum cortisol by about 28 to 30 percent in the people studied. A study result, not a promise, but the lever is real.

TODAY'S MOVE IS IN YOUR STRESS RESET
The exact daily steps, the breathing, the magnesium + ashwagandha protocol with safe dosing and cautions, and what to track, all live in your Stress corner module. This email is the why; your module is the what.

${stressCloserText(nextCorner)}

Keep walking it day by day. The body keeps its appointments.
Joel Polley, RN`,
  },

  sugar: {
    subject: 'The science of your Sugar corner (insulin, explained)',
    html: (firstName, nextCorner) => [
      p(`Hi ${firstName},`),
      p(`You are into your Sugar corner now. Your protocol is walking you through the daily moves. Let me give you the deeper why, because this corner is the one most people are never taught, and understanding it is what makes the change stick.`),
      h2('The chain: insulin holds sodium'),
      p(`You eat refined sugar or refined carbs. Your blood sugar spikes. Your pancreas answers by pouring out insulin. Insulin lifts your pressure two ways. First, it signals your kidneys to hold on to sodium instead of releasing it, and where sodium goes, water follows, so your blood volume rises and the pressure in the pipes climbs. Second, chronically high insulin keeps your cortisol rhythm dysregulated, which tells the body to cling to salt even harder. Sugar does not stay in its own lane, it empties straight into the Sodium corner, which is exactly where all three corners converge.`),
      h2('GLUT4, the back door your legs open'),
      p(`Here is the most useful piece of physiology in this whole corner. Your muscle cells have a kind of back door for glucose, called GLUT4, that lets sugar leave your blood and enter the muscle without needing insulin to unlock it. When you sit for long stretches, that door deactivates and glucose uptake can fall by as much as 90 percent. Movement props it back open. This is why your protocol makes the morning walk the keystone, it gives your blood sugar a second exit that does not depend on insulin at all. The herbalist Walt Cross teaches it as an illustration: a 20 minute walk can do more for your blood sugar than people expect, and several walks across a day stack up, no needle required. Hold that as a teaching picture, not a number on your meter, but let it tell you the truth, your legs are a glucose-lowering tool you already own.`),
      p(`There is a second pathway your protocol's herbs lean on, called AMPK. It is a metabolic switch inside your cells, the same switch the common medication metformin works on, and activating it helps your cells take up glucose and use insulin better. You are reaching the same lever from the natural side.`),
      bigQuote('Your body is not broken. It is responding to what you gave it. Change the input, and you watch the output change. That is not hope. That is physics.'),
      h2('Why this is reversible'),
      p(`The part most people are never told: insulin resistance can be walked back. In the 2018 DiRECT trial, published in the Lancet, 58 percent of type 2 diabetes cases went into remission through lifestyle change alone, no new drugs and no surgery, as the body recovered once the metabolic stress was removed. And when researchers pool the randomized trials, eating the plant-predominant way this corner teaches tends to improve the risk-factor numbers measurably, in studies, roughly a 0.29 percent drop in HbA1c (the three-month blood-sugar average) and around a 12 to 13 mg/dL drop in LDL cholesterol. Those are risk-factor improvements seen across thousands of people, not a cure and not a promise about you, but they tell you the changes you are making are the same ones that show up in the data.`),
      callout({
        kicker: 'Today’s move is in your Sugar reset',
        body: `The daily steps, the fiber-first plate, the morning walk, the meal-timing lever almost no one teaches, and the metabolic herb stack with its safe ranges and the cautions, all live in your Sugar corner module. This email is the why under those moves. Read them together.`,
      }),
      sugarCloser(nextCorner),
      p(`Keep walking it day by day. You are clearing the cause, not masking the number.`),
      p(`Joel Polley, RN`),
    ].join(''),
    text: (firstName, nextCorner) => `Hi ${firstName},

You are into your Sugar corner now. Here is the deeper why under the daily moves.

THE CHAIN: INSULIN HOLDS SODIUM
Refined sugar or refined carbs spike your blood sugar; your pancreas answers with insulin. Insulin lifts pressure two ways: it tells your kidneys to hold sodium (water follows, blood volume rises), and chronically high insulin keeps cortisol dysregulated, so the body clings to salt harder. Sugar empties straight into the Sodium corner, where all three corners converge.

GLUT4, THE BACK DOOR YOUR LEGS OPEN
Your muscle cells have a glucose back door, GLUT4, that lets sugar leave your blood without insulin. Sitting deactivates it (uptake can drop up to 90 percent); movement props it open. That is why the morning walk is the keystone, a second exit that does not need insulin. Walt Cross teaches the walk as an illustration of how much it can do, hold it as a picture, not a meter number, but your legs are a glucose-lowering tool you already own. A second pathway, AMPK, is the same metabolic switch the drug metformin works on, and the corner's herbs activate it from the natural side.

WHY THIS IS REVERSIBLE
In the 2018 DiRECT trial (Lancet), 58 percent of type 2 diabetes cases went into remission through lifestyle change alone, as the body recovered once the metabolic stress was removed. Pooled randomized trials show plant-predominant eating tends to improve risk-factor numbers in studies, roughly a 0.29 percent drop in HbA1c and about a 12 to 13 mg/dL drop in LDL. Risk-factor improvement, not a cure, but the lever is real.

TODAY'S MOVE IS IN YOUR SUGAR RESET
The fiber-first plate, the morning walk, the meal-timing lever, and the metabolic herb stack with safe ranges and cautions, all live in your Sugar corner module. This email is the why; your module is the what.

${sugarCloserText(nextCorner)}

Keep walking it day by day. You are clearing the cause, not masking the number.
Joel Polley, RN`,
  },

  sodium: {
    subject: 'The science of your Sodium corner (the lake, explained)',
    html: (firstName, nextCorner) => [
      p(`Hi ${firstName},`),
      p(`You are into your Sodium corner. This is the corner where the whole Triangle comes together, so the science here ties the other two corners into one picture. Let me give you the why under the daily steps.`),
      h2('The sodium-potassium pump, and the seesaw'),
      p(`The simplest version: sodium pulls water. Where sodium goes, water follows, so too much sodium sitting in your bloodstream means your body holds extra water, more volume in the pipes, more pressure on your artery walls. But sodium is not only the salt shaker. Your kidneys run on a balance between sodium and its partner, potassium, the famous sodium-potassium pump that every cell in your body uses. They work like a seesaw. When potassium is high, your kidneys flush sodium out. When potassium is low, which it is for most people on a modern diet, sodium stays put. The research is clear that the ratio of sodium to potassium matters more than sodium alone, and most people are eating too much sodium and far too little potassium. Your protocol fixes both ends of that seesaw with whole plants.`),
      h2('Vasopressin, the thirst signal that tightens your vessels'),
      p(`Here is the counterintuitive one. People assume drinking more water makes you hold more water. The opposite is true. When you are even mildly dehydrated, your body releases a hormone called vasopressin, also called ADH, antidiuretic hormone. Vasopressin tells your kidneys to hold on to water, and it directly squeezes your vessels tighter. Drink enough water and that signal turns down, your vessels relax, and your kidneys stop hoarding sodium and water. This is why the hydration step in your protocol is a keystone, not a throwaway, it is the tool that lets your body act on everything else you removed.`),
      bigQuote('Three rivers, one lake. Stress and sugar both empty into sodium, plus the salt on your plate. That is why this corner closes the loop.'),
      h2('The convergence: why stress and sugar both end up here'),
      p(`Now the picture that makes the whole Triangle make sense. Remember the other two corners. Stress sends cortisol, and cortisol tells your kidneys to hold sodium. Sugar spikes insulin, and insulin tells your kidneys to hold sodium. So sodium retention is not just what you sprinkle on your food, it is the downstream meeting point where stress and sugar both empty out. Three rivers, one lake. This is why you cannot fix high blood pressure by attacking one corner and ignoring the others, and it is why walking sodium down drains the lake the other two keep filling.`),
      h2('The proof in the research'),
      p(`The way of eating this corner builds toward has been measured carefully. In a landmark randomized trial, the DASH eating pattern lowered blood pressure by about 11 mmHg systolic and 5.5 mmHg diastolic in eight weeks in people who started with high blood pressure (Appel and colleagues, New England Journal of Medicine, 1997). Across controlled trials, vegetarian eating patterns lower systolic pressure by roughly 5 mmHg on their own. I share those carefully and honestly, that is risk-factor improvement seen in studies, not a cure and not a promise about your specific reading. But it tells you the lever you are pulling, more potassium-rich plants and less processed sodium, has solid ground under it.`),
      callout({
        kicker: 'Today’s move is in your Sodium reset',
        body: `The label-detective work, the hydration number, the potassium-rich plate, the contrast hydrotherapy practice (with its safety caution), and the vascular herbs with their dosing and cautions, all live in your Sodium corner module. This email is the why under those moves. Read them side by side.`,
      }),
      sodiumCloser(nextCorner),
      p(`Keep walking it day by day. Your blood pressure is an effect, not a mystery.`),
      p(`Joel Polley, RN`),
    ].join(''),
    text: (firstName, nextCorner) => `Hi ${firstName},

You are into your Sodium corner, where the whole Triangle comes together. Here is the why under the daily steps.

THE SODIUM-POTASSIUM PUMP, AND THE SEESAW
Sodium pulls water, so too much sodium means more water, more volume, more pressure. But your kidneys run on a balance between sodium and potassium, the sodium-potassium pump, a seesaw. High potassium flushes sodium; low potassium (most modern diets) holds it. The ratio matters more than sodium alone, and most people eat too much sodium and too little potassium. Your protocol fixes both ends with whole plants.

VASOPRESSIN, THE THIRST SIGNAL THAT TIGHTENS VESSELS
Counterintuitive: drinking enough water makes you hold LESS. When you are dehydrated, your body releases vasopressin (ADH), which tells the kidneys to hold water and squeezes your vessels tighter. Drink enough and that signal turns down, vessels relax, kidneys stop hoarding. That is why hydration is a keystone here.

THE CONVERGENCE
Stress sends cortisol (holds sodium). Sugar spikes insulin (holds sodium). So sodium retention is the downstream meeting point where stress and sugar both empty out, plus the salt on your plate. Three rivers, one lake. Walking sodium down drains the lake the other two corners keep filling, which is why this corner closes the loop.

THE PROOF
In a landmark randomized trial, the DASH eating pattern lowered blood pressure by about 11 mmHg systolic and 5.5 mmHg diastolic in eight weeks in people with high blood pressure (Appel et al., NEJM, 1997). Vegetarian patterns lower systolic by roughly 5 mmHg in controlled trials. Risk-factor improvement seen in studies, not a cure or a promise, but the lever has solid ground.

TODAY'S MOVE IS IN YOUR SODIUM RESET
The label-detective work, the hydration number, the potassium plate, the contrast hydrotherapy (with its safety caution), and the vascular herbs with dosing and cautions, all live in your Sodium corner module. This email is the why; your module is the what.

${sodiumCloserText(nextCorner)}

Keep walking it day by day. Your blood pressure is an effect, not a mystery.
Joel Polley, RN`,
  },
};

// ─── Per-corner closers (forward to the next corner, or to the finish) ─
// Each science email ends pointing forward to the next corner the buyer walks,
// or, if this is their last corner, to holding the gains / the Freedom Finale.
function stressCloser(nextCorner) {
  if (nextCorner) {
    return p(`When you finish these ten days, your next corner is <strong>${nextCorner}</strong>. Here is the bridge: remember that cortisol also spikes your blood sugar, and high blood sugar pulls in insulin, which holds sodium too. So your stressed body and your sugar-strained body push your pressure up through the very same door. Calming stress is the start. The loop only closes when you walk the next corner too.`);
  }
  return p(`This is your last corner of the loop, which means you are about to have closed every side of your Triangle. The Freedom Finale is waiting to teach you the part almost no one is ever taught: how to step back from daily policing and trust the body you rebuilt, with your doctor right beside you.`);
}
function stressCloserText(nextCorner) {
  if (nextCorner) {
    return `NEXT: your ${nextCorner} corner. The bridge: cortisol also spikes blood sugar, which pulls in insulin, which holds sodium too. Stress and sugar push your pressure up through the same door. The loop only closes when you walk the next corner.`;
  }
  return `This is your last corner, so you are about to have closed every side of your Triangle. The Freedom Finale teaches you to step back from daily policing and trust the body you rebuilt, with your doctor beside you.`;
}

function sugarCloser(nextCorner) {
  if (nextCorner) {
    return p(`When you finish these ten days, your next corner is <strong>${nextCorner}</strong>, and it is no accident it comes after sugar. Every time your blood sugar spiked, the insulin that answered it reached over to your kidneys and told them to hold sodium. So your sugar problem has been quietly feeding a sodium problem the whole time. You lowered the insulin signal. Next you go to the corner where it was emptying out, and close that side of the loop.`);
  }
  return p(`This is your last corner of the loop, which means you are about to have closed every side of your Triangle. The Freedom Finale is waiting to teach you how to step back from daily policing and trust the body you rebuilt, with your doctor right beside you.`);
}
function sugarCloserText(nextCorner) {
  if (nextCorner) {
    return `NEXT: your ${nextCorner} corner. The bridge: every blood-sugar spike pulled in insulin, which told your kidneys to hold sodium. Sugar has been feeding a sodium problem the whole time. You lowered the insulin signal; next you close the side where it was emptying out.`;
  }
  return `This is your last corner, so you are about to have closed every side of your Triangle. The Freedom Finale teaches you to step back from daily policing and trust the body you rebuilt, with your doctor beside you.`;
}

function sodiumCloser(nextCorner) {
  if (nextCorner) {
    return p(`When you finish these ten days, your next corner is <strong>${nextCorner}</strong>. Here is why you are not done: even with a perfect low-salt diet, an unmanaged ${nextCorner.toLowerCase()} load keeps refilling the lake from upstream. You have been bailing water; next you go shut off the tap that keeps telling your kidneys to hold the very sodium you just worked to release.`);
  }
  return p(`This is your last corner of the loop, which means you are about to have closed every side of your Triangle. The Freedom Finale is waiting to teach you how to step back from daily policing and trust the body you rebuilt, with your doctor right beside you.`);
}
function sodiumCloserText(nextCorner) {
  if (nextCorner) {
    return `NEXT: your ${nextCorner} corner. Even a perfect low-salt diet cannot hold if ${nextCorner.toLowerCase()} keeps refilling the lake from upstream. You have been bailing water; next you shut off the tap that tells your kidneys to hold the sodium you just released.`;
  }
  return `This is your last corner, so you are about to have closed every side of your Triangle. The Freedom Finale teaches you to step back from daily policing and trust the body you rebuilt, with your doctor beside you.`;
}

// Build one science day for a corner SLOT (0 = loudest, 1 = second, 2 = third).
// The day resolves which corner sits in that slot from the buyer's scores, then
// renders that corner's science body, corner-colored. It only ships to buyers
// whose tier includes the slot (shouldSend gate); for everyone else the engine
// skips it. The "nextCorner" is the name of the slot after this one in the
// buyer's order, or null when this is the buyer's last corner.
function scienceDay(slotIndex) {
  const cornerFor = (ctx) => cornersFor(ctx)[slotIndex] || null;
  const nextCornerName = (ctx) => {
    const order = cornersFor(ctx);
    // The buyer's last corner is the highest slot their tier includes.
    const lastSlot = cornersIncluded(ctx) - 1;
    if (slotIndex >= lastSlot) return null;
    const nxt = order[slotIndex + 1];
    return nxt ? CORNER_NAME[nxt] : null;
  };
  return {
    // Only send when the buyer's tier includes this corner slot.
    shouldSend: (ctx) => slotIndex < cornersIncluded(ctx),
    subject: (ctx) => {
      const c = cornerFor(ctx);
      return (c && SCIENCE[c]?.subject) || 'The science behind this corner';
    },
    htmlBody: (ctx) => {
      const c = cornerFor(ctx) || 'sodium';
      const firstName = ctx.firstName || 'there';
      const spec = SCIENCE[c] || SCIENCE.sodium;
      return spec.html(firstName, nextCornerName(ctx));
    },
    textBody: (ctx) => {
      const c = cornerFor(ctx) || 'sodium';
      const firstName = ctx.firstName || 'there';
      const spec = SCIENCE[c] || SCIENCE.sodium;
      return spec.text(firstName, nextCornerName(ctx));
    },
    // Tint the email to the corner this slot resolves to.
    corner: (ctx) => cornerFor(ctx),
  };
}

const science1 = scienceDay(0);
const science2 = scienceDay(1);
const science3 = scienceDay(2);

// ─── DAY 5 — Early check-in (monitoring + felt signals) ───────────────
const day5 = {
  subject: 'How the first days feel (and what to watch)',
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    return [
      p(`Hi ${firstName},`),
      p(`A few days in, I want to tell you what to watch for, because the felt signals often move before the number on the cuff does.`),
      p(`The earliest thing most people notice is not the reading, it is steadier energy, quieter cravings, deeper sleep, or fewer trips out of the emergency mode the body was stuck in. Those are real signs your body is responding. Blood pressure tends to be the last thing to move, and it moves on the trend across a week, not day to day. One high reading is noise. The average is the signal.`),
      callout({
        kicker: 'Keep doing',
        body: `Take your reading at the same calm time each day and write it down next to your felt signals (sleep, energy, cravings). You are building a trend line, and the trend is where the truth lives. This is you learning to read your own body, a skill that outlasts the ten days.`,
      }),
      p(`If your numbers are improving, that is wonderful news, and it is news you bring to your doctor so they can make any calls about your medication. We never change a prescription on our own. Ever. Your data is your power. Your doctor is your ally.`),
      p(`Keep going. The body keeps its appointments.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    return `Hi ${firstName},

A few days in, here is what to watch, because the felt signals often move before the cuff does.

Most people first notice steadier energy, quieter cravings, deeper sleep. Those are real signs your body is responding. The blood pressure number tends to move last, and on the weekly trend, not day to day. One high reading is noise; the average is signal.

KEEP DOING
Take your reading at the same calm time each day and write it next to your felt signals (sleep, energy, cravings). You are building a trend line.

If your numbers improve, bring that news to your doctor so THEY can make any medication calls. We never change a prescription on our own. Your data is your power; your doctor is your ally.

Keep going. The body keeps its appointments.
Joel Polley, RN`;
  },
};

// ─── DAYS 3–10 — The Adherence Engine (daily protocol prompts) ────────
// The core window of the 10-day protocol. Every buyer walks their LOUDEST
// corner first, whatever their tier, so each day resolves one tiny corner-aware
// action from the buyer's first-slot corner. One move, a reply-DONE
// micro-commitment, celebration copy. ZERO selling anywhere in this window.
// Kept short on purpose (a prompt, not a lecture): motivation decays daily
// after purchase, so the move has to be small enough to say yes to.

function protocolDay(dayNum, spec) {
  const cornerOf = (ctx) => cornersFor(ctx)[0] || 'sodium';
  return {
    subject: spec.subject,
    corner: (ctx) => cornerOf(ctx),
    htmlBody: (ctx) => {
      const firstName = ctx.firstName || 'there';
      const action = spec.actions[cornerOf(ctx)] || spec.actions.sodium;
      const extra = spec.extra ? p(spec.extra) : '';
      return [
        p(`Hi ${firstName},`),
        p(spec.opener),
        callout({ kicker: `Day ${dayNum}: today's one move`, body: action }),
        p(`When it is done, hit reply to this email with the word <strong>DONE</strong>. One word is plenty. I count every one.`),
        extra,
        p(`${spec.closer} Every day you show up is a vote for the new you.`),
        p(`Joel Polley, RN`),
      ].join('');
    },
    textBody: (ctx) => {
      const firstName = ctx.firstName || 'there';
      const action = spec.actions[cornerOf(ctx)] || spec.actions.sodium;
      const extra = spec.extra ? `\n${spec.extra}\n` : '';
      return `Hi ${firstName},

${spec.opener}

DAY ${dayNum}: TODAY'S ONE MOVE
${action}

When it is done, hit reply with the word DONE. One word is plenty. I count every one.
${extra}
${spec.closer} Every day you show up is a vote for the new you.
Joel Polley, RN`;
    },
  };
}

const day3 = protocolDay(3, {
  subject: 'Day 3: one small move (that is all)',
  opener: `Three days in. Day three is where most people drift. Not you. Today stays small on purpose.`,
  actions: {
    stress: `Five minutes of paced breathing this afternoon. Breathe in through your nose for a count of 4, then let the breath out long and slow for a count of 6. The long exhale pulls the brake on your stress nerve, right when cortisol likes to spike.`,
    sugar: `Swap your breakfast for a whole plant one from your meal plan, like oats with fruit. No refined flour, no added sugar. A steady breakfast means a steady morning, and steady is what your pressure loves.`,
    sodium: `Drink 16 ounces of water the moment you get up, before anything else. Then keep your water bottle where your eyes land all day. Water is how your kidneys let go of the extra sodium.`,
  },
  closer: `Small moves done daily beat big moves done once.`,
});

const day4 = protocolDay(4, {
  subject: 'Day 4: you are further in than most people ever get',
  opener: `Day 4. The first days are the hardest, and you are already through most of them.`,
  actions: {
    stress: `Take a ten minute walk outside today, and leave your phone behind. Let your eyes rest on things far away. Movement plus quiet tells your body the emergency is over.`,
    sugar: `Take a 20 minute walk within an hour of waking. Your moving muscles pull sugar out of your blood on their own, no insulin needed.`,
    sodium: `Be a label detective today. Pick three packaged foods in your kitchen and read the sodium number on each. Change nothing yet. Just see where the salt hides.`,
  },
  closer: `You are not white knuckling this. You are stacking small wins.`,
});

const day6 = protocolDay(6, {
  subject: 'Day 6: more than halfway',
  opener: `Day 6. You are past the middle of your ten days. This is where quitting whispers. Answer it with one more small move.`,
  actions: {
    stress: `Tonight, five minutes of paced breathing before bed. In through your nose for 4, out slow for 6. The long exhale deepens sleep, and deep sleep is when your pressure gets to rest too.`,
    sugar: `Do the breakfast swap again this morning, then notice how you feel two hours later. Steadier, less snacky? That is your blood sugar holding level instead of spiking.`,
    sodium: `Hit your full water number today: your body weight in pounds, in ounces of water, spread across the day. Start with 16 ounces on waking.`,
  },
  closer: `Halfway done is not half a result. Each day is teaching your body a new normal.`,
});

const day8 = protocolDay(8, {
  subject: 'Day 8: boring is what working looks like',
  opener: `Day 8. This is the week the moves stop feeling new and start feeling like yours.`,
  actions: {
    stress: `Take your ten minute walk today and pair it with slow breathing as you go: in through the nose, long easy exhale out. Two calming levers in one walk.`,
    sugar: `Morning walk again, 20 minutes inside the first hour. Yes, the same move. Boring on purpose. Boring is what working looks like.`,
    sodium: `One label check before one meal today. Look at two options and pick the one with less sodium. One choice, one meal. That is the whole job.`,
  },
  closer: `Repetition is not a rut. It is how your body learns to trust the change.`,
});

const day9 = protocolDay(9, {
  subject: 'Day 9: tomorrow is a big morning',
  opener: `Day 9. Tomorrow morning is a big one, so today stays light.`,
  actions: {
    stress: `Paced breathing twice today. Five minutes in the afternoon, five minutes before bed. In for 4, out for 6, slow and easy.`,
    sugar: `One more breakfast swap, and your morning walk if you can fit it. Keep the streak alive one more day.`,
    sodium: `Water first thing, then count your glasses as you go and try to land on your number by supper.`,
  },
  extra: `One more thing: get your blood pressure cuff out tonight and set it where you will see it at breakfast. Tomorrow morning I am going to ask you for two numbers.`,
  closer: `Nine days of showing up. Look how far you have walked.`,
});

// ─── DAY 10 — The milestone: two readings, hit reply ──────────────────
// The felt-result moment the whole engine builds to. No selling. The readings
// reply is the micro-commitment that matters most (and the honest trigger the
// Day 12 email follows).
const day10 = {
  subject: 'Day 10: take your two readings and hit reply',
  corner: (ctx) => cornersFor(ctx)[0] || null,
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    return [
      p(`Hi ${firstName},`),
      p(`Ten days. Before anything else, sit with that. Ten days of small daily moves is real work, and you did it.`),
      callout({
        kicker: 'This morning',
        body: `Sit quietly for five minutes, feet flat, same arm as always. Take your blood pressure twice, about a minute apart. Then hit reply to this email with the two readings. I read these. Every single one.`,
      }),
      p(`Put them next to your Day 1 baseline. Remember, we read the trend, not one reading. Numbers moving is wonderful news. Numbers holding steady after ten days of change is quiet progress too. Either way, bring them to your doctor. They make every call about your medication, never us.`),
      p(`Ten days of showing up is ten votes for the new you. I am proud of you.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    return `Hi ${firstName},

Ten days. Before anything else, sit with that. Ten days of small daily moves is real work, and you did it.

THIS MORNING
Sit quietly for five minutes, feet flat, same arm as always. Take your blood pressure twice, about a minute apart. Then hit reply to this email with the two readings. I read these. Every single one.

Put them next to your Day 1 baseline. We read the trend, not one reading. Numbers moving is wonderful news. Numbers holding steady after ten days of change is quiet progress too. Either way, bring them to your doctor. They make every call about your medication, never us.

Ten days of showing up is ten votes for the new you. I am proud of you.
Joel Polley, RN`;
  },
};

// ─── DAY 7 — Pure check-in (zero selling) ─────────────────────────────
// Mid-protocol check-in for every tier. The ascension ask that used to live
// here moved to Day 12, after the Day 10 readings (the felt-result moment).
const day7 = {
  subject: 'One week in (how is it going?)',
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const rhythm = isComplete(ctx)
      ? p(`One note for you, since you own the whole loop: keep to one corner at a time. Finish your first ten days before you open the next corner. The relief from the first corner is what carries you into the second.`)
      : '';
    return [
      p(`Hi ${firstName},`),
      p(`One week in. No homework today beyond what you are already doing. I just want to check on you.`),
      p(`By now some people feel a shift: deeper sleep, steadier energy, quieter cravings. Others feel nothing yet, and that is normal too. The felt signals move first and the cuff moves last, on the weekly trend, not day to day. Both paths are still working paths.`),
      rhythm,
      callout({
        kicker: 'Your only task today',
        body: `Hit reply and tell me how it is going, in one line. Rough or smooth, I want the truth. I read every reply myself.`,
      }),
      p(`And if your readings are already moving, bring that news to your doctor. They make every call about your medication, never us.`),
      p(`Three more days in this stretch. You are closer than you think.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const rhythm = isComplete(ctx)
      ? `\nOne note, since you own the whole loop: keep to one corner at a time. Finish your first ten days before opening the next corner.\n`
      : '';
    return `Hi ${firstName},

One week in. No homework today beyond what you are already doing. I just want to check on you.

By now some people feel a shift: deeper sleep, steadier energy, quieter cravings. Others feel nothing yet, and that is normal too. The felt signals move first and the cuff moves last, on the weekly trend, not day to day. Both paths are still working paths.
${rhythm}
YOUR ONLY TASK TODAY
Hit reply and tell me how it is going, in one line. Rough or smooth, I want the truth. I read every reply myself.

If your readings are already moving, bring that news to your doctor. They make every call about your medication, never us.

Three more days in this stretch. You are closer than you think.
Joel Polley, RN`;
  },
};

// ─── DAY 12 — The upgrade moment (post felt-result) ───────────────────
// Two days after the Day 10 readings ask: the honest ascension email.
//   corner buyers:   add the second corner (+$20) or close the loop (+$70)
//   top2 buyers:     complete the Triangle (+$50)
//   complete buyers: nothing left to buy; case-review door only
// Every tier also gets the SOFT $297 case-review introduction, pointing at the
// on-site page with the honest capacity line. caseReview:true records never
// see the case-review pitch, and a complete buyer who already bought it has
// nothing to hear here at all (shouldSend skips them).
const day12 = {
  shouldSend: (ctx) => !(isComplete(ctx) && boughtCaseReview(ctx)),
  subject: 'Your next step (only if you want it)',
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const caseReviewBlock = boughtCaseReview(ctx)
      ? ''
      : p(`One more door, only if you want it. Some people want a nurse to read their own case directly. I do that. With <a href="${CASE_REVIEW_PAGE_URL}" style="color:${PALETTE.accentClay};font-weight:700;">Joel's Eyes On Your Case</a> I sit down with your quiz, your corners, and your readings, and I send back your exact next moves for your situation. I take 5 a month, so each one gets done right. No need to decide now.`);
    if (isComplete(ctx)) {
      return [
        p(`Hi ${firstName},`),
        p(`You finished your first ten days two days ago. Whatever your readings said, the daily work you did is already changing how your body handles pressure. Keep walking, one corner at a time.`),
        p(`You own the whole loop, so there is nothing left to buy to finish your kit. Your next ten days are already sitting in <a href="${LIBRARY_URL}" style="color:${PALETTE.accentClay};font-weight:700;">your library</a>.`),
        p(`If you want to go one step further, I do offer a <strong>1:1 call</strong>. Thirty minutes, you and me, walking your readings, your medication list, and your Triangle together, so you leave knowing exactly what to work first. It is <strong>$97</strong>, and you book straight onto my calendar the moment you pay.`),
        ctaButton('Book my 1:1 call with Joel, $97', CALL_97_URL),
        caseReviewBlock,
        p(`Either way, the method is in your hands now. Keep going.`),
        p(`Joel Polley, RN`),
      ].join('');
    }
    // corner buyers AND legacy top2 buyers: one door, complete the Triangle for
    // the $30 difference (the $47 complete kit minus what they already paid).
    return [
      p(`Hi ${firstName},`),
      p(`You finished your first ten days two days ago. Whatever your readings said, the daily work you did is already changing how your body handles pressure.`),
      p(`Here is the honest picture. The rest of your Triangle is still feeding the loop, the way stress and sugar both keep telling your kidneys to hold sodium. If you want to keep walking, there is one door: the complete kit, every corner plus the Freedom Finale, for just <strong>$27 more</strong>, never paying twice for what you already own.`),
      ctaButton('Complete my Triangle for $27', UPGRADE_TO_COMPLETE_OTO_URL),
      caseReviewBlock,
      p(`No pressure on any of it. Keep walking what you have. The method works either way.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const caseReviewBlock = boughtCaseReview(ctx)
      ? ''
      : `
One more door, only if you want it. Some people want a nurse to read their own case directly. I do that. With Joel's Eyes On Your Case I sit down with your quiz, your corners, and your readings, and send back your exact next moves for your situation. I take 5 a month, so each one gets done right: ${CASE_REVIEW_PAGE_URL}
`;
    if (isComplete(ctx)) {
      return `Hi ${firstName},

You finished your first ten days two days ago. Whatever your readings said, the daily work you did is already changing how your body handles pressure. Keep walking, one corner at a time.

You own the whole loop, so there is nothing left to buy to finish your kit. Your next ten days are already in your library: ${LIBRARY_URL}

If you want to go one step further, I do offer a 1:1 call. Thirty minutes, you and me, walking your readings, your medication list, and your Triangle together, so you leave knowing exactly what to work first. It is $97, and you book straight onto my calendar the moment you pay:
${CALL_97_URL}
${caseReviewBlock}
The method is in your hands now. Keep going.
Joel Polley, RN`;
    }
    return `Hi ${firstName},

You finished your first ten days two days ago. Whatever your readings said, the daily work you did is already changing how your body handles pressure.

The honest picture: the rest of your Triangle is still feeding the loop, the way stress and sugar both keep telling your kidneys to hold sodium. If you want to keep walking, there is one door: the complete kit, every corner plus the Freedom Finale, for just $27 more, never paying twice for what you already own.

Complete my Triangle for $27: ${UPGRADE_TO_COMPLETE_OTO_URL}
${caseReviewBlock}
No pressure on any of it. Keep walking what you have. The method works either way.
Joel Polley, RN`;
  },
};

// ─── DAY 30 — Graduation (ALL tiers) ──────────────────────────────────
// Every buyer graduates at 30 days. The complete tier gets the Freedom Finale
// walkthrough (they own it); corner and top2 get an honest graduation for the
// work they did, without claims about a module they do not own. Both repeat
// the case-review door (skipped for caseReview:true records).
const day30 = {
  subject: 'Day 30: graduating to a body you trust',
  htmlBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const caseReviewBlock = boughtCaseReview(ctx)
      ? ''
      : p(`If you ever want me to look at your own case directly, that door stays open. With <a href="${CASE_REVIEW_PAGE_URL}" style="color:${PALETTE.accentClay};font-weight:700;">Joel's Eyes On Your Case</a> I read your quiz, your corners, and where you are now, and I send back your exact next moves for your situation, a nurse in your corner for the road ahead. I take 5 a month, so each one gets done right. Only if and when you want it.`);
    if (!isComplete(ctx)) {
      return [
        p(`Hi ${firstName},`),
        p(`Thirty days ago you decided to go after the cause instead of just the number. However far you walked, hear this: the work you did is not gone. Every walk, every glass of water, every slow exhale taught your body something it keeps.`),
        callout({
          kicker: 'Keep the keystones',
          body: `Hold on to the small moves that served you best: your sleep and your breath, your steady breakfast and your walk, your water and your own cooking. Those keystones are what hold the gains for life.`,
        }),
        p(`Your kit lives here and your access never expires: <a href="${LIBRARY_URL}" style="color:${PALETTE.accentClay};font-weight:700;">your library</a>. Come back to your corner for a week as a tune up whenever your numbers start creeping.`),
        p(`And keep your doctor in the loop. If your numbers have moved, that is news you carry to them, and they make every call about your medication. We never change a prescription on our own.`),
        caseReviewBlock,
        p(`I am proud of you for these thirty days. You did real work, and your body noticed.`),
        p(`Joel Polley, RN`),
      ].join('');
    }
    return [
      p(`Hi ${firstName},`),
      p(`Thirty days ago your blood pressure was a number you policed. You walked all three corners. You calmed the stress that was holding sodium, steadied the sugar that was holding sodium, and drained the lake itself. Take a breath and let that land. Most people never get this far.`),
      h2('The part almost no one is ever taught'),
      p(`The Freedom Finale is the graduation piece, and its whole job is to teach you how to step back. Not step away from your doctor, never that, but step back from the white-knuckle, anxious, cuff-checking version of this. There is an old truth in the natural-health tradition that anxious self-monitoring is itself counter-therapeutic, the constant fear keeps the very stress response up that you worked to calm. Trusting the body you rebuilt is not the soft part of this. It is the physiological finish line.`),
      callout({
        kicker: 'Wean the supports, gently',
        body: `Your Freedom Finale module walks you through stepping the herbs and supports down to the keystone few you keep for life, the ones from each corner that hold the gains: your sleep and breath, your steady blood sugar and your walk, your water and your own cooking. The Finale shows you exactly how and in what order. This is a planned step-down, not a cliff.`,
      }),
      p(`Step down the monitoring too. You do not need to take your pressure five times a day forever. The Finale shows you how to move to a steady, calm rhythm that gives you the signal without the fear.`),
      h2('The one firewall that never moves'),
      p(`Hear me clearly, because this is the line I will never cross with you. None of this, not weaning a single herb, not changing how often you check, and above all not anything to do with your prescribed medication, is yours to do alone. If your numbers have come down, that is wonderful news you carry to your doctor, who makes every call about your medication. We never change a prescription on our own. Freedom here means freedom from the anxiety and the dependency mindset, never freedom from your medical care.`),
      p(`Your full kit lives here and your access never expires: <a href="${LIBRARY_URL}" style="color:${PALETTE.accentClay};font-weight:700;">your library</a>. Come back to any corner for a week as a tune up whenever the loop starts heating up again. You know the method now. You can walk it for the rest of your life.`),
      caseReviewBlock,
      p(`I am proud of you. You did real work, and your body answered.`),
      p(`Joel Polley, RN`),
    ].join('');
  },
  textBody: (ctx) => {
    const firstName = ctx.firstName || 'there';
    const caseReviewBlock = boughtCaseReview(ctx)
      ? ''
      : `
If you ever want me to look at your own case directly, that door stays open. With Joel's Eyes On Your Case I read your quiz, your corners, and where you are now, and send back your exact next moves for your situation. I take 5 a month, so each one gets done right: ${CASE_REVIEW_PAGE_URL}
`;
    if (!isComplete(ctx)) {
      return `Hi ${firstName},

Thirty days ago you decided to go after the cause instead of just the number. However far you walked, hear this: the work you did is not gone. Every walk, every glass of water, every slow exhale taught your body something it keeps.

KEEP THE KEYSTONES
Hold on to the small moves that served you best: your sleep and your breath, your steady breakfast and your walk, your water and your own cooking. Those keystones hold the gains for life.

Your kit (access never expires): ${LIBRARY_URL}. Come back to your corner for a week as a tune up whenever your numbers start creeping.

And keep your doctor in the loop. If your numbers have moved, carry that news to them, and they make every call about your medication. We never change a prescription on our own.
${caseReviewBlock}
I am proud of you for these thirty days. You did real work, and your body noticed.
Joel Polley, RN`;
    }
    return `Hi ${firstName},

Thirty days ago your blood pressure was a number you policed. You walked all three corners, calmed the stress holding sodium, steadied the sugar holding sodium, and drained the lake itself. Let that land. Most people never get this far.

THE PART ALMOST NO ONE IS TAUGHT
The Freedom Finale teaches you to step back, not from your doctor, never that, but from the anxious, cuff-checking version of this. There is an old truth that anxious self-monitoring is itself counter-therapeutic; the constant fear keeps up the very stress response you worked to calm. Trusting the body you rebuilt is the physiological finish line.

WEAN THE SUPPORTS, GENTLY
Your Freedom Finale module walks you through stepping the herbs and supports down to the keystone few you keep for life (sleep and breath, steady blood sugar and your walk, water and your own cooking). A planned step-down, not a cliff. Step down the monitoring too, to a steady calm rhythm instead of five checks a day.

THE ONE FIREWALL THAT NEVER MOVES
None of this, not weaning a herb, not changing how often you check, and above all nothing about your prescribed medication, is yours to do alone. If your numbers have come down, carry that news to your doctor, who makes every medication call. We never change a prescription on our own. Freedom means freedom from the anxiety and dependency mindset, never from your medical care.

Your library (access never expires): ${LIBRARY_URL}. Come back to any corner as a tune up whenever the loop heats up.
${caseReviewBlock}
I am proud of you. You did real work, and your body answered.
Joel Polley, RN`;
  },
};

// ─── Engine wrapper ───────────────────────────────────────────────────
// Wraps a day's body/text in the shared branded shell + compliance footer via
// buildEmail, so the engine sends a complete standalone HTML document. Fields
// may be plain values OR functions of ctx (subject/corner can vary per buyer):
//   subject  string | (ctx) => string
//   corner   undefined | string | (ctx) => 'stress'|'sugar'|'sodium'  (tints the email)
//   shouldSend  optional (ctx) => boolean, forwarded for the engine's per-day gate.
function resolve(v, ctx) {
  return typeof v === 'function' ? v(ctx) : v;
}

function wrap(day) {
  const wrapped = {
    subject: (ctx) => resolve(day.subject, ctx),
    htmlBody: (ctx) =>
      buildEmail({
        preheader: resolve(day.subject, ctx),
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
        corner: resolve(day.corner, ctx) || undefined,
      }).html,
    textBody: (ctx) =>
      buildEmail({
        preheader: resolve(day.subject, ctx),
        bodyHtml: day.htmlBody(ctx),
        bodyText: day.textBody(ctx),
        unsubUrl: ctx.unsubUrl,
        corner: resolve(day.corner, ctx) || undefined,
      }).text,
  };
  if (typeof day.shouldSend === 'function') wrapped.shouldSend = day.shouldSend;
  return wrapped;
}

// Day 0 is the at-purchase delivery email (stripe-webhook.js). This cron picks
// up from Day 1 onward. Days 1 through 10 are the daily adherence window (every
// tier, zero selling after Day 2's science). Day 12 is the ascension moment.
// The science deep-dives land at the start of each 10-day corner block; the
// gated days (corner 2 / corner 3) ship only to tiers that include them.
export const BUYER_DAYS = {
  1: wrap(day1),
  2: wrap(science1),
  3: wrap(day3),
  4: wrap(day4),
  5: wrap(day5),
  6: wrap(day6),
  7: wrap(day7),
  8: wrap(day8),
  9: wrap(day9),
  10: wrap(day10),
  11: wrap(science2),
  12: wrap(day12),
  21: wrap(science3),
  30: wrap(day30),
};

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req, res,
    state: 'buyer',
    daysMap: BUYER_DAYS,
    sentFlag: buyerSentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'BUYER_CRON_DRY_RUN',
    label: 'buyer-emails',
  });
}
