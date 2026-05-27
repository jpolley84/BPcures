// scripts/send-newsletter-issue-1-2026-05-25.mjs
//
// One-shot manual send — Monday Newsletter Issue 1.
// Today's 13 UTC auto-cron window already passed, so this is a hand-fire
// to get this Monday's send out before tonight's 10 PM ET live call.
// Future Mondays auto-fire via /api/newsletter-cron at 13 UTC.
//
// Audience: drip:* records where state==='newsletter' AND not unsub/paused/complete
// AND newsletterIssueLastSent is not yet set (skip anyone already in flight).
//
// Tracks: sets newsletterIssueLastSent=1 + newsletterLastSentAt + lastSentAt
// on each successful send. Cron next Monday picks up Issue 2.

import fs from 'node:fs';
import path from 'node:path';

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

const { kv } = await import('@vercel/kv');
const { Resend } = await import('resend');
const { signUnsubToken } = await import('../api/unsubscribe.js');

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const RATE_LIMIT_MS = 250; // 4 req/s — Resend-safe

// ─── Issue 1 content ────────────────────────────────────────────────────
const ISSUE = {
  number: 1,
  subject: '3 lies your doctor told you about your BP',
  subjectB: 'The first lie cost me three patients',
  preview: 'Three myths still being repeated in every primary-care office. Plus tonight\'s 10 PM ET live.',
};

