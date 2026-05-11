// scripts/send-monday-live-reminder-2026-05-11.mjs
//
// Monday-night live reminder for tonight's BP Triangle Challenge VIP call.
// Theme: "Unraveling the Triangle, one side at a time."
// Time: Monday 2026-05-11 · 10 PM ET
// URL : https://bpquiz.com/challenge#vip
//
// Cohort: reuses .claude/recovery_cohort_all.jsonl from yesterday's bug-
// recovery blast (3,346 warm bpquiz_quiz subscribers, suppressed against
// paid customers since April launch). Same warm audience that just got the
// apology yesterday — now invited back for tonight's live with a "join the
// Challenge to come on the call" CTA.
//
// Voice: 4th grade, no negatives, Method-vocabulary (Triangle / map / "send
// my map" CTAs), Hardy future-self framing.
//
// Usage:
//   node scripts/send-monday-live-reminder-2026-05-11.mjs --test
//        Three preview emails (one per concern variant) to Joel's inbox.
//
//   node scripts/send-monday-live-reminder-2026-05-11.mjs --dry-run
//        Renders preview HTML per recipient (no send).
//
//   node scripts/send-monday-live-reminder-2026-05-11.mjs --send-batch
//        Sends to ALL cohort members. 250ms rate limit between sends.
//        DO NOT RUN until --test review is approved.
//
// Env required:
//   RESEND_API_KEY (read from bpquiz-site/.env via dotenv-style parse)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const COHORT_PATH = path.join(PROJECT_ROOT, '.claude/recovery_cohort_all.jsonl');
const PREVIEW_DIR = path.join(REPO_ROOT, 'tmp/monday-live-2026-05-11');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';

const LIVE_URL = 'https://bpquiz.com/challenge#vip';

// Concern-specific opening line so each variant feels written for them.
// All three lead to the same VIP upgrade page; tonight's live walks all
// three corners of the Triangle so every concern gets answered.
const CONCERN_CONFIG = {
  blood_pressure: {
    yourCorner: 'pressure',
    cornerLine: 'Tonight we start with the pressure corner — the cuff numbers, the herbs that move them, and the doctor-conversation script.',
  },
  cortisol: {
    yourCorner: 'stress',
    cornerLine: 'Tonight we walk the stress corner first — the wired-tired pattern, the 60-minute wind-down, and the three herbs Joel trusts most.',
  },
  blood_sugar: {
    yourCorner: 'sugar',
    cornerLine: 'Tonight we walk the sugar corner first — the crashes, the meal order that flattens spikes, and the 10-minute walk that moves all three numbers.',
  },
};

function pickConfig(concern) {
  return CONCERN_CONFIG[concern] || CONCERN_CONFIG.blood_pressure;
}

