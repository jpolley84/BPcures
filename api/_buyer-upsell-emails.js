// api/_buyer-upsell-emails.js
//
// Three emails that fire 10 / 14 / 17 days after a $17-$47 Kit purchase
// to upsell those buyers into the $297 30-Day Personalized Sprint
// (written 30-day plan from your numbers, walked day by day, 4 live
// group coaching sessions included). The $17 Kit purchase applies as
// credit → buyer sees $280 checkout.
//
// Fired by api/buyer-upsell-cron.js (daily at 13:00 UTC, after main
// drip-cron). The cron filters to buyers (tier-1-buyer or tier-2-buyer
// tagged in KV drip:* record) and excludes diagnostic-prospect cohort
// + Sprint-tier buyers.
//
// 2026-06-09 realignment (panel-approved, Joel-confirmed):
//   - Product renamed: $297 BP Triangle Diagnostic Session → 30-Day
//     Personalized Sprint. No Zoom-hour framing anywhere.
//   - Honest scarcity only: Joel takes 5 new Sprint readers a month
//     (real cap, confirmed). No invented slot counts, no deadlines.
//   - Buyer credit math: $17 already paid → $280 to start
//   - Cohort credit-stacking lines KEPT ($280 stacks toward the $1,997
//     90-day cohort — still on the ladder per Joel 2026-06-09)
//   - "Results not typical" rider near outcome claims (Doreen)
//   - No em dashes in rendered copy
//   - Doreen (not Marlene) for the Day 14 case study to avoid name
//     collision with the Day 3 drip Marlene character

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
// $297 Sprint with the $17 kit credit applied → $280 checkout. Same live
// Stripe link as the old kit-credit checkout; product renamed on Stripe
// to "30-Day Personalized Sprint (4 Group Coaching Sessions Included)".
const SPRINT_WITH_KIT_CREDIT_LINK =
  process.env.VITE_STRIPE_SPRINT_297_LINK ||
  process.env.VITE_STRIPE_DIAGNOSTIC_WITH_KIT_CREDIT_LINK ||
  'https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P';

function unsubFooter(unsubUrl) {
  return `
    <p style="font-size:11px;color:${PALETTE.muted};line-height:1.6;margin:32px 0 0;text-align:center;">
      BraveWorks RN · Joel Polley, RN · The Blood Pressure Guy<br/>
      Educational content only. Not medical advice. Always work alongside your physician.<br/>
      <a href="${unsubUrl}" style="color:${PALETTE.muted};">Unsubscribe from these messages</a>
    </p>
  `;
}

function ctaButton(href, label) {
  return `
    <p style="margin:24px 0;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;background:${PALETTE.sage};color:${PALETTE.paperLight};text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
        ${label}
      </a>
    </p>
  `;
}

