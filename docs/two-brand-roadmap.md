# Two-Brand Roadmap: BraveWorks RN + Everyday Nurse

**Source:** Joel's whiteboard brainstorm (2026-07-12) + gap analysis against this repo
(PHASE1_CANON, wednesday-engine, church-kit, svutu-steady-launch-merged, period-b-collapse).
This doc turns the whiteboard into a sequenced plan with owners, and records the gaps the
whiteboard missed so they do not get lost.

---

## The whiteboard, transcribed

**BraveWorks RN** (needs LLC)
- Channels: TikTok, IG, YouTube, FB · Skool x2 · Website (under construction) · Brand deals x2 · Podcasting
- Products: App, Tea, Kit, Coaching ($297 / $1,997), EBooks, Book ("The Blood Pressure industry scam")
- Rev streams listed: Affiliate products, FB subscription, TT subscription, Skool MRR,
  Creator rewards, Kits, Teas, Coaching, EBooks

**Everyday Nurse**
- Channels: TikTok, YouTube, IG, FB? · (Skool) · Website (under construction)
- Products: Herbal Teas (Svutu), App, Tea, Kit?, Replay offer, Coaching? (12 weeks), Book
- Rev streams listed: YouTube, Book sales, Event replay, Teas

**Joint venture** (the funnel sketch in the middle)
- Webinar → Offer → Replay offer
- Joint kit
- Theme: **BP + Hormones** (the Annie / RestoreHER / Svutu Steady collab)

---

## Sequencing (do these in order)

### Phase 0 — Traffic recovery (the current fire, blocks everything)

Per `docs/period-b-collapse-2026-07-03.md`: visitors fell from ~460/day to ~180/day after
the cutover. No product or brand work outranks this.

1. Diagnose posting cadence and FB reach; confirm DNS/domain state after the cutover.
2. Take the retired braveworks-bp deployment dark (still live, still leaking conversions
   and polluting funnel metrics).
3. Identify or knowingly retire the silent "store" checkout integration (~$450/mo,
   Stripe metadata `store_01KMDAKJZB6N0ZDEJSXWDBRNBN`, silent since 06-22).
4. Keep feeding the Wednesday Engine. It is the cheapest traffic machine we have.

**Exit criteria:** back above ~400 visitors/day for two consecutive non-Sabbath weeks.

### Phase 1 — Close the Svutu Steady launch brackets

The 6-email merged sequence is written (`campaigns/svutu-steady-launch-merged/`). Four
blockers remain, all human decisions, not builds:

| # | Blocker | Owner |
|---|---|---|
| 1 | `[LAUNCH OFFER]` founding price, Email 6 | Joel + Annie |
| 2 | `[DEADLINE]` honest cutoff, Email 6 | Joel + Annie |
| 3 | `[REVIEW]` one real testimonial, Email 6 p.s. | Annie |
| 4 | Compliance pass: hawthorn + BP-med interactions (highest-scrutiny sequence) | Joel (RN review) + AI draft |

Also resolve the Sodium-corner vs Pipe-Pressure naming conflict flagged in the SEND-PLAN
before send (emails currently say "Sodium corner" to match the live tea page).

### Phase 2 — Joint BP + Hormones webinar

Good news the whiteboard undersells: the webinar → offer → replay machinery already exists
on the BP side (`api/seminar-signup.js`, `api/seminar-broadcast.js`, `api/zoom-closer-cron.js`).
The build is small. The blocker is terms, not tech.

**JV terms to agree in writing before anything ships (one page is enough):**
- Who owns emails captured at the webinar (recommend: both lists get every registrant,
  tagged by source, and both parties may market to them)
- Revenue split on the joint kit and the replay offer, and whose Stripe collects
- Who fulfills tea orders and who eats shipping/COGS
- Who is on the hook for refunds and customer service
- Content approval: both parties sign off on the webinar deck and the replay page

**Calendar rules (documented lessons, non-negotiable):**
- Never launch in the last week of a month. The 55+ fixed-income audience is broke then
  (visible in the May AND June data).
- Respect the Sabbath gate: no Friday-evening or Saturday launch moments.
- Target: a mid-month Wednesday, so the live Skool call can promote it same-week.

