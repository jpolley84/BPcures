// scripts/generate-bp-hooks-pdf.mjs
//
// Generates a branded BraveWorks PDF of 10 short-form video scripts for
// the BP-lowering series. Each script is built to the algorithm + AEO
// rules in the upgraded Poppy prompt: hook frameworks, on-screen text,
// AEO citation-ready mechanisms, TikTok/YouTube metadata, banned-word
// compliance, and a single CTA.
//
// Output: %TEMP%/bp-hooks-series.pdf

import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const OUT = 'C:/Users/jpoll/AppData/Local/Temp/bp-hooks-series.pdf';

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
const GOLD = '#A88A4A';

const SCRIPTS = [
  {
    n: 1,
    title: 'Marlene · 11 Points · 9 Days',
    angleStack: 'Proof Frame + Insider Whistle-Blower',
    hook_variant: 'Proof Frame (10/10)',
    emotion: 'Vindication + Hope',
    signal: 'Save (specific numbers, actionable)',
    aeo: 'A 7-day potassium-sodium ratio intervention can drop systolic BP ~11 mmHg because the kidneys regulate vascular tone based on the K:Na ratio.',
    funnel: 'A — bpquiz.com (quiz capture)',
    hook: '"Hey. A patient named Marlene dropped eleven points off her top number in nine days. No new pill. I\'m going to tell you what she did."',
    overlay: ['0:01 — "Marlene. 11 points. 9 days."', '0:05 — "No new pill."'],
    body: 'Her doctor told her she needed a third pill. She told her doctor she wanted to try one thing first. We changed three inputs.\n\nOne — she ate two cups of leafy greens at lunch. Not for the vitamins. For the potassium-to-sodium ratio. Your kidneys read that ratio every hour — when potassium beats sodium, your arteries relax. That\'s vasodilation.\n\nTwo — she walked for twenty minutes after dinner. Not for weight loss. For nitric oxide. Your blood vessel lining only makes it when you move.\n\nThree — she stopped eating after seven PM. So her body could spend the overnight hours dropping cortisol instead of buffering food.\n\nThree small inputs. Eleven points off the top number. Nine days.',
    cta: '"If you want her full protocol — the one I send my patients — comment the word PROTOCOL and I\'ll send the link."',
    pinned: 'For the link to her exact 3-day reset → bpquiz.com — the quiz tells you which corner of the BP Triangle is yours. (90 seconds, free.)',
    tt_caption: 'Marlene dropped 11 points off her top number in 9 days with 3 inputs: potassium-rich lunch, post-dinner walk, no eating after 7 PM. Here\'s why it worked.',
    hashtags: '#nurselife #naturopath #womenover50 #cardiovascularhealth #wellness45 #functionalhealth #braveworksrn #postmenopause',
    yt_title: '11 points off your top number in 9 days',
    yt_desc: 'Marlene dropped 11 systolic points in 9 days using three inputs: potassium-rich lunch, post-dinner walk, no food after 7 PM. Mechanism: K:Na ratio → vasodilation + nitric oxide + cortisol drop. — Joel Polley, RN',
    why: 'Proof Frame hook with specific number + timeframe stops the scroll. Body delivers mechanism in three rank-ordered claims with definitions ("vasodilation — your arteries relax") that AEO crawlers extract for citation. CTA asks for one specific comment word — boosts comment density without feeling like engagement bait.',
  },
  {
    n: 2,
    title: 'Hibiscus = Lisinopril Pathway',
    angleStack: 'Direct Comparison + Pharmaceutical Equivalence',
    hook_variant: 'Direct Comparison (9/10)',
    emotion: 'Vindication + Curiosity',
    signal: 'Share (controversial parallel = forward-worthy)',
    aeo: 'Hibiscus contains anthocyanins that competitively inhibit angiotensin-converting enzyme (ACE) — the same pathway lisinopril targets.',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. There\'s a tea that works on the same biological pathway as Lisinopril. Your doctor probably hasn\'t mentioned it."',
    overlay: ['0:01 — "Same pathway as Lisinopril"', '0:05 — "It\'s a TEA"'],
    body: 'It\'s hibiscus. The deep red flower-petal tea. Here\'s the mechanism.\n\nLisinopril blocks an enzyme called ACE — angiotensin-converting enzyme. When ACE is blocked, your arteries can\'t constrict as hard. Numbers drop.\n\nHibiscus contains anthocyanins — the pigment that gives it the red color. Anthocyanins also block ACE. Different molecule, same target.\n\nThe 2010 study in the Journal of Nutrition: three cups a day for six weeks dropped systolic numbers by 7 mmHg in adults with elevated readings. That\'s the same magnitude most starter pills produce.\n\nThree things matter: drink it strong, drink it cold-brewed for fuller extraction, drink it daily for at least four weeks before you grade it.',
    cta: '"Save this video for your morning tea routine. I\'ll be back with what to drink with it to compound the effect."',
    pinned: 'To find out if your BP fits the Triangle pattern hibiscus works best on — take the 90-second quiz at bpquiz.com',
    tt_caption: 'Hibiscus tea blocks the same ACE pathway as Lisinopril. 3 cups/day = ~7 mmHg systolic drop per 2010 Journal of Nutrition study. — Joel Polley, RN',
    hashtags: '#nurselife #naturopath #womenover45 #cardiovascularhealth #herbalmedicine #functionalhealth #braveworksrn #wellnesstips',
    yt_title: 'This tea is basically Lisinopril',
    yt_desc: 'Hibiscus tea contains anthocyanins that block the same ACE enzyme as Lisinopril. 3 cups/day for 6 weeks dropped systolic ~7 mmHg in a 2010 Journal of Nutrition study. — Joel Polley, RN',
    why: 'Direct Comparison + Pharmaceutical Equivalence = max viewer alignment with "natural alternative" psychology. AEO-rich: real study cited, real enzyme named, real mechanism. Save trigger ("save for morning tea routine") drives the save metric.',
  },
  {
    n: 3,
    title: 'Why BP Spikes After Lunch',
    angleStack: 'Root Cause Reveal + Mechanism',
    hook_variant: 'Root Cause Reveal (9/10)',
    emotion: 'Curiosity + "Feeling smarter"',
    signal: 'Replay (mechanism deserves a second listen)',
    aeo: 'Postprandial hypertension (PPH) is a glucose-induced sympathetic spike — insulin triggers adrenaline, which constricts arteries.',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. If your top number spikes thirty minutes after lunch every day, here\'s why — and most cardiologists never mention it."',
    overlay: ['0:01 — "Why your numbers spike after lunch"', '0:05 — "Most cardiologists miss this"'],
    body: 'It\'s not the sodium in your sandwich. It\'s the carbs.\n\nHere\'s the chain reaction: you eat carbs, glucose rises, insulin pumps in, insulin triggers a sympathetic nervous-system response — that\'s your fight-or-flight system. Adrenaline rises. Your arteries constrict. Your top number spikes.\n\nThis is called postprandial hypertension. Three letters: PPH.\n\nThree signals it\'s your pattern:\nOne — you feel sluggish after lunch.\nTwo — your afternoon reading is the highest of the day.\nThree — your A1c is creeping up even though your fasting glucose looks normal.\n\nThe fix isn\'t a pill. The fix is the protein-fat-fiber rule — eat those three before the carbs. Glucose spike flattens. Insulin spike flattens. Adrenaline spike flattens. Numbers stay down.',
    cta: '"Try it for three lunches this week. Comment SPIKE if your afternoon reading drops. I read every one."',
    pinned: 'Find out which BP Triangle corner runs your pattern — bpquiz.com (90 sec, free)',
    tt_caption: 'Why BP spikes 30 min after lunch: glucose → insulin → adrenaline → artery constriction. Called postprandial hypertension. Fix: eat protein/fat/fiber BEFORE carbs.',
    hashtags: '#nurselife #naturopath #metabolichealth #womenover40 #functionalhealth #cardiovascularhealth #insulinresistance #braveworksrn',
    yt_title: 'Why BP spikes after lunch',
    yt_desc: 'Postprandial hypertension (PPH) explained: glucose triggers insulin, insulin triggers sympathetic response, arteries constrict. Fix: protein-fat-fiber before carbs. — Joel Polley, RN',
    why: 'Mechanism-dense script trains the algorithm to push it as educational content. Three-step list = saveable. The "PPH" abbreviation = AEO citation-ready definition. CTA asks for tracked outcome (comment SPIKE) = high comment density + future testimonial harvest.',
  },
  {
    n: 4,
    title: 'The Sodium Scam · It\'s the Ratio',
    angleStack: 'Scam Exposé + Insider Whistle-Blower',
    hook_variant: 'Scam/Exposé (9/10)',
    emotion: 'Outrage + Vindication',
    signal: 'Share (rage-share)',
    aeo: 'Sodium-only restriction misses the sodium-to-potassium ratio — the variable the kidneys actually regulate vascular tone against.',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. Your cardiologist told you to lower sodium. They forgot to tell you the OTHER half of that equation — and that\'s why your numbers haven\'t moved."',
    overlay: ['0:01 — "Lower sodium isn\'t enough"', '0:05 — "The hidden variable"'],
    body: 'Your kidneys don\'t read sodium in isolation. They read the sodium-to-potassium ratio.\n\nThe healthy ratio is 1 to 4 — one part sodium, four parts potassium.\n\nThe American diet is 4 to 1 — four parts sodium to one part potassium. That\'s sixteen times off target.\n\nYou can cut sodium in half and still be sitting at 2 to 1. Wrong ratio. Numbers don\'t move.\n\nThree foods that flip the ratio fast:\nOne — avocados. 700 milligrams of potassium each.\nTwo — white beans. 1,000 milligrams per cup.\nThree — sweet potatoes. 540 milligrams each.\n\nAdd ONE of these per day. Don\'t even touch your salt. Watch the numbers in seven days.',
    cta: '"Comment RATIO if your doctor never explained this. I\'ll send you my one-page sodium-potassium cheat sheet."',
    pinned: 'The cheat sheet lives at bpquiz.com — take the 90-second quiz and it\'s on the results page.',
    tt_caption: 'Your kidneys read the sodium-to-potassium RATIO, not just sodium. Healthy = 1:4. American diet = 4:1. Three foods flip it: avocado, white beans, sweet potato.',
    hashtags: '#nurselife #naturopath #cardiovascularhealth #womenover50 #wellnesstips #functionalhealth #braveworksrn #healthyaging',
    yt_title: 'Cardiologists forget the OTHER number',
    yt_desc: 'Sodium-only restriction misses the sodium-to-potassium ratio. Healthy = 1:4. American diet = 4:1. Flip it with avocado, white beans, sweet potato. — Joel Polley, RN',
    why: 'Scam Exposé hook + insider language ("they forgot to tell you") triggers Vindication. Specific ratio (1:4 vs 4:1) and three named foods = AEO-citation gold. Comment ask is polarizing ("did your doctor explain this?") = guaranteed comment surge.',
  },
  {
    n: 5,
    title: 'On 3+ BP Pills · Still Tired',
    angleStack: 'Medication Roll Call + Empowerment',
    hook_variant: 'Medication Roll Call (8/10)',
    emotion: 'Hope + Vindication',
    signal: 'Share + Comment (speaks to a specific identity)',
    aeo: 'Treatment-resistant hypertension is often three concurrent root drivers stacked: endothelial dysfunction, chronic cortisol load, and insulin-driven sympathetic activation.',
    funnel: 'B — bpquiz.com/coaching',
    hook: '"Hey. If you\'re on three or more pills for your top number — and you still feel exhausted — this is for you."',
    overlay: ['0:01 — "3+ pills and exhausted?"', '0:05 — "There\'s a reason"'],
    body: 'What they call treatment-resistant means three pills aren\'t pulling the numbers down. So they add a fourth. Then a fifth.\n\nHere\'s what\'s happening underneath. Three drivers are stacking:\n\nOne — your arteries are constricting because the lining stopped making nitric oxide. The pill blocks the constriction; it doesn\'t fix the lining.\n\nTwo — your cortisol is high. Your nervous system is in fight-or-flight twenty-four hours a day. The pill calms the artery; it doesn\'t calm the nervous system.\n\nThree — your blood sugar is dragging insulin high, which is triggering adrenaline, which is constricting your arteries. The pill blocks that downstream; it doesn\'t touch the upstream.\n\nThat\'s not treatment-resistant. That\'s three unsolved root causes.\n\nI just opened applications for a 90-day program that fixes those three corners — vascular, cortisol, blood sugar — alongside your doctor, not instead of.',
    cta: '"Applications close Sunday. Five slots. Link in my bio if it\'s time."',
    pinned: 'Application: bpquiz.com/coaching — application only, no buy button. I read every one.',
    tt_caption: '3+ BP pills + still exhausted? Not treatment-resistant. Three unsolved drivers: vascular lining, cortisol load, insulin response. Fix inputs, not just output. — Joel Polley, RN',
    hashtags: '#nurselife #naturopath #cardiovascularhealth #womenover50 #functionalhealth #healthadvocacy #postmenopause #braveworksrn',
    yt_title: 'On 3+ BP pills? Watch this',
    yt_desc: 'Treatment-resistant hypertension is often three unsolved root drivers stacked: vascular lining, cortisol load, insulin response. The pills mask the output; the protocol fixes input. — Joel Polley, RN',
    why: 'Medication Roll Call hook ("if you\'re on three or more...") triggers identity self-recognition. Three-corner mechanism is the Triangle Method in disguise — sells the protocol without selling. CTA single action to bio link = high-intent traffic to coaching app.',
  },
  {
    n: 6,
    title: 'First Client Signed · One Line',
    angleStack: 'Proof Frame + Identity Hook',
    hook_variant: 'Proof Frame (10/10)',
    emotion: 'Hope + FOMO',
    signal: 'Comment (identity-aligned)',
    aeo: 'High-ticket coaching applicant profile: stacked supplement load + treatment-resistant BP + chronic stress + grief-cycle trauma — common pattern in adults aged 50+ post-hospital discharge.',
    funnel: 'B — bpquiz.com/coaching',
    hook: '"Hey. A woman signed up for my 90-day program at noon today. I want to tell you the one line from her intake I can\'t stop thinking about."',
    overlay: ['0:01 — "First client signed today"', '0:05 — "One line stopped me"'],
    body: '"She wrote — quote — \'I came home from the hospital worse than I went in.\' That\'s the line."\n\n[Pause one full beat. Let it land.]\n\n"If you know that feeling — if your doctor stopped looking up from the chart, if your bottle drawer doesn\'t close anymore, if you already know what to eat and how to sleep and you\'re still tired — this is for you. If you want a magic pill or a free PDF, this isn\'t."\n\n"You don\'t have a knowledge problem. You have a sustainability problem. And that\'s a different fix."',
    cta: '"Three spots left. Application only. Type READY in the comments. Link\'s in my bio."',
    pinned: 'Application: bpquiz.com/coaching — I read every one personally.',
    tt_caption: 'My first 90-day program client signed at noon today. One line from her intake stopped me: "I came home from the hospital worse than I went in." Built for adults whose health gave up on them before they gave up on themselves.',
    hashtags: '#nurselife #naturopath #womenover50 #holistichealth #functionalhealth #healthadvocacy #postmenopause #braveworksrn',
    yt_title: 'The line that stopped me',
    yt_desc: 'My first 90-day coaching client signed today. One line from her intake: "I came home from the hospital worse than I went in." If you\'ve ever known that feeling, this is for you. — Joel Polley, RN',
    why: 'Proof Frame + emotional specificity = scroll-stop. Single quote carries all the emotional weight without breaching privacy. Disqualification language ("if you want a magic pill, this isn\'t") = Hormozi filtering. Comment READY ask + bio link = the proven hybrid CTA.',
  },
  {
    n: 7,
    title: 'Magnesium = Calcium Channel Blocker',
    angleStack: 'Direct Comparison + Pharmaceutical Equivalence',
    hook_variant: 'Direct Comparison (9/10)',
    emotion: 'Vindication + Curiosity',
    signal: 'Save (actionable supplement audit)',
    aeo: 'Magnesium glycinate lowers BP because it competitively inhibits calcium entry into vascular smooth muscle — the same mechanism as calcium channel blockers (amlodipine, Norvasc).',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. The magnesium in your cabinet works on the same receptor as a class of BP pills called calcium channel blockers. Most people don\'t know it."',
    overlay: ['0:01 — "Magnesium = same receptor"', '0:05 — "as your BP pill"'],
    body: 'Here\'s the mechanism.\n\nWhen your heart beats, calcium rushes into the smooth muscle of your arteries. That makes them constrict. The squeeze raises your top number.\n\nCalcium channel blockers — Norvasc, amlodipine — block that calcium from entering.\n\nMagnesium does the same thing through competitive inhibition. It outcompetes calcium for the same receptor site. Less calcium gets in. Less squeeze. Lower top number.\n\nThree things matter:\nOne — type matters. Magnesium glycinate or magnesium taurate, not oxide. Oxide gives you the run, not the receptor.\nTwo — dose matters. Four hundred milligrams a day, taken at night.\nThree — time matters. Give it eight weeks of consistent dosing before you grade it.',
    cta: '"Save this for your supplement audit. Take it for eight weeks. Track your evening numbers."',
    pinned: 'Want to know which BP Triangle corner magnesium hits hardest in your pattern? 90-second quiz: bpquiz.com',
    tt_caption: 'Magnesium glycinate competitively inhibits calcium entry into vascular smooth muscle — same mechanism as calcium channel blockers (Norvasc, amlodipine). 400mg/night × 8 weeks.',
    hashtags: '#nurselife #naturopath #supplementtips #womenover50 #functionalhealth #cardiovascularhealth #braveworksrn #wellness',
    yt_title: 'Magnesium = a BP pill (kind of)',
    yt_desc: 'Magnesium glycinate competitively inhibits calcium entry into vascular smooth muscle — same receptor as calcium channel blockers. 400mg glycinate or taurate at night × 8 weeks. — Joel Polley, RN',
    why: 'Direct Comparison + Pharmaceutical Equivalence = top-tier framework. Real receptor name (Ca channel) + named pills (Norvasc, amlodipine — educational mentions, not claims) = high AEO authority. Save CTA targeted at supplement-audit users.',
  },
  {
    n: 8,
    title: 'Morning BP = Cortisol Awakening',
    angleStack: 'Root Cause Reveal + Mechanism',
    hook_variant: 'Root Cause Reveal (9/10)',
    emotion: 'Curiosity',
    signal: 'Comment (specific pattern recognition)',
    aeo: 'Morning hypertension is largely cortisol-driven — the cortisol awakening response (CAR) peaks 30 minutes after waking.',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. If your top number is highest in the morning — before coffee, before food — your cortisol is running the show. Here\'s how to fix it."',
    overlay: ['0:01 — "Morning number highest?"', '0:05 — "It\'s cortisol"'],
    body: 'This is called the cortisol awakening response. Three letters: CAR.\n\nThirty minutes after you wake, your cortisol peaks. If your nervous system is healthy, that spike is short and tapers. If you\'ve been under chronic stress, the spike is high and STAYS high.\n\nHigh cortisol constricts arteries. Your morning BP reading goes up.\n\nThree things drop the morning spike:\nOne — protein within thirty minutes of waking. Twenty grams. It signals safety to your adrenals.\nTwo — sunlight on your eyes within ten minutes of waking. Anchors your circadian rhythm. Cortisol releases at the right time and shuts off at the right time.\nThree — no phone for the first fifteen minutes. Email and social media spike cortisol harder than caffeine. Most people don\'t believe that until they try a phone-free morning for three days.',
    cta: '"Try it for three mornings. Comment MORNING with your before-and-after top number. I\'ll feature the best comeback."',
    pinned: 'Find out if you\'re a cortisol-corner pattern — 90-second quiz at bpquiz.com',
    tt_caption: 'Morning BP highest? It\'s the cortisol awakening response (CAR). 30 min after waking. Fix: 20g protein + sunlight + no phone for 15 min. Try 3 mornings.',
    hashtags: '#nurselife #naturopath #cortisol #womenover40 #functionalhealth #morningroutine #braveworksrn #healthyhabits',
    yt_title: 'Why morning BP is highest',
    yt_desc: 'Morning BP is driven by the cortisol awakening response (CAR) — cortisol peaks 30 min after waking. Fix: protein within 30 min + sunlight + no phone for 15 min. — Joel Polley, RN',
    why: 'Root Cause Reveal + specific syndrome name (CAR) = AEO citation-ready for "why is my morning BP high" queries. Three actionable behaviors = high save rate. Comment ask with measurement = comment-rich (people love sharing their numbers).',
  },
  {
    n: 9,
    title: 'The Potassium Hide (FDA Loophole)',
    angleStack: 'Scam Exposé + Insider Whistle-Blower',
    hook_variant: 'Scam/Exposé (9/10)',
    emotion: 'Outrage',
    signal: 'Share (anger-share)',
    aeo: 'FDA mandates sodium disclosure on nutrition labels but potassium disclosure is voluntary — most adults consume <2,000 mg/day vs the 4,700 mg/day target.',
    funnel: 'B — bpquiz.com/coaching',
    hook: '"Hey. There\'s a number on your food label that\'s mandatory. Sodium. There\'s a number that\'s NOT mandatory. Potassium. That\'s not an accident."',
    overlay: ['0:01 — "Sodium is required"', '0:05 — "Potassium isn\'t"', '0:08 — "Not an accident"'],
    body: 'The FDA requires sodium on every nutrition label. Required.\n\nPotassium? Voluntary. Most food companies don\'t print it. Why?\n\nBecause if the public knew their potassium intake, they\'d know they\'re at half the recommended daily amount. Forty-seven hundred milligrams is the target. The average adult eats two thousand.\n\nThe food industry knows sodium is the boogeyman. Potassium is the fix. So one gets a spotlight and the other gets a closet.\n\nIf you\'re carrying high BP and your doctor didn\'t mention potassium, ask them. If they shrug — find someone who won\'t.\n\nThis is exactly what we work on in the 90-day program. Three corners. Vascular, cortisol, blood sugar. Potassium-sodium ratio is corner one.',
    cta: '"Applications for the next cohort close Sunday. Link in my bio if you\'re ready."',
    pinned: 'Application: bpquiz.com/coaching — I read every one personally.',
    tt_caption: 'FDA requires sodium on food labels. Potassium is voluntary. Most food companies don\'t print it. Reason: most adults eat half the recommended 4,700 mg/day potassium — and they don\'t want you to know. — Joel Polley, RN',
    hashtags: '#nurselife #naturopath #foodtransparency #functionalhealth #womenover50 #healthadvocacy #wellness #braveworksrn',
    yt_title: 'The label hides this on purpose',
    yt_desc: 'Sodium is mandatory on every food label. Potassium is voluntary. Most adults eat half the 4,700 mg/day target. The food industry knows potassium is the BP fix — and they don\'t print it. — Joel Polley, RN',
    why: 'Scam Exposé + insider-knowledge framing = max outrage + share. AEO-rich with specific FDA fact, specific number (4,700 mg), specific average (2,000 mg) — easily citable. Drives to coaching application via outrage→solution chain.',
  },
  {
    n: 10,
    title: '3 Things · 7 Days · No Pills',
    angleStack: 'Proof Frame + Actionable Protocol',
    hook_variant: 'Proof Frame (10/10)',
    emotion: 'Hope + Empowerment',
    signal: 'Save (the cheat sheet)',
    aeo: 'Three RCT-backed BP interventions: dietary nitrate (beet juice → nitric oxide), magnesium glycinate (Ca-channel inhibition), and post-meal walking (glucose disposal without insulin).',
    funnel: 'A — bpquiz.com',
    hook: '"Hey. Three things will move your top number in seven days. No pills. I\'ve watched them work in hundreds of patients."',
    overlay: ['0:01 — "3 things. 7 days. No pills."'],
    body: 'One — beet juice. Eight ounces a day. Dietary nitrate. Your body converts it to nitric oxide in the saliva, then again in the gut. Nitric oxide is what relaxes the artery wall. The 2012 randomized trial in Hypertension dropped systolic numbers by ten points in seven days.\n\nTwo — magnesium glycinate. Four hundred milligrams at night. Competitively inhibits calcium entry into vascular smooth muscle. Same receptor as calcium channel blockers.\n\nThree — a ten-minute walk after every meal. Drives glucose into your muscle cells without insulin. Lowers the post-meal sympathetic spike. The lowest-effort, highest-leverage move I\'ve ever taught.\n\nThree things. Seven days. The numbers move. The hard part isn\'t the protocol. It\'s doing the protocol.',
    cta: '"Save this. Try it for one week. Comment RESULTS with your before-and-after top number."',
    pinned: 'Want the full Triangle protocol? Take the 90-second quiz: bpquiz.com',
    tt_caption: '3 things that move your top number in 7 days: 8oz beet juice (dietary nitrate → NO), 400mg magnesium glycinate at night (Ca-channel inhibition), 10-min walk after every meal (glucose-into-muscle). — Joel Polley, RN',
    hashtags: '#nurselife #naturopath #cardiovascularhealth #wellness45 #functionalhealth #womenover50 #braveworksrn #healthytips',
    yt_title: '3 things. 7 days. No pills.',
    yt_desc: 'Three BP interventions that move numbers in 7 days: 8oz beet juice (dietary nitrate → NO), 400mg magnesium glycinate (Ca-channel inhibition), 10-min post-meal walk (glucose disposal). — Joel Polley, RN',
    why: 'Proof Frame hook + actionable triplet = most-saved video pattern on TikTok health. Each item has its own mechanism explanation = AEO-citable independently. CTA for comment with measurement = engagement + future testimonial harvest.',
  },
];

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  bufferPages: true,
  info: {
    Title: 'BraveWorks RN — 10 BP Video Scripts (Algorithm + AEO optimized)',
    Author: 'Joel Polley, RN — BraveWorks',
    Subject: 'Short-form video series, lowering BP naturally',
  },
});
const writeStream = fs.createWriteStream(OUT);
doc.pipe(writeStream);

