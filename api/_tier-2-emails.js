// File: api/_tier-2-emails.js
// ─────────────────────────────────────────────────────────────────────
// TIER-2 EMAIL SEQUENCE — $97 BP Triangle Challenge buyers
// ─────────────────────────────────────────────────────────────────────
// State = 'tier-2'. Fired by daysSinceTier2EnteredAt.
// 10 emails over 30 days. Fulfills the 30-day promise (chapter walkthroughs +
// weekly Monday Zoom + Skool VIP + bonus kits) and upsells Cohort 2 ($1,997)
// from Day 18 onward.
//
// CRITICAL: never pitch $17 / $47 / $97 here — these buyers own all of it.
// Days 1-15: no upsellFooter pitch. Days 18-30: pitch COHORT2_URL only.
// ─────────────────────────────────────────────────────────────────────

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Active product Stripe links
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

// Cohort fulfillment URLs — Joel populates these env vars at deploy time
export const MONDAY_ZOOM_URL    = process.env.VITE_MONDAY_ZOOM_URL    || 'https://us02web.zoom.us/j/MISSING_MONDAY_ZOOM_URL';
export const BONUS_CORTISOL_URL = process.env.VITE_BONUS_CORTISOL_URL || `${SITE_URL}/bonus/cortisol-reset-kit`;
export const BONUS_BLOODSUGAR_URL = process.env.VITE_BONUS_BLOODSUGAR_URL || `${SITE_URL}/bonus/blood-sugar-10-day-reset`;
export const BONUS_COOKBOOK_URL = process.env.VITE_BONUS_COOKBOOK_URL || `${SITE_URL}/bonus/cook-for-life`;

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

// Body paragraph
function p(text, opts = {}) {
  const margin = opts.margin || '0 0 18px';
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${margin};">${text}</p>`;
}

// Display quote (use sparingly — once per email at most)
function bigQuote(text) {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">${text}</p>`;
}

// Left-rule sage block — for teaching content (definitions, lists)
function sageBlock(html) {
  return `<div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">${html}</div>`;
}

// Left-rule clay block with kicker — for callouts, warnings, side notes
function clayBlock(label, html) {
  return `<div style="border-left:3px solid ${PALETTE.accentClay};padding:6px 0 6px 18px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:8px;">${label}</div>
    ${html}
  </div>`;
}

// Big orange CTA button — use ONCE per email (the primary action)
function ctaButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

// Joel's standard signoff — every email ends with this
function joelSignoff() {
  return `<p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">Joel</p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>`;
}

// P.S. block — every email gets one, placed AFTER joelSignoff()
function psBox(text) {
  return `<div style="border-top:1px solid ${PALETTE.border};padding-top:20px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.S.</strong> ${text}
    </p>
  </div>`;
}

// Secondary footer — Skool + YouTube links. Append at bottom of EVERY email.
function footerSecondaryCTAs() {
  return `<div style="margin-top:24px;padding:20px 22px;background:${PALETTE.outerBg};border-radius:10px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:12px;">Two more ways to follow along</div>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 10px;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Join the Skool community</a> &nbsp;<span style="color:#999;">— "How to Be Your Own Doctor"</span></p>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">→ <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on YouTube</a> &nbsp;<span style="color:#999;">— deeper teachings, weekly</span></p>
  </div>`;
}

// Tier-specific upsell footer. Place BEFORE footerSecondaryCTAs().
function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

