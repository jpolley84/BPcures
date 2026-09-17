// api/birthday-broadcast.js — invite sequence for Joel's birthday masterclass
// (Friday 2026-09-18, 11 AM CT, bpquiz.com/birthday), both lists (2026-09-17).
//
// ?list=joel   Joel's list: drip:* + bwbp:drip:*, minus unsubscribed, paused, and
//              current coaching clients (state tier-4). Same audience rules as
//              api/joel-masterclass-broadcast.js.
// ?list=annie  Annie's list: KV hash rhhmc:segment (her export minus Joel's list,
//              loaded 2026-09-14 by scripts/load-annie-masterclass-segment-2026-09-14.mjs),
//              minus Resend audience RESEND_RHH_UNSUB_AUDIENCE_ID. Same rules as
//              api/annie-masterclass-broadcast.js.
//
// SAFETY MODEL (per /send-campaign):
//   - Default is DRY-RUN: counts eligibles and returns 3 rendered samples. Sends nothing.
//   - Send requires ?mode=send&list=<joel|annie>&email=<N> AND header
//     `x-confirm: SEND-BIRTHDAY-<LIST>-<N>` (e.g. SEND-BIRTHDAY-JOEL-1).
//   - No cron. Every fire is manual.
//   - Resume-safe: KV set bdayblast:<list>:sent:<N>. A 250s fire moves about
//     1,400 emails; re-fire until eligible is 0.
//
// Auth: isAuthorizedCron (Authorization: Bearer $CRON_SECRET).

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM as JOEL_FROM, REPLY as JOEL_REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { BIRTHDAY_EMAILS } from './_birthday-emails.js';

const REGISTER_URL = 'https://bpquiz.com/birthday';
const MAX_RUN_MS = 250 * 1000;
const STOP_KEY = 'bdayblast:stop';

const ANNIE_FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const ANNIE_REPLY = 'annie@restoreherhormones.com';
const ANNIE_UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const ANNIE_SEGMENT_KEY = 'rhhmc:segment';