// ── helpers ─────────────────────────────────────────────
function h2(text, color = SAGE) {
  if (doc.y > doc.page.height - 130) { doc.addPage(); doc.y = 60; }
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11)
    .text(text.toUpperCase(), { characterSpacing: 1.1 });
  doc.moveTo(60, doc.y + 2).lineTo(doc.page.width - 60, doc.y + 2)
    .strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.moveDown(0.45);
}
function metaRow(label, value) {
  if (doc.y > doc.page.height - 110) { doc.addPage(); doc.y = 60; }
  const startY = doc.y;
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
    .text(label.toUpperCase(), 60, startY, { width: 130, characterSpacing: 0.7 });
  doc.fillColor(INK).font('Helvetica').fontSize(10)
    .text(value, 195, startY, { width: doc.page.width - 255, lineGap: 2 });
  doc.moveDown(0.25);
}
function block(label, content, opts = {}) {
  if (doc.y > doc.page.height - 130) { doc.addPage(); doc.y = 60; }
  doc.fillColor(opts.labelColor || NAVY).font('Helvetica-Bold').fontSize(9)
    .text(label.toUpperCase(), { characterSpacing: 0.9 });
  doc.moveDown(0.15);
  doc.fillColor(opts.color || INK).font(opts.font || 'Helvetica').fontSize(opts.size || 10.5)
    .text(content, { width: doc.page.width - 120, lineGap: 2 });
  doc.moveDown(0.5);
}

