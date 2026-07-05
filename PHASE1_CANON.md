# BPQuiz Phase 1 — CANON (single source of truth)

Both the SITE agent and the EMAIL agent MUST follow this exactly so the two tracks ship in sync. Authored 2026-06-22 from the Russell self-liquidation plan + the email audit. Do NOT deviate from these numbers/strings.

## The Triangle (THE rebrand)
- New three corners: **Stress · Sugar · Sodium**. (Third corner used to be "Pressure" / "Three Pressures" / "Pipe Pressure" / "vascular" — ALL of those become **Sodium**.)
- "Pressure" is now framed as the OUTCOME the loop produces, never a corner/cause.
- Sodium teaching: stress→cortisol→holds sodium; sugar→insulin→holds sodium; sodium→fluid + vessel strain→pressure. Each corner feeds the next two. "Calm all three and your numbers come home."
- **Villain line (put it high on the site + weave into emails):** "The system treats your symptom — the pill hides the number. The Triangle heals the loop — the cause. That is why blood pressure gets managed for thirty years instead of healed."
- Do a full sweep for "vascular damage" too (older copy) — replace with the Sodium framing.

## Prices / ladder (exact)
| Rung | Product | Price | price_cents | Notes |
|---|---|---|---|---|
| Front | 10-Day Nurse's Reset (kit) | **$27** | **2700** | was $17/1700. Revamp copy around Stress·Sugar·Sodium. |
| Cheap rung | The Companion (book) | **$12.99** | 1299 | link `bJe4gzeIrfme9ft3B7fnO02`. Put it EVERYWHERE (thank-you + emails). |
| Shadow seat | $97 (see below) | **$97** | 9700 | evergreen; fires on $297 decline. Stripe link `9B67sL7fZ6PI8bp9ZvfnO0H`. |
| Back-end | 30-Day Personalized Sprint | **$297** | 29700 | flat link `00weVddEnca2ajx0oVfnO0O` (cold leads); kit-credit link `7sY9ATeIra1Uajx9ZvfnO0P` (buyers). |
| High-end | 90-Day Group (Cohort 2) | **$1,997** | — | THE top of the ladder. |

- **CREDIT MATH RECOMPUTE:** the front is now $27, so the Sprint kit-credit is **$297 − $27 = $270** (everywhere it said $280, make it $270). Any "$17" used as a credit base becomes "$27".
- **Kill these orphan/legacy prices from live copy:** $1,297 (old 1:1), $2,997, $497 cohort, $397 "Premium." The ladder top is $1,997, full stop.
- Fix the tier-3 **$697 vs $597** contradiction: pick **$697 × 3** consistently (that is what reconciles closest; reconcile the net to the $1,997/$1,700 Cohort 2 math and make D7 + D14 say the SAME number).

## The standing group call
- **Wednesday 7:00 PM EST.** (NOT Monday — Monday is now only an unguaranteed TikTok live; remove all "Monday 10 PM ET" call references and replace with "Wednesday 7 PM EST.")
- Zoom link is in Vercel env `VITE_MONDAY_ZOOM_URL` (keep the var name, it already holds the Wed link: https://us06web.zoom.us/j/81541901408?pwd=8aOJeGbTcHJEsHO35be9hfOk2k5acm.1 ). Reference it via the existing env var; do not hardcode the link.

## The $97 evergreen shadow seat
- **Deliverable:** everything in the kit + **a standing seat in the Wednesday 7 PM EST live group call** (not a personalized plan — that is the $297). Anchor: "about what one month of BP meds costs."
- **Evergreen, not cohort-locked** — buyable any day; they join the next Wednesday call. Remove "cohort closes Friday / next cohort $147" scarcity; replace with evergreen framing.
- **Where it fires:** as the downsell when someone declines the $297 Sprint. SITE: revive the ChallengePage VIP block as the standalone evergreen $97 page. EMAIL: a $97 shadow-seat email inside the tier-3 sequence (after the Sprint is not taken). Do NOT turn the dormant cold-$97 drip/newsletter pitches back on.
- **Hand-up:** the $97 page + its follow-up should point to the $297 Sprint as the next step ("ready for a plan with your name on it?").

## Voice / guardrails
- Joel Polley, RN voice. Education alongside your doctor, never instead. No "treat/cure/prescribe" as medical claims.
- ZERO em-dashes in body copy.
- NEWSTART/plant-forward, no caffeine, faith-friendly-not-preachy.

## Build discipline (BOTH agents)
- **Do NOT deploy. Do NOT git push.** (bpquiz has a master-push hard-block; Joel deploys manually after review.) Modify the working tree only.
- SITE agent: run `npm run build` and confirm it compiles.
- EMAIL agent: `node --check` every email/cron JS file you touch (the api/ files are not in the Vite build).
- Each agent reports a precise change summary (files touched + the before→after for every price/brand string).
