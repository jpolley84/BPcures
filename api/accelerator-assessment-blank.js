// GET /api/accelerator-assessment-blank
//
// Streams the printable blank intake. Public on purpose: it contains no member
// data, only the questions, and members need to reach it from the form without
// any token. Cached at the edge since it only changes when the questions do.

import { generateBlankAcceleratorPDF } from './_accelerator-blank-pdf.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pdf = await generateBlankAcceleratorPDF();
    res.setHeader('Content-Type', 'application/pdf');
    // inline so phones preview it; the browser's own share sheet handles saving
    res.setHeader('Content-Disposition', 'inline; filename="Life-Change-Accelerator-Assessment.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('accelerator-assessment-blank:', err);
    return res.status(500).json({ error: 'Could not render the printable form' });
  }
}
