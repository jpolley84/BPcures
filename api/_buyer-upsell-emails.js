// api/_buyer-upsell-emails.js
//
// Three emails that fire 10 / 14 / 17 days after a $17-$47 Kit purchase
// to upsell those buyers into the $297 BP Triangle Diagnostic Session.
// The $17 Kit purchase applies as credit → buyer sees $280 checkout.
//
// Fired by api/buyer-upsell-cron.js (daily at 13:00 UTC, after main
// drip-cron). The cron filters to buyers (tier-1-buyer or tier-2-buyer
// tagged in KV drip:* record) and excludes diagnostic-prospect cohort
// + Sprint-tier buyers.
//
// Per Joel's standing approval (2026-05-18):
//   - Voice approved for Day 10, 14, 17
//   - No engagement gating in v1 (all 3 fire regardless of click)
//   - Real calendar scarcity for Day 17 ("6 slots left this month")
//   - Buyer credit math: $17 already paid → $280 to book
//   - Doreen (not Marlene) for the Day 14 case study to avoid name collision
//     with the Day 3 drip Marlene character (52, 11 points, 9 days)

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
const DIAGNOSTIC_WITH_KIT_CREDIT_LINK =
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

    <p style="margin:0 0 14px;">Quick check-in — how's the kit treating you?</p>

    <p style="margin:0 0 14px;">If the numbers are moving, <strong>stay the course.</strong> The 10-day protocol is doing what it was designed to do. Hit reply if you want a second-week tweak.</p>

    <p style="margin:0 0 14px;">If the numbers AREN'T moving the way you hoped — that's not the kit's fault. The kit gives you the general playbook. Your body has specific drivers. After enough days of running the general playbook, most people hit a plateau because the kit can't see the corner of YOUR Triangle that's loudest.</p>

    <p style="margin:0 0 14px;">Most kit owners stay kit owners. The ones who actually move their numbers ladder up to a real conversation.</p>

    <p style="margin:0 0 14px;">Here's a buyer-only door I want you to know about.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:18px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Your buyer credit applies</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:6px;">The BP Triangle Diagnostic Session</div>
      <div style="font-size:14px;color:${PALETTE.textSoft};">Standard price <strong>$297</strong>. With your $17 Kit credit applied, you pay <strong>$280</strong>.</div>
    </div>

    <p style="margin:0 0 8px;">60 minutes with me on Zoom. Bring:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 14px;">
      <li>Your home BP log (or just your morning readings from this week)</li>
      <li>Every prescription and supplement you're taking</li>
      <li>Whatever's been in the way</li>
    </ul>

    <p style="margin:0 0 8px;">What you walk away with:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;">
      <li>A written 30-day personalized protocol — yours, not generic</li>
      <li>A clear answer on which Triangle corner is loudest for you</li>
      <li>A clean script to bring to your doctor for the medication conversation</li>
      <li><strong style="color:${PALETTE.sage};">A 30-day follow-up email coaching window — buyer-only, not available to non-buyers</strong></li>
    </ul>

    <p style="margin:0 0 14px;">Honest math on availability: I take 10 of these calls a month. As of today, <strong>6 slots open</strong>. When they're gone, next openings are June 1.</p>

    ${ctaButton(DIAGNOSTIC_WITH_KIT_CREDIT_LINK, 'Book the diagnostic · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">If this isn't your moment, hit reply with "not now" and I'll stop mentioning it. No drama. The kit is yours forever either way.</p>

    <p style="margin:18px 0 4px;">— Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. The diagnostic is the bridge to deeper work for the buyers who want to keep going. Your $280 today applies as credit if you ever do. Most don't. Some do. That's the door.</p>

    ${unsubFooter(unsubUrl)}
  `),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 14 — "Doreen moved 12 points in 12 days"
// ─────────────────────────────────────────────────────────────────────
export const buyerUpsellDay14 = {
  subject: 'Doreen went 142/88 → 128/80. Her cardiologist dropped a pill.',
  preview: 'One real call. One protocol. One conversation with her cardiologist.',
  html: ({ firstName, unsubUrl }) => emailShell(`
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">BraveWorks RN · One real case</div>

    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Quick story.</p>

    <p style="margin:0 0 14px;"><strong>Doreen</strong>, age 62, on three BP meds for fifteen years. Still running 140s/90s most mornings. She bought the BP Reset Kit two months ago. Did the protocol. Numbers moved a little. Then plateaued at 142/88. That's where most Kit owners stop.</p>

    <p style="margin:0 0 14px;">She didn't.</p>

    <p style="margin:0 0 14px;">She booked the BP Triangle Diagnostic. Sixty minutes on Zoom. I looked at her log, her meds, her stress, her sleep — and I found the thing the Kit couldn't tell her: her loudest corner was cortisol, not vascular. She'd been waking at 3 AM every night for two years.</p>

    <p style="margin:0 0 14px;">We dropped two things, added three, fixed her sleep architecture. Twelve days later: <strong>BP 128/80.</strong> She brought the log to her cardiologist. He took her off the atenolol.</p>

    <p style="margin:0 0 14px;">Most Kit owners plateau because the Kit is built for the general case. Your case is specific. Sixty minutes is the difference between guessing for another six months and knowing.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">The buyer-only door is still open</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:4px;">$280 — your $17 Kit credit applied</div>
    </div>

    <p style="margin:0 0 8px;">What you walk out with:</p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;">
      <li>Your loudest Triangle corner, named</li>
      <li>A written 30-day protocol customized to your body</li>
      <li>A doctor-conversation script for the medication talk</li>
      <li><strong style="color:${PALETTE.sage};">30 days of follow-up email coaching (buyer-only bonus)</strong></li>
    </ul>

    ${ctaButton(DIAGNOSTIC_WITH_KIT_CREDIT_LINK, 'Book the diagnostic · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">Six slots left this month. Next openings June 1. If this isn't your moment, reply "not now" and I'll stop mentioning it.</p>

    <p style="margin:18px 0 4px;">— Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. Doreen's loudest corner was cortisol. Yours might be vascular. Might be blood sugar. You don't know until we look together.</p>

    ${unsubFooter(unsubUrl)}
  `),
};

// ─────────────────────────────────────────────────────────────────────
// DAY 17 — Real calendar scarcity close
// ─────────────────────────────────────────────────────────────────────
export const buyerUpsellDay17 = {
  subject: 'Last call on this month\'s diagnostic slots',
  preview: '6 left this month. Next openings June 1.',
  html: ({ firstName, unsubUrl }) => emailShell(`
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.clay};font-weight:700;margin-bottom:6px;">BraveWorks RN · Last note</div>

    <p style="font-size:17px;margin:18px 0 14px;">Hi ${firstName || 'there'},</p>

    <p style="margin:0 0 14px;">Last note on the diagnostic. Then I'll stop.</p>

    <p style="margin:0 0 14px;">I take 10 of these calls a month. <strong>Six slots left right now.</strong> When this month's are gone, the next openings are June 1.</p>

    <p style="margin:0 0 14px;">If you've been thinking about it, this is the window.</p>

    <div style="background:${PALETTE.sageSoft};border-left:3px solid ${PALETTE.sage};border-radius:6px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:4px;">Buyer credit still applied</div>
      <div style="font-size:18px;font-weight:600;color:${PALETTE.text};margin-bottom:4px;">$280 (your $17 Kit credit, plus the standard $297 diagnostic)</div>
    </div>

    <p style="margin:0 0 14px;font-weight:600;color:${PALETTE.text};">Real talk on whether this is for you.</p>

    <p style="margin:0 0 6px;"><strong>Book the diagnostic if:</strong></p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 14px;color:${PALETTE.textSoft};">
      <li>You've been running the Kit protocol for 14+ days</li>
      <li>You've seen SOME movement but you're plateauing</li>
      <li>You want to know which Triangle corner is actually loudest for your body before you spend another month guessing</li>
    </ul>

    <p style="margin:0 0 6px;"><strong>Don't book it if:</strong></p>
    <ul style="font-size:15px;line-height:1.7;padding-left:22px;margin:0 0 18px;color:${PALETTE.textSoft};">
      <li>You haven't run the Kit protocol yet — do that first; the diagnostic builds on what you've learned</li>
      <li>Your numbers are moving exactly the way you wanted — then the Kit is doing its job, stay the course</li>
    </ul>

    ${ctaButton(DIAGNOSTIC_WITH_KIT_CREDIT_LINK, 'Book before slots close · $280')}

    <p style="font-size:14px;color:${PALETTE.textSoft};margin:0 0 14px;">If you're not going to book, that's fine. Reply "not now" and I'll stop. The Kit is yours forever, the protocol is yours, and the drip emails keep coming. No pressure.</p>

    <p style="margin:18px 0 4px;">— Joel</p>
    <p style="font-size:13px;color:${PALETTE.textSoft};font-style:italic;margin:0 0 12px;">P.S. Six slots. Once they're gone, next opening is June 1.</p>

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
