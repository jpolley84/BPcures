// Life Change Accelerator coaching agreement as a PDF Buffer, for serverless
// use (attached to the automated All-In welcome email in triangle-webhook.js).
//
// This is the CURRENT-era ($7,500) agreement only. It is a buffer-returning
// port of scripts/build-coaching-agreement.mjs (era: 'current'); that script
// remains the tool for hand-built batches and the founding-era document.
// Content changes must be made in BOTH files until the script imports this.
//
// Uses only pdfkit built-in fonts (Helvetica), same as api/_accelerator-pdf.js,
// so nothing extra ships in the bundle.

import PDFDocument from 'pdfkit';

const INK = '#2C2A26';
const MUTED = '#7A7061';
const SAGE = '#3F5A3C';
const CLAY = '#B85A36';
const BORDER = '#D8CFBD';
const RULE = '#C9BFA8';
const M = 62;

const A = '’'; // typographic apostrophe

// Figures verified against api/create-embedded-checkout.js (All-In tier map,
// 2026-08-30 block): full $7,500; $500 deposit (credited, $7,000 balance);
// balance plans 6 x $1,295 / 9 x $935 / 12 x $750, all MONTHLY.
const SECTIONS = [
  ['Scope of Services', [
    'BraveWorks RN shall provide Client with The Life Change Accelerator (the "Coaching Program"). The Coaching Program includes:',
    ['A personalized Life Change Blueprint, prepared from the assessment Client completes.',
     'Weekly Group Coaching. BraveWorks RN will host one (1) video conference each week for twelve (12) weeks via Zoom.',
     'One (1) private session with both Coaches.',
     'Program materials covering nutrition, movement, botanicals, sleep, stress, hormones, and health metrics.',
     'A ninety (90) day supply of the Program botanical tea.',
     'Community access for twelve (12) months, including guest expert sessions.',
     'Complimentary entry to any group challenge conducted during that twelve (12) month period.'],
  ]],

  ['Hours of Operation', [
    'Monday and Wednesday from 12:00 p.m. to 5:00 p.m. Central Time (1:00 p.m. to 6:00 p.m. Eastern Time). Times may vary on holidays.',
  ]],

  ['Communication', [
    ['Weekly video conferences take place via Zoom.',
     'Links, times, materials, and other information will be emailed to Client.',
     'Questions submitted through Program channels will receive a response within forty-eight (48) hours. Messages received outside Hours of Operation will be addressed during the next scheduled period.',
     'Program channels are not monitored for emergencies. See Important Health Notice below.'],
  ]],

  ['Important Health Notice', [
    'This section is the most important in this Agreement. Please read it carefully.',
    ['Joel Polley and Annie Chitate are registered nurses and naturopaths. In the Coaching Program they act as health educators and coaches only. They do not act as Client' + A + 's nurse, physician, or treating provider, and no clinical or provider-patient relationship is created by this Agreement.',
     'The Coaching Program does not diagnose, treat, cure, or prevent any disease. BraveWorks RN does not prescribe, and does not start, stop, change, or reduce any medication. Those decisions belong to Client' + A + 's own licensed providers.',
     'Client agrees not to start, stop, or change any medication, supplement, or treatment because of anything learned in the Coaching Program without first speaking to the prescribing provider.',
     'Client agrees to remain under the care of a licensed healthcare provider and to inform that provider of participation in the Coaching Program.',
     'Client agrees to disclose current medications, supplements, and diagnosed conditions in the assessment, and to notify BraveWorks RN promptly of any material change in health during the Coaching Program.',
     'In the event of symptoms that may be an emergency, including chest pain or pressure, difficulty breathing, sudden severe headache, sudden vision changes, weakness or numbness on one side, confusion, or fainting, Client agrees to seek immediate medical attention or call emergency services rather than contacting BraveWorks RN.'],
  ]],

  ['Client Performance', [
    ['The Coaching Program is an educational tool. Clients should attend the video conferences, participate in the community, and engage with their Coaches.',
     'Your mileage may vary. No particular health outcome, measurement, laboratory value, weight change, or reduction in any medication is promised or guaranteed. Results depend on individual physiology, medical care, and what Client actually does. Accounts of other participants are illustrative only.',
     'Clients are solely responsible for how they use the information learned.'],
  ]],

  ['Compensation', [
    'Client agrees to pay BraveWorks RN as follows. Program fee: $7,500, under the option selected on the signature page:',
    ['Paid in full: $7,500 in a single payment.',
     'Deposit of $500 to reserve Client' + A + 's place, credited toward the program fee, with the remaining $7,000 balance settled in full in one payment.',
     'Deposit of $500 as above, with the balance paid in six (6) monthly payments of $1,295 ($7,770 in total), charged automatically each month to the payment method on file, ending after the sixth payment.',
     'Deposit of $500 as above, with the balance paid in nine (9) monthly payments of $935 ($8,415 in total), charged automatically each month, ending after the ninth payment.',
     'Deposit of $500 as above, with the balance paid in twelve (12) monthly payments of $750 ($9,000 in total), charged automatically each month, ending after the twelfth payment.'],
    'Monthly plans are priced above the pay-in-full amount. If a payment fails, BraveWorks RN will notify Client and allow at least seven (7) days to resolve it before access is affected. All amounts are in United States dollars.',
  ]],

  ['Additional Participant', [
    'Enrollment includes one (1) additional participant at no further charge, named on the signature page. The additional participant receives the same access for as long as Client' + A + 's access continues, and must sign a copy of this Agreement before participating so that the Important Health Notice applies to them directly. Access is otherwise non-transferable and may not be resold or shared.',
  ]],

  ['Term of Agreement', [
    'This Agreement begins on the Effective Date and remains in force for twelve (12) months, comprising a twelve (12) week coaching term followed by continued community and resource access, unless earlier terminated under the terms of this Agreement.',
  ]],

  ['Termination of Agreement', [
    ['BraveWorks RN may terminate Client from the Coaching Program for cause, including payments going unpaid, material breach of community standards, or where BraveWorks RN reasonably determines that continued participation is not appropriate for Client.',
     'Please notify us in advance if you plan to miss several weeks of the Coaching Program. We can pause participation or move Client to a later cohort.',
     'Client may terminate this Agreement for any reason or no reason.'],
  ]],

  ['Refund Policy', [
    ['All payments are non-refundable and final. Any outstanding balance remains payable in accordance with the schedule on the signature page.',
     'Client agrees to contact BraveWorks RN to resolve any billing concern before disputing a charge with their bank or card issuer.'],
  ]],

  ['Confidentiality', [
    'Information Client discloses in the assessment, during sessions, and in private correspondence is confidential. It is not sold and is not shared outside the coaching team without Client' + A + 's consent, except where required by law or where necessary to prevent serious harm. Because BraveWorks RN acts as a health educator rather than a treating provider, the Coaching Program is not a HIPAA covered service; this confidentiality obligation is owed to Client contractually under this Agreement.',
    'Client shall likewise treat Program materials, recordings, log-in credentials, community discussions, and the identity of other Clients as confidential, and shall not disclose, publish, resell, or republish them.',
  ]],

  ['Release from Liability', [
    'Client agrees to hold BraveWorks RN, its owners, employees, agents, and representatives harmless from any loss, claim, damage, or liability of any kind relating in any way to the Coaching Program. In no event shall BraveWorks RN be liable for indirect, incidental, special, consequential, or punitive damages. To the fullest extent permitted by law, total liability is limited to the amount Client actually paid. Nothing here limits liability for fraud or any liability that cannot lawfully be limited. Client acknowledges that decisions concerning Client' + A + 's health remain Client' + A + 's own, made with Client' + A + 's licensed providers.',
  ]],

  ['Dispute Resolution', [
    'In the event of litigation relating to or arising from this Agreement, venue and jurisdiction shall be in the state courts located in the Commonwealth of Kentucky, and the prevailing party shall recover their reasonable attorneys' + A + ' fees and costs incurred. This Agreement is governed by Kentucky law.',
  ]],

  ['Publicity Release', [
    'With Client' + A + 's permission, BraveWorks RN may photograph, videotape, and record Client' + A + 's name, voice, appearance, likeness, and written testimony, in whole or in part, in its marketing materials and programs. Permission may be withdrawn at any time in writing. Group sessions are recorded for Clients to rewatch; a Client who prefers not to appear may keep camera and microphone off and submit questions in writing.',
  ]],
];

