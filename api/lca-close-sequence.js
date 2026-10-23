// Closing-cart sequence for Life Change Activated, emails 2 to 5.
//
// Audience: the October challenge buyers who have NOT paid toward Life Change
// Activated, recomputed from Stripe on every run. Email 1 went by hand on
// 2026-10-23 at 5:17 PM to 29 people; anyone who buys between sends drops out
// of the next one automatically, which is the whole reason this reads Stripe
// live instead of carrying a saved list.
//
// The place count is also live. Email 1 said "three are taken, which leaves
// nine" because that was true at 5 PM Friday. Hard-coding that into Sunday's
// emails would turn a true statement into a false one, so PLACES minus the
// real buyer count is rendered at send time.
//
// Prices are $2,000 tuition / $200 deposit / $1,800 balance, matching
// create-deposit-payment-intent.js, the live page, and the three deposits
// already taken. The draft said $1,997 / $500, which is the old /allin Sprint
// pricing; Joel confirmed $2,000 / $200 on 2026-10-23.
//
// Testimonials, per testimonials/CONSENT-LOG.md:
//   Margie  public TikTok comment, first name only, REQUIRED tag "Results not
//           typical." Her ledger entry mandates it, so it is in the copy.
//   Simone  no consent record on file. Published at Joel's explicit direction
//           2026-10-23 on a private-DM basis, first name only, same footing as
//           Gary and Orlando. Logged in the ledger in the same change.
//
// Safety, same patterns as the other senders here:
//   - dry run is the DEFAULT; ?mode=send or a cron is required
//   - cron auth required on every call
//   - a Central-time date guard allows only 2026-10-25
//   - a per-email NX claim makes a double fire a no-op
//   - the never-send guard still applies and fails closed
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { excludeNeverSend } from './_never_send.js';

const FROM = 'Annie & Joel, BraveWorks RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const COHORT = '2026-10-19';
const LINK = 'https://bpquiz.com/life-change-activated';
const FIRE_DATE = '2026-10-25';
const PLACES = 12;
const SENT_FLAG = (n) => `lcaclose:sent:${n}`;
const CLAIM = (n) => `lcaclose:claim:${n}`;
// A typo of a buyer's address that resolves to a stranger's live mailbox.
const DROP = new Set(['sandylhazzard@verixon.net']);

