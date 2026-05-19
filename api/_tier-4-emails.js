// _tier-4-emails.js — onboarding sequence for TIER-4 buyers.
//
// Audience: Cohort 2 Sprint ($1,997) OR 1:1 Coaching ($6,997) buyers.
// State = `tier-4`. Wakita Taylor is the proof case (closed 2026-05-15).
//
// Goal: ONBOARD + RETAIN + REFERRAL momentum. NEVER sell.
//       No `upsellFooter` anywhere in this file — they paid top of ladder.
//
// 10 emails over 30 days. Day map: 0, 1, 3, 5, 7, 10, 14, 17, 21, 30.
//
// Each day exports: { subject, subjectB, preview, htmlBody(ctx), textBody(ctx) }
// Where ctx = { firstName, unsubUrl }
//
// Author: Joel Polley, RN, BraveWorks Health.

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Active product Stripe links (parity with other tier files — unused for pitches here)
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

// Tier-4-only URLs
export const INTAKE_FORM_URL = process.env.VITE_TIER4_INTAKE_FORM_URL || `${SITE_URL}/cohort2/intake`;
export const SKOOL_VIP_URL   = process.env.VITE_TIER4_SKOOL_VIP_URL  || 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const BARBARA_EVENT_URL = 'https://everydaynurse.com/event-virtual';
export const SUNDAY_ZOOM_URL = process.env.VITE_TIER4_SUNDAY_ZOOM_URL || 'https://us06web.zoom.us/j/2548856205?pwd=6G4RrvnybablMQJciQlOJdsh1jtHjo.1';

