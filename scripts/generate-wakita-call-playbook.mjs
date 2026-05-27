// scripts/generate-wakita-call-playbook.mjs
//
// One-shot generator: builds a branded BraveWorks PDF sales-call playbook
// for Wakita Cirillo Browne's 2026-05-13 12:00 PM Central coaching call.
//
// Layered methods:
//   - Chris Do (The Futur):    diagnose-then-prescribe, value-before-price,
//                              never-chase, outcome-first pricing
//   - Daniel Priestley (KPI):  Score on the Doors, pitch waterfall,
//                              ascension model, 9-2-5 prospect profile
//   - Myron Golden (Wealth):   4 levels of value (implementation,
//                              unification, communication, imagination),
//                              irresistible offer stack, premium framing,
//                              biblical wisdom undertone
//
// Content woven from her ACTUAL 2026-05-13 intake responses pulled from
// KV wakita-intake:1778684368647. Direct quotes appear verbatim in
// callout blocks so Joel can mirror her words on the call.
//
// Output: %TEMP%/wakita-call-playbook.pdf

import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const OUT = 'C:/Users/jpoll/AppData/Local/Temp/wakita-call-playbook.pdf';

// Palette mirrors the intake PDF
const PAPER = '#FBF8F1';
const INK = '#2C2A26';
const INK_SOFT = '#5B564C';
const MUTED = '#9C9485';
const SAGE = '#3F5A3C';
const SAGE_SOFT = '#E6EBE0';
const CLAY = '#B85A36';
const CLAY_SOFT = '#F5E4DA';
const BORDER = '#E6DECE';
const NAVY = '#2F3E4E';

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  bufferPages: true,
  info: {
    Title: 'Wakita Cirillo Browne — Sales Call Playbook',
    Author: 'Joel Polley, RN — BraveWorks',
    Subject: 'Chris Do + Daniel Priestley + Myron Golden layered call structure',
  },
});

doc.pipe(fs.createWriteStream(OUT));

// ── helpers ──────────────────────────────────────────────────
function h1(text) {
  if (doc.y > doc.page.height - 140) { doc.addPage(); doc.y = 60; }
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(text, { lineGap: 4 });
  doc.moveDown(0.4);
}
function h2(text, color = SAGE) {
  if (doc.y > doc.page.height - 120) { doc.addPage(); doc.y = 60; }
  doc.fillColor(color).font('Helvetica-Bold').fontSize(12).text(text.toUpperCase(), { characterSpacing: 1.2 });
  doc.moveTo(60, doc.y + 2).lineTo(doc.page.width - 60, doc.y + 2).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}
function h3(text, color = NAVY) {
  if (doc.y > doc.page.height - 100) { doc.addPage(); doc.y = 60; }
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(text);
  doc.moveDown(0.2);
}
function p(text, opts = {}) {
  if (doc.y > doc.page.height - 90) { doc.addPage(); doc.y = 60; }
  doc.fillColor(opts.color || INK).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 10).text(text, {
    width: doc.page.width - 120,
    lineGap: 2,
    align: opts.align || 'left',
  });
  doc.moveDown(opts.gap || 0.4);
}
function quote(text, label) {
  if (doc.y > doc.page.height - 120) { doc.addPage(); doc.y = 60; }
  const startY = doc.y;
  doc.rect(60, startY, doc.page.width - 120, 2).fill(CLAY);
  doc.y = startY + 8;
  doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(8).text(`HER WORDS — ${label}`.toUpperCase(), { characterSpacing: 0.8 });
  doc.moveDown(0.2);
  doc.fillColor(INK).font('Helvetica-Oblique').fontSize(11).text(`"${text}"`, { width: doc.page.width - 120, lineGap: 2 });
  doc.moveDown(0.5);
}
function callout(label, text, bg = SAGE_SOFT, fg = SAGE) {
  if (doc.y > doc.page.height - 140) { doc.addPage(); doc.y = 60; }
  const startY = doc.y;
  doc.fillColor(bg).rect(60, startY, doc.page.width - 120, 6).fill();
  doc.y = startY + 12;
  doc.fillColor(fg).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), { characterSpacing: 1 });
  doc.moveDown(0.2);
  doc.fillColor(INK).font('Helvetica').fontSize(10).text(text, { width: doc.page.width - 120, lineGap: 2 });
  doc.moveDown(0.5);
}
function bullet(text) {
  if (doc.y > doc.page.height - 80) { doc.addPage(); doc.y = 60; }
  doc.fillColor(INK).font('Helvetica').fontSize(10);
  doc.text(`•  ${text}`, 70, doc.y, { width: doc.page.width - 130, lineGap: 2 });
  doc.moveDown(0.25);
}
function script(speaker, text) {
  if (doc.y > doc.page.height - 100) { doc.addPage(); doc.y = 60; }
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(speaker.toUpperCase(), { characterSpacing: 0.8 });
  doc.fillColor(INK).font('Helvetica').fontSize(10).text(text, { width: doc.page.width - 120, lineGap: 2 });
  doc.moveDown(0.4);
}

