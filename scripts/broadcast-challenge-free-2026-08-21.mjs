// CHANGE MY LIFE CHALLENGE — free cohort (Aug 24-30, 2026, 6 PM CT daily).
// 10-email launch arc to Joel's BraveWorks list, EXCLUDING coaching clients
// (the $1,997 All-In / Life Change Accelerator cohort). Cloned from
// broadcast-bring-sexy-back-2026-08-13.mjs: scans bwbp:drip:*, dedupes by
// lowercased EMAIL via a persistent per-email Redis SET (resume-safe), skips
// unsub/paused/flashOnly, retry-hardened KV, List-Unsubscribe headers.
//
// Coaching-client suppression, two sources so a straggler can't slip through:
//   - KV  bwbp:allin:*                 (post-purchase records)
//   - Stripe checkout sessions metadata offer:'all-in' (roster method of record)
//   - MANUAL_EXCLUDE for off-platform members (Stella, 2 x $900)
//
//   node scripts/broadcast-challenge-free-2026-08-21.mjs --which=1            (dry run)
//   node scripts/broadcast-challenge-free-2026-08-21.mjs --which=1 --send
//
// Schedule (all CT): 1 Fri 4:10p · 2 Sat 8:45p · 3 Sun 8:15a · 4 Sun 2p ·
// 5 Sun 7:30p · 6 Mon 7:15a · 7 Mon 12:30p · 8 Mon 4:30p · 9 Mon 6:05p · 10 Tue 8a
//
import dotenv from 'dotenv';
for (const p of ['.env', '.env.local', '.env.production']) dotenv.config({ path: p, override: false, quiet: true });
import Stripe from 'stripe';
import { Resend } from '../api/_resend.js';
import { signUnsubToken } from '../api/triangle-unsubscribe.js';
import { FROM, REPLY_TO, SITE_URL } from '../api/_triangle-email.js';
import { ZOOM_MAIN, assertLiveRoom } from './_zoom-rooms.mjs';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
const WHICH = arg('which');
const SEND = process.argv.includes('--send');
const LIMIT = Number(arg('limit') || 0);
const VALID_WHICH = ['1','2','3','4','5','6','7','8','9','10'];
if (!VALID_WHICH.includes(WHICH)) { console.error('Pass --which=1..10'); process.exit(1); }

