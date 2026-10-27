// /api/calendly-poll-cron — every 15 min, text Joel about new Calendly
// bookings. Free-plan-friendly: Calendly webhooks require a paid plan, but
// the read API (scheduled_events) works on free, so we poll instead.
//
// 2026-05-28. Built after two intake calls (Flo, William) slipped into the
// inbox unseen and got missed within 24h.
//
// Mechanism:
//   - KV cursor `calendly-poll:last-check` (ISO). First run seeds it and
//     alerts on nothing (no backfill spam). Each later run alerts on any
//     upcoming event whose created_at is newer than the cursor.
//   - Per-event KV dedupe `calendly-alerted:<uuid>` (30-day TTL) as a
//     belt-and-suspenders guard against double-texting on overlap.
//   - SMS via Resend → Verizon email-to-SMS gateway (7175859505@vtext.com).
//
// 2026-10-27 (Joel): "I need these wired up." The same poll now also writes to
// the PERSON who booked, not only to Joel:
//   booked    -> buildConfirmation, a warm note personalised from her own
//                Calendly answers (api/_calendly-invitee-emails.js)
//   canceled  -> buildReschedule, unless she wrote a real reason, in which case
//                it holds and texts Joel so a human answers her
// Gated three ways, each of which cost us something once already:
//   * only ALLOWED_EVENTS ('Discovery Call'); a 30 Minute Check-In is a client
//   * isClientEmail(); Karen Purvis, a paying client, booked a Discovery Call
//     on 2026-10-26 and would have been welcomed as a stranger
//   * needsHumanReply(); Catherine Hamm canceled with a long personal note, and
//     "would you like to pick another time?" would say we never read it
// Per-event KV dedupe means a resend can never double-send.
//
// Auth: CRON_SECRET (Vercel cron auto-injects). Schedule in vercel.json.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { isAuthorizedCron } from './_cron-auth.js';
import {
  ALLOWED_EVENTS, FROM as INVITEE_FROM, REPLY_TO as INVITEE_REPLY_TO,
  buildConfirmation, buildReschedule, needsHumanReply, firstNameOf, isClientEmail,
} from './_calendly-invitee-emails.js';

const JOEL_SMS = process.env.JOEL_SMS || '7175859505@vtext.com';
const FROM = 'BraveWorks <noreply@bpquiz.com>';
const CURSOR_KEY = 'calendly-poll:last-check';

function fmtCentral(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }) + ' CT';
  } catch { return iso; }
}

