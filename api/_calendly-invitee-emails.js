// api/_calendly-invitee-emails.js — the two warm notes that go to the person
// who booked, not to Joel. The SMS alert in calendly-webhook.js and
// calendly-poll-cron.js tells Joel; this tells her.
//
// 2026-10-27 (Joel): "I need these wired up." Two emails, both signed Joel &
// Annie, both personalised from her own Calendly answers:
//   confirmation  — after she books
//   reschedule    — after she cancels
//
// WHY NO LLM. Joel's brief says write the personal lines "naturally, not as
// copied-and-pasted questionnaire answers", and "if a response is missing,
// rewrite the sentence naturally without inventing details". A model would do
// the first and risk the second, and these go out unattended. So the lines are
// built from her own words by rule: we reuse her phrasing, fix only casing,
// spacing and a short list of health-word typos, and when she wrote nothing we
// drop the sentence entirely rather than guess. Nothing here can state a fact
// she did not write.
//
// EVENT TYPES. Only the types in ALLOWED_EVENTS get these. A "30 Minute
// Check-In" is an existing coaching client; "we're excited to explore what's
// possible" would be wrong for her.
//
// EXISTING CLIENTS. A client can still book a Discovery Call (Karen Purvis did,
// on 2026-10-26, to ask about scheduling and course materials). The caller must
// pass `isClient` so she gets no prospect email at all.

export const ALLOWED_EVENTS = ['Discovery Call'];

export const FROM = 'Joel & Annie, BraveWorks RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';

// Two question schemas exist on the Discovery Call: the current three-question
// set and an older single "anything that will help prepare" field. Both carry
// the same thing for our purposes, so we match on the question text.
const CONCERN_Q = /#1 thing you want to change|help prepare for our meeting/i;

// Answers that are a dropdown choice, not something she wrote. Never quote these.
const CHOICE_ANSWERS = [
  /^ready to invest/i, /^still exploring/i, /^not in a position/i,
  /^curious,/i, /^ready, but/i, /^100%/i, /^i just need/i,
];

// Her typos reach her own inbox quoted back at her, which reads careless.
// Health words and shorthand only. Nothing here changes what she said, and
// every pattern is word-bounded so it cannot fire inside another word.
const SPELLING = [
  [/\bblloysugar\b/gi, 'blood sugar'],
  [/\bblood ?sugat\b/gi, 'blood sugar'],
  [/\bbp\b/gi, 'blood pressure'],
  [/\bpre diabetes\b/gi, 'pre-diabetes'],
  [/\bloss of belly fat\b/gi, 'lose the belly fat'],
  [/\byrs\b/gi, 'years'],
  [/\bmths\b/gi, 'months'],
];

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// "i want to lose weight, lower bp " -> "I want to lose weight, lower blood pressure"
function tidy(s) {
  let t = clean(s).replace(/\bi\b/g, 'I').replace(/\s+([,.;])/g, '$1');
  for (const [re, to] of SPELLING) t = t.replace(re, to);
  return t.replace(/[.\s]+$/, '');
}

