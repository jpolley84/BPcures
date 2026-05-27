// scripts/send-day1-test.mjs
//
// Test-render and send Day 1 of the 30-Day BPQuiz drip via Resend.
// Lets Joel see the email in his inbox before we wire the full cron.
//
// Usage (run from bpquiz-site/):
//   node --env-file=.env scripts/send-day1-test.mjs
//
// Sends to TEST_TO. From: joel@bpquiz.com (verified domain).
// Reply-to: braveworksrn@gmail.com.

import { Resend } from 'resend';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';

const SUBJECT = '3 lies your doctor told you about blood pressure';
const PREVIEW = "I've been a nurse for years — and these three are the worst.";

// ─── Brand palette (locked, matches purchase-confirmation.js) ─────────
const PALETTE = {
  outerBg: '#FBF8F1',        // cream
  cardBg: '#FFFFFF',          // post background
  text: '#2C3E50',            // primary text
  textSoft: '#3A3A3A',        // body
  accentClay: '#B85A36',      // primary
  accentSage: '#4A6741',      // secondary
  border: '#E8E2D4',          // subtle divider
};

// ─── HTML body ────────────────────────────────────────────────────────
const FIRST_NAME = 'Joel'; // test render — real cron will template {{first_name}}

// New architecture (Joel's call 2026-05-06): Days 1-7 = canonical onboarding.
// Primary CTA on every email = Buy the BP Reset Kit ($17).
// Secondary CTAs (footer) = Join Skool community + Subscribe on YouTube.
// Day 7 = opt-in gate for the deeper 30-day arc.
const KIT_URL = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';   // $17 BP Reset Kit (Blood Pressure Cures starter)
const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
const YOUTUBE_URL = 'https://www.youtube.com/@braveworksrn';        // ← Joel: confirm or swap

const bodyHtml = `
  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Hi ${FIRST_NAME},</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">If you're new here, welcome. I'm Joel — RN, naturopath, founder of BraveWorks.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">If you've been on this list a while: you're about to see something different.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Starting today, I'm sending one email a day for the next 30 days. There's a reason.</p>

  <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">Three lies.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">You've heard all three. You probably believe at least one of them right now. They came from your doctor, your pharmacist, your favorite YouTube health channel — all of them well-meaning, all of them passing on what they were taught.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">I was taught the same things in nursing school.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 28px;">Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.</p>

  <div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">
    <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Here's what's going to happen.</p>
    <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Tomorrow, I crack lie #1 — the one almost every doctor still repeats.</p>
    <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Day 9, lie #2 — and this one is the most personal.</p>
    <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Day 17, lie #3 — and once you see it, you can't look at your prescription the same way again.</p>
  </div>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Between those three, I'll show you exactly what your body is actually asking for.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Twenty-nine more emails. One a day. Same time, same place.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 28px;">If you do the small things I ask along the way, your numbers should be measurably lower by Day 30. That's not a maybe. That's the protocol working the way it always does when someone shows up.</p>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">I'll teach you the framework inside these 7 emails. The actual swaps, the dosing charts, the cuff protocol, the doctor-conversation script — those live inside the BP Reset Kit.</p>

  <!-- Bonus stack reveal -->
  <div style="background:${PALETTE.outerBg};border-radius:12px;padding:22px 24px;margin:0 0 22px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${PALETTE.text};margin:0 0 14px;font-weight:600;">What's actually in the kit:</div>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">
      → <strong style="color:${PALETTE.text};">The 10-Day BP Reset Daily Plan</strong> — every step, day by day <span style="color:#999;">($27)</span>
    </p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">
      → <strong style="color:${PALETTE.text};">Joel's 7 Most-Trusted BP Herbs</strong> with safe dosing ranges <span style="color:#999;">($27)</span>
    </p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">
      → <strong style="color:${PALETTE.text};">The Cardiologist Conversation Script</strong> — what to say at your next visit <span style="color:#999;">($17)</span>
    </p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 8px;">
      → <strong style="color:${PALETTE.text};">The 4 Lifestyle Levers Cheat Sheet</strong> — the small moves that move BP fastest <span style="color:#999;">($17)</span>
    </p>
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">
      → <strong style="color:${PALETTE.text};">Cook For Life Cookbook</strong> — plant-based recipes that lower BP without willpower <span style="color:#999;">($17)</span>
    </p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.text};margin:0;border-top:1px solid ${PALETTE.border};padding-top:12px;">
      <strong>$105 of nurse-vetted protocol. $17 today.</strong>
    </p>
  </div>

  <!-- The Guarantee -->
  <div style="border-left:3px solid ${PALETTE.accentClay};padding:6px 0 6px 18px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:8px;">The 7-Day Refund Promise</div>
    <p style="font-size:15px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      Read every email this week. If you haven't seen your numbers move by Day 7 with honest effort, hit reply with the word <strong style="color:${PALETTE.text};">"refund"</strong> — I'll send your $17 back, no questions, kit yours to keep.
    </p>
  </div>

  <!-- PRIMARY CTA — kit purchase button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center" style="padding:0;">
      <a href="${KIT_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        Get the BP Reset Kit — $17 →
      </a>
    </td></tr>
  </table>

  <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 28px;">See you in the morning.</p>

  <p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">Joel</p>
  <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>

  <div style="border-top:1px solid ${PALETTE.border};padding-top:20px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.S.</strong> Already have the kit? Reply with your starting BP — I read every one. Whatever the number is, you're starting somewhere.
    </p>
  </div>

  <!-- Persistent secondary CTAs (footer block) -->
  <div style="margin-top:24px;padding:20px 22px;background:${PALETTE.outerBg};border-radius:10px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:12px;">Two more ways to follow along</div>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 10px;">
      → <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Join the Skool community</a> &nbsp;<span style="color:#999;">— "How to Be Your Own Doctor"</span>
    </p>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">
      → <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on YouTube</a> &nbsp;<span style="color:#999;">— deeper teachings, weekly</span>
    </p>
  </div>
`;

