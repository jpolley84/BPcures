// _tier-1-emails.js — TIER-1 sequence content + render helpers.
//
// Audience: bought $17 BP Starter or $47 BP Reset Kit. Has NOT bought
// the $297 BP Triangle Diagnostic. State = `tier-1`.
//
// Goal: upgrade to $297 BP Triangle Diagnostic Session in ≤21 days.
// Failure path: graduate to newsletter at Day 21.
//
// Trigger: `daysSinceTier1EnteredAt` (NOT calendar days, NOT signup days).
// Day map: 0, 2, 4, 7, 10, 13, 15, 17, 19, 21.
//
// HARD RULES (per EMAIL_SEQUENCES_SPEC.md §7-B):
//   - Never re-pitch $17/$47/$97 — they already own this rung
//   - upsellFooter ALWAYS points at COACHING_URL ($297 Diagnostic)
//   - Patricia is the diagnostic-call case study (Day 13)
//   - Linda / Paul / Rachel are supporting case studies
//   - Wakita is reserved for tier-3 / tier-4 (NOT used here)
//   - No medical claims, no copyrighted material
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }.
//
// Author: Joel Polley, RN, BraveWorks Health.

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── URLs ─────────────────────────────────────────────────────────────
// Active product Stripe links — verified live 2026-05-14.
// Tier-1 only ever pitches COACHING_URL ($297 Diagnostic).
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

// $17 Kit credit applied → buyer sees $280 at checkout for the Diagnostic.
const DIAGNOSTIC_WITH_KIT_CREDIT_LINK =
  process.env.VITE_STRIPE_DIAGNOSTIC_WITH_KIT_CREDIT_LINK ||
  'https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P';

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

// ─── Shared building blocks (copied verbatim from spec §4) ────────────
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

// Tier-1 reuses the SAME upsell pitch every email (Diagnostic, $280 net).
// Slight rotation of kicker + body so it doesn't read identical, but the
// CTA and URL are locked.
function diagnosticUpsell({ kicker, body }) {
  return upsellFooter({
    kicker,
    body,
    ctaLabel: 'See how the diagnostic works',
    ctaUrl: COACHING_URL,
  });
}

