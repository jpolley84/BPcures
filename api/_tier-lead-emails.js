// _tier-lead-emails.js — LEAD state sequence ($0, pre-purchase).
//
// Audience: just gave email via quiz / lead-magnet / exit-popup. State = `lead`.
// Goal: teach the BP Triangle (2 emails per corner) while climbing the full
//   offer ladder — $17 Kit → BP Cures book → $97 Challenge → RestoreHER event
//   (Virtual + Platinum VIP) → $1,997 1:1 coaching.
// Length: 10 emails over 21 days (Day 0, 1, 3, 5, 7, 10, 13, 16, 19, 21).
// 2026-05-28 rewrite: content-only swap. Day keys + tierLeadSentFlag UNCHANGED
//   so live subscribers keep their position and just receive the new copy.
// Arc: Day 0 overview · 1/3 Pipe Pressure · 5/7 Sugar Pressure · 10/13 Stress
//   Pressure (cortisol/hormones → RestoreHER) · 16/19 coaching · 21 recap.
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }
//
// Author: Joel Polley, RN, BraveWorks Health. Spec v1.0 2026-05-17.

import { youtubePrimaryCTA, skoolTiersFooter, premiumVipBodyPitch } from './_email-shared.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Active product Stripe links — only KIT_URL is pitched in lead sequence.
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

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

