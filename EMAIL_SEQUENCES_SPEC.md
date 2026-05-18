# Email Sequences Spec — BraveWorks RN / BPQuiz.com

**Version:** 1.0 · 2026-05-17
**Owner:** Joel Polley, RN
**Author:** State-machine email rebuild

This is the canonical reference for every agent authoring an email sequence in the bpquiz-site repo. All 5 tier sequences share the same voice, helper functions, palette, and structural conventions.

---

## 1. THE BRAND ESSENTIALS

**Brand:** BraveWorks RN — Joel Polley, 20 years ICU/Emergency, now naturopathic practitioner.
**Site:** bpquiz.com
**Voice:** Knowledgeable nurse-friend, plain words, 4th-grade reading level, never hypey.
**The Method:** The BP Triangle Method™ — Three Pressures (Stress Pressure / Sugar Pressure / Pipe Pressure).

**The audience (every tier):**
- Women 50–70 (mostly), elevated BP, often on 1+ meds
- NEWSTART / Adventist / faith-friendly tone resonates
- Many were Barbara O'Neill–adjacent before they found Joel
- They are scared, frustrated, smart, and skeptical of hype
- They share emails with daughters and husbands

**Vocabulary lock (always use):**
- **The Three Pressures**: Stress Pressure (cortisol), Sugar Pressure (insulin), Pipe Pressure (vascular)
- **The Triangle Method™** — the umbrella
- **The Path to BP Freedom** — the journey arc
- **AND not INSTEAD OF** — protocol + pills, never instead of pills

**Always sign with:** Joel · RN, BraveWorks
**Never claim:** treat, cure, diagnose, prescribe. Educational only.

---

## 2. THE TIER STATE MACHINE

| State | Product(s) | Price | Sequence file | Goal | Length |
|---|---|---|---|---|---|
| `lead` | Pre-purchase | Free | `_tier-lead-emails.js` | Convert to tier-1 | 10 emails / 21 days |
| `tier-1` | BP Starter, BP Reset Kit | $17 / $47 | `_tier-1-emails.js` | Upsell to tier-3 Diagnostic ($297) | 10 emails / 21 days |
| `tier-2` | BP Triangle Challenge | $97 | `_tier-2-emails.js` | Fulfill 30-day promise + upsell to Cohort 2 | 10 emails / 30 days |
| `tier-3` | BP Triangle Diagnostic | $297 | `_tier-3-emails.js` | Upsell to Cohort 2 ($1,997) | 10 emails / 14 days |
| `tier-4` | Cohort 2 / 1:1 | $1,997+ | `_tier-4-emails.js` | Onboarding, never selling | 10 emails / 30 days |
| `newsletter` | All-graduates | — | (Phase 6 content bank) | Re-warm, weekly forever | Evergreen |

**Single rule:** a subscriber occupies ONE state at a time. State transitions on purchase events. Sequences NEVER fire concurrently across tiers — only one cron's `state === 'X'` filter matches any given record.

---

## 3. THE OFFER LADDER (live URLs)

```js
KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A'    // $17 BP Starter
RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k'    // $47 BP Reset Kit
CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H'    // $97 BP Triangle Challenge (cohort + Skool + weekly Zoom)
COACHING_URL  = `${SITE_URL}/coaching`                              // $297 BP Triangle Diagnostic
COHORT2_URL   = `${SITE_URL}/cohort2`                               // $1,997 Cohort 2 (application)
SPRINT_CREDIT = process.env.VITE_STRIPE_SPRINT_WITH_DIAGNOSTIC_CREDIT_LINK || COHORT2_URL  // $1,700 = $1,997 - $297 credit
SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about'
YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn'
```

**Pitch direction by tier (HARD RULE):**
- `lead` → pitches **$17 BP Starter only** (no $47/$97 pitches in welcome arc — too many decisions)
- `tier-1` ($17/$47 buyers) → pitches **$297 Diagnostic only**. Never re-pitches $97 (sideways) or $1,997 (too steep)
- `tier-2` ($97 buyers) → fulfills the 30-day promise + pitches **$297 Diagnostic** (Days 1-15) and **Cohort 2** (Days 16-30)
- `tier-3` ($297 buyers) → pitches **Cohort 2 ($1,997)** with $297 credit
- `tier-4` → never pitches. Onboarding only.

