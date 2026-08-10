// Generates the BLANK printable version of the Accelerator intake: every
// question with real checkboxes and write-on lines, so a member who would
// rather sit at the kitchen table with a pen can do that instead of filling
// 123 fields on a phone.
//
// Renders from the same api/_accelerator-questions.js the live form uses, so
// the paper copy can never fall out of sync with the web copy.

import PDFDocument from 'pdfkit';
import { SECTIONS } from './_accelerator-questions.js';

const INK = '#2C2A26';
const MUTED = '#9C9485';
const SAGE = '#3F5A3C';
const CLAY = '#B85A36';
const BORDER = '#D8CFBD';
const RULE = '#C9BFA8';

const M = 56;              // page margin
const BOX = 9;             // checkbox size

export function generateBlankAcceleratorPDF() {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: M, bottom: M, left: M, right: M },
        bufferPages: true,
        info: {
          Title: 'Life Change Accelerator — Assessment (print and fill in)',
          Author: 'Joel Polley, RN and Annie Chitate, RN — BraveWorks',
          Subject: 'Printable intake form',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - M * 2;
      const bottomLimit = () => doc.page.height - M - 30;
      const need = (h) => { if (doc.y + h > bottomLimit()) { doc.addPage(); doc.y = M; } };

      // ── Cover header ──────────────────────────────────
      doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
        .text('LIFE CHANGE ACCELERATOR · FOUNDING COHORT', M, M, { characterSpacing: 1.5 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(24)
        .text('Your Assessment', M, doc.y + 6);
      doc.fillColor(MUTED).font('Helvetica').fontSize(11)
        .text(
          'Fill this in by hand if that is easier for you, then bring it to your 1:1 or snap a photo and email it to braveworksrn@gmail.com. ' +
          'You can also fill it in online at bpquiz.com/accelerator-assessment, whichever you prefer. Skip anything that does not apply.',
          M, doc.y + 8, { width: W, lineGap: 2 }
        );

      doc.moveTo(M, doc.y + 12).lineTo(doc.page.width - M, doc.y + 12)
        .strokeColor(BORDER).lineWidth(1).stroke();
      doc.y += 24;

      // Name/date line so a printed sheet is identifiable on paper.
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('NAME', M, doc.y, { characterSpacing: 0.8 });
      const nameY = doc.y + 12;
      doc.moveTo(M, nameY).lineTo(M + W * 0.62, nameY).strokeColor(RULE).lineWidth(0.7).stroke();
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
        .text('DATE', M + W * 0.68, doc.y - 10, { characterSpacing: 0.8 });
      doc.moveTo(M + W * 0.68, nameY).lineTo(M + W, nameY).strokeColor(RULE).lineWidth(0.7).stroke();
      doc.y = nameY + 20;

      // ── Sections ──────────────────────────────────────
      for (const section of SECTIONS) {
        need(70);

        doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(13)
          .text(section.title.toUpperCase(), M, doc.y, { characterSpacing: 1 });
        doc.moveTo(M, doc.y + 3).lineTo(doc.page.width - M, doc.y + 3)
          .strokeColor(BORDER).lineWidth(0.6).stroke();
        doc.y += 10;

        if (section.blurb) {
          doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9)
            .text(section.blurb, M, doc.y, { width: W, lineGap: 1 });
          doc.y += 6;
        }

        for (const f of section.fields) {
          if (f.kind === 'note') {
            need(28);
            doc.fillColor(SAGE).font('Helvetica-Oblique').fontSize(9)
              .text(f.text, M + 8, doc.y, { width: W - 8, lineGap: 1 });
            doc.y += 8;
            continue;
          }

          // Question label
          const labelH = doc.font('Helvetica-Bold').fontSize(10).heightOfString(f.label, { width: W });
          need(labelH + 30);
          doc.fillColor(INK).font('Helvetica-Bold').fontSize(10)
            .text(f.label + (f.required ? ' *' : ''), M, doc.y, { width: W, lineGap: 1 });
          doc.y += 4;

          if (f.kind === 'radio' || f.kind === 'checks') {
            // Two columns when the choices are short, one when they are long.
            const longest = Math.max(...f.choices.map((c) => c.length));
            const cols = longest <= 34 && f.choices.length > 3 ? 2 : 1;
            const colW = cols === 2 ? (W - 16) / 2 : W;

            for (let i = 0; i < f.choices.length; i += cols) {
              const row = f.choices.slice(i, i + cols);
              const rowH = Math.max(...row.map((c) =>
                doc.font('Helvetica').fontSize(10).heightOfString(c, { width: colW - BOX - 8 })
              ));
              need(rowH + 8);
              const yStart = doc.y;
              row.forEach((choice, ci) => {
                const x = M + ci * (colW + 16);
                doc.rect(x, yStart + 1.5, BOX, BOX)
                  .strokeColor(f.kind === 'checks' ? SAGE : MUTED).lineWidth(0.8).stroke();
                doc.fillColor(INK).font('Helvetica').fontSize(10)
                  .text(choice, x + BOX + 6, yStart, { width: colW - BOX - 8, lineGap: 1 });
              });
              doc.y = yStart + rowH + 4;
            }
            doc.y += 4;
          } else {
            // Write-on rules. Textareas get more lines than single inputs.
            const lines = f.kind === 'textarea' ? Math.max(2, Math.min(f.rows || 3, 4)) : 1;
            for (let i = 0; i < lines; i++) {
              need(20);
              const ly = doc.y + 12;
              doc.moveTo(M, ly).lineTo(doc.page.width - M, ly)
                .strokeColor(RULE).lineWidth(0.6).stroke();
              doc.y = ly + 5;
            }
            doc.y += 4;
          }
        }

        doc.y += 8;
      }

      // ── Footer on every page ──────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const fy = doc.page.height - 40;
        doc.moveTo(M, fy).lineTo(doc.page.width - M, fy)
          .strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
        doc.text(
          'Education alongside your doctor, never instead of your doctor. Never start, stop, or adjust any medication on your own.',
          M, fy + 8, { width: W - 90, align: 'left', lineBreak: false }
        );
        doc.text(
          `Page ${i - range.start + 1} of ${range.count}`,
          doc.page.width - M - 80, fy + 8,
          { width: 80, align: 'right', lineBreak: false }
        );
        doc.page.margins.bottom = origBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
