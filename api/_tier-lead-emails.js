// _tier-lead-emails.js — LEAD state sequence ($0, pre-purchase).
//
// Audience: just gave email via quiz / lead-magnet / exit-popup. State = `lead`.
// Goal: convert to $17 BP Starter buyer in ≤21 days.
// Length: 10 emails over 21 days (Day 0, 1, 3, 5, 7, 10, 13, 16, 19, 21).
// Pitch rule: $17 KIT_URL only. NEVER pitch $47 / $97 / $297 / $1,997 in this arc.
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }
//
// Author: Joel Polley, RN, BraveWorks Health. Spec v1.0 2026-05-17.

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

function footerSecondaryCTAs() {
  return `<div style="margin-top:24px;padding:20px 22px;background:${PALETTE.outerBg};border-radius:10px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:12px;">Two more ways to follow along</div>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 10px;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Join the Skool community</a> &nbsp;<span style="color:#999;">— "How to Be Your Own Doctor"</span></p>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">→ <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on YouTube</a> &nbsp;<span style="color:#999;">— deeper teachings, weekly</span></p>
  </div>`;
}

function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

// ─── DAY 0 — Welcome + Triangle map delivery ──────────────────────────
const day0 = {
  subject: 'Your BP Triangle map is inside',
  subjectB: '[Name], your map from Joel',
  preview: 'The three pressures behind every BP number — yours included.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You just told me your blood pressure is one of the things on your mind. I want you to know — that quiet decision to put your email in mattered.`)}
    ${p(`I'm Joel. RN for 20 years — most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I now run BraveWorks, and the women in my world are mostly 50 to 70, mostly on at least one BP medication, and mostly tired of being told "it's just genetic."`)}
    ${p(`It's not just genetic. And I'm going to show you why.`)}
    ${bigQuote('Your map: the BP Triangle Method.')}
    ${p(`Every blood pressure number — yours, your husband's, your sister's — is being pushed up by some combination of three forces. I call them the Three Pressures. Most plans only address one. That's why most plans plateau.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The Three Pressures</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Stress Pressure</strong> — your cortisol stays high. Sleep is light, mornings are tight, the alarm goes off and your shoulders are already at your ears.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Sugar Pressure</strong> — your insulin is doing the constricting. White bread, cereal, the 3 PM cookie. Numbers spike harder than table salt ever will.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Pipe Pressure</strong> — your vessels themselves. Less elastic. Inflamed. Constricted. The kind of thing diet alone has the slowest effect on.</p>
    `)}
    ${p(`Almost everyone has one Pressure that's loudest. Most have two running at once. A few have all three. Once you know which is loudest in you, the path narrows — and so does the work.`)}
    ${p(`Here's the rhythm of the next three weeks.`)}
    ${p(`I'll send you a short email every few days. Tomorrow I'll tell you why I left the ICU — there's a reason I do this work and don't sit in a hospital anymore. Day 3 you'll get a tea that drops 7 systolic points in 6 weeks for most readers. Day 5 we go deeper on the Three Pressures so you can name yours. Day 7, you'll meet Linda — 148/94 to 128/82 in 11 days, no new medication.`, { margin: '0 0 18px' })}
    ${p(`Read at your own pace. Forward to your daughter, your husband, anyone who's been told "your numbers are creeping up." That's how this works.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Hit reply and tell me which Pressure feels loudest in you right now — Stress, Sugar, or Pipe. One word is enough. I read every single reply and it helps me know what to send you next.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You just told me your blood pressure is on your mind. That quiet decision to put your email in mattered.

I'm Joel. RN for 20 years — most of it in ICU and emergency. Then I crossed over and trained as a naturopath. I run BraveWorks, and the women in my world are mostly 50 to 70, mostly on at least one BP medication, and mostly tired of being told "it's just genetic."

It's not just genetic. I'm going to show you why.

YOUR MAP: THE BP TRIANGLE METHOD.

Every BP number is being pushed up by some combination of three forces. I call them the Three Pressures. Most plans only address one. That's why most plans plateau.

— Stress Pressure (cortisol). Sleep is light, mornings are tight.
— Sugar Pressure (insulin). White bread and cereal spike numbers harder than salt.
— Pipe Pressure (vessels). Less elastic. Inflamed. Constricted.

Most have one loudest. Many have two running. Once you know which is yours, the path narrows.

Over the next three weeks: a short email every few days. Tomorrow — why I left the ICU. Day 3 — the tea that drops 7 points in 6 weeks. Day 5 — name your Pressure. Day 7 — meet Linda (148/94 → 128/82 in 11 days, no new medication).

Joel
RN, BraveWorks

P.S. Hit reply and tell me which Pressure feels loudest — Stress, Sugar, or Pipe. One word is enough. I read every reply.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 1 — Origin story (ICU to naturopath) ─────────────────────────
const day1 = {
  subject: '20 years in the ICU taught me one thing',
  subjectB: 'I almost didn\'t write this email',
  preview: 'Why I left the bedside — and what it has to do with your numbers.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I almost didn't write this email. It's personal, and these aren't usually personal.`)}
    ${p(`But I want you to know who's on the other end of these messages — and why I think you'll trust what I send you. So here it is.`)}
    ${p(`I spent 20 years as a registered nurse. Most of it in ICU and emergency. I was the person standing over the bed when someone came in with a blood pressure of 220 over 130 and a stroke already starting in their brainstem.`)}
    ${p(`I watched a lot of patients come back. I watched some not. And the ones I couldn't stop thinking about weren't the ones who came in dying — those, we expected.`)}
    ${bigQuote('The ones I couldn\'t shake were the ones we discharged.')}
    ${p(`The ones who got stabilized, got handed a new prescription, got told "watch your salt and lose some weight," and walked out the door. We knew they'd be back. Most of them came back inside two years.`)}
    ${p(`Nobody was teaching them how to use their bodies.`)}
    ${p(`So I made a decision. I took five years and trained as a naturopathic practitioner. I learned what nursing school doesn't teach — the herbs, the hydrotherapy, the breathing, the eight laws of health that built sanitariums before there were hospitals.`)}
    ${p(`Then I started doing what I do now — talking to women like you who have been told "your numbers are just creeping up, take this pill," and showing them what the other half of the equation looks like.`, { margin: '0 0 18px' })}
    ${p(`I'm not anti-medication. I want to be clear about that. The work I do is <strong>AND, not INSTEAD OF</strong>. Your medication keeps you safe while we work on the inputs that put you on it in the first place. When the inputs change, your doctor will be the one to taper. Never you, never me.`)}
    ${p(`That's the work. That's why I write you.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've ever had a discharge story like the one I described — yours or someone you loved — hit reply and tell me one line. I read every email and they shape what I send next.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I almost didn't write this. It's personal, and these aren't usually personal.

But I want you to know who's on the other end.

I spent 20 years as a registered nurse. Most of it in ICU and emergency. I stood over a lot of beds. Some patients came back. Some didn't.

The ones I couldn't shake weren't the dying — those, we expected. The ones I couldn't shake were the ones we DISCHARGED.

Stabilized. Handed a new prescription. Told "watch your salt and lose some weight." Walked out the door. We knew they'd be back. Most of them were, inside two years.

Nobody was teaching them how to use their bodies.

So I took five years and trained as a naturopathic practitioner. The herbs, the hydrotherapy, the breathing, the eight laws of health that built sanitariums before there were hospitals.

Now I do this work full time. I'm not anti-medication. The work I do is AND, not INSTEAD OF. Your med keeps you safe while we work on the inputs that put you on it. When the inputs change, your doctor will be the one to taper. Never you, never me.

That's why I write you.

Joel
RN, BraveWorks

P.S. If you've ever had a discharge story like that — yours or someone you loved — hit reply and tell me one line.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 3 — Hibiscus tea quick win (PAS) ─────────────────────────────
const day3 = {
  subject: '3 cups of this tea, 7 points lower in 6 weeks',
  subjectB: 'The tea your grandmother drank for BP',
  preview: 'No supplement. No prescription. Three dollars at the grocery store.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Here's a problem most BP plans have.`)}
    ${p(`They ask you to change ten things at once. New food. New schedule. New exercise. New supplement. New mindset. By Day 4 you're exhausted and the only thing that's actually moved is your guilt.`)}
    ${p(`So today I'm only asking for one thing. And it costs about three dollars.`)}
    ${bigQuote('Hibiscus tea.')}
    ${p(`Yes, the deep red flower tea your grandmother or great-aunt probably drank. The ones in red boxes — Tazo, Celestial Seasonings "Red Zinger," any Hibiscus or "sorrel" tea you can find in the grocery aisle.`)}
    ${p(`I'm not telling you it's magic. I'm telling you the research is real.`)}
    ${p(`A study at Tufts University put adults with mild hypertension on three cups of hibiscus tea a day for six weeks. The hibiscus group dropped an average of <strong>7.2 mmHg off their systolic number.</strong> The placebo group dropped 1.3.`)}
    ${p(`Seven points isn't world-changing on its own — but seven points is the difference between Stage 1 hypertension and pre-hypertension for a lot of readers. Seven points is also the average drop most people get from a 10-pound weight loss, which is a much harder ask.`)}
    ${p(`Why it works (the short version): hibiscus is rich in anthocyanins, the same compounds that color blueberries deep blue. They support healthy vessel elasticity and gently nudge sodium out through the kidneys. Mild diuretic effect, mild vasorelaxant effect, no prescription.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Pick up a box of hibiscus tea this week. Three cups a day — one with breakfast, one with lunch, one in the afternoon. No sugar. Cold or hot.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">That's it. That's the whole assignment.</p>
    `)}
    ${p(`A note: if you're on a thiazide diuretic (hydrochlorothiazide) or a potassium-sparing diuretic (spironolactone), check with your prescriber before adding three cups a day — hibiscus is mildly diuretic and the math may need to shift. Your safety, always, comes first.`)}
    ${p(`In two days I'll teach you how to figure out which of the Three Pressures is loudest in you. With that one piece of self-knowledge, you'll know what to focus on first.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you do pick up a box, snap a photo at the grocery store and reply with it. I'll cheer for you. Small wins are how big numbers move.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Most BP plans ask you to change ten things at once. By Day 4 you're exhausted and only your guilt has moved.

So today, one thing. About three dollars.

HIBISCUS TEA.

The deep red flower tea your grandmother drank. Red boxes — Tazo, Celestial Seasonings "Red Zinger," any "sorrel" tea.

Not magic. The research is real.

Tufts University study, adults with mild hypertension, three cups of hibiscus a day for six weeks. Hibiscus group: 7.2 mmHg off systolic. Placebo group: 1.3.

Seven points is the difference between Stage 1 hypertension and pre-hypertension. Same drop most people get from a 10-pound weight loss — a much harder ask.

Why: hibiscus is rich in anthocyanins. Supports vessel elasticity. Gently nudges sodium out through the kidneys. Mild diuretic, mild vasorelaxant, no prescription.

TODAY'S ASK: Pick up a box this week. Three cups a day. One with breakfast, one with lunch, one in the afternoon. No sugar.

If you're on a thiazide or potassium-sparing diuretic, check with your prescriber first — hibiscus is mildly diuretic and the math may need to shift.

In two days — how to find out which of the Three Pressures is loudest in you.

Joel
RN, BraveWorks

P.S. If you pick up a box, snap a photo at the grocery store and reply. I'll cheer for you. Small wins are how big numbers move.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 5 — Three Pressures deep-teach + self-diagnostic ─────────────
const day5 = {
  subject: 'Which of the Three Pressures is loudest in you?',
  subjectB: 'Stress · Sugar · Pipes — pick one',
  preview: 'A 90-second self-check so you know where to start.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Day 0 I named them. Today I'm going to help you figure out which one is yours.`)}
    ${p(`Because here's what most BP plans miss: not every elevated number comes from the same place. The same protocol that drops one person 15 points will barely move another. The reason is which Pressure is doing the pushing.`)}
    ${bigQuote('Find yours first. Then the work narrows.')}
    ${p(`Read each of the three sections below. Score yourself 0, 1, or 2 — how strong is each pattern in you? Add them up at the end.`, { margin: '0 0 18px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">1. Stress Pressure (cortisol)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You wake between 2 and 4 AM and can't fall back asleep easily.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— Mornings feel "wired but tired." Coffee feels necessary.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You carry weight around the middle that didn't used to be there.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">— Your highest readings happen at the doctor's office. (White coat — Paul, age 48, had this exact pattern.)</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">2. Sugar Pressure (insulin)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You crave bread, crackers, or sweets in the afternoon.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— Your fasting glucose has crept up, or your A1c is over 5.7.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You've gained 10+ pounds in the last 5 years without changing how you eat.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">— Your numbers are worst in the afternoon and evening. (Rachel, 55, fasting glucose 138 → 109 in 3 weeks once we addressed this.)</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">3. Pipe Pressure (vascular)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You've been on BP medication for more than 5 years.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— Your bottom number (diastolic) is the stubborn one — it won't budge.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">— You have a family history of stroke or heart attack.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">— Your hands or feet feel cold often, even in warm rooms.</p>
    `)}
    ${p(`<strong>Add your three scores.</strong> Whichever section came in highest is your loudest Pressure. Most readers find one clear winner and one runner-up. If two scored equally high, that's normal — most adults are running two at once. The plan is to address them in order: loudest first, second next.`, { margin: '0 0 28px' })}
    ${p(`In two days I'll send you Linda's story. She's 62, was on three medications, and dropped from 148/94 to 128/82 in 11 days. She did it by going after one Pressure first — the same way you're about to.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you only want to do one thing today, hit reply and tell me which Pressure won the highest score. I keep these — and I'll write back if you ask a question.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Day 0 I named them. Today: figure out which is yours.

Not every elevated number comes from the same place. Same protocol drops one person 15 points and barely moves another. The reason: which Pressure is pushing.

Score each section 0, 1, or 2 — how strong is the pattern in you?

1. STRESS PRESSURE (cortisol)
— Wake between 2 and 4 AM and can't fall back asleep.
— Mornings "wired but tired." Coffee feels necessary.
— Weight around the middle that didn't used to be there.
— Highest readings at the doctor's office. (Paul, 48, had this exact pattern.)

2. SUGAR PRESSURE (insulin)
— Afternoon cravings for bread, crackers, sweets.
— Fasting glucose has crept up or A1c over 5.7.
— 10+ pounds gained in 5 years without eating differently.
— Numbers worst in the afternoon/evening. (Rachel, 55: fasting glucose 138 → 109 in 3 weeks.)

3. PIPE PRESSURE (vascular)
— On BP medication 5+ years.
— Bottom number (diastolic) is the stubborn one.
— Family history of stroke or heart attack.
— Hands/feet often cold, even in warm rooms.

Add scores. Highest section = your loudest Pressure. Most have one clear winner and a runner-up. Two equal = you're running both. Address the loudest first.

In two days: Linda's story. 62, three medications, 148/94 → 128/82 in 11 days.

Joel
RN, BraveWorks

P.S. Hit reply with which Pressure won. I keep these — and I'll write back if you ask.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — Linda case study (BAB social proof) ──────────────────────
const day7 = {
  subject: '148/94 → 128/82 in 11 days',
  subjectB: 'What Linda\'s cardiologist asked her',
  preview: 'Twenty points. Eleven days. One medication unchanged.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days ago you scored yourself on the Three Pressures. Today I want to show you what's possible when someone names theirs and gets to work.`)}
    ${p(`Linda is 62. (Not her real name — I protect everyone in these stories. The numbers are real.)`)}
    ${p(`Two grandsons. A husband she's been married to for 38 years. Retired schoolteacher. The kind of person who reads the label on everything and still couldn't figure out why her numbers kept climbing.`)}
    ${bigQuote('Before.')}
    ${p(`Last cuff reading at home: <strong>148/94.</strong> On lisinopril 20mg for four years, then they added amlodipine 5mg two years ago, then the cardiologist mentioned a third medication at her last appointment.`)}
    ${p(`Linda took the Three Pressures self-check the same way you just did. Pipe Pressure scored highest. Sugar Pressure was the runner-up. Stress was the quiet one.`)}
    ${p(`So we went after Pipe first.`, { margin: '0 0 28px' })}
    ${bigQuote('After.')}
    ${p(`Eleven days in, her morning reading was <strong>128/82.</strong>`)}
    ${p(`Twenty systolic points. Twelve diastolic. Same medications. Same doses. No new prescription.`)}
    ${p(`Here's the bridge — what she actually did:`, { margin: '0 0 18px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Linda's first 11 days.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Days 1-3:</strong> Hibiscus tea, three cups a day. Swapped store-bought sandwich bread for a homemade alternative her granddaughter helped her bake. Walked 20 minutes after dinner. (Walking moves nitric oxide through the vessels — exactly what Pipe Pressure needs.)</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Days 4-7:</strong> Added a baked potato with skin to lunch most days (940mg of potassium each). Added garlic — one fresh clove crushed, sat for 10 minutes, added at the end of cooking. Started end-of-day contrast showers — 30 seconds cold at the close of every regular shower.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Days 8-11:</strong> Same routine. Cuffed every morning at the same time, sitting, both feet flat, no coffee yet. Number kept dropping.</p>
    `)}
    ${p(`No new supplement she'd never heard of. No fasting. No gym membership.`)}
    ${p(`At her follow-up appointment, her cardiologist looked at the numbers, looked at her, and asked one question: "What did you do?" She told him. He didn't reduce her medication right away — that comes later, after a longer pattern — but he didn't add the third one either. He told her to keep going and come back in 90 days.`, { margin: '0 0 28px' })}
    ${p(`What Linda did, you can do. The Pressure she went after was hers, not yours — you may need a different combination. But the principle is the same: name it, choose the smallest right input, do it daily, log the number.`)}
    ${p(`Three days from now I'm going to share the exact PDF I gave Linda — eighteen pages, the same one I hand patients on their way out of the hospital. It's $17. I'll tell you about it then. Today, just sit with the idea that 20 points in 11 days is possible.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your number is anywhere near Linda's starting point and you've been told "this is as good as it gets," hit reply and tell me what your number is today. I won't pitch you. I just want to know who's reading.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Two days ago you scored yourself on the Three Pressures. Today, what's possible when someone names theirs.

Linda is 62. (Not her real name. Numbers are real.)

BEFORE: 148/94. On lisinopril 20mg for four years, amlodipine 5mg two years, cardiologist mentioning a third med.

She took the self-check. Pipe Pressure scored highest. Sugar runner-up. Stress was quiet.

We went after Pipe first.

AFTER: Eleven days in, morning reading 128/82. Twenty systolic. Twelve diastolic. Same medications. Same doses.

What she did:

Days 1-3 — Hibiscus tea, 3 cups/day. Swapped store bread for homemade. Walked 20 minutes after dinner.

Days 4-7 — Baked potato with skin at lunch (940mg potassium each). Garlic, fresh clove crushed and rested. End-of-day contrast showers — 30 seconds cold at the close of every regular shower.

Days 8-11 — Same routine. Cuffed every morning, same time, sitting, both feet flat, no coffee yet.

Her cardiologist asked one question: "What did you do?" She told him. He didn't reduce her medication yet (that comes later). He didn't add the third either. Told her to keep going.

What Linda did, you can do. Your Pressure may be different. The principle is the same: name it, choose the smallest right input, do it daily, log the number.

Three days from now — the exact PDF I gave Linda.

Joel
RN, BraveWorks

P.S. If your number is near Linda's starting point, hit reply and tell me what yours is. I won't pitch you. I want to know who's reading.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 10 — First soft pitch ($17 BP Starter) — PASTOR ──────────────
const day10 = {
  subject: 'If you only do one thing this week',
  subjectB: '$17. Inbox in 60 seconds.',
  preview: 'The same PDF I hand patients on their way out of the hospital.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Ten days in. If you've read every email this far, I want you to know — that's more than most. The average list reader opens three. You're somewhere in the small group that's still here, still curious, maybe still uncertain.`)}
    ${p(`Today is the first time I'm asking for anything.`)}
    ${bigQuote('The BP Starter Kit. $17.')}
    ${p(`<strong>What it is:</strong> the same eighteen-page PDF I hand patients on their way out of my naturopathic practice. Marlene's three-input reset is on page 4. Linda's Pipe Pressure protocol is on page 8. The Cardiologist Conversation Script (so you know what to say at your next appointment) is on page 11.`)}
    ${p(`<strong>What it's not:</strong> a course. A workshop. A 90-day program. You won't be on a call. You won't have homework due Friday. It's a document. You read it. You apply what fits. You move your numbers.`)}
    ${p(`<strong>Who it's for:</strong> the person who's been reading these emails and thinking, "I want the system, not just the headlines." If you'd rather keep reading the free emails — that's fine. They keep coming. The kit is for the reader who's ready to skip ahead.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What's inside (briefly).</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong>The 10-Day BP Reset Daily Plan</strong> — every step, day by day.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong>Joel's 7 Most-Trusted BP Herbs</strong> — safe dosing ranges for each.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong>The Cardiologist Conversation Script</strong> — what to say at your next appointment.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ <strong>The 4 Lifestyle Levers Cheat Sheet</strong> — one page on your fridge.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">→ <strong>Cook For Life Cookbook</strong> — 45 plant-based recipes that fit the protocol.</p>
    `)}
    ${p(`I'll tell you the honest truth. The kit is $17 because I want it in the hands of anyone who's been wanting to start. Two cups of coffee. The cost of one of those meds you've been worrying about co-pays for. I made it so price isn't the reason someone walks away.`)}
    ${p(`If $17 still doesn't feel like a fit for you today, keep reading the emails. There's no pressure, and there's no penalty.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit — $17')}
    ${p(`<span style="color:#999;font-size:14px;">Delivered to your inbox in 60 seconds. Read tonight. Start tomorrow morning.</span>`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you'd rather wait, in three days I'll address the most common objection I hear: "I've tried everything." It's the email I wish I'd had when I started this work.`)}
    ${upsellFooter({
      kicker: 'The patient protocol',
      body: 'Eighteen pages. Marlene\'s three-input reset on page 4. Linda\'s Pipe Pressure protocol on page 8. The Cardiologist Conversation Script on page 11. Same document I hand patients walking out of my practice.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Ten days in. If you've read every email this far, that's more than most. Average list reader opens three. You're in the small group still curious, maybe still uncertain.

Today is the first time I'm asking for anything.

THE BP STARTER KIT. $17.

What it is: the same eighteen-page PDF I hand patients on their way out of my practice. Marlene's three-input reset on page 4. Linda's Pipe Pressure protocol on page 8. The Cardiologist Conversation Script on page 11.

What it's not: a course. A workshop. A 90-day program. No homework due Friday. It's a document. You read it. Apply what fits. Move your numbers.

What's inside:
→ The 10-Day BP Reset Daily Plan
→ Joel's 7 Most-Trusted BP Herbs (with safe dosing ranges)
→ The Cardiologist Conversation Script
→ The 4 Lifestyle Levers Cheat Sheet
→ Cook For Life Cookbook (45 plant-based recipes)

Honest truth: it's $17 because I want it in the hands of anyone wanting to start. Two cups of coffee. I made it so price isn't the reason someone walks away.

If $17 doesn't feel right today, keep reading the emails. No pressure. No penalty.

→ Get the kit: ${KIT_URL}
Inbox in 60 seconds. Read tonight. Start tomorrow.

Joel
RN, BraveWorks

P.S. If you'd rather wait, in three days I'll address the most common objection I hear: "I've tried everything." It's the email I wish I'd had when I started.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 13 — Objection killer: "I've tried everything" ───────────────
const day13 = {
  subject: 'Why your last attempt didn\'t stick',
  subjectB: 'The reason most BP plans fail at Day 14',
  preview: 'It wasn\'t willpower. It wasn\'t discipline. It was the plan.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to talk to the reader who's been here before. Not on my list — on the road.`)}
    ${p(`You've tried DASH. You've tried Mediterranean. You did keto for six weeks and felt great until you didn't. You signed up for a wellness app that buzzed your wrist 14 times a day. You bought beet juice. You bought magnesium. You went to a sleep specialist.`)}
    ${p(`Something worked for a little while. Then it didn't. And every time it stopped working, a quiet voice inside you said the same thing: <em>maybe I'm just the kind of person this doesn't work for.</em>`)}
    ${bigQuote('I want to take that voice off the table today.')}
    ${p(`The reason your last attempt didn't stick wasn't your willpower. It wasn't your discipline. It was the plan.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">Three reasons every generic plan fails around Day 14.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 12px;"><strong>1. It only targeted one Pressure.</strong> DASH addresses sodium. Mediterranean addresses inflammation. Keto addresses insulin. None of them address all three. If your loudest Pressure wasn't the one the plan targeted, you got a half-result and called it failure.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 12px;"><strong>2. It asked for ten changes at once.</strong> Behavior change research is brutally clear: more than three new habits at once and the failure rate goes above 80%. By Day 14 you were trying to track eight things and remembering five.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>3. It had no feedback loop.</strong> If you weren't cuffing every morning the same way and writing it down, you didn't know if it was working. Without that loop, the brain quietly drifts back to baseline by Day 14. Always.</p>
    `)}
    ${p(`This is why I do the work the way I do.`)}
    ${p(`On Day 5 you scored your Three Pressures — so you go after yours, not someone else's. The Starter Kit gives you the smallest number of right inputs, not the most. And the BP tracker page (the one I had Linda use) is the feedback loop your last plan was missing.`, { margin: '0 0 18px' })}
    ${p(`I'm not telling you the kit is magic. I'm telling you it's targeted, narrow, and measured. Those three things alone usually fix what felt like willpower failure in the past.`)}
    ${p(`In three days I'm going to send you Paul's story. He's 48 and his loudest Pressure was Stress — and his fix didn't come from food. Some of you are going to recognize yourselves in it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`What was the last plan you tried that didn't stick? Reply with one line. I read every one and they help me know what to write next.`)}
    ${upsellFooter({
      kicker: 'Targeted. Narrow. Measured.',
      body: 'Eighteen pages. One Pressure-first protocol. A tracker page so you know it\'s working. The reason readers stick to this when they didn\'t stick to the last six things.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

For the reader who's been here before. Not on my list — on the road.

You've tried DASH. Mediterranean. Six weeks of keto. A wrist-buzzing wellness app. Beet juice. Magnesium. Sleep specialist.

Something worked for a while. Then it didn't. And every time, a quiet voice: maybe I'm just the kind of person this doesn't work for.

I want to take that voice off the table.

The reason your last attempt didn't stick wasn't willpower. It wasn't discipline. It was the plan.

Three reasons every generic plan fails around Day 14:

1. It only targeted one Pressure. DASH = sodium. Mediterranean = inflammation. Keto = insulin. If your loudest Pressure wasn't the one targeted, you got a half-result and called it failure.

2. It asked for ten changes at once. Behavior research is clear: more than three new habits at once and failure rate goes above 80%. By Day 14 you were tracking eight things and remembering five.

3. No feedback loop. If you weren't cuffing every morning the same way and writing it down, you didn't know if it was working. The brain quietly drifts back to baseline by Day 14. Always.

That's why I work the way I do. Day 5 you scored your Pressures — you go after YOURS. The Starter Kit gives the smallest number of right inputs, not the most. The tracker page is the feedback loop your last plan was missing.

Targeted. Narrow. Measured. Three things alone usually fix what felt like willpower failure.

In three days — Paul's story. 48 years old, loudest Pressure was Stress, and his fix didn't come from food.

Joel
RN, BraveWorks

P.S. What was the last plan you tried that didn't stick? Reply with one line. I read every one.

—
Targeted. Narrow. Measured.
The kit: ${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 16 — Paul case study (Stress Pressure angle) ─────────────────
const day16 = {
  subject: 'Paul slept through the night by Day 4',
  subjectB: 'The cortisol thing nobody told you',
  preview: 'His loudest Pressure wasn\'t food. It was 3 AM.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I told you Paul's story was coming. Today it's here.`)}
    ${p(`Paul is 48. (Not his real name. The numbers are real.)`)}
    ${p(`Married, two teenagers, finance job. Cuffed himself one Sunday morning out of curiosity — <strong>156/98.</strong> Cuffed again Monday at the office — same. Saw his doctor. Got put on lisinopril 10mg. Came down to 138/88. Still high.`)}
    ${p(`Doctor said cut salt. He cut salt. Nothing moved.`)}
    ${p(`Doctor said lose 10 pounds. He lost 12. Numbers came down 3 points.`)}
    ${p(`Doctor said add amlodipine. That's when he found me.`, { margin: '0 0 28px' })}
    ${bigQuote('Paul\'s loudest Pressure wasn\'t food. It was 3 AM.')}
    ${p(`He took the self-check. Sugar Pressure scored a 2. Pipe Pressure scored a 3. Stress Pressure scored an <strong>8</strong>. Off the charts.`)}
    ${p(`He'd been waking at 2 to 4 AM for years. Mind racing. Couldn't get back to sleep. Mornings were "wired but tired." Three cups of coffee just to feel level. White-coat hypertension at every appointment — his readings at the doctor's office were always 15-20 points higher than his home readings.`)}
    ${p(`That's cortisol. That's the sympathetic nervous system stuck in "alert." That's the Pressure that 90% of cardiologists don't measure and 90% of BP plans don't address.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What Paul did.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>The 5-minute morning sunlight rule.</strong> Outside for five minutes within 30 minutes of waking. No phone. Sets the cortisol curve so it peaks in the morning instead of at 2 AM.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>The 4-7-8 breath, twice a day.</strong> In for 4 seconds, hold for 7, out for 8. Two minutes morning, two minutes before bed. Drops cortisol faster than any supplement I've ever measured.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;"><strong>Coffee cutoff at 10 AM.</strong> Caffeine has a 6-hour half-life. The 3 PM cup was still in his system at midnight.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong>Magnesium glycinate at bedtime.</strong> 300mg, 30 minutes before bed. Magnesium relaxes the smooth muscle around vessels AND supports the GABA pathway that calms the brain.</p>
    `)}
    ${p(`Day 4 he slept through the night for the first time in two years.`)}
    ${p(`Day 14 his morning reading was <strong>128/82.</strong> Down from 138/88 on medication alone. His next appointment, the doctor didn't add amlodipine — he reduced the lisinopril to 5mg. Paul reports back every month. Five months in, he's on the half-dose and his average reading is 122/78.`, { margin: '0 0 28px' })}
    ${p(`If you scored highest on Stress Pressure on Day 5, this is your path. The four inputs above are in the Starter Kit under the Stress Pressure section, with the full protocol, dosing, and the cuffing rhythm. The whole document — Stress, Sugar, and Pipe Pressure protocols all in one place — is $17.`)}
    ${p(`In three days I'm going to write the last real pitch. After that, the rhythm of these emails changes.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If Paul's pattern feels familiar — the 3 AM wake-up, the wired-but-tired mornings — hit reply and tell me. You're not alone, and you're not broken. The plan just hasn't matched your Pressure yet.`)}
    ${upsellFooter({
      kicker: 'For the Stress Pressure reader',
      body: 'Paul\'s exact 4-input protocol — sunlight, 4-7-8 breath, coffee cutoff, magnesium glycinate — is in Section 2 of the Starter Kit. Same document holds the Sugar and Pipe Pressure protocols.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Paul is 48. (Not his real name. Numbers are real.)

Married, two teenagers, finance job. Cuffed one Sunday — 156/98. Doctor put him on lisinopril 10mg. Down to 138/88. Still high.

Doctor said cut salt. He did. Nothing.
Doctor said lose 10 pounds. He lost 12. Down 3 points.
Doctor said add amlodipine. That's when he found me.

Paul's loudest Pressure wasn't food. It was 3 AM.

Self-check: Sugar = 2. Pipe = 3. Stress = 8. Off the charts.

Waking 2-4 AM for years. Mind racing. Wired-but-tired mornings. Three cups of coffee to feel level. White coat 15-20 points high.

That's cortisol. The Pressure 90% of cardiologists don't measure.

What Paul did:

— 5-minute morning sunlight within 30 min of waking. No phone. Sets the cortisol curve.

— 4-7-8 breath, twice a day. In 4, hold 7, out 8. Two minutes morning, two minutes bedtime.

— Coffee cutoff at 10 AM. (Caffeine has a 6-hour half-life. The 3 PM cup is still in your system at midnight.)

— Magnesium glycinate, 300mg, 30 min before bed.

Day 4 he slept through the night for the first time in two years.

Day 14: 128/82. Down from 138/88 on medication alone. Doctor reduced the lisinopril to 5mg. Five months in he's on the half-dose averaging 122/78.

If Stress Pressure scored highest for you on Day 5, this is your path. The 4-input protocol is in Section 2 of the Starter Kit. Whole document is $17.

In three days — the last real pitch. After that, the rhythm changes.

Joel
RN, BraveWorks

P.S. If Paul's pattern feels familiar — the 3 AM wake-up, the wired-but-tired mornings — hit reply. You're not broken. The plan just hasn't matched your Pressure yet.

—
For the Stress reader:
${KIT_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 19 — Final pitch + 7-day refund framing ──────────────────────
const day19 = {
  subject: 'Worst case: $17 and a free PDF',
  subjectB: 'Joel\'s refund promise',
  preview: 'The math I want you to actually look at.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This is the last real pitch I'm going to send you. After this, the rhythm of these emails changes — I'll keep writing, but I'll send less, and I won't be asking you to do anything except read.`)}
    ${p(`So I want to make my final case as plainly as I can.`, { margin: '0 0 28px' })}
    ${bigQuote('Look at the math with me.')}
    ${p(`<strong>The cost:</strong> $17. About the price of two coffees. Less than one co-pay for most of you.`)}
    ${p(`<strong>The promise:</strong> Read every page this week. Apply the protocol for your loudest Pressure. If you haven't seen your numbers move by Day 7 with honest effort, hit reply with the word "refund." I'll send your $17 back, no questions, and the PDF is yours to keep.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'The 7-day refund promise',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">$17 back. No questions. PDF yours forever. I do this because I'm confident in the protocol, and because I'd rather the wrong reader get their money back than feel stuck holding something that didn't serve them.</p>`
    )}
    ${p(`<strong>Worst-case scenario:</strong> the kit doesn't fit you. You reply with the word "refund." You get $17 back. You keep the PDF. You spent zero net dollars and you have the full document to reference forever, or pass to someone in your family who might use it differently.`)}
    ${p(`<strong>Best-case scenario:</strong> you do what Marlene did. Eleven points in nine days. Or what Linda did. Twenty points in eleven days. Or what Paul did. The end of two years of 3 AM wake-ups and a halved medication. For $17.`)}
    ${p(`I'm not telling you which scenario you'll fall into. I don't know your body or your history. I'm telling you the math is asymmetric — small downside, large upside — and the bet is structured so the downside doesn't actually exist.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What you get for $17.</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ The 10-Day BP Reset Daily Plan</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ Joel's 7 Most-Trusted BP Herbs with safe dosing ranges</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ The Cardiologist Conversation Script</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">→ The 4 Lifestyle Levers Cheat Sheet</p>
      <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">→ Cook For Life Cookbook — 45 plant-based recipes</p>
    `)}
    ${p(`If now isn't your time — that's okay. There's no penalty, no door closing, no countdown clock. I'll keep showing up in your inbox at a slower pace, and the kit is here when you're ready.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit — $17')}
    ${p(`<span style="color:#999;font-size:14px;">Delivered to your inbox in 60 seconds. 7-day refund if it doesn't move your numbers.</span>`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If the price isn't the issue — if it's something else stopping you — hit reply and tell me what it is. I can't promise to solve it, but I always read, and sometimes a one-line answer is all that's needed.`)}
    ${upsellFooter({
      kicker: 'The asymmetric bet',
      body: '$17. 7-day refund. Eighteen pages of protocol — Stress, Sugar, and Pipe Pressure paths, the Cardiologist Conversation Script, the herbs, the recipes. The worst case is the kit stays in your downloads folder for a friend who needs it later.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This is the last real pitch. After this, the rhythm changes — I'll keep writing, but slower, and I won't be asking you to do anything except read.

So plainly:

THE COST: $17. About two coffees. Less than one co-pay.

THE PROMISE: Read every page this week. Apply the protocol for your loudest Pressure. If your numbers haven't moved by Day 7 with honest effort, hit reply with "refund." $17 back, no questions, PDF yours to keep.

The 7-day refund promise. $17 back. No questions. PDF yours forever.

WORST CASE: kit doesn't fit. You reply "refund." $17 back. Keep the PDF. Zero net dollars. Full document forever.

BEST CASE: what Marlene did (11 points / 9 days). What Linda did (20 points / 11 days). What Paul did (the end of two years of 3 AM wake-ups, halved medication). For $17.

Small downside. Large upside. Bet structured so the downside doesn't actually exist.

What you get for $17:
→ The 10-Day BP Reset Daily Plan
→ Joel's 7 Most-Trusted BP Herbs (safe dosing)
→ The Cardiologist Conversation Script
→ The 4 Lifestyle Levers Cheat Sheet
→ Cook For Life Cookbook (45 recipes)

If now isn't your time, that's okay. No penalty. No clock. I'll keep showing up at a slower pace.

→ Get the kit: ${KIT_URL}
60 seconds. 7-day refund.

Joel
RN, BraveWorks

P.S. If price isn't the issue — if it's something else stopping you — hit reply and tell me. I always read.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 21 — Graceful exit / "I'll send less from here" ──────────────
const day21 = {
  subject: 'I\'m not going to keep sending these',
  subjectB: 'Last email before you become a Tuesday person',
  preview: 'A quieter rhythm starts tomorrow. Here\'s what to expect.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Twenty-one days. We've covered a lot of ground.`)}
    ${p(`I'm not going to keep sending you an email every few days. Starting tomorrow, the rhythm changes — you'll hear from me about once a week, on a Tuesday, with one teaching and one story. No countdown clocks. No "last chance" subject lines. Just the work, at the pace of someone you can trust to be there but not be loud.`)}
    ${bigQuote('Before the rhythm slows, a recap.')}
    ${p(`Here's what you have now that you didn't 21 days ago:`)}
    ${sageBlock(`
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">— A map. The BP Triangle Method. Stress, Sugar, and Pipe Pressure.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">— A self-diagnostic. You know which Pressure is loudest in you.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">— A quick win. Three cups of hibiscus tea a day.</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">— Three case studies. Marlene (11 points / 9 days). Linda (20 points / 11 days). Paul (the cortisol fix and the halved medication).</p>
      <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">— The reason your last plan didn't stick — and why this approach is different.</p>
    `)}
    ${p(`That's a foundation. It's enough to move your numbers if you do the small things.`, { margin: '0 0 28px' })}
    ${p(`If you've been waiting for a sign to get the Starter Kit, this is the gentlest one I'll send you. <strong>The link still works. The refund promise still stands.</strong> Most people who buy do so within 21 days of joining the list — after that the rate drops, and the next time I write about it will be quietly inside a Tuesday email, not a dedicated one like this.`)}
    ${p(`If the kit isn't for you, that's genuinely okay. The emails will keep coming. You're not graduating into silence — you're graduating into a slower, deeper conversation.`, { margin: '0 0 28px' })}
    ${p(`Whatever happens next, I want to say thank you. The work I do exists because women like you put your email in and stayed long enough to learn. That's a quiet kind of bravery, and it's exactly what BraveWorks is named for.`, { margin: '0 0 24px' })}
    ${ctaButton(KIT_URL, 'Get the BP Starter Kit — $17')}
    ${p(`<span style="color:#999;font-size:14px;">Or just hit reply and tell me how you're doing. That's also valid.</span>`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`I'll see you Tuesday. From here on, the work is slow and the conversation is long. That's how real change is built — not in 21 days, but in the year that follows.`)}
    ${upsellFooter({
      kicker: 'Door stays open',
      body: 'No deadline. No clock. The Starter Kit is here when you\'re ready — in a week, in a month, in a year. Same $17. Same refund promise. Same eighteen pages of protocol.',
      ctaLabel: 'Get the kit for $17',
      ctaUrl: KIT_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Twenty-one days. We've covered a lot.

I'm not going to keep sending one every few days. Starting tomorrow, the rhythm changes — about once a week, on a Tuesday, with one teaching and one story. No countdown clocks. No "last chance." The work at the pace of someone you can trust to be there but not be loud.

Before the rhythm slows, a recap. Here's what you have now:

— A map. The BP Triangle Method. Stress, Sugar, and Pipe Pressure.
— A self-diagnostic. You know which Pressure is loudest.
— A quick win. Three cups of hibiscus tea a day.
— Three case studies. Marlene (11 points / 9 days). Linda (20 points / 11 days). Paul (cortisol fix, halved medication).
— The reason your last plan didn't stick.

That's a foundation. Enough to move your numbers if you do the small things.

If you've been waiting for a sign to get the Starter Kit, this is the gentlest one. The link still works. The refund promise still stands. Most people who buy do so within 21 days of joining — after that the rate drops. Next time I write about the kit will be quietly inside a Tuesday email, not a dedicated one like this.

If the kit isn't for you, that's okay. The emails keep coming. You're not graduating into silence — you're graduating into a slower, deeper conversation.

Thank you. The work I do exists because women like you put your email in and stayed long enough to learn. That's a quiet kind of bravery — exactly what BraveWorks is named for.

→ Get the kit: ${KIT_URL}
Or just hit reply and tell me how you're doing.

Joel
RN, BraveWorks

P.S. I'll see you Tuesday. From here on, the work is slow and the conversation is long. That's how real change is built — not in 21 days, but in the year that follows.

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
