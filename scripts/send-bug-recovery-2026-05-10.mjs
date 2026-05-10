// scripts/send-bug-recovery-2026-05-10.mjs
//
// One-time recovery send for the 2026-05-09→05-10 quiz funnel bug.
//
// Background: framer-motion's AnimatePresence got stuck in initial state on
// step transitions, leaving the quiz card invisible after the first answer.
// Customers landed on Stripe checkout (25 open/unpaid sessions) but the
// funnel was silently broken — zero paid 2026-05-09 12:43 CDT → 2026-05-10
// 09:55 CDT. Hotfix shipped in cb79b07 (replaced motion.div wrappers with
// plain divs). This script reaches out to the 158 quiz takers in the broken
// window who never bought, offers SORRY30 (30% off, expires 7d), and asks
// them back.
//
// Cohort: 158 emails in `.claude/recovery_cohort.jsonl` — already filtered
// against last-30-day Stripe paid customers (no double-emailing buyers).
// Distribution: 134 BP, 19 cortisol, 5 blood-sugar.
//
// Usage:
//   node scripts/send-bug-recovery-2026-05-10.mjs --test
//        Sends ONE email to brave.works.marketing@gmail.com so Joel can
//        review the actual rendered output before any production send.
//
//   node scripts/send-bug-recovery-2026-05-10.mjs --dry-run
//        Writes preview HTML to tmp/recovery-2026-05-10/<email>.html for
//        each cohort member without touching Resend. Lets Joel spot-check
//        per-concern personalization at scale.
//
//   node scripts/send-bug-recovery-2026-05-10.mjs --send-batch
//        Sends to ALL 158 cohort members. 250ms rate limit between sends.
//        DO NOT RUN until --test review is approved.
//
// Env required:
//   RESEND_API_KEY (read from .env via dotenv-style parse below)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const COHORT_PATH = path.join(PROJECT_ROOT, '.claude/recovery_cohort.jsonl');
const PREVIEW_DIR = path.join(REPO_ROOT, 'tmp/recovery-2026-05-10');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';
const PROMO_CODE = 'SORRY30';

// Per-concern copy + recommended product link.
// All Stripe links verified ACTIVE 2026-05-10. Promo code SORRY30 enabled
// across all seven active payment links (allow_promotion_codes=true).
const CONCERN_CONFIG = {
  blood_pressure: {
    label: 'BP Reset Kit',
    productPrice: '$17',
    productHref: 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A?prefilled_promo_code=SORRY30',
    pillarLine:
      'You came in for blood pressure. The kit is the same one Joel reaches for first — Day-1 protocol, his trusted herbs, and what to ask the cardiologist.',
  },
  cortisol: {
    label: 'Cortisol Healing Blueprint',
    productPrice: '$17',
    productHref: 'https://buy.stripe.com/5kQ7sL6bV3Dw0IX0oVfnO0l?prefilled_promo_code=SORRY30',
    pillarLine:
      'You came in for cortisol — the wired-tired pattern. The starter walks the cortisol curve, the four daily moves that flatten it, and the herbs Joel actually trusts for adrenal recovery.',
  },
  blood_sugar: {
    label: 'Blood Sugar Cures',
    productPrice: '$17',
    productHref: 'https://buy.stripe.com/6oU6oH1VF7TM4ZdgnTfnO0n?prefilled_promo_code=SORRY30',
    pillarLine:
      'You came in for blood sugar — A1C creep, crashes, cravings. The starter explains what your fasting number actually means and the four moves that flatten the glucose curve fastest.',
  },
};

function pickConfig(concern) {
  return CONCERN_CONFIG[concern] || CONCERN_CONFIG.blood_pressure;
}

function renderEmail({ fname, concern }) {
  const cfg = pickConfig(concern);
  const greeting = fname ? `Hey ${fname},` : 'Hey,';

  const subject = "My checkout was broken yesterday — let me make it right";

  const html = `
<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,'Times New Roman',serif;color:#2C3E50;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;border:1px solid #EAE3D5;">
        <tr><td style="padding:34px 36px 6px 36px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B7355;margin-bottom:18px;">A note from Joel · BraveWorks RN</div>
          <h1 style="font-family:'Fraunces',Georgia,serif;font-size:26px;line-height:1.2;font-weight:500;margin:0 0 18px 0;color:#2C3E50;">${greeting}</h1>

          <p style="margin:0 0 16px 0;font-size:16px;">
            You took the assessment yesterday. If you tried to grab the kit and the page froze on you — that's on me. There was a bug in the quiz that left the screen blank after the first question. I'm sorry. It's fixed now.
          </p>

          <p style="margin:0 0 16px 0;font-size:16px;">
            ${cfg.pillarLine}
          </p>

          <p style="margin:0 0 22px 0;font-size:16px;">
            To make up for the runaround: <strong>30% off</strong> — code <strong style="background:#FFF3D6;padding:2px 8px;border-radius:6px;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;">${PROMO_CODE}</strong>. Auto-applied at the link below. Expires in 7 days.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
            <tr><td align="center" style="padding:14px 0;">
              <a href="${cfg.productHref}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;font-family:Georgia,serif;">
                Get the ${cfg.label} (${cfg.productPrice} → 30% off)
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 16px 0;font-size:15px;color:#5A4A3A;">
            If you'd already moved on, no hard feelings — the next email won't mention this again. Either way, thanks for taking the assessment. The protocol works whether or not the buy button does.
          </p>

          <p style="margin:24px 0 6px 0;font-size:16px;">
            — Joel
          </p>
          <p style="margin:0 0 0 0;font-size:13px;color:#8B7355;">
            Joel Polley, RN · 20 yrs ICU &amp; ER · BraveWorks RN
          </p>
        </td></tr>
        <tr><td style="padding:18px 36px 26px 36px;border-top:1px solid #EAE3D5;">
          <p style="margin:0;font-size:11px;color:#8B7355;line-height:1.5;">
            You're getting this because you took the BPQuiz assessment and we owe you a working checkout. Educational content only — nothing on this site is medical advice. Reply to this email with any questions.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
  `.trim();

  return { subject, html };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

function loadCohort() {
  if (!fs.existsSync(COHORT_PATH)) {
    throw new Error(`Cohort file not found: ${COHORT_PATH}`);
  }
  return fs.readFileSync(COHORT_PATH, 'utf8')
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

  // Render each concern variant and send one to Joel for review
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
  console.log('\nDone. Three preview emails sent to', TEST_TO, '(BP / cortisol / blood-sugar variants).');
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
  console.log(`Open any of them to spot-check per-concern personalization.`);
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
  console.log(`Promo: ${PROMO_CODE} · Rate: 250ms/send · ETA ${Math.round(cohort.length * 0.25)}s`);
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
        console.log(`  ✓ ${r.email} — ${result.data?.id}`);
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
if (mode === '--test') runTest();
else if (mode === '--dry-run') runDryRun();
else if (mode === '--send-batch') runSendBatch();
else {
  console.log('Usage: node scripts/send-bug-recovery-2026-05-10.mjs [--test | --dry-run | --send-batch]');
  process.exit(1);
}
