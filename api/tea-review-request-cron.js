// /api/tea-review-request-cron — once a day, ask the people whose tea has run
// out how it went, and give them 10% off the next pouch.
//
// 2026-10-27 (Joel): "we need a similar one for tea review and a 10% coupon off
// if they want to buy again... this goes to those who have had the tea over
// their alloted time of purchase. so if they bought a 1 month supply greater
// than a month ago, and if they bought 3 month supply greater than 3 months
// ago. this needs to be a chron or a scan that fires for people that pass the
// time they have the tea amount."
//
// Supply length comes from api/_tea-supply.js, which classifies the ledger's
// hand-written item names. An unclassifiable order is skipped, never guessed.
//
// WHAT THE DRY RUN OVER ALL 175 REAL ORDERS FORCED INTO THIS FILE
//
//   115 people were already past their supply date on the day this was written,
//   some of them since July. A cron that fires on "is past due" would have sent
//   a three-month-late "how is the tea going?" to a 1-week sampler buyer. So
//   there is a LOOKBACK WINDOW: a person is only asked in the weeks just after
//   their tea runs out. Older than that is a cold list, and a cold list is
//   Joel's decision, not a cron's.
//
//   One ledger row carries the customer name "[REFUNDED - do not ship...]".
//   Another belongs to Sherian Tucker, who paid $120, never received the tea,
//   and filed a dispute. Nothing in the order record marks either case, so
//   "fulfilled: true" cannot be trusted as proof a human received anything.
//   Hence BAD_ORDER and the tea:review:block set.
//
//   Two Shopify orders were bulk-stamped fulfilled at the identical timestamp
//   2026-10-14T15:56:59.311Z and did not actually ship until 2026-10-27. The
//   clock therefore reads `shippedAt` first when it is present, so a corrected
//   ship date moves the ask with it.
//
// Auth: CRON_SECRET. ?mode=dry (the default) reports and sends nothing;
// ?mode=send with header x-confirm: SEND-TEA-REVIEW actually sends.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { orderSupplyDays } from './_tea-supply.js';
import { neverSendSet, resendUnsubscribed } from './_never_send.js';

const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const REVIEW_URL = 'https://bpquiz.com/tea-review';
const SHOP_URL = 'https://hormoneteas.com/products/steady';
const BLOCK_SET = 'tea:review:block';

// Ask only while it is still a live question. 45 days past the last sip is
// already generous; beyond that the tea is a memory, not an experience.
const LOOKBACK_DAYS = Number(process.env.TEA_REVIEW_LOOKBACK_DAYS || 45);
// A hard ceiling so a misconfigured window can never become a blast.
const MAX_PER_RUN = Number(process.env.TEA_REVIEW_MAX_PER_RUN || 25);

const BAD_ORDER = /refund|do not ship|cancel|chargeback|dispute|test order/i;

