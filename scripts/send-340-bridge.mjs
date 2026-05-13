// scripts/send-340-bridge.mjs
//
// One-shot broadcast to the 340 Mailchimp 30-day-challenge cohort that
// went silent on May 6 when Mailchimp was being migrated. The bridge
// email explains the gap, reaffirms expectations, and sets up tomorrow's
// Day 7 from the Resend drip.
//
// USAGE:
//   node --env-file=.env.production scripts/send-340-bridge.mjs --test-only
//      → sends a single rendered email to TEST_TO so Joel can preview
//   node --env-file=.env.production scripts/send-340-bridge.mjs --dry-run
//      → prints what WOULD be sent to each of the 340; no API calls
//   node --env-file=.env.production scripts/send-340-bridge.mjs --send
//      → broadcasts to all 340. Required flag — no accidental sends.
//
// The 340-cohort email list is loaded from one of:
//   --list <path>     explicit JSON path (Mailchimp segment export)
//   default           /tmp/mc_30day_members.json (the earlier dump)

import { Resend } from 'resend';
import fs from 'node:fs';
import path from 'node:path';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set. Run with `node --env-file=.env.production ...`');
  process.exit(1);
}
const resend = new Resend(RESEND_API_KEY);

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';
const RATE_LIMIT_DELAY_MS = 110; // Resend free tier = 10/sec

// ─── CLI flags ────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const TEST_ONLY = argv.includes('--test-only');
const DRY_RUN = argv.includes('--dry-run');
const SEND = argv.includes('--send');
const listIdx = argv.indexOf('--list');
const LIST_PATH = listIdx >= 0 ? argv[listIdx + 1] : '/tmp/mc_30day_members.json';

if (!TEST_ONLY && !DRY_RUN && !SEND) {
  console.error('Required flag missing: pass --test-only, --dry-run, or --send');
  console.error('No accidental broadcasts. See header comment for usage.');
  process.exit(1);
}

// ─── Load 340-cohort list ─────────────────────────────────────────────
let members = [];
if (!TEST_ONLY) {
  if (!fs.existsSync(LIST_PATH)) {
    console.error(`List file not found: ${LIST_PATH}`);
    process.exit(1);
  }
  members = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8'));
  console.log(`Loaded ${members.length} members from ${LIST_PATH}`);
}