---

## 4. HELPER FUNCTIONS — copy these verbatim into every `_tier-N-emails.js`

```js
export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Active product Stripe links
export const KIT_URL       = 'https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A';
export const RESET_KIT_URL = 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k';
export const CHALLENGE_URL = 'https://buy.stripe.com/9B67sL7fZ6PI8bp9ZvfnO0H';
export const COACHING_URL  = `${SITE_URL}/coaching`;
export const COHORT2_URL   = `${SITE_URL}/cohort2`;
export const SKOOL_URL     = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
export const YOUTUBE_URL   = 'https://www.youtube.com/@braveworksrn';

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

// Joel's standard signoff — every email ends with this
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

// Tier-specific upsell footer. Place BEFORE footerSecondaryCTAs().
// kicker = small caps eyebrow label
// body   = 1-2 sentence pitch
// ctaLabel + ctaUrl = the link
function upsellFooter({ kicker, body, ctaLabel, ctaUrl }) {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">${kicker}</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">${ctaLabel} →</a>
  </div>`;
}
```

---

## 5. EMAIL OBJECT SHAPE

Every email exports as:

```js
const day1 = {
  subject: 'primary subject line, 6-10 words, mobile-optimized',
  subjectB: 'A/B variant for Mailchimp test',
  preview: 'preview text that extends (does not repeat) the subject',
  htmlBody: ({ firstName, unsubUrl }) => `
    ${p(`Hi ${firstName || 'there'},`)}
    ${p(`...body content...`)}
    ...
    ${joelSignoff()}
    ${psBox(`...`)}
    ${upsellFooter({...})}
    ${footerSecondaryCTAs()}
  `,
  textBody: ({ firstName, unsubUrl }) => `Hi ${firstName || 'there'},
...
Joel
RN, BraveWorks
...`,
};
```

**Full module export pattern (match this exactly):**

```js
// File: api/_tier-N-emails.js

import {
  FROM, REPLY_TO, SITE_URL,
  KIT_URL, RESET_KIT_URL, CHALLENGE_URL, COACHING_URL, COHORT2_URL,
  SKOOL_URL, YOUTUBE_URL,
} from './_email-helpers.js';

// [copy helpers OR import from _email-helpers.js]

// ─── DAY N emails ─────
const day1 = { ... };
const day3 = { ... };
const day5 = { ... };
// ... etc

// Map day-since-state-entered → email object
export const TIER_N_DAYS = {
  1: day1,
  3: day3,
  5: day5,
  // ...
};

