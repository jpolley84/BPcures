// Life Change coaching agreement as a PDF Buffer, for serverless use
// (attached to the automated All-In welcome email in triangle-webhook.js).
//
// 2026-10-07: ONE generator, THREE tiers. Until today this file rendered the
// $7,500 Accelerator terms for every All-In plan, so $1,997 clients received a
// $7,500 document (Yvonne Wint held the $7,500 agreement with a $200/$1,797
// signature page; Shirley Rowland's 2026-10-04 copy read "$7,500 paid in
// full"). Pass `tier` to generateCoachingAgreementPDF, or let
// resolveAgreementTier() pick it from the Stripe plan and amount:
//   accelerator       $7,500 Life Change Accelerator, 12 weeks (text unchanged)
//   accelerator-1997  $1,997 Life Change Accelerator, 12 weeks (pre-2026-08-30 price)
//   sprint            $1,997 Life Change Sprint, 6 weeks, $200 non-refundable deposit
//
// The $7,500 text is a buffer-returning port of
// scripts/build-coaching-agreement.mjs (era: 'current'); that script remains
// the tool for hand-built batches and the founding-era document. Shared-clause
// changes must be made in BOTH files until the script imports this.
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

// ── PRICES. One block; a later price change is one edit here. ──────────────
// Verified against api/create-embedded-checkout.js (All-In tier map: the
// 2026-08-30 $7,500 block and the 2026-08-10 legacy $1,997 ladder) and
// api/create-hosted-checkout.js (Sprint, 2026-09-27). Plan totals in the
// rendered text are computed from these figures, never typed.
export const TIER_PRICES = {
  accelerator: {
    name: 'The Life Change Accelerator',
    weeks: 12,
    fee: 7500,
    deposit: 500,
    balance: 7000,
    // After the deposit, MONTHLY.
    installments: [{ n: 6, amount: 1295 }, { n: 9, amount: 935 }, { n: 12, amount: 750 }],
  },
  'accelerator-1997': {
    name: 'The Life Change Accelerator',
    weeks: 12,
    fee: 1997,
    deposit: 197,
    balance: 1800,
    // No deposit, EVERY 14 DAYS.
    direct: [{ n: 3, amount: 699 }, { n: 6, amount: 367 }, { n: 9, amount: 267 }],
    // After the deposit, EVERY 14 DAYS.
    installments: [{ n: 3, amount: 633 }],
  },
  activated: {
    name: 'Life Change Activated',
    weeks: 8,
    fee: 2000,
    deposit: 200, // NON-refundable
    balance: 1800,
    // After the deposit, inside the 8 weeks. Mirrors the three live balance
    // options on public/life-change-activated/balance/.
    installments: [{ n: 2, amount: 950 }, { n: 4, amount: 495 }],
  },
  sprint: {
    name: 'The Life Change Sprint',
    weeks: 6,
    fee: 1997,
    deposit: 200, // NON-refundable
    balance: 1797,
    // After the deposit, EVERY 14 DAYS, inside the 6 weeks.
    installments: [{ n: 3, amount: 649 }],
    upgradeFee: 7500, // every Sprint dollar is credited toward this
  },
};

const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth'];
const count = (n) => `${WORDS[n]} (${n})`; // 'six (6)'
const ordinal = (n) => ORDINALS[n];          // 'sixth'
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const FAIL_TAIL = 'If a payment fails, BraveWorks RN will notify Client and allow at least seven (7) days to resolve it before access is affected. All amounts are in United States dollars.';