// ── cover ────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 130).fill(PAPER);
doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9).text('BRAVEWORKS RN · SALES CALL PLAYBOOK', 60, 50, { characterSpacing: 1.5 });
doc.fillColor(INK).font('Helvetica-Bold').fontSize(24).text('Wakita Cirillo Browne', 60, 68);
doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('90-Day BP Triangle Freedom Sprint — Coaching Conversion Call', 60, 100);
doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('2026-05-13 · 12:00 PM Central · Zoom · Joel Polley, RN', 60, 116);
doc.moveTo(60, 142).lineTo(doc.page.width - 60, 142).strokeColor(BORDER).lineWidth(1).stroke();
doc.y = 160;

// ── frame ────────────────────────────────────────────────────
h2('Frames layered on this call');
p('Three voices in your ear, one mouth speaking:', { bold: true, size: 10, gap: 0.3 });
bullet('CHRIS DO (The Futur) — Diagnose out loud. Value before price. Never chase. Outcome first, dollars last.');
bullet('DANIEL PRIESTLEY (KPI) — Score on the Doors. Pitch waterfall. Ascension. Identify her as the 9-2-5 prospect (9-figure pain, 2x past failures, 5x daily symptoms).');
bullet('MYRON GOLDEN (Wealth) — 4 levels of value (implementation → unification → communication → imagination). Premium framing. Irresistible stacked offer. Biblical undertone — "the body is a temple, not a clinical trial."');
doc.moveDown(0.3);
callout('Why these three together',
  'Chris Do gives you the diagnostic posture so you sound like a doctor, not a salesman. Priestley gives you the scoring tool so SHE quantifies her own pain and the gap. Myron stacks the offer so the $4,997 feels like the cheapest option on the menu. You get to be the RN — they get to be your invisible co-coaches.');

// ── her profile ──────────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Who she is — in her own words');
p('Read these out loud before the call. Match her tone. Reverence, not enthusiasm.', { color: INK_SOFT, gap: 0.4 });
quote('I knew I needed holistic therapy and a reboot, after 8 days in the hospital and coming back home worse than ever. Every lifestyle was extremely effective and too expensive to return back, when I already have a firm grasp on the basics.', 'Why now');
quote('Well clearly you\'re very knowledgeable, analytical and a wealth of experience. I\'m not qualified to tell you what to do, but even this custom questionnaire tells me you know what to ask me. That\'s more than I can say for most medical professionals, unfortunately.', 'Questions for Joel');
callout('What she just told you',
  'She pre-closed you in the intake. She declared your authority. She named her disappointment with medical professionals. She removed her own permission to push back. You don\'t need to sell — you need to LEAD. The hardest thing tonight is not to oversell.', CLAY_SOFT, CLAY);

// ── diagnostic snapshot ──────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Diagnostic snapshot — what her answers tell us');
h2('The 8 things you didn\'t know yet');
bullet('Her BP runs LOW. Always under 130/80. The "BP Triangle" frame still applies (vascular / cortisol / blood sugar) — but the entry door is COMPLETELY different from your usual buyer. This is a gut+cortisol+postmenopausal-hormone case, not an HTN case.');
bullet('She is on 80mg/day of pantoprazole AND HAS NO REFLUX. Zero. This is the biggest single medication concern in her chart. She is on one of the strongest acid blockers for a problem that isn\'t in her symptoms list anymore.');
bullet('Bloating ALL DAY, EVERY DAY. That is SIBO-pattern. The PPI is feeding the SIBO. Cycle.');
bullet('Stress 10 of 10. Sleep <5 hours. Energy "tired most of the day." Six mood checks (overwhelmed, lonely, foggy, irritable, anxious, sad). Cortisol corner is on fire.');
bullet('Diet: vegetarian + fruit-and-oatmeal breakfast + sweets daily + 18 supplements. High-carb / low-protein / blood-sugar swinging. Confirms her chart\'s BUN of 5 (low protein) and glucose 109.');
bullet('Family: Hashimoto\'s + diabetes + breast cancer. Plus she has all the soft signs of unrecognized thyroid (fatigue, mood, fog, hair). Her chart has no recent TSH.');
bullet('Postmenopausal 10+ years, NEVER on HRT. Estrogen-deprived adrenals = cortisol unbuffered. Annie\'s wheelhouse exactly.');
bullet('She self-reports past failure of "my own motivation." She needs STRUCTURE + ACCOUNTABILITY, not more education.');