const CHALLENGE_URL = `https://changemylifechallenge.com/?utm_source=email&utm_medium=broadcast&utm_campaign=challenge-free-2026-08-24&utm_content=e${WHICH}`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Copy (Joel's, verbatim). Markers: "# " = display line, ** ** = bold,
//    [LABEL](url) = CTA button, {{greet}} = "FirstName," or "Hey,".
const U = CHALLENGE_URL;
// The live challenge room (6 PM Central = 7 PM Eastern). Canon: import, never paste.
const ROOM = assertLiveRoom(ZOOM_MAIN);
const ROOM_LINE = 'Meeting ID: 828 5171 5003 · Passcode: 027302';

const E1 = `{{greet}}

I wasn't planning to do this.

But our baby just hit **six months**.

And Annie and I decided we wanted to celebrate by doing something a little crazy.

We're opening the next **7-Day Change My Life Challenge completely FREE.**

Normally, it's $97.

The next one will be paid.

**This one isn't.**

Starting Monday, we're going LIVE every evening at 6 PM Central.

And if you've been looking at your blood pressure, your energy, your weight, your sleep—or your body in general—thinking:

# "What in the world is happening to me?"

Come.

We're going to start connecting some dots.

[CLAIM YOUR FREE SEAT →](${U})

Seven days.

Give us seven days.

—Joel

**P.S.** This round is for women. Men—if you'd want a men's version, reply **MEN'S CHALLENGE**. Ladies, if your husband would want one, tell me that too.`;

const E2 = `{{greet}}

Here's something I want you to consider:

# What if your body isn't failing you?

What if it's been trying to tell you something…

…and nobody ever taught you how to read it?

Blood pressure.

Sleep.

Blood sugar.

Belly fat.

Energy.

Cravings.

Mood.

We tend to put every one of those in a different box.

But what if they're not all separate?

That's a BIG part of what Annie and I are opening up Monday.

Not another supplement.

Not another fad diet.

Not "just lose weight."

We're going to teach you how to **stop guessing and start seeing the pattern.**

And because we're celebrating our daughter's six-month birthday, we're opening this cohort FREE.

Normally $97.

[GRAB YOUR SEAT HERE →](${U})

Tomorrow I'll show you one of the biggest mistakes I see people make when they're trying to "fix" their blood pressure.

—Joel

**P.S.** Men, want us to build one for you? Reply **MEN'S CHALLENGE**. Women, tell me if your husband would join too.`;

const E3 = `{{greet}}

A woman told me recently:

# "I just wanted to see that blood pressure go away."

That's it.

She wasn't asking to become a health expert.

She didn't want another shelf full of herbs.

She didn't want another complicated plan.

She wanted to understand why this kept happening.

And I hear versions of that ALL the time.

"My pressure is good sometimes… then it's high again."

"They added another medication."

"It runs in my family."

"I've tried things. They work for a while."

Here's the problem:

You can spend years trying to change the **number** without ever understanding the **pattern behind the number.**

Monday, we're starting there.

[JOIN THE CHALLENGE FREE →](${U})

Tomorrow. 6 PM Central.

—Joel

**P.S.** This cohort is designed for women. Men, reply **MEN'S CHALLENGE** if you'd want us to do this with you next.`;

const E4 = `{{greet}}

Blood pressure.

Poor sleep.

Cravings.

Blood sugar.

Weight around the middle.

Feeling exhausted at 2 PM.

You can treat those like **six different problems.**

Most people do.

Or…

you can ask a much better question:

# What if a few patterns are showing up in six different ways?

That's where health gets interesting.

And that's exactly why Annie and I created the Change My Life Challenge.

Not to give you another list of "healthy things to do."

You already know vegetables are good for you.

😂

We want you to learn to **read YOUR body.**

We're live tomorrow.

**Normally $97. This cohort: FREE.**

[CLAIM YOUR SEAT →](${U})

Tonight, I'll send you the email for the woman thinking:

**"Joel, I've already tried everything."**

Because I know she's reading these.

—Joel

**P.S.** Men: want your own version? Reply **MEN'S CHALLENGE**. Ladies, you can reply for your husband too.`;

const E5 = `{{greet}}

"I've already tried everything."

Good.

Come skeptical.

Come tired.

Come busy.

Come with questions.

You do **not** need to show up Monday believing Annie and me.

And you definitely don't need to have your whole life together.

You just need to be willing to look at your health differently for seven days.

Because maybe the problem isn't that you haven't tried enough.

Maybe you've tried **too many disconnected things.**

A diet here.

A supplement there.

A video.

A detox.

A new Monday.

Then another Monday.

We're going to slow the guessing down and start connecting the dots.

**We begin tomorrow at 6 PM Central.**

[GET YOUR FREE SEAT →](${U})

This is the only cohort we're planning to open at no cost.

After this, it's back to $97.

See you tomorrow.

—Joel

**P.S.** Men, hit reply with **MEN'S CHALLENGE** if you're sitting there thinking, "What about us?" I'm serious. We're gauging interest.`;

const E6 = `{{greet}}

Today's the day.

Tonight at **6 PM Central**, Annie and I begin the Change My Life Challenge.

And here's all I want from you:

# Give yourself seven days.

Not to fix everything.

Not to become perfect.

Not to overhaul your entire life.

To finally start understanding what your body has been trying to tell you.

Seven live days.

Normally $97.

**This cohort: $0.**

[JOIN US FREE →](${U})

Your body changed.

Your life doesn't have to.

—Joel

**P.S.** This round is for women. Men—or women with husbands who want this—reply **MEN'S CHALLENGE** so we know.`;

const E7 = `{{greet}}

Quick one.

If you're thinking:

"I don't have time."

"I need to get myself together first."

"I probably won't do everything perfectly."

Stop.

😂

**Come anyway.**

This challenge wasn't built for the woman who already has everything figured out.

It's for the woman who is tired of guessing.

Tonight we're starting a conversation that could change the way you look at your health.

**6 PM Central.**

[SAVE YOUR FREE SEAT →](${U})

Do not spend another Monday saying:

"I'll start next Monday."

Let's go.

—Joel

**P.S.** Men, we're listening too. Reply **MEN'S CHALLENGE** if you'd want a version built around you.`;

const E8 = `{{greet}}

We're about **90 minutes away.**

So I'm not writing you a long email.

If your blood pressure, sleep, weight, energy, blood sugar—or simply not feeling like yourself—has had you asking:

# "What am I missing?"

Come tonight.

That's it.

**6 PM Central. LIVE.**

[CLAIM YOUR FREE SEAT →](${U})

Normally $97.

Tonight, you walk in free.

And so you're not hunting through your inbox at 6:01, here's tonight's room:

[WALK INTO THE LIVE ROOM AT 6 →](${ROOM})

${ROOM_LINE}

See you inside.

—Joel

**P.S.** Guys: reply **MEN'S CHALLENGE** if you want us to build your room next.`;

const E9 = `{{greet}}

We're LIVE.

Right now.

Don't sit there thinking:

"Well… I missed the beginning."

Nope.

Get in here. 😂

Tonight we're beginning to answer the question:

# What happened to my body?

And more importantly…

**What do I do next?**

[JOIN US LIVE RIGHT NOW →](${ROOM})

${ROOM_LINE}

Come on.

—Joel

**P.S.** This challenge is for women. Men, reply **MEN'S CHALLENGE** and tell me you want yours.`;

const E10 = `{{greet}}

Did you miss last night?

**Come anyway.**

Seriously.

Do not turn missing Day 1 into another reason to wait six months to do something for yourself.

Tonight is **Day 2**.

And now we're going deeper.

Because noticing symptoms is one thing.

# Connecting them is something completely different.

Tonight at 6 PM Central.

If you've ever wondered:

"Why is THIS happening too?"

…tonight is for you.

[JOIN THE CHALLENGE →](${U})

Here's tonight's room for 6 PM Central:

[WALK IN AT 6 →](${ROOM})

${ROOM_LINE}

You're not too late.

—Joel

**P.S.** Men—still seeing these emails and wishing this were for you? Reply **MEN'S CHALLENGE**. Ladies, tell me about your husband too.`;

const EMAILS = {
  1:  { subject: "I'm giving this one away", preview: 'Seven live days. Normally $97. Not this time.', body: E1, kicker: 'FREE 7-DAY LIVE CHALLENGE · STARTS MONDAY 6PM CT' },
  2:  { subject: 'Nobody taught you this', preview: "What if you've been reading the signals wrong?", body: E2, kicker: 'FREE · STARTS MONDAY · 6PM CT' },
  3:  { subject: '"I just want this blood pressure to go away."', preview: 'The sentence I hear over and over.', body: E3, kicker: 'FREE · STARTS TOMORROW · 6PM CT' },
  4:  { subject: 'Your BP might not be "just BP"', preview: 'This is where things get interesting.', body: E4, kicker: 'FREE · STARTS TOMORROW · 6PM CT' },
  5:  { subject: '"But Joel, I\'ve tried everything."', preview: "I'm not asking you to believe another promise.", body: E5, kicker: 'FREE · WE BEGIN TOMORROW · 6PM CT' },
  6:  { subject: 'We start TODAY', preview: 'Tonight at 6 PM Central.', body: E6, kicker: 'DAY 1 · TONIGHT · 6PM CT' },
  7:  { subject: 'You do NOT need to be "ready"', preview: 'Busy? Tired? Behind already? Read this.', body: E7, kicker: 'DAY 1 · TONIGHT · 6PM CT' },
  8:  { subject: '90 minutes.', preview: "You've still got time.", body: E8, kicker: 'DOORS OPEN AT 6PM CT' },
  9:  { subject: "WE'RE LIVE", preview: 'The Change My Life Challenge has started.', body: E9, kicker: 'THE ROOM IS OPEN · RIGHT NOW' },
  10: { subject: "You didn't miss it.", preview: 'Even if you missed us last night, come.', body: E10, kicker: 'DAY 2 · TONIGHT · 6PM CT' },
};
const CFG = EMAILS[WHICH];
const CAMPAIGN = `broadcast:challenge-free-2026-08-24:e${WHICH}`;

// ── Render ────────────────────────────────────────────────────────────────
const greetFor = (firstName) => (firstName ? `${firstName},` : 'Hey,');
const toText = (b, greet) => b
  .replace('{{greet}}', greet)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2')
  .replace(/^# /gm, '')
  .replace(/\*\*/g, '');

const CTA = /^\[([^\]]+)\]\(([^)]+)\)$/;
function toHtml(body, unsubUrl, kicker, preview, greet) {
  const blocks = body.replace('{{greet}}', greet).split('\n\n').map((p) => {
    const t = p.trim();
    const m = t.match(CTA);
    if (m) {
      return `<p style="margin:0 0 22px;text-align:center;"><a href="${esc(m[2])}" style="display:inline-block;padding:16px 32px;background:#B85A36;color:#FFFDF7;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(m[1])}</a></p>`;
    }
    if (t.startsWith('# ')) {
      return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:25px;line-height:1.25;font-weight:800;color:#2C2A26;">${esc(t.slice(2))}</p>`;
    }
    const h = esc(t).replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    return `<p style="margin:0 0 15px;font-size:16px;line-height:1.7;color:#2C2A26;">${h}</p>`;
  }).join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:28px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
      <tr><td style="padding:32px 30px 26px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:18px;font-family:-apple-system,sans-serif;">${esc(kicker)}</div>
        ${blocks}
      </td></tr>
    </table>
    <p style="font-size:11px;color:#9C9485;margin:16px 0 0;font-family:-apple-system,sans-serif;">BraveWorks RN · braveworksrn@gmail.com · <a href="${SITE_URL}" style="color:#9C9485;">bpquiz.com</a></p>
    <p style="font-size:10px;color:#B5AC9C;margin:7px 0 0;font-family:-apple-system,sans-serif;"><a href="${unsubUrl}" style="color:#B5AC9C;">Unsubscribe</a></p>
  </td></tr></table></body></html>`;
}

// Render-only escape hatch: no KV, no Stripe, just write the HTML preview.
if (process.argv.includes('--previewonly')) {
  const fsp = await import('node:fs');
  const out = arg('html') || `cmlc-e${WHICH}.html`;
  fsp.writeFileSync(out, toHtml(CFG.body, `${SITE_URL}/api/triangle-unsubscribe?token=PREVIEW`, CFG.kicker, CFG.preview, greetFor(arg('name') || '')));
  console.log(`HTML preview written: ${out}`);
  process.exit(0);
}

// ── KV ────────────────────────────────────────────────────────────────────
const KV_URL = process.env.KV_REST_API_URL, KV_TOKEN = process.env.KV_REST_API_TOKEN;
const kvFetch = async (path, attempt = 0) => {
  try {
    const r = await fetch(`${KV_URL}/${path}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
    if (!r.ok && r.status >= 500 && attempt < 4) throw new Error(`KV ${r.status}`);
    return (await r.json()).result;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    return kvFetch(path, attempt + 1);
  }
};
const scanAll = async (match) => {
  let cursor = '0', keys = [], guard = 0;
  do {
    const r = await kvFetch(`scan/${cursor}/match/${encodeURIComponent(match)}/count/1000`);
    cursor = r[0]; keys.push(...r[1]);
  } while (cursor !== '0' && ++guard < 40);
  return keys;
};
const sadd = (v) => kvFetch(`sadd/${encodeURIComponent(CAMPAIGN)}/${encodeURIComponent(v)}`);

