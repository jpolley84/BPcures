// One-time script: send the Tier-1 ($12-$22) purchase confirmation email
// to BP buyers who never received one. Restructures the email to show
// the BP Reset Kit zip (attached) as the MAIN deliverable and the
// 10-day challenge + cookbook as BONUSES.
//
// Cortisol and Blood Sugar buyers are intentionally skipped — they need
// their own kit zips before sending.
//
// Usage:
//   node scripts/send-tier1-batch.mjs --test          # one email to brave.works.marketing@gmail.com
//   node scripts/send-tier1-batch.mjs --dry-run       # render preview HTML
//   node scripts/send-tier1-batch.mjs --send-batch    # send to all BP recipients (rate-limited)
//
// Reads buyer list from: tmp/apology/tier1-recipients.json (relative to repo root)
// Reads RESEND_API_KEY from process.env.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const RECIPIENTS_PATH = path.join(REPO_ROOT, 'tmp/apology/tier1-recipients.json');
const PREVIEW_DIR = path.join(REPO_ROOT, 'tmp/apology/previews');
const KIT_ZIP_PATH = path.resolve(__dirname, '../public/downloads/bp-reset-kit.zip');

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const TEST_TO = 'brave.works.marketing@gmail.com';
const SITE_URL = 'https://bpquiz.com';
const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
const SUBJECT = "You're in — your BP Reset Kit + 30-day challenge bonuses inside";

// 2026-05-10 funnel-fix: was pointing at deactivated plink
// 9B63cv8k3b5Y63h8VrfnO0z (Complete Book Bundle $27 — pulled from Stripe).
// Repointed to canonical $47 BP Reset Kit. If you re-run this batch for
// cortisol or blood-sugar buyers, swap the URL to the matching $47 plink.
const UPSELL = {
  url: 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k',
  label: 'Upgrade to The BP Reset Kit ($47) — the complete clinical system',
  desc: 'You have the starter. The full BP Reset Kit adds Joel\'s 8-PDF clinical kit (hypertension guide, supplement protocol, meal plan, BP tracker, doctor templates, quick-start, cheat sheet). One-time price.',
};

function categorize(productName) {
  const p = (productName || '').toLowerCase();
  if (p.includes('cortisol')) return 'cortisol';
  if (p.includes('blood sugar') || p.includes('glucose')) return 'blood_sugar';
  return 'bp';
}

