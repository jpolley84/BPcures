// api/_newsletter-emails.js — content + render layer for the weekly
// BraveWorks BP newsletter.
//
// Audience: ~3,590 subscribers in `state=newsletter` who need weekly
// content. Cycles every 7 months (30 issues × ~1/week ≈ 30 weeks).
//
// Each issue exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }
//
// SOURCE: sanitized from _drip-emails.js Days 1-30. Sequential refs
// stripped ("Day X", "tomorrow", "see you in the morning"). Welcome-arc
// framing cut. Teaching content + patient stories preserved verbatim.
//
// Every issue ends with:
//   [teaching content]
//   mondayCallReminder()  — Joel directive 2026-05-24
//   joelSignoff()
//   psBox(...)
//   upsellFooter(...)    — preserved from source where present
//   youtubePrimaryCTA()  — shared
//   skoolTiersFooter()   — shared
//
// Author: Joel Polley, RN, BraveWorks Health.

import { youtubePrimaryCTA, skoolTiersFooter, mondayCallReminder, premiumVipBodyPitch } from './_email-shared.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── URLs (single source of truth) ────────────────────────────────────
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = 'https://bpquiz.com';
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/braveworksrn/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

// ─── Brand palette ────────────────────────────────────────────────────
const PALETTE = {
  outerBg: '#FBF8F1',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

// ─── Shared building blocks (copied verbatim from _drip-emails.js) ────
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

function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

function footerSecondaryCTAs() {
  return youtubePrimaryCTA() + skoolTiersFooter();
}

// ═════════════════════════════════════════════════════════════════════
// NEWSLETTER ISSUES 1-30
// ═════════════════════════════════════════════════════════════════════

const issue1 = {
  subject: '3 lies your doctor told you about your BP',
  subjectB: 'The first lie cost me three patients',
  preview: 'The first one cost me three patients. Here\'s the truth.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${bigQuote('Three lies.')}
    ${p(`Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.`)}
    ${p(`You've heard all three. You probably believe at least one of them right now. They came from your doctor, your pharmacist, your favorite YouTube health channel — all of them well-meaning, all of them passing on what they were taught.`)}
    ${p(`I was taught the same things in nursing school.`)}
    ${p(`Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The three lies.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Lie #1 — the one almost every doctor still repeats. (Salt.)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Lie #2 — the most personal one. (Genetics.)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Lie #3 — once you see it, you can't look at your prescription the same way again. (The corner cardiologists never measure.)</p>
    `)}
    ${p(`We'll walk all three over the coming weeks — along with exactly what your body is actually asking for.`)}
    ${p(`If you do the small things I ask along the way, your numbers will be measurably lower 30 days from now. That's not a maybe. That's the protocol working the way it always does when someone shows up.`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.`)}
    ${upsellFooter({
      kicker: 'Want the patient protocol now?',
      body: 'My 3-input reset lives inside the $17 BP Reset Kit — the same document I hand patients on their way out of the hospital. Twenty years of ICU experience condensed into one PDF you can read tonight.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

THREE LIES.

Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives.

You've heard all three. You probably believe at least one of them right now.

I was taught the same things in nursing school. Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.

Lie #1 — Salt.
Lie #2 — Genetics.
Lie #3 — The corner cardiologists never measure.

We'll walk all three over the coming weeks.

Joel
RN, BraveWorks

P.S. If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.

—
Want the patient protocol now?
The $17 BP Reset Kit — the same document I hand patients.
→ ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue2 = {
  subject: 'The poison sitting on your counter',
  subjectB: '3 hidden-sodium foods you eat every week',
  preview: 'Not salt. Worse. It\'s the ratio.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Lie #1: "If you cut your salt intake, your blood pressure will come down."`)}
    ${p(`Almost every doctor in America still says this. It's printed on the diet sheets. It's on the cardiologist's wall.`)}
    ${p(`It's also incomplete. And the way it's incomplete is keeping your numbers stuck.`)}
    ${p(`Here's what's true: sodium does affect blood pressure. But the salt shaker on your table is responsible for less than 15% of your daily sodium intake.`)}
    ${p(`The other 85% is hidden — printed right on the label. We just don't think to look.`)}
    ${p(`<strong>Three of the worst offenders, ranked:</strong>`)}
    ${p(`<strong>1. Bread.</strong> A single slice of grocery-store sandwich bread holds 200-300mg of sodium. Two slices for a sandwich? 600mg before the meat hits the bread.`)}
    ${p(`<strong>2. Deli meat.</strong> Three slices of turkey breast — what most call a normal lunch — runs 700-900mg. A roasted turkey breast you cooked yesterday: 80mg.`)}
    ${p(`<strong>3. Soup, sauce, salad dressing.</strong> A cup of canned soup hits 800-1200mg. One tablespoon of soy sauce: 900mg. Two tablespoons of "lite" Italian dressing: 600mg.`)}
    ${p(`Add those three to a single day and you've already passed the 2,300mg sodium ceiling — without ever picking up the salt shaker.`)}
    ${p(`Picture the person who's been "watching their salt" for a decade. They put down the shaker. BP didn't move. Doctor said genetically prone — let's add another medication.`)}
    ${p(`They're not genetically prone. They're eating 4,000mg of sodium a day from food they don't think of as salty.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Pick THREE foods you eat regularly. Look at the sodium count on the label. Just look. Don't change anything yet — the swap teaching is in a future note.</p>
    `)}
    ${p(`Some of you are about to find a number that explains everything.`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Marlene. 52 years old. Eleven systolic points off her top number in nine days. No new pill. I'll tell you exactly what she did in a future issue.`)}
    ${upsellFooter({
      kicker: 'When you\'re ready for the live room',
      body: 'The sodium-potassium ratio is the first lever in a 30-day group protocol. The BP Triangle Challenge runs Monday-night live calls, daily protocol, 1,100+ members. We open a new cohort every two weeks. $97.',
      ctaLabel: 'Read more',
      ctaUrl: CHALLENGE_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Lie #1: "If you cut your salt, your blood pressure will come down."

Almost every doctor in America still says this. It's incomplete — and the way it's incomplete is keeping your numbers stuck.

The salt shaker is less than 15% of your sodium load. The other 85% is hidden.

Three worst offenders:
1. Bread (200-300mg per slice)
2. Deli meat (700-900mg per "normal" lunch)
3. Soup, sauce, salad dressing (800-1200mg per serving)

You can pass the 2,300mg ceiling without ever picking up the salt shaker.

THIS WEEK'S ASK: Pick three foods you eat regularly. Look at the sodium count on the label. Don't change anything yet.

Joel
RN, BraveWorks

P.S. Marlene. 52 years old. Eleven systolic points off her top number in nine days. No new pill. I'll tell you exactly what she did in a future issue.

—
When you're ready for the live room:
The BP Triangle Challenge — Monday-night live calls, daily protocol, 1,100+ members. $97.
→ ${CHALLENGE_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue3 = {
  subject: 'Marlene · 11 points · 9 days · no new pill',
  subjectB: 'Three things. Nine days. No mystery.',
  preview: 'Three inputs. Nine days. No mystery.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`(Marlene isn't her real name — I don't use real names in these emails to protect my buyers. But she's real, and so are her numbers.)`)}
    ${p(`Marlene is 52. Two grown daughters. Three grandkids. The person everyone in her family calls when something goes wrong.`)}
    ${p(`For the past 10 years, her BP has hovered around 150/95.`)}
    ${p(`She did DASH. She tried walking. She lost 18 pounds. She's been on lisinopril for six years.`)}
    ${p(`Last cuff reading before she found me: <strong>154/96.</strong>`)}
    ${p(`Then she joined the BP Reset Kit. We talked about hidden sodium. She did the label exercise.`)}
    ${p(`Nine days later, cuff reading: <strong>143/88.</strong>`)}
    ${p(`That's 11 systolic points. 8 diastolic. From a person who'd been told her BP was "as good as it was going to get."`)}
    ${p(`She didn't add a supplement. She didn't start a workout program. She didn't fast.`)}
    ${p(`She read three labels. She swapped store-bought bread for a homemade alternative. She stopped eating deli turkey on weekdays. She switched her favorite canned soup for a low-sodium homemade version her granddaughter loves.`)}
    ${bigQuote('Three swaps. Eleven points.')}
    ${p(`The real reason this worked isn't what you think. It's not "less sodium = lower BP." It's something the medical establishment has known about for forty years and somehow forgot to tell you. (More on that in a future issue.)`, { margin: '0 0 28px' })}
    ${p(`Marlene used The Cardiologist Conversation Script (inside the kit) at her next appointment. Her doctor reduced her lisinopril dose. By Day 30 she was off the cough side effect that drove her to me in the first place.`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If you took one input from Marlene's story and tried it this week, which one would you pick? Reply with one word — I'm curious.`)}
    ${upsellFooter({
      kicker: 'Marlene\'s exact 3-day reset',
      body: 'Page 4 of the BP Reset Kit. $17. Eighteen pages. The exact document that walked Marlene from a third-pill recommendation to "no new pill" in nine days. The same one I hand patients.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

(Marlene isn't her real name — I protect my buyers. But she's real, and so are her numbers.)

Marlene is 52. Caregiver to her family. BP hovering around 150/95 for ten years. DASH, walking, weight loss, lisinopril for six years. Last reading: 154/96.

She joined the BP Reset Kit. Did the hidden-sodium label exercise.

Nine days later: 143/88. Eleven systolic points. Eight diastolic.

No supplement. No workout. No fast. She swapped three foods — bread, deli turkey, canned soup.

Three swaps. Eleven points.

Joel
RN, BraveWorks

P.S. If you took one input from Marlene's story and tried it this week, which one would you pick? Reply with one word — I'm curious.

—
Marlene's exact 3-day reset:
Page 4 of the BP Reset Kit. $17. Eighteen pages. The same document I hand patients.
→ ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue4 = {
  subject: 'The hidden ratio your kidneys are reading',
  subjectB: 'The 3:1 number your doctor never told you',
  preview: 'Forty years of research. Not in any pamphlet I\'ve ever seen.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Marlene dropped 11 points in 9 days. Not from salt reduction alone — from something else.`)}
    ${p(`Here it is.`)}
    ${bigQuote('Your blood pressure isn\'t governed by sodium. It\'s governed by the RATIO of sodium to potassium.')}
    ${p(`The two minerals work as a pair. Sodium pulls water into your blood vessels. Potassium pulls it out. When they're balanced, your vessels relax. When sodium dominates, your vessels constrict and your numbers climb.`)}
    ${p(`<strong>The ideal ratio for healthy adults: roughly 1 sodium to 3 potassium.</strong>`)}
    ${p(`The actual ratio of the standard American diet: <strong>4 sodium to 1 potassium.</strong>`)}
    ${p(`That's a 12-fold deviation from what your body needs. It's not borderline. It's catastrophic — and it's why "just cutting salt" almost never works on its own.`)}
    ${p(`When you only cut sodium, you tilt the balance back partway. Helpful, but slow.`)}
    ${p(`When you cut hidden sodium AND raise potassium, you fix both sides of the equation. The body unwinds the constriction. The numbers come down.`)}
    ${p(`This isn't fringe. The Intersalt Study (52 populations, 32 countries, 10,000+ participants) showed a clear inverse relationship between potassium intake and BP. The 2013 Cochrane Review confirmed it. The American Heart Association now lists potassium as one of the top dietary levers for hypertension.`)}
    ${p(`Most American adults get less than 2,000mg of potassium per day. The body needs around <strong>4,700mg.</strong>`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Add ONE potassium-rich food to your day. Just one.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A medium baked potato (with skin): 925mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A cup of cooked spinach: 840mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— An avocado: 700mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A cup of cooked white beans: 1,000mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 12px;">— A banana: 420mg</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Pick one. Add it to today's lunch or dinner. Don't replace anything — just add.</p>
    `)}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`I made a 12-min YouTube video that walks the 3:1 ratio at the grocery store with my own basket. <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};font-weight:600;">Watch on YouTube →</a> If you're on a potassium-sparing diuretic (like spironolactone or amiloride), check with your prescriber before loading up.`)}
    ${upsellFooter({
      kicker: 'The patient protocol in one PDF',
      body: 'The same 3-input reset I hand patients on their way out of the hospital lives inside the $17 BP Reset Kit — eighteen pages, the daily plan, the foundation moves, and the starter herb list, ready to start tonight. The cheapest day you will ever spend on your numbers.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Marlene dropped 11 points in 9 days. Not from salt alone — from something else.

Your blood pressure isn't governed by sodium. It's governed by the RATIO of sodium to potassium.

Ideal: 1 sodium : 3 potassium.
American diet: 4 sodium : 1 potassium.

That's a 12-fold deviation. It's why "just cut salt" almost never works.

The Intersalt Study (52 populations, 10,000+ people) showed it. Cochrane Review 2013 confirmed it. American Heart Association lists potassium as a top BP lever.

Most adults get under 2,000mg/day. Body needs ~4,700mg.

THIS WEEK'S ASK: Add ONE potassium-rich food to your day. Just one.
— Baked potato w/ skin: 925mg
— Cup cooked spinach: 840mg
— Avocado: 700mg
— Cup cooked white beans: 1,000mg
— Banana: 420mg

Pick one. Add it. Don't replace anything.

Joel
RN, BraveWorks

P.S. On a potassium-sparing diuretic? Check with your prescriber first.

—
The patient protocol in one PDF:
The $17 BP Reset Kit — eighteen pages, the daily plan, the foundation moves, the starter herb list. Start tonight.
→ ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue5 = {
  subject: '3 "savory" foods spiking your numbers harder than candy',
  subjectB: 'Bread. Broth. Sauce. Each one a multiplier.',
  preview: 'Bread. Broth. Sauce. Each one a hidden multiplier.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick recap.`)}
    ${p(`Hidden sodium is 85% of your sodium load. Potassium is the partner mineral that lets the system rebalance.`)}
    ${bigQuote('Now: sugar.')}
    ${p(`Most people trying to lower their BP don't think about sugar. They think about salt. Maybe fat. Sugar feels like a separate conversation — about weight, maybe diabetes, but not blood pressure.`)}
    ${p(`That's the gap I want to close today.`)}
    ${p(`<strong>Sugar — and refined carbs that act like sugar — spike your insulin. Insulin is a vasoconstrictor.</strong> When your insulin is elevated, your blood vessels narrow, your kidneys retain sodium more aggressively, and your sympathetic nervous system tilts toward "alert" mode.`)}
    ${p(`All three of those things raise your blood pressure.`)}
    ${p(`<strong>Three ways your insulin gets spiked without you eating anything sweet:</strong>`)}
    ${p(`<strong>1. White bread, bagels, English muffins.</strong> A bagel hits your bloodstream like 5 teaspoons of pure sugar within 30 minutes. Your insulin spikes harder than after a candy bar.`)}
    ${p(`<strong>2. Boxed cereal.</strong> Even the "healthy" ones — granolas, bran flakes, muesli with raisins — are usually 30-50% sugar by weight. Two cups of cereal is often 14g of sugar. Same as a glazed donut.`)}
    ${p(`<strong>3. Crackers, pretzels, rice cakes.</strong> Refined-flour snacks act in your bloodstream identically to table sugar. The "rice cake" health halo is one of the most successful marketing illusions of the last 40 years.`)}
    ${p(`If you've eliminated salt and your BP hasn't moved... it's almost certainly because you're spiking insulin three to five times a day from foods you don't even consider treats.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Pick ONE of those three categories — bread, cereal, or refined-flour snacks — and don't eat it for one day. Just one day. One category.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you usually eat bread at lunch, swap it for a romaine wrap or skip it entirely and add an extra protein. If cereal at breakfast, swap it for two eggs and an avocado.</p>
    `)}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Tonight, before bed, look at the sodium milligrams on three things in your kitchen. The next issue goes deeper if you do this one piece of homework.`)}
    ${upsellFooter({
      kicker: 'When group accountability becomes the missing piece',
      body: 'The sodium audit + the protein-fat-fiber rule are taught inside the 30-Day BP Triangle Challenge. Monday-night live calls. Group accountability. The exact weekly homework that built Marlene\'s outcome. $97.',
      ctaLabel: 'Read more',
      ctaUrl: CHALLENGE_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Recap:
Hidden sodium is 85% of your load.
Potassium is the partner mineral.

Now: sugar.

Sugar — and refined carbs that act like sugar — spike insulin. Insulin is a vasoconstrictor. Vessels narrow. Kidneys retain sodium. Sympathetic tone climbs. BP rises.

Three ways your insulin spikes without anything sweet:
1. White bread/bagels/English muffins (5 teaspoons of sugar equivalent)
2. Boxed cereal (14g sugar per 2 cups — same as a donut)
3. Crackers, pretzels, rice cakes (act identically to table sugar)

THIS WEEK'S ASK: Skip ONE of those categories for one day. Just one. One day.

Joel
RN, BraveWorks

P.S. Tonight, before bed, look at the sodium milligrams on three things in your kitchen.

—
When group accountability becomes the missing piece:
The 30-Day BP Triangle Challenge. Monday-night live calls. Group accountability. $97.
→ ${CHALLENGE_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue6 = {
  subject: 'Why your numbers haven\'t moved (the hidden corner)',
  subjectB: 'You\'ve been working on one corner. There are three.',
  preview: 'You\'ve been working on one corner. There are three.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Time for an honest check.`)}
    ${p(`Some of you are seeing your numbers move. Maybe 3 points, maybe 8 — Marlene's 11 isn't common in week 1, but movement should be happening.`)}
    ${p(`Some of you are seeing nothing.`)}
    ${p(`I want to talk to that second group, because this is the point where most people I've worked with quietly decide it's not going to work for them. They don't unsubscribe. They don't write back. They just stop reading.`)}
    ${p(`If that's you, please don't stop yet. <strong>Three reasons your numbers may be stuck:</strong>`)}
    ${p(`<strong>1. You haven't actually swapped — you've added.</strong> You added a banana and you swapped your salt shaker for nothing. That's a half-measure. The body responds to ratio shifts, not additions. Pick ONE high-sodium food and replace it. Don't just supplement around it.`)}
    ${p(`<strong>2. You're cuffing wrong.</strong> Most home BP cuffs read 8-15 points high if you take your reading after coffee, in a chair without back support, with your arm hanging at your side, or with your legs crossed. If your last reading is from any of those conditions, it's not your real number. The protocol I use with every BraveWorks member: same conditions, same time, same arm, twice a day.`)}
    ${p(`<strong>3. You're a slower responder.</strong> Some bodies start moving in 48 hours. Some need 14-21 days. That's biology, not failure. The body has to recalibrate baroreceptors and reset kidney sodium handling — for some that's a 3-week process. The eliminations you're doing are doing their work whether or not the cuff has caught up yet.`)}
    ${bigQuote('Don\'t quit before you give it three weeks. Week 1 is when most quitters quit.')}
    ${p(`Three shifts are already happening in your body. You may not feel them yet. The full 30-day arc covers the herbs that work like your meds, the water cure your grandmother knew, the breathing exercise that flips your nervous system in 60 seconds, and the gratitude practice that lowers cortisol faster than any supplement.`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Which of the Three Pressures do you think is running yours? Reply with one word: Pipes, Sugar, or Stress. I'll read every one.`)}
    ${upsellFooter({
      kicker: 'Not sure which Pressure is loudest?',
      body: 'The free BP quiz shows your biggest Pressure and where to start. Two minutes, no card. It is the best first step while the 1:1 channel is being rebuilt.',
      ctaLabel: 'Take the free BP quiz',
      ctaUrl: COACHING_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Honest check.

Some of you are seeing movement. Some are seeing nothing.

For the second group: this is when most quietly decide it's not going to work. They don't unsubscribe. They just stop reading.

Don't stop yet. Three reasons your numbers may be stuck:

1. You added but didn't swap. The body responds to ratio shifts, not additions.

2. You're cuffing wrong. After coffee, no back support, arm hanging, legs crossed — all read 8-15 points high.

3. You're a slow responder. 14-21 days is normal biology. Eliminations are working underneath.

Don't quit before three weeks. Week 1 is when most quitters quit.

Joel
RN, BraveWorks

P.S. Which of the Three Pressures do you think is running yours? Reply with one word: Pipes, Sugar, or Stress. I read every one.

—
Not sure which Pressure is loudest?
The free BP quiz shows your biggest Pressure and where to start. Two minutes, no card.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue7 = {
  subject: 'Three shifts already happening in your body',
  subjectB: 'What\'s actually moving underneath',
  preview: 'Three quiet shifts you may not feel yet.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`If you've been at this for a week or two, three things are already happening in your body — whether you feel them or not:`)}
    ${p(`<strong>One</strong> — your kidneys are reading a different sodium-to-potassium ratio if you added one of those three foods.`)}
    ${p(`<strong>Two</strong> — your gene expression is shifting. Hundreds of protective genes are responding to the inputs you're feeding them.`)}
    ${p(`<strong>Three</strong> — you're closer to knowing which corner of the BP Triangle is yours. That's the diagnostic step most adults never reach.`, { margin: '0 0 28px' })}
    ${bigQuote('What\'s ahead.')}
    ${p(`If you only run the foundation moves — hidden-sodium audit, the K:Na ratio, one carb category dropped — you'll move your top number 5-8 points over the next month. That's real.`)}
    ${p(`If you want the rest of it, here's what we'll walk in the issues to come:`)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">THE HERBS</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The four herbs that work on the same biological pathways as your BP medications — without the prescription. Garlic. Hibiscus. Hawthorn berry. Magnesium glycinate. How they work. How much. How to layer them safely.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">THE WATER CURE</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The hydrotherapy tradition your great-grandmother knew. Contrast showers that reset your nervous system in 60 seconds. The Eight Laws of Health your doctor never learned.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">THE HIDDEN CORNER FIX</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The deep-breathing pattern that drops cortisol faster than any pill. The twenty-minute walk in nature that beats every supplement. The gratitude practice with the studies behind it. Morning sunlight as your free cortisol reset.</p>
    `)}
    ${p(`The full arc is yours. Just keep reading.`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If you'd rather stop here, no hard feelings. The work is yours either way.`)}
    ${upsellFooter({
      kicker: 'Want it in one place?',
      body: 'The $17 BP Reset Kit puts the foundation moves, the starter herb list, the breathing protocols, and the daily plan into one printable PDF — eighteen pages you can walk on your own schedule, the same document I hand patients.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Three things are already happening in your body:

One — your kidneys are reading a different sodium-to-potassium ratio if you added one of those three foods.

Two — your gene expression is shifting. Hundreds of protective genes are responding to the inputs you're feeding them.

Three — you're closer to knowing which corner is yours.

WHAT'S AHEAD:

THE HERBS — Garlic, Hibiscus, Hawthorn, Magnesium glycinate. How they work. How much. How to layer safely.

THE WATER CURE — Hydrotherapy. Contrast showers. The Eight Laws of Health your doctor never learned.

THE HIDDEN CORNER FIX — Breathing, walking, gratitude, sunlight.

Just keep reading.

Joel
RN, BraveWorks

—
Want it in one place?
The $17 BP Reset Kit — foundation moves, starter herbs, breathing protocols, daily plan.
→ ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue8 = {
  subject: 'The 60-minute conversation that ends the guessing',
  subjectB: 'When the daily protocols aren\'t enough',
  preview: 'One Zoom. Your loudest Pressure named. A written 30-day protocol that\'s yours.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to put one direct option in front of you — because some of you don't need more education. You need a sixty-minute call with a real nurse looking at your real situation.`, { margin: '0 0 32px' })}
    ${bigQuote('Which of the Three Pressures is yours?')}
    ${p(`The Three Pressures are how I think about every BP case I see:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Pipe Pressure (vascular).</strong> The pipes got stiff. Arterial stiffness, oxidative stress, low NO. You see the numbers. Your doctor sees the numbers. But nobody's fixing the inputs.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Stress Pressure (cortisol).</strong> The switch stuck on. Wired-tired. Can't sleep deep. Midsection weight gain. Cortisol pulls BP up like a pulley. Most cardiologists don't measure this.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Sugar Pressure (insulin).</strong> Sugar stays high. A1C creeping. 3 PM crashes. Can't lose the weight. Insulin is vasoconstrictive — high BP and high A1C are the same disease wearing different shirts.</p>
    `)}
    ${p(`Most people have ONE Pressure that's the lead domino. Calm that one and the other two fall in line.`, { margin: '0 0 32px' })}
    ${clayBlock("Don't know your dominant Pressure yet?", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The 90-second BP Triangle Quiz routes you to one of the Three Pressures — Stress, Sugar, or Pipes — and returns the first move for your specific type.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SITE_URL}/quiz" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the BP Triangle Quiz →</a></p>
    `)}
    ${clayBlock('If this is you, the weekly newsletter isn\'t enough', `
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">You're on <strong style="color:${PALETTE.text};">4 or more medications.</strong> Maybe more. BP, statin, beta-blocker, ARB, possibly metformin, possibly a thyroid drug. Maybe a benzo or a sleep aid layered on top.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your readings are still high. Or they\'re "controlled" but you feel like a ghost of the person you were 10 years ago. Side effects you can\'t pin to one drug because they could be coming from any of them.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your doctor\'s answer is "another medication." Or "let\'s adjust the dose." Or "you\'ll just have to live with it."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">If that\'s you, an email isn't enough. You need someone in your corner who can read your full picture in one sitting, name your loudest Pressure, and hand you a written protocol that\'s yours — not the general kit.</strong></p>
    `)}
    ${bigQuote('The BP Triangle Diagnostic Session.')}
    ${p(`A single 60-minute Zoom with me. Bring your home BP log, your prescription list, your supplements, your labs if you have any. I look at your full picture and name your loudest Pressure — Pipes, Stress, or Sugar.`)}
    ${p(`You walk out with:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your loudest Pressure, named (with the second-loudest noted too)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ A written 30-day personalized protocol — yours, not generic</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ A clean one-page script to bring your doctor for the deprescribing conversation</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">30 days of follow-up email coaching</strong> — reply to me each Sunday with your numbers and I adjust as needed</p>
    `)}
    ${p(`It's <strong>$297</strong>. One time. No upsell on the call.`, { margin: '0 0 32px' })}
    ${ctaButton(COACHING_URL, 'Take the free BP quiz →')}
    ${p(`<span style="color:#999;font-size:14px;">Heads up: one-on-one calls are paused while I rebuild the 1:1 channel. Start with the free quiz to find your loudest Pressure today, and you'll be first to know when calls reopen.</span>`, { margin: '0 0 28px' })}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`The diagnostic works regardless of which Pressure is yours. Stress, Sugar, or Pipes — same call, same depth, different protocol output. The work is Pressure-specific; the door is the same.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

One direct option for the people who want more than education.

WHICH OF THE THREE PRESSURES IS YOURS?

1. PIPE PRESSURE (vascular) — The pipes got stiff. Arterial stiffness, low NO, oxidative stress.
2. STRESS PRESSURE (cortisol) — The switch stuck on. Wired-tired, can't sleep deep, midsection weight gain.
3. SUGAR PRESSURE (insulin) — Sugar stays high. A1C creeping, 3 PM crashes, can't drop the weight.

Most people have ONE Pressure that's the lead domino.

IF THIS IS YOU, THE NEWSLETTER ISN'T ENOUGH:

You're on 4 or more medications. Your readings are still high — or "controlled" but you feel like a ghost. Side effects you can't pin to one drug. Your doctor's answer is "another medication."

If that's you, an email isn't enough.

THE BP TRIANGLE DIAGNOSTIC SESSION

A single 60-minute Zoom with me. Bring your home BP log, your prescription list, supplements, any labs. I look at your full picture, name your loudest Pressure, you walk out with:

→ Your loudest Pressure, named
→ A written 30-day personalized protocol
→ A doctor-conversation script for the deprescribing talk
→ 30 days of follow-up email coaching

$297. One time. No upsell on the call.

→ Take the free BP quiz: ${COACHING_URL}

Heads up: one-on-one calls are paused while I rebuild the 1:1 channel. The free quiz finds your loudest Pressure today.

Joel
RN, BraveWorks

P.S. The diagnostic works regardless of which Pressure is yours. Same call, same depth, different protocol output.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue9 = {
  subject: 'Lie #2 — "it\'s genetic, nothing I can do"',
  subjectB: 'The most personal lie about blood pressure',
  preview: 'Genes load the gun. Three other things pull the trigger.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Lie #2 — the most personal one:`)}
    ${bigQuote('"My blood pressure is genetic. Nothing I can do about it."')}
    ${p(`If you've ever said this out loud — or heard a parent say it about you — read this twice.`, { margin: '0 0 28px' })}
    ${p(`<strong style="color:${PALETTE.text};">Genes load the gun. Inputs pull the trigger.</strong> The same DNA your mother had — sat in a Japanese village in 1960 with the same code in her cells, never developed hypertension. Move that same DNA to suburban Ohio with 4,000mg of hidden sodium and 4 hours of sleep — boom. Same code, different inputs, different disease.`)}
    ${p(`Your genes set the threshold. Your inputs decide whether you cross it.`, { margin: '0 0 28px' })}
    ${clayBlock("What's actually inherited", `
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Not the blood pressure itself. What's inherited is a <strong style="color:${PALETTE.text};">sensitivity to one of Three Pressures.</strong> Three Pressures of one loop. I call this the <strong style="color:${PALETTE.text};">BP Triangle</strong>:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">PIPE PRESSURE</strong> (vascular) — the pipes. Stiff arteries, low NO, K:Na imbalance.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">STRESS PRESSURE</strong> (cortisol) — the switch stuck on. Clamps the vessels, retains sodium.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">SUGAR PRESSURE</strong> (insulin) — sugar stays high. Insulin is a vasoconstrictor.</p>
    `)}
    ${p(`Most boomer-aged readers I work with assume their dominant Pressure is Pipe — they hear "high blood pressure" and think "stiff arteries, more lisinopril." But when I dig into their full history, the lead domino is almost always <strong style="color:${PALETTE.text};">Stress Pressure</strong>. And cortisol is the driver most cardiologists don't even measure.`)}
    ${p(`This is why the genetics lie hurts so much: your mother probably had the same cortisol-driven loop, never knew it, blamed her family tree, and accepted a lifetime of pills as fate. <strong style="color:${PALETTE.text};">It wasn't fate. It was an input nobody helped her change.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('The Stress Pressure corner — two interventions that actually work.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Ashwagandha (KSM-66 form, 300 mg AM + PM).</strong> Chandrasekhar et al, 2012 — 64 adults, 8 weeks. Salivary cortisol dropped 27.9% versus placebo. Anxiety scores fell in parallel. Cheapest single move you can make for the cortisol corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. Asleep before 11 PM.</strong> Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset at 10 PM gives you ~3 hours inside that window. Sleep onset at 1 AM gives you zero — even if you sleep until 8.</p>
    `)}
    ${p(`If your morning BP runs high and your blood sugar is roughly normal, Stress Pressure is almost certainly the one driving your numbers. The good news: Stress Pressure responds faster than Pipe Pressure. Most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.`)}
    ${p(`Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay. Your doctor watches the readings. The readings move because the inputs are moving.`, { margin: '0 0 28px' })}
    ${clayBlock("Don't know which Pressure is yours?", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The free 90-second BP Triangle Quiz returns your dominant Pressure + the first move for your specific type. Built around the same diagnostic I use with my coaching clients.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SITE_URL}/quiz" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the BP Triangle Quiz →</a></p>
    `)}
    ${p(`My deepest Triangle walkthroughs are on YouTube. The cortisol corner gets a 14-min video that names every herb dose, the bedtime math, and the one supplement I refuse to use.`)}
    ${ctaButton(YOUTUBE_URL, 'Watch the Triangle deep-dive on YouTube →')}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Stay with me. The third corner — the one cardiologists never measure — is coming.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

LIE #2: "My blood pressure is genetic. Nothing I can do about it."

GENES LOAD THE GUN. INPUTS PULL THE TRIGGER.

The same DNA your mother had — sat in a Japanese village in 1960 with the same code, never developed hypertension. Move it to suburban Ohio with 4,000mg of hidden sodium and 4 hours of sleep — boom.

WHAT'S ACTUALLY INHERITED is a sensitivity to one of Three Pressures. The BP Triangle:

→ PIPE PRESSURE (vascular) — Stiff arteries, low NO, K:Na imbalance.
→ STRESS PRESSURE (cortisol) — The switch stuck on. Clamps the vessels, retains sodium.
→ SUGAR PRESSURE (insulin) — Insulin is a vasoconstrictor.

Most boomer-aged readers assume Pipe — "stiff arteries, more lisinopril." But the lead domino is almost always STRESS PRESSURE. And cortisol is the driver most cardiologists don't even measure.

Your mother probably had the same cortisol-driven loop, never knew it, blamed her family tree, accepted a lifetime of pills as fate. It wasn't fate. It was an input nobody helped her change.

STRESS PRESSURE CORNER — TWO INTERVENTIONS:

1. Ashwagandha (KSM-66, 300mg AM+PM). Chandrasekhar 2012 — cortisol dropped 27.9% in 8 weeks.

2. Asleep before 11 PM. Slow-wave cortisol clearance peaks 10 PM to 2 AM.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT. AND not INSTEAD OF.

DON'T KNOW WHICH PRESSURE IS YOURS?
→ ${SITE_URL}/quiz

Joel
RN, BraveWorks

→ Watch the Triangle deep-dive on YouTube: ${YOUTUBE_URL}

—
→ Skool: ${SKOOL_URL}
`,
};

const issue10 = {
  subject: 'The corner cardiologists never measure',
  subjectB: 'Sugar raises BP harder than salt',
  preview: 'Three "savory" foods spike BP for 2-3 hours after every bite.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`The third Pressure. This is the one I almost missed in my own practice for years. The one that explains why people who "cut their salt" for a decade watch their BP keep creeping up anyway.`, { margin: '0 0 28px' })}
    ${bigQuote('Sugar Pressure raises blood pressure. Harder than salt does.')}
    ${p(`Most cardiologists don't measure A1c. They look at your BP, they look at your cholesterol, maybe they look at your kidneys. <strong style="color:${PALETTE.text};">Blood sugar doesn't even show up on their scorecard.</strong>`)}
    ${p(`But every time your blood sugar spikes, your insulin spikes. And insulin is a vasoconstrictor — it narrows your blood vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop on the back end.`)}
    ${p(`Three Pressures of one loop. Calm one, the other two follow. <strong style="color:${PALETTE.text};">Fix the Triangle, the BP fixes itself.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock('The three "savory" foods that spike BP harder than candy', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">White bread / bagels.</strong> Hits like 5 teaspoons of pure sugar. Insulin spikes within 30 minutes.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Boxed cereal.</strong> 30-50% sugar by weight. A "healthy breakfast" cereal can be the same insulin hit as a glazed donut.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">Crackers, pretzels, rice cakes.</strong> Refined starch behaves like sugar in your bloodstream. The body doesn't distinguish.</p>
    `)}
    ${p(`If you cut your salt and your BP didn't move, this is almost always why. Blood sugar is the silent corner.`, { margin: '0 0 28px' })}
    ${bigQuote('Two moves that work without willpower.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. The 10-minute walk inside 30 minutes of eating.</strong> Your muscles pull glucose out of your bloodstream without insulin. Multiple meta-analyses show 30-40% reduction in the post-meal glucose curve. No equipment, no willpower, no diet rules. Walk to the mailbox and back. That's enough.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. The Anti-BP Plate.</strong> Half the plate non-starchy vegetables. Palm-sized protein. Thumb of fat. Small carb — and eat it <em>last</em>. Order matters more than calories. Same plate, carbs at the end, 30-40% smaller glucose spike. By the time the carb arrives, the stomach is partially emptied and GLP-1 is already up.</p>
    `)}
    ${p(`Pills manage output. Protocol fixes input. The protocol for this corner is two behaviors — walk after meals, eat carbs last. Both free. Both 14 days to start moving morning numbers.`, { margin: '0 0 28px' })}
    ${clayBlock('Find out if Sugar Pressure is YOURS', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The 90-second BP Triangle Quiz identifies your dominant Pressure and returns the protocol that matches your type.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SITE_URL}/quiz" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the BP Triangle Quiz →</a></p>
    `)}
    ${p(`If you want my eyes on your numbers live — every Monday at 10 PM ET I unravel the Triangle on Zoom with the cohort. The <strong>$97 BP Triangle Challenge</strong> gets you a seat on every weekly call for 4 weeks, plus the Skool VIP room and the full bonus stack.`)}
    ${ctaButton(CHALLENGE_URL, 'Join the BP Triangle Challenge — $97 →')}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Quieter numbers. Steadier mornings. Doctor-cleared independence. Three phrases worth aiming at — because they're the actual outcomes, not "lower my BP by Tuesday."`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

The third Pressure.

SUGAR PRESSURE RAISES BLOOD PRESSURE. HARDER THAN SALT DOES.

Most cardiologists don't measure A1c. Blood sugar doesn't even show up on their scorecard.

Every time your blood sugar spikes, insulin spikes. Insulin is a vasoconstrictor — narrows vessels for 2-3 hours after every meal. Tells kidneys to retain sodium. Feeds the cortisol loop.

FIX THE TRIANGLE, THE BP FIXES ITSELF.

THE THREE "SAVORY" FOODS:
→ White bread / bagels. Like 5 teaspoons of pure sugar.
→ Boxed cereal. 30-50% sugar by weight.
→ Crackers, pretzels, rice cakes. Refined starch = sugar.

TWO MOVES THAT WORK WITHOUT WILLPOWER:

1. The 10-minute walk inside 30 minutes of eating. 30-40% reduction in post-meal glucose. Walk to the mailbox.

2. The Anti-BP Plate. Half non-starchy veg. Palm of protein. Thumb of fat. Small carb LAST. 30-40% smaller spike.

Pills manage output. Protocol fixes input.

FIND OUT IF BLOOD SUGAR IS YOUR CORNER:
→ ${SITE_URL}/quiz

Joel
RN, BraveWorks

→ Want me on your call? The $97 BP Triangle Challenge: ${CHALLENGE_URL}

P.S. Quieter numbers. Steadier mornings. Doctor-cleared independence.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue11 = {
  subject: 'The one sentence I teach every patient',
  subjectB: 'Pills manage output. Protocol fixes input.',
  preview: 'The frame that takes the fear out of the doctor conversation.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`When I sit with a new client, before we talk about anything else — herbs, dosing, sleep, food, none of it — I write one sentence on a piece of paper and slide it across the desk.`, { margin: '0 0 28px' })}
    ${bigQuote('Pills manage output. Protocol fixes input.')}
    ${p(`Eight words. Most of my clients tape it to their refrigerator.`, { margin: '0 0 28px' })}
    ${p(`Here's what it means:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Your medication does one thing well.</strong> It lowers the number on the cuff. That's it. That's what it was designed to do. That's what your doctor measures it by. That's what your insurance company is paying it to deliver.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Your medication does not fix what's making the number high in the first place.</strong> Pipe Pressure (vascular stiffness), Stress Pressure (cortisol load), Sugar Pressure (insulin spike) — those keep grinding underneath the pill. Which is why most patients end up on a second pill in 3 years. Then a third in 5. Then a fourth by 65.</p>
    `)}
    ${p(`Pills manage the <em>output</em> — the reading. Protocol fixes the <em>input</em> — the loop that produced the reading.`)}
    ${p(`The pills are fine. They're not the enemy. <strong style="color:${PALETTE.text};">But by themselves they're a fingers-in-the-dam strategy.</strong> The dam keeps leaking because nobody's fixing the water pressure upstream.`, { margin: '0 0 28px' })}
    ${bigQuote('AND not INSTEAD OF.')}
    ${p(`This is the second sentence I write down. The protocol you're learning isn't replacing your medication. <strong style="color:${PALETTE.text};">It's running underneath it.</strong>`)}
    ${p(`Your doctor watches the readings. Your readings drop because the inputs are moving. At some point — usually 60 to 90 days in — your doctor says "your numbers look good, let's try lowering this dose." That's the moment you've been working toward.`)}
    ${p(`Never around your doctor. Always with them. <strong style="color:${PALETTE.text};">Doctor-cleared independence.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock('How to bring this to your next appointment', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Three sentences you can say verbatim. They keep your doctor as a partner, not an obstacle:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">1. <em>"I'm running a nurse-built natural protocol alongside my medication. Can we cuff weekly for the next 8 weeks so we have data?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">2. <em>"If my morning average drops 8+ mmHg sustained for 4 weeks, can we talk about lowering the dose at that point?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">3. <em>"Here's the protocol on one page — I'd like it in my chart so you have the full picture."</em></p>
    `)}
    ${p(`Most doctors say yes. Some don't. If yours doesn't, that's information. <strong style="color:${PALETTE.text};">The goal is not to fight your doctor. The goal is to do this work with their blessing and watch them be the one who says "let's lower the dose."</strong>`, { margin: '0 0 28px' })}
    ${p(`If you're not in the community yet, join the free Skool room — "How to Be Your Own Doctor." It's where the AND-not-INSTEAD-OF women trade weekly numbers, food swaps, and doctor-conversation wins.`)}
    ${ctaButton(SKOOL_URL, 'Join the free Skool community →')}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If this issue helped a sentence land — forward it to the friend who's about to start another medication and doesn't know there's an "AND" path. That's the most useful thing you can do with what I send you.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

When I sit with a new client, before anything else, I write one sentence and slide it across the desk.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT.

Eight words. Most clients tape it to the fridge.

YOUR MEDICATION DOES ONE THING WELL — lowers the number on the cuff.

YOUR MEDICATION DOES NOT FIX WHAT'S MAKING THE NUMBER HIGH. Pipe Pressure, Stress Pressure, Sugar Pressure keep grinding underneath the pill. That's why most patients end up on a second pill in 3 years.

The pills are fine. They're not the enemy. But by themselves they're a fingers-in-the-dam strategy.

AND NOT INSTEAD OF.

The protocol isn't replacing your medication. It's running underneath it. Your doctor watches the readings. The readings drop because the inputs are moving. At 60-90 days the doctor says "let's lower this dose."

Doctor-cleared independence.

HOW TO BRING THIS TO YOUR APPOINTMENT:

1. "I'm running a nurse-built natural protocol alongside my medication. Can we cuff weekly for 8 weeks?"
2. "If my morning average drops 8+ mmHg sustained for 4 weeks, can we talk about lowering the dose?"
3. "Here's the protocol on one page — I'd like it in my chart."

The goal is not to fight your doctor. The goal is to do this work with their blessing.

Joel
RN, BraveWorks

→ Join the free Skool community: ${SKOOL_URL}

P.S. If this helped — forward it to a friend who's about to start another medication.

—
→ YouTube: ${YOUTUBE_URL}
`,
};

const issue12 = {
  subject: 'Marlene. 11 points. 9 days. No new pill.',
  subjectB: 'How my buyer dropped 11 systolic in 9 days',
  preview: 'Three food swaps. No new prescription. Doctor lowered her dose.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today I unpack what Marlene actually did — because almost every email I get back asks the same question:`)}
    ${bigQuote('"How exactly did she do it?"')}
    ${p(`Here's the full picture. Names changed, numbers are real.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">Baseline:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Age 52, six years on lisinopril 10mg</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Morning BP averaging <strong style="color:${PALETTE.text};">154/96</strong> — "controlled" but creeping</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ A1c 5.9 (pre-diabetic), slow morning weight gain, 3 PM crashes</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ Sleep onset 12:30 AM most nights ("can't fall asleep")</p>
    `)}
    ${p(`When she took my quiz, her Triangle came back lit on two Pressures — <strong style="color:${PALETTE.text};">Sugar Pressure</strong> primary, <strong style="color:${PALETTE.text};">Stress Pressure</strong> secondary. Pipe Pressure tertiary. That's a very common pattern in stage-1 hypertension that "won't budge" on standard pills.`, { margin: '0 0 28px' })}
    ${bigQuote('The three things she changed.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. Store-bought bread → sprouted-grain bread (or none).</strong> Store bread = ~200-300mg sodium per slice AND a glucose-curve hit. Sprouted grain = lower of both. Two slices a day cleared out 600mg of sodium and a major insulin spike.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">2. Weekday deli turkey → roasted from-the-bird the night before.</strong> Deli meat = 700-900mg sodium per lunch portion. Home-roasted = 80mg. Same protein, same convenience, $50/month less than the deli counter.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Canned soup for lunch → homemade in 15 minutes Sunday night.</strong> Canned soup = 800-1,200mg sodium per cup. Homemade with low-sodium broth and a pressure cooker = 80-200mg. Eight portions in one Sunday cook.</p>
    `)}
    ${p(`That's it. Three swaps. No new supplement, no new workout, no new pill. Day 6: morning BP <strong style="color:${PALETTE.text};">148/92.</strong> Day 9: <strong style="color:${PALETTE.text};">143/88.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock("Her cardiologist's response", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">She brought 14 days of morning cuff readings to her next appointment, plus the one-page protocol from her quiz results. Her cardiologist asked one question: <em>"You sure you don't want to keep going on the medication?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Marlene answered: <em>"I do want to keep going. Just at a lower dose. The 10mg got me to 154. The protocol got me to 143. Can we try 5mg and re-check in 30 days?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">He wrote the lower script.</p>
    `)}
    ${p(`<strong style="color:${PALETTE.text};">Doctor-cleared independence.</strong> Not "natural instead of." Natural <em>alongside</em> — until the alongside-work moves the numbers enough that the medication can step down with the doctor's blessing.`, { margin: '0 0 28px' })}
    ${bigQuote("What didn't work for Marlene.")}
    ${p(`I'm careful with the success stories because they make the work look easier than it is. Here's what tripped her up in the first 90 days:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">Sunday cook-day fatigue.</strong> Two weeks in, she stopped doing the Sunday batch. Soup went back to canned. BP crept up 4 points in 10 days. Returning to the batch fixed it.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">Sleep got tighter, not easier.</strong> Moving bedtime from 12:30 to 11 PM took 6 weeks, not 6 days. She used the cortisol stack (ashwagandha + magnesium glycinate) for the bridge.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">First-month plateau at Day 14.</strong> Numbers stopped moving for 10 days. She wanted to quit. Day 24 they dropped another 4 points. Kidney recalibration is slow — Day 14 is the hardest day.</p>
    `)}
    ${p(`This is the realistic picture, not the testimonial picture. <strong style="color:${PALETTE.text};">Quieter numbers. Steadier mornings.</strong> But the path is bumpy and most people quit at Day 14. Don't.`, { margin: '0 0 28px' })}
    ${clayBlock('If you want this customized for YOUR case', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Marlene was on 1 medication. If you're on 3+, your protocol is more complex and the deprescribing path needs more careful sequencing. The free quiz is the fastest way to see which Pressure to work first.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COACHING_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the free BP quiz →</a></p>
    `)}
    ${ctaButton(COACHING_URL, 'Take the free BP quiz →')}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If you've followed this newsletter for a while, you already know more about the BP Triangle than 90% of cardiology patients in the US. Forward this to one person who needs it. That's how this changes.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today I unpack what Marlene actually did. Names changed, numbers are real.

BASELINE:
→ Age 52, six years on lisinopril 10mg
→ Morning BP averaging 154/96
→ A1c 5.9, slow weight gain, 3 PM crashes
→ Sleep onset 12:30 AM

Her quiz: SUGAR PRESSURE primary, STRESS PRESSURE secondary, PIPE PRESSURE tertiary.

THE THREE THINGS SHE CHANGED:

1. Store-bought bread → sprouted-grain (or none). Cleared 600mg sodium + insulin spike.
2. Weekday deli turkey → home-roasted night before. 700-900mg → 80mg. $50/month savings.
3. Canned soup → homemade Sunday batch. 800-1,200mg → 80-200mg.

Day 6: 148/92. Day 9: 143/88.

HER CARDIOLOGIST:
"You sure you don't want to keep going on the medication?"
Marlene: "I do. Just at a lower dose. The 10mg got me to 154. The protocol got me to 143. Can we try 5mg?"
He wrote the lower script.

DOCTOR-CLEARED INDEPENDENCE.

WHAT DIDN'T WORK:
→ Sunday cook-day fatigue. Stopped Week 2. BP crept up 4 points. Returning fixed it.
→ Sleep took 6 weeks, not 6 days. Used ashwagandha + magnesium glycinate as bridge.
→ Day 14 plateau. 10 days no movement. Day 24 dropped 4 more points. Don't quit.

IF YOU WANT THIS CUSTOMIZED:
Marlene was on 1 medication. If you're on 3+, the free BP quiz is the fastest way to see which Pressure to work first.
→ ${COACHING_URL}

Joel
RN, BraveWorks

P.S. Forward this to one person who needs it.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

