// api/_newsletter-emails.js — content + render layer for the weekly
// BraveWorks BP newsletter.
//
// Audience: drip:* records in state === 'newsletter' (parked legacy leads,
// ~3,590 records). Sent by api/newsletter-cron.js (Tuesdays 16:00 UTC,
// gated OFF by default via NEWSLETTER_ENABLED).
//
// 2026-07-03 REFRESH: the old 12-issue arc (sanitized from _drip-emails.js)
// pitched retired products ($27 Starter Kit legacy Stripe link, the paused
// $297 Diagnostic Session, Cohort 2) and carried NEWSTART violations in the
// stale issues (egg/turkey swap suggestions). Issues 1-4 were rewritten to
// the live world: one Triangle corner per issue (Stress / Sugar / Sodium),
// CTAs only to LIVE offers ($17 via /quiz-first, Skool Weekly Reset trial,
// $297 case review at /case-review with the honest 5/month cap). Issues
// 5-12 were retired outright, NOT quick-fixable (stale offers + compliance
// violations); recover from git history only after a full rewrite pass.
// The export map is therefore GATED to the refreshed issues. The cron
// derives its issue count from the map, so adding a refreshed issue here
// is all it takes to extend the cycle.
//
// Each issue exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl, postalAddress }
//
// Every send also gets complianceHtmlFooter/complianceTextFooter appended
// by the cron: visible unsubscribe link (legacy /api/unsubscribe endpoint,
// which now tombstones BOTH email machines) + BUSINESS_POSTAL_ADDRESS from
// env (no hardcoded address, no fallback — the cron refuses to send
// without it).
//
// Author: Joel Polley, RN, BraveWorks Health.

import { youtubePrimaryCTA, skoolTiersFooter, mondayCallReminder } from './_email-shared.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── URLs (single source of truth — LIVE offers only) ────────────────
// Newsletter readers are parked legacy leads with UNKNOWN corners, so the
// $17 path always routes through the quiz first (quiz → corner → /pay).
export const QUIZ_URL        = `${SITE_URL}/quiz`;
export const CASE_REVIEW_URL = `${SITE_URL}/case-review`;
export const SKOOL_URL       = 'https://www.skool.com/braveworksrn/about';
export const YOUTUBE_URL     = 'https://www.youtube.com/@braveworksrn';

