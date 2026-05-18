// api/_tier-3-emails.js
//
// 10-email sequence for $297 BP Triangle Diagnostic buyers (state = 'tier-3').
// Goal: convert to Cohort 2 ($1,997, $297 credit → $1,700 net) by Day 14.
//
// Replaces the legacy 7-email `_diagnostic-drip-emails.js`. Voice, Patricia
// case study, Wakita case study, Cohort 2 reveal, and credit math are
// preserved. Three new emails added — Day 0 (confirmation + prep), Day 9
// (objection killer #1), Day 11 (objection killer #2), Day 12 (scarcity).
// Day 10 carries the future-self note that used to live on Day 11.
//
// Cadence (from daysSinceTier3EnteredAt):
//   0  — Confirmation + Calendly + 4-thing prep checklist
//   1  — Patricia: why the diagnostic exists (Soap Opera Ep 1)
//   3  — The three paths after the call (Cohort 2 introduced gently)
//   5  — Wakita's first 30 days inside the Sprint (BAB)
//   7  — Cohort 2 reveal: full pitch + credit math (PASTOR)
//   9  — Objection killer #1: "I'm not ready"
//   10 — Future-self: 90 days from today
//   11 — Objection killer #2: "Will this work for MY situation?"
//   12 — Cohort 2 caps + scarcity (12 seats, 4 left)
//   14 — Final close OR graceful exit (PASTOR + close)
//
// Pitch direction (HARD): Cohort 2 only. Never the $97 Challenge (sideways).
// Never the $17/$47 kits (they have what those teach).
//
// Author: BraveWorks RN · state-machine email rebuild · 2026-05-18

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

// $1,700 credit-applied Stripe Payment Link (env override falls back to /cohort2)
export const SPRINT_CREDIT_URL =
  process.env.VITE_STRIPE_SPRINT_WITH_DIAGNOSTIC_CREDIT_LINK || COHORT2_URL;

// Calendly for the 60-minute diagnostic
export const CALENDLY_URL =
  process.env.VITE_CALENDLY_DIAGNOSTIC_URL || 'https://calendly.com/braveworksrn/60min';

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

// Unsub strip — appended to every email. The cron passes in `unsubUrl`.
function unsubStrip(unsubUrl) {
  return `<p style="font-size:11px;color:#9C9485;line-height:1.6;margin:20px 0 0;text-align:center;">
    BraveWorks RN · Joel Polley, RN · Educational content only. Not medical advice. Always work alongside your physician.<br/>
    <a href="${unsubUrl}" style="color:#9C9485;">Unsubscribe from these messages</a>
  </p>`;
}

