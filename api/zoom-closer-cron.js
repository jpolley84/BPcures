// /api/zoom-closer-cron — VIP-only Zoom-link closer for the Monday night
// BP Triangle Challenge live call.
//
// 2026-05-12: Joel disabled the weekly auto-schedule (the Monday call was
// a one-time event; future calls will be manually triggered when scheduled).
// Vercel cron entry REMOVED from vercel.json. Handler kept live so Joel can
// manually curl-fire it when a call is on the calendar:
//
//   curl -H "Authorization: Bearer $CRON_AUTH_TOKEN" \
//        https://bpquiz.com/api/zoom-closer-cron
//
// To re-enable the weekly auto-fire, restore this entry to vercel.json:
//   { "path": "/api/zoom-closer-cron", "schedule": "0 1 * * 2" }
// (= Tuesday 01:00 UTC = Monday 21:00 ET during EDT / 20:00 ET during EST)
//
// What it does:
//   1. Pulls paid checkout sessions from Stripe (last 60 days)
//   2. Filters to amount_subtotal === 9700 (the $97 BP Triangle Challenge)
//   3. Dedupes by buyer email (most recent purchase wins)
//   4. KV dedupe: skips any buyer who already got today's closer
//      (key `zoom-closer-sent:YYYY-MM-DD:<email>`, 36-hour TTL)
//   5. Renders + sends a Zoom-link email via Resend (rate-limited 250ms)
//   6. Returns JSON summary { sent, skipped, failed, recipients }
//
// Auth: see api/_cron-auth.js — three paths accepted:
//   1. Authorization: Bearer ${CRON_SECRET}      ← Vercel cron (current spec)
//   2. Authorization: Bearer ${CRON_AUTH_TOKEN}  ← manual curl trigger
//   3. x-vercel-cron: 1                          ← Vercel cron (legacy)
//
// Manual fire (e.g., to test, or if Vercel cron misses):
//   curl -H "Authorization: Bearer $CRON_AUTH_TOKEN" \
//        https://bpquiz.com/api/zoom-closer-cron
//
// Force fire (bypass KV dedupe — useful for testing):
//   curl -H "Authorization: Bearer $CRON_AUTH_TOKEN" \
//        https://bpquiz.com/api/zoom-closer-cron?force=1
//
// Env vars required (set in Vercel):
//   STRIPE_SECRET_KEY     — for the Stripe API call
//   RESEND_API_KEY        — for the email send
//   CRON_SECRET           — Vercel auto-injects this as Bearer on cron fires
//   CRON_AUTH_TOKEN       — separate token for manual curl triggers
//   KV_REST_API_URL/TOKEN — auto-set when Vercel KV is provisioned
//   ZOOM_URL              — full Zoom join URL (with passcode token)

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 60 };

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const VIP_AMOUNT_CENTS = 9700;
const LOOKBACK_DAYS = 60;
const RATE_LIMIT_MS = 250;
const KV_DEDUPE_TTL_SEC = 129600; // 36h

// Default Zoom URL for tonight's call. Override via env var ZOOM_URL.
// Update this when the live's Zoom room rotates (or move it fully into env).
const DEFAULT_ZOOM_URL =
  'https://us06web.zoom.us/j/86045540939?pwd=4SowvLId0a8UiAY8TLppZIdYJdIIfe.1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Stripe VIP-buyer pull ────────────────────────────────────────────

