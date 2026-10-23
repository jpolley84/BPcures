// "We are live" reminder for the October 2026 Change My Life Challenge.
//
// Why a new file instead of extending challenge-live-now.js: that endpoint is
// pinned to the September cohort AND its audience is "everyone who ever
// registered for a challenge, all cohorts". For the October cohort that would
// mail past free-cohort people who never paid for this one. This endpoint
// sends to the PAID October buyers and nobody else.
//
// Audience: challenge:2026-10-19:vip + challenge:2026-10-19:ga, the same two
// sets the VIP and GA phone roster came from, so the people who get this are
// exactly the people holding a seat.
//
// Safety, mirroring patterns already proven in this repo:
//   - dry run is the DEFAULT; ?mode=send or a cron is required to send
//   - cron auth required on every call
//   - the Central-time date guard allows only the nights in NIGHTS
//   - an NX claim per night makes a double fire a no-op
//   - the never-send guard still applies, and fails closed
//   - the Zoom room is asserted against the retired-room list before any send
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { excludeNeverSend } from './_never_send.js';
import { ZOOM_MAIN, assertLiveRoom } from '../scripts/_zoom-rooms.mjs';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const COHORT = '2026-10-19';
const SENT_KEY = (d, g) => `challenge:oct:nightreminder:sent:${g}:${d}`;
const SUBJECT = 'We are live. Come on in.';

// The coaches session runs in its OWN room at 8 PM Eastern / 7 PM Central,
// after the class ends. Scheduled 2026-10-20 after the single-room collision
// cost Tamara and Robert night 1. Not in _zoom-rooms.mjs because that file
// holds the one standing room; this is a second, cohort-scoped room.
const COACH_ROOM = 'https://us06web.zoom.us/j/85652670800?pwd=HbTtFso04Z6b2pfJfrvyqb5poV0KS1.1';
const COACH_ID = '856 5267 0800';
const COACH_PASS = '590213';
const COACH_SUBJECT = 'Your coaches session, 8 PM Eastern';

// The Money in Your Message cohort is three named people and there is no KV
// roster for it. Deriving it from a signup key mailed 12 masterclass
// registrants by mistake on 10-19, so it is hardcoded on purpose.
const COACHES = [
  { first: 'Tamara', email: 'tamarabeckfordmd@gmail.com' },
  { first: 'Robert', email: 'bankablefinancial@gmail.com' },
  { first: 'Karen', email: 'kpaug19@gmail.com' },
  // Added 2026-10-22 (Joel). She came in through the challenge as a VIP
  // buyer and joined the coaches track mid-week, so she had her own welcome
  // send that night; the cron covers her from night 5 on.
  { first: 'Victory', email: 'cekebude@gmail.com' },
];

const COACH_NIGHTS = {
  '2026-10-22': (first) => `${first},

The class is running now, and your coaches session starts at 8:00 PM Eastern, 7:00 PM Central.

Your room, the second one:

${COACH_ROOM}
Meeting ID: ${COACH_ID}
Passcode: ${COACH_PASS}

You are welcome in all three hours. If you only have one tonight, make it this one.

Joel + Annie`,
  '2026-10-23': (first) => `${first},

Last day of the week, and your coaches session is this AFTERNOON at 3:00 PM Central, 4:00 PM Eastern.

Your room, the second one:

${COACH_ROOM}
Meeting ID: ${COACH_ID}
Passcode: ${COACH_PASS}

Bring your questions about running this with your own clients. That is what this hour is for.

Joel + Annie`,
};