### Phase 3 — Church pilots (the channel the whiteboard forgot)

`docs/church-kit/launch-plan.md` is fully worked: 5 pilot churches at $297, then
$297/$497 standard. Each church is a standing distribution partner at $0 CAC. This is the
only channel on the board that does not depend on daily content output or platform
algorithms. Run it in parallel with Phase 2 once Phase 0 is stable, since it uses
different hours (outreach emails, one Zoom per church).

The same play ports to Everyday Nurse later: workplaces, nursing schools, hospital
wellness committees.

### Phase 4 — Everyday Nurse buildout (only after Phases 0-2)

Do not start a second brand while the first brand's traffic is down 60%. When it starts,
fix the whiteboard's structural gaps from day one:

1. **List-first.** Every channel points at an email capture. The whiteboard's rev box has
   zero owned-audience streams; that is the first thing to correct.
2. **Recurring revenue from day one.** YT + book + replay + teas is all one-shot income.
   Add the ladder: low-ticket entry → community MRR (Skool) → coaching. Reuse the
   BraveWorks ladder shape ($27 entry → $27/mo → $97 → $297 → high-ticket) rather than
   inventing a new one.
3. **The 12-week coaching question mark:** decide after the joint webinar proves demand,
   not before.
4. **Name check:** run a trademark / domain / handle search on "Everyday Nurse" before
   building anything on it. It is a generic-sounding name and likely contested.

---

## Standing gaps to fix regardless of phase

### 1. Email list belongs in the rev-stream box
The governing metric is trailing-30d revenue per captured email (target $6.00, per
`docs/wednesday-engine.md`). FB subscriptions, TT subscriptions, and creator rewards are
rented streams a platform can turn off; the list is owned. Track and grow it as the
primary asset for BOTH brands.

### 2. The middle of the ladder
The whiteboard jumps kit → $297/$1,997 coaching. The live ladder (PHASE1_CANON) is:
$27 kit → $12.99 Companion book → $27/mo Skool → $97 shadow seat → $297 Sprint → $1,997
cohort. The middle rungs make the economics work. Keep them on every map.

### 3. App monetization decision
The app appears in both brand columns and neither rev box. Decide one of:
free lead-gen for the kit funnel / paid app / subscription. Also decide: one app with two
front doors, or two builds (recommend one app; two builds doubles cost for little gain).
Waitlist machinery already exists (`api/app-waitlist.js`, `APP_WAITLIST_EMAILS.md`).

### 4. LLC and legal structure
"Need LLC" is on the board; the actual decision list is:
- One LLC with two DBAs vs. two LLCs (the tea/supplement + RN-coaching side carries the
  higher liability; that argues for separation or at least good insurance)
- Product liability insurance for ingestible herbal products
- RN professional liability coverage for coaching; check whether the state requires a PLLC
- Trademark search on both brand names

### 5. Costs and margins
Every stream on the board shows ($) with no COGS. Teas especially: inventory, shipping,
and fulfillment time (the tea order ledger and shipping digest already exist in repo).
Add a margin column before scaling any physical product.

### 6. Owner column
Two brands x 4 platforms + 2 Skools + 2 websites + podcast + 2 books + app + brand deals
is roughly 3x the current workload, and Joel has ~15 min/week of slack (the Wednesday
Engine exists because of this). Every whiteboard item needs a name: Joel / Annie / AI /
hire / not-now. An item without a name is a not-now.

### 7. Book title
"The Blood Pressure industry scam" fights the brand canon (PRODUCT.md: calm,
credentialed, plain; never fear-mongering). Keep the book, keep the villain framing from
PHASE1_CANON ("the pill hides the number; the Triangle heals the loop"), soften the title.

---

## The scoreboard

One metric per brand, read weekly (Thursdays, with the Wednesday Engine review):

- **BraveWorks RN:** trailing-30d revenue per captured email (target $6.00)
- **Everyday Nurse (when live):** same metric, own list
- **Joint venture:** webinar registrants → replay-offer conversion, and net revenue after
  the split

Everything else is operations.
