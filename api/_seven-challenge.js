// api/_seven-challenge.js: the $7 "7-7-7 Challenge" (bpquiz.com/777),
// Wed Oct 21 to Tue Oct 27, 2026. Self-guided 7-day plan plus a private
// encouragement group. No live classes. The 7 days are the Lemonade Detox
// (Master Cleanse) from public/downloads/lemonade-detox-guide.pdf.
//
// Called from api/stripe-webhook.js for sessions stamped
// metadata.funnel === 'seven-challenge' (api/create-hosted-checkout.js tier
// 'seven-challenge'). It runs right after the foreign-funnel guard and RETURNS,
// so a $7 buyer never reaches resolveTierSlug, AMOUNT_TO_TIER, the unmapped-
// amount alert, ManyChat tagging, or any kit email.
//
// SEND GATE (Joel, 2026-10-19): the buyer confirmation sends NOTHING until
// SEVEN_CONFIRM_LIVE === '1'. With the flag off every buyer is still recorded
// in KV (seven:buyers set + seven:buyer:<email> record) so nobody is lost and
// Joel can send the confirmation by hand later.
//
// Env: SEVEN_CONFIRM_LIVE ('1' to send), SEVEN_GROUP_URL (the Facebook or
// WhatsApp group invite link).
//
// Never-send roster: scripts/_never_send.mjs / api/_never_send.js exist but are
// not wired into any webhook yet. This is a transactional receipt for a buyer
// who just paid, so it is not a bulk send; not wired here either.
//
// ZERO em dashes in customer copy. NEWSTART: plants only, no caffeine.
import { kv } from '@vercel/kv';

export const SEVEN_FUNNEL = 'seven-challenge';

export function isSevenChallengeSession(session) {
  const md = (session && session.metadata) || {};
  return md.funnel === SEVEN_FUNNEL || md.brand === SEVEN_FUNNEL || md.offer === SEVEN_FUNNEL;
}

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const GUIDE_URL = 'https://bpquiz.com/downloads/lemonade-detox-guide.pdf';

// One source for both the text and HTML bodies. Each section: [heading, kind, items].
// kind: 'p' paragraphs, 'ol' numbered list, 'ul' bullet list.
export function renderSevenConfirmation({ firstName, groupUrl }) {
  const hi = firstName ? `Hi ${firstName},` : 'Hi friend,';
  const subject = "You're in: the 7-7-7 Challenge starts Wednesday";
  const preview = 'Your group link, the lemonade recipe, and your full plan are inside.';
  const groupText = groupUrl
    ? `Join the private encouragement group here: ${groupUrl}`
    : 'Your private encouragement group link is coming in a separate email before Wednesday.';

  const sections = [
    [null, 'p', ["You're in. Thank you for joining the 7-7-7 Challenge with Annie and me."]],
    ['The dates', 'ul', [
      'On-ramp: Monday, October 19 and Tuesday, October 20.',
      'Lemonade days: Wednesday, October 21 to Tuesday, October 27, 2026.',
      'Saturday, October 24 is still a lemonade day. It is the Sabbath, so we rest, and I will not post in the group that day.',
      'Off-ramp: Wednesday, October 28 to Friday, October 30.',
    ]],
    ['Your group', 'group', [groupText, 'This is where you post your wins, ask questions, and cheer each other on. You are not doing this alone.']],
    ['Your on-ramp: today and tomorrow', 'ul', [
      'Eat plants only: vegetables, fruit, beans, and whole grains.',
      'Cut salt and sugar.',
      'Drink plenty of water.',
      'Take a 10 to 15 minute walk.',
      'Joining after Tuesday? Do one day of plants and water, then start the lemonade.',
    ]],
    ['The lemonade recipe (one 8 to 10 oz glass)', 'ul', [
      '2 tablespoons fresh lemon juice',
      '2 tablespoons Grade A Dark maple syrup',
      'A pinch of cayenne (about 1/10 teaspoon)',
      '8 to 10 oz water',
    ]],
    ['How much to drink', 'p', [
      'Drink 6 to 12 glasses a day, whenever you feel hungry, plus plain water. Peppermint tea is optional. Tip: make a full pitcher each morning.',
    ]],
    ['Optional, for an extra cleanse', 'ul', [
      'Morning salt water flush: 2 teaspoons non-iodized sea salt in 1 quart warm water.',
      'Nightly herbal laxative tea.',
      'Skip the salt water flush if you have high blood pressure, take blood pressure or heart medicine, or have kidney or heart disease. One flush is about 4,600 mg of sodium in one drink.',
    ]],
    ['What to expect', 'ul', [
      'Day 2 is often the hardest. Headaches, hunger, and low energy are common.',
      'For many people, headaches and hunger ease by day 3 or 4.',
      'Rest, walk gently, and stand up slowly. Drink more lemonade and water when you feel low.',
    ]],
    ['Your off-ramp (do not skip it)', 'ul', [
      'Wednesday, October 28: fresh orange juice mixed half and half with water, plus lemonade.',
      'Thursday, October 29: add vegetable broth and fruit.',
      'Friday, October 30: light plant meals, like salads and steamed vegetables.',
      'Then return to the everyday eating plan: plants, less salt, less sugar, water, and walking.',
    ]],
    ['The full guide', 'link', [GUIDE_URL]],
    ['A few honest words', 'p', [
      'Seven pounds is the target, not a promise. Results vary. Early weight loss is often water weight. This challenge is education, not medical advice.',
      'If you take medication, especially for blood pressure or blood sugar, or you are pregnant, nursing, or have a health condition, talk with your doctor before starting. Keep taking your medicine. Stop and get help if you feel faint, confused, or your heart races.',
      "If you feel you didn't get your $7 worth, reply to this email and we'll refund it.",
    ]],
  ];

  const textParts = [hi, ''];
  for (const [head, kind, items] of sections) {
    if (head) textParts.push(head.toUpperCase());
    if (kind === 'ol') items.forEach((l, i) => textParts.push(`${i + 1}. ${l}`));
    else if (kind === 'ul') items.forEach((l) => textParts.push(`- ${l}`));
    else if (kind === 'link') textParts.push(`Download Joel's Lemonade Detox guide: ${items[0]}`);
    else items.forEach((l) => textParts.push(l));
    textParts.push('');
  }
  textParts.push('See you Wednesday,', 'Joel Polley, RN and Annie Chitate, RN', '');
  const text = textParts.join('\n');

  const p = (s) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#14231c;">${s}</p>`;
  const h = (s) => `<h2 style="margin:24px 0 10px;font-family:Georgia,serif;font-size:19px;color:#14503a;">${s}</h2>`;
  const btn = (href, label) => `<p style="margin:0 0 14px;"><a href="${esc(href)}" style="display:inline-block;background:#f4b400;color:#1b1b1b;font-weight:800;padding:13px 24px;border-radius:999px;text-decoration:none;">${label}</a></p>`;
  const list = (items) => `<ul style="margin:0 0 14px;padding-left:22px;font-size:16px;line-height:1.6;color:#14231c;">${items.map((l) => `<li style="margin-bottom:6px;">${esc(l)}</li>`).join('')}</ul>`;
  const htmlParts = [p(esc(hi))];
  for (const [head, kind, items] of sections) {
    if (head) htmlParts.push(h(esc(head)));
    if (kind === 'ul' || kind === 'ol') htmlParts.push(list(items));
    else if (kind === 'group') htmlParts.push(groupUrl ? btn(groupUrl, 'Join the encouragement group') : p(esc(items[0])), p(esc(items[1])));
    else if (kind === 'link') htmlParts.push(btn(items[0], "Download Joel's Lemonade Detox guide"));
    else items.forEach((l) => htmlParts.push(p(esc(l))));
  }
  htmlParts.push(p('See you Wednesday,<br>Joel Polley, RN and Annie Chitate, RN'));
  const html = `<!doctype html><html><body style="margin:0;background:#fbfaf5;font-family:Inter,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</span>
<div style="max-width:580px;margin:0 auto;padding:28px 20px;">
${htmlParts.join('\n')}
</div></body></html>`;

  return { subject, preview, text, html };
}