const EMAILS = {
  2: {
    subject: 'What Margie said at 62',
    body: (name, left) => `Good morning, beautiful!

I want to share something with you.

A woman named Margie left this on one of our videos:

"I am feeling so much better, 62 years old and was feeling pretty bad."

Results not typical.

I love hearing that.

Because sometimes, after years of not feeling like yourself, you start wondering if feeling better is even possible anymore.

And then you hear another woman's story.

And hope starts coming back.

Now, everybody's journey is different.

But here's what I want you to imagine.

It's Christmas.

And you're already several weeks into taking better care of yourself.

You're learning. You're building new habits. You're discovering what works for your life.

And you're not doing it alone.

What a beautiful gift to give yourself.

If you'd love to see what your next eight weeks with us could look like, your invitation is still open.

COME SEE WHAT'S POSSIBLE:
${LINK}

With love,

Annie & Joel

P.S. Tonight is the final night to join our eight-week Life Change Activated. ${left} of our 12 places are still open.`,
  },

  3: {
    subject: 'What if it was never about more willpower?',
    body: (name, left) => `Hey girl,

Something a woman shared during one of our earlier Challenges has stayed with me.

She struggled with consistency.

Especially when results came slowly.

And I thought about how many women must feel exactly the same way.

They start.

They get excited.

Life happens.

And before long, they're back to trying to figure everything out alone.

But what if the missing piece was never more willpower?

What if it was having the right plan, in the right order, with someone helping you follow through?

That's the good news about these next eight weeks.

You get guidance, accountability, real conversations, and women walking alongside you.

You get to practice a different way of living.

Not perfectly. But consistently.

And maybe that's exactly what your next chapter needs.

I'd love for you to be part of it.

SEE YOUR NEXT EIGHT WEEKS:
${LINK}

Annie & Joel

P.S. We close enrollment tonight at 11:59 PM Central. If you're wondering whether it's right for you, reply CALL ME and we will talk it through.`,
  },

  4: {
    subject: 'I can almost see our first call',
    body: (name, left) => `Girl,

I can almost see it.

Our first coaching call.

Women from this week's Challenge showing up together again.

Except this time, we're not just talking about what needs to change.

We're helping you DO it.

Your food. Your movement. Your sleep. Your health goals.

And yes, we're making room for your glow, too!

One of our previous participants, Simone, said something I loved about Annie:

"She takes the time to help us understand ourselves."

That's the kind of experience we want you to have.

To understand your body better.

To know what to focus on.

And to have someone in your corner as you build new habits.

The good news is, some of your Challenge sisters are already coming.

And we'd love to see you there, too.

Enrollment closes tonight at 11:59 PM Central.

Your eight-week investment is $2,000, and $200 secures your place. The $1,800 balance is arranged after you choose one of three payment options.

YES, SAVE MY PLACE:
${LINK}

With so much love,

Annie & Joel`,
  },

  5: {
    subject: 'Before our doors close tonight',
    body: (name, left) => `Hey girl,

Before we close enrollment, I wanted to leave you with one last thought.

Remember what we talked about on Day 5?

Your life is a reflection of your decisions.

And the beautiful thing is, you still have decisions ahead of you.

Just imagine meeting yourself eight weeks from now.

What would you love to be able to tell her?

That you started taking better care of yourself?

That you kept going even when life got busy?

That you finally gave yourself the support you'd been giving everybody else?

Girl, I love that picture.

And if you'd like Joel and me walking with you, we would love to have you.

Our doors close at 11:59 PM Central tonight.

COME WITH US:
${LINK}

We love you.

And we're already cheering for the woman you're becoming.

Annie & Joel`,
  },
};

