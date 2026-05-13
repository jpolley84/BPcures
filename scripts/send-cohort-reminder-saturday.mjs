// scripts/send-cohort-reminder-saturday.mjs
//
// Saturday morning reminder for the founding-cohort founding-cohort.
// Subject leans on the 36-hour countdown. Body shows the FULL value
// stack + $1,997 price block so applicants see exactly what they're
// applying for before clicking through.
//
// FIRE:  Sat 2026-05-16 at 7:00 AM CT (12:00 UTC)
//
// FLAGS: --dry-run | --test-only | --send

import {
  pullRecipients, broadcast, wrap,
  valueStackHtml, priceBlockHtml, ctaButtonHtml,
  APPLY_URL,
} from './_broadcast-helpers.mjs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const TEST = argv.includes('--test-only');
const SEND = argv.includes('--send');
if (!DRY && !TEST && !SEND) { console.error('Need --dry-run | --test-only | --send'); process.exit(1); }
if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }

const SUBJECT = '36 hours. The math, the door, and the receipt.';

const renderText = (firstName) => {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Quick honest math before you decide.

The founding cohort closes tomorrow night at 11:59 PM Eastern. Five slots. One filled. After that, the same program — same coaches, same protocol, same daily emails — is $6,997.

Here's everything you get for $1,997 (or 3 × $697):

• 12 weekly 1:1 sessions with me (Mondays 8 PM ET)
• 6 biweekly hormone sessions with Annie Chitate, RN
• Full supplement + diet audit (live, 60 min) — most members save $200-400/mo
• Daily schedule audit
• WhatsApp office hours — Sun-Thu 9-5 ET — 90 days
• Skool VIP membership — 90 days
• All BraveWorks courses — lifetime
• eBook library — lifetime
• Daily email coaching tailored to your protocol
• Tracker suite (BP / symptom / food / sleep)
• Partner inclusion guide
• Barbara O'Neill LIVE event — 20% off

Total stack delivered: $14,616
Your investment: $1,997 (founding) or $697 × 3
Math: 7× value to price. After Sunday, that ratio is 2×.

Apply: ${APPLY_URL}

I'm not telling you to apply.
I'm telling you the door closes Sunday at 11:59 PM ET and the math will never look like this again on this program.

Joel Polley, RN
BraveWorks

P.S. The first person who applied yesterday started Day 1 of her sleep work last night. That's the speed this can move at when you decide it's time.
`;
};

const renderHtml = (firstName, u) => {
  const body = `
<p style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C2A26;line-height:1.35;margin:0 0 18px;">
  Quick honest math before you decide.
</p>
<p style="font-size:15.5px;margin:0 0 14px;">
  The founding cohort closes <strong style="color:#B85A36;">tomorrow night at 11:59 PM Eastern</strong>. Five slots. One filled. After that, the same program — same coaches, same protocol, same daily emails — is <strong>$6,997</strong>.
</p>
<p style="font-size:15.5px;margin:0 0 8px;">
  Here's everything that's yours for $1,997:
</p>

${valueStackHtml()}

${priceBlockHtml()}

<p style="font-size:14px;color:#5B564C;margin:0 0 18px;line-height:1.65;">
  Math: <strong style="color:#3F5A3C;">7× value to price.</strong> After Sunday, that ratio is 2×. The math will never look like this on this program again.
</p>

${ctaButtonHtml('Apply before Sunday →')}

<p style="font-size:14px;color:#5B564C;margin:0 0 14px;line-height:1.65;">
  I'm not telling you to apply. I'm telling you the door closes Sunday at 11:59 PM ET and the founding rate is over when it's over.
</p>

<p style="font-size:15.5px;margin:24px 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>

<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />

<p style="font-size:13px;color:#5B564C;line-height:1.7;margin:0 0 12px;font-style:italic;">
  <strong style="color:#2C2A26;font-style:normal;">P.S.</strong> The first person who applied yesterday started Day 1 of her sleep work last night. That's how fast this moves when you decide it's time.
</p>
  `;
  return wrap({ kicker: 'BraveWorks RN  ·  Founding cohort — 36 hrs left', body, firstName, unsubUrl: u });
};

const { recipients, stats } = await pullRecipients();
console.log('━━━ Audit ━━━');
console.log(`Engaged target: ${recipients.length}  (skipped: ${stats.unsub + stats.paused + stats.complete + stats.noEmail})`);

if (DRY) {
  console.log('\n— SUBJECT —\n' + SUBJECT);
  console.log('\n— TEXT BODY (first recipient) —');
  console.log(renderText(recipients[0]?.firstName || ''));
  process.exit(0);
}

if (TEST) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { unsubUrl } = await import('./_broadcast-helpers.mjs');
  const u = unsubUrl('brave.works.marketing@gmail.com');
  const { data, error } = await resend.emails.send({
    from: 'Joel Polley, RN <joel@bpquiz.com>',
    to: 'brave.works.marketing@gmail.com',
    replyTo: 'braveworksrn@gmail.com',
    subject: SUBJECT,
    text: renderText('Joel'),
    html: renderHtml('Joel', u),
    headers: { 'List-Unsubscribe': `<${u}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  });
  if (error) { console.error(error); process.exit(1); }
  console.log(`✓ Test sent. id: ${data?.id}`);
  process.exit(0);
}

await broadcast({
  targets: recipients,
  subject: SUBJECT,
  renderText, renderHtml,
  label: 'cohort-saturday-reminder',
});
