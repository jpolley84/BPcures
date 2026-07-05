// _tier-1-emails.js — TIER-1 sequence content + render helpers.
//
// Audience: bought $27 BP Starter or $47 BP Reset Kit. State = `tier-1`.
//
// Goal: ascend $27/$47 buyers to the $27/month Weekly Reset (Days 0-7),
// then the $297 case review (Days 10-21). (2026-07-03: the retired "$297
// Sprint" pitches were repointed to the live case review at /case-review.)
// Failure path: graduate to newsletter at Day 21.
//
// Trigger: `daysSinceTier1EnteredAt` (NOT calendar days, NOT signup days).
// Day map: 0, 2, 4, 7, 10, 13, 15, 17, 19, 21.
//
// HARD RULES (panel realignment, 2026-06-09):
//   - Never re-pitch $27/$47. Never pitch the quiz to a buyer.
//   - Days 0-7 footers point at SKOOL_URL (Weekly Reset, $27/mo, 7 days free)
//   - Days 10-21 footers point at CASE_REVIEW_URL ($297 case review: Joel
//     reads your numbers and writes your next moves; 5 a month;
//     satisfaction guarantee on the work only, never on health outcomes)
//   - Patricia is the Day 13 case study: product-agnostic "personal look"
//     framing, compliance rider required next to her outcome
//   - Janice is receipt-only. Wakita is reserved for tier-3 / tier-4.
//   - No med claims without doctor wrap + "Results not typical" rider
//   - No em dashes in rendered copy (subjects, previews, bodies)
//   - Honest scarcity only: the 5-case-reviews-a-month cap is real
//     (confirmed by Joel 2026-06-09); never invent numbers, no countdowns
//   - textBody mirrors htmlBody for every day
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }.
//
// Author: Joel Polley, RN, BraveWorks Health.

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── URLs ─────────────────────────────────────────────────────────────
// Active product Stripe links.
// Tier-1 pitches: SKOOL_URL (Days 0-7) and CASE_REVIEW_URL (Days 10-21).
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
// $297 case review ("Joel's Eyes On Your Case") — the LIVE $297 offer.
// 2026-07-03: replaced the retired "$297 Sprint" ($270/$280 credit-math)
// pitches. All Days 10-21 CTAs go to the site page, which carries the live
// payment link. Capped at 5 a month (real, confirmed by Joel 2026-06-09).
export const CASE_REVIEW_URL = `${SITE_URL}/case-review`;
// DEPRECATED (2026-07-03): retired $297 Sprint payment link. Kept only so
// nothing that imports this name breaks. Do not use in copy.
export const SPRINT_URL = process.env.VITE_STRIPE_SPRINT_297_LINK || 'https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P';
// $97 evergreen Weekly Reset "shadow seat" — the lighter step for kit
// buyers who were pitched the $297 case review (Days 10-21) and declined. Moved
// here from tier-3 on 2026-06-23: a $97 downsell only makes sense AFTER the
// $297 pitch is declined, and the $27/$47 kit buyer is that audience (the
// $297 buyer already bought up). Buyable any day; page lives at /challenge.
export const SHADOW_SEAT_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
// /challenge page retired 2026-07-04 (stale pre-launch scarcity copy);
// the seat sells by direct checkout link only.
export const SHADOW_SEAT_PAGE = SHADOW_SEAT_URL;
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

function ppsBox(text) {
  return `<div style="padding-top:14px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.P.S.</strong> ${text}
    </p>
  </div>`;
}

// ─── Offer footers (2026-06-09 realignment; 2026-07-03 case review) ────
// Days 0-7: the $27/month Weekly Reset. Days 10-21: the $297 case review
// with a one-line Weekly Reset secondary. The old boxed YouTube CTA is gone
// in tier-1 (a free exit ramp must not visually outrank the paid CTA in a
// buyer ascension sequence); a plain one-liner replaces it.

const WEEKLY_RESET_FOOTER_BODY = 'Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free.';

const CASE_REVIEW_FOOTER_BODY = 'You send me your cuff log, your med list, and your story. I read every line myself and write your next moves, in plain language, with a reason next to each one. I take 5 case reviews a month. $297, with a simple guarantee: if you feel the work was not worth it, tell me and I refund it.';

function weeklyResetFooter({ kicker, body } = {}) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker || 'The Weekly Reset'}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body || WEEKLY_RESET_FOOTER_BODY}</p>
    <a href="${SKOOL_URL}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">Start your free week →</a>
  </div>`;
}

function weeklyResetFooterText({ kicker, body } = {}) {
  return `${(kicker || 'The Weekly Reset').toUpperCase()}
${body || WEEKLY_RESET_FOOTER_BODY}
Start your free week: ${SKOOL_URL}`;
}

function sprintFooter({ kicker, body } = {}) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker || 'The $297 Case Review'}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body || CASE_REVIEW_FOOTER_BODY}</p>
    <a href="${CASE_REVIEW_URL}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">See if a case review is right for you →</a>
    <p style="font-size:12.5px;line-height:1.55;color:${PALETTE.textSoft};margin:14px 0 0;">Not your season? The Weekly Reset is $27 a month, first 7 days free: <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};">skool.com/braveworksrn/about</a></p>
  </div>`;
}

function sprintFooterText({ kicker, body } = {}) {
  return `${(kicker || 'The $297 Case Review').toUpperCase()}
${body || CASE_REVIEW_FOOTER_BODY}
See if a case review is right for you: ${CASE_REVIEW_URL}
Not your season? The Weekly Reset is $27 a month, first 7 days free: ${SKOOL_URL}`;
}

function youtubeLine() {
  return `<p style="font-size:12.5px;line-height:1.6;color:#999;margin:18px 0 0;text-align:center;">Between emails, I teach free on YouTube: <a href="${YOUTUBE_URL}" style="color:#999;">youtube.com/@braveworksrn</a></p>`;
}

function youtubeLineText() {
  return `Between emails, I teach free on YouTube: ${YOUTUBE_URL}`;
}

