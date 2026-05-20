// scripts/send-newsletter-2026-05-19.mjs
//
// FIRST weekly newsletter — establishes the format going forward.
// Target: every drip:* record where state === 'newsletter' (~3,596 as of
// 2026-05-17 migration). These are imports + post-Day-14 graduates who
// have been silent since their first 7 universal-drip emails.
//
// Standard format (clone this for future Tuesdays):
//   1. Personal Tuesday-note opener
//   2. THIS WEEK'S TEACH — one Pressure-corner concept + one action
//   3. YouTube deep-dive CTA
//   4. WHAT'S OPEN — current offers block, sized to audience
//   5. Monday Live + Skool soft CTAs
//   6. Joel sign-off + P.S.
//
// Audience-aware pitch: for newsletter-state subscribers, the primary
// offer is the $297 BP Triangle Diagnostic Session (Joel's directive
// 2026-05-19: "if you havent gotten a kit, i am opening up a diagnostic
// session for 297"). Secondary mention: $17 starter kit as the entry
// ladder for those not ready for $297.
//
// Modes:
//   --dry-run                Preview (default)
//   --send                   Fire to ALL state==='newsletter' records (~3,596)
//   --send-test=email@addr   Fire ONLY to one address for review
//
// Rate limit: 250ms throttle (4/sec) — Resend free-tier ceiling is 5/sec.
// Full 3,596-record blast = ~15 minutes.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const TEST_ARG = args.find((a) => a.startsWith('--send-test='));
const TEST_EMAIL = TEST_ARG ? TEST_ARG.split('=')[1] : null;

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

if (!process.env.RESEND_API_KEY) { console.error('ERR: RESEND_API_KEY missing'); process.exit(1); }
if (!process.env.KV_REST_API_URL) { console.error('ERR: KV_REST_API_URL missing'); process.exit(1); }

const { Resend } = await import('resend');
const { kv } = await import('@vercel/kv');
const { signUnsubToken } = await import('../api/unsubscribe.js');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── This Week's Content ──────────────────────────────────────────────
// Topic: Stress Pressure intro + the 10 PM rule.
// YouTube: Joel's channel — link to specific video if/when he provides URL.
const SUBJECT_A = 'The corner cardiologists never measure';
const SUBJECT_B = 'Tuesday note — the 10 PM rule';
const PREVIEW   = 'One simple shift that drops morning BP 5-8 points in 14 days.';
const ISSUE_NUMBER = '#1';
const ISSUE_DATE = 'Tuesday, May 19, 2026';

const YOUTUBE_VIDEO_URL = 'https://youtu.be/a99KZHATsWc';
const YOUTUBE_VIDEO_TITLE = 'this week\'s live walkthrough on YouTube';

const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010';
const ZOOM_URL = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';
const COACHING_URL = `${SITE_URL}/coaching`;
const KIT_URL = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';

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
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${opts.margin || '0 0 18px'};">${text}</p>`;
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
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
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

