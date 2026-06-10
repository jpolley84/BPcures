// _tier-lead-emails.js — LEAD state sequence ($0, pre-purchase).
//
// Audience: just gave email via quiz / lead-magnet / exit-popup. State = `lead`.
// Goal: teach the BP Triangle (2 emails per corner) while making the $17
//   Starter Kit the unbroken primary ask. Day 3 carries the $12.99 Reset
//   Companion, Day 16 the $27/mo Weekly Reset (first 7 days free), Day 19
//   the flat $297 Sprint ($1,997 cohort reply-gated behind the word NINETY),
//   and Days 10/13/21 date-gate the June 24-25 RestoreHER event (evergreen
//   hormone-corner fallback after the cutoff).
// Length: 10 emails over 21 days (Day 0, 1, 3, 5, 7, 10, 13, 16, 19, 21).
// 2026-06-09 panel-approved realignment: content-only swap. Day keys +
//   tierLeadSentFlag UNCHANGED so live subscribers keep their position and
//   just receive the new copy.
// CAN-SPAM: every email renders an in-body unsubscribe link (ctx.unsubUrl,
//   supplied by _state-cron.js) plus a postal-address line. See POSTAL_LINE.
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }
//
// Author: Joel Polley, RN, BraveWorks Health.

import { youtubePrimaryCTA, skoolTiersFooter } from './_email-shared.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Active Stripe links used in this sequence. SPRINT_URL is the flat-$297
// lead link — NEVER the $280-credit link (that one is for kit buyers only).
export const KIT_URL        = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A'; // $17 BP Starter Kit
export const RESET_KIT_URL  = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k'; // $47 BP Reset Kit (live rung)
export const COMPANION_URL  = 'https://buy.stripe.com/bJe4gzeIrfme9ft3B7fnO02'; // $12.99 The 10-Day Nurse's Reset Companion
export const SPRINT_URL     = 'https://buy.stripe.com/00weVddEnca2ajx0oVfnO0O'; // $297 30-Day Personalized Sprint, flat
export const SKOOL_URL      = 'https://www.skool.com/braveworksrn/about';       // $27/mo Weekly Reset, first 7 days free
export const YOUTUBE_URL    = 'https://www.youtube.com/@braveworksrn';
export const RESTOREHER_URL = 'https://restoreherhormones.com';

// ─── RestoreHER date gate ─────────────────────────────────────────────
// 04:00 UTC = midnight ET on June 24 2026, the morning the event starts.
// Runtime Date is allowed here: render functions execute server-side at
// send time in API code (the Date ban covers workflow scripts only).
// Pre-cutoff: real in-person event (verified 2026-06-09 via
// everydaynurse.com/event-live — June 24-25, Galt House Hotel Louisville,
// Barbara O'Neill keynote). No printed ticket prices, no Stripe ticket
// links; CTA is restoreherhormones.com + the ROOM reply-gate.
// Post-cutoff (forever): evergreen hormone-corner fallback — no dates,
// no prices, no Stripe links.
const RESTOREHER_CUTOFF = Date.parse('2026-06-24T04:00:00Z');
const restoreHerLive = () => Date.now() < RESTOREHER_CUTOFF;

