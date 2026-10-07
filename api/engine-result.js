// api/engine-result.js: hand the results page (and the printable Snapshot)
// a finished interview by session id.
//
//   GET /api/engine-result?sid=...            -> JSON, the free summary
//   GET /api/engine-result?sid=...&format=html -> the printable full Snapshot
//
// The sid is an opaque 16+ char random id the browser minted; nothing else is
// needed to read it, which matches the handoff ("email should not be
// technically required"). Results expire after 30 days (set at write time).
import { kv } from '@vercel/kv';
import { publicResult } from './engine-interview.js';
import { snapshotPage } from './_eee-email.js';

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sid = String(req.query?.sid || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (sid.length < 8 || sid.length > 64) return res.status(400).json({ error: 'badSession' });

  let record = null;
  try {
    record = await kv.get(`eee:result:${sid}`);
  } catch (err) {
    console.error('engine-result: KV read failed', err.message);
    return res.status(503).json({ error: 'unavailable' });
  }
  if (!record?.result) return res.status(404).json({ error: 'notFound' });

  res.setHeader('Cache-Control', 'private, no-store');
  if (String(req.query?.format || '') === 'html') {
    const resultsUrl = `${SITE_URL}/engine/results?sid=${encodeURIComponent(sid)}`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(snapshotPage({ result: record.result, resultsUrl }));
  }
  return res.status(200).json({
    ok: true,
    sid,
    email: record.email ? record.email.replace(/^(.).*(@.*)$/, '$1…$2') : '',
    createdAt: record.createdAt,
    result: publicResult(record.result),
  });
}
