// scripts/import-beehiiv-uniques-2026-05-14.mjs
//
// One-time migration: fold Beehiiv-only subscribers into the Vercel KV
// drip:* system so we can retire Beehiiv without losing audience reach.
//
// As of 2026-05-14 the overlap audit showed:
//   Beehiiv active:  3,828
//   KV drip active:  3,513
//   In both:         3,457
//   Beehiiv ONLY:      371  ← THIS SCRIPT FOLDS THESE INTO KV
//   KV ONLY:            56
//
// The 371 are subscribers who came in via the public Beehiiv discovery
// page (or an earlier import) but never went through the quiz funnel.
// They've been receiving zero email from us since the Beehiiv broadcast
// frequency dropped to ~1/month. Importing them into KV gives them the
// new Day 1-12 BP Triangle drip starting tomorrow at 12 UTC.
//
// Three modes:
//   --dry-run            Identify the 371, print sample, do nothing
//   --test               Send the welcome email to ONE test address (Joel)
//                        so he can review the copy before the batch
//   --import             KV write only (no welcome email send)
//   --import-and-welcome Full migration: KV writes + welcome email
//
// Required env (read from .env.local):
//   BEEHIIV_API_KEY, BEEHIIV_PUB_ID, KV_REST_API_*, RESEND_API_KEY
//
// Idempotent: re-running won't overwrite existing KV records (uses
// `if (!existing)` guard). Safe to re-run if it crashes mid-batch.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Force-load env vars from .env.local (Vercel KV reads at import time)
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(REPO_ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

const RATE_LIMIT_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Subscriber gathering ─────────────────────────────────────────────

async function pullBeehiivActive() {
  const k = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUB_ID;
  if (!k || !pub) throw new Error('BEEHIIV_API_KEY or BEEHIIV_PUB_ID missing');
  const H = { Authorization: 'Bearer ' + k };

  const out = []; // [{email, firstName}]
  let pageToken = 1;
  for (let i = 0; i < 100; i++) {
    const qs = new URLSearchParams({ limit: '100', page: String(pageToken) });
    const r = await fetch(
      'https://api.beehiiv.com/v2/publications/' + pub + '/subscriptions?' + qs,
      { headers: H },
    );
    const j = await r.json();
    if (!j.data?.length) break;
    for (const sub of j.data) {
      if (sub?.email && sub.status === 'active') {
        out.push({
          email: String(sub.email).toLowerCase().trim(),
          firstName:
            (sub.custom_fields && sub.custom_fields.find?.((f) => /first|fname/i.test(f.name))?.value) ||
            sub.first_name ||
            '',
        });
      }
    }
    if (j.data.length < 100) break;
    pageToken++;
  }
  return out;
}

async function pullKvDripEmails() {
  const { kv } = await import('@vercel/kv');
  const keys = await kv.keys('drip:*');
  const set = new Set();
  for (const k of keys) {
    const r = await kv.get(k);
    if (r?.email) set.add(String(r.email).toLowerCase().trim());
  }
  return set;
}

async function identifyBeehiivOnly() {
  const [beehiiv, kvSet] = await Promise.all([pullBeehiivActive(), pullKvDripEmails()]);
  const seen = new Set();
  const uniques = [];
  for (const sub of beehiiv) {
    if (kvSet.has(sub.email)) continue;
    if (seen.has(sub.email)) continue; // dedupe in case beehiiv has duplicate records
    seen.add(sub.email);
    uniques.push(sub);
  }
  return { beehiivCount: beehiiv.length, kvCount: kvSet.size, uniques };
}

// ─── KV import ────────────────────────────────────────────────────────

async function importToKv(subs) {
  const { kv } = await import('@vercel/kv');
  const out = { written: 0, skipped: 0, errors: 0 };
  for (const sub of subs) {
    const key = `drip:${sub.email}`;
    try {
      const existing = await kv.get(key);
      if (existing) {
        out.skipped++;
        continue; // idempotent
      }
      await kv.set(key, {
        email: sub.email,
        firstName: sub.firstName || '',
        cohort: 'beehiiv-import-2026-05-14',
        enrolledAt: new Date().toISOString(),
        lastSentDay: 0,
        optedIn: true, // they had opted into the beehiiv list; respect it
        source: 'beehiiv-migration',
        tags: ['beehiiv-import', 'bpquiz-warm'],
      });
      out.written++;
    } catch (err) {
      console.error('import: KV write failed for', sub.email, err.message);
      out.errors++;
    }
  }
  return out;
}

// ─── Welcome email ────────────────────────────────────────────────────

function renderWelcomeHtml({ firstName, unsubUrl }) {
  const greeting = firstName ? `Hi ${firstName.split(/\s+/)[0]},` : 'Friend,';
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,'Times New Roman',serif;color:#2C3E50;line-height:1.65;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;border:1px solid #EAE3D5;">
        <tr><td style="padding:34px 36px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B7355;margin-bottom:18px;">A quick housekeeping note · BraveWorks RN</div>
          <h1 style="font-family:'Fraunces',Georgia,serif;font-size:24px;line-height:1.3;font-weight:500;margin:0 0 16px 0;color:#2C3E50;">${greeting}</h1>
          <p style="font-size:16px;line-height:1.65;margin:0 0 14px 0;">You signed up for my newsletter at some point — and I've been mostly quiet. That's about to change.</p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 14px 0;">I'm consolidating my email list into one home. Starting tomorrow morning at 6 AM CDT, you'll get <strong>Day 1 of the BP Triangle drip</strong> — a 12-day walk through the same protocol I use with my own family for naturally lowering blood pressure.</p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 14px 0;">Day 1 opens with the three lies your doctor told you about your BP. Day 3 is Marlene's case — 11 systolic points in 9 days, no new pills. By Day 12 you'll have the whole Triangle method in your head, plus the doctor-conversation script I hand every client.</p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 18px 0;">If this isn't what you signed up for — no hard feelings — <a href="${unsubUrl}" style="color:#B85A36;font-weight:600;">unsubscribe here</a> and you'll never hear from me again.</p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 4px 0;">See you in the morning.</p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 4px 0;">— Joel Polley, RN</p>
          <p style="font-size:14px;color:#7A7A7A;margin:0;font-style:italic;">BraveWorks Health · 20 yrs ICU · Naturopathic practitioner</p>
        </td></tr>

        <tr><td style="padding:0 36px 28px;">
          <hr style="border:none;border-top:1px solid #EAE3D5;margin:24px 0 16px;" />
          <p style="font-size:11px;color:#9A9A9A;line-height:1.6;margin:0;">
            Educational content only. Not medical advice. Always complement — never replace — care from your physician.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderWelcomeText({ firstName, unsubUrl }) {
  const greeting = firstName ? `Hi ${firstName.split(/\s+/)[0]},` : 'Friend,';
  return `${greeting}

You signed up for my newsletter at some point — and I've been mostly quiet. That's about to change.

I'm consolidating my email list into one home. Starting tomorrow morning at 6 AM CDT, you'll get Day 1 of the BP Triangle drip — a 12-day walk through the same protocol I use with my own family for naturally lowering blood pressure.

Day 1 opens with the three lies your doctor told you about your BP. Day 3 is Marlene's case — 11 systolic points in 9 days, no new pills. By Day 12 you'll have the whole Triangle method in your head, plus the doctor-conversation script I hand every client.

If this isn't what you signed up for — no hard feelings — unsubscribe here:
${unsubUrl}

See you in the morning.

— Joel Polley, RN
BraveWorks Health · 20 yrs ICU · Naturopathic practitioner

—
Educational content only. Not medical advice.
`;
}

// ─── HMAC unsubscribe URL (mirror unsubscribe.js token format) ────────

import crypto from 'node:crypto';

function buildUnsubUrl(email) {
  const SECRET = process.env.UNSUB_SECRET || process.env.DRIP_OPT_IN_SECRET;
  if (!SECRET) throw new Error('UNSUB_SECRET missing — cannot sign unsubscribe URLs');
  const ts = Date.now();
  const payload = `${email.toLowerCase()}.${ts}.`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
  const token = Buffer.from(`${payload}${sig}`).toString('base64url');
  return `${SITE_URL}/api/unsubscribe?token=${token}`;
}

// ─── Resend send ──────────────────────────────────────────────────────

async function sendWelcomeBatch(subs, { testMode = false } = {}) {
  const { Resend } = await import('resend');
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const recipients = testMode ? [{ email: TEST_TO, firstName: 'Joel' }] : subs;
  console.log(`[${testMode ? 'TEST' : 'BATCH'}] Sending welcome to ${recipients.length} recipient(s)`);

  let sent = 0, failed = 0;
  const failures = [];
  for (const r of recipients) {
    const unsubUrl = buildUnsubUrl(r.email);
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: r.email,
        reply_to: REPLY_TO,
        subject: testMode
          ? '[TEST · beehiiv migration welcome] BraveWorks RN — one home now'
          : 'BraveWorks RN — one home now',
        html: renderWelcomeHtml({ firstName: r.firstName, unsubUrl }),
        text: renderWelcomeText({ firstName: r.firstName, unsubUrl }),
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      if (result.error) {
        failed++;
        failures.push({ email: r.email, error: result.error });
      } else {
        sent++;
        if (sent % 50 === 0 && !testMode) console.log(`  ✓ ${sent} sent...`);
      }
    } catch (err) {
      failed++;
      failures.push({ email: r.email, error: err.message });
    }
    await sleep(RATE_LIMIT_MS);
  }
  return { sent, failed, failures };
}

// ─── Modes ────────────────────────────────────────────────────────────

async function runDryRun() {
  const { beehiivCount, kvCount, uniques } = await identifyBeehiivOnly();
  console.log(`Beehiiv active:           ${beehiivCount}`);
  console.log(`KV drip:* count:          ${kvCount}`);
  console.log(`Beehiiv-only (to import): ${uniques.length}`);
  console.log();
  console.log('Sample (first 8):');
  for (const sub of uniques.slice(0, 8)) {
    console.log(`  ${sub.email}${sub.firstName ? '  ('+sub.firstName+')' : ''}`);
  }
  console.log();
  console.log('Re-run with --import or --import-and-welcome to execute.');
}

async function runTest() {
  const { uniques } = await identifyBeehiivOnly();
  if (!uniques.length) { console.log('No beehiiv-only subscribers found.'); return; }
  console.log(`Found ${uniques.length} beehiiv-only subscribers. Sending TEST welcome to ${TEST_TO}.`);
  const result = await sendWelcomeBatch(uniques, { testMode: true });
  console.log('Test send result:', result);
}

async function runImport() {
  const { uniques } = await identifyBeehiivOnly();
  console.log(`Importing ${uniques.length} beehiiv-only subscribers to KV drip:* (no welcome email)...`);
  const r = await importToKv(uniques);
  console.log(`KV import: ${r.written} written, ${r.skipped} skipped (already existed), ${r.errors} errors`);
}

async function runImportAndWelcome() {
  const { uniques } = await identifyBeehiivOnly();
  console.log(`\nFull migration: ${uniques.length} beehiiv-only subscribers`);
  console.log('Step 1: KV import...');
  const kvr = await importToKv(uniques);
  console.log(`  → ${kvr.written} written, ${kvr.skipped} skipped, ${kvr.errors} errors\n`);
  console.log('Step 2: welcome email batch (10s abort window)...');
  await sleep(10_000);
  const er = await sendWelcomeBatch(uniques);
  console.log(`\nDone. KV: ${kvr.written}+${kvr.skipped} | Email: ${er.sent} sent / ${er.failed} failed`);
  if (er.failures.length) {
    const failPath = path.join(REPO_ROOT, 'tmp/beehiiv-import-2026-05-14-failures.json');
    fs.mkdirSync(path.dirname(failPath), { recursive: true });
    fs.writeFileSync(failPath, JSON.stringify(er.failures, null, 2));
    console.log(`Failure detail → ${failPath}`);
  }
}

const mode = process.argv[2];
if (mode === '--dry-run')             await runDryRun();
else if (mode === '--test')           await runTest();
else if (mode === '--import')         await runImport();
else if (mode === '--import-and-welcome') await runImportAndWelcome();
else {
  console.error('Usage: node scripts/import-beehiiv-uniques-2026-05-14.mjs --dry-run|--test|--import|--import-and-welcome');
  process.exit(1);
}
