// scripts/send-cohort-reminder-sunday.mjs
//
// Sunday morning final-call. "Door closes tonight at 11:59 PM ET."
// Same value stack + price block as Saturday but with maximum urgency
// framing and a sharper close.
//
// FIRE:  Sun 2026-05-17 at 8:00 AM CT (13:00 UTC)
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

const SUBJECT = 'Door closes tonight at 11:59 PM ET.';

const renderText = (firstName) => {
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

P.S. 11:59 PM Eastern. Tonight. The math will never look like this again.
`;
};

const renderHtml = (firstName, u) => {
  const body = `
<p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#B85A36;line-height:1.3;margin:0 0 8px;">
  Tonight. 11:59 PM Eastern.
</p>
<p style="font-family:Georgia,serif;font-size:17px;color:#2C2A26;margin:0 0 24px;">
  The door to the founding cohort closes.
</p>

<p style="font-size:15.5px;margin:0 0 18px;">
  I'm not going to retell the pitch. You've read it. I want to leave you with three things.
</p>

<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 8px;">One — what's in the room when you say yes:</div>

${valueStackHtml()}

${priceBlockHtml()}

<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;font-weight:700;margin:24px 0 8px;">Two — what's in the room when you say no:</div>
<p style="font-size:14.5px;color:#5B564C;line-height:1.7;margin:0 0 18px;font-style:italic;">
  The same Tuesday afternoon at 2 PM you've already lived a thousand times. The bottle drawer that doesn't close. The doctor who doesn't look up from the chart. Another year of "maybe next time."
</p>

<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:24px 0 6px;">Three — the link:</div>

${ctaButtonHtml('Apply before 11:59 PM tonight →')}

<p style="font-size:14px;color:#5B564C;margin:0 0 18px;line-height:1.65;">
  I'll read every application tonight and reach out personally on Monday to the people who are the right fit.
</p>

<p style="font-size:15.5px;color:#2C2A26;margin:24px 0 18px;line-height:1.65;font-style:italic;">
  This isn't about the program. It's about the version of you on the other side of 90 days.
</p>

<p style="font-size:15.5px;margin:0 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>

<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />

<p style="font-size:13px;color:#B85A36;line-height:1.7;margin:0 0 12px;font-weight:600;">
  P.S. 11:59 PM Eastern. Tonight. The math will never look like this again.
</p>
  `;
  return wrap({ kicker: 'BraveWorks RN  ·  Door closes tonight', body, firstName, unsubUrl: u });
};

const { recipients } = await pullRecipients();
console.log(`Engaged target: ${recipients.length}`);

if (DRY) {
  console.log('\n— SUBJECT —\n' + SUBJECT);
  console.log('\n— TEXT BODY —\n' + renderText(recipients[0]?.firstName || ''));
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
  label: 'cohort-sunday-final',
});