function tidy(raw) {
  const s = String(raw || '').trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  if (!s) return 'Friend';
  const first = s.split(/\s+/)[0];
  if (!/^[\p{L}][\p{L}'\-]*$/u.test(first) || first.length < 2) return 'Friend';
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return first;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function html(text) {
  const paras = text.split('\n\n').filter((p) => p.trim()).map((p) => {
    const t = esc(p).replace(/\n/g, '<br>')
      .replace(esc(LINK), `<a href="${LINK}" style="color:#112d4d;font-weight:700">${esc(LINK)}</a>`);
    return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:#1b2430">${t}</p>`;
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
    + '<div style="max-width:560px;margin:0 auto;padding:30px 22px;'
    + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + paras
    + '<p style="margin:26px 0 0;font-size:12px;line-height:1.5;color:#8a8f98">'
    + 'BraveWorks RN &middot; Joel Polley, RN &amp; Annie Chitate, RN &middot; Educational content only. '
    + 'Not medical advice. Always complement, never replace, care from your physician.'
    + '</p></div></body></html>';
}

// Everyone who has paid anything toward the program. Deposits carry program
// metadata; balance payments go through Payment Links and do not, so those are
// matched on the known amounts and the customer's email.
async function lcaPayers() {
  const key = process.env.STRIPE_SECRET_KEY;
  const out = new Set();
  if (!key) throw new Error('no Stripe key; refusing to send without the buyer list');
  const since = Math.floor(new Date('2026-10-20T00:00:00Z').getTime() / 1000);
  const AMOUNTS = new Set([20000, 200000, 180000, 95000, 49500]);
  let startingAfter = null;
  for (let page = 0; page < 10; page += 1) {
    const q = new URLSearchParams({ limit: '100', 'created[gte]': String(since) });
    q.append('expand[]', 'data.customer');
    if (startingAfter) q.set('starting_after', startingAfter);
    const r = await fetch(`https://api.stripe.com/v1/payment_intents?${q}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`Stripe ${r.status}`);
    const d = await r.json();
    for (const pi of d.data || []) {
      if (pi.status !== 'succeeded') continue;
      const md = pi.metadata || {};
      const isLca = md.program === 'life-change-activated' || AMOUNTS.has(pi.amount);
      if (!isLca) continue;
      const em = (md.email || pi.customer?.email || pi.receipt_email || '').trim().toLowerCase();
      if (em) out.add(em);
    }
    if (!d.has_more) break;
    startingAfter = (d.data[d.data.length - 1] || {}).id;
  }
  // Both spellings of one buyer's address count as bought.
  if (out.has('sandylhazzard@verizon.net')) out.add('sandylhazzard@verixon.net');
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![2, 3, 4, 5].includes(emailNum)) {
    return res.status(400).json({ error: 'pass ?email=2..5' });
  }
  const template = EMAILS[emailNum];

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const cronMode = req.query?.cron === '1';
  if (cronMode && today !== FIRE_DATE) {
    return res.status(200).json({ ok: true, skipped: 'date guard', today, fireDate: FIRE_DATE, emailNum });
  }
  const sendMode = cronMode || req.query?.mode === 'send';

  let payers;
  try { payers = await lcaPayers(); }
  catch (err) { return res.status(500).json({ error: 'buyer list unavailable; refusing to send', detail: err.message }); }

  const roster = new Map();
  for (const seat of ['vip', 'ga']) {
    let members = [];
    try { members = (await kv.smembers(`challenge:${COHORT}:${seat}`)) || []; } catch { members = []; }
    for (const m of members) {
      const email = String(m).trim().toLowerCase();
      if (!email || payers.has(email) || DROP.has(email) || roster.has(email)) continue;
      let rec = null;
      try { rec = await kv.get(`challenge:${COHORT}:${seat}:${email}`); } catch { /* non-fatal */ }
      if (typeof rec === 'string') { try { rec = JSON.parse(rec); } catch { rec = null; } }
      roster.set(email, tidy(rec && rec.firstName));
    }
  }
  if (roster.size === 0) {
    return res.status(200).json({ ok: true, skipped: 'nobody left to mail', buyers: payers.size });
  }

  let eligible, guardReport;
  try {
    const out = await excludeNeverSend([...roster.keys()]);
    eligible = out.kept;
    guardReport = { excluded: out.excluded ?? null };
  } catch (err) {
    return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message });
  }

  // The honest remaining count, rendered now rather than frozen in the copy.
  const left = Math.max(PLACES - payers.size, 0);
  const sample = eligible.slice(0, 2).map((e) => ({
    email: e, firstName: roster.get(e), text: template.body(roster.get(e), left),
  }));

  if (!sendMode) {
    return res.status(200).json({
      ok: true, mode: 'DRY-RUN', emailNum, today, subject: template.subject,
      buyers: payers.size, placesLeft: left, wouldSend: eligible.length, guardReport, sample,
    });
  }

  const claimed = await kv.set(CLAIM(emailNum), new Date().toISOString(), { nx: true, ex: 60 * 60 * 24 * 7 });
  if (!claimed) {
    return res.status(200).json({ ok: true, skipped: 'already sent', emailNum });
  }

  const resend = new Resend(process.env.RESEND_API_KEY, { campaign: `lca-close-${emailNum}` });
  const results = { sent: 0, failed: 0, errors: [] };
  const batch = eligible.map((email) => {
    const text = template.body(roster.get(email), left);
    return { from: FROM, to: email, replyTo: REPLY_TO, subject: template.subject, text, html: html(text) };
  });
  for (let i = 0; i < batch.length; i += 100) {
    const slice = batch.slice(i, i + 100);
    try {
      await resend.batch.send(slice);
      results.sent += slice.length;
      for (const m of slice) await kv.sadd(SENT_FLAG(emailNum), m.to);
    } catch (err) {
      results.failed += slice.length;
      results.errors.push(err.message);
    }
  }
  if (results.sent === 0) await kv.del(CLAIM(emailNum));

  console.log(`lca-close ${emailNum}: sent ${results.sent} of ${batch.length}, ${payers.size} buyers, ${left} places left`);
  return res.status(200).json({
    ok: true, mode: 'CRON-SEND', emailNum, subject: template.subject,
    buyers: payers.size, placesLeft: left, eligible: eligible.length, guardReport, ...results,
  });
}
