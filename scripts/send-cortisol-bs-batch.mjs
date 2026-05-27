// One-time script: send the cortisol + blood-sugar Tier-1 buyers their
// category-specific challenge + cookbook fulfillment email. Mirrors the
// BP batch (send-tier1-batch.mjs) but routes to the right challenge PDF
// based on what each buyer paid for.
//
// Usage:
//   node scripts/send-cortisol-bs-batch.mjs --test          # one email each (cortisol + bs) to brave.works.marketing@gmail.com
//   node scripts/send-cortisol-bs-batch.mjs --dry-run       # write preview HTML
//   node scripts/send-cortisol-bs-batch.mjs --send-batch    # send to all 9 (4 cortisol + 5 blood sugar)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const RECIPIENTS_PATH = path.join(REPO_ROOT, 'tmp/apology/tier1-recipients.json');
const PREVIEW_DIR = path.join(REPO_ROOT, 'tmp/apology/previews');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';
const SITE_URL = 'https://bpquiz.com';
const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

const CATEGORIES = {
  cortisol: {
    subject: "You're in — your 10-Day Cortisol Cure + bonus inside",
    challengeFile: 'cortisol-cure-10-day.pdf',
    challengeLabel: 'The 10-Day Cortisol Cure',
    challengeDesc: 'A clinical protocol to reset stress hormones and restore blood pressure, sleep, and weight. Day-by-day, no prescriptions — just the framework Joel uses with his patients.',
    accent: '#7B6CA8', // soft purple for cortisol
    kicker: 'Your cortisol protocol',
  },
  blood_sugar: {
    subject: "You're in — your 10-Day Blood Sugar Reset + bonus inside",
    challengeFile: 'blood-sugar-reset-10-day.pdf',
    challengeLabel: 'The 10-Day Blood Sugar Reset',
    challengeDesc: 'A clinical protocol for glucose, A1C, and the drivers your doctor never tests for. 10 days of targeted lifestyle steps to reverse the hidden glucose drivers most labs miss.',
    accent: '#4A6741', // sage green for blood sugar
    kicker: 'Your blood sugar protocol',
  },
};

function categorize(productName) {
  const p = (productName || '').toLowerCase();
  if (p.includes('cortisol')) return 'cortisol';
  if (p.includes('blood sugar') || p.includes('glucose')) return 'blood_sugar';
  return null;
}