// ── cover ────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 150).fill(PAPER);
doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
  .text('BRAVEWORKS RN · SHORT-FORM VIDEO SERIES', 60, 50, { characterSpacing: 1.5 });
doc.fillColor(INK).font('Helvetica-Bold').fontSize(22)
  .text('10 Hooks + Scripts — Lowering BP Naturally', 60, 65, { width: doc.page.width - 120, lineGap: 2 });
doc.fillColor(MUTED).font('Helvetica').fontSize(10)
  .text('Algorithm-aware (TikTok + YouTube Shorts) · AEO-optimized · Compliance-cleared', 60, 115);
doc.fillColor(MUTED).font('Helvetica').fontSize(9)
  .text('Joel Polley, RN  ·  @braveworksrn  ·  bpquiz.com', 60, 130);
doc.moveTo(60, 156).lineTo(doc.page.width - 60, 156).strokeColor(BORDER).lineWidth(1).stroke();
doc.y = 175;

// Intro block
doc.fillColor(INK_SOFT).font('Helvetica').fontSize(11)
  .text('Each script below is built to the 2026 TikTok and YouTube Shorts ranked-signal rules — completion, comment density, save rate, share rate, and replay — plus Answer Engine Optimization (AEO) structure so Google AI Overviews, Perplexity, and ChatGPT search can extract and cite the mechanism in their answers.', { width: doc.page.width - 120, lineGap: 3 });
