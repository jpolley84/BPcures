// Branded PDF of a Life Change Accelerator deep intake. Returns a Buffer.
// Used by:
//   - /api/accelerator-assessment.js      attaches to the notification email
//   - /api/accelerator-assessment-pdf.js  streams one member's PDF on demand
//
// Same visual language as _johnt-pdf.js so every intake Joel receives looks
// like it came from the same practice.

import PDFDocument from 'pdfkit';
import { SECTION_MAP, formatAnswer } from './_accelerator-schema.js';

const PAPER = '#FBF8F1';
const INK = '#2C2A26';
const MUTED = '#9C9485';
const SAGE = '#3F5A3C';
const CLAY = '#B85A36';
const BORDER = '#E6DECE';

export function generateAcceleratorPDF({ answers, submittedAt }) {
  return new Promise((resolve, reject) => {
    try {
      const name = formatAnswer(answers.full_name) || 'Member';
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        bufferPages: true,
        info: {
          Title: `${name} — Life Change Accelerator Assessment`,
          Author: 'Joel Polley, RN and Annie Chitate, RN — BraveWorks',
          Subject: 'Accelerator deep intake',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header band ───────────────────────────────────
      doc.rect(0, 0, doc.page.width, 110).fill(PAPER);

      doc
        .fillColor(CLAY)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('LIFE CHANGE ACCELERATOR · FOUNDING COHORT INTAKE', 60, 50, { characterSpacing: 1.5 });

      doc.fillColor(INK).font('Helvetica-Bold').fontSize(22).text(name, 60, 65);

      const when = submittedAt ? new Date(submittedAt) : new Date();
      const date = when.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const time = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(10)
        .text(`Submitted ${date} at ${time}  ·  Prepared for Joel and Annie`, 60, 92);

      doc.moveTo(60, 122).lineTo(doc.page.width - 60, 122).strokeColor(BORDER).lineWidth(1).stroke();
      doc.y = 140;

      // ── Sections ──────────────────────────────────────
      for (const section of SECTION_MAP) {
        const populated = section.fields.filter(([id]) => {
          const v = answers[id];
          if (Array.isArray(v)) return v.length > 0;
          return String(v ?? '').trim().length > 0;
        });
        if (populated.length === 0) continue;

        if (doc.y > doc.page.height - 140) {
          doc.addPage();
          doc.y = 60;
        }

        doc
          .fillColor(SAGE)
          .font('Helvetica-Bold')
          .fontSize(13)
          .text(section.title.toUpperCase(), 60, doc.y, { characterSpacing: 1 });
        doc.moveTo(60, doc.y + 2).lineTo(doc.page.width - 60, doc.y + 2)
          .strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.moveDown(0.7);

        for (const [id, label] of populated) {
          const value = formatAnswer(answers[id]);
          if (!value) continue;

          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = 60;
          }

          doc
            .fillColor(MUTED)
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(label.toUpperCase(), { characterSpacing: 0.8 });

          doc
            .fillColor(INK)
            .font('Helvetica')
            .fontSize(11)
            .text(value, { width: doc.page.width - 120, lineGap: 2 });

          doc.moveDown(0.5);
        }

        doc.moveDown(0.4);
      }

      // ── Footer on every page ──────────────────────────
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const fy = doc.page.height - 38;
        doc.moveTo(60, fy).lineTo(doc.page.width - 60, fy)
          .strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.fillColor(MUTED).font('Helvetica').fontSize(8);
        doc.text(
          'BraveWorks RN  ·  Life Change Accelerator  ·  Confidential client intake',
          60, fy + 8,
          { width: doc.page.width - 220, align: 'left', lineBreak: false }
        );
        doc.text(
          `Page ${i - range.start + 1} of ${totalPages}`,
          doc.page.width - 130, fy + 8,
          { width: 70, align: 'right', lineBreak: false }
        );
        doc.page.margins.bottom = origBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
