// scripts/send-bridge-emails-3-tier2-buyers.mjs
//
// Joel-approved bridge emails to the 3 known $97 BP Triangle Challenge
// buyers (Shenette / Phyllis / Dora) whose Stripe purchases bypassed
// the webhook flow, so they never got the Challenge fulfillment.
//
// Each apologizes for the gap and sets expectation that bonuses + Zoom
// link + Skool VIP invite are landing in a SEPARATE email this week.
//
// Modes:
//   --dry-run     Print what would send (default)
//   --send        Actually fire via Resend
//
// Approved 2026-05-19 per Joel: "we'll send their bonuses and links in
// a separate email — send that for now."

import fs from 'node:fs';
import path from 'node:path';

const SEND = process.argv.includes('--send');

function loadEnv() {
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1'));
  const repoRoot = path.resolve(here, '..');
  for (const file of ['.env.local', '.env']) {
    const p = path.join(repoRoot, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

if (!process.env.RESEND_API_KEY) {
  console.error('ERR: RESEND_API_KEY missing'); process.exit(1);
}

const { Resend } = await import('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// We'll import signUnsubToken so each email has a working unsub link
// (the drip-cron path is broken; this script uses the correct one).
const { signUnsubToken } = await import('../api/unsubscribe.js');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

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

function shell({ subject, preview, body, unsubUrl }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${PALETTE.outerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.outerBg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 18px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;">BraveWorks Health</div>
          <div style="font-size:11px;letter-spacing:0.08em;color:${PALETTE.textSoft};margin-top:4px;">BP Triangle Challenge · From Joel directly</div>
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PALETTE.cardBg};border-radius:14px;box-shadow:0 1px 2px rgba(44,62,80,0.04);">
        <tr><td style="padding:36px 36px 32px;">${body}</td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 16px 0;text-align:center;">
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">This is health education from Joel Polley, RN, BraveWorks Health. Not medical advice. If your BP reads above 180/120, seek emergency care. Always consult your prescriber before changing any medication or supplement.</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">BraveWorks Health · 4730 South Fort Apache Road, Suite 300, Las Vegas, NV 89147</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">You're getting this because you bought the BP Triangle Challenge. <a href="${unsubUrl}" style="color:#8A8A8A;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── EMAIL 1 — PHYLLIS ──────────────────────────────────────────────
const phyllisHtml = ({ unsubUrl }) => shell({
  subject: 'Phyllis — I owe you a real apology + your Challenge bonuses',
  preview: 'Eighteen days into the BP Triangle Challenge, your bonuses haven\'t shipped. Today I fix it.',
  unsubUrl,
  body: `
    ${p(`Hi Phyllis,`)}
    ${p(`I owe you an honest note before I owe you anything else.`)}
    ${p(`You enrolled in the BP Triangle Challenge eighteen days ago. The promise of that program was a daily chapter walkthrough of the Three Pressures, two bonus kits, a weekly Monday call with me, and the Skool VIP community. What you actually received was four general onboarding emails and silence. That's not what you bought, and it's on me.`)}
    ${p(`Here's what I'm fixing today, and what's coming this week.`, { margin: '0 0 28px' })}

    ${bigQuote('This week — your Challenge bonuses, delivered.')}
    ${p(`The two kits you've been owed are landing in your inbox in a separate email this week — the <strong style="color:${PALETTE.text};">10-Day Cortisol Reset Kit</strong> and the <strong style="color:${PALETTE.text};">Blood Sugar 10-Day Reset</strong>. These are the same kits I send to my $497 cohort buyers. You'll get them as PDFs you can read on your phone or print out, with day-by-day prompts. The Cook For Life Cookbook is your graduation gift — that lands when you finish 30 days from today.`, { margin: '0 0 28px' })}

    ${bigQuote('Next Monday — the Live call. Mark your calendar.')}
    ${p(`Every Monday at <strong style="color:${PALETTE.text};">10:00 PM ET</strong> I open Zoom and we work through whoever is on the call. <strong>Next week's call is Monday, May 25.</strong> Bring your cuff. Bring your last three readings. Bring the question that's been bugging you.`)}
    ${p(`I'll send your Monday Zoom link and your Skool VIP invite in a separate email later this week. Watch for both. Same Zoom link every week, so save it once when it lands.`, { margin: '0 0 28px' })}
    ${p(`If you can't make Monday's call live, send me your question by reply to this email. I'll answer it on the call and the recording lands in Skool within 24 hours of the call ending.`, { margin: '0 0 28px' })}

    ${bigQuote('From here forward — the chapter walkthroughs.')}
    ${p(`I'm restarting your Challenge content from today, Day 1. You'll get the <strong style="color:${PALETTE.text};">Stress Pressure chapter</strong> in 3 days, <strong style="color:${PALETTE.text};">Sugar Pressure</strong> in 6, and <strong style="color:${PALETTE.text};">Pipe Pressure + your Cortisol Kit unlock</strong> in 9. We will run the full 30-day arc you paid for, starting now.`)}
    ${p(`I'm sorry it took eighteen days to land this in your inbox correctly. If you have any questions — or want a phone call to talk through where your numbers are sitting today — hit reply and I'll get back to you within 24 hours.`, { margin: '0 0 28px' })}

    ${joelSignoff()}
    ${psBox(`If you've been taking your morning readings during these eighteen days even without the daily emails — bring those numbers to Monday May 25's call. That data is what we'll work from to map your Triangle. If you haven't been taking readings, no shame — start tomorrow morning. Two minutes, sitting, same arm. Day 1 is the day you decide it's Day 1.`)}
  `,
});

// ─── EMAIL 2 — SHENETTE ─────────────────────────────────────────────
const shenetteHtml = ({ unsubUrl }) => shell({
  subject: 'Shenette — your Cortisol Kit (overdue by a day)',
  preview: 'Your Day-9 Cortisol Reset Kit didn\'t land on time. Fixing it today.',
  unsubUrl,
  body: `
    ${p(`Hi Shenette,`)}
    ${p(`Quick honest note. You're ten days into the BP Triangle Challenge and one bonus that should have landed on Day 9 has not reached your inbox yet — that's on me.`, { margin: '0 0 28px' })}

    ${bigQuote('What\'s overdue.')}
    ${p(`The <strong style="color:${PALETTE.text};">10-Day Cortisol Reset Kit</strong> unlocks on Day 9 of the Challenge — same kit I send to my $497 cohort buyers. It walks the Stress Pressure corner with day-by-day prompts: morning sun timing, ashwagandha protocol, gratitude practice scripts, the 4-7-8 breath, and a 5-minute sleep audit. It's coming to your inbox in a separate email later this week.`, { margin: '0 0 28px' })}

    ${bigQuote('Coming next, on schedule.')}
    ${p(`Your <strong style="color:${PALETTE.text};">Blood Sugar 10-Day Reset</strong> unlocks on Day 12 — that's in two days. The <strong style="color:${PALETTE.text};">Cook For Life Cookbook</strong> is your graduation gift, landing on Day 30. From here forward, the cohort calendar runs the way it's supposed to.`, { margin: '0 0 28px' })}

    ${bigQuote('Next Live call — Monday, May 25 at 10:00 PM ET.')}
    ${p(`Every Monday at <strong style="color:${PALETTE.text};">10:00 PM ET</strong> I open Zoom and we work through whoever shows up. Bring your cuff, your last three readings, and the question that's been on your mind.`)}
    ${p(`I'll send your Monday Zoom link and your Skool VIP invite in a separate email later this week. Watch for both. Once that link is in your phone, save it — same Zoom every Monday.`, { margin: '0 0 28px' })}

    ${p(`If anything in this email doesn't land — confusion about the bonuses, the Zoom, the Skool invite — hit reply and tell me. I read every one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`You're already halfway to the mid-cohort check-in on Day 15 — that's the day I ask you for three numbers: your Day 0 baseline, your this-week average, and the one symptom that has changed most. Start writing them down now so you have a clean comparison when the email lands Friday.`)}
  `,
});

// ─── EMAIL 3 — DORA ─────────────────────────────────────────────────
const doraHtml = ({ unsubUrl }) => shell({
  subject: 'Dora — your Cortisol Kit + Blood Sugar Kit (both overdue)',
  preview: 'Day 19 of your Challenge. The bonus kits should have landed already. Fixing it now.',
  unsubUrl,
  body: `
    ${p(`Hi Dora,`)}
    ${p(`You're nineteen days into the BP Triangle Challenge and both of the bonus kits you paid for have not landed in your inbox yet. That's on me. Here's the fix.`, { margin: '0 0 28px' })}

    ${bigQuote('This week — both bonuses, delivered.')}
    ${p(`You'll get two separate emails this week. The first is the <strong style="color:${PALETTE.text};">10-Day Cortisol Reset Kit</strong> (should have landed Day 9). The second is the <strong style="color:${PALETTE.text};">Blood Sugar 10-Day Reset</strong> (should have landed Day 12). Both are PDFs you can read on your phone or print out, with day-by-day prompts. These are the same kits I send to my $497 cohort buyers.`, { margin: '0 0 28px' })}

    ${p(`<strong style="color:${PALETTE.text};">On Day 30 — your graduation gift.</strong> The <strong style="color:${PALETTE.text};">Cook For Life Cookbook</strong> lands when you finish — 11 days from today. Forty-five plant-rich meals built around the foods that quiet all three Pressures.`, { margin: '0 0 28px' })}

    ${bigQuote('The Monday Live calls — next call Monday, May 25 at 10:00 PM ET.')}
    ${p(`Every Monday at <strong style="color:${PALETTE.text};">10:00 PM ET</strong> I open Zoom and we work through whoever is on. You're past the halfway mark of the Challenge — bring your morning readings from the last two weeks. If your numbers have moved (most readers see 5–12 mmHg systolic drop by Day 15) we'll look at what to keep doing. If they haven't moved, we'll find which Pressure is still loudest and adjust.`)}
    ${p(`I'll send your Monday Zoom link and your Skool VIP invite in a separate email later this week. Watch for both. Save the Zoom link once — same one every Monday.`, { margin: '0 0 28px' })}

    ${bigQuote('What\'s coming next.')}
    ${p(`In three days I'll send you "<strong style="color:${PALETTE.text};">Wakita's Monday — a peek inside the 90-day work</strong>." Wakita is my first 1:1 client, and that email walks through what the deeper room looks like after the Challenge ends. It's not a pitch — it's so you know what room is open if you want to keep going past Day 30.`, { margin: '0 0 28px' })}

    ${p(`If anything in this email doesn't land — confusion about the bonuses, the Zoom, the Skool invite — hit reply and tell me. I read every one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Day 30 is your graduation day, eleven days from today. On that day I ask one thing: take a Day-30 morning reading and write it next to your Day-0 number. Look at the difference. Most women see 8–15 systolic points down by then. Whatever your number is, post it in Skool — the women still doing the Challenge need to see what's possible.`)}
  `,
});

// ─── Text fallbacks (plain) ─────────────────────────────────────────
const phyllisText = () => `Hi Phyllis,

I owe you an honest note before I owe you anything else.

You enrolled in the BP Triangle Challenge eighteen days ago. The promise was a daily chapter walkthrough of the Three Pressures, two bonus kits, a weekly Monday call with me, and the Skool VIP community. What you got was four general onboarding emails and silence. That's not what you bought, and it's on me.

THIS WEEK — YOUR CHALLENGE BONUSES, DELIVERED.

The two kits you've been owed are landing in a separate email this week — the 10-Day Cortisol Reset Kit and the Blood Sugar 10-Day Reset. Same kits I send to my $497 cohort buyers. PDFs with day-by-day prompts. The Cook For Life Cookbook is your graduation gift on Day 30.

NEXT MONDAY — THE LIVE CALL. MARK YOUR CALENDAR.

Every Monday at 10:00 PM ET I open Zoom. Next week's call is Monday, May 25. Bring your cuff. Bring your last three readings.

I'll send your Monday Zoom link and your Skool VIP invite in a separate email later this week. Watch for both.

If you can't make Monday's call live, reply to this email with your question — I'll answer it on the call. Recording lands in Skool within 24 hours.

FROM HERE FORWARD — THE CHAPTER WALKTHROUGHS.

I'm restarting your Challenge content from today, Day 1. Stress Pressure chapter in 3 days. Sugar Pressure in 6. Pipe Pressure + Cortisol Kit unlock in 9. Full 30-day arc you paid for, starting now.

I'm sorry it took eighteen days to land this in your inbox correctly. Reply if you want to talk through where your numbers are today.

Joel
RN, BraveWorks

P.S. If you've been taking morning readings during these eighteen days, bring those numbers to Monday May 25's call. That data is what we work from. If not, start tomorrow morning. Two minutes, sitting, same arm. Day 1 is the day you decide it's Day 1.
`;

const shenetteText = () => `Hi Shenette,

Quick honest note. You're ten days into the BP Triangle Challenge and one bonus that should have landed on Day 9 hasn't reached your inbox — that's on me.

WHAT'S OVERDUE: The 10-Day Cortisol Reset Kit unlocks on Day 9 — same kit I send to my $497 cohort buyers. Walks the Stress Pressure corner: morning sun timing, ashwagandha, gratitude scripts, 4-7-8 breath, 5-minute sleep audit. Coming in a separate email this week.

COMING NEXT, ON SCHEDULE: Your Blood Sugar 10-Day Reset unlocks on Day 12 (two days). The Cook For Life Cookbook is your graduation gift on Day 30.

NEXT LIVE CALL — MONDAY, MAY 25 AT 10:00 PM ET.

Every Monday at 10:00 PM ET I open Zoom. Bring your cuff, your last three readings, the question on your mind. I'll send your Zoom link + Skool VIP invite in a separate email later this week.

If anything in this email doesn't land, reply and tell me. I read every one.

Joel
RN, BraveWorks

P.S. You're halfway to the mid-cohort check-in on Day 15 — that's when I ask for three numbers: your Day 0 baseline, your this-week average, and the one symptom that's changed most. Start writing them down now.
`;

const doraText = () => `Hi Dora,

You're nineteen days into the BP Triangle Challenge and both bonus kits you paid for haven't landed yet. That's on me.

THIS WEEK — BOTH BONUSES, DELIVERED.

Two separate emails coming this week. First: 10-Day Cortisol Reset Kit (should have landed Day 9). Second: Blood Sugar 10-Day Reset (should have landed Day 12). Both PDFs, day-by-day prompts. Same kits I send to my $497 cohort buyers.

ON DAY 30 — YOUR GRADUATION GIFT. The Cook For Life Cookbook lands when you finish — 11 days from today. 45 plant-rich meals built around the foods that quiet all three Pressures.

THE MONDAY LIVE CALLS — NEXT CALL MONDAY, MAY 25 AT 10:00 PM ET.

Every Monday at 10:00 PM ET I open Zoom. You're past the halfway mark — bring your morning readings from the last two weeks. If numbers have moved (most see 5-12 mmHg systolic drop by Day 15) we'll look at what to keep doing. If they haven't, we'll find which Pressure is still loudest and adjust.

I'll send your Zoom link + Skool VIP invite in a separate email later this week. Save the link once — same one every Monday.

WHAT'S COMING NEXT: In three days I'll send "Wakita's Monday — a peek inside the 90-day work." Wakita is my first 1:1 client. That email walks through the deeper room after the Challenge ends. Not a pitch — so you know what room is open if you want to keep going past Day 30.

Reply if anything doesn't land.

Joel
RN, BraveWorks

P.S. Day 30 is your graduation day, eleven days from today. Take a Day-30 morning reading. Write it next to your Day-0 number. Look at the difference. Most women see 8-15 systolic points down by then. Post it in Skool — the women still doing the Challenge need to see what's possible.
`;

// ─── SENDS ──────────────────────────────────────────────────────────
const SENDS = [
  {
    to: 'phyllisrene26@gmail.com',
    subject: 'Phyllis — I owe you a real apology + your Challenge bonuses',
    html: phyllisHtml,
    text: phyllisText,
  },
  {
    to: 'blksuccessfem@aol.com',
    subject: 'Shenette — your Cortisol Kit (overdue by a day)',
    html: shenetteHtml,
    text: shenetteText,
  },
  {
    to: 'dorajones56@icloud.com',
    subject: 'Dora — your Cortisol Kit + Blood Sugar Kit (both overdue)',
    html: doraHtml,
    text: doraText,
  },
];

console.log(`Mode: ${SEND ? 'SEND (live via Resend)' : 'DRY RUN'}`);
console.log(`Sending ${SENDS.length} bridge emails to known tier-2 buyers\n`);

for (const s of SENDS) {
  const unsubToken = signUnsubToken({ email: s.to });
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
  console.log(`→ ${s.to}`);
  console.log(`    subject: ${s.subject}`);
  console.log(`    unsubUrl: ${unsubUrl}`);

  if (!SEND) {
    console.log(`    (dry-run — re-run with --send to fire)\n`);
    continue;
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: s.to,
      replyTo: REPLY_TO,
      subject: s.subject,
      html: s.html({ unsubUrl }),
      text: s.text(),
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    console.log(`    ✓ SENT  Resend ID: ${result.data?.id || '(no id returned)'}\n`);
    // Rate-limit pause between sends (Resend free tier = 5/sec)
    await new Promise((r) => setTimeout(r, 250));
  } catch (err) {
    console.error(`    ✗ FAILED: ${err.message}\n`);
  }
}

console.log(`Done.`);
