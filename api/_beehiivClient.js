// _beehiivClient.js — minimal beehiiv API v2 helper used by lead-magnet.js
// and stripe-webhook.js for subscriber upsert + tag application.
//
// The leading underscore is a Vercel convention: files prefixed with _
// are NOT exposed as serverless function endpoints. Pure helper module.
//
// Why beehiiv: 2026-05-06 cutover from Mailchimp. MC was over the
// subs/sends limit and deliverability was sliding; beehiiv handles the
// 30-Day Reset drip + broadcasts + creator monetization in one place.
// Transactional email stays on Resend.
//
// Usage:
//   import { upsertSubscriber, addTags, BEEHIIV_AVAILABLE } from './_beehiivClient.js';
//   await upsertSubscriber({
//     email: 'jane@example.com',
//     customFields: { FNAME: 'Jane', CONCERN: 'blood_pressure', RISK_SCORE: 7 },
//     tags: ['bpquiz-taker', 'tier-1'],
//     utmSource: 'bpquiz_landing',
//   });

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

export const BEEHIIV_AVAILABLE = Boolean(
  process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUB_ID
);

function pubPath(path) {
  return `/publications/${process.env.BEEHIIV_PUB_ID}${path}`;
}

async function bh(method, path, body) {
  if (!BEEHIIV_AVAILABLE) {
    throw new Error('BEEHIIV_API_KEY or BEEHIIV_PUB_ID not configured');
  }
  const res = await fetch(`${BEEHIIV_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  if (!res.ok) {
    const err = new Error(`beehiiv ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return parsed;
}

// ─── Subscriber upsert ────────────────────────────────────────────────
// beehiiv's POST /subscriptions creates OR re-activates an existing
// subscriber. We pass reactivate_existing=true so a returning quiz-taker
// doesn't bounce. After upsert we PATCH custom fields + POST tags.
export async function upsertSubscriber({
  email,
  customFields = {},
  tags = [],
  utmSource = 'bpquiz_api',
  utmMedium = '',
  utmCampaign = '',
  referringSite = '',
  sendWelcomeEmail = false,
}) {
  if (!email || !email.includes('@')) {
    throw new Error(`upsertSubscriber: invalid email "${email}"`);
  }

  // 1. Subscribe (or re-activate)
  const customFieldsArr = Object.entries(customFields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([name, value]) => ({ name, value: String(value) }));

  const subPayload = {
    email: email.trim(),
    reactivate_existing: true,
    send_welcome_email: sendWelcomeEmail,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    referring_site: referringSite,
  };
  if (customFieldsArr.length) subPayload.custom_fields = customFieldsArr;

  const subRes = await bh('POST', pubPath('/subscriptions'), subPayload);
  const subId = subRes?.data?.id;
  if (!subId) {
    throw new Error(`upsertSubscriber: no subscription id in response: ${JSON.stringify(subRes).slice(0, 200)}`);
  }

  // 2. Apply tags (separate endpoint)
  if (tags.length) {
    await addTags(subId, tags);
  }

  return { id: subId, email: subRes.data.email, status: subRes.data.status };
}

// ─── Tag application ──────────────────────────────────────────────────
// POST /publications/{pub}/subscriptions/{sub}/tags appends tags. Existing
// tags are preserved. Pass an array of strings.
export async function addTags(subId, tags) {
  if (!tags || tags.length === 0) return null;
  const cleaned = tags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
  if (cleaned.length === 0) return null;
  return bh('POST', pubPath(`/subscriptions/${subId}/tags`), { tags: cleaned });
}

// ─── Lookup ───────────────────────────────────────────────────────────
// GET /subscriptions/by_email/{email} — returns null on 404 instead of throwing.
export async function getSubscriberByEmail(email) {
  try {
    const r = await bh('GET', pubPath(`/subscriptions/by_email/${encodeURIComponent(email)}`));
    return r?.data || null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

// ─── Convenience: tag a subscriber by email ───────────────────────────
// Used by stripe-webhook.js to tag-on-buy without needing to track sub IDs.
// Looks up the subscription by email first, creates if missing, then tags.
export async function tagByEmail({ email, tags, customFields = {}, utmSource = 'stripe_purchase' }) {
  let sub = await getSubscriberByEmail(email);
  if (!sub) {
    // Subscriber doesn't exist yet — create them with tags + fields
    return upsertSubscriber({ email, customFields, tags, utmSource, sendWelcomeEmail: false });
  }
  // Existing subscriber — apply custom fields via PATCH, then tags
  const customFieldsArr = Object.entries(customFields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([name, value]) => ({ name, value: String(value) }));
  if (customFieldsArr.length) {
    await bh('PATCH', pubPath(`/subscriptions/${sub.id}`), { custom_fields: customFieldsArr });
  }
  if (tags.length) await addTags(sub.id, tags);
  return { id: sub.id, email: sub.email, status: sub.status };
}
