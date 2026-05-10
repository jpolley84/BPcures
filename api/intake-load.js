// GET /api/intake-load?slug=karen-bush&token=...
//
// Returns the saved progress JSON. 404 if nothing saved yet.

import { checkToken, storeGet } from './_intake-shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = String(req.query?.slug || '').trim();
  const token = String(req.query?.token || '').trim();

  const tk = await checkToken(slug, token);
  if (!tk.ok) {
    return res.status(tk.status).json({ ok: false, error: tk.message });
  }

  const progress = await storeGet(`${slug}:progress`);
  if (!progress) {
    return res.status(200).json({ ok: true, answers: {}, sectionIndex: 0, lastSaved: null });
  }
  return res.status(200).json({
    ok: true,
    answers: progress.answers || {},
    sectionIndex: Number.isInteger(progress.sectionIndex) ? progress.sectionIndex : 0,
    lastSaved: progress.lastSaved || null,
  });
}
