// api/_diagnostic-drip-emails.js
//
// 7-email sequence that fires after a $297 BP Triangle Diagnostic purchase.
// Audience: paid diagnostic buyers (cohort 'diagnostic-prospect', flag
// inDiagnosticSequence:true). Fired by api/diagnostic-drip-cron.js.
//
// Per Joel (2026-05-18):
//   - Cohort 2 is NEVER mentioned publicly on /coaching — only here, inside
//     the post-purchase sequence to $297 buyers.
//   - Credit ladders all the way: $297 diagnostic → applies to $1,997 Cohort 2
//     → buyer pays $1,700. Stripe Payment Link created.
//   - Voice = same as buyer-upsell-cron + drip-cron Days 1-7. Warm,
//     specific, no pressure.
//
// Day cadence (from purchasedAt):
//   1  — Prep checklist + restate
//   3  — Why the diagnostic exists (Patricia case study)
//   5  — The three paths after the call (Cohort 2 introduced gently)
//   7  — Cohort 2 reveal: what it is, what it's not
//   9  — Wakita's first 30 days inside the program (deep case)
//   11 — Future-self / 90 days from today
//   14 — Enrollment closes Friday (final close)

const PALETTE = {
  paper: '#FBF8F1',
  paperLight: '#FFFDF7',
  text: '#2C2A26',
  textSoft: '#5B564C',
  muted: '#9C9485',
  sage: '#3F5A3C',
  sageSoft: '#E6EBE0',
  clay: '#B85A36',
  border: '#E6DECE',
};

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const CALENDLY_URL = process.env.VITE_CALENDLY_DIAGNOSTIC_URL || 'https://calendly.com/braveworksrn/60min';
const SPRINT_WITH_CREDIT_LINK =
  process.env.VITE_STRIPE_SPRINT_WITH_DIAGNOSTIC_CREDIT_LINK ||
  'https://buy.stripe.com/eVq6oH57RgqicrF6NjfnO0Q';

function unsubFooter(unsubUrl) {
  return `
    <p style="font-size:11px;color:${PALETTE.muted};line-height:1.6;margin:32px 0 0;text-align:center;">
      BraveWorks RN · Joel Polley, RN · The Blood Pressure Guy<br/>
      Educational content only. Not medical advice. Always work alongside your physician.<br/>
      <a href="${unsubUrl}" style="color:${PALETTE.muted};">Unsubscribe from these messages</a>
    </p>
  `;
}

function ctaButton(href, label, color = PALETTE.sage) {
  return `
    <p style="margin:24px 0;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;background:${color};color:${PALETTE.paperLight};text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
        ${label}
      </a>
    </p>
  `;
}