async function pullVipBuyers() {
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not set');

  const since = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const HEADERS = {
    Authorization: `Bearer ${STRIPE_KEY}`,
    'Stripe-Version': '2024-04-10',
  };

  const sessions = [];
  let startingAfter = null;
  for (let i = 0; i < 30; i++) {
    const qs = new URLSearchParams({
      'created[gte]': String(since),
      limit: '100',
    });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions?${qs}`,
      { headers: HEADERS },
    );
    if (!res.ok) {
      throw new Error(`Stripe ${res.status}: ${await res.text()}`);
    }
    const j = await res.json();
    sessions.push(...j.data);
    if (!j.has_more) break;
    startingAfter = j.data[j.data.length - 1]?.id;
  }

  const vips = sessions.filter(
    (s) =>
      s.payment_status === 'paid' && s.amount_subtotal === VIP_AMOUNT_CENTS,
  );

  // Dedupe by email — keep most recent
  const byEmail = new Map();
  for (const s of vips.sort((a, b) => b.created - a.created)) {
    const email = s.customer_details?.email?.toLowerCase().trim();
    if (!email) continue;
    if (!byEmail.has(email)) {
      byEmail.set(email, {
        email,
        name: s.customer_details?.name || '',
        purchased: new Date(s.created * 1000).toISOString().slice(0, 10),
      });
    }
  }
  return Array.from(byEmail.values());
}

// ─── Email template ───────────────────────────────────────────────────

function renderEmail({ fname, zoomUrl }) {
  const first = (fname || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `${first},` : 'Friend,';
  const subject = `Tonight's Zoom link inside — see you at 10 PM ET`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,'Times New Roman',serif;color:#2C3E50;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;border:1px solid #EAE3D5;">
        <tr><td style="padding:34px 36px 6px 36px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;margin-bottom:18px;">BP Triangle Challenge · Live tonight</div>
          <h1 style="font-family:'Fraunces',Georgia,serif;font-size:26px;line-height:1.25;font-weight:500;margin:0 0 14px 0;color:#2C3E50;">
            ${greeting} the <em style="color:#B85A36;">Zoom link</em> for tonight is below.
          </h1>
          <p style="font-size:16px;line-height:1.65;margin:0 0 16px 0;">
            Tonight at <strong>10 PM ET</strong>, we unravel the Triangle — one side at a time. Pressure. Stress. Sugar. The loop. The two swaps that quiet it for most women by week two.
          </p>
          <p style="font-size:16px;line-height:1.65;margin:0 0 18px 0;">
            Bring your numbers. Bring your meds list. Bring your questions.
          </p>
        </td></tr>

        <tr><td style="padding:6px 36px 14px 36px;" align="center">
          <a href="${zoomUrl}" style="display:inline-block;background:#2C3E50;color:#FFFFFF;padding:18px 32px;border-radius:12px;text-decoration:none;font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:600;letter-spacing:0.01em;">
            Join the Zoom — 10 PM ET →
          </a>
        </td></tr>

        <tr><td style="padding:0 36px 18px 36px;" align="center">
          <p style="font-size:13px;color:#7A7A7A;margin:4px 0 0 0;line-height:1.5;word-break:break-all;">
            Zoom link: <a href="${zoomUrl}" style="color:#7A7A7A;">${zoomUrl}</a>
          </p>
        </td></tr>

        <tr><td style="padding:14px 36px 18px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E8;border-radius:12px;">
            <tr><td style="padding:18px 22px;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6C3483;margin-bottom:8px;">Quick housekeeping</div>
              <ul style="font-size:15px;line-height:1.7;margin:0;padding-left:20px;color:#3A3A3A;">
                <li>Bring a notebook — there will be specific doses to write down.</li>
                <li>Join 2 minutes early so the room is full when we open.</li>
                <li>Replay goes to your inbox within 24 hours if life happens.</li>
              </ul>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:6px 36px 28px 36px;">
          <p style="font-size:15px;line-height:1.6;margin:0;">See you at 10.</p>
          <p style="font-size:15px;line-height:1.6;margin:8px 0 0 0;">— Joel</p>
        </td></tr>

        <tr><td style="padding:0 36px 28px 36px;">
          <hr style="border:none;border-top:1px solid #EAE3D5;margin:10px 0 16px 0;" />
          <p style="font-size:11px;color:#9A9A9A;line-height:1.6;margin:0;">
            BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a>
            <br/>Sent to BP Triangle Challenge members. Educational content only. Not medical advice.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}

// ─── Handler ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const force = req.query?.force === '1' || req.query?.force === 'true';
  const zoomUrl = process.env.ZOOM_URL || DEFAULT_ZOOM_URL;

  // Date stamp for KV dedupe
  const dateStamp = new Date().toISOString().slice(0, 10);

  let buyers;
  try {
    buyers = await pullVipBuyers();
  } catch (err) {
    console.error('zoom-closer-cron: stripe pull failed', err.message);
    return res.status(500).json({ error: 'stripe_pull_failed', detail: err.message });
  }

  if (buyers.length === 0) {
    return res.status(200).json({
      ok: true,
      message: 'no VIP buyers in window',
      sent: 0,
      skipped: 0,
      failed: 0,
      recipients: [],
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not set' });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const recipients = [];
  const failures = [];

  for (const b of buyers) {
    const dedupeKey = `zoom-closer-sent:${dateStamp}:${b.email}`;

    if (!force) {
      try {
        const alreadySent = await kv.get(dedupeKey);
        if (alreadySent) {
          skipped++;
          recipients.push({ email: b.email, status: 'skipped_dedupe' });
          continue;
        }
      } catch (err) {
        // KV outage shouldn't block the send — log and continue
        console.warn('zoom-closer-cron: KV dedupe check failed (allowing send):', err.message);
      }
    }

    const { subject, html } = renderEmail({ fname: b.name, zoomUrl });
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: b.email,
        reply_to: REPLY_TO,
        subject,
        html,
      });
      if (result.error) {
        failed++;
        failures.push({ email: b.email, error: result.error });
        recipients.push({ email: b.email, status: 'failed', error: String(result.error).slice(0, 200) });
        console.error('zoom-closer-cron: resend error', b.email, result.error);
      } else {
        sent++;
        recipients.push({ email: b.email, status: 'sent', id: result.data?.id });
        // Record in KV so we don't double-send if cron + manual both fire
        try {
          await kv.set(dedupeKey, { sentAt: new Date().toISOString(), id: result.data?.id }, { ex: KV_DEDUPE_TTL_SEC });
        } catch (kvErr) {
          console.warn('zoom-closer-cron: KV write failed (non-fatal):', kvErr.message);
        }
      }
    } catch (err) {
      failed++;
      failures.push({ email: b.email, error: err.message });
      recipients.push({ email: b.email, status: 'failed', error: err.message.slice(0, 200) });
      console.error('zoom-closer-cron: send threw', b.email, err.message);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(
    `zoom-closer-cron: ${dateStamp} done. sent=${sent} skipped=${skipped} failed=${failed} total=${buyers.length}`,
  );

  return res.status(200).json({
    ok: true,
    dateStamp,
    sent,
    skipped,
    failed,
    total: buyers.length,
    zoomUrl,
    recipients,
    ...(failures.length ? { failures } : {}),
  });
}
