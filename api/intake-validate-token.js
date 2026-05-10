// GET /api/intake-validate-token?slug=karen-bush&token=...
//
// 200 OK   { ok: true, clientName }     — token is valid, render the form
// 404      { ok: false, error }         — no active intake for this slug
// 403      { ok: false, error }         — token mismatch
// 410      { ok: false, error }         — intake already submitted

import { checkToken } from './_intake-shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = String(req.query?.slug || '').trim();
  const token = String(req.query?.token || '').trim();

  const result = await checkToken(slug, token);
  if (!result.ok) {
    return res.status(result.status).json({ ok: false, error: result.message });
  }
  return res.status(200).json({
    ok: true,
    clientName: result.active.clientName || '',
  });
}