// ─── DAY 0 — Welcome to the Challenge ─────────────────────────────────
// Skool VIP invite + Monday Zoom calendar link + Bonus kit promises.
// First email a $97 buyer ever gets. Make them feel they're inside, not sold to.
const day0 = {
  subject: 'Welcome to the BP Triangle Challenge',
  subjectB: 'You\'re in. Here\'s Monday\'s link.',
  preview: 'Your Skool room, your Monday call, your bonus kits — all inside.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Welcome to the BP Triangle Challenge. You're officially in the cohort. I want to say this directly: <strong style="color:${PALETTE.text};">you didn't buy a PDF. You bought a seat in a room with me for thirty days.</strong>`)}
    ${p(`I want you to know what's about to happen, and what I need from you to make it worth the $97 you spent.`, { margin: '0 0 28px' })}
    ${bigQuote('Three things start this week.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. The chapter walkthroughs.</strong> Every few days for the next month, I'm going to walk you through one corner of the Triangle in deep detail — Stress Pressure, Sugar Pressure, Pipe Pressure. The herbs, the doses, the timing, the studies. This is the same teach I do with my $2,997 clients. You get it for $97 because you said yes early.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">2. The Monday live calls.</strong> Every Monday at 10 PM ET, I open Zoom and we work through whoever is on. Bring your cuff. Bring your numbers. Bring the question that's been bugging you. Recordings go in Skool if you can't make it live.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. The bonus stack.</strong> Cortisol Reset Kit unlocks Day 9. Blood Sugar 10-Day Reset unlocks Day 12. The Cook For Life Cookbook is your graduation gift on Day 30 — 45 plant-rich meals built around the foods that quiet all three Pressures. I stagger them on purpose: one tool at a time so nothing gets ignored.</p>
    `)}
    ${clayBlock('Step 1 — Join the Skool VIP room (today)', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Your VIP room is inside "How to Be Your Own Doctor." Introduce yourself with a one-liner: your first name, your current morning BP, and which Pressure you suspect is loudest in you. That post unlocks everything else.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Open your Skool VIP room →</a></p>
    `)}
    ${clayBlock('Step 2 — Save Monday 10 PM ET to your calendar', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Same Zoom link every week. Bookmark it now and you'll never miss one. Block 10–11 PM ET on every Monday between now and Day 30. Bring your cuff. Bring your last 3 readings. Bring questions.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${MONDAY_ZOOM_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Save the Monday Zoom link →</a></p>
    `)}
    ${ctaButton(MONDAY_ZOOM_URL, 'Save Monday 10 PM ET — your live call link →')}
    ${p(`If you can't make the first Monday live, send me your question by reply to this email and I'll answer it on the call. The recording lands in Skool within 24 hours of the call ending.`)}
    ${p(`You're in family now. Talk soon.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`The single most important thing you can do this week is take a baseline reading. Morning, sitting, two minutes of quiet first, both arms if you can. Write it down. Day 30 you'll thank yourself for having a clean before-picture.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Welcome to the BP Triangle Challenge. You're officially in the cohort. I want to say this directly: you didn't buy a PDF. You bought a seat in a room with me for thirty days.

THREE THINGS START THIS WEEK:

1. THE CHAPTER WALKTHROUGHS. Every few days for the next month, I'm going to walk you through one corner of the Triangle in deep detail — Stress Pressure, Sugar Pressure, Pipe Pressure. The herbs, the doses, the timing, the studies. This is the same teach I do with my $2,997 clients. You get it for $97 because you said yes early.

2. THE MONDAY LIVE CALLS. Every Monday at 10 PM ET, I open Zoom and we work through whoever is on. Bring your cuff. Bring your numbers. Bring the question that's been bugging you. Recordings go in Skool if you can't make it live.

3. THE BONUS STACK. Cortisol Reset Kit unlocks Day 9. Blood Sugar 10-Day Reset unlocks Day 12. The Cook For Life Cookbook is your graduation gift on Day 30 — 45 plant-rich meals built around the foods that quiet all three Pressures. I stagger them on purpose: one tool at a time so nothing gets ignored.

STEP 1 — JOIN THE SKOOL VIP ROOM (TODAY):
Your VIP room is inside "How to Be Your Own Doctor." Introduce yourself with a one-liner: your first name, your current morning BP, and which Pressure you suspect is loudest in you.
→ ${SKOOL_URL}

STEP 2 — SAVE MONDAY 10 PM ET TO YOUR CALENDAR:
Same Zoom link every week. Bookmark it now. Block 10–11 PM ET every Monday between now and Day 30.
→ ${MONDAY_ZOOM_URL}

If you can't make the first Monday live, send me your question by reply to this email and I'll answer it on the call. Recording lands in Skool within 24 hours.

You're in family now. Talk soon.

Joel
RN, BraveWorks

P.S. The single most important thing you can do this week is take a baseline reading. Morning, sitting, two minutes of quiet first, both arms if you can. Write it down. Day 30 you'll thank yourself for having a clean before-picture.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 3 — Chapter 1: Stress Pressure ───────────────────────────────
// First chapter walkthrough. Cortisol corner — ashwagandha + bedtime.
// Cohort-insider voice. Reinforces Monday call as the place to ask questions.
const day3 = {
  subject: 'Stress Pressure — Chapter 1 of your Challenge',
  subjectB: 'Monday at 10 PM ET — first live call',
  preview: 'The corner most cardiologists never measure. Your first walkthrough.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three days in. Chapter 1 of the Challenge starts today: <strong style="color:${PALETTE.text};">Stress Pressure</strong> — the cortisol corner of the Triangle.`)}
    ${p(`I'm starting here on purpose. Most boomer-aged women I work with assume their loudest corner is Pipe Pressure — they hear "high blood pressure" and think "stiff arteries, more lisinopril." But when I dig into a full history, the lead domino is almost always Stress Pressure. And cortisol is the driver most cardiologists don't even measure.`, { margin: '0 0 28px' })}
    ${bigQuote('Genes load the gun. Cortisol pulls the trigger.')}
    ${p(`Cortisol is the switch that's stuck on. It clamps your vessels. It tells your kidneys to retain sodium. It feeds the cortisol-insulin loop on the back end. <strong style="color:${PALETTE.text};">Until you calm this corner, the other two will not move.</strong>`)}
    ${p(`That's why we start here. The Stress Pressure corner is the keystone of the loop — calm this one and the other two follow.`, { margin: '0 0 28px' })}
    ${clayBlock('THE TWO MOVES — STRESS PRESSURE CORNER', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Ashwagandha (KSM-66 form, 300 mg AM + PM).</strong> Chandrasekhar et al, 2012 — 64 adults, 8 weeks. Salivary cortisol dropped 27.9% versus placebo. The cheapest single move you can make for the cortisol corner. Pick KSM-66 specifically — generic ashwagandha is hit-or-miss because the active withanolides aren't standardized.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. Asleep before 11 PM.</strong> Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset at 10 PM gives you ~3 hours inside that window. Sleep onset at 1 AM gives you zero — even if you sleep until 8.</p>
    `)}
    ${p(`If your morning BP runs high and your blood sugar is roughly normal, Stress Pressure is almost certainly the one driving your numbers. The good news: Stress Pressure responds faster than Pipe Pressure. Most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.`, { margin: '0 0 28px' })}
    ${bigQuote('The 25-25 gratitude protocol.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">25 things, morning. 25 things, evening. Spoken aloud or written.</strong> Specific, not generic. "I'm grateful for the cardinal at the feeder this morning" beats "I'm grateful for nature."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Gratitude is the only proven cognitive intervention that drops cortisol within 60 seconds. It costs nothing. It works on the first day. It's the single most underrated tool in this Challenge — and the one most people skip because it feels too soft. Don't skip it.</p>
    `)}
    ${clayBlock('MONDAY 10 PM ET — FIRST LIVE CALL', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">First Monday is two days away. Bring your baseline morning BP from this week. Bring the question about Stress Pressure that's been on your mind. We work through whoever is on, in the order they raise their hand.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${MONDAY_ZOOM_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Monday Zoom link (save this) →</a></p>
    `)}
    ${ctaButton(MONDAY_ZOOM_URL, 'See you Monday 10 PM ET →')}
    ${p(`Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay, your doctor watches the readings, the readings move because the inputs are moving.`)}
    ${p(`Three days from now, Chapter 2 lands in your inbox: <strong style="color:${PALETTE.text};">Sugar Pressure</strong> — the corner cardiologists never measure.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you have not started ashwagandha yet, the Skool VIP room has a pinned thread with the exact brand I recommend, the dose schedule, and where to buy it for under $20/month. Look for "Ashwagandha — KSM-66 — exact brand" at the top of the channel.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Three days in. Chapter 1 of the Challenge starts today: STRESS PRESSURE — the cortisol corner of the Triangle.

I'm starting here on purpose. Most boomer-aged women I work with assume their loudest corner is Pipe Pressure. But when I dig into a full history, the lead domino is almost always Stress Pressure. And cortisol is the driver most cardiologists don't even measure.

GENES LOAD THE GUN. CORTISOL PULLS THE TRIGGER.

Cortisol is the switch stuck on. It clamps your vessels. It tells your kidneys to retain sodium. It feeds the cortisol-insulin loop on the back end. UNTIL YOU CALM THIS CORNER, THE OTHER TWO WILL NOT MOVE.

THE TWO MOVES — STRESS PRESSURE CORNER:

1. Ashwagandha (KSM-66, 300mg AM + PM). Chandrasekhar 2012 — salivary cortisol dropped 27.9% vs placebo over 8 weeks. Pick KSM-66 specifically — generic ashwagandha is hit-or-miss.

2. Asleep before 11 PM. Hours before midnight matter most. Slow-wave cortisol clearance peaks 10 PM to 2 AM. Sleep onset 10 PM = ~3 hours in that window. Sleep onset 1 AM = zero, even if you sleep until 8.

If your morning BP runs high and your blood sugar is roughly normal, Stress Pressure is almost certainly the one driving your numbers. Most people see morning BP drop 5-8 mmHg within two weeks of moving bedtime earlier.

THE 25-25 GRATITUDE PROTOCOL.

25 things morning. 25 things evening. Spoken aloud or written. Specific, not generic. "I'm grateful for the cardinal at the feeder" beats "I'm grateful for nature."

Gratitude is the only proven cognitive intervention that drops cortisol within 60 seconds. It costs nothing. It works on the first day. Don't skip it.

MONDAY 10 PM ET — FIRST LIVE CALL.

First Monday is two days away. Bring your baseline morning BP from this week. Bring the question about Stress Pressure that's been on your mind. We work through whoever is on, in the order they raise their hand.
→ ${MONDAY_ZOOM_URL}

Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay, your doctor watches the readings, the readings move because the inputs are moving.

Three days from now, Chapter 2: SUGAR PRESSURE — the corner cardiologists never measure.

Joel
RN, BraveWorks

P.S. If you have not started ashwagandha yet, the Skool VIP room has a pinned thread with the exact brand, dose schedule, and where to buy it for under $20/month. Look for "Ashwagandha — KSM-66 — exact brand" at the top of the channel.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 6 — Chapter 2: Sugar Pressure ───────────────────────────────
// Second chapter walkthrough. Insulin corner — walk-after-meal + Anti-BP Plate.
// Includes early cohort wins to build belief mid-Challenge.
const day6 = {
  subject: 'Sugar Pressure — Chapter 2',
  subjectB: 'The corner cardiologists never measure',
  preview: 'Why cutting your salt didn\'t move your numbers.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Chapter 1 walked the Stress Pressure corner. Chapter 2 of your Challenge starts now: <strong style="color:${PALETTE.text};">Sugar Pressure</strong> — the corner cardiologists never measure.`)}
    ${p(`This is the corner I almost missed in my own practice for years. The one that explains why people who "cut their salt" for a decade watch their BP keep creeping up anyway.`, { margin: '0 0 28px' })}
    ${bigQuote('Sugar Pressure raises blood pressure. Harder than salt does.')}
    ${p(`Most cardiologists don't measure A1c. They look at your BP, they look at your cholesterol, maybe they look at your kidneys. Blood sugar doesn't even show up on their scorecard.`)}
    ${p(`But every time your blood sugar spikes, your insulin spikes. And insulin is a vasoconstrictor — it narrows your blood vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop on the back end.`)}
    ${p(`Three Pressures of one loop. Calm one, the other two follow. <strong style="color:${PALETTE.text};">Fix the Triangle, the BP fixes itself.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock('THE THREE "SAVORY" FOODS THAT SPIKE BP HARDER THAN CANDY', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">White bread / bagels.</strong> Hits like 5 teaspoons of pure sugar. Insulin spikes within 30 minutes.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Boxed cereal.</strong> 30-50% sugar by weight. A "healthy breakfast" cereal can be the same insulin hit as a glazed donut.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">Crackers, pretzels, rice cakes.</strong> Refined starch behaves like sugar in your bloodstream. The body doesn't distinguish.</p>
    `)}
    ${p(`If you cut your salt and your BP didn't move, this is almost always why. Blood sugar is the silent corner.`, { margin: '0 0 28px' })}
    ${bigQuote('THE TWO MOVES — SUGAR PRESSURE CORNER')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. The 10-minute walk inside 30 minutes of eating.</strong> Your muscles pull glucose out of your bloodstream without insulin. Multiple meta-analyses show 30-40% reduction in the post-meal glucose curve. No equipment, no willpower, no diet rules. Walk to the mailbox and back. That's enough.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. The Anti-BP Plate.</strong> Half the plate non-starchy vegetables. Palm-sized protein. Thumb of fat. Small carb — and eat it last. Order matters more than calories. Same plate, carbs at the end, 30-40% smaller glucose spike. By the time the carb arrives, the stomach is partially emptied and GLP-1 is already up.</p>
    `)}
    ${p(`Pills manage output. Protocol fixes input. The protocol for this corner is two behaviors — walk after meals, eat carbs last. Both free. Both 14 days to start moving morning numbers.`, { margin: '0 0 28px' })}
    ${clayBlock('WINS FROM PRIOR COHORTS (read these out loud)', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Marlene, 52:</strong> 11 systolic points in 9 days. Three food swaps. No new pill. Doctor lowered her dose at the next visit.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Linda, 62:</strong> 148/94 → 128/82 in 11 days. Anti-BP Plate + hibiscus. Her cardiologist asked her what she was doing differently.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Rachel, 55:</strong> fasting glucose 138 → 109 in 3 weeks. Walk-after-meals + carbs-last. Same calories. Different order.</p>
    `)}
    ${p(`These are not unicorns. These are women who walked their cuff numbers down in less time than they thought possible — because they targeted the right corner with specific moves. <strong style="color:${PALETTE.text};">You are next on this list.</strong> The 30-day window of this Challenge is engineered for exactly that outcome.`, { margin: '0 0 28px' })}
    ${p(`Chapter 3 lands in three days: <strong style="color:${PALETTE.text};">Pipe Pressure</strong> — the pipes themselves. Plus your first bonus kit unlocks.`, { margin: '0 0 24px' })}
    ${joelSignoff()}
    ${psBox(`Pinned in Skool today: a one-page printable "Anti-BP Plate" template. Print it. Tape it to the inside of the cabinet you open at meal time. The plate becomes automatic in about 9 days — but you have to see it to build the habit.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Chapter 1 walked the Stress Pressure corner. Chapter 2 of your Challenge starts now: SUGAR PRESSURE — the corner cardiologists never measure.

This is the corner I almost missed in my own practice for years. The one that explains why people who "cut their salt" for a decade watch their BP keep creeping up anyway.

SUGAR PRESSURE RAISES BLOOD PRESSURE. HARDER THAN SALT DOES.

Most cardiologists don't measure A1c. They look at BP, cholesterol, maybe kidneys. Blood sugar doesn't even show up on their scorecard.

But every time your blood sugar spikes, insulin spikes. Insulin is a vasoconstrictor — it narrows your vessels for 2-3 hours after every meal. It also tells your kidneys to retain sodium. It also feeds the cortisol loop.

Three Pressures of one loop. Calm one, the other two follow. FIX THE TRIANGLE, THE BP FIXES ITSELF.

THE THREE "SAVORY" FOODS THAT SPIKE BP HARDER THAN CANDY:

→ White bread / bagels. Hits like 5 teaspoons of pure sugar.
→ Boxed cereal. 30-50% sugar by weight. Same insulin hit as a glazed donut.
→ Crackers, pretzels, rice cakes. Refined starch behaves like sugar — the body doesn't distinguish.

If you cut your salt and your BP didn't move, this is almost always why. Blood sugar is the silent corner.

THE TWO MOVES — SUGAR PRESSURE CORNER:

1. The 10-minute walk inside 30 minutes of eating. Muscles pull glucose out without insulin. Multiple meta-analyses show 30-40% reduction in the post-meal glucose curve. Walk to the mailbox. That's enough.

2. The Anti-BP Plate. Half plate non-starchy veg. Palm of protein. Thumb of fat. Small carb LAST. Order matters more than calories. Same plate, carbs at the end, 30-40% smaller glucose spike.

Pills manage output. Protocol fixes input. The protocol for this corner is two behaviors. Both free. Both 14 days to start moving morning numbers.

WINS FROM PRIOR COHORTS (read these out loud):

→ Marlene, 52: 11 systolic points in 9 days. Three food swaps. No new pill. Doctor lowered her dose at the next visit.
→ Linda, 62: 148/94 → 128/82 in 11 days. Anti-BP Plate + hibiscus. Her cardiologist asked her what she was doing differently.
→ Rachel, 55: fasting glucose 138 → 109 in 3 weeks. Walk-after-meals + carbs-last. Same calories. Different order.

These are not unicorns. They walked their cuff numbers down in less time than they thought possible because they targeted the right corner. YOU ARE NEXT ON THIS LIST. The 30-day window of this Challenge is engineered for exactly that outcome.

Chapter 3 lands in three days: PIPE PRESSURE — the pipes themselves. Plus your first bonus kit unlocks.

Joel
RN, BraveWorks

P.S. Pinned in Skool today: a one-page printable "Anti-BP Plate" template. Print it. Tape it to the inside of the cabinet you open at meal time. The plate becomes automatic in about 9 days — but you have to see it to build the habit.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 9 — Chapter 3: Pipe Pressure + Cortisol Reset Kit unlock ──
// Third chapter — vascular corner. Hibiscus + garlic + magnesium.
// Delivers the first bonus: 10-Day Cortisol Reset Kit.
const day9 = {
  subject: 'Pipe Pressure — Chapter 3 + your Cortisol Kit',
  subjectB: 'The pipes you can\'t see but can feel',
  preview: 'Hibiscus, garlic, magnesium — and your first bonus is unlocked.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Stress Pressure on Day 3. Sugar Pressure on Day 6. Today — <strong style="color:${PALETTE.text};">Chapter 3: Pipe Pressure</strong>. The vascular corner. The pipes themselves.`)}
    ${p(`Plus your first bonus is unlocked at the bottom of this email. The <strong style="color:${PALETTE.text};">10-Day Cortisol Reset Kit</strong> is ready for download — the same kit I send to my $497 cohort buyers.`, { margin: '0 0 28px' })}
    ${bigQuote('The pipes got stiff. Three things fix it. Not one.')}
    ${p(`Pipe Pressure is what most people think of when they hear "high blood pressure" — stiff arteries, low nitric oxide, endothelial damage, sodium/potassium imbalance. It's the corner with the most aggressive marketing (every BP supplement on Amazon promises this), and it's the corner that responds <em>slowest</em> to interventions — because the pipes themselves take real weeks to remodel.`)}
    ${p(`That's why I save it for Day 9. By now you've already calmed Stress Pressure (cortisol clearance, ashwagandha working) and Sugar Pressure (walk-after-meal, Anti-BP Plate). The pipes don't have to fight a cortisol storm or a glucose spike — they get to actually heal.`, { margin: '0 0 28px' })}
    ${clayBlock('THE THREE MOVES — PIPE PRESSURE CORNER', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Hibiscus tea (Hibiscus sabdariffa).</strong> 2-3 cups daily, brewed 6-10 minutes. Tufts 2010 RCT: 7.2 mmHg systolic reduction in 6 weeks. Mechanism: natural ACE inhibition (same pathway as lisinopril, gentler). NOT flavored hibiscus blends — they're 80% other tea by weight. Look for "100% hibiscus" on the label.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Garlic stack.</strong> 2 fresh cloves daily, crushed, wait 10 minutes for alliinase→allicin conversion, then eat. OR Kyolic Aged Garlic Extract 600-1,200 mg daily. 2019 Journal of Clinical Hypertension meta-analysis: 8.3 mmHg systolic, 5.5 mmHg diastolic across 550 patients. Mechanism: allicin → hydrogen sulfide → vasodilation.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Magnesium taurate, 200 mg with dinner.</strong> NOT magnesium oxide (4% absorption, near-useless). Taurate is the cardiovascular-specific form — magnesium plus taurine, both directly support vascular tone. Adds 2 mmHg systolic on average and pairs with the hibiscus and garlic without interaction risk.</p>
    `)}
    ${p(`Three moves. The pipes start to remodel inside 14 days. By Day 30 of this Challenge, most readers are seeing 5-8 mmHg drops just from the Pipe Pressure stack alone — on top of the Stress + Sugar gains you're already building.`, { margin: '0 0 28px' })}
    ${bigQuote('Your first bonus is here.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">The 10-Day Cortisol Reset Kit</strong> — your first bonus from the Challenge stack. This is the same kit my $497 cohort buyers get. It walks you through the Stress Pressure corner with day-by-day prompts: morning sun timing, ashwagandha protocol, gratitude practice scripts, the 4-7-8 breath, and a sleep audit you can actually finish in 5 minutes.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Don't read the whole thing today. Use it as a 10-day companion to Chapter 1 (Stress Pressure). One micro-action per day. Stack on top of the Triangle moves you already started.</p>
    `)}
    ${ctaButton(BONUS_CORTISOL_URL, 'Download your Cortisol Reset Kit →')}
    ${p(`Next bonus — <strong style="color:${PALETTE.text};">Blood Sugar 10-Day Reset</strong> — unlocks on Day 12 of your Challenge. The <strong style="color:${PALETTE.text};">Cook For Life Cookbook</strong> is your graduation gift on Day 30.`, { margin: '0 0 24px' })}
    ${p(`Pills manage output. Protocol fixes input. You're now running the full Triangle: Stress, Sugar, Pipes. Same loop, three doors in. That's why this Method works when the single-supplement experiments your friends tried did not.`)}
    ${joelSignoff()}
    ${psBox(`Monday's call is in 4 days. Halfway through the cohort, the question that comes up most is "should I be tapering my meds yet?" Short answer: usually no, not until Day 30+ with sustained readings. Long answer: bring it to Monday and we'll work through your specific case live.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Stress Pressure on Day 3. Sugar Pressure on Day 6. Today — CHAPTER 3: PIPE PRESSURE. The vascular corner. The pipes themselves.

Plus your first bonus is unlocked at the bottom of this email. The 10-Day Cortisol Reset Kit is ready for download — the same kit I send to my $497 cohort buyers.

THE PIPES GOT STIFF. THREE THINGS FIX IT. NOT ONE.

Pipe Pressure is what most people think of when they hear "high blood pressure" — stiff arteries, low nitric oxide, endothelial damage, sodium/potassium imbalance. It's the corner with the most aggressive marketing (every BP supplement on Amazon promises this), and it's the corner that responds SLOWEST — because the pipes themselves take real weeks to remodel.

That's why I save it for Day 9. By now you've already calmed Stress Pressure and Sugar Pressure. The pipes don't have to fight a cortisol storm or a glucose spike — they get to actually heal.

THE THREE MOVES — PIPE PRESSURE CORNER:

1. Hibiscus tea (Hibiscus sabdariffa). 2-3 cups daily, brewed 6-10 minutes. Tufts 2010 RCT: 7.2 mmHg systolic reduction in 6 weeks. Mechanism: natural ACE inhibition (same pathway as lisinopril, gentler). NOT flavored hibiscus blends — they're 80% other tea by weight. Look for "100% hibiscus" on the label.

2. Garlic stack. 2 fresh cloves daily, crushed, wait 10 minutes for alliinase→allicin conversion, then eat. OR Kyolic Aged Garlic Extract 600-1,200mg daily. 2019 Journal of Clinical Hypertension meta-analysis: 8.3 mmHg systolic, 5.5 mmHg diastolic across 550 patients. Mechanism: allicin → hydrogen sulfide → vasodilation.

3. Magnesium taurate, 200mg with dinner. NOT magnesium oxide (4% absorption, near-useless). Taurate is the cardiovascular-specific form. Adds 2 mmHg systolic on average and pairs with hibiscus and garlic without interaction risk.

Three moves. The pipes start to remodel inside 14 days. By Day 30 of this Challenge, most readers see 5-8 mmHg drops from the Pipe Pressure stack alone — on top of the Stress + Sugar gains you're already building.

YOUR FIRST BONUS IS HERE.

The 10-Day Cortisol Reset Kit — your first bonus from the Challenge stack. Same kit my $497 cohort buyers get. Day-by-day prompts: morning sun timing, ashwagandha protocol, gratitude scripts, 4-7-8 breath, 5-minute sleep audit.

Don't read the whole thing today. Use it as a 10-day companion to Chapter 1 (Stress Pressure). One micro-action per day.

→ Download your Cortisol Reset Kit: ${BONUS_CORTISOL_URL}

Next bonus — Blood Sugar 10-Day Reset — unlocks on Day 12. The Cook For Life Cookbook is your graduation gift on Day 30.

Pills manage output. Protocol fixes input. You're now running the full Triangle: Stress, Sugar, Pipes. Same loop, three doors in. That's why this Method works when the single-supplement experiments your friends tried did not.

Joel
RN, BraveWorks

P.S. Monday's call is in 4 days. Halfway through the cohort, the question that comes up most is "should I be tapering my meds yet?" Short answer: usually no, not until Day 30+ with sustained readings. Long answer: bring it to Monday and we'll work through your specific case live.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 12 — Blood Sugar Kit unlock + Monday call reminder ──────────
// Second bonus delivery. Pre-Monday reminder. Reinforce midway momentum.
const day12 = {
  subject: 'Your Blood Sugar Kit is unlocked',
  subjectB: 'Monday call: live BP demo with Joel',
  preview: 'Bonus #2 — and the question to bring to Monday\'s call.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Bonus #2 is unlocked. The <strong style="color:${PALETTE.text};">Blood Sugar 10-Day Reset</strong> is ready for download — your companion guide to Chapter 2 (Sugar Pressure) from earlier this week.`, { margin: '0 0 28px' })}
    ${bigQuote('Pair it with what you already started.')}
    ${p(`If you've been doing the walk-after-meal + Anti-BP Plate from Day 6, this kit takes it the next layer deeper. It walks the cinnamon-and-berberine question (yes, but here's the right dose). The ACV-before-meal protocol (1 tablespoon in water, 10 minutes before — not "shots"). The 14-hour eating window (last meal by 6 PM, first meal after 8 AM — the cheapest single insulin-sensitivity move).`)}
    ${p(`Don't try to run all of it at once. The kit is designed for 10 micro-additions over 10 days. Layer one new thing per day on top of what you're already doing.`, { margin: '0 0 28px' })}
    ${ctaButton(BONUS_BLOODSUGAR_URL, 'Download your Blood Sugar 10-Day Reset →')}
    ${clayBlock('A NOTE FOR DIABETICS OR PRE-DIABETICS', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">If you're on a glucose-lowering medication (metformin, glipizide, insulin), every move in this kit has the potential to lower your glucose further — which is the goal, but it means you need your prescribing doctor in the loop before you change anything. Tell them what you're trying. Ask for weekly fingerstick monitoring during the 10 days.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">AND not INSTEAD OF — same rule for blood sugar as for blood pressure. Your meds stay until your doctor adjusts them based on your data.</p>
    `)}
    ${bigQuote('Monday night — the live BP demo.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">On Monday's call I'm going to do something I don't do every week: a <strong style="color:${PALETTE.text};">live BP demo</strong>. I'll put my own cuff on, take a reading on camera, then walk through how I read my own numbers — what counts as a good reading, what to throw out, why the second reading on the same arm matters more than the first, and what the spread between morning and evening tells you about which Pressure is loudest.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you have a cuff, bring it. Take a reading on the call with me. Drop your number in the chat. We'll work through 3-4 readings live.</p>
    `)}
    ${clayBlock('MONDAY 10 PM ET — BRING YOUR CUFF', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Same Zoom link as last Monday — save it once, use it for all 4 weeks of the Challenge.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${MONDAY_ZOOM_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Monday Zoom link →</a></p>
    `)}
    ${ctaButton(MONDAY_ZOOM_URL, 'See you Monday 10 PM ET →')}
    ${p(`You're 12 days into a 30-day cohort. Most of the structural protocols are in your hands now — Stress Pressure herbs, Sugar Pressure plate, Pipe Pressure stack. The next 18 days are about <em>doing them</em> long enough for the morning numbers to start telling a different story.`, { margin: '0 0 28px' })}
    ${p(`Day 15 — halfway through — I'll send you a mid-cohort check-in. Bring your week-1 baseline and your current readings. We'll compare and adjust.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your readings are NOT moving by Day 12, that's not a failure — that's data. The most common reasons: (1) ashwagandha not started yet, (2) bedtime still after 11 PM, (3) hibiscus is "raspberry hibiscus" tea (mostly other ingredients). Send me a reply with where you actually are on these three and I'll point you at the right Skool thread.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Bonus #2 is unlocked. The Blood Sugar 10-Day Reset is ready for download — your companion guide to Chapter 2 (Sugar Pressure) from earlier this week.

PAIR IT WITH WHAT YOU ALREADY STARTED.

If you've been doing the walk-after-meal + Anti-BP Plate from Day 6, this kit takes it the next layer deeper. It walks the cinnamon-and-berberine question (yes, but here's the right dose). The ACV-before-meal protocol (1 tbsp in water, 10 min before — not "shots"). The 14-hour eating window (last meal by 6 PM, first meal after 8 AM — cheapest single insulin-sensitivity move).

Don't try to run all of it at once. 10 micro-additions over 10 days. Layer one new thing per day on top of what you're already doing.

→ Download your Blood Sugar 10-Day Reset: ${BONUS_BLOODSUGAR_URL}

A NOTE FOR DIABETICS OR PRE-DIABETICS:

If you're on a glucose-lowering medication (metformin, glipizide, insulin), every move in this kit has the potential to lower your glucose further — which is the goal, but it means you need your prescribing doctor in the loop before you change anything. Tell them what you're trying. Ask for weekly fingerstick monitoring during the 10 days.

AND not INSTEAD OF — same rule for blood sugar as for blood pressure. Your meds stay until your doctor adjusts them based on your data.

MONDAY NIGHT — THE LIVE BP DEMO.

On Monday's call I'm going to do something I don't do every week: a live BP demo. I'll put my own cuff on, take a reading on camera, then walk through how I read my own numbers — what counts as a good reading, what to throw out, why the second reading on the same arm matters more than the first, and what the spread between morning and evening tells you about which Pressure is loudest.

If you have a cuff, bring it. Take a reading on the call with me. Drop your number in the chat. We'll work through 3-4 readings live.

MONDAY 10 PM ET — BRING YOUR CUFF.

Same Zoom link as last Monday — save it once, use it for all 4 weeks of the Challenge.
→ ${MONDAY_ZOOM_URL}

You're 12 days into a 30-day cohort. Most of the structural protocols are in your hands now — Stress Pressure herbs, Sugar Pressure plate, Pipe Pressure stack. The next 18 days are about doing them long enough for the morning numbers to start telling a different story.

Day 15 — halfway through — I'll send you a mid-cohort check-in. Bring your week-1 baseline and your current readings. We'll compare and adjust.

Joel
RN, BraveWorks

P.S. If your readings are NOT moving by Day 12, that's not a failure — that's data. The most common reasons: (1) ashwagandha not started yet, (2) bedtime still after 11 PM, (3) hibiscus is "raspberry hibiscus" tea (mostly other ingredients). Send me a reply with where you actually are on these three and I'll point you at the right Skool thread.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 15 — Mid-cohort check-in + first soft Cohort 2 mention ────
// Halfway through. Reflective, not pitchy. Hints that something deeper exists
// after the Challenge — without selling it yet.
const day15 = {
  subject: 'Halfway through. How\'s the cuff?',
  subjectB: 'What\'s working — and what\'s next',
  preview: 'Day 15 check-in: the data is starting to tell a story.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Day 15. Halfway through your Challenge. I want to slow down today and ask the question that matters more than any new protocol:`)}
    ${bigQuote('How\'s the cuff?')}
    ${p(`Not "are you doing everything perfectly." Not "have you finished all the bonus kits." The cuff. The morning number. The number you take sitting, after two minutes of quiet, on the same arm.`)}
    ${p(`If your baseline at Day 0 was, say, 148/92 and today's morning reading is 138/86 — that's a 10-point drop in 15 days. That's a real win. That's the Triangle working underneath your meds. <strong style="color:${PALETTE.text};">That's exactly what we're after.</strong>`, { margin: '0 0 28px' })}
    ${clayBlock('Where most Challenge readers are at Day 15', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">5-12 mmHg systolic drop</strong> from baseline (the largest chunk of the gain shows up in the first 14 days)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Sleep deeper</strong> — most report falling asleep within 15 min and waking with less brain fog</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">3 PM crash gone</strong> if Sugar Pressure was loudest</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">Smaller waist</strong> — usually 1-2 inches by Day 14 from the carbs-last move alone</p>
    `)}
    ${p(`If you're seeing some of those signals — even if the cuff number hasn't moved as much as you wanted — the Triangle is working. The readings tend to lag behind the symptom signs by 7-10 days. Body changes first; cuff changes second.`, { margin: '0 0 28px' })}
    ${bigQuote('What happens in the next 15 days.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Days 16-22:</strong> readings consolidate. The first-week drop wasn't a fluke. The body learns the new pattern. You'll see less day-to-day variability in your morning numbers.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Days 23-29:</strong> readings settle into a new baseline. This is when most people start having the doctor conversation about a possible dose reduction — but only with their physician, never on their own.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Day 30:</strong> you graduate. You'll have a 30-day BP log, a clean baseline-vs-final comparison, and a body that's used to the new rhythm. Many of you will want to bring this data to your next cardiology appointment.</p>
    `)}
    ${p(`Here's the thing I want to put on your radar — without pitching it today.`)}
    ${p(`What happens <em>after</em> Day 30 is the question I get most from Challenge graduates. The short answer: there's a deeper room. <strong style="color:${PALETTE.text};">Cohort 2</strong> — the 90-day Sprint — is for the Challenge graduates who want me on their numbers for the next three months, watching every reading, adjusting the protocol every week, walking them through the doctor conversation when the time comes.`)}
    ${p(`I'll tell you the full mechanism on Day 18. For now, just know it exists. If you've been wondering what's after this — that's the answer.`, { margin: '0 0 28px' })}
    ${clayBlock('THIS WEEK\'S ASSIGNMENT', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Reply to this email with three numbers:</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;">1. Your Day 0 baseline (morning reading)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;">2. Your this-week average (last 5 morning readings)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">3. The one symptom that's changed most (sleep, energy, waist, cravings, mood — any of them)</p>
    `)}
    ${p(`I read every reply. I'll mention themes on Monday's call.`)}
    ${p(`Halfway through. Keep going.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your numbers HAVE NOT moved at Day 15, that means one of three things. (1) You haven't fully run the protocol yet — be honest with yourself, are you on ashwagandha + hibiscus + the walk-after-meal? (2) There's a hidden cause we haven't found yet — sleep apnea is the big one, screened for in 40-80% of resistant hypertension. (3) Your loudest corner is actually Pipe Pressure, which takes 28+ days to fully remodel. Tell me on Monday and we'll work through which it is.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Day 15. Halfway through your Challenge. I want to slow down today and ask the question that matters more than any new protocol:

HOW'S THE CUFF?

Not "are you doing everything perfectly." Not "have you finished all the bonus kits." The cuff. The morning number. The number you take sitting, after two minutes of quiet, on the same arm.

If your baseline at Day 0 was, say, 148/92 and today's morning reading is 138/86 — that's a 10-point drop in 15 days. That's a real win. That's the Triangle working underneath your meds. THAT'S EXACTLY WHAT WE'RE AFTER.

WHERE MOST CHALLENGE READERS ARE AT DAY 15:

→ 5-12 mmHg systolic drop from baseline (largest chunk shows up in the first 14 days)
→ Sleep deeper — most report falling asleep within 15 min, waking with less brain fog
→ 3 PM crash gone if Sugar Pressure was loudest
→ Smaller waist — usually 1-2 inches by Day 14 from the carbs-last move alone

If you're seeing some of those signals — even if the cuff number hasn't moved as much as you wanted — the Triangle is working. Readings tend to lag symptom signs by 7-10 days. Body changes first; cuff changes second.

WHAT HAPPENS IN THE NEXT 15 DAYS:

Days 16-22: readings consolidate. First-week drop wasn't a fluke. Body learns the new pattern.

Days 23-29: readings settle into a new baseline. This is when most people start having the doctor conversation about a possible dose reduction — but only with their physician, never on their own.

Day 30: you graduate. 30-day BP log, clean baseline-vs-final comparison, body used to the new rhythm. Many of you will want to bring this data to your next cardiology appointment.

Here's the thing I want to put on your radar — without pitching it today.

What happens AFTER Day 30 is the question I get most from Challenge graduates. The short answer: there's a deeper room. COHORT 2 — the 90-day Sprint — is for graduates who want me on their numbers for the next three months, watching every reading, adjusting the protocol every week, walking them through the doctor conversation when the time comes.

I'll tell you the full mechanism on Day 18. For now, just know it exists.

THIS WEEK'S ASSIGNMENT: Reply to this email with three numbers:

1. Your Day 0 baseline (morning reading)
2. Your this-week average (last 5 morning readings)
3. The one symptom that's changed most (sleep, energy, waist, cravings, mood)

I read every reply. I'll mention themes on Monday's call.

Halfway through. Keep going.

Joel
RN, BraveWorks

P.S. If your numbers HAVE NOT moved at Day 15, that means one of three things. (1) You haven't fully run the protocol yet — be honest with yourself, are you on ashwagandha + hibiscus + the walk-after-meal? (2) There's a hidden cause we haven't found yet — sleep apnea is the big one, screened for in 40-80% of resistant hypertension. (3) Your loudest corner is actually Pipe Pressure, which takes 28+ days to fully remodel. Tell me on Monday and we'll work through which it is.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 18 — Cohort 2 reveal — PASTOR framework ────────────────────
// First full pitch. After-the-Challenge mechanism. Sprint preview.
// PASTOR: Problem, Amplify, Story, Transformation, Offer, Response.
const day18 = {
  subject: 'After the Challenge: there\'s a deeper room',
  subjectB: 'Cohort 2 opens to graduates first',
  preview: 'The 90-day Sprint — what it is, who it\'s for, why it exists.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I told you on Day 15 there was a deeper room. Today I want to tell you what's in it — and why most Challenge graduates step into it within the first 48 hours after Day 30.`)}
    ${p(`This is the longest email I'll send this month. Read it twice if you have to. The next two weeks of this Challenge change a lot depending on whether this resonates with you.`, { margin: '0 0 28px' })}
    ${bigQuote('PROBLEM: 30 days lowers numbers. It doesn\'t lower meds.')}
    ${p(`Here's what I see in Challenge graduates over and over. Day 30 hits. Your morning average is now 132/82, down from 148/94. You've lost two inches off your waist. You're sleeping through the night for the first time in years. You're proud of the work. <strong style="color:${PALETTE.text};">And then you don't know what to do next.</strong>`)}
    ${p(`The Challenge moves the numbers. The Challenge does NOT move you off the medication — because that's a conversation with your doctor, not a 30-day protocol. And without the doctor conversation, without the data presented the right way, without weekly readings tracked over months — your prescriber has no reason to taper. You go back on autopilot. Six months later your numbers creep up again. <strong style="color:${PALETTE.text};">That's not the outcome you bought this Challenge for.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('AMPLIFY: The taper-off window is 60-180 days, not 30.')}
    ${p(`The medical literature is clear on this. Sustained BP reductions of 8+ mmHg systolic over 60-90 days is what makes a cardiologist comfortable lowering a dose. Anything less than 60 days of sustained data and most doctors say "let's keep watching." The first 30 days is the prep phase. The actual taper conversation needs at least <em>another</em> 60 days of clean data.`)}
    ${p(`That gap — between Day 30 of the Challenge and Day 90 of a real taper window — is where most BP buyers stall out. They lose momentum. They drift off the protocol. The numbers creep back. They're still on the meds at the end of the year, frustrated, wondering what went wrong.`, { margin: '0 0 28px' })}
    ${bigQuote('STORY: Wakita closed in 16 days.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">Wakita Taylor was the first paid 1:1 client of mine inside the Sprint. She came in May 15 with elevated BP, type-2 diabetes, mid-fifties, two meds running.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">First 30 days: same chapter walkthroughs you're getting now. Stress Pressure, Sugar Pressure, Pipe Pressure. Same Triangle protocol. Same herbs.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">What was different in the Sprint: I was on her data every week. I caught a missed dose on Day 12. I caught a hidden cortisol spike on Day 19 — she'd added an afternoon coffee that was killing her sleep. I sent her into her doctor on Day 60 with a printed BP log and a one-page protocol summary.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Her doctor lowered her metformin first. Her doctor lowered her amlodipine second. Wakita's writing her own bonus chapter for the Sprint cookbook this month — the woman who 90 days ago thought she'd be on pills for life is now teaching the women coming in behind her.</p>
    `)}
    ${bigQuote('TRANSFORMATION: From morning-number tracker to medication-conversation owner.')}
    ${p(`The Challenge taught you the Triangle protocol. Cohort 2 — the 90-day Sprint — gets you to the doctor conversation with the right data, the right framing, and a coach who's been in 200+ of these conversations beside other clients.`)}
    ${p(`Inside the Sprint you get: weekly 1:1 calls with me (30 minutes each), my eyes on your BP log every Monday morning, the full Doctor Conversation Script (the exact words, the order, the fallback if they say no), the Med Wean Tracker for the actual taper window, and the Skool VIP Sprint room — a smaller, tighter cohort than the Challenge.`)}
    ${p(`The graduates from Cohort 1 of the Sprint are now ~70% off at least one medication, with their doctor's blessing. That's the outcome. <strong style="color:${PALETTE.text};">Doctor-cleared independence.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('OFFER: $1,997 for the 90-day Sprint. Applications open today.')}
    ${p(`Cohort 2 is application-only — I cap it at 5 seats so I can actually be on every Monday with every client. The doors are open until Friday at midnight ET. After Friday, applications close and the next cohort doesn't open until Cohort 3 fills, which is at least 60 days out.`)}
    ${p(`I'll walk the full credit math, the guarantee, and the application questions on Day 26 of this Challenge. Today is just the reveal — so you know what room is being opened.`, { margin: '0 0 28px' })}
    ${clayBlock('RESPONSE — IF THIS RESONATES', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Look at the Cohort 2 application page now. Don't apply yet — just read what it is. Get a feel for whether the deeper room is somewhere you want to be after Day 30.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COHORT2_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Read about Cohort 2 →</a></p>
    `)}
    ${ctaButton(COHORT2_URL, 'Read about Cohort 2 (no commitment) →')}
    ${p(`Day 22 — I'll tell you exactly what Wakita's Monday looks like inside the Sprint. The Tuesday tracker. The Monday call. The doctor visit prep. So you can see, in real terms, what the next 90 days could look like for you.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you're already past Day 90 of being on BP meds and you're frustrated that "everyone says I need to be patient" — read this email again. The Sprint exists because the 30-day window is too short for a real conversation about getting off the meds. You need the next 60 with a coach on your data.`)}
    ${upsellFooter({
      kicker: 'COHORT 2 — THE 90-DAY SPRINT',
      body: 'Applications open until Friday at midnight ET. 5 seats. The 90 days that turn your Challenge into a real doctor conversation about lowering or removing the meds.',
      ctaLabel: 'Read about Cohort 2',
      ctaUrl: COHORT2_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

I told you on Day 15 there was a deeper room. Today I want to tell you what's in it — and why most Challenge graduates step into it within the first 48 hours after Day 30.

This is the longest email I'll send this month. Read it twice if you have to.

PROBLEM: 30 DAYS LOWERS NUMBERS. IT DOESN'T LOWER MEDS.

Here's what I see in Challenge graduates over and over. Day 30 hits. Your morning average is now 132/82, down from 148/94. You've lost two inches off your waist. You're sleeping through the night for the first time in years. You're proud of the work. AND THEN YOU DON'T KNOW WHAT TO DO NEXT.

The Challenge moves the numbers. The Challenge does NOT move you off the medication — because that's a conversation with your doctor, not a 30-day protocol. Without the doctor conversation, without data presented the right way, without weekly readings tracked over months — your prescriber has no reason to taper. You go back on autopilot. Six months later your numbers creep up again. THAT'S NOT THE OUTCOME YOU BOUGHT THIS CHALLENGE FOR.

AMPLIFY: THE TAPER-OFF WINDOW IS 60-180 DAYS, NOT 30.

The medical literature is clear: sustained BP reductions of 8+ mmHg systolic over 60-90 days is what makes a cardiologist comfortable lowering a dose. Anything less than 60 days and most doctors say "let's keep watching." First 30 days is prep. The actual taper conversation needs another 60 of clean data.

That gap — between Day 30 of the Challenge and Day 90 of a real taper window — is where most BP buyers stall out. They lose momentum. Numbers creep back. They're still on the meds at the end of the year, frustrated.

STORY: WAKITA CLOSED IN 16 DAYS.

Wakita Taylor was the first paid 1:1 client of mine inside the Sprint. Elevated BP, type-2 diabetes, mid-fifties, two meds.

First 30 days: same chapter walkthroughs you're getting now. Same Triangle protocol. Same herbs.

What was different in the Sprint: I was on her data every week. Caught a missed dose on Day 12. Caught a hidden cortisol spike on Day 19 — afternoon coffee killing her sleep. Sent her into her doctor on Day 60 with a printed BP log and one-page protocol summary.

Her doctor lowered her metformin first. Her doctor lowered her amlodipine second. Wakita's writing her own bonus chapter for the Sprint cookbook this month — the woman who 90 days ago thought she'd be on pills for life is now teaching the women coming in behind her.

TRANSFORMATION: FROM MORNING-NUMBER TRACKER TO MEDICATION-CONVERSATION OWNER.

The Challenge taught you the Triangle protocol. Cohort 2 — the 90-day Sprint — gets you to the doctor conversation with the right data, the right framing, and a coach who's been in 200+ of these conversations.

Inside the Sprint: weekly 1:1 calls with me (30 min each), my eyes on your BP log every Monday morning, the full Doctor Conversation Script, the Med Wean Tracker, and the Skool VIP Sprint room — a smaller, tighter cohort than the Challenge.

Graduates from Cohort 1 are now ~70% off at least one medication with their doctor's blessing. DOCTOR-CLEARED INDEPENDENCE.

OFFER: $1,997 FOR THE 90-DAY SPRINT. APPLICATIONS OPEN TODAY.

Cohort 2 is application-only — capped at 5 seats. Doors open until Friday at midnight ET. After Friday, the next cohort doesn't open until Cohort 3 fills, at least 60 days out.

Full credit math, guarantee, and application questions on Day 26 of this Challenge. Today is just the reveal.

RESPONSE — IF THIS RESONATES:

Look at the Cohort 2 application page now. Don't apply yet — just read what it is.
→ ${COHORT2_URL}

Day 22 — I'll tell you exactly what Wakita's Monday looks like inside the Sprint.

Joel
RN, BraveWorks

P.S. If you're already past Day 90 of being on BP meds and you're frustrated that "everyone says I need to be patient" — read this email again. The Sprint exists because the 30-day window is too short for a real conversation about getting off the meds. You need the next 60 with a coach on your data.

→ COHORT 2 — THE 90-DAY SPRINT: ${COHORT2_URL}
Applications open until Friday at midnight ET. 5 seats.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 22 — Wakita's first 30 days inside the Sprint (BAB case study) ─
// Before-After-Bridge. Tangible Monday-in-the-life inside Cohort 2.
const day22 = {
  subject: 'Wakita\'s Monday — a peek inside 90-day work',
  subjectB: 'What Sprint clients do on Day 30',
  preview: 'The Monday call. The tracker. The doctor visit prep.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`On Day 18, I told you Wakita Taylor closed in 16 days. Today I want to walk you through what her Monday actually looks like inside the Sprint — so the 90-day Cohort 2 isn't an abstraction for you anymore.`)}
    ${p(`This is the BEFORE-AFTER-BRIDGE that most Challenge graduates need to see before the picture clicks.`, { margin: '0 0 28px' })}
    ${bigQuote('BEFORE: 90 days ago.')}
    ${p(`Wakita was 90 days into a personal stuck place. Morning BP averaging 152/95 on amlodipine and metformin. Type-2 diabetes diagnosed two years prior. Sleep fragmented — waking 3 AM, lying awake for an hour. Mid-section weight that hadn't moved in years. She'd done the Challenge once — gotten 6 mmHg off her morning average — but the numbers had crept back in the 30 days after Day 30 because she didn't know what to keep doing or who to ask.`)}
    ${p(`Her words on her intake call: <em>"I followed the protocol. The numbers moved. Then I lost the structure. I need someone watching."</em>`, { margin: '0 0 28px' })}
    ${bigQuote('AFTER: Day 30 of the Sprint.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Morning BP average: 132/82.</strong> Down 20/13 from intake. Sustained over the prior 14 days, which means it's now a real baseline, not a fluke.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Sleep:</strong> 7 hours uninterrupted, 6/7 nights. Last 3 AM wake-up was Day 12.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Fasting glucose:</strong> 138 → 109. Hers was Sugar Pressure dominant.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">Waist:</strong> -2.5 inches.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Doctor conversation:</strong> already booked for Day 65. With our script. With her log printed. With the protocol summary in her chart for her doctor to review before she walks in.</p>
    `)}
    ${bigQuote('BRIDGE: What her actual Monday looks like.')}
    ${p(`This is the part nobody describes in advance. So here it is, hour by hour.`, { margin: '0 0 28px' })}
    ${clayBlock('WAKITA\'S MONDAY INSIDE THE SPRINT', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">8 AM — Submit the week.</strong> She opens her Sprint tracker (a one-page Google Sheet I built) and enters 7 days of morning + evening BP readings, sleep hours, walk count, and any "off" days. Takes her 4 minutes.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">10 AM — I review.</strong> I open every Sprint client's tracker between 9 and 11 AM Monday. I look at three things: trend direction (still moving down?), variance (consistent or jumpy?), and outliers (what happened on the days that were off?). I leave one comment per client.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">10 PM — The Monday call (Sprint cohort joins the Challenge live call).</strong> 60 minutes, full cohort on Zoom. I walk through the patterns I saw across the cohort that week. Each client gets a 3-5 minute slot to ask the one question that's been bugging them about their week.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">3 PM — 30-minute 1:1 (rotating).</strong> Once every two weeks, every Sprint client gets a 30-minute solo call with me. We look at their tracker together. We adjust the protocol. We rehearse their next doctor conversation if it's coming up.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">8 PM — Skool VIP Sprint room.</strong> Wakita posts her "wins of the week" in a smaller, tighter cohort (5 women max). She reads what others are seeing. She gives advice to women on Day 12 because she's now on Day 47 and she knows the bumps.</p>
    `)}
    ${p(`That's the rhythm. <strong style="color:${PALETTE.text};">Every Monday for 90 days.</strong> By Day 60, the doctor visit happens. By Day 90, most Sprint clients are running their first dose-lowering conversation. By Day 120 (graduation), they're maintenance-only.`, { margin: '0 0 28px' })}
    ${bigQuote('Why I cap it at 5.')}
    ${p(`Five women is the most I can review every Monday morning with real attention. I tried thirty in the first cohort I ever ran (years ago, before the Triangle Method was branded). I missed things. Clients drifted. I cut it to five and the outcomes more than doubled.`)}
    ${p(`Cohort 2 has 5 seats only — small on purpose. The doors close Friday at midnight ET. I'll walk the credit math and the application questions on Day 26.`, { margin: '0 0 28px' })}
    ${clayBlock('IF YOU\'RE READING THIS AND THINKING "THAT\'S ME"', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The Challenge graduates who do best in the Sprint are women who feel they "lost momentum after the last protocol" or "need someone watching" or "want to walk into the doctor visit with real data." If any of those are you — open the application page and read the questions. Don't fill it out yet. Just see whether the questions resonate.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COHORT2_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Read the Cohort 2 application →</a></p>
    `)}
    ${ctaButton(COHORT2_URL, 'Read the Cohort 2 application →')}
    ${p(`Day 26 of your Challenge — the full credit math, the guarantee, and exactly how the application works.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`The single thing Wakita said on Day 20 that I keep telling Challenge graduates: "I needed the protocol AND the witness. Without the witness I drift." That's what the Monday call buys you. Someone watching your numbers with the same seriousness you watch them with.`)}
    ${upsellFooter({
      kicker: 'COHORT 2 — APPLICATIONS CLOSE FRIDAY',
      body: 'Read the application. See what kind of woman the Sprint is for. The doors close Friday at midnight ET and the next cohort is at least 60 days out.',
      ctaLabel: 'Read the Cohort 2 application',
      ctaUrl: COHORT2_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

On Day 18, I told you Wakita Taylor closed in 16 days. Today I want to walk you through what her Monday actually looks like inside the Sprint — so the 90-day Cohort 2 isn't an abstraction for you anymore.

BEFORE: 90 DAYS AGO.

Wakita was 90 days into a personal stuck place. Morning BP averaging 152/95 on amlodipine and metformin. Type-2 diabetes. Sleep fragmented — waking 3 AM, lying awake for an hour. Mid-section weight that hadn't moved in years. She'd done the Challenge once — gotten 6 mmHg off her morning average — but the numbers crept back in the 30 days after Day 30 because she didn't know what to keep doing or who to ask.

Her words on her intake call: "I followed the protocol. The numbers moved. Then I lost the structure. I need someone watching."

AFTER: DAY 30 OF THE SPRINT.

→ Morning BP average: 132/82. Down 20/13 from intake. Sustained over the prior 14 days.
→ Sleep: 7 hours uninterrupted, 6/7 nights. Last 3 AM wake-up was Day 12.
→ Fasting glucose: 138 → 109. Hers was Sugar Pressure dominant.
→ Waist: -2.5 inches.
→ Doctor conversation: already booked for Day 65. With our script. With her log printed. With the protocol summary in her chart for her doctor to review before she walks in.

BRIDGE: WHAT HER ACTUAL SUNDAY LOOKS LIKE.

This is the part nobody describes in advance. So here it is, hour by hour.

WAKITA'S MONDAY INSIDE THE SPRINT:

→ 8 AM — Submit the week. She opens her Sprint tracker (one-page Google Sheet) and enters 7 days of morning + evening BP readings, sleep hours, walk count, "off" days. 4 minutes.

→ 10 AM — I review. I open every Sprint client's tracker between 9 and 11 AM Monday. I look at trend direction, variance, and outliers. I leave one comment per client.

→ 10 PM — The Monday call (Sprint cohort joins the Challenge live call). 60 minutes, full cohort on Zoom. Patterns I saw that week. Each client gets a 3-5 minute slot to ask the one question that's been bugging them.

→ 3 PM — 30-minute 1:1 (rotating). Once every two weeks, every Sprint client gets a 30-minute solo call with me. We look at the tracker together. Adjust protocol. Rehearse the next doctor conversation if it's coming up.

→ 8 PM — Skool VIP Sprint room. Wakita posts "wins of the week" in a smaller, tighter cohort (5 women max). She reads what others are seeing. She gives advice to women on Day 12 because she's now on Day 47 and she knows the bumps.

That's the rhythm. EVERY SUNDAY FOR 90 DAYS. By Day 60, the doctor visit happens. By Day 90, most Sprint clients are running their first dose-lowering conversation. By Day 120 (graduation), maintenance-only.

WHY I CAP IT AT 12.

Five women is the most I can review every Monday morning with real attention. Tried thirty in the first cohort I ever ran. Missed things. Clients drifted. Cut to five and outcomes more than doubled.

Cohort 2 has 5 seats only — small on purpose. Doors close Friday at midnight ET. Credit math and application questions on Day 26.

IF YOU'RE READING THIS AND THINKING "THAT'S ME":

The Challenge graduates who do best in the Sprint are women who feel they "lost momentum after the last protocol" or "need someone watching" or "want to walk into the doctor visit with real data." If any are you — open the application page and read the questions. Don't fill it out yet. Just see whether the questions resonate.

→ Read the Cohort 2 application: ${COHORT2_URL}

Day 26 of your Challenge — the full credit math, guarantee, and exactly how the application works.

Joel
RN, BraveWorks

P.S. The single thing Wakita said on Day 20 that I keep telling Challenge graduates: "I needed the protocol AND the witness. Without the witness I drift." That's what the Monday call buys you. Someone watching your numbers with the same seriousness you watch them with.

→ COHORT 2 — APPLICATIONS CLOSE FRIDAY: ${COHORT2_URL}
Read the application. See what kind of woman the Sprint is for.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 26 — Cohort 2 mechanism + credit math (full pitch) ──────────
// Deep dive into the offer. Doors close Friday. Guarantee. FAQ.
const day26 = {
  subject: 'Cohort 2: what it is, what it\'s not',
  subjectB: 'Application doors open until Friday',
  preview: 'The full mechanism. The credit math. The guarantee.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Day 26 of your Challenge. Four days until you graduate. Today I'm going to walk you through the full mechanism of Cohort 2 — what's in it, what's not in it, what it costs, what the guarantee is, and how the credit math works for Challenge graduates.`)}
    ${p(`If you've been waiting for the full picture before deciding whether to apply, this is the email.`, { margin: '0 0 28px' })}
    ${bigQuote('WHAT COHORT 2 IS.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">A 90-day, 5-woman Sprint.</strong> Application-only. Starts the Monday after enrollment closes. Ends 90 days later with a maintenance-phase graduation.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">A weekly Monday call</strong> with me at 10 PM ET, 60 minutes, full cohort. Recordings if you miss live.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">Bi-weekly 30-minute 1:1 calls</strong> with me — six of them over the 90 days. Your time, your numbers, your protocol.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">Weekly tracker review.</strong> Every Monday morning I open every client's tracker between 9 and 11 AM ET. One comment per client. I see trends the client can't see.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">The Doctor Conversation Script + Med Wean Tracker.</strong> The two assets that turn 90 days of clean numbers into an actual taper conversation with your prescriber.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">A smaller, tighter Skool VIP room.</strong> 5 women only. Different feel than the Challenge cohort. Higher-touch.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Barbara O'Neill virtual event ticket</strong> — June 24-25 — included for every Cohort 2 enrollment.</p>
    `)}
    ${bigQuote('WHAT IT IS NOT.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">Not a re-run of the Challenge.</strong> You've already done the chapter walkthroughs. The Sprint is the implementation phase — applying the Triangle to your specific case, week by week, with my eyes on the data.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">Not a medical service.</strong> I'm a Registered Nurse and naturopathic practitioner. I do not prescribe, diagnose, or treat. Your prescribing doctor remains your prescribing doctor. The Sprint coaches the lifestyle and protocol side — they coach the medication side.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">Not a guarantee that you'll be off your meds in 90 days.</strong> Your doctor decides medication changes. Most Sprint Cohort 1 graduates are down at least one dose. Some are off one medication entirely. A few are still on the same regimen but with sustained 20+ mmHg reductions — and an open conversation with their doctor about tapering at the 6-month mark.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Not for everyone.</strong> If you don't have 30 minutes a day for the protocol, the Sprint is the wrong fit. If you can't make Monday calls (or watch recordings within 48 hours), the Sprint is the wrong fit. Better to know now.</p>
    `)}
    ${bigQuote('THE CREDIT MATH.')}
    ${p(`The full Sprint is <strong style="color:${PALETTE.text};">$1,997</strong>. For Challenge graduates applying before Friday at midnight ET, the math runs like this:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">$1,997</strong> — base Sprint price</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">−$97</strong> — Challenge enrollment credited toward the Sprint</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">= $1,900 net</strong> — your Challenge purchase comes back as credit</p>
    `)}
    ${p(`That credit is only available to current Challenge cohort members applying before Friday. After Friday it resets to standard pricing.`, { margin: '0 0 28px' })}
    ${bigQuote('THE GUARANTEE.')}
    ${p(`Inside the first 14 days of the Sprint, if you've shown up to both Monday calls, completed both Monday trackers, and you don't see a clear path to your medication conversation — write me a paragraph telling me what's missing and I'll refund the Sprint in full. Not a fight. Not 27 forms. One paragraph.`)}
    ${p(`That's the deal because I know what the Sprint produces in the women who show up for it — and the women who show up for it the first two Mondays virtually always finish the 90 days.`, { margin: '0 0 28px' })}
    ${clayBlock('THE THREE COMMON QUESTIONS', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">"Can I do it if I work full-time?"</strong> Yes. Most Cohort 1 women worked full-time. The Monday call is the only fixed live commitment — the rest is async tracker entry (4 min/day) and bi-weekly 1:1 calls you book on your own schedule.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">"What if my doctor won't budge on the taper?"</strong> The Sprint includes the Script for navigating that exact conversation, including a second-opinion-pathway script for when your current prescriber won't engage with data. A few Sprint graduates have switched physicians as part of this; most haven't needed to.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">"Can I pay in installments?"</strong> Yes. The application has a payment-plan option. Three or four monthly payments. Same total. No interest.</p>
    `)}
    ${clayBlock('APPLY BY FRIDAY MIDNIGHT ET', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">The application is 8 questions. Most women finish it in 15 minutes. I read every one personally. If you're a fit, I approve you and you'll get the enrollment link by Saturday. If you're not — for any reason — I'll tell you the better path.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COHORT2_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Apply for Cohort 2 →</a></p>
    `)}
    ${ctaButton(COHORT2_URL, 'Apply for Cohort 2 — closes Friday →')}
    ${p(`Day 30 — your graduation email. The Cohort 2 final call. And what happens next regardless of which door you walk through.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`The biggest single regret I hear from Cohort 1 graduates is "I waited a month after my Challenge to apply, and my numbers slipped." If you know the deeper room is yours, apply this week. Momentum matters more than perfect readiness.`)}
    ${upsellFooter({
      kicker: 'COHORT 2 — APPLICATIONS CLOSE FRIDAY MIDNIGHT ET',
      body: 'Apply now to lock in your $97 Challenge credit on the $1,997 Sprint. 8 questions, 15 minutes, 5 seats total.',
      ctaLabel: 'Apply for Cohort 2',
      ctaUrl: COHORT2_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Day 26 of your Challenge. Four days until you graduate. Today I'm going to walk you through the full mechanism of Cohort 2 — what's in it, what's not in it, what it costs, what the guarantee is, and how the credit math works for Challenge graduates.

If you've been waiting for the full picture before deciding whether to apply, this is the email.

WHAT COHORT 2 IS:

→ A 90-day, 5-woman Sprint. Application-only. Starts the Monday after enrollment closes.
→ A weekly Monday call with me at 10 PM ET, 60 minutes, full cohort. Recordings if you miss live.
→ Bi-weekly 30-minute 1:1 calls with me — six over 90 days.
→ Weekly tracker review. Every Monday morning I open every client's tracker between 9 and 11 AM ET. One comment per client.
→ The Doctor Conversation Script + Med Wean Tracker.
→ A smaller, tighter Skool VIP room. 5 women only.
→ Barbara O'Neill virtual event ticket — June 24-25 — included for every Cohort 2 enrollment.

WHAT IT IS NOT:

→ Not a re-run of the Challenge. The Sprint is the implementation phase — applying the Triangle to YOUR case, week by week, with my eyes on the data.
→ Not a medical service. I'm an RN and naturopathic practitioner. I do not prescribe, diagnose, or treat. Your prescribing doctor remains your prescribing doctor.
→ Not a guarantee that you'll be off your meds in 90 days. Your doctor decides medication changes. Most Cohort 1 graduates are down at least one dose. Some are off one medication entirely.
→ Not for everyone. If you can't make Monday calls (or recordings within 48 hours), the Sprint is the wrong fit.

THE CREDIT MATH.

The full Sprint is $1,997. For Challenge graduates applying before Friday at midnight ET:

→ $1,997 base Sprint price
→ −$97 Challenge enrollment credited
→ = $1,900 net — your Challenge purchase comes back as credit

That credit is only available to current Challenge cohort members applying before Friday. After Friday it resets to standard pricing.

THE GUARANTEE.

Inside the first 14 days of the Sprint, if you've shown up to both Monday calls, completed both Monday trackers, and you don't see a clear path to your medication conversation — write me a paragraph telling me what's missing and I'll refund the Sprint in full. Not a fight. Not 27 forms. One paragraph.

THE THREE COMMON QUESTIONS:

→ "Can I do it if I work full-time?" Yes. Most Cohort 1 women worked full-time. The Monday call is the only fixed live commitment.

→ "What if my doctor won't budge on the taper?" The Sprint includes the Script for that exact conversation, including a second-opinion-pathway script. A few graduates have switched physicians; most haven't needed to.

→ "Can I pay in installments?" Yes. The application has a payment-plan option. Three or four monthly payments. Same total. No interest.

APPLY BY FRIDAY MIDNIGHT ET.

The application is 8 questions. Most women finish in 15 minutes. I read every one personally.
→ ${COHORT2_URL}

Day 30 — your graduation email. The Cohort 2 final call. And what happens next regardless of which door you walk through.

Joel
RN, BraveWorks

P.S. The biggest single regret I hear from Cohort 1 graduates is "I waited a month after my Challenge to apply, and my numbers slipped." If you know the deeper room is yours, apply this week. Momentum matters more than perfect readiness.

→ COHORT 2 — APPLICATIONS CLOSE FRIDAY MIDNIGHT ET: ${COHORT2_URL}
Lock in your $97 Challenge credit on the $1,997 Sprint.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── DAY 30 — Graduation + Cohort 2 last-call + transition ─────────
// Final Challenge email. Celebrate. Last Cohort 2 nudge.
// Signal newsletter transition. Always-on graduate flow.
const day30 = {
  subject: 'Day 30 — you made it',
  subjectB: 'Your Cohort 2 invitation (closes tonight)',
  preview: 'Graduation. Last call for the Sprint. What\'s next either way.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Day 30. You made it. <strong style="color:${PALETTE.text};">Welcome to the graduate side of the BP Triangle Challenge.</strong>`)}
    ${p(`Take a second with that. Thirty days ago you were a name on a Stripe receipt and a baseline reading on a piece of paper. Today you're a woman who has walked her own Triangle for a full month, taken the readings, layered the protocols, sat with the bonus content, and shown up. <strong style="color:${PALETTE.text};">That's the work. The number on the cuff is the receipt.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('What I want you to do today.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. Take your Day 30 reading.</strong> Morning, sitting, two minutes of quiet, same arm as your baseline. Write it down next to your Day 0 number. Look at the difference. Sit with it for sixty seconds.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">2. Post your graduation in Skool.</strong> One line, your Day 0 baseline, your Day 30 average, and one symptom that changed most. The women still doing the Challenge need to see what's possible.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Print your log.</strong> Even if you don't have a doctor visit booked yet. Print the 30 days of readings. Put it in a folder. The next time you sit in front of your prescriber, you'll have it.</p>
    `)}
    ${bigQuote('What\'s next — either door.')}
    ${p(`Two paths open up at Day 30, and I want both of them to be clear before tonight.`, { margin: '0 0 28px' })}
    ${clayBlock('DOOR 1 — COHORT 2 (THE SPRINT) — CLOSES TONIGHT', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">The 90-day Sprint application closes tonight at midnight ET. If the Challenge has been the right work but you want me on your numbers for the next 90 days — weekly Monday call, bi-weekly 1:1, the doctor conversation prep — this is the door. Your $97 Challenge enrollment credits toward the $1,997 Sprint. $1,900 net.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COHORT2_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Apply for Cohort 2 (closes tonight) →</a></p>
    `)}
    ${clayBlock('DOOR 2 — THE NEWSLETTER + SKOOL', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">If Cohort 2 isn't the right fit right now, that's a real answer. The Challenge graduates list keeps you in the Skool community and rolls you into the weekly newsletter — one email every Tuesday with new teaching, herb updates, RCT walkthroughs, and the most useful Skool conversations from the prior week. You'll hear about Cohort 3 when it opens (60+ days out).</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">No action needed — you're already on it. Just keep showing up Tuesdays.</p>
    `)}
    ${bigQuote('Your graduation gift.')}
    ${clayBlock('THE COOK FOR LIFE COOKBOOK — UNLOCKED TODAY', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">Forty-five plant-rich meals built around the foods that quiet all three Pressures. Joel's grandmother's bean soup is page 22. The Anti-BP Plate template you've been printing all month gets its own chapter with 15 dinner-ready variations. The hibiscus-cinnamon iced tea recipe lives at page 38.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">I held this one for the end on purpose. The first 29 days were about understanding the Triangle. The cookbook is the rhythm tool you'll carry forward — the thing that keeps the protocol running long after the daily emails stop.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${BONUS_COOKBOOK_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Download Cook For Life Cookbook (your graduation gift) →</a></p>
    `)}
    ${ctaButton(BONUS_COOKBOOK_URL, 'Download your Cook For Life Cookbook →')}
    ${bigQuote('Either way, you have the protocol now.')}
    ${p(`That's what I want you to walk away with most. The Triangle protocol — Stress Pressure herbs, Sugar Pressure plate, Pipe Pressure stack — is yours forever. The 30 days bought you the chapters, the bonus kits, the live Mondays, the Skool VIP room, the cookbook. <strong style="color:${PALETTE.text};">That doesn't get taken back at graduation.</strong> You own the tools.`)}
    ${p(`Whether you walk into Cohort 2 tonight or come back in three months — the Triangle stays with you. The herbs stay with you. The "AND not INSTEAD OF" frame stays with you. Pills manage output. Protocol fixes input. That sentence is yours now.`, { margin: '0 0 28px' })}
    ${p(`If this Challenge has helped — even a little — there's one thing I'd ask. Forward this email to one woman in your life who's on a BP med and doesn't know there's an "AND" path. That's the most useful single thing you can do with what you learned over the last 30 days.`, { margin: '0 0 28px' })}
    ${p(`Thank you for trusting me with these thirty days. The Triangle works because women like you do the work. I'm glad you're on the graduate side.`, { margin: '0 0 28px' })}
    ${ctaButton(COHORT2_URL, 'Last call: apply for Cohort 2 (tonight) →')}
    ${joelSignoff()}
    ${psBox(`If you do nothing else this Tuesday — open the newsletter. The first issue lands next Tuesday, and the lead story is the Day 30 results from this exact cohort, anonymized. You'll see what the data looked like across the room. You're not alone in this work.`)}
    ${upsellFooter({
      kicker: 'COHORT 2 — APPLICATIONS CLOSE TONIGHT AT MIDNIGHT ET',
      body: 'This is the last call before the doors close. The next Sprint opens at least 60 days from now, at standard $1,997 pricing (no Challenge credit). If you know the deeper room is yours, apply tonight.',
      ctaLabel: 'Apply for Cohort 2',
      ctaUrl: COHORT2_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Day 30. You made it. WELCOME TO THE GRADUATE SIDE OF THE BP TRIANGLE CHALLENGE.

Take a second with that. Thirty days ago you were a name on a Stripe receipt and a baseline reading on a piece of paper. Today you're a woman who has walked her own Triangle for a full month, taken the readings, layered the protocols, sat with the bonus content, and shown up. THAT'S THE WORK. THE NUMBER ON THE CUFF IS THE RECEIPT.

WHAT I WANT YOU TO DO TODAY:

1. Take your Day 30 reading. Morning, sitting, two minutes of quiet, same arm as your baseline. Write it down next to your Day 0 number. Look at the difference. Sit with it for sixty seconds.

2. Post your graduation in Skool. One line, your Day 0 baseline, your Day 30 average, and one symptom that changed most. The women still doing the Challenge need to see what's possible.

3. Print your log. Even if you don't have a doctor visit booked yet. Print the 30 days of readings. Put it in a folder. The next time you sit in front of your prescriber, you'll have it.

WHAT'S NEXT — EITHER DOOR.

Two paths open up at Day 30.

DOOR 1 — COHORT 2 (THE SPRINT) — CLOSES TONIGHT.

The 90-day Sprint application closes tonight at midnight ET. If the Challenge has been the right work but you want me on your numbers for the next 90 days — weekly Monday call, bi-weekly 1:1, doctor conversation prep — this is the door. Your $97 Challenge enrollment credits toward the $1,997 Sprint. $1,900 net.
→ ${COHORT2_URL}

DOOR 2 — THE NEWSLETTER + SKOOL.

If Cohort 2 isn't the right fit right now, that's a real answer. You stay in Skool and roll into the weekly newsletter — one email every Tuesday with new teaching, herb updates, RCT walkthroughs, and the most useful Skool conversations from the prior week. You'll hear about Cohort 3 when it opens (60+ days out).

No action needed — you're already on it. Just keep showing up Tuesdays.

YOUR GRADUATION GIFT.

THE COOK FOR LIFE COOKBOOK — UNLOCKED TODAY.

Forty-five plant-rich meals built around the foods that quiet all three Pressures. Joel's grandmother's bean soup is page 22. The Anti-BP Plate template gets its own chapter with 15 dinner-ready variations. The hibiscus-cinnamon iced tea recipe lives at page 38.

I held this one for the end on purpose. The first 29 days were about understanding the Triangle. The cookbook is the rhythm tool you'll carry forward — the thing that keeps the protocol running long after the daily emails stop.

→ Download Cook For Life Cookbook (your graduation gift): ${BONUS_COOKBOOK_URL}

EITHER WAY, YOU HAVE THE PROTOCOL NOW.

The Triangle protocol — Stress Pressure herbs, Sugar Pressure plate, Pipe Pressure stack — is yours forever. The 30 days bought you the chapters, the bonus kits, the live Mondays, the Skool VIP room, the cookbook. THAT DOESN'T GET TAKEN BACK AT GRADUATION. You own the tools.

Whether you walk into Cohort 2 tonight or come back in three months — the Triangle stays with you. The herbs stay with you. The "AND not INSTEAD OF" frame stays with you. Pills manage output. Protocol fixes input. That sentence is yours now.

If this Challenge has helped — even a little — there's one thing I'd ask. Forward this email to one woman in your life who's on a BP med and doesn't know there's an "AND" path. That's the most useful single thing you can do with what you learned over the last 30 days.

Thank you for trusting me with these thirty days. The Triangle works because women like you do the work. I'm glad you're on the graduate side.

LAST CALL: APPLY FOR COHORT 2 (TONIGHT):
→ ${COHORT2_URL}

Joel
RN, BraveWorks

P.S. If you do nothing else this Tuesday — open the newsletter. The first issue lands next Tuesday, and the lead story is the Day 30 results from this exact cohort, anonymized. You'll see what the data looked like across the room. You're not alone in this work.

→ COHORT 2 — APPLICATIONS CLOSE TONIGHT AT MIDNIGHT ET: ${COHORT2_URL}
Next Sprint at least 60 days out at standard $1,997 (no Challenge credit).

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl || ''}
`,
};

// ─── EXPORT MAP ────────────────────────────────────────────────────
// Day-since-tier-2-entered → email object
export const TIER_2_DAYS = {
  0: day0,
  3: day3,
  6: day6,
  9: day9,
  12: day12,
  15: day15,
  18: day18,
  22: day22,
  26: day26,
  30: day30,
};

// Idempotency flag — the cron uses this name on the subscriber record to mark sent.
export function tier2SentFlag(day) {
  return `tier2Day${day}Sent`;
}