// Idempotency flag name — used by the cron to skip already-sent emails
export function tierNSentFlag(day) {
  return `tier${N}Day${day}Sent`;
}
```

---

## 6. WRITING STYLE RULES (from wellness-email-copy skill)

**DO:**
- Short paragraphs (1-3 sentences max — emails are read on phones)
- Use `you` more than `I`
- Specificity sells: "7.2 mmHg drop in 6 weeks" beats "lower BP"
- Include a real or composite patient story (anonymized) when possible
- One email, ONE idea, ONE primary CTA
- Always end with `psBox()` — 2nd most-read line in email
- Always end with `footerSecondaryCTAs()`
- Reference Three Pressures vocabulary naturally — never force it

**DON'T:**
- Wall-of-text paragraphs (instant delete on mobile)
- Hype ("AMAZING!" / "MIND-BLOWING!" / urgency that isn't real)
- Sell in the first 2 emails of any sequence — earn the right first
- Pitch products the reader already owns (e.g., tier-1 buyer email pitching $17 Kit — they have it)
- Make medical claims (treat / cure / diagnose / prescribe)
- Use lyrics, song titles, or copyrighted material

**Subject line formulas that perform:**
- Curiosity Gap: "The BP number your doctor isn't checking"
- Direct Benefit: "Lower 10 points by Friday"
- Story Tease: "What happened to Marlene at her 9 AM appointment"
- Insider: "What I tell my patients I can't say on TikTok"
- Counterintuitive: "Why your sodium-cutting is making it worse"
- Question: "Is your morning routine raising your BP?"

**Frameworks (rotate across the arc):**
- PAS (Problem → Agitate → Solution) — best for re-engagement, mid-arc pitches
- BAB (Before → After → Bridge) — best for testimonial/transformation emails
- PASTOR — best for long sales emails (the final pitch in the arc)
- Soap Opera — best for storytelling arcs across consecutive emails
- Seinfeld — best for newsletter-style filler ("nothing email" that still teaches)
- 4 U's (Urgent, Unique, Useful, Ultra-specific) — for subject lines + CTA

---

## 7. THE 5 SEQUENCES — 10-EMAIL SKELETONS

Each agent gets the skeleton for ONE sequence. The skeleton specifies day, goal, framework, and subject seeds — the agent writes the full body.

### SEQUENCE A — LEAD (`_tier-lead-emails.js`)

**Audience:** Just gave email via quiz/lead-magnet/exit-popup. Has NOT bought anything. State = `lead`.
**Goal:** Convert to $17 BP Starter buyer in ≤21 days. Failure → graduate to newsletter at Day 21.
**Length:** 10 emails over 21 days.

| # | Day | Goal | Framework | Subject A | Subject B |
|---|---|---|---|---|---|
| 1 | 0 (immediate) | Deliver Triangle map + first impression + opt-in confirm | Direct | "Your BP Triangle map is inside" | "[Name], your map from Joel" |
| 2 | 1 | Origin story — ICU nurse who switched | Story / Soap Ep 1 | "20 years in the ICU taught me one thing" | "I almost didn't write this email" |
| 3 | 3 | Quick win they can do today (hibiscus tea) | PAS | "3 cups of this tea, 7 points lower in 6 weeks" | "The tea your grandmother drank for BP" |
| 4 | 5 | Three Pressures deep-teach + diagnostic | Deep Dive | "Which of the Three Pressures is loudest in you?" | "Stress · Sugar · Pipes — pick one" |
| 5 | 7 | Linda case study (BAB social proof) | BAB | "148/94 → 128/82 in 11 days" | "What Linda's cardiologist asked her" |
| 6 | 10 | Soft pitch — $17 BP Starter | PASTOR | "If you only do one thing this week" | "$17. Inbox in 60 seconds." |
| 7 | 13 | Objection killer — "I've tried everything" | Objection | "Why your last attempt didn't stick" | "The reason most BP plans fail at Day 14" |
| 8 | 16 | Bonus story — Paul case (different angle) | Story | "Paul slept through the night by Day 4" | "The cortisol thing nobody told you" |
| 9 | 19 | Final pitch + 7-day refund framing | PAS + Guarantee | "Worst case: $17 and a free PDF" | "Joel's refund promise" |
| 10 | 21 | Graceful exit / "I'll send less from here" | Direct | "I'm not going to keep sending these" | "Last email before you become a Tuesday person" |

**Stop conditions:**
- Buys $17 → transition to tier-1
- Day 21 + no purchase → transition to newsletter
- Unsubscribe → drop

---

### SEQUENCE B — TIER-1 (`_tier-1-emails.js`)

**Audience:** Bought $17 BP Starter or $47 BP Reset Kit. Has NOT bought $297 Diagnostic. State = `tier-1`.
**Goal:** Upgrade to $297 Diagnostic Session in ≤21 days. Failure → newsletter.
**Length:** 10 emails over 21 days.

| # | Day | Goal | Framework | Subject A | Subject B |
|---|---|---|---|---|---|
| 1 | 0 (immediate) | Receipt + "how to use what you just got" | Direct | "Your BP Starter is ready — here's how to use it" | "Day 1 starts tomorrow morning" |
| 2 | 2 | First-win nudge — log first reading | Quick Win | "Did you take your first reading?" | "Your Day 2 number matters more than Day 1" |
| 3 | 4 | Plateau warning + expectation-setting | PAS | "Day 4 is the day most quietly quit" | "Most readers stall here. Don't." |
| 4 | 7 | Three Pressures reframe — what the $17 can't do alone | Deep Dive | "The Pressure your kit didn't fully address" | "What the $17 starter can't do alone" |
| 5 | 10 | First $297 Diagnostic seed | Story | "60 minutes with me. Personalized." | "I'd like to look at your numbers" |
| 6 | 13 | Patricia diagnostic case study (BAB) | BAB | "Patricia walked out with a different protocol" | "What happens in 60 minutes" |
| 7 | 15 | Mechanism teach — how the diagnostic works | Deep Dive | "What I actually do in the diagnostic call" | "The 4 things I look at first" |
| 8 | 17 | Objection killer + credit math ($17 → $280) | Objection | "What if I told you the diagnostic IS the deposit?" | "$280 after your $17 credit" |
| 9 | 19 | Scarcity — real calendar cap (6 slots/mo) | Urgency | "Two open slots this month" | "Next opening: June 1" |
| 10 | 21 | Last call + graceful exit | PAS + Close | "Last email I'll send about this" | "If not now, when?" |

**Stop conditions:**
- Buys $297 → transition to tier-3
- Buys $97 → transition to tier-2
- Day 21 + no upgrade → transition to newsletter
- Unsubscribe → drop

---

### SEQUENCE C — TIER-2 (`_tier-2-emails.js`)

**Audience:** Bought $97 BP Triangle Challenge (30-day cohort + Skool + weekly Monday Zoom). State = `tier-2`.
**Goal:** Fulfill the 30-day promise (chapter walkthroughs + community + Monday calls) + upsell to Cohort 2 ($1,997) by Day 30.
**Length:** 10 emails over 30 days.

**THIS IS THE CRITICAL FIX SEQUENCE** — these buyers are currently getting the universal drip which pitches products they already own. Three known $97 buyers (Shenette Thompson, Phyllis Emery, Dora Reeves) are imports without Stripe webhook flags — they need this sequence yesterday.

**Promises to fulfill (every email reinforces ONE):**
1. Daily chapter walkthroughs (every 3 days here, fuller content per email)
2. Weekly Monday Zoom invitations (one email/week reminds them)
3. Skool VIP community access (early email delivers + reinforces)
4. Full bonus stack — Cortisol kit + Blood Sugar kit content (early emails deliver these)
5. Cohort 2 upsell graceful (Days 16-30)

| # | Day | Goal | Framework | Subject A | Subject B |
|---|---|---|---|---|---|
| 1 | 0 (immediate) | Welcome to Challenge + Skool invite + Monday Zoom calendar invite | Direct | "Welcome to the BP Triangle Challenge" | "You're in. Here's Monday's link." |
| 2 | 3 | Stress Pressure chapter (cortisol) + first Monday call reminder | Deep Dive + Reminder | "Stress Pressure — Chapter 1 of your Challenge" | "Monday at 9 PM ET — first live call" |
| 3 | 6 | Sugar Pressure chapter (insulin) + Cohort 1 wins | Deep Dive + Soap Ep | "Sugar Pressure — Chapter 2" | "The corner cardiologists never measure" |
| 4 | 9 | Pipe Pressure chapter (vascular) + bonus Cortisol Kit delivery | Deep Dive + Bonus | "Pipe Pressure — Chapter 3 + your Cortisol Kit" | "The pipes you can't see but can feel" |
| 5 | 12 | Bonus Blood Sugar Kit delivery + Monday reminder | Bonus + Reminder | "Your Blood Sugar Kit is unlocked" | "Monday call: live BP demo with Joel" |
| 6 | 15 | Mid-cohort check-in — first Cohort 2 mention (soft) | Reflection + Soft pitch | "Halfway through. How's the cuff?" | "What's working — and what's next" |
| 7 | 18 | Cohort 2 reveal — what's after the Challenge | PASTOR | "After the Challenge: there's a deeper room" | "Cohort 2 opens to graduates first" |
| 8 | 22 | Wakita's first 30 days inside the deeper program (BAB) | BAB / Case Study | "Wakita's Sunday — a peek inside 90-day work" | "What Sprint clients do on Day 30" |
| 9 | 26 | Cohort 2 mechanism + credit math | Deep Dive | "Cohort 2: what it is, what it's not" | "Application doors open until Friday" |
| 10 | 30 | Graduation + Cohort 2 last-call + transition to newsletter | Direct + Close | "Day 30 — you made it" | "Your Cohort 2 invitation (closes tonight)" |

**Special note for Day 1:** This email MUST also send a calendar invite (.ics or Google Calendar link) for the next Monday Zoom call. Joel will configure the Zoom URL in env (`VITE_MONDAY_ZOOM_URL`).

**Stop conditions:**
- Buys $297 → transition to tier-3 (rare path)
- Buys $1,997 Cohort 2 → transition to tier-4
- Day 30 + no upgrade → transition to newsletter
- Unsubscribe → drop

---

### SEQUENCE D — TIER-3 (`_tier-3-emails.js`)

**Audience:** Bought $297 BP Triangle Diagnostic Session. Pre or post-call. State = `tier-3`.
**Goal:** Convert to Cohort 2 ($1,997, applies $297 as credit → $1,700 net) by Day 14.
**Length:** 10 emails over 14 days.

(This sequence replaces the existing `_diagnostic-drip-emails.js` — same arc, two extra emails added per Joel's 10-per-tier request.)

| # | Day | Goal | Framework | Subject A | Subject B |
|---|---|---|---|---|---|
| 1 | 0 (immediate) | Confirmation + Calendly + 4-thing prep checklist | Direct | "Your diagnostic is booked — here's what to send me" | "Before we talk: 4 things" |
| 2 | 1 | Why the diagnostic exists (Patricia case) | Story / Soap Ep 1 | "Patricia's story — read before our call" | "What I'm looking for on our call" |
| 3 | 3 | The three paths after the call (Cohort 2 introduced) | Deep Dive | "Three things can happen after we talk" | "The three doors from our call" |
| 4 | 5 | Wakita's first 30 days inside Sprint (BAB) | BAB | "Wakita's Sunday: a peek inside the 90-day work" | "Inside the Sprint — first 30 days" |
| 5 | 7 | Cohort 2 reveal — full pitch + credit math | PASTOR | "Cohort 2 opens for diagnostic graduates first" | "$1,700 net — the math on Cohort 2" |
| 6 | 9 | Objection killer #1 — "I'm not ready" | Objection | "If you're 'not ready,' read this twice" | "The myth of being ready" |
| 7 | 10 | Future-self / 90 days from today | Hardy / Story | "What 90 days from now looks like" | "A Tuesday in October — written by you" |
| 8 | 11 | Objection killer #2 — "Will this work for MY situation?" | Objection | "What if your case is different?" | "Your case is more common than you think" |
| 9 | 12 | Cohort 2 caps + scarcity | Urgency | "12 seats, 4 left" | "Doors close Friday at midnight" |
| 10 | 14 | Final close OR graceful exit | PASTOR + Close | "Last email about Cohort 2" | "If now isn't your moment — here's what to do" |

**Stop conditions:**
- Buys Cohort 2 → transition to tier-4
- Buys $6,997 1:1 → transition to tier-4 (1:1 variant)
- Day 14 + no upgrade → transition to newsletter (tagged `diagnostic-graduate` — warmer subset)
- Unsubscribe → drop

---

### SEQUENCE E — TIER-4 (`_tier-4-emails.js`)

**Audience:** Bought Cohort 2 Sprint ($1,997) OR 1:1 Coaching ($6,997). State = `tier-4`.
**Goal:** Onboard them for success in Week 1. NEVER sell. Build retention + referral momentum.
**Length:** 10 emails over 30 days.

(Wakita is the proof case for this sequence. She closed 5/15. The previous "_sprint-onboarding-cron" plan had only 5 emails; Joel wants 10.)

| # | Day | Goal | Framework | Subject A | Subject B |
|---|---|---|---|---|---|
| 1 | 0 (immediate) | Welcome + Sunday kickoff details + intake form | Direct | "Welcome — Sunday at 7 PM ET" | "Your 90-day journey starts here" |
| 2 | 1 | Week 1 agenda + partner-support framing | Direct | "Your Week 1 — bite-sized, with your partner" | "What to expect in the first 7 days" |
| 3 | 3 | Skool VIP room access + community welcome | Direct | "Your VIP Skool room is open" | "Meet your cohort — introduce yourself here" |
| 4 | 5 | Bonus #1 — Barbara O'Neill ticket details (Tier 4 only) | Direct | "Your Barbara O'Neill ticket is inside" | "June 24-25 — virtual event details" |
| 5 | 7 | Week 1 reflection prompt | Direct | "Week 1 reflection — how are you feeling?" | "What's working, what's tight?" |
| 6 | 10 | Plateau-buster — the Day 14 dip is coming | PAS / Coach | "Day 14 is the hardest day — read this now" | "Why your numbers might pause" |
| 7 | 14 | First numbers check-in + adjustment | Direct | "Halfway to Day 30 — pulse check" | "What the data is telling us" |
| 8 | 17 | The herb formulary — full deep dive | Deep Dive | "The 7 herbs I'm prescribing this cohort" | "Your herb stack — week by week" |
| 9 | 21 | Doctor conversation prep + script | Direct | "Your next doctor visit — the script" | "How to talk to your cardiologist" |
| 10 | 30 | First-month check-in + 60/90 day preview | Direct | "30 days in — what's working, what to adjust" | "Your first taper conversation" |

**Stop conditions:**
- 90-day Sprint complete → transition to newsletter (tagged `sprint-alumni`)
- Refund event → transition to newsletter (tagged `refunded` + `cooldown:90d`)

---

## 8. CRITICAL NOTES FOR WRITERS

1. **Match the existing voice exactly** — Read `api/_drip-emails.js` Days 1-12 before writing. Pull tone, sentence rhythm, paragraph length, "Three Pressures" lock-in.

2. **Real patients to reference** (use as case studies — names already established in the brand):
   - **Linda** — 62, 148/94 → 128/82 in 11 days, $47 Reset Kit
   - **Paul** — 48, slept through the night by day 4, Cortisol Reset
   - **Rachel** — 55, fasting glucose 138 → 109 in 3 weeks, Complete Bundle
   - **Marlene** — 52, 11 points in 9 days with 3 food swaps (Day 3 + Day 12 universal drip)
   - **Patricia** — Diagnostic call case (introduced in tier-3 sequence)
   - **Wakita Taylor** — first paid 1:1 client (use ONLY in tier-3/tier-4 sequences, never lead/tier-1)

3. **Bonus content names** (real products that ship via tier-2):
   - Cortisol Reset Kit (10-Day Cortisol Cure)
   - Blood Sugar 10-Day Reset
   - Cook For Life Cookbook (45 plant-based recipes)
   - White Coat Syndrome Guide
   - Overmedicated Boomers Book

4. **Day field naming** — `daysSince{TIER}EnteredAt` is the trigger. So day numbers in the email map (1, 3, 5, etc.) are "days since they entered this tier state," NOT calendar days, NOT days since email signup.

5. **Helper functions must be present in every file** — copy the full helper block from Section 4 above into each `_tier-N-emails.js`. Don't dedupe into a separate file yet (Phase 5).

6. **Always include `unsubUrl` in template ctx** — every email's bottom needs a working unsubscribe link. The cron will pass it in.

7. **Test data shape** — every export must have `subject` (string), `subjectB` (string), `preview` (string), `htmlBody(ctx)` (function returning string), `textBody(ctx)` (function returning string). The render-layer wrapper expects these exactly.

8. **Length per email** — aim for ~400-600 words in the HTML body. Phones, not desktops, are the screen.

9. **Footers per email** — every email ends with:
   ```
   ${joelSignoff()}
   ${psBox(...)}
   ${upsellFooter({...})}   ← OPTIONAL — only include if pitching
   ${footerSecondaryCTAs()}
   ```

10. **Never break copyright** — no song lyrics, no quoted speeches from other authors, no movie/show references. Joel's voice is original.

---

*Spec maintainer: state-machine email rebuild. Last updated 2026-05-17. Living doc.*