// ─── Full email shell ─────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${SUBJECT}</title>
  <style>
    body { margin:0; padding:0; background:${PALETTE.outerBg}; }
    a { color:${PALETTE.accentClay}; }
  </style>
</head>
<body style="margin:0;padding:0;background:${PALETTE.outerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${PREVIEW}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.outerBg};">
    <tr><td align="center" style="padding:32px 16px;">

      <!-- Header bar -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 18px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;">BraveWorks Health</div>
          <div style="font-size:11px;letter-spacing:0.08em;color:${PALETTE.textSoft};margin-top:4px;">30-Day BP Reset · Day 1 of 30</div>
        </td></tr>
      </table>

      <!-- Content card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PALETTE.cardBg};border-radius:14px;box-shadow:0 1px 2px rgba(44,62,80,0.04);">
        <tr><td style="padding:36px 36px 32px;">
          ${bodyHtml}
        </td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 16px 0;text-align:center;">
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">
            This is health education from Joel Polley, RN, BraveWorks Health. It is not medical advice and is not a substitute for care from your healthcare provider. If your BP reads above 180/120, seek emergency care. Always consult your prescriber before changing any medication or supplement.
          </p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">
            BraveWorks Health · 4730 South Fort Apache Road, Suite 300, Las Vegas, NV 89147
          </p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">
            You're getting this because you bought the BP Reset Kit. <a href="#" style="color:#8A8A8A;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;

// ─── Plain-text fallback ──────────────────────────────────────────────
const text = `Hi ${FIRST_NAME},

If you're new here, welcome. I'm Joel — RN, naturopath, founder of BraveWorks.

If you've been on this list a while: you're about to see something different.

Starting today, I'm sending one email a day for the next 30 days. There's a reason.

Three lies.

Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.

You've heard all three. You probably believe at least one of them right now. They came from your doctor, your pharmacist, your favorite YouTube health channel — all of them well-meaning, all of them passing on what they were taught.

I was taught the same things in nursing school.

Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.

Here's what's going to happen.

Tomorrow, I crack lie #1 — the one almost every doctor still repeats.

Day 9, lie #2 — and this one is the most personal.

Day 17, lie #3 — and once you see it, you can't look at your prescription the same way again.

Between those three, I'll show you exactly what your body is actually asking for.

Twenty-nine more emails. One a day. Same time, same place.

If you do the small things I ask along the way, your numbers should be measurably lower by Day 30. That's not a maybe. That's the protocol working the way it always does when someone shows up.

I'll teach you the framework inside these 7 emails. The actual swaps, the dosing charts, the cuff protocol, the doctor-conversation script — those live inside the BP Reset Kit.

What's actually in the kit:
→ The 10-Day BP Reset Daily Plan — every step, day by day ($27)
→ Joel's 7 Most-Trusted BP Herbs with safe dosing ranges ($27)
→ The Cardiologist Conversation Script — what to say at your next visit ($17)
→ The 4 Lifestyle Levers Cheat Sheet — the moves that move BP fastest ($17)
→ Cook For Life Cookbook — plant-based recipes that lower BP without willpower ($17)

$105 of nurse-vetted protocol. $17 today.

THE 7-DAY REFUND PROMISE: Read every email this week. If you haven't seen your numbers move by Day 7 with honest effort, hit reply with the word "refund" — I'll send your $17 back, no questions, kit yours to keep.

→ Get the BP Reset Kit ($17): ${KIT_URL}

See you in the morning.

Joel
RN, BraveWorks

P.S. Already have the kit? Reply with your starting BP — I read every one.

—

Two more ways to follow along:
→ Join the Skool community: ${SKOOL_URL}
→ Subscribe on YouTube: ${YOUTUBE_URL}

---
This is health education, not medical advice. If your BP reads above 180/120, seek emergency care.
BraveWorks Health · Las Vegas, NV
`;

// ─── Send ─────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY not set. Run with: node --env-file=.env scripts/send-day1-test.mjs');
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log(`→ Sending Day 1 test to ${TEST_TO} from ${FROM}...`);

  const result = await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: TEST_TO,
    subject: SUBJECT,
    html,
    text,
    headers: {
      'X-Entity-Ref-ID': `bpquiz-drip-day1-test-${Date.now()}`,
    },
    tags: [
      { name: 'campaign', value: 'bpquiz-30day-drip' },
      { name: 'day', value: '1' },
      { name: 'mode', value: 'test' },
    ],
  });

  if (result.error) {
    console.error('✗ Resend error:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  console.log(`✓ Sent. Message ID: ${result.data?.id}`);
  console.log(`  To: ${TEST_TO}`);
  console.log(`  Subject: ${SUBJECT}`);
  console.log(`  Preview: ${PREVIEW}`);
}

main().catch((err) => {
  console.error('✗ Fatal:', err);
  process.exit(1);
});