// ── Coaching clients ($1,997 All-In cohort): suppression, two sources ─────
// Manual adds: members neither source catches. Stella paid 2 x $900 outside
// the /allin checkout, so no offer:'all-in' session and no bwbp:allin:* key.
const MANUAL_EXCLUDE = ['stellapreowei38@gmail.com'];
const excluded = new Set(MANUAL_EXCLUDE);
for (const k of await scanAll('bwbp:allin:*')) {
  const e = k.split('bwbp:allin:')[1];
  if (e) excluded.add(e.trim().toLowerCase());
}
// Stripe sweep catches anyone who bought all-in but has no KV record yet.
// Pages ~7 weeks of sessions, so only pay for it on a real send.
if (SEND) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const SINCE = Math.floor(new Date('2026-07-01T00:00:00Z').getTime() / 1000);
  for await (const s of stripe.checkout.sessions.list({ created: { gte: SINCE }, limit: 100 })) {
    if ((s.metadata || {}).offer !== 'all-in') continue;
    if (s.payment_status !== 'paid' && s.status !== 'complete') continue;
    const e = (s.customer_details?.email || '').trim().toLowerCase();
    if (e) excluded.add(e);
  }
}
console.log(`COACHING-CLIENT SUPPRESSION: ${excluded.size} emails (manual ${MANUAL_EXCLUDE.length} + KV${SEND ? ' + Stripe' : ''})`);
for (const e of [...excluded].sort()) console.log(`  - ${e}`);