doc.moveDown(0.4);
callout('The one-sentence she needs to hear from you',
  '"You don\'t have a knowledge problem. You have a sustainability problem — and we fix that with structure, not more learning."');

// ── score on the doors ───────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 1 — Score on the Doors (Priestley)');
p('Don\'t TELL her where she is. Let HER score herself, out loud. Then mirror.', { color: INK_SOFT, gap: 0.4 });
h2('Live scoring exercise (12 minutes)', NAVY);
p('Ask her to rate 1-10 for each. Write her numbers down. Repeat them back at end.', { gap: 0.3 });
bullet('Energy through a typical day (you know: she said "Tired most of the day" → expect 2-3)');
bullet('Sleep quality and quantity (you know: <5 hrs → expect 1-2)');
bullet('Stomach + GI comfort (bloating all day → expect 2-3)');
bullet('Mood and mental clarity (6 mood flags → expect 2-3)');
bullet('Trust in the path she\'s currently on (Bio Life + 18 supps + PPI) — likely 3-4');
bullet('Sustainability of what she\'s spending monthly on health (she said "too expensive to return to") — likely 1-2');

doc.moveDown(0.4);
callout('After she scores',
  '"Wakita, your average is roughly 2 out of 10. You came home from the hospital worse than you went in. You\'re carrying a 10 out of 10 stress load. And you\'re paying real money to stay at a 2. Tell me — if we got you to a 7 across all six dimensions in 90 days, would your life look different?"');

// ── the diagnose-out-loud script ─────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 2 — Diagnose out loud (Chris Do)');
p('Read each line slowly. Pause after each. Watch her face.', { color: INK_SOFT, gap: 0.4 });

script('You',
  '"Wakita — I read everything twice. Thank you for the trust. Before I share what I see, I want to say something. You wrote, and I quote, that even this questionnaire tells you I know what to ask. That landed for me. I want this call to be worth the trust you already gave me. So I\'m going to do something most consults don\'t — I\'m going to read your file back to you. And I want you to stop me anytime I get something wrong."');
script('You',
  '"First — your pain comes and goes, and the only trigger you named is stress. So your gut is reading your nervous system, not your food. That tells me where we start, and it\'s not where the hospital started."');
script('You',
  '"Second — and this is important. You said your reflux is \'never.\' Yet you\'re taking 40 milligrams of pantoprazole twice a day. That\'s 80 milligrams of one of the strongest acid suppressors we have. For a symptom that isn\'t on your list. We need to talk about that this week."');
script('You',
  '"Third — you said your bloating is all day, every day. That, plus the medication you don\'t need, plus the supplements that aren\'t working — that\'s the picture of a gut microbiome that\'s been disrupted. We can rebuild that. It takes weeks, not years."');
script('You',
  '"Fourth — you said your stress is a 10 out of 10. You sleep less than 5 hours. You feel overwhelmed, lonely, foggy, irritable, anxious, and sad. Those aren\'t six different things. That\'s one body telling you it stopped trusting that help was coming. I hear that."');
script('You',
  '"Fifth — you said you tried every lifestyle and they were effective but too expensive to go back to. So you don\'t have a knowledge problem. You have a sustainability problem. And that changes what I\'m about to offer you."');

// ── the vision ────────────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 3 — Paint the imagination (Myron level 4)');
p('Speak SLOWLY. This is the part that earns the close.', { color: INK_SOFT, gap: 0.4 });

script('You',
  '"Wakita, picture August. Three months from this call. You wake up before the alarm because your body is rested. You walk to the kitchen and the bottle drawer has three bottles in it, not eighteen. The pain you used to brace for in the afternoon hasn\'t shown up in sixty days. You finally have a primary care doctor — a real one — and she looked at your last labs and said, whatever you\'re doing, keep doing it. Your husband watches you laugh on a Tuesday afternoon because you have energy left at 2 PM. And the money you used to spend on bottles that didn\'t work is back in your account. That Wakita exists. We\'re going to go get her."');

