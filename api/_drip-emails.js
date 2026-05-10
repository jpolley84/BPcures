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
export const KIT_URL = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL = 'https://www.youtube.com/@braveworksrn';

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
    ${psBox(`If your BP didn't move yet, that's normal. Marlene didn't see her drop until Day 7. The mechanism I'll explain tomorrow is what tells your body it's safe to come down. Most people feel it before they see the numbers.`)}
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
    ${psBox(`If you're on a potassium-sparing diuretic (like spironolactone or amiloride), check with your prescriber before loading up. Almost everyone else is dramatically under-consuming it.`)}
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
    ${p(`The Cook For Life Cookbook inside the kit is built for exactly this — recipes that don't taste like cardboard, don't take an hour to make, and don't spike insulin.`)}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${joelSignoff()}
    ${psBox(`The fastest BP drops I see in BraveWorks members come from those who eliminate hidden sodium AND a refined-carb category in the same week. We're stacking the levers on purpose.`)}
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

→ Get the BP Reset Kit ($17): ${KIT_URL}
Cook For Life Cookbook inside has the recipes.

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
    ${p(`If you've been reading along but haven't grabbed the kit yet, today's the day. The cuff protocol I mentioned above? It's inside, with diagrams. The 7-Day Refund Promise still applies — if your numbers haven't moved by tomorrow with honest effort, reply "refund" and keep the kit.`)}
    ${ctaButton(KIT_URL, 'Get the BP Reset Kit — $17 →')}
    ${joelSignoff()}
    ${psBox(`If you've already seen 5+ points come off, hit reply and tell me. I read every one.`)}
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

→ Get the BP Reset Kit ($17): ${KIT_URL}
The cuff protocol with diagrams is inside. 7-Day Refund Promise still stands.

Joel
RN, BraveWorks

P.S. If you've seen 5+ points off, reply and tell me.

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
    ${psBox(`Don't have the kit yet? Last call before the back half. Day 8 onward references the cuff protocol, dosing charts, and doctor scripts inside it constantly. <a href="${KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;">Get the BP Reset Kit — $17 →</a>`)}
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

P.S. Don't have the kit? Last call before the back half. ${KIT_URL}

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
const APPLY_URL = `${SITE_URL}/1on1`;

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

// ─── Day map ──────────────────────────────────────────────────────────
export const DAYS = { 1: day1, 2: day2, 3: day3, 4: day4, 5: day5, 6: day6, 7: day7, 8: day8 };

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