const PALETTE = {
  outerBg: '#FBF8F1',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

const KIT_URL          = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
const YOUTUBE_VIDEO    = 'https://youtu.be/Gs7C3hCuydA?si=kyTS8A77ZYEDCNcD';
const TIKTOK_URL       = 'https://www.tiktok.com/@braveworksrn';
const FB_PAGE_URL      = 'https://www.facebook.com/61569919026849';
const FB_SUBSCRIBE_URL = 'https://www.facebook.com/61569919026849/subscribe/';
const SKOOL_URL        = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

function p(text, opts = {}) {
  const margin = opts.margin || '0 0 18px';
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${margin};">${text}</p>`;
}

function bigQuote(text) {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">${text}</p>`;
}

function renderHtml(firstName, unsubUrl) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${PALETTE.outerBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALETTE.outerBg};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PALETTE.cardBg};border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN · Monday weekly note</div>
      </td></tr>

      <tr><td style="padding:20px 28px 8px;">
        ${p(greeting)}
        ${bigQuote('Three lies.')}
        ${p(`Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.`)}
        ${p(`You've heard all three. You probably believe at least one of them right now. They came from your doctor, your pharmacist, your favorite YouTube health channel — all of them well-meaning, all of them passing on what they were taught.`)}
        ${p(`I was taught the same things in nursing school.`)}
        ${p(`Then I left the ICU and trained as a naturopath. And what I saw on the other side... reset everything.`, { margin: '0 0 28px' })}

        <div style="border-left:3px solid ${PALETTE.accentSage};padding:14px 0 4px 22px;margin:0 0 24px;">
          <p style="font-size:17px;line-height:1.5;color:${PALETTE.text};margin:0 0 16px;font-weight:600;">The three lies, plainly:</p>
          <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Lie #1 — "Cut your salt and the numbers come down."</p>
          <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Sodium does affect BP. But the salt shaker on your table is responsible for less than 15% of your daily intake. The other 85% is hidden in bread, deli meats, soups, sauces, and dressings — printed on the label, never read. The person who's been "watching their salt" for a decade and seeing nothing move? They're eating 4,000mg of hidden sodium daily. Doctor calls it genetic. It isn't.</p>
          <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Lie #2 — "BP medication is for life. Once you start, you can't stop."</p>
          <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 18px;">Some medications, yes. But for most patients I've worked with — the ones who address the actual driver of their pressure — the cardiologist is the one who reduces the dose first. Not the other way around. I've watched dozens of people walk out of follow-up appointments with HALF the prescription they walked in with. They didn't quit. They moved the right lever.</p>
          <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Lie #3 — "It's just genetics. There's nothing you can do."</p>
          <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Genetics load the gun. Environment pulls the trigger. The "genetic predisposition" is real — but it expresses itself only when the conditions are right (chronic stress, blood sugar dysregulation, sedentary patterns, hidden sodium overload, sleep debt). Remove the trigger conditions and most "genetic" hypertension reduces or resolves. The genes don't change. The expression does.</p>
        </div>

        ${p(`In future issues I'll unpack each one in detail — but tonight, just sit with this: your body has been trying to tell you something for a long time, and the standard advice has been answering a different question than the one your body is actually asking.`, { margin: '0 0 28px' })}

        <!-- Monday Live Call Block -->
        <div style="margin:32px 0;padding:28px 26px;background:#FFF5E5;border:2px solid ${PALETTE.accentClay};border-radius:14px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:10px;">Tonight · Monday · 10 PM ET</div>
          <p style="font-size:18px;line-height:1.45;color:${PALETTE.text};margin:0 0 14px;font-weight:600;">The weekly live call kicks off at 10 PM ET.</p>
          <p style="font-size:15px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 20px;">Bring your numbers, your meds, your questions. I work through real situations on screen — same way I do with private clients, just out loud.</p>

          <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 8px;font-weight:600;">Watch FREE on either platform:</p>
          <p style="font-size:13.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 18px;padding-left:8px;">
            → <a href="${TIKTOK_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">TikTok @braveworksrn</a><br/>
            → <a href="${FB_PAGE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Facebook page</a>
          </p>

          <div style="margin:0 0 16px;padding:16px 18px;background:${PALETTE.cardBg};border-radius:10px;">
            <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 8px;font-weight:600;">Want the private Zoom Hot-Seat room?</p>
            <p style="font-size:13px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 10px;">Subscribers get the link, their hand goes up first, and we work the room one person at a time:</p>
            <p style="font-size:13.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0;padding-left:8px;">
              → <a href="${FB_SUBSCRIBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on Facebook — $9.99/mo</a> <span style="color:#999;">(the price of a burger and fries)</span><br/>
              → <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Or upgrade inside Skool — $9/mo</a>
            </p>
          </div>

          <div style="padding:14px 16px;background:#2C3E50;border-radius:10px;">
            <p style="font-size:13px;line-height:1.5;color:#FFFFFF;margin:0;">
              <strong style="color:#FFD700;">Want everything?</strong> Skool VIP ($47/mo) adds 1-on-1 live consults, personal protocol reviews, classroom courses, and WhatsApp Office Hours.
            </p>
          </div>
        </div>

        <p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:24px 0 4px;font-weight:600;">Joel</p>
        <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>

        <div style="border-top:1px solid ${PALETTE.border};padding-top:20px;margin-bottom:24px;">
          <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
            <strong style="color:${PALETTE.text};">P.S.</strong> If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.
          </p>
        </div>

        <!-- BP Reset Kit upsell -->
        <div style="margin:0 0 28px;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">The DIY version of my entire program</div>
          <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">The BP Reset Kit is the full bundle of PDFs I hand patients on their way out of the hospital — same protocols, same hand-outs, same education. Self-paced, no calls, no waiting. Twenty years of ICU experience condensed into PDFs you can start tonight.</p>
          <a href="${KIT_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Get the BP Reset Kit — $17 →</a>
        </div>

        <!-- YouTube primary CTA -->
        <div style="margin:0 0 24px;padding:28px 26px;background:${PALETTE.cardBg};border:2px solid ${PALETTE.accentClay};border-radius:14px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:10px;">Not ready to spend a dollar yet?</div>
          <p style="font-size:16px;line-height:1.6;color:${PALETTE.text};margin:0 0 14px;font-weight:500;">That's completely fine. The same protocols I run with my private clients I teach on my YouTube — free, no signup, no email required.</p>
          <p style="font-size:14.5px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 20px;">I've watched these protocols get people off pills who thought they'd be on them for life. Your move.</p>
          <a href="${YOUTUBE_VIDEO}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Watch my latest video →</a>
        </div>

        <!-- Skool 3-tier ladder -->
        <div style="margin:0 0 28px;padding:24px 22px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:14px;">3 ways to go deeper inside the community</div>
          <div style="margin:0 0 14px;">
            <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.text};text-decoration:none;">Standard · Free</a></p>
            <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">The 10-Day Challenge, the BP Reset Kit, the community.</p>
          </div>
          <div style="margin:0 0 14px;">
            <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;">Premium · $9/mo</a></p>
            <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">Private Zoom Hot-Seat room every Monday at 10 PM ET. Hand goes up first.</p>
          </div>
          <div>
            <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;">VIP · $47/mo</a></p>
            <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">1-on-1 live consults · Personal protocol reviews · Classroom courses · WhatsApp Office Hours.</p>
          </div>
          <p style="font-size:12px;line-height:1.55;color:#999;margin:18px 0 0;font-style:italic;">Inside Skool: Settings → Subscription → pick your tier.</p>
        </div>

        <!-- Unsub footer -->
        <hr style="border:none;border-top:1px solid ${PALETTE.border};margin:24px 0 16px;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner<br/>
          Educational content only. Not medical advice. Always complement — never replace — care from your physician.<br/>
          <a href="${unsubUrl}" style="color:#9A9A9A;">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderText(firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  return `${greeting}

THREE LIES.

Not small ones. Big ones — the kind that keep people stuck on medication for the rest of their lives, watching their numbers creep up year after year, wondering why nothing ever works.

You've heard all three. You probably believe at least one of them right now.

I was taught the same things in nursing school. Then I left the ICU and trained as a naturopath. And what I saw on the other side reset everything.

THE THREE LIES:

Lie #1 — "Cut your salt and the numbers come down."
Sodium does affect BP. But the salt shaker on your table is responsible for less than 15% of your daily intake. The other 85% is hidden in bread, deli meats, soups, sauces, and dressings — printed on the label, never read. People "watching their salt" for a decade and seeing nothing move are eating 4,000mg of hidden sodium daily. Doctor calls it genetic. It isn't.

Lie #2 — "BP medication is for life. Once you start, you can't stop."
Some, yes. But for most patients I've worked with — the ones who address the actual driver — the cardiologist is the one who reduces the dose first. I've watched dozens walk out with HALF the prescription. They didn't quit. They moved the right lever.

Lie #3 — "It's just genetics. There's nothing you can do."
Genetics load the gun. Environment pulls the trigger. The predisposition is real, but it expresses only when conditions are right (stress, blood sugar, sedentary, hidden sodium, sleep debt). Remove the conditions and most "genetic" hypertension reduces or resolves.

In future issues I'll unpack each in detail. Tonight, just sit with this: your body has been trying to tell you something for a long time.

---

TONIGHT · MONDAY · 10 PM ET — the weekly live call

Bring your numbers, your meds, your questions. I work through real situations on screen.

WATCH FREE:
→ TikTok @braveworksrn: ${TIKTOK_URL}
→ Facebook page: ${FB_PAGE_URL}

PRIVATE ZOOM HOT-SEAT — subscribers only:
→ Subscribe on Facebook ($9.99/mo, the price of a burger and fries): ${FB_SUBSCRIBE_URL}
→ Or upgrade inside Skool ($9/mo): ${SKOOL_URL}

Skool VIP ($47/mo) adds 1-on-1 consults, personal protocol reviews, classroom courses, and WhatsApp Office Hours.

Joel
RN, BraveWorks

P.S. If your number ever feels heavy this week, hit reply. I read every one and answer with a 90-second response.

---

THE DIY VERSION OF MY ENTIRE PROGRAM
The BP Reset Kit is the full bundle of PDFs I hand patients on their way out of the hospital — same protocols, same hand-outs, same education.
→ ${KIT_URL}

---

NOT READY TO SPEND A DOLLAR YET?
The same protocols I run with private clients I teach on my YouTube — free.
→ ${YOUTUBE_VIDEO}

---

3 WAYS TO GO DEEPER IN THE COMMUNITY (${SKOOL_URL}):
→ Standard · Free — 10-Day Challenge, BP Reset Kit, community
→ Premium · $9/mo — Private Zoom Hot-Seat every Monday
→ VIP · $47/mo — 1-on-1 consults, protocol reviews, WhatsApp Office Hours

—
BraveWorks RN · Joel Polley, RN · Naturopathic practitioner
Educational only. Not medical advice.
`;
}