// Compensation clause per tier. The 'accelerator' text renders byte-identical
// to the pre-2026-10-07 literal; only the figures now come from TIER_PRICES.
function compensationFor(tier) {
  const P = TIER_PRICES[tier];
  const lead = `Client agrees to pay BraveWorks RN as follows. Program fee: ${usd(P.fee)}, under the option selected on the signature page:`;
  const full = `Paid in full: ${usd(P.fee)} in a single payment.`;
  if (tier === 'accelerator') {
    const [a, b, c] = P.installments;
    return ['Compensation', [
      lead,
      [full,
       `Deposit of ${usd(P.deposit)} to reserve Client${A}s place, credited toward the program fee, with the remaining ${usd(P.balance)} balance settled in full in one payment.`,
       `Deposit of ${usd(P.deposit)} as above, with the balance paid in ${count(a.n)} monthly payments of ${usd(a.amount)} (${usd(a.n * a.amount)} in total), charged automatically each month to the payment method on file, ending after the ${ordinal(a.n)} payment.`,
       `Deposit of ${usd(P.deposit)} as above, with the balance paid in ${count(b.n)} monthly payments of ${usd(b.amount)} (${usd(b.n * b.amount)} in total), charged automatically each month, ending after the ${ordinal(b.n)} payment.`,
       `Deposit of ${usd(P.deposit)} as above, with the balance paid in ${count(c.n)} monthly payments of ${usd(c.amount)} (${usd(c.n * c.amount)} in total), charged automatically each month, ending after the ${ordinal(c.n)} payment.`],
      `Monthly plans are priced above the pay-in-full amount. ${FAIL_TAIL}`,
    ]];
  }
  if (tier === 'accelerator-1997') {
    const [d3, d6, d9] = P.direct;
    const [b3] = P.installments;
    return ['Compensation', [
      lead,
      [full,
       `Deposit of ${usd(P.deposit)} to reserve Client${A}s place, credited toward the program fee, with the remaining ${usd(P.balance)} balance settled in full in one payment.`,
       `${cap(count(d3.n))} payments of ${usd(d3.amount)} (${usd(d3.n * d3.amount)} in total), charged automatically every fourteen (14) days to the payment method on file, ending after the ${ordinal(d3.n)} payment.`,
       `${cap(count(d6.n))} payments of ${usd(d6.amount)} (${usd(d6.n * d6.amount)} in total), charged automatically every fourteen (14) days, ending after the ${ordinal(d6.n)} payment.`,
       `${cap(count(d9.n))} payments of ${usd(d9.amount)} (${usd(d9.n * d9.amount)} in total), charged automatically every fourteen (14) days, ending after the ${ordinal(d9.n)} payment.`,
       `Deposit of ${usd(P.deposit)} as above, with the balance paid in ${count(b3.n)} payments of ${usd(b3.amount)} (${usd(b3.n * b3.amount)} in total), charged automatically every fourteen (14) days, ending after the ${ordinal(b3.n)} payment.`,
       `Deposit paid to reserve Client${A}s place, with the remaining balance stated on the signature page and due on the schedule agreed there in writing.`],
      `Installment plans are priced above the pay-in-full amount. ${FAIL_TAIL}`,
    ]];
  }
  if (tier === 'sprint') {
    const [s3] = P.installments;
    return ['Compensation', [
      lead,
      [full,
       `Deposit of ${usd(P.deposit)} to reserve Client${A}s place. The deposit is non-refundable. It is credited toward the program fee, and the remaining ${usd(P.balance)} balance is settled in full in one payment.`,
       `Deposit of ${usd(P.deposit)} as above, non-refundable, with the ${usd(P.balance)} balance paid in ${count(s3.n)} payments of ${usd(s3.amount)} (${usd(s3.n * s3.amount)} in total), charged automatically every fourteen (14) days to the payment method on file, all within the ${count(P.weeks)} week Sprint, ending after the ${ordinal(s3.n)} payment.`],
      `The three-payment plan is priced above the pay-in-full amount. Every amount paid under this Agreement is credited toward The Life Change Accelerator (${usd(P.upgradeFee)}) if Client upgrades. ${FAIL_TAIL}`,
    ]];
  }
  if (tier === 'activated') {
    const [p2, p4] = P.installments;
    return ['Compensation', [
      lead,
      [full,
       `Deposit of ${usd(P.deposit)} to reserve Client${A}s place. The deposit is non-refundable. It is credited toward the program fee, and the remaining ${usd(P.balance)} balance is settled in full in one payment.`,
       `Deposit of ${usd(P.deposit)} as above, non-refundable, with the ${usd(P.balance)} balance paid in ${count(p2.n)} payments of ${usd(p2.amount)} (${usd(p2.n * p2.amount)} in total), charged automatically to the payment method on file, both within the ${count(P.weeks)} week program.`,
       `Deposit of ${usd(P.deposit)} as above, non-refundable, with the ${usd(P.balance)} balance paid in ${count(p4.n)} payments of ${usd(p4.amount)} (${usd(p4.n * p4.amount)} in total), charged automatically every fourteen (14) days, all within the ${count(P.weeks)} week program.`],
      `Payment plans are priced above the pay-in-full amount. ${FAIL_TAIL}`,
    ]];
  }
  throw new Error(`coaching agreement: unknown tier '${tier}'`);
}