// ─────────────────────────────────────────────────────────────────────
// DAY 0 — Confirmation + Calendly + 4-thing prep checklist
// ─────────────────────────────────────────────────────────────────────
const day0 = {
  subject: 'Your diagnostic is booked — 4 things to send me',
  subjectB: 'Before we talk: 4 things',
  preview: 'A quick prep note before our 60 minutes together. Bring what you have.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Your BP Triangle Diagnostic is booked. Thank you for trusting me with the next 60 minutes of your story.`)}
    ${p(`I read every intake the night before. The more I see ahead of time, the less of our call we burn on paperwork — and the more of it we spend on what actually moves your numbers.`)}
    ${bigQuote('Four things. Bring what you have.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Send these to braveworksrn@gmail.com before our call:</p>
      <ol style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};padding-left:22px;margin:0;">
        <li><strong style="color:${PALETTE.text};">Your home BP log this week.</strong> Three readings is enough. Same arm, same chair, same time of day when you can. If you don't have a cuff, tell me what your last in-office reading was.</li>
        <li><strong style="color:${PALETTE.text};">Your prescription list.</strong> Photos of the bottles work — labels don't need to be pretty. Include the dose and how long you've been on each one.</li>
        <li><strong style="color:${PALETTE.text};">Your supplement list.</strong> Everything. Even the random ones. <em>Especially</em> the random ones. The supplement aisle is where most BP plans quietly go sideways.</li>
        <li><strong style="color:${PALETTE.text};">Any labs from the last twelve months.</strong> A1c, lipid panel, kidney function, thyroid, hormones if you have them. Photos of the PDFs are fine.</li>
      </ol>
    `)}
    ${p(`That's it. If you only have one or two of those, send me what you have. We'll fill in the rest on the call.`)}
    ${p(`<strong>If you haven't picked your time slot yet:</strong>`)}
    ${ctaButton(CALENDLY_URL, 'Pick your 60 minutes')}
    ${p(`I'll send you the Zoom link the day before. The morning of, I'll send a 2-minute "what we're going to cover" note so you walk in oriented.`)}
    ${p(`One more thing. The diagnostic isn't a sales call. It's a 60-minute working session where we name what's actually driving your numbers — Stress Pressure, Sugar Pressure, or Pipe Pressure — and you walk out with a written 30-day protocol that's yours to keep.`)}
    ${p(`I'm looking forward to this. If you have a question before our time, hit reply. I read every email myself.`)}
    ${joelSignoff()}
    ${psBox(`Don't stress about the prep list. If you're slammed this week and you just show up with your medication bottles in your bag, we'll still get the job done. The four things just make the 60 minutes sharper.`)}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Your BP Triangle Diagnostic is booked. Thank you for trusting me with the next 60 minutes of your story.

I read every intake the night before. The more I see ahead of time, the less of our call we burn on paperwork — and the more of it we spend on what actually moves your numbers.

FOUR THINGS. BRING WHAT YOU HAVE. Send to braveworksrn@gmail.com before our call:

1. Your home BP log this week. Three readings is enough. Same arm, same chair, same time of day when you can.
2. Your prescription list. Photos of the bottles work. Include dose and how long you've been on each one.
3. Your supplement list. Everything. Even the random ones. ESPECIALLY the random ones.
4. Any labs from the last twelve months. A1c, lipid panel, kidney, thyroid, hormones if you have them.

If you only have one or two, send what you have. We'll fill in the rest on the call.

If you haven't picked your time slot yet:
→ ${CALENDLY_URL}

I'll send you the Zoom link the day before. The morning of, I'll send a 2-minute "what we're going to cover" note so you walk in oriented.

The diagnostic isn't a sales call. It's a 60-minute working session where we name what's actually driving your numbers — Stress Pressure, Sugar Pressure, or Pipe Pressure — and you walk out with a written 30-day protocol that's yours to keep.

If you have a question before our time, hit reply. I read every email myself.

Joel
RN, BraveWorks

P.S. Don't stress about the prep list. If you're slammed this week and you just show up with your medication bottles in your bag, we'll still get the job done.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 1 — Patricia (why the diagnostic exists) — Soap Opera Ep 1
// ─────────────────────────────────────────────────────────────────────
const day1 = {
  subject: "Patricia's story — read before our call",
  subjectB: "Why I built the diagnostic in the first place",
  preview: "She bought the kit. Plateaued. Then booked the call. What flipped.",
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I want you to know why this product exists before we get on the call. Because the diagnostic didn't come out of a marketing meeting. It came out of an email I couldn't answer.`)}
    ${p(`<strong>Patricia</strong> — age 58, a year ago. She bought the BP Reset Kit. Ran the protocol. Numbers moved from 152/94 down to 138/86 in about three weeks. Then plateaued. Six weeks of holding at 138/86 with no further movement.`)}
    ${p(`She emailed me. <em>"Joel, I'm doing everything you told me. Why isn't it moving?"</em>`)}
    ${p(`I read that email three times before I realized what was happening. The kit gave her the general playbook. Her body had a specific driver the kit couldn't see. A kit is one-to-many by design. Her case needed one-to-one.`)}
    ${bigQuote('I needed to look at her case the way I used to look at patients in the ICU.')}
    ${p(`So we did a 60-minute call — the same kind we're doing — and within fifteen minutes I'd named it: her loudest Pressure was cortisol (Stress Pressure), not vascular (Pipe Pressure).`)}
    ${p(`She'd been telling herself <em>"I'm not that stressed"</em> but her morning waking pattern, her jaw tension, her 3 PM energy crashes — they were the cortisol signature. Cortisol doesn't always feel like stress. Sometimes it feels like grit.`)}
    ${p(`We didn't change much. We <strong>removed</strong> more than we added:`)}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Dropped two supplements that were spiking her cortisol cycle (a B-complex with too much niacin, and an ashwagandha she was taking at the wrong time of day).</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Added box breathing twice daily — 4 in, 4 hold, 4 out, 4 hold. Five minutes morning and night.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">→ Fixed her bedroom temperature. It was 74°F at night — too warm for nocturnal BP dipping. Dropped it to 66°F.</p>
    `)}
    ${p(`Twelve days later: <strong>128/82.</strong> Six weeks later: <strong>122/78.</strong> Her cardiologist tapered one of her two medications.`)}
    ${p(`That's the diagnostic. We name the corner. We write the protocol. The kit becomes specific instead of general.`)}
    ${p(`When we get on our call, you're going to be on a parallel arc. Each person's protocol is different — but the structure is the same: <strong>name the corner, name the moves, name the prep window.</strong> The 30-day email coaching after our call catches the adjustments as your body responds.`)}
    ${p(`So when you come to our call, come ready to tell me what isn't moving. That's the conversation. That's where the work begins.`)}
    ${joelSignoff()}
    ${psBox(`Patricia is an anonymized first name. Real case. Real numbers. I never use real names in these emails — it protects my clients and keeps the focus where it belongs. Wakita, who you'll meet on Day 5, is in the same category.`)}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

I want you to know why this product exists before we get on the call. Because the diagnostic didn't come out of a marketing meeting. It came out of an email I couldn't answer.

PATRICIA — age 58, a year ago. She bought the BP Reset Kit. Ran the protocol. Numbers moved from 152/94 down to 138/86 in about three weeks. Then plateaued. Six weeks of holding at 138/86 with no further movement.

She emailed me. "Joel, I'm doing everything you told me. Why isn't it moving?"

I read that email three times before I realized what was happening. The kit gave her the general playbook. Her body had a specific driver the kit couldn't see.

So we did a 60-minute call — the same kind we're doing — and within fifteen minutes I'd named it: her loudest Pressure was cortisol (Stress Pressure), not vascular (Pipe Pressure).

She'd been telling herself "I'm not that stressed" but her morning waking pattern, her jaw tension, her 3 PM energy crashes — they were the cortisol signature.

We REMOVED more than we added:
→ Dropped two supplements that were spiking her cortisol cycle.
→ Added box breathing twice daily. 5 minutes morning and night.
→ Fixed her bedroom temperature. 74°F was too warm. Dropped it to 66°F.

Twelve days later: 128/82. Six weeks later: 122/78. Her cardiologist tapered one of her two medications.

That's the diagnostic. We name the corner. We write the protocol. The kit becomes specific instead of general.

When we get on our call, you're going to be on a parallel arc.

Joel
RN, BraveWorks

P.S. Patricia is an anonymized first name. Real case. Real numbers. I never use real names in these emails.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 3 — The three paths after the call (Cohort 2 introduced gently)
// ─────────────────────────────────────────────────────────────────────
const day3 = {
  subject: 'Three things can happen after we talk',
  subjectB: 'The three doors from our call',
  preview: "Most people pick Path 1. A few pick Path 2. Here's when Path 3 fits.",
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Once we finish your call and you have your written protocol in hand, you have three paths. I want to lay them out now so you can think about which one fits before we talk — instead of making the decision on the call when you're already processing a lot.`)}
    ${p(`There's no "right" path. Most clients pick Path 1. A smaller number pick Path 2. Path 3 is rare but real.`)}
    ${sageBlock(`
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:8px;">Path 1 — Run the protocol solo</div>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">You take the written 30-day protocol home and run it. You email me each Sunday during the 30-day follow-up window. I read every Sunday email and answer within 24 hours.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Best for:</strong> self-starters, people whose case is straightforward, people who like learning the why before being guided through the how. Most clients pick this.</p>
    `)}
    ${clayBlock('Path 2 — Cohort 2 (90-day group sprint)', `
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">For the clients who want me in their corner daily for the next twelve weeks. Weekly group Zoom, daily WhatsApp office hours, full medication-tapering plan worked with your prescriber, partner inclusion guide. I'll tell you more about it on the call — but I want to plant the seed now.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Best for:</strong> three or more medications, complex history, partner involvement needed, the "I'm tired of guessing and I want a guide" energy.</p>
    `)}
    ${sageBlock(`
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9C9485;font-weight:700;margin-bottom:8px;">Path 3 — Just the diagnostic, see you in 90 days</div>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">You take the protocol, use the 30-day follow-up window, and if you want a re-check ninety days from now, you can book another diagnostic. No commitment beyond what you already paid.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Best for:</strong> the cautious. People who want to see results before going deeper. Nothing wrong with cautious.</p>
    `)}
    ${p(`You don't have to decide today. Just think about which one feels right when you read it. We'll talk about it on our call if you want — or we'll skip it and just work the protocol.`)}
    ${p(`Cohort 2 isn't on the public website. It's only opened to diagnostic graduates first. I'll send the full picture on Day 7 — what it is, what it's not, who it's for, and the exact math. By then you'll have had our call, and you'll have a better sense of whether your case wants a longer runway.`)}
    ${joelSignoff()}
    ${psBox(`If you've already had our call before this email lands — great. Same three paths still apply. Reply with one word — Path 1, Path 2, or Path 3 — and I'll tell you what I'd pick if I were sitting in your chair.`)}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Once we finish your call and you have your written protocol in hand, you have three paths. I want to lay them out now so you can think about which one fits before we talk.

There's no "right" path. Most clients pick Path 1. A smaller number pick Path 2. Path 3 is rare but real.

PATH 1 — RUN THE PROTOCOL SOLO
You take the written 30-day protocol home and run it. Email me each Sunday during the 30-day follow-up window. I read every Sunday email and answer within 24 hours.
Best for: self-starters, straightforward cases, people who like learning the why before the how.

PATH 2 — COHORT 2 (90-DAY GROUP SPRINT)
For the clients who want me in their corner daily for the next twelve weeks. Weekly group Zoom, daily WhatsApp office hours, full medication-tapering plan worked with your prescriber, partner inclusion guide.
Best for: 3+ medications, complex history, partner involvement needed, the "I'm tired of guessing" energy.

PATH 3 — JUST THE DIAGNOSTIC, SEE YOU IN 90 DAYS
You take the protocol, use the 30-day window, and if you want a re-check 90 days from now, you can book another diagnostic. No commitment beyond what you already paid.
Best for: the cautious.

Cohort 2 isn't on the public website. It's only opened to diagnostic graduates first. I'll send the full picture on Day 7.

Joel
RN, BraveWorks

P.S. If you've already had our call — same three paths still apply. Reply with one word (Path 1, 2, or 3) and I'll tell you what I'd pick if I were sitting in your chair.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 5 — Wakita's first 30 days inside the Sprint (BAB)
// ─────────────────────────────────────────────────────────────────────
const day5 = {
  subject: "Wakita's Sunday — a peek inside the 90-day work",
  subjectB: "Inside the Sprint — first 30 days",
  preview: "What an actual Cohort 2 week looks like, from a real client.",
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Cohort 2 is the kind of program you don't fully understand until you've seen one. So today I want to walk you through a real client's first 30 days inside the deeper work. She gave me permission to share — I'm using an anonymized first name.`)}
    ${bigQuote('Wakita — age 60. Where she started.')}
    ${p(`<strong>Before:</strong> Complex GI history, BP 145/92 morning and 138/88 afternoon, on three BP medications, dealing with chronic abdominal pain from a December hospitalization, on a Mexican naturopathic protocol that was layering complication on top of complication. Sleep broken every night at 3 AM. Loudest Pressure when we did her diagnostic: cortisol.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Week 1 — Simplification.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">First call I asked her to do <em>nothing</em> new except 25 gratitudes morning and night, and drink 84 oz of water a day with Celtic salt every 8 oz. No herbs. No protocol additions. We had to clear her cortisol noise before we could see anything. Day 4 she stopped waking at 3 AM. Day 7 she slept eight hours for the first time in two years.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Week 2 — Discontinuation.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">We pulled her off the Mexican Chaparro Amargo (it was making her pain worse) and three supplements that were redundant. She messaged me twice that week with reaction questions. Both answered same-day on WhatsApp office hours. Knowing she could ask in real-time was almost as important as the answer itself.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Week 3 — Targeted additions.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">Only THREE additions: hawthorn berry for vascular tone, magnesium glycinate at night for sleep depth, and a 10-minute walk after her largest meal. Her morning BP dropped from 145/92 to 134/86.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Week 4 — Doctor conversation.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">We drafted the conversation she'd take to her cardiologist. Specific numbers, specific labs to request, a deprescribing-language script. He listened. Reduced one of her medications by 25%. He told her he'd never had a patient bring him a script like that.</p>
    `)}
    ${bigQuote('After 30 days. Where she is now.')}
    ${p(`<strong>After:</strong> Sleeping a full night. Morning BP averaging 132/84. One medication reduced by a quarter, her cardiologist watching to taper further at the 60-day mark. Off four supplements that were creating noise. Husband participating because we briefed him in Week 2. <em>"For the first time in three years, I feel like the protocol is mine, not something I'm trying to memorize."</em>`)}
    ${p(`<strong>The bridge:</strong> She had eleven more weeks coming. By Week 12 most clients are on one to three fewer medications, sleeping a full night, and have a daily protocol so dialed it stops feeling like a program. That's what Cohort 2 buys you — not a kit, not a course, but the runway and the daily access to make the dial-ins.`)}
    ${p(`If your case is straightforward, Path 1 will get you most of the way. If your case sounds like Wakita's — complex history, multiple meds, partner needs to be brought along, cortisol noise — Path 2 is built for you.`)}
    ${p(`I'll send the full Cohort 2 picture on Day 7. Price, format, the math on your credit. For today, just sit with this picture and ask yourself: <em>does this sound like the help I want?</em>`)}
    ${joelSignoff()}
    ${psBox(`Wakita is an anonymized first name. Real case, real timeline, real numbers. She closed her Cohort 1 spot on 5/15. She let me share her arc because she said the version of her from a year ago would have wanted to read this email.`)}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Cohort 2 is the kind of program you don't fully understand until you've seen one. So today I want to walk you through a real client's first 30 days inside the deeper work.

WAKITA — age 60.

BEFORE: Complex GI history, BP 145/92 morning, on three BP meds, chronic abdominal pain, on a Mexican naturopathic protocol that was layering complication on complication. Sleep broken every night at 3 AM. Loudest Pressure: cortisol.

WEEK 1 — SIMPLIFICATION
Asked her to do NOTHING new except 25 gratitudes morning and night, and 84 oz water a day with Celtic salt. No herbs. No protocol additions. Had to clear her cortisol noise first. Day 4 she stopped waking at 3 AM. Day 7 she slept eight hours for the first time in two years.

WEEK 2 — DISCONTINUATION
Pulled her off the Mexican Chaparro Amargo and three redundant supplements. She messaged me twice with reaction questions. Both answered same-day on WhatsApp.

WEEK 3 — TARGETED ADDITIONS
Three additions: hawthorn berry, magnesium glycinate at night, 10-minute walk after her largest meal. Morning BP dropped from 145/92 to 134/86.

WEEK 4 — DOCTOR CONVERSATION
We drafted the conversation for her cardiologist. He reduced one med by 25% and told her he'd never had a patient bring him a script like that.

AFTER: Sleeping a full night. Morning BP averaging 132/84. One med reduced. Off four supplements. Husband participating. "For the first time in three years, I feel like the protocol is mine."

THE BRIDGE: She had eleven more weeks coming. By Week 12 most clients are on 1-3 fewer meds and have a daily protocol so dialed it stops feeling like a program.

I'll send the full Cohort 2 picture on Day 7. For today, sit with this and ask: does this sound like the help I want?

Joel
RN, BraveWorks

P.S. Wakita is an anonymized first name. She closed her Cohort 1 spot on 5/15. She let me share because the version of her from a year ago would have wanted to read this email.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 7 — Cohort 2 reveal — full pitch + credit math (PASTOR)
// ─────────────────────────────────────────────────────────────────────
const day7 = {
  subject: 'Cohort 2 — what it is, what it costs',
  subjectB: '$1,700 net — the math on Cohort 2',
  preview: '$297 already paid → $1,700 net. The full picture.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I told you on Day 3 I'd give you the full Cohort 2 picture this week. Today's the day.`)}
    ${p(`This is the longest email in the sequence. Take ten minutes when you can read it without distraction. I tried to put everything you'd ask on a sales call into the body so you can decide without needing to chase me down for answers.`)}
    ${bigQuote("What Cohort 2 is.")}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Twelve weeks. Small group with me, RN.</strong> Capped at twelve seats so I can actually keep my eyes on every client. Annie Chitate, RN — my wife and the hormone-corner co-coach — joins for the hormone work (about half the cases involve hormones).</p>
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Weekly group Zoom.</strong> Monday nights, 8 PM ET. We work the cohort case-by-case, live. Your numbers, your symptoms, your medication-tapering progress — and you learn from everyone else's protocols too. The cohort effect is part of why it works.</p>
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">WhatsApp office hours, group thread.</strong> Sunday through Thursday, 9 AM–5 PM ET. Drop a question, send a photo of a label, ask <em>"should I take this today?"</em> I answer same-day in front of the cohort — so every question becomes a teaching moment for everyone.</p>
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Full deprescribing plan, worked WITH your prescriber.</strong> We design the taper, you bring it to your doctor, we adjust based on their feedback. Most clients drop one to three medications inside the 90 days. Always alongside the doctor — never instead of.</p>
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Partner inclusion guide.</strong> Your spouse or partner gets a parallel 30-minute briefing so they're rowing with you, not against you. This is the single biggest predictor of who finishes the 90 days and who doesn't.</p>
      <p style="font-size:15.5px;line-height:1.75;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">The Cohort 2 Kit.</strong> Everything in the BP Reset Kit, plus extended protocol PDFs, plus Annie's hormone-specific protocols, plus the cardiologist conversation script versioned for your case specifically.</p>
    `)}
    ${bigQuote("What Cohort 2 is NOT.")}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Not a self-paced course. The group meets live every Monday.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Not a passive sit-back. You share your own logs, ask your own questions, learn from the protocols I design for the people next to you.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Not a 30-day reset. The protocols compound at week 6 through week 10. You need the runway.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">→ Not for everyone. If your numbers are already trending well and your case is straightforward, the diagnostic protocol plus the 30-day email window is plenty.</p>
    `)}
    ${clayBlock('The credit math', `
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 10px;">Standard Cohort 2 price: <strong style="color:${PALETTE.text};">$1,997</strong> one-time, or $697 × 3.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 10px;">You already paid <strong style="color:${PALETTE.text};">$297</strong> for the diagnostic. That entire $297 applies as a credit toward Cohort 2.</p>
      <p style="font-size:17px;line-height:1.6;color:${PALETTE.text};margin:0 0 8px;font-weight:700;">Your Cohort 2 price: $1,700 net.</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">Credit valid for 30 days from your diagnostic call. After that, Cohort 2 returns to $1,997 flat for new buyers — no exceptions.</p>
    `)}
    ${p(`The diagnostic prescreen — the call we did or will do together — is the only way the credit gets applied. Public registration after the credit window pays the full $1,997.`)}
    ${ctaButton(SPRINT_CREDIT_URL, 'Lock in Cohort 2 ($1,700)')}
    ${p(`If you're not sure yet — that's fine. The next emails address the most common questions diagnostic graduates ask before they decide. I'll see you in a couple days.`)}
    ${joelSignoff()}
    ${psBox(`The $1,700 is one payment. If you'd rather split it, three payments of $597 lands at the same number after credit applied. Reply if you want the split-pay link and I'll send it.`)}
    ${upsellFooter({
      kicker: 'Ready to lock the credit?',
      body: '$1,997 standard − $297 diagnostic credit = $1,700. Twelve seats. Doors open through Friday of next week or until full, whichever comes first.',
      ctaLabel: 'Apply the credit',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

I told you on Day 3 I'd give you the full Cohort 2 picture this week. Today's the day.

WHAT COHORT 2 IS:
→ Twelve weeks. Small group with me, RN. Capped at twelve seats. Annie Chitate, RN (my wife) joins for hormone work.
→ Weekly group Zoom. Monday nights 8 PM ET. We work the cohort case-by-case, live.
→ WhatsApp office hours. Sun-Thu, 9 AM-5 PM ET. Same-day answers.
→ Full deprescribing plan worked WITH your prescriber. Most clients drop 1-3 meds in 90 days.
→ Partner inclusion guide. Single biggest predictor of who finishes the 90 days.
→ The Cohort 2 Kit. Everything in the Reset Kit + extended PDFs + Annie's hormone protocols.

WHAT COHORT 2 IS NOT:
→ Not a self-paced course.
→ Not a passive sit-back.
→ Not a 30-day reset. Protocols compound at week 6-10.
→ Not for everyone. If your numbers trend well already, the diagnostic + 30-day email window is plenty.

THE CREDIT MATH:
Standard Cohort 2 price: $1,997 one-time, or $697 × 3.
You already paid $297 for the diagnostic. That entire $297 applies as a credit toward Cohort 2.

YOUR COHORT 2 PRICE: $1,700 NET.

Credit valid for 30 days from your diagnostic call. After that, Cohort 2 returns to $1,997 flat.

Lock in Cohort 2 ($1,700):
→ ${SPRINT_CREDIT_URL}

The next emails address the most common questions diagnostic graduates ask before they decide.

Joel
RN, BraveWorks

P.S. The $1,700 is one payment. If you'd rather split it, three payments of $597 lands at the same number after credit. Reply for the split-pay link.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 9 — Objection killer #1: "I'm not ready" (Objection framework)
// ─────────────────────────────────────────────────────────────────────
const day9 = {
  subject: "If you're 'not ready,' read this twice",
  subjectB: 'The myth of being ready',
  preview: "Nobody who finishes the Sprint felt ready when they started.",
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Two days after the Cohort 2 reveal, the email I get most often goes something like this:`)}
    ${bigQuote(`"I want to do it. I'm just not ready yet."`)}
    ${p(`I want to take that sentence apart honestly, because I've been on both sides of it. I've said it in my own life — about training, about marriage, about starting BraveWorks. And every time I said it, I was protecting myself from one specific feeling.`)}
    ${p(`Not failure. Not money. Not time.`)}
    ${p(`<strong>The feeling I was protecting myself from was the discomfort of starting before I had certainty.</strong>`)}
    ${p(`Here's what's true about Cohort 2 — and about every meaningful change I've watched a client make:`)}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">The clients who finished Cohort 1 did NOT feel ready when they started.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">Wakita didn't. Patricia didn't (she joined later — separately). The first eight enrollments of Cohort 1 each sent me a version of "I'm not sure I should be doing this right now." Every single one finished the 90 days. Every single one tapered at least one medication.</p>
    `)}
    ${p(`What they had instead of <em>readiness</em> was something simpler. They had a window. And they had honesty about the cost of waiting.`)}
    ${p(`Let's do the math on waiting.`)}
    ${clayBlock(`The cost of "I'll do it next year"`, `
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your BP medication: roughly $40–$200 a month, depending on tier. Annualized: $480–$2,400. Many clients are on two or three.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your cardiology visits: $200–$400 each, two to four times a year on uncontrolled BP.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ The slow tax on energy, sleep, sex drive, mood, cognitive sharpness — which has no line item but compounds.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">→ The risk that a year from now, your numbers are higher, not lower.</p>
    `)}
    ${p(`Cohort 2 is $1,700 with your credit. It's a one-time number. Compare it to the line items above. The question isn't whether you can afford to do it. The question is whether you can afford to spend another year doing the same thing and expecting a different outcome.`)}
    ${p(`<strong>Two ways to know if "not ready" is wisdom or fear:</strong>`)}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;"><strong style="color:${PALETTE.text};">Wisdom looks like:</strong> "My mother is in hospice for the next 6 weeks and I cannot give a program 30 minutes a day until that's behind me." That's a real reason. Wait. The credit window can be extended in that case — reply and tell me.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Fear looks like:</strong> "I want to learn more first." If you've gotten this far in the sequence and had our diagnostic call, you have more clarity on your case than 98% of people who walk into a cardiologist's office. "Learning more" without a structure is the most expensive way to stay where you are.</p>
    `)}
    ${p(`If you're in the wisdom category, reply and tell me. We can hold the credit.`)}
    ${p(`If you're in the fear category, the honest move is to start before you feel ready. Same way you started taking your BP medication — you weren't ready for that either. You just did it because the cost of not doing it was higher.`)}
    ${ctaButton(SPRINT_CREDIT_URL, "Lock in Cohort 2 ($1,700)")}
    ${joelSignoff()}
    ${psBox(`If you're reading this and feel some pushback rising — that's worth noticing. Pushback at this point in the sequence usually means something true is being touched. Sit with it for 24 hours, then decide.`)}
    ${upsellFooter({
      kicker: 'Cohort 2 — diagnostic credit applied',
      body: '$1,997 standard − $297 already paid = $1,700 net. Credit window runs for 30 days from your diagnostic call.',
      ctaLabel: 'Apply the credit',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Two days after the Cohort 2 reveal, the email I get most often is some version of:

"I want to do it. I'm just not ready yet."

I want to take that sentence apart honestly, because I've been on both sides of it. Every time I said "I'm not ready" in my own life, I was protecting myself from one specific feeling: the discomfort of starting before I had certainty.

The clients who FINISHED Cohort 1 did not feel ready when they started. Wakita didn't. The first eight enrollments each sent me a version of "I'm not sure I should be doing this right now." Every single one finished the 90 days. Every single one tapered at least one medication.

THE COST OF "I'LL DO IT NEXT YEAR":
→ BP medication: $40-$200 a month. Annualized: $480-$2,400. Many clients are on 2-3.
→ Cardiology visits: $200-$400 each, 2-4x a year on uncontrolled BP.
→ The slow tax on energy, sleep, sex drive, mood — no line item, but compounds.
→ The risk that a year from now your numbers are higher, not lower.

Cohort 2 is $1,700 with your credit. One-time. Compare to the line items above.

WISDOM vs. FEAR:
Wisdom: "My mother is in hospice for the next 6 weeks and I cannot give a program 30 minutes a day." That's real. Reply and we can hold the credit.
Fear: "I want to learn more first." If you've had our diagnostic, you have more clarity on your case than 98% of people who walk into a cardiologist's office.

If you're in the wisdom category, reply. We can hold it.
If you're in the fear category, the honest move is to start before you feel ready.

Lock in Cohort 2 ($1,700):
→ ${SPRINT_CREDIT_URL}

Joel
RN, BraveWorks

P.S. Pushback at this point in the sequence usually means something true is being touched. Sit with it 24 hours, then decide.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 10 — Future-self / 90 days from today (Hardy / Story)
// ─────────────────────────────────────────────────────────────────────
const day10 = {
  subject: 'A Tuesday in October — written by you',
  subjectB: 'What 90 days from now looks like',
  preview: 'Not optimism. The actual arc for clients who follow through.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick exercise. Don't reply — just read it slow.`)}
    ${bigQuote('Picture yourself ninety days from today.')}
    ${p(`Your morning BP is fifteen to twenty-five points lower than it is right now. Top number under 130 most mornings. You wake up before your alarm, not jolted awake by it.`)}
    ${p(`You walk to the kitchen and the first thing you do is drink water — twenty ounces, with a pinch of Celtic salt — not check your phone. Your phone stays in the other room until you're done with the first hour of your day.`)}
    ${p(`You take fewer supplements than you used to. Three or four, all the ones that actually move something. Not the fifteen you were guessing at this year. You can name what each one is doing — Stress Pressure, Sugar Pressure, or Pipe Pressure — and why it's there.`)}
    ${p(`Your spouse notices. They say something like <em>"you seem more like yourself."</em> Their eyes are different when they say it.`)}
    ${p(`Your daughter asks you what you've been doing. You tell her about the Three Pressures. You tell her the simple version. She writes it down because she's been worried about her own numbers and didn't know how to start.`)}
    ${p(`You sit down with your cardiologist with a printed BP log. Steady. Clean. Trending the right direction for eight straight weeks. They look up from the page and ask, <em>"what are you doing?"</em>`)}
    ${p(`You hand them a one-page conversation script you've been waiting to use. They read it. They nod. They tell you which medication they want to taper first, and at what dose decrement. You leave the office with a new prescription that has a smaller number on it.`)}
    ${p(`You walk to your car. You don't cry, but the muscles in your face do something they haven't done in a long time. You sit in the driver's seat for a minute before you start the engine.`)}
    ${bigQuote(`That's a real picture.`)}
    ${p(`It's not optimism. It's the actual ninety-day arc for clients who follow through. I've watched it happen close to a hundred times now.`)}
    ${p(`The diagnostic gave you the protocol. Cohort 2 gives you the runway. The Monday calls, the WhatsApp answers, the partner briefing, the cardiologist script — these are the things that turn the protocol from a PDF in your inbox into the actual Tuesday-in-October above.`)}
    ${p(`Your $297 credit is yours for 30 days from our call. After that, Cohort 2 returns to $1,997 flat. The credit window isn't artificial scarcity — it's the only commercial way I can fund a small enough cohort to actually run the WhatsApp office hours myself.`)}
    ${ctaButton(SPRINT_CREDIT_URL, 'Lock in Cohort 2 ($1,700)')}
    ${p(`No pressure today. Just wanted you to see the picture so you know what you're choosing between.`)}
    ${joelSignoff()}
    ${psBox(`Pick a Tuesday in October — actually pick one on your calendar, write the date down on a sticky note. The version of you that wakes up that morning will be glad you made today's decision however you make it. Choose the path you want to thank yourself for.`)}
    ${upsellFooter({
      kicker: 'The October-Tuesday version of you',
      body: 'Cohort 2 starts in days, not weeks. Your $297 already-paid credit applies. $1,700 net, one payment or three.',
      ctaLabel: 'Lock in your seat',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Quick exercise. Don't reply — just read it slow.

PICTURE YOURSELF NINETY DAYS FROM TODAY.

Your morning BP is 15-25 points lower than it is right now. Top number under 130 most mornings. You wake up before your alarm, not jolted awake by it.

You walk to the kitchen and drink water — twenty ounces, with a pinch of Celtic salt — not check your phone.

You take fewer supplements. Three or four, all the ones that actually move something. You can name what each one is doing — Stress Pressure, Sugar Pressure, or Pipe Pressure — and why it's there.

Your spouse says "you seem more like yourself."

Your daughter asks what you've been doing. You tell her about the Three Pressures. She writes it down because she's been worried about her own numbers.

You sit down with your cardiologist with a printed BP log. Steady. Clean. Eight weeks trending the right direction. They look up from the page and ask, "what are you doing?"

You hand them a one-page script. They nod. They tell you which medication to taper first.

You walk to your car. You don't cry, but the muscles in your face do something they haven't done in a long time.

That's a real picture. It's not optimism. It's the actual ninety-day arc for clients who follow through.

The diagnostic gave you the protocol. Cohort 2 gives you the runway.

Lock in Cohort 2 ($1,700):
→ ${SPRINT_CREDIT_URL}

No pressure today. Just wanted you to see the picture.

Joel
RN, BraveWorks

P.S. Pick a Tuesday in October — actually pick one. The version of you that wakes up that morning will be glad you made today's decision however you make it. Choose the path you want to thank yourself for.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 11 — Objection killer #2: "Will this work for MY situation?"
// ─────────────────────────────────────────────────────────────────────
const day11 = {
  subject: 'What if your case is different?',
  subjectB: 'Your case is more common than you think',
  preview: "Six client patterns. One of them is yours.",
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Second-most-common email I get at this point in the sequence:`)}
    ${bigQuote('"But Joel — my case is complicated. Are you sure this will work for me?"')}
    ${p(`I want to answer this honestly, because "my case is different" is a real concern AND it's also the most reliable disguise that fear wears at the bottom of the funnel.`)}
    ${p(`Here's what I've learned after running close to a hundred diagnostic calls and one full Cohort 1:`)}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.text};margin:0 0 10px;font-weight:600;">There are six common patterns. Your case is one of them.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">When I tell clients this, the most common reaction is half-relief, half-disappointment. Relief because their case is workable. Disappointment because they thought their case was rare, and "rare" has been the story they've been telling themselves to explain why nothing's worked.</p>
    `)}
    ${p(`<strong>The six patterns I see most often, in order of frequency:</strong>`)}
    ${sageBlock(`
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Stress Pressure–dominant, supplement-loaded.</strong> Sleep is broken at 3 AM, jaw tension, mid-afternoon crash, taking 10+ supplements. Numbers come down 8–15 points by week 6 with cortisol-focused removals.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Sugar Pressure–dominant, "I don't eat that much sugar."</strong> Morning fasting glucose over 100, post-meal heaviness, snacking after dinner. A1c trending up year-over-year. Numbers move when we name the glucose volatility — not the sugar.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">3. Pipe Pressure–dominant, vascular signature.</strong> Cold hands, faint pulses, family history of stroke or heart disease, sometimes already on a statin. The vascular protocol moves these clients fastest when stacked with the right minerals.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">4. Hormone-driven, perimenopause/post.</strong> BP started climbing around 50, hot flashes, sleep disruption that isn't cortisol. Annie runs point on these. Often the most dramatic 90-day arc.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">5. Medication-tangled, three or more BP drugs.</strong> Lisinopril plus a diuretic plus a calcium channel blocker. Side effects stacking. Deprescribing protocol is the heart of the work. This is who Cohort 2 was originally built for.</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">6. Two-corner combo.</strong> Stress + Sugar, or Sugar + Pipe, or Stress + Pipe. Most cases that "haven't responded to anything" turn out to be combos that need sequenced work — not piled-on work. This is why a kit alone often plateaus.</p>
    `)}
    ${p(`When we did your diagnostic, we named which pattern you sit in. Or if you haven't had the call yet, we'll do that on the call. Cohort 2 is built to handle all six.`)}
    ${p(`<strong>The one case I'll tell you Cohort 2 is NOT for:</strong> if you're under 40 with a single elevated reading and no medications, you don't need 90 days of structure. You need the basics from the BP Reset Kit. Reply and I'll tell you.`)}
    ${p(`Everyone else — your case is one of those six. We have a path for each one.`)}
    ${ctaButton(SPRINT_CREDIT_URL, 'Lock in Cohort 2 ($1,700)')}
    ${joelSignoff()}
    ${psBox(`If you're not sure which of the six patterns you sit in, that's literally what your diagnostic call is for. Hit reply and tell me what you'd like me to look at most closely when we meet.`)}
    ${upsellFooter({
      kicker: 'Cohort 2 — built for all six patterns',
      body: '$1,700 net after your $297 credit. Twelve seats. Annie runs the hormone thread, I run the rest. Closes Friday.',
      ctaLabel: 'Apply the credit',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Second-most-common email I get at this point in the sequence:

"But Joel — my case is complicated. Are you sure this will work for me?"

I want to answer this honestly, because "my case is different" is a real concern AND it's also the most reliable disguise that fear wears at the bottom of the funnel.

There are SIX common patterns. Your case is one of them.

THE SIX PATTERNS, IN ORDER OF FREQUENCY:

1. STRESS PRESSURE–DOMINANT, SUPPLEMENT-LOADED. Sleep broken at 3 AM, jaw tension, mid-afternoon crash, 10+ supplements. Numbers down 8-15 points by week 6.

2. SUGAR PRESSURE–DOMINANT, "I don't eat that much sugar." Morning fasting glucose over 100, post-meal heaviness, snacking after dinner. A1c trending up.

3. PIPE PRESSURE–DOMINANT, vascular signature. Cold hands, faint pulses, family history of stroke or heart disease, often on a statin. Moves fastest with the right minerals.

4. HORMONE-DRIVEN, perimenopause/post. BP started climbing around 50, hot flashes, sleep disruption. Annie runs point. Often the most dramatic 90-day arc.

5. MEDICATION-TANGLED, 3+ BP drugs. Side effects stacking. Deprescribing protocol is the heart. This is who Cohort 2 was originally built for.

6. TWO-CORNER COMBO. Stress + Sugar, or Sugar + Pipe, or Stress + Pipe. Most cases that "haven't responded to anything" turn out to be combos.

Cohort 2 is built to handle all six.

THE ONE CASE COHORT 2 IS NOT FOR: under 40, single elevated reading, no medications. You need the basics from the BP Reset Kit. Reply and I'll tell you.

Everyone else — your case is one of those six.

Lock in Cohort 2 ($1,700):
→ ${SPRINT_CREDIT_URL}

Joel
RN, BraveWorks

P.S. If you're not sure which pattern you sit in, that's literally what your diagnostic call is for. Hit reply and tell me what you'd like me to look at most closely when we meet.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 12 — Cohort 2 caps + scarcity (12 seats, 4 left)
// ─────────────────────────────────────────────────────────────────────
const day12 = {
  subject: '12 seats. 4 left.',
  subjectB: 'Doors close Friday at midnight',
  preview: 'Real seat count update. Real reason for the cap.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick update on Cohort 2 numbers.`)}
    ${clayBlock('Cohort 2 — current count', `
      <p style="font-size:24px;line-height:1.3;color:${PALETTE.text};margin:0 0 8px;font-weight:700;">12 seats total · 4 left</p>
      <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">Doors close <strong>Friday at midnight ET</strong> or when full, whichever comes first.</p>
    `)}
    ${p(`I want to be direct about why the cap is twelve and not "open enrollment."`)}
    ${p(`Cohort 2 lives or dies on the WhatsApp office hours. That's the part of the program that turns a kit into a transformation — the daily access, the real-time answers, the photo-of-the-supplement-bottle questions that get answered in minutes instead of weeks.`)}
    ${p(`I run that thread myself. Not a VA. Not a chatbot. Me, with my own eyes, on my own phone, replying within the same business day.`)}
    ${bigQuote('Twelve clients is the most I can carry on WhatsApp and still answer the way you need me to.')}
    ${p(`At fifteen clients, the answers get slower. At twenty, the program stops being what I sold you. So I cap it at twelve, and I'd rather close enrollment with two seats empty than break that promise.`)}
    ${p(`The four seats remaining as of this morning will go this week. The diagnostic graduates who've been on the fence are coming off it. The credit-applied $1,700 price isn't available after the credit window — and the cohort itself isn't running again until Cohort 3, which I haven't scheduled.`)}
    ${ctaButton(SPRINT_CREDIT_URL, 'Lock in one of the last 4 seats')}
    ${p(`If you've been waiting for a sign — a specific moment to commit — this is it. Not because of urgency for urgency's sake. Because there are literally four chairs left in a room of twelve.`)}
    ${p(`If a seat is no longer available by the time you click through, the page will tell you. I won't oversell the room.`)}
    ${joelSignoff()}
    ${psBox(`I'll send one more email Friday. After that, I stop. If Cohort 2 isn't your move right now, the diagnostic protocol and the 30-day email coaching window are yours either way. That was always the deal.`)}
    ${upsellFooter({
      kicker: '4 of 12 seats remaining',
      body: '$1,997 standard − $297 already paid = $1,700 net. Cap is twelve so I can run the WhatsApp office hours myself. Doors close Friday.',
      ctaLabel: 'Lock in your seat',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Quick update on Cohort 2 numbers.

12 SEATS TOTAL · 4 LEFT
Doors close Friday at midnight ET or when full, whichever comes first.

I want to be direct about why the cap is twelve and not "open enrollment."

Cohort 2 lives or dies on the WhatsApp office hours. That's the part of the program that turns a kit into a transformation — daily access, real-time answers, the photo-of-the-supplement-bottle questions that get answered in minutes instead of weeks.

I run that thread myself. Not a VA. Not a chatbot. Me, with my own eyes, on my own phone, replying within the same business day.

Twelve clients is the most I can carry on WhatsApp and still answer the way you need me to. At fifteen, the answers get slower. At twenty, the program stops being what I sold you. So I cap it at twelve, and I'd rather close enrollment with two seats empty than break that promise.

The four seats remaining as of this morning will go this week. The credit-applied $1,700 price isn't available after the credit window. Cohort 3 isn't scheduled.

Lock in one of the last 4 seats:
→ ${SPRINT_CREDIT_URL}

If a seat is no longer available by the time you click through, the page will tell you. I won't oversell the room.

Joel
RN, BraveWorks

P.S. I'll send one more email Friday. After that, I stop. The diagnostic protocol and the 30-day email coaching window are yours either way.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// DAY 14 — Final close OR graceful exit (PASTOR + close)
// ─────────────────────────────────────────────────────────────────────
const day14 = {
  subject: 'Last email about Cohort 2',
  subjectB: "If now isn't your moment — here's what to do",
  preview: 'Closes tonight. Then I stop. The kit is still yours.',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Last note on Cohort 2. Then I genuinely stop.`)}
    ${p(`Your $297 diagnostic credit toward Cohort 2 closes at midnight tonight. After that, the credit can't be redeemed — and Cohort 2 returns to $1,997 flat for anyone who joins later. <strong>The cohort itself is closing too, regardless of credit status.</strong>`)}
    ${p(`I'm not going to push. You already paid me $297. You already have your protocol. You have the 30-day email-coaching window open until Day 30 of your diagnostic. If the kit + the protocol + the email window is enough — that's a real success. Most clients who choose this path do well.`)}
    ${bigQuote('Two short lists. Then your call.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Enroll in Cohort 2 if:</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ You're on three or more medications and want a real deprescribing plan</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ You'd benefit from daily WhatsApp access to a nurse who knows your file</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your spouse needs to be brought along (partner inclusion is significant)</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ You want the hormone-corner deep dive (Annie's specialty)</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">→ On our call you said "I want a guide for the next 90 days" and you meant it</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Don't enroll if:</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ Your numbers are already trending well and you just want to maintain</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ You're feeling buyer's remorse about the diagnostic — that's a sign to slow down, not double down</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0 0 8px;">→ You don't have 30–60 minutes a week for the calls</p>
      <p style="font-size:15.5px;line-height:1.7;color:${PALETTE.textSoft};margin:0;">→ Your case really is a wait — caretaking, grief, surgery, real life happening. Reply and we'll talk about a hold.</p>
    `)}
    ${clayBlock('Your credit-applied price', `
      <p style="font-size:24px;line-height:1.3;color:${PALETTE.text};margin:0 0 4px;font-weight:700;">$1,700 net</p>
      <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 6px;">$1,997 standard − $297 diagnostic credit. Credit expires tonight.</p>
      <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">One payment of $1,700, or three of $597. Reply for the split-pay link if that's the path you want.</p>
    `)}
    ${ctaButton(SPRINT_CREDIT_URL, 'Enroll in Cohort 2 ($1,700)')}
    ${p(`<strong>If now isn't your moment — here's what to do:</strong>`)}
    ${p(`Run the protocol. Email me each Sunday during your 30-day follow-up window. When you hit Day 30 with your protocol, decide whether you want a re-check diagnostic at the 90-day mark or whether you're settled. Most clients who go this route do beautifully.`)}
    ${p(`Either way — Cohort 2 yes or kit-only — I'm grateful you trusted me with your story. Most people in the world will never have what you have right now: a written, named, specific plan for the next 30 days of their cardiovascular health, with a nurse who reads every reply.`)}
    ${p(`You did the brave work. That's what BraveWorks means.`)}
    ${joelSignoff()}
    ${psBox(`Tonight at midnight ET, the credit-applied $1,700 price disappears. After that, Cohort 2 is $1,997 flat for anyone who wants it later. No exceptions, no grandfathering — that's the only way I can keep this fair to the people who said yes inside the window. If you're going to do it, do it tonight.`)}
    ${upsellFooter({
      kicker: 'Last hours — Cohort 2',
      body: '$1,700 net after credit. Closes midnight ET tonight. One payment or three.',
      ctaLabel: 'Enroll now',
      ctaUrl: SPRINT_CREDIT_URL,
    })}
    ${footerSecondaryCTAs()}
    ${unsubStrip(unsubUrl)}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},

Last note on Cohort 2. Then I genuinely stop.

Your $297 diagnostic credit toward Cohort 2 closes at midnight tonight. After that, the credit can't be redeemed — and Cohort 2 returns to $1,997 flat for anyone who joins later. The cohort itself is closing too, regardless of credit status.

I'm not going to push. You already paid me $297. You already have your protocol. You have the 30-day email-coaching window open until Day 30. If the kit + the protocol + the email window is enough — that's a real success.

ENROLL IN COHORT 2 IF:
→ You're on 3+ medications and want a real deprescribing plan
→ You'd benefit from daily WhatsApp access to a nurse who knows your file
→ Your spouse needs to be brought along
→ You want the hormone-corner deep dive (Annie)
→ On our call you said "I want a guide for the next 90 days" and meant it

DON'T ENROLL IF:
→ Your numbers are already trending well — you just want to maintain
→ You're feeling buyer's remorse about the diagnostic
→ You don't have 30-60 minutes a week
→ Your case really is a wait. Reply and we'll talk about a hold.

YOUR CREDIT-APPLIED PRICE: $1,700 NET
$1,997 standard − $297 diagnostic credit. Credit expires tonight.
One payment of $1,700, or three of $597. Reply for the split-pay link.

Enroll: → ${SPRINT_CREDIT_URL}

IF NOW ISN'T YOUR MOMENT:
Run the protocol. Email me each Sunday. When you hit Day 30, decide whether you want a re-check diagnostic at the 90-day mark or whether you're settled. Most clients who go this route do beautifully.

Either way — Cohort 2 yes or kit-only — I'm grateful you trusted me with your story.

You did the brave work. That's what BraveWorks means.

Joel
RN, BraveWorks

P.S. Tonight at midnight ET, the credit-applied $1,700 price disappears. After that, $1,997 flat for anyone who wants it later. No exceptions, no grandfathering. If you're going to do it, do it tonight.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}

Unsubscribe: ${unsubUrl}
`,
};

// ─────────────────────────────────────────────────────────────────────
// Day map for the cron
// ─────────────────────────────────────────────────────────────────────
export const TIER_3_DAYS = {
  0:  day0,
  1:  day1,
  3:  day3,
  5:  day5,
  7:  day7,
  9:  day9,
  10: day10,
  11: day11,
  12: day12,
  14: day14,
};

// Idempotency flag name — used by the cron to skip already-sent emails
export function tier3SentFlag(day) {
  return `tier3Day${day}Sent`;
}
