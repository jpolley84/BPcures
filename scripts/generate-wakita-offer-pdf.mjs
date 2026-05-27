// scripts/generate-wakita-offer-pdf.mjs
//
// Generates Wakita's tailored offer sheet — the asset Joel hands her on
// the 12:00 PM CT 2026-05-13 coaching call. Branded BraveWorks, single
// value-stack-style document she can re-read after the call before she
// hits the Stripe link.
//
// Inclusions (per Joel 2026-05-13):
//   - Weekly 1:1 with Joel — Mon 8 PM ET, immediately before her VIP group
//   - Biweekly Annie Chitate hormone coaching (live or group)
//   - Full supplement + diet audit
//   - Daily schedule audit
//   - Skool VIP membership access
//   - All Joel's courses (lifetime)
//   - eBook library (lifetime)
//   - WhatsApp office-hours (Sun-Thurs 9-5) for 90 days
//   - Daily educational email tailored to her with reminders + encouragement
//   - Trackers (BP / symptom / food / sleep)
//   - Partner inclusion guide
//   - Barbara O'Neill LIVE event 20% off (June 24-25 2026)
//
// Stripe links live:
//   PIF $1,997 → https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M
//   3-pay 3×$697 → https://buy.stripe.com/6oU3cv2ZJ5LEgHV6NjfnO0N
//
// Output: %TEMP%/wakita-offer.pdf

import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const OUT = 'C:/Users/jpoll/AppData/Local/Temp/wakita-offer.pdf';

const PAPER = '#FBF8F1';
const PAPER_LIGHT = '#FFFDF7';
const INK = '#2C2A26';
const INK_SOFT = '#5B564C';
const MUTED = '#9C9485';
const SAGE = '#3F5A3C';
const SAGE_SOFT = '#E6EBE0';
const CLAY = '#B85A36';
const CLAY_SOFT = '#F5E4DA';
const BORDER = '#E6DECE';
const GOLD = '#A88A4A';

// Value stack — what Wakita gets, with assigned value per Myron Golden
// "stack the value 4× the price" rule of thumb.
const STACK = [
  {
    title: 'Weekly 1:1 with Joel Polley, RN',
    detail: 'Mondays at 8:00 PM Eastern — your hour, directly before the live VIP group call so you go straight from private session into community. 12 weeks. Twelve hours of one-on-one with a 20-year nurse who has read your chart twice.',
    value: 2997,
  },
  {
    title: 'Biweekly Hormone Coaching with Annie Chitate, RN',
    detail: 'Live or group format, your choice. Annie\'s flagship postmenopausal hormone protocol — built for women 10+ years past menopause with zero HRT history. Your profile exactly. 6 sessions.',
    value: 997,
  },
  {
    title: 'Full Supplement + Diet Audit',
    detail: 'Live walk-through of every bottle in your drawer and every meal on your plate. We keep what works. We drop what doesn\'t. Most members save $200–400/month starting week 2.',
    value: 497,
  },
  {
    title: 'Daily Schedule Audit',
    detail: 'A clean-sheet rebuild of your day — when you eat, when you move, when you rest, when you take what. The schedule is the protocol.',
    value: 497,
  },
  {
    title: 'Full Skool VIP Membership',
    detail: '24/7 community of BraveWorks members on the same Triangle protocol. Monday-night live VIP calls, weekly Q&A threads, member-only resources.',
    value: 297,
  },
  {
    title: 'All BraveWorks Courses — lifetime',
    detail: 'Every course in the BraveWorks library. Yours to keep, with all future updates included.',
    value: 997,
  },
  {
    title: 'eBook Library — lifetime',
    detail: 'The full BraveWorks eBook library: the BP Reset Kit, Cortisol Cure, Blood Sugar Reset, Pressure Triangle Stack, and every new title released forever.',
    value: 497,
  },
  {
    title: 'WhatsApp Office Hours — 90 days',
    detail: 'Sunday through Thursday, 9 AM to 5 PM. Text me directly. Photo your bottle drawer. Send your BP reading. Ask the dumb question. I respond inside office hours — usually within the hour.',
    value: 997,
  },
  {
    title: 'Daily Email — tailored to YOUR program',
    detail: 'Not the public newsletter. A daily email engineered to your specific protocol — reminders, encouragement, the next small move, and the why behind it. 90 days of micro-coaching delivered before your morning coffee.',
    value: 497,
  },
  {
    title: 'Tracker Suite',
    detail: 'BP, symptom, food, sleep, and mood trackers. Printable + digital. The receipts you\'ll show your future PCP.',
    value: 97,
  },
  {
    title: 'Partner Inclusion Guide',
    detail: 'A 12-page guide written for your spouse — what\'s changing, why, how to support without nagging, and what to celebrate. The single biggest predictor of success is whether your home is on the team.',
    value: 97,
  },
  {
    title: 'Barbara O\'Neill LIVE Event — 20% off',
    detail: 'June 24–25, 2026. The most-requested holistic-health teacher of the decade. Your member discount applies whether you attend live or watch the replay.',
    value: 147,
  },
];