function shell(innerHtml, kicker) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${PALETTE.paper};font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:${PALETTE.text};line-height:1.65;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.paper};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PALETTE.paperLight};border-radius:12px;border:1px solid ${PALETTE.border};">
        <tr><td style="padding:32px 28px;font-size:15.5px;color:${PALETTE.text};">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">${kicker}</div>
          ${innerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────
// DAY 1 — Prep checklist
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay1 = {
  subject: 'Quick prep for our diagnostic call',
  preview: 'Five things to have ready. Don\'t stress — bring what you have.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Quick prep note before our call.</p>

    <p style="margin:0 0 14px;">I read every diagnostic intake the night before. Here's what makes the most useful 60 minutes possible — don't stress if you don't have all of these, just bring what you have:</p>

    <ol style="font-size:15px;padding-left:22px;line-height:1.75;margin:0 0 18px;">
      <li><strong>Your home BP log this week.</strong> Even three readings is enough. Same arm, same chair, same time of day when possible.</li>
      <li><strong>Your prescription list.</strong> Photos of the bottles work; doesn't have to be pretty.</li>
      <li><strong>Your supplement list.</strong> Everything you take, even the random ones. Especially the random ones.</li>
      <li><strong>Any labs from the last year.</strong> A1c, lipid panel, kidney, thyroid, hormones if you have them. Photos of PDFs are fine.</li>
      <li><strong>Two or three things you've already tried that didn't work.</strong> So we don't waste time there.</li>
    </ol>

    <p style="margin:0 0 14px;">If you haven't booked your time yet, the calendar is here:</p>

    ${ctaButton(CALENDLY_URL, 'Open the calendar')}

    <p style="margin:0 0 14px;">I'm looking forward to this. Reply with any questions before the call — I read every email.</p>

    <p style="margin:18px 0 4px;">— Joel</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · Prep'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 3 — Case study (Patricia)
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay3 = {
  subject: 'Why I built the diagnostic (Patricia\'s story)',
  preview: 'She bought the kit. Plateaued. Then booked the call. What flipped.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Wanted to share why I built this product in the first place.</p>

    <p style="margin:0 0 14px;"><strong>Patricia</strong> — age 58, a year ago. She bought the BP Reset Kit. Ran the protocol. Numbers moved from 152/94 down to 138/86 in about three weeks. Then plateaued. Six weeks of holding at 138/86 with no further movement.</p>

    <p style="margin:0 0 14px;">She emailed me. "I'm doing everything. Why isn't it moving?"</p>

    <p style="margin:0 0 14px;">The kit gave her the general playbook. Her body had a specific driver the kit couldn't see. We did a 60-minute call — same kind we're doing — and within fifteen minutes I'd named it: her loudest Pressure was cortisol, not vascular. She'd been telling herself "I'm not that stressed" but her morning waking pattern, her jaw tension, her 3 PM crashes — they were the cortisol signature.</p>

    <p style="margin:0 0 14px;">We didn't change much. Dropped two supplements that were spiking her cortisol cycle (a B-complex with niacin and an ashwagandha she was taking wrong). Added box breathing twice daily. Fixed her bedroom temperature (it was 74°F — way too warm for nocturnal BP dipping).</p>

    <p style="margin:0 0 14px;">Twelve days later: 128/82. Six weeks later: 122/78. Her cardiologist tapered one of her two meds.</p>

    <p style="margin:0 0 14px;">That's the diagnostic. We name the corner. We write the protocol. The kit becomes specific instead of general.</p>

    <p style="margin:0 0 14px;">After your call, you'll be on a parallel arc. Each person's protocol is different — but the structure is the same: name the corner, name the moves, name the prep window. The follow-up email coaching over the next 30 days catches the adjustments as your body responds.</p>

    <p style="margin:0 0 14px;">If you haven't booked yet:</p>

    ${ctaButton(CALENDLY_URL, 'Pick your time')}

    <p style="margin:18px 0 4px;">— Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. Patricia is an anonymized first name. Real case. Real numbers. I don't use real names in these emails — it protects my clients and keeps the focus where it belongs.</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · Why the diagnostic'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 5 — The three paths after the diagnostic
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay5 = {
  subject: 'The three paths after our call',
  preview: 'Most people pick path 1. A few pick path 2. Here\'s when path 3 makes sense.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Once we finish your call and you have your written protocol, you have three paths.</p>

    <p style="margin:0 0 14px;">I want to lay them out now so you can think about which one fits before we talk.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Path 1 — Run the protocol solo</div>
      <p style="margin:6px 0 8px;font-size:15px;">You take the written 30-day protocol home and run it. Reply to me each Sunday during the 30-day email-coaching window. Most people pick this path.</p>
      <p style="margin:0;font-size:14px;color:${PALETTE.textSoft};"><strong>Best for:</strong> self-starters, people whose case is straightforward, people who like learning the why before they're guided through the how.</p>
    </div>

    <div style="background:${PALETTE.paperLight};border-left:3px solid ${PALETTE.clay};border-radius:6px;padding:18px 20px;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:4px;">Path 2 — Cohort 2 (90-day group)</div>
      <p style="margin:6px 0 8px;font-size:15px;">For the people who want me in their corner daily for the next twelve weeks. Weekly Zoom 1:1, daily WhatsApp office hours, full medication-tapering plan worked with your prescriber, partner inclusion. I'll tell you more on the call — this is for buyers who want the deepest version.</p>
      <p style="margin:0;font-size:14px;color:${PALETTE.textSoft};"><strong>Best for:</strong> 4+ medications, complex history, partner involvement needed, "I'm tired of guessing and want a guide" energy.</p>
    </div>

    <div style="background:${PALETTE.paperLight};border-left:3px solid ${PALETTE.muted};border-radius:6px;padding:18px 20px;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.muted};font-weight:700;margin-bottom:4px;">Path 3 — Just the diagnostic, see you in 90 days</div>
      <p style="margin:6px 0 8px;font-size:15px;">You take the protocol, use the 30-day follow-up window, and if you want a re-check 90 days from now, you can book another diagnostic. No commitment beyond what you already bought.</p>
      <p style="margin:0;font-size:14px;color:${PALETTE.textSoft};"><strong>Best for:</strong> the cautious. The ones who want to see results before going deeper.</p>
    </div>

    <p style="margin:14px 0;">You don't have to decide today. Just think about which one feels right. We'll talk about it on our call if you want.</p>

    <p style="margin:18px 0 4px;">— Joel</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · After the diagnostic'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 7 — Cohort 2 reveal (FIRST detailed mention)
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay7 = {
  subject: "Cohort 2 — what it is, what it's not",
  preview: 'A real picture of the 90-day group program opening May 24.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Yesterday I laid out the three paths after your diagnostic. Today I want to give you a real picture of Path 2 — Cohort 2, the 90-day group program — so you can decide if it fits before we talk.</p>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">What Cohort 2 is</p>

    <ul style="font-size:15px;line-height:1.75;padding-left:22px;margin:0 0 18px;">
      <li><strong>Twelve weeks. Small group with me + Annie.</strong> Annie Chitate, RN — my wife and the hormone-corner co-coach. Half the caseload involves hormone work; Annie handles that thread.</li>
      <li><strong>Weekly group Zoom call.</strong> Monday nights 8 PM ET. We work the cohort case-by-case, live. Your numbers, your symptoms, your medication-tapering progress — and you learn from everyone else's protocols too.</li>
      <li><strong>WhatsApp office hours, group thread.</strong> Sun–Thu, 9 AM–5 PM ET. Drop a question, send a photo, ask "should I take this today." I answer same-day in front of the cohort — so everyone benefits from each question.</li>
      <li><strong>Full deprescribing plan, worked WITH your prescriber.</strong> We design the taper, you bring it to your doctor, we adjust based on their feedback. Most clients drop 1–3 meds inside the 90 days.</li>
      <li><strong>Partner inclusion guide.</strong> Spouses/partners get a parallel 30-minute briefing so they're rowing with you, not pulling against.</li>
      <li><strong>The Cohort 2 Kit.</strong> Everything in the BP Reset Kit + the extended protocol PDFs + the hormone-specific protocols Annie uses.</li>
    </ul>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">What Cohort 2 is NOT</p>

    <ul style="font-size:15px;line-height:1.75;padding-left:22px;margin:0 0 18px;">
      <li>Not a self-paced course. The group meets live every Monday.</li>
      <li>Not a passive sit-back. Cohort members share their own logs, ask their own questions, and learn from the protocols I design for the people sitting next to them.</li>
      <li>Not a 30-day reset. The protocols compound at week 6–10. You need the runway.</li>
      <li>Not for everyone. If your numbers are good and you just want education, the Kit covers it.</li>
    </ul>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Investment</div>
      <p style="margin:6px 0 6px;font-size:15px;">Standard Cohort 2: $1,997 one-time. Or $697 × 3.</p>
      <p style="margin:0;font-size:15px;"><strong>Your $297 diagnostic credit applies</strong> → your Cohort 2 price is <strong>$1,700</strong> if you enroll within 30 days of our call.</p>
    </div>

    <p style="margin:0 0 14px;">Cohort 2 opens to public registration on <strong>Sunday May 24</strong>. The diagnostic prescreen — what we're doing on our call — gets you the credit-applied price and first-booking access. After May 24, public registration goes live without the diagnostic-credit option.</p>

    <p style="margin:18px 0 4px;">— Joel</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · Cohort 2'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 9 — Wakita case study (real 1:1 founding client, real arc)
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay9 = {
  subject: 'Wakita\'s first 30 days inside Cohort 2',
  preview: 'What an actual Cohort 2 week looks like, from one of my real clients.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Since Cohort 2 is the kind of program you don't fully understand until you've seen one, I want to walk you through a real client's first 30 days. I have her permission to share — using a first-name pseudonym to protect her privacy.</p>

    <p style="margin:0 0 14px;"><strong>Wakita</strong> — age 60, complex GI history, BP 145/92 morning, 138/88 afternoon, on three BP meds, dealing with chronic abdominal pain from a December hospitalization, on a Mexican naturopathic protocol that was layering complication on top of complication.</p>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Week 1 — Simplification.</p>
    <p style="margin:0 0 14px;">First call: I asked her to do nothing except 25 gratitudes morning and night and drink 84 oz of water a day with Celtic salt every 8 oz. No new herbs. No protocol additions. We had to clear her cortisol noise before we could see anything. Day 4 she stopped waking at 3 AM. Day 7 she slept eight hours for the first time in two years.</p>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Week 2 — Discontinuation.</p>
    <p style="margin:0 0 14px;">We pulled her off the Mexican Chaparro Amargo (it was making her pain worse) and three supplements that were redundant. She emailed me twice that week with reaction questions. Both answered same-day on WhatsApp.</p>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Week 3 — Targeted additions.</p>
    <p style="margin:0 0 14px;">Only THREE additions: hawthorn berry for vascular tone, magnesium glycinate at night for sleep depth, and a 10-minute walk after her largest meal. Her morning BP dropped from 145/92 to 134/86.</p>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Week 4 — Doctor conversation.</p>
    <p style="margin:0 0 14px;">We drafted the conversation she'd take to her cardiologist. Specific numbers, specific labs to request, a deprescribing-language script. He listened. Reduced one of her meds by 25%. He'd never had a patient bring him a script like this.</p>

    <p style="margin:0 0 18px;">That's one month. We have eleven more weeks together. By Week 12 most clients are on 1–2 fewer medications, sleeping a full night, and have a daily protocol that's so dialed it no longer feels like a program.</p>

    <p style="margin:0 0 14px;">If something in that arc made you go "yes, that's the program I want" — book Cohort 2 when we talk. If it sounds like more than you need, Path 1 is great.</p>

    <p style="margin:18px 0 4px;">— Joel</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · A real 90-day month'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 11 — Future-self
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay11 = {
  subject: '90 days from today',
  preview: 'A picture of where this could go if you decide to keep going.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Quick exercise. Don't reply — just read.</p>

    <p style="margin:0 0 14px;"><strong>Picture yourself ninety days from today.</strong></p>

    <p style="margin:0 0 14px;">Your morning BP is fifteen to twenty-five points lower than it is right now. You wake up before your alarm. You walk to the kitchen and the first thing you do is drink water, not check your phone. You take fewer supplements than you used to — three or four, all the ones that actually move something, not the fifteen you were guessing at last year.</p>

    <p style="margin:0 0 14px;">Your spouse notices. They say something like "you seem more like yourself."</p>

    <p style="margin:0 0 14px;">You sit down with your cardiologist with a printed BP log. Steady. Clean. Trending the right direction. They look up from the page and say "what are you doing?" You hand them a one-page script you've been waiting to use. They read it. They nod. They tell you which med they want to taper first.</p>

    <p style="margin:0 0 14px;">That's a real picture. It's not optimistic — it's the actual ninety-day arc for clients who follow through.</p>

    <p style="margin:0 0 14px;">The diagnostic gives you the protocol. Cohort 2 gives you the runway. The choice is whether you want the runway.</p>

    <p style="margin:0 0 14px;">If you decide you want it, your $297 credit is yours for 30 days from our call. After 30 days the credit window closes, Cohort 2 returns to $1,997 flat for new buyers.</p>

    ${ctaButton(SPRINT_WITH_CREDIT_LINK, 'Lock in Cohort 2 ($1,700)', PALETTE.clay)}

    <p style="margin:14px 0 0;font-size:14px;color:${PALETTE.textSoft};">No pressure. Not today. Just wanted you to see the picture.</p>

    <p style="margin:18px 0 4px;">— Joel</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · Future-self'),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 14 — Final close
// ─────────────────────────────────────────────────────────────────────
export const diagnosticDripDay14 = {
  subject: 'Your diagnostic credit window closes in 16 days',
  preview: 'Real talk on whether Cohort 2 is for you. Then I stop mentioning it.',
  html: ({ firstName, unsubUrl }) => shell(`
    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Last note on Cohort 2. Then I stop.</p>

    <p style="margin:0 0 14px;">Your $297 diagnostic credit toward Cohort 2 is yours for 30 days from our call. <strong>You have about 16 days left.</strong> After that window, Cohort 2 returns to $1,997 flat for everyone, and your credit can't be redeemed.</p>

    <p style="margin:0 0 14px;">I'm not going to push. You already paid me $297 and you have your protocol. If the Kit + your protocol + the 30-day email follow-up window is enough — that's success. Most clients who go this route do great.</p>

    <p style="margin:0 0 14px;">Book Cohort 2 if:</p>

    <ul style="font-size:15px;line-height:1.75;padding-left:22px;margin:0 0 14px;">
      <li>You're on 3+ medications and want a real deprescribing plan</li>
      <li>You'd benefit from daily WhatsApp access to a nurse who knows your file</li>
      <li>Your spouse needs to be brought along (partner inclusion is significant)</li>
      <li>You want the hormone-corner deep dive (Annie's specialty)</li>
      <li>You said "I want a guide for the next 90 days" on our call and meant it</li>
    </ul>

    <p style="margin:0 0 14px;">Don't enroll in Cohort 2 if:</p>

    <ul style="font-size:15px;line-height:1.75;padding-left:22px;margin:0 0 18px;">
      <li>Your numbers are already trending well and you just want to maintain</li>
      <li>You're feeling buyer's remorse about the diagnostic — that's a sign to slow down, not double down</li>
      <li>You don't have 30–60 minutes a week for the calls</li>
    </ul>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Your credit-applied Cohort 2 price</div>
      <div style="font-size:22px;font-weight:600;color:${PALETTE.text};margin-bottom:2px;">$1,700</div>
      <p style="margin:6px 0 0;font-size:14px;color:${PALETTE.textSoft};">$1,997 standard, minus your $297 diagnostic credit. 16 days left to redeem.</p>
    </div>

    ${ctaButton(SPRINT_WITH_CREDIT_LINK, 'Enroll in Cohort 2 ($1,700)', PALETTE.clay)}

    <p style="margin:14px 0;">If you're not going to enroll, reply "not for me" and I'll stop. The diagnostic and the email-coaching window are yours either way.</p>

    <p style="margin:18px 0 4px;">— Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. After the 30-day window closes, anyone who wants Cohort 2 pays $1,997 flat. No exceptions. The diagnostic credit is the only way it's $1,700.</p>

    ${unsubFooter(unsubUrl)}
  `, 'BraveWorks RN · Cohort 2 window'),
};

// ─────────────────────────────────────────────────────────────────────
// Day map for the cron
// ─────────────────────────────────────────────────────────────────────
export const DIAGNOSTIC_DRIP_DAYS = {
  1:  diagnosticDripDay1,
  3:  diagnosticDripDay3,
  5:  diagnosticDripDay5,
  7:  diagnosticDripDay7,
  9:  diagnosticDripDay9,
  11: diagnosticDripDay11,
  14: diagnosticDripDay14,
};

export function diagnosticSentFlag(day) {
  return `diagnosticDrip${day}Sent`;
}