function shell({ body, unsubUrl }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${SUBJECT_A}</title></head>
<body style="margin:0;padding:0;background:${PALETTE.outerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${PREVIEW}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.outerBg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 18px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;">BraveWorks Tuesday Note ${ISSUE_NUMBER}</div>
          <div style="font-size:11px;letter-spacing:0.08em;color:${PALETTE.textSoft};margin-top:4px;">${ISSUE_DATE} · Joel Polley, RN</div>
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PALETTE.cardBg};border-radius:14px;box-shadow:0 1px 2px rgba(44,62,80,0.04);">
        <tr><td style="padding:36px 36px 32px;">${body}</td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 16px 0;text-align:center;">
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">This is health education from Joel Polley, RN, BraveWorks Health. Not medical advice. If your BP reads above 180/120, seek emergency care. Always consult your prescriber before changing any medication or supplement.</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">BraveWorks Health · 4730 South Fort Apache Road, Suite 300, Las Vegas, NV 89147</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">You're getting the BraveWorks Tuesday Note. <a href="${unsubUrl}" style="color:#8A8A8A;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const htmlBody = ({ firstName, unsubUrl }) => shell({
  unsubUrl,
  body: `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This is the first of what I'm sending every Tuesday from here forward. One topic. One thing you can try this week. One conversation worth having with your doctor. And, when something specific is open, an invitation.`)}
    ${p(`Let's start with the corner most cardiologists never measure.`, { margin: '0 0 28px' })}

    ${bigQuote('This week — Stress Pressure.')}
    ${p(`Most women come to me thinking their BP is a <strong style="color:${PALETTE.text};">vascular problem</strong> — stiff arteries, more medication, that's the story. But twenty years in the ICU taught me a different one. The lead domino is almost always <strong style="color:${PALETTE.text};">Stress Pressure</strong> — what most people call cortisol — and cortisol is the driver most cardiologists don't even measure.`)}
    ${p(`Here's how to tell if it's loudest in you: <strong style="color:${PALETTE.text};">if your morning reading is higher than your evening reading</strong>, Stress Pressure is the corner driving you. Your cortisol curve dumps its biggest load between 4 and 8 AM. By the time you sit down for breakfast, your vessels are already constricted.`, { margin: '0 0 28px' })}

    ${bigQuote('The 10 PM rule.')}
    ${p(`The fix isn't a pill. Slow-wave cortisol clearance peaks between <strong style="color:${PALETTE.text};">10 PM and 2 AM</strong>. Sleep onset at 10 PM gives you about three hours inside that window. Sleep onset at 1 AM gives you zero — even if you sleep until 8.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's micro-action:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Move your bedtime to 10:30 PM. Two minutes earlier each night until you're there. Don't try to muscle it in one jump. Most women see a <strong style="color:${PALETTE.text};">5-8 mmHg drop in morning systolic by Day 14</strong> from this alone. No supplement. No prescription. Just the hours before midnight doing what they were built to do.</p>
    `)}
    ${p(`Track your morning BP this week. Same arm, sitting, two minutes of quiet first. Write it down. Day 14 you compare.`, { margin: '0 0 28px' })}

    ${bigQuote('Watch this week\'s live walkthrough.')}
    ${p(`I went live this week and the recording is up on YouTube. Bring your morning BP and your cuff — it's the kind of session where you can pause, take a reading, and see what I'm walking through in real time.`)}
    ${ctaButton(YOUTUBE_VIDEO_URL, 'Watch the live walkthrough →')}

    ${bigQuote("What's open this week.")}
    ${p(`If you don't have a BP Starter Kit yet, I want to put two doors in front of you:`)}
    ${clayBlock('THE DIRECT PATH — $297 BP TRIANGLE DIAGNOSTIC SESSION', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Sixty minutes with me on Zoom. Your numbers, your meds, your stress, your supplements all looked at together. You walk out with a written 30-day protocol matched to which of the Three Pressures is loudest in you. <strong style="color:${PALETTE.text};">I only take 5 of these a month.</strong></p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${COACHING_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Book the Diagnostic ($297)</a></p>
    `)}
    ${clayBlock('THE ENTRY POINT — $17 BP STARTER KIT', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">If $297 isn't where you are yet, the $17 BP Starter Kit gives you the 10-day daily map, my 7 most-trusted BP herbs with doses, the cardiologist conversation script, and the four lifestyle levers that move BP fastest.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <a href="${KIT_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">Get the Starter Kit ($17)</a></p>
    `)}

    ${bigQuote('Monday Live — every week, 10 PM ET.')}
    ${p(`Every Monday I'm on Zoom for sixty minutes with the cohort. <strong style="color:${PALETTE.text};">Hot-seat format</strong> — each woman gets a few minutes to describe what's happening with her specifically: morning readings, the symptom that won't go away, the question your cardiologist brushed off. I answer live, with the whole cohort listening so everyone learns from your case.`)}
    ${p(`Bring your cuff. Bring your last three readings. Bring the question that's been bugging you. The Zoom link lives in the Skool community below — same link every week.`, { margin: '0 0 28px' })}

    ${bigQuote('Free Skool community — "How to Be Your Own Doctor."')}
    ${p(`If you're not in yet, the community is free to join. It's where the Monday Live recordings land, where I post the weekly herb deep-dive, and where the women on this list trade morning BP wins and food swaps.`)}
    ${ctaButton(SKOOL_URL, 'Join "How to Be Your Own Doctor" (free) →')}

    ${p(`That's it for this week. Hit reply if Stress Pressure resonates — themes from the replies become next Tuesday's note.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you're already taking morning readings and your evening number is HIGHER than your morning number — Stress Pressure isn't your loudest corner. Your loudest corner is probably Sugar Pressure (the insulin curve). Next Tuesday I'll walk that one — bring your data.`)}
  `,
});

const textBody = ({ firstName }) => `Hi ${firstName || 'there'},

This is the first of what I'm sending every Tuesday from here forward. One topic. One thing you can try this week. One conversation worth having with your doctor.

THIS WEEK — STRESS PRESSURE.

Most women think their BP is a vascular problem. Twenty years in the ICU taught me a different story. The lead domino is almost always STRESS PRESSURE — what most people call cortisol — and cortisol is the driver most cardiologists don't even measure.

Here's how to tell if it's loudest in you: IF YOUR MORNING READING IS HIGHER THAN YOUR EVENING READING, Stress Pressure is driving you. Your cortisol curve dumps its biggest load between 4 and 8 AM.

THE 10 PM RULE.

Slow-wave cortisol clearance peaks between 10 PM and 2 AM. Sleep onset at 10 PM gives you about three hours inside that window. Sleep onset at 1 AM gives you zero — even if you sleep until 8.

THIS WEEK'S MICRO-ACTION: Move bedtime to 10:30 PM. Two minutes earlier each night until you're there. Don't muscle it in one jump. Most women see a 5-8 mmHg drop in morning systolic by Day 14. No supplement. No prescription.

Track your morning BP this week. Same arm, sitting, two minutes of quiet first.

WATCH THIS WEEK'S LIVE WALKTHROUGH.

I went live this week and the recording is up on YouTube. Bring your morning BP and your cuff — pause, take a reading, see what I'm walking through in real time.

→ Watch the live walkthrough: ${YOUTUBE_VIDEO_URL}

WHAT'S OPEN THIS WEEK.

If you don't have a Starter Kit yet — two doors:

THE DIRECT PATH — $297 BP TRIANGLE DIAGNOSTIC SESSION
Sixty minutes with me on Zoom. Your numbers, your meds, your stress all looked at together. Written 30-day protocol matched to which of the Three Pressures is loudest in you. I only take 5 of these a month.
→ ${COACHING_URL}

THE ENTRY POINT — $17 BP STARTER KIT
The 10-day daily map, my 7 most-trusted BP herbs with doses, the cardiologist conversation script, and the four lifestyle levers that move BP fastest.
→ ${KIT_URL}

MONDAY LIVE — EVERY WEEK, 10 PM ET.

Every Monday I'm on Zoom for sixty minutes. Hot-seat format — each woman gets a few minutes to describe what's happening with her specifically. I answer live. The Zoom link lives in the Skool community — same link every week.

FREE SKOOL COMMUNITY — "HOW TO BE YOUR OWN DOCTOR."

→ Join free: ${SKOOL_URL}

That's it for this week. Hit reply if Stress Pressure resonates — themes from the replies become next Tuesday's note.

Joel
RN, BraveWorks

P.S. If your evening number is HIGHER than your morning number — Stress Pressure isn't your loudest. Your loudest is probably Sugar Pressure (the insulin curve). Next Tuesday I'll walk that one — bring your data.
`;

// ─── Recipient query ───────────────────────────────────────────────────

async function getRecipients() {
  if (TEST_EMAIL) {
    const r = await kv.get(`drip:${TEST_EMAIL}`);
    if (!r) return [{ email: TEST_EMAIL, firstName: '', _note: 'test mode, no KV record' }];
    return [{ email: TEST_EMAIL, firstName: r.firstName || '', _note: `state=${r.state}` }];
  }
  const allKeys = await kv.keys('drip:*');
  const recipients = [];
  for (const k of allKeys) {
    const r = await kv.get(k);
    if (!r || !r.email) continue;
    if (r.unsubscribed) continue;
    if (r.state !== 'newsletter') continue;
    recipients.push({ email: r.email, firstName: r.firstName || '' });
  }
  return recipients;
}

// ─── Send loop ─────────────────────────────────────────────────────────

console.log(`Mode: ${SEND || TEST_EMAIL ? (TEST_EMAIL ? `SEND-TEST → ${TEST_EMAIL}` : 'SEND (LIVE — all newsletter state)') : 'DRY RUN'}`);
console.log(`Subject: ${SUBJECT_A}\n`);

const recipients = await getRecipients();
console.log(`Recipients: ${recipients.length}\n`);

if (!SEND && !TEST_EMAIL) {
  console.log('Sample recipients (first 10):');
  for (const r of recipients.slice(0, 10)) {
    console.log(`  ${r.email}  ${r.firstName ? `(${r.firstName})` : ''}`);
  }
  console.log('\nDry-run only. Re-run with --send to fire to ALL, or --send-test=email@addr to fire to ONE.');
  process.exit(0);
}

let sent = 0;
let failed = 0;
const errors = [];

for (const r of recipients) {
  const unsubToken = signUnsubToken({ email: r.email });
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: r.email,
      replyTo: REPLY_TO,
      subject: SUBJECT_A,
      html: htmlBody({ firstName: r.firstName, unsubUrl }),
      text: textBody({ firstName: r.firstName }),
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'campaign', value: 'tuesday-newsletter' },
        { name: 'issue', value: ISSUE_NUMBER },
      ],
    });
    sent++;
    if (sent % 50 === 0) console.log(`  ${sent}/${recipients.length} sent...`);
  } catch (err) {
    failed++;
    errors.push({ email: r.email, message: err.message });
    if (errors.length <= 5) console.error(`  ✗ ${r.email}: ${err.message}`);
  }
  // Resend free tier = 5/sec. 250ms = 4/sec safe.
  await new Promise((res) => setTimeout(res, 250));
}

console.log(`\nDone. Sent: ${sent} / ${recipients.length}. Failed: ${failed}.`);
if (errors.length) {
  console.log('First 5 errors:');
  for (const e of errors.slice(0, 5)) console.log(`  ${e.email}: ${e.message}`);
}