const TOTAL_VALUE = STACK.reduce((sum, item) => sum + item.value, 0);
const INVESTMENT_PIF = 1997;
const INVESTMENT_3PAY = 2091;
const PIF_LINK = 'https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M';
const PAY3_LINK = 'https://buy.stripe.com/6oU3cv2ZJ5LEgHV6NjfnO0N';

const fmt$ = (n) => '$' + n.toLocaleString('en-US');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  bufferPages: true,
  info: {
    Title: 'Wakita — 90-Day BP Triangle Freedom Sprint Offer',
    Author: 'Joel Polley, RN — BraveWorks',
    Subject: 'Tailored coaching offer',
  },
});
const writeStream = fs.createWriteStream(OUT);
doc.pipe(writeStream);

// ── HEADER BAND ──────────────────────────────────────────────
// Header is 160px so the wrapped title + subtitle have room without
// overlapping. Title wraps to 2 lines at 20pt.
doc.rect(0, 0, doc.page.width, 160).fill(PAPER);
doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
  .text('BRAVEWORKS RN · TAILORED COACHING OFFER', 60, 44, { characterSpacing: 1.5 });
doc.fillColor(INK).font('Helvetica-Bold').fontSize(20)
  .text('Wakita — Your 90-Day BP Triangle Freedom Sprint', 60, 60, { width: doc.page.width - 120, lineGap: 4 });
doc.fillColor(MUTED).font('Helvetica').fontSize(10)
  .text('Built from your file. Tailored to your goals. Designed to be sustainable.', 60, 132);
doc.moveTo(60, 166).lineTo(doc.page.width - 60, 166).strokeColor(BORDER).lineWidth(1).stroke();

// ── PERSONAL FRAME ────────────────────────────────────────────
doc.y = 180;
doc.fillColor(INK_SOFT).font('Helvetica').fontSize(11)
  .text(
    'You wrote that you tried every lifestyle program and it was effective — but too expensive to keep going. That you have a firm grasp on the basics. That you came home from the hospital worse than you went in.',
    { width: doc.page.width - 120, lineGap: 3 }
  );
doc.moveDown(0.5);
doc.fillColor(INK_SOFT).font('Helvetica').fontSize(11)
  .text(
    'This is not another lifestyle program. This is structure, accountability, and a registered nurse in your corner for the next 90 days — paired with my co-coach Annie Chitate, RN, for the hormone work your body has been quietly asking for since menopause. Everything below is yours when you say yes.',
    { width: doc.page.width - 120, lineGap: 3 }
  );

// ── VALUE STACK ──────────────────────────────────────────────
doc.moveDown(1);
doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(13)
  .text('WHAT\'S INCLUDED', { characterSpacing: 1.2 });
doc.moveTo(60, doc.y + 2).lineTo(doc.page.width - 60, doc.y + 2).strokeColor(SAGE).lineWidth(1).stroke();
doc.moveDown(0.6);

for (const item of STACK) {
  // Page-break guard
  if (doc.y > doc.page.height - 130) {
    doc.addPage();
    doc.y = 60;
  }

  const blockTop = doc.y;
  const labelWidth = doc.page.width - 120 - 100; // 100px right column for value

  // Title in the left column
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
    .text(item.title, 60, blockTop, { width: labelWidth, lineBreak: true });

  // Detail directly under title (still left column)
  doc.fillColor(INK_SOFT).font('Helvetica').fontSize(9.5)
    .text(item.detail, 60, doc.y + 2, { width: labelWidth, lineGap: 1.5 });

  // Snapshot the bottom of the left column
  const leftBottomY = doc.y;

  // Write the value in the right column WITHOUT moving the cursor —
  // we use a positioned text() with lineBreak: false so pdfkit doesn't
  // auto-paginate, and we manually restore doc.y after.
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12)
    .text(fmt$(item.value), doc.page.width - 130, blockTop, {
      width: 70, align: 'right', lineBreak: false,
    });

  // Restore the cursor to the left column's bottom (the value is shorter
  // than the title+detail, so leftBottomY is the source of truth for
  // where the next row should start).
  doc.y = leftBottomY;

  // Separator line
  const sepY = doc.y + 8;
  doc.moveTo(60, sepY).lineTo(doc.page.width - 60, sepY).strokeColor(BORDER).lineWidth(0.4).stroke();
  doc.y = sepY + 8;
}

// Page-break guard before totals
if (doc.y > doc.page.height - 180) {
  doc.addPage();
  doc.y = 60;
}

