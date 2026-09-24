// "We're live" reminder for the Sept 2026 Change My Life Challenge.
//
// Audience: everyone who ever registered for a challenge (all cohorts), not
// just this month's buyers. Joel opened nights 2 and 3 to past participants.
// Anyone flagged opted-out on their drip record is dropped.
//
// Fires 4:30 PM Central on 2026-09-23 and 2026-09-24, ahead of BOTH the 5:00
// Q&A and the 6:00 class, so the reader can still make either one.
//
// Safety:
//   - dry run is the DEFAULT; ?mode=send is required to actually send
//   - cron auth required on every call
//   - the Central-time guard allows only the two scheduled dates at the 16:00
//     hour; ?force=1 previews off-schedule but a forced SEND is refused
//   - a per-date KV key makes a double fire a no-op
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { ZOOM_MAIN, assertLiveRoom } from '../scripts/_zoom-rooms.mjs';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SENT_KEY = (d) => `challenge:livenow:sent:${d}`;
const SEND_HOUR = 16; // 4 PM Central
const APPLY_URL = 'https://changemylifechallenge.com/apply?utm_campaign=cmlc-0922-livenow';

const NIGHTS = {
  '2026-09-23': {
    subject: 'Q&A at 5, class at 6, here is your link',
    lines: (first) => `${first},

Two things tonight, and you are welcome at both.

5:00 PM Central: live Q&A with Annie and me. Bring your numbers, your labs, whatever has not made sense. We answer what you bring.

6:00 PM Central: the class. Tonight is Annie's night, Bring Sexy Back. Hormones, energy, mood, hair, libido, and the speedy aging nobody warned you about.

Same room for both:

${ZOOM_MAIN}
Meeting ID: 828 5171 5003
Passcode: 027302

One note. Tonight is women only, because Annie says things in that room she will not say with men present. If you are a man, tomorrow night is yours and I want you there.

Joel + Annie`,
  },
  '2026-09-24': {
    // Joel's copy, 2026-09-24 1:30 PM CT (typo fixes only).
    subject: 'Q&A at 5, class at 6 (apply first)',
    lines: (first) => `${first},

If you haven't had the chance to apply yet and you mean to, here is your reminder.

Tonight Annie and I are revealing what the next 12 weeks can look like for the people who want us walking beside them.

Applying is free.

It is not a commitment.

And applying does not guarantee you a space.

It simply gives us a chance to look at where you are, and gives you a chance to decide whether working with us may be right for you.

Fill it out before 5:00 PM Central:

${APPLY_URL}

Then come into the room.

5:00 PM Central: VIP Q&A with Joel

6:00 PM Central: Take Back Your Future. Map out your 90 days of accelerated change.

Same Zoom room:

${ZOOM_MAIN}
Meeting ID: 828 5171 5003
Passcode: 027302

See you tonight,

Joel + Annie`,
  },
};

function centralParts(now = new Date()) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
}

async function scan(match) {
  let cursor = '0';
  const keys = [];
  do {
    const [next, batch] = await kv.scan(cursor, { match, count: 3000 });
    cursor = String(next);
    keys.push(...(batch || []));
  } while (cursor !== '0');
  return keys;
}

// Everyone who registered for any challenge cohort, deduped by email,
// minus anyone who opted out on their drip record.
async function audience() {
  const keys = await scan('challenge:*:reg:*');
  const people = new Map();
  for (const key of keys) {
    let rec = null;
    try { rec = await kv.get(key); } catch { rec = null; }
    if (typeof rec === 'string') { try { rec = JSON.parse(rec); } catch { rec = null; } }
    if (!rec || typeof rec !== 'object') continue;
    const email = String(rec.email || key.split(':').pop() || '').trim().toLowerCase();
    if (!email.includes('@')) continue;
    const first = String(rec.firstName || rec.fullName || '').split(/\s+/)[0] || 'Friend';
    if (!people.has(email)) people.set(email, first);
  }
  const out = [];
  let optedOut = 0;
  for (const [email, first] of people) {
    let drip = null;
    try { drip = await kv.get(`drip:${email}`); } catch { drip = null; }
    if (typeof drip === 'string') { try { drip = JSON.parse(drip); } catch { drip = null; } }
    if (drip && typeof drip === 'object' && (drip.optedIn === false || drip.unsubscribed)) { optedOut += 1; continue; }
    out.push({ email, first });
  }
  return { people: out, registered: people.size, optedOut };
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });
  assertLiveRoom(ZOOM_MAIN);

  const send = req.query.mode === 'send';
  const force = req.query.force === '1';
  const ct = centralParts();
  const night = NIGHTS[req.query.date || ct.date];

  const onSchedule = Boolean(NIGHTS[ct.date]) && ct.hour === SEND_HOUR;
  if (!onSchedule && !force) {
    return res.status(200).json({ skipped: 'off-schedule', centralTime: ct, sent: 0 });
  }
  if (!onSchedule && force && send) {
    return res.status(400).json({ error: 'force=1 is for dry runs only; refusing an off-schedule send' });
  }
  if (!night) return res.status(200).json({ skipped: 'no copy for this date', centralTime: ct, sent: 0 });

  const { people, registered, optedOut } = await audience();

  if (!send) {
    return res.status(200).json({
      dryRun: true, centralTime: ct, onSchedule,
      registered, optedOut, wouldSend: people.length,
      subject: night.subject,
      sample: night.lines(people[0] ? people[0].first : 'Friend'),
    });
  }

  const claimed = await kv.set(SENT_KEY(ct.date), new Date().toISOString(), { nx: true, ex: 60 * 60 * 24 * 14 });
  if (!claimed) return res.status(200).json({ skipped: 'already-sent-today', date: ct.date, sent: 0 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const failed = [];
  let sent = 0;
  for (const person of people) {
    const text = night.lines(person.first);
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;">${
      text.split('\n\n').map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
    }</div>`.replace(esc(ZOOM_MAIN), `<a href="${ZOOM_MAIN}">${esc(ZOOM_MAIN)}</a>`)
      .replace(esc(APPLY_URL), `<a href="${esc(APPLY_URL)}">${esc(APPLY_URL)}</a>`);
    try {
      await resend.emails.send({
        from: FROM, to: [person.email], reply_to: REPLY_TO,
        subject: night.subject, text, html,
      });
      sent += 1;
    } catch (err) {
      failed.push({ email: person.email, error: String(err && err.message ? err.message : err) });
    }
  }
  return res.status(200).json({ sent, failed: failed.length, failures: failed.slice(0, 10), total: people.length, date: ct.date });
}
