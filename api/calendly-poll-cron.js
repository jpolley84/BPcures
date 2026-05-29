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
// Auth: CRON_SECRET (Vercel cron auto-injects). Schedule in vercel.json.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_cron-auth.js';

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

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = process.env.CALENDLY_TOKEN;
  if (!token) return res.status(500).json({ error: 'CALENDLY_TOKEN missing' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const nowIso = new Date().toISOString();

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

    for (const ev of events) {
      // Only events booked since the last poll.
      if (new Date(ev.created_at).getTime() <= lastMs) continue;

      const uuid = ev.uri.split('/').pop();
      const dedupeKey = `calendly-alerted:${uuid}`;
      if (await kv.get(dedupeKey)) continue;

      // Fetch invitee name/email for this event.
      let name = 'Someone', email = '(no email)', phone = '';
      try {
        const inv = (await cal(`/scheduled_events/${uuid}/invitees?count=1`, token)).collection || [];
        if (inv[0]) {
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
        await resend.emails.send({ from: FROM, to: JOEL_SMS, subject: 'New call booked', text });
        await kv.set(dedupeKey, { sentAt: nowIso, name }, { ex: 30 * 86400 });
        alerted++;
        names.push(name);
      } catch (e) {
        console.error('calendly-poll: SMS send failed for', name, e.message);
      }
    }

    // Advance the cursor regardless, so we never re-scan the same window.
    await kv.set(CURSOR_KEY, nowIso);

    return res.status(200).json({ ok: true, scanned: events.length, alerted, names });
  } catch (err) {
    console.error('calendly-poll-cron error:', err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