// ── Audience ──────────────────────────────────────────────────────────────
const keys = await scanAll('bwbp:drip:*');
const seenEmail = new Set();
const audience = [];
const stats = { records: 0, unsub: 0, paused: 0, flashOnly: 0, noEmail: 0, dupInList: 0, coaching: 0 };

const WAVE = 40;
const raws = [];
for (let i = 0; i < keys.length; i += WAVE) {
  const chunk = keys.slice(i, i + WAVE);
  raws.push(...await Promise.all(chunk.map((k) => kvFetch(`get/${encodeURIComponent(k)}`))));
  if (raws.length % 2000 < WAVE) console.log(`  ...read ${raws.length}/${keys.length}`);
}

for (const raw of raws) {
  if (!raw) continue;
  let o; try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { continue; }
  stats.records++;
  if (!o.email) { stats.noEmail++; continue; }
  if (o.unsubscribed) { stats.unsub++; continue; }
  if (o.paused) { stats.paused++; continue; }
  if (o.flashOnly) { stats.flashOnly++; continue; }
  const e = String(o.email).trim().toLowerCase();
  if (excluded.has(e)) { stats.coaching++; continue; }
  if (seenEmail.has(e)) { stats.dupInList++; continue; }
  seenEmail.add(e);
  audience.push({ email: o.email, firstName: (o.firstName || '').trim() });
}