async function cal(path, token) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendly ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Writes to the person who booked. Returns a short status string for the
// response body so a run is auditable without reading logs. Never throws: a
// failure here must not stop Joel's SMS or the cursor advance.
async function emailInvitee({ resend, kind, uuid, eventName, invitee, startIso, smsJoel }) {
  const email = String(invitee?.email || '').trim();
  if (!email || !email.includes('@')) return 'no-email';
  if (!ALLOWED_EVENTS.includes(String(eventName || '').trim())) return 'event-not-allowed';

  const dedupeKey = `calendly-invitee:${kind}:${uuid}`;
  if (await kv.get(dedupeKey)) return 'already-sent';

  if (await isClientEmail(email)) return 'client-skip';

  // A written cancellation reason is a decision, not a scheduling conflict.
  // Hold it and put it in front of Joel instead of answering it with a form.
  if (kind === 'reschedule' && needsHumanReply(invitee)) {
    const reason = String(invitee?.cancellation?.reason || '').replace(/\s+/g, ' ').trim();
    try {
      await smsJoel(`${firstNameOf(invitee) || email} canceled and left a note. No auto-email sent, she needs you: "${reason.slice(0, 220)}"`);
      await kv.set(dedupeKey, { heldAt: new Date().toISOString(), reason }, { ex: 90 * 86400 });
    } catch (e) {
      console.error('calendly-invitee: hold notice failed for', email, e.message);
    }
    return 'held-for-human';
  }

  const msg = kind === 'confirmation'
    ? buildConfirmation(invitee, startIso)
    : buildReschedule(invitee);

  try {
    await resend.emails.send({
      from: INVITEE_FROM, to: email, reply_to: INVITEE_REPLY_TO,
      subject: msg.subject, text: msg.text, html: msg.html,
    });
    await kv.set(dedupeKey, { sentAt: new Date().toISOString(), subject: msg.subject }, { ex: 90 * 86400 });
    return 'sent';
  } catch (e) {
    console.error('calendly-invitee: send failed for', email, e.message);
    return 'send-failed';
  }
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = process.env.CALENDLY_TOKEN;
  if (!token) {
    // Soft-fail: cron is wired but the API token isn't in Vercel env yet.
    // Return 200 so this doesn't pollute the error-rate dashboard at 96 runs/day.
    // Joel still gets Calendly's native "New Event" emails to braveworksrn@gmail.com,
    // so nothing's actually broken — only the SMS alerts to JOEL_SMS are dormant.
    // Fix: generate a Calendly Personal Access Token + set CALENDLY_TOKEN in Vercel.
    console.warn('calendly-poll-cron: CALENDLY_TOKEN env var not set — skipping run');
    return res.status(200).json({ ok: false, skipped: true, reason: 'CALENDLY_TOKEN not configured' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const nowIso = new Date().toISOString();
  const smsJoel = (text) => resend.emails.send({
    from: FROM, to: JOEL_SMS, subject: 'New call booked', text,
  });

  try {
    const me = await cal('/users/me', token);
    const org = me.resource.current_organization;

    // Pull upcoming active events (min_start_time = now → future only).
    const params = new URLSearchParams({
      organization: org,
      status: 'active',
      min_start_time: nowIso,
      sort: 'start_time:asc',
      count: '50',
    });
    const events = (await cal(`/scheduled_events?${params}`, token)).collection || [];

    // First run: seed the cursor, alert on nothing (avoids texting Joel
    // about every pre-existing future booking on deploy).
    const lastCheck = await kv.get(CURSOR_KEY);
    if (!lastCheck) {
      await kv.set(CURSOR_KEY, nowIso);
      return res.status(200).json({ ok: true, seeded: true, upcoming: events.length });
    }

    const lastMs = new Date(lastCheck).getTime();
    let alerted = 0;
    const names = [];
    const invitee = [];   // per-person outcome of the confirmation emails
    const canceled = [];  // per-person outcome of the reschedule emails

    for (const ev of events) {
      // Only events booked since the last poll.
      if (new Date(ev.created_at).getTime() <= lastMs) continue;

      const uuid = ev.uri.split('/').pop();
      const dedupeKey = `calendly-alerted:${uuid}`;
      if (await kv.get(dedupeKey)) continue;

      // Fetch invitee name/email for this event.
      let name = 'Someone', email = '(no email)', phone = '', inviteeRow = null;
      try {
        const inv = (await cal(`/scheduled_events/${uuid}/invitees?count=1`, token)).collection || [];
        if (inv[0]) {
          inviteeRow = inv[0];
          name = inv[0].name || name;
          email = inv[0].email || email;
          for (const qa of inv[0].questions_and_answers || []) {
            if (/phone|cell|number/i.test(qa.question || '') && qa.answer) { phone = ` · ${qa.answer}`; break; }
          }
        }
      } catch (e) {
        console.warn('calendly-poll: invitee fetch failed for', uuid, e.message);
      }

      const text = `New BraveWorks booking: ${name} (${email})${phone} — ${fmtCentral(ev.start_time)} · ${ev.name || 'call'}`;

      try {
        await smsJoel(text);
        await kv.set(dedupeKey, { sentAt: nowIso, name }, { ex: 30 * 86400 });
        alerted++;
        names.push(name);
      } catch (e) {
        console.error('calendly-poll: SMS send failed for', name, e.message);
      }

      // Her own confirmation. Deliberately after Joel's SMS and in its own
      // try/catch inside emailInvitee, so a Resend hiccup on her note can
      // never cost Joel the alert he actually relies on.
      if (inviteeRow) {
        invitee.push(`${name}:${await emailInvitee({
          resend, kind: 'confirmation', uuid, eventName: ev.name,
          invitee: inviteeRow, startIso: ev.start_time, smsJoel,
        })}`);
      }
    }

    // ---- canceled upcoming calls ------------------------------------------
    // Calendly exposes no "canceled since" filter, so this scans canceled
    // events that were still in the FUTURE at scan time. That bounds the set
    // to real, recent cancellations instead of years of history, and the
    // per-event dedupe key makes a repeat scan a no-op. A cancellation of a
    // call that has already passed is a no-show, not something to answer.
    let canceledScanned = 0;
    try {
      const cparams = new URLSearchParams({
        organization: org,
        status: 'canceled',
        min_start_time: nowIso,
        sort: 'start_time:asc',
        count: '50',
      });
      const cevents = (await cal(`/scheduled_events?${cparams}`, token)).collection || [];
      canceledScanned = cevents.length;

      for (const ev of cevents) {
        const uuid = ev.uri.split('/').pop();
        if (await kv.get(`calendly-invitee:reschedule:${uuid}`)) continue;

        let row = null;
        try {
          const inv = (await cal(`/scheduled_events/${uuid}/invitees?count=1`, token)).collection || [];
          row = inv[0] || null;
        } catch (e) {
          console.warn('calendly-poll: canceled invitee fetch failed for', uuid, e.message);
        }
        if (!row) continue;

        // Calendly carries the cancellation on the event, the invitee, or both
        // depending on who canceled. needsHumanReply() reads invitee.cancellation,
        // so make sure it is populated from whichever side has it.
        if (!row.cancellation && ev.cancellation) row.cancellation = ev.cancellation;

        canceled.push(`${row.name || row.email}:${await emailInvitee({
          resend, kind: 'reschedule', uuid, eventName: ev.name,
          invitee: row, startIso: ev.start_time, smsJoel,
        })}`);
      }
    } catch (e) {
      // Non-fatal: the booking alerts are the job this cron must never miss.
      console.error('calendly-poll: canceled scan failed:', e.message);
    }

    // Advance the cursor regardless, so we never re-scan the same window.
    await kv.set(CURSOR_KEY, nowIso);

    return res.status(200).json({
      ok: true, scanned: events.length, alerted, names,
      canceledScanned, invitee, canceled,
    });
  } catch (err) {
    console.error('calendly-poll-cron error:', err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