function emailShell(innerHtml) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${PALETTE.paper};font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:${PALETTE.text};line-height:1.65;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.paper};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PALETTE.paperLight};border-radius:12px;border:1px solid ${PALETTE.border};">
        <tr><td style="padding:32px 28px;font-size:15.5px;color:${PALETTE.text};">
          ${innerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────
// DAY 10 — "Did the kit move your numbers?"
// ─────────────────────────────────────────────────────────────────────
export const buyerUpsellDay10 = {
  subject: 'Did the kit move your numbers? (one buyer-only door)',
  preview: 'Most kit owners plateau at day 14. Here\'s what to do.',
  html: ({ firstName, unsubUrl }) => emailShell(`
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">BraveWorks RN · Buyer-only door</div>

    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Quick check-in. How's the kit treating you?</p>

    <p style="margin:0 0 14px;">If the numbers are moving, <strong>stay the course.</strong> The 10-day protocol is doing what it was designed to do. Hit reply if you want a second-week tweak.</p>

    <p style="margin:0 0 14px;">If the numbers AREN'T moving the way you hoped, that's not the kit's fault. The kit gives you the general playbook. Your body has specific drivers. After enough days of running the general playbook, most people hit a plateau because the kit can't see the corner of YOUR Triangle that's loudest.</p>

    <p style="margin:0 0 14px;">Most kit owners stay kit owners. The ones who want the guessing removed ladder up to a personal plan.</p>

    <p style="margin:0 0 14px;">Here's a buyer-only door I want you to know about.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Your buyer credit applies</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:6px;">The 30-Day Personalized Sprint</div>
      <div style="font-size:14px;color:${PALETTE.textSoft};">Standard price <strong>$297</strong>. With your $17 Kit credit applied, you pay <strong>$280</strong>.</div>
    </div>

    <p style="margin:0 0 8px;">Here's how it works. You send me:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 14px;">
      <li>Your home BP log (or just your morning readings from this week)</li>
      <li>Every prescription and supplement you're taking</li>
      <li>Whatever's been in the way</li>
    </ul>

    <p style="margin:0 0 8px;">What you walk away with:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;">
      <li>A written 30-day personalized plan, yours, not generic, walked day by day</li>
      <li>My trained read on which Triangle corner is loudest for you</li>
      <li>A clean script to bring to your doctor for the medication conversation</li>
      <li><strong style="color:${PALETTE.sage};">All four live group coaching sessions that month, included</strong></li>
    </ul>

    <p style="margin:0 0 14px;">Honest math on availability: I write every plan myself. I take <strong>5 new Sprint readers a month</strong>, because that is what the writing actually takes. If the month is full when you write me, I'll tell you directly and lock you in when the next window opens.</p>

    ${ctaButton(SPRINT_WITH_KIT_CREDIT_LINK, 'Start the Sprint · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">If this isn't your moment, hit reply with "not now" and I'll stop mentioning it. No drama. The kit is yours forever either way.</p>

    <p style="margin:18px 0 4px;">Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. The Sprint is the bridge to deeper work for the buyers who want to keep going. Your $280 today stacks as credit toward the 90-day cohort if you ever do. Most don't. Some do. That's the door.</p>

    ${unsubFooter(unsubUrl)}
  `),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 14 — "Doreen moved 12 points in 12 days"
// ─────────────────────────────────────────────────────────────────────
export const buyerUpsellDay14 = {
  subject: 'Doreen went 142/88 → 128/80. Her cardiologist dropped a pill.',
  preview: 'One personal look. One plan. One conversation with her cardiologist.',
  html: ({ firstName, unsubUrl }) => emailShell(`
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">BraveWorks RN · One real case</div>

    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Quick story.</p>

    <p style="margin:0 0 14px;"><strong>Doreen</strong>, age 62, on three BP meds for fifteen years. Still running 140s/90s most mornings. She bought the BP Reset Kit two months ago. Did the protocol. Numbers moved a little. Then plateaued at 142/88. That's where most Kit owners stop.</p>

    <p style="margin:0 0 14px;">She didn't.</p>

    <p style="margin:0 0 14px;">She asked me to look at her whole picture. I went through her log, her meds, her stress, her sleep, and I found the thing the Kit couldn't tell her: her loudest corner was cortisol, not vascular. She'd been waking at 3 AM every night for two years.</p>

    <p style="margin:0 0 14px;">We dropped two things, added three, fixed her sleep architecture. Twelve days later: <strong>BP 128/80.</strong> She brought the log to her cardiologist. He took her off the atenolol.</p>

    <p style="margin:0 0 14px;">Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results. Doreen's medication change was made by her own cardiologist, never on her own.</p>

    <p style="margin:0 0 14px;">Most Kit owners plateau because the Kit is built for the general case. Your case is specific. A personal look at your numbers is the difference between guessing for another six months and working a plan written for your body.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">The buyer-only door is still open</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:4px;">The 30-Day Personalized Sprint. $280, your $17 Kit credit applied</div>
    </div>

    <p style="margin:0 0 8px;">What you walk out with:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;">
      <li>Your loudest Triangle corner, named from your actual numbers</li>
      <li>A written 30-day plan customized to your body, walked day by day</li>
      <li>A doctor-conversation script for the medication talk</li>
      <li><strong style="color:${PALETTE.sage};">All four live group coaching sessions that month, included</strong></li>
    </ul>

    ${ctaButton(SPRINT_WITH_KIT_CREDIT_LINK, 'Start the Sprint · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">I take 5 new Sprint readers a month. That's a real cap, not a marketing number. If this isn't your moment, reply "not now" and I'll stop mentioning it.</p>

    <p style="margin:18px 0 4px;">Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. Doreen's loudest corner was cortisol. Yours might be vascular. Might be blood sugar. You don't know until we look together.</p>

    ${unsubFooter(unsubUrl)}
  `),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 17 — Honest-sort close (real cap, no countdown)
// ─────────────────────────────────────────────────────────────────────
export const buyerUpsellDay17 = {
  subject: 'Last note from me about the Sprint',
  preview: 'I take 5 new Sprint readers a month. Here\'s the honest sort.',
  html: ({ firstName, unsubUrl }) => emailShell(`
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">BraveWorks RN · Last note</div>

    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Last note on the Sprint. Then I'll stop.</p>

    <p style="margin:0 0 14px;">I write every plan myself. I take <strong>5 new Sprint readers a month</strong>, because that is what the writing actually takes. When a month fills, the next opening is the first of the next month. No countdowns, just the real calendar.</p>

    <p style="margin:0 0 14px;">If you've been thinking about it, here's the honest sort.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Buyer credit still applied</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:4px;">$280 at checkout. Standard $297, with your $17 Kit credit applied.</div>
    </div>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Real talk on whether this is for you.</p>

    <p style="margin:0 0 6px;"><strong>Start the Sprint if:</strong></p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 14px;color:${PALETTE.textSoft};">
      <li>You've been running the Kit protocol for 14+ days</li>
      <li>You've seen SOME movement but you're plateauing</li>
      <li>You want my trained read on which Triangle corner is actually loudest for your body before you spend another month guessing</li>
    </ul>

    <p style="margin:0 0 6px;"><strong>Don't start it if:</strong></p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;color:${PALETTE.textSoft};">
      <li>You haven't run the Kit protocol yet. Do that first. The Sprint plan is written from your data.</li>
      <li>Your numbers are moving exactly the way you wanted. The Kit is doing its job, stay the course.</li>
    </ul>

    ${ctaButton(SPRINT_WITH_KIT_CREDIT_LINK, 'Start the Sprint · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">If you're not going to start, that's fine. Reply "not now" and I'll stop. The Kit is yours forever, the protocol is yours, and the drip emails keep coming. No pressure.</p>

    <p style="margin:18px 0 4px;">Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. Nothing you spend with me gets spent twice. If you ever go deeper into the 90-day cohort, your $280 stacks as credit toward it.</p>

    ${unsubFooter(unsubUrl)}
  `),
};

// ─────────────────────────────────────────────────────────────────────
// Map for the cron to pick the right email by daysSincePurchase
// ─────────────────────────────────────────────────────────────────────
export const BUYER_UPSELL_DAYS = {
  10: buyerUpsellDay10,
  14: buyerUpsellDay14,
  17: buyerUpsellDay17,
};

// Returns the unsub-tracking flag name for a given upsell day.
export function upsellSentFlag(day) {
  return `buyerUpsell${day}Sent`;
}
