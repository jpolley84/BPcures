// GET /api/johnt-assessment-pdf?id=<assessmentId>
//
// Streams the branded PDF of John Treadwell's submitted assessment as
// application/pdf. Called from the thank-you screen's "Download" button.
// If `id` is omitted, falls back to the most recent submission.

import { kv } from '@vercel/kv';
import crypto from 'node:crypto';
import { generateJohnTPDF } from './_johnt-pdf.js';

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

  const expectedToken = process.env.JOHNT_ASSESSMENT_SECRET || '';
  if (expectedToken) {
    const supplied =
      (req.query?.token && String(req.query.token)) ||
      String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() ||
      '';
    if (!tokensMatch(supplied, expectedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('johnt-assessment-pdf: JOHNT_ASSESSMENT_SECRET not set — running ungated.');
  }

  const id = String(req.query?.id || '').trim();

  if (!process.env.KV_REST_API_URL) {
    return res.status(503).json({ error: 'KV not configured' });
  }

  try {
    let key;
    if (id && /^\d+$/.test(id)) {
      key = `johnt-assessment:${id}`;
    } else {
      const latest = await kv.get('johnt-assessment:latest');
      if (!latest || !latest.assessmentId) {
        return res.status(404).json({ error: 'No assessment submitted yet' });
      }
      key = `johnt-assessment:${latest.assessmentId}`;
    }

    const record = await kv.get(key);
    if (!record || !record.answers) {
      return res.status(404).json({ error: 'Assessment not found (or expired after 90 days)' });
    }

    const pdfBuffer = await generateJohnTPDF({
      answers: record.answers,
      submittedAt: record.submittedAt || new Date().toISOString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="john-treadwell-assessment.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('johnt-assessment-pdf: error', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