// Brand palette
const PALETTE = {
  outerBg: '#FBF8F1',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

function p(text, opts = {}) {
  const margin = opts.margin || '0 0 18px';
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${margin};">${text}</p>`;
}

function bigQuote(text) {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">${text}</p>`;
}

function sageBlock(html) {
  return `<div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">${html}</div>`;
}

function clayBlock(label, html) {
  return `<div style="border-left:3px solid ${PALETTE.accentClay};padding:6px 0 6px 18px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:8px;">${label}</div>
    ${html}
  </div>`;
}

function ctaButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

function joelSignoff() {
  return `<p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">Joel</p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>`;
}

function psBox(text) {
  return `<div style="border-top:1px solid ${PALETTE.border};padding-top:20px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.S.</strong> ${text}
    </p>
  </div>`;
}

// ─── Compliance blocks ────────────────────────────────────────────────
// Outcome rider (compliance-approved 2026-06-09). Never quantify doer
// outcomes in this file.
const OUTCOME_RIDER_TEXT =
  'Results vary and are not typical. Many readers see little or no change. Nothing here is medical advice or a promise of results, and your prescriber stays in charge of your medications.';

function outcomeRider() {
  return `<p style="font-size:12px;line-height:1.55;color:#8A8A8A;margin:0 0 24px;">${OUTCOME_RIDER_TEXT}</p>`;
}

// CAN-SPAM requires a physical postal address — Joel must set
// BUSINESS_POSTAL_ADDRESS in Vercel.
const POSTAL_LINE = `BraveWorks RN${process.env.BUSINESS_POSTAL_ADDRESS ? ' · ' + process.env.BUSINESS_POSTAL_ADDRESS : ''}`;

// In-body unsubscribe + postal address (16 CFR 316.5). unsubUrl comes
// from _state-cron.js ctx; if it is ever missing we omit the link rather
// than render "undefined".
function complianceFooterHtml(unsubUrl) {
  const unsubLine = unsubUrl
    ? `You're getting this because you asked for my BP teaching at bpquiz.com. <a href="${unsubUrl}" style="color:#9A9A9A;">Unsubscribe</a><br/>`
    : `You're getting this because you asked for my BP teaching at bpquiz.com.<br/>`;
  return `<p style="font-size:11px;line-height:1.6;color:#9A9A9A;margin:24px 0 0;">${unsubLine}${POSTAL_LINE}</p>`;
}

// Shared html footer: YouTube CTA + Weekly Reset canon block (both live in
// _email-shared.js) + the CAN-SPAM lines above.
function footerSecondaryCTAs(unsubUrl) {
  return youtubePrimaryCTA() + skoolTiersFooter() + complianceFooterHtml(unsubUrl);
}

// Mirrored text footer — Weekly Reset canon block + CAN-SPAM lines.
function textFooter(unsubUrl) {
  const unsubLine = unsubUrl ? `\nUnsubscribe: ${unsubUrl}` : '';
  return `THE WEEKLY RESET
Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free.
Start your free week: ${SKOOL_URL}

Not ready to spend a dollar? The same protocols are free on my YouTube: ${YOUTUBE_URL}

You're getting this because you asked for my BP teaching at bpquiz.com.${unsubLine}
${POSTAL_LINE}`;
}

function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

// ─── DAY 0 — Welcome + future self + Triangle overview (3 faucets, 1 sink)
const day0 = {
  subject: 'Three faucets, one sink',
  subjectB: 'Meet the person you are 90 days from now',
  preview: 'Why your BP number is really three numbers wearing one coat.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You just told me your blood pressure is one of the things on your mind. That quiet decision to put your email in mattered. Most people scroll past. You stopped.`)}
    ${p(`I'm Joel. RN for 20 years, most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I run BraveWorks now, and the people I work with are mostly women 50 to 70, with a strong share of men in the same window, all on at least one BP medication, all tired of being told "it's just genetic."`)}
    ${p(`It's not just genetic. I'm going to show you why.`)}
    ${p(`But before the teaching, I want you to meet someone.`)}
    ${bigQuote('Picture yourself 90 days from now.')}
    ${p(`You cuff your arm in the morning and the number is lower than it was today. Not by accident, because you know exactly why. You walk into your next appointment calm, with a log in your hand, and your doctor leans in and asks, "What have you been doing?" You sleep through the night. The people who love you notice the color is back in your face.`)}
    ${p(`That woman is not a different person. She's you, with a map. Today I'm handing you the map.`, { margin: '0 0 28px' })}
    ${bigQuote('Your map: The BP Triangle Method.')}
    ${p(`Here's the picture I want in your head. Imagine a sink that's overflowing. You can mop the floor all day. That's what a medication does, and thank God for it, because it keeps the water from ruining the house. But the sink is still overflowing. Why? Because three faucets are pouring into it.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The three faucets (the Three Pressures)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Stress Pressure</strong>: cortisol. Your foot is stuck on the gas. Sleep is light, mornings are tight, the alarm goes off and your shoulders are already at your ears.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Sugar Pressure</strong>: insulin. White bread, cereal, the 3 PM cookie. This faucet spikes your numbers harder than the salt shaker ever will.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Pipe Pressure</strong>: your vessels. Less elastic. Stiff. Constricted. The pipes the water has to push through.</p>
    `)}
    ${p(`Most plans turn down one faucet and wonder why the sink still overflows. The Triangle turns down all three, and it works <strong>alongside</strong> your medication and your doctor, never instead of them. Mop the floor AND turn off the faucets. That's the whole idea.`)}
    ${p(`Almost everyone has one faucet running hardest. Most have two open at once. Once you know which is loudest in you, the work narrows, and so does the worry.`, { margin: '0 0 28px' })}
    ${p(`Now, you might be thinking: <em>is this just another guru with a "secret"?</em> Fair question. So here's my honest answer: I'm not selling a secret. I'm a nurse who got tired of watching people get mopped and sent home. There's no magic pill in these emails. There's a map, a few small inputs, and proof. You decide.`)}
    ${p(`Want a head start? The same plan I walk readers through, step by step, is in the BP Starter Kit. Eighteen pages, $17. You could start tonight.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit ($17)')}
    ${p(`Here's the rhythm of the next three weeks: a short email every few days. Tomorrow, why I left the ICU. Day 3, a tea that drops 7 systolic points in 6 weeks. Days 5 and 7, your first faucet, the pipes. Read at your own pace. Forward to your daughter, your husband, anyone whose numbers are "creeping up."`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Hit reply and tell me which faucet feels loudest in you right now: Stress, Sugar, or Pipe. One word is enough. I read every single reply, and it helps me know what to send you next.`)}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

You just told me your blood pressure is on your mind. That quiet decision to put your email in mattered. Most people scroll past. You stopped.

I'm Joel. RN for 20 years, most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I run BraveWorks now. The people I work with are mostly women 50 to 70, with a strong share of men in the same window, all on at least one BP med, all tired of being told "it's just genetic."

It's not just genetic. I'll show you why. But first, meet someone.

PICTURE YOURSELF 90 DAYS FROM NOW.

You cuff your arm and the number is lower, and you know exactly why. You walk into your appointment calm, log in hand, and your doctor asks, "What have you been doing?" You sleep through the night. The people who love you notice the color back in your face.

That person isn't different from you. That's you, with a map. Here's the map.

YOUR MAP: THE BP TRIANGLE METHOD.

Picture a sink that's overflowing. You can mop the floor all day. That's what a medication does, and thank God for it. But the sink keeps overflowing, because THREE FAUCETS pour into it:

- Stress Pressure (cortisol). Foot stuck on the gas. Light sleep, tight mornings.
- Sugar Pressure (insulin). Bread, cereal, the 3 PM cookie. Spikes numbers harder than the salt shaker.
- Pipe Pressure (vessels). Stiff, constricted pipes the water pushes through.

Most plans turn down ONE faucet. The Triangle turns down all three, alongside your medication and your doctor, never instead. Mop the floor AND turn off the faucets.

Is this just another guru with a "secret"? Fair question. No secret here. I'm a nurse who got tired of watching people get mopped and sent home. A map, a few small inputs, and proof. You decide.

Want a head start? The same plan I walk readers through, step by step, is in the BP Starter Kit. Eighteen pages, $17. You could start tonight.
→ ${KIT_URL}

Next three weeks: a short email every few days. Tomorrow, why I left the ICU. Day 3, a tea that drops 7 points in 6 weeks. Days 5 and 7, the pipes.

Joel
RN, BraveWorks

P.S. Hit reply and tell me which faucet feels loudest: Stress, Sugar, or Pipe. One word is enough. I read every reply.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 1 — Pipe Pressure #1 (vascular) + ICU origin story ────────────
const day1 = {
  subject: 'A garden hose with crimped walls',
  subjectB: 'The first faucet: your pipes',
  preview: 'Why I left the ICU, and what your vessels are doing right now.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Yesterday I showed you the three faucets. Today we open the first one: <strong>Pipe Pressure</strong>, your blood vessels themselves. But first, a quick story, because it's the reason I do this work at all.`)}
    ${p(`I spent 20 years as a registered nurse. Most of it in ICU and emergency. I was the person standing over the bed when someone came in at 220 over 130 with a stroke already starting in the brainstem.`)}
    ${p(`Some of those patients came back. Some didn't. But the ones I couldn't stop thinking about weren't the ones who came in dying. Those, we expected.`)}
    ${bigQuote('The ones I couldn\'t shake were the ones we discharged.')}
    ${p(`Stabilized. Handed a new prescription. Told "watch your salt and lose some weight." Walked out the door. We knew they'd be back, and most of them were, inside two years. Nobody had taught them how to use their own bodies.`)}
    ${p(`So I took five years and trained as a naturopath. I learned what nursing school doesn't teach: the herbs, the hydrotherapy, the breathing, the eight laws of health that built sanitariums before there were hospitals. And the first thing I had to relearn was what blood pressure even is.`, { margin: '0 0 28px' })}
    ${bigQuote('Picture a garden hose.')}
    ${p(`When the hose is new, the walls are soft and springy. Water flows through easy. Now picture that same hose left in the sun for ten summers. The rubber stiffens, the walls get crusty, and somewhere along the line it's crimped. To push the same water through, the pressure has to climb.`)}
    ${p(`That's Pipe Pressure. Your vessels were once soft and springy. Over the years: inflammation, low nitric oxide, stiffening walls. They crimp and harden. Your heart has to push harder to move the same blood. The number on the cuff goes up. The pill helps relax the hose a little, but it doesn't rebuild the rubber. That part is on the inputs.`)}
    ${p(`And here's the question I get most: <em>can something natural really be strong enough for a real medical number?</em>`)}
    ${p(`I understand the doubt. I trained in a hospital, I respect pharmacology. So let me be straight with you. The vessels are living tissue. They respond to what you feed them. Beets and leafy greens raise nitric oxide, the molecule that tells the hose walls to relax. It's the exact same pathway nitroglycerin uses in the ER, just gentler and steadier. Potassium pulls excess sodium out so there's less water in the line. This isn't folklore. It's the same plumbing your medication works on, approached from the other end.`)}
    ${p(`I'm not anti-medication, far from it. The work I do is <strong>AND, not INSTEAD OF</strong>. Your medication keeps you safe while we rebuild the pipes. When the inputs change, your doctor is the one who tapers. Never you, never me.`, { margin: '0 0 24px' })}
    ${p(`That woman you pictured yesterday, the one with the lower morning number? Her pipes are softer than they were. That's not a fantasy. That's biology that answers to breakfast. The full pipe protocol, the foods, the dosing, the order, is in the BP Starter Kit.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit ($17)')}
    ${p(`Day 3 I'll give you the single cheapest thing you can do for your pipes this week, about three dollars at the grocery store, plus the study behind it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've ever had a discharge story like the one I described, yours, or someone you love, hit reply and tell me one line. I read every email, and they shape what I send next.`)}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Yesterday: the three faucets. Today we open the first one: PIPE PRESSURE, your blood vessels. But first, a quick story, because it's why I do this at all.

I spent 20 years as an RN. Most of it ICU and emergency. I stood over the bed when someone came in at 220/130 with a stroke already starting.

Some came back. Some didn't. But the ones I couldn't shake weren't the dying. Those, we expected.

THE ONES I COULDN'T SHAKE WERE THE ONES WE DISCHARGED.

Stabilized. New prescription. "Watch your salt, lose some weight." Out the door. We knew they'd be back. Most were, inside two years. Nobody taught them to use their own bodies.

So I took five years and trained as a naturopath. The herbs, hydrotherapy, breathing, the eight laws of health that built sanitariums before hospitals. And I had to relearn what blood pressure even is.

PICTURE A GARDEN HOSE.

New hose: soft, springy walls, water flows easy. Same hose after ten summers in the sun: stiff, crusty, crimped. To push the same water through, pressure has to climb.

That's Pipe Pressure. Your vessels were soft once. Years of inflammation, low nitric oxide, stiffening walls. They crimp and harden. Your heart pushes harder. The pill relaxes the hose a little; it doesn't rebuild the rubber. That part is on the inputs.

The question I get most: can something natural be strong enough for a real medical number?

Straight answer: the vessels are living tissue. Beets and leafy greens raise nitric oxide, the molecule that tells the walls to relax. Same pathway nitroglycerin uses in the ER, just gentler. Potassium pulls excess sodium out. Not folklore. The same plumbing your med works on, from the other end.

I'm not anti-medication. The work is AND, not INSTEAD OF. The med keeps you safe while we rebuild the pipes. Your doctor tapers. Never you, never me.

The full pipe protocol, the foods, the dosing, the order, is in the BP Starter Kit.
→ ${KIT_URL}

Day 3: the cheapest thing you can do for your pipes this week (about $3) and the study behind it.

Joel
RN, BraveWorks

P.S. If you've ever had a discharge story like that, yours or someone you love, hit reply with one line. I read every email.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 3 — Pipe Pressure #2: proof (hibiscus) + $12.99 Companion ─────
// SHIP GATE (Joel): confirm the Stripe product behind COMPANION_URL displays
// "The 10-Day Nurse's Reset Companion" so checkout matches the email.
const day3 = {
  subject: 'Rusty pipes, clean pipes, $3 at the store',
  subjectB: 'The study: 7 points lower in 6 weeks',
  preview: 'A falsifiable claim: 7.2 points, six weeks, one red box.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days ago: the crimped garden hose. Today: how you start cleaning it out, and the proof it works.`)}
    ${p(`Think of two pipes under a kitchen sink. One is old galvanized steel, rusted on the inside, the opening narrowed to half its size by years of buildup. The other is clean copper. Same water pressure at the street, but only a trickle comes out of the rusty one, while the clean one runs full. Your vessels are pipes. Rust narrows them. Cleaning them out widens the channel and the pressure drops.`)}
    ${bigQuote('The cheapest pipe-cleaner I know: hibiscus tea.')}
    ${p(`Yes, the deep red flower tea your grandmother probably drank. The red boxes: Tazo, Celestial Seasonings "Red Zinger," or any plain hibiscus or "sorrel" tea in the grocery aisle. About three dollars.`)}
    ${p(`Now, I already know what some of you are thinking, because you've told me: <em>"I've tried herbs. They didn't do a thing."</em> I believe you. Most people try a herb the way they'd take a breath mint: once, casually, no dose, no consistency, no measuring. Then they conclude "herbs don't work." That's not a fair test. So let me give you a fair one, a claim you can actually check.`)}
    ${bigQuote('Here is the falsifiable claim.')}
    ${p(`A study at Tufts University put adults with mild hypertension on three cups of hibiscus tea a day for six weeks. The hibiscus group dropped an average of <strong>7.2 mmHg off their systolic number.</strong> The placebo group dropped 1.3. That's it. No fine print. Three cups, six weeks, measure before and after.`)}
    ${p(`Seven points doesn't sound dramatic, until you know it's the gap between Stage 1 hypertension and pre-hypertension for a lot of readers, and it's the same drop most people get from losing ten pounds, which is a far harder ask.`)}
    ${p(`Why it works: hibiscus is rich in anthocyanins, the deep-red cousins of what colors blueberries blue. They help the vessel walls relax (cleaning the rust off the pipe) and gently nudge sodium out through the kidneys (less water in the line). Mild vasorelaxant, mild diuretic, no prescription.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The fair test.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Cuff your arm in the morning. Write it down. Then drink three cups of hibiscus a day: one at breakfast, one at lunch, one in the afternoon. No sugar. Six weeks. Cuff again.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Let the number be the judge, not your memory of "that time herbs didn't work."</p>
    `)}
    ${outcomeRider()}
    ${p(`A safety note: if you're on a thiazide diuretic (hydrochlorothiazide) or a potassium-sparing one (spironolactone), check with your prescriber first. Hibiscus is mildly diuretic and the math may need adjusting. Your safety comes first, always.`, { margin: '0 0 24px' })}
    ${p(`Hibiscus is one pipe-cleaner. There are more. Beets, garlic, hawthorn, magnesium, the contrast shower. I put the claim and the dose behind every one of them in my book, <strong>The 10-Day Nurse's Reset Companion</strong>. Not opinions. The studies, the amounts, and the exact interaction questions to take to your prescriber or pharmacist before you add anything alongside your medication. It is $12.99, about the price of one supplement bottle you might have wasted on a guess.`, { margin: '0 0 24px' })}
    ${ctaButton(COMPANION_URL, 'Get the Reset Companion ($12.99)')}
    ${p(`In two days we open the second faucet: Sugar Pressure. It's the one most people swear they don't have, and most people do.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you pick up a box of hibiscus, snap a photo at the store and reply with it. I will cheer for you. Small wins are how big numbers move. And if you already grabbed the $17 Starter Kit, the Companion is the research shelf behind it. They are built to sit side by side.`)}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Two days ago: the crimped garden hose. Today: how you start cleaning it out, and the proof.

Picture two pipes under a sink. One is old galvanized steel, rusted inside, the opening narrowed to half its size. The other is clean copper. Same water pressure at the street, but only a trickle comes out of the rusty one. Your vessels are pipes. Cleaning out the rust widens the channel and the pressure drops.

THE CHEAPEST PIPE-CLEANER I KNOW: HIBISCUS TEA.

The deep red flower tea. Red boxes: Tazo, Celestial Seasonings "Red Zinger," any "sorrel" tea. About $3.

I know what some of you are thinking: "I've tried herbs, nothing worked." I believe you. But most people try a herb like a breath mint: once, no dose, no measuring, then quit. That's not a fair test. Here's a fair one.

THE FALSIFIABLE CLAIM:

Tufts University study. Adults with mild hypertension. Three cups of hibiscus a day, six weeks. Hibiscus group: 7.2 mmHg off systolic. Placebo: 1.3. No fine print.

Seven points is the gap between Stage 1 and pre-hypertension for many, and the same drop as losing ten pounds, a far harder ask.

Why: anthocyanins (the red cousins of what colors blueberries) relax the vessel walls and nudge sodium out through the kidneys. Mild vasorelaxant, mild diuretic, no prescription.

THE FAIR TEST: Cuff in the morning, write it down. Three cups a day, no sugar, six weeks. Cuff again. Let the number judge, not your memory of "that time herbs didn't work."

${OUTCOME_RIDER_TEXT}

Safety: on a thiazide (HCTZ) or potassium-sparing (spironolactone) diuretic? Check with your prescriber first. Hibiscus is mildly diuretic.

Hibiscus is one pipe-cleaner. There are more. Beets, garlic, hawthorn, magnesium, the contrast shower. I put the claim and the dose behind every one of them in my book, THE 10-DAY NURSE'S RESET COMPANION. Not opinions. The studies, the amounts, and the exact interaction questions to take to your prescriber or pharmacist before you add anything alongside your medication. It is $12.99, about the price of one supplement bottle you might have wasted on a guess.
→ ${COMPANION_URL}

In two days: the second faucet, Sugar Pressure. The one most swear they don't have, and most do.

Joel
RN, BraveWorks

P.S. Pick up a box? Snap a photo at the store and reply with it. I will cheer for you. Small wins are how big numbers move. And if you already grabbed the $17 Starter Kit, the Companion is the research shelf behind it. They are built to sit side by side.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 5 — Sugar Pressure #1 (insulin): the hidden driver ────────────
const day5 = {
  subject: 'The faucet you swear you don\'t have',
  subjectB: 'Syrup doesn\'t move like water',
  preview: 'You don\'t need to be diabetic for sugar to push your number up.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`We've spent four days on the pipes. Today we open the second faucet, and it's the one almost everyone tells me they don't have.`)}
    ${bigQuote('Sugar Pressure. Insulin.')}
    ${p(`Let me name the problem precisely, because most people get it wrong. This isn't about diabetes. It isn't even mainly about your blood sugar. It's about <strong>insulin</strong>, the hormone your body releases every time you eat, especially bread, cereal, crackers, juice, and the 3 PM cookie.`)}
    ${p(`Here's the picture. Go back to your garden hose. Run clean water through it: flows easy, low pressure. Now run warm pancake syrup through that same hose. Thicker. Stickier. It drags against the walls. The pressure to push it through climbs, even though nothing about the hose changed.`)}
    ${p(`That's what chronically high insulin does. It does three things, and all three push the cuff up:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What insulin does to the line</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>It tells your kidneys to hold salt.</strong> More salt held = more water in the line = more pressure. (This is why salt gets blamed, but insulin is often the hand on the valve.)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>It thickens and stiffens the walls.</strong> High insulin makes vessel walls less springy. The syrup starts to coat the pipe.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>It revs the stress nerves.</strong> Insulin nudges the same "alert" system as cortisol, tightening the vessels further.</p>
    `)}
    ${p(`Now the objection I hear most: <em>"But Joel, my sugar's fine. My doctor never said I'm diabetic."</em>`)}
    ${p(`Here's the part nobody told you. Your fasting glucose can read perfectly normal for ten or fifteen years while your insulin is quietly running high the entire time. Glucose is the last domino to fall. By the time sugar shows up on a standard test, the syrup has been thickening your line for a decade. So "my sugar's fine" and "I have Sugar Pressure" can both be true at once. You don't have to be diabetic. You just have to have eaten like a normal American for thirty years.`)}
    ${p(`How would you know? A few honest tells: a softening middle that diet doesn't touch, afternoon cravings you can set a clock by, the 3 o'clock energy crash, skin tags, or numbers that read worst in the evening. None of those need a test result to notice. They're the syrup talking.`, { margin: '0 0 28px' })}
    ${p(`Here's the hopeful part: insulin responds <em>fast</em>. Of the three faucets, this is the one that can move your numbers in days, not weeks, because you turn it down at the very next meal. Swap the white toast. Walk ten minutes after you eat. Front-load protein and fiber before the starch. The syrup thins back toward water.`)}
    ${p(`In two days I'll show you exactly that, through Linda, a reader whose story I will tell you start to finish. Today, just sit with this: the faucet you were sure you didn't have may be the loudest one in the room.`, { margin: '0 0 12px' })}
    ${outcomeRider()}
    ${joelSignoff()}
    ${psBox(`Quick gut check: do you crave something starchy or sweet around 3 PM most days? Hit reply with just "yes" or "no." It's the single fastest tell for Sugar Pressure, and I read every reply.`)}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Four days on the pipes. Today, the second faucet, the one almost everyone swears they don't have.

SUGAR PRESSURE. INSULIN.

Let me name it precisely: this isn't about diabetes. It isn't even mainly about blood sugar. It's about INSULIN, the hormone you release every time you eat, especially bread, cereal, crackers, juice, the 3 PM cookie.

Back to the garden hose. Run clean water through: flows easy, low pressure. Now run warm pancake syrup through the same hose. Thicker, stickier, drags on the walls. Pressure climbs, though the hose never changed.

That's chronically high insulin. Three things, all push the cuff up:

- It tells your kidneys to HOLD SALT. More salt held = more water in the line = more pressure. (Salt gets blamed; insulin's often the hand on the valve.)
- It STIFFENS the walls. Less springy. Syrup coating the pipe.
- It REVS the stress nerves, tightening vessels further.

The objection I hear most: "But my sugar's fine, I'm not diabetic."

Here's what nobody told you: your fasting glucose can read normal for 10-15 years while your insulin runs high the whole time. Glucose is the LAST domino. By the time sugar shows on a standard test, the syrup's been thickening your line for a decade. "My sugar's fine" and "I have Sugar Pressure" can both be true. You don't have to be diabetic. You just have to have eaten like a normal American for thirty years.

Honest tells: a softening middle diet won't touch, afternoon cravings you can set a clock by, the 3 PM crash, skin tags, numbers worst in the evening. No test result required to notice. That's the syrup talking.

The hopeful part: insulin responds FAST, days, not weeks, because you turn it down at the next meal. Swap the white toast. Walk ten minutes after eating. Protein and fiber before the starch. The syrup thins back toward water.

In two days, Linda's story, start to finish. Today, just sit with this: the faucet you were sure you didn't have may be the loudest in the room.

${OUTCOME_RIDER_TEXT}

Joel
RN, BraveWorks

P.S. Gut check: crave something starchy or sweet around 3 PM most days? Reply "yes" or "no." Fastest tell for Sugar Pressure. I read every reply.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 7 — Sugar Pressure #2: the swing + Linda case study ───────────
// SHIP GATES (Joel): (a) verify the Starter Kit actually contains, day by
// day: hibiscus protocol, garlic prep, protein-and-fiber-first food order,
// post-meal walk, contrast shower, morning cuff routine — before the
// "Everything Linda did came from one place" claim ships. (b) retain the
// source log behind "Linda" (the copy claims "the numbers are real").
const day7 = {
  subject: 'What Linda did in 11 days',
  subjectB: 'Get off the blood-sugar rollercoaster',
  preview: 'A retired schoolteacher, her cuff log, and the question her cardiologist asked.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days ago I told you about the syrup in the line. Today I want you to feel the second half of Sugar Pressure, the <em>swing</em>, and then meet a woman who got off it.`)}
    ${bigQuote('The blood-sugar rollercoaster.')}
    ${p(`Eat white toast and jam. Your blood sugar shoots up like the first climb of a rollercoaster. Insulin floods in to drag it back down, and overshoots, so an hour later you crash into a valley, shaky and craving the next carb. Up the hill, down the drop, again and again, all day. Every climb spikes your pressure. Every crash sends you reaching for the thing that spikes it again.`)}
    ${p(`Most people ride that rollercoaster their whole adult life and call it "normal energy." Getting off it is one of the fastest ways to drop a number. Linda proved it.`, { margin: '0 0 28px' })}
    ${p(`Linda is 62. (Not her real name. I protect everyone in these stories. The numbers are real.) Retired schoolteacher, married 38 years, reads the label on everything, and still couldn't figure out why her numbers kept climbing.`)}
    ${bigQuote('Before.')}
    ${p(`Home reading: <strong>148/94.</strong> On lisinopril 20mg for four years, amlodipine 5mg added two years ago, and at her last visit the cardiologist floated a third medication.`)}
    ${p(`Pipe Pressure was loud for her, but Sugar was the runner-up nobody had flagged: the afternoon crashes, the softening middle. So she worked both faucets at once. Here's exactly what she did:`, { margin: '0 0 18px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Linda's first 11 days.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Pipes:</strong> Hibiscus tea, three cups a day. Garlic: one fresh clove crushed, rested 10 minutes, added at the end of cooking. A walk after dinner. End-of-day contrast shower, 30 seconds cold to finish.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Sugar (the rollercoaster brakes):</strong> Swapped store-bought sandwich bread for a homemade alternative her granddaughter helped her bake. Ate protein and fiber <em>before</em> any starch. Walked ten minutes after lunch to burn the glucose before it spiked. The 3 PM cookie became an apple with peanut butter.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Every day:</strong> Cuffed each morning, same time, sitting, both feet flat, no coffee yet. Wrote the number down.</p>
    `)}
    ${bigQuote('After.')}
    ${p(`Eleven days in, her morning reading was <strong>128/82.</strong> Twenty systolic points. Twelve diastolic. Same medications, same doses, no new prescription. At her follow-up the cardiologist looked at the log, looked at her, and asked one question: <em>"What did you do?"</em> He didn't add the third drug. He told her to keep going and come back in 90 days.`, { margin: '0 0 12px' })}
    ${outcomeRider()}
    ${p(`Everything Linda did in those 11 days came from one place. The hibiscus, the garlic, the food order, the walk after lunch, the morning cuff routine. It is all laid out day by day in the BP Starter Kit. Eighteen pages, $17. You could start your own 11 days tomorrow morning.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit ($17)')}
    ${p(`Now, here is the objection that stops most people from ever starting. Not "will it work." It is quieter than that. It is: <em>"I can't do this alone."</em> And you are right. You should not have to.`)}
    ${p(`And if doing it alone is the part that worries you, you do not have to be alone for it. Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free. Linda had a granddaughter in the kitchen. This is your version of that. <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};font-weight:600;">Start your free week</a>.`, { margin: '0 0 28px' })}
    ${p(`Next week we open the third and quietest faucet, Stress Pressure, and I will show you the hormone connection almost nobody explains. Today, sit with this: 20 points in 11 days, and she did not do it alone.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your number is anywhere near Linda's starting point and you've been told "this is as good as it gets," hit reply and tell me what your number is today. I won't pitch you in the reply. I just want to know who's reading.`)}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Two days ago: the syrup in the line. Today, the second half of Sugar Pressure: the SWING. Then a woman who got off it.

THE BLOOD-SUGAR ROLLERCOASTER.

White toast and jam: sugar shoots up like the first climb. Insulin floods in, overshoots, and an hour later you crash into a valley, shaky, craving the next carb. Up the hill, down the drop, all day. Every climb spikes your pressure. Every crash sends you reaching for the thing that spikes it again.

Most people ride it their whole life and call it "normal energy." Getting off is one of the fastest ways to drop a number. Linda proved it.

Linda is 62. (Not her real name. The numbers are real.) Retired teacher, married 38 years, reads every label, still couldn't figure out why her numbers climbed.

BEFORE: 148/94. Lisinopril 20mg four years, amlodipine 5mg two years, cardiologist floating a third.

Pipe Pressure was loud; Sugar was the runner-up nobody flagged. She worked both:

PIPES: Hibiscus, 3 cups/day. Garlic (fresh clove crushed, rested, added late). Walk after dinner. Contrast shower, 30 sec cold to finish.

SUGAR (the brakes): Swapped store bread for homemade. Protein and fiber BEFORE starch. Ten-minute walk after lunch. The 3 PM cookie became apple + peanut butter.

EVERY DAY: Cuffed each morning, same time, sitting, feet flat, no coffee yet. Wrote it down.

AFTER: Day 11, morning reading 128/82. Twenty systolic, twelve diastolic. Same meds, same doses. Cardiologist asked, "What did you do?" Didn't add the third drug. Told her to keep going.

${OUTCOME_RIDER_TEXT}

Everything Linda did in those 11 days came from one place. The hibiscus, the garlic, the food order, the walk after lunch, the morning cuff routine. It is all laid out day by day in the BP Starter Kit. Eighteen pages, $17. You could start your own 11 days tomorrow morning.
→ ${KIT_URL}

Now, here is the objection that stops most people from ever starting. Not "will it work." It is quieter than that. It is: "I can't do this alone." And you are right. You should not have to.

If doing it alone is the part that worries you, you do not have to be alone for it. Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free. Linda had a granddaughter in the kitchen. This is your version of that.
Start your free week: ${SKOOL_URL}

Next week we open the third and quietest faucet, Stress Pressure, and I will show you the hormone connection almost nobody explains. Today, sit with this: 20 points in 11 days, and she did not do it alone.

Joel
RN, BraveWorks

P.S. If your number is near Linda's start, hit reply and tell me yours. I won't pitch you in the reply. I just want to know who's reading.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 10 — Stress Pressure #1 (cortisol) + date-gated RestoreHER ────
const day10 = {
  subject: 'Your foot is stuck on the gas',
  subjectB: 'The silent faucet nobody measures',
  preview: 'The third Pressure runs even while you sleep. Here is how to ease off.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`We've turned down the pipes. We've thinned the syrup. Today we reach the third faucet, the quiet one, the one almost no cardiologist measures: <strong>Stress Pressure</strong>. Cortisol.`)}
    ${bigQuote('Imagine your foot stuck on the gas pedal.')}
    ${p(`Engine revving in the driveway. You're not going anywhere, but the motor is roaring, burning fuel, wearing itself down. That's your body under chronic cortisol. Your nervous system is flooring the accelerator, heart faster, vessels tighter, bracing for a threat that never actually comes. And it does this all day, even while you sleep.`)}
    ${p(`That's why this faucet is so sneaky. Pipe and Sugar Pressure you can sometimes feel. Stress Pressure runs in the background. The tells: you wake between 2 and 4 AM and can't drop back off. Mornings are "wired but tired." Coffee feels mandatory. Weight settles around the middle. And, the giveaway, your readings are always highest at the doctor's office. That's not white-coat nerves being silly. That's your foot mashing the pedal on cue.`, { margin: '0 0 28px' })}
    ${p(`Now the belief I have to gently dismantle, because it stops almost everyone: <em>"Stress is just life at my age. I can't fix that."</em>`)}
    ${p(`I hear you. You can't fire your family, undo a loss, or add hours to the day. But here's the bridge I want you to walk across: you are not trying to remove stress. You are trying to take your foot off the gas, to teach the nervous system it's allowed to idle. Those are completely different jobs. You don't need a calmer life. You need a body that stops revving when the driveway is empty.`)}
    ${p(`And that part is absolutely trainable. Five minutes of morning sunlight resets the cortisol curve so it peaks in the morning instead of at 2 AM. A slow 4-7-8 breath drops cortisol faster than any supplement I've measured. Magnesium glycinate at night lifts the foot off the pedal while you sleep. If you take BP medication, ask your prescriber first so everything works together. None of that requires your life to get easier. It just requires the gas pedal to come up.`, { margin: '0 0 28px' })}
    ${restoreHerLive() ? `
    ${p(`Here is why this faucet matters so much for the women I serve, and why I want to invite you to something. Especially for women in perimenopause and after, Stress Pressure and hormones are tangled together in a way no one explains. So this month I am part of a live event built entirely around it.`, { margin: '0 0 24px' })}
    ${clayBlock(
      'RestoreHER Hormones · June 24 and 25 · Louisville',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">A live two-day event on the hormone and blood pressure connection, at the Galt House in Louisville. <strong>Barbara O'Neill is keynoting.</strong> My wife <strong>Annie, an RN and fellow naturopath</strong>, teaches the hormone side. And I walk through the Stress Pressure faucet in depth. The event is June 24 and 25. That is days away, not months. Details and tickets are at restoreherhormones.com.</p>`
    )}
    ${ctaButton(RESTOREHER_URL, 'See the RestoreHER event details')}
    ` : `
    ${clayBlock(
      'The hormone corner',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">For many women the stress faucet has a hormone hand on it. My wife Annie, an RN and fellow naturopath, teaches that side of the work at RestoreHER Hormones. If hormones feel like your loudest corner, start there.</p>`
    )}
    ${ctaButton(RESTOREHER_URL, 'Visit RestoreHER Hormones')}
    `}
    ${p(`In three days I'll tell you the part of the cortisol story that's specifically about menopause, and why so many women find their numbers started revving harder right around the time their hormones shifted. It's the email I wish someone had handed my own patients twenty years ago.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Do you wake between 2 and 4 AM, mind racing, unable to drop back off? Hit reply with one word: "yes." That single symptom tells me your Stress faucet is wide open, and it's one of the most fixable things I teach.`)}
    ${restoreHerLive() ? upsellFooter({
      kicker: 'June 24 and 25 · Galt House, Louisville',
      body: 'RestoreHER Hormones. Barbara O\'Neill keynoting, my wife Annie, RN, teaching the hormone side, and me on the Stress Pressure faucet. Details and tickets at restoreherhormones.com.',
      ctaLabel: 'See the event details',
      ctaUrl: RESTOREHER_URL,
    }) : ''}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

We turned down the pipes. We thinned the syrup. Today, the third faucet, the quiet one almost no cardiologist measures: STRESS PRESSURE. Cortisol.

IMAGINE YOUR FOOT STUCK ON THE GAS PEDAL.

Engine revving in the driveway. You're going nowhere, but the motor's roaring, burning fuel, wearing down. That's chronic cortisol: your nervous system flooring it, heart faster, vessels tighter, bracing for a threat that never comes. All day. Even while you sleep.

That's why it's sneaky. Pipe and Sugar you can sometimes feel. Stress runs in the background. Tells: waking 2-4 AM and can't drop off, "wired but tired" mornings, mandatory coffee, weight around the middle, and readings always highest at the doctor's office. That's not silly nerves. That's your foot mashing the pedal on cue.

The belief that stops everyone: "Stress is just life at my age. I can't fix that."

I hear you. You can't fire your family or add hours to the day. But here's the bridge: you're not removing stress. You're taking your foot OFF the gas, teaching the nervous system it's allowed to idle. Different jobs. You don't need a calmer life. You need a body that stops revving when the driveway is empty.

And that's trainable: 5 minutes of morning sunlight resets the cortisol curve. A slow 4-7-8 breath drops cortisol faster than any supplement I've measured. Magnesium glycinate at night lifts the foot off the pedal while you sleep. If you take BP medication, ask your prescriber first so everything works together. None of it needs your life to get easier.

${restoreHerLive() ? `Here is why this faucet matters so much for the women I serve, and why I want to invite you to something. Especially for women in perimenopause and after, Stress Pressure and hormones are tangled together in a way no one explains. So this month I am part of a live event built entirely around it.

RESTOREHER HORMONES · JUNE 24 AND 25 · LOUISVILLE
A live two-day event on the hormone and blood pressure connection, at the Galt House in Louisville. Barbara O'Neill is keynoting. My wife Annie, an RN and fellow naturopath, teaches the hormone side. And I walk through the Stress Pressure faucet in depth. The event is June 24 and 25. That is days away, not months. Details and tickets are at restoreherhormones.com.
→ ${RESTOREHER_URL}` : `THE HORMONE CORNER
For many women the stress faucet has a hormone hand on it. My wife Annie, an RN and fellow naturopath, teaches that side of the work at RestoreHER Hormones. If hormones feel like your loudest corner, start there.
→ ${RESTOREHER_URL}`}

In three days: the menopause part of the cortisol story, and why so many women find their numbers started revving harder right when their hormones shifted.

Joel
RN, BraveWorks

P.S. Wake between 2 and 4 AM, mind racing, can't drop back off? Reply "yes." That one symptom tells me your Stress faucet is wide open, and it's one of the most fixable things I teach.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 13 — Stress Pressure #2: hormones + date-gated RestoreHER ─────
// ROOM reply-gate: Joel reads braveworksrn@gmail.com daily; in-person seats
// confirmed to exist (2026-06-09).
const day13 = {
  subject: 'The dimmer switch nobody told you about',
  subjectB: 'Why your BP shifted right around menopause',
  preview: 'Estrogen held the dimmer on cortisol. It\'s fading. Here\'s what helps.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three days ago I showed you the foot stuck on the gas pedal. Today I have to tell you the part of the story that's specifically about being a woman in your second half of life, because it changes everything about how you read your own numbers.`)}
    ${p(`Think back. So many women tell me the same thing: <em>"My pressure was fine my whole life. Then somewhere around 50, it just... started creeping up."</em> They assume it's age. It's not really age. It's a switch that quietly turned off.`)}
    ${bigQuote('Estrogen was the dimmer switch on your cortisol.')}
    ${p(`For decades, estrogen sat on the wall of your body like a dimmer switch, keeping cortisol turned <em>down</em>, keeping your vessels soft and relaxed, keeping that gas pedal from sticking. You never noticed it working, the same way you don't notice a dimmer holding the lights at a gentle glow. It just quietly did its job for thirty years.`)}
    ${p(`Then perimenopause and menopause arrive, and that dimmer switch fades. The hand that held cortisol down lifts off. Now the same daily stress that used to roll right past you sends the lights to full blast. Your vessels lose some of their give. The gas pedal sticks more easily. Your morning number climbs, and you blame "getting older."`)}
    ${p(`This is exactly why a plan written for a 45-year-old man, or the generic advice on the pamphlet, so often fails the woman it was never designed for. Your Stress Pressure has a hormonal hand on it that his doesn't.`, { margin: '0 0 28px' })}
    ${p(`So let me speak to the belief underneath it all, the one I hear most from women your age: <em>"It's just my age. It's genetics. This is what happens."</em>`)}
    ${p(`Here's the truth I want you to hold onto. Your genes loaded the gun, but your inputs pull the trigger, and a fading dimmer switch is not a life sentence. It's a <strong>known, addressable shift</strong>. We can support what estrogen used to do: with the breathing, the sunlight, the magnesium, the right plant foods, and the hormone-aware protocols that actual practitioners, not pamphlets, use. "It's just my age" is the sentence that keeps a woman stuck on the gas pedal for the rest of her life. I refuse to let that be your story.`, { margin: '0 0 28px' })}
    ${restoreHerLive() ? `
    ${p(`And this is the heart of why I want you in the room this June. RestoreHER Hormones is June 24 and 25 at the Galt House in Louisville. Barbara O'Neill is keynoting. Annie teaches the hormone side, and I walk through the stress faucet in depth. Two full days, with women walking the exact same road. After the 25th, this room is gone.`, { margin: '0 0 24px' })}
    ${ctaButton(RESTOREHER_URL, 'See the RestoreHER event details')}
    ${p(`A small number of in-person seats exist for women who want to be in the room in Louisville, and there is a way to bring a daughter, a sister, or a friend. If that is you, reply with the word ROOM and I will send you the details myself.`, { margin: '0 0 28px' })}
    ` : `
    ${clayBlock(
      'The hormone corner',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">For many women the stress faucet has a hormone hand on it. My wife Annie, an RN and fellow naturopath, teaches that side of the work at RestoreHER Hormones. If hormones feel like your loudest corner, start there.</p>`
    )}
    ${ctaButton(RESTOREHER_URL, 'Visit RestoreHER Hormones')}
    `}
    ${p(`In three days the emails turn a corner. I'm going to talk about the one faucet you genuinely cannot turn all the way down by yourself, and what to do about it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Did your numbers start creeping up somewhere around 48 to 55? Hit reply and tell me roughly when it began. That timing is one of the clearest signs the dimmer switch, not "old age," is what's driving your number.`)}
    ${restoreHerLive() ? upsellFooter({
      kicker: 'June 24 and 25 · Louisville',
      body: 'RestoreHER Hormones at the Galt House. Barbara O\'Neill keynoting, Annie on the hormone side, me on the stress faucet. Details and tickets at restoreherhormones.com. Want to be in the room? Reply with the word ROOM.',
      ctaLabel: 'See the event details',
      ctaUrl: RESTOREHER_URL,
    }) : ''}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Three days ago: the foot stuck on the gas. Today, the part of the story that's specifically about being a woman in your second half of life.

So many women tell me the same thing: "My pressure was fine my whole life. Then around 50, it just started creeping up." They assume it's age. It's not really age. It's a switch that quietly turned off.

ESTROGEN WAS THE DIMMER SWITCH ON YOUR CORTISOL.

For decades, estrogen sat on the wall like a dimmer, keeping cortisol turned DOWN, vessels soft, the gas pedal from sticking. You never noticed it working, like you don't notice a dimmer holding the lights at a gentle glow. It just did its job for thirty years.

Then perimenopause and menopause arrive, and the dimmer fades. The hand holding cortisol down lifts off. The same daily stress that rolled past you now sends the lights to full blast. Vessels lose their give. The pedal sticks. Your morning number climbs, and you blame "getting older."

That's why a plan written for a 45-year-old man so often fails the woman it was never designed for. Your Stress Pressure has a hormonal hand on it that his doesn't.

The belief I hear most: "It's just my age. It's genetics. This is what happens."

The truth: your genes loaded the gun, your inputs pull the trigger, and a fading dimmer switch isn't a life sentence. It's a known, addressable shift. We can support what estrogen used to do: the breathing, sunlight, magnesium, the right plant foods, hormone-aware protocols that real practitioners use. "It's just my age" is the sentence that keeps a woman stuck on the gas pedal forever. I won't let that be your story.

${restoreHerLive() ? `AND THIS IS THE HEART OF WHY I WANT YOU IN THE ROOM THIS JUNE.

RestoreHER Hormones is June 24 and 25 at the Galt House in Louisville. Barbara O'Neill is keynoting. Annie teaches the hormone side, and I walk through the stress faucet in depth. Two full days, with women walking the exact same road. After the 25th, this room is gone.
→ See the event details: ${RESTOREHER_URL}

A small number of in-person seats exist for women who want to be in the room in Louisville, and there is a way to bring a daughter, a sister, or a friend. If that is you, reply with the word ROOM and I will send you the details myself.` : `THE HORMONE CORNER
For many women the stress faucet has a hormone hand on it. My wife Annie, an RN and fellow naturopath, teaches that side of the work at RestoreHER Hormones. If hormones feel like your loudest corner, start there.
→ ${RESTOREHER_URL}`}

In three days the emails turn a corner: the one faucet you genuinely can't turn all the way down by yourself, and what to do about it.

Joel
RN, BraveWorks

P.S. Did your numbers start creeping up around 48 to 55? Reply and tell me roughly when. That timing is one of the clearest signs the dimmer switch, not "old age," is driving your number.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 16 — The Weekly Reset free week (GPS / voice in the car) ──────
// SHIP GATE (Joel): verify in Skool settings that the braveworksrn group
// trial is configured as exactly 7 days free with $0 charge on cancellation
// before day 7. (Joel confirmed configured, 2026-06-09.)
const day16 = {
  subject: 'Driving blind vs. driving with GPS',
  subjectB: 'Your first week in the live room is free',
  preview: 'Four live sessions a month, Wednesdays at 7 pm ET. Day one costs nothing.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Over sixteen days you've learned the whole map. The pipes. The syrup. The gas pedal. The dimmer switch. You could turn down all three faucets starting tomorrow, and many of you will.`)}
    ${p(`But I'd be a poor nurse if I didn't tell you the honest truth about the fourth corner, the one that isn't a faucet at all.`)}
    ${bigQuote('Some roads you shouldn\'t drive blind.')}
    ${p(`Picture two people driving to the same unfamiliar address across a big city. One has GPS: a voice that says "turn here," that reroutes the second she takes a wrong exit, that knows the road closures before she hits them. The other has a printed page of directions from ten years ago and her own best guess.`)}
    ${p(`They might both arrive. But you already know who white-knuckles it, who doubles back, who gives up and goes home. The map was never the problem. The map is the same for both of them. The difference is one of them had a voice in the car.`)}
    ${p(`That's the corner you can't fully fix alone. Not because you're weak, but because you can't read your own blind spot. When your number jumps 12 points one morning, is it the new medication, the salt in last night's restaurant meal, a bad night's sleep, or the dimmer switch? A book can't answer that. A self-paced course can't answer that.`, { margin: '0 0 28px' })}
    ${p(`Sixteen days ago I handed you the map. Maybe you read every email and still have not started. I understand. A map on the table does not drive the car. A voice in the car does.`, { margin: '0 0 24px' })}
    ${clayBlock(
      'The Weekly Reset · First 7 days free',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free. When your number jumps 12 points one morning, you do not have to guess alone. You bring it to the room and we read it together.</p>`
    )}
    ${p(`Your first week costs nothing. Come to one Wednesday call. Ask me the question you have been sitting on. If it is not for you, leave before day seven and you pay nothing.`)}
    ${p(`One thing said plainly: the Weekly Reset is education and accountability, not medical care. Nothing in the room replaces your own doctor.`, { margin: '0 0 24px' })}
    ${ctaButton(SKOOL_URL, 'Start your free week')}
    ${p(`<span style="color:#999;font-size:14px;">Not ready for a live room? <a href="${KIT_URL}" style="color:${PALETTE.accentClay};">The $17 Starter Kit</a> is still the smallest honest step.</span>`, { margin: '0 0 28px' })}
    ${p(`In three days I will tell you about the one thing I make that has your name on it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Wednesday at 7 pm ET is the night. If you start your free week today, bring this week's numbers to the call.`)}
    ${upsellFooter({
      kicker: 'The Weekly Reset',
      body: 'Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free.',
      ctaLabel: 'Start your free week',
      ctaUrl: SKOOL_URL,
    })}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Sixteen days, and you've learned the whole map. The pipes. The syrup. The gas pedal. The dimmer switch. You could turn down all three faucets tomorrow, and many of you will.

But I'd be a poor nurse if I didn't tell you the truth about the fourth corner, the one that isn't a faucet.

SOME ROADS YOU SHOULDN'T DRIVE BLIND.

Two people drive to the same unfamiliar address across a big city. One has GPS: a voice saying "turn here," rerouting after a wrong exit, knowing the closures ahead. The other has a printed page from ten years ago and her best guess.

They might both arrive. But you know who white-knuckles it, doubles back, gives up. The map was never the problem. It's the same for both. The difference is a voice in the car.

That's the corner you can't fully fix alone. Not because you're weak, but because you can't read your own blind spot. When your number jumps 12 points one morning, is it the new med, the restaurant salt, a bad night's sleep, or the dimmer switch? A book can't answer that. A self-paced course can't.

Sixteen days ago I handed you the map. Maybe you read every email and still have not started. I understand. A map on the table does not drive the car. A voice in the car does.

THE WEEKLY RESET · FIRST 7 DAYS FREE
Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free. When your number jumps 12 points one morning, you do not have to guess alone. You bring it to the room and we read it together.

Your first week costs nothing. Come to one Wednesday call. Ask me the question you have been sitting on. If it is not for you, leave before day seven and you pay nothing.

One thing said plainly: the Weekly Reset is education and accountability, not medical care. Nothing in the room replaces your own doctor.

→ Start your free week: ${SKOOL_URL}

Not ready for a live room? The $17 Starter Kit is still the smallest honest step.
→ ${KIT_URL}

In three days I will tell you about the one thing I make that has your name on it.

Joel
RN, BraveWorks

P.S. Wednesday at 7 pm ET is the night. If you start your free week today, bring this week's numbers to the call.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 19 — The $297 Sprint: the bill you're already paying ──────────
// 5-per-month cap is real (Joel confirmed 2026-06-09 and enforces it
// operationally). NINETY reply-gate: $1,997 cohort is enrollable; Joel
// reads braveworksrn@gmail.com.
const day19 = {
  subject: 'The bill you\'re already paying',
  subjectB: 'I write your 30 days. You walk them with me.',
  preview: 'One flat $297, five readers a month, a plan with your name on it.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three days ago I told you about the one thing I make that has your name on it. Before I show it to you, I want to do some honest math, because I think you are doing the wrong arithmetic, and it is costing you more than you realize.`)}
    ${p(`When I say a number like $297, the mind hears a cost and flinches. But that number is not being compared to nothing. It is being compared to the bill you are already paying, month after month, quietly, without ever getting a receipt.`)}
    ${bigQuote('Add up what staying stuck actually costs.')}
    ${p(`Let's do it honestly, on the back of a napkin:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The bill for staying stuck.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ Medication co-pays, every month, often more than one, often for years, frequently climbing as a third drug gets added.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ The appointments, the labs, the specialist visits, each with its own co-pay and its own half-day of your life.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ One ER visit or one cardiac scare, which can cost more by itself than anything on my shelf, before you count the fear.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">→ And the part with no dollar sign: the 2 AM worry, the held breath at every cuff reading, the son or daughter who's quietly scared for you.</p>
    `)}
    ${p(`That bill runs every single month, on autopay, unless something changes the inputs. The Sprint is a one-time cost aimed at the inputs you control: the kitchen, the salt, the walks, the sleep, the log. Whether any medication ever changes is your prescriber's call alone, and for many readers it never does. One number, paid once, against a meter that never stops running. That is the real comparison.`, { margin: '0 0 28px' })}
    ${p(`So let me speak gently to the honest version of the objection. Not "is it worth it," but <em>"I can't afford it."</em> I hear that, and I respect it. The truth underneath it: you are already paying for the more expensive option, the monthly meter. You just never see the total, because it never arrives as one bill. $297 is less than a couple of months of that meter. And you do not have to put yourself last to do this. Choosing a plan with your name on it is not selfish. It is the first time in a long while you put your own name on the list.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'The 30-Day Personalized Sprint · $297, flat',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">You send your log and your intake, I write your 30 days, and we walk it together in the live sessions. Day by day. Built from your numbers, your meds, your kitchen. Four live group sessions are included. AND, never instead of: your plan works alongside your physician's care, every step, and nothing in it overrides your prescriber. I take 5 new Sprint readers a month, because that is what the writing actually takes. When a month is full, the next spot is simply next month.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">And one promise before you spend a dollar: if I read your intake and your numbers and the honest answer is that this is more than an education program should take on, I will tell you before I write a single word of your plan, and refund every dollar.</p>`
    )}
    ${outcomeRider()}
    ${ctaButton(SPRINT_URL, 'Start your Sprint ($297)')}
    ${p(`And if you want 90 days working directly with me in a small group, that exists too. Reply with the word NINETY and I will send the details.`, { margin: '0 0 28px' })}
    ${p(`In two days, the last email of this series. The whole map in one place.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If the honest wall is money, hit reply and tell me. The $17 Starter Kit and the free week in the Weekly Reset both exist for exactly that. I read every reply and I will not pressure you.`)}
    ${upsellFooter({
      kicker: 'A plan with your name on it',
      body: 'The 30-Day Personalized Sprint. You send your log and your intake, I write your 30 days, and we walk it together in the live sessions. $297, flat. I take 5 new Sprint readers a month, because that is what the writing actually takes.',
      ctaLabel: 'Start your Sprint',
      ctaUrl: SPRINT_URL,
    })}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Three days ago I told you about the one thing I make that has your name on it. Before I show it to you, some honest math, because I think you are doing the wrong arithmetic, and it is costing you more than you realize.

When I say a number like $297, the mind hears a cost and flinches. But that number is not being compared to nothing. It is being compared to the bill you are already paying, month after month, quietly, without ever getting a receipt.

ADD UP WHAT STAYING STUCK ACTUALLY COSTS.

On the napkin:
→ Medication co-pays, every month, often more than one, often for years, frequently climbing as a third drug gets added.
→ The appointments, the labs, the specialist visits, each with its own co-pay and its own half-day of your life.
→ One ER visit or one cardiac scare, which can cost more by itself than anything on my shelf, before you count the fear.
→ And the part with no dollar sign: the 2 AM worry, the held breath at every cuff reading, the son or daughter who's quietly scared for you.

That bill runs every single month, on autopay, unless something changes the inputs. The Sprint is a one-time cost aimed at the inputs you control: the kitchen, the salt, the walks, the sleep, the log. Whether any medication ever changes is your prescriber's call alone, and for many readers it never does. One number, paid once, against a meter that never stops running. That is the real comparison.

The honest version of the objection isn't "is it worth it." It's "I can't afford it." I hear that, and I respect it. The truth underneath it: you are already paying for the more expensive option, the monthly meter. You just never see the total, because it never arrives as one bill. $297 is less than a couple of months of that meter. And you do not have to put yourself last to do this. Choosing a plan with your name on it is not selfish. It is the first time in a long while you put your own name on the list.

THE 30-DAY PERSONALIZED SPRINT · $297, FLAT
You send your log and your intake, I write your 30 days, and we walk it together in the live sessions. Day by day. Built from your numbers, your meds, your kitchen. Four live group sessions are included. AND, never instead of: your plan works alongside your physician's care, every step, and nothing in it overrides your prescriber. I take 5 new Sprint readers a month, because that is what the writing actually takes. When a month is full, the next spot is simply next month.

And one promise before you spend a dollar: if I read your intake and your numbers and the honest answer is that this is more than an education program should take on, I will tell you before I write a single word of your plan, and refund every dollar.

${OUTCOME_RIDER_TEXT}

→ Start your Sprint ($297): ${SPRINT_URL}

And if you want 90 days working directly with me in a small group, that exists too. Reply with the word NINETY and I will send the details.

In two days, the last email of this series. The whole map in one place.

Joel
RN, BraveWorks

P.S. If the honest wall is money, hit reply and tell me. The $17 Starter Kit and the free week in the Weekly Reset both exist for exactly that. I read every reply and I will not pressure you.

${textFooter(unsubUrl)}
`,
};

// ─── DAY 21 — Last email: fork in the road, canon ladder recap ─────────
const day21 = {
  subject: 'A fork in the road',
  subjectB: 'The door stays open',
  preview: 'Twenty-one days of the map. Now there are two roads. Both are okay.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Twenty-one days. We've walked the whole map together, and I want to say thank you before anything else. You read. You stayed. That's a quiet kind of bravery, and it's exactly what BraveWorks is named for.`)}
    ${bigQuote('Stand with me at a fork in the road.')}
    ${p(`Here's what I've learned in twenty years of nursing: a year from now, you will be somewhere. The only question is where. There's a version of you a year out who is still cuffing her arm with that little held breath, still creeping toward the next medication, still telling herself "it's just my age." And there's another version, same woman, same genes, same kitchen, who turned down her faucets, who understands her own number, who walks into the doctor's office calm.`)}
    ${p(`Both of those women start at this exact fork, today. The thing that decides which one you become isn't talent or luck or perfect genes. It's the next small step. That's the whole secret, and it's why I have such conviction about this work: the body wants to heal. Give it the right inputs and it almost can't help itself. I have watched it happen too many times to be quiet about it.`, { margin: '0 0 28px' })}
    ${p(`So before the emails slow down, let me lay out every road on the map. Pick the one that fits where you actually are:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The whole ladder, in one place.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Just starting?</strong> <a href="${KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">The BP Starter Kit</a>, $17. The same plan I walk readers through.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Want the research behind every remedy?</strong> <a href="${COMPANION_URL}" style="color:${PALETTE.accentClay};font-weight:600;">The 10-Day Nurse's Reset Companion</a>, $12.99. The claim and the dose behind every one.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Don't want to do it alone?</strong> <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};font-weight:600;">The Weekly Reset</a>. Four live group sessions a month with me, Wednesdays at 7 pm ET. $27 a month, first 7 days free.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Is it the hormones?</strong> ${restoreHerLive()
        ? `RestoreHER Hormones is June 24 and 25 at the Galt House in Louisville, with Barbara O'Neill. Details and tickets at <a href="${RESTOREHER_URL}" style="color:${PALETTE.accentClay};font-weight:600;">restoreherhormones.com</a>.`
        : `My wife Annie, an RN and fellow naturopath, teaches that side of the work at <a href="${RESTOREHER_URL}" style="color:${PALETTE.accentClay};font-weight:600;">restoreherhormones.com</a>.`}</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Want me to write your plan?</strong> <a href="${SPRINT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">The 30-Day Personalized Sprint</a>, $297 flat. I write your 30 days from your numbers and we walk them together. I take 5 new readers a month.</p>
    `)}
    ${p(`And if you want 90 days working directly with me in a small group, reply with the word NINETY and I will send the details.`, { margin: '0 0 24px' })}
    ${p(`Not sure? Then take the smallest honest step, the $17 kit.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Start with the BP Starter Kit ($17)')}
    ${p(`<span style="color:#999;font-size:14px;">You can read the whole Starter Kit story at <a href="https://bpquiz.com" style="color:${PALETTE.accentClay};">bpquiz.com</a>.</span>`, { margin: '0 0 28px' })}
    ${p(`And if today the answer is "not yet," that is genuinely okay. There is no door closing and no countdown clock. The emails slow down from here, but <strong>the door stays open</strong>. I will be here when you are ready.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Wherever you are at the fork, hit reply and tell me one thing you are taking with you from these 21 days. I read every single one. The work is slow and the conversation is long. That is how real change is built, not in 21 days, but in the year that follows.`)}
    ${upsellFooter({
      kicker: 'The door stays open',
      body: 'No deadline, no clock. Every rung is here when you are ready. The $17 Starter Kit, the $12.99 Companion, the Weekly Reset free week, and the $297 Sprint. Take the step that fits where you are.',
      ctaLabel: 'Start with the $17 kit',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Twenty-one days. We've walked the whole map together, and thank you, before anything else. You read. You stayed. That's a quiet kind of bravery, exactly what BraveWorks is named for.

STAND WITH ME AT A FORK IN THE ROAD.

A year from now, you will be somewhere. The only question is where. One version of you is still cuffing with that held breath, creeping toward the next medication, saying "it's just my age." Another version, same woman, same genes, same kitchen, turned down her faucets, understands her number, walks into the doctor's office calm.

Both women start at this fork, today. What decides which one you become isn't talent or luck or perfect genes. It's the next small step. That's the whole secret, and why I have such conviction: the body wants to heal. Give it the right inputs and it almost can't help itself. I've watched it too many times to be quiet about it.

THE WHOLE LADDER, IN ONE PLACE. Pick the road that fits you:

Just starting? The BP Starter Kit, $17. The same plan I walk readers through.
→ ${KIT_URL}

Want the research behind every remedy? The 10-Day Nurse's Reset Companion, $12.99. The claim and the dose behind every one.
→ ${COMPANION_URL}

Don't want to do it alone? The Weekly Reset. Four live group sessions a month with me, Wednesdays at 7 pm ET. $27 a month, first 7 days free.
→ ${SKOOL_URL}

${restoreHerLive()
    ? `Is it the hormones? RestoreHER Hormones is June 24 and 25 at the Galt House in Louisville, with Barbara O'Neill. Details and tickets at restoreherhormones.com.`
    : `Is it the hormones? My wife Annie, an RN and fellow naturopath, teaches that side of the work at restoreherhormones.com.`}
→ ${RESTOREHER_URL}

Want me to write your plan? The 30-Day Personalized Sprint, $297 flat. I write your 30 days from your numbers and we walk them together. I take 5 new readers a month.
→ ${SPRINT_URL}

And if you want 90 days working directly with me in a small group, reply with the word NINETY and I will send the details.

Not sure? Then take the smallest honest step, the $17 kit.
→ ${KIT_URL}

You can read the whole Starter Kit story at bpquiz.com.

And if today the answer is "not yet," that is genuinely okay. There is no door closing and no countdown clock. The emails slow down from here, but THE DOOR STAYS OPEN. I will be here when you are ready.

Joel
RN, BraveWorks

P.S. Wherever you are at the fork, hit reply and tell me one thing you are taking with you from these 21 days. I read every single one. The work is slow and the conversation is long. That is how real change is built, not in 21 days, but in the year that follows.

${textFooter(unsubUrl)}
`,
};

// ─── Day → email map ──────────────────────────────────────────────────
export const TIER_LEAD_DAYS = {
  0: day0,
  1: day1,
  3: day3,
  5: day5,
  7: day7,
  10: day10,
  13: day13,
  16: day16,
  19: day19,
  21: day21,
};

// Idempotency flag for the cron to skip already-sent emails.
export function tierLeadSentFlag(day) {
  return `tierLeadDay${day}Sent`;
}
