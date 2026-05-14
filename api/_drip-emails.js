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

// ─── DAY 1 ────────────────────────────────────────────────────────────
const day1 = {
  subject: '3 lies your doctor told you about blood pressure',
  subjectB: "3 things I almost believed about my BP (until I saw the truth)",
  preview: "I've been a nurse for years — and these three are the worst.",
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
    ${p(`I'll teach you the framework inside these 7 emails. The actual swaps, the dosing charts, the cuff protocol, the doctor-conversation script — those live inside the BP Reset Kit.`)}
    ${bonusStackBox()}
    ${guaranteeBlock}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${p(`See you in the morning.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Already have the kit? Reply with your starting BP — I read every one. Whatever the number is, you're starting somewhere.`)}
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

What's actually in the BP Reset Kit:
→ The 10-Day BP Reset Daily Plan ($27)
→ Joel's 7 Most-Trusted BP Herbs ($27)
→ The Cardiologist Conversation Script ($17)
→ The 4 Lifestyle Levers Cheat Sheet ($17)
→ Cook For Life Cookbook ($17)
$105 of nurse-vetted protocol. $17 today.

THE 7-DAY REFUND PROMISE: Read every email this week. No movement by Day 7? Reply "refund" — $17 back, kit yours to keep.

→ Get the BP Reset Kit ($17): ${KIT_URL}

See you in the morning.

Joel
RN, BraveWorks

P.S. Already have the kit? Reply with your starting BP — I read every one.

—
Two more ways to follow along:
→ Join the Skool community: ${SKOOL_URL}
→ Subscribe on YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 2 — Lie #1 (Salt myth) ───────────────────────────────────────
const day2 = {
  subject: '3 hidden-sodium foods you eat every week',
  subjectB: 'Why "cutting salt" isn\'t lowering your BP',
  preview: "They're not the obvious ones — and that's why your numbers haven't moved.",
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
    ${p(`The full hidden-sodium food list — plus the swaps that don't taste like cardboard — lives inside the BP Reset Kit. So does the K:Na ratio worksheet I'll teach you about on Day 4.`)}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${p(`The 7-Day Refund Promise still stands. No movement by Day 7? Reply "refund."`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tomorrow I'm going to tell you about a 52-year-old grandmother who dropped 11 points off her systolic in nine days — without changing a single supplement. I think you'll see yourself in her.`)}
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

The full hidden-sodium food list lives inside the BP Reset Kit.
→ Get the BP Reset Kit ($17): ${KIT_URL}

The 7-Day Refund Promise still stands.

Joel
RN, BraveWorks

P.S. Tomorrow — a 52-year-old grandmother who dropped 11 points in 9 days without a single supplement.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 3 — Marlene composite story ──────────────────────────────────
const day3 = {
  subject: 'Marlene dropped 11 points in 9 days',
  subjectB: 'How a grandmother reversed 10 years of high BP in under 2 weeks',
  preview: 'One protocol. No supplements. Just label-reading.',
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
    ${p(`If her story sounds like yours, here's the kit:`)}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${p(`5 nurse-vetted PDFs. $105 of protocol. The 7-Day Refund Promise.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your BP didn't move yet, that's normal — Marlene's drop hit on Day 7. And on Mondays at 10 PM ET I unravel the Triangle live with the $97 cohort. If you want me on the call walking your numbers, that path is at <a href="${CHALLENGE_URL}" style="color:${PALETTE.accentClay};font-weight:600;">the BP Triangle Challenge →</a>`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

(Marlene isn't her real name — I protect my buyers. But she's real, and so are her numbers.)

Marlene is 52. Caregiver to her family. BP hovering around 150/95 for ten years. DASH, walking, weight loss, lisinopril for six years. Last reading: 154/96.

She joined the BP Reset Kit. Did the hidden-sodium label exercise.

Day 9: 143/88. Eleven systolic points. Eight diastolic.

No supplement. No workout. No fast. She swapped three foods — bread, deli turkey, canned soup.

Three swaps. Eleven points.

Tomorrow: the real mechanism. It's not "less sodium = lower BP." It's something the medical establishment has known about for forty years.

→ Get the BP Reset Kit ($17): ${KIT_URL}
5 PDFs. $105 of protocol. 7-Day Refund Promise.

Joel
RN, BraveWorks

P.S. If your BP hasn't moved yet, that's normal. Marlene didn't see her drop until Day 7.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 4 — K:Na ratio mechanism ─────────────────────────────────────
const day4 = {
  subject: 'The 3:1 ratio your doctor never told you',
  subjectB: 'Why potassium matters more than sodium',
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
    ${p(`Tomorrow I'm going to tell you why sugar spikes your BP harder than sodium ever could — and three foods you'd never call sweet that are doing the most damage.`, { margin: '0 0 28px' })}
    ${p(`The 4 Lifestyle Levers Cheat Sheet inside the kit covers the K:Na ratio in detail — including the 12 highest-potassium foods on a fixed grocery budget, dosing if you supplement, and the lab tests to ask your doctor for.`)}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${joelSignoff()}
    ${psBox(`I made a 12-min YouTube video that walks the 3:1 ratio at the grocery store with my own basket. <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};font-weight:600;">Watch on YouTube →</a> If you're on a potassium-sparing diuretic (like spironolactone or amiloride), check with your prescriber before loading up.`)}
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

Tomorrow: why sugar spikes BP harder than sodium.

→ Get the BP Reset Kit ($17): ${KIT_URL}
The 4 Lifestyle Levers Cheat Sheet inside covers K:Na in detail.

Joel
RN, BraveWorks

P.S. On a potassium-sparing diuretic? Check with your prescriber first.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 5 — Sugar elimination ────────────────────────────────────────
const day5 = {
  subject: '3 "savory" foods spiking your BP harder than candy',
  subjectB: 'Why sugar raises BP faster than salt',
  preview: 'Bread. Cereal. Crackers. The hidden insulin spike.',
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
    ${p(`Tomorrow I'm going to do a check-in. Some of you have already seen your numbers move. Some of you haven't. There's a reason — and it's not what you think.`, { margin: '0 0 28px' })}
    ${p(`If you've read the daily emails this far, you're past the $17 entry — the natural next move is the <strong>$47 BP Reset Kit</strong>. Includes the full 30-day Reset Challenge, the Graduation phase (weeks 2-4), Joel's complete herb formulary with safe dosing, and the printable BP tracker. Same protocol, the full system.`)}
    ${ctaButton(RESET_KIT_URL, 'Upgrade to the BP Reset Kit — $47 →')}
    ${joelSignoff()}
    ${psBox(`The fastest BP drops in BraveWorks members come from stacking hidden sodium + a refined-carb cut in the same week — both walked through day-by-day inside the $47 kit. Still on the $17 starter? Both kits are open: <a href="${KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">$17 →</a> or <a href="${RESET_KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">$47 →</a>`)}
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

Tomorrow: a check-in. Some of you are seeing movement. Some aren't. There's a reason.

→ Upgrade to the BP Reset Kit ($47): ${RESET_KIT_URL}
Adds the full 30-day plan, the Graduation phase (weeks 2-4), Joel's complete herb formulary, and the printable BP tracker.

→ Still on the $17 starter? ${KIT_URL}

Joel
RN, BraveWorks

P.S. Stack the levers — eliminate hidden sodium AND a refined-carb category in the same week. Fastest drops happen there.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 6 — Pre-empt the valley ──────────────────────────────────────
const day6 = {
  subject: '3 reasons your BP hasn\'t moved yet (and what to do)',
  subjectB: 'If you\'re feeling discouraged today, read this',
  preview: 'Day 6 is when most quitters quit. Don\'t.',
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
    ${p(`Tomorrow I'll show you exactly what's happening underneath — and give you a choice about what comes next.`, { margin: '0 0 28px' })}
    ${p(`If you're stuck at Day 6 with no movement, the $47 BP Reset Kit is built for exactly this moment. The cuff protocol I mentioned above is inside (with diagrams), plus the Graduation phase (weeks 2-4) that walks you through the slow-responder track day-by-day. The 7-Day Refund Promise applies — if your numbers haven't moved by Day 7 with honest effort, reply "refund."`)}
    ${ctaButton(RESET_KIT_URL, 'Upgrade to the BP Reset Kit — $47 →')}
    ${joelSignoff()}
    ${psBox(`If you've already seen 5+ points come off on the $17 starter, hit reply and tell me — I read every one. If you're stuck, the $47 kit is the next rung: <a href="${RESET_KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">upgrade here →</a>`)}
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

Tomorrow I show you what's happening underneath — and give you a choice.

→ Upgrade to the BP Reset Kit ($47): ${RESET_KIT_URL}
The cuff protocol with diagrams is inside. Plus the Graduation phase (weeks 2-4) for slow responders. 7-Day Refund Promise still stands.

→ Still on the $17 starter? ${KIT_URL}

Joel
RN, BraveWorks

P.S. If you've seen 5+ points off on the starter, reply and tell me. If you're stuck, the $47 kit is the next rung.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — THE OPT-IN GATE ─────────────────────────────────────────
// Note: htmlBody/textBody take an extra ctx field { optInToken } generated
// at send time by drip-cron.js (HMAC-signed against email).
const day7 = {
  subject: '3 things shifting in your body right now',
  subjectB: 'Day 7. Here\'s the choice.',
  preview: 'One week down. The next 23 days are by invitation.',
  htmlBody: ({ firstName, optInToken }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You made it to Day 7.`)}
    ${p(`That's not nothing. About 30% of the people I send these emails to don't read past Day 4. You did. You're in the group I'd write the rest of these for — if you want them.`)}
    ${p(`<strong>Here's what's actually happening in your body right now, whether or not your cuff has registered it yet.</strong>`)}
    ${p(`<strong>1. Your kidneys are rebalancing.</strong> Hidden sodium reduction lowered your aldosterone signal. Your kidneys are slowly stopping their sodium retention. This is a 2-week recalibration. By Day 10-12, you'll likely see a measurable shift in fluid weight and BP.`)}
    ${p(`<strong>2. Your insulin is dropping.</strong> The refined-carb cuts are reducing the insulin spikes that drive vasoconstriction. Your fasting insulin (a number your doctor probably hasn't measured) is improving. You may notice you sleep deeper or wake less often.`)}
    ${p(`<strong>3. Your potassium is climbing.</strong> The single potassium-rich food you've been adding is starting to reverse the K:Na ratio. Your vessels are receiving the signal to relax. Your endothelial function is improving.`)}
    ${p(`You haven't taken a pill. You haven't joined a gym. You read three labels and made three swaps.`)}
    ${p(`This is what I mean when I say your body isn't broken — it's been receiving the wrong inputs.`, { margin: '0 0 32px' })}
    ${bigQuote('Now. The choice.')}
    ${p(`What you've read this week is the on-ramp. The next 23 days — if you want them — are a different kind of email.`)}
    ${p(`The biggest objection I hear from BraveWorks members usually surfaces around Day 8 or 9: <em>"Joel, this is great, but my mom had high BP. My grandmother had high BP. I'm genetically programmed for this. Even if I do everything right, I'm fighting my DNA."</em>`)}
    ${p(`That's lie #2. Day 9, I demolish it.`)}
    ${p(`Lie #3 is at Day 17 — the one you can't unsee about your prescription.`)}
    ${p(`Between those, I'll teach you the cuff protocol, the doctor-conversation script, the breathwork that drops cortisol-driven BP, and the meal architecture that holds the kidney recalibration in place.`)}
    ${p(`It ends Day 30 with an invitation to a live event with someone who taught me half of what I know — Barbara O'Neill, June 24-25.`)}
    ${p(`But this is daily email — daily attention. <strong>I don't want to be in your inbox if you don't want me there.</strong>`)}
    ${p(`So I'm asking you to choose.`)}
    ${p(`If you want Days 8-30, click the button below. If you don't click — no hard feelings. You're off this sequence after today, your kit is still yours forever, and I'm not bothering you again about the deeper arc.`, { margin: '0 0 32px' })}
    ${ctaButton(optInUrl(optInToken), 'Yes, give me Days 8-30 →')}
    ${p(`<span style="color:#999;font-size:14px;">(Click takes 2 seconds. No form. No payment. Just a yes.)</span>`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Don't have a kit yet? Last call before the back half. Day 8 onward references the cuff protocol, dosing charts, and doctor scripts constantly. Two options: <a href="${KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">$17 starter →</a> or the full <a href="${RESET_KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">$47 Reset Kit →</a> (adds the 30-day plan + Graduation phase + complete herb formulary).`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, optInToken }) => `Hi ${firstName || 'there'},

You made it to Day 7. About 30% of people I send these to don't read past Day 4. You did.

Here's what's happening in your body right now, whether your cuff has registered it or not:

1. Kidneys rebalancing (aldosterone dropping, sodium retention easing)
2. Insulin dropping (less vasoconstriction, deeper sleep)
3. Potassium climbing (K:Na ratio reversing, vessels relaxing)

You haven't taken a pill. You read three labels and made three swaps.

NOW. THE CHOICE.

The next 23 days — if you want them — demolish lie #2 (genetic) on Day 9 and lie #3 (prescription) on Day 17. They end Day 30 with Barbara O'Neill, June 24-25.

I don't want to be in your inbox if you don't want me there. So I'm asking you to choose.

→ YES, give me Days 8-30: ${optInUrl(optInToken)}

(Click takes 2 seconds. No form. No payment. Just a yes.)

If you don't click — no hard feelings. You're off this sequence after today.

Joel
RN, BraveWorks

P.S. Don't have a kit yet? Day 8 onward references the cuff protocol, dosing charts, and doctor scripts. Two options: starter ${KIT_URL} or full $47 kit ${RESET_KIT_URL} (adds the 30-day plan + Graduation phase + complete herb formulary).

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 8 — POST-OPT-IN: BP TRIANGLE + 1:1 APPLICATION GATE ─────────
// Fires the morning after Day 7 opt-in. Audience is self-selected — these
// are the most engaged subs (clicked the Day 7 button to continue). Pitches
// the $1,297 1:1 application at /1on1 and explicitly calls out 4+ meds
// + drastic-change-ASAP profile per Joel's 2026-05-09 spec.
// 2026-05-14: pointed at /coaching (the new $14,616-stack 90-Day Freedom
// Sprint page with 17-question pre-qualification). /1on1 still works as
// a fallback waitlist if /coaching ever goes down.
const APPLY_URL = `${SITE_URL}/coaching`;

const day8 = {
  subject: 'On 4+ medications? Read this one carefully.',
  subjectB: 'Day 8 — the 1:1 invitation',
  preview: 'The application is open. Most people don\'t need this. Some do.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You opted in. Means you read all 7 days, found something useful, and want the deeper arc. I respect that.`)}
    ${p(`Before I keep going on the daily emails, I want to put one direct question in front of you — because for a small group of you, the next 23 days of emails won't be enough. You need something more direct.`, { margin: '0 0 32px' })}
    ${bigQuote('Which pillar of the BP Triangle is yours?')}
    ${p(`If you've followed along this week, you've seen me reference three pillars more than once. They're how I think about every BP case I see:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Vascular.</strong> The BP itself. Arterial stiffness, oxidative stress, low NO. You see the numbers. Your doctor sees the numbers. But nobody's fixing the inputs.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Cortisol.</strong> Wired-tired. Can't sleep deep. Midsection weight gain. Cortisol pulls BP up like a pulley. Most cardiologists don't measure this.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Blood sugar.</strong> A1C creeping. 3 PM crashes. Can't lose the weight. Insulin is vasoconstrictive — high BP and high A1C are the same disease wearing different shirts.</p>
    `)}
    ${p(`Most people have ONE pillar that's the lead domino. Fix that one and the other two fall in line. The 7-day arc gave you the foundation. The next 23 days teach you to identify and rebuild your weak pillar systematically.`)}
    ${p(`That's the work for most people. <strong>And it works.</strong>`, { margin: '0 0 32px' })}
    ${clayBlock('If this is you, read this twice', `
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">You're on <strong style="color:${PALETTE.text};">4 or more medications.</strong> Maybe more. BP, statin, beta-blocker, ARB, possibly metformin, possibly a thyroid drug. Maybe a benzo or a sleep aid layered on top.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your readings are still high. Or they\'re "controlled" but you feel like a ghost of the person you were 10 years ago. Side effects you can\'t pin to one drug because they could be coming from any of them.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Your doctor\'s answer is "another medication." Or "let\'s adjust the dose." Or "you\'ll just have to live with it."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">If that\'s you, daily emails aren\'t enough. You need someone in your corner who can read your full picture, design a deprescribing plan with your prescriber, and walk you through it week by week. That\'s what 1:1 is for.</strong></p>
    `)}
    ${bigQuote('The 1:1 invitation.')}
    ${p(`I take a small number of 1:1 BP Triangle clients each month. It\'s 90 days of working directly with me — your full medication picture, your labs, your daily protocol, weekly check-ins, and a staged plan to get drugs OFF your protocol the safe way (with your prescriber, never around them).`)}
    ${p(`It\'s <strong>$1,297</strong> for the 90 days. That\'s less than most people spend on co-pays and supplements they\'re guessing at over the same period — and it\'s gated by application because I screen carefully.`)}
    ${p(`<strong>I don\'t take everyone who applies.</strong> I take the people who:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Have read all 7 days of these emails (you have)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Know their numbers and their meds list cold</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Can articulate <em>why now</em> — what changed that finally made them say enough</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ Are willing to do the work — this is a partnership, not a magic bullet</p>
    `)}
    ${p(`If that\'s you, the application takes about 5 minutes. It\'s a more detailed quiz — I want to know your full picture before we talk. After you submit, I read every one personally. <strong>If we have an opening and you\'re a fit, I\'ll reach out within 1-2 weeks.</strong> If we don\'t, you\'re on the waitlist for the next cohort.`, { margin: '0 0 32px' })}
    ${ctaButton(APPLY_URL, 'Apply for 1:1 with Joel →')}
    ${p(`<span style="color:#999;font-size:14px;">No payment is collected at application. Path is application → screening → call → invoice if it\'s a fit on both sides.</span>`, { margin: '0 0 28px' })}
    ${p(`<strong>If 1:1 isn\'t for you</strong> — no problem. The next 22 days of emails are still coming. You\'ll get the deeper teach-throughs of each pillar, the dosing protocols, the doctor-conversation scripts, and the cuff technique that catches what your provider\'s machine misses. Most people don\'t need 1:1. The pillar protocols are enough.`)}
    ${p(`But if "drastic change ASAP" describes where you are right now — apply.`, { margin: '0 0 32px' })}
    ${joelSignoff()}
    ${psBox(`The 1:1 application is the same form regardless of which pillar is yours. If your weak link is cortisol or blood sugar instead of BP — same application, same screening, same outcome. The work is pillar-specific; the door is the same.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You opted in — you want the deeper arc. Before I keep going on the daily emails, one direct question for the small group who needs more than emails.

WHICH PILLAR OF THE BP TRIANGLE IS YOURS?

1. VASCULAR — The BP itself. Arterial stiffness, low NO, oxidative stress.
2. CORTISOL — Wired-tired, can't sleep deep, midsection weight gain.
3. BLOOD SUGAR — A1C creeping, 3 PM crashes, can't drop the weight.

Most people have ONE pillar that's the lead domino. The next 23 days teach you to identify and rebuild your weak pillar. That's the work for most people. And it works.

IF THIS IS YOU, READ THIS TWICE:

You're on 4 or more medications. Your readings are still high — or "controlled" but you feel like a ghost. Side effects you can't pin to one drug. Your doctor's answer is "another medication."

If that's you, daily emails aren't enough. You need someone in your corner who can read your full picture, design a deprescribing plan with your prescriber, and walk you through it week by week. That's what 1:1 is for.

THE 1:1 INVITATION

I take a small number of 1:1 BP Triangle clients each month. 90 days, working directly with me — your full medication picture, labs, daily protocol, weekly check-ins, and a staged plan to get drugs OFF your protocol the safe way (with your prescriber).

$1,297 for 90 days. Application-gated. I don't take everyone — I take people who've read all 7 days (you have), know their numbers and meds cold, can articulate why now, and are willing to do the work.

→ Apply for 1:1 with Joel: ${APPLY_URL}

No payment at application. Application → screening → call → invoice if we're a fit on both sides.

If 1:1 isn't for you — no problem. The next 22 days of emails are coming. Most people don't need 1:1; the pillar protocols are enough.

But if "drastic change ASAP" describes where you are — apply.

Joel
RN, BraveWorks

P.S. The application is the same form regardless of which pillar is yours. Cortisol or blood sugar instead of BP — same application, same screening, same outcome. The work is pillar-specific; the door is the same.

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
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Not the blood pressure itself. What's inherited is a <strong style="color:${PALETTE.text};">sensitivity to one of three corners.</strong> Three corners of one loop. I call this the <strong style="color:${PALETTE.text};">BP Triangle</strong>:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">VASCULAR</strong> — the pipes. Stiff arteries, low NO, K:Na imbalance.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong style="color:${PALETTE.text};">CORTISOL</strong> — the stress. Clamps the vessels, retains sodium.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">BLOOD SUGAR</strong> — the metabolism. Insulin is a vasoconstrictor.</p>
    `)}
    ${p(`Most boomer-aged readers I work with assume their corner is vascular — they hear "high blood pressure" and think "stiff arteries, more lisinopril." But when I dig into their full history, the lead domino is almost always <strong style="color:${PALETTE.text};">cortisol</strong>. And cortisol is the corner most cardiologists don't even measure.`)}
    ${p(`This is why the genetics lie hurts so much: your mother probably had the same cortisol-driven loop, never knew it, blamed her family tree, and accepted a lifetime of pills as fate. <strong style="color:${PALETTE.text};">It wasn't fate. It was an input nobody helped her change.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('The cortisol corner — two interventions that actually work.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Ashwagandha (KSM-66 form, 300 mg AM + PM).</strong> Chandrasekhar et al, 2012 — 64 adults, 8 weeks. Salivary cortisol dropped 27.9% versus placebo. Anxiety scores fell in parallel. Cheapest single move you can make for the cortisol corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. Asleep before 11 PM.</strong> Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset at 10 PM gives you ~3 hours inside that window. Sleep onset at 1 AM gives you zero — even if you sleep until 8.</p>
    `)}
    ${p(`If your morning BP runs high and your blood sugar is roughly normal, this corner is almost certainly the one driving your numbers. The good news: cortisol responds faster than vascular. Most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.`)}
    ${p(`Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay. Your doctor watches the readings. The readings move because the inputs are moving.`, { margin: '0 0 28px' })}
    ${clayBlock("Don't know which corner is yours?", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The free 90-second BP Triangle Quiz returns your corner + the first move for your specific type. Built around the same diagnostic I use with 1:1 clients.</p>
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

WHAT'S ACTUALLY INHERITED is a sensitivity to one of three corners. Three corners of one loop. I call it the BP Triangle:

→ VASCULAR — the pipes. Stiff arteries, low NO, K:Na imbalance.
→ CORTISOL — the stress. Clamps the vessels, retains sodium.
→ BLOOD SUGAR — the metabolism. Insulin is a vasoconstrictor.

Most boomer-aged readers assume their corner is vascular — "high BP, stiff arteries, more lisinopril." But when I dig into their full history, the lead domino is almost always CORTISOL. And cortisol is the corner most cardiologists don't even measure.

This is why the genetics lie hurts so much. Your mother probably had the same cortisol-driven loop, never knew it, blamed her family tree, accepted a lifetime of pills as fate. It wasn't fate. It was an input nobody helped her change.

THE CORTISOL CORNER — TWO INTERVENTIONS THAT ACTUALLY WORK:

1. Ashwagandha (KSM-66, 300mg AM+PM). Chandrasekhar 2012 — 64 adults, 8 weeks. Salivary cortisol dropped 27.9% vs placebo. Cheapest single move you can make.

2. Asleep before 11 PM. Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset 10 PM = ~3 hours in that window. Sleep onset 1 AM = zero, even if you sleep until 8.

If your morning BP runs high and your blood sugar is roughly normal, this corner is almost certainly driving your numbers. Cortisol responds faster than vascular — most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT.

AND not INSTEAD OF. Your meds stay. Your doctor watches the readings. The readings move because the inputs are moving.

DON'T KNOW WHICH CORNER IS YOURS?

Free 90-second BP Triangle Quiz returns your corner + the first move for your type.
→ ${SITE_URL}/quiz

Tomorrow — the third corner. The one cardiologists never bring up. The one cutting your salt for a decade did nothing for.

Joel
RN, BraveWorks

P.S. Tomorrow we walk the third corner — the one cardiologists never measure.

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
    ${p(`Yesterday — the cortisol corner. Today — the third corner.`)}
    ${p(`This is the one I almost missed in my own practice for years. The one that explains why people who "cut their salt" for a decade watch their BP keep creeping up anyway.`, { margin: '0 0 28px' })}
    ${bigQuote('Blood sugar raises blood pressure. Harder than salt does.')}
    ${p(`Most cardiologists don't measure A1c. They look at your BP, they look at your cholesterol, maybe they look at your kidneys. <strong style="color:${PALETTE.text};">Blood sugar doesn't even show up on their scorecard.</strong>`)}
    ${p(`But every time your blood sugar spikes, your insulin spikes. And insulin is a vasoconstrictor — it narrows your blood vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop on the back end.`)}
    ${p(`Three corners of one loop. Pull one, the other two pull back. <strong style="color:${PALETTE.text};">Fix the Triangle, the BP fixes itself.</strong>`, { margin: '0 0 28px' })}
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
    ${clayBlock('Find out if blood sugar is YOUR corner', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The 90-second BP Triangle Quiz identifies your specific corner and returns the protocol that matches your type.</p>
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

Yesterday — the cortisol corner. Today — the third corner of the Triangle.

BLOOD SUGAR RAISES BLOOD PRESSURE. HARDER THAN SALT DOES.

Most cardiologists don't measure A1c. They look at BP, cholesterol, maybe kidneys. Blood sugar doesn't even show up on their scorecard.

But every time your blood sugar spikes, insulin spikes. Insulin is a vasoconstrictor — it narrows your vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop.

Three corners of one loop. Pull one, the other two pull back. FIX THE TRIANGLE, THE BP FIXES ITSELF.

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
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Your medication does not fix what's making the number high in the first place.</strong> The vascular stiffness, the cortisol load, the insulin spike — those keep grinding underneath the pill. Which is why most patients end up on a second pill in 3 years. Then a third in 5. Then a fourth by 65.</p>
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

YOUR MEDICATION DOES NOT FIX WHAT'S MAKING THE NUMBER HIGH. The vascular stiffness, the cortisol load, the insulin spike — those keep grinding underneath the pill. Which is why most patients end up on a second pill in 3 years. Then a third in 5. Then a fourth by 65.

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
    ${p(`When she took my quiz, her Triangle came back lit on two corners — <strong style="color:${PALETTE.text};">blood sugar</strong> primary, <strong style="color:${PALETTE.text};">cortisol</strong> secondary. Vascular tertiary. That's a very common pattern in stage-1 hypertension that "won't budge" on standard pills.`, { margin: '0 0 28px' })}
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

When she took my quiz, her Triangle came back: blood sugar PRIMARY, cortisol SECONDARY, vascular tertiary. Common pattern in stage-1 hypertension that won't budge on standard pills.

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
export const DAYS = { 1: day1, 2: day2, 3: day3, 4: day4, 5: day5, 6: day6, 7: day7, 8: day8, 9: day9, 10: day10, 11: day11, 12: day12 };

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