doc.moveDown(0.3);
callout('What you just did (the Myron mechanic)',
  'You moved her from implementation (level 1 — what to swallow) and unification (level 2 — one plan instead of three) past communication (level 3 — words she can repeat) into IMAGINATION (level 4 — a future-self she can SEE). The fourth level is where buying decisions happen. The other three are where buying decisions get justified.');

// ── the structure ────────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 4 — The 90-day structure');
p('Show her the schedule. Specific. Boring. Trustworthy.', { color: INK_SOFT, gap: 0.4 });

h3('Weeks 1–2 — Stabilize and consolidate', SAGE);
bullet('Supplement consolidation audit — turn 18 bottles into 5. Estimated monthly savings: $200-300.');
bullet('PPI wean protocol initiated under RN supervision (you cannot prescribe; you guide and document for her future PCP).');
bullet('Sleep stack night 1 — magnesium glycinate, ashwagandha, light-exposure protocol. Target: 6 hours within 14 nights.');

h3('Weeks 3–6 — Triangle baseline + first lab pull', SAGE);
bullet('BP Triangle education weeks (the bible) — vascular, cortisol, blood sugar.');
bullet('Diet rebuild — protein at every meal (her BUN is 5), sweets reduced to 1× weekly.');
bullet('Labs week 6: TSH + free T4 + B12 + Vit D + ferritin + HbA1c + fasting insulin + hsCRP. She has NEVER had these run recently. This pull alone is worth the price.');

h3('Weeks 7–10 — Annie\'s hormone module + sustained rebuild', SAGE);
bullet('Annie\'s postmenopausal hormone module — she\'s been off estrogen for 10+ years with zero replacement. Annie\'s exact wheelhouse.');
bullet('Triangle protocol fully personalized to week 6 lab results.');
bullet('Stress / cortisol corner intensive — she carries it in stomach and shoulders. We give her the somatic tools she\'s never been taught.');

h3('Weeks 11–12 — Doctor-cleared independence', SAGE);
bullet('Establish her with a primary care physician (she has NONE — chart literally says "PCP: None"). We give her a 1-page protocol document her new PCP can sign off on.');
bullet('Re-pull labs. Compare to week 6. Celebrate the receipts.');
bullet('Graduation call with you + Annie + her husband on Zoom. Family wraparound.');

// ── the offer ────────────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 5 — The irresistible offer stack (Myron + Hormozi)');
p('Build value 4× the price BEFORE you name the price. Read it in this order.', { color: INK_SOFT, gap: 0.4 });

h2('The Sprint itself', SAGE);
p('Weekly 1:1 with Joel, RN (12 sessions). Biweekly group with Annie Chitate, RN (6 sessions). 24/7 voxer message access for protocol questions. Two lab pulls (weeks 6 and 12) with full clinical interpretation. Personalized supplement + medication wean plan.', { gap: 0.5 });
h3('Value: $4,997', CLAY);

h2('Bonus #1 — Supplement Consolidation Audit', SAGE);
p('Live 60-minute audit with Joel of every bottle in her drawer. Keep what works. Drop what doesn\'t. Most clients save $200-400/month immediately. For Wakita with 18 bottles + Bio Life + Mexico meds, conservatively $250/month → $750 saved during the Sprint alone.', { gap: 0.5 });
h3('Value: $497', CLAY);

h2('Bonus #2 — Annie\'s Hormone Module', SAGE);
p('Annie\'s flagship 6-session postmenopausal hormone protocol. Sold separately for $997. Built for women 10+ years past menopause with zero HRT history. Wakita\'s exact profile.', { gap: 0.5 });
h3('Value: $997', CLAY);

h2('Bonus #3 — PPI Wean Protocol (RN-supervised)', SAGE);
p('Step-by-step pantoprazole wean with mucosal-healing nutrition stack (DGL, zinc carnosine, glutamine, slippery elm). The protocol you can only get when an RN is in the room watching for rebound. Most patients are NEVER taught how to come off these — they take them for life.', { gap: 0.5 });
h3('Value: $497', CLAY);

h2('Bonus #4 — Doctor-Cleared Independence Letter', SAGE);
p('A custom 1-page protocol document for her future PCP to sign off on. Built so when she walks into her first PCP visit, the doctor has a complete picture of what she\'s doing and why. No more 7-minute appointments where she leaves with three new prescriptions.', { gap: 0.5 });
h3('Value: $297', CLAY);

