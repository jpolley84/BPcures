// api/_evergreen-emails.js — the never-silent evergreen library.
//
// 2026-07-17 (Joel): the lead arc ends at day 15 and the buyer arc at day 30,
// after which contacts went permanently silent (Day-15 even promises "you will
// keep hearing from me"). This is the forever-loop that fixes that. Once a
// contact finishes their onboarding arc, api/evergreen-cron.js sends ONE of
// these per week, rotating through the library and looping. Never runs out.
//
// Built on the email-sequence-mastery dissections:
//   - Martell "Confession -> Framework -> Soft Ask" (teach emails)
//   - Deedee two-voice parable -> law (story emails)
//   - Martell "Pure Deposit" (zero-pitch encouragement, keeps opens alive)
//   - Myron/Gideon diagnosis-reframe (belief breaker -> bridges to help)
// The pitch is QUARANTINED to a standing P.S., branched by where the reader is
// on the ladder (lead -> $17 kit, kit buyer -> $297 Sprint, Sprint buyer ->
// coaching + tea). Give:ask ratio is 4 asks : 2 pure deposits per 6-week loop.
//
// Compliance: warm ICU-nurse voice, education ALONGSIDE the doctor, no
// treat/cure/prescribe, NEWSTART-aligned, ZERO em dashes. Postal line + unsub +
// YouTube block are appended by buildEmail's shared footer.
import { p, h2, bigQuote, callout, buildEmail, SITE_URL, SKOOL_TRIAL_URL } from './_triangle-email.js';

const u = (path, campaign) =>
  `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=evergreen&utm_campaign=${campaign}`;

const KIT_URL = u('/pay?tier=corner&corner=stress', 'kit');
const SPRINT_URL = u('/case-review', 'sprint');
const COACHING_URL = u('/coaching', 'coaching');
const TEA_URL = 'https://bpquiz.com/tea/?utm_source=email&utm_medium=evergreen&utm_campaign=tea';
const SKOOL_URL = `${SKOOL_TRIAL_URL}?utm_source=email&utm_medium=evergreen&utm_campaign=weekly-reset`;

const first = (ctx) => ctx.firstName || 'friend';

// ── Citation block ───────────────────────────────────────────────────
// Every number in this library is traceable. `source` renders the study
// line + a real link so a reader can go check the claim themselves. That
// verifiability IS the product here: we are a journal, not a supplement ad.
function sourceHtml({ claim, cite, url }) {
  return callout({
    kicker: 'THE RESEARCH',
    body: `${claim}<br><a href="${url}" style="color:#B85A36;font-weight:700;">${cite}</a>`,
  });
}
function sourceText({ claim, cite, url }) {
  return `THE RESEARCH\n${claim.replace(/<[^>]+>/g, '')}\n${cite}: ${url}`;
}

