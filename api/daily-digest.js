// /api/daily-digest — daily ops report emailed to braveworksrn@gmail.com.
//
// Runs the recurring checks Joel asks for ad-hoc:
//   - Sales (last 24h) by surface (bpquiz vs bpcures) + tier mix + named list
//   - New /1on1 applications (drip flag is1on1Applicant)
//   - New /cohort2 applications (coaching-app:* records)
//   - New seminar signups (drip tagged annie-seminar)
//   - Big-ticket buyers ($50+)
//   - Refunds + disputes (Stripe last 24h)
//   - Stalled drips (optedIn but lastSentAt > 48h)
//   - Cron heartbeat status
//
// Schedule: daily 13 UTC (8 AM CT) via vercel.json crons.
// Auth: CRON_SECRET (Vercel cron auto-injects, or curl -H "Authorization: Bearer $CRON_SECRET").

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_cron-auth.js';

const TO = 'braveworksrn@gmail.com';
const FROM = 'BraveWorks Daily Digest <joel@bpquiz.com>';
const BPCURES_STORE_ID = 'store_01KMDAKJZB6N0ZDEJSXWDBRNBN';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─── Stripe ────────────────────────────────────────────────────────────

async function fetchStripeChargesLast24h() {
  const sinceSec = Math.floor((Date.now() - ONE_DAY_MS) / 1000);
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return { error: 'STRIPE_SECRET_KEY missing', charges: [] };

  const charges = [];
  let startingAfter = null;
  // Stripe returns 100 per page. Plenty for a 24h window.
  for (let i = 0; i < 5; i++) {
    const url = new URL('https://api.stripe.com/v1/charges');
    url.searchParams.set('created[gte]', String(sinceSec));
    url.searchParams.set('limit', '100');
    if (startingAfter) url.searchParams.set('starting_after', startingAfter);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return { error: `Stripe ${res.status}: ${await res.text()}`, charges };
    }
    const data = await res.json();
    charges.push(...data.data);
    if (!data.has_more) break;
    startingAfter = data.data[data.data.length - 1]?.id;
  }
  return { charges };
}