function renderEmail({ name, category }) {
  const cat = CATEGORIES[category];
  const firstName = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN · Twenty years ICU &amp; emergency</div>
      </td></tr>

      <tr><td style="padding:18px 28px 16px;">
        <div style="display:inline-block;background:#F0FFF4;border:1px solid #68D391;border-radius:8px;padding:6px 14px;font-size:13px;color:#276749;font-weight:600;margin-bottom:16px;">
          ✓ Purchase confirmed
        </div>
        <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#2C3E50;margin:0 0 12px;font-weight:500;">
          ${greeting} you just did something most people never do.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">
          You took your health into your own hands. That decision matters more than any single herb or protocol. Here's everything you have access to right now:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E6;border:1px solid #F6E05E;border-radius:10px;margin-top:12px;">
          <tr><td style="padding:12px 16px;">
            <p style="font-size:13px;line-height:1.5;color:#744210;margin:0;">
              <strong>Important:</strong> Add <strong>joel@bpquiz.com</strong> and <strong>braveworksrn@gmail.com</strong> to your contacts so your challenge emails and protocol updates don't end up in spam or promotions. Do this now — it takes 5 seconds.
            </p>
          </td></tr>
        </table>
      </td></tr>

      <!-- MAIN: Category Challenge -->
      <tr><td style="padding:6px 28px 4px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${cat.accent};margin-bottom:6px;">${cat.kicker}</div>
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#2C3E50;margin:0 0 10px;font-weight:500;">${cat.challengeLabel}</h2>
          <p style="font-size:14px;line-height:1.55;color:#3A3A3A;margin:0 0 14px;">
            ${cat.challengeDesc}
          </p>
          <a href="${SITE_URL}/downloads/${cat.challengeFile}" style="display:inline-block;background:${cat.accent};color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Download the 10-Day Protocol →
          </a>
        </div>
      </td></tr>

      <!-- BONUS: Cookbook -->
      <tr><td style="padding:8px 28px 4px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#4A6741;margin-bottom:6px;">Your bonus</div>
          <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 6px;font-weight:500;">One extra to fuel the protocol</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;background:#F5F1E8;border-radius:12px;">
            <tr><td style="padding:14px 18px;">
              <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:6px;">🎁 Cook For Life · Plant-Based Cookbook</div>
              <a href="${SITE_URL}/downloads/cook-for-life-cookbook.pdf" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:9px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
                Download PDF →
              </a>
            </td></tr>
          </table>
        </div>
      </td></tr>

      <!-- 30-DAY CHALLENGE + COMMUNITY + GUARANTEE -->
      <tr><td style="padding:6px 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#4A6741;border-radius:14px;">
          <tr><td style="padding:24px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:16px;">Included with your purchase</div>

            <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
              <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">You're enrolled in the 30-Day Protocol Challenge</div>
              <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
                Starting tomorrow, you'll receive one email a day for 30 days. Each one walks you through the next step of the protocol — herbs, meals, timing, and the reasoning behind each move. Nothing extra to sign up for. It's already started.
              </p>
            </div>

            <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
              <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Your Skool community is live</div>
              <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 10px;">
                Join "How to Be Your Own Doctor" — ask Joel anything, post your progress, and connect with people on the same path.
              </p>
              <a href="${SKOOL_URL}" style="display:inline-block;background:#FFFFFF;color:#4A6741;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Join the Skool community &rarr;
              </a>
            </div>

            <div>
              <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Joel's guarantee</div>
              <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
                Complete the 30-day challenge. If you haven't seen meaningful change in your numbers with your doctor's blessing, Joel refunds every penny. No hoops. No fine print.
              </p>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:4px 28px 24px;">
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0 0 10px;">
          Reply to this email with questions about your protocol, your medications, or what to try first. I read what you send.
        </p>
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0;">
          — Joel
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="${SITE_URL}" style="color:#9A9A9A;">bpquiz.com</a>
          <br/>Educational content only. Not medical advice. Always complement — never replace — care from your physician.
          <br/>You received this because you purchased a BraveWorks health protocol.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendOne({ resend, to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to.trim(),
    replyTo: REPLY_TO,
    subject,
    html,
  });
  if (error) throw new Error(JSON.stringify(error));
  return data;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isTest = args.has('--test');
  const isDryRun = args.has('--dry-run');
  const isBatch = args.has('--send-batch');

  if (!isTest && !isDryRun && !isBatch) {
    console.error('Specify one of --test / --dry-run / --send-batch');
    process.exit(1);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey && !isDryRun) {
    console.error('RESEND_API_KEY not set');
    process.exit(1);
  }

  const allBuyers = JSON.parse(fs.readFileSync(RECIPIENTS_PATH, 'utf-8'));
  const targets = allBuyers
    .map((b) => ({ ...b, _category: categorize(b.product) }))
    .filter((b) => b._category);

  const cortisol = targets.filter((b) => b._category === 'cortisol');
  const bs = targets.filter((b) => b._category === 'blood_sugar');
  console.log(`Total: ${targets.length} buyers (cortisol=${cortisol.length}, blood_sugar=${bs.length})`);

  if (isDryRun) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    for (const cat of ['cortisol', 'blood_sugar']) {
      const sample = targets.find((b) => b._category === cat);
      if (!sample) continue;
      const html = renderEmail({ name: sample.name, category: cat });
      const out = path.join(PREVIEW_DIR, `preview-${cat}-v2.html`);
      fs.writeFileSync(out, html);
      console.log(`Wrote ${out} (${sample.email}, ${sample.name})`);
    }
    return;
  }

  if (isTest) {
    const resend = new Resend(resendKey);
    for (const cat of ['cortisol', 'blood_sugar']) {
      const sample = targets.find((b) => b._category === cat);
      if (!sample) continue;
      const html = renderEmail({ name: sample.name, category: cat });
      const subject = `[TEST PREVIEW] ${CATEGORIES[cat].subject}`;
      const data = await sendOne({ resend, to: TEST_TO, subject, html });
      console.log(`Test [${cat}] sent → ${TEST_TO} id=${data.id} (sample buyer: ${sample.name})`);
      await new Promise((r) => setTimeout(r, 600));
    }
    return;
  }

  if (isBatch) {
    const resend = new Resend(resendKey);
    const results = [];
    for (let i = 0; i < targets.length; i++) {
      const b = targets[i];
      const html = renderEmail({ name: b.name, category: b._category });
      const subject = CATEGORIES[b._category].subject;
      try {
        const data = await sendOne({ resend, to: b.email, subject, html });
        results.push({ email: b.email, status: 'sent', id: data.id, category: b._category });
        console.log(`[${i + 1}/${targets.length}] sent → ${b.email} (${b._category}) id=${data.id}`);
      } catch (err) {
        results.push({ email: b.email, status: 'failed', error: err.message, category: b._category });
        console.error(`[${i + 1}/${targets.length}] FAILED → ${b.email}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    const logPath = path.join(REPO_ROOT, 'tmp/apology/cortisol-bs-batch-log.json');
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    const sent = results.filter((r) => r.status === 'sent').length;
    console.log(`\nBatch complete. Sent ${sent}/${results.length}. Log → ${logPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