const CIRCLE_ONE = '1.  Full $7,500     2.  $500 dep + $7,000     3.  Six x $1,295     4.  Nine x $935     5.  Twelve x $750';

// Generates the personalized agreement and resolves with a PDF Buffer.
// { name, email, paid, balance } — anything omitted stays a blank rule.
export function generateCoachingAgreementPDF({ name = '', email = '', paid = '', balance = '' } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: M, bottom: M, left: M, right: M },
        bufferPages: true,
        info: {
          Title: 'The Life Change Accelerator — Coaching Agreement',
          Author: 'BraveWorks RN — Joel Polley, RN and Annie Chitate, RN',
          Subject: 'Coaching agreement',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - M * 2;
      const need = (h) => { if (doc.y + h > doc.page.height - M - 34) { doc.addPage(); doc.y = M; } };

      // ── Cover ─────────────────────────────────────────
      const PW = doc.page.width;

      doc.rect(0, 0, PW, 8).fill(CLAY);

      doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(10)
        .text('BRAVEWORKS RN', M, 150, { characterSpacing: 3, width: W, align: 'center' });

      doc.moveTo(PW / 2 - 30, doc.y + 16).lineTo(PW / 2 + 30, doc.y + 16)
        .strokeColor(RULE).lineWidth(1).stroke();

      doc.fillColor(INK).font('Helvetica-Bold').fontSize(34)
        .text('Coaching Agreement', M, doc.y + 40, { width: W, align: 'center' });

      doc.fillColor(SAGE).font('Helvetica').fontSize(15)
        .text('The Life Change Accelerator', M, doc.y + 10, { width: W, align: 'center' });

      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
        .text('2026', M, doc.y + 12, { characterSpacing: 2, width: W, align: 'center' });

      doc.fillColor(MUTED).font('Helvetica').fontSize(10.5).text(
        'This Agreement sets out what we will do for you over the next twelve weeks, ' +
        'what we ask of you, and how your health care stays where it belongs, with your own ' +
        'doctors. Please read it in full, especially the Important Health Notice. ' +
        'Then sign the last page and send it back.',
        M + 62, doc.y + 40, { width: W - 124, align: 'center', lineGap: 3 }
      );

      // Prepared-for block
      const by = 486;
      doc.moveTo(M + 110, by).lineTo(PW - M - 110, by).strokeColor(BORDER).lineWidth(0.8).stroke();

      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
        .text('PREPARED FOR', M, by + 20, { characterSpacing: 1.4, width: W, align: 'center' });
      if (name) {
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(16)
          .text(name, M, by + 38, { width: W, align: 'center' });
      } else {
        doc.moveTo(PW / 2 - 130, by + 58).lineTo(PW / 2 + 130, by + 58)
          .strokeColor(RULE).lineWidth(0.8).stroke();
      }

      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
        .text('YOUR COACHES', M, by + 78, { characterSpacing: 1.4, width: W, align: 'center' });
      doc.fillColor(INK).font('Helvetica').fontSize(11)
        .text('Joel Polley, RN     and     Annie Chitate, RN', M, by + 94,
          { width: W, align: 'center' });

      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
        .text('BraveWorks RN  ·  Commonwealth of Kentucky  ·  braveworksrn@gmail.com',
          M, doc.page.height - 96, { width: W, align: 'center' });

      doc.addPage();
      doc.y = M;

      // ── Preamble ──────────────────────────────────────
      doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
        .text('BRAVEWORKS RN', M, M, { characterSpacing: 1.6 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(20)
        .text('Coaching Agreement', M, doc.y + 6);
      doc.fillColor(MUTED).font('Helvetica').fontSize(11)
        .text('The Life Change Accelerator', M, doc.y + 2);
      doc.moveTo(M, doc.y + 12).lineTo(doc.page.width - M, doc.y + 12)
        .strokeColor(BORDER).lineWidth(1).stroke();
      doc.y += 26;

      doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(
        'This Coaching Agreement is entered into as of ______________ ("Effective Date") between ' +
        'BraveWorks RN, operated by Joel Polley, RN and Annie Chitate, RN, and ' +
        '________________________________ ("Client"), for services provided from Kentucky.',
        M, doc.y, { width: W, lineGap: 2 }
      );
      doc.y += 18;

      // ── Sections ──────────────────────────────────────
      for (const [heading, blocks] of SECTIONS) {
        need(58);
        doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(12).text(heading, M, doc.y, { width: W });
        doc.y += 7;

        for (const block of blocks) {
          if (Array.isArray(block)) {
            block.forEach((item, i) => {
              const num = `${i + 1}.`;
              const indent = 20;
              const h = doc.font('Helvetica').fontSize(10.5)
                .heightOfString(item, { width: W - indent, lineGap: 1.5 });
              need(h + 9);
              const y = doc.y;
              doc.fillColor(INK).font('Helvetica-Bold').fontSize(10.5).text(num, M, y, { width: indent });
              doc.fillColor(INK).font('Helvetica').fontSize(10.5)
                .text(item, M + indent, y, { width: W - indent, lineGap: 1.5 });
              doc.y = y + h + 5;
            });
            doc.y += 3;
          } else {
            const h = doc.font('Helvetica').fontSize(10.5)
              .heightOfString(block, { width: W, lineGap: 1.5 });
            need(h + 9);
            doc.fillColor(INK).font('Helvetica').fontSize(10.5)
              .text(block, M, doc.y, { width: W, lineGap: 1.5 });
            doc.y += 7;
          }
        }
        doc.y += 9;
      }

      // ── Signature ─────────────────────────────────────
      need(230);
      doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(
        'By our signatures below, Client and BraveWorks RN understand and accept all terms in this Coaching Agreement, ' +
        'including the Important Health Notice.',
        M, doc.y, { width: W, lineGap: 2 }
      );
      doc.y += 22;

      // A filled value sits on the rule instead of replacing it, so a
      // pre-filled copy still reads as a form and Client can see what we wrote.
      const line = (label, frac = 1, xOff = 0, value = '') => {
        const w = (W - (frac < 1 ? 24 : 0)) * frac;
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
          .text(label.toUpperCase(), M + xOff, doc.y, { characterSpacing: 0.8, width: w });
        const ly = doc.y + 15;
        if (value) {
          doc.fillColor(INK).font('Helvetica').fontSize(11)
            .text(value, M + xOff + 2, ly - 13, { width: w - 4, lineBreak: false });
        }
        doc.moveTo(M + xOff, ly).lineTo(M + xOff + w, ly).strokeColor(RULE).lineWidth(0.8).stroke();
        return ly;
      };

      let y0 = doc.y;
      line('Client name', 0.5, 0, name); doc.y = y0;
      line('Email', 0.5, W * 0.5 + 24, email); doc.y += 28;

      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
        .text('PAYMENT OPTION (CIRCLE ONE)', M, doc.y, { characterSpacing: 0.8 });
      doc.y += 13;
      doc.fillColor(INK).font('Helvetica').fontSize(10)
        .text(CIRCLE_ONE, M, doc.y, { width: W });
      doc.y += 20;

      y0 = doc.y;
      line('Amount already paid', 0.5, 0, paid); doc.y = y0;
      line('Balance remaining, and due date', 0.5, W * 0.5 + 24, balance); doc.y += 28;

      y0 = doc.y;
      line('Additional participant (if any)', 0.5); doc.y = y0;
      line('Their email', 0.5, W * 0.5 + 24); doc.y += 32;

      y0 = doc.y;
      line('Client signature', 0.62); doc.y = y0;
      line('Date', 0.3, W * 0.7); doc.y += 32;

      y0 = doc.y;
      line('BraveWorks RN', 0.62); doc.y = y0;
      line('Date', 0.3, W * 0.7); doc.y += 24;

      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
        .text('Return the signed Agreement to braveworksrn@gmail.com or bring it to your private session.',
          M, doc.y, { width: W });

      // ── Footer ────────────────────────────────────────
      const range = doc.bufferedPageRange();
      const body = range.count - 1;
      for (let i = range.start + 1; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const ob = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const fy = doc.page.height - 42;
        doc.moveTo(M, fy).lineTo(doc.page.width - M, fy).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
        doc.text('BraveWorks RN  ·  Coaching Agreement', M, fy + 8,
          { width: W - 90, align: 'left', lineBreak: false });
        doc.text(`Page ${i - range.start} of ${body}`,
          doc.page.width - M - 80, fy + 8, { width: 80, align: 'right', lineBreak: false });
        doc.page.margins.bottom = ob;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Per-plan signature-page fill lines for the CURRENT ($7,500) offer. Figures
// mirror create-embedded-checkout.js and the ALLIN_*_PLAN_LINES maps in
// triangle-webhook.js — keep all three in step. A plan not listed here gets NO
// personalized agreement (the welcome email still sends without it): the
// legacy $1,997-era plans signed a different document.
export const AGREEMENT_PLAN_FILL = {
  full: { paid: '$7,500 (paid in full)', balance: 'None — paid in full' },
  // NOTE: the signature-page value fields render with lineBreak:false in a
  // half-width column (~42 chars at 11pt) — keep these strings short.
  deposit: { paid: '$500 (deposit, credited)', balance: '$7,000 — changemylifechallenge.com/payment' },
  'balance-full': { paid: '$7,500 ($500 dep + $7,000 balance)', balance: 'None — settled in full' },
  'balance-6pay': { paid: '$500 dep + $1,295 (payment 1 of 6)', balance: '5 more monthly payments of $1,295' },
  'balance-9pay': { paid: '$500 dep + $935 (payment 1 of 9)', balance: '8 more monthly payments of $935' },
  'balance-12pay': { paid: '$500 dep + $750 (payment 1 of 12)', balance: '11 more monthly payments of $750' },
};