// Brand palette
const PALETTE = {
  outerBg: '#FBF8F1',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

// Body paragraph
function p(text, opts = {}) {
  const margin = opts.margin || '0 0 18px';
  return `<p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:${margin};">${text}</p>`;
}

// Display quote (use sparingly — once per email at most)
function bigQuote(text) {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:${PALETTE.accentClay};margin:28px 0 18px;font-weight:500;">${text}</p>`;
}

// Left-rule sage block — for teaching content (definitions, lists)
function sageBlock(html) {
  return `<div style="border-left:3px solid ${PALETTE.accentSage};padding:4px 0 4px 18px;margin:0 0 28px;">${html}</div>`;
}

// Left-rule clay block with kicker — for callouts, warnings, side notes
function clayBlock(label, html) {
  return `<div style="border-left:3px solid ${PALETTE.accentClay};padding:6px 0 6px 18px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:8px;">${label}</div>
    ${html}
  </div>`;
}

// Big orange CTA button — use ONCE per email (the primary action)
function ctaButton(href, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center" style="padding:0;">
      <a href="${href}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

// Joel's standard signoff
function joelSignoff() {
  return `<p style="font-size:16px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">Joel</p>
    <p style="font-size:14px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 28px;font-style:italic;">RN, BraveWorks</p>`;
}

// P.S. block — every email gets one, placed AFTER joelSignoff()
function psBox(text) {
  return `<div style="border-top:1px solid ${PALETTE.border};padding-top:20px;">
    <p style="font-size:14px;line-height:1.6;color:${PALETTE.textSoft};margin:0;">
      <strong style="color:${PALETTE.text};">P.S.</strong> ${text}
    </p>
  </div>`;
}

// Secondary footer — Skool + YouTube links. Append at bottom of EVERY email.
function footerSecondaryCTAs() {
  return `<div style="margin-top:24px;padding:20px 22px;background:${PALETTE.outerBg};border-radius:10px;">
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:12px;">Two more ways to follow along</div>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 10px;">→ <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Join the Skool community</a> &nbsp;<span style="color:#999;">— "How to Be Your Own Doctor"</span></p>
    <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;">→ <a href="${YOUTUBE_URL}" style="color:${PALETTE.accentClay};text-decoration:none;font-weight:600;">Subscribe on YouTube</a> &nbsp;<span style="color:#999;">— deeper teachings, weekly</span></p>
  </div>`;
}

// Tier-specific upsell footer. NOT USED in tier-4. Kept exported for parity
// with the other tier files so the cron's render-layer signature stays stable.
// eslint-disable-next-line no-unused-vars
function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}

// ─── DAY 0 — Welcome + Monday kickoff + intake form ───────────────────
const day0 = {
  subject: 'You\'re in. Monday at 10 PM ET — here\'s everything.',
  subjectB: 'Welcome — your 90-day journey starts Monday',
  preview: 'Your intake form, the Monday Zoom link, and what to bring.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`You said yes. I said yes to walking it with you for the next 90 days. Welcome inside.`)}
    ${p(`This email has the four things you need to start the right way. Read it once today and once Saturday — that's the only homework before we meet.`, { margin: '0 0 28px' })}
    ${bigQuote('Monday, 10:00 PM Eastern.')}
    ${p(`That's our kickoff. Sixty minutes on Zoom — me, you, and the others in this cohort. Bring a notebook and a beverage. We're not on camera the whole time; this is working, not performing.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">The four pieces of your Week 1:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">1. The intake form</strong> — 12 minutes. I read every word before Monday. The deeper you go, the deeper I can go on the call.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">2. Monday kickoff</strong> — 10 PM ET. Zoom link below. Full Triangle map, your weeks 1-2 plan, and what we're doing first.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">3. Weekly 1:1 calls</strong> — once we meet Monday I'll lock your recurring slot. Yours, every week, twelve weeks.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. WhatsApp office hours</strong> — Sun-Thu, 9 AM-5 PM ET. My number drops Monday on the call. Once it's in your phone, text me direct.</p>
    `)}
    ${p(`Fill out the intake first. Everything else flows from there.`, { margin: '0 0 18px' })}
    ${ctaButton(INTAKE_FORM_URL, 'Open the intake form →')}
    ${clayBlock('Monday — Zoom link (same one all 12 weeks)', `
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">10:00 PM ET. Bookmark it. Calendar invite is coming separately.</p>
      <p style="font-size:14px;line-height:1.55;color:${PALETTE.textSoft};margin:0;word-break:break-all;"><a href="${SUNDAY_ZOOM_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">${SUNDAY_ZOOM_URL}</a></p>
    `)}
    ${p(`<strong style="color:${PALETTE.text};">Three things you can do before Monday:</strong>`)}
    ${p(`1. Take your blood pressure today, write the number + time. Do it again Saturday morning. We'll talk through both on the call.`)}
    ${p(`2. Pull every supplement bottle out of the cabinet onto the counter. Take a phone photo. Bring the photo — we're going through them together.`)}
    ${p(`3. Loop in your partner. Husband, daughter, whoever lives with you and is going to see this work happen. They don't need to do the protocol — they just need to know what you're doing so they can hand you the cuff instead of the cookies.`, { margin: '0 0 28px' })}
    ${p(`I'm spending part of this weekend reading your intake and writing your Week 1 personally. By Monday I'll know your numbers better than anyone except you.`)}
    ${p(`See you at 10 PM ET on Monday.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If anything in this email doesn't land — confusion about the Zoom, can't find the intake link, anything — hit reply right now and tell me. I read every one. We start clean.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

You said yes. I said yes to walking it with you for the next 90 days. Welcome inside.

This email has the four things you need to start the right way. Read it once today and once Saturday — that's the only homework before we meet.

MONDAY, 10:00 PM EASTERN.

That's our kickoff. Sixty minutes on Zoom — me, you, and the others in this cohort. Bring a notebook and a beverage.

THE FOUR PIECES OF YOUR WEEK 1:

1. The intake form — 12 minutes. I read every word before Monday.
2. Monday kickoff — 10 PM ET. Zoom link below.
3. Weekly 1:1 calls — yours, every week, twelve weeks.
4. WhatsApp office hours — Sun-Thu, 9 AM-5 PM ET.

OPEN THE INTAKE FORM:
${INTAKE_FORM_URL}

SUNDAY ZOOM LINK (same for all 12 weeks):
${SUNDAY_ZOOM_URL}

THREE THINGS BEFORE SUNDAY:

1. Take your BP today. Write number + time. Repeat Saturday morning.
2. Pull every supplement bottle onto the counter. Photo it. Bring the photo.
3. Loop in your partner — they don't need to do the protocol, they just need to know what you're doing.

I'm spending part of this weekend reading your intake and writing your Week 1 personally. By Monday I'll know your numbers better than anyone except you.

See you at 10 PM ET on Monday.

Joel
RN, BraveWorks

P.S. If anything in this email doesn't land — confusion about the Zoom, can't find the intake link, anything — hit reply right now. I read every one. We start clean.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 1 — Week 1 agenda + partner-support framing ───────────────────
const day1 = {
  subject: 'Your Week 1 — bite-sized, with your partner',
  subjectB: 'What to expect in the first 7 days',
  preview: 'The map for Week 1 — and why your partner matters more than you think.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`A note before Monday: Week 1 is not what most people expect.`)}
    ${p(`Most BP programs throw a wall of protocol at you on Day 1 — supplements, food rules, exercise mandates, breathwork timers. You read the binder, you panic, you do half of it for three days, and by Day 5 you're back where you started.`)}
    ${p(`That's not what we do.`, { margin: '0 0 28px' })}
    ${bigQuote('Week 1 is foundation. Not stacking.')}
    ${p(`The first seven days have three jobs. That's it. Three.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Your Week 1 agenda:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Days 1-2 — Baseline.</strong> Two cuff readings a day (morning + evening). Same arm, same chair, same time. We're catching what your body actually does, not what it does at the doctor's office.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Days 3-5 — Hydration + Trust pillars.</strong> Up to a gallon of filtered water with Celtic salt under the tongue every 8 oz. Twenty-five gratitudes morning, twenty-five at night. Nothing else changes.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Days 6-7 — Reflection.</strong> What feels easier? What feels tight? You write me one paragraph by the Monday after. I read it before our call.</p>
    `)}
    ${p(`That's it. No supplements added yet. No new food rules. No exercise prescription. We're letting Stress Pressure soften and Pipe Pressure get its first proper drink of water before we touch anything else.`)}
    ${p(`Most clients drop 4-8 systolic points in Week 1 doing exactly that. Some drop more. That's the loop responding — not a "treatment." Your body remembering what it knew before life broke seven of the eight inputs.`, { margin: '0 0 28px' })}
    ${bigQuote('Now — your partner.')}
    ${p(`This is the part most programs skip. We don't.`)}
    ${p(`The reason 90% of health programs fail at Day 14 isn't willpower. It's environment. And the single biggest piece of your environment is the person who lives with you.`)}
    ${p(`<strong style="color:${PALETTE.text};">Husbands matter most.</strong> A husband who hands you the cuff at 7 AM is worth more than three new supplements. A husband who keeps Pop-Tarts in the cabinet is the reason your Sugar Pressure stays stuck. We are doing this with your partner — not around them.`)}
    ${p(`On Monday's call I'll give you the three sentences to say to him. They're not "stop eating cookies" sentences. They're "here's how to help me win" sentences. Most husbands say yes the first time they hear them framed right.`)}
    ${p(`If you live alone — a daughter, a sister, a best friend on text. One person who knows what you're doing and will ask Wednesday "did you get your gallon in today?" That's the whole job.`, { margin: '0 0 28px' })}
    ${p(`See you Monday.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you have a partner and they're skeptical — let them read this email. Half of them flip when they realize the ask is "help her, don't change yourself." The other half flip by Day 30 when they see her numbers move.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

A note before Monday: Week 1 is not what most people expect.

Most BP programs throw a wall of protocol at you on Day 1. You panic, you do half of it for three days, and by Day 5 you're back where you started.

That's not what we do.

WEEK 1 IS FOUNDATION. NOT STACKING.

The first seven days have three jobs:

DAYS 1-2 — BASELINE
Two cuff readings a day (morning + evening). Same arm, same chair, same time.

DAYS 3-5 — HYDRATION + TRUST
Up to a gallon of filtered water with Celtic salt under the tongue every 8 oz. Twenty-five gratitudes morning, twenty-five at night. Nothing else.

DAYS 6-7 — REFLECTION
What feels easier? What feels tight? Write me one paragraph by the Monday after.

No supplements added yet. No new food rules. No exercise prescription.

Most clients drop 4-8 systolic in Week 1 doing exactly that.

NOW — YOUR PARTNER.

The reason 90% of health programs fail at Day 14 isn't willpower. It's environment. And the biggest piece of your environment is the person who lives with you.

Husbands matter most. A husband who hands you the cuff at 7 AM is worth more than three new supplements.

On Monday I'll give you the three sentences to say to him. Most husbands say yes the first time they hear them framed right.

If you live alone — one person. Daughter, sister, best friend on text. One person who knows what you're doing and asks Wednesday "did you get your gallon in?" That's the job.

See you Monday.

Joel
RN, BraveWorks

P.S. If you have a partner and they're skeptical — let them read this email. Half flip when they realize the ask is "help her, don't change yourself." The other half flip by Day 30 when her numbers move.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 3 — Skool VIP room access ─────────────────────────────────────
const day3 = {
  subject: 'Your VIP Skool room is open',
  subjectB: 'Meet your cohort — introduce yourself here',
  preview: 'A small, private room. Just the people on this journey with you.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Your VIP Skool room is live. Walk in.`, { margin: '0 0 28px' })}
    ${ctaButton(SKOOL_VIP_URL, 'Open your VIP Skool room →')}
    ${p(`This is not the public Skool community. This room is locked. It holds you, the other 1:1 and Sprint clients I'm walking the same 90 days with, and me — and that's it. Twelve people, give or take. Everyone in it paid full price. Everyone in it is doing the same protocol on the same arc.`)}
    ${p(`That's intentional. The reason most online communities don't move the needle is they're noisy. Ninety percent of the room is shopping, ten percent is working. In here it's reversed.`, { margin: '0 0 28px' })}
    ${bigQuote('One ask today.')}
    ${p(`Introduce yourself in the room. Two paragraphs. There's a pinned post titled "Start here — introduce yourself" — drop your reply on that thread.`)}
    ${p(`<strong style="color:${PALETTE.text};">What to include:</strong>`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">First name + where you live.</strong> Time zones help us help each other.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Your numbers today.</strong> Where you started. Whatever feels honest. This is a no-shame room.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Why now.</strong> One sentence. The thing that made you say yes this year and not last year.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">One question.</strong> The thing you're hoping Week 1 answers. Doesn't have to be smart. Has to be real.</p>
    `)}
    ${p(`You'll see Wakita's intro pinned near the top — she went first and shared her starting number and her "why now" honestly. Read hers before you write yours. It'll show you how much depth this room can hold.`, { margin: '0 0 28px' })}
    ${bigQuote('How to use this room day-to-day.')}
    ${p(`I check it every weekday at 11 AM ET and 4 PM ET. WhatsApp is faster for emergencies; Skool is for the questions that benefit the whole room. If you post a Stress Pressure win in here, the next person reading is going to lift from it. That's the math.`)}
    ${p(`No notifications by default. You opt in to what you want. I recommend "all posts in this room" turned on for the first 14 days — it's a small room, you won't get blasted, and you'll feel the cohort the way it's meant to be felt.`, { margin: '0 0 28px' })}
    ${p(`See you in there. I'll comment on your intro within 24 hours of you posting it.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you can't get the Skool link to open — hit reply right now with the email address you used for Skool. Sometimes the invite goes to the wrong inbox. I'll get you in inside an hour during office hours.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Your VIP Skool room is live. Walk in.

→ ${SKOOL_VIP_URL}

This is not the public Skool community. This room is locked. It holds you, the other 1:1 and Sprint clients I'm walking the same 90 days with, and me. Twelve people, give or take. Everyone in it paid full price. Everyone in it is doing the same protocol on the same arc.

ONE ASK TODAY.

Introduce yourself in the room. Two paragraphs. There's a pinned post titled "Start here — introduce yourself" — drop your reply on that thread.

WHAT TO INCLUDE:

→ First name + where you live (time zones help us help each other).
→ Your numbers today. Whatever feels honest. No-shame room.
→ Why now. One sentence. The thing that made you say yes this year and not last year.
→ One question. The thing you're hoping Week 1 answers.

You'll see Wakita's intro pinned near the top. Read hers before you write yours.

HOW TO USE THIS ROOM DAY-TO-DAY.

I check it every weekday at 11 AM ET and 4 PM ET. WhatsApp is faster for emergencies; Skool is for questions that benefit the whole room.

I recommend "all posts in this room" turned on for the first 14 days. Small room. You won't get blasted.

I'll comment on your intro within 24 hours of you posting.

Joel
RN, BraveWorks

P.S. Can't get the Skool link to open? Hit reply with the email address you used for Skool. Invite sometimes goes to the wrong inbox. I'll get you in inside an hour during office hours.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 5 — Barbara O'Neill ticket bonus delivery ─────────────────────
const day5 = {
  subject: 'Your Barbara O\'Neill ticket is inside',
  subjectB: 'June 24-25 — the virtual event details',
  preview: 'Your seat is bought. Here\'s what to put on the calendar.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Quick one today. I'm buying your Barbara O'Neill virtual event ticket personally — and I want you to put the dates on your calendar before they sneak up on you.`, { margin: '0 0 28px' })}
    ${bigQuote('June 24-25, 2026.')}
    ${p(`Two days. Virtual. You watch from your living room.`)}
    ${p(`Barbara is the closest thing the natural-health world has to a saint. Eighty-something years old, still teaching three days a week, still drawing the same crowds she did twenty years ago. The first time I heard her speak I drove four hours to Pennsylvania and bought every book on her table.`)}
    ${p(`She and I cross at the foundation — NEWSTART, plant-based, hours-before-midnight sleep, gratitude as the cortisol intervention, every herb she names is in my bench. Most of what I teach you these 90 days she has been teaching for forty years. You are getting both of us this season.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">What you need to know:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Dates:</strong> Wednesday June 24 + Thursday June 25, 2026.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Format:</strong> Virtual. Stream to phone, laptop, or TV. Replays available 30 days after.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Who pays:</strong> Me. This bonus is included in your tier. Your seat is being registered under your name.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">Where to look:</strong> <a href="${BARBARA_EVENT_URL}" style="color:${PALETTE.accentClay};font-weight:600;text-decoration:none;">everydaynurse.com/event-virtual</a> — the full speaker list and topics live here.</p>
    `)}
    ${p(`<strong style="color:${PALETTE.text};">What I need from you today:</strong>`)}
    ${p(`Reply to this email and confirm the name you want on the registration. I default to the first name on your purchase, but some of you go by a different name and I want it right. One word, one reply, done.`)}
    ${p(`Once you reply I buy the ticket, the confirmation lands in your inbox from the event team, and I drop your name on a list I keep so I can text you on June 23 with the streaming link.`, { margin: '0 0 28px' })}
    ${bigQuote('How to make the most of it.')}
    ${p(`<strong style="color:${PALETTE.text};">Watch with your husband.</strong> Barbara converts more skeptical husbands than anyone else in this space — she's a grandmother teaching plain truth, no aggression, no salesmanship. He'll lean in.`)}
    ${p(`<strong style="color:${PALETTE.text};">Take notes by hand.</strong> Two days is a lot. The notes you write down by hand are the ones you'll actually use in Week 4 and 5. The notes you screenshot will sit in your phone unopened.`)}
    ${p(`<strong style="color:${PALETTE.text};">Bring questions to our next 1:1.</strong> When you hear Barbara say something that lands, write the timestamp and ask me about it on our call. That's how the two streams of teaching weave together.`, { margin: '0 0 28px' })}
    ${p(`See you on the call this week.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Wakita is going to be on the June stream too. If you want a watch-buddy from the cohort, post in Skool the day-of — half this room watches it live together with a shared chat thread running.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Quick one today. I'm buying your Barbara O'Neill virtual event ticket personally — and I want you to put the dates on your calendar before they sneak up on you.

JUNE 24-25, 2026.

Two days. Virtual. You watch from your living room.

Barbara is the closest thing the natural-health world has to a saint. Eighty-something years old, still teaching three days a week. We cross at the foundation — NEWSTART, plant-based, hours-before-midnight sleep, gratitude as the cortisol intervention. Most of what I teach you these 90 days she's been teaching for forty years. You are getting both of us this season.

WHAT YOU NEED TO KNOW:

→ Dates: Wednesday June 24 + Thursday June 25, 2026
→ Format: Virtual. Phone, laptop, or TV. Replays 30 days after.
→ Who pays: Me. Bonus included in your tier. Seat registered under your name.
→ Where to look: ${BARBARA_EVENT_URL}

WHAT I NEED FROM YOU TODAY:

Reply to this email and confirm the name you want on the registration. I default to the first name on your purchase, but some of you go by a different name. One word, one reply, done.

Once you reply I buy the ticket, confirmation lands in your inbox from the event team, and I drop your name on a list so I can text you on June 23 with the streaming link.

HOW TO MAKE THE MOST OF IT.

→ Watch with your husband. Barbara converts skeptical husbands.
→ Take notes by hand. Two days is a lot. Handwritten notes get used.
→ Bring questions to our next 1:1. Hear something that lands, write the timestamp, ask me on our call.

See you on the call this week.

Joel
RN, BraveWorks

P.S. Wakita is going to be on the June stream too. If you want a watch-buddy from the cohort, post in Skool the day-of — half this room watches it live together with a shared chat thread.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 7 — Week 1 reflection ────────────────────────────────────────
const day7 = {
  subject: 'Week 1 reflection — how are you feeling?',
  subjectB: 'What\'s working, what\'s tight?',
  preview: 'Two questions I want you to sit with before Monday.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Week 1 closes today. You've been on the protocol for seven days. The body has had its first proper drink of water, the brain has spent the first morning of its life listing twenty-five things it's grateful for, and the cuff has watched you a little more carefully than it did last week.`)}
    ${p(`Today I don't ask you for action. I ask you for reflection.`, { margin: '0 0 28px' })}
    ${bigQuote('Two questions.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Sit with both. Write the answers down — phone notes, journal, scrap paper. External expression is stronger than purely mental.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. What's working?</strong> Anything you've noticed shift. Sleep onset 20 minutes earlier. Morning headache gone Wednesday. Husband said something different over coffee. The 3 PM crash didn't crash. Cuff reading in the 130s when it usually sits in the 140s. Bigger than that or smaller than that — anything you wouldn't have written down last week.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">2. What's tight?</strong> Where is friction showing up? Can't get the full gallon. Forgetting evening gratitudes. The salt taste under the tongue is harder than expected. Your husband's snacks. Three PM cravings sharper, not duller. Be specific. Be honest. There is no answer that disappoints me — only the ones you don't tell me.</p>
    `)}
    ${p(`When you have both answers, reply to this email. One paragraph. I read every word before Monday's call and I will adjust your Week 2 around what you write — that's the whole point of the 1:1 structure you bought.`)}
    ${p(`If you want to post your reflection in Skool instead so the cohort can read it, do that. Either way I see it.`, { margin: '0 0 28px' })}
    ${bigQuote('Why the reflection matters more than the numbers.')}
    ${p(`A lot of clients want me to look at their cuff readings and tell them whether they're winning. I do look at the cuff. But the cuff is the lagging indicator — the body changes underneath it for two or three weeks before the number catches up.`)}
    ${p(`The reflection IS the leading indicator. Sleep moving first. Cravings softening before the cuff softens. The husband asking different questions. Those changes are the engine starting. The cuff is just the dashboard light catching up.`)}
    ${p(`Wakita's Week 1 reflection was three sentences long. One of them was "I forgot what it felt like to want breakfast in the morning." That sentence told me more about her Stress Pressure than her cuff did. We built her Week 2 around it.`, { margin: '0 0 28px' })}
    ${p(`Send me yours.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If Week 1 has been hard — really hard — that's information too. Reply with "hard" and one sentence about which piece is hardest. I'd rather pull a piece off your plate in Week 2 than have you white-knuckle through.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Week 1 closes today. The body has had its first proper drink of water, the brain has spent the first morning of its life listing twenty-five things it's grateful for, and the cuff has watched you a little more carefully than it did last week.

Today I don't ask you for action. I ask you for reflection.

TWO QUESTIONS.

Sit with both. Write them down — phone notes, journal, scrap paper. External expression is stronger than purely mental.

1. WHAT'S WORKING?
Anything you've noticed shift. Sleep 20 min earlier. Morning headache gone Wednesday. Husband said something different. The 3 PM crash didn't crash. Cuff reading in the 130s when it usually sits in the 140s.

2. WHAT'S TIGHT?
Where is friction showing up? Can't get the full gallon. Forgetting evening gratitudes. Salt taste under the tongue. Husband's snacks. Three PM cravings sharper. Be specific. Be honest.

When you have both answers, reply. One paragraph. I read every word before Monday's call and adjust your Week 2 around what you write — that's the whole point of the 1:1 structure you bought.

If you want to post in Skool instead so the cohort can read it, do that. Either way I see it.

WHY THE REFLECTION MATTERS MORE THAN THE NUMBERS.

The cuff is the lagging indicator. The body changes underneath it for two-three weeks before the number catches up.

The reflection IS the leading indicator. Sleep moving first. Cravings softening before the cuff. The husband asking different questions. Those are the engine starting.

Wakita's Week 1 reflection was three sentences long. One was "I forgot what it felt like to want breakfast in the morning." That sentence told me more than her cuff did. We built her Week 2 around it.

Send me yours.

Joel
RN, BraveWorks

P.S. If Week 1 has been hard — really hard — that's information too. Reply with "hard" and one sentence about which piece is hardest. I'd rather pull a piece off your plate in Week 2 than have you white-knuckle through.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 10 — Plateau-buster (the Day 14 dip) ─────────────────────────
const day10 = {
  subject: 'Day 14 is the hardest day — read this now',
  subjectB: 'Why your numbers might pause this week',
  preview: 'It happens to almost everyone. Here\'s the why and the move.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`I'm writing this on Day 10 because I want to put a flag in the ground before you walk over the cliff.`, { margin: '0 0 28px' })}
    ${bigQuote('The Day 14 dip is coming.')}
    ${p(`Almost every client I have ever walked through this protocol hits a wall somewhere between Day 12 and Day 16. The cuff number stalls. Or worse — it goes up a few points after a run of dropping. The hydration that felt natural in Week 1 starts feeling like a chore. The gratitudes feel rote. Your husband stops being curious and starts being normal.`)}
    ${p(`That's not failure. That's the protocol working exactly the way I expect it to. I want you to recognize it when it shows up so you don't quit the day before the numbers move.`, { margin: '0 0 28px' })}
    ${bigQuote('Why it happens.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Three things happen at once around Day 14:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Stress Pressure rebounds before it settles.</strong> Cortisol doesn't drop on a clean slope. It drops, plateaus, sometimes rebounds for 48-72 hours, then drops again. The rebound usually shows up around Day 12-14. The body is reorganizing.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Novelty wears off.</strong> Week 1 was new. The water tasted different. The gratitudes felt loud. By Day 12 the brain has stopped scoring the protocol as "exciting" and started filing it under "chore." Your motivation drops not because the protocol stopped working but because your brain stopped giving you the dopamine kick of doing something new.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Pipe Pressure hasn't caught up yet.</strong> Stress and Sugar respond to the protocol fast. The pipes themselves — the vascular tone — take 3-6 weeks to soften. Around Day 14 you're between those two timelines. The fast levers have already delivered. The slow ones haven't started yet.</p>
    `)}
    ${p(`So the cuff numbers sit. Sometimes climb back two or three systolic points. And the new client, alone, looks at the cuff and thinks "this isn't working."`)}
    ${p(`<strong style="color:${PALETTE.text};">It IS working. The cuff is the lagging indicator. The reflection is the leading one.</strong>`, { margin: '0 0 28px' })}
    ${bigQuote('The move when it shows up.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Do not change the protocol.</strong> No new herb. No new food rule. No "let me add something to fix this." Adding more during the dip is how people break the foundation we built.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Text me on WhatsApp.</strong> One line: "I'm in the dip." I'll know what you mean. I'll send you the right voice note inside the hour.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">3. Reread your Week 1 reflection.</strong> The "what's working" list you wrote me on Day 7. Read it out loud. Those changes haven't disappeared because the cuff paused. They are still happening underneath.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">4. Hold for 72 hours.</strong> Almost every dip clears inside three days when the protocol is held. The post-dip drop is often the biggest jump of the 90 days.</p>
    `)}
    ${p(`I write this email on Day 10 every cohort. Half of you will text me Day 13 and say "Joel I'm in it." A few will text me Day 17 and say "Joel I thought I was in it but I just had my best cuff reading of the protocol." Both are correct.`, { margin: '0 0 28px' })}
    ${p(`You bought a coach. The whole reason you bought a coach is for moments like this one. Use me.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you've already noticed the dip starting — congratulations, you're early. Text me the word "dip" right now and I'll add you to a thread of three other clients currently inside it. Sometimes the cohort sees you out before I do.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

I'm writing this on Day 10 because I want to put a flag in the ground before you walk over the cliff.

THE DAY 14 DIP IS COMING.

Almost every client I have ever walked through this protocol hits a wall somewhere between Day 12 and Day 16. The cuff number stalls. Or worse — it goes up a few points after a run of dropping. The hydration starts feeling like a chore. The gratitudes feel rote.

That's not failure. That's the protocol working exactly the way I expect it to.

WHY IT HAPPENS.

1. STRESS PRESSURE REBOUNDS BEFORE IT SETTLES.
Cortisol doesn't drop on a clean slope. Drops, plateaus, rebounds 48-72 hours, then drops again. Rebound usually Day 12-14.

2. NOVELTY WEARS OFF.
Week 1 was new. By Day 12 the brain has filed the protocol under "chore." Motivation drops not because the protocol stopped working but because the dopamine kick of doing something new is gone.

3. PIPE PRESSURE HASN'T CAUGHT UP.
Stress and Sugar respond fast. The pipes take 3-6 weeks. Around Day 14 you're between those timelines.

The cuff sits. Sometimes climbs back two or three. The new client looks at the cuff and thinks "this isn't working."

IT IS WORKING. THE CUFF IS THE LAGGING INDICATOR.

THE MOVE WHEN IT SHOWS UP.

1. DO NOT CHANGE THE PROTOCOL. No new herb. No new food rule. Adding during the dip breaks the foundation.

2. TEXT ME ON WHATSAPP. One line: "I'm in the dip." I'll send the right voice note inside the hour.

3. REREAD YOUR WEEK 1 REFLECTION. The "what's working" list from Day 7. Out loud. Those changes haven't disappeared because the cuff paused.

4. HOLD FOR 72 HOURS. Almost every dip clears inside three days. The post-dip drop is often the biggest jump of the 90 days.

I write this email on Day 10 every cohort. Half of you will text me Day 13 and say "Joel I'm in it."

You bought a coach. The whole reason you bought a coach is for moments like this one. Use me.

Joel
RN, BraveWorks

P.S. Already noticed the dip starting? You're early. Text me the word "dip" right now. I'll add you to a thread of three other clients currently inside it. Sometimes the cohort sees you out before I do.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 14 — First numbers check-in + adjustment ─────────────────────
const day14 = {
  subject: 'Halfway to Day 30 — pulse check',
  subjectB: 'What the data is telling us',
  preview: 'Two weeks in. Here\'s what I need to see before we adjust.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Halfway to the Day 30 mark. Time for the first real pulse check.`)}
    ${p(`Whether or not the Day 14 dip showed up for you — and for a third of this cohort it doesn't, you're built different — I want a clean look at the data before we make the first real adjustment to your protocol.`, { margin: '0 0 28px' })}
    ${bigQuote('What I want from you today.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Reply with five lines. That's the whole ask.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Line 1 — morning BP average, past 7 days.</strong> Add the seven AM readings, divide by 7. Give me systolic over diastolic. If you missed a day, that's fine — average what you have.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Line 2 — evening BP average, past 7 days.</strong> Same math, evening readings.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Line 3 — your sleep number.</strong> Best honest estimate of nightly hours, past 7 days. If you're on a tracker, use that. If not, your gut.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">Line 4 — gallon adherence, past 7 days.</strong> How many days you hit close to the full gallon. 7/7, 5/7, 3/7. Be honest. The honesty IS the protocol working.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">Line 5 — the thing.</strong> One sentence: what changed in your body that nobody else has noticed.</p>
    `)}
    ${p(`Reply to this email with the five lines. Or post them in Skool — whichever you prefer. The cohort benefits from seeing each other's numbers; it's the fastest way for someone three weeks behind you to know what's possible.`, { margin: '0 0 28px' })}
    ${bigQuote('What I do with the data.')}
    ${p(`Once I have your five lines I look at three things you can't easily see:`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">1. The gap between your morning and evening averages.</strong> A wide gap (more than 12 mmHg apart) tells me Stress Pressure is still the loudest corner. A narrow gap tells me we're more in Pipe Pressure territory. That determines which lever I add next.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;"><strong style="color:${PALETTE.text};">2. The relationship between sleep and the morning number.</strong> If your morning BP drops the day after a 7-hour night and climbs the day after a 5-hour night, sleep is your highest-leverage move. That single relationship determines whether I add a magnesium glycinate tweak or hold steady.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Gallon adherence vs. systolic.</strong> If your hydration days correlate with lower readings, water is doing the heavy lifting and we don't introduce a new herb yet. If they don't correlate, Pipe Pressure has stiffer roots and we lean into hibiscus earlier.</p>
    `)}
    ${p(`This is the whole reason the 1:1 structure costs what it costs. I'm not running a curriculum at you. I'm reading your specific case and adjusting in real time.`, { margin: '0 0 28px' })}
    ${p(`Send me the five lines by tomorrow night and I'll have your Week 3 adjustment in your inbox before your next 1:1.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your numbers haven't moved at all in two weeks — and a small number of clients fit this — that's the most useful data of all. It tells me there's a hidden cause behind the loud one (sleep apnea, medication side effect, a thyroid drift). Reply "stuck" and we'll add that conversation to your next call.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Halfway to the Day 30 mark. Time for the first real pulse check.

WHAT I WANT FROM YOU TODAY.

Reply with five lines.

LINE 1 — Morning BP average, past 7 days. Add the seven AM readings, divide by 7. Systolic over diastolic.

LINE 2 — Evening BP average, past 7 days. Same math.

LINE 3 — Your sleep number. Best honest estimate of nightly hours, past 7 days.

LINE 4 — Gallon adherence, past 7 days. 7/7, 5/7, 3/7. Be honest. The honesty IS the protocol working.

LINE 5 — The thing. One sentence: what changed in your body that nobody else has noticed.

Reply with the five lines. Or post in Skool — whichever you prefer. Cohort benefits from seeing each other's numbers.

WHAT I DO WITH THE DATA.

Once I have your five lines I look at three things you can't easily see:

1. THE GAP BETWEEN MORNING AND EVENING. Wide gap (>12 mmHg) = Stress Pressure still loudest. Narrow gap = Pipe Pressure territory. Determines next lever.

2. SLEEP VS. MORNING NUMBER. Morning BP drops after 7-hour nights, climbs after 5-hour nights = sleep is highest leverage. Determines magnesium glycinate timing.

3. GALLON ADHERENCE VS. SYSTOLIC. Hydration days correlate with lower readings = water is doing the lifting, no new herb yet. No correlation = lean into hibiscus earlier.

This is the whole reason the 1:1 structure costs what it costs. I'm not running a curriculum at you. I'm reading your case and adjusting in real time.

Send me the five lines by tomorrow night. I'll have your Week 3 adjustment in your inbox before your next 1:1.

Joel
RN, BraveWorks

P.S. Numbers haven't moved at all in two weeks? That's the most useful data of all. Tells me there's a hidden cause behind the loud one (sleep apnea, medication side effect, thyroid drift). Reply "stuck" and we'll add that to your next call.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 17 — The 7-herb formulary deep dive ──────────────────────────
const day17 = {
  subject: 'The 7 herbs I\'m prescribing this cohort',
  subjectB: 'Your herb stack — week by week',
  preview: 'Five anchors plus two supports. Why each, how to dose, when to add.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Today is the herb-stack deep dive. Three weeks in — you have the foundation. We start layering the accelerators.`)}
    ${p(`A note on language first. <strong style="color:${PALETTE.text};">I don't prescribe.</strong> I'm a Registered Nurse and a naturopathic practitioner — these are educational recommendations within a coaching relationship, and every adjustment you make to your medication or supplement stack is a conversation with your physician. The Doctor Conversation Script in your kit is the bridge for that. Day 21 we walk through it together.`, { margin: '0 0 28px' })}
    ${bigQuote('The Five Anchors plus two supports.')}
    ${p(`This is the stack I am building you toward over Weeks 3-8. We don't add them all at once. We sequence them based on which Pressure was loudest in your intake.`, { margin: '0 0 28px' })}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Anchor 1 — Hibiscus Tea (Pipe Pressure)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form:</strong> Hibiscus sabdariffa — loose-leaf or pure tea bags. Not blends.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Dose:</strong> 2-3 cups per day. Brew 6-10 minutes. Hot or iced — doesn't matter.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> A natural ACE inhibitor — same pathway as lisinopril, gentler hand. Tufts published 7.2 mmHg systolic reduction in six weeks. The most-cited herb in the bench.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Most of you start this week if you weren't already.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Anchor 2 — Garlic (Pipe Pressure)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form A (food):</strong> 2 fresh cloves daily, crushed. Wait 10 minutes after crushing — that's the allicin conversion. Then eat raw or stir into food after cooking is done.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form B (capsule):</strong> Aged Garlic Extract — Kyolic brand most-studied. 600-1,200 mg daily. For clients who can't tolerate raw.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> Allicin converts to hydrogen sulfide in the vessel wall — true vasodilation. 2019 meta-analysis: 8.3 systolic and 5.5 diastolic across 550 patients.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Alongside hibiscus, this week or next.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Anchor 3 — Magnesium (Stress + Pipe)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form 1:</strong> Magnesium glycinate — 200 mg at bedtime. Sleep + cortisol.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form 2:</strong> Magnesium taurate — 200 mg with dinner. Vascular-specific.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>What to avoid:</strong> Magnesium oxide. 4% absorption. Near-useless. Read the label.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Bedtime glycinate is in most of your Week 2 already. Dinner taurate joins around Week 4.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Anchor 4 — Ashwagandha (Stress Pressure)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form:</strong> KSM-66 standardized extract. 300 mg.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Dose:</strong> Morning or with lunch. Not at night for most people — paradoxically energizing for some.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> HPA-axis adaptogen. Meta-analyses show ~28% cortisol reduction over 8 weeks. The cortisol lever that pairs cleanly with the 25-and-25 gratitude practice.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Week 4-5 for most of you. We let the gratitude practice do its work first, then layer.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Anchor 5 — Holy Basil / Tulsi (Stress + Sugar)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form:</strong> Tea (most popular) or 300 mg standardized capsule. Tea preferred — the ritual matters.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Dose:</strong> One cup evening, around 7-8 PM.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> Dual action — cortisol softening plus blood-sugar regulation. Replaces the evening coffee or wine. The cortisol stack with ashwagandha is one of the most-evidenced combinations in the bench.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Same window as ashwagandha — Weeks 4-5.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Support 1 — Hawthorn Berry (Pipe Pressure)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form:</strong> Tea or standardized extract — 250-500 mg.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> A classic cardiac tonic in European herbal medicine. Mild vasodilator, gentle on the system, pairs beautifully when hibiscus is moving the needle but the cuff still feels tight.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Optional. Some of you, not all. We decide on your Week 6 call.</p>
    `)}
    ${sageBlock(`
      <p style="font-size:18px;line-height:1.4;color:${PALETTE.text};margin:0 0 8px;font-family:Georgia,serif;font-weight:600;">Support 2 — Cinnamon (Sugar Pressure)</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Form:</strong> Ceylon cinnamon (true cinnamon) — NOT cassia. Powder or capsule. 1-3 g.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;"><strong>Why this one:</strong> Insulin sensitivity. The Sugar Pressure lever for clients whose A1c sits above 5.7 and whose morning fasting glucose runs above 95.</p>
      <p style="font-size:15px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong>When you add it:</strong> Optional. Determined by your morning fasting numbers in Week 5.</p>
    `)}
    ${p(`<strong style="color:${PALETTE.text};">Read once. Save the email. Don't act on it yet — your specific sequence is in your next 1:1 plan.</strong>`)}
    ${p(`If you go to the supplement store this weekend, the only one I'd green-light on your own is hibiscus tea. The rest we sequence on the call.`, { margin: '0 0 28px' })}
    ${p(`Day 21 — the doctor conversation. Saving the most important Week 4 piece for then.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If you're already taking any of these — even one — reply with the name and dose. I want to know what's already in your stack before I sequence the rest. The intake captured what was on the counter; sometimes the bottle in the suitcase from last year isn't on the form.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Today is the herb-stack deep dive. Three weeks in — you have the foundation. We start layering the accelerators.

A note on language: I don't prescribe. I'm an RN and naturopathic practitioner — these are educational recommendations within a coaching relationship, and every adjustment to your medication or supplement stack is a conversation with your physician. The Doctor Conversation Script in your kit is the bridge. Day 21 we walk through it together.

THE FIVE ANCHORS PLUS TWO SUPPORTS.

This is the stack I'm building you toward over Weeks 3-8. We don't add them all at once. We sequence based on which Pressure was loudest in your intake.

ANCHOR 1 — HIBISCUS TEA (Pipe Pressure)
Form: Hibiscus sabdariffa. Not blends.
Dose: 2-3 cups daily. Brew 6-10 min.
Why: Natural ACE inhibitor. Tufts study: 7.2 mmHg systolic in 6 weeks.
When: Most of you start this week.

ANCHOR 2 — GARLIC (Pipe Pressure)
Form A: 2 fresh cloves daily, crushed, wait 10 minutes for allicin conversion.
Form B: Kyolic Aged Garlic Extract 600-1,200 mg.
Why: Allicin → hydrogen sulfide → vasodilation. 8.3 systolic / 5.5 diastolic across 550 patients (2019 meta).
When: Alongside hibiscus, this week or next.

ANCHOR 3 — MAGNESIUM (Stress + Pipe)
Form 1: Glycinate 200 mg bedtime. Sleep + cortisol.
Form 2: Taurate 200 mg dinner. Vascular.
Avoid: Magnesium oxide. 4% absorption.
When: Bedtime glycinate in Week 2 already. Dinner taurate joins Week 4.

ANCHOR 4 — ASHWAGANDHA (Stress Pressure)
Form: KSM-66 standardized.
Dose: 300 mg AM or with lunch. Not at night.
Why: HPA-axis adaptogen. ~28% cortisol reduction over 8 weeks.
When: Week 4-5 for most.

ANCHOR 5 — HOLY BASIL / TULSI (Stress + Sugar)
Form: Tea preferred. Or 300 mg capsule.
Dose: One cup evening, 7-8 PM.
Why: Cortisol + blood-sugar regulation. The cortisol stack with ashwagandha is one of the most-evidenced combinations.
When: Weeks 4-5.

SUPPORT 1 — HAWTHORN BERRY (Pipe Pressure)
Form: Tea or 250-500 mg extract.
Why: Classic cardiac tonic. Mild vasodilator.
When: Optional. Some of you. Decide on Week 6 call.

SUPPORT 2 — CINNAMON (Sugar Pressure)
Form: Ceylon — NOT cassia. 1-3 g.
Why: Insulin sensitivity. For A1c >5.7 and fasting glucose >95.
When: Optional. Determined by Week 5 numbers.

READ ONCE. SAVE THE EMAIL. DON'T ACT YET — your specific sequence is in your next 1:1 plan.

If you go to the supplement store this weekend, the only one I'd green-light on your own is hibiscus tea. The rest we sequence on the call.

Day 21 — the doctor conversation. Saving the most important Week 4 piece for then.

Joel
RN, BraveWorks

P.S. Already taking any of these — even one — reply with the name and dose. I want to know what's already in your stack before I sequence the rest.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 21 — Doctor conversation prep + script ───────────────────────
const day21 = {
  subject: 'Your next doctor visit — the script',
  subjectB: 'How to talk to your cardiologist',
  preview: 'The four sentences. The data you bring. The answer you\'re asking for.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Three weeks in. The body is moving. Now we prepare the conversation that turns this work into a doctor-cleared taper plan.`)}
    ${p(`Most of you have a cardiology or primary-care appointment somewhere between Week 4 and Week 8. I want you walking into that room with the right data and the right four sentences. Read this email today. Reread it the morning of your appointment.`, { margin: '0 0 28px' })}
    ${bigQuote('Pills manage output. Protocol fixes input.')}
    ${p(`I write this sentence on a piece of paper at the start of every coaching relationship. Most clients tape it to the refrigerator.`)}
    ${p(`Your medication does one thing well: it lowers the number on the cuff. That's what it was designed to do. That's what your doctor measures it by. <strong style="color:${PALETTE.text};">It doesn't fix what's making the number high in the first place.</strong> Pipe Pressure, Stress Pressure, Sugar Pressure — those keep grinding underneath the pill. Which is why most patients end up on a second pill in three years, a third in five, a fourth by 65.`)}
    ${p(`The protocol you're running fixes the inputs. The pills are still in the picture. They are running underneath the protocol. We are not against your medication. <strong style="color:${PALETTE.text};">We are AND not INSTEAD OF.</strong>`)}
    ${p(`That is the frame. Now the script.`, { margin: '0 0 28px' })}
    ${bigQuote('The four sentences.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Print these. Bring them to your appointment. Read them if you need to.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">1. The opener (the partnership frame).</strong></p>
      <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;font-style:italic;padding-left:14px;border-left:2px solid ${PALETTE.accentSage};">"Doctor, I've been working with a registered nurse and naturopathic practitioner on lifestyle changes that target the root causes of my high blood pressure — sleep, hydration, nutrition, stress management. I'm taking my medication exactly as you prescribed. I've been tracking my readings twice daily for the past three weeks. Here's the log."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">2. The data hand-off.</strong></p>
      <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;font-style:italic;padding-left:14px;border-left:2px solid ${PALETTE.accentSage};">"My morning average has moved from [your Week 1 number] to [your Week 3 number]. My evening average from [Week 1] to [Week 3]. I'd like this in my chart as a baseline for what we're tracking together."</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">3. The ask.</strong></p>
      <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;font-style:italic;padding-left:14px;border-left:2px solid ${PALETTE.accentSage};">"I'd like to discuss whether my numbers support a conversation about gradually tapering my medication under your supervision over the next 60-90 days. I'm not asking to stop anything on my own — I want this to be your call, with my data. Can we set a follow-up in 4 weeks to look at numbers again and decide?"</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;"><strong style="color:${PALETTE.text};">4. The boundary + the fallback.</strong></p>
      <p style="font-size:15.5px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;font-style:italic;padding-left:14px;border-left:2px solid ${PALETTE.accentSage};">"I understand you may want to repeat labs, check kidney function, and monitor closely. I'm committed to that. If you'd prefer I stay at the current dose while we monitor more, I'd like to revisit this in 4-6 weeks with continued data."</p>
    `)}
    ${p(`Four sentences. Three minutes of the appointment. Most cardiologists I've seen this script used on say some version of yes by the third sentence — because you've removed every adversarial element. You've given them data. You've made them the lead.`, { margin: '0 0 28px' })}
    ${bigQuote('What to bring with you.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Your full BP log.</strong> Twenty-one days of morning + evening readings. Print it on one page if you can. The single page is the visual proof.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">A one-page summary of the protocol.</strong> I'll send you a tailored version for your case at the end of Week 4. Hand it to the doctor and ask for it to be added to your chart.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 10px;">→ <strong style="color:${PALETTE.text};">Your husband or partner if possible.</strong> Doctors take the conversation more seriously when a witness is in the room. He doesn't need to talk. He just needs to be there.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ <strong style="color:${PALETTE.text};">A notebook.</strong> Write down whatever the doctor says. The notes prevent the "wait, did he actually agree?" loop on the drive home.</p>
    `)}
    ${bigQuote('If the doctor says no.')}
    ${p(`Some will. Not most, but some. If yours does, that's information — not failure.`)}
    ${p(`The right response in the moment: <em>"I appreciate that. I'll keep tracking the data, I'll stay on the medication exactly as prescribed, and I'd like to revisit this conversation in six weeks with another month of readings. Will you put that in the schedule for me?"</em>`)}
    ${p(`Then text me on WhatsApp when you leave the parking lot. We talk strategy. Sometimes that's a second-opinion conversation, sometimes it's a "give him one more cycle of data" conversation. Always it's with respect for your doctor.`, { margin: '0 0 28px' })}
    ${p(`Practice the four sentences out loud this week. With your husband if you can. The first time you say them shouldn't be in the appointment.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`Tell me the date of your next appointment when you book it. I block 15 minutes the morning of to send you a focused voice note — your specific numbers, your specific Pressure, the sentence I'd lead with if I were you. The 1:1 includes a doctor-conversation rehearsal call when you want one.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Three weeks in. The body is moving. Now we prepare the conversation that turns this work into a doctor-cleared taper plan.

Most of you have a cardiology or primary-care appointment somewhere between Week 4 and Week 8. I want you walking in with the right data and the right four sentences. Read this today. Reread it the morning of your appointment.

PILLS MANAGE OUTPUT. PROTOCOL FIXES INPUT.

Your medication lowers the number on the cuff. It doesn't fix what's making the number high — Pipe Pressure, Stress Pressure, Sugar Pressure keep grinding underneath. Which is why most patients end up on a second pill in three years, a third in five.

The protocol fixes the inputs. The pills are still in the picture. We are AND not INSTEAD OF.

That is the frame. Now the script.

THE FOUR SENTENCES.

1. THE OPENER (the partnership frame).
"Doctor, I've been working with a registered nurse and naturopathic practitioner on lifestyle changes targeting the root causes of my high blood pressure — sleep, hydration, nutrition, stress management. I'm taking my medication exactly as you prescribed. I've been tracking my readings twice daily for the past three weeks. Here's the log."

2. THE DATA HAND-OFF.
"My morning average has moved from [Week 1] to [Week 3]. Evening average from [Week 1] to [Week 3]. I'd like this in my chart as a baseline for what we're tracking together."

3. THE ASK.
"I'd like to discuss whether my numbers support a conversation about gradually tapering my medication under your supervision over the next 60-90 days. I'm not asking to stop anything on my own — I want this to be your call, with my data. Can we set a follow-up in 4 weeks?"

4. THE BOUNDARY + FALLBACK.
"I understand you may want to repeat labs, check kidney function, monitor closely. I'm committed to that. If you'd prefer I stay at the current dose while we monitor more, I'd like to revisit in 4-6 weeks with continued data."

Three minutes of the appointment. Most cardiologists say some version of yes by the third sentence.

WHAT TO BRING.

→ Your full BP log. Twenty-one days. Print on one page if you can.
→ A one-page protocol summary. I'll send you a tailored version end of Week 4. Hand it to the doctor for the chart.
→ Your partner if possible. Doctors take it more seriously with a witness. He doesn't need to talk.
→ A notebook. Write down whatever the doctor says.

IF THE DOCTOR SAYS NO.

Some will. Not most. That's information — not failure.

The right response: "I appreciate that. I'll keep tracking the data. I'll stay on the medication exactly as prescribed. And I'd like to revisit this conversation in six weeks with another month of readings. Will you put that in the schedule for me?"

Then text me on WhatsApp when you leave the parking lot.

Practice the four sentences out loud this week. With your husband if you can. The first time you say them shouldn't be in the appointment.

Joel
RN, BraveWorks

P.S. Tell me the date of your next appointment when you book it. I block 15 minutes the morning of to send you a focused voice note — your specific numbers, your specific Pressure, the sentence I'd lead with. The 1:1 includes a doctor-conversation rehearsal call when you want one.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// ─── DAY 30 — First-month check-in + 60/90 day preview ────────────────
const day30 = {
  subject: '30 days in — what\'s working, what to adjust',
  subjectB: 'Your first taper conversation',
  preview: 'Where we\'ve been. What changes in the next 60 days.',
  htmlBody: ({ firstName }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`Thirty days. That's a milestone.`)}
    ${p(`Most BP protocols on the internet are 30-day programs. They are designed to deliver a "before and after" result — a small win, a screenshot, a testimonial that makes them buyable. <strong style="color:${PALETTE.text};">You are not on a 30-day program. You are 30 days into a 90-day repatterning.</strong> The work you've done is the foundation. The next 60 days are where it becomes a body.`, { margin: '0 0 28px' })}
    ${bigQuote('Where we\'ve been.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Month one — Foundation laid. Look at what's true now that wasn't true 30 days ago:</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Hydration is automatic. Water is muscle memory now, not a chore.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ Twenty-five gratitudes have become a rhythm. Cortisol is softer than it was.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ The cuff has watched you for 30 days. We have real data now — not theory.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ The herb stack is started — hibiscus, garlic, magnesium glycinate at minimum, more for some of you.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 8px;">→ You walked through the Day 14 dip and came out the other side.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">→ You have a script for your doctor. Some of you have already had the conversation.</p>
    `)}
    ${p(`That is not a small list. That is a body that does not look like the one that bought this program 30 days ago.`, { margin: '0 0 28px' })}
    ${bigQuote('What changes in the next 60 days.')}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Month two — Replace. Days 31-60.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 14px;">The herb stack completes. Anti-BP Plate becomes the default lunch and breakfast. Walking after meals locks in. Ashwagandha and holy basil layer on top of the gratitude practice. We watch Pipe Pressure soften and the morning-evening gap close.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.text};margin:0 0 12px;font-weight:600;">Month three — Stabilize + Negotiate. Days 61-90.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;">The doctor conversation happens for everyone who hasn't already had it. We move from "tracking" to "tapering" under your physician. For some of you, the first dose reduction lands inside the 90 days. For some it lands in month four — that's normal. The point isn't the dose number. The point is that you are on the road off, with your doctor's signature on the path.</p>
    `)}
    ${p(`After Day 90 the structure changes. The cohort calls slow to monthly. The 1:1 cadence stays for clients who want it (most do). Skool stays open for life. The relationship doesn't end — it changes shape.`, { margin: '0 0 28px' })}
    ${bigQuote('What I need from you today.')}
    ${p(`Three things, simple to do this week.`)}
    ${sageBlock(`
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">1. Send me your Day 30 numbers.</strong> Same five lines as Day 14 — morning average, evening average, sleep, gallon adherence, the thing your body did that nobody else noticed. Reply to this email by Saturday.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0 0 12px;"><strong style="color:${PALETTE.text};">2. Tell me one woman you'd want in this room.</strong> I'm not asking you to sell anything. I'm asking who you think would benefit from the work you've done. If a name pops, that's the right one — text or email me her first name. I send her a personal note from you, no sales pitch attached. Half the women in this cohort came in because someone like you said a name.</p>
      <p style="font-size:16px;line-height:1.65;color:${PALETTE.textSoft};margin:0;"><strong style="color:${PALETTE.text};">3. Post a 30-day reflection in Skool.</strong> One paragraph. What's different. The person three weeks behind you lifts every word.</p>
    `)}
    ${p(`See you on the call this week. We're not slowing down — we're laying the next 60 on top of the first 30.`, { margin: '0 0 28px' })}
    ${joelSignoff()}
    ${psBox(`If your Day 30 numbers haven't moved as much as you hoped — read this twice. The Triangle does not always show its hand in the cuff first. Sometimes it shows up in sleep, in mood, in your relationship, in the way your husband looks at you across the kitchen. The cuff will catch up. Trust the body.`)}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName }) => `Hi ${firstName || 'there'},

Thirty days. That's a milestone.

Most BP protocols on the internet are 30-day programs. They're designed to deliver a "before and after" — a small win, a screenshot, a buyable testimonial. You are not on a 30-day program. You are 30 days into a 90-day repatterning. The work you've done is the foundation. The next 60 days are where it becomes a body.

WHERE WE'VE BEEN.

Month one — Foundation laid. Look at what's true now that wasn't 30 days ago:

→ Hydration is automatic. Muscle memory, not a chore.
→ Twenty-five gratitudes are a rhythm. Cortisol is softer.
→ The cuff has watched you for 30 days. Real data, not theory.
→ The herb stack is started — hibiscus, garlic, magnesium glycinate at minimum.
→ You walked through the Day 14 dip and came out the other side.
→ You have a script for your doctor. Some of you have already had the conversation.

That is not a small list. That is a body that does not look like the one that bought this program 30 days ago.

WHAT CHANGES IN THE NEXT 60 DAYS.

MONTH TWO — REPLACE. Days 31-60.
The herb stack completes. Anti-BP Plate is default lunch and breakfast. Walking after meals locks in. Ashwagandha and holy basil layer on top of the gratitude practice. We watch Pipe Pressure soften and the morning-evening gap close.

MONTH THREE — STABILIZE + NEGOTIATE. Days 61-90.
Doctor conversation for everyone who hasn't had it. From "tracking" to "tapering" under your physician. For some, first dose reduction inside the 90 days. For some, month four — normal. The point isn't the dose number. The point is you are on the road off, with your doctor's signature on the path.

After Day 90 the structure changes. Cohort calls slow to monthly. 1:1 cadence stays for clients who want it (most do). Skool stays open for life. The relationship changes shape, doesn't end.

WHAT I NEED FROM YOU TODAY.

1. SEND ME YOUR DAY 30 NUMBERS. Same five lines as Day 14. Reply by Saturday.

2. TELL ME ONE WOMAN YOU'D WANT IN THIS ROOM. Not selling. Who would benefit. If a name pops, that's the right one — text or email her first name. I send a personal note from you, no sales pitch. Half this cohort came in because someone like you said a name.

3. POST A 30-DAY REFLECTION IN SKOOL. One paragraph. The person three weeks behind you lifts every word.

See you on the call this week. We're not slowing down — we're laying the next 60 on top of the first 30.

Joel
RN, BraveWorks

P.S. If your Day 30 numbers haven't moved as much as you hoped — read this twice. The Triangle does not always show its hand in the cuff first. Sometimes it shows up in sleep, in mood, in your relationship, in the way your husband looks at you across the kitchen. The cuff will catch up. Trust the body.

—
→ Skool: ${SKOOL_URL}
→ YouTube: ${YOUTUBE_URL}
`,
};

// Map day-since-tier-4-entered → email object
export const TIER_4_DAYS = {
  0: day0,
  1: day1,
  3: day3,
  5: day5,
  7: day7,
  10: day10,
  14: day14,
  17: day17,
  21: day21,
  30: day30,
};

// Idempotency flag name — used by the cron to skip already-sent emails
export function tier4SentFlag(day) {
  return `tier4Day${day}Sent`;
}