// Signature-page "circle one" line per tier.
function circleOneFor(tier) {
  const P = TIER_PRICES[tier];
  const x = (p) => `${cap(WORDS[p.n])} x ${usd(p.amount)}`;
  if (tier === 'accelerator') {
    const [a, b, c] = P.installments;
    return `1.  Full ${usd(P.fee)}     2.  ${usd(P.deposit)} dep + ${usd(P.balance)}     3.  ${x(a)}     4.  ${x(b)}     5.  ${x(c)}`;
  }
  if (tier === 'accelerator-1997') {
    const [d3, d6, d9] = P.direct;
    const [b3] = P.installments;
    return `1.  Full ${usd(P.fee)}     2.  ${usd(P.deposit)} dep + ${usd(P.balance)}     3.  ${x(d3)}     4.  ${x(d6)}     5.  ${x(d9)}     6.  Dep + ${x(b3)}     7.  Dep + balance as written`;
  }
  if (tier === 'activated') {
    const [p2, p4] = P.installments;
    return `1.  Full ${usd(P.fee)}     2.  ${usd(P.deposit)} dep + ${usd(P.balance)}     3.  Dep + ${x(p2)}     4.  Dep + ${x(p4)}`;
  }
  const [s3] = P.installments;
  return `1.  Full ${usd(P.fee)}     2.  ${usd(P.deposit)} dep + ${usd(P.balance)}     3.  ${usd(P.deposit)} dep + ${x(s3)}`;
}

// Sprint-only clauses. Deliverables mirror src/pages/SprintPage.jsx INCLUDED /
// NOT_INCLUDED (2026-10-05) and the Sprint lines in triangle-webhook.js: six
// weeks, no bonuses, no second participant, no year of access, no guarantee;
// the private session comes only with the balance paid in full, or the
// Fast-Track Call where the server stamped it at enrollment.
const SCOPE_SPRINT = ['Scope of Services', [
  'BraveWorks RN shall provide Client with The Life Change Sprint (the "Coaching Program"). The Coaching Program includes:',
  ['A health review and a personalized plan with starting priorities, prepared from the assessment Client completes.',
   'Weekly Group Coaching with live questions and answers. BraveWorks RN will host one (1) video conference each week for six (6) weeks via Zoom.',
   'Step-by-step guidance through the six (6) weeks.',
   'Community access for the duration of the six (6) week Sprint.',
   'One (1) private coaching session, included only where Client settles the balance in full in one payment after the deposit (option 2 on the signature page), or where BraveWorks RN confirmed in writing at enrollment that Client earned the Fast-Track Call.',
   'Credit of every amount paid under this Agreement toward The Life Change Accelerator (' + usd(TIER_PRICES.sprint.upgradeFee) + ') if Client upgrades.'],
  'The Sprint does not include the Accelerator bonuses, an additional participant, twelve (12) months of community access, the Program botanical tea, or any money-back guarantee.',
]];

