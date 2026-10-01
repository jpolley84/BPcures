// Wednesday Zoom reminder for the Life Change Accelerator cohort.
//
// Why this exists: on 2026-09-23 the 11:00 AM Central call started and nobody
// had sent the link, because sending it depended on a person remembering. This
// removes the person.
//
// Fires 30 minutes before the call. Two UTC cron entries are registered
// (15:30 and 16:30) so the job survives daylight saving without edits; the
// Central-time guard below lets exactly one of them through.
//
// Safety:
//   - dry run is the DEFAULT. ?mode=send is required to actually send.
//   - cron auth required on every call (see _cron-auth.js).
//   - the Central-time guard refuses any day that is not Wednesday and any
//     hour that is not 10 AM Central, so a stray manual call cannot blast the
//     cohort at the wrong time. ?force=1 overrides the guard for DRY RUNS ONLY.
//   - a per-date KV key makes a double fire a no-op.
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { ZOOM_MAIN, assertLiveRoom } from '../scripts/_zoom-rooms.mjs';
import { ACCELERATOR_ROSTER } from './_accelerator-roster.js';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SENT_KEY = (d) => `accel:reminder:sent:${d}`;

// Central-time parts, DST handled by the runtime rather than by us.
function centralParts(now = new Date()) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    weekday: p.weekday,
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}

function body(first) {
  return `${first},

Reminder that we meet today at 11:00 AM Central, which is 12:00 PM Eastern.
That is 30 minutes from now.

${ZOOM_MAIN}
Meeting ID: 828 5171 5003
Passcode: 027302

Bring your questions and your numbers. See you there.

Joel + Annie`;
}

function html(first) {
  const text = body(first);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paras = text.split('\n\n')
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;">${paras}</div>`
    .replace(esc(ZOOM_MAIN), `<a href="${ZOOM_MAIN}">${esc(ZOOM_MAIN)}</a>`);
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  assertLiveRoom(ZOOM_MAIN);

  const send = req.query.mode === 'send';
  const force = req.query.force === '1';
  const ct = centralParts();

  // Guard. A send may only ever happen Wednesday, 10 AM Central.
  const onSchedule = ct.weekday === 'Wed' && ct.hour === 10;
  if (!onSchedule && !force) {
    return res.status(200).json({ skipped: 'off-schedule', centralTime: ct, sent: 0 });
  }
  if (!onSchedule && force && send) {
    return res.status(400).json({ error: 'force=1 is for dry runs only; refusing an off-schedule send' });
  }

  // A withdrawn member stays on the roster so the never-send list keeps her,
  // but she must never get another cohort email.
  const roster = ACCELERATOR_ROSTER.filter((m) => !m.withdrawn);

  if (!send) {
    return res.status(200).json({
      dryRun: true, centralTime: ct, onSchedule,
      wouldSend: roster.length,
      recipients: roster.map((r) => r.email),
      subject: 'We meet in 30 minutes',
      sample: body(roster[0].first),
    });
  }

  // Idempotency: first writer for today wins, a second fire is a no-op.
  const claimed = await kv.set(SENT_KEY(ct.date), new Date().toISOString(), { nx: true, ex: 60 * 60 * 24 * 7 });
  if (!claimed) {
    return res.status(200).json({ skipped: 'already-sent-today', date: ct.date, sent: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const failed = [];
  let sent = 0;
  for (const person of roster) {
    try {
      await resend.emails.send({
        from: FROM,
        to: [person.email],
        reply_to: REPLY_TO,
        subject: 'We meet in 30 minutes',
        text: body(person.first),
        html: html(person.first),
      });
      sent += 1;
    } catch (err) {
      failed.push({ email: person.email, error: String(err && err.message ? err.message : err) });
    }
  }

  return res.status(200).json({ sent, failed, total: roster.length, date: ct.date });
}
