// POST /api/intake-save?slug=karen-bush&token=...
//
// Body: { answers: { [qid]: string }, sectionIndex: number, lastSaved: number }
// Persists the in-progress form state. Last write wins. Token must still be
// valid (active and not yet burned).

import { checkToken, storeSet, readJsonBody } from './_intake-shared.js';

const MAX_FIELD_CHARS = 8000;
const MAX_TOTAL_CHARS = 200_000; // sanity cap on full payload

function sanitizeAnswers(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  let total = 0;
  for (const [k, v] of Object.entries(input)) {
    if (typeof k !== 'string' || k.length > 80) continue;
    const s = String(v ?? '').slice(0, MAX_FIELD_CHARS);
    out[k] = s;
    total += s.length;
    if (total > MAX_TOTAL_CHARS) {
      out[k] = s.slice(0, Math.max(0, MAX_FIELD_CHARS - (total - MAX_TOTAL_CHARS)));
      break;
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = String(req.query?.slug || '').trim();
  const token = String(req.query?.token || '').trim();

  const tk = await checkToken(slug, token);
  if (!tk.ok) {
    return res.status(tk.status).json({ ok: false, error: tk.message });
  }

  const body = await readJsonBody(req);
  const answers = sanitizeAnswers(body.answers);
  const sectionIndex = Number.isInteger(body.sectionIndex) ? body.sectionIndex : 0;
  const lastSaved = Number(body.lastSaved) || Date.now();

  const ok = await storeSet(`${slug}:progress`, { answers, sectionIndex, lastSaved });
  if (!ok) {
    return res.status(500).json({ ok: false, error: 'Save failed' });
  }
  return res.status(200).json({ ok: true, lastSaved });
}