const TERM_SPRINT = ['Term of Agreement', [
  'This Agreement begins on the Effective Date and remains in force for six (6) weeks, comprising the six (6) week coaching term and community access for that period, unless earlier terminated under the terms of this Agreement.',
]];

// Clauses the Sprint swaps in (or drops, when null) by heading.
const SPRINT_OVERRIDES = {
  'Scope of Services': SCOPE_SPRINT,
  'Term of Agreement': TERM_SPRINT,
  'Additional Participant': null,
};

// Shared clauses. 'Compensation' is a placeholder filled by compensationFor().
// Life Change Activated clauses (2026-10-25). Eight weeks, and the bonuses and
// the plus-one seat belong to members who pay the $2,000 in full, matching
// public/life-change-activated/index.html. The refund clause OVERRIDES the
// shared "non-refundable and final" default: Joel set this tier to deposit
// non-refundable, balance pro rata.
const ACTIVATED_OVERRIDES = {
  'Scope of Services': ['Scope of Services', [
    'BraveWorks RN shall provide Client with Life Change Activated (the "Coaching Program"). The Coaching Program includes:',
    ['A health review and a personalized plan with starting priorities, prepared from the assessment Client completes.',
     'Live group coaching with questions and answers. BraveWorks RN will host one (1) video conference each week for eight (8) weeks via Zoom.',
     'Guidance on food, movement, sleep and daily habits, in a stated order of priority.',
     'Community access for the duration of the eight (8) week program.',
     'Where Client pays the ' + usd(2000) + ' program fee in full: the bonus collection (Restore Your Glow; Lab Hacks; the Skin and Hair fast-action bonus), and one (1) additional full participant of Client' + A + 's choosing, at no further charge, receiving the same access as Client for the eight (8) weeks.'],
    'The Coaching Program does not include medical care, diagnosis, prescription, or any instruction to start, stop or change a medication. Client' + A + 's prescriber remains responsible for Client' + A + 's medical treatment.',
  ]],
  'Term of Agreement': ['Term of Agreement', [
    'This Agreement begins on the date of Client' + A + 's first payment and runs for eight (8) weeks of scheduled programming. Community access continues for the duration of that term.',
  ]],
  'Refund Policy': ['Refund Policy', [
    ['The ' + usd(200) + ' deposit is non-refundable once paid.',
     'Amounts paid beyond the deposit are refundable on a pro rata basis for weeks of the Coaching Program not yet delivered, on Client' + A + 's written request. A week is treated as delivered once its scheduled group coaching session has taken place.',
     'Any outstanding balance for weeks already delivered remains payable in accordance with the schedule on the signature page.',
     'Client agrees to contact BraveWorks RN to resolve any billing concern before disputing a charge with their bank or card issuer.'],
  ]],
};

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

  ['Compensation', null], // per tier: compensationFor(tier)

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

function sectionsFor(tier) {
  return SECTIONS.map((s) => {
    if (s[0] === 'Compensation') return compensationFor(tier);
    if (tier === 'sprint' && s[0] in SPRINT_OVERRIDES) return SPRINT_OVERRIDES[s[0]];
    if (tier === 'activated' && s[0] in ACTIVATED_OVERRIDES) return ACTIVATED_OVERRIDES[s[0]];
    return s;
  }).filter(Boolean);
}