async function fetchStripeDisputesLast24h() {
  const sinceSec = Math.floor((Date.now() - ONE_DAY_MS) / 1000);
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return [];
  try {
    const url = new URL('https://api.stripe.com/v1/disputes');
    url.searchParams.set('created[gte]', String(sinceSec));
    url.searchParams.set('limit', '100');
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

function classifyCharges(charges) {
  const succeeded = charges.filter((c) => c.status === 'succeeded' && !c.refunded);
  const refunded = charges.filter((c) => c.refunded);
  const failed = charges.filter((c) => c.status === 'failed');

  const bpcures = succeeded.filter((c) => c.metadata?.store_id === BPCURES_STORE_ID);
  const bpquiz = succeeded.filter((c) => c.metadata?.store_id !== BPCURES_STORE_ID);

  function sum(list) {
    return list.reduce((acc, c) => acc + (c.amount || 0), 0) / 100;
  }
  function uniqueCustomers(list) {
    return new Set(list.map((c) => (c.billing_details?.email || '').toLowerCase())).size;
  }

  // Tier mix
  const tierMix = {};
  for (const c of succeeded) {
    const amt = (c.amount || 0) / 100;
    const tier = labelTier(amt);
    tierMix[tier] = (tierMix[tier] || 0) + 1;
  }

  // Big-ticket (>$50)
  const bigTicket = succeeded.filter((c) => (c.amount || 0) >= 5000);

  return {
    succeeded,
    refunded,
    failed,
    totalRevenue: sum(succeeded),
    totalCharges: succeeded.length,
    uniqueCustomers: uniqueCustomers(succeeded),
    bpcuresRevenue: sum(bpcures),
    bpcuresCount: bpcures.length,
    bpquizRevenue: sum(bpquiz),
    bpquizCount: bpquiz.length,
    tierMix,
    bigTicket,
    refundCount: refunded.length,
    failedCount: failed.length,
  };
}

function labelTier(amount) {
  if (amount === 17) return '$17 Kit';
  if (amount === 12.99) return '$12.99 Book OTO';
  if (amount === 12) return '$12 Cure book';
  if (amount === 30) return '$30 Bump/OTO';
  if (amount === 47) return '$47 Reset Kit';
  if (amount === 97) return '$97 Challenge';
  if (amount === 280 || amount === 297) return '$297 Diagnostic';
  if (amount === 397) return '$397 Premium';
  if (amount === 497) return '$497';
  if (amount === 997) return '$997';
  if (amount === 1297) return '$1,297 1:1';
  if (amount === 1700) return '$1,700 Sprint';
  if (amount === 1997) return '$1,997 Sprint';
  if (amount === 6997) return '$6,997 Sprint';
  return `$${amount}`;
}

// ─── KV: drip-record scan ─────────────────────────────────────────────

async function scanDripRecords() {
  // Use kv.keys for the full set, then mget in chunks for value pulls.
  // mget returns null for missing keys but is much faster than per-key get.
  if (!process.env.KV_REST_API_URL) {
    return { error: 'KV_REST_API_URL missing', records: [] };
  }
  try {
    const keys = await kv.keys('drip:*');
    const records = [];
    const BATCH = 100;
    for (let i = 0; i < keys.length; i += BATCH) {
      const chunk = keys.slice(i, i + BATCH);
      const values = await kv.mget(...chunk);
      for (let j = 0; j < values.length; j++) {
        if (values[j]) records.push(values[j]);
      }
    }
    return { records };
  } catch (err) {
    return { error: err.message, records: [] };
  }
}

function classifyDrip(records) {
  const cutoff24h = Date.now() - ONE_DAY_MS;
  const cutoff48h = Date.now() - FORTY_EIGHT_HOURS_MS;

  const new1on1Applicants = [];
  const newSeminarSignups = [];
  const newDripEnrolls = [];
  const newPaidCustomers = [];
  const stalledDrips = [];

  for (const r of records) {
    if (!r || !r.email) continue;

    const enrolledAt = r.enrolledAt ? new Date(r.enrolledAt).getTime() : 0;
    const seminarAt = r.seminarSignupAt ? new Date(r.seminarSignupAt).getTime() : 0;
    const lastSentAt = r.lastSentAt ? new Date(r.lastSentAt).getTime() : 0;
    const purchasedAt = r.purchasedAt ? new Date(r.purchasedAt).getTime() : 0;

    if (r.is1on1Applicant && enrolledAt > cutoff24h) {
      new1on1Applicants.push(r);
    }
    if (seminarAt > cutoff24h) {
      newSeminarSignups.push(r);
    }
    if (enrolledAt > cutoff24h && !r.is1on1Applicant && seminarAt <= cutoff24h) {
      newDripEnrolls.push(r);
    }
    if (r.isPaidCustomer && purchasedAt > cutoff24h) {
      newPaidCustomers.push(r);
    }
    if (
      r.optedIn &&
      !r.paused &&
      !r.unsubscribed &&
      !r.complete &&
      lastSentAt > 0 &&
      lastSentAt < cutoff48h &&
      (r.lastSentDay || 0) < 30
    ) {
      stalledDrips.push(r);
    }
  }

  return {
    new1on1Applicants,
    newSeminarSignups,
    newDripEnrolls,
    newPaidCustomers,
    stalledDrips,
  };
}

// ─── KV: coaching-app:* (cohort2 applicants) ──────────────────────────

async function scanCohort2Applicants() {
  if (!process.env.KV_REST_API_URL) return [];
  try {
    const keys = await kv.keys('coaching-app:*');
    if (!keys.length) return [];
    const values = await kv.mget(...keys);
    const cutoff = Date.now() - ONE_DAY_MS;
    const apps = [];
    for (const v of values) {
      if (!v) continue;
      const submittedAt = v.submittedAt ? new Date(v.submittedAt).getTime() : 0;
      if (submittedAt > cutoff) apps.push(v);
    }
    return apps;
  } catch {
    return [];
  }
}

// ─── KV: cron-fired flags ─────────────────────────────────────────────

async function checkCronHealth() {
  const flags = [
    'cohort-saturday-fired',
    'cohort-sunday-fired',
    'seminar-broadcast-fired',
  ];
  const out = {};
  for (const flag of flags) {
    try {
      const val = await kv.get(flag);
      out[flag] = val?.firedAt || null;
    } catch {
      out[flag] = null;
    }
  }
  return out;
}

// ─── Render HTML ──────────────────────────────────────────────────────

function fmtMoney(n) {
  return `$${(n || 0).toFixed(2)}`;
}

function fmtTime(unixSec) {
  // Format Unix timestamp as CDT (UTC-5). DST: CDT = UTC-5.
  const d = new Date(unixSec * 1000);
  const hours = (d.getUTCHours() - 5 + 24) % 24;
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  return `${hh}:${mm}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function renderHtml(data) {
  const { stripe, drip, cohort2, cron, scannedCount } = data;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const buyerRows = stripe.succeeded
    .sort((a, b) => a.created - b.created)
    .map(
      (c) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #F0EDE5;font-family:monospace;font-size:12px;color:#7A7A7A;">${fmtTime(c.created)} CDT</td><td style="padding:6px 10px;border-bottom:1px solid #F0EDE5;">${escapeHtml(c.billing_details?.name || '—')}</td><td style="padding:6px 10px;border-bottom:1px solid #F0EDE5;font-size:12px;color:#7A7A7A;">${escapeHtml(c.billing_details?.email || '')}</td><td style="padding:6px 10px;border-bottom:1px solid #F0EDE5;font-weight:600;text-align:right;">${fmtMoney(c.amount / 100)}</td><td style="padding:6px 10px;border-bottom:1px solid #F0EDE5;font-size:12px;color:${c.metadata?.store_id === BPCURES_STORE_ID ? '#B85A36' : '#4A6741'};">${c.metadata?.store_id === BPCURES_STORE_ID ? 'bpcures' : 'bpquiz'}</td></tr>`
    )
    .join('');

  const tierRows = Object.entries(stripe.tierMix)
    .sort((a, b) => b[1] - a[1])
    .map(([tier, count]) => `<tr><td style="padding:4px 8px;font-size:13px;">${escapeHtml(tier)}</td><td style="padding:4px 8px;text-align:right;font-weight:600;">${count}</td></tr>`)
    .join('');

  const applicantsBlock = drip.new1on1Applicants.length
    ? drip.new1on1Applicants
        .map(
          (a) =>
            `<div style="background:#FFF9E6;border-left:3px solid #B85A36;padding:10px 14px;margin-bottom:8px;border-radius:6px;"><strong style="color:#2C3E50;">${escapeHtml(a.firstName || '—')}</strong> &middot; <a href="mailto:${escapeHtml(a.email)}" style="color:#B85A36;">${escapeHtml(a.email)}</a></div>`
        )
        .join('')
    : '<p style="color:#9A9A9A;font-style:italic;margin:0;">No new /1on1 applications.</p>';

  const cohort2Block = cohort2.length
    ? cohort2
        .map(
          (a) =>
            `<div style="background:#FFF9E6;border-left:3px solid #B85A36;padding:10px 14px;margin-bottom:8px;border-radius:6px;"><strong>${escapeHtml(a.name || '—')}</strong> &middot; <a href="mailto:${escapeHtml(a.email)}" style="color:#B85A36;">${escapeHtml(a.email)}</a> &middot; ${escapeHtml(a.phone || 'no phone')}<br/><span style="font-size:13px;color:#5A5A5A;">Range: ${escapeHtml(a.investmentRange || '—')} &middot; Age: ${escapeHtml(a.ageRange || '—')} &middot; On meds: ${escapeHtml(a.bpMeds || '—')}</span></div>`
        )
        .join('')
    : '<p style="color:#9A9A9A;font-style:italic;margin:0;">No new /cohort2 applications.</p>';

  const seminarBlock = drip.newSeminarSignups.length
    ? `<p style="margin:0;color:#3A3A3A;">${drip.newSeminarSignups.length} new signup${drip.newSeminarSignups.length === 1 ? '' : 's'} to the seminar last 24h.</p>`
    : '<p style="color:#9A9A9A;font-style:italic;margin:0;">No new seminar signups.</p>';

  const bigTicketBlock = stripe.bigTicket.length
    ? stripe.bigTicket
        .map(
          (c) =>
            `<div style="background:#E8F1E5;border-left:3px solid #4A6741;padding:10px 14px;margin-bottom:8px;border-radius:6px;"><strong>${escapeHtml(c.billing_details?.name || '—')}</strong> &middot; ${fmtMoney(c.amount / 100)} &middot; <a href="mailto:${escapeHtml(c.billing_details?.email || '')}" style="color:#4A6741;">${escapeHtml(c.billing_details?.email || '')}</a></div>`
        )
        .join('')
    : '<p style="color:#9A9A9A;font-style:italic;margin:0;">No big-ticket purchases ($50+) last 24h.</p>';

  const cronRows = Object.entries(cron)
    .map(([flag, firedAt]) => {
      const status = firedAt
        ? `<span style="color:#4A6741;">✓ ${escapeHtml(firedAt.slice(0, 10))}</span>`
        : '<span style="color:#9A9A9A;">— not fired recently</span>';
      return `<tr><td style="padding:4px 8px;font-family:monospace;font-size:12px;">${escapeHtml(flag)}</td><td style="padding:4px 8px;font-size:13px;">${status}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#2C3E50;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#FFFFFF;border-radius:16px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:24px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks Daily Digest</div>
        <div style="font-size:14px;color:#7A7A7A;margin-top:4px;">${escapeHtml(today)} &middot; covers the last 24 hours</div>
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:500;margin:0 0 14px;color:#2C3E50;">📊 Sales</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#F5F1E8;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
          <tr>
            <td style="padding:10px 14px;font-size:24px;font-weight:700;color:#2C3E50;">${fmtMoney(stripe.totalRevenue)}</td>
            <td style="padding:10px 14px;font-size:14px;color:#5A5A5A;text-align:right;">
              ${stripe.totalCharges} charges &middot; ${stripe.uniqueCustomers} unique buyers<br/>
              <span style="color:#4A6741;">bpquiz: ${fmtMoney(stripe.bpquizRevenue)}</span> &middot; <span style="color:#B85A36;">bpcures: ${fmtMoney(stripe.bpcuresRevenue)}</span>
            </td>
          </tr>
        </table>

        ${tierRows ? `
        <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A7A7A;margin:0 0 6px;">Tier mix</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAFAFA;border-radius:8px;margin-bottom:18px;">${tierRows}</table>
        ` : ''}

        ${buyerRows ? `
        <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7A7A7A;margin:0 0 6px;">All buyers (last 24h)</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAFAFA;border-radius:8px;font-size:13px;margin-bottom:18px;">
          <thead><tr style="background:#F0EDE5;"><th style="text-align:left;padding:6px 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7A7A7A;">Time</th><th style="text-align:left;padding:6px 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7A7A7A;">Name</th><th style="text-align:left;padding:6px 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7A7A7A;">Email</th><th style="text-align:right;padding:6px 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7A7A7A;">Amt</th><th style="text-align:left;padding:6px 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7A7A7A;">Site</th></tr></thead>
          ${buyerRows}
        </table>
        ` : '<p style="color:#9A9A9A;font-style:italic;">No sales last 24h.</p>'}

        ${stripe.refundCount > 0 || stripe.failedCount > 0
          ? `<div style="background:#FCE7E7;border-left:3px solid #C53030;padding:10px 14px;margin-bottom:18px;border-radius:6px;font-size:13px;">
              ${stripe.refundCount > 0 ? `<strong>${stripe.refundCount}</strong> refund${stripe.refundCount === 1 ? '' : 's'}` : ''}
              ${stripe.refundCount > 0 && stripe.failedCount > 0 ? ' &middot; ' : ''}
              ${stripe.failedCount > 0 ? `<strong>${stripe.failedCount}</strong> failed charge${stripe.failedCount === 1 ? '' : 's'}` : ''}
            </div>`
          : ''}
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">📋 New /1on1 Applications</h2>
        ${applicantsBlock}
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">📝 New /cohort2 Applications</h2>
        ${cohort2Block}
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">💎 Big-Ticket Purchases ($50+)</h2>
        ${bigTicketBlock}
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">🎙️ New Seminar Signups</h2>
        ${seminarBlock}
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">🩺 Pipeline Health</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#3A3A3A;background:#FAFAFA;border-radius:8px;">
          <tr><td style="padding:6px 10px;">New drip enrollments (24h)</td><td style="padding:6px 10px;text-align:right;font-weight:600;">${drip.newDripEnrolls.length}</td></tr>
          <tr><td style="padding:6px 10px;">New paid customers (24h)</td><td style="padding:6px 10px;text-align:right;font-weight:600;">${drip.newPaidCustomers.length}</td></tr>
          <tr><td style="padding:6px 10px;">Stalled drips (no send 48h+, opted-in)</td><td style="padding:6px 10px;text-align:right;font-weight:600;color:${drip.stalledDrips.length > 10 ? '#C53030' : '#5A5A5A'};">${drip.stalledDrips.length}</td></tr>
          <tr><td style="padding:6px 10px;">Total drip records scanned</td><td style="padding:6px 10px;text-align:right;color:#7A7A7A;">${scannedCount}</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:20px 28px 0;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:500;margin:0 0 10px;color:#2C3E50;">⏰ Recent Cron Heartbeats</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;background:#FAFAFA;border-radius:8px;">
          ${cronRows}
        </table>
      </td></tr>

      <tr><td style="padding:24px 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:0 0 16px;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          Fired by /api/daily-digest cron. To stop, remove the cron entry in vercel.json. To change recipients or sections, edit api/daily-digest.js.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const startedAt = Date.now();
  const errors = [];

  // Parallel fetches where possible
  const [stripeRes, disputesRes, dripRes, cohort2Apps, cronFlags] = await Promise.all([
    fetchStripeChargesLast24h().catch((e) => ({ error: e.message, charges: [] })),
    fetchStripeDisputesLast24h().catch(() => []),
    scanDripRecords().catch((e) => ({ error: e.message, records: [] })),
    scanCohort2Applicants().catch(() => []),
    checkCronHealth().catch(() => ({})),
  ]);

  if (stripeRes.error) errors.push(`stripe: ${stripeRes.error}`);
  if (dripRes.error) errors.push(`drip: ${dripRes.error}`);

  const stripe = classifyCharges(stripeRes.charges || []);
  stripe.disputes = disputesRes;
  const drip = classifyDrip(dripRes.records || []);

  const data = {
    stripe,
    drip,
    cohort2: cohort2Apps,
    cron: cronFlags,
    scannedCount: (dripRes.records || []).length,
  };

  const html = renderHtml(data);

  try {
    const r = await getResend().emails.send({
      from: FROM,
      to: [TO],
      replyTo: 'braveworksrn@gmail.com',
      subject: `📊 BraveWorks Daily Digest — ${fmtMoney(stripe.totalRevenue)} · ${stripe.totalCharges} sales · ${drip.new1on1Applicants.length + cohort2Apps.length} applicants`,
      html,
    });
    return res.status(200).json({
      ok: true,
      sent: true,
      resendId: r.data?.id,
      summary: {
        revenue: stripe.totalRevenue,
        sales: stripe.totalCharges,
        new1on1: drip.new1on1Applicants.length,
        newCohort2: cohort2Apps.length,
        newSeminar: drip.newSeminarSignups.length,
        stalled: drip.stalledDrips.length,
        scanned: data.scannedCount,
      },
      errors,
      runtimeMs: Date.now() - startedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'send_failed', detail: err.message, errors });
  }
}
