// _drip-emails.js — content + render layer for the 7-Day BPQuiz Onboarding Funnel.
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, email, optInToken? }
//
// renderEmail(day, ctx) → { from, replyTo, subject, html, text, headers, tags }
// drop into Resend's emails.send().
//
// Days 8-30 will be added when the opt-in gate proves out engagement.
//
// Author: Joel Polley, RN, BraveWorks Health.

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── URLs (single source of truth) ────────────────────────────────────
// Active product Stripe links — verified live 2026-05-14, mirrors
// purchase-confirmation.js + products.json. Ladder positions:
//   $17  → entry (Days 1-3)
//   $47  → upgrade (Days 5-6)
//   $97  → Monday live + Skool VIP (Day 10)
//   /coaching → 90-Day Freedom Sprint application (Days 8 + 12)
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

// Day 7 opt-in URL — token is generated per send via signOptInToken (see continue.js)
export const optInUrl = (token) => `${SITE_URL}/api/continue?t=${token}`;

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

// ─── Shared building blocks ───────────────────────────────────────────
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

function bonusStackBox() {
  return `<div style="background:${PALETTE.outerBg};border-radius:12px;padding:22px 24px;margin:0 0 22px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${PALETTE.text};margin:0 0 14px;font-weight:600;">What's actually in the kit:</div>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The 10-Day BP Reset Daily Plan</strong> — every step, day by day <span style="color:#999;">($27)</span></p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">Joel's 7 Most-Trusted BP Herbs</strong> with safe dosing ranges <span style="color:#999;">($27)</span></p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The Cardiologist Conversation Script</strong> <span style="color:#999;">($17)</span></p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The 4 Lifestyle Levers Cheat Sheet</strong> <span style="color:#999;">($17)</span></p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">→ <strong style="color:${PALETTE.text};">Cook For Life Cookbook</strong> — plant-based recipes <span style="color:#999;">($17)</span></p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.text};margin:0;border-top:1px solid ${PALETTE.border};padding-top:12px;"><strong>$105 of nurse-vetted protocol. $17 today.</strong></p>
  </div>`;
}

const guaranteeBlock = clayBlock(
  'The 7-Day Refund Promise',
  `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Read every email this week. If you haven't seen your numbers move by Day 7 with honest effort, hit reply with the word <strong style="color:${PALETTE.text};">"refund"</strong> — I'll send your $17 back, no questions, kit yours to keep.</p>`
);

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

function footerSecondaryCTAs() {
  return `<div style="margin-top:24px;padding:20px 22px;background:${PALETTE.outerBg};border-radius:10px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:12px;">Two more ways to follow along</div>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 10px;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Join the Skool community</a> &nbsp;<span style="color:#999;">— "How to Be Your Own Doctor"</span></p>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">→ <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on YouTube</a> &nbsp;<span style="color:#999;">— deeper teachings, weekly</span></p>
  </div>`;
}

// 2026-05-15: Rotated daily upsell footer — pitches a different ladder rung
// each day so readers see the full path ($17 KIT → $47 RESET KIT → $97
// CHALLENGE → $1,997 SPRINT) over the first week without feeling sold to
// twice on the same product. Day 7 gets NO upsellFooter — the opt-in
// button needs the spotlight there. Every 7 days from there (14, 21, 28,
// 30) the Sprint application is the pitch.
function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