// Night 4 is Thursday Oct 22, night 5 is Friday Oct 23. Same shape as the
// nights Joel approved by hand on the 19th, 20th and 21st.
const NIGHTS = {
  '2026-10-22': {
    label: 'Night 4',
    body: (first) => `${first},

Night 4 is starting. The room is open right now.

${ZOOM_MAIN}
Meeting ID: 828 5171 5003
Passcode: 027302

One night left after this one. Come in late if you have to, you will still get the part that matters.

Joel + Annie`,
  },
  '2026-10-23': {
    label: 'Night 5',
    body: (first) => `${first},

Last day of the challenge, and we are on this MORNING.

10:00 AM Central, 11:00 AM Eastern - Live Q&A. Bring whatever is still unanswered.

11:00 AM Central, 12:00 PM Eastern - The final class.

Same room for both:

${ZOOM_MAIN}
Meeting ID: 828 5171 5003
Passcode: 027302

You showed up for yourself all week. Come finish it with us.

Joel + Annie`,
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
  const paras = text.split('\n').filter((l) => l.trim()).map((l) => {
    let t = esc(l);
    for (const url of [ZOOM_MAIN, COACH_ROOM]) {
      t = t.replace(esc(url), `<a href="${url}" style="color:#112d4d;font-weight:700">${esc(url)}</a>`);
    }
    return `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1b2430">${t}</p>`;
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
    + '<div style="max-width:560px;margin:0 auto;padding:28px 22px;'
    + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + paras + '</div></body></html>';
}

async function buyers() {
  const out = new Map();
  for (const seat of ['vip', 'ga']) {
    let members = [];
    try { members = (await kv.smembers(`challenge:${COHORT}:${seat}`)) || []; }
    catch { members = []; }
    for (const m of members) {
      const email = String(m).trim().toLowerCase();
      if (!email) continue;
      let rec = null;
      try { rec = await kv.get(`challenge:${COHORT}:${seat}:${email}`); } catch { /* non-fatal */ }
      if (typeof rec === 'string') { try { rec = JSON.parse(rec); } catch { rec = null; } }
      if (!out.has(email)) out.set(email, tidy(rec && rec.firstName));
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const group = req.query?.group === 'coaches' ? 'coaches' : 'buyers';

  // A retired room in a reminder is worse than no reminder at all. The coaches
  // room is cohort-scoped and not in the standing-room file, so only the main
  // room is asserted here.
  if (group === 'buyers') assertLiveRoom(ZOOM_MAIN);

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const nightMap = group === 'coaches' ? COACH_NIGHTS : NIGHTS;
  const night = group === 'coaches'
    ? (COACH_NIGHTS[today] ? { label: 'Coaches session', body: COACH_NIGHTS[today] } : null)
    : NIGHTS[today];
  if (!night) {
    return res.status(200).json({ ok: true, skipped: 'not a scheduled night', group, today, nights: Object.keys(nightMap) });
  }

  const sendMode = req.query?.mode === 'send' || req.query?.cron === '1';

  if (sendMode) {
    // NX claim: the first caller tonight wins, every later tick no-ops.
    const claimed = await kv.set(SENT_KEY(today, group), new Date().toISOString(), { nx: true, ex: 60 * 60 * 24 * 7 });
    if (!claimed) {
      return res.status(200).json({ ok: true, skipped: 'already sent tonight', today, label: night.label });
    }
  }

  const roster = group === 'coaches'
    ? new Map(COACHES.map((c) => [c.email.toLowerCase(), c.first]))
    : await buyers();
  if (roster.size === 0) {
    if (sendMode) await kv.del(SENT_KEY(today, group));
    return res.status(500).json({ error: 'no buyers found; refusing to send', cohort: COHORT });
  }

  // excludeNeverSend returns { kept, ...report }, NOT an array. Destructure it
  // or every downstream .slice()/.map() throws at send time.
  let eligible, guardReport;
  // The coaches group skips the roster-based client guard on purpose. That
  // guard protects coaching clients from BULK marketing; these are 4 named
  // people and this is the Zoom link for the session they are enrolled in.
  // On 2026-10-22 it silently dropped Karen Purvis from her own reminder
  // because she had just been added to the Accelerator roster. A real STOP is
  // still honored below.
  if (group === 'coaches') {
    let stopped = new Set();
    try {
      const raw = (await kv.smembers('bwbp:neversend')) || [];
      stopped = new Set(raw.map((x) => String(x).trim().toLowerCase()));
    } catch { /* an unreadable STOP list must not block 4 named people */ }
    const all = [...roster.keys()];
    eligible = all.filter((e) => !stopped.has(e));
    guardReport = { mode: 'coaches: STOP list only', dropped: all.filter((e) => stopped.has(e)) };
  } else try {
    const out = await excludeNeverSend([...roster.keys()]);
    eligible = out.kept;
    guardReport = { excluded: (out.excluded ?? null), reasons: (out.reasons ?? null) };
  } catch (err) {
    // Fail closed: no suppression list means no send, and release the claim so
    // a later tick can try again.
    if (sendMode) await kv.del(SENT_KEY(today, group));
    return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message });
  }

  const sample = eligible.slice(0, 2).map((e) => ({
    email: e, firstName: roster.get(e), text: night.body(roster.get(e)),
  }));
  if (!sendMode) {
    return res.status(200).json({
      ok: true, mode: 'DRY-RUN', today, label: night.label,
      group, buyers: roster.size, wouldSend: eligible.length,
      subject: group === 'coaches' ? COACH_SUBJECT : SUBJECT, guardReport, sample,
    });
  }

  const subject = group === 'coaches' ? COACH_SUBJECT : SUBJECT;
  const resend = new Resend(process.env.RESEND_API_KEY, { campaign: `cmlc-oct-${group}-${today}` });
  const batch = eligible.map((email) => {
    const text = night.body(roster.get(email));
    return { from: FROM, to: email, replyTo: REPLY_TO, subject, text, html: html(text) };
  });

  const results = { sent: 0, failed: 0, errors: [] };
  for (let i = 0; i < batch.length; i += 100) {
    const slice = batch.slice(i, i + 100);
    try {
      await resend.batch.send(slice);
      results.sent += slice.length;
    } catch (err) {
      results.failed += slice.length;
      results.errors.push(err.message);
    }
  }

  console.log(`challenge-night-reminder ${group} ${today} ${night.label}: sent ${results.sent} of ${batch.length}`);
  return res.status(200).json({
    ok: true, mode: 'CRON-SEND', today, label: night.label,
    group, buyers: roster.size, eligible: eligible.length, guardReport, ...results,
  });
}