function renderEmail({ fname, concern }) {
  const cfg = pickConfig(concern);
  const greeting = fname ? `${fname},` : 'Friend,';
  const subject = `Tonight at 10 PM ET — unraveling your Triangle`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,'Times New Roman',serif;color:#2C3E50;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;border:1px solid #EAE3D5;">
        <tr><td style="padding:34px 36px 6px 36px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B7355;margin-bottom:18px;">Tonight · 10 PM ET · LIVE</div>
          <h1 style="font-family:'Fraunces',Georgia,serif;font-size:26px;line-height:1.25;font-weight:500;margin:0 0 14px 0;color:#2C3E50;">
            ${greeting} tonight we unravel your <em style="color:#B85A36;">Triangle.</em>
          </h1>
          <p style="font-size:16px;line-height:1.65;margin:0 0 16px 0;">
            Three corners. One loop. <strong>Tonight at 10 PM ET</strong>, I am taking the lid off the BP Triangle and walking through each side, one at a time. Pressure. Stress. Sugar. The order they feed each other. The two simple swaps that quiet the loop for most women by week two.
          </p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 16px 0;">
            ${cfg.cornerLine}
          </p>
        </td></tr>

        <tr><td style="padding:6px 36px 18px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E8;border-radius:12px;">
            <tr><td style="padding:22px 24px;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6C3483;margin-bottom:8px;">What we will walk through tonight</div>
              <ul style="font-size:15px;line-height:1.7;margin:0 0 4px 0;padding-left:20px;color:#3A3A3A;">
                <li>The Triangle, drawn on the whiteboard, with the loop arrow that most doctors miss.</li>
                <li>The single herb that moves <em>your</em> ${cfg.yourCorner} corner first — with the exact dose Joel gives his own family.</li>
                <li>The 9-line script for your next doctor visit, word for word.</li>
                <li>Live Q&amp;A — bring your numbers, your meds list, and your questions.</li>
              </ul>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:10px 36px 24px 36px;" align="center">
          <a href="${LIVE_URL}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:16px 28px;border-radius:12px;text-decoration:none;font-family:'Fraunces',Georgia,serif;font-size:18px;font-weight:600;letter-spacing:0.01em;">
            Save my seat — join the Challenge ($97) →
          </a>
          <p style="font-size:13px;color:#7A7A7A;margin:14px 0 0 0;line-height:1.5;">
            50 seats per cohort · Doors close at 9:55 PM ET tonight.
          </p>
        </td></tr>

        <tr><td style="padding:6px 36px 18px 36px;">
          <p style="font-size:15px;line-height:1.65;margin:0 0 12px 0;">
            If you are already in the Challenge — see you on the call. The Zoom link landed in your inbox earlier today.
          </p>
          <p style="font-size:15px;line-height:1.65;margin:0 0 16px 0;">
            If you have been on the fence — tonight is the night to step in. Join before 9:55 PM ET and you walk the Triangle with us live, with Joel on the screen, on your couch.
          </p>
        </td></tr>

        <tr><td style="padding:6px 36px 28px 36px;">
          <p style="font-size:15px;line-height:1.6;margin:0;">
            See you at 10.
          </p>
          <p style="font-size:15px;line-height:1.6;margin:8px 0 0 0;">
            — Joel
          </p>
        </td></tr>

        <tr><td style="padding:0 36px 28px 36px;">
          <hr style="border:none;border-top:1px solid #EAE3D5;margin:10px 0 16px 0;" />
          <p style="font-size:11px;color:#9A9A9A;line-height:1.6;margin:0;">
            BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a>
            <br/>Educational content only. Not medical advice. Always complement — never replace — care from your physician.
            <br/>You received this because you completed the BPQuiz assessment.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const localPath = path.join(REPO_ROOT, '.env.local');
  if (fs.existsSync(localPath)) {
    const lines2 = fs.readFileSync(localPath, 'utf8').split('\n');
    for (const line of lines2) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

function loadCohort() {
  return fs
    .readFileSync(COHORT_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Modes ────────────────────────────────────────────────────────────

async function runTest() {
  loadEnv();
  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY not set');
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const concerns = ['blood_pressure', 'cortisol', 'blood_sugar'];
  for (const concern of concerns) {
    const { subject, html } = renderEmail({ fname: 'Joel', concern });
    const tagged = `[TEST · ${concern}] ${subject}`;
    console.log(`Sending test (${concern}) → ${TEST_TO}`);
    const r = await resend.emails.send({
      from: FROM,
      to: TEST_TO,
      reply_to: REPLY_TO,
      subject: tagged,
      html,
    });
    console.log(`  → ${r.data?.id || JSON.stringify(r.error || r)}`);
    await sleep(500);
  }
  console.log(`\nDone. Three preview emails sent to ${TEST_TO} (BP / cortisol / blood-sugar variants).`);
}

async function runDryRun() {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const cohort = loadCohort();
  for (const r of cohort) {
    const { subject, html } = renderEmail({ fname: r.fname, concern: r.concern });
    const safe = r.email.replace(/[^a-z0-9]/gi, '_');
    const file = path.join(PREVIEW_DIR, `${safe}.html`);
    fs.writeFileSync(file, `<!-- subject: ${subject} -->\n` + html);
  }
  console.log(`Rendered ${cohort.length} preview HTML files to ${PREVIEW_DIR}`);
}

async function runSendBatch() {
  loadEnv();
  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY not set');
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const cohort = loadCohort();

  console.log(`SEND BATCH — ${cohort.length} recipients`);
  console.log(`Rate: 250ms/send · ETA ${Math.round(cohort.length * 0.25)}s`);
  console.log('Press Ctrl-C in the next 10s to abort.\n');
  await sleep(10_000);

  let sent = 0, failed = 0;
  const failures = [];
  for (const r of cohort) {
    const { subject, html } = renderEmail({ fname: r.fname, concern: r.concern });
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: r.email,
        reply_to: REPLY_TO,
        subject,
        html,
      });
      if (result.error) {
        failed++;
        failures.push({ email: r.email, error: result.error });
        console.log(`  ✗ ${r.email} — ${JSON.stringify(result.error).slice(0, 100)}`);
      } else {
        sent++;
        if (sent % 100 === 0) console.log(`  ✓ ${sent} sent...`);
      }
    } catch (err) {
      failed++;
      failures.push({ email: r.email, error: err.message });
      console.log(`  ✗ ${r.email} — ${err.message.slice(0, 100)}`);
    }
    await sleep(250);
  }
  console.log(`\nDone. Sent ${sent} / Failed ${failed}.`);
  if (failures.length) {
    const failPath = path.join(PREVIEW_DIR, 'failures.json');
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    fs.writeFileSync(failPath, JSON.stringify(failures, null, 2));
    console.log(`Failure detail → ${failPath}`);
  }
}

// ─── Entry ────────────────────────────────────────────────────────────

const mode = process.argv[2];
if (mode === '--test') {
  await runTest();
} else if (mode === '--dry-run') {
  await runDryRun();
} else if (mode === '--send-batch') {
  await runSendBatch();
} else {
  console.error('Usage: node send-monday-live-reminder-2026-05-11.mjs --test|--dry-run|--send-batch');
  process.exit(1);
}