// Records the buyer, tags an EXISTING list record, and sends the confirmation
// only when SEVEN_CONFIRM_LIVE === '1'. Never creates a new drip:* record, so a
// $7 buyer is never enrolled into the BP drip by this purchase.
export async function processSevenChallenge(session, { getResend, from, replyTo, firstNameOf }) {
  const email = String(session.customer_details?.email || '').trim().toLowerCase();
  const name = session.customer_details?.name || '';
  if (!email) return { action: 'skipped', reason: 'seven:no_email' };

  const live = (process.env.SEVEN_CONFIRM_LIVE || '').trim() === '1';
  const groupUrl = (process.env.SEVEN_GROUP_URL || '').trim();
  const now = new Date().toISOString();

  // 1. Record the buyer. Failures are logged, never fatal.
  try {
    await kv.sadd('seven:buyers', email);
    await kv.set(`seven:buyer:${email}`, {
      email, name, phone: session.customer_details?.phone || '',
      sessionId: session.id, amountCents: session.amount_total, paidAt: now,
      confirmSent: false,
    });
  } catch (err) {
    console.error('seven-challenge: KV buyer record failed', email, err.message);
  }

  // 2. Tag an existing list record so Joel's list knows they bought.
  try {
    const dripKey = `drip:${email}`;
    const existing = await kv.get(dripKey);
    if (existing) {
      await kv.set(dripKey, {
        ...existing,
        sevenChallengeAt: now,
        tags: Array.from(new Set([...(existing.tags || []), 'tier-seven-challenge-buyer'])),
      });
    }
  } catch (err) {
    console.error('seven-challenge: drip tag failed', email, err.message);
  }

  // 3. Confirmation email, gated.
  if (!live) {
    console.log(`seven-challenge: SEVEN_CONFIRM_LIVE off, recorded ${email} (${session.id}), no email sent`);
    return { action: 'seven-challenge', sent: false, reason: 'confirm_not_live' };
  }
  const { subject, text, html } = renderSevenConfirmation({ firstName: firstNameOf(name), groupUrl });
  try {
    await getResend().emails.send({
      campaign: 'seven-challenge-confirm',
      from, to: email, replyTo, subject, text, html,
    });
    try { await kv.set(`seven:buyer:${email}`, { ...(await kv.get(`seven:buyer:${email}`) || {}), confirmSent: true, confirmSentAt: new Date().toISOString() }); } catch { /* best effort */ }
    console.log(`seven-challenge: confirmation sent to ${email}`);
    return { action: 'seven-challenge', sent: true };
  } catch (err) {
    console.error('seven-challenge: confirmation send failed', email, err.message);
    return { action: 'seven-challenge', sent: false, reason: 'send_failed' };
  }
}