console.log(`\nCAMPAIGN: ${CAMPAIGN}`);
console.log(`From:     ${FROM}`);
console.log(`Subject:  ${CFG.subject}`);
console.log(`Preview:  ${CFG.preview}`);
console.log(`records ${stats.records} | unsub ${stats.unsub} | paused ${stats.paused} | flashOnly ${stats.flashOnly} | noEmail ${stats.noEmail} | dupAddr ${stats.dupInList} | COACHING excluded ${stats.coaching}`);
console.log(`UNIQUE RECIPIENTS ${audience.length}`);

if (!SEND) {
  const htmlOut = arg('html');
  if (htmlOut) {
    const fsp = await import('node:fs');
    fsp.writeFileSync(htmlOut, toHtml(CFG.body, `${SITE_URL}/api/triangle-unsubscribe?token=PREVIEW`, CFG.kicker, CFG.preview, greetFor(arg('name') || '')));
    console.log(`HTML preview written: ${htmlOut}`);
  }
  const withName = audience.find((a) => a.firstName);
  const noName = audience.find((a) => !a.firstName);
  for (const sample of [withName, noName].filter(Boolean)) {
    console.log(`\n--- TEXT RENDER for ${sample.email} (firstName="${sample.firstName}") ---\n${toText(CFG.body, greetFor(sample.firstName))}\n--- END ---`);
  }
  console.log('DRY RUN. Re-run with --send to broadcast.');
  process.exit(0);
}

if (!audience.length) { console.error('0 eligible recipients — aborting.'); process.exit(1); }