// Falls back to no name rather than a wrong one. The ledger's name field holds
// a street address on one row ("127 Sugarberry Drive") and an ops note in
// brackets on another, so anything that is not plain letters is discarded and
// the greeting becomes "Hi there,". "Hi 127," is worse than no name at all.
function firstNameOf(name) {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  const f = n.split(' ')[0] || '';
  if (!/^[A-Za-z][A-Za-z'-]{1,}$/.test(f)) return '';
  return f === f.toUpperCase() ? f.charAt(0) + f.slice(1).toLowerCase() : f;
}

function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function build({ first, code }) {
  const hi = first ? `Hi ${first},` : 'Hi there,';
  const text = [hi, '',
    'By my count you are about through your pouch of Steady, so I wanted to ask you '
    + 'one question while it is still fresh.', '',
    'How did it go?', '',
    'Not a star rating. The real thing. Did you notice anything, and if so what and '
    + 'when? Did you keep up with it daily or did it sit in the cupboard some weeks? '
    + 'Did you like the taste? If it did nothing for you, I would genuinely rather know '
    + 'that than not know it.', '',
    'I read every one of these myself, and they are the main reason the blend has '
    + 'changed since we started.', '',
    REVIEW_URL, '',
    'And a thank you either way. Here is 10 percent off your next pouch, whenever you '
    + 'want it. No deadline on it.', '',
    `YOUR CODE: ${code}`, '',
    SHOP_URL, '',
    'The code works whether you leave a review or not, and it works if your review is '
    + 'a hard one. I am not buying a nice word. I am thanking you for your time.', '',
    'Thank you for trying it in the first place.', '',
    'Annie',
  ].join('\n');

  const paras = text.split('\n\n').filter((p) => p.trim());
  const body = paras.map((p) => {
    let h = esc(p).replace(/\n/g, '<br>');
    for (const u of [REVIEW_URL, SHOP_URL]) {
      h = h.split(esc(u)).join(`<a href="${u}" style="color:#1f5c3d;font-weight:700">${esc(u)}</a>`);
    }
    return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:#1b2430">${h}</p>`;
  }).join('');
  const html = '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
    + '<div style="max-width:580px;margin:0 auto;padding:30px 22px;'
    + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + body + '</div></body></html>';

  return { subject: 'How did the tea go?', text, html };
}

async function scanKeys(pattern) {
  let cursor = '0';
  const out = [];
  do {
    const [next, batch] = await kv.scan(cursor, { match: pattern, count: 500 });
    cursor = String(next);
    out.push(...(batch || []));
  } while (cursor !== '0');
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  // Two ways to arm it, and both are deliberate acts:
  //   the scheduler, once the vercel.json line carries ?mode=send&cron=1
  //   a human, with ?mode=send and the x-confirm header
  // Registered WITHOUT mode=send on purpose, so the first days of this cron
  // report what it would do and send nothing at all.
  const send = req.query?.mode === 'send'
    && (req.query?.cron === '1' || req.headers['x-confirm'] === 'SEND-TEA-REVIEW');

  // The discount code is a money decision and lives in Shopify, not here. With
  // it unset the cron reports and sends nothing, so deploying this cannot
  // start giving tea away before Joel has made the code.
  const code = (process.env.TEA_REVIEW_DISCOUNT_CODE || '').trim();

  try {
    const now = Date.now();
    const windowMs = LOOKBACK_DAYS * 86400000;

    const [orderKeys, reviewKeys, blocked, never, unsubbed] = await Promise.all([
      scanKeys('tea:order:*'),
      scanKeys('tea:review:*'),
      kv.smembers(BLOCK_SET).catch(() => []),
      neverSendSet().catch(() => new Set()),
      resendUnsubscribed().catch(() => new Set()),
    ]);

    const reviewed = new Set(reviewKeys
      .map((k) => k.slice('tea:review:'.length).toLowerCase())
      .filter((e) => e.includes('@')));
    const blockSet = new Set((blocked || []).map((e) => String(e).toLowerCase().trim()));

    const skip = { unfulfilled: 0, unclassified: 0, stillHasTea: 0, tooLate: 0,
      reviewed: 0, blocked: 0, badOrder: 0, alreadyAsked: 0, unsubscribed: 0 };
    const candidates = new Map();

    for (const key of orderKeys) {
      const order = await kv.get(key);
      if (!order || typeof order !== 'object') continue;

      const email = String(order.email || '').toLowerCase().trim();
      if (!email.includes('@')) continue;

      if (BAD_ORDER.test(JSON.stringify([order.name, order.opsNote, order.items]))) {
        skip.badOrder++; continue;
      }
      if (blockSet.has(email)) { skip.blocked++; continue; }
      if (!order.fulfilled) { skip.unfulfilled++; continue; }

      const days = orderSupplyDays(order);
      const startIso = order.shippedAt || order.fulfilledAt || order.shippedEmailAt || order.at;
      if (!days || !startIso) { skip.unclassified++; continue; }
      const outMs = new Date(startIso).getTime() + days * 86400000;
      if (!Number.isFinite(outMs)) { skip.unclassified++; continue; }

      if (outMs > now) { skip.stillHasTea++; continue; }
      if (now - outMs > windowMs) { skip.tooLate++; continue; }
      if (reviewed.has(email)) { skip.reviewed++; continue; }
      if (never.has(email) || unsubbed.has(email)) { skip.unsubscribed++; continue; }
      if (await kv.get(`tea:reviewask:${email}`)) { skip.alreadyAsked++; continue; }

      // One ask per person, anchored on whichever order ran out most recently,
      // so somebody who reordered is not asked about the pouch before last.
      const prev = candidates.get(email);
      if (!prev || outMs > prev.outMs) {
        candidates.set(email, { email, outMs, days, first: firstNameOf(order.name) });
      }
    }

    const queue = [...candidates.values()]
      .sort((a, b) => b.outMs - a.outMs)   // most recently run out first
      .slice(0, MAX_PER_RUN);

    const preview = queue.map((c) => ({
      email: c.email, first: c.first, supplyDays: c.days,
      ranOut: new Date(c.outMs).toISOString().slice(0, 10),
    }));

    if (!code) {
      return res.status(200).json({
        ok: true, sent: 0, skipped: skip, eligible: candidates.size,
        reason: 'TEA_REVIEW_DISCOUNT_CODE not set, nothing sent', preview,
      });
    }
    if (!send) {
      return res.status(200).json({
        ok: true, mode: 'dry', sent: 0, skipped: skip,
        eligible: candidates.size, wouldSend: queue.length, preview,
        sample: build({ first: queue[0]?.first || '', code }).text,
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    const failed = [];
    for (const c of queue) {
      const msg = build({ first: c.first, code });
      try {
        await resend.emails.send({
          from: FROM, to: c.email, reply_to: REPLY_TO,
          subject: msg.subject, text: msg.text, html: msg.html,
        });
        // No TTL: a person is asked once about a given pouch, forever. A
        // reorder writes a new, later runs-out date but this key still stands,
        // so raise it deliberately if you ever want a second ask.
        await kv.set(`tea:reviewask:${c.email}`, {
          askedAt: new Date().toISOString(), ranOut: new Date(c.outMs).toISOString(), code,
        });
        sent++;
      } catch (e) {
        failed.push({ email: c.email, error: e.message });
      }
    }

    return res.status(200).json({
      ok: true, mode: 'send', sent, failed, skipped: skip, eligible: candidates.size,
    });
  } catch (err) {
    console.error('tea-review-request-cron error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