function renderBpEmail({ name }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  const bonusRow = (label, file) => {
    const url = `${SITE_URL}/downloads/${file}`;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;background:#F5F1E8;border-radius:12px;">
        <tr><td style="padding:14px 18px;">
          <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:6px;">${label}</div>
          <a href="${url}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:9px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
            Download PDF →
          </a>
        </td></tr>
      </table>
    `;
  };

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

      <!-- MAIN DELIVERABLE -->
      <tr><td style="padding:6px 28px 4px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;margin-bottom:6px;">Your main protocol</div>
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#2C3E50;margin:0 0 10px;font-weight:500;">The BP Reset Kit — 8 PDFs</h2>
          <p style="font-size:14px;line-height:1.55;color:#3A3A3A;margin:0 0 12px;">
            One download. Eight PDFs. Save the zip, unzip it once, and you'll have your full protocol at your fingertips:
          </p>
          <ul style="font-size:13px;line-height:1.8;color:#3A3A3A;margin:0 0 14px;padding-left:20px;">
            <li>The Hypertension Guide</li>
            <li>The Supplement Protocol</li>
            <li>The Meal Plan</li>
            <li>The BP Tracker</li>
            <li>Doctor Conversation Templates</li>
            <li>The Quick Start</li>
            <li>The Cheat Sheet</li>
            <li><strong>The Overmedicated Boomer</strong> — full book included</li>
          </ul>
          <a href="${SITE_URL}/downloads/bp-reset-kit.zip" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Download the BP Reset Kit (zip) →
          </a>
        </div>
      </td></tr>

      <!-- BONUSES -->
      <tr><td style="padding:8px 28px 4px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#4A6741;margin-bottom:6px;">Your bonuses</div>
          <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 6px;font-weight:500;">Two extras included with your kit</h2>
          <p style="font-size:13px;line-height:1.5;color:#5A5A5A;margin:0 0 10px;">Click to download. These work alongside the kit.</p>
          ${bonusRow('🎁 Bonus #1 — The 10-Day BP Reset Challenge (Day 1 + Full Plan)', 'bp-reset-day1-and-beyond.pdf')}
          ${bonusRow('🎁 Bonus #2 — Cook For Life · Plant-Based Cookbook', 'cook-for-life-cookbook.pdf')}
        </div>
      </td></tr>

      <!-- 30-DAY CHALLENGE + COMMUNITY + GUARANTEE -->
      <tr><td style="padding:6px 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#4A6741;border-radius:14px;">
          <tr><td style="padding:24px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:16px;">Included with your kit</div>

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
                Complete the 30-day challenge. If you haven't eliminated at least one prescription with your doctor's blessing, Joel refunds every penny. No hoops. No fine print.
              </p>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <!-- UPSELL -->
      <tr><td style="padding:6px 28px 18px;">
        <div style="background:#FBF8F1;border-radius:12px;padding:16px 18px;border:1px dashed rgba(0,0,0,0.12);">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;margin-bottom:6px;">One-time offer — only available right now</div>
          <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:4px;">${UPSELL.label}</div>
          <div style="font-size:13px;line-height:1.5;color:#5A5A5A;margin-bottom:10px;">${UPSELL.desc}</div>
          <a href="${UPSELL.url}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Add all 3 books for $27 &rarr;
          </a>
        </div>
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

async function sendOne({ resend, to, html }) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to.trim(),
    replyTo: REPLY_TO,
    subject: SUBJECT,
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
  const bpBuyers = allBuyers.filter((b) => (b.category || categorize(b.product)) === 'bp');
  const skipped = allBuyers.length - bpBuyers.length;
  console.log(`Loaded ${allBuyers.length} Tier-1 buyers; ${bpBuyers.length} BP, ${skipped} skipped (cortisol/blood-sugar — need their own kit zips).`);

  if (isDryRun) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    const sample = bpBuyers[0];
    const html = renderBpEmail({ name: sample.name });
    const out = path.join(PREVIEW_DIR, 'preview-bp-v2.html');
    fs.writeFileSync(out, html);
    console.log(`Wrote ${out} (${sample.email}, ${sample.name})`);
    const stat = fs.statSync(KIT_ZIP_PATH);
    console.log(`Attachment: ${KIT_ZIP_PATH} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
    return;
  }

  if (isTest) {
    const sample = bpBuyers[0];
    const html = renderBpEmail({ name: sample.name });
    const resend = new Resend(resendKey);
    const data = await sendOne({ resend, to: TEST_TO, html });
    console.log(`Test sent to ${TEST_TO} (id: ${data.id}).`);
    console.log(`  Sample buyer used for greeting: ${sample.name} (${sample.email})`);
    return;
  }

  if (isBatch) {
    const resend = new Resend(resendKey);
    const results = [];
    for (let i = 0; i < bpBuyers.length; i++) {
      const b = bpBuyers[i];
      const html = renderBpEmail({ name: b.name });
      try {
        const data = await sendOne({ resend, to: b.email, html });
        results.push({ email: b.email, status: 'sent', id: data.id });
        console.log(`[${i + 1}/${bpBuyers.length}] sent → ${b.email} id=${data.id}`);
      } catch (err) {
        results.push({ email: b.email, status: 'failed', error: err.message });
        console.error(`[${i + 1}/${bpBuyers.length}] FAILED → ${b.email}: ${err.message}`);
      }
      // Resend free tier: 2 req/sec. Sleep 600ms between sends.
      await new Promise((r) => setTimeout(r, 600));
    }
    const logPath = path.join(REPO_ROOT, 'tmp/apology/batch-send-log.json');
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    const sent = results.filter((r) => r.status === 'sent').length;
    console.log(`\nBatch complete. Sent ${sent}/${results.length}. Log → ${logPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