// ─── DAY 1 ────────────────────────────────────────────────────────────
const day1 = {
  subject: '3 lies your doctor told you about your BP',
  subjectB: 'The first lie cost me three patients',
  preview: 'The first one cost me three patients. Here\'s the truth.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`If you're new here, welcome. I'm Joel — RN, naturopath, founder of BraveWorks.`)}
    ${p(`If you've been on this list a while: you're about to see something different.`)}
    ${p(`Starting today, I'm sending one email a day for the next 30 days. There's a reason.`)}
    ${bigQuote('Three lies.')}
    ${p(`Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.`)}
    ${p(`You've heard all three. You probably believe at least one of them right now. They came from your doctor, your pharmacist, your favorite YouTube health channel — all of them well-meaning, all of them passing on what they were taught.`)}
    ${p(`I was taught the same things in nursing school.`)}
    ${p(`Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Here's what's going to happen.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Tomorrow, I crack lie #1 — the one almost every doctor still repeats.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Day 9, lie #2 — and this one is the most personal.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Day 17, lie #3 — and once you see it, you can't look at your prescription the same way again.</p>
    `)}
    ${p(`Between those three, I'll show you exactly what your body is actually asking for.`)}
    ${p(`Twenty-nine more emails. One a day. Same time, same place.`)}
    ${p(`If you do the small things I ask along the way, your numbers should be measurably lower by Day 30. That's not a maybe. That's the protocol working the way it always does when someone shows up.`, { margin: '0 0 18px' })}
    ${p(`See you in the morning.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.`)}
    ${upsellFooter({
      kicker: 'Want the patient protocol now?',
      body: 'Marlene\'s exact 3-input reset (you\'ll meet her on Day 3) lives inside the $17 BP Reset Kit — the same document I hand patients on their way out of the hospital. Twenty years of ICU experience condensed into one PDF you can read tonight.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

If you're new here, welcome. I'm Joel — RN, naturopath, founder of BraveWorks.

If you've been on this list a while: you're about to see something different.

Starting today, I'm sending one email a day for the next 30 days. There's a reason.

THREE LIES.

Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives.

You've heard all three. You probably believe at least one of them right now.

I was taught the same things in nursing school. Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.

Tomorrow, I crack lie #1.
Day 9, lie #2.
Day 17, lie #3.

29 more emails. One a day.

See you in the morning.

Joel
RN, BraveWorks

P.S. If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.

—
Want the patient protocol now?
Marlene's exact 3-input reset (you'll meet her on Day 3) lives inside the $17 BP Reset Kit — the same document I hand patients on their way out of the hospital.
→ ${KIT_URL}

—
Two more ways to follow along:
→ Join the Skool community: ${SKOOL_URL}
→ Subscribe on YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 2 — Lie #1 (Salt myth) ───────────────────────────────────────
const day2 = {
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
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Pick THREE foods you eat regularly. Look at the sodium count on the label. Just look. Don't change anything yet — I'll teach you the swap tomorrow.</p>
    `)}
    ${p(`Some of you are about to find a number that explains everything.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — Marlene. 52 years old. Eleven systolic points off her top number in nine days. No new pill. I'll tell you exactly what she did.`)}
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

TODAY'S ASK: Pick three foods you eat regularly. Look at the sodium count on the label. Don't change anything yet.

Joel
RN, BraveWorks

P.S. Tomorrow — Marlene. 52 years old. Eleven systolic points off her top number in nine days. No new pill. I'll tell you exactly what she did.

—
When you're ready for the live room:
The BP Triangle Challenge — Monday-night live calls, daily protocol, 1,100+ members. New cohort every two weeks. $97.
→ ${CHALLENGE_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 3 — Marlene composite story ──────────────────────────────────
const day3 = {
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
    ${p(`Then she joined the BP Reset Kit. We talked about hidden sodium — same email you read yesterday. She did the label exercise.`)}
    ${p(`Day 9 cuff reading: <strong>143/88.</strong>`)}
    ${p(`That's 11 systolic points. 8 diastolic. From a person who'd been told her BP was "as good as it was going to get."`)}
    ${p(`She didn't add a supplement. She didn't start a workout program. She didn't fast.`)}
    ${p(`She read three labels. She swapped store-bought bread for a homemade alternative. She stopped eating deli turkey on weekdays. She switched her favorite canned soup for a low-sodium homemade version her granddaughter loves.`)}
    ${bigQuote('Three swaps. Eleven points.')}
    ${p(`Tomorrow I'm going to tell you the real reason this worked — and it's not what you think. It's not "less sodium = lower BP." It's something the medical establishment has known about for forty years and somehow forgot to tell you.`, { margin: '0 0 28px' })}
    ${p(`Marlene used The Cardiologist Conversation Script (inside the kit) at her next appointment. Her doctor reduced her lisinopril dose. By Day 30 she was off the cough side effect that drove her to me in the first place.`)}
    ${p(`Tomorrow — the second lie. The one that lets most adults off the hook for twenty years.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you took one input from Marlene's story and tried it today, which one would you pick? Reply with one word — I'm curious.`)}
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

Day 9: 143/88. Eleven systolic points. Eight diastolic.

No supplement. No workout. No fast. She swapped three foods — bread, deli turkey, canned soup.

Three swaps. Eleven points.

Tomorrow — the second lie. The one that lets most adults off the hook for twenty years.

Joel
RN, BraveWorks

P.S. If you took one input from Marlene's story and tried it today, which one would you pick? Reply with one word — I'm curious.

—
Marlene's exact 3-day reset:
Page 4 of the BP Reset Kit. $17. Eighteen pages. The same document I hand patients.
→ ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 4 — K:Na ratio mechanism ─────────────────────────────────────
const day4 = {
  subject: 'The hidden ratio your kidneys are reading',
  subjectB: 'The 3:1 number your doctor never told you',
  preview: 'Forty years of research. Not in any pamphlet I\'ve ever seen.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Yesterday I told you Marlene dropped 11 points in 9 days. Not from salt reduction alone — from something else.`)}
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
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Add ONE potassium-rich food to your day. Just one.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A medium baked potato (with skin): 925mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A cup of cooked spinach: 840mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— An avocado: 700mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">— A cup of cooked white beans: 1,000mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 12px;">— A banana: 420mg</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Pick one. Add it to today's lunch or dinner. Don't replace anything — just add.</p>
    `)}
    ${p(`Tomorrow — three "healthy" foods you eat every week that spike your numbers harder than candy. You won't believe the second one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`I made a 12-min YouTube video that walks the 3:1 ratio at the grocery store with my own basket. <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};font-weight:600;">Watch on YouTube →</a> If you're on a potassium-sparing diuretic (like spironolactone or amiloride), check with your prescriber before loading up.`)}
    ${upsellFooter({
      kicker: 'The next rung up',
      body: 'If you already have the $17 starter kit, the natural upgrade is the $47 BP Reset Kit — the full 30-day Reset Challenge, the Graduation phase (weeks 2-4), the complete herb formulary with safe dosing, and the printable BP tracker. Same protocol, full system.',
      ctaLabel: 'Upgrade for $47',
      ctaUrl: RESET_KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Yesterday: Marlene dropped 11 points in 9 days. Not from salt alone — from something else.

Your blood pressure isn't governed by sodium. It's governed by the RATIO of sodium to potassium.

Ideal: 1 sodium : 3 potassium.
American diet: 4 sodium : 1 potassium.

That's a 12-fold deviation. It's why "just cut salt" almost never works.

The Intersalt Study (52 populations, 10,000+ people) showed it. Cochrane Review 2013 confirmed it. American Heart Association lists potassium as a top BP lever.

Most adults get under 2,000mg/day. Body needs ~4,700mg.

TODAY'S ASK: Add ONE potassium-rich food to your day. Just one.
— Baked potato w/ skin: 925mg
— Cup cooked spinach: 840mg
— Avocado: 700mg
— Cup cooked white beans: 1,000mg
— Banana: 420mg

Pick one. Add it. Don't replace anything.

Tomorrow — three "healthy" foods that spike your numbers harder than candy.

Joel
RN, BraveWorks

P.S. On a potassium-sparing diuretic? Check with your prescriber first.

—
The next rung up:
The $47 BP Reset Kit adds the full 30-day plan, the Graduation phase (weeks 2-4), the complete herb formulary, and the printable BP tracker.
→ ${RESET_KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 5 — Sugar elimination ────────────────────────────────────────
const day5 = {
  subject: '3 "savory" foods spiking your numbers harder than candy',
  subjectB: 'Bread. Broth. Sauce. Each one a multiplier.',
  preview: 'Bread. Broth. Sauce. Each one a hidden multiplier.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick recap.`)}
    ${p(`Day 2: hidden sodium is 85% of your sodium load.<br>Day 4: potassium is the partner mineral that lets the system rebalance.`)}
    ${bigQuote('Today: sugar.')}
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
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Pick ONE of those three categories — bread, cereal, or refined-flour snacks — and don't eat it today. Just one day. One category.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you usually eat bread at lunch, swap it for a romaine wrap or skip it entirely and add an extra protein. If cereal at breakfast, swap it for two eggs and an avocado.</p>
    `)}
    ${p(`Tomorrow — why your numbers haven't moved even though you're doing everything right. The hidden corner most cardiologists never measure.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tonight, before bed, look at the sodium milligrams on three things in your kitchen. Tomorrow's email goes deeper if you do this one piece of homework.`)}
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
Day 2: hidden sodium is 85% of your load.
Day 4: potassium is the partner mineral.

Today: sugar.

Sugar — and refined carbs that act like sugar — spike insulin. Insulin is a vasoconstrictor. Vessels narrow. Kidneys retain sodium. Sympathetic tone climbs. BP rises.

Three ways your insulin spikes without anything sweet:
1. White bread/bagels/English muffins (5 teaspoons of sugar equivalent)
2. Boxed cereal (14g sugar per 2 cups — same as a donut)
3. Crackers, pretzels, rice cakes (act identically to table sugar)

TODAY'S ASK: Skip ONE of those categories today. Just one. One day.

Tomorrow — why your numbers haven't moved even though you're doing everything right. The hidden corner most cardiologists never measure.

Joel
RN, BraveWorks

P.S. Tonight, before bed, look at the sodium milligrams on three things in your kitchen. Tomorrow's email goes deeper if you do this one piece of homework.

—
When group accountability becomes the missing piece:
The 30-Day BP Triangle Challenge. Monday-night live calls. Group accountability. $97.
→ ${CHALLENGE_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 6 — Pre-empt the valley ──────────────────────────────────────
const day6 = {
  subject: 'Why your numbers haven\'t moved (the hidden corner)',
  subjectB: 'You\'ve been working on one corner. There are three.',
  preview: 'You\'ve been working on one corner. There are three.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Five days in. Time for an honest check.`)}
    ${p(`Some of you are seeing your numbers move. Maybe 3 points, maybe 8 — Marlene's 11 won't be common in week 1, but movement should be happening.`)}
    ${p(`Some of you are seeing nothing.`)}
    ${p(`I want to talk to that second group, because Day 6 is when most people I've worked with quietly decide it's not going to work for them. They don't unsubscribe. They don't write back. They just stop reading.`)}
    ${p(`If that's you, please don't stop yet. <strong>Three reasons your numbers may be stuck:</strong>`)}
    ${p(`<strong>1. You haven't actually swapped — you've added.</strong> You added a banana and you swapped your salt shaker for nothing. That's a half-measure. The body responds to ratio shifts, not additions. Re-read Day 2 — pick ONE high-sodium food and replace it. Don't just supplement around it.`)}
    ${p(`<strong>2. You're cuffing wrong.</strong> Most home BP cuffs read 8-15 points high if you take your reading after coffee, in a chair without back support, with your arm hanging at your side, or with your legs crossed. If your last reading is from any of those conditions, it's not your real number. Tomorrow I'll give you the protocol I use with every BraveWorks member — same conditions, same time, same arm, twice a day.`)}
    ${p(`<strong>3. You're a slower responder.</strong> Some bodies start moving in 48 hours. Some need 14-21 days. That's biology, not failure. The body has to recalibrate baroreceptors and reset kidney sodium handling — for some that's a 3-week process. The eliminations you're doing this week are doing their work whether or not the cuff has caught up yet.`)}
    ${bigQuote('Don\'t quit on Day 7. Day 7 is when most quitters quit.')}
    ${p(`Tomorrow I'll show you the three shifts already happening in your body right now. You may not feel them yet. And there's a button at the bottom of tomorrow's email.`)}
    ${p(`Click it if you want to keep going. Days 8 through 30 cover the herbs that work like your meds, the water cure your grandmother knew, the breathing exercise that flips your nervous system in 60 seconds, and the gratitude practice that lowers cortisol faster than any supplement.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Which of the Three Pressures do you think is running yours? Reply with one word: Pipes, Sugar, or Stress. I'll read every one.`)}
    ${upsellFooter({
      kicker: 'If two Pressures are running yours',
      body: 'If you want both a Pipe Pressure AND a Stress Pressure protocol with a registered nurse beside you for ninety days — the 90-Day Sprint is open for the founding cohort until Sunday at 11:59 PM ET. 5 slots. Application only. After Sunday, the price triples.',
      ctaLabel: 'Read the offer',
      ctaUrl: COACHING_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Five days in. Honest check.

Some of you are seeing movement. Some are seeing nothing.

For the second group: Day 6 is when most quietly decide it's not going to work. They don't unsubscribe. They just stop reading.

Don't stop yet. Three reasons your numbers may be stuck:

1. You added but didn't swap. The body responds to ratio shifts, not additions. Re-read Day 2.

2. You're cuffing wrong. After coffee, no back support, arm hanging, legs crossed — all read 8-15 points high. Tomorrow: the protocol.

3. You're a slow responder. 14-21 days is normal biology. Eliminations are working underneath.

Don't quit on Day 7. Day 7 is when most quitters quit.

Tomorrow I show you the three shifts already happening in your body. There's a button at the bottom — click it if you want Days 8-30 (herbs, water cure, breathing, gratitude — the full protocol).

Joel
RN, BraveWorks

P.S. Which of the Three Pressures do you think is running yours? Reply with one word: Pipes, Sugar, or Stress. I read every one.

—
If two corners are running yours:
The 90-Day Sprint is open for the founding cohort until Sunday at 11:59 PM ET. 5 slots. Application only. After Sunday, the price triples.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — THE OPT-IN GATE ─────────────────────────────────────────
// Note: htmlBody/textBody take an extra ctx field { optInToken } generated
// at send time by drip-cron.js (HMAC-signed against email).
const day7 = {
  subject: 'Three shifts already happening in your body',
  subjectB: 'Day 7. What\'s behind the next 23 days.',
  preview: 'And what the next 23 days unlock — if you want them.',
  htmlBody: ({ firstName, optInToken }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`We've been together seven days. Three things are already happening:`)}
    ${p(`<strong>One</strong> — your kidneys are reading a different sodium-to-potassium ratio if you added one of those three foods.`)}
    ${p(`<strong>Two</strong> — your gene expression is shifting. Hundreds of protective genes are responding to the inputs you're feeding them.`)}
    ${p(`<strong>Three</strong> — you know which corner is yours. That's the diagnostic step most adults never reach.`, { margin: '0 0 28px' })}
    ${bigQuote('Now you have a choice.')}
    ${p(`If you stop here, you have enough to move your top number 5-8 points over the next month. That's real.`)}
    ${p(`If you want the rest of it — <strong>twenty-three more days that cover what the foundation can't</strong> — click the button below. Here's what's behind it:`)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">Days 8–14 · The Herbs</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The four herbs that work on the same biological pathways as your BP medications — without the prescription. Garlic. Hibiscus. Hawthorn berry. Magnesium glycinate. How they work. How much. How to layer them safely.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">Days 15–21 · The Water Cure</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The hydrotherapy tradition your great-grandmother knew. Contrast showers that reset your nervous system in 60 seconds. The Kellogg footbath. The cold liver compress. The Eight Laws of Health your doctor never learned.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">Days 22–28 · The Hidden Corner Fix</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">The deep-breathing pattern that drops cortisol faster than any pill. The twenty-minute walk in nature that beats every supplement. The seventh-day rest your nervous system is begging for. The gratitude practice with the studies behind it. Morning sunlight as your free cortisol reset.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin:0 0 6px;">Days 29–30 · Where You Go From Here</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">A full graduation. The roadmap forward. And one quiet invitation, only if you want it.</p>
    `)}
    ${p(`If that's the trail you want to walk — click below.`, { margin: '0 0 24px' })}
    ${ctaButton(optInUrl(optInToken), 'Yes — send me Days 8–30 →')}
    ${p(`<span style="color:#999;font-size:14px;">(Click takes 2 seconds. No form. No payment. Just a yes.)</span>`, { margin: '0 0 24px' })}
    ${p(`If you'd rather stop here, you'll never hear from me again unless you reach out. No hard feelings. The seven days were yours to keep.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`The button stays alive for 48 hours. After that, the door closes for this round.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, optInToken }) => `Hi ${firstName || 'there'},

We've been together seven days. Three things are already happening:

One — your kidneys are reading a different sodium-to-potassium ratio if you added one of those three foods.

Two — your gene expression is shifting. Hundreds of protective genes are responding to the inputs you're feeding them.

Three — you know which corner is yours. That's the diagnostic step most adults never reach.

NOW YOU HAVE A CHOICE.

If you stop here, you have enough to move your top number 5-8 points over the next month. That's real.

If you want the rest of it — twenty-three more days that cover what the foundation can't — click the button below. Here's what's behind it:

DAYS 8–14 · THE HERBS
The four herbs that work on the same biological pathways as your BP medications — without the prescription. Garlic. Hibiscus. Hawthorn berry. Magnesium glycinate. How they work. How much. How to layer them safely.

DAYS 15–21 · THE WATER CURE
The hydrotherapy tradition your great-grandmother knew. Contrast showers that reset your nervous system in 60 seconds. The Kellogg footbath. The cold liver compress. The Eight Laws of Health your doctor never learned.

DAYS 22–28 · THE HIDDEN CORNER FIX
The deep-breathing pattern that drops cortisol faster than any pill. The twenty-minute walk in nature that beats every supplement. The seventh-day rest your nervous system is begging for. The gratitude practice with the studies behind it. Morning sunlight as your free cortisol reset.

DAYS 29–30 · WHERE YOU GO FROM HERE
A full graduation. The roadmap forward. And one quiet invitation, only if you want it.

If that's the trail you want to walk — click below.

→ YES, send me Days 8-30: ${optInUrl(optInToken)}

(Click takes 2 seconds. No form. No payment. Just a yes.)

If you'd rather stop here, you'll never hear from me again unless you reach out. No hard feelings. The seven days were yours to keep.

Joel
RN, BraveWorks

P.S. The button stays alive for 48 hours. After that, the door closes for this round.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 8 — POST-OPT-IN: BP TRIANGLE + $297 DIAGNOSTIC PITCH ────────
// Fires the morning after Day 7 opt-in. Audience is self-selected — these
// are the most engaged subs (clicked the Day 7 button to continue).
//
// 2026-05-18 rewrite: pitches the $297 BP Triangle Diagnostic Session
// at /coaching (the new mid-tier direct-checkout product) instead of
// the legacy $1,297 1:1 application. Per Joel's funnel-expansion call:
// the diagnostic is the bridge between $17 Kit and $1,997 Sprint. Sprint
// is NEVER mentioned publicly — only revealed inside the post-purchase
// diagnostic→Sprint email sequence.
//
// Kit buyers reading this Day 8 will ALSO get the Day 10/14/17 buyer-
// upsell-cron pitch at $280 (their $17 credit applied). That's the
// intended dual-segment behavior — Day 8 is the warmer-than-cold pitch
// to all opted-in subs; the buyer-upsell-cron is the buyer-specific
// follow-up with credit math.
const APPLY_URL = `${SITE_URL}/coaching`;

const day8 = {
  subject: 'The 60-minute conversation that ends the guessing',
  subjectB: 'Day 8 — your diagnostic invitation',
  preview: 'One Zoom. Your loudest Pressure named. A written 30-day protocol that\'s yours.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You opted in. Means you read all 7 days, found something useful, and want the deeper arc. I respect that.`)}
    ${p(`Before I keep going on the daily emails, I want to put one direct option in front of you — because some of you don't need another 22 days of education. You need a sixty-minute call with a real nurse looking at your real situation.`, { margin: '0 0 32px' })}
    ${bigQuote('Which of the Three Pressures is yours?')}
    ${p(`If you've followed along this week, you've seen me reference three Pressures more than once. They're how I think about every BP case I see:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Pipe Pressure (vascular).</strong> The pipes got stiff. Arterial stiffness, oxidative stress, low NO. You see the numbers. Your doctor sees the numbers. But nobody's fixing the inputs.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Stress Pressure (cortisol).</strong> The switch stuck on. Wired-tired. Can't sleep deep. Midsection weight gain. Cortisol pulls BP up like a pulley. Most cardiologists don't measure this.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Sugar Pressure (insulin).</strong> Sugar stays high. A1C creeping. 3 PM crashes. Can't lose the weight. Insulin is vasoconstrictive — high BP and high A1C are the same disease wearing different shirts.</p>
    `)}
    ${p(`Most people have ONE Pressure that's the lead domino. Calm that one and the other two fall in line. The 7-day arc gave you the foundation. The next 22 days teach you to identify and rebuild your loudest Pressure systematically.`)}
    ${p(`That's the work for most people. <strong>And it works.</strong>`, { margin: '0 0 32px' })}
    ${clayBlock("Don't know your dominant Pressure yet?", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The 90-second BP Triangle Quiz routes you to one of the Three Pressures — Stress, Sugar, or Pipes — and returns the first move for your specific type.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SITE_URL}/quiz" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the BP Triangle Quiz →</a></p>
    `)}
    ${clayBlock('If this is you, the next 22 emails won\'t be enough', `
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">You're on <strong style="color:${PALETTE.text};">4 or more medications.</strong> Maybe more. BP, statin, beta-blocker, ARB, possibly metformin, possibly a thyroid drug. Maybe a benzo or a sleep aid layered on top.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your readings are still high. Or they\'re "controlled" but you feel like a ghost of the person you were 10 years ago. Side effects you can\'t pin to one drug because they could be coming from any of them.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your doctor\'s answer is "another medication." Or "let\'s adjust the dose." Or "you\'ll just have to live with it."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">If that\'s you, daily emails aren\'t enough. You need someone in your corner who can read your full picture in one sitting, name your loudest Pressure, and hand you a written protocol that\'s yours — not the general kit.</strong></p>
    `)}
    ${bigQuote('The BP Triangle Diagnostic Session.')}
    ${p(`A single 60-minute Zoom with me. Bring your home BP log (even three readings from this week is enough), your prescription list, your supplements, your labs if you have any. I look at your full picture and name your loudest Pressure — Pipes, Stress, or Sugar.`)}
    ${p(`You walk out with:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your loudest Pressure, named (with the second-loudest noted too)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ A written 30-day personalized protocol — yours, not generic</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ A clean one-page script to bring your doctor for the deprescribing conversation</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">30 days of follow-up email coaching</strong> — reply to me each Sunday with your numbers and I adjust as needed</p>
    `)}
    ${p(`It\'s <strong>$297</strong>. One time. No upsell on the call.`)}
    ${p(`Honest math on availability: I take 10 of these calls a month. <strong>6 slots open this week</strong>; when they're gone, next openings are roughly two weeks out.`, { margin: '0 0 32px' })}
    ${ctaButton(APPLY_URL, 'Book the diagnostic ($297) →')}
    ${p(`<span style="color:#999;font-size:14px;">Already a Kit buyer? Your $17 credit applies — watch your inbox; a separate kit-credit pricing link is on its way over the next few days. Or reply "kit credit" and I'll send it now.</span>`, { margin: '0 0 28px' })}
    ${p(`<strong>If the diagnostic isn\'t for you</strong> — no problem. The next 22 days of emails are still coming. You\'ll get the deeper teach-throughs of each Pressure, the dosing protocols, the doctor-conversation scripts, and the cuff technique that catches what your provider\'s machine misses. Most people don\'t need a diagnostic. The daily protocols are enough.`)}
    ${p(`But if you\'re on 4+ meds, or you\'re tired of guessing, or you just want a real conversation with a 20-year ICU/ER nurse looking at YOUR situation — book it.`, { margin: '0 0 32px' })}
    ${joelSignoff()}
    ${psBox(`The diagnostic works regardless of which Pressure is yours. Stress Pressure, Sugar Pressure, or Pipes — same call, same depth, different protocol output. The work is Pressure-specific; the door is the same.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You opted in — you want the deeper arc. Before I keep going on the daily emails, one direct option for the people who want more than education.

WHICH OF THE THREE PRESSURES IS YOURS?

1. PIPE PRESSURE (vascular) — The pipes got stiff. Arterial stiffness, low NO, oxidative stress.
2. STRESS PRESSURE (cortisol) — The switch stuck on. Wired-tired, can't sleep deep, midsection weight gain.
3. SUGAR PRESSURE (insulin) — Sugar stays high. A1C creeping, 3 PM crashes, can't drop the weight.

Most people have ONE Pressure that's the lead domino. The next 22 days teach you to identify and rebuild your loudest. That's the work for most people. And it works.

IF THIS IS YOU, THE NEXT 22 EMAILS WON'T BE ENOUGH:

You're on 4 or more medications. Your readings are still high — or "controlled" but you feel like a ghost. Side effects you can't pin to one drug. Your doctor's answer is "another medication."

If that's you, daily emails aren't enough. You need someone in your corner who can read your full picture in one sitting, name your loudest Pressure, and hand you a written protocol that's yours.

THE BP TRIANGLE DIAGNOSTIC SESSION

A single 60-minute Zoom with me. Bring your home BP log, your prescription list, supplements, any labs you have. I look at your full picture, name your loudest Pressure, and you walk out with:

→ Your loudest Pressure, named (with the second-loudest noted too)
→ A written 30-day personalized protocol — yours, not generic
→ A doctor-conversation script for the deprescribing talk
→ 30 days of follow-up email coaching — reply to me Sundays with numbers, I adjust

$297. One time. No upsell on the call.

Six slots open this week; when they're gone, next openings roughly two weeks out.

→ Book the diagnostic: ${APPLY_URL}

Already a Kit buyer? Your $17 credit applies — watch your inbox for a kit-credit pricing link in a few days, or reply "kit credit" and I'll send it now.

If the diagnostic isn't for you — no problem. The next 22 days of emails are coming. Most people don't need it; the daily protocols are enough.

But if you're on 4+ meds, or you're tired of guessing — book it.

Joel
RN, BraveWorks

P.S. The diagnostic works regardless of which Pressure is yours. Stress, Sugar, or Pipes — same call, same depth, different protocol output. The work is Pressure-specific; the door is the same.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 9 ────────────────────────────────────────────────────────────
// Lie #2 reveal (the "it's genetic" lie). Day 1 teased this as the "most
// personal" lie. Resolves the curiosity gap + introduces the CORTISOL
// corner of the BP Triangle Method explicitly.
const day9 = {
  subject: 'Lie #2 — "it\'s genetic, nothing I can do"',
  subjectB: 'The most personal lie about blood pressure',
  preview: 'Genes load the gun. Three other things pull the trigger.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Eight days ago I promised that today's email would reveal lie #2 — the most personal one.`)}
    ${p(`Here it is:`)}
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
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The free 90-second BP Triangle Quiz returns your dominant Pressure + the first move for your specific type. Built around the same diagnostic I use with 1:1 clients.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SITE_URL}/quiz" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Take the BP Triangle Quiz →</a></p>
    `)}
    ${p(`Tomorrow — the third corner. The one cardiologists never bring up. The one cutting your salt for a decade did nothing for.`, { margin: '0 0 24px' })}
    ${p(`Until then — my deepest Triangle walkthroughs are on YouTube. The cortisol corner gets a 14-min video that names every herb dose, the bedtime math, and the one supplement I refuse to use.`)}
    ${ctaButton(YOUTUBE_URL, 'Watch the Triangle deep-dive on YouTube →')}
    ${joelSignoff()}
    ${psBox(`Tomorrow we walk the third corner — the one cardiologists never measure. Stay with me.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Eight days ago I promised today would reveal lie #2 — the most personal one.

LIE #2: "My blood pressure is genetic. Nothing I can do about it."

GENES LOAD THE GUN. INPUTS PULL THE TRIGGER.

The same DNA your mother had — sat in a Japanese village in 1960 with the same code, never developed hypertension. Move it to suburban Ohio with 4,000mg of hidden sodium and 4 hours of sleep — boom. Same code, different inputs, different disease.

WHAT'S ACTUALLY INHERITED is a sensitivity to one of Three Pressures. Three Pressures of one loop. I call it the BP Triangle:

→ PIPE PRESSURE (vascular) — the pipes. Stiff arteries, low NO, K:Na imbalance.
→ STRESS PRESSURE (cortisol) — the switch stuck on. Clamps the vessels, retains sodium.
→ SUGAR PRESSURE (insulin) — sugar stays high. Insulin is a vasoconstrictor.

Most boomer-aged readers assume their dominant Pressure is Pipe — "high BP, stiff arteries, more lisinopril." But when I dig into their full history, the lead domino is almost always STRESS PRESSURE. And cortisol is the driver most cardiologists don't even measure.

This is why the genetics lie hurts so much. Your mother probably had the same cortisol-driven loop, never knew it, blamed her family tree, accepted a lifetime of pills as fate. It wasn't fate. It was an input nobody helped her change.

THE STRESS PRESSURE CORNER — TWO INTERVENTIONS THAT ACTUALLY WORK:

1. Ashwagandha (KSM-66, 300mg AM+PM). Chandrasekhar 2012 — 64 adults, 8 weeks. Salivary cortisol dropped 27.9% vs placebo. Cheapest single move you can make.

2. Asleep before 11 PM. Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset 10 PM = ~3 hours in that window. Sleep onset 1 AM = zero, even if you sleep until 8.

If your morning BP runs high and your blood sugar is roughly normal, Stress Pressure is almost certainly driving your numbers. Stress Pressure responds faster than Pipe Pressure — most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT.

AND not INSTEAD OF. Your meds stay. Your doctor watches the readings. The readings move because the inputs are moving.

DON'T KNOW WHICH PRESSURE IS YOURS?

Free 90-second BP Triangle Quiz returns your dominant Pressure + the first move for your type.
→ ${SITE_URL}/quiz

Tomorrow — the third Pressure. The one cardiologists never bring up. The one cutting your salt for a decade did nothing for.

Joel
RN, BraveWorks

P.S. Tomorrow we walk the third Pressure — the one cardiologists never measure.

→ Watch the Triangle deep-dive on YouTube: ${YOUTUBE_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 10 ───────────────────────────────────────────────────────────
// The third corner of the Triangle — blood sugar. The corner cardiologists
// never measure. Walk-after-meal + Anti-BP Plate as the practical levers.
const day10 = {
  subject: 'The corner cardiologists never measure',
  subjectB: 'Sugar raises BP harder than salt',
  preview: 'Three "savory" foods spike BP for 2-3 hours after every bite.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Yesterday — the Stress Pressure corner. Today — the third Pressure.`)}
    ${p(`This is the one I almost missed in my own practice for years. The one that explains why people who "cut their salt" for a decade watch their BP keep creeping up anyway.`, { margin: '0 0 28px' })}
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
    ${p(`Tomorrow — the single sentence I teach every patient. The one that takes the fear out of the protocol and makes the doctor conversation easy.`, { margin: '0 0 24px' })}
    ${p(`If you want my eyes on your numbers live — every Monday at 10 PM ET I unravel the Triangle on Zoom with the cohort. The <strong>$97 BP Triangle Challenge</strong> gets you a seat on every weekly call for 4 weeks, plus the Skool VIP room and the full bonus stack.`)}
    ${ctaButton(CHALLENGE_URL, 'Join the BP Triangle Challenge — $97 →')}
    ${joelSignoff()}
    ${psBox(`Quieter numbers. Steadier mornings. Doctor-cleared independence. Three phrases I'll repeat all month — because they're the actual outcomes worth aiming at, not "lower my BP by Tuesday."`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Yesterday — the Stress Pressure corner. Today — the third Pressure of the Triangle.

SUGAR PRESSURE RAISES BLOOD PRESSURE. HARDER THAN SALT DOES.

Most cardiologists don't measure A1c. They look at BP, cholesterol, maybe kidneys. Blood sugar doesn't even show up on their scorecard.

But every time your blood sugar spikes, insulin spikes. Insulin is a vasoconstrictor — it narrows your vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop.

Three Pressures of one loop. Calm one, the other two follow. FIX THE TRIANGLE, THE BP FIXES ITSELF.

THE THREE "SAVORY" FOODS THAT SPIKE BP HARDER THAN CANDY:

→ White bread / bagels. Hits like 5 teaspoons of pure sugar.
→ Boxed cereal. 30-50% sugar by weight. Same insulin hit as a glazed donut.
→ Crackers, pretzels, rice cakes. Refined starch behaves like sugar — the body doesn't distinguish.

If you cut your salt and your BP didn't move, this is almost always why. Blood sugar is the silent corner.

TWO MOVES THAT WORK WITHOUT WILLPOWER:

1. The 10-minute walk inside 30 minutes of eating. Muscles pull glucose out without insulin. Multiple meta-analyses show 30-40% reduction in the post-meal glucose curve. Walk to the mailbox. That's enough.

2. The Anti-BP Plate. Half plate non-starchy veg. Palm of protein. Thumb of fat. Small carb LAST. Order matters more than calories. Same plate, carbs at the end, 30-40% smaller glucose spike.

Pills manage output. Protocol fixes input. The protocol for this corner is two behaviors. Both free. Both 14 days to start moving morning numbers.

FIND OUT IF BLOOD SUGAR IS YOUR CORNER:
→ ${SITE_URL}/quiz

Tomorrow — the single sentence I teach every patient. The one that takes the fear out of the protocol and makes the doctor conversation easy.

Joel
RN, BraveWorks

→ Want me on your call? The $97 BP Triangle Challenge: ${CHALLENGE_URL}
Mondays at 10 PM ET live with me. 4 weeks of coaching + Skool VIP + the full bonus stack.

P.S. Quieter numbers. Steadier mornings. Doctor-cleared independence. Three phrases I'll repeat all month — because they're the actual outcomes worth aiming at, not "lower my BP by Tuesday."

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 11 ───────────────────────────────────────────────────────────
// The catechism essay — "Pills manage output. Protocol fixes input."
// Single most important sentence Joel teaches. Reframes the meds-vs-natural
// false choice. AND not INSTEAD OF.
const day11 = {
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
    ${p(`This is the second sentence I write down. The protocol you're learning over 30 days isn't replacing your medication. <strong style="color:${PALETTE.text};">It's running underneath it.</strong>`)}
    ${p(`Your doctor watches the readings. Your readings drop because the inputs are moving. At some point — usually 60 to 90 days in — your doctor says "your numbers look good, let's try lowering this dose." That's the moment you've been working toward.`)}
    ${p(`Never around your doctor. Always with them. <strong style="color:${PALETTE.text};">Doctor-cleared independence.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock('How to bring this to your next appointment', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Three sentences you can say verbatim. They keep your doctor as a partner, not an obstacle:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">1. <em>"I'm running a nurse-built natural protocol alongside my medication. Can we cuff weekly for the next 8 weeks so we have data?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">2. <em>"If my morning average drops 8+ mmHg sustained for 4 weeks, can we talk about lowering the dose at that point?"</em></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">3. <em>"Here's the protocol on one page — I'd like it in my chart so you have the full picture."</em></p>
    `)}
    ${p(`Most doctors say yes. Some don't. If yours doesn't, that's information — and we can talk about second opinions another time. <strong style="color:${PALETTE.text};">The goal is not to fight your doctor. The goal is to do this work with their blessing and watch them be the one who says "let's lower the dose."</strong>`, { margin: '0 0 28px' })}
    ${p(`Tomorrow — Marlene. Eleven points in nine days. Three swaps. No new pill. The most-asked-about case in this list.`, { margin: '0 0 24px' })}
    ${p(`If you're not in the community yet, join the free Skool room — "How to Be Your Own Doctor." It's where the AND-not-INSTEAD-OF women trade weekly numbers, food swaps, and doctor-conversation wins.`)}
    ${ctaButton(SKOOL_URL, 'Join the free Skool community →')}
    ${joelSignoff()}
    ${psBox(`If this email helped a sentence land — forward it to the friend who's about to start another medication and doesn't know there's an "AND" path. That's the most useful thing you can do with what I send you.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

When I sit with a new client, before anything else — herbs, dosing, sleep, food — I write one sentence on a piece of paper and slide it across the desk.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT.

Eight words. Most clients tape it to the fridge.

Here's what it means:

YOUR MEDICATION DOES ONE THING WELL. It lowers the number on the cuff. That's what it was designed to do. That's what your doctor measures it by.

YOUR MEDICATION DOES NOT FIX WHAT'S MAKING THE NUMBER HIGH. Pipe Pressure (vascular stiffness), Stress Pressure (cortisol load), Sugar Pressure (insulin spike) — those keep grinding underneath the pill. Which is why most patients end up on a second pill in 3 years. Then a third in 5. Then a fourth by 65.

Pills manage the OUTPUT — the reading. Protocol fixes the INPUT — the loop that produced the reading.

The pills are fine. They're not the enemy. But by themselves they're a fingers-in-the-dam strategy. The dam keeps leaking because nobody's fixing the water pressure upstream.

AND NOT INSTEAD OF.

The protocol you're learning over 30 days isn't replacing your medication. It's running underneath it.

Your doctor watches the readings. Your readings drop because the inputs are moving. At some point — usually 60 to 90 days in — your doctor says "your numbers look good, let's try lowering this dose." That's the moment you've been working toward.

Never around your doctor. Always with them. Doctor-cleared independence.

HOW TO BRING THIS TO YOUR NEXT APPOINTMENT:

Three sentences you can say verbatim:

1. "I'm running a nurse-built natural protocol alongside my medication. Can we cuff weekly for the next 8 weeks so we have data?"

2. "If my morning average drops 8+ mmHg sustained for 4 weeks, can we talk about lowering the dose at that point?"

3. "Here's the protocol on one page — I'd like it in my chart."

Most doctors say yes. Some don't. If yours doesn't, that's information.

The goal is not to fight your doctor. The goal is to do this work with their blessing and watch them be the one who says "let's lower the dose."

Tomorrow — Marlene. Eleven points in nine days. Three swaps. No new pill.

Joel
RN, BraveWorks

→ Join the free Skool community: ${SKOOL_URL}
"How to Be Your Own Doctor" — where AND-not-INSTEAD-OF women trade weekly numbers and food swaps.

P.S. If this email helped a sentence land — forward it to the friend who's about to start another medication and doesn't know there's an "AND" path. That's the most useful thing you can do with what I send you.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 12 ───────────────────────────────────────────────────────────
// The Marlene case study — 11 points in 9 days. Pays off the curiosity loop
// opened on Day 3. Specific, named, falsifiable. Surfaces the 1:1 path
// gently — for buyers who want this kind of customization for their case.
const day12 = {
  subject: 'Marlene. 11 points. 9 days. No new pill.',
  subjectB: 'How my buyer dropped 11 systolic in 9 days',
  preview: 'Three food swaps. No new prescription. Doctor lowered her dose.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I told you about Marlene on Day 3. Today I unpack what she actually did — because almost every email I get back asks the same question:`)}
    ${bigQuote('"How exactly did she do it?"')}
    ${p(`Here's the full picture. Names changed, numbers are real.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">Day 1 baseline:</p>
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
    ${p(`That's it. Three swaps. No new supplement, no new workout, no new pill. Six days in: morning BP <strong style="color:${PALETTE.text};">148/92.</strong> Day 9: <strong style="color:${PALETTE.text};">143/88.</strong>`, { margin: '0 0 28px' })}
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
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Marlene was on 1 medication. If you're on 3+, your protocol is more complex and the deprescribing path needs more careful sequencing. That's what 1:1 is built for.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${APPLY_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Apply for 1:1 with Joel →</a></p>
    `)}
    ${p(`If you've followed 12 days of this and you're ready for me to walk YOUR numbers personally — not a course, not a community, the real 1:1 work — applications for the next coaching cohort are open. 90 days, weekly Zoom with me, Annie's hormone coaching biweekly, full supplement + diet audit, WhatsApp office hours, the works. Stack value $14,616; founding price is currently lower than regular. Reviewed every application personally.`, { margin: '0 0 24px' })}
    ${ctaButton(COACHING_URL, 'Apply for 1:1 coaching with Joel →')}
    ${joelSignoff()}
    ${psBox(`If you've followed the daily emails this far, you already know more about the BP Triangle than 90% of cardiology patients in the US. Forward this to one person who needs it. That's how this changes.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I told you about Marlene on Day 3. Today I unpack what she actually did — because almost every email I get back asks: "How exactly did she do it?"

Names changed, numbers are real.

DAY 1 BASELINE:
→ Age 52, six years on lisinopril 10mg
→ Morning BP averaging 154/96 — "controlled" but creeping
→ A1c 5.9 (pre-diabetic), slow morning weight gain, 3 PM crashes
→ Sleep onset 12:30 AM most nights

When she took my quiz, her Triangle came back: SUGAR PRESSURE primary, STRESS PRESSURE secondary, PIPE PRESSURE tertiary. Common pattern in stage-1 hypertension that won't budge on standard pills.

THE THREE THINGS SHE CHANGED:

1. Store-bought bread → sprouted-grain bread (or none). Two slices a day cleared 600mg sodium and a major insulin spike.

2. Weekday deli turkey → home-roasted night before. 700-900mg per lunch dropped to 80mg. $50/month savings.

3. Canned soup → homemade Sunday batch. 800-1,200mg per cup dropped to 80-200mg. Eight portions in one Sunday cook.

Three swaps. No new supplement, no new workout, no new pill. Day 6: BP 148/92. Day 9: 143/88.

HER CARDIOLOGIST:
She brought 14 days of morning readings to her appointment, plus her one-page quiz protocol. He asked: "You sure you don't want to keep going on the medication?"

She said: "I do want to keep going. Just at a lower dose. The 10mg got me to 154. The protocol got me to 143. Can we try 5mg and re-check in 30 days?"

He wrote the lower script.

DOCTOR-CLEARED INDEPENDENCE. Not "natural instead of." Natural ALONGSIDE — until the work moves the numbers enough that the medication can step down with the doctor's blessing.

WHAT DIDN'T WORK (the realistic picture):

→ Sunday cook-day fatigue. Stopped Week 2. BP crept up 4 points. Returning to the batch fixed it.
→ Sleep got tighter, not easier. Moving bedtime 12:30→11 PM took 6 weeks, not 6 days. She used ashwagandha + magnesium glycinate as the bridge.
→ First-month plateau at Day 14. Numbers stopped moving for 10 days. She wanted to quit. Day 24 they dropped another 4 points. Kidney recalibration is slow — Day 14 is the hardest day. Don't quit.

Quieter numbers. Steadier mornings. The path is bumpy. Most people quit at Day 14. Don't.

IF YOU WANT THIS CUSTOMIZED FOR YOUR CASE:

Marlene was on 1 medication. If you're on 3+, your protocol is more complex and the deprescribing path needs more careful sequencing. That's what 1:1 is for.
→ Apply: ${APPLY_URL}

Tomorrow — the foundation everything sits on. The pillars that make every protocol work.

Joel
RN, BraveWorks

P.S. If you've followed this far, you already know more about the BP Triangle than 90% of cardiology patients in the US. Forward this to one person who needs it.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── Day map ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════
// DAYS 13–30 — EXTENDED ARC (authored 2026-05-18)
// Tight single-idea days for opted-in subscribers + buyers past Day 12.
// Each is ~500-700 words; the existing 1-12 are heavier on mechanism
// because that's where the framework gets installed. By Day 13 the
// framework is established — these days teach ONE protocol input per
// day with a brief mechanism note + clear next step + rotated CTA.
//
// Upsell footer rotation (per-day-strategic, not random):
//   Kit ($17)        → days 14, 17, 22  (mechanism days; entry-point pitch)
//   Reset Kit ($47)  → days 13, 19, 24, 30  (extended bonus pitch)
//   Challenge ($97)  → days 16, 21, 26  (community + 30-day pitch)
//   Diagnostic ($297)→ days 15, 18, 20, 23, 25, 27, 28, 29  (highest-leverage
//                       days, the ones where a buyer can self-identify as
//                       wanting personalized work)
// ═════════════════════════════════════════════════════════════════════

const day13 = {
  subject: 'Week 2 starts now — here\'s your map for the next 17 days',
  subjectB: 'Day 13 — the extended arc preview',
  preview: 'Foundation week is done. Now we build the protocol layer by layer.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Welcome to Week 2.`)}
    ${p(`The first seven days were foundation — the three Pressures, the lies about BP, the dosing-vs-pill reframe. By now you know the framework.`, { margin: '0 0 28px' })}
    ${bigQuote('The next 17 days teach the inputs — one at a time, one a day.')}
    ${p(`Here's the map:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Days 14-20:</strong> The five supplements and two practices that move BP the fastest.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Days 21-27:</strong> The behavior protocols — walking, sequencing meals, sleep architecture, fasting safety.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Days 28-30:</strong> The doctor conversation. Your graduation. What comes next.</p>
    `)}
    ${p(`Each day is one input. Don't try to do all 17 at once. Pick the ones that match your Pressure and stack them slowly. Most people who succeed add ONE new input per week — by Day 60, they have three new habits running on autopilot.`, { margin: '0 0 28px' })}
    ${p(`<strong>Tomorrow: magnesium glycinate.</strong> The single most underrated mineral for blood pressure. I take it. Annie takes it. Most cardiologists never bring it up.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you want me looking at YOUR specific case before adding inputs randomly — the BP Triangle Diagnostic Session is the door. 60 minutes, $297, written 30-day protocol that's yours. Three slots open this week.`)}
    ${upsellFooter({ kicker: 'WEEK 2 ANCHOR — $47 BP RESET KIT', body: 'Now that the framework makes sense, the Reset Kit gives you the dosing details and supplement protocols laid out by Pressure. 8 PDFs. $47 one-time.', ctaLabel: 'Get the BP Reset Kit →', ctaUrl: RESET_KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Welcome to Week 2.

Foundation week is done. By now you know the three Pressures, the lies, and the dosing-vs-pill reframe.

THE NEXT 17 DAYS TEACH THE INPUTS — ONE AT A TIME, ONE A DAY.

→ Days 14-20: The five supplements and two practices that move BP the fastest.
→ Days 21-27: The behavior protocols — walking, sequencing meals, sleep, fasting safety.
→ Days 28-30: The doctor conversation. Graduation. What comes next.

Each day is one input. Don't try to do all 17 at once. Pick the ones that match your Pressure and stack them slowly. Most successful people add ONE new input per week.

Tomorrow: magnesium glycinate. The single most underrated mineral for blood pressure.

Joel
RN, BraveWorks

P.S. Want me looking at YOUR case before adding inputs? The BP Triangle Diagnostic Session — 60 min, $297, written protocol — is the door. Three slots open this week: ${COACHING_URL}

—
→ Get the Reset Kit ($47): ${RESET_KIT_URL}
→ Skool: ${SKOOL_URL}
`,
};

const day14 = {
  subject: 'Magnesium glycinate — the most underrated BP mineral',
  subjectB: 'Day 14 — the mineral cardiologists don\'t mention',
  preview: '48% of Americans are depleted. Restoring it lowers BP, deepens sleep, and improves insulin sensitivity — all three corners at once.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single most underrated mineral in cardiovascular medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Magnesium is a natural calcium channel blocker. Most adults are depleted.')}
    ${p(`Here's the mechanism. When magnesium is low, calcium floods smooth muscle cells in your artery walls. Calcium-filled smooth muscle contracts. Contracted vessels = higher pressure. The doctor's answer is amlodipine — a pharmaceutical calcium channel blocker. Magnesium does the same job upstream, without the ankle swelling.`)}
    ${p(`The irony: most BP medications (thiazide diuretics especially) make you LOSE magnesium through urine. So the pill helping your numbers is also depleting the mineral that would have helped them more.`)}
    ${p(`<strong>Up to 48% of American adults are magnesium-depleted</strong> per published RBC magnesium studies. Almost no cardiologist orders this lab.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Dose:</strong> 300-400 mg magnesium glycinate at night.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Form:</strong> glycinate (gentle on bowel). NOT oxide (poorly absorbed) or citrate at high doses (laxative).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Why night:</strong> magnesium activates GABA receptors. Deeper sleep + lower nocturnal BP dip = morning numbers drop in 2-3 weeks.</p>
    `)}
    ${p(`Three-for-one mineral: vascular relaxation, sleep depth, insulin sensitivity. Every Triangle corner benefits.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — hydration with mineral salt. The 24-hour delay nobody told you about. Wakita dropped 12 systolic points on this alone.`)}
    ${upsellFooter({ kicker: 'GET THE PROTOCOL', body: 'The $17 BP Reset Kit lays out every supplement protocol by Pressure — magnesium included, with the exact timing and a "what to drop" list for things that fight against absorption.', ctaLabel: 'Get the Kit ($17) →', ctaUrl: KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the most underrated mineral in cardiovascular medicine.

MAGNESIUM IS A NATURAL CALCIUM CHANNEL BLOCKER. MOST ADULTS ARE DEPLETED.

When magnesium is low, calcium floods smooth muscle cells in your artery walls. Contracted muscle = higher pressure. The doctor's answer is amlodipine. Magnesium does the same job upstream, without the ankle swelling.

The irony: thiazide diuretics make you LOSE magnesium. So the pill helping your numbers depletes the mineral that would help them more.

Up to 48% of American adults are magnesium-depleted. Almost no cardiologist orders this lab.

PROTOCOL:
→ Dose: 300-400 mg magnesium glycinate at night
→ Form: glycinate (gentle bowel). NOT oxide or citrate at high doses.
→ Why night: deeper sleep + better nocturnal BP dip = morning numbers drop in 2-3 weeks.

Three-for-one: vascular relaxation, sleep depth, insulin sensitivity.

Tomorrow: hydration with mineral salt — the 24-hour delay nobody told you about.

Joel
RN, BraveWorks

P.S. The $17 BP Reset Kit lays out every supplement protocol by Pressure: ${KIT_URL}
`,
};

const day15 = {
  subject: 'The water you drink today hydrates you tomorrow',
  subjectB: 'Day 15 — hydration with mineral salt',
  preview: 'Drink a gallon. Add Celtic salt every 8 oz. The 24-hour delay nobody told you about.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the cheapest BP intervention in medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Dehydration raises blood pressure. Hydration with minerals lowers it.')}
    ${p(`Here's what nobody tells you: <strong>the water you drink today hydrates you tomorrow.</strong> There's a 24-hour cellular absorption delay. People drink a gallon on Day 1, pee a lot, conclude it doesn't work, and quit. They miss the delay.`)}
    ${p(`Mechanism: when blood volume drops from dehydration, your body tightens vessels to maintain pressure. Tighter vessels + sodium retention from compensatory aldosterone = higher cuff number. Restore the volume, the cascade reverses.`)}
    ${p(`But: plain water without minerals passes through. The minerals (especially mineral-grade salt) carry water into cells via sodium-glucose cotransport. Without them, you're peeing the gallon out faster than your cells absorb it.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Target:</strong> 84 oz (≈ 1 gallon) of plain water daily, sipped not chugged.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Mineral salt:</strong> a few grains of Celtic, Redmond's, or Himalayan pink under the tongue every 8 oz. NOT iodized table salt.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Bonus cue:</strong> sip every time you urinate. The bathroom IS your reminder.</p>
    `)}
    ${p(`Counterintuitive: waking at night to pee usually means you're MORE dehydrated, not less. A chronically dry bladder becomes hypersensitive. Hydrate steadily for 12-24 hours and it recalibrates. Most clients sleep through within a week.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — hibiscus tea. A clinical-grade ACE inhibitor that grows on a bush.`)}
    ${upsellFooter({ kicker: 'WANT A PROTOCOL TAILORED TO YOUR BODY?', body: 'The $297 BP Triangle Diagnostic Session — 60 min with Joel — builds a 30-day protocol customized to your loudest Pressure. Hydration is one of six inputs we calibrate to YOU. Six slots open this week.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the cheapest BP intervention in medicine.

DEHYDRATION RAISES BP. HYDRATION WITH MINERALS LOWERS IT.

The water you drink TODAY hydrates you TOMORROW. There's a 24-hour cellular delay. People drink a gallon, pee a lot, quit on Day 2. They miss the delay.

Mechanism: low blood volume → vessel tightening → higher pressure. Restore volume, the cascade reverses.

But plain water without minerals passes through. Mineral salt (Celtic, Redmond's, Himalayan pink) carries water into cells via sodium-glucose cotransport. Without minerals you pee it out before absorbing.

PROTOCOL:
→ Target: 84 oz (≈ 1 gallon) daily, sipped not chugged.
→ Mineral salt: a few grains under tongue every 8 oz. NOT iodized table salt.
→ Bonus cue: sip every time you urinate.

Counterintuitive: waking at night to pee means you're MORE dehydrated. Chronic dry bladder = hypersensitive. Hydrate steadily for 12-24 hours and it recalibrates.

Tomorrow: hibiscus tea. A clinical-grade ACE inhibitor.

Joel
RN, BraveWorks

P.S. Want this calibrated to YOUR body? BP Triangle Diagnostic — 60 min, $297, six slots: ${COACHING_URL}
`,
};

const day16 = {
  subject: 'Hibiscus tea — the ACE inhibitor that grows on a bush',
  subjectB: 'Day 16 — clinical-grade tea, no prescription',
  preview: '7.5 mmHg systolic drop in meta-analysis. Same mechanism as lisinopril. Two cups a day.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the most-studied herbal BP intervention in published medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Hibiscus tea is a natural ACE inhibitor. Two cups daily moves systolic by 7.5 points.')}
    ${p(`A 2010 Journal of Nutrition randomized controlled trial in adults with prehypertension showed a 7.5 mmHg systolic drop in 6 weeks. A meta-analysis (Mozaffari-Khosravi 2013) replicated across 5 trials. The mechanism: hibiscus contains anthocyanins that inhibit angiotensin-converting enzyme — the exact target of lisinopril.`)}
    ${p(`Plus a mild diuretic effect via potassium content. So you get the ACE inhibitor + the diuretic in one cup, without the dry cough or the magnesium loss.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Dose:</strong> 2-3 cups daily, steeped 5-10 minutes covered (heat releases the anthocyanins, lid prevents loss).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Quality:</strong> loose-leaf or single-ingredient hibiscus tea. NOT "hibiscus blend" with green tea or sugar.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Timing:</strong> morning + afternoon. Avoid within 3 hours of bedtime (diuretic effect).</p>
    `)}
    ${clayBlock("Important — if you're on lisinopril or losartan", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Hibiscus stacks with ACE inhibitors and ARBs. The combined effect can drop your numbers fast. Track BP morning and evening for the first 7 days. If you hit symptomatic hypotension (dizziness standing up), pause the tea and tell your prescriber. This is the kind of conversation the doctor-conversation script (Day 28) is for.</p>
    `)}
    ${joelSignoff()}
    ${psBox(`Tomorrow — crushed raw garlic. Four pharmacological mechanisms in one clove.`)}
    ${upsellFooter({ kicker: 'WANT THE FULL SUPPLEMENT PROTOCOL?', body: 'The $97 BP Triangle Challenge — 30 days of daily protocol emails + the Skool community + weekly group coaching — includes the full herb stack with timing and contraindications by medication.', ctaLabel: 'Get the Challenge ($97) →', ctaUrl: CHALLENGE_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the most-studied herbal BP intervention in published medicine.

HIBISCUS IS A NATURAL ACE INHIBITOR. 7.5 mmHg SYSTOLIC DROP IN 6 WEEKS.

A 2010 Journal of Nutrition RCT replicated by Mozaffari-Khosravi 2013 meta-analysis. Anthocyanins inhibit angiotensin-converting enzyme — same target as lisinopril. Plus a mild diuretic via potassium. Without the dry cough or magnesium loss.

PROTOCOL:
→ 2-3 cups daily, steeped 5-10 min covered
→ Loose-leaf or single-ingredient hibiscus tea (NOT a sugar-blend)
→ Morning + afternoon. Avoid within 3 hours of bed.

IMPORTANT — IF YOU'RE ON LISINOPRIL OR LOSARTAN:
Hibiscus stacks with ACE/ARBs. Track BP morning + evening for the first 7 days. If you hit symptomatic hypotension, pause the tea and tell your prescriber.

Tomorrow: crushed raw garlic — four mechanisms in one clove.

Joel
RN, BraveWorks

P.S. $97 BP Triangle Challenge has the full herb stack + Skool community + weekly group coaching: ${CHALLENGE_URL}
`,
};

const day17 = {
  subject: 'Crushed garlic — 4 pharmaceutical mechanisms in one clove',
  subjectB: 'Day 17 — the supplement Big Pharma cannot patent',
  preview: 'ACE inhibition + nitric oxide + calcium channel + alpha-blocker. All four. From one bulb.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single most multi-mechanism supplement in cardiovascular medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Crushed raw garlic hits four BP mechanisms at once. Most pills hit one.')}
    ${p(`The active compound is allicin — formed when you crush the clove and let it rest 10 minutes (the enzyme alliinase needs time to convert alliin to allicin). Without the rest, you get cooked garlic flavor and no allicin.`)}
    ${p(`Allicin works on four parallel pathways:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">1. ACE inhibition</strong> — same target as lisinopril.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">2. Nitric oxide stimulation</strong> — endothelial vasodilation.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">3. Calcium channel modulation</strong> — same family as amlodipine.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. Alpha-adrenergic blocking</strong> — same class as terazosin.</p>
    `)}
    ${p(`Four-drug equivalent. Zero prescription. Clinical studies show 7-16 mmHg systolic drops over 8-12 weeks of consistent daily intake (Ried 2008, 2013, 2016 meta-analyses).`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Dose:</strong> 2 cloves daily, crushed, rested 10 minutes, eaten with food.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Best vehicle:</strong> on toast with butter or olive oil, or in salad dressing. Cooked garlic doesn't count.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Breath:</strong> chew parsley or fennel afterward. The smell fades in 2 hours.</p>
    `)}
    ${joelSignoff()}
    ${psBox(`Tomorrow — sleep architecture. The single most undervalued cardiovascular intervention. One bad night = +7 mmHg next morning.`)}
    ${upsellFooter({ kicker: 'START HERE — \$17 BP RESET KIT', body: 'Every protocol so far — magnesium, hibiscus, garlic, hydration — is laid out in the Kit with dosing, timing, and the contraindication checklist by medication. \$17, less than one copay.', ctaLabel: 'Get the Kit ($17) →', ctaUrl: KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the most multi-mechanism supplement in cardiovascular medicine.

CRUSHED RAW GARLIC HITS FOUR BP MECHANISMS AT ONCE. MOST PILLS HIT ONE.

Active compound: allicin. Formed when you crush the clove and rest 10 minutes (enzyme alliinase needs time). No rest = no allicin.

Four mechanisms:
1. ACE inhibition (lisinopril)
2. Nitric oxide stimulation (vasodilation)
3. Calcium channel modulation (amlodipine)
4. Alpha-adrenergic blocking (terazosin)

Zero prescription. 7-16 mmHg systolic drops over 8-12 weeks per Ried meta-analyses.

PROTOCOL:
→ Dose: 2 cloves daily, crushed, rested 10 min, eaten with food
→ Vehicle: on toast with butter, in salad dressing. Cooked garlic doesn't count.
→ Breath: parsley or fennel after. Smell fades in 2 hours.

Tomorrow: sleep architecture. Single most undervalued cardiovascular intervention.

Joel
RN, BraveWorks

P.S. $17 BP Reset Kit lays out every supplement protocol: ${KIT_URL}
`,
};

const day18 = {
  subject: 'One bad night of sleep = +7 mmHg next morning',
  subjectB: 'Day 18 — sleep architecture for BP',
  preview: 'The single most undervalued cardiovascular intervention. Why nocturnal dipping predicts mortality more than daytime BP.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the cardiovascular intervention that costs nothing.`, { margin: '0 0 24px' })}
    ${bigQuote('One fragmented night = +7 mmHg next morning. Six bad nights in a row = your new baseline.')}
    ${p(`Here's what nobody connects: your BP is supposed to drop 10-20% during sleep (nocturnal dipping). Non-dippers — people whose BP stays flat or rises at night — die from cardiovascular events at 2-3× the rate of normal dippers, independent of daytime BP.`)}
    ${p(`The dip happens when cortisol drops, parasympathetic tone rises, and you reach deep stages 3-4 of sleep where growth hormone repairs endothelium. Miss those stages — fragmented sleep, late blue light, cortisol-elevated bedrooms — and the dip flattens.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Bedroom temp 65-68°F.</strong> Core temp must drop 2°F for deep sleep onset. A 74°F bedroom guarantees you stay in stages 1-2.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">No screens after 9 PM.</strong> Blue light delays melatonin onset 60-90 minutes. Use night-mode + amber lights if you must look at screens.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">In bed by 10 PM.</strong> Hours before midnight count double for growth hormone and endothelial repair.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Magnesium at night</strong> (you're already doing this from Day 14) — GABA support deepens stage 3-4.</p>
    `)}
    ${p(`If you wake at 2-4 AM and can't fall back asleep, that's a cortisol signature. Tomorrow: box breathing — the fastest fix.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If sleep is your loudest Pressure (cortisol corner), the diagnostic is built to map your specific cascade. 60 minutes. Written protocol. Six slots this week.`)}
    ${upsellFooter({ kicker: 'WHEN GENERAL ISN\'T ENOUGH', body: 'The \$297 BP Triangle Diagnostic Session maps which Pressure is loudest for YOUR body. Sleep, cortisol, hydration, blood sugar — we calibrate which protocol comes first.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the cardiovascular intervention that costs nothing.

ONE FRAGMENTED NIGHT = +7 mmHg NEXT MORNING. Six bad nights = your new baseline.

Your BP is supposed to drop 10-20% during sleep (nocturnal dipping). Non-dippers die from cardiovascular events at 2-3× the rate, independent of daytime BP.

The dip needs cortisol drop + parasympathetic tone + deep stages 3-4. Miss those — fragmented sleep, late blue light, cortisol bedroom — the dip flattens.

PROTOCOL:
→ Bedroom 65-68°F (core temp must drop 2°F)
→ No screens after 9 PM (blue light delays melatonin 60-90 min)
→ In bed by 10 PM (pre-midnight hours count double for endothelial repair)
→ Magnesium at night (GABA support, Day 14)

If you wake at 2-4 AM and can't fall back asleep — that's cortisol. Tomorrow: box breathing.

Joel
RN, BraveWorks

P.S. If sleep is your loudest Pressure, the $297 diagnostic maps the specific cascade: ${COACHING_URL}
`,
};

const day19 = {
  subject: 'Box breathing — drop systolic 3.5 points in one session',
  subjectB: 'Day 19 — the 5-minute reset',
  preview: 'Four in, four hold, four out, four hold. Activates the vagus nerve. Free.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the cheapest, fastest, most-portable BP intervention in medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Box breathing drops systolic 3.5 mmHg in a single session. Practiced twice daily, compounds over 4 weeks.')}
    ${p(`The mechanism: slow rhythmic breathing at the right cadence stimulates the vagus nerve. The vagus nerve is the master switch between sympathetic (fight-or-flight, cortisol up, vessels tight) and parasympathetic (rest-and-digest, cortisol down, vessels relax). You can literally flip the switch with breath.`)}
    ${p(`A 2005 Hypertension Research study by Joseph et al. showed slow breathing at 6 breaths per minute produced a 3.5 mmHg systolic drop in ONE session. Over 4-8 weeks the cumulative drop hit 8-12 mmHg systolic. For comparison: a typical first-line BP medication moves the number 8-12 mmHg.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Pattern:</strong> 4 seconds inhale, 4 hold, 4 exhale, 4 hold. Repeat.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Duration:</strong> 5 minutes per session. Twice daily — morning + before bed.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Where:</strong> driving doesn't count (eyes closed needed). Bed, couch, parked car, bathroom stall — any quiet 5-minute window.</p>
    `)}
    ${p(`This is free. It's portable. It works. The barrier is consistency — most people try it for two days and quit. Set two phone alarms (10 AM, 8 PM) and do it for 14 days. Track your morning BP. The trend speaks for itself.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — the 25-gratitudes practice. The single best cortisol intervention I've ever seen. Most clients shift their nocturnal pattern in 7 days.`)}
    ${upsellFooter({ kicker: 'BUILD THE FULL STACK — $47', body: 'The BP Reset Kit lays out breathing, gratitude, sleep, and supplement protocols in order. 8 PDFs. $47 buys the structure that turns one habit into a daily routine.', ctaLabel: 'Get the Reset Kit ($47) →', ctaUrl: RESET_KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the cheapest, fastest, most-portable BP intervention.

BOX BREATHING DROPS SYSTOLIC 3.5 MMHG IN ONE SESSION. PRACTICED 2X DAILY, COMPOUNDS OVER 4 WEEKS.

Mechanism: slow rhythmic breathing at 6 bpm stimulates the vagus nerve — the master switch between sympathetic and parasympathetic. You can literally flip the switch with breath.

Joseph 2005 Hypertension Research: 3.5 mmHg drop in ONE session. 8-12 mmHg cumulative over 4-8 weeks — same as a first-line BP medication.

PROTOCOL:
→ 4 inhale, 4 hold, 4 exhale, 4 hold. Repeat.
→ 5 minutes per session. Twice daily — morning + before bed.
→ Anywhere quiet. Driving doesn't count.

The barrier is consistency. Set two phone alarms (10 AM, 8 PM). Do it for 14 days. Track morning BP.

Tomorrow: the 25-gratitudes practice — single best cortisol intervention I've ever seen.

Joel
RN, BraveWorks

P.S. $47 BP Reset Kit lays out the breathing + gratitude + sleep + supplement protocols in order: ${RESET_KIT_URL}
`,
};

const day20 = {
  subject: '25 gratitudes — the cortisol intervention that costs nothing',
  subjectB: 'Day 20 — the brain trick that rewires BP',
  preview: 'Your brain can\'t hold gratitude and stress at the same time. Generate 25 of them and watch what happens.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single best cortisol intervention I've ever taught a client.`, { margin: '0 0 24px' })}
    ${bigQuote('Your brain cannot hold gratitude and stress at the same time. Multitasking is rapid switching, not parallel.')}
    ${p(`The mechanism is neurological: when you actively generate gratitude, the medial prefrontal cortex fires and the amygdala (the stress factory) goes quiet. You cannot simultaneously feel grateful for your morning coffee and afraid of your BP reading. The brain switches between states; it doesn't blend them.`)}
    ${p(`So if you generate 25 specific gratitudes upon waking — out loud or written, not just thought — your brain spends those 5-10 minutes in parasympathetic mode. Cortisol drops. Morning BP, taken right after, runs 5-15 points lower than the same morning without gratitudes.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Morning:</strong> 25 gratitudes spoken or written before you check your phone. Specific, not generic ("the way the sun hits my kitchen window" not "my house").</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Evening:</strong> 25 more in bed, lights off, before sleep. Different ones from the morning.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">If you wake at 2-4 AM:</strong> start cycling through gratitudes again until you fall back asleep. Works faster than melatonin.</p>
    `)}
    ${p(`I taught this to one of my Sprint clients last month. She was waking at 3 AM every night for two years. Day 4 of the gratitude practice she slept eight hours straight. Day 9, BP 128/82 from 142/88. Same diet, same meds, same everything else.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've been doing all the protocols and your morning BP is still high, cortisol is the likely culprit. The diagnostic catches this in 60 minutes. 297, written protocol, six slots this week.`)}
    ${upsellFooter({ kicker: 'WHEN STRESS PRESSURE IS THE CORNER', body: 'The \$297 BP Triangle Diagnostic Session names your loudest Pressure live. If cortisol is the answer, you walk out with a 30-day cortisol-calming protocol customized to your body. 60 min, six slots.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the single best cortisol intervention I've ever taught.

YOUR BRAIN CANNOT HOLD GRATITUDE AND STRESS AT THE SAME TIME. Multitasking is rapid switching.

When you generate gratitude, the medial prefrontal cortex fires and the amygdala goes quiet. You cannot simultaneously feel grateful for your morning coffee and afraid of your BP reading.

Generate 25 specific gratitudes on waking — out loud or written — your brain spends 5-10 minutes in parasympathetic mode. Cortisol drops. Morning BP runs 5-15 points lower.

PROTOCOL:
→ Morning: 25 gratitudes spoken or written before phone. Specific not generic.
→ Evening: 25 more in bed, lights off. Different ones.
→ 2-4 AM wake-up: cycle through gratitudes until you fall back. Faster than melatonin.

One Sprint client: waking 3 AM every night for 2 years. Day 4 — slept 8 hours. Day 9 — BP 128/82 from 142/88. Same diet, same meds.

Joel
RN, BraveWorks

P.S. If cortisol is your loudest Pressure, the $297 diagnostic catches it in 60 min: ${COACHING_URL}
`,
};

const day21 = {
  subject: 'The 10-minute walk that flattens your glucose curve',
  subjectB: 'Day 21 — the cheapest BP move you\'re not making',
  preview: 'Walk for 10 minutes after eating. Glucose drops 30-50%. Insulin drops. Sodium retention drops. BP follows.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single highest-ROI behavior intervention for BP and blood sugar at the same time.`, { margin: '0 0 24px' })}
    ${bigQuote('A 10-minute walk after eating drops post-meal glucose by 30-50%. Without insulin.')}
    ${p(`Mechanism: when you contract muscle, GLUT4 transporters move to the cell surface and pull glucose into muscle cells WITHOUT needing insulin. So a 10-minute walk after a meal pulls glucose out of your bloodstream into your muscles, blunting the post-meal spike that would otherwise drive an insulin surge that would tell your kidneys to retain sodium that would raise your BP.`)}
    ${p(`The cascade breaks at glucose. Glucose stays calm → insulin stays calm → sodium retention stays calm → BP stays calm. One 10-minute walk per meal.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Timing:</strong> within 30 minutes of finishing the meal (the glucose curve peaks at 60-90 min — walking right after catches the rise).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Pace:</strong> conversational, not race-walking. You're stimulating GLUT4, not training.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Where:</strong> doesn't matter. Around the block. In your driveway. Down the hospital hallway if you're a nurse like me. Just move.</p>
    `)}
    ${p(`Three meals a day × 10 minutes = 30 minutes of movement that costs you nothing. Most clients see A1c drop 0.3-0.5 in 90 days from this single habit. Multiple cardiology meta-analyses (Buffey 2022 most recent) replicate the effect.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`This single habit is the easiest way to test if blood sugar is your loudest Pressure. Run it for 14 days. If morning BP drops 3+ points, you've found your corner.`)}
    ${upsellFooter({ kicker: '30 DAYS OF DAILY PROTOCOL — $97', body: 'The BP Triangle Challenge layers walking, sleep, breathing, supplements in the right order so you do not burn out trying to do everything. Daily emails + Skool community + weekly group coaching.', ctaLabel: 'Get the Challenge ($97) →', ctaUrl: CHALLENGE_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: highest-ROI behavior intervention for BP and blood sugar simultaneously.

A 10-MINUTE WALK AFTER EATING DROPS GLUCOSE 30-50%. WITHOUT INSULIN.

Mechanism: muscle contraction → GLUT4 transporters to cell surface → glucose pulled into muscle without insulin. Glucose calm → insulin calm → sodium retention calm → BP calm.

PROTOCOL:
→ Within 30 min of finishing meal (glucose peaks at 60-90 min)
→ Conversational pace, not race-walking
→ Around the block, the driveway, hallway. Just move.

3 meals × 10 min = 30 min/day free. Most clients see A1c drop 0.3-0.5 in 90 days (Buffey 2022 meta-analysis).

Easiest test for whether blood sugar is your loudest Pressure: run this 14 days. Morning BP drops 3+ points → that's your corner.

Joel
RN, BraveWorks

P.S. The $97 Challenge layers walking, sleep, breathing, supplements in the right order: ${CHALLENGE_URL}
`,
};

const day22 = {
  subject: 'Hawthorn berry — the herb your great-grandmother knew',
  subjectB: 'Day 22 — gentle vasodilation for older arteries',
  preview: 'Slow-acting, broad-spectrum cardio support. Stacks with everything.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the herb European pharmacopoeias have used for cardiovascular support for 300 years.`, { margin: '0 0 24px' })}
    ${bigQuote('Hawthorn berry supports endothelial function, mild vasodilation, and cardiac contractility — without the side-effect profile of any pharmaceutical class.')}
    ${p(`Mechanism: hawthorn contains oligomeric proanthocyanidins (OPCs) and flavonoids that improve coronary blood flow, gently relax arterial smooth muscle, and support the strength of the heart's contraction. It's the European herbalists' answer to mild congestive heart failure with concurrent hypertension.`)}
    ${p(`Slower-acting than hibiscus or garlic — expect 6-12 weeks of consistent daily use before noticeable BP effect. The trade-off: broader cardiovascular support, very gentle side-effect profile, safe for older adults on multiple medications.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Dose:</strong> 300-600 mg standardized extract twice daily (look for 2.2% flavonoids or 18.75% OPCs on the label).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Tea alternative:</strong> 1-2 tsp dried berries steeped 10 minutes, 2-3 cups daily. Slower onset, gentler effect.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Stacks with:</strong> beta-blockers (potentiates effect — monitor), ACE inhibitors, hibiscus, magnesium.</p>
    `)}
    ${p(`Best for: older adults (65+), people on 3+ medications who can't tolerate aggressive interventions, and patients whose BP responds poorly to single-mechanism drugs.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — ashwagandha. The cortisol-specific herb. 27% cortisol drop in 8 weeks of published studies.`)}
    ${upsellFooter({ kicker: 'START WITH THE FOUNDATION', body: 'Hawthorn, hibiscus, garlic, magnesium — every supplement protocol on a single page, by Pressure, with dosing + contraindications. \$17.', ctaLabel: 'Get the BP Reset Kit ($17) →', ctaUrl: KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the herb European pharmacopoeias have used for cardiovascular support for 300 years.

HAWTHORN BERRY — endothelial function + mild vasodilation + cardiac contractility. Broad-spectrum, gentle, safe for older adults on multiple meds.

Slower-acting than hibiscus or garlic — 6-12 weeks for noticeable BP effect. Trade-off: broader cardiovascular support, very gentle side-effect profile.

PROTOCOL:
→ 300-600 mg standardized extract 2× daily (2.2% flavonoids or 18.75% OPCs)
→ Tea alternative: 1-2 tsp dried berries steeped 10 min, 2-3 cups daily
→ Stacks safely with beta-blockers (monitor), ACE inhibitors, hibiscus, magnesium

Best for: older adults, 3+ meds, BP that responds poorly to single-mechanism drugs.

Tomorrow: ashwagandha — the cortisol-specific herb.

Joel
RN, BraveWorks

P.S. $17 BP Reset Kit has every supplement protocol by Pressure: ${KIT_URL}
`,
};

const day23 = {
  subject: 'Ashwagandha — 27% cortisol drop in 8 weeks',
  subjectB: 'Day 23 — the herb cardiologists never prescribe',
  preview: 'Published RCTs. Cortisol-specific. The Stress Pressure herb.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the most studied adaptogen for cortisol-driven BP.`, { margin: '0 0 24px' })}
    ${bigQuote('Ashwagandha drops circulating cortisol by 27% over 8 weeks in published RCTs.')}
    ${p(`Mechanism: ashwagandha modulates the HPA axis (hypothalamic-pituitary-adrenal) — the cortisol-regulating loop. It's not a sedative, not a stimulant, not a vasodilator. It's a cortisol-specific adaptogen that tells the system to stop overproducing.`)}
    ${p(`Lopresti 2019 RCT showed a 27.9% morning cortisol drop in 8 weeks at 240 mg KSM-66. Salve 2019 replicated with Sensoril extract at similar dose. For BP: when cortisol drops, downstream sodium retention drops, vessel tightening drops, and BP follows. Most clients see 4-8 mmHg systolic drop in 8-12 weeks.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Form:</strong> KSM-66 or Sensoril (the two studied extracts). Avoid generic root powder.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Dose:</strong> 300-600 mg daily of standardized extract. Single morning dose works for most.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Cautions:</strong> not for hyperthyroidism (mild thyroid-stimulating effect), pregnancy, lithium use, or autoimmune flares.</p>
    `)}
    ${p(`Best for: people whose BP runs higher in the afternoon than morning (cortisol signature), who wake at 2-4 AM, or who can name 3 stressful things off the top of their head right now.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — the salt mistake. Why blanket low-sodium advice is wrong for 70% of you.`)}
    ${upsellFooter({ kicker: 'CORTISOL CORNER — DIAGNOSED LIVE', body: 'If cortisol is your loudest Pressure, generic supplement advice misses the timing. The \$297 BP Triangle Diagnostic Session names YOUR cortisol cascade in 60 min + writes the specific protocol.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: most-studied adaptogen for cortisol-driven BP.

ASHWAGANDHA DROPS CORTISOL 27% IN 8 WEEKS PER PUBLISHED RCTs.

Mechanism: modulates the HPA axis — tells the system to stop overproducing cortisol. Not sedative, not stimulant, not vasodilator. Cortisol-specific.

Lopresti 2019: 27.9% morning cortisol drop in 8 weeks at 240 mg KSM-66. Salve 2019 replicated. When cortisol drops → sodium retention drops → BP drops (4-8 mmHg systolic in 8-12 weeks).

PROTOCOL:
→ Form: KSM-66 or Sensoril (the studied extracts). NOT generic root powder.
→ Dose: 300-600 mg daily of standardized extract. Morning works for most.
→ Cautions: NOT for hyperthyroidism, pregnancy, lithium, autoimmune flares.

Best for: BP higher in afternoon than morning, 2-4 AM wakeups, easy stress.

Tomorrow: the salt mistake. Why blanket low-sodium advice is wrong for 70% of you.

Joel
RN, BraveWorks

P.S. $297 diagnostic names YOUR cortisol cascade in 60 min: ${COACHING_URL}
`,
};

const day24 = {
  subject: 'The salt mistake that\'s costing 70% of you',
  subjectB: 'Day 24 — why low-sodium advice misses the point',
  preview: 'Refined table salt raises BP. Mineral salt lowers it. They\'re not the same input.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the most misunderstood input in cardiovascular medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Refined sodium raises BP in salt-sensitive people. Mineral salt with potassium, magnesium, and trace minerals LOWERS BP.')}
    ${p(`The blanket "low-sodium" advice predates this distinction. Studies were done with refined table salt (NaCl + anti-caking agents + dextrose, stripped of minerals). The DASH diet showed sodium restriction lowered BP. Everyone generalized to "all salt is bad."`)}
    ${p(`But: about 70% of people are NOT salt-sensitive. For them, sodium restriction is neutral or counterproductive (renin-aldosterone overcompensates). Of the 30% who ARE salt-sensitive, refined sodium is the problem — not all sodium.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Refined salt (Morton's, restaurant, packaged food):</strong> raises BP in salt-sensitive people. Cut it.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Mineral salt (Celtic, Redmond's Real Salt, Himalayan pink):</strong> contains potassium, magnesium, and trace minerals that work AGAINST the BP-raising effect. Use freely.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Test:</strong> if cutting refined salt for 14 days drops your systolic 5+ mmHg, you're salt-sensitive. If not, you're in the 70%.</p>
    `)}
    ${p(`Practical protocol: cook with Celtic or Redmond's. Skip restaurant + packaged food (where the refined sodium hides). Use the mineral salt sublingually with water (Day 15 hydration protocol). Don't fear salt at meals if it's the mineralized kind.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — meal sequencing. Why eating the same food in a different order changes the glucose-insulin-sodium cascade by 30-40%.`)}
    ${upsellFooter({ kicker: 'THE FULL FOOD PROTOCOL — $47', body: 'The Reset Kit includes the Cook For Life cookbook (64 recipes) built on the mineral-salt protocol + meal sequencing + the foods that flatten the insulin curve. No more guessing what to cook.', ctaLabel: 'Get the Reset Kit ($47) →', ctaUrl: RESET_KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the most misunderstood input in cardiovascular medicine.

REFINED SODIUM RAISES BP IN SALT-SENSITIVE PEOPLE. MINERAL SALT LOWERS BP FOR EVERYONE.

DASH studies used refined table salt (NaCl + anti-caking, stripped of minerals). Everyone generalized to "all salt is bad."

Reality: 70% of people are NOT salt-sensitive. For them, restriction is neutral or counterproductive (renin-aldosterone compensates). Of the 30% who ARE, refined sodium is the problem — not all sodium.

PROTOCOL:
→ Refined salt (Morton's, restaurant, packaged): cut it.
→ Mineral salt (Celtic, Redmond's, Himalayan): contains K, Mg, trace minerals that work AGAINST BP-raising effect. Use freely.
→ Test: cut refined salt 14 days. Drop 5+ mmHg → you're salt-sensitive.

Cook with mineral salt. Skip restaurant + packaged food. Use sublingually with water (Day 15).

Tomorrow: meal sequencing — same food, different order, 30-40% less insulin response.

Joel
RN, BraveWorks

P.S. $47 Reset Kit has the Cook For Life cookbook built on mineral-salt + meal sequencing: ${RESET_KIT_URL}
`,
};

const day25 = {
  subject: 'Same plate, different order — 40% smaller glucose spike',
  subjectB: 'Day 25 — meal sequencing',
  preview: 'Fiber first, protein second, starch last. No new diet. Just reorder.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single most underrated metabolic intervention in published medicine.`, { margin: '0 0 24px' })}
    ${bigQuote('Same plate, different order. 30-40% smaller post-meal glucose spike. Same calories.')}
    ${p(`The mechanism: fiber and protein slow gastric emptying and trigger GLP-1 release (the satiety + insulin-sensitivity hormone). By the time the carb arrives at the small intestine, your gut is already moving slower and your insulin response is already calibrated. The glucose curve flattens.`)}
    ${p(`Shukla 2015 study: type 2 diabetics ate the same meal three times — once carbs-first, once carbs-last, once mixed. Carbs-last produced a 53% lower glucose spike and a 73% lower insulin spike. Multiple replications since.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Order:</strong> 1. fiber/vegetables. 2. protein. 3. starch/sugar/fruit.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Time gap:</strong> 5-10 minutes between course one and course three works best (it lets GLP-1 actually rise).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Doesn't apply to:</strong> liquid meals (smoothies, shakes). The blender already mixed everything.</p>
    `)}
    ${p(`This is the single easiest food change in BP nutrition. No new ingredients. No special cooking. No willpower beyond the order in which you put food in your mouth. Run it for 14 days and watch your morning BP.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've tried meal sequencing + walking after meals for 30 days and your numbers still aren't moving, blood sugar might not be your loudest Pressure. The diagnostic catches this in 60 minutes.`)}
    ${upsellFooter({ kicker: 'CALIBRATE TO YOUR CORNER', body: 'The \$297 BP Triangle Diagnostic Session names whether vascular, cortisol, or blood sugar is loudest for YOU. 60 min, written protocol, six slots this week.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: most underrated metabolic intervention in published medicine.

SAME PLATE, DIFFERENT ORDER. 30-40% SMALLER POST-MEAL GLUCOSE SPIKE.

Mechanism: fiber + protein slow gastric emptying and trigger GLP-1. By the time carb arrives, gut is slower and insulin is calibrated. Glucose curve flattens.

Shukla 2015: T2D patients ate same meal 3 ways. Carbs-last = 53% lower glucose, 73% lower insulin. Multiple replications.

PROTOCOL:
→ Order: 1. Fiber/vegetables. 2. Protein. 3. Starch/sugar/fruit.
→ 5-10 min gap between course 1 and course 3 (lets GLP-1 rise).
→ Doesn't apply to smoothies/shakes (already blended).

Easiest food change in BP nutrition. No new ingredients. Just order. 14 days → watch morning BP.

Joel
RN, BraveWorks

P.S. 30 days of sequencing + walking and numbers haven't moved? Blood sugar isn't your loudest. $297 diagnostic catches it in 60 min: ${COACHING_URL}
`,
};

const day26 = {
  subject: 'The 4 labs your doctor probably isn\'t running',
  subjectB: 'Day 26 — the metabolic panel that catches what BP cuffs miss',
  preview: 'A1c, fasting glucose, fasting insulin, HOMA-IR. About $80 cash. Catches problems 5-10 years before BP rises.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the four labs that paint a complete metabolic picture.`, { margin: '0 0 24px' })}
    ${bigQuote('Cardiologists run A1c at most. Almost none order fasting insulin. The 5-10 years of preventable damage live in that gap.')}
    ${p(`If you're on BP medication and your A1c is over 5.7, you have metabolic dysfunction driving your numbers. If your fasting insulin is over 7, you have insulin resistance even if your A1c is "normal." The standard cardiology panel won't catch this. The four labs below will.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">A1c</strong> — 3-month glucose average. Optimal <5.4. Prediabetic 5.7-6.4.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">Fasting glucose</strong> — single-point. Optimal <90. Pre-diabetic 100-125.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">Fasting insulin</strong> — the lab nobody orders. Optimal <7 mIU/mL. Compensatory range 10-15. Frank insulin resistance 15+.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">HOMA-IR</strong> — calculated: (glucose × insulin) / 405. Optimal <1.5. Insulin resistance >2.5.</p>
    `)}
    ${p(`If your doctor pushes back, ask why. If they still won't order them, services like LetsGetChecked, Quest Direct, or LabCorp OnDemand will, without a prescription. Cash cost: about $80-120 for all four.`)}
    ${p(`Bring the results to your next appointment. The conversation changes when you have data.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — 16:8 intermittent fasting. The safety screen + protocol. Not for everyone, accelerates everyone it IS for.`)}
    ${upsellFooter({ kicker: 'WALK INTO YOUR DOCTOR\'S OFFICE WITH A PROTOCOL', body: 'The \$97 BP Triangle Challenge includes lab interpretation guides + the Doctor Conversation Script that gets cardiologists engaged. \$97 one-time, daily emails, Skool community.', ctaLabel: 'Get the Challenge ($97) →', ctaUrl: CHALLENGE_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the four labs that paint a complete metabolic picture.

CARDIOLOGISTS RUN A1c AT MOST. ALMOST NONE ORDER FASTING INSULIN. 5-10 YEARS OF PREVENTABLE DAMAGE LIVES IN THAT GAP.

If you're on BP medication and A1c is over 5.7, metabolic dysfunction is driving your numbers. Even if A1c is normal, fasting insulin over 7 = insulin resistance.

THE FOUR LABS:
→ A1c — 3-month glucose avg. Optimal <5.4
→ Fasting glucose — single-point. Optimal <90
→ Fasting insulin — almost nobody orders. Optimal <7 mIU/mL
→ HOMA-IR — calculated. Optimal <1.5

If your doctor won't order: LetsGetChecked, Quest Direct, LabCorp OnDemand. No Rx needed. ~$80-120 cash.

Bring results to next appointment. Conversation changes when you have data.

Joel
RN, BraveWorks

P.S. $97 Challenge has lab interpretation + Doctor Conversation Script: ${CHALLENGE_URL}
`,
};

const day27 = {
  subject: '16:8 intermittent fasting — safety screen + protocol',
  subjectB: 'Day 27 — accelerator, not foundation',
  preview: 'Not for everyone. Big lift for those it IS for. Read the safety screen before starting.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single highest-leverage metabolic intervention available without supplements.`, { margin: '0 0 24px' })}
    ${bigQuote('16 hours fasting + 8 hours eating window. Insulin receptors resensitize. BP follows.')}
    ${p(`Mechanism: in the fasted state, your insulin drops to near-baseline. With 16 hours of low insulin daily, your insulin receptors regain sensitivity that years of chronic carbohydrate exposure dulled. Sensitive receptors = less insulin needed = less sodium retention = less BP elevation.`)}
    ${p(`Clinical evidence: Sutton 2018 ran a 5-hour eating window protocol on prediabetic men and showed improved insulin sensitivity, blood pressure, and oxidative stress markers — all without weight loss. Mattson 2017 meta-review documented BP drops of 6-10 mmHg systolic over 8-12 weeks.`, { margin: '0 0 28px' })}
    ${clayBlock('Safety screen — DO NOT skip', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">Intermittent fasting is NOT for: history of disordered eating, type 1 diabetes, pregnancy or breastfeeding, underweight/fragile, children, or anyone on insulin secretagogues (sulfonylureas like glipizide) without prescriber supervision.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you're on metformin alone, OK. If you're on insulin or sulfonylureas, talk to your prescriber FIRST — hypoglycemia risk requires medication adjustment.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">Window:</strong> 11 AM to 7 PM is the easiest starting point. Adjust ±2 hours.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;"><strong style="color:${PALETTE.text};">During the fast:</strong> water (Day 15 hydration protocol), unsweetened tea, black coffee. Mineral salt is fine.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Ramp:</strong> start at 12:12, then 14:10, then 16:8 over 2-3 weeks. Sudden 16:8 from a standard 12-hour pattern is brutal.</p>
    `)}
    ${p(`Best for: 50+ with stubborn BP, A1c 5.7+, central fat that won't budge, post-menopausal weight gain. Most clients see A1c drop 0.4-0.8 in 90 days and 8-12 mmHg systolic drop alongside.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — the doctor conversation script. Lab requests, supplement disclosure, deprescribing language. The single most-requested document I've ever made.`)}
    ${upsellFooter({ kicker: 'WANT THIS PROTOCOL FOR YOUR SPECIFIC BODY?', body: 'Fasting is a CONDITIONAL protocol. The diagnostic screens whether your case is a fit and writes the timing + supplements + meal-window for YOUR body. \$297, 60 min.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: highest-leverage metabolic intervention available without supplements.

16:8 INTERMITTENT FASTING. INSULIN RECEPTORS RESENSITIZE. BP FOLLOWS.

In the fasted state, insulin drops near baseline. 16 hours of low insulin daily restores receptor sensitivity. Sensitive receptors = less insulin needed = less sodium retention = less BP elevation.

Sutton 2018: improved insulin sensitivity + BP + oxidative stress without weight loss. Mattson 2017: 6-10 mmHg systolic drop over 8-12 weeks.

SAFETY SCREEN — DO NOT SKIP:
NOT for: disordered eating history, type 1 diabetes, pregnancy, underweight, children, anyone on sulfonylureas (glipizide) without prescriber supervision.
Metformin alone: OK. Insulin or sulfonylureas: talk to prescriber FIRST.

PROTOCOL:
→ Window: 11 AM to 7 PM (adjust ±2 hours)
→ During fast: water, unsweetened tea, black coffee, mineral salt
→ Ramp: 12:12 → 14:10 → 16:8 over 2-3 weeks

Best for: 50+, stubborn BP, A1c 5.7+, central fat, post-menopausal weight gain. ~0.4-0.8 A1c drop + 8-12 mmHg systolic in 90 days.

Tomorrow: the doctor conversation script.

Joel
RN, BraveWorks

P.S. Fasting is conditional. $297 diagnostic screens fit + writes timing for YOUR body: ${COACHING_URL}
`,
};

const day28 = {
  subject: 'The doctor conversation that gets cardiologists engaged',
  subjectB: 'Day 28 — the script most patients never bring',
  preview: 'A one-page document. Lab requests, supplement disclosure, deprescribing language. Doctors respect this.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today: the single most useful document I've ever built for BP patients.`, { margin: '0 0 24px' })}
    ${bigQuote('Doctors respond to data + structure + respect for their role. Bring those three things and the conversation shifts.')}
    ${p(`Most patients walk into their cardiologist's office with anxiety and questions and no organized information. The doctor has 12 minutes, defaults to "let's adjust the dose," and you leave with another pill. Bring a one-page script with your home BP log, your supplement list, your lab requests, and the deprescribing question — and the entire visit changes.`)}
    ${p(`Here's the structure of the conversation:`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">1. The data.</strong> Two weeks of morning + evening BP readings, on paper, with dates. Average + best + worst. No commentary.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">2. The labs you want run.</strong> A1c, fasting glucose, fasting insulin, HOMA-IR, RBC magnesium, potassium, vitamin D, TSH + free T3 + free T4. One bullet list.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">3. The supplements you're taking.</strong> Disclose every one. Even the unsexy ones. Don't surprise them with hibiscus while they're on lisinopril.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. The deprescribing question.</strong> "Given the trend, would you consider tapering [specific medication name] over the next 90 days?" Specific. Time-bounded. Their decision.</p>
    `)}
    ${p(`The phrase that opens the conversation: <em>"I'm not asking you to stop the medication. I'm asking whether the data supports tapering it under your supervision."</em> Most doctors will engage with this. The few who don't, you change doctors.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow — your loudest Pressure, revisited. And what to do if 28 days of protocols haven't moved your numbers enough.`)}
    ${upsellFooter({ kicker: 'WANT THE SCRIPT IN YOUR HAND TOMORROW?', body: 'The \$297 BP Triangle Diagnostic Session ends with a doctor-conversation script customized to YOUR meds, YOUR labs, YOUR loudest Pressure. Bring it to your next appointment. Six slots this week.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today: the most useful document I've ever built for BP patients.

DOCTORS RESPOND TO DATA + STRUCTURE + RESPECT FOR THEIR ROLE.

Most patients walk in with anxiety + questions + no organized info. Doctor has 12 min, defaults to "let's adjust the dose," you leave with another pill.

Bring a one-page script and the visit changes.

THE STRUCTURE:
1. THE DATA — 2 weeks of AM/PM BP readings on paper, with dates. Average + best + worst.
2. THE LABS — A1c, fasting glucose, fasting insulin, HOMA-IR, RBC Mg, K, Vit D, TSH/T3/T4.
3. THE SUPPLEMENTS — disclose everything. Especially hibiscus if on lisinopril.
4. THE DEPRESCRIBING QUESTION — "Given the trend, would you consider tapering [specific med] over the next 90 days?"

The opening phrase:
"I'm not asking you to stop the medication. I'm asking whether the data supports tapering it under your supervision."

Most doctors engage with this. The few who don't, you change doctors.

Tomorrow: your loudest Pressure revisited. And what to do if 28 days hasn't moved your numbers enough.

Joel
RN, BraveWorks

P.S. $297 diagnostic ends with a customized doctor-conversation script — for YOUR meds, YOUR labs, YOUR Pressure: ${COACHING_URL}
`,
};

const day29 = {
  subject: 'If 28 days hasn\'t moved your numbers enough',
  subjectB: 'Day 29 — the four reasons the protocol stalls',
  preview: 'Most plateaus are one of four things. Here\'s how to identify yours.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Tomorrow is your last day in this sequence. Before the close, the diagnostic question:`, { margin: '0 0 24px' })}
    ${bigQuote('If 28 days of protocols haven\'t moved your numbers enough — there are four reasons, and only four.')}
    ${p(`After teaching this material for years, I can almost always trace a stalled protocol to one of four root causes. Read these honestly. The one you keep circling back to is probably yours.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Wrong Pressure focus.</strong> You optimized for vascular when cortisol was the real driver. You did hibiscus + garlic + magnesium for six weeks and your numbers barely moved because your loudest corner was Stress Pressure (cortisol) the whole time. The fix is identifying YOUR corner.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Inconsistent execution.</strong> 4 days a week of magnesium isn't a magnesium protocol. 3 days a week of walking after meals isn't a walking protocol. Most "this isn't working" cases are actually "I'm not doing it" cases. Track for a week — honestly — and see what's actually going in.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">3. Medication interaction.</strong> Your protocol is being undermined by something your prescriber gave you. Beta-blockers blunt the magnesium response. PPIs flush magnesium AND deplete vitamin B12. Statins reduce CoQ10. Diuretics flush everything. The conversation with your doctor (Day 28) catches this.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. Hidden contributor.</strong> Sleep apnea (undiagnosed in 40% of hypertensives), hidden hyperaldosteronism (5-10%), pheochromocytoma (rare but missed), undiagnosed thyroid dysfunction. These need labs + sometimes specialist evaluation. The diagnostic catches the first three; #4 catches the rest.</p>
    `)}
    ${p(`If you read these and one of them lit up — that's your next focus. Tomorrow's the graduation message. After that the daily emails slow down and we move into the long-term re-engagement cadence.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If reason #1 or #2 hit closest to home — the diagnostic is the fastest fix. 60 min with me, your loudest Pressure named, your protocol customized. Six slots this week.`)}
    ${upsellFooter({ kicker: 'THE FASTEST PATH OUT OF A STALL', body: 'The \$297 BP Triangle Diagnostic Session does in 60 minutes what 28 days of guessing can\'t — names your specific corner and writes the specific protocol for YOUR body.', ctaLabel: 'Book the diagnostic →', ctaUrl: COACHING_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Tomorrow is your last day in this sequence. Before the close:

IF 28 DAYS OF PROTOCOLS HASN'T MOVED YOUR NUMBERS — THERE ARE FOUR REASONS, AND ONLY FOUR.

After teaching this for years, I can almost always trace a stalled protocol to one of these.

1. WRONG PRESSURE FOCUS. You optimized for vascular when cortisol was the real driver. The fix is identifying YOUR corner.

2. INCONSISTENT EXECUTION. 4 days a week of magnesium isn't a magnesium protocol. Most "this isn't working" cases are actually "I'm not doing it" cases.

3. MEDICATION INTERACTION. Beta-blockers blunt magnesium. PPIs flush Mg + B12. Statins reduce CoQ10. The doctor conversation (Day 28) catches this.

4. HIDDEN CONTRIBUTOR. Undiagnosed sleep apnea (40% of hypertensives), hyperaldosteronism (5-10%), thyroid dysfunction. Labs + sometimes specialist needed.

Read these honestly. The one you keep circling back to is probably yours.

Tomorrow: graduation.

Joel
RN, BraveWorks

P.S. Reason #1 or #2? $297 diagnostic does in 60 min what 28 days of guessing can't: ${COACHING_URL}
`,
};

const day30 = {
  subject: 'You\'re not the same person you were 30 days ago',
  subjectB: 'Day 30 — graduation',
  preview: 'The framework is yours. The protocols are yours. The doctor conversation is yours. Here\'s what comes next.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Day 30. Last note in the foundational sequence.`, { margin: '0 0 24px' })}
    ${bigQuote('You\'re not the same person you were 30 days ago. You know things now most people on BP medication never learn.')}
    ${p(`Thirty days ago you came into this list with a question. Maybe "why isn't my BP coming down?" Maybe "what are these pills actually doing?" Maybe "is there another way?" Whatever it was, you stuck around. You read. You probably started doing some of this.`)}
    ${p(`Here's what you have now that most patients in cardiology offices don't:`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The framework.</strong> Three Pressures. Your numbers are the output of inputs you can identify.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The protocols.</strong> Magnesium, hibiscus, garlic, hydration with minerals, sleep architecture, box breathing, gratitudes, walking, meal sequencing. Every one is on the right side of the evidence.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">The doctor conversation.</strong> Data + structure + the deprescribing language. The visit that changes the relationship.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">The honest question.</strong> When 28 days hasn't moved your numbers, you know it's one of four causes — and you know how to find which.</p>
    `)}
    ${p(`<strong>From here, three paths.</strong>`, { margin: '0 0 18px' })}
    ${p(`<strong>Path 1 — keep going on your own.</strong> The framework is yours forever. Run your protocol. Bring your doctor the script. Most clients who stay the course see real numbers move over the next 90 days.`)}
    ${p(`<strong>Path 2 — the BP Triangle Diagnostic Session.</strong> 60 minutes with me, $297, custom written protocol, 30 days of follow-up email coaching. Best for: cases where you've tried the foundation and want personalization. The buyer-only door (your $17 Kit credit applies → $280) is always open via the email I sent earlier this week.`)}
    ${p(`<strong>Path 3 — re-engagement.</strong> You stay on the list. From here, emails come less often — weekly recap on new research, the occasional case study, big announcements. The relationship continues even when the daily emails stop.`, { margin: '0 0 28px' })}
    ${p(`Whatever you pick, I'm glad you read these. The information matters. What you do with it matters more.`)}
    ${joelSignoff()}
    ${psBox(`If you've moved your numbers from this sequence — hit reply and tell me. I read every one. The reason I write these is because the stories come back. Yours is one of them.`)}
    ${upsellFooter({ kicker: 'THE FULL KIT IF YOU DON\'T HAVE IT', body: 'The \$47 BP Reset Kit consolidates every protocol from the 30-day sequence into a printable 8-PDF reference library. Doctor conversation script + cookbook + tracker. If you only ever buy one BraveWorks product, make it this one.', ctaLabel: 'Get the Reset Kit ($47) →', ctaUrl: RESET_KIT_URL })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Day 30. Last note in the foundational sequence.

YOU'RE NOT THE SAME PERSON YOU WERE 30 DAYS AGO. YOU KNOW THINGS NOW MOST PATIENTS NEVER LEARN.

What you have now:
→ THE FRAMEWORK. Three Pressures. Your numbers are the output of inputs you can identify.
→ THE PROTOCOLS. Magnesium, hibiscus, garlic, hydration, sleep, breathing, gratitudes, walking, sequencing. All on the right side of the evidence.
→ THE DOCTOR CONVERSATION. Data + structure + deprescribing language.
→ THE HONEST QUESTION. When 28 days hasn't moved numbers, you know the four causes.

FROM HERE, THREE PATHS:

PATH 1 — KEEP GOING ON YOUR OWN. Framework is yours forever. Most clients who stay the course see numbers move over the next 90 days.

PATH 2 — THE DIAGNOSTIC. 60 min with me, $297, custom protocol, 30-day email coaching. Your $17 Kit credit applies → $280. Buyer-only door is always open.

PATH 3 — RE-ENGAGEMENT. Emails come less often. Weekly recap on research, case studies, announcements. Relationship continues.

Whatever you pick, I'm glad you read these.

Joel
RN, BraveWorks

P.S. Moved your numbers? Hit reply. I read every one.

—
→ $47 BP Reset Kit (the consolidated reference library): ${RESET_KIT_URL}
→ Skool: ${SKOOL_URL}
`,
};

export const DAYS = { 1: day1, 2: day2, 3: day3, 4: day4, 5: day5, 6: day6, 7: day7, 8: day8, 9: day9, 10: day10, 11: day11, 12: day12, 13: day13, 14: day14, 15: day15, 16: day16, 17: day17, 18: day18, 19: day19, 20: day20, 21: day21, 22: day22, 23: day23, 24: day24, 25: day25, 26: day26, 27: day27, 28: day28, 29: day29, 30: day30 };

// ─── Email shell renderer ─────────────────────────────────────────────
export function renderEmailShell({ subject, preview, bodyHtml, dayNum, totalDays = 30 }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${subject}</title>
  <style>body{margin:0;padding:0;background:${PALETTE.outerBg};} a{color:${PALETTE.accentClay};}</style>
</head>
<body style="margin:0;padding:0;background:${PALETTE.outerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.outerBg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 18px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;">BraveWorks Health</div>
          <div style="font-size:11px;letter-spacing:0.08em;color:${PALETTE.textSoft};margin-top:4px;">30-Day BP Reset · Day ${dayNum} of ${totalDays}</div>
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PALETTE.cardBg};border-radius:14px;box-shadow:0 1px 2px rgba(44,62,80,0.04);">
        <tr><td style="padding:36px 36px 32px;">${bodyHtml}</td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 16px 0;text-align:center;">
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">This is health education from Joel Polley, RN, BraveWorks Health. Not medical advice. If your BP reads above 180/120, seek emergency care. Always consult your prescriber before changing any medication or supplement.</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">BraveWorks Health · 4730 South Fort Apache Road, Suite 300, Las Vegas, NV 89147</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">You're getting this because you're on Joel's BraveWorks list. <a href="#" style="color:#8A8A8A;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Top-level render ─────────────────────────────────────────────────
export function renderEmail(day, ctx) {
  const d = DAYS[day];
  if (!d) throw new Error(`Day ${day} not defined in DAYS map`);
  return {
    from: FROM,
    replyTo: REPLY_TO,
    subject: d.subject,
    html: renderEmailShell({
      subject: d.subject,
      preview: d.preview,
      bodyHtml: d.htmlBody(ctx),
      dayNum: day,
    }),
    text: d.textBody(ctx),
    headers: {
      'X-Entity-Ref-ID': `bpquiz-drip-day${day}-${ctx.email}-${Date.now()}`,
    },
    tags: [
      { name: 'campaign', value: 'bpquiz-7day-onboarding' },
      { name: 'day', value: String(day) },
    ],
  };
}
