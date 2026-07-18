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
import { p, h2, bigQuote, buildEmail, SITE_URL } from './_triangle-email.js';

const u = (path, campaign) =>
  `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=evergreen&utm_campaign=${campaign}`;

const KIT_URL = u('/pay?tier=corner&corner=stress', 'kit');
const SPRINT_URL = u('/case-review', 'sprint');
const COACHING_URL = u('/coaching', 'coaching');
const TEA_URL = 'https://bpquiz.com/tea/?utm_source=email&utm_medium=evergreen&utm_campaign=tea';

const first = (ctx) => ctx.firstName || 'friend';

// ── Standing P.S., branched by ladder position ───────────────────────
// audience: 'lead' (no purchase) | 'buyer' (kit, no Sprint) | 'sprint' (bought Sprint)
function standingPSHtml(audience) {
  if (audience === 'sprint') {
    return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, there is one more room: my 90-day women's coaching group, <a href="${COACHING_URL}" style="color:#B85A36;font-weight:700;">Life Beyond the Numbers</a>. And if you want the daily tea, <a href="${TEA_URL}" style="color:#B85A36;font-weight:700;">Steady</a> is here. No rush on either.</p>`;
  }
  if (audience === 'buyer') {
    return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, the one door past the kit is the <a href="${SPRINT_URL}" style="color:#B85A36;font-weight:700;">30-Day Sprint</a>. I read your case myself, build your next 30 days in order, and we walk it through on a 1:1 call. I take 5 a month.</p>`;
  }
  return `<p style="font-size:14px;line-height:1.7;color:#2B2824;margin:22px 0 0;"><strong>P.S.</strong> Whenever you are ready, your next step is the <a href="${KIT_URL}" style="color:#B85A36;font-weight:700;">$17 BP Reset Kit</a>, the 10-day plan built for your loudest trigger. No rush. It is here when you want it.</p>`;
}
function standingPSText(audience) {
  if (audience === 'sprint') return `P.S. Whenever you are ready, there is one more room: my 90-day women's coaching group, Life Beyond the Numbers (${COACHING_URL}). And the daily tea, Steady, is here (${TEA_URL}).`;
  if (audience === 'buyer') return `P.S. Whenever you are ready, the one door past the kit is the 30-Day Sprint (${SPRINT_URL}). I read your case myself, build your next 30 days in order, and we walk it through on a 1:1 call. I take 5 a month.`;
  return `P.S. Whenever you are ready, your next step is the $17 BP Reset Kit (${KIT_URL}), the 10-day plan built for your loudest trigger. No rush.`;
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
  const html = item.pitch ? bodyHtml + standingPSHtml(audience) : bodyHtml;
  const text = item.pitch ? `${bodyText}\n\n${standingPSText(audience)}` : bodyText;
  const built = buildEmail({ preheader: item.preview, bodyHtml: html, bodyText: text, unsubUrl, corner: ctx.corner });
  return { subject: item.subject, html: built.html, text: built.text };
}

export const EVERGREEN_COUNT = EVERGREEN_LIBRARY.length;