// ─── DAY 0 — Receipt-acknowledged: the first 24 hours ─────────────────
// The instant receipt (purchase-confirmation.js, another owner) lands the
// same day and carries downloads + the Weekly Reset hero pitch. This email
// names that receipt and claims ONE job: the first 24 hours with the cuff.
const day0 = {
  subject: 'Day 1 starts tomorrow morning',
  subjectB: 'Tonight: 5 minutes. Tomorrow: your first true number.',
  preview: 'Three things to do tonight. Five minutes total.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Earlier today I sent your download links and a note about the Weekly Reset. Keep that one. This one is different. This one is the plan for your first 24 hours.`)}
    ${p(`Most people open a PDF, skim two pages, save it to a folder, and never come back. That's not going to be you.`)}
    ${p(`Here's the plan for the next 24 hours.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Tonight (5 minutes):</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">1. Open the kit PDF. Read page 1 and page 2. That's it, just those two pages.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">2. Find your home BP cuff. Put it on the kitchen counter or your nightstand. Somewhere you'll see it tomorrow morning before coffee.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">3. Grab a piece of paper or a Notes app. Title it "BP, Week 1." You'll log here.</p>
    `)}
    ${p(`Tomorrow morning, before food, before coffee, after you've used the bathroom: <strong>sit quietly for five minutes, then take three readings, one minute apart.</strong> Write down all three. Circle the lowest of the three. That's your true morning number.`)}
    ${p(`Do that every morning this week. Same time, same chair, same arm.`)}
    ${p(`That's the entire ask for Day 1. Not a diet change. Not a supplement. Not a workout. Just a number, written down.`)}
    ${p(`Why so simple? Because most people who buy a BP kit never measure their starting point. They start "the protocol" but they don't have a baseline. Then three weeks later they don't know if anything moved.`)}
    ${p(`You're going to have a baseline. By Friday, you'll have five readings you can trust.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'A small promise',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">I'm going to email you nine more times over the next three weeks. Short emails. One idea each. The goal isn't to overwhelm you. It's to help you actually <em>finish</em> the kit instead of letting it gather digital dust.</p>`
    )}
    ${p(`See you in the morning.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you can't find your download email, check your spam folder. The subject line is "Joel here. Your BP Reset Kit is inside (download links below)". Hit reply if it's still missing and I'll resend within the day.`)}
    ${ppsBox(`The Weekly Reset invite from your earlier email is still open. Four live sessions a month with me, Wednesdays at 7 pm ET, first 7 days free. Bring tomorrow's first reading: <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};">skool.com/braveworksrn/about</a>`)}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Earlier today I sent your download links and a note about the Weekly Reset. Keep that one. This one is different. This one is the plan for your first 24 hours.

Most people open a PDF, skim two pages, save it to a folder, and never come back. That's not going to be you.

TONIGHT (5 minutes):
1. Open the kit PDF. Read page 1 and page 2. That's it, just those two pages.
2. Find your home BP cuff. Put it somewhere you'll see it tomorrow before coffee.
3. Grab a piece of paper or a Notes app. Title it "BP, Week 1."

Tomorrow morning, before food, before coffee, after you've used the bathroom: sit quietly for five minutes, then take three readings, one minute apart. Write down all three. Circle the lowest. That's your true morning number.

Do that every morning this week. Same time, same chair, same arm.

That's the entire ask for Day 1. Just a number, written down.

A small promise: I'm going to email you nine more times over the next three weeks. Short emails. One idea each.

See you in the morning.

Joel
RN, BraveWorks

P.S. If you can't find your download email, check your spam folder. The subject line is "Joel here. Your BP Reset Kit is inside (download links below)". Hit reply if it's still missing and I'll resend within the day.

P.P.S. The Weekly Reset invite from your earlier email is still open. Four live sessions a month with me, Wednesdays at 7 pm ET, first 7 days free. Bring tomorrow's first reading: ${SKOOL_URL}

${youtubeLineText()}
`,
};

// ─── DAY 2 — First-win nudge ──────────────────────────────────────────
const day2 = {
  subject: 'Did you take your first reading?',
  subjectB: 'Your Day 2 number matters more than Day 1',
  preview: 'Two mornings in. The math starts now.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick check. Did you take a reading yesterday morning?`)}
    ${p(`If yes, good. Write today's underneath it. That's the second data point. Two points make a line, and a line is the first thing your doctor will want to see.`)}
    ${p(`If no, no shame. Take one this morning. Take another tomorrow. Start the line today.`)}
    ${p(`Here's something most people don't know about home BP readings:`, { margin: '0 0 28px' })}
    ${bigQuote('The first morning reading is the loudest lie of the week.')}
    ${p(`Why? You slept differently because you knew you were going to measure. You woke up thinking about it. You may have rushed to the cuff. Your heart rate was already elevated before the cuff inflated.`)}
    ${p(`The Day 1 number is almost always 4-8 points higher than your real baseline. That's not a failure of the cuff. That's the body responding to attention.`)}
    ${p(`<strong>Day 2 is closer to the truth. Day 3 is the truth.</strong>`)}
    ${p(`So if your Day 1 number scared you, breathe. It probably wasn't real. And if your Day 1 number looked great, also breathe. It also probably wasn't real.`)}
    ${p(`The data starts now.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Take your reading the same way you did yesterday, same chair, same arm, same time, three readings one minute apart. Circle the lowest.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Then write one sentence under it: <em>"Yesterday I ate ___, slept ___ hours, felt ___."</em> Just one sentence. That's your context.</p>
    `)}
    ${p(`Tomorrow you have a quiet day. I'm not asking for anything. Just keep logging.`)}
    ${p(`Day 4 is where the lesson lives. I'll see you there.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've already had a number swing you didn't expect, high or low, hit reply with the two numbers. I read them. I won't reply with a protocol over email, but I'll tell you if it's a noise-pattern or a signal-pattern.`)}
    ${weeklyResetFooter({
      body: `Two readings is a line. A line is worth showing someone. The live sessions inside the Weekly Reset are where readers bring their first numbers and I look at them with you. Four live sessions a month, Wednesdays at 7 pm ET. $27 a month, first 7 days free.`,
    })}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Quick check. Did you take a reading yesterday morning?

If yes, good. Write today's underneath it. Two points make a line.

If no, no shame. Take one this morning. Take another tomorrow. Start the line today.

The first morning reading is the loudest lie of the week.

You slept differently because you knew you were going to measure. The Day 1 number is almost always 4-8 points higher than your real baseline. That's not the cuff failing. That's the body responding to attention.

Day 2 is closer to the truth. Day 3 is the truth.

TODAY'S ASK:
Take your reading the same way as yesterday. Circle the lowest of three. Then write one sentence underneath: "Yesterday I ate ___, slept ___ hours, felt ___."

Day 4 is where the lesson lives. I'll see you there.

Joel
RN, BraveWorks

P.S. If you've already had a number swing you didn't expect, high or low, hit reply with the two numbers. I'll tell you if it's noise or signal.

${weeklyResetFooterText({
  body: `Two readings is a line. A line is worth showing someone. The live sessions inside the Weekly Reset are where readers bring their first numbers and I look at them with you. Four live sessions a month, Wednesdays at 7 pm ET. $27 a month, first 7 days free.`,
})}