// ── TOTAL VALUE ──────────────────────────────────────────────
doc.moveDown(0.4);
const totalY = doc.y;
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13)
  .text('TOTAL STACK VALUE', 60, totalY, { width: 300, lineBreak: false, characterSpacing: 1 });
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(15)
  .text(fmt$(TOTAL_VALUE), doc.page.width - 160, totalY - 1, { width: 100, align: 'right', lineBreak: false });
doc.y = totalY + 22;
doc.moveDown(0.4);

// ── INVESTMENT BLOCK ─────────────────────────────────────────
if (doc.y > doc.page.height - 220) {
  doc.addPage();
  doc.y = 60;
}

const invTop = doc.y + 4;
doc.rect(60, invTop, doc.page.width - 120, 130).fillAndStroke(SAGE_SOFT, SAGE);
doc.y = invTop + 14;
doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(10)
  .text('YOUR INVESTMENT', 76, doc.y, { characterSpacing: 1 });
doc.moveDown(0.5);

doc.fillColor(INK).font('Helvetica-Bold').fontSize(14)
  .text('Pay in full —  ' + fmt$(INVESTMENT_PIF), 76);
doc.fillColor(SAGE).font('Helvetica').fontSize(9.5)
  .text(PIF_LINK, 76, doc.y + 2, { link: PIF_LINK, underline: true });
doc.moveDown(0.6);

doc.fillColor(INK).font('Helvetica-Bold').fontSize(13)
  .text('3 monthly payments of $697  ·  $2,091 total', 76);
doc.fillColor(SAGE).font('Helvetica').fontSize(9.5)
  .text(PAY3_LINK, 76, doc.y + 2, { link: PAY3_LINK, underline: true });
doc.moveDown(0.4);

doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9)
  .text(`Pay in full saves $94. Either path locks you in for the full 90 days.`, 76);
doc.y = invTop + 138;

// ── GUARANTEE ────────────────────────────────────────────────
doc.moveDown(0.4);
if (doc.y > doc.page.height - 150) {
  doc.addPage();
  doc.y = 60;
}

doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(11)
  .text('TRIPLE TRIANGLE GUARANTEE', 60, doc.y, { characterSpacing: 1 });
doc.moveTo(60, doc.y + 2).lineTo(doc.page.width - 60, doc.y + 2).strokeColor(CLAY).lineWidth(0.5).stroke();
doc.moveDown(0.4);

doc.fillColor(INK_SOFT).font('Helvetica').fontSize(10);
doc.text('Day 30 — If you have not experienced relief in your top three stated symptoms, I refund you in full and you keep every protocol document.', { width: doc.page.width - 120, lineGap: 2 });
doc.moveDown(0.3);
doc.text('Day 60 — If your follow-up labs have not moved in the right direction, I refund you in full.', { width: doc.page.width - 120, lineGap: 2 });
doc.moveDown(0.3);
doc.text('Day 90 — If you do not feel safer in your body than you did on the day we met, I refund you in full.', { width: doc.page.width - 120, lineGap: 2 });
doc.moveDown(0.4);
doc.fillColor(INK).font('Helvetica-Bold').fontSize(10)
  .text('I carry the risk. You carry the action.');

// ── SIGNATURE ────────────────────────────────────────────────
doc.moveDown(1.5);
if (doc.y > doc.page.height - 120) {
  doc.addPage();
  doc.y = 60;
}
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
  .text('Joel Polley, RN');
doc.fillColor(INK_SOFT).font('Helvetica-Oblique').fontSize(10)
  .text('Founder, BraveWorks  ·  braveworksrn@gmail.com  ·  bpquiz.com');

// ── FOOTER on every page ─────────────────────────────────────
const range = doc.bufferedPageRange();
const totalPages = range.count;
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  const origBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 38;
  doc.moveTo(60, fy).lineTo(doc.page.width - 60, fy).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.fillColor(MUTED).font('Helvetica').fontSize(8);
  doc.text(
    'BraveWorks RN  ·  90-Day BP Triangle Freedom Sprint — Tailored offer for Wakita Cirillo Browne',
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
// Wait on the writable stream's 'finish' event — pdfkit's doc 'end' fires
// before the file has actually been flushed to disk, so node was exiting
// with a 0-byte file.
await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
});
const sz = fs.statSync(OUT).size;
console.log(`✓ Wrote ${OUT}`);
console.log(`  ${sz.toLocaleString()} bytes  ·  ${totalPages} pages`);
console.log(`  TOTAL VALUE: ${fmt$(TOTAL_VALUE)}`);
console.log(`  PIF: ${fmt$(INVESTMENT_PIF)}  ·  3-pay: 3 × $697 ($2,091)`);