// ─── Main loop ──────────────────────────────────────────────────────────
const allKeys = await kv.keys('drip:*');
console.log(`Scanning ${allKeys.length} drip:* records...\n`);

let scanned = 0;
let eligible = 0;
let sent = 0;
let errors = 0;
let skippedExcluded = 0;
let skippedWrongState = 0;
let skippedAlreadyInFlight = 0;
const errs = [];

for (const key of allKeys) {
  scanned++;
  try {
    const sub = await kv.get(key);
    if (!sub || typeof sub !== 'object' || !sub.email) continue;
    if (sub.unsubscribed || sub.paused || sub.complete) { skippedExcluded++; continue; }
    if (sub.state !== 'newsletter') { skippedWrongState++; continue; }
    if (sub.newsletterIssueLastSent !== undefined && sub.newsletterIssueLastSent !== null) {
      skippedAlreadyInFlight++;
      continue;
    }

    eligible++;

    const unsubToken = signUnsubToken({ email: sub.email });
    const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
    const html = renderHtml(sub.firstName || '', unsubUrl);
    const text = renderText(sub.firstName || '');

    await resend.emails.send({
      from: FROM,
      to: sub.email,
      replyTo: REPLY_TO,
      subject: ISSUE.subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `newsletter-issue-${ISSUE.number}-${sub.email}-${Date.now()}`,
      },
    });

    await kv.set(key, {
      ...sub,
      newsletterIssueLastSent: ISSUE.number,
      newsletterLastSentAt: new Date().toISOString(),
      lastSentAt: new Date().toISOString(),
    });

    sent++;
    if (sent % 100 === 0) console.log(`  ${sent} sent...`);
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  } catch (err) {
    errors++;
    errs.push({ key, error: err.message });
    if (errors <= 5) console.error(`  ERROR ${key}: ${err.message}`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log(`NEWSLETTER ISSUE ${ISSUE.number} — BLAST COMPLETE`);
console.log('═'.repeat(60));
console.log(`Scanned:               ${scanned}`);
console.log(`Eligible:              ${eligible}`);
console.log(`Sent:                  ${sent}`);
console.log(`Errors:                ${errors}`);
console.log(`Skipped (excluded):    ${skippedExcluded}`);
console.log(`Skipped (wrong state): ${skippedWrongState}`);
console.log(`Skipped (in flight):   ${skippedAlreadyInFlight}`);

if (errs.length) {
  console.log('\nFirst 10 errors:');
  for (const e of errs.slice(0, 10)) console.log(`  ${e.key}: ${e.error}`);
}