// ---------- Joel wrapper (matches joel-masterclass-broadcast.js) ----------
const joelUnsubUrl = (email) => `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;
function joelWrap(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);"><tr><td style="padding:30px 28px;font-size:15px;line-height:1.65;color:#2C3E50;">
${bodyHtml}
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
    BraveWorks RN &middot; Joel Polley, RN &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a><br />
    Educational content only. Not medical advice. Always complement, never replace, care from your physician.<br />
    <a href="${joelUnsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a> &middot; You're on the BraveWorks RN list at ${escapeHtml(email)}.
  </p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
const joelFooterText = (email) => `---
BraveWorks RN · Joel Polley, RN · bpquiz.com
Educational content only. Not medical advice. Always complement, never replace, care from your physician.
Unsubscribe: ${joelUnsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;

// ---------- Annie wrapper (matches annie-masterclass-broadcast.js) ----------
const annieUnsubUrl = (email) => `https://restoreherhormones.com/api/unsubscribe?email=${encodeURIComponent(email)}`;
function annieWrap(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f4f1;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.06);"><tr><td style="padding:30px 28px;font-size:16px;line-height:1.65;color:#222;">
${bodyHtml}
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
  Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.<br/>
  It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC &middot; 240 W Dixie Ave Ste 5 &middot; Elizabethtown, KY 42701<br/>
  <a href="${annieUnsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
const annieFooterText = (email) => `---
Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.
It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC · 240 W Dixie Ave Ste 5 · Elizabethtown, KY 42701

Unsubscribe: ${annieUnsubUrl(email)}`;

// ---------- Copy: generated verbatim from the approved draft ----------
// api/_birthday-emails.js holds subject, preheader, and body for joel 1-10 and
// annie 1-10. Body markup: blank line = paragraph, **x** = bold,
// [BUTTON: LABEL → url] = button, <small>x</small> = fine print, {{first_name}} = merge.
const BUTTON_RE = /^\[BUTTON: (.+?) → (\S+)\]$/;
const PLACEHOLDER_RE = /\[(GIVEAWAY PRIZE|IF REPLAY|IF NO REPLAY|REPLAY LINK)\]|\{\{ZOOM_JOIN_URL\}\}/;
const BTN_STYLE = {
  joel: { bg: '#C9A85C', ink: '#10312A' },
  annie: { bg: '#ecd88d', ink: '#1f1a16' },
};

const absUrl = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`);

function renderHtml(body, list) {
  return body.split(/\n\s*\n/).map((para) => {
    const p = para.trim();
    const b = p.match(BUTTON_RE);
    if (b) {
      const s = BTN_STYLE[list];
      return `<p style="text-align:center;margin:24px 0;"><a href="${escapeHtml(absUrl(b[2]))}" style="display:inline-block;background:${s.bg};color:${s.ink};padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">${escapeHtml(b[1])} &rarr;</a></p>`;
    }
    const small = p.match(/^<small>([\s\S]*)<\/small>$/);
    const inner = escapeHtml(small ? small[1] : p)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return small ? `<p style="font-size:12px;color:#777;">${inner}</p>` : `<p>${inner}</p>`;
  }).join('\n');
}

function renderText(body) {
  return body.split('\n').map((line) => {
    const b = line.trim().match(BUTTON_RE);
    if (b) return `${b[1]}: ${absUrl(b[2])}`;
    return line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/<\/?small>/g, '');
  }).join('\n');
}

function buildTemplate(list, emailNum) {
  const src = BIRTHDAY_EMAILS[list]?.[emailNum];
  if (!src) return null;
  const wrap = list === 'joel' ? joelWrap : annieWrap;
  const footer = list === 'joel' ? joelFooterText : annieFooterText;
  const merge = (s, name) => s.replace(/\{\{first_name\}\}/g, name);
  return {
    slot: src.slot,
    blocked: PLACEHOLDER_RE.test(src.subject + src.body) || src.subject.includes(' | '),
    subject: (name) => merge(src.subject, name),
    preheader: src.preheader,
    html: (name, email) => wrap(renderHtml(merge(src.body, name), list), src.preheader, email),
    text: (name, email) => `${renderText(merge(src.body, name))}\n${footer(email)}`,
  };
}

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function scanKeys(pattern) {
  const keys = [];
  let cursor = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: pattern, count: 500 });
    keys.push(...batch);
    cursor = next;
  } while (String(cursor) !== '0');
  return keys;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Returns [{ email, name }] eligible before the sent-set check, plus stats.
async function joelAudience() {
  const keys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  const stats = { total: 0, unsub: 0, paused: 0, coachingClient: 0, noEmail: 0, invalidEmail: 0, duplicate: 0 };
  const seen = new Set();
  const out = [];
  for (let i = 0; i < keys.length; i += 500) {
    const chunk = keys.slice(i, i + 500);
    let recs;
    try { recs = await kv.mget(...chunk); } catch { continue; }
    for (const rec of recs) {
      stats.total++;
      if (!rec || !rec.email) { stats.noEmail++; continue; }
      if (rec.unsubscribed) { stats.unsub++; continue; }
      if (rec.paused) { stats.paused++; continue; }
      if (rec.state === 'tier-4') { stats.coachingClient++; continue; }
      const email = String(rec.email).toLowerCase().trim();
      if (!EMAIL_RE.test(email)) { stats.invalidEmail++; continue; }
      if (seen.has(email)) { stats.duplicate++; continue; }
      seen.add(email);
      out.push({ email, name: (rec.firstName || '').trim() });
    }
  }
  return { people: out, stats };
}

async function annieAudience() {
  const segment = (await kv.hgetall(ANNIE_SEGMENT_KEY)) || {};
  const emails = Object.keys(segment);
  if (emails.length === 0) throw new Error('segment empty: run scripts/load-annie-masterclass-segment-2026-09-14.mjs');
  const resend = getResend();
  const unsub = new Set();
  let after;
  for (;;) {
    const { data, error } = await resend.contacts.list({ audienceId: ANNIE_UNSUB_AUDIENCE_ID, limit: 100, ...(after ? { after } : {}) });
    if (error) throw new Error('suppression list unavailable: ' + error.message); // never send without it
    const items = data?.data || [];
    for (const c of items) unsub.add(String(c.email).toLowerCase());
    if (!data?.has_more || items.length === 0) break;
    after = items[items.length - 1].id;
  }
  const stats = { segment: emails.length, unsub: 0 };
  const out = [];
  for (const email of emails) {
    const e = String(email).toLowerCase().trim();
    if (unsub.has(e)) { stats.unsub++; continue; }
    out.push({ email: e, name: String(segment[email] || '').trim() });
  }
  return { people: out, stats };
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  if (req.query?.stop === '1') {
    await kv.set(STOP_KEY, new Date().toISOString(), { ex: 3600 });
    return res.status(200).json({ ok: true, stopped: true, note: 'running fires halt within 25 sends; clears itself in 1 hour or with ?resume=1' });
  }
  if (req.query?.resume === '1') {
    await kv.del(STOP_KEY);
    return res.status(200).json({ ok: true, resumed: true });
  }

  const list = String(req.query?.list || '');
  const emailNum = Number(req.query?.email);
  const template = buildTemplate(list, emailNum);
  if (!template) return res.status(400).json({ error: `unknown list/email: list=${list} email=${req.query?.email}` });

  const wantsSend = req.query?.mode === 'send';
  if (wantsSend && template.blocked) return res.status(409).json({ error: 'this email still has a placeholder ([GIVEAWAY PRIZE], [IF REPLAY], {{ZOOM_JOIN_URL}}, or two subjects); fill it in the draft and regenerate' });
  const sendMode = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-BIRTHDAY-${list.toUpperCase()}-${emailNum}`;
  const SENT_SET = `bdayblast:${list}:sent:${emailNum}`;
  const from = list === 'joel' ? JOEL_FROM : ANNIE_FROM;
  const replyTo = list === 'joel' ? JOEL_REPLY : ANNIE_REPLY;
  const unsubFor = list === 'joel' ? joelUnsubUrl : annieUnsubUrl;
  const startedAt = Date.now();

  let audience;
  try {
    audience = list === 'joel' ? await joelAudience() : await annieAudience();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  const sentList = await kv.smembers(SENT_SET);
  const alreadySent = new Set((sentList || []).map((e) => String(e).toLowerCase()));

  const stats = { ...audience.stats, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;
  const pace = list === 'joel' ? 70 : 90;

  for (const p of audience.people) {
    if (alreadySent.has(p.email)) { stats.alreadySent++; continue; }
    stats.eligible++;
    const name = p.name || (list === 'joel' ? 'Friend' : 'Girl'); // draft's fallback rule
    const subject = template.subject(name);
    if (!sendMode) {
      if (samples.length < 3) samples.push({ email: p.email, firstName: p.name || null, slot: template.slot, blocked: template.blocked, subject, preheader: template.preheader, text: template.text(name, p.email) });
      continue;
    }
    if (Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }
    // Kill switch (2026-09-17): killing the local curl does NOT stop a running fire.
    // `?stop=1` (authorized) sets bdayblast:stop; every 25 sends the loop checks it and halts.
    if (results.sent % 25 === 0) {
      let stop = null;
      try { stop = await kv.get(STOP_KEY); } catch { /* keep sending only if KV is readable */ stop = 'kv-unreadable'; }
      if (stop) { results.stoppedByKillSwitch = true; break; }
    }
    try {
      await resend.emails.send({
        from, to: p.email, replyTo, subject,
        html: template.html(name, p.email),
        text: template.text(name, p.email),
        headers: { 'List-Unsubscribe': `<${unsubFor(p.email)}>` },
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, p.email); } catch (err) { console.warn('birthday-broadcast: sadd failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: p.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, pace));
  }

  console.log('[birthday-broadcast]', JSON.stringify({ list, emailNum, mode: sendMode ? 'SEND' : 'DRY-RUN', stats, results: sendMode ? results : undefined }));
  return res.status(200).json({
    ok: true, list, emailNum,
    mode: sendMode ? 'SEND' : 'DRY-RUN',
    from, stats,
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