// Generates the personalized agreement and resolves with a PDF Buffer.
// { name, email, paid, balance, tier } — anything omitted stays a blank rule.
// tier is one of the TIER_PRICES keys; the caller resolves it (see
// resolveAgreementTier below) and an unknown tier rejects rather than
// silently rendering the wrong price.
export function generateCoachingAgreementPDF({ name = '', email = '', paid = '', balance = '', tier = 'accelerator' } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const P = TIER_PRICES[tier];
      if (!P) throw new Error(`coaching agreement: unknown tier '${tier}'`);
      const sections = sectionsFor(tier);
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: M, bottom: M, left: M, right: M },
        bufferPages: true,
        info: {
          Title: `${P.name} — Coaching Agreement`,
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
        .text(P.name, M, doc.y + 10, { width: W, align: 'center' });

      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
        .text('2026', M, doc.y + 12, { characterSpacing: 2, width: W, align: 'center' });

      doc.fillColor(MUTED).font('Helvetica').fontSize(10.5).text(
        `This Agreement sets out what we will do for you over the next ${WORDS[P.weeks]} weeks, ` +
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
        .text(P.name, M, doc.y + 2);
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
      for (const [heading, blocks] of sections) {
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
      // Reserve the block's real height (the fixed offsets below plus the
      // measured text), so the signature page never splits across two pages.
      // The old need(230) under-measured and a two-line circle-one ladder
      // pushed the last rules onto a page of their own.
      const SIGN_INTRO = 'By our signatures below, Client and BraveWorks RN understand and accept all terms in this Coaching Agreement, ' +
        'including the Important Health Notice.';
      const RETURN_LABEL = 'HOW TO RETURN THIS';
      const RETURN_TEXT = 'Sign and date on the Client signature line above. Then take a clear photo of '
        + 'this page with your phone and send it to braveworksrn@gmail.com, or simply reply to the email '
        + 'this Agreement came with and attach the photo. A photo of the signed page is all we need. '
        + 'If you prefer paper, print it, sign it and post a photo back the same way.';
      const circle = circleOneFor(tier);
      const circleH = doc.font('Helvetica').fontSize(10).heightOfString(circle, { width: W });
      const introH = doc.font('Helvetica').fontSize(10.5).heightOfString(SIGN_INTRO, { width: W, lineGap: 2 });
      // Each line() label call advances doc.y by labelH before its fixed gap.
      const labelH = doc.font('Helvetica-Bold').fontSize(8).heightOfString('X', { characterSpacing: 0.8 });
      const returnLabelH = doc.font('Helvetica-Bold').fontSize(8).heightOfString(RETURN_LABEL, { characterSpacing: 0.8 });
      const returnH = returnLabelH + 6
        + doc.font('Helvetica').fontSize(9).heightOfString(RETURN_TEXT, { width: W, lineGap: 1.5 });
      const signH = introH + 22
        + (labelH + 28)                 // client name / email
        + (labelH + 13)                 // PAYMENT OPTION label
        + (circleH + 20)                // circle-one ladder (wraps on the $1,997 tier)
        + (labelH + 28)                 // paid / balance
        + (tier === 'sprint' ? 0 : labelH + 32) // additional participant
        + (labelH + 32)                 // client signature / date
        + (labelH + 24)                 // BraveWorks RN / date
        + returnH;                      // return instructions
      need(signH);
      doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(SIGN_INTRO, M, doc.y, { width: W, lineGap: 2 });
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
        .text(circle, M, doc.y, { width: W }); // advances doc.y by the wrapped height
      doc.y += 20;

      y0 = doc.y;
      line('Amount already paid', 0.5, 0, paid); doc.y = y0;
      line('Balance remaining, and due date', 0.5, W * 0.5 + 24, balance); doc.y += 28;

      if (tier !== 'sprint') {
        y0 = doc.y;
        line('Additional participant (if any)', 0.5); doc.y = y0;
        line('Their email', 0.5, W * 0.5 + 24); doc.y += 32;
      }

      y0 = doc.y;
      line('Client signature', 0.62); doc.y = y0;
      line('Date', 0.3, W * 0.7); doc.y += 32;

      y0 = doc.y;
      line('BraveWorks RN', 0.62); doc.y = y0;
      line('Date', 0.3, W * 0.7); doc.y += 24;

      doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(8)
        .text(RETURN_LABEL, M, doc.y, { characterSpacing: 0.8 });
      doc.y += 6;
      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
        .text(RETURN_TEXT, M, doc.y, { width: W, lineGap: 1.5 });

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

// Per-plan signature-page fill lines. Figures mirror create-embedded-checkout.js,
// create-hosted-checkout.js and the ALLIN_*_PLAN_LINES maps in
// triangle-webhook.js — keep them in step. A plan not listed here gets NO
// personalized agreement (the welcome email still sends without it).
// Use agreementFillFor(plan, tier, amountCents) rather than indexing this
// directly: 'full', 'deposit', 'balance-full' and 'balance-6pay' were sold at
// both Accelerator prices and the $1,997 tier overrides them below.
export const AGREEMENT_PLAN_FILL = {
  full: { paid: '$7,500 (paid in full)', balance: 'None — paid in full' },
  sprint: { paid: '$1,997 (6-week Sprint, in full)', balance: 'None — credited if upgraded' },
  'sprint-deposit': { paid: '$200 (Sprint deposit, non-refundable)', balance: '$1,797 — bpquiz.com/sprint-balance' },
  'sprint-balance-full': { paid: '$1,997 ($200 dep + $1,797 balance)', balance: 'None — settled in full' },
  'sprint-balance-3pay': { paid: '$200 dep + $649 (payment 1 of 3)', balance: '2 more payments of $649, every 2 weeks' },
  // NOTE: the signature-page value fields render with lineBreak:false in a
  // half-width column (~42 chars at 11pt) — keep these strings short.
  deposit: { paid: '$500 (deposit, credited)', balance: '$7,000 — changemylifechallenge.com/payment' },
  'balance-full': { paid: '$7,500 ($500 dep + $7,000 balance)', balance: 'None — settled in full' },
  // 2026-10-04. Added because the agreement audit found Brenda Dancil-Jones
  // paying on this plan since 2026-08-26 with no fill, so her welcome email
  // went out with no agreement at all and nothing recorded it. Figures come
  // from this plan's own buyer line in triangle-webhook.js, not invented.
  // 2026-10-07: the deposit here was wrong. This is a LEGACY $1,997-era plan
  // (Brenda Dancil-Jones, $1,800 balance after the $197 deposit, per her own
  // line in ALLIN_JOEL_PLAN_LINES); it never had a $500 deposit.
  'balance-4pay-450': { paid: '$197 dep + $450 (payment 1 of 4)', balance: '3 more monthly payments of $450' },
  'balance-6pay': { paid: '$500 dep + $1,295 (payment 1 of 6)', balance: '5 more monthly payments of $1,295' },
  'balance-9pay': { paid: '$500 dep + $935 (payment 1 of 9)', balance: '8 more monthly payments of $935' },
  'balance-12pay': { paid: '$500 dep + $750 (payment 1 of 12)', balance: '11 more monthly payments of $750' },
  // Karen Purvis, 2026-10-04: $7,500 tier, $7,000 balance as 14 x $500 monthly.
  'balance-14pay': { paid: '$500 dep + $500 (payment 1 of 14)', balance: '13 more monthly payments of $500' },
  // Legacy $1,997-era plans (2026-10-07). Not sold any more, but a buyer on one
  // of these links now gets the $1,997 agreement instead of none at all.
  // Figures from the 2026-08-10 ladder in create-embedded-checkout.js and the
  // LEGACY lines in ALLIN_JOEL_PLAN_LINES.
  '3pay': { paid: '$699 (payment 1 of 3)', balance: '2 more payments of $699, every 2 weeks' },
  plan: { paid: '$367 (payment 1 of 6)', balance: '5 more payments of $367, every 2 weeks' },
  '9pay': { paid: '$267 (payment 1 of 9)', balance: '8 more payments of $267, every 2 weeks' },
  'balance-3pay': { paid: '$197 dep + $633 (payment 1 of 3)', balance: '2 more payments of $633, every 2 weeks' },
  'balance-5pay-360': { paid: '$197 dep + $360 (payment 1 of 5)', balance: '4 more monthly payments of $360' },
};

// Fill overrides when a shared plan name resolves to the $1,997 Accelerator.
const AGREEMENT_PLAN_FILL_1997 = {
  full: { paid: '$1,997 (paid in full)', balance: 'None — paid in full' },
  deposit: { paid: '$197 (deposit, credited)', balance: '$1,800 — due as agreed in writing' },
  'balance-full': { paid: '$1,997 ($197 dep + $1,800 balance)', balance: 'None — settled in full' },
  'balance-6pay': { paid: '$197 dep + $333 (payment 1 of 6)', balance: '5 more payments of $333, every 2 weeks' },
};

// Which agreement a plan signs. Plans that exist at only one price map
// directly; the four sold at both Accelerator prices are settled by the Stripe
// amount (cents) in AMOUNT_TIER, and fall back to the CURRENT price, flagged,
// when the amount is missing or unlisted.
const PLAN_TIER = {
  full: 'accelerator',
  deposit: 'accelerator',
  'balance-full': 'accelerator',
  'balance-6pay': 'accelerator',
  'balance-9pay': 'accelerator',
  'balance-12pay': 'accelerator',
  'balance-14pay': 'accelerator',
  '3pay': 'accelerator-1997',
  plan: 'accelerator-1997',
  '9pay': 'accelerator-1997',
  'balance-3pay': 'accelerator-1997',
  'balance-5pay-360': 'accelerator-1997',
  'balance-4pay-450': 'accelerator-1997',
  sprint: 'sprint',
  'sprint-deposit': 'sprint',
  'sprint-balance-full': 'sprint',
  'sprint-balance-3pay': 'sprint',
};
const AMOUNT_TIER = {
  full: { 750000: 'accelerator', 199700: 'accelerator-1997' },
  // $200 deposits were taken against the $1,997 price before the Sprint
  // existed (Shirley Rowland, 2026-08-17: $200 paid, $1,797 owed).
  deposit: { 50000: 'accelerator', 19700: 'accelerator-1997', 20000: 'accelerator-1997' },
  'balance-full': { 700000: 'accelerator', 180000: 'accelerator-1997', 179700: 'accelerator-1997' },
  'balance-6pay': { 129500: 'accelerator', 33300: 'accelerator-1997' },
};

// { tier, fallback }. fallback:true means the caller should console.warn:
// the $7,500 text went out on a guess and the document needs a human look.
export function resolveAgreementTier(plan, amountCents = null) {
  const byAmount = AMOUNT_TIER[plan];
  if (byAmount) {
    const t = byAmount[amountCents];
    if (t) return { tier: t, fallback: false };
    return { tier: PLAN_TIER[plan], fallback: true };
  }
  const t = PLAN_TIER[plan];
  if (t) return { tier: t, fallback: false };
  return { tier: 'accelerator', fallback: true };
}

// Signature-page fill for a plan at a resolved tier, or null when none exists.
// A $1,997-tier deposit states the amount Stripe actually took when known, so a
// $200 deposit does not read "$197".
export function agreementFillFor(plan, tier = 'accelerator', amountCents = null) {
  if (tier === 'accelerator-1997' && AGREEMENT_PLAN_FILL_1997[plan]) {
    const fill = AGREEMENT_PLAN_FILL_1997[plan];
    if (plan === 'deposit' && Number.isFinite(amountCents) && amountCents > 0) {
      const dep = amountCents / 100;
      return { paid: `${usd(dep)} (deposit, credited)`, balance: `${usd(TIER_PRICES['accelerator-1997'].fee - dep)} — due as agreed in writing` };
    }
    return fill;
  }
  return AGREEMENT_PLAN_FILL[plan] || null;
}