// ─── Render the bridge email ──────────────────────────────────────────
function renderEmail(firstName = '') {
  const fname = (firstName || '').trim() || 'there';
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 18px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:700;">BraveWorks Health</div>
          <div style="font-size:11px;letter-spacing:0.08em;color:#3A3A3A;margin-top:4px;">30-Day BP Triangle · Picking back up</div>
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;box-shadow:0 1px 2px rgba(44,62,80,0.04);">
        <tr><td style="padding:36px 36px 32px;">
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">Hi ${escape(fname)},</p>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">If you're still here reading this, thank you.</p>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:#B85A36;margin:28px 0 18px;font-weight:500;">Where I've been the last 6 days.</p>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">You signed up for the 30-Day BP Triangle Challenge on or before May 1. You got Days 1 through 6 from me. Then six days of silence. That's on me, and you deserve a real explanation.</p>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">What happened: I migrated my email system mid-sequence — Mailchimp out, a new one in. The gears didn't line up the way they should have. The next 24 emails got stuck in a queue that wasn't sending. Most people would have just stopped emailing you and pretended it didn't happen. I'd rather tell you straight.</p>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 28px;">I used the six quiet days to rewrite Days 7 through 30 around what I now call the <strong style="color:#2C3E50;">BP Triangle Method™</strong> — the three corners of one loop (vascular, cortisol, blood sugar) and the protocol that breaks the loop. The next 24 emails are sharper, more specific, and built on the same framework I use with my 1:1 clients.</p>
          <div style="border-left:3px solid #4A6741;padding:4px 0 4px 18px;margin:0 0 28px;">
            <p style="font-size:16px;line-height:1.65;color:#2C3E50;margin:0 0 8px;font-weight:600;">What happens now:</p>
            <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">→ Starting tomorrow morning, you get Day 7.</p>
            <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">→ Then Day 8 (the 1:1 invitation, for those on 4+ meds).</p>
            <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">→ Then Day 9 (lie #2 — "it's genetic"), Day 10 (the corner cardiologists never measure), Day 11 (the one sentence I teach every patient), Day 12 (Marlene unpacked).</p>
            <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0;">→ The rest comes over the next two weeks.</p>
          </div>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">If at any point you'd rather stop receiving these, the unsubscribe link is at the bottom and I'll never hold it against you.</p>
          <p style="font-size:16px;line-height:1.65;color:#3A3A3A;margin:0 0 28px;"><em>Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay while we move the inputs underneath them.</em> That's still the path.</p>
          <p style="font-size:16px;line-height:1.5;color:#2C3E50;margin:0 0 4px;font-weight:600;">— Joel</p>
          <p style="font-size:14px;line-height:1.5;color:#3A3A3A;margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>
          <div style="border-top:1px solid #E8E2D4;padding-top:20px;">
            <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">
              <strong style="color:#2C3E50;">P.S.</strong> If you want a head start, the free 90-second BP Triangle Quiz returns your specific corner and the first move for your type. <a href="https://bpquiz.com/quiz" style="color:#B85A36;font-weight:600;text-decoration:none;">bpquiz.com/quiz</a>
            </p>
          </div>
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 16px 0;text-align:center;">
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">This is health education from Joel Polley, RN, BraveWorks Health. Not medical advice. If your BP reads above 180/120, seek emergency care. Always consult your prescriber before changing any medication or supplement.</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0 0 12px;">BraveWorks Health · 4730 South Fort Apache Road, Suite 300, Las Vegas, NV 89147</p>
          <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">You're getting this because you signed up for the 30-Day BP Triangle Challenge. <a href="#" style="color:#8A8A8A;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Hi ${fname},

If you're still here reading this, thank you.

WHERE I'VE BEEN THE LAST 6 DAYS.

You signed up for the 30-Day BP Triangle Challenge on or before May 1. You got Days 1 through 6 from me. Then six days of silence. That's on me, and you deserve a real explanation.

What happened: I migrated my email system mid-sequence — Mailchimp out, a new one in. The gears didn't line up the way they should have. The next 24 emails got stuck in a queue that wasn't sending. Most people would have just stopped emailing you and pretended it didn't happen. I'd rather tell you straight.

I used the six quiet days to rewrite Days 7 through 30 around what I now call the BP Triangle Method™ — the three corners of one loop (vascular, cortisol, blood sugar) and the protocol that breaks the loop. The next 24 emails are sharper, more specific, and built on the same framework I use with my 1:1 clients.

WHAT HAPPENS NOW:
→ Starting tomorrow morning, you get Day 7.
→ Then Day 8 (the 1:1 invitation, for those on 4+ meds).
→ Then Day 9 (lie #2 — "it's genetic"), Day 10 (the corner cardiologists never measure), Day 11 (the one sentence I teach every patient), Day 12 (Marlene unpacked).
→ The rest comes over the next two weeks.

If at any point you'd rather stop receiving these, the unsubscribe link is at the bottom and I'll never hold it against you.

Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay while we move the inputs underneath them. That's still the path.

— Joel
RN, BraveWorks

P.S. If you want a head start, the free 90-second BP Triangle Quiz returns your specific corner and the first move for your type. bpquiz.com/quiz
`;
  return { html, text };
}

function escape(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── Send ─────────────────────────────────────────────────────────────
async function send(to, firstName) {
  const { html, text } = renderEmail(firstName);
  return resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Where I've been the last 6 days",
    html,
    text,
    headers: { 'X-Entity-Ref-ID': `mc340-bridge-${to}-${Date.now()}` },
    tags: [
      { name: 'campaign', value: 'mc340-bridge' },
      { name: 'cohort', value: '30day-challenge-may-1' },
    ],
  });
}

(async () => {
  if (TEST_ONLY) {
    console.log(`Sending test render to ${TEST_TO}...`);
    try {
      const r = await send(TEST_TO, 'Joel');
      console.log(`  ✓ sent — id ${r.data?.id || JSON.stringify(r).slice(0, 200)}`);
    } catch (err) {
      console.error('  ✗ failed:', err.message);
      process.exit(1);
    }
    return;
  }

  if (DRY_RUN) {
    console.log(`DRY RUN — would send to ${members.length} members:`);
    members.slice(0, 10).forEach((m) => {
      const email = m.email_address || m.email;
      const fname = m.merge_fields?.FNAME || m.firstName || '';
      console.log(`  → ${email}  (fname=${fname})`);
    });
    if (members.length > 10) console.log(`  ... and ${members.length - 10} more`);
    return;
  }

  // Real send
  console.log(`Broadcasting bridge email to ${members.length} members...`);
  let sent = 0, failed = 0;
  const failures = [];
  for (const m of members) {
    const email = m.email_address || m.email;
    const fname = m.merge_fields?.FNAME || m.firstName || '';
    if (!email || !email.includes('@')) {
      failures.push({ email, reason: 'invalid' });
      failed++;
      continue;
    }
    try {
      await send(email, fname);
      sent++;
      if (sent % 25 === 0) console.log(`  ${sent}/${members.length} sent...`);
    } catch (err) {
      failed++;
      failures.push({ email, reason: err.message });
      console.error(`  ✗ ${email}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
  }
  console.log(`\nDONE — sent: ${sent}, failed: ${failed}`);
  if (failures.length) {
    fs.writeFileSync('/tmp/send-340-bridge-failures.json', JSON.stringify(failures, null, 2));
    console.log(`Failures logged to /tmp/send-340-bridge-failures.json`);
  }
})();