// ── Standing P.S., branched by ladder position ───────────────────────
// audience: 'lead' (no purchase) | 'buyer' (kit, no Sprint) | 'sprint' (bought Sprint)
// `alt` (true on odd library indexes) swaps the primary ladder ask for the
// $27 Weekly Reset. Leads and kit buyers therefore see their next-rung offer
// and the low-friction membership on alternating weeks, instead of the same
// ask every time. Sprint buyers already have a room, so they keep theirs.
function standingPSHtml(audience, alt = false) {
  if (alt && audience !== 'sprint') {
    return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> If you want this kind of teaching live, I run a call every Wednesday at 7pm ET inside the <a href="${SKOOL_URL}" style="color:#B85A36;font-weight:700;">Weekly Reset, $27 a month</a>. Bring your numbers and I will walk through them with you. Cancel any time.</p>`;
  }
  if (audience === 'sprint') {
    return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, there is one more room: my 90-day women's coaching group, <a href="${COACHING_URL}" style="color:#B85A36;font-weight:700;">Life Beyond the Numbers</a>. And if you want the daily tea, <a href="${TEA_URL}" style="color:#B85A36;font-weight:700;">Steady</a> is here. No rush on either.</p>`;
  }
  if (audience === 'buyer') {
    return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, the one door past the kit is the <a href="${SPRINT_URL}" style="color:#B85A36;font-weight:700;">30-Day Sprint</a>. I read your case myself, build your next 30 days in order, and we walk it through on a 1:1 call. I take 5 a month.</p>`;
  }
  return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, your next step is here: <a href="${KIT_URL}" style="color:#B85A36;font-weight:700;">Get the BP Reset Kit, $17</a>. The 10-day plan built for your loudest trigger. No rush. It is here when you want it.</p>`;
}
function standingPSText(audience, alt = false) {
  if (alt && audience !== 'sprint') return `P.S. If you want this kind of teaching live, I run a call every Wednesday at 7pm ET inside the Weekly Reset, $27 a month (${SKOOL_URL}). Bring your numbers and I will walk through them with you. Cancel any time.`;
  if (audience === 'sprint') return `P.S. Whenever you are ready, there is one more room: my 90-day women's coaching group, Life Beyond the Numbers (${COACHING_URL}). And the daily tea, Steady, is here (${TEA_URL}).`;
  if (audience === 'buyer') return `P.S. Whenever you are ready, the one door past the kit is the 30-Day Sprint (${SPRINT_URL}). I read your case myself, build your next 30 days in order, and we walk it through on a 1:1 call. I take 5 a month.`;
  return `P.S. Whenever you are ready, your next step is here: Get the BP Reset Kit, $17 (${KIT_URL}). The 10-day plan built for your loudest trigger. No rush.`;
}

// Each entry: { key, subject, preview, pitch (bool), build(ctx) -> {bodyHtml, bodyText} }
export const EVERGREEN_LIBRARY = [
  // EV1 — Teach (Martell)
  {
    key: 'messenger',
    subject: 'your number is a messenger, not the message',
    preview: 'We keep shooting the messenger and wondering why the news never changes.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Something I learned at the bedside that took me years to really understand.`),
        p(`A blood pressure number is not a disease. It is a messenger. It is your body knocking on the door, telling you something upstream is off. Stress that never lets go. Sleep that never dips. Sodium hiding in the food. The number is just the knock.`),
        p(`So when we only chase the number, we are shooting the messenger and then wondering why the same news keeps coming back.`),
        p(`The fix is never louder. It is upstream. Find the one thing knocking hardest, quiet that, and the messenger stops needing to knock so loud. That is the whole method, in one idea.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nSomething I learned at the bedside that took me years to really understand.\n\nA blood pressure number is not a disease. It is a messenger. It is your body knocking on the door, telling you something upstream is off. Stress that never lets go. Sleep that never dips. Sodium hiding in the food. The number is just the knock.\n\nSo when we only chase the number, we are shooting the messenger and then wondering why the same news keeps coming back.\n\nThe fix is never louder. It is upstream. Find the one thing knocking hardest, quiet that, and the messenger stops needing to knock so loud. That is the whole method, in one idea.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // EV2 — Story / parable (Deedee two-voice)
  {
    key: 'two-lists',
    subject: 'two women, same plan, one year apart',
    preview: 'The difference was never how hard they tried.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Stay with me on this one, ${first(ctx)}.`),
        p(`Years ago two women left my floor on the same day with the same paper in their hands. Same age. Same numbers. Same instructions.`),
        p(`The first one went home and did all of it, in whatever order the day allowed. Good weeks, then weeks that undid the good ones. A year later she was right back where she started, and she decided the plan did not work.`),
        p(`The second one changed one thing first, the thing that was knocking hardest, and let it settle before she added the next. Same list. Different order. Her numbers moved and stayed moved.`),
        bigQuote(`A plan is not a pile of good habits. A plan is the order the habits go in.`),
        p(`Nobody tried harder than anybody. One just stopped doing everything at once. That is almost always the difference.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Stay with me on this one, ${first(ctx)}.\n\nYears ago two women left my floor on the same day with the same paper in their hands. Same age. Same numbers. Same instructions.\n\nThe first one went home and did all of it, in whatever order the day allowed. Good weeks, then weeks that undid the good ones. A year later she was right back where she started, and she decided the plan did not work.\n\nThe second one changed one thing first, the thing that was knocking hardest, and let it settle before she added the next. Same list. Different order. Her numbers moved and stayed moved.\n\n"A plan is not a pile of good habits. A plan is the order the habits go in."\n\nNobody tried harder than anybody. One just stopped doing everything at once. That is almost always the difference.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // EV3 — Pure Deposit (Martell, zero pitch)
  {
    key: 'not-behind',
    subject: 'you are not behind',
    preview: 'Read this on the days it does not feel like it is working.',
    pitch: false,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Quick one today. No teaching, no ask.`),
        p(`If you have had a stretch where none of it felt like it was working, I want you to hear this from a nurse who watched thousands of people do this.`),
        p(`You are not behind.`),
        p(`The body does not change on a calendar. It changes in the quiet, unglamorous middle, the part nobody posts about, where you keep doing the small thing on the day you did not feel like it. That day counts double. You just cannot see it yet.`),
        p(`Keep going. It is adding up.`),
        p(`Joel`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nQuick one today. No teaching, no ask.\n\nIf you have had a stretch where none of it felt like it was working, I want you to hear this from a nurse who watched thousands of people do this.\n\nYou are not behind.\n\nThe body does not change on a calendar. It changes in the quiet, unglamorous middle, the part nobody posts about, where you keep doing the small thing on the day you did not feel like it. That day counts double. You just cannot see it yet.\n\nKeep going. It is adding up.\n\nJoel`,
    }),
  },

  // EV4 — Belief breaker (Myron / Gideon reframe)
  {
    key: 'not-information',
    subject: 'you do not have an information problem',
    preview: 'You have probably known what to do for a while now.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Let me say something most people in my world will not.`),
        p(`You do not have an information problem. If you have been reading my emails, you already know more about your blood pressure than most people ever will. Another article is not the thing standing between you and a lower number.`),
        p(`The gap is never knowing. The gap is applying it to your actual life. The busy week. The bad night of sleep. The plan that made sense on Monday and fell apart by Thursday because nobody helped you fit it to your real days.`),
        p(`That is not a character flaw. It is the reason coaches and nurses exist. A book cannot see your week. A person can.`),
        p(`So if you have been collecting more information hoping the next piece finally makes you consistent, you can stop. You have enough. What is missing is help turning it into a routine that survives real life.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nLet me say something most people in my world will not.\n\nYou do not have an information problem. If you have been reading my emails, you already know more about your blood pressure than most people ever will. Another article is not the thing standing between you and a lower number.\n\nThe gap is never knowing. The gap is applying it to your actual life. The busy week. The bad night of sleep. The plan that made sense on Monday and fell apart by Thursday because nobody helped you fit it to your real days.\n\nThat is not a character flaw. It is the reason coaches and nurses exist. A book cannot see your week. A person can.\n\nSo if you have been collecting more information hoping the next piece finally makes you consistent, you can stop. You have enough. What is missing is help turning it into a routine that survives real life.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // EV5 — Teach (the quiet keystone habit)
  {
    key: 'morning-walk',
    subject: 'the ten minutes that moves almost every number',
    preview: 'Not the gym. Not a program. Ten minutes, and when you do them matters.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`If I could get you to do one thing, it would not be a supplement or a gadget. It would be a ten minute walk in the morning light.`),
        p(`Here is why it does so much at once. Movement is what pushes fluid up out of your legs, so the swelling and the pooling ease. Morning light resets the stress hormone that has been running high all day, which quietly lowers the pressure it was holding up. And the rhythm of it helps your body find its nightly dip again, the one that lets your heart actually rest while you sleep.`),
        p(`Three different systems, one small walk. You do not need to sweat. You do not need shoes that cost anything. You need ten minutes and some daylight, most days.`),
        p(`Start tomorrow. Same time if you can. That is the one that compounds.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nIf I could get you to do one thing, it would not be a supplement or a gadget. It would be a ten minute walk in the morning light.\n\nHere is why it does so much at once. Movement is what pushes fluid up out of your legs, so the swelling and the pooling ease. Morning light resets the stress hormone that has been running high all day, which quietly lowers the pressure it was holding up. And the rhythm of it helps your body find its nightly dip again, the one that lets your heart actually rest while you sleep.\n\nThree different systems, one small walk. You do not need to sweat. You do not need shoes that cost anything. You need ten minutes and some daylight, most days.\n\nStart tomorrow. Same time if you can. That is the one that compounds.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // EV6 — Pure Deposit / hope (zero pitch)
  {
    key: 'still-here',
    subject: 'still here, still in your corner',
    preview: 'No lesson today. Just a check-in from a nurse who is glad you are here.',
    pitch: false,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`No teaching today. I just wanted you to know I am still here, and still in your corner.`),
        p(`A lot of people are trying to do this alone, quietly, without much cheering. If that is you, consider this your cheer. The fact that you are still opening these, still thinking about your health, still willing to try, that is not small. That is the whole thing.`),
        p(`Genetics writes the recipe. Lifestyle bakes the cake. And you are still in the kitchen. That is what matters.`),
        p(`If you ever want to tell me how it is going, just hit reply. I read them.`),
        p(`Joel`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nNo teaching today. I just wanted you to know I am still here, and still in your corner.\n\nA lot of people are trying to do this alone, quietly, without much cheering. If that is you, consider this your cheer. The fact that you are still opening these, still thinking about your health, still willing to try, that is not small. That is the whole thing.\n\nGenetics writes the recipe. Lifestyle bakes the cake. And you are still in the kitchen. That is what matters.\n\nIf you ever want to tell me how it is going, just hit reply. I read them.\n\nJoel`,
    }),
  },

  // ══════════════════════════════════════════════════════════════════
  // THE NEWSTART SERIES (8) — one pillar per email, mechanism first,
  // every number carrying a real citation the reader can go verify.
  // Framing rule: we report what a trial FOUND. We never promise the
  // reader a result, and every one of these runs alongside their doctor,
  // never instead of. No treat / cure / prescribe language anywhere.
  // ══════════════════════════════════════════════════════════════════

  // N — NUTRITION
  {
    key: 'newstart-nutrition',
    subject: 'the eating trial that outperformed a starting dose',
    preview: 'They fed people real food for 30 days and measured what happened.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`I want to start a series with you. Eight letters, eight pillars, one at a time. This is the first one, and it is the one people underestimate the most.`),
        p(`In 2001 researchers did something you almost never get to do in nutrition science. Instead of asking people what they ate, they fed them. Every meal, controlled, for weeks, at three different sodium levels.`),
        sourceHtml({
          claim: `Combining a produce-heavy eating pattern with the lowest sodium level lowered systolic pressure by 20.8 mmHg in the group that started highest, compared with the high-sodium control diet.`,
          cite: `Sacks et al., New England Journal of Medicine, 2001`,
          url: 'https://www.nejm.org/doi/full/10.1056/NEJM200101043440101',
        }),
        p(`Read that number again. In people whose pressure started above 150, food alone moved it more than a starting dose of most medications does. And the higher someone started, the more it moved.`),
        p(`Two honest notes, because I would rather you trust me than be impressed by me. The trial version of that diet included some low fat dairy. The parts doing the heavy lifting were the plants and the sodium drop, which is why the plant based version I teach holds up. And this was a feeding study, meaning every meal was handed to people. Real life is harder than that.`),
        p(`Here is your one thing this week. Do not overhaul your kitchen. Just add one more cup of vegetables to one meal a day and read the sodium number on anything that comes in a package. Most of the salt in your life is not in your shaker. It is already in the food before you touch it.`),
        p(`Next letter is Exercise, and there is a surprise in the research about which kind actually wins.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nI want to start a series with you. Eight letters, eight pillars, one at a time. This is the first one, and it is the one people underestimate the most.\n\nIn 2001 researchers did something you almost never get to do in nutrition science. Instead of asking people what they ate, they fed them. Every meal, controlled, for weeks, at three different sodium levels.\n\n${sourceText({ claim: 'Combining a produce-heavy eating pattern with the lowest sodium level lowered systolic pressure by 20.8 mmHg in the group that started highest, compared with the high-sodium control diet.', cite: 'Sacks et al., New England Journal of Medicine, 2001', url: 'https://www.nejm.org/doi/full/10.1056/NEJM200101043440101' })}\n\nRead that number again. In people whose pressure started above 150, food alone moved it more than a starting dose of most medications does. And the higher someone started, the more it moved.\n\nTwo honest notes, because I would rather you trust me than be impressed by me. The trial version of that diet included some low fat dairy. The parts doing the heavy lifting were the plants and the sodium drop, which is why the plant based version I teach holds up. And this was a feeding study, meaning every meal was handed to people. Real life is harder than that.\n\nHere is your one thing this week. Do not overhaul your kitchen. Just add one more cup of vegetables to one meal a day and read the sodium number on anything that comes in a package. Most of the salt in your life is not in your shaker. It is already in the food before you touch it.\n\nNext letter is Exercise, and there is a surprise in the research about which kind actually wins.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // E — EXERCISE
  {
    key: 'newstart-exercise',
    subject: 'the best exercise for blood pressure is not cardio',
    preview: 'They ranked every type of training head to head. One won by a mile.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar two. And this one overturned what I was taught.`),
        p(`For years the advice was walk more, get your heart rate up, do your cardio. Reasonable advice. But in 2023 a team pooled 270 trials and ranked every training style head to head to see which actually lowers resting pressure the most.`),
        sourceHtml({
          claim: `Isometric training, meaning holding a position under tension rather than moving, ranked first of all modalities and was associated with reductions of 8.24 mmHg systolic and 4.00 mmHg diastolic. The single most effective move was the wall squat.`,
          cite: `Edwards et al., British Journal of Sports Medicine, 2023`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/37491419/',
        }),
        p(`Cardio still helps. It finished mid pack, and it is good for you for a dozen other reasons. But holding still under tension beat it, and beat weights, and beat interval training.`),
        p(`Why would that be. The working theory is that when a muscle holds a contraction, blood flow through it is briefly restricted, and when you release, the vessels flood open. Do that repeatedly and the lining of your arteries gets better at relaxing on command. You are not training your heart so much as training your pipes.`),
        p(`Here is what it looks like. Back against a wall, slide down until your knees are near 90 degrees, hold two minutes, rest two minutes. Four rounds, three days a week. That is twelve minutes of actual work.`),
        p(`Two cautions from the nurse in me. Do not hold your breath, breathe the whole way through. And if you have heart disease, glaucoma, or a recent surgery, run this past your doctor before you start, because isometric holds do raise pressure while you are in them.`),
        p(`Next letter is Water, and I am going to tell you the honest truth about how thin that evidence actually is.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar two. And this one overturned what I was taught.\n\nFor years the advice was walk more, get your heart rate up, do your cardio. Reasonable advice. But in 2023 a team pooled 270 trials and ranked every training style head to head to see which actually lowers resting pressure the most.\n\n${sourceText({ claim: 'Isometric training, meaning holding a position under tension rather than moving, ranked first of all modalities and was associated with reductions of 8.24 mmHg systolic and 4.00 mmHg diastolic. The single most effective move was the wall squat.', cite: 'Edwards et al., British Journal of Sports Medicine, 2023', url: 'https://pubmed.ncbi.nlm.nih.gov/37491419/' })}\n\nCardio still helps. It finished mid pack, and it is good for you for a dozen other reasons. But holding still under tension beat it, and beat weights, and beat interval training.\n\nWhy would that be. The working theory is that when a muscle holds a contraction, blood flow through it is briefly restricted, and when you release, the vessels flood open. Do that repeatedly and the lining of your arteries gets better at relaxing on command. You are not training your heart so much as training your pipes.\n\nHere is what it looks like. Back against a wall, slide down until your knees are near 90 degrees, hold two minutes, rest two minutes. Four rounds, three days a week. That is twelve minutes of actual work.\n\nTwo cautions from the nurse in me. Do not hold your breath, breathe the whole way through. And if you have heart disease, glaucoma, or a recent surgery, run this past your doctor before you start, because isometric holds do raise pressure while you are in them.\n\nNext letter is Water, and I am going to tell you the honest truth about how thin that evidence actually is.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // W — WATER
  {
    key: 'newstart-water',
    subject: 'the pillar I refuse to oversell you',
    preview: 'Water matters. Just not for the reason most people online tell you.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar three, and I am going to do something you do not see much in health email. I am going to tell you where the evidence is weak.`),
        p(`If you search online you will find people claiming water is a blood pressure remedy. When I went looking for the trials behind that claim, they are thin and they disagree with each other. Some show a small drop, some show nothing, some show water briefly raising pressure in certain people.`),
        sourceHtml({
          claim: `In one controlled trial, short term water deprivation did not measurably increase blood pressure variability or impair vascular function in healthy adults, which is the opposite of what the popular claim predicts.`,
          cite: `Journal of Applied Physiology, 2019`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/31617739/',
        }),
        p(`So why is Water one of the eight pillars at all. Because of what it does upstream.`),
        p(`Your kidneys are the organ that decides how much sodium stays in your body. Sodium is one of the three corners of the Triangle. And your kidneys cannot flush sodium without water to carry it out. You can eat perfectly and still stall out if you have given your kidneys no medium to work with.`),
        p(`That is the honest case. Not a remedy. A requirement. It does not lower your number by itself, it lets the thing that does lower your number actually function.`),
        p(`Your one thing this week. A full glass when you wake, before anything else. If your urine is consistently dark, you are behind. If you are on a diuretic or have kidney or heart failure, your doctor may have given you a fluid limit, and that limit wins over anything I say here.`),
        p(`I would rather lose your attention telling you the truth than keep it selling you a myth. Next letter is Sunlight, and that research is genuinely startling.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar three, and I am going to do something you do not see much in health email. I am going to tell you where the evidence is weak.\n\nIf you search online you will find people claiming water is a blood pressure remedy. When I went looking for the trials behind that claim, they are thin and they disagree with each other. Some show a small drop, some show nothing, some show water briefly raising pressure in certain people.\n\n${sourceText({ claim: 'In one controlled trial, short term water deprivation did not measurably increase blood pressure variability or impair vascular function in healthy adults, which is the opposite of what the popular claim predicts.', cite: 'Journal of Applied Physiology, 2019', url: 'https://pubmed.ncbi.nlm.nih.gov/31617739/' })}\n\nSo why is Water one of the eight pillars at all. Because of what it does upstream.\n\nYour kidneys are the organ that decides how much sodium stays in your body. Sodium is one of the three corners of the Triangle. And your kidneys cannot flush sodium without water to carry it out. You can eat perfectly and still stall out if you have given your kidneys no medium to work with.\n\nThat is the honest case. Not a remedy. A requirement. It does not lower your number by itself, it lets the thing that does lower your number actually function.\n\nYour one thing this week. A full glass when you wake, before anything else. If your urine is consistently dark, you are behind. If you are on a diuretic or have kidney or heart failure, your doctor may have given you a fluid limit, and that limit wins over anything I say here.\n\nI would rather lose your attention telling you the truth than keep it selling you a myth. Next letter is Sunlight, and that research is genuinely startling.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // S — SUNLIGHT
  {
    key: 'newstart-sunlight',
    subject: 'your skin makes a blood pressure molecule',
    preview: 'And it has nothing to do with vitamin D.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar four. This is the one that made me rethink what sunlight is actually for.`),
        p(`Everyone assumes sun equals vitamin D. So researchers in Edinburgh asked a sharper question. What if sunlight does something to blood pressure that has nothing to do with vitamin D at all.`),
        p(`It turns out your skin stores nitrogen compounds in a form that light can break apart. Shine ultraviolet light on skin and those stores release nitric oxide, which is the body's own signal telling blood vessels to relax and widen.`),
        sourceHtml({
          claim: `Irradiating the skin of healthy volunteers released nitric oxide into the circulation, widened arteries and lowered blood pressure by roughly 5 mmHg. The effect happened independently of nitric oxide synthase, and independently of vitamin D.`,
          cite: `Liu, Weller et al., Journal of Investigative Dermatology, 2014`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/24445737/',
        }),
        p(`That is a real mechanism, not a wellness slogan. Your skin is a storage organ for a blood pressure molecule, and light is the key that opens it. It also helps explain something epidemiologists have puzzled over for decades, which is why blood pressure tends to run higher in winter and higher the further you live from the equator.`),
        p(`Notice what this does not say. It does not say burn. The dose in that work was brief. Burning damages skin and raises cancer risk, and no blood pressure benefit is worth that trade.`),
        p(`Your one thing this week. Ten to twenty minutes outdoors with arms or legs uncovered, most days, early or late rather than peak midday. If you are fair skinned, less. If you are on a photosensitizing medication, some antibiotics and diuretics qualify, ask your pharmacist first.`),
        p(`Next letter is Temperance, and the research there has a very specific threshold in it.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar four. This is the one that made me rethink what sunlight is actually for.\n\nEveryone assumes sun equals vitamin D. So researchers in Edinburgh asked a sharper question. What if sunlight does something to blood pressure that has nothing to do with vitamin D at all.\n\nIt turns out your skin stores nitrogen compounds in a form that light can break apart. Shine ultraviolet light on skin and those stores release nitric oxide, which is the body's own signal telling blood vessels to relax and widen.\n\n${sourceText({ claim: 'Irradiating the skin of healthy volunteers released nitric oxide into the circulation, widened arteries and lowered blood pressure by roughly 5 mmHg. The effect happened independently of nitric oxide synthase, and independently of vitamin D.', cite: 'Liu, Weller et al., Journal of Investigative Dermatology, 2014', url: 'https://pubmed.ncbi.nlm.nih.gov/24445737/' })}\n\nThat is a real mechanism, not a wellness slogan. Your skin is a storage organ for a blood pressure molecule, and light is the key that opens it. It also helps explain something epidemiologists have puzzled over for decades, which is why blood pressure tends to run higher in winter and higher the further you live from the equator.\n\nNotice what this does not say. It does not say burn. The dose in that work was brief. Burning damages skin and raises cancer risk, and no blood pressure benefit is worth that trade.\n\nYour one thing this week. Ten to twenty minutes outdoors with arms or legs uncovered, most days, early or late rather than peak midday. If you are fair skinned, less. If you are on a photosensitizing medication, some antibiotics and diuretics qualify, ask your pharmacist first.\n\nNext letter is Temperance, and the research there has a very specific threshold in it.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // T — TEMPERANCE
  {
    key: 'newstart-temperance',
    subject: 'the two drink line',
    preview: 'Below it, cutting back changed almost nothing. Above it, everything.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar five. Temperance. Most people hear that word and brace for a lecture, so let me just hand you the data instead.`),
        p(`Researchers pooled every trial they could find where people reduced their drinking, and looked at what happened to blood pressure. What they found was not a straight line. It was a threshold.`),
        sourceHtml({
          claim: `Reducing alcohol lowered blood pressure in a dose dependent way with an apparent threshold at about two standard drinks per day. Below that line, cutting back produced no significant change. Above it, the heavier the starting intake, the larger the drop.`,
          cite: `Roerecke et al., The Lancet Public Health, 2017`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/29253389/',
        }),
        p(`That is a genuinely useful finding, because it tells you whether this pillar is your lever or not. If you have a glass on Sunday, this is not the corner to work on and I am not going to pretend otherwise. If you are having three or four most nights, this may be the single biggest number on your list, larger than anything you would get from a supplement.`),
        p(`Temperance in the older sense was never only about alcohol though. It meant moderation in the good things and letting go of the harmful ones entirely. The everyday version of that is the second helping you take standing at the counter, the scrolling that eats the hour you meant to sleep, the pace you have quietly accepted as normal.`),
        p(`Your one thing this week. Count honestly for seven days. Not judge, count. Most people are genuinely surprised, in both directions. You cannot decide whether this is your lever until you know where you actually stand.`),
        p(`If cutting back is hard, that is information, not failure, and it is worth saying out loud to your doctor rather than carrying alone.`),
        p(`Next letter is Air, and I want to be precise with you about what it is and what it is not.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar five. Temperance. Most people hear that word and brace for a lecture, so let me just hand you the data instead.\n\nResearchers pooled every trial they could find where people reduced their drinking, and looked at what happened to blood pressure. What they found was not a straight line. It was a threshold.\n\n${sourceText({ claim: 'Reducing alcohol lowered blood pressure in a dose dependent way with an apparent threshold at about two standard drinks per day. Below that line, cutting back produced no significant change. Above it, the heavier the starting intake, the larger the drop.', cite: 'Roerecke et al., The Lancet Public Health, 2017', url: 'https://pubmed.ncbi.nlm.nih.gov/29253389/' })}\n\nThat is a genuinely useful finding, because it tells you whether this pillar is your lever or not. If you have a glass on Sunday, this is not the corner to work on and I am not going to pretend otherwise. If you are having three or four most nights, this may be the single biggest number on your list, larger than anything you would get from a supplement.\n\nTemperance in the older sense was never only about alcohol though. It meant moderation in the good things and letting go of the harmful ones entirely. The everyday version of that is the second helping you take standing at the counter, the scrolling that eats the hour you meant to sleep, the pace you have quietly accepted as normal.\n\nYour one thing this week. Count honestly for seven days. Not judge, count. Most people are genuinely surprised, in both directions. You cannot decide whether this is your lever until you know where you actually stand.\n\nIf cutting back is hard, that is information, not failure, and it is worth saying out loud to your doctor rather than carrying alone.\n\nNext letter is Air, and I want to be precise with you about what it is and what it is not.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // A — AIR
  {
    key: 'newstart-air',
    subject: 'six breaths a minute',
    preview: 'This is not a spiritual practice. It is a reflex you can operate by hand.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar six. And I want to be precise about what this is, because it gets lumped in with a lot of things I do not teach.`),
        p(`This is not meditation. It is not a spiritual exercise and it does not ask you to empty your mind or chant anything. It is mechanics. You have a reflex called the baroreflex, a pressure sensor loop between your arteries and your brain stem, and breathing pace is one of the few dials on it you can reach by hand.`),
        p(`Most adults breathe twelve to eighteen times a minute at rest. Slow that to around six and the reflex starts responding differently.`),
        sourceHtml({
          claim: `Across pooled trials, slow breathing lowered systolic pressure by 5.62 mmHg and diastolic by 2.97 mmHg. The effect was dose dependent: people who accumulated more than 180 minutes of practice over 8 weeks saw 15.0 mmHg systolic, versus 7.3 mmHg in those who did less.`,
          cite: `Systematic review and meta-analysis, 2019`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/31331557/',
        }),
        p(`Look at that second sentence, because it is the whole lesson. The people who did it more got roughly double the result. This is not a trick that works once. It is a reflex that retrains with repetition, the same way a muscle does.`),
        p(`Your one thing this week. Sit down, breathe in for four seconds, out for six. That is one breath every ten seconds, which is six a minute. Five minutes, once a day. Set a timer so you are not counting and watching the clock at the same time.`),
        p(`The out breath being longer than the in breath is the part that matters. That is the phase where the brake gets applied.`),
        p(`Air also means the air itself. Open a window, get outside, sleep in a room with moving air rather than sealed and stale.`),
        p(`Two letters left. Next is Rest, and the sleep data is bigger than most people realize.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar six. And I want to be precise about what this is, because it gets lumped in with a lot of things I do not teach.\n\nThis is not meditation. It is not a spiritual exercise and it does not ask you to empty your mind or chant anything. It is mechanics. You have a reflex called the baroreflex, a pressure sensor loop between your arteries and your brain stem, and breathing pace is one of the few dials on it you can reach by hand.\n\nMost adults breathe twelve to eighteen times a minute at rest. Slow that to around six and the reflex starts responding differently.\n\n${sourceText({ claim: 'Across pooled trials, slow breathing lowered systolic pressure by 5.62 mmHg and diastolic by 2.97 mmHg. The effect was dose dependent: people who accumulated more than 180 minutes of practice over 8 weeks saw 15.0 mmHg systolic, versus 7.3 mmHg in those who did less.', cite: 'Systematic review and meta-analysis, 2019', url: 'https://pubmed.ncbi.nlm.nih.gov/31331557/' })}\n\nLook at that second sentence, because it is the whole lesson. The people who did it more got roughly double the result. This is not a trick that works once. It is a reflex that retrains with repetition, the same way a muscle does.\n\nYour one thing this week. Sit down, breathe in for four seconds, out for six. That is one breath every ten seconds, which is six a minute. Five minutes, once a day. Set a timer so you are not counting and watching the clock at the same time.\n\nThe out breath being longer than the in breath is the part that matters. That is the phase where the brake gets applied.\n\nAir also means the air itself. Open a window, get outside, sleep in a room with moving air rather than sealed and stale.\n\nTwo letters left. Next is Rest, and the sleep data is bigger than most people realize.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // R — REST
  {
    key: 'newstart-rest',
    subject: 'a million people, tracked for eighteen years',
    preview: 'What short sleep does to the odds, and why it hits women harder.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Pillar seven. Rest. And this is the one people trade away first, usually without noticing they made a trade at all.`),
        p(`A healthy blood pressure is supposed to fall overnight. Ten to twenty percent below your daytime number, every night. Clinicians call it dipping, and it is when your arteries get their only real break in twenty four hours. Short sleep shortens that break.`),
        sourceHtml({
          claim: `Across 16 cohort studies following 1,044,035 people for up to 18 years, short sleep was associated with a higher rate of developing high blood pressure. Under five hours a night carried the strongest association, and women showed greater vulnerability than men.`,
          cite: `Sleep Medicine Reviews, 2024`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/39008468/',
        }),
        p(`I want to be careful with you about what that means. These are observational studies. They show a strong and consistent association across a million people, which is not nothing, but association is not the same as proof that fixing your sleep fixes your number.`),
        p(`What I will tell you from the bedside is that I have never once seen someone get their pressure in order while sleeping five hours. Not once. The body will not let go of a stress response it never gets to stand down from.`),
        p(`Worth knowing too: long sleep did not carry the same risk in that analysis. This is specifically about the short end.`),
        p(`Your one thing this week. Pick your wake time and hold it every day, including the weekend. Most people try to fix sleep from the bedtime end, which is the end you have least control over. The wake time is the anchor. Everything else drifts into place behind it.`),
        p(`One more thing, and it matters. If you snore heavily, wake gasping, or feel wrecked after a full night, ask your doctor about a sleep study. Untreated sleep apnea is one of the most common reasons blood pressure will not come down no matter what else you do, and it is very treatable once someone actually looks for it.`),
        p(`Last letter next. Trust.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nPillar seven. Rest. And this is the one people trade away first, usually without noticing they made a trade at all.\n\nA healthy blood pressure is supposed to fall overnight. Ten to twenty percent below your daytime number, every night. Clinicians call it dipping, and it is when your arteries get their only real break in twenty four hours. Short sleep shortens that break.\n\n${sourceText({ claim: 'Across 16 cohort studies following 1,044,035 people for up to 18 years, short sleep was associated with a higher rate of developing high blood pressure. Under five hours a night carried the strongest association, and women showed greater vulnerability than men.', cite: 'Sleep Medicine Reviews, 2024', url: 'https://pubmed.ncbi.nlm.nih.gov/39008468/' })}\n\nI want to be careful with you about what that means. These are observational studies. They show a strong and consistent association across a million people, which is not nothing, but association is not the same as proof that fixing your sleep fixes your number.\n\nWhat I will tell you from the bedside is that I have never once seen someone get their pressure in order while sleeping five hours. Not once. The body will not let go of a stress response it never gets to stand down from.\n\nWorth knowing too: long sleep did not carry the same risk in that analysis. This is specifically about the short end.\n\nYour one thing this week. Pick your wake time and hold it every day, including the weekend. Most people try to fix sleep from the bedtime end, which is the end you have least control over. The wake time is the anchor. Everything else drifts into place behind it.\n\nOne more thing, and it matters. If you snore heavily, wake gasping, or feel wrecked after a full night, ask your doctor about a sleep study. Untreated sleep apnea is one of the most common reasons blood pressure will not come down no matter what else you do, and it is very treatable once someone actually looks for it.\n\nLast letter next. Trust.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },

  // T — TRUST
  {
    key: 'newstart-trust',
    subject: 'the pillar with no supplement to sell',
    preview: 'Researchers studied a community that lives this one. Here is what they found.',
    pitch: true,
    build: (ctx) => ({
      bodyHtml: [
        p(`Hey ${first(ctx)},`),
        p(`Last letter. Trust. The one nobody can sell you, which is probably why you rarely hear it discussed in health content.`),
        p(`Researchers went looking at a population that actually lives this pillar rather than talking about it, and measured whether faith and the community around it showed up in their blood pressure.`),
        sourceHtml({
          claim: `Among older North American Seventh-day Adventists, people with both high religious involvement and high social interaction had lower systolic blood pressure than those with one or neither.`,
          cite: `Journal of Religion and Health, 2015`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/26337436/',
        }),
        p(`Notice the shape of that result. It was not faith alone and it was not company alone. It was both together. Belief that stayed private did not carry the same signal as belief lived out among people.`),
        p(`I will be straight with you about the limits. This is observational, and the honest state of this literature is mixed. One study I read while writing this found gratitude associated with higher cardiovascular reactivity, not lower. That is the opposite of the tidy story, and you deserve to know it exists rather than only hearing the studies that agree with me.`),
        p(`So here is what I can say without overreaching. The stress corner of the Triangle is not primarily about workload. It is about carrying something with no one to hand it to. A body that never gets to stand down stays in a pressure state, and the fastest way I know to stand down is not a technique. It is being genuinely known by somebody, and trusting that you are held by God rather than by your own grip.`),
        p(`Your one thing this week. Tell one person the real answer when they ask how you are doing. Not the reflex answer. The real one.`),
        p(`That is the eight. Nutrition, Exercise, Water, Sunlight, Temperance, Air, Rest, Trust. Nobody does all eight well, including me. You are looking for the one that is loudest right now, and you are only working that one.`),
        p(`Next time I write, we start on the remedies themselves, herb by herb, same rule as this series. Every number gets a source you can go check.`),
        p(`One trigger at a time,`),
        p(`Joel Polley, RN`),
      ].join(''),
      bodyText: `Hey ${first(ctx)},\n\nLast letter. Trust. The one nobody can sell you, which is probably why you rarely hear it discussed in health content.\n\nResearchers went looking at a population that actually lives this pillar rather than talking about it, and measured whether faith and the community around it showed up in their blood pressure.\n\n${sourceText({ claim: 'Among older North American Seventh-day Adventists, people with both high religious involvement and high social interaction had lower systolic blood pressure than those with one or neither.', cite: 'Journal of Religion and Health, 2015', url: 'https://pubmed.ncbi.nlm.nih.gov/26337436/' })}\n\nNotice the shape of that result. It was not faith alone and it was not company alone. It was both together. Belief that stayed private did not carry the same signal as belief lived out among people.\n\nI will be straight with you about the limits. This is observational, and the honest state of this literature is mixed. One study I read while writing this found gratitude associated with higher cardiovascular reactivity, not lower. That is the opposite of the tidy story, and you deserve to know it exists rather than only hearing the studies that agree with me.\n\nSo here is what I can say without overreaching. The stress corner of the Triangle is not primarily about workload. It is about carrying something with no one to hand it to. A body that never gets to stand down stays in a pressure state, and the fastest way I know to stand down is not a technique. It is being genuinely known by somebody, and trusting that you are held by God rather than by your own grip.\n\nYour one thing this week. Tell one person the real answer when they ask how you are doing. Not the reflex answer. The real one.\n\nThat is the eight. Nutrition, Exercise, Water, Sunlight, Temperance, Air, Rest, Trust. Nobody does all eight well, including me. You are looking for the one that is loudest right now, and you are only working that one.\n\nNext time I write, we start on the remedies themselves, herb by herb, same rule as this series. Every number gets a source you can go check.\n\nOne trigger at a time,\nJoel Polley, RN`,
    }),
  },
];

// Resolve which ladder-branch P.S. a reader gets.
export function audienceOf(sub) {
  if (sub.caseReview) return 'sprint';
  if (sub.state === 'buyer' || sub.isPaidCustomer) return 'buyer';
  return 'lead';
}

// Build the full {subject, html, text} for library index i and this subscriber.
export function renderEvergreen(i, sub, unsubUrl) {
  const item = EVERGREEN_LIBRARY[i % EVERGREEN_LIBRARY.length];
  const ctx = { firstName: sub.firstName || '', corner: sub.corner || null };
  const { bodyHtml, bodyText } = item.build(ctx);
  const audience = audienceOf(sub);
  // Odd indexes route leads/buyers to the $27 Weekly Reset instead of their
  // primary rung, so the ask alternates week to week.
  const alt = (i % EVERGREEN_LIBRARY.length) % 2 === 1;
  const html = item.pitch ? bodyHtml + standingPSHtml(audience, alt) : bodyHtml;
  const text = item.pitch ? `${bodyText}\n\n${standingPSText(audience, alt)}` : bodyText;
  const built = buildEmail({ preheader: item.preview, bodyHtml: html, bodyText: text, unsubUrl, corner: ctx.corner });
  return { subject: item.subject, html: built.html, text: built.text };
}

export const EVERGREEN_COUNT = EVERGREEN_LIBRARY.length;
