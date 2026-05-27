// scripts/fire-cohort-sunday-finish.mjs
//
// One-shot finisher for the cohort-sunday "Door closes tonight" final-call
// email. The Vercel cron version (/api/cohort-sunday-cron) bailed at
// the 300s function timeout after sending to 733 recipients (+906 invalid-
// email failures), leaving ~2,466 untouched. This local runner has no
// timeout, sets a per-subscriber `cohortSundaySent: true` flag in KV so
// it's resumable, and dedupes by lowercased email.
//
// Behavior:
//   • Pull all drip:* records, filter to engaged (no unsub/paused/complete),
//     dedupe by lowercased email
//   • Skip any with cohortSundaySent === true
//   • Render the same "Door closes tonight at 11:59 PM ET." copy
//   • Send via Resend (100ms rate limit), set cohortSundaySent: true after
//   • Log invalid-email format records to a failures file
//
// Trade-off: the 733 already-sent recipients from the cron run will receive
// a SECOND copy of the email because the cron's runBroadcast didn't mark
// them in KV. Joel's call: better duplicate than miss the deadline.
//
// FLAGS:
//   --dry-run   show counts + first-recipient preview, send nothing
//   --send      execute
//   --limit=N   cap (useful for staged rollouts)

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import crypto from 'node:crypto';
import {
  valueStackHtml,
  priceBlockHtml,
  ctaButtonHtml,
  wrap,
  APPLY_URL,
  FROM,
  REPLY,
  signUnsubToken,
} from './_broadcast-helpers.mjs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const SEND = argv.includes('--send');
const LIMIT = parseInt(argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10);

if (!DRY && !SEND) { console.error('Need --dry-run or --send'); process.exit(1); }
if (SEND && !process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }

const RATE_LIMIT_MS = 100;
const SUBJECT = 'Door closes tonight at 11:59 PM ET.';

