// api/masterclass-calendar.js — "Add to calendar" for the standing Monday
// masterclass. Replaces the Zoom-generated .ics links (2026-09-14: both the
// confirmation-email link and the /registered/ page link returned Zoom's
// "meeting doesn't exist" HTML page instead of a calendar file).
//
//   GET /api/masterclass-calendar           -> .ics download (Apple / Outlook / Google import)
//   GET /api/masterclass-calendar?google=1  -> 302 to a Google Calendar "add event" page
//
// Both carry the SAME event: weekly Monday 6:00 PM Central (7:00 PM Eastern),
// one hour, Zoom join link + meeting ID + passcode in the body. The Zoom room
// is the canonical ZOOM_MAIN from scripts/_zoom-rooms.mjs; keep the three
// constants below in step with api/_masterclass-enroll.js.

const ZOOM_JOIN_URL = 'https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1';
const ZOOM_MEETING_ID = '828 5171 5003';
const ZOOM_PASSCODE = '027302';
const PAGE_URL = 'https://bpquiz.com/masterclass/v3/';
const TITLE = 'Free Live Masterclass with Joel & Annie, RNs (Zoom)';
const START_HOUR_CT = 18;
const DURATION_MIN = 60;
const TZ = 'America/Chicago';

const DESCRIPTION_LINES = [
  'Free live masterclass with two RNs: Joel Polley (blood pressure & numbers) and Annie Chitate (hormones).',
  'Mondays at 6:00 PM Central / 7:00 PM Eastern, live on Zoom.',
  '',
  `Join here: ${ZOOM_JOIN_URL}`,
  `Meeting ID: ${ZOOM_MEETING_ID}`,
  `Passcode: ${ZOOM_PASSCODE}`,
  '',
  `Class details: ${PAGE_URL}`,
];

function chicagoParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t)?.value;
  return { y: +g('year'), m: +g('month'), d: +g('day'), h: +g('hour') % 24, min: +g('minute'), wd: g('weekday') };
}

// Next Monday (today included if the class hasn't ended yet), as a Chicago calendar date.
function nextMondayCT() {
  const now = Date.now();
  for (let add = 0; add < 8; add++) {
    const p = chicagoParts(new Date(now + add * 86400000));
    if (p.wd !== 'Mon') continue;
    if (add === 0 && (p.h > START_HOUR_CT || (p.h === START_HOUR_CT && p.min >= DURATION_MIN))) continue;
    return p;
  }
  return chicagoParts(new Date(now + 7 * 86400000));
}

const pad = (n) => String(n).padStart(2, '0');
const stampLocal = (p, h, min) => `${p.y}${pad(p.m)}${pad(p.d)}T${pad(h)}${pad(min)}00`;

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
// RFC 5545 line folding at 75 octets.
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    let end = Math.min(i + (i === 0 ? 75 : 74), bytes.length);
    while (end > i && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--; // don't split a UTF-8 char
    out.push((i === 0 ? '' : ' ') + bytes.subarray(i, end).toString('utf8'));
    i = end;
  }
  return out.join('\r\n');
}

function buildIcs(start) {
  const endMin = START_HOUR_CT * 60 + DURATION_MIN;
  const dtstart = stampLocal(start, START_HOUR_CT, 0);
  const dtend = stampLocal(start, Math.floor(endMin / 60), endMin % 60);
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BraveWorks RN//Masterclass//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${TZ}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:masterclass-monday@bpquiz.com',
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${TZ}:${dtstart}`,
    `DTEND;TZID=${TZ}:${dtend}`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO',
    `SUMMARY:${icsEscape(TITLE)}`,
    `DESCRIPTION:${icsEscape(DESCRIPTION_LINES.join('\n'))}`,
    `LOCATION:${icsEscape(ZOOM_JOIN_URL)}`,
    `URL:${ZOOM_JOIN_URL}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Masterclass starts in 30 minutes',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

function googleUrl(start) {
  const endMin = START_HOUR_CT * 60 + DURATION_MIN;
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: TITLE,
    dates: `${stampLocal(start, START_HOUR_CT, 0)}/${stampLocal(start, Math.floor(endMin / 60), endMin % 60)}`,
    ctz: TZ,
    details: DESCRIPTION_LINES.join('\n'),
    location: ZOOM_JOIN_URL,
    recur: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export default async function handler(req, res) {
  const start = nextMondayCT();
  res.setHeader('Cache-Control', 'no-store');
  if (String(req.query?.google || '') === '1') {
    res.setHeader('Location', googleUrl(start));
    return res.status(302).end();
  }
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bpquiz-masterclass.ics"');
  return res.status(200).send(buildIcs(start));
}
