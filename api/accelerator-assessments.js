// GET /api/accelerator-assessments?pass=<OPS_DASHBOARD_PASSWORD>
//
// Joel's read-all view. Renders EVERY Accelerator intake on one printable page
// so he can sit down and build 90-day programs after the 1:1 calls without
// clicking through nine PDFs. Also accepts the X-Ops-Pass header, matching
// /api/ops-state, so it can be scripted.
//
// ?format=json returns the raw records instead of HTML.
// ?id=<assessmentId> renders just that one.
//
// Gated because this is the most sensitive data in the whole system: names,
// addresses, medications, trauma history, postnatal detail. Never make this
// endpoint public and never widen the CORS header on it.

import crypto from 'node:crypto';
import { kv } from '@vercel/kv';
import { SECTION_MAP, formatAnswer } from './_accelerator-schema.js';

function constantTimeEqual(a, b) {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  if (!expected) return { ok: false, reason: 'OPS_DASHBOARD_PASSWORD not configured' };
  const supplied = req.headers['x-ops-pass'] || req.query.pass || '';
  if (!supplied) return { ok: false, reason: 'missing passcode' };
  if (!constantTimeEqual(String(supplied), String(expected))) {
    return { ok: false, reason: 'invalid passcode' };
  }
  return { ok: true };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderOne(record) {
  const { answers = {}, submittedAt, assessmentId } = record;
  const sections = SECTION_MAP.map((s) => {
    const populated = s.fields.filter(([id]) => {
      const v = answers[id];
      if (Array.isArray(v)) return v.length > 0;
      return String(v ?? '').trim().length > 0;
    });
    if (!populated.length) return '';
    const rows = populated.map(([id, label]) => `<tr>
      <th>${esc(label)}</th><td>${esc(formatAnswer(answers[id]))}</td></tr>`).join('');
    return `<h3>${esc(s.title)}</h3><table>${rows}</table>`;
  }).join('');

  return `<article>
    <header>
      <h2>${esc(formatAnswer(answers.full_name) || '(no name)')}</h2>
      <p class="meta">${esc(answers.email || '')} &middot; submitted ${esc(new Date(submittedAt).toLocaleString('en-US'))}
      &middot; <a href="/api/accelerator-assessment-pdf?id=${esc(assessmentId)}">PDF</a></p>
    </header>
    ${sections}
  </article>`;
}

const STYLE = `
  :root { color-scheme: light; }
  body { margin:0; background:#FBF8F1; color:#2C2A26;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-family:Georgia,serif; font-size:28px; margin:0 0 4px; }
  .sub { color:#9C9485; font-size:13px; margin:0 0 28px; }
  article { background:#FFFDF7; border:1px solid #E6DECE; border-radius:14px;
            padding:22px 26px; margin:0 0 26px; page-break-after: always; }
  article header { border-bottom:2px solid #E6DECE; padding-bottom:10px; margin-bottom:6px; }
  h2 { font-family:Georgia,serif; font-size:22px; margin:0; }
  .meta { color:#9C9485; font-size:12px; margin:4px 0 0; }
  .meta a { color:#B85A36; font-weight:600; }
  h3 { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#3F5A3C;
       margin:22px 0 6px; border-bottom:1px solid #E6DECE; padding-bottom:4px; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; width:210px; vertical-align:top; padding:7px 10px 7px 0;
       color:#9C9485; font-size:10px; letter-spacing:.06em; text-transform:uppercase;
       font-weight:700; border-bottom:1px solid #F1EBDD; }
  td { padding:7px 0; font-size:14px; line-height:1.55; white-space:pre-wrap;
       border-bottom:1px solid #F1EBDD; }
  .empty { color:#9C9485; font-style:italic; }
  @media print { body{background:#fff} article{border:none;padding:0} }
`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = checkAuth(req);
  if (!auth.ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'Unauthorized', reason: auth.reason });
  }

  try {
    const single = String(req.query.id || '').trim();
    let records = [];

    if (single) {
      const r = await kv.get(`bwbp:accel:intake:${single}`);
      if (r) records = [r];
    } else {
      const ids = (await kv.smembers('bwbp:accel:intake:index')) || [];
      const fetched = await Promise.all(
        ids.map((id) => kv.get(`bwbp:accel:intake:${id}`).catch(() => null))
      );
      records = fetched.filter(Boolean);
    }

    records.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

    res.setHeader('Cache-Control', 'private, no-store');

    if (String(req.query.format || '').toLowerCase() === 'json') {
      return res.status(200).json({ ok: true, count: records.length, records });
    }

    const body = records.length
      ? records.map(renderOne).join('')
      : `<p class="empty">No assessments submitted yet.</p>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Accelerator intakes (${records.length})</title><style>${STYLE}</style></head>
<body><div class="wrap">
<h1>Life Change Accelerator intakes</h1>
<p class="sub">${records.length} submitted &middot; newest first &middot; confidential</p>
${body}
</div></body></html>`);
  } catch (err) {
    console.error('accelerator-assessments:', err);
    return res.status(500).json({ error: 'Could not load assessments' });
  }
}