function renderText(firstName) {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Tonight. 11:59 PM Eastern. The door to the founding cohort closes.

I'm not going to retell the pitch. You've read it.

I want to leave you with three things.

ONE — what's in the room when you say yes:

• 12 weekly 1:1 sessions with me, starting Monday at 8 PM ET
• 6 biweekly hormone sessions with Annie Chitate, RN
• Full supplement + diet audit (most members save $200-400/mo)
• Daily schedule audit
• WhatsApp office hours — Sun-Thu 9-5 ET — 90 days
• Skool VIP — 90 days
• All my courses + every eBook — lifetime
• Daily email coaching tailored to YOUR protocol
• Tracker suite + Partner Inclusion Guide
• Barbara O'Neill LIVE event — 20% off

Total stack: $14,616.
Tonight: $1,997 (or three monthly payments of $697).
Tomorrow morning: $6,997.

TWO — what's in the room when you say no:

The same Tuesday afternoon at 2 PM you've already lived a thousand times. The bottle drawer that doesn't close. The doctor who doesn't look up from the chart. Another year of "maybe next time."

THREE — the link:

${APPLY_URL}

I'll read every application tonight and reach out personally on Monday to the people who are the right fit.

This isn't about the program.
It's about the version of you on the other side of 90 days.

Joel Polley, RN
BraveWorks

P.S. After tonight, the founding rate is gone. The program continues, but at $6,997. The 7× value-to-price math you saw yesterday will never look like that on this offer again.
`;
}

function renderHtml(firstName, u) {
  const body = `
<p style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#B85A36;line-height:1.3;margin:0 0 12px;">Tonight. 11:59 PM Eastern.</p>
<p style="font-family:Georgia,serif;font-size:18px;color:#2C2A26;line-height:1.5;margin:0 0 24px;">The door to the founding cohort closes.</p>
<p style="font-size:15.5px;margin:0 0 14px;">I'm not going to retell the pitch. You've read it.</p>
<p style="font-size:15.5px;margin:0 0 20px;">I want to leave you with three things.</p>

<p style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#5B564C;font-weight:700;margin:24px 0 8px;">One — what's in the room when you say yes</p>
${valueStackHtml()}
${priceBlockHtml()}
<p style="font-size:14px;color:#5B564C;margin:0 0 18px;text-align:center;line-height:1.5;"><strong style="color:#3F5A3C;">Tonight:</strong> $1,997 or 3 × $697.<br/><strong style="color:#B85A36;">Tomorrow morning:</strong> $6,997.</p>

<p style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#5B564C;font-weight:700;margin:24px 0 8px;">Two — what's in the room when you say no</p>
<p style="font-size:15.5px;margin:0 0 18px;font-style:italic;color:#5B564C;line-height:1.65;">The same Tuesday afternoon at 2 PM you've already lived a thousand times. The bottle drawer that doesn't close. The doctor who doesn't look up from the chart. Another year of "maybe next time."</p>

<p style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#5B564C;font-weight:700;margin:24px 0 12px;">Three — the link</p>
${ctaButtonHtml('Apply before 11:59 PM tonight →')}
<p style="font-size:14px;color:#5B564C;margin:0 0 18px;line-height:1.65;">I'll read every application tonight and reach out personally on Monday to the people who are the right fit.</p>
<p style="font-size:15.5px;color:#2C2A26;margin:24px 0 4px;line-height:1.5;">This isn't about the program.<br/>It's about the version of you on the other side of 90 days.</p>

<p style="font-size:15.5px;margin:24px 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>
<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />
<p style="font-size:13px;color:#5B564C;line-height:1.7;margin:0 0 12px;font-style:italic;"><strong style="color:#2C2A26;font-style:normal;">P.S.</strong> After tonight, the founding rate is gone. The program continues, but at $6,997. The 7× value-to-price math you saw yesterday will never look like that on this offer again.</p>
`;
  return wrap({ kicker: 'BraveWorks RN  ·  Final call — 11:59 PM ET', body, firstName, unsubUrl: u });
}

// Pull all engaged drip:* records, filter, dedupe — same shape as
// pullRecipients in api/_cohort-broadcast.js but exposes the full sub
// object so we can read + write cohortSundaySent.
async function pullRecipients() {
  const keys = await kv.keys('drip:*');
  const out = [];
  const seen = new Set();
  const stats = { total: 0, noEmail: 0, unsub: 0, paused: 0, complete: 0, alreadySent: 0, duplicate: 0 };
  for (const k of keys) {
    stats.total++;
    const sub = await kv.get(k);
    if (!sub || !sub.email) { stats.noEmail++; continue; }
    if (sub.unsubscribed) { stats.unsub++; continue; }
    if (sub.paused) { stats.paused++; continue; }
    if (sub.complete) { stats.complete++; continue; }
    if (sub.cohortSundaySent === true) { stats.alreadySent++; continue; }
    const ekey = String(sub.email).toLowerCase().trim();
    if (seen.has(ekey)) { stats.duplicate++; continue; }
    seen.add(ekey);
    out.push({ key: k, sub });
  }
  return { recipients: out, stats };
}

console.log('━━━━━━━━━━ COHORT-SUNDAY FINISHER ━━━━━━━━━━');
console.log('Mode:', DRY ? 'DRY RUN' : 'SEND');
console.log('Limit:', LIMIT || 'no limit');
console.log('');

const { recipients, stats } = await pullRecipients();
const targets = LIMIT > 0 ? recipients.slice(0, LIMIT) : recipients;

console.log('━━━ FILTER ━━━');
console.log('Scanned:                  ' + stats.total);
console.log('  No email:               ' + stats.noEmail);
console.log('  Unsubscribed:           ' + stats.unsub);
console.log('  Paused:                 ' + stats.paused);
console.log('  Complete:               ' + stats.complete);
console.log('  Already sent (this email): ' + stats.alreadySent);
console.log('  Duplicate (lowercased): ' + stats.duplicate);
console.log('Will target:              ' + targets.length);
console.log('');

if (DRY) {
  if (targets[0]) {
    console.log('SAMPLE first target:', targets[0].sub.email, targets[0].sub.firstName || '(no first name)');
  }
  console.log('\nDRY RUN — nothing sent. Pass --send to fire.');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
let sent = 0, failed = 0;
const failures = [];
const startedAt = Date.now();
console.log(`Firing to ${targets.length} subscribers at ${RATE_LIMIT_MS}ms intervals (est. ${Math.ceil(targets.length * RATE_LIMIT_MS / 60000)} min)...`);
console.log('');

for (let i = 0; i < targets.length; i++) {
  const { key, sub } = targets[i];
  try {
    const u = `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(sub.email)}`;
    const result = await resend.emails.send({
      from: FROM,
      to: sub.email,
      replyTo: REPLY,
      subject: SUBJECT,
      text: renderText(sub.firstName || ''),
      html: renderHtml(sub.firstName || '', u),
      headers: {
        'List-Unsubscribe': `<${u}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (result.error) {
      failed++;
      failures.push({ email: sub.email, error: result.error.message || JSON.stringify(result.error) });
    } else {
      sent++;
      await kv.set(key, { ...sub, cohortSundaySent: true, cohortSundaySentAt: new Date().toISOString() });
      if (sent % 100 === 0) {
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        console.log(`  ${sent}/${targets.length} sent  (${elapsed}s elapsed)`);
      }
    }
  } catch (err) {
    failed++;
    failures.push({ email: sub.email, error: err.message });
  }
  await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
}

console.log('');
console.log('━━━ DONE ━━━');
console.log('Sent:   ' + sent);
console.log('Failed: ' + failed);
console.log('Elapsed: ' + Math.round((Date.now() - startedAt) / 1000) + 's');
if (failures.length) {
  const path = 'C:/Users/jpoll/AppData/Local/Temp/cohort-sunday-finish-failures.json';
  await import('node:fs').then(fs => fs.writeFileSync(path, JSON.stringify(failures, null, 2)));
  console.log('Failures logged: ' + path);
}
