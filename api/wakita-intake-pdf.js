// GET /api/wakita-intake-pdf?id=<intakeId>
//
// Streams the branded PDF of Wakita's submitted intake as
// application/pdf. Called from the success page's "Download" button.
//
// If `id` is omitted, falls back to the most recent submission so Joel
// can always grab the latest. Returns 404 if no intake exists yet.

import { kv } from '@vercel/kv';
import { generateWakitaPDF } from './_wakita-pdf.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