// ─── DAY 0 — Receipt + how to use what you just got ───────────────────
const day0 = {
  subject: 'Your BP Starter is ready — here\'s how to use it',
  subjectB: 'Day 1 starts tomorrow morning',
  preview: 'Three things to do tonight. Five minutes total.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You're in. Welcome to the BraveWorks side of the fence — the one where you stop being a passenger in your own care.`)}
    ${p(`Before you do anything else, I want to walk you through how to actually use the kit you just bought. Most people open a PDF, skim two pages, save it to a folder, and never come back. That's not going to be you.`)}
    ${p(`Here's the plan for the next 24 hours.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Tonight (5 minutes):</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">1. Open the kit PDF. Read page 1 and page 2. That's it — just those two pages.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">2. Find your home BP cuff. Put it on the kitchen counter or your nightstand. Somewhere you'll see it tomorrow morning before coffee.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">3. Grab a piece of paper or a Notes app. Title it "BP — Week 1." You'll log here.</p>
    `)}
    ${p(`Tomorrow morning, before food, before coffee, after you've used the bathroom: <strong>sit quietly for five minutes, then take three readings, one minute apart.</strong> Write down all three. Circle the lowest of the three. That's your true morning number.`)}
    ${p(`Do that every morning this week. Same time, same chair, same arm.`)}
    ${p(`That's the entire ask for Day 1. Not a diet change. Not a supplement. Not a workout. Just a number — written down.`)}
    ${p(`Why so simple? Because most people who buy a BP kit never measure their starting point. They start "the protocol" but they don't have a baseline. Then three weeks later they don't know if anything moved.`)}
    ${p(`You're going to have a baseline. By Friday, you'll have five readings you can trust.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'A small promise',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">I'm going to email you nine more times over the next three weeks. Short emails. One idea each. The goal isn't to overwhelm you — it's to help you actually <em>finish</em> the kit instead of letting it gather digital dust.</p>`
    )}
    ${p(`See you in the morning.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you can't find the kit PDF, check your spam folder — sometimes Stripe receipts get filtered. Subject line is "Your BP Kit — files inside." Hit reply if it's still missing and I'll resend within the day.`)}
    ${diagnosticUpsell({
      kicker: 'Already thinking past the kit?',
      body: 'A few readers come in already knowing the kit is step one, not step ten. The next step — when you\'re ready — is the BP Triangle Diagnostic. Sixty minutes with me on Zoom, a personalized protocol, and a written plan for your specific Triangle. Not for tonight. But on the menu when you want it.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You're in. Welcome to the BraveWorks side of the fence — the one where you stop being a passenger in your own care.

Before you do anything else, I want to walk you through how to actually use the kit you just bought.

TONIGHT (5 minutes):
1. Open the kit PDF. Read page 1 and page 2. That's it.
2. Find your home BP cuff. Put it somewhere you'll see it tomorrow before coffee.
3. Grab a piece of paper or a Notes app. Title it "BP — Week 1."

Tomorrow morning, before food, before coffee, after you've used the bathroom: sit quietly for five minutes, then take three readings, one minute apart. Write down all three. Circle the lowest. That's your true morning number.

Do that every morning this week. Same time, same chair, same arm.

That's the entire ask for Day 1. Just a number — written down.

A small promise: I'm going to email you nine more times over the next three weeks. Short emails. One idea each.

See you in the morning.

Joel
RN, BraveWorks

P.S. If you can't find the kit PDF, check your spam folder. Subject "Your BP Kit — files inside." Hit reply if missing.

—
Already thinking past the kit?
The next step — when you're ready — is the BP Triangle Diagnostic. Sixty minutes with me on Zoom, personalized protocol.
→ ${COACHING_URL}

—
Two more ways to follow along:
→ Skool community: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
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
    ${p(`If yes — good. Write today's underneath it. That's the second data point. Two points make a line, and a line is the first thing your doctor will want to see.`)}
    ${p(`If no — no shame. Take one this morning. Take another tomorrow. Start the line today.`)}
    ${p(`Here's something most people don't know about home BP readings:`, { margin: '0 0 28px' })}
    ${bigQuote('The first morning reading is the loudest lie of the week.')}
    ${p(`Why? You slept differently because you knew you were going to measure. You woke up thinking about it. You may have rushed to the cuff. Your heart rate was already elevated before the cuff inflated.`)}
    ${p(`The Day 1 number is almost always 4-8 points higher than your real baseline. That's not a failure of the cuff. That's the body responding to attention.`)}
    ${p(`<strong>Day 2 is closer to the truth. Day 3 is the truth.</strong>`)}
    ${p(`So if your Day 1 number scared you, breathe. It probably wasn't real. And if your Day 1 number looked great — also breathe. It also probably wasn't real.`)}
    ${p(`The data starts now.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Today's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Take your reading the same way you did yesterday — same chair, same arm, same time, three readings one minute apart. Circle the lowest.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Then write one sentence under it: <em>"Yesterday I ate ___, slept ___ hours, felt ___."</em> Just one sentence. That's your context.</p>
    `)}
    ${p(`Tomorrow you have a quiet day. I'm not asking for anything. Just keep logging.`)}
    ${p(`Day 4 is where the lesson lives. I'll see you there.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've already had a number swing you didn't expect — high or low — hit reply with the two numbers. I read them. I won't reply with a protocol over email, but I'll tell you if it's a noise-pattern or a signal-pattern.`)}
    ${diagnosticUpsell({
      kicker: 'When the cuff stops giving you answers',
      body: 'You\'re going to log for three weeks. Most readers, by Day 14, hit a plateau the kit alone can\'t solve — because the kit is the general playbook, and a plateau means your specific Triangle is asking for a specific answer. That\'s where the diagnostic comes in. Not yet. But it\'s the door.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Quick check. Did you take a reading yesterday morning?

If yes — good. Write today's underneath it. Two points make a line.

If no — no shame. Take one this morning. Take another tomorrow. Start the line today.

The first morning reading is the loudest lie of the week.

You slept differently because you knew you were going to measure. The Day 1 number is almost always 4-8 points higher than your real baseline. That's not the cuff failing — that's the body responding to attention.

Day 2 is closer to the truth. Day 3 is the truth.

TODAY'S ASK:
Take your reading the same way as yesterday. Circle the lowest of three. Then write one sentence underneath: "Yesterday I ate ___, slept ___ hours, felt ___."

Day 4 is where the lesson lives. I'll see you there.

Joel
RN, BraveWorks

P.S. If you've already had a number swing you didn't expect, hit reply with the two numbers. I'll tell you if it's noise or signal.

—
When the cuff stops giving you answers:
Most readers hit a plateau by Day 14 — the kit is the general playbook. The diagnostic is the specific one.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 4 — Plateau warning ──────────────────────────────────────────
const day4 = {
  subject: 'Day 4 is the day most quietly quit',
  subjectB: 'Most readers stall here. Don\'t.',
  preview: 'Not because the protocol failed. Because nothing moved yet.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to talk about today specifically — because today is the day the math is the cruelest.`)}
    ${p(`Day 1: high excitement. New PDF. New cuff. New numbers.`)}
    ${p(`Day 2: still motivated. The logging feels meaningful.`)}
    ${p(`Day 3: numbers haven't changed. You expected them to. They didn't.`)}
    ${p(`<strong>Day 4: quiet decision.</strong> The kit goes back in the downloads folder. The cuff stays on the counter for another week. Then it gets put in a drawer.`)}
    ${p(`I've watched this pattern for ten years. It's not a moral failing. It's a math problem.`, { margin: '0 0 28px' })}
    ${bigQuote('Blood pressure doesn\'t move on a daily curve. It moves on a weekly curve.')}
    ${p(`The reason: the three pressures driving your top number — Stress Pressure, Sugar Pressure, Pipe Pressure — operate on different clocks.`)}
    ${p(`<strong>Stress Pressure</strong> (cortisol) responds in 5-7 days. You can feel a difference in sleep before you see it in the cuff.`)}
    ${p(`<strong>Sugar Pressure</strong> (insulin) responds in 10-14 days. Faster if you're already lean, slower if you've been insulin-resistant a while.`)}
    ${p(`<strong>Pipe Pressure</strong> (vascular) responds in 14-21 days. The endothelium — the lining of your blood vessels — repairs slowly. It is the slowest corner of the Triangle.`)}
    ${p(`So when you read your cuff on Day 4 and see the same number as Day 1, you're not seeing a failed protocol. You're seeing a body that hasn't reached the response window yet.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'What I want from you today',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Don't quit. Don't add anything. Don't change anything. Just keep logging. The numbers will move on a curve, not a switch — and the curve doesn't start until Day 7.</p>`
    )}
    ${p(`I had a reader last cycle — Paul, 48 — who emailed me on Day 4. "Joel, nothing's moving. Did I do it wrong?" I told him exactly what I'm telling you. He kept going. Day 11 his sleep changed. Day 14 his morning number dropped 9 points. He still emails me sometimes, two years later.`)}
    ${p(`The kit you bought is doing its work right now, even if the cuff isn't telling you about it yet.`, { margin: '0 0 28px' })}
    ${p(`I'll see you on Day 7 — when I unpack what the three pressures actually are, and which one of them your kit is most likely targeting.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you're tempted to quit today, that's not a sign you bought the wrong thing. It's a sign the curve hasn't hit yet. Stay in.`)}
    ${diagnosticUpsell({
      kicker: 'For readers who plateau hard',
      body: 'Some readers get past Day 7 and still see no movement. That\'s usually a signal that the loudest corner of their Triangle is one the kit doesn\'t fully address. The diagnostic is built for exactly that case — sixty minutes, your full picture, a written protocol that names the specific corner.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I want to talk about today specifically — because today is the day the math is the cruelest.

Day 1: high excitement.
Day 2: still motivated.
Day 3: numbers haven't moved.
Day 4: quiet decision. Kit goes in a drawer.

I've watched this pattern for ten years. It's not a moral failing. It's a math problem.

Blood pressure doesn't move on a daily curve. It moves on a weekly curve.

The three pressures driving your top number operate on different clocks:
- Stress Pressure (cortisol): 5-7 days
- Sugar Pressure (insulin): 10-14 days
- Pipe Pressure (vascular): 14-21 days

When you read your cuff on Day 4 and see the same number, you're not seeing a failed protocol. You're seeing a body that hasn't reached the response window yet.

WHAT I WANT FROM YOU TODAY:
Don't quit. Don't add anything. Just keep logging. The curve doesn't start until Day 7.

Paul, 48 — emailed me Day 4. "Did I do it wrong?" I told him what I'm telling you. He kept going. Day 14 his morning number dropped 9 points.

I'll see you on Day 7 when I unpack the three pressures.

Joel
RN, BraveWorks

P.S. If you're tempted to quit today, that's not a sign you bought the wrong thing. The curve hasn't hit yet. Stay in.

—
For readers who plateau hard:
Some readers get past Day 7 and still see no movement. The diagnostic names the specific corner.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — Three Pressures deep-teach ───────────────────────────────
const day7 = {
  subject: 'The Pressure your kit didn\'t fully address',
  subjectB: 'What the $17 starter can\'t do alone',
  preview: 'The kit is the map. Your body is the territory.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`One week in. Let me give you the framework I use with every patient I've ever worked with on blood pressure.`)}
    ${p(`I call it the <strong>BP Triangle Method™</strong>, and it's not complicated. It just says one thing:`, { margin: '0 0 28px' })}
    ${bigQuote('Your blood pressure isn\'t one problem. It\'s three pressures stacking on top of each other.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 1 — Stress Pressure (cortisol)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">The pressure your nervous system creates when your body is in fight-or-flight too often. Hallmarks: waking at 3 AM, racing pulse at rest, white-coat spikes, BP that drops on vacation. If your loudest corner is this one — your kit's breathing and tea swaps are doing the most work.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 2 — Sugar Pressure (insulin)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">The pressure that high insulin creates by holding sodium and pulling water into your vessels. Hallmarks: belly weight, afternoon energy crashes, A1C creeping up, blood sugar &gt; 100 fasting. If your loudest corner is this one — your kit's carb and meal-timing notes are doing the most work.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Corner 3 — Pipe Pressure (vascular)</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">The pressure created by the stiffness of your arteries themselves. Hallmarks: top number much higher than bottom, age 60+, family history of stroke, slow recovery from exertion. If your loudest corner is this one — your kit's potassium and herb sections are doing the most work.</p>
    `)}
    ${p(`Here's the catch — and this is the thing I have to say honestly because I owe you the truth:`, { margin: '0 0 18px' })}
    ${p(`<strong>The kit is a great map. But it can't tell you which corner is loudest in YOUR Triangle.</strong>`)}
    ${p(`It treats all three corners as if they're equally weighted, because it has to — it doesn't know if you're a Stress-loudest reader or a Sugar-loudest reader or a Pipe-loudest reader. It can't see your readings. It can't ask you about your sleep. It can't look at your med list. It does its best general work.`)}
    ${p(`Some of you have a kit that's hitting your loudest corner squarely. Your numbers are already moving. Stay the course.`)}
    ${p(`Some of you have a kit that's working on the wrong corner. Your numbers won't move much until somebody — me, your doctor, you yourself — names the real loudest corner.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'A quick self-check',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Look at the three corners above. Which one do you suspect is loudest in your body? Don't pick more than one.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If you'd like a real answer instead of a suspicion, that's what the diagnostic call is for — but a guess this week is better than no guess.</p>`
    )}
    ${p(`Day 10, I'm going to show you what 60 minutes with me actually looks like — and why a few of you are going to ladder up to that conversation in the next two weeks.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Reply with one word — "Stress," "Sugar," or "Pipe" — and tell me which corner you think is loudest. I read them. I track them. It tells me which emails to send next.`)}
    ${diagnosticUpsell({
      kicker: 'Naming the loudest corner',
      body: 'The single thing the BP Triangle Diagnostic does is name your loudest corner — definitively, based on your readings, meds, sleep, and labs if you have them. Sixty minutes. A written protocol pointing at the right corner. That\'s the whole point.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

One week in. Let me give you the framework I use with every patient.

The BP Triangle Method: your blood pressure isn't one problem. It's three pressures stacking.

CORNER 1 — STRESS PRESSURE (cortisol)
Waking at 3 AM, racing pulse at rest, white-coat spikes. If this is loudest, your kit's breathing and tea work hardest.

CORNER 2 — SUGAR PRESSURE (insulin)
Belly weight, afternoon crashes, A1C creeping. If this is loudest, your kit's carb and meal-timing notes work hardest.

CORNER 3 — PIPE PRESSURE (vascular)
Top number much higher than bottom, age 60+, family stroke history. If this is loudest, your kit's potassium and herb sections work hardest.

Here's the catch:

The kit is a great map. But it can't tell you which corner is loudest in YOUR Triangle.

It treats all three corners as if they're equally weighted because it has to. It can't see your readings, your sleep, your meds.

Some of you have a kit hitting your loudest corner squarely. Some of you have a kit working on the wrong corner.

A QUICK SELF-CHECK: Which corner do you suspect is loudest? Pick one.

Day 10, I'll show you what 60 minutes with me looks like.

Joel
RN, BraveWorks

P.S. Reply with one word — "Stress," "Sugar," or "Pipe" — and tell me which corner. I track them.

—
Naming the loudest corner:
The diagnostic names your loudest corner definitively. Sixty minutes. Written protocol.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 10 — First $297 Diagnostic seed ──────────────────────────────
const day10 = {
  subject: '60 minutes with me. Personalized.',
  subjectB: 'I\'d like to look at your numbers',
  preview: 'A buyer-only door I want you to know about.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Ten days in. Time to introduce you to something I haven't mentioned yet.`)}
    ${p(`After buyers run the kit protocol for a couple weeks, a small group of them — usually 1 in 8 — wants more than a PDF can give. They want eyes on their actual log. They want a real answer about which corner of their Triangle is loudest. They want a written, personal protocol with their name on it, not a generic one.`)}
    ${p(`For that group, I run a thing called the <strong>BP Triangle Diagnostic Session</strong>.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What it is:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Sixty minutes with me on Zoom. You bring your home BP log, your medication list, your supplements, and whatever's been in the way. I bring twenty years of ICU and naturopathic experience.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">In that hour I name your loudest Triangle corner, walk you through what's driving it in your specific body, and write you a 30-day protocol you can start the next morning.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">You also walk out with a doctor-conversation script — what to say at your next appointment to have a real conversation about your medication and your numbers, instead of getting six minutes and another renewal.</p>
    `)}
    ${p(`Standard price: $297.`)}
    ${p(`Because you already bought the kit, <strong>your $17 applies as a credit</strong> — so you pay $280 at checkout, not $297. That credit doesn't expire. It just sits there until you decide.`)}
    ${p(`I'm not asking you to book today. Most readers who eventually book do it around Day 14-21 — after they've had enough cuff data to know whether they're moving or plateauing on the kit alone.`)}
    ${p(`I'm telling you about it now because I want you to know the door exists.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Honest math on capacity',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">I take six diagnostic calls per month. That's the cap — not a marketing number, the actual calendar limit when you do this alongside everything else. When the month fills, the next opening is the first of the next month.</p>`
    )}
    ${p(`Over the next ten days I'm going to share two more pieces — a story (Patricia's), and a deep-teach on what actually happens in the call. By Day 17 you'll know whether this is for you, and you'll have enough information to decide without me pushing.`)}
    ${p(`If you already know, here's the link. Otherwise, sit with it.`, { margin: '0 0 28px' })}
    ${ctaButton(COACHING_URL, 'See how the diagnostic works')}
    ${joelSignoff()}
    ${psBox(`The diagnostic isn't for everyone. If your kit is moving your numbers and you're happy with the pace, stay the course. The door is here when you want it — not before.`)}
    ${diagnosticUpsell({
      kicker: 'Want to read the page first?',
      body: 'Most readers click through to the diagnostic page once, read it, close it, then come back a few days later. That\'s a healthy pattern. The page lays out exactly what happens, what you walk out with, and the calendar capacity.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Ten days in. Time to introduce you to something I haven't mentioned yet.

After buyers run the kit for a couple weeks, a small group — usually 1 in 8 — wants more than a PDF. They want eyes on their actual log. A real answer about their loudest Triangle corner. A written, personal protocol with their name on it.

For that group, I run a thing called the BP Triangle Diagnostic Session.

WHAT IT IS:
Sixty minutes with me on Zoom. You bring your home BP log, medications, supplements, and whatever's been in the way.

I name your loudest Triangle corner, walk you through what's driving it in YOUR body, and write you a 30-day protocol you can start the next morning.

You also walk out with a doctor-conversation script for your next appointment.

Standard price: $297.

Because you bought the kit, your $17 applies as credit — you pay $280 at checkout. That credit doesn't expire.

HONEST MATH ON CAPACITY: I take six diagnostic calls per month. When a month fills, next opening is the first of the next month.

I'm not asking you to book today. Most readers book around Day 14-21 — after they've had enough cuff data to know whether they're moving or plateauing.

I'm telling you now because I want you to know the door exists.

SEE HOW THE DIAGNOSTIC WORKS:
→ ${COACHING_URL}

Joel
RN, BraveWorks

P.S. The diagnostic isn't for everyone. If your kit is moving your numbers, stay the course. The door is here when you want it.

—
Want to read the page first?
Most readers click through, read it, close it, come back a few days later. Healthy pattern.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 13 — Patricia case study (BAB) ───────────────────────────────
const day13 = {
  subject: 'Patricia walked out with a different protocol',
  subjectB: 'What happens in 60 minutes',
  preview: 'BEFORE: stuck at 148/92. AFTER: a different plan entirely.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want to tell you about Patricia.`)}
    ${p(`(Patricia isn't her real name — I don't use real names in these emails to protect my buyers. But she's real. The numbers are hers.)`, { margin: '0 0 28px' })}
    ${bigQuote('Before.')}
    ${p(`Patricia is 58. Retired teacher. Two grandkids. Has been on lisinopril, amlodipine, and a low-dose diuretic for eight years. Her morning readings had hovered in the low 140s over high 80s for the last four of those years — same range, no movement, despite watching her diet and walking three days a week.`)}
    ${p(`She found me through TikTok. Bought the BP Reset Kit. Ran the 10-day protocol. Saw her morning number drop to 138/86 by Day 9 — measurable, but not the leap she wanted. Plateaued there for the next ten days.`)}
    ${p(`On Day 21, she emailed me one sentence: "Joel, I think I need more help than the PDF can give."`)}
    ${p(`I sent her the link to the diagnostic. She booked it three days later.`, { margin: '0 0 28px' })}
    ${bigQuote('After.')}
    ${p(`Sixty minutes on Zoom. She brought her cuff log (twenty-one mornings of data), her medication bottles on screen, and a list of every supplement in her cabinet.`)}
    ${p(`What I saw in the first ten minutes: she'd been chasing the wrong corner of her Triangle for years.`)}
    ${p(`Her kit was a great Pipe-Pressure kit. It hit her potassium intake, her vessel-elastic herbs, her hydration. All correct work.`)}
    ${p(`But her loudest corner was <strong>Stress Pressure</strong>. The signs were everywhere in her log — readings that dropped 12 points on her Saturday mornings, a 3 AM waking pattern she'd had for two years, a resting pulse of 78 that shouldn't have been there for a woman with her sleep history. The Pipe work was helping, but it was working second-fiddle to a louder driver that nobody had named.`)}
    ${p(`We restructured her protocol in real time. We pulled two supplements out, kept three, added one targeted at her HPA axis and one at her sleep architecture. We rewrote her evening routine. We built her a doctor-conversation script — because two of the three meds she was on had been prescribed when her loudest corner was different from what it is now.`, { margin: '0 0 28px' })}
    ${bigQuote('Bridge.')}
    ${p(`Patricia walked out of that call with a completely different protocol than the one she'd been running. Not because the kit was wrong — but because the kit was answering a different question than the one her body was actually asking.`)}
    ${p(`Three weeks later her morning number was 124/78. Her cardiologist reduced one of her meds at her next appointment. She emails me every six weeks now with a quick log update.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What Patricia got that the kit alone couldn't give her:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ The name of her actual loudest Triangle corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ A written 30-day protocol pointed at that specific corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ A doctor-conversation script she actually used.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ A buyer-only 30-day email follow-up window with me — so she wasn't alone the first month.</p>
    `)}
    ${p(`If you've been logging for two weeks and your numbers have plateaued the way Patricia's did — the door is the same one she walked through.`, { margin: '0 0 28px' })}
    ${ctaButton(COACHING_URL, 'See how the diagnostic works')}
    ${joelSignoff()}
    ${psBox(`Patricia's $17 kit purchase applied as credit, same as yours will. She paid $280 at checkout, not $297. Same arrangement is still there for you.`)}
    ${diagnosticUpsell({
      kicker: 'The same door Patricia walked through',
      body: 'Sixty minutes. Personalized protocol. Doctor script. Thirty-day follow-up window. Your $17 already applied as credit — $280 net.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I want to tell you about Patricia.

(Patricia isn't her real name — I protect my buyers. But she's real. The numbers are hers.)

BEFORE.
Patricia is 58. Retired teacher. On lisinopril, amlodipine, and a low-dose diuretic for eight years. Morning readings hovered in the low 140s over high 80s for four years — no movement.

She bought the BP Reset Kit. Ran the protocol. Dropped to 138/86 by Day 9. Plateaued there for ten more days.

Day 21 she emailed me: "Joel, I think I need more help than the PDF can give."

She booked the diagnostic three days later.

AFTER.
Sixty minutes on Zoom. She brought her log (21 mornings), her med bottles, her supplements.

What I saw in the first ten minutes: she'd been chasing the wrong corner of her Triangle for years.

Her kit was a great Pipe-Pressure kit. But her loudest corner was Stress Pressure — readings dropped 12 points on Saturdays, 3 AM waking pattern, resting pulse of 78. The Pipe work was helping, but it was second-fiddle to a louder driver nobody had named.

We restructured her protocol in real time. Pulled two supplements out, kept three, added one for HPA axis, one for sleep architecture. Rewrote her evening routine. Built her a doctor script.

BRIDGE.
Patricia walked out with a completely different protocol. Three weeks later: 124/78. Cardiologist reduced one of her meds.

WHAT THE KIT ALONE COULDN'T GIVE HER:
→ The name of her actual loudest corner
→ A protocol pointed at that specific corner
→ A doctor-conversation script she actually used
→ A 30-day email follow-up window with me

If you've been logging two weeks and you're plateauing like Patricia did — the door is the same one she walked through.

SEE HOW THE DIAGNOSTIC WORKS:
→ ${COACHING_URL}

Joel
RN, BraveWorks

P.S. Patricia's $17 kit purchase applied as credit. She paid $280, not $297. Same for you.

—
The same door Patricia walked through:
Sixty minutes. Personalized protocol. Doctor script. 30-day follow-up. $280 net.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 15 — Mechanism teach ─────────────────────────────────────────
const day15 = {
  subject: 'What I actually do in the diagnostic call',
  subjectB: 'The 4 things I look at first',
  preview: 'A walkthrough of the 60 minutes, hour-by-hour.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`After Day 13, a handful of you wrote back and asked the same question — different words, same heart of it:`, { margin: '0 0 28px' })}
    ${bigQuote('"What do you actually DO in those sixty minutes?"')}
    ${p(`Fair question. Here's the honest answer, hour by hour.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Minutes 0-10 — Your log.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">You share your screen or paste your readings in chat. I look for four patterns: variance by day-of-week, variance by time-of-day, the gap between top and bottom number, and your average resting pulse. Each pattern points to a different Triangle corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Minutes 10-25 — Your meds and supplements.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">We go through every bottle. I'm looking for two things: medication interactions you might not know about, and supplements that are either redundant with each other or — more often — pulling against your meds. About half of buyers walk in over-supplementing for the wrong corner.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Minutes 25-40 — Your story.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">I ask about your sleep, your stress, your work, your loved ones. The Triangle has clinical signals, but the loudest corner almost always has a life signal too. The 3 AM waking pattern. The Sunday-night dread. The grief you didn't realize was sitting in your chest. This is where the picture comes together.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Minutes 40-60 — Your protocol.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">We build it together, on screen. I type. You watch. Every change has a reason next to it. Every herb has a dose range. Every habit has a "do this on Monday, do that on Wednesday" rhythm. By the time we hang up, you have a written 30-day protocol in your inbox — not "general best practices," a specific plan with your name on it.</p>
    `)}
    ${p(`After the call you also get:`)}
    ${p(`<strong>→ A doctor-conversation script.</strong> Plain language. Three things to ask, two things to push back on. Most patients walk into an appointment without language. You'll walk in with it.`)}
    ${p(`<strong>→ Thirty days of email follow-up with me.</strong> Buyer-only. If your numbers do something unexpected in week two or three, you don't have to wait six months. You write me. I write back.`)}
    ${p(`<strong>→ Your $17 credit, applied.</strong> $280 at checkout, not $297.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'What the diagnostic is NOT',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It's not a doctor's appointment. I'm not your physician, and the protocol is built to work alongside your meds — never instead of them.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It's not a sales call for a bigger program. Some readers eventually join the 90-day cohort. Most don't. The diagnostic stands on its own.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">It's not for someone who hasn't run the kit yet. Run the kit first. Plateau if you're going to plateau. THEN book if it's right.</p>`
    )}
    ${p(`Day 17, I'll address the four objections I hear most often. After that, you'll have everything you need to decide.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you want to see the diagnostic page before Day 17, the link is below. Some readers like to read it three times before they decide. That's fine. That's exactly the kind of reader who does well on the call.`)}
    ${diagnosticUpsell({
      kicker: 'See the full mechanism',
      body: 'The diagnostic page lays out every detail — the four patterns I look for in your log, the doctor script, the thirty-day follow-up window, the calendar capacity. Read it as many times as you need.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

After Day 13, a handful of you asked the same question:

"What do you actually DO in those sixty minutes?"

Fair question. Honest answer, hour by hour.

MINUTES 0-10 — YOUR LOG.
You share your readings. I look for four patterns: variance by day-of-week, variance by time-of-day, the gap between top and bottom number, and resting pulse. Each points to a different Triangle corner.

MINUTES 10-25 — YOUR MEDS AND SUPPLEMENTS.
We go through every bottle. About half of buyers walk in over-supplementing for the wrong corner.

MINUTES 25-40 — YOUR STORY.
Sleep, stress, work, loved ones. The Triangle has clinical signals, but the loudest corner almost always has a life signal too.

MINUTES 40-60 — YOUR PROTOCOL.
We build it together. I type. You watch. Every change has a reason. Every herb has a dose. Every habit has a "Monday-Wednesday" rhythm. Written 30-day protocol in your inbox by the end.

AFTER THE CALL:
→ Doctor-conversation script — three things to ask, two to push back on
→ 30 days of email follow-up with me (buyer-only)
→ Your $17 credit applied — $280 at checkout, not $297

WHAT THE DIAGNOSTIC IS NOT:
- Not a doctor's appointment (protocol works alongside meds, never instead)
- Not a sales call for a bigger program
- Not for someone who hasn't run the kit yet

Day 17, I'll address the four objections I hear most often.

Joel
RN, BraveWorks

P.S. Some readers like to read the diagnostic page three times before they decide. That's exactly the kind of reader who does well on the call.

—
See the full mechanism:
The page lays out every detail. Read it as many times as you need.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 17 — Objection killer + credit math ──────────────────────────
const day17 = {
  subject: 'What if I told you the diagnostic IS the deposit?',
  subjectB: '$280 after your $17 credit',
  preview: 'The four objections I hear — answered honestly.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Let me answer the four things that are probably stopping you. Not with sales talk — with the real answer.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Objection #1 — "$297 is a lot."',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It is. And it's also the price of two months of supplements you may already be buying for the wrong corner of your Triangle.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Remember: your $17 kit purchase already applied as a credit. The actual checkout shows <strong>$280</strong>, not $297.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If you ever move on to the deeper 90-day cohort, your $280 from the diagnostic stacks as another credit toward that. Nothing you spend with me gets spent twice.</p>`
    )}
    ${clayBlock(
      'Objection #2 — "I haven\'t finished the kit."',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Then finish it. Don't book yet.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">The diagnostic works best on a reader with 14-21 days of cuff data. If you don't have that yet, you'd be paying for a call where I can't see enough of your pattern to give you the best answer.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Keep logging. The door is here when the data is.</p>`
    )}
    ${clayBlock(
      'Objection #3 — "What if my case is different?"',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">It probably isn't, in the way you mean. In ten years of this work, I've seen maybe fifteen genuinely unusual cases. The other thousand-plus all fit cleanly into one of the three Triangle corners as the loudest driver.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">If you're in one of the rare unusual buckets, I'll tell you in the first ten minutes of the call. I'll refund you on the spot. You don't pay for sixty minutes when the right answer is "this needs a different specialist."</p>`
    )}
    ${clayBlock(
      'Objection #4 — "Will my doctor be on board?"',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">Most doctors are not hostile to a written, sober protocol that runs <em>alongside</em> medication. They're hostile to "I read on TikTok that I should stop my lisinopril." Those are different conversations.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">The doctor-conversation script we build is designed to make your physician your partner, not your obstacle. Patricia's cardiologist (Day 13) was on board. Linda's was on board. Paul's primary actually thanked him.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">"AND not INSTEAD OF." Protocol with pills, never instead of pills. That's the rule.</p>`
    )}
    ${p(`<strong>The credit math, one more time:</strong>`)}
    ${p(`Standard diagnostic price: $297.`)}
    ${p(`Your kit purchase (applied as credit): −$17.`)}
    ${p(`Your checkout: <strong>$280.</strong>`, { margin: '0 0 28px' })}
    ${ctaButton(COACHING_URL, 'See how the diagnostic works')}
    ${p(`Day 19 I'll let you know the real number of slots left this month. Day 21 is the last email I send about this — after that, you'll move to a quieter list and I'll stop mentioning it unless you ask.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Reply with the objection I didn't cover, if there is one. If it's a real one, I'll write back. If it's the same one in different words, I'll tell you that too.`)}
    ${diagnosticUpsell({
      kicker: 'The credit doesn\'t expire',
      body: 'Whether you book this month or three months from now, your $17 stays applied. The diagnostic page has the full breakdown of what you walk out with — read it, then decide on your own timeline.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Let me answer the four things probably stopping you. Real answers.

OBJECTION #1 — "$297 is a lot."
It is. It's also the price of two months of supplements you may be buying for the wrong corner.
Your $17 kit purchase already applied as credit. Actual checkout: $280, not $297.
If you ever move to the 90-day cohort, your $280 stacks as another credit. Nothing gets spent twice.

OBJECTION #2 — "I haven't finished the kit."
Then finish it. Don't book yet.
The diagnostic works best on 14-21 days of cuff data. The door is here when the data is.

OBJECTION #3 — "What if my case is different?"
It probably isn't, in the way you mean. In ten years I've seen maybe fifteen genuinely unusual cases. The other thousand-plus fit into one of the three Triangle corners as the loudest driver.
If you're in a rare bucket, I'll tell you in the first ten minutes and refund on the spot.

OBJECTION #4 — "Will my doctor be on board?"
Most doctors aren't hostile to a written, sober protocol that runs alongside meds. They're hostile to "I read on TikTok that I should stop my lisinopril."
The doctor script we build makes your physician your partner.
AND not INSTEAD OF. Protocol with pills, never instead.

THE CREDIT MATH:
$297 standard
−$17 kit credit
= $280 at checkout

SEE HOW THE DIAGNOSTIC WORKS:
→ ${COACHING_URL}

Day 19 I'll share the real slot count. Day 21 is the last email I send about this.

Joel
RN, BraveWorks

P.S. Reply with the objection I didn't cover. If it's real, I'll write back.

—
The credit doesn't expire:
Whether you book this month or three months from now, your $17 stays applied.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 19 — Honest scarcity (cap = 5/month, no countdown) ──────────
// 2026-05-18: Joel's rule — "remove slots left but say I only take 5."
// We don't run countdowns ("X seats left") because they make the inbox
// feel like a marketing engine. We name the actual cap (5 per month)
// once, then trust the reader to decide.
const day19 = {
  subject: 'I only take 5 of these a month',
  subjectB: 'The cap is real. No countdown.',
  preview: 'No fake scarcity. Just the actual number that fits on my calendar.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick, honest update on availability.`)}
    ${p(`<strong>I only take 5 diagnostic calls a month.</strong> That's the cap. It's not a marketing number — it's what fits on my actual calendar when I do this work alongside the cohort, the writing, and the rest of my life.`)}
    ${p(`I'm not going to run a countdown on you. "Three seats left, two seats left, one seat" — that's marketing theater and most of my readers see through it. I just want you to know the cap exists, so you can decide whether this month or next month is right for you.`, { margin: '0 0 28px' })}
    ${clayBlock(
      'Why the cap matters to you',
      `<p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">If you book inside the month I have a spot, you can be running a personalized protocol within seven days.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 10px;">If you wait for next month's window, that's another four to six weeks of logging the same kit, hoping the corner you're working on is the right one. Sometimes that's fine — sometimes it's a month you don't get back.</p>
       <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">You know your own urgency better than I do. I'm just naming the calendar.</p>`
    )}
    ${p(`If the month is already full when you write me, I'll tell you that directly. You go on the list for the next month and I lock you in the moment the new window opens. Same credit, same $280 net after your kit.`, { margin: '0 0 28px' })}
    ${p(`If you've been on the fence and the kit is plateauing — this is the window. Not because I'm pressuring you. Because five-per-month is real.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Who should book this week:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You've logged 14+ mornings of readings.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You've seen some movement on the kit but you're plateauing.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ You suspect (from Day 7) that one Triangle corner is loudest, and you want it confirmed or corrected.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ You'd rather know definitively than guess for another month.</p>
    `)}
    ${p(`Who should wait:`)}
    ${p(`→ You haven't run the kit through Day 14 yet. (Run it. Plateau. Then book.)`)}
    ${p(`→ Your numbers are dropping steadily on the kit alone. (Stay the course. The kit is doing it for you.)`)}
    ${p(`→ You're in a season where Zoom feels heavy. (Wait. The credit doesn't expire. June or July is fine.)`, { margin: '0 0 28px' })}
    ${ctaButton(COACHING_URL, 'See how the diagnostic works')}
    ${p(`Tomorrow you have a quiet day. Day 21 is the last email I send in this sequence. Then you graduate to a calmer cadence — one email per week instead of every two or three days.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you want to know whether a specific morning works on the calendar without committing yet, hit reply with the day. I'll tell you what's open. No commitment to book.`)}
    ${diagnosticUpsell({
      kicker: '5 a month — real cap, no countdown',
      body: 'Your $17 credit is already applied. Sixty minutes, written protocol, doctor script, 30-day follow-up. $280 net.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Quick, honest update on availability.

I ONLY TAKE 5 DIAGNOSTIC CALLS A MONTH. That's the cap. Not a marketing number — what fits on my actual calendar.

I'm not going to run a countdown on you. "Three seats left, two seats left, one seat" — that's marketing theater and most of my readers see through it. I just want you to know the cap exists, so you can decide whether this month or next month is right for you.

WHY THE CAP MATTERS TO YOU:
If you book inside the month I have a spot, you can be running a personalized protocol within seven days.
If you wait for next month's window, that's another 4-6 weeks of logging the same kit, hoping the corner you're working on is the right one.

If the month is already full when you write me, I'll tell you that directly. You go on the list for the next month and I lock you in the moment the new window opens. Same credit, same $280 net after your kit.

WHO SHOULD BOOK THIS WEEK:
→ You've logged 14+ mornings
→ You've seen some movement but you're plateauing
→ You suspect one Triangle corner is loudest and want it confirmed
→ You'd rather know definitively than guess for another month

WHO SHOULD WAIT:
→ You haven't run the kit through Day 14 yet (run it, plateau, then book)
→ Numbers dropping steadily on the kit (stay the course)
→ Zoom feels heavy this season (wait — credit doesn't expire)

SEE HOW THE DIAGNOSTIC WORKS:
→ ${COACHING_URL}

Day 21 is the last email I send in this sequence. Then a calmer cadence.

Joel
RN, BraveWorks

P.S. Want to know whether a specific morning works on the calendar? Hit reply with the day. No commitment to book.

—
5 a month — real cap, no countdown:
$17 credit already applied. $280 net.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 21 — Last call + graceful exit ───────────────────────────────
const day21 = {
  subject: 'Last email I\'ll send about this',
  subjectB: 'If not now, when?',
  preview: 'I\'ll quiet down after this. Promise.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This is the last email I send you about the diagnostic.`)}
    ${p(`Three weeks ago you bought a $17 or $47 kit. You've gotten nine emails from me since — protocol notes, the Three Pressures framework, Patricia's story, the mechanism walkthrough, the objections, the slot count.`)}
    ${p(`From tomorrow on, you graduate to a quieter list. One email a week. Mostly teaching, a little story, the occasional invitation. The pressure stops.`, { margin: '0 0 28px' })}
    ${bigQuote('Before that switch flips, one last word.')}
    ${p(`If you've been on the fence about the diagnostic, here's what I want you to know:`)}
    ${p(`<strong>The decision isn't $280 versus $0.</strong> The decision is between knowing the loudest corner of your Triangle in seven days, or guessing at it for another month — maybe another six.`)}
    ${p(`Patricia guessed at hers for four years before we named it. Linda guessed for nine. Paul guessed for two. Rachel guessed for six. All four of them, after the diagnostic, told me the same thing in different words: <em>"I wish I'd done this six months ago."</em>`)}
    ${p(`I'm not saying that to push you. I'm saying it because four readers in a row said it and it might be true for you too.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">If now is your moment:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Book before the last slot fills this month. Your $17 credit is applied. Checkout shows $280. The next four to six weeks become a personalized 30-day protocol with email follow-up, instead of another stretch of the same plateau.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">If now is NOT your moment:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">That's a real answer. Keep using the kit. Keep logging. The credit doesn't expire. Three months from now, six months from now, a year from now — the door is the same door, your $17 still applies.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">When you're ready, you'll know. Until then, the weekly emails from this point forward are content-only — no pitches, no urgency.</p>
    `)}
    ${ctaButton(COACHING_URL, 'See how the diagnostic works')}
    ${p(`Whichever path you take, I want to say thank you. Three weeks ago you trusted me with $17 or $47 on a hunch. Most people don't follow through on hunches. You did. The fact that you read this email — the tenth one in a row from a guy you don't really know yet — tells me you're the kind of reader I want around for a long time.`, { margin: '0 0 28px' })}
    ${p(`Tomorrow's email is shorter, calmer, and on a different topic entirely. I'll see you there.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've decided the diagnostic isn't for you and you'd like me to stop mentioning it entirely going forward, just reply with "not now." I'll tag your record and the weekly emails won't reference it. Your call.`)}
    ${diagnosticUpsell({
      kicker: 'Last note in the sequence',
      body: 'After today, no more pitches in this arc. If you want the door, here it is. If not, the weekly emails carry on quietly. Either way — thank you for being here.',
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This is the last email I send you about the diagnostic.

Three weeks ago you bought a $17 or $47 kit. Nine emails since — protocol notes, Three Pressures, Patricia's story, mechanism walkthrough, objections, slot count.

From tomorrow on, you graduate to a quieter list. One email a week. The pressure stops.

Before that switch flips, one last word.

If you've been on the fence about the diagnostic:

The decision isn't $280 versus $0. The decision is between knowing the loudest corner of your Triangle in seven days, or guessing at it for another month — maybe another six.

Patricia guessed for four years. Linda guessed for nine. Paul guessed for two. Rachel guessed for six. All four, after the diagnostic, said the same thing: "I wish I'd done this six months ago."

IF NOW IS YOUR MOMENT:
Book before the last slot fills. $17 credit applied. $280 at checkout. Next 4-6 weeks become a personalized protocol with email follow-up.

IF NOW IS NOT YOUR MOMENT:
That's a real answer. Keep using the kit. Keep logging. The credit doesn't expire. Three months, six months, a year from now — same door, $17 still applied.

When you're ready, you'll know. The weekly emails from here are content-only — no pitches, no urgency.

SEE HOW THE DIAGNOSTIC WORKS:
→ ${COACHING_URL}

Whichever path you take — thank you. Three weeks ago you trusted me with $17 or $47 on a hunch. Most people don't follow through on hunches. You did.

Tomorrow's email is shorter, calmer, and on a different topic.

Joel
RN, BraveWorks

P.S. If you'd like me to stop mentioning the diagnostic entirely, reply with "not now." I'll tag your record. Your call.

—
Last note in the sequence:
After today, no more pitches in this arc. Either way — thank you for being here.
→ ${COACHING_URL}

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
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
  21: day21,
};

// Idempotency flag name — cron skips already-sent emails by checking this.
export function tier1SentFlag(day) {
  return `tier1Day${day}Sent`;
}
