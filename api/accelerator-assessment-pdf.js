// GET /api/accelerator-assessment-pdf?id=<assessmentId>
//
// Streams one member's intake as a PDF. Two callers:
//   - the member, straight after submitting (they have their own id, and the
//     id is unguessable, so no passcode for that path)
//   - Joel, from the read-all view at /api/accelerator-assessments, which is
//     passcode gated; passing the same passcode here is also accepted so the
//     links in that view keep working.

import { kv } from '@vercel/kv';
import { generateAcceleratorPDF } from './_accelerator-pdf.js';
import { formatAnswer } from './_accelerator-schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = String(req.query.id || '').trim();
  if (!id || !/^accel_[a-z0-9_]+$/i.test(id)) {
    return res.status(400).json({ error: 'Missing or malformed id' });
  }

  try {
    const record = await kv.get(`bwbp:accel:intake:${id}`);
    if (!record || !record.answers) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const pdf = await generateAcceleratorPDF({
      answers: record.answers,
      submittedAt: record.submittedAt,
    });

    const safeName = (formatAnswer(record.answers.full_name) || 'member')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Accelerator-Intake-${safeName}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('accelerator-assessment-pdf:', err);
    return res.status(500).json({ error: 'Could not render that assessment' });
  }
}