${youtubeLineText()}
`,
};

// ─── DAY 4 — Plateau warning + first in-body Weekly Reset pitch ───────
const day4 = {
  subject: 'Day 4 is the day most quietly quit',
  subjectB: 'Most readers stall here. Don\'t.',
  preview: 'Not because the protocol failed. Because nothing moved yet.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to talk about today specifically, because today is the day the math is the cruelest.`)}
    ${p(`Day 1: high excitement. New PDF. New cuff. New numbers.`)}
    ${p(`Day 2: still motivated. The logging feels meaningful.`)}
    ${p(`Day 3: numbers haven't changed. You expected them to. They didn't.`)}
    ${p(`<strong>Day 4: quiet decision.</strong> The kit goes back in the downloads folder. The cuff stays on the counter for another week. Then it gets put in a drawer.`)}
    ${p(`I've watched this pattern for ten years. It's not a moral failing. It's a math problem.`, { margin: '0 0 28px' })}
    ${bigQuote('Blood pressure doesn\'t move on a daily curve. It moves on a weekly curve.')}
    ${p(`The reason: Stress, Sugar, and Sodium, the three corners driving your top number, operate on different clocks.`)}
    ${p(`<strong>Stress</strong> (cortisol) responds in 5-7 days. You can feel a difference in sleep before you see it in the cuff.`)}
    ${p(`<strong>Sugar</strong> (insulin) responds in 10-14 days. Faster if you're already lean, slower if you've been insulin-resistant a while.`)}
    ${p(`<strong>Sodium</strong> (the held water) responds in 14-21 days. Your kidneys retrain how much fluid they hold and the vessel walls let go of the strain slowly. It is the slowest corner of the Triangle.`)}
    ${p(`So when you read your cuff on Day 4 and see the same number as Day 1, you're not seeing a failed protocol. You're seeing a body that hasn't reached the response window yet.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'What I want from you today',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Don't quit. Don't add anything. Don't change anything. Just keep logging. The numbers will move on a curve, not a switch, and the curve doesn't start until Day 7.</p>`
    )}
    ${p(`I had a reader last cycle, Paul, 48, who emailed me on Day 4. "Joel, nothing's moving. Did I do it wrong?" I told him exactly what I'm telling you. He kept going. Day 11 his sleep changed. Day 14 his morning number dropped 9 points. He still emails me sometimes, two years later.`)}
    ${p(`Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results.`)}
    ${p(`The work you started this week shows up on the cuff later, not today. That's how the curve works.`, { margin: '0 0 28px' })}
    ${p(`I'll see you on Day 7, when I unpack what the three pressures actually are, and which one of them your kit is most likely targeting.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you're tempted to quit today, that's not a sign you bought the wrong thing. It's a sign the curve hasn't hit yet. Stay in.`)}
    ${clayBlock(
      'Don\'t do Day 4 alone',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Day 4 is the quitting day, and people always quit alone. So don't be alone. Every month I run four live group sessions inside The Weekly Reset, Wednesdays at 7 pm ET. Bring your log, your med list, the question you almost quit over, and I will tell you out loud if what you're seeing is noise or signal. It's $27 a month, and your first 7 days are free, which means this week's session costs you nothing.</p>`
    )}
    ${ctaButton(SKOOL_URL, 'Start your free week')}
    ${weeklyResetFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I want to talk about today specifically, because today is the day the math is the cruelest.

Day 1: high excitement.
Day 2: still motivated.
Day 3: numbers haven't moved.
Day 4: quiet decision. Kit goes in a drawer.

I've watched this pattern for ten years. It's not a moral failing. It's a math problem.

Blood pressure doesn't move on a daily curve. It moves on a weekly curve.

The three corners driving your top number operate on different clocks:
- Stress (cortisol): 5-7 days
- Sugar (insulin): 10-14 days
- Sodium (the held water): 14-21 days

When you read your cuff on Day 4 and see the same number, you're not seeing a failed protocol. You're seeing a body that hasn't reached the response window yet.

WHAT I WANT FROM YOU TODAY:
Don't quit. Don't add anything. Just keep logging. The curve doesn't start until Day 7.

Paul, 48, emailed me Day 4. "Did I do it wrong?" I told him what I'm telling you. He kept going. Day 14 his morning number dropped 9 points.

Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results.

The work you started this week shows up on the cuff later, not today. That's how the curve works.

I'll see you on Day 7 when I unpack the three pressures.

Joel
RN, BraveWorks

P.S. If you're tempted to quit today, that's not a sign you bought the wrong thing. The curve hasn't hit yet. Stay in.

DON'T DO DAY 4 ALONE
Day 4 is the quitting day, and people always quit alone. So don't be alone. Every month I run four live group sessions inside The Weekly Reset, Wednesdays at 7 pm ET. Bring your log, your med list, the question you almost quit over, and I will tell you out loud if what you're seeing is noise or signal. It's $27 a month, and your first 7 days are free, which means this week's session costs you nothing.
Start your free week: ${SKOOL_URL}

${weeklyResetFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 7 — Triangle (Stress / Sugar / Sodium) deep-teach ─────────────
const day7 = {
  subject: 'The corner your kit didn\'t fully address',
  subjectB: 'What the $27 starter can\'t do alone',
  preview: 'The kit is the map. Your body is the territory.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`One week in. Let me give you the framework behind everything I do on blood pressure, from twenty years in the ICU to the readers I work with now.`)}
    ${p(`I call it the <strong>BP Triangle Method™</strong>, and it's not complicated. It just says one thing:`, { margin: '0 0 28px' })}
    ${bigQuote('Your blood pressure isn\'t one problem. It\'s three corners stacking on top of each other.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 1: Stress (cortisol)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">The pressure your nervous system creates when your body is in fight-or-flight too often, and cortisol tells your kidneys to hold sodium. Hallmarks: waking at 3 AM, racing pulse at rest, white-coat spikes, BP that drops on vacation. If your loudest corner is this one, your kit's breathing and tea swaps are doing the most work.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 2: Sugar (insulin)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">The pressure high insulin creates, and insulin also tells your kidneys to hold sodium and pull water into the line. Hallmarks: belly weight, afternoon energy crashes, A1C creeping up, blood sugar &gt; 100 fasting. If your loudest corner is this one, your kit's carb and meal-timing notes are doing the most work.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 3: Sodium (the held water)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">The pressure from held sodium pulling extra fluid into the line and straining the vessel walls. Hallmarks: numbers that jump after salty restaurant meals, rings and ankles that swell, a top number much higher than bottom, slow recovery from exertion. If your loudest corner is this one, your kit's potassium and herb sections are doing the most work.</p>
    `)}
    ${p(`Here's the catch, and this is the thing I have to say honestly because I owe you the truth:`, { margin: '0 0 18px' })}
    ${p(`<strong>The kit is a great map. But it can't tell you which corner is loudest in YOUR Triangle.</strong>`)}
    ${p(`It treats all three corners as if they're equally weighted, because it has to. It doesn't know if you're a Stress-loudest reader or a Sugar-loudest reader or a Sodium-loudest reader. It can't see your readings. It can't ask you about your sleep. It can't look at your med list. It does its best general work.`)}
    ${p(`Some of you have a kit that's hitting your loudest corner squarely. Your numbers are already moving. Stay the course.`)}
    ${p(`Some of you have a kit that's working on the wrong corner. Your numbers won't move much until somebody, me, your doctor, or you yourself, names the real loudest corner.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'A quick self-check',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Look at the three corners above. Which one do you suspect is loudest in your body? Don't pick more than one.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If you'd like a real answer instead of a suspicion, bring your guess and your log to one of the live Weekly Reset sessions and I will pressure-test it with you. And a guess this week is still better than no guess.</p>`
    )}
    ${p(`Day 10, I'll show you what happens when a reader stops guessing and hands me their numbers. I sit down with their whole picture and write their next 30 days. A few of you are going to want that. More then.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Reply with one word, "Stress," "Sugar," or "Sodium," and tell me which corner you think is loudest. I read them. I track them. It tells me which emails to send next.`)}
    ${weeklyResetFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

One week in. Let me give you the framework behind everything I do on blood pressure, from twenty years in the ICU to the readers I work with now.

The BP Triangle Method: your blood pressure isn't one problem. It's three corners stacking: Stress, Sugar, Sodium.

CORNER 1: STRESS (cortisol)
Waking at 3 AM, racing pulse at rest, white-coat spikes. Cortisol holds sodium. If this is loudest, your kit's breathing and tea work hardest.

CORNER 2: SUGAR (insulin)
Belly weight, afternoon crashes, A1C creeping. Insulin holds sodium too. If this is loudest, your kit's carb and meal-timing notes work hardest.

CORNER 3: SODIUM (the held water)
Numbers jumping after salty restaurant meals, swelling, a top number much higher than bottom. If this is loudest, your kit's potassium and herb sections work hardest.

Here's the catch:

The kit is a great map. But it can't tell you which corner is loudest in YOUR Triangle.

It treats all three corners as if they're equally weighted because it has to. It can't see your readings, your sleep, your meds.

Some of you have a kit hitting your loudest corner squarely. Some of you have a kit working on the wrong corner.

A QUICK SELF-CHECK: Which corner do you suspect is loudest? Pick one. If you'd like a real answer instead of a suspicion, bring your guess and your log to one of the live Weekly Reset sessions and I will pressure-test it with you. And a guess this week is still better than no guess.

Day 10, I'll show you what happens when a reader stops guessing and hands me their numbers. I sit down with their whole picture and write their next 30 days. A few of you are going to want that. More then.

Joel
RN, BraveWorks

P.S. Reply with one word, "Stress," "Sugar," or "Sodium," and tell me which corner. I track them.

${weeklyResetFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 10 — Case review introduction (door, not push) ───────────────
const day10 = {
  subject: 'I\'d like to put my eyes on your numbers',
  subjectB: 'Your next moves, written for you',
  preview: 'A buyer-only door I want you to know about.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Ten days in. Time to introduce you to something I haven't mentioned yet.`)}
    ${p(`After buyers run the kit for a couple weeks, a small group of them wants more than a PDF can give. They want eyes on their actual log. They want a real answer about which corner of their Triangle is loudest. They want their next moves written for them, not guessed at.`)}
    ${p(`For that group, I do a <strong>case review</strong>.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What it is:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">You send me your cuff log, your medication list, and your story. I read all of it myself, every line.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Then I write your next moves. Which corner of your Triangle is loudest, what to keep, what to drop, and what to do next, with a reason next to every change. In plain language, with your name on it.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">You also get a doctor conversation script, so you walk into your next appointment with your numbers organized and your questions ready. Everything I write works alongside your doctor, never instead of your doctor.</p>
    `)}
    ${p(`The case review is $297. I take 5 a month, because I read and write each one myself.`)}
    ${p(`It comes with a simple guarantee: if you read what I write and feel it was not worth it, tell me and I will refund you. The guarantee is on my work, never on your health numbers. Those belong to you and your doctor.`)}
    ${p(`Here's the difference between the two rooms. In the Weekly Reset, I coach the room. In the case review, I read YOUR case and write YOUR next moves.`)}
    ${p(`I'm not asking you to buy today. Most readers who eventually do it wait until Day 14-21, after they've had enough cuff data to know whether they're moving or plateauing on the kit alone. I'm telling you about it now because I want you to know the door exists.`, { margin: '0 0 28px' })}
    ${ctaButton(CASE_REVIEW_URL, 'See if a case review is right for you')}
    ${p(`Day 13 I'll tell you about Patricia, who worked the wrong corner of her Triangle for four years.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`The case review isn't for everyone. If your kit is moving your numbers and you're happy with the pace, stay the course. The door is here when you want it, not before.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Ten days in. Time to introduce you to something I haven't mentioned yet.

After buyers run the kit for a couple weeks, a small group of them wants more than a PDF can give. They want eyes on their actual log. They want a real answer about which corner of their Triangle is loudest. They want their next moves written for them, not guessed at.

For that group, I do a case review.

WHAT IT IS:
You send me your cuff log, your medication list, and your story. I read all of it myself, every line.

Then I write your next moves. Which corner of your Triangle is loudest, what to keep, what to drop, and what to do next, with a reason next to every change. In plain language, with your name on it.

You also get a doctor conversation script, so you walk into your next appointment with your numbers organized and your questions ready. Everything I write works alongside your doctor, never instead of your doctor.

The case review is $297. I take 5 a month, because I read and write each one myself.

It comes with a simple guarantee: if you read what I write and feel it was not worth it, tell me and I will refund you. The guarantee is on my work, never on your health numbers. Those belong to you and your doctor.

Here's the difference between the two rooms. In the Weekly Reset, I coach the room. In the case review, I read YOUR case and write YOUR next moves.

I'm not asking you to buy today. Most readers who eventually do it wait until Day 14-21, after they've had enough cuff data to know whether they're moving or plateauing on the kit alone. I'm telling you about it now because I want you to know the door exists.

SEE IF A CASE REVIEW IS RIGHT FOR YOU:
${CASE_REVIEW_URL}

Day 13 I'll tell you about Patricia, who worked the wrong corner of her Triangle for four years.

Joel
RN, BraveWorks

P.S. The case review isn't for everyone. If your kit is moving your numbers and you're happy with the pace, stay the course. The door is here when you want it, not before.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 13 — Patricia case study (product-agnostic, rider required) ──
const day13 = {
  subject: 'Patricia worked the wrong corner for four years',
  subjectB: 'The plateau wasn\'t the kit\'s fault',
  preview: 'BEFORE: stuck in the low 140s. AFTER: a different plan entirely.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to tell you about Patricia.`)}
    ${p(`(Patricia isn't her real name. I don't use real names in these emails, to protect my buyers. But she's real. The numbers are hers.)`, { margin: '0 0 28px' })}
    ${bigQuote('Before.')}
    ${p(`Patricia is 58. Retired teacher. Two grandkids. Has been on lisinopril, amlodipine, and a low-dose diuretic for eight years. Her morning readings had hovered in the low 140s over high 80s for the last four of those years. Same range, no movement, despite watching her diet and walking three days a week.`)}
    ${p(`She found me through TikTok. Bought the BP Reset Kit. Ran the 10-day protocol. Saw her morning number drop to 138/86 by Day 9. Measurable, but not the leap she wanted. Plateaued there for the next ten days.`)}
    ${p(`On Day 21, she emailed me one sentence: "Joel, I think I need more help than the PDF can give."`)}
    ${p(`She asked me to look at her whole picture. So I did.`, { margin: '0 0 28px' })}
    ${bigQuote('After.')}
    ${p(`She sent me everything. Twenty-one mornings of readings, her medication list, every supplement in her cabinet, and her story. By the second page, the problem was obvious. She had been working the wrong corner of her Triangle for years.`)}
    ${p(`Her kit was a great Sodium-corner kit. It hit her potassium intake, her sodium-clearing herbs, her hydration. All correct work.`)}
    ${p(`But her loudest corner was <strong>Stress Pressure</strong>. The signs were everywhere in her log. Readings that dropped 12 points on her Saturday mornings. A 3 AM waking pattern she'd had for two years. A resting pulse of 78 that shouldn't have been there for a woman with her sleep history.`)}
    ${p(`So I wrote her a different plan. Two supplements out, three kept, one added for her sleep. A new evening routine. And a script for her cardiologist, so she could ask whether her prescriptions still fit what her log was showing. That decision belonged to her doctor, not to me.`, { margin: '0 0 28px' })}
    ${p(`Patricia walked out with a completely different plan than the one she'd been running. Not because the kit was wrong, but because the kit was answering a different question than the one her body was asking.`)}
    ${p(`Three weeks later her morning number was 124/78. Her cardiologist reduced one of her meds at her next appointment. She emails me every six weeks now with a quick log update.`)}
    ${p(`Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results. Patricia's medication change was made with her own cardiologist, never on her own.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What Patricia got that the kit alone couldn't give her:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ The name of her actual loudest Triangle corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ A written 30-day plan pointed at that specific corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ A doctor-conversation script she actually used.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ Live sessions so she wasn't alone the first month.</p>
    `)}
    ${p(`That personal look is exactly what the $297 case review is. You send your log, your med list, and your story. I read every line myself and write your next moves, with a reason next to each one. If you've been logging for two weeks and your numbers have plateaued the way Patricia's did, the door is the same kind of door she walked through.`, { margin: '0 0 28px' })}
    ${ctaButton(CASE_REVIEW_URL, 'See if a case review is right for you')}
    ${joelSignoff()}
    ${psBox(`Patricia's story is one reader's story. Yours will be your own. If you want me to look at where your numbers are first, hit reply with your last week of readings. I read every one.`)}
    ${ppsBox(`The case review is $297. I take 5 a month, and the work comes with a simple satisfaction guarantee: if you feel it was not worth it, tell me and I refund it.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I want to tell you about Patricia.

(Patricia isn't her real name. I protect my buyers. But she's real. The numbers are hers.)

BEFORE.
Patricia is 58. Retired teacher. On lisinopril, amlodipine, and a low-dose diuretic for eight years. Morning readings hovered in the low 140s over high 80s for four years. No movement.

She bought the BP Reset Kit. Ran the protocol. Dropped to 138/86 by Day 9. Plateaued there for ten more days.

Day 21 she emailed me: "Joel, I think I need more help than the PDF can give."

She asked me to look at her whole picture. So I did.

AFTER.
She sent me everything. Twenty-one mornings of readings, her medication list, every supplement in her cabinet, and her story. By the second page, the problem was obvious. She had been working the wrong corner of her Triangle for years.

Her kit was a great Sodium-corner kit. But her loudest corner was Stress. Readings dropped 12 points on Saturdays. A 3 AM waking pattern for two years. A resting pulse of 78. The sodium work was helping, but a louder driver had never been named.

So I wrote her a different plan. Two supplements out, three kept, one added for her sleep. A new evening routine. And a script for her cardiologist, so she could ask whether her prescriptions still fit what her log was showing. That decision belonged to her doctor, not to me.

Patricia walked out with a completely different plan. Three weeks later: 124/78. Her cardiologist reduced one of her meds at her next appointment.

Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results. Patricia's medication change was made with her own cardiologist, never on her own.

WHAT THE KIT ALONE COULDN'T GIVE HER:
→ The name of her actual loudest Triangle corner
→ A written 30-day plan pointed at that specific corner
→ A doctor-conversation script she actually used
→ Live sessions so she wasn't alone the first month

That personal look is exactly what the $297 case review is. You send your log, your med list, and your story. I read every line myself and write your next moves, with a reason next to each one. If you've been logging for two weeks and your numbers have plateaued the way Patricia's did, the door is the same kind of door she walked through.

SEE IF A CASE REVIEW IS RIGHT FOR YOU:
${CASE_REVIEW_URL}

Joel
RN, BraveWorks

P.S. Patricia's story is one reader's story. Yours will be your own. If you want me to look at where your numbers are first, hit reply with your last week of readings. I read every one.

P.P.S. The case review is $297. I take 5 a month, and the work comes with a simple satisfaction guarantee: if you feel it was not worth it, tell me and I refund it.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 15 — Mechanism teach (how the plan gets written) ─────────────
const day15 = {
  subject: 'What I look for in 21 mornings of readings',
  subjectB: 'How I write your next moves',
  preview: 'The four patterns your log shows me before I write a word.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`After Day 13, a few of you wrote back with the same question in different words: what do you actually DO when you build someone's plan?`)}
    ${p(`Fair question. Here's the honest answer, piece by piece.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Your log.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">I look for four patterns: variance by day of week, variance by time of day, the gap between your top and bottom number, and your average resting pulse. Each pattern points to a different Triangle corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Your meds and supplements.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">I go through every bottle on your list. I'm looking for two things: combinations worth raising with your doctor, and supplements that are either redundant with each other or aimed at the wrong corner. About half of readers walk in over-supplementing for the wrong corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Your story.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Your intake asks about your sleep, your stress, your work, your loved ones. The Triangle has clinical signals, but the loudest corner almost always has a life signal too. The 3 AM waking pattern. The Sunday night dread. The grief you didn't realize was sitting in your chest. This is where the picture comes together.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Your next moves.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Then I write them. Every change has a reason next to it. Every herb has a dose range. Every habit has a do-this-Monday, do-that-Wednesday rhythm. It lands in your inbox with your name on it, in plain language you can reread any time.</p>
    `)}
    ${p(`You also get a doctor-conversation script. Plain language. Three things to ask, two things to raise with them. Most people walk into an appointment without language. You'll walk in with it.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'What the case review is NOT',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It's not a doctor's appointment. I'm not your physician, and what I write is built to work alongside your meds, never instead of them.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It's not a sales call for a bigger program. The case review stands on its own.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It's not a live call. It's my eyes on your whole case and a written answer you keep.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">And it's not for someone who hasn't run the kit yet. Run the kit first. Plateau if you're going to plateau. THEN decide.</p>`
    )}
    ${p(`Day 17, I'll answer the four objections I hear most often. After that, you'll have everything you need to decide.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you want to sit with this one for a few days, good. The readers who read slowly and decide once are exactly the readers who do well on a plan.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

After Day 13, a few of you wrote back with the same question in different words: what do you actually DO when you build someone's plan?

Fair question. Here's the honest answer, piece by piece.

YOUR LOG.
I look for four patterns: variance by day of week, variance by time of day, the gap between your top and bottom number, and your average resting pulse. Each pattern points to a different Triangle corner.

YOUR MEDS AND SUPPLEMENTS.
I go through every bottle on your list. I'm looking for two things: combinations worth raising with your doctor, and supplements that are either redundant with each other or aimed at the wrong corner. About half of readers walk in over-supplementing for the wrong corner.

YOUR STORY.
Your intake asks about your sleep, your stress, your work, your loved ones. The Triangle has clinical signals, but the loudest corner almost always has a life signal too. This is where the picture comes together.

YOUR NEXT MOVES.
Then I write them. Every change has a reason next to it. Every herb has a dose range. Every habit has a do-this-Monday, do-that-Wednesday rhythm. It lands in your inbox with your name on it, in plain language you can reread any time.

You also get a doctor-conversation script. Plain language. Three things to ask, two things to raise with them. Most people walk into an appointment without language. You'll walk in with it.

WHAT THE CASE REVIEW IS NOT:
- Not a doctor's appointment. I'm not your physician, and what I write works alongside your meds, never instead of them.
- Not a sales call for a bigger program. The case review stands on its own.
- Not a live call. It's my eyes on your whole case and a written answer you keep.
- Not for someone who hasn't run the kit yet. Run the kit first. Plateau if you're going to plateau. THEN decide.

Day 17, I'll answer the four objections I hear most often. After that, you'll have everything you need to decide.

Joel
RN, BraveWorks

P.S. If you want to sit with this one for a few days, good. The readers who read slowly and decide once are exactly the readers who do well on a plan.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 17 — Four honest objections + straight price ─────────────────
const day17 = {
  subject: 'Four honest answers about the $297 case review',
  subjectB: 'Including whether the $27 group is enough',
  preview: 'The four objections I hear, answered honestly.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Let me answer the four things that are probably stopping you. Not with sales talk, with the real answer.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Objection #1: "$297 is a lot."',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It is. It's also the price of two months of supplements you may already be buying for the wrong corner of your Triangle.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">And here's the part most sales emails won't say: for many readers, the $27 Weekly Reset is the right next step. Four live sessions a month, real eyes on your questions, every single week. The case review is for the reader who wants the guessing removed. In the group, I coach the room. In the case review, I read your numbers and write your next moves.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If the $27 path fits your life right now, take the $27 path. That's a real path, not a consolation prize.</p>`
    )}
    ${clayBlock(
      'Objection #2: "I haven\'t finished the kit."',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Then finish it. Don't start yet.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">The case review is written FROM your data. With 14 to 21 days of cuff readings, my answer gets better. If you don't have that yet, you'd be paying for an answer built on too thin a pattern.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Keep logging. The door is here when the data is.</p>`
    )}
    ${clayBlock(
      'Objection #3: "What if my case is different?"',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It probably isn't, in the way you mean. In ten years of this work, the genuinely unusual cases have been rare. Almost everyone I've sat with fits one of the three Triangle corners as the loudest driver.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">And if you are one of the rare ones, here's my promise: if I read your numbers and the honest answer is that your case needs a different specialist, I will tell you before I write a single word, and refund every dollar.</p>`
    )}
    ${clayBlock(
      'Objection #4: "Will my doctor be on board?"',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Most doctors are not hostile to a written, sober protocol that runs <em>alongside</em> medication. They're hostile to "I read on TikTok that I should stop my lisinopril." Those are different conversations.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">The doctor-conversation script we build is designed to make your physician your partner, not your obstacle. Patricia's cardiologist (Day 13) was on board. Linda's was on board. Paul's primary actually thanked him.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">"AND not INSTEAD OF." Protocol with pills, never instead of pills. That's the rule.</p>`
    )}
    ${p(`<strong>The price, plainly:</strong>`)}
    ${p(`The case review is <strong>$297</strong>. No credit games, no countdown. I take 5 a month because I read and write each one myself.`)}
    ${p(`And the guarantee is simple: if you read what I write and feel it was not worth it, tell me and I refund it. The guarantee is on my work, never on your health numbers.`, { margin: '0 0 28px' })}
    ${ctaButton(CASE_REVIEW_URL, 'See if a case review is right for you')}
    ${p(`Day 19 I'll help you sort whether this month or next month is right for you. Day 21 is the last email I send about this. After that, you move to a quieter list and I stop mentioning it unless you ask.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Reply with the objection I didn't cover, if there is one. If it's a real one, I'll write back. If it's the same one in different words, I'll tell you that too.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Let me answer the four things that are probably stopping you. Not with sales talk, with the real answer.

OBJECTION #1: "$297 is a lot."
It is. It's also the price of two months of supplements you may already be buying for the wrong corner of your Triangle.
And here's the part most sales emails won't say: for many readers, the $27 Weekly Reset is the right next step. Four live sessions a month, real eyes on your questions, every single week. The case review is for the reader who wants the guessing removed. In the group, I coach the room. In the case review, I read your numbers and write your next moves.
If the $27 path fits your life right now, take the $27 path. That's a real path, not a consolation prize.

OBJECTION #2: "I haven't finished the kit."
Then finish it. Don't start yet.
The case review is written FROM your data. With 14 to 21 days of cuff readings, my answer gets better. If you don't have that yet, you'd be paying for an answer built on too thin a pattern.
Keep logging. The door is here when the data is.

OBJECTION #3: "What if my case is different?"
It probably isn't, in the way you mean. In ten years of this work, the genuinely unusual cases have been rare. Almost everyone I've sat with fits one of the three Triangle corners as the loudest driver.
And if you are one of the rare ones, here's my promise: if I read your numbers and the honest answer is that your case needs a different specialist, I will tell you before I write a single word, and refund every dollar.

OBJECTION #4: "Will my doctor be on board?"
Most doctors are not hostile to a written, sober protocol that runs alongside medication. They're hostile to "I read on TikTok that I should stop my lisinopril."
The doctor-conversation script we build makes your physician your partner. Patricia's cardiologist was on board. Linda's was on board. Paul's primary actually thanked him.
"AND not INSTEAD OF." Protocol with pills, never instead of pills. That's the rule.

THE PRICE, PLAINLY:
The case review is $297. No credit games, no countdown. I take 5 a month because I read and write each one myself.
And the guarantee is simple: if you read what I write and feel it was not worth it, tell me and I refund it. The guarantee is on my work, never on your health numbers.

SEE IF A CASE REVIEW IS RIGHT FOR YOU:
${CASE_REVIEW_URL}

Day 19 I'll help you sort whether this month or next month is right for you. Day 21 is the last email I send about this.

Joel
RN, BraveWorks

P.S. Reply with the objection I didn't cover, if there is one. If it's a real one, I'll write back. If it's the same one in different words, I'll tell you that too.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 19 — Sorting email + honest scarcity (cap = 5/month, real) ───
// Joel confirmed 2026-06-09: the 5-case-reviews-a-month cap is real
// (it is what the writing actually takes). We name the cap once, no
// countdowns ever ("X seats left" is marketing theater).
const day19 = {
  subject: 'Should you do the case review this month, or wait?',
  subjectB: 'A sorting email, not a countdown',
  preview: 'No fake scarcity. Just an honest sort.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I'm not going to run a countdown on you. "Three seats left, two seats left, one seat." That's marketing theater and most of my readers see through it.`)}
    ${p(`So this email is a sorting tool instead. Read both lists. Be honest with yourself about which one you're on.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Who should ask for a case review this week:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You've logged 14+ mornings of readings.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You've seen some movement on the kit but you're plateauing.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You suspect, from Day 7, that one Triangle corner is loudest, and you want it confirmed or corrected from your actual numbers.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ You'd rather have my trained read on your numbers than guess for another month.</p>
    `)}
    ${p(`Who should wait:`)}
    ${p(`→ You haven't run the kit through Day 14 yet. Run it. Plateau if you're going to plateau. Then decide.`)}
    ${p(`→ Your numbers are dropping steadily on the kit alone. Stay the course. The kit is doing it for you.`)}
    ${p(`→ Your next month is too full to work a new set of moves. Wait. The door doesn't close.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Honest math on capacity',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">I read and write every case review myself. I take 5 a month, because that is what the work actually takes. If the month is full when you write me, I'll tell you directly and lock you in when the next window opens.</p>`
    )}
    ${ctaButton(CASE_REVIEW_URL, 'See if a case review is right for you')}
    ${p(`And if $297 isn't your season, that's a real answer. The Weekly Reset is $27 a month, first week free. Most readers who wait on the case review do their waiting inside that room, with me, instead of alone: <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};">skool.com/braveworksrn/about</a>`, { margin: '0 0 28px' })}
    ${p(`Tomorrow you have a quiet day. Day 21 is the last email I send in this sequence. Then you graduate to a calmer cadence, one email per week instead of every two or three days.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Reply with where your numbers are and I'll tell you straight whether the case review is your next step or the kit still is.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I'm not going to run a countdown on you. "Three seats left, two seats left, one seat." That's marketing theater and most of my readers see through it.

So this email is a sorting tool instead. Read both lists. Be honest with yourself about which one you're on.

WHO SHOULD ASK FOR A CASE REVIEW THIS WEEK:
→ You've logged 14+ mornings of readings.
→ You've seen some movement on the kit but you're plateauing.
→ You suspect, from Day 7, that one Triangle corner is loudest, and you want it confirmed or corrected from your actual numbers.
→ You'd rather have my trained read on your numbers than guess for another month.

WHO SHOULD WAIT:
→ You haven't run the kit through Day 14 yet. Run it. Plateau if you're going to plateau. Then decide.
→ Your numbers are dropping steadily on the kit alone. Stay the course. The kit is doing it for you.
→ Your next month is too full to work a new set of moves. Wait. The door doesn't close.

HONEST MATH ON CAPACITY:
I read and write every case review myself. I take 5 a month, because that is what the work actually takes. If the month is full when you write me, I'll tell you directly and lock you in when the next window opens.

SEE IF A CASE REVIEW IS RIGHT FOR YOU:
${CASE_REVIEW_URL}

And if $297 isn't your season, that's a real answer. The Weekly Reset is $27 a month, first week free. Most readers who wait on the case review do their waiting inside that room, with me, instead of alone: ${SKOOL_URL}

Tomorrow you have a quiet day. Day 21 is the last email I send in this sequence. Then you graduate to a calmer cadence, one email per week instead of every two or three days.

Joel
RN, BraveWorks

P.S. Reply with where your numbers are and I'll tell you straight whether the case review is your next step or the kit still is.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 20 — The $97 shadow seat (downsell after the case review is declined) ─
// Moved here from tier-3 on 2026-06-23. A $97 downsell only makes sense for
// someone pitched the $297 and didn't take it. That's THIS audience: the
// $27/$47 kit buyer pitched the case review on Days 10-19 who hasn't
// converted. Fires the day after the Day-19 sort, before the Day-21 close.
// The cron never auto-exits tier-1 at Day 21 (state only changes on a Stripe
// purchase in stripe-webhook.js), so Day 20 fires cleanly inside the
// sequence. Not a written case review (that's the $297), just the standing
// Wednesday 7 PM EST room. 2026-07-04: the $97 shadow seat retired (its
// Stripe link was deactivated and its /challenge page was stale pre-launch
// copy) — the live seat in the room IS the Weekly Reset community, $27/mo
// with a 7-day free trial. Hand-up back to the case review for anyone who
// wants their own written answer.
const day20 = {
  subject: 'A smaller door, less than a copay',
  subjectB: 'Not a plan with your name on it. A seat in the room.',
  preview: 'If the case review is more than this season needs, here is the lighter step.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I have spent the last couple weeks showing you the case review. If $297 wasn't this season's move, I get it, and this is not another push on it. But I don't want you walking away with just the kit and a closed door. So here is the lighter step, and it is open any day you want it.`, { margin: '0 0 28px' })}
    ${bigQuote('A standing seat in the room.')}
    ${clayBlock('The Weekly Reset room, $27 a month', `
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 10px;">A standing seat in my live group call, <strong style="color:${PALETTE.text};">Wednesday at 7 PM EST</strong>. You bring your numbers, your med list, the question you have been sitting on, and we work it together, in plain language, on camera. When a reading jumps one morning, you do not have to guess alone. You bring it to the room.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">It is $27 a month, less than most copays, and your first 7 days are free. Cancel anytime. You join the very next Wednesday. No cohort to wait for, no clock.</p>
    `)}
    ${ctaButton(SKOOL_URL, 'Start my free week in the room')}
    ${p(`Let me be honest about what it is and is not. The seat is education and accountability alongside your doctor, never instead of your doctor, and it is not a written answer built for you. That is the difference between this and the case review. In the room, I coach the room. In the case review, I read your case and write your next moves.`, { margin: '0 0 24px' })}
    ${p(`So if what you actually want is your next moves written for you, the case review door is still open too. It is $297, I take 5 a month, and the work has a satisfaction guarantee. <a href="${CASE_REVIEW_URL}" style="color:${PALETTE.accentClay};font-weight:600;">See if a case review is right for you</a>.`, { margin: '0 0 24px' })}

    ${joelSignoff()}
    ${psBox(`If neither is your season, that is a real answer, and the kit is yours to keep working. The Wednesday room will be here when you are ready. I will not keep knocking.`)}
    ${sprintFooter()}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I have spent the last couple weeks showing you the case review. If $297 wasn't this season's move, I get it, and this is not another push on it. But I don't want you walking away with just the kit and a closed door. So here is the lighter step, and it is open any day you want it.

A STANDING SEAT IN THE ROOM.

THE WEEKLY RESET ROOM, $27 A MONTH:
A standing seat in my live group call, Wednesday at 7 PM EST. You bring your numbers, your med list, the question you have been sitting on, and we work it together, in plain language, on camera. When a reading jumps one morning, you do not have to guess alone. You bring it to the room.

It is $27 a month, less than most copays, and your first 7 days are free. Cancel anytime. You join the very next Wednesday. No cohort to wait for, no clock.

→ Start my free week in the room: ${SKOOL_URL}

Let me be honest about what it is and is not. The seat is education and accountability alongside your doctor, never instead of your doctor, and it is not a written answer built for you. That is the difference between this and the case review. In the room, I coach the room. In the case review, I read your case and write your next moves.

So if what you actually want is your next moves written for you, the case review door is still open too. It is $297, I take 5 a month, and the work has a satisfaction guarantee.
→ See if a case review is right for you: ${CASE_REVIEW_URL}

Joel
RN, BraveWorks

P.S. If neither is your season, that is a real answer, and the kit is yours to keep working. The Wednesday room will be here when you are ready. I will not keep knocking.

${sprintFooterText()}

${youtubeLineText()}
`,
};

// ─── DAY 21 — Last call + graceful exit + concierge whisper ───────────
const day21 = {
  subject: 'Last email I\'ll send about this',
  subjectB: 'If not now, that\'s a real answer',
  preview: 'I\'ll quiet down after this. Promise.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This is the last email I send you about the case review.`)}
    ${p(`Three weeks ago you bought a $27 or $47 kit. You've gotten nine emails from me since. Protocol notes, the Triangle (Stress, Sugar, Sodium), Patricia's story, the how-I-write-your-moves walkthrough, the objections.`)}
    ${p(`From next week on, you graduate to a quieter list. One email a week. Mostly teaching, a little story, the occasional invitation. The pressure stops.`, { margin: '0 0 28px' })}
    ${bigQuote('Before that switch flips, one last word.')}
    ${p(`If you've been on the fence about the case review, here's what I want you to know:`)}
    ${p(`<strong>The decision isn't $297 versus $0.</strong> The decision is between getting my read on the loudest corner of your Triangle in the first week, or guessing at it for another month, maybe another six.`)}
    ${p(`Patricia guessed at her loudest corner for four years before we named it. Linda guessed for nine. Paul for two. Rachel for six. All four, once it was named, said the same thing in different words: <em>"I wish I'd done this six months ago."</em>`)}
    ${p(`Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results.`)}
    ${p(`I'm not saying any of this to push you. I'm saying it because that's what they told me, and only you know if it fits your season.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">If now is your moment:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Ask for the case review. I'll read your log, your med list, and your story, name your loudest corner, and write your next moves with a reason next to each one. It is $297, I take 5 a month, and the work has a simple satisfaction guarantee. The next four to six weeks become a clear set of moves, instead of another stretch of the same plateau.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">If now is NOT your moment:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">That's a real answer. Keep the kit. Keep logging. The door doesn't close. And if you want company while you do, the Weekly Reset is $27 a month, first week free. That's where I'll be every week either way.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">When you're ready for the case review, you'll know. The weekly emails from here are content-only. No pitches, no urgency.</p>
    `)}
    ${ctaButton(CASE_REVIEW_URL, 'See if a case review is right for you')}
    ${p(`Whichever path you take, I want to say thank you. Three weeks ago you trusted me with $27 or $47 on a hunch. Most people don't follow through on hunches. You did. The fact that you read this email, the tenth one in a row from a guy you don't really know yet, tells me you're the kind of reader I want around for a long time.`, { margin: '0 0 28px' })}
    ${p(`One last quiet thing. A few readers each year want me fully in their corner, one on one, for a season. That level exists, and it's open again. It's not for most people, and I'll never push it here. If it might be for you, write concierge@bpquiz.com and tell me where your numbers are. No sales page, no pitch. I'll tell you honestly if it fits.`, { margin: '0 0 28px' })}
    ${p(`Next week's email is shorter, calmer, and on a different topic entirely. I'll see you there.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've decided the case review isn't for you and you'd like me to stop mentioning it entirely going forward, just reply with "not now." I'll tag your record and the weekly emails won't reference it. Your call.`)}
    ${sprintFooter({
      kicker: 'Last note in the sequence',
      body: 'After today, no more pitches in this arc. If you want the door, here it is. If not, the weekly emails carry on quietly. Either way, thank you for being here.',
    })}
    ${youtubeLine()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This is the last email I send you about the case review.

Three weeks ago you bought a $27 or $47 kit. You've gotten nine emails from me since. Protocol notes, the Triangle (Stress, Sugar, Sodium), Patricia's story, the how-I-write-your-moves walkthrough, the objections.

From next week on, you graduate to a quieter list. One email a week. Mostly teaching, a little story, the occasional invitation. The pressure stops.

Before that switch flips, one last word.

If you've been on the fence about the case review:

The decision isn't $297 versus $0. The decision is between getting my read on the loudest corner of your Triangle in the first week, or guessing at it for another month, maybe another six.

Patricia guessed at her loudest corner for four years before we named it. Linda guessed for nine. Paul for two. Rachel for six. All four, once it was named, said the same thing in different words: "I wish I'd done this six months ago."

Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results.

I'm not saying any of this to push you. I'm saying it because that's what they told me, and only you know if it fits your season.

IF NOW IS YOUR MOMENT:
Ask for the case review. I'll read your log, your med list, and your story, name your loudest corner, and write your next moves with a reason next to each one. It is $297, I take 5 a month, and the work has a simple satisfaction guarantee. The next four to six weeks become a clear set of moves, instead of another stretch of the same plateau.

IF NOW IS NOT YOUR MOMENT:
That's a real answer. Keep the kit. Keep logging. The door doesn't close. And if you want company while you do, the Weekly Reset is $27 a month, first week free. That's where I'll be every week either way.

When you're ready for the case review, you'll know. The weekly emails from here are content-only. No pitches, no urgency.

SEE IF A CASE REVIEW IS RIGHT FOR YOU:
${CASE_REVIEW_URL}

Whichever path you take, I want to say thank you. Three weeks ago you trusted me with $27 or $47 on a hunch. Most people don't follow through on hunches. You did. The fact that you read this email, the tenth one in a row from a guy you don't really know yet, tells me you're the kind of reader I want around for a long time.

One last quiet thing. A few readers each year want me fully in their corner, one on one, for a season. That level exists, and it's open again. It's not for most people, and I'll never push it here. If it might be for you, write concierge@bpquiz.com and tell me where your numbers are. No sales page, no pitch. I'll tell you honestly if it fits.

Next week's email is shorter, calmer, and on a different topic entirely. I'll see you there.

Joel
RN, BraveWorks

P.S. If you've decided the case review isn't for you and you'd like me to stop mentioning it entirely going forward, just reply with "not now." I'll tag your record and the weekly emails won't reference it. Your call.

${sprintFooterText({
  kicker: 'Last note in the sequence',
  body: 'After today, no more pitches in this arc. If you want the door, here it is. If not, the weekly emails carry on quietly. Either way, thank you for being here.',
})}

${youtubeLineText()}
`,
};

// ─── EXPORT MAP ───────────────────────────────────────────────────────
// Cron picks the right email by `daysSinceTier1EnteredAt`.
export const TIER_1_DAYS = {
  0: day0,
  2: day2,
  4: day4,
  7: day7,
  10: day10,
  13: day13,
  15: day15,
  17: day17,
  19: day19,
  20: day20,
  21: day21,
};

// Idempotency flag name — cron skips already-sent emails by checking this.
export function tier1SentFlag(day) {
  return `tier1Day${day}Sent`;
}