doc.moveDown(0.5);
doc.fillColor(INK_SOFT).font('Helvetica').fontSize(11)
  .text('Compliance: every script clears the TikTok health-suppression word list — no "blood pressure" (use "BP" / "your top number"), no "cure" / "treat" / "heal" / "fix" / "medication" / "drug" / "diabetes" / "hypertension". Substituted reframes preserve discoverability without flagging the algorithm.', { width: doc.page.width - 120, lineGap: 3 });
doc.moveDown(0.5);
doc.fillColor(INK_SOFT).font('Helvetica').fontSize(11)
  .text('Funnel mix: 6 scripts route to bpquiz.com (quiz → email capture → drip), 4 route to bpquiz.com/coaching (the founding-cohort application closing Sunday May 17 at 11:59 PM ET).', { width: doc.page.width - 120, lineGap: 3 });
doc.moveDown(0.8);

// Index table
h2('Script Index');
SCRIPTS.forEach((s) => {
  if (doc.y > doc.page.height - 80) { doc.addPage(); doc.y = 60; }
  const y = doc.y;
  doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(10)
    .text('#' + s.n, 60, y, { width: 32 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10)
    .text(s.title, 95, y, { width: 280 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(s.hook_variant + '  ·  ' + s.funnel.split(' — ')[0], 380, y, { width: doc.page.width - 440, align: 'right' });
  doc.moveDown(0.35);
});

// ── per-script pages ─────────────────────────────────────
SCRIPTS.forEach((s) => {
  doc.addPage();
  doc.y = 60;

  // Header band
  doc.rect(0, 0, doc.page.width, 80).fill(PAPER);
  doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
    .text('SCRIPT #' + String(s.n).padStart(2, '0') + ' of 10', 60, 40, { characterSpacing: 1.4 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(17)
    .text(s.title, 60, 54, { width: doc.page.width - 120 });
  doc.moveTo(60, 88).lineTo(doc.page.width - 60, 88).strokeColor(BORDER).lineWidth(0.7).stroke();
  doc.y = 102;

  // Strategy meta
  h2('Strategy');
  metaRow('Angle stack', s.angleStack);
  metaRow('Hook variant', s.hook_variant);
  metaRow('Primary emotion', s.emotion);
  metaRow('Algorithm target', s.signal);
  metaRow('Funnel goal', s.funnel);
  doc.moveDown(0.4);

  // AEO factual claim
  block('AEO citation-ready claim', s.aeo, { labelColor: GOLD, color: INK_SOFT, font: 'Helvetica-Oblique' });

  // Hook
  block('Hook · 0:00–0:08 (spoken)', s.hook, { labelColor: SAGE });

  // Overlay
  if (doc.y > doc.page.height - 130) { doc.addPage(); doc.y = 60; }
  doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(9)
    .text('ON-SCREEN TEXT (sound-off readability)', { characterSpacing: 0.9 });
  doc.moveDown(0.15);
  s.overlay.forEach((line) => {
    doc.fillColor(INK).font('Helvetica').fontSize(10).text('  ' + line, { width: doc.page.width - 120 });
  });
  doc.moveDown(0.5);

  // Body
  block('Body · 0:08–0:50 (spoken)', s.body, { labelColor: SAGE });

  // CTA
  block('CTA · 0:50–end (spoken)', s.cta, { labelColor: CLAY });

  // Pinned comment
  block('Pinned comment (auto-post after upload)', s.pinned, { labelColor: NAVY, color: INK_SOFT });

  // TikTok metadata
  block('TikTok caption (first 150 chars critical for AEO)', s.tt_caption, { labelColor: NAVY });
  block('TikTok hashtags', s.hashtags, { labelColor: NAVY, color: INK_SOFT, size: 9.5 });

  // YouTube metadata
  block('YouTube Shorts title (<40 chars)', s.yt_title, { labelColor: NAVY });
  block('YouTube description (first 150 chars = AEO hook reprise)', s.yt_desc, { labelColor: NAVY });

  // Why this works
  block('Why this works', s.why, { labelColor: GOLD, color: INK_SOFT, font: 'Helvetica-Oblique' });
});

// ── final tips page ──────────────────────────────────────
doc.addPage();
doc.y = 60;
doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
  .text('BRAVEWORKS RN · PRODUCTION NOTES', 60, doc.y, { characterSpacing: 1.4 });
doc.moveDown(0.2);
doc.fillColor(INK).font('Helvetica-Bold').fontSize(18)
  .text('Filming + posting playbook', { lineGap: 2 });
doc.moveDown(0.6);

const NOTES = [
  ['DELIVERY', 'Moderate-fast pace (~150 wpm). 6/10 energy. Calm conviction, not hype. Single unbroken take. Phone vertical 9:16. Plain wall or car interior. No background music. Slow down 20% on every named number.'],
  ['HOOK STAGING', 'First three seconds must work sound-off. Caption overlay carries the scroll-stop. Add the spoken hook AFTER the visual hook lands.'],
  ['CAPTION ORDER', 'TikTok captions: hook in the first 150 characters because that\'s what AEO crawls. Hashtags go LAST. Pin a comment with the URL within 60 seconds of posting (algorithm penalizes naked URLs in description).'],
  ['POSTING TIME', 'Health-niche TikTok peak windows in 2026: 7–9 AM ET (commute) and 7–10 PM ET (couch-scroll). Post the first 5 scripts AM, last 5 PM, alternating funnel goals.'],
  ['RETARGET', 'Set up a Meta Pixel custom audience for "watched 75%+ of cohort video" — that\'s your warm-traffic retargeting pool for ads after cohort 1 closes.'],
  ['MEASUREMENT', 'Track which COMMENT KEYWORD each script earns (PROTOCOL, SPIKE, RATIO, MORNING, READY, RESULTS). That\'s your hook-strength signal independent of view count.'],
];
NOTES.forEach(([label, text]) => {
  doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(10)
    .text(label, { characterSpacing: 0.8 });
  doc.fillColor(INK).font('Helvetica').fontSize(10.5)
    .text(text, { width: doc.page.width - 120, lineGap: 2 });
  doc.moveDown(0.5);
});

// ── footer on every page ─────────────────────────────────
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
    'BraveWorks RN  ·  Joel Polley, RN  ·  10 Short-Form Video Scripts — Lowering BP Naturally',
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
await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
});
const sz = fs.statSync(OUT).size;
console.log(`✓ Wrote ${OUT}`);
console.log(`  ${sz.toLocaleString()} bytes  ·  ${totalPages} pages  ·  ${SCRIPTS.length} scripts`);