const resend = new Resend(process.env.RESEND_API_KEY);
let sent = 0, skipped = 0, failed = 0;
const failures = [];
let targets = LIMIT ? audience.slice(0, LIMIT) : audience;

// --to=a@b,c@d overrides the audience entirely (pre-flight test batch).
const TO = arg('to');
if (TO) {
  targets = TO.split(',').map((e) => ({ email: e.trim(), firstName: '' })).filter((t) => t.email);
  console.log(`\n*** TEST MODE: ${targets.length} address(es), audience ignored, no dedupe writes ***`);
}

const msgFor = (a) => {
  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email: a.email })}`;
  const greet = greetFor(a.firstName);
  return {
    campaign: `challenge-free-2026-08-24-e${WHICH}`,
    from: FROM, to: a.email, replyTo: REPLY_TO,
    subject: CFG.subject,
    html: toHtml(CFG.body, unsubUrl, CFG.kicker, CFG.preview, greet),
    text: toText(CFG.body, greet),
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
};

// Resend caps a batch at 100 messages and the account at 2 req/s.
const BATCH = 100;
const chunks = [];
for (let i = 0; i < targets.length; i += BATCH) chunks.push(targets.slice(i, i + BATCH));

for (const chunk of chunks) {
  // Drop anyone this email already reached (resume-safe across reruns).
  let fresh = chunk;
  if (!TO) {
    const flags = await kvFetch(`smismember/${encodeURIComponent(CAMPAIGN)}/${chunk.map((a) => encodeURIComponent(a.email.toLowerCase())).join('/')}`);
    fresh = chunk.filter((_, i) => !Number(flags?.[i]));
    skipped += chunk.length - fresh.length;
  }
  if (!fresh.length) continue;

  try {
    const res = await resend.batch.send(fresh.map(msgFor));
    if (res?.error) throw new Error(res.error.message || String(res.error));
    if (!TO) {
      for (let i = 0; i < fresh.length; i += 50) {
        const grp = fresh.slice(i, i + 50).map((a) => encodeURIComponent(a.email.toLowerCase())).join('/');
        await kvFetch(`sadd/${encodeURIComponent(CAMPAIGN)}/${grp}`);
      }
    }
    sent += fresh.length;
    console.log(`  ...${sent}/${targets.length} sent`);
  } catch (err) {
    // One rejected address must not cost the other 99. Retry the chunk singly.
    console.log(`  batch failed (${err.message}) — retrying ${fresh.length} individually`);
    for (const a of fresh) {
      try {
        const r = await resend.emails.send(msgFor(a));
        if (r?.error) { failed++; failures.push({ email: a.email, error: r.error.message || String(r.error) }); }
        else { if (!TO) await sadd(a.email.toLowerCase()); sent++; }
      } catch (e2) { failed++; failures.push({ email: a.email, error: e2.message }); }
      await new Promise((r) => setTimeout(r, 550));
    }
  }
  await new Promise((r) => setTimeout(r, 600));
}

if (TO) {
  console.log(`\nTest batch done. sent=${sent} failed=${failed}`);
  console.log('Check the inbox: unsubscribe link in the footer, and List-Unsubscribe in the raw headers.');
  process.exit(failed ? 1 : 0);
}

// ── Audit trail ───────────────────────────────────────────────────────────
const fs = await import('node:fs');
const record = {
  ts: new Date().toISOString(), venture: 'BraveWorks RN', campaign: CAMPAIGN, email: Number(WHICH),
  subject: CFG.subject, from: FROM,
  segment: 'bwbp:drip:* active (not unsub/paused/flashOnly), minus coaching clients ($1,997 All-In cohort)',
  excludedCoaching: [...excluded].sort(),
  counts: { eligible: audience.length, sent, skippedAlreadySent: skipped, failed }, failures,
};
const out = '../memory/broadcasts';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(`${out}/challenge-free-2026-08-24-e${WHICH}.json`, JSON.stringify(record, null, 2));
console.log(`\nDone. email=${WHICH} sent=${sent} skipped(already)=${skipped} failed=${failed}`);
console.log(`Log: memory/broadcasts/challenge-free-2026-08-24-e${WHICH}.json`);