// 2026-05-24: YouTube-first footer + 3-tier Skool ladder.
// Now delegates to shared _email-shared.js so all 5 tier sequences stay
// aligned. Old "Two more ways to follow along" inline footer retired —
// every email now leads with the YouTube CTA + exposes Free/$9/$47 rungs.
function footerSecondaryCTAs() {
  return youtubePrimaryCTA() + skoolTiersFooter();
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
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You just told me your blood pressure is one of the things on your mind. That quiet decision to put your email in mattered. Most people scroll past. You stopped.`)}
    ${p(`I'm Joel. RN for 20 years — most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I run BraveWorks now, and the people I work with are mostly women 50 to 70, with a strong share of men in the same window — all on at least one BP medication, all tired of being told "it's just genetic."`)}
    ${p(`It's not just genetic. I'm going to show you why.`)}
    ${p(`But before the teaching, I want you to meet someone.`)}
    ${bigQuote('Picture yourself 90 days from now.')}
    ${p(`You cuff your arm in the morning and the number is lower than it was today. Not by accident — because you know exactly why. You walk into your next appointment calm, with a log in your hand, and your doctor leans in and asks, "What have you been doing?" You sleep through the night. The people who love you notice the color is back in your face.`)}
    ${p(`That woman is not a different person. She's you, with a map. Today I'm handing you the map.`, { margin: '0 0 28px' })}
    ${bigQuote('Your map: The BP Triangle Method™.')}
    ${p(`Here's the picture I want in your head. Imagine a sink that's overflowing. You can mop the floor all day — that's what a medication does, and thank God for it, it keeps the water from ruining the house. But the sink is still overflowing. Why? Because three faucets are pouring into it.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The three faucets (the Three Pressures)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Stress Pressure</strong> — cortisol. Your foot is stuck on the gas. Sleep is light, mornings are tight, the alarm goes off and your shoulders are already at your ears.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Sugar Pressure</strong> — insulin. White bread, cereal, the 3 PM cookie. This faucet spikes your numbers harder than the salt shaker ever will.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Pipe Pressure</strong> — your vessels. Less elastic. Stiff. Constricted. The pipes the water has to push through.</p>
    `)}
    ${p(`Most plans turn down one faucet and wonder why the sink still overflows. The Triangle turns down all three — and works <strong>alongside</strong> your medication and your doctor, never instead of them. Mop the floor AND turn off the faucets. That's the whole idea.`)}
    ${p(`Almost everyone has one faucet running hardest. Most have two open at once. Once you know which is loudest in you, the work narrows — and so does the worry.`, { margin: '0 0 28px' })}
    ${p(`Now, you might be thinking: <em>is this just another guru with a "secret"?</em> Fair question. So here's my honest answer — I'm not selling a secret. I'm a nurse who got tired of watching people get mopped and sent home. There's no magic pill in these emails. There's a map, a few small inputs, and proof. You decide.`)}
    ${p(`Want a head start? The 60-second quiz tells you which faucet is loudest in you right now. And if you'd rather skip ahead, the same protocol I hand patients leaving my practice is in the BP Starter Kit — eighteen pages, $17.`, { margin: '0 0 24px' })}
    ${ctaButton('https://bpquiz.com', 'Take the 60-second quiz')}
    ${p(`Here's the rhythm of the next three weeks: a short email every few days. Tomorrow — why I left the ICU. Day 3 — a tea that drops 7 systolic points in 6 weeks. Day 5 and 7 — your first faucet, the pipes. Read at your own pace. Forward to your daughter, your husband, anyone whose numbers are "creeping up."`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Hit reply and tell me which faucet feels loudest in you right now — Stress, Sugar, or Pipe. One word is enough. I read every single reply, and it helps me know what to send you next.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You just told me your blood pressure is on your mind. That quiet decision to put your email in mattered. Most people scroll past. You stopped.

I'm Joel. RN for 20 years — most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I run BraveWorks now. The people I work with are mostly women 50 to 70, with a strong share of men in the same window — all on at least one BP med, all tired of being told "it's just genetic."

It's not just genetic. I'll show you why. But first, meet someone.

PICTURE YOURSELF 90 DAYS FROM NOW.

You cuff your arm and the number is lower — and you know exactly why. You walk into your appointment calm, log in hand, and your doctor asks, "What have you been doing?" You sleep through the night. The people who love you notice the color back in your face.

That person isn't different from you. That's you, with a map. Here's the map.

YOUR MAP: THE BP TRIANGLE METHOD.

Picture a sink that's overflowing. You can mop the floor all day — that's what a medication does, and thank God for it. But the sink keeps overflowing, because THREE FAUCETS pour into it:

— Stress Pressure (cortisol). Foot stuck on the gas. Light sleep, tight mornings.
— Sugar Pressure (insulin). Bread, cereal, the 3 PM cookie — spikes numbers harder than the salt shaker.
— Pipe Pressure (vessels). Stiff, constricted pipes the water pushes through.

Most plans turn down ONE faucet. The Triangle turns down all three — alongside your medication and your doctor, never instead. Mop the floor AND turn off the faucets.

Is this just another guru with a "secret"? Fair question. No secret here. I'm a nurse who got tired of watching people get mopped and sent home. A map, a few small inputs, and proof. You decide.

Head start: the 60-second quiz tells you which faucet is loudest in you.
→ https://bpquiz.com

Rather skip ahead? The same protocol I hand patients leaving my practice is the BP Starter Kit — 18 pages, $17.

Next three weeks: a short email every few days. Tomorrow — why I left the ICU. Day 3 — the tea that drops 7 points in 6 weeks. Day 5 and 7 — the pipes.

Joel
RN, BraveWorks

P.S. Hit reply and tell me which faucet feels loudest — Stress, Sugar, or Pipe. One word is enough. I read every reply.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 1 — Pipe Pressure #1 (vascular) + ICU origin story ────────────
const day1 = {
  subject: 'A garden hose with crimped walls',
  subjectB: 'The first faucet: your pipes',
  preview: 'Why I left the ICU — and what your vessels are doing right now.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Yesterday I showed you the three faucets. Today we open the first one: <strong>Pipe Pressure</strong> — your blood vessels themselves. But first, a quick story, because it's the reason I do this work at all.`)}
    ${p(`I spent 20 years as a registered nurse. Most of it in ICU and emergency. I was the person standing over the bed when someone came in at 220 over 130 with a stroke already starting in the brainstem.`)}
    ${p(`Some of those patients came back. Some didn't. But the ones I couldn't stop thinking about weren't the ones who came in dying — those, we expected.`)}
    ${bigQuote('The ones I couldn\'t shake were the ones we discharged.')}
    ${p(`Stabilized. Handed a new prescription. Told "watch your salt and lose some weight." Walked out the door. We knew they'd be back — and most of them were, inside two years. Nobody had taught them how to use their own bodies.`)}
    ${p(`So I took five years and trained as a naturopath. I learned what nursing school doesn't teach: the herbs, the hydrotherapy, the breathing, the eight laws of health that built sanitariums before there were hospitals. And the first thing I had to relearn was what blood pressure even is.`, { margin: '0 0 28px' })}
    ${bigQuote('Picture a garden hose.')}
    ${p(`When the hose is new, the walls are soft and springy. Water flows through easy. Now picture that same hose left in the sun for ten summers — the rubber stiffens, the walls get crusty, and somewhere along the line it's crimped. To push the same water through, the pressure has to climb.`)}
    ${p(`That's Pipe Pressure. Your vessels were once soft and springy. Over the years — inflammation, low nitric oxide, stiffening walls — they crimp and harden. Your heart has to push harder to move the same blood. The number on the cuff goes up. The pill helps relax the hose a little, but it doesn't rebuild the rubber. That part is on the inputs.`)}
    ${p(`And here's the question I get most: <em>can something natural really be strong enough for a real medical number?</em>`)}
    ${p(`I understand the doubt — I trained in a hospital, I respect pharmacology. So let me be straight with you. The vessels are living tissue. They respond to what you feed them. Beets and leafy greens raise nitric oxide, the molecule that tells the hose walls to relax — it's the exact same pathway nitroglycerin uses in the ER, just gentler and steadier. Potassium pulls excess sodium out so there's less water in the line. This isn't folklore. It's the same plumbing your medication works on, approached from the other end.`)}
    ${p(`I'm not anti-medication — far from it. The work I do is <strong>AND, not INSTEAD OF</strong>. Your medication keeps you safe while we rebuild the pipes. When the inputs change, your doctor is the one who tapers. Never you, never me.`, { margin: '0 0 24px' })}
    ${p(`That woman you pictured yesterday — the one with the lower morning number? Her pipes are softer than they were. That's not a fantasy. That's biology that answers to breakfast. The full pipe protocol — the foods, the dosing, the order — is in the BP Starter Kit.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit — $17')}
    ${p(`Day 3 I'll give you the single cheapest thing you can do for your pipes this week — about three dollars at the grocery store — plus the study behind it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've ever had a discharge story like the one I described — yours, or someone you love — hit reply and tell me one line. I read every email, and they shape what I send next.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Yesterday — the three faucets. Today we open the first one: PIPE PRESSURE, your blood vessels. But first, a quick story, because it's why I do this at all.

I spent 20 years as an RN. Most of it ICU and emergency. I stood over the bed when someone came in at 220/130 with a stroke already starting.

Some came back. Some didn't. But the ones I couldn't shake weren't the dying — those, we expected.

THE ONES I COULDN'T SHAKE WERE THE ONES WE DISCHARGED.

Stabilized. New prescription. "Watch your salt, lose some weight." Out the door. We knew they'd be back. Most were, inside two years. Nobody taught them to use their own bodies.

So I took five years and trained as a naturopath. The herbs, hydrotherapy, breathing — the eight laws of health that built sanitariums before hospitals. And I had to relearn what blood pressure even is.

PICTURE A GARDEN HOSE.

New hose: soft, springy walls, water flows easy. Same hose after ten summers in the sun: stiff, crusty, crimped. To push the same water through, pressure has to climb.

That's Pipe Pressure. Your vessels were soft once. Years of inflammation, low nitric oxide, stiffening walls — they crimp and harden. Your heart pushes harder. The pill relaxes the hose a little; it doesn't rebuild the rubber. That part is on the inputs.

The question I get most: can something natural be strong enough for a real medical number?

Straight answer: the vessels are living tissue. Beets and leafy greens raise nitric oxide — the molecule that tells the walls to relax. Same pathway nitroglycerin uses in the ER, just gentler. Potassium pulls excess sodium out. Not folklore — the same plumbing your med works on, from the other end.

I'm not anti-medication. The work is AND, not INSTEAD OF. The med keeps you safe while we rebuild the pipes. Your doctor tapers — never you, never me.

The full pipe protocol — foods, dosing, order — is in the BP Starter Kit.
→ ${KIT_URL}

Day 3 — the cheapest thing you can do for your pipes this week (about $3) and the study behind it.

Joel
RN, BraveWorks

P.S. If you've ever had a discharge story like that — yours or someone you love — hit reply with one line. I read every email.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 3 — Pipe Pressure #2: the fix + proof (hibiscus) ──────────────
const day3 = {
  subject: 'Rusty pipes, clean pipes, $3 at the store',
  subjectB: '7 points lower in 6 weeks — the proof',
  preview: 'A falsifiable claim: 7.2 points, six weeks, one red box.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days ago: the crimped garden hose. Today: how you start cleaning it out — and the proof it works.`)}
    ${p(`Think of two pipes under a kitchen sink. One is old galvanized steel, rusted on the inside, the opening narrowed to half its size by years of buildup. The other is clean copper. Same water pressure at the street — but only a trickle comes out of the rusty one, while the clean one runs full. Your vessels are pipes. Rust narrows them. Cleaning them out widens the channel and the pressure drops.`)}
    ${bigQuote('The cheapest pipe-cleaner I know: hibiscus tea.')}
    ${p(`Yes — the deep red flower tea your grandmother probably drank. The red boxes: Tazo, Celestial Seasonings "Red Zinger," or any plain hibiscus or "sorrel" tea in the grocery aisle. About three dollars.`)}
    ${p(`Now — I already know what some of you are thinking, because you've told me: <em>"I've tried herbs. They didn't do a thing."</em> I believe you. Most people try a herb the way they'd take a breath mint — once, casually, no dose, no consistency, no measuring. Then they conclude "herbs don't work." That's not a fair test. So let me give you a fair one — a claim you can actually check.`)}
    ${bigQuote('Here is the falsifiable claim.')}
    ${p(`A study at Tufts University put adults with mild hypertension on three cups of hibiscus tea a day for six weeks. The hibiscus group dropped an average of <strong>7.2 mmHg off their systolic number.</strong> The placebo group dropped 1.3. That's it. No fine print. Three cups, six weeks, measure before and after.`)}
    ${p(`Seven points doesn't sound dramatic — until you know it's the gap between Stage 1 hypertension and pre-hypertension for a lot of readers, and it's the same drop most people get from losing ten pounds, which is a far harder ask.`)}
    ${p(`Why it works: hibiscus is rich in anthocyanins — the deep-red cousins of what colors blueberries blue. They help the vessel walls relax (cleaning the rust off the pipe) and gently nudge sodium out through the kidneys (less water in the line). Mild vasorelaxant, mild diuretic, no prescription.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The fair test.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Cuff your arm in the morning. Write it down. Then drink three cups of hibiscus a day — one at breakfast, one at lunch, one in the afternoon. No sugar. Six weeks. Cuff again.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Let the number be the judge, not your memory of "that time herbs didn't work."</p>
    `)}
    ${p(`A safety note: if you're on a thiazide diuretic (hydrochlorothiazide) or a potassium-sparing one (spironolactone), check with your prescriber first — hibiscus is mildly diuretic and the math may need adjusting. Your safety comes first, always.`, { margin: '0 0 24px' })}
    ${p(`Hibiscus is one pipe-cleaner. There are more — beets, garlic, hawthorn, magnesium, the contrast shower. I put the falsifiable claim and the dose behind <em>every one of them</em> in my book, <strong>BP Cures</strong>. Not opinions. The studies, the amounts, and how to stack them safely with your medication. It's $12.99 — about the price of one bottle of supplements you might've wasted on a guess.`, { margin: '0 0 24px' })}
    ${ctaButton('https://buy.stripe.com/bJe4gzeIrfme9ft3B7fnO02', 'Get BP Cures — $12.99')}
    ${p(`In two days we open the second faucet: Sugar Pressure. It's the one most people swear they don't have — and most people do.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you pick up a box of hibiscus, snap a photo at the store and reply with it. I'll cheer for you. Small wins are how big numbers move.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Two days ago: the crimped garden hose. Today: how you start cleaning it out — and the proof.

Picture two pipes under a sink. One is old galvanized steel, rusted inside, the opening narrowed to half its size. The other is clean copper. Same water pressure at the street — but only a trickle comes out of the rusty one. Your vessels are pipes. Cleaning out the rust widens the channel and the pressure drops.

THE CHEAPEST PIPE-CLEANER I KNOW: HIBISCUS TEA.

The deep red flower tea. Red boxes — Tazo, Celestial Seasonings "Red Zinger," any "sorrel" tea. About $3.

I know what some of you are thinking: "I've tried herbs, nothing worked." I believe you. But most people try a herb like a breath mint — once, no dose, no measuring — then quit. That's not a fair test. Here's a fair one.

THE FALSIFIABLE CLAIM:

Tufts University study. Adults with mild hypertension. Three cups of hibiscus a day, six weeks. Hibiscus group: 7.2 mmHg off systolic. Placebo: 1.3. No fine print.

Seven points is the gap between Stage 1 and pre-hypertension for many — same drop as losing ten pounds, a far harder ask.

Why: anthocyanins (the red cousins of what colors blueberries) relax the vessel walls and nudge sodium out through the kidneys. Mild vasorelaxant, mild diuretic, no prescription.

THE FAIR TEST: Cuff in the morning, write it down. Three cups a day, no sugar, six weeks. Cuff again. Let the number judge — not your memory of "that time herbs didn't work."

Safety: on a thiazide (HCTZ) or potassium-sparing (spironolactone) diuretic? Check with your prescriber first — hibiscus is mildly diuretic.

Hibiscus is one pipe-cleaner. There are more — beets, garlic, hawthorn, magnesium, the contrast shower. The falsifiable claim and dose behind EVERY one is in my book, BP CURES. Not opinions — the studies, the amounts, how to stack them safely with your med. $12.99.
→ https://buy.stripe.com/bJe4gzeIrfme9ft3B7fnO02

In two days: the second faucet, Sugar Pressure. The one most swear they don't have — and most do.

Joel
RN, BraveWorks

P.S. Pick up a box? Snap a photo at the store and reply. I'll cheer for you. Small wins are how big numbers move.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 5 — Sugar Pressure #1 (insulin): the hidden driver ────────────
const day5 = {
  subject: 'The faucet you swear you don\'t have',
  subjectB: 'Syrup doesn\'t move like water',
  preview: 'You don\'t need to be diabetic for sugar to push your number up.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`We've spent four days on the pipes. Today we open the second faucet — and it's the one almost everyone tells me they don't have.`)}
    ${bigQuote('Sugar Pressure. Insulin.')}
    ${p(`Let me name the problem precisely, because most people get it wrong. This isn't about diabetes. It isn't even mainly about your blood sugar. It's about <strong>insulin</strong> — the hormone your body releases every time you eat, especially bread, cereal, crackers, juice, and the 3 PM cookie.`)}
    ${p(`Here's the picture. Go back to your garden hose. Run clean water through it — flows easy, low pressure. Now run warm pancake syrup through that same hose. Thicker. Stickier. It drags against the walls. The pressure to push it through climbs, even though nothing about the hose changed.`)}
    ${p(`That's what chronically high insulin does. It does three things, and all three push the cuff up:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What insulin does to the line</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>It tells your kidneys to hold salt.</strong> More salt held = more water in the line = more pressure. (This is why salt gets blamed — but insulin is often the hand on the valve.)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>It thickens and stiffens the walls.</strong> High insulin makes vessel walls less springy — the syrup starts to coat the pipe.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>It revs the stress nerves.</strong> Insulin nudges the same "alert" system as cortisol, tightening the vessels further.</p>
    `)}
    ${p(`Now the objection I hear most: <em>"But Joel, my sugar's fine. My doctor never said I'm diabetic."</em>`)}
    ${p(`Here's the part nobody told you. Your fasting glucose can read perfectly normal for ten or fifteen years while your insulin is quietly running high the entire time. Glucose is the last domino to fall. By the time sugar shows up on a standard test, the syrup has been thickening your line for a decade. So "my sugar's fine" and "I have Sugar Pressure" can both be true at once. You don't have to be diabetic. You just have to have eaten like a normal American for thirty years.`)}
    ${p(`How would you know? A few honest tells: a softening middle that diet doesn't touch, afternoon cravings you can set a clock by, the 3 o'clock energy crash, skin tags, or numbers that read worst in the evening. None of those require a diagnosis. They're the syrup talking.`, { margin: '0 0 28px' })}
    ${p(`Here's the hopeful part: insulin responds <em>fast</em>. Of the three faucets, this is the one that can move your numbers in days, not weeks — because you turn it down at the very next meal. Swap the white toast. Walk ten minutes after you eat. Front-load protein and fiber before the starch. The syrup thins back toward water.`)}
    ${p(`In two days I'll show you exactly that, through Linda — 148/94 down to 128/82 in eleven days, no new medication. Today, just sit with this: the faucet you were sure you didn't have may be the loudest one in the room.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Quick gut check — do you crave something starchy or sweet around 3 PM most days? Hit reply with just "yes" or "no." It's the single fastest tell for Sugar Pressure, and I read every reply.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Four days on the pipes. Today, the second faucet — the one almost everyone swears they don't have.

SUGAR PRESSURE. INSULIN.

Let me name it precisely: this isn't about diabetes. It isn't even mainly about blood sugar. It's about INSULIN — the hormone you release every time you eat, especially bread, cereal, crackers, juice, the 3 PM cookie.

Back to the garden hose. Run clean water through — flows easy, low pressure. Now run warm pancake syrup through the same hose. Thicker, stickier, drags on the walls. Pressure climbs, though the hose never changed.

That's chronically high insulin. Three things, all push the cuff up:

— It tells your kidneys to HOLD SALT. More salt held = more water in the line = more pressure. (Salt gets blamed; insulin's often the hand on the valve.)
— It STIFFENS the walls. Less springy — syrup coating the pipe.
— It REVS the stress nerves, tightening vessels further.

The objection I hear most: "But my sugar's fine, I'm not diabetic."

Here's what nobody told you: your fasting glucose can read normal for 10-15 years while your insulin runs high the whole time. Glucose is the LAST domino. By the time sugar shows on a standard test, the syrup's been thickening your line for a decade. "My sugar's fine" and "I have Sugar Pressure" can both be true. You don't have to be diabetic — just have eaten like a normal American for thirty years.

Honest tells: a softening middle diet won't touch, afternoon cravings you can set a clock by, the 3 PM crash, skin tags, numbers worst in the evening. No diagnosis required. That's the syrup talking.

The hopeful part: insulin responds FAST — days, not weeks — because you turn it down at the next meal. Swap the white toast. Walk ten minutes after eating. Protein and fiber before the starch. The syrup thins back toward water.

In two days — Linda. 148/94 to 128/82 in eleven days, no new med. Today, just sit with this: the faucet you were sure you didn't have may be the loudest in the room.

Joel
RN, BraveWorks

P.S. Gut check — crave something starchy or sweet around 3 PM most days? Reply "yes" or "no." Fastest tell for Sugar Pressure. I read every reply.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — Sugar Pressure #2: the swing + Linda case study ───────────
const day7 = {
  subject: 'Linda: 148/94 → 128/82 in 11 days',
  subjectB: 'Get off the blood-sugar rollercoaster',
  preview: 'Twenty points, eleven days, no new medication.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days ago I told you about the syrup in the line. Today I want you to feel the second half of Sugar Pressure — the <em>swing</em> — and then meet a woman who got off it.`)}
    ${bigQuote('The blood-sugar rollercoaster.')}
    ${p(`Eat white toast and jam. Your blood sugar shoots up like the first climb of a rollercoaster. Insulin floods in to drag it back down — and overshoots, so an hour later you crash into a valley, shaky and craving the next carb. Up the hill, down the drop, again and again, all day. Every climb spikes your pressure. Every crash sends you reaching for the thing that spikes it again.`)}
    ${p(`Most people ride that rollercoaster their whole adult life and call it "normal energy." Getting off it is one of the fastest ways to drop a number. Linda proved it.`, { margin: '0 0 28px' })}
    ${p(`Linda is 62. (Not her real name — I protect everyone in these stories. The numbers are real.) Retired schoolteacher, married 38 years, reads the label on everything, and still couldn't figure out why her numbers kept climbing.`)}
    ${bigQuote('Before.')}
    ${p(`Home reading: <strong>148/94.</strong> On lisinopril 20mg for four years, amlodipine 5mg added two years ago, and at her last visit the cardiologist floated a third medication.`)}
    ${p(`Pipe Pressure was loud for her, but Sugar was the runner-up nobody had flagged — the afternoon crashes, the softening middle. So she worked both faucets at once. Here's exactly what she did:`, { margin: '0 0 18px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Linda's first 11 days.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Pipes:</strong> Hibiscus tea, three cups a day. Garlic — one fresh clove crushed, rested 10 minutes, added at the end of cooking. A walk after dinner. End-of-day contrast shower, 30 seconds cold to finish.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Sugar (the rollercoaster brakes):</strong> Swapped store-bought sandwich bread for a homemade alternative her granddaughter helped her bake. Ate protein and fiber <em>before</em> any starch. Walked ten minutes after lunch to burn the glucose before it spiked. The 3 PM cookie became an apple with peanut butter.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Every day:</strong> Cuffed each morning, same time, sitting, both feet flat, no coffee yet. Wrote the number down.</p>
    `)}
    ${bigQuote('After.')}
    ${p(`Eleven days in, her morning reading was <strong>128/82.</strong> Twenty systolic points. Twelve diastolic. Same medications, same doses, no new prescription. At her follow-up the cardiologist looked at the log, looked at her, and asked one question: <em>"What did you do?"</em> He didn't add the third drug. He told her to keep going and come back in 90 days.`, { margin: '0 0 28px' })}
    ${p(`Now — here's the objection that stops most people from ever starting. Not "will it work." It's quieter than that. It's: <em>"I can't do this alone."</em>`)}
    ${p(`And you're right. You shouldn't have to. Linda didn't — she had me, and she had a granddaughter in the kitchen. Reading a PDF by yourself at 9 PM, then forgetting it by Thursday, is how every good intention dies. What actually moves numbers is structure, a start date, and people doing it alongside you.`)}
    ${p(`That's exactly why I built the <strong>BP Triangle Challenge</strong>, and it's the smartest thing on my whole shelf for $97.`, { margin: '0 0 24px' })}
    ${clayBlock(
      'The BP Triangle Challenge — $97',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">A guided run through all three faucets with a real start date and a group going through it with you. Here's why it's the smart buy:</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">→ <strong>All three of my books included</strong> — BP Cures, plus the Cook For Life cookbook and the Overmedicated Boomers guide.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">→ <strong>Community + accountability</strong> — a group, daily prompts, and people cheering your numbers down.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Buy the three books separately and you're already past $97 — before the group ever starts. This is the bundle that does the math in your favor.</p>`
    )}
    ${ctaButton('https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H', 'Join the BP Triangle Challenge — $97')}
    ${p(`Next week we open the third and quietest faucet — Stress Pressure — and I'll introduce you to something special happening in June. Today, sit with this: 20 points in 11 days, and she didn't do it alone.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your number is anywhere near Linda's starting point and you've been told "this is as good as it gets," hit reply and tell me what your number is today. I won't pitch you in the reply — I just want to know who's reading.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Two days ago — the syrup in the line. Today, the second half of Sugar Pressure: the SWING. Then a woman who got off it.

THE BLOOD-SUGAR ROLLERCOASTER.

White toast and jam — sugar shoots up like the first climb. Insulin floods in, overshoots, and an hour later you crash into a valley, shaky, craving the next carb. Up the hill, down the drop, all day. Every climb spikes your pressure. Every crash sends you reaching for the thing that spikes it again.

Most people ride it their whole life and call it "normal energy." Getting off is one of the fastest ways to drop a number. Linda proved it.

Linda is 62. (Not her real name. Numbers are real.) Retired teacher, married 38 years, reads every label, still couldn't figure out why her numbers climbed.

BEFORE: 148/94. Lisinopril 20mg four years, amlodipine 5mg two years, cardiologist floating a third.

Pipe Pressure was loud; Sugar was the runner-up nobody flagged. She worked both:

PIPES — Hibiscus, 3 cups/day. Garlic (fresh clove crushed, rested, added late). Walk after dinner. Contrast shower, 30 sec cold to finish.

SUGAR (the brakes) — Swapped store bread for homemade. Protein and fiber BEFORE starch. Ten-minute walk after lunch. The 3 PM cookie became apple + peanut butter.

EVERY DAY — Cuffed each morning, same time, sitting, feet flat, no coffee yet. Wrote it down.

AFTER: Day 11, morning reading 128/82. Twenty systolic, twelve diastolic. Same meds, same doses. Cardiologist asked, "What did you do?" Didn't add the third drug. Told her to keep going.

The objection that stops most people isn't "will it work." It's quieter: "I can't do this alone."

You're right. You shouldn't have to. Reading a PDF alone at 9 PM, forgotten by Thursday, is how good intentions die. What moves numbers is structure, a start date, and people doing it with you.

That's why I built the BP TRIANGLE CHALLENGE — $97, the smartest thing on my shelf:
— ALL THREE of my books included (BP Cures, Cook For Life, Overmedicated Boomers)
— Community + accountability — a group cheering your numbers down

Buy the three books separately and you're already past $97 — before the group ever starts.
→ https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H

Next week — the third, quietest faucet: Stress Pressure. Today: 20 points in 11 days, and she didn't do it alone.

Joel
RN, BraveWorks

P.S. If your number is near Linda's start, hit reply and tell me yours. I won't pitch you in the reply — I just want to know who's reading.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 10 — Stress Pressure #1 (cortisol) + RestoreHER Virtual Pass ──
const day10 = {
  subject: 'Your foot is stuck on the gas',
  subjectB: 'The silent faucet nobody measures',
  preview: 'The third Pressure runs even while you sleep — here\'s how to ease off.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`We've turned down the pipes. We've thinned the syrup. Today we reach the third faucet — the quiet one, the one almost no cardiologist measures: <strong>Stress Pressure</strong>. Cortisol.`)}
    ${bigQuote('Imagine your foot stuck on the gas pedal.')}
    ${p(`Engine revving in the driveway. You're not going anywhere, but the motor is roaring, burning fuel, wearing itself down. That's your body under chronic cortisol. Your nervous system is flooring the accelerator — heart faster, vessels tighter — bracing for a threat that never actually comes. And it does this all day, even while you sleep.`)}
    ${p(`That's why this faucet is so sneaky. Pipe and Sugar Pressure you can sometimes feel. Stress Pressure runs in the background. The tells: you wake between 2 and 4 AM and can't drop back off. Mornings are "wired but tired." Coffee feels mandatory. Weight settles around the middle. And — the giveaway — your readings are always highest at the doctor's office. That's not white-coat nerves being silly. That's your foot mashing the pedal on cue.`, { margin: '0 0 28px' })}
    ${p(`Now the belief I have to gently dismantle, because it stops almost everyone: <em>"Stress is just life at my age. I can't fix that."</em>`)}
    ${p(`I hear you. You can't fire your family, undo a loss, or add hours to the day. But here's the bridge I want you to walk across: you are not trying to remove stress. You are trying to take your foot off the gas — to teach the nervous system it's allowed to idle. Those are completely different jobs. You don't need a calmer life. You need a body that stops revving when the driveway is empty.`)}
    ${p(`And that part is absolutely trainable. Five minutes of morning sunlight resets the cortisol curve so it peaks in the morning instead of at 2 AM. A slow 4-7-8 breath drops cortisol faster than any supplement I've measured. Magnesium glycinate at night lifts the foot off the pedal while you sleep. None of that requires your life to get easier. It just requires the gas pedal to come up.`, { margin: '0 0 28px' })}
    ${p(`Here's why this faucet matters so much for the women I serve — and why I want to invite you to something.`)}
    ${p(`Especially for women in perimenopause and after — but really for anyone in their second half of life — Stress Pressure and hormones are tangled together in a way no one explains. So this June, I'm part of an event built entirely around it.`, { margin: '0 0 24px' })}
    ${clayBlock(
      'RestoreHER Hormones · June 24–25',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">A two-day virtual event on the hormone–blood-pressure connection. <strong>Barbara O'Neill is keynoting.</strong> My wife <strong>Annie (RN, fellow naturopath)</strong> is teaching the hormone side. And I'll be there walking through the Stress Pressure faucet in depth.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">You can be in the (virtual) room from your own kitchen table. The <strong>Virtual Pass is $247</strong> — two full days of teaching you won't find anywhere else, watchable live or on replay.</p>`
    )}
    ${ctaButton('https://buy.stripe.com/6oU8wPcAjgqi77l8VrfnO0U', 'Get your RestoreHER Virtual Pass — $247')}
    ${p(`In three days I'll tell you the part of the cortisol story that's specifically about menopause — and why so many women find their numbers started revving harder right around the time their hormones shifted. It's the email I wish someone had handed my own patients twenty years ago.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Do you wake between 2 and 4 AM, mind racing, unable to drop back off? Hit reply with one word: "yes." That single symptom tells me your Stress faucet is wide open — and it's one of the most fixable things I teach.`)}
    ${upsellFooter({
      kicker: 'June 24–25, from your kitchen',
      body: 'RestoreHER Hormones — Barbara O\'Neill keynoting, my wife Annie (RN) teaching the hormone side, and me on the Stress Pressure faucet. Two days, live or replay. Virtual Pass $247.',
      ctaLabel: 'Get the Virtual Pass',
      ctaUrl: 'https://buy.stripe.com/6oU8wPcAjgqi77l8VrfnO0U',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

We turned down the pipes. We thinned the syrup. Today, the third faucet — the quiet one almost no cardiologist measures: STRESS PRESSURE. Cortisol.

IMAGINE YOUR FOOT STUCK ON THE GAS PEDAL.

Engine revving in the driveway. You're going nowhere, but the motor's roaring, burning fuel, wearing down. That's chronic cortisol — your nervous system flooring it, heart faster, vessels tighter, bracing for a threat that never comes. All day. Even while you sleep.

That's why it's sneaky. Pipe and Sugar you can sometimes feel. Stress runs in the background. Tells: waking 2-4 AM and can't drop off, "wired but tired" mornings, mandatory coffee, weight around the middle, and readings always highest at the doctor's office. That's not silly nerves — that's your foot mashing the pedal on cue.

The belief that stops everyone: "Stress is just life at my age. I can't fix that."

I hear you. You can't fire your family or add hours to the day. But here's the bridge: you're not removing stress — you're taking your foot OFF the gas, teaching the nervous system it's allowed to idle. Different jobs. You don't need a calmer life. You need a body that stops revving when the driveway is empty.

And that's trainable: 5 minutes of morning sunlight resets the cortisol curve. A slow 4-7-8 breath drops cortisol faster than any supplement I've measured. Magnesium glycinate at night lifts the foot off the pedal while you sleep. None of it needs your life to get easier.

Especially for women in perimenopause and after — but really for anyone in their second half of life — Stress Pressure and hormones are tangled in a way no one explains. So this June, I'm part of an event built around it.

RESTOREHER HORMONES · JUNE 24-25
A two-day virtual event on the hormone-BP connection. Barbara O'Neill keynoting. My wife ANNIE (RN, fellow naturopath) teaching the hormone side. Me on the Stress faucet in depth. Be in the (virtual) room from your kitchen table.
Virtual Pass $247 — live or replay.
→ https://buy.stripe.com/6oU8wPcAjgqi77l8VrfnO0U

In three days — the menopause half of the cortisol story, and why your body started revving harder right when your hormones shifted.

Joel
RN, BraveWorks

P.S. Wake between 2 and 4 AM, mind racing, can't drop back off? Reply "yes." That one symptom tells me your Stress faucet is wide open — and it's one of the most fixable things I teach.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 13 — Stress Pressure #2: hormones + menopause link ────────────
const day13 = {
  subject: 'The dimmer switch nobody told you about',
  subjectB: 'Why your BP shifted right around menopause',
  preview: 'Estrogen held the dimmer on cortisol. It\'s fading. Here\'s the fix.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three days ago I showed you the foot stuck on the gas pedal. Today I have to tell you the part of the story that's specifically about being a woman in your second half of life — because it changes everything about how you read your own numbers.`)}
    ${p(`Think back. So many women tell me the same thing: <em>"My pressure was fine my whole life. Then somewhere around 50, it just... started creeping up."</em> They assume it's age. It's not really age. It's a switch that quietly turned off.`)}
    ${bigQuote('Estrogen was the dimmer switch on your cortisol.')}
    ${p(`For decades, estrogen sat on the wall of your body like a dimmer switch — keeping cortisol turned <em>down</em>, keeping your vessels soft and relaxed, keeping that gas pedal from sticking. You never noticed it working, the same way you don't notice a dimmer holding the lights at a gentle glow. It just quietly did its job for thirty years.`)}
    ${p(`Then perimenopause and menopause arrive, and that dimmer switch fades. The hand that held cortisol down lifts off. Now the same daily stress that used to roll right past you sends the lights to full blast. Your vessels lose some of their give. The gas pedal sticks more easily. Your morning number climbs — and you blame "getting older."`)}
    ${p(`This is exactly why a plan written for a 45-year-old man, or the generic advice on the pamphlet, so often fails the woman it was never designed for. Your Stress Pressure has a hormonal hand on it that his doesn't.`, { margin: '0 0 28px' })}
    ${p(`So let me speak to the belief underneath it all — the one I hear most from women your age: <em>"It's just my age. It's genetics. This is what happens."</em>`)}
    ${p(`Here's the truth I want you to hold onto. Your genes loaded the gun, but your inputs pull the trigger — and a fading dimmer switch is not a life sentence, it's a <strong>known, addressable shift</strong>. We can support what estrogen used to do: with the breathing, the sunlight, the magnesium, the right plant foods, and the hormone-aware protocols that actual practitioners — not pamphlets — use. "It's just my age" is the sentence that keeps a woman stuck on the gas pedal for the rest of her life. I refuse to let that be your story.`, { margin: '0 0 28px' })}
    ${p(`And this is the heart of why I want you in the room this June.`)}
    ${p(`The Virtual Pass I mentioned is wonderful — two days of teaching from your kitchen table. But there is something different that happens when you are physically <em>in the room</em> with Barbara O'Neill, learning the hormone side of this in person, asking your own question out loud, and turning to the woman beside you who is walking the exact same road.`, { margin: '0 0 24px' })}
    ${clayBlock(
      'RestoreHER Platinum — For Two — $1,497',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">The live, in-the-room experience of RestoreHER on June 24–25 — for <strong>you and one other woman</strong>. Bring your daughter. Bring your sister. Bring the friend whose dimmer switch is fading right alongside yours.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Picture the version of you who didn't do this alone — who learned the hormone-BP connection shoulder to shoulder with someone she loves, and came home with a partner in the work instead of a PDF. That's what Platinum For Two is. $1,497 for both seats.</p>`
    )}
    ${ctaButton('https://buy.stripe.com/9B67sLdEngqigHV9ZvfnO0K', 'RestoreHER Platinum For Two — $1,497')}
    ${p(`In three days the emails turn a corner. I'm going to talk about the one faucet you genuinely cannot turn all the way down by yourself — and what to do about it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Did your numbers start creeping up somewhere around 48 to 55? Hit reply and tell me roughly when it began. That timing is one of the clearest signs the dimmer switch — not "old age" — is what's driving your number.`)}
    ${upsellFooter({
      kicker: 'Be in the room — bring someone',
      body: 'RestoreHER Platinum For Two — the live June 24-25 experience with Barbara O\'Neill, for you and your daughter, sister, or friend. Learn the hormone-BP connection together. $1,497 for both seats.',
      ctaLabel: 'Get Platinum For Two',
      ctaUrl: 'https://buy.stripe.com/9B67sLdEngqigHV9ZvfnO0K',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Three days ago — the foot stuck on the gas. Today, the part of the story that's specifically about being a woman in your second half of life.

So many women tell me the same thing: "My pressure was fine my whole life. Then around 50, it just started creeping up." They assume it's age. It's not really age. It's a switch that quietly turned off.

ESTROGEN WAS THE DIMMER SWITCH ON YOUR CORTISOL.

For decades, estrogen sat on the wall like a dimmer — keeping cortisol turned DOWN, vessels soft, the gas pedal from sticking. You never noticed it working, like you don't notice a dimmer holding the lights at a gentle glow. It just did its job for thirty years.

Then perimenopause and menopause arrive, and the dimmer fades. The hand holding cortisol down lifts off. The same daily stress that rolled past you now sends the lights to full blast. Vessels lose their give. The pedal sticks. Your morning number climbs — and you blame "getting older."

That's why a plan written for a 45-year-old man so often fails the woman it was never designed for. Your Stress Pressure has a hormonal hand on it that his doesn't.

The belief I hear most: "It's just my age. It's genetics. This is what happens."

The truth: your genes loaded the gun, your inputs pull the trigger — and a fading dimmer switch isn't a life sentence, it's a known, addressable shift. We can support what estrogen used to do: the breathing, sunlight, magnesium, the right plant foods, hormone-aware protocols that real practitioners use. "It's just my age" is the sentence that keeps a woman stuck on the gas pedal forever. I won't let that be your story.

This is why I want you IN THE ROOM this June. The Virtual Pass is wonderful. But something different happens when you're physically there with Barbara O'Neill, asking your own question out loud, turning to the woman beside you on the same road.

RESTOREHER PLATINUM — FOR TWO — $1,497
The live, in-the-room experience June 24-25, for YOU AND ONE OTHER WOMAN. Bring your daughter, your sister, the friend whose dimmer switch is fading too. Come home with a partner in the work instead of a PDF. $1,497 for both seats.
→ https://buy.stripe.com/9B67sLdEngqigHV9ZvfnO0K

In three days the emails turn a corner — the one faucet you genuinely can't turn all the way down by yourself.

Joel
RN, BraveWorks

P.S. Did your numbers start creeping up around 48 to 55? Reply and tell me roughly when. That timing is one of the clearest signs the dimmer switch — not "old age" — is driving your number.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 16 — Coaching #1: the corner you can't fix alone (1:1 $1,997) ─
const day16 = {
  subject: 'Driving blind vs. driving with GPS',
  subjectB: 'The corner you can\'t fix alone',
  preview: 'Two slots left. 90 days, one-on-one, with me.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Over sixteen days you've learned the whole map. The pipes. The syrup. The gas pedal. The dimmer switch. You could turn down all three faucets starting tomorrow, and many of you will.`)}
    ${p(`But I'd be a poor nurse if I didn't tell you the honest truth about the fourth corner — the one that isn't a faucet at all.`)}
    ${bigQuote('Some roads you shouldn\'t drive blind.')}
    ${p(`Picture two people driving to the same unfamiliar address across a big city. One has GPS — a voice that says "turn here," that reroutes the second she takes a wrong exit, that knows the road closures before she hits them. The other has a printed page of directions from ten years ago and her own best guess.`)}
    ${p(`They might both arrive. But you already know who white-knuckles it, who doubles back, who gives up and goes home. The map was never the problem. The map is the same for both of them. The difference is one of them had a voice in the car.`)}
    ${p(`That's the corner you can't fully fix alone — not because you're weak, but because you can't read your own blind spot. When your number jumps 12 points one morning, is it the new medication, the salt in last night's restaurant meal, a bad night's sleep, or the dimmer switch? A book can't answer that. A group can't answer that. Only a practitioner looking at <em>your</em> log, <em>your</em> meds, <em>your</em> body, in real time, can.`, { margin: '0 0 28px' })}
    ${p(`So today I'm opening the door to the closest thing I offer to a voice in your car.`, { margin: '0 0 24px' })}
    ${clayBlock(
      '1:1 Coaching with Joel — 90 days — $1,997',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Ninety days, working directly with me. A <strong>weekly one-on-one</strong> where we read your numbers together, adjust your protocol to your body, and prepare you for every doctor's appointment so you walk in informed instead of nervous. AND, never instead of — I work alongside your physician, every step.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">This is the GPS. I'm the voice in the car for ninety days. <strong>I take only a handful of people, and there are 2 slots left.</strong></p>`
    )}
    ${p(`Now the belief I have to meet head-on, because I felt it once too: <em>"Coaching isn't worth that. I should be able to figure this out myself."</em>`)}
    ${p(`Let me put it on a scale. On one side: $1,997, once. On the other side: ninety days of weekly one-on-one access to a nurse of 20 years who has walked hundreds of women down this exact road — plus the years you'd otherwise spend guessing, the wrong turns, the mornings you almost quit, and the slow creep toward a third medication you didn't have to be on. When you weigh what you actually get against what staying stuck actually costs, "not worth it" stops being the honest answer. The dream outcome — a lower number you understand and control — divided by the effort and doubt it takes you alone? A voice in the car changes that math entirely.`, { margin: '0 0 24px' })}
    ${p(`If you'd rather just talk first, that's completely fine — I keep a few free 30-minute discovery calls open so you can hear my voice, ask your questions, and decide with zero pressure.`, { margin: '0 0 24px' })}
    ${ctaButton('https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M', 'Claim a coaching slot — $1,997')}
    ${p(`<span style="color:#999;font-size:14px;">Prefer to talk first? Book a free 30-minute discovery call: <a href="https://calendly.com/braveworksrn/60min" style="color:${PALETTE.accentClay};">calendly.com/braveworksrn/60min</a></span>`, { margin: '0 0 28px' })}
    ${p(`In three days I'll show you the plain math of staying stuck — and I have to be straight with you about what happens to those two slots, and to the price, once they fill.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Not sure coaching is for you? Hit reply with the one thing about your numbers you most wish someone could just look at and explain. If it's the kind of thing a voice in the car solves, I'll tell you honestly — and if it isn't, I'll tell you that too.`)}
    ${upsellFooter({
      kicker: 'A voice in the car — 2 slots left',
      body: '90 days of weekly 1:1 coaching with Joel — your numbers, your protocol, your appointments, read in real time. $1,997. Or book a free 30-minute discovery call first.',
      ctaLabel: 'Claim a coaching slot',
      ctaUrl: 'https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Sixteen days, and you've learned the whole map. The pipes. The syrup. The gas pedal. The dimmer switch. You could turn down all three faucets tomorrow, and many of you will.

But I'd be a poor nurse if I didn't tell you the truth about the fourth corner — the one that isn't a faucet.

SOME ROADS YOU SHOULDN'T DRIVE BLIND.

Two people drive to the same unfamiliar address across a big city. One has GPS — a voice saying "turn here," rerouting after a wrong exit, knowing the closures ahead. The other has a printed page from ten years ago and her best guess.

They might both arrive. But you know who white-knuckles it, doubles back, gives up. The map was never the problem — it's the same for both. The difference is a voice in the car.

That's the corner you can't fully fix alone — not because you're weak, but because you can't read your own blind spot. When your number jumps 12 points one morning, is it the new med, the restaurant salt, a bad night's sleep, or the dimmer switch? A book can't answer that. A group can't. Only a practitioner looking at YOUR log, YOUR meds, YOUR body, in real time.

So today I'm opening the closest thing I offer to a voice in your car.

1:1 COACHING WITH JOEL — 90 DAYS — $1,997
Ninety days working directly with me. A WEEKLY one-on-one — we read your numbers together, adjust your protocol to your body, prep you for every appointment so you walk in informed, not nervous. AND, never instead of — alongside your physician, every step.
This is the GPS. I take only a handful of people. 2 SLOTS LEFT.

The belief I have to meet: "Coaching isn't worth that. I should figure this out myself."

On one side of the scale: $1,997, once. On the other: 90 days of weekly 1:1 access to a 20-year nurse who's walked hundreds of women down this exact road — plus the years you'd spend guessing, the wrong turns, the slow creep toward a third med you didn't have to be on. Weigh what you GET against what staying stuck COSTS, and "not worth it" stops being honest.

Rather talk first? I keep a few free 30-minute discovery calls open. Zero pressure.

→ Claim a slot: https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M
→ Free discovery call: https://calendly.com/braveworksrn/60min

In three days — the plain math of staying stuck, and what happens to those two slots and the price once they fill.

Joel
RN, BraveWorks

P.S. Not sure coaching's for you? Reply with the one thing about your numbers you most wish someone could just look at and explain. If a voice in the car solves it, I'll tell you honestly — and if it doesn't, I'll tell you that too.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 19 — Coaching #2: math of staying stuck + price rises ─────────
const day19 = {
  subject: 'The bill you\'re already paying',
  subjectB: 'Two slots, then the price goes to $2,997',
  preview: 'The one-time cost of fixing it vs. the monthly cost of staying stuck.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three days ago I opened two coaching slots and told you I'd be straight with you about the math. Today I'm keeping that promise — because I think you're doing the wrong arithmetic, and it's costing you more than you realize.`)}
    ${p(`When I say "1:1 coaching, $1,997," the mind hears one big number and flinches. But that number isn't being compared to nothing. It's being compared to the bill you are <em>already paying</em> — month after month, quietly, without ever getting a receipt.`)}
    ${bigQuote('Add up what staying stuck actually costs.')}
    ${p(`Let's do it honestly, on the back of a napkin:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The bill for staying stuck.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ Medication co-pays — every month, often more than one, often for years, frequently climbing as a third drug gets added.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ The appointments, the labs, the specialist visits — each with its own co-pay and its own half-day of your life.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ One ER visit or one cardiac scare — which can cost more by itself than a year of coaching, before you count the fear.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">→ And the part with no dollar sign: the 2 AM worry, the held breath at every cuff reading, the son or daughter who's quietly scared for you.</p>
    `)}
    ${p(`That bill runs every single month, on autopay, for the rest of your life — unless something changes the inputs. Coaching is a <strong>one-time cost</strong> aimed at changing those inputs so the monthly bill starts shrinking. One number, paid once, against a meter that never stops running. That's the real comparison.`, { margin: '0 0 28px' })}
    ${p(`So let me speak gently to the honest version of the objection — not "is it worth it," but <em>"I can't afford it."</em>`)}
    ${p(`I hear that, and I respect it. So two things. First, the truth underneath it: you're already affording the more expensive option — the monthly meter — you just can't see the total because it never arrives as one bill. Second, and this matters: <strong>you don't have to put yourself last to do this.</strong> Every woman I've ever coached spent years putting her own health at the bottom of the list, behind everyone else's needs. Choosing the voice in the car isn't selfish. It's the first time in a long while you put your own name on the list. And if the full amount is the hurdle, there's a <strong>3-payment plan at $697/month</strong> — so the door isn't bolted shut by a single number.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Two slots left — then it\'s $2,997',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">I have to be honest about this, because it's simply true: there are <strong>2 coaching slots</strong> at the current $1,997. When they fill — and at this pace that's soon — the next person pays <strong>$2,997</strong>. Not a gimmick. I take only a handful of people, weekly 1:1 time is finite, and the price reflects the scarcity.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If coaching is in your future at all, the cheapest day to start is today.</p>`
    )}
    ${ctaButton('https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M', 'Claim a slot at $1,997 (pay in full)')}
    ${p(`<span style="color:#999;font-size:14px;">Prefer to spread it out? <a href="https://buy.stripe.com/6oU3cv2ZJ5LEgHV6NjfnO0N" style="color:${PALETTE.accentClay};">3 payments of $697/month</a>. Or talk first on a free 30-minute call: <a href="https://calendly.com/braveworksrn/60min" style="color:${PALETTE.accentClay};">calendly.com/braveworksrn/60min</a></span>`, { margin: '0 0 28px' })}
    ${p(`In two days I send the last email in this series. No pitch in it, I promise — just a fork in the road, and an open door. After that, the rhythm of these emails slows for good.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If "I can't afford it" is the real wall, hit reply and tell me honestly. Sometimes it's the payment plan that solves it; sometimes it's just naming the fear out loud. Either way, I read every reply and I won't pressure you.`)}
    ${upsellFooter({
      kicker: 'Cheapest day to start is today',
      body: '1:1 coaching with Joel — 90 days, weekly. $1,997 now, $2,997 once the last 2 slots fill. A 3-payment plan ($697/mo) exists, and you can book a free 30-minute call first.',
      ctaLabel: 'Claim a coaching slot',
      ctaUrl: 'https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Three days ago I opened two coaching slots and promised to be straight about the math. I think you're doing the wrong arithmetic, and it's costing you.

When I say "1:1 coaching, $1,997," the mind hears one big number and flinches. But that number isn't compared to nothing. It's compared to the bill you're ALREADY paying — month after month, quietly, no receipt.

ADD UP WHAT STAYING STUCK ACTUALLY COSTS.

On the napkin:
→ Medication co-pays — every month, often more than one, for years, climbing as a third drug gets added.
→ Appointments, labs, specialist visits — each its own co-pay, its own half-day.
→ One ER visit or cardiac scare — can cost more by itself than a year of coaching, before the fear.
→ No dollar sign: the 2 AM worry, the held breath at every reading, the son or daughter quietly scared for you.

That bill runs every month, on autopay, for life — unless something changes the inputs. Coaching is a ONE-TIME cost aimed at changing those inputs so the monthly bill shrinks. One number paid once, against a meter that never stops. That's the real comparison.

The honest objection isn't "is it worth it" — it's "I can't afford it."

Two things. First: you're already affording the more expensive option — the monthly meter — you just can't see the total because it never arrives as one bill. Second: you don't have to put yourself last to do this. Every woman I've coached spent years putting her health at the bottom of the list. Choosing the voice in the car isn't selfish — it's the first time in a while you put your own name on the list. And if the full amount is the hurdle, there's a 3-PAYMENT PLAN at $697/month.

TWO SLOTS LEFT — THEN IT'S $2,997.
Simply true: 2 coaching slots at the current $1,997. When they fill — soon, at this pace — the next person pays $2,997. Not a gimmick; weekly 1:1 time is finite. If coaching's in your future at all, the cheapest day to start is today.

→ Pay in full ($1,997): https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M
→ 3 payments of $697/mo: https://buy.stripe.com/6oU3cv2ZJ5LEgHV6NjfnO0N
→ Free 30-min call: https://calendly.com/braveworksrn/60min

In two days — the last email. No pitch, I promise. Just a fork in the road and an open door.

Joel
RN, BraveWorks

P.S. If "I can't afford it" is the real wall, reply and tell me honestly. Sometimes it's the payment plan that solves it; sometimes it's just naming the fear out loud. I read every reply and won't pressure you.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 21 — Last email: fork in the road, door stays open ────────────
const day21 = {
  subject: 'A fork in the road',
  subjectB: 'The door stays open',
  preview: 'Twenty-one days of the map. Now there are two roads. Both are okay.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Twenty-one days. We've walked the whole map together — and I want to say thank you before anything else. You read. You stayed. That's a quiet kind of bravery, and it's exactly what BraveWorks is named for.`)}
    ${bigQuote('Stand with me at a fork in the road.')}
    ${p(`Here's what I've learned in twenty years of nursing: a year from now, you will be somewhere. The only question is where. There's a version of you a year out who is still cuffing her arm with that little held breath, still creeping toward the next medication, still telling herself "it's just my age." And there's another version — same woman, same genes, same kitchen — who turned down her faucets, who understands her own number, who walks into the doctor's office calm.`)}
    ${p(`Both of those women start at this exact fork, today. The thing that decides which one you become isn't talent or luck or perfect genes. It's the next small step. That's the whole secret, and it's why I have such conviction about this work: the body wants to heal. Give it the right inputs and it almost can't help itself. I have watched it happen too many times to be quiet about it.`, { margin: '0 0 28px' })}
    ${p(`So before the emails slow down, let me lay out every road on the map — pick the one that fits where you actually are:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The whole ladder, in one place.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Just starting?</strong> The 60-second quiz, or the BP Starter Kit ($17) — the protocol I hand patients leaving my practice.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Want the research?</strong> BP Cures ($12.99) — the falsifiable claim and the dose behind every remedy.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Don't want to do it alone?</strong> The BP Triangle Challenge ($97) — all three books, a virtual RestoreHER ticket, and a group walking it with you.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>It's the hormones?</strong> RestoreHER, June 24–25 — Virtual Pass ($247), or Platinum For Two ($1,497) to be in the room with Barbara O'Neill alongside someone you love.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Ready for a voice in the car?</strong> 1:1 coaching with me — 90 days, weekly. (The last 2 slots are still $1,997 before it moves to $2,997.)</p>
    `)}
    ${p(`Not sure? Then take the smallest honest step — the $17 kit, or a free 30-minute call so you can just hear my voice and ask your questions with zero pressure.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Start with the BP Starter Kit — $17')}
    ${p(`<span style="color:#999;font-size:14px;">Or book a free 30-minute discovery call: <a href="https://calendly.com/braveworksrn/60min" style="color:${PALETTE.accentClay};">calendly.com/braveworksrn/60min</a></span>`, { margin: '0 0 28px' })}
    ${p(`And if today the answer is "not yet" — that is genuinely okay. There's no door closing, no countdown clock. Starting next week you'll hear from me about once a week, on a Tuesday, with one teaching and one story. <strong>The door stays open.</strong> Every link in this email still works in a week, a month, a year from now. I'll be here when you're ready.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Wherever you are at the fork, hit reply and tell me one thing you're taking with you from these 21 days. I read every single one. The work is slow and the conversation is long — that's how real change is built, not in 21 days, but in the year that follows. I'll see you Tuesday.`)}
    ${upsellFooter({
      kicker: 'The door stays open',
      body: 'No deadline, no clock. Every rung is here when you\'re ready — the $17 kit, the $12.99 book, the $97 Challenge, the RestoreHER passes, and 1:1 coaching. Take the step that fits where you are.',
      ctaLabel: 'Start with the $17 kit',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Twenty-one days. We've walked the whole map together — and thank you, before anything else. You read. You stayed. That's a quiet kind of bravery, exactly what BraveWorks is named for.

STAND WITH ME AT A FORK IN THE ROAD.

A year from now, you will be somewhere. The only question is where. One version of you is still cuffing with that held breath, creeping toward the next medication, saying "it's just my age." Another version — same woman, same genes, same kitchen — turned down her faucets, understands her number, walks into the doctor's office calm.

Both women start at this fork, today. What decides which one you become isn't talent or luck or perfect genes. It's the next small step. That's the whole secret, and why I have such conviction: the body wants to heal. Give it the right inputs and it almost can't help itself. I've watched it too many times to be quiet about it.

THE WHOLE LADDER, IN ONE PLACE — pick the road that fits you:

Just starting? The 60-second quiz, or the BP Starter Kit ($17).
Want the research? BP Cures ($12.99) — the claim and dose behind every remedy.
Don't want to do it alone? The BP Triangle Challenge ($97) — all three books, a virtual RestoreHER ticket, and a group with you.
It's the hormones? RestoreHER, June 24-25 — Virtual Pass ($247) or Platinum For Two ($1,497) to be in the room with Barbara O'Neill alongside someone you love.
Ready for a voice in the car? 1:1 coaching — 90 days, weekly. (Last 2 slots still $1,997 before $2,997.)

Not sure? Take the smallest honest step — the $17 kit, or a free 30-minute call.

→ BP Starter Kit ($17): ${KIT_URL}
→ Free 30-min call: https://calendly.com/braveworksrn/60min

And if today the answer is "not yet" — that's genuinely okay. No door closing, no clock. Starting next week, about once a week, on a Tuesday, one teaching and one story. THE DOOR STAYS OPEN. Every link here works in a week, a month, a year. I'll be here when you're ready.

Joel
RN, BraveWorks

P.S. Wherever you are at the fork, reply and tell me one thing you're taking from these 21 days. I read every one. The work is slow and the conversation is long — that's how real change is built. I'll see you Tuesday.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
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