// ─── Brand palette ────────────────────────────────────────────────────
const PALETTE = {
  outerBg: '#FBF8F1',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

// ─── Shared building blocks ───────────────────────────────────────────
function p(text, opts = {}) {
  const margin = opts.margin || '0 0 18px';
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${margin};">${text}</p>`;
}

function bigQuote(text) {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">${text}</p>`;
}

function sageBlock(html) {
  return `<div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">${html}</div>`;
}

function ctaButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

function joelSignoff() {
  return `<p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">Joel</p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>`;
}

function psBox(text) {
  return `<div style="border-top:1px solid ${PALETTE.border};padding-top:20px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.S.</strong> ${text}
    </p>
  </div>`;
}

function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

function footerSecondaryCTAs() {
  return youtubePrimaryCTA() + skoolTiersFooter();
}

// ─── Compliance footer (appended to EVERY send by newsletter-cron) ────
// Visible unsubscribe (the legacy endpoint tombstones both email machines)
// + postal address from BUSINESS_POSTAL_ADDRESS env. NO fallback address:
// if env is missing the cron refuses to send at all.
export function complianceHtmlFooter({ unsubUrl, postalAddress }) {
  const addressLine = postalAddress
    ? `<p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:6px 0 0;">BraveWorks Health · ${postalAddress}</p>`
    : '';
  return `<div style="border-top:1px solid ${PALETTE.border};margin-top:36px;padding-top:18px;">
    <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">
      You are getting this because you asked for blood pressure help at bpquiz.com.
      Everything here is education and lifestyle support, alongside your doctor, never instead of your doctor.
      <a href="${unsubUrl}" style="color:#8A8A8A;">Unsubscribe</a> any time. One click stops every email from me.
    </p>
    ${addressLine}
  </div>`;
}

export function complianceTextFooter({ unsubUrl, postalAddress }) {
  const lines = [
    '-----',
    'You are getting this because you asked for blood pressure help at bpquiz.com.',
    'Everything here is education and lifestyle support, alongside your doctor, never instead of your doctor.',
    `Unsubscribe any time (one click stops every email from me): ${unsubUrl}`,
  ];
  if (postalAddress) lines.push(`BraveWorks Health · ${postalAddress}`);
  return `\n\n${lines.join('\n')}\n`;
}

// ═════════════════════════════════════════════════════════════════════
// REFRESHED ISSUES — the Triangle arc (2026-07-03)
// Issue 1: the Triangle itself. Issue 2: Sodium. Issue 3: Sugar.
// Issue 4: Stress + the $297 case review door.
// ═════════════════════════════════════════════════════════════════════

const issue1 = {
  subject: 'Why your number will not stay down',
  subjectB: 'Your blood pressure has three corners',
  preview: 'Stress. Sugar. Sodium. One loop, three corners.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Most people fight blood pressure like it is one dial. Cut the salt. Take the pill. Hope.`)}
    ${p(`After twenty years in the ICU and ER, I can tell you it is not one dial.`)}
    ${bigQuote('It is a loop with three corners. I call it the BP Triangle.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The three corners:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Stress.</strong> Your body's alarm gets stuck on. It squeezes your vessels and holds sodium, all by itself.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Sugar.</strong> Every blood sugar spike raises insulin, and insulin narrows your vessels for hours after a meal.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Sodium.</strong> Not the shaker. The hidden sodium in everyday food, and the potassium your body needs to balance it.</p>
    `)}
    ${p(`Here is the part that matters: one corner is loudest for you. Work the wrong corner and nothing moves. That is how a person can watch their salt for ten years and never see the number budge. For many people, salt was never the loudest corner.`)}
    ${p(`Over the next few weeks I will walk each corner with you, one at a time, in plain language.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Just notice. When is your number highest? Mornings? After meals? After a hard day? Write it down. That pattern is a clue to which corner is yours.</p>
    `)}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If your number ever feels heavy this week, hit reply. I read every one.`)}
    ${upsellFooter({
      kicker: 'Want to know your loudest corner today?',
      body: 'The free BP Triangle quiz takes about 90 seconds and no card. It shows which corner is driving your number and the first step for it. If you want the full 10-day plan for that corner after, it is $17.',
      ctaLabel: 'Find your loudest corner free',
      ctaUrl: QUIZ_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Most people fight blood pressure like it is one dial. Cut the salt. Take the pill. Hope.

After twenty years in the ICU and ER, I can tell you it is not one dial. It is a loop with three corners. I call it the BP Triangle.

THE THREE CORNERS:
- STRESS. Your body's alarm gets stuck on. It squeezes your vessels and holds sodium, all by itself.
- SUGAR. Every blood sugar spike raises insulin, and insulin narrows your vessels for hours after a meal.
- SODIUM. Not the shaker. The hidden sodium in everyday food, and the potassium your body needs to balance it.

One corner is loudest for you. Work the wrong corner and nothing moves. That is how a person can watch their salt for ten years and never see the number budge.

THIS WEEK'S ASK: Just notice. When is your number highest? Mornings? After meals? After a hard day? Write it down. That pattern is a clue.

Joel
RN, BraveWorks

P.S. If your number ever feels heavy this week, hit reply. I read every one.

-----
Want to know your loudest corner today?
The free BP Triangle quiz takes about 90 seconds and no card. The full 10-day plan for your corner is $17 after, if you want it.
-> ${QUIZ_URL}

-----
-> Skool: ${SKOOL_URL}
-> YouTube: ${YOUTUBE_URL}
`,
};

const issue2 = {
  subject: 'The salt shaker was never the problem',
  subjectB: 'Where your sodium really comes from',
  preview: 'Less than 15% comes from the shaker. Here is the rest.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This week: the Sodium corner of the Triangle.`)}
    ${p(`Here is what most diet sheets get wrong. The salt shaker on your table is less than 15% of your daily sodium. The other 85% is hidden in everyday food, printed right on the label. We just do not think to look.`)}
    ${p(`<strong>Three of the biggest hiding spots:</strong>`)}
    ${p(`<strong>1. Bread.</strong> One slice of store sandwich bread holds 200 to 300mg of sodium. Two slices for a sandwich is 600mg before anything goes on the bread.`)}
    ${p(`<strong>2. Packaged deli meat.</strong> A normal-looking lunch portion runs 700 to 900mg. Swapping it for a white bean spread or hummus with vegetables drops that to almost nothing.`)}
    ${p(`<strong>3. Canned soup, sauces, dressings.</strong> A cup of canned soup can hit 800 to 1,200mg. One tablespoon of soy sauce is about 900mg.`)}
    ${p(`Add those up in one day and you can pass the whole 2,300mg ceiling without ever touching the shaker.`)}
    ${bigQuote('And sodium is only half of this corner.')}
    ${p(`Sodium and potassium work as a pair. Sodium pulls water into your vessels. Potassium helps your body let it go. Healthy bodies want roughly 1 part sodium to 3 parts potassium. The standard American diet runs closer to 4 parts sodium to 1 part potassium. That is why cutting salt alone almost never works: it only fixes one side of the pair.`)}
    ${p(`Most adults get under 2,000mg of potassium a day. The body wants around 4,700mg, and it wants it from real food.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask. Two small things.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;">1. Pick three foods you eat every week and read the sodium line on the label. Just look.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 6px;">2. Add ONE potassium-rich food to your day:</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">- A medium baked potato with the skin: 925mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">- A cup of cooked spinach: 840mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 6px;">- A cup of cooked white beans: 1,000mg</p>
      <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 12px;">- An avocado: 700mg, or a banana: 420mg</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">If you take a potassium-sparing water pill (like spironolactone or amiloride), talk to your prescriber before adding potassium foods on purpose.</p>
    `)}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Some of you are about to find a label number that explains a lot. Reply and tell me what you find.`)}
    ${upsellFooter({
      kicker: 'Is Sodium your loudest corner?',
      body: 'The free 90-second quiz will tell you. If it is, the $17 Corner Reset hands you ten mornings of exact steps for it, one step a day, with a sheet to bring your doctor so you walk in with your own data.',
      ctaLabel: 'Find your corner and get your plan',
      ctaUrl: QUIZ_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This week: the Sodium corner of the Triangle.

The salt shaker is less than 15% of your daily sodium. The other 85% is hidden in everyday food.

THREE BIG HIDING SPOTS:
1. Bread: 200-300mg per slice.
2. Packaged deli meat: 700-900mg per lunch portion. A white bean spread or hummus with vegetables drops that to almost nothing.
3. Canned soup, sauces, dressings: 800-1,200mg per serving.

You can pass the 2,300mg ceiling without ever touching the shaker.

AND SODIUM IS ONLY HALF OF THIS CORNER.
Sodium and potassium work as a pair. Healthy bodies want about 1 sodium to 3 potassium. The standard American diet runs closer to 4 to 1. That is why cutting salt alone almost never works.

THIS WEEK'S ASK:
1. Read the sodium line on three foods you eat every week.
2. Add ONE potassium-rich food: baked potato with skin (925mg), cooked spinach (840mg), white beans (1,000mg), avocado (700mg), banana (420mg).

On a potassium-sparing water pill (spironolactone, amiloride)? Talk to your prescriber first.

Joel
RN, BraveWorks

P.S. Reply and tell me what you find on those labels.

-----
Is Sodium your loudest corner? The free 90-second quiz will tell you. The $17 Corner Reset gives you ten mornings of exact steps after, if you want it.
-> ${QUIZ_URL}

-----
-> Skool: ${SKOOL_URL}
-> YouTube: ${YOUTUBE_URL}
`,
};

const issue3 = {
  subject: 'The corner most heart doctors never check',
  subjectB: 'Sugar pushes your number harder than you think',
  preview: 'Insulin squeezes your vessels for hours after a meal.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This week: the Sugar corner of the Triangle. This is the one that explains why people who cut their salt for a decade watch the number keep creeping anyway.`)}
    ${bigQuote('Every blood sugar spike raises insulin. And insulin squeezes your vessels.')}
    ${p(`For two to three hours after a spike, insulin narrows your blood vessels and tells your kidneys to hold on to sodium. Both of those push your number up. Most heart doctors never look at this corner, because blood sugar is not on their scorecard.`)}
    ${p(`<strong>The tricky part: the foods that spike you are not always sweet.</strong>`)}
    ${p(`<strong>1. White bread and bagels.</strong> A bagel hits your bloodstream like about 5 teaspoons of sugar within half an hour.`)}
    ${p(`<strong>2. Boxed cereal.</strong> Even the "healthy" ones are often 30 to 50% sugar by weight.`)}
    ${p(`<strong>3. Crackers, pretzels, rice cakes.</strong> Refined starch acts like sugar in your bloodstream. Your body does not know the difference.`)}
    ${bigQuote('Two moves that cost nothing and take no willpower.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. Walk 10 minutes within 30 minutes of eating.</strong> Your muscles pull sugar out of your blood without needing insulin to do it. To the mailbox and back counts.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. Change the order on your plate.</strong> Vegetables first. Then beans, lentils, or other whole plant foods. The starchy carb goes last. Same plate, same food, and the spike is 30 to 40% smaller just from the order.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">This week's ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">Pick one meal today. Walk 10 minutes after it. That is the whole assignment.</p>
    `)}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`If you cut your salt and the number never moved, this corner is the first place I would look.`)}
    ${upsellFooter({
      kicker: 'Easier with a room than alone',
      body: 'The Weekly Reset is my live group session every Wednesday at 7 PM ET. Bring your numbers, your med list, your questions. Community and the full ebook library included. $27 a month, and your first 7 days are free, so your first session costs nothing.',
      ctaLabel: 'Start your free week',
      ctaUrl: SKOOL_URL,
    })}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This week: the Sugar corner of the Triangle.

EVERY BLOOD SUGAR SPIKE RAISES INSULIN. AND INSULIN SQUEEZES YOUR VESSELS.

For two to three hours after a spike, insulin narrows your vessels and tells your kidneys to hold sodium. Both push your number up. Most heart doctors never check this corner.

THE FOODS THAT SPIKE YOU ARE NOT ALWAYS SWEET:
1. White bread and bagels: like 5 teaspoons of sugar within half an hour.
2. Boxed cereal: often 30-50% sugar by weight.
3. Crackers, pretzels, rice cakes: refined starch acts like sugar.

TWO FREE MOVES:
1. Walk 10 minutes within 30 minutes of eating. To the mailbox and back counts.
2. Plate order: vegetables first, then beans and whole plant foods, starchy carb last. The spike is 30-40% smaller just from the order.

THIS WEEK'S ASK: Pick one meal today. Walk 10 minutes after it.

Joel
RN, BraveWorks

P.S. If you cut your salt and the number never moved, this corner is the first place I would look.

-----
Easier with a room than alone:
The Weekly Reset, my live group session every Wednesday at 7 PM ET. $27 a month, first 7 days free, so your first session costs nothing.
-> ${SKOOL_URL}

-----
-> Skool: ${SKOOL_URL}
-> YouTube: ${YOUTUBE_URL}
`,
};

const issue4 = {
  subject: 'The corner that ignores your diet',
  subjectB: 'Stress can hold your number up all by itself',
  preview: 'You can eat clean and still run high. Here is why.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`This week: the Stress corner of the Triangle. The one that does not care how clean you eat.`)}
    ${bigQuote('When your body\'s alarm stays on, your vessels stay squeezed.')}
    ${p(`Stress hormones like cortisol were built for short emergencies. When they run all day, every day, they keep your vessels tight and tell your kidneys to hold sodium. You can do everything right in the kitchen and this corner will still hold your number up.`)}
    ${p(`Signs this corner is loud for you: your morning readings run highest, you feel wired but tired, your sleep is shallow, and hard days show up on the cuff the next morning.`)}
    ${p(`<strong>Four moves that calm this corner. All free.</strong>`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Paced breathing, 60 seconds.</strong> Breathe in slow for about 4 counts, out slower for about 6. One minute, once a day. Slow, even breathing out tells the alarm to stand down.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Morning light.</strong> Ten minutes outside early in the day helps set your stress hormones on the right daily curve.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">3. Lights out before 11.</strong> The hours before midnight are when your body clears the day's stress load best.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. End the day in gratitude.</strong> A few quiet minutes of thanks or prayer before bed. It sounds small. It is not.</p>
    `)}
    ${bigQuote('And one direct option, for the people who are past the education stage.')}
    ${p(`Some of you are on several medications, your number still will not settle, and one more weekly email is not what you need. You need a nurse to sit with your whole picture.`)}
    ${p(`<strong>Joel's Eyes On Your Case</strong> is my $297 case review. You send me your readings, your med list, and your story. I go through all of it and send you back a written plan for your loudest corner, in plain language, built to work alongside your doctor, never instead of your doctor.`)}
    ${p(`Honest note: I take 5 of these each month, so every case gets real time. If the month is full, the page will say so, and you can come back the next month.`, { margin: '0 0 28px' })}
    ${ctaButton(CASE_REVIEW_URL, 'Get my eyes on your case →')}
    ${mondayCallReminder()}
    ${joelSignoff()}
    ${psBox(`Not there yet? Start with the free 90-second quiz and find your loudest corner: <a href="${QUIZ_URL}" style="color:${PALETTE.accentClay};font-weight:600;">take the quiz →</a>`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

This week: the Stress corner of the Triangle. The one that does not care how clean you eat.

WHEN YOUR BODY'S ALARM STAYS ON, YOUR VESSELS STAY SQUEEZED.

Stress hormones like cortisol were built for short emergencies. Running all day, they keep vessels tight and hold sodium. You can eat perfectly and this corner will still hold your number up.

Signs it is loud for you: highest readings in the morning, wired but tired, shallow sleep, hard days showing up on the cuff the next morning.

FOUR FREE MOVES:
1. Paced breathing, 60 seconds. In slow for about 4 counts, out slower for about 6. Once a day.
2. Morning light. Ten minutes outside early in the day.
3. Lights out before 11.
4. A few quiet minutes of thanks or prayer before bed.

ONE DIRECT OPTION, for people past the education stage:

JOEL'S EYES ON YOUR CASE is my $297 case review. You send your readings, your med list, and your story. I go through all of it and send back a written plan for your loudest corner, built to work alongside your doctor, never instead of your doctor.

Honest note: I take 5 of these each month, so every case gets real time. If the month is full, the page will say so.

-> ${CASE_REVIEW_URL}

Joel
RN, BraveWorks

P.S. Not there yet? Start with the free 90-second quiz: ${QUIZ_URL}

-----
-> Skool: ${SKOOL_URL}
-> YouTube: ${YOUTUBE_URL}
`,
};

// ─── Export map ───────────────────────────────────────────────────────
// GATED to the refreshed issues only (2026-07-03). The old issues 5-12
// pitched retired offers (legacy $27 Starter Kit Stripe link, paused $297
// Diagnostic Session, Cohort 2) and contained NEWSTART violations, so they
// were removed rather than patched — recover from git history only via a
// full rewrite. newsletter-cron.js derives its cycle length from
// Object.keys(NEWSLETTER_ISSUES).length, so adding issue 5 here is the
// only step needed to extend the arc.
export const NEWSLETTER_ISSUES = {
  1: issue1,
  2: issue2,
  3: issue3,
  4: issue4,
};
