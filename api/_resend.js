// api/_resend.js — the ONE Resend client for this repo. Drop-in for
// `import { Resend } from 'resend'`: same constructor, same `.emails.send()`
// and `.batch.send()`; every outgoing email leaves with a `campaign` tag and
// bumps a KV `sent` counter so open/click rates can be computed per campaign.
//
// Why: 2026-08-23 audit — 4,000 sends, zero carried a campaign tag, so the
// Resend webhook (api/resend-bounce.js) had nothing to bucket opens/clicks by.
//
// Campaign resolution, first match wins:
//   1. payload.tags already has { name: 'campaign' }  → keep it (slugified)
//   2. payload.campaign  (non-standard field, stripped before send)
//   3. payload.headers['X-Campaign']
//   4. new Resend(key, { campaign }) instance default
//   5. slug of the subject line (stable for transactional sends)
//
// KV keys (Upstash REST, read at call time so scripts + dotenv work):
//   email:stats:<campaign>:sent            INCR per accepted send
//   email:stats:<campaign>:last_sent_at    ISO string
//   email:stats:campaigns                  SET index of campaign slugs
// The webhook adds delivered/opened/clicked/bounced/complained under the
// same prefix. Reporting: scripts/email-stats.mjs.
//
// All KV writes are best-effort — a KV hiccup never blocks a send.

import { Resend as BaseResend } from 'resend';

export const STATS_PREFIX = 'email:stats:';
export const CAMPAIGN_INDEX_KEY = 'email:stats:campaigns';

// Resend tag rules: ASCII letters, numbers, underscores, dashes; ≤256 chars.
export function campaignSlug(input) {
  const s = String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')    // strip accents
    .replace(/[^A-Za-z0-9_-]+/g, '-')    // everything else → dash
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return s || 'untagged';
}

function tagValue(tags, name) {
  if (!Array.isArray(tags)) return null;
  const t = tags.find((x) => x && x.name === name && x.value != null && String(x.value) !== '');
  return t ? String(t.value) : null;
}

// Fallback when nobody named the campaign: a low-cardinality slug of the
// subject. Strips the parts that vary per send (emails, $ amounts,
// parentheticals, {{merge}} fields) so "Kit-email send FAILED for a@b.com
// ($27.00)" and "... for c@d.com ($97.00)" land in the same bucket.
// Internal/ops sends (noreply@ or "Ops <") get an `ops-` prefix so they
// never masquerade as customer campaigns in the report.
export function subjectFallback(payload) {
  const subject = String(payload?.subject || '');
  if (!subject) return 'untagged';
  const from = String(payload?.from || '');
  const isOps = /noreply@|ops\s*</i.test(from) || /^\s*\[(ALERT|ACTION|stripe-event|SAMSON ORDER)\]/i.test(subject);
  const cleaned = subject
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ')
    .replace(/\$\s?[\d,]+(\.\d+)?/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]/g, '$1 ')
    .replace(/[—–:]+/g, ' ')
    .trim()
    .slice(0, 70);
  return `${isOps ? 'ops-' : 'subj-'}${cleaned}`;
}

export function resolveCampaign(payload, instanceDefault) {
  const fromTags = tagValue(payload?.tags, 'campaign');
  const raw =
    fromTags ||
    payload?.campaign ||
    payload?.headers?.['X-Campaign'] ||
    payload?.headers?.['x-campaign'] ||
    instanceDefault ||
    subjectFallback(payload);
  return campaignSlug(raw);
}

// Returns a NEW payload with the campaign tag guaranteed and the
// non-standard `campaign` field removed. Never mutates the caller's object.
export function withCampaignTag(payload, instanceDefault) {
  if (!payload || typeof payload !== 'object') return payload;
  const campaign = resolveCampaign(payload, instanceDefault);
  const { campaign: _drop, ...rest } = payload;
  const existing = Array.isArray(rest.tags) ? rest.tags.filter((t) => t && t.name) : [];
  const tags = existing.some((t) => t.name === 'campaign')
    ? existing.map((t) => (t.name === 'campaign' ? { name: 'campaign', value: campaign } : t))
    : [{ name: 'campaign', value: campaign }, ...existing];
  // Resend rejects tag values with illegal chars — sanitize every tag value.
  const clean = tags.map((t) => ({ name: campaignSlug(t.name), value: campaignSlug(t.value) }));
  return { ...rest, tags: clean, __campaign: campaign };
}

// ── Upstash REST (no SDK import so this file is safe in api/ and scripts/) ──
async function kvPipeline(commands) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || !commands.length) return null;
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!r.ok) {
      console.warn(`[_resend] kv pipeline ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (err) {
    console.warn(`[_resend] kv pipeline error: ${err.message}`);
    return null;
  }
}

// counts: { [campaign]: n }
export async function recordSent(counts) {
  const now = new Date().toISOString();
  const cmds = [];
  for (const [campaign, n] of Object.entries(counts)) {
    if (!n) continue;
    cmds.push(['INCRBY', `${STATS_PREFIX}${campaign}:sent`, n]);
    cmds.push(['SET', `${STATS_PREFIX}${campaign}:last_sent_at`, now]);
    cmds.push(['SETNX', `${STATS_PREFIX}${campaign}:first_sent_at`, now]);
    cmds.push(['SADD', CAMPAIGN_INDEX_KEY, campaign]);
  }
  return kvPipeline(cmds);
}

export class Resend extends BaseResend {
  /**
   * @param {string} [key]  Resend API key (defaults to RESEND_API_KEY)
   * @param {{ campaign?: string }} [opts]  instance-level default campaign slug
   */
  constructor(key, opts = {}) {
    super(key);
    this.defaultCampaign = opts.campaign ? campaignSlug(opts.campaign) : null;

    // The SDK's send() delegates to create(); wrapping create() covers both
    // entry points exactly once (wrapping send() AND aliasing create would
    // recurse).
    const emails = this.emails;
    const origCreate = emails.create.bind(emails);
    emails.create = async (payload, options) => {
      const { __campaign, ...p } = withCampaignTag(payload, this.defaultCampaign) || {};
      const out = await origCreate(p, options);
      if (out && !out.error) await recordSent({ [__campaign]: 1 });
      return out;
    };

    const batch = this.batch;
    const origBatchCreate = batch.create.bind(batch);
    batch.create = async (payloads, options) => {
      const counts = {};
      const clean = (Array.isArray(payloads) ? payloads : []).map((m) => {
        const { __campaign, ...p } = withCampaignTag(m, this.defaultCampaign) || {};
        counts[__campaign] = (counts[__campaign] || 0) + 1;
        return p;
      });
      const out = await origBatchCreate(clean, options);
      if (out && !out.error) await recordSent(counts);
      return out;
    };
  }
}

export default Resend;