doc.moveDown(0.3);
callout('Total stack value: $7,285  ·  Her investment: $4,997',
  'She has been spending — by her own admission — more than this every year on lifestyle programs and supplements that didn\'t stick. The Sprint is the cheapest thing on her current health menu, not the most expensive. Lead with that math.', CLAY_SOFT, CLAY);

// ── the close ────────────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Step 6 — The close (Chris Do — never chase)');

script('You',
  '"Wakita, I\'m not going to ask for a decision right now. I want you to feel one thing as we hang up: I see what you\'ve been carrying. And you don\'t have to carry it alone for the next 90 days. Three slots open in this cohort. You\'re a fit. Sit with what you heard tonight. Pray on it. Talk to your husband. Reply by Friday at noon if you want the spot. If you don\'t, the daily emails keep coming, and we stay friends."');

doc.moveDown(0.3);
callout('Why this works',
  'Chris Do\'s "never chase" rule. The moment you push, you lose authority. Authority is the ENTIRE asset on this call. You give her a deadline (Friday noon) which creates urgency without pressure. You name the fit ("you\'re a fit") which is the highest-status validation she can receive. You honor her process ("pray on it, talk to your husband"). And you leave the relationship intact regardless.');

// ── objection prep ───────────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Objection prep');
h2('"It\'s a lot of money"');
script('You',
  '"It is. And every objection I just heard from you is one I would have made too. Here\'s the math: tell me — what did you spend last year on supplements, the hospital deductible, the Mexico clinic, and the Bio Life regimen? Add it up. I\'ll wait."');
p('Then: "$4,997 is less than the year you just had. The difference is, this year you have a plan and a coach. Last year you had hope."', { gap: 0.5 });

h2('"I need to think about it"');
script('You',
  '"Of course. What specifically do you need to think through? Tell me — I\'ve probably already thought it for someone before you."');
p('She names something. You address it specifically. Then: "Anything else in the way?"', { gap: 0.5 });

h2('"Can my husband and I do payments?"');
script('You',
  '"Yes. Three payments of $1,797 if that fits the cash flow better. Total comes out a little higher — $5,391 — but it makes the decision easier in the moment. Pay-in-full saves you $394."');
p('Then SHUT UP. Let her choose.', { gap: 0.5 });

h2('"What if I don\'t see results?"');
script('You',
  '"You will, but here\'s the contract: the Triple Triangle Guarantee. By day 30 if you haven\'t experienced relief in your top 3 stated symptoms, I refund you in full and you keep every protocol document. By day 60 if your labs haven\'t shifted in the right direction, same deal. By day 90 if you don\'t feel safer in your body than you do today, full refund. I take the entire risk. You take the action."');

// ── post-call followup ───────────────────────────────────────
doc.addPage(); doc.y = 60;
h1('Post-call email template (send within 60 minutes)');

callout('Subject',
  'What we talked about — and what happens next', SAGE_SOFT, SAGE);

p('Wakita,', { gap: 0.3 });
p('Thank you for the conversation. I walked away thinking the same thing I thought reading your intake: the medical system gave up on you, and you didn\'t give up on yourself. That\'s the only ingredient I can\'t teach.', { gap: 0.4 });
p('To recap, here\'s what we mapped:', { bold: true, gap: 0.3 });
bullet('Weeks 1-2: PPI wean + supplement audit (probably saves you $250+/month starting week 2)');
bullet('Weeks 3-6: Triangle baseline + your first proper lab pull in years');
bullet('Weeks 7-10: Annie\'s hormone module — she\'ll walk every step with you');
bullet('Weeks 11-12: Doctor-cleared independence — a real PCP, a real protocol, a real handoff');
doc.moveDown(0.3);
p('Investment: $4,997 in full or three payments of $1,797.', { gap: 0.3 });
p('Triple Triangle Guarantee at days 30, 60, and 90. I carry the risk.', { gap: 0.4 });
p('If you\'re a yes, reply with the word "in" by Friday noon and I\'ll send the Stripe link. If you\'re a no, the daily emails keep coming and the door stays open. Either way you\'re not alone in this.', { gap: 0.4 });
p('Joel Polley, RN', { bold: true, gap: 0.1 });
p('BraveWorks', { color: INK_SOFT });

// ── footer on every page ─────────────────────────────────────
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
    'BraveWorks RN  ·  Joel Polley, RN  ·  Sales Call Playbook — Wakita Cirillo Browne',
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
doc.on('end', () => {
  const sz = fs.statSync(OUT).size;
  console.log(`✓ Wrote ${OUT}`);
  console.log(`  ${sz.toLocaleString()} bytes  ·  ${totalPages} pages`);
});