function lowerFirst(s) {
  if (!s) return s;
  // Never lowercase a leading "I": "I want to lose weight" must not become "i want".
  if (/^I\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function firstNameOf(invitee) {
  const n = clean(invitee.first_name || invitee.name || '');
  const first = n.split(/\s+/)[0] || '';
  if (!first) return '';
  // "ODESSA" -> "Odessa", but leave "McWhorter"-style mixed case alone.
  return first === first.toUpperCase()
    ? first.charAt(0) + first.slice(1).toLowerCase()
    : first;
}

// Her own description of what she wants changed, or '' when she wrote nothing.
export function concernOf(invitee) {
  for (const qa of invitee.questions_and_answers || []) {
    if (!CONCERN_Q.test(qa.question || '')) continue;
    const a = clean(qa.answer);
    if (!a) continue;
    if (CHOICE_ANSWERS.some((re) => re.test(a))) continue;
    return tidy(a);
  }
  return '';
}

// The single personal paragraph. Returns '' when she gave us nothing, and the
// caller drops the paragraph rather than printing an empty frame.
export function personalLine(invitee) {
  const c = concernOf(invitee);
  if (!c) return '';
  return `You told us what you want to work on: ${lowerFirst(c)}. We read it, and that is where we will start.`;
}

// True when she explained why she cancelled. A written reason is usually a
// decision ("finances are a hurdle", "found another provider"), and answering
// it with a generic "want to pick another time?" reads like we never read it.
// Those go to Joel for a human reply instead of an automated one.
export function needsHumanReply(invitee) {
  const reason = clean((invitee.cancellation || {}).reason);
  return reason.length > 40;
}

export function fmtWhen(startIso, timezone) {
  if (!startIso) return '';
  try {
    const d = new Date(startIso);
    const tz = timezone || 'America/Chicago';
    const date = d.toLocaleString('en-US', {
      timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
    });
    const time = d.toLocaleString('en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit',
    });
    const zone = (d.toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' })
      .split(' ').pop()) || '';
    return `${date} at ${time} ${zone}`.trim();
  } catch {
    return '';
  }
}

function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function wrap(text, links = []) {
  const paras = text.split('\n\n').filter((p) => p.trim());
  const body = paras.map((p) => {
    let h = esc(p).replace(/\n/g, '<br>');
    for (const u of links) {
      h = h.split(esc(u)).join(`<a href="${u}" style="color:#112d4d;font-weight:700">${esc(u)}</a>`);
    }
    return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:#1b2430">${h}</p>`;
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
    + '<div style="max-width:580px;margin:0 auto;padding:30px 22px;'
    + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + body
    + '</div></body></html>';
}

// ---------------------------------------------------------------- confirmation
export function buildConfirmation(invitee, startIso) {
  const first = firstNameOf(invitee) || 'there';
  const when = fmtWhen(startIso, invitee.timezone);
  const personal = personalLine(invitee);

  const L = [`Hey ${first},`, '',
    'We are so glad you booked a call with us.', '',
    'Annie and I are looking forward to getting to know you, hearing your story, '
    + 'and talking through what is possible for your health.', ''];

  if (personal) L.push(personal, '');

  L.push('Our time together is about you. Where you are now, where you would love '
    + 'to be, and what it would actually take to close that gap.', '');

  if (when) {
    L.push(`YOUR CALL: ${when}`, '',
      'That time is in your own timezone, the one you booked in.', '');
  }

  L.push('Come with your questions. If you have recent numbers, a blood pressure '
    + 'log or a lab result, have them nearby. You do not need to prepare anything '
    + 'else.', '',
    'See you soon.', '', 'Joel & Annie');

  const text = L.join('\n');
  return {
    subject: 'Your call is booked. We are looking forward to it.',
    text,
    html: wrap(text),
  };
}

// ----------------------------------------------------------------- reschedule
export function buildReschedule(invitee) {
  const first = firstNameOf(invitee) || 'there';
  const link = invitee.reschedule_url || '';
  const personal = concernOf(invitee);

  const L = [`Hey ${first},`, '',
    'We saw your call was canceled, and we wanted to reach out ourselves rather '
    + 'than let it pass quietly.', '',
    'Life happens. No explanation needed.', ''];

  if (personal) {
    L.push('We did want to say one thing, though. When you booked, you told us what '
      + `you wanted to work on: ${lowerFirst(personal)}.`, '',
      'We have not forgotten that, and we still think there is something useful we '
      + 'could tell you.', '');
  } else {
    L.push('We would still like to hear your story, even if today was the wrong day '
      + 'for it.', '');
  }

  L.push('Even if we find we are not the right fit for you, you would leave the call '
    + 'with a couple of things you can start on by yourself. That part costs you '
    + 'nothing either way.', '',
    'Would you like to pick another time?', '');

  if (link) L.push(link, '');

  L.push('And if the answer is no, that is a real answer, and we are glad you came '
    + 'this far with us.', '', 'Joel & Annie');

  const text = L.join('\n');
  return {
    subject: 'Would you like to pick another time?',
    text,
    html: wrap(text, link ? [link] : []),
  };
}

// ---------------------------------------------------------------- client gate
// A coaching client who books a Discovery Call must get no prospect email at
// all. "We are so glad you booked, we are looking forward to getting to know
// you" is wrong for someone we already meet every Wednesday. Karen Purvis did
// exactly this on 2026-10-26.
//
// This reuses the never-send roster's three CLIENT sources only. It does NOT
// fold in Resend unsubscribes or manual opt-outs, because this is a
// transactional note about a call the person just booked themselves, and
// somebody who opted out of marketing still deserves their own confirmation.
//
// Fails CLOSED: if the client sources cannot be resolved we treat the invitee
// as a client and send nothing. A missing confirmation is recoverable; telling
// a paying client we are excited to meet her is not.
import { rosterEmails, allinEmails, payingCustomers } from './_never_send.js';

export async function isClientEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return true;
  try {
    const [allin, paying] = await Promise.all([allinEmails(), payingCustomers()]);
    return rosterEmails().has(e) || allin.has(e) || paying.has(e);
  } catch (err) {
    console.error('[calendly-emails] client gate failed, holding send:', err.message);
    return true;
  }
}
