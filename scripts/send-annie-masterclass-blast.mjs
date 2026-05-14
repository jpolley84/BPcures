// scripts/send-annie-masterclass-blast.mjs
//
// One-shot broadcast to drip:* engaged list: promote Annie Chitate's
// free "Bring Sexy Back" hormone masterclass — Thursday 2026-05-14
// at 12:00 PM ET. Signups go to restoreherhormones.com/sexyback.
//
// FLAGS: --dry-run | --send

import { pullRecipients, broadcast, wrap } from './_broadcast-helpers.mjs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const SEND = argv.includes('--send');
if (!DRY && !SEND) { console.error('Need --dry-run | --send'); process.exit(1); }
if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }

const SUBJECT = "Annie's free hormone masterclass — tomorrow at noon ET";
const SIGNUP_URL = 'https://restoreherhormones.com/sexyback';

function renderText(firstName) {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Quick one.

You've heard me talk about the cortisol corner of the BP Triangle — the hormone layer underneath blood pressure, weight, energy, sleep, mood. The part most cardiologists never measure.

Annie Chitate, RN — my wife and the hormone-corner coach inside my 90-Day Sprint — is teaching a free masterclass on it tomorrow at noon Eastern. She's opening the doors to my list because we both know how many of you have been carrying this and waiting for someone to take it seriously.

BRING SEXY BACK: A Hormone Reset Masterclass
Thursday, May 14 · 12:00 PM ET / 11:00 AM CT · Live on Zoom

What she's covering:
• Why "labs say you're fine" but you don't feel fine
• The belly weight that won't move no matter what you eat
• The hormone nobody talks about that's quietly running the show
• What you can shift THIS WEEK without starting over

Two gifts she's making to this list:
1. Free seat at the masterclass — no pitch, pure teaching
2. 20% off her June live event (you've heard me mention it)

If you've been wondering whether the hormone work is for you — or whether her coaching is the right fit before you apply for my Sprint — this masterclass is your audition hour. She runs the biweekly hormone sessions inside the Sprint. One hour with her tomorrow tells you everything you need to know.

Sign up here so she can send you the Zoom link + reminder:
${SIGNUP_URL}

I'll be in the room too. Bring your real questions.

Joel Polley, RN
BraveWorks

P.S. Sprint cohort closes Sunday. If you're on the fence, watch the masterclass first. Either way, she's worth the hour.
`;
}

function renderHtml(firstName, u) {
  const body = `
<p style="font-size:15.5px;margin:0 0 14px;">Quick one.</p>

<p style="font-size:15.5px;margin:0 0 14px;">
  You've heard me talk about the <strong>cortisol corner of the BP Triangle</strong> — the hormone layer underneath blood pressure, weight, energy, sleep, mood. The part most cardiologists never measure.
</p>

<p style="font-size:15.5px;margin:0 0 18px;">
  Annie Chitate, RN — <strong>my wife</strong> and the hormone-corner coach inside my 90-Day Sprint — is teaching a free masterclass on it tomorrow at noon Eastern. She's opening the doors to my list because we both know how many of you have been carrying this and waiting for someone to take it seriously.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6EBE0;border:1px solid #3F5A3C;border-radius:8px;margin:14px 0 18px;">
  <tr><td style="padding:16px 18px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin-bottom:4px;">Live masterclass</div>
    <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#2C2A26;margin-bottom:4px;">Bring Sexy Back — A Hormone Reset Masterclass</div>
    <div style="font-size:14px;color:#5B564C;">Thursday, May 14 · 12:00 PM ET / 11:00 AM CT · Live on Zoom</div>
  </td></tr>
</table>

<p style="font-size:15px;margin:0 0 8px;font-weight:600;">What she's covering:</p>
<ul style="font-size:14.5px;margin:0 0 18px;padding-left:22px;line-height:1.7;">
  <li>Why "labs say you're fine" but you don't feel fine</li>
  <li>The belly weight that won't move no matter what you eat</li>
  <li>The hormone nobody talks about that's quietly running the show</li>
  <li>What you can shift <strong>this week</strong> without starting over</li>
</ul>

<p style="font-size:15px;margin:0 0 6px;font-weight:600;">Two gifts she's making to this list:</p>
<ol style="font-size:14.5px;margin:0 0 18px;padding-left:22px;line-height:1.7;">
  <li><strong>Free seat</strong> at the masterclass — no pitch, pure teaching</li>
  <li><strong>20% off</strong> her June live event (you've heard me mention it)</li>
</ol>

<p style="font-size:15px;margin:0 0 18px;">
  If you've been wondering whether the hormone work is for you — or whether her coaching is the right fit before you apply for my Sprint — this masterclass is your <em>audition hour</em>. She runs the biweekly hormone sessions inside the Sprint. One hour with her tomorrow tells you everything you need to know.
</p>

<p style="font-size:15px;margin:0 0 18px;">
  Sign up here so she can send you the Zoom link + reminder:
</p>

<p style="margin:0 0 22px;text-align:center;">
  <a href="${SIGNUP_URL}" style="display:inline-block;padding:14px 28px;background:#3F5A3C;color:#FBF8F1;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    Save my seat →
  </a>
</p>

<p style="font-size:14.5px;color:#5B564C;margin:0 0 22px;line-height:1.65;">
  I'll be in the room too. Bring your real questions.
</p>

<p style="font-size:15.5px;margin:0 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 24px;">BraveWorks</p>

<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 18px;" />

<p style="font-size:13.5px;color:#5B564C;line-height:1.7;margin:0;font-style:italic;">
  <strong style="color:#2C2A26;font-style:normal;">P.S.</strong> Sprint cohort closes Sunday. If you're on the fence, watch the masterclass first. Either way, she's worth the hour.
</p>
`;
  return wrap({ kicker: 'BraveWorks RN  ·  Tomorrow @ noon ET', body, firstName, unsubUrl: u });
}

const { recipients, stats } = await pullRecipients();
console.log(`Engaged target: ${recipients.length}  (skipped ${stats.unsub + stats.paused + stats.complete + stats.noEmail})`);

if (DRY) {
  console.log('\n— SUBJECT —\n' + SUBJECT);
  console.log('\n— TEXT (first recipient) —\n' + renderText(recipients[0]?.firstName || ''));
  process.exit(0);
}

await broadcast({
  targets: recipients,
  subject: SUBJECT,
  renderText, renderHtml,
  label: 'annie-masterclass-blast',
});
