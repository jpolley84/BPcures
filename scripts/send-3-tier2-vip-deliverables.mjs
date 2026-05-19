// scripts/send-3-tier2-vip-deliverables.mjs
//
// Second-touch follow-up emails to the 3 known tier-2 buyers (Phyllis,
// Shenette, Dora). The first email yesterday was the apology + promise
// of bonuses + Zoom + Skool in "a separate email this week." This IS
// that follow-up.
//
// Each email delivers:
//   - Skool VIP classroom link (10 full courses, ~$1,000 value, comped 30 days)
//   - Monday May 25 10 PM ET Zoom link + meeting ID + passcode
//   - Hot-seat framing — Zoom priority over TikTok/FB
//   - TikTok + FB mention as passive watch options
//   - Personalized intro reflecting their cohort day
//   - DM-Joel-in-Skool instruction (Phyllis already VIP, others need check)
//
// Modes:
//   --dry-run    Print what would send (default)
//   --send       Actually fire via Resend

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
const { signUnsubToken } = await import('../api/unsubscribe.js');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010';
const ZOOM_URL = 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';
const ZOOM_ID = '254 885 6205';
const ZOOM_PASSCODE = 'fNCS31';
const TIKTOK_HANDLE = '@braveworksrn';

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
function ctaButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}
function clayBlock(label, html) {
  return `<div style="border-left:3px solid ${PALETTE.accentClay};padding:6px 0 6px 18px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:8px;">${label}</div>
    ${html}
  </div>`;
}
function sageBlock(html) {
  return `<div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">${html}</div>`;
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
          <div style="font-size:11px;letter-spacing:0.08em;color:${PALETTE.textSoft};margin-top:4px;">BP Triangle Challenge · VIP Classroom + Live Call</div>
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

// ─── Shared sections (vary one block per buyer for VIP DM language) ─

const courseListHtml = `
  ${sageBlock(`
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">10-Day High Blood Pressure Challenge</strong> — your home base</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">The Blood Pressure Reset Kit</strong> — the complete BP system from 20 years in the ICU</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">LIVE: 10-Day Cortisol Cure Challenge</strong> — sleep, belly weight, anxiety. The Stress Pressure deep dive.</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">LIVE: Reverse Your Diabetes in 10 Days</strong> — the nurse's protocol your doctor isn't running</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">The Human Machine Blueprint</strong> — your body's 11 systems in 60 minutes</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">How To Create Your Natural Remedies Masterclass</strong> — top 5 remedies + my top 3 essential oils</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">The 7-Day Body Reset Program</strong> — kickstart with weekly group coaching</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Lemonade Detox</strong> — step-by-step home detox</p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">The 90-Day Body Reset Program</strong> — the full transformation arc</p>
  `)}
  ${p(`Plus a <strong style="color:${PALETTE.text};">10-Day Weight Loss Challenge</strong> coming soon — when it launches inside your 30 days, you have it.`, { margin: '0 0 28px' })}
`;

const monthlyZoomHtml = `
  ${bigQuote('Monday May 25 — your weekly Live call.')}
  ${p(`Every Monday at <strong style="color:${PALETTE.text};">10:00 PM ET</strong> I'm on Zoom for sixty minutes with the VIP cohort across all the courses. <strong>Next call is Monday, May 25.</strong>`)}
  ${ctaButton(ZOOM_URL, 'Join the Monday Zoom call →')}
  ${clayBlock('Zoom — save this once, use every Monday', `
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;word-break:break-all;"><a href="${ZOOM_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">${ZOOM_URL}</a></p>
    <p style="font-size:13px;line-height:1.5;color:${PALETTE.textSoft};margin:0;">Meeting ID: <strong style="color:${PALETTE.text};">${ZOOM_ID}</strong> &nbsp;·&nbsp; Passcode: <strong style="color:${PALETTE.text};">${ZOOM_PASSCODE}</strong></p>
  `)}
`;

const hotSeatHtml = `
  ${bigQuote('The Hot Seat — the real reason to be on Zoom.')}
  ${p(`Zoom is the call where you get the hot seat. I go around the room and each member gets a few minutes to describe what's happening with HER specifically — your readings this week, the symptom that won't go away, the question your cardiologist brushed off, the supplement you're not sure about. I answer live, looking at you, with the whole cohort listening so everyone learns from your case.`)}
`;

const tiktokFbHtml = `
  ${bigQuote('TikTok and Facebook — same Monday, watching only.')}
  ${p(`I'll also be live on TikTok and Facebook at the same time. Good if you can't make Zoom or just want to listen in.`)}
  ${sageBlock(`
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;">→ TikTok: <strong style="color:${PALETTE.text};">${TIKTOK_HANDLE}</strong></p>
    <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ Facebook: <strong style="color:${PALETTE.text};">BraveWorks RN page</strong></p>
  `)}
  ${p(`But TikTok and Facebook are passive. You can't unmute, you can't raise your hand, I can't see your face or your numbers. <strong style="color:${PALETTE.text};">If you can make Zoom, make Zoom.</strong> The hot seat doesn't happen on TikTok.`, { margin: '0 0 28px' })}
`;

// ─── EMAIL 1 — PHYLLIS (already VIP) ────────────────────────────────
const phyllisHtml = ({ unsubUrl }) => shell({
  subject: 'Phyllis — your VIP classroom is open + Zoom link inside',
  preview: 'Full VIP classroom access for 30 days. Monday May 25 hot-seat call on Zoom.',
  unsubUrl,
  body: `
    ${p(`Hi Phyllis,`)}
    ${p(`Yesterday I sent you an apology. Today I send you more than what was originally promised.`)}
    ${p(`For the gap in delivery, I'm comping you <strong style="color:${PALETTE.text};">full VIP access to my Skool classroom for the next 30 days</strong> — every course in the library, no extra charge. That's about $1,000 of content unlocked. Use it for the month; keep what you build with it forever.`, { margin: '0 0 28px' })}

    ${bigQuote('Step 1 — open your VIP classroom.')}
    ${ctaButton(SKOOL_URL, 'Open the Skool VIP classroom →')}
    ${clayBlock("You're already a VIP member", `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Your VIP status is already on. When you log in, click the <strong style="color:${PALETTE.text};">Classroom</strong> tab — all 10 courses unlock for you.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Send me a direct message in Skool so I have your handle and I can wave you in personally. One line is enough: "Hey Joel, I'm in."</p>
    `)}

    ${bigQuote('Step 2 — what\'s inside (the whole library).')}
    ${p(`For the next 30 days you have access to every one of these:`)}
    ${courseListHtml}
    ${p(`Don't try to do all of it. Start with <strong style="color:${PALETTE.text};">10-Day High BP Challenge</strong> + <strong style="color:${PALETTE.text};">Cortisol Cure Challenge</strong> + <strong style="color:${PALETTE.text};">Blood Pressure Reset Kit</strong> — three courses, real progress in the next four weeks.`, { margin: '0 0 28px' })}

    ${monthlyZoomHtml}

    ${hotSeatHtml}
    ${p(`That's the difference between watching health content and being seen by a nurse. Eighteen days into the Challenge with the gap you've sat through, you've earned a hot seat. I'll call your name Monday if you want it.`, { margin: '0 0 28px' })}

    ${tiktokFbHtml}

    ${p(`That's everything. VIP classroom, Monday Zoom, hot seat. Reply if anything doesn't open — I read every one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Take a baseline reading this week if you haven't already — morning, sitting, same arm, two minutes of quiet first. Write it down. Bring it Monday. That number is where your Triangle story starts.`)}
  `,
});

// ─── EMAIL 2 — SHENETTE (DM Joel to confirm/upgrade VIP) ────────────
const shenetteHtml = ({ unsubUrl }) => shell({
  subject: 'Shenette — your VIP classroom is open + Zoom link',
  preview: 'Full VIP access for 30 days + Monday May 25 hot-seat call.',
  unsubUrl,
  body: `
    ${p(`Hi Shenette,`)}
    ${p(`Yesterday I told you the Cortisol Kit was overdue. Today I'm doing one better.`)}
    ${p(`For the gap in delivery, I'm comping you <strong style="color:${PALETTE.text};">full VIP access to my Skool classroom for the next 30 days</strong> — every course in the library, no extra charge. That's about $1,000 of content unlocked. Use it for the month; keep what you build with it forever.`, { margin: '0 0 28px' })}

    ${bigQuote('Step 1 — open your VIP classroom.')}
    ${ctaButton(SKOOL_URL, 'Open the Skool VIP classroom →')}
    ${clayBlock('Message me first so I can confirm your VIP', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Once you're inside the Skool community, send me a direct message. If you're already a VIP member, just say hi and I'll wave you into the classroom.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you're not VIP yet, that DM is what I need to upgrade your account for the next 30 days. Either way — message me first, then dive into the courses.</p>
    `)}

    ${bigQuote('Step 2 — what\'s inside.')}
    ${p(`For the next 30 days you have access to every one of these:`)}
    ${courseListHtml}
    ${p(`Start with the <strong style="color:${PALETTE.text};">Cortisol Cure Challenge</strong> — that's the one you've been owed.`, { margin: '0 0 28px' })}

    ${monthlyZoomHtml}

    ${hotSeatHtml}
    ${p(`That's the difference between watching health content and being seen by a nurse. If you've got a question you've been sitting with, Monday is where it lands.`, { margin: '0 0 28px' })}

    ${tiktokFbHtml}

    ${p(`Reply if anything doesn't open — I read every one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Day 15 is your mid-cohort check-in — three days from today. I'll ask you for three numbers: your Day 0 baseline, your this-week average, and the one symptom that has changed most. Start writing them down now so you have a clean comparison when the email lands Friday.`)}
  `,
});

// ─── EMAIL 3 — DORA (DM Joel to confirm/upgrade VIP) ────────────────
const doraHtml = ({ unsubUrl }) => shell({
  subject: 'Dora — your VIP classroom is open + Zoom link',
  preview: 'Full VIP access for 30 days + Monday May 25 hot-seat call.',
  unsubUrl,
  body: `
    ${p(`Hi Dora,`)}
    ${p(`Yesterday I told you both bonus kits were overdue. Today I'm doing one better.`)}
    ${p(`For the gap in delivery, I'm comping you <strong style="color:${PALETTE.text};">full VIP access to my Skool classroom for the next 30 days</strong> — every course in the library, no extra charge. That's about $1,000 of content unlocked. Use it for the month; keep what you build with it forever.`, { margin: '0 0 28px' })}

    ${bigQuote('Step 1 — open your VIP classroom.')}
    ${ctaButton(SKOOL_URL, 'Open the Skool VIP classroom →')}
    ${clayBlock('Message me first so I can confirm your VIP', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">Once you're inside the Skool community, send me a direct message. If you're already a VIP member, just say hi and I'll wave you into the classroom.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you're not VIP yet, that DM is what I need to upgrade your account for the next 30 days. Either way — message me first, then dive into the courses.</p>
    `)}

    ${bigQuote('Step 2 — what\'s inside.')}
    ${p(`For the next 30 days you have access to every one of these:`)}
    ${courseListHtml}
    ${p(`Start with <strong style="color:${PALETTE.text};">Cortisol Cure</strong> and <strong style="color:${PALETTE.text};">Reverse Your Diabetes</strong> — those are the two you should have had two weeks ago.`, { margin: '0 0 28px' })}

    ${monthlyZoomHtml}

    ${hotSeatHtml}
    ${p(`That's the difference between watching health content and being seen by a nurse. You're past the halfway mark and you've got data — Monday is where I look at it with you and tell you what the back half needs to look like.`, { margin: '0 0 28px' })}

    ${tiktokFbHtml}

    ${p(`Reply if anything doesn't open — I read every one.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Day 30 is your graduation, eleven days from today. Take a Day-30 morning reading. Write it next to your Day-0 number. Look at the difference. Most women see 8–15 systolic points down by then. Whatever your number is, post it in Skool — the women still doing the Challenge need to see what's possible.`)}
  `,
});

// ─── Text fallbacks (plain) ─────────────────────────────────────────
const phyllisText = () => `Hi Phyllis,

Yesterday I sent you an apology. Today I send you more than what was originally promised.

For the gap in delivery, I'm comping you full VIP access to my Skool classroom for the next 30 days — every course in the library, no extra charge. That's about $1,000 of content unlocked. Use it for the month; keep what you build with it forever.

STEP 1 — OPEN YOUR VIP CLASSROOM:
→ ${SKOOL_URL}

YOU'RE ALREADY A VIP MEMBER. Your VIP status is already on. When you log in, click the Classroom tab — all 10 courses unlock for you. Send me a direct message in Skool so I have your handle and I can wave you in personally. One line is enough: "Hey Joel, I'm in."

STEP 2 — WHAT'S INSIDE (the whole library):
→ 10-Day High Blood Pressure Challenge — your home base
→ The Blood Pressure Reset Kit — the complete BP system
→ LIVE: 10-Day Cortisol Cure Challenge — Stress Pressure deep dive
→ LIVE: Reverse Your Diabetes in 10 Days — nurse's protocol
→ The Human Machine Blueprint — 11 body systems in 60 minutes
→ How To Create Your Natural Remedies Masterclass
→ The 7-Day Body Reset Program
→ Lemonade Detox
→ The 90-Day Body Reset Program

Plus a 10-Day Weight Loss Challenge coming soon — when it launches inside your 30 days, you have it.

Don't try to do all of it. Start with 10-Day High BP Challenge + Cortisol Cure Challenge + BP Reset Kit — three courses, real progress in four weeks.

MONDAY MAY 25 — YOUR WEEKLY LIVE CALL.

Every Monday at 10:00 PM ET I'm on Zoom for sixty minutes with the VIP cohort across all the courses. Next call is Monday, May 25.

→ Join the Monday Zoom call: ${ZOOM_URL}
→ Meeting ID: ${ZOOM_ID}
→ Passcode: ${ZOOM_PASSCODE}

Save the link. Same Zoom every Monday.

THE HOT SEAT — THE REAL REASON TO BE ON ZOOM.

Zoom is the call where you get the hot seat. I go around the room and each member gets a few minutes to describe what's happening with HER specifically — your readings, the symptom that won't go away, the question your cardiologist brushed off, the supplement you're not sure about. I answer live, looking at you, with the whole cohort listening so everyone learns.

Eighteen days into the Challenge with the gap you've sat through, you've earned a hot seat. I'll call your name Monday if you want it.

TIKTOK AND FACEBOOK — SAME MONDAY, WATCHING ONLY.

I'll also be live on TikTok and Facebook at the same time. Good if you can't make Zoom or just want to listen in.
→ TikTok: @braveworksrn
→ Facebook: BraveWorks RN page

But those are passive. Can't unmute, can't raise your hand, I can't see your face or numbers. If you can make Zoom, make Zoom.

That's everything. VIP classroom, Monday Zoom, hot seat. Reply if anything doesn't open.

Joel
RN, BraveWorks

P.S. Take a baseline reading this week if you haven't — morning, sitting, same arm, two minutes of quiet first. Write it down. Bring it Monday. That number is where your Triangle story starts.
`;

const shenetteText = () => `Hi Shenette,

Yesterday I told you the Cortisol Kit was overdue. Today I'm doing one better.

For the gap in delivery, I'm comping you full VIP access to my Skool classroom for the next 30 days — every course in the library, no extra charge. ~$1,000 of content unlocked. Use it for the month; keep what you build forever.

STEP 1 — OPEN YOUR VIP CLASSROOM:
→ ${SKOOL_URL}

MESSAGE ME FIRST so I can confirm your VIP. Once you're inside the Skool community, send me a direct message. If you're already a VIP member, just say hi and I'll wave you into the classroom. If not, that DM is what I need to upgrade your account for the next 30 days. Either way — message me first, then dive into the courses.

STEP 2 — WHAT'S INSIDE:
→ 10-Day High Blood Pressure Challenge
→ The Blood Pressure Reset Kit
→ LIVE: 10-Day Cortisol Cure Challenge
→ LIVE: Reverse Your Diabetes in 10 Days
→ The Human Machine Blueprint
→ How To Create Your Natural Remedies Masterclass
→ The 7-Day Body Reset Program
→ Lemonade Detox
→ The 90-Day Body Reset Program

Plus a 10-Day Weight Loss Challenge coming soon — when it launches inside your 30 days, you have it.

Start with the Cortisol Cure Challenge — that's the one you've been owed.

MONDAY MAY 25 — YOUR WEEKLY LIVE CALL.

Every Monday at 10:00 PM ET I'm on Zoom for sixty minutes with the VIP cohort across all the courses.

→ Join the Monday Zoom call: ${ZOOM_URL}
→ Meeting ID: ${ZOOM_ID}
→ Passcode: ${ZOOM_PASSCODE}

Save the link. Same Zoom every Monday.

THE HOT SEAT — THE REAL REASON TO BE ON ZOOM.

I go around the room and each member gets a few minutes to describe what's happening with HER specifically. I answer live, with the whole cohort listening.

If you've got a question you've been sitting with, Monday is where it lands.

TIKTOK AND FACEBOOK — SAME MONDAY, WATCHING ONLY.

I'll also be live on TikTok and Facebook at the same time.
→ TikTok: @braveworksrn
→ Facebook: BraveWorks RN page

Passive. Can't unmute, can't raise your hand. If you can make Zoom, make Zoom.

Reply if anything doesn't open.

Joel
RN, BraveWorks

P.S. Day 15 is your mid-cohort check-in — three days from today. I'll ask for three numbers: Day 0 baseline, this-week average, and the one symptom that's changed most. Start writing them down now.
`;

const doraText = () => `Hi Dora,

Yesterday I told you both bonus kits were overdue. Today I'm doing one better.

For the gap in delivery, I'm comping you full VIP access to my Skool classroom for the next 30 days — every course in the library, no extra charge. ~$1,000 of content unlocked. Use it for the month; keep what you build forever.

STEP 1 — OPEN YOUR VIP CLASSROOM:
→ ${SKOOL_URL}

MESSAGE ME FIRST so I can confirm your VIP. Once you're inside the Skool community, send me a direct message. If you're already a VIP member, just say hi and I'll wave you into the classroom. If not, that DM is what I need to upgrade your account for the next 30 days. Either way — message me first, then dive into the courses.

STEP 2 — WHAT'S INSIDE:
→ 10-Day High Blood Pressure Challenge
→ The Blood Pressure Reset Kit
→ LIVE: 10-Day Cortisol Cure Challenge
→ LIVE: Reverse Your Diabetes in 10 Days
→ The Human Machine Blueprint
→ How To Create Your Natural Remedies Masterclass
→ The 7-Day Body Reset Program
→ Lemonade Detox
→ The 90-Day Body Reset Program

Plus a 10-Day Weight Loss Challenge coming soon — when it launches inside your 30 days, you have it.

Start with Cortisol Cure and Reverse Your Diabetes — those are the two you should have had two weeks ago.

MONDAY MAY 25 — YOUR WEEKLY LIVE CALL.

Every Monday at 10:00 PM ET I'm on Zoom for sixty minutes with the VIP cohort across all the courses.

→ Join the Monday Zoom call: ${ZOOM_URL}
→ Meeting ID: ${ZOOM_ID}
→ Passcode: ${ZOOM_PASSCODE}

Save the link. Same Zoom every Monday.

THE HOT SEAT — THE REAL REASON TO BE ON ZOOM.

I go around the room and each member gets a few minutes to describe what's happening with HER specifically. I answer live, with the whole cohort listening.

You're past the halfway mark and you've got data — Monday is where I look at it with you and tell you what the back half needs to look like.

TIKTOK AND FACEBOOK — SAME MONDAY, WATCHING ONLY.

I'll also be live on TikTok and Facebook at the same time.
→ TikTok: @braveworksrn
→ Facebook: BraveWorks RN page

Passive. Can't unmute, can't raise your hand. If you can make Zoom, make Zoom.

Reply if anything doesn't open.

Joel
RN, BraveWorks

P.S. Day 30 is your graduation, eleven days from today. Take a Day-30 morning reading. Write it next to your Day-0 number. Most women see 8-15 systolic points down by then. Post it in Skool — the women still doing the Challenge need to see what's possible.
`;

const SENDS = [
  {
    to: 'phyllisrene26@gmail.com',
    subject: 'Phyllis — your VIP classroom is open + Zoom link inside',
    html: phyllisHtml,
    text: phyllisText,
  },
  {
    to: 'blksuccessfem@aol.com',
    subject: 'Shenette — your VIP classroom is open + Zoom link',
    html: shenetteHtml,
    text: shenetteText,
  },
  {
    to: 'dorajones56@icloud.com',
    subject: 'Dora — your VIP classroom is open + Zoom link',
    html: doraHtml,
    text: doraText,
  },
];

console.log(`Mode: ${SEND ? 'SEND (live via Resend)' : 'DRY RUN'}`);
console.log(`Sending ${SENDS.length} VIP deliverables emails\n`);

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
    await new Promise((r) => setTimeout(r, 250));
  } catch (err) {
    console.error(`    ✗ FAILED: ${err.message}\n`);
  }
}

console.log(`Done.`);
