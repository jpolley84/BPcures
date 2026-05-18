// GET /api/wakita-intake-pdf?id=<intakeId>
//
// Streams the branded PDF of Wakita's submitted intake as
// application/pdf. Called from the success page's "Download" button.
//
// If `id` is omitted, falls back to the most recent submission so Joel
// can always grab the latest. Returns 404 if no intake exists yet.

import { kv } from '@vercel/kv';
import crypto from 'node:crypto';
import { generateWakitaPDF } from './_wakita-pdf.js';

function tokensMatch(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string') return false;
  if (!supplied || !expected) return false;
  if (supplied.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2026-05-14 hardening (audit P0-1): require WAKITA_INTAKE_SECRET token
  // to gate this endpoint. Without env var, URL obscurity is the bridge
  // (intake URL is texted privately to Wakita). When env var is set, the
  // token check is enforced as designed.
  //
  // 2026-05-17 fix: matches the softening in /api/wakita-intake.js — both
  // endpoints need the same gate behavior or the success page's PDF
  // download button breaks while the submit endpoint works.
  const expectedToken = process.env.WAKITA_INTAKE_SECRET || '';
  if (expectedToken) {
    const supplied =
      (req.query?.token && String(req.query.token)) ||
      String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() ||
      '';
    if (!tokensMatch(supplied, expectedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('wakita-intake-pdf: WAKITA_INTAKE_SECRET not set — running ungated.');
  }

  const id = String(req.query?.id || '').trim();

  if (!process.env.KV_REST_API_URL) {
    return res.status(503).json({ error: 'KV not configured' });
  }

  try {
    let key;
    if (id && /^\d+$/.test(id)) {
      key = `wakita-intake:${id}`;
    } else {
      // Fallback to latest pointer
      const latest = await kv.get('wakita-intake:latest');
      if (!latest || !latest.intakeId) {
        return res.status(404).json({ error: 'No intake submitted yet' });
      }
      key = `wakita-intake:${latest.intakeId}`;
    }

    const record = await kv.get(key);
    if (!record || !record.answers) {
      return res.status(404).json({ error: 'Intake not found (or expired after 90 days)' });
    }

    const pdfBuffer = await generateWakitaPDF({
      answers: record.answers,
      submittedAt: record.submittedAt || new Date().toISOString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="wakita-intake.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('wakita-intake-pdf: error', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
