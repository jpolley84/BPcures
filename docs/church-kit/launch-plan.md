# Launch Plan: Sell 5 Pilot Churches (INTERNAL, draft for Joel)

Goal: 5 paying pilot churches in 30 to 45 days, from audience and lists that already exist. Zero paid traffic. This is the Partnership channel (Priestley move 4 / market panel move 3; the FAITH trial validated church-delivered BP lifestyle programs).

---

## 1. What already exists (do not rebuild)

| Asset | Path (workspace root) | Use |
|---|---|---|
| Louisville church list (tiered, contacts, health-ministry notes) | `louisville-church-outreach-list.md` + `louisville-church-outreach.csv` | Direct outreach targets. Tier 1 already flags churches with active senior/health ministries (St. Stephen Baptist, St. Albert "Aces" 300+ senior club, Southeast Christian, etc.) |
| Outreach email template (free "Know Your Numbers" talk) | `church-outreach-email-template.md` | Rewrite the ask from "free 30-min talk" to "pilot the 6-week kit." Keep the voice; it is already compliant and warm |
| Printed flyer | `Joel_Polley_Church_Outreach_Flyer.pdf` | Leave as is for the free-talk path; the free talk becomes the front door to the kit |
| Audience | FB ~249K, Skool "How To Be Your Own Doctor" ~1,200 members | One post each (drafts below) |

## 2. The pilot offer (honest capacity, not fake scarcity)

- **Pilot terms:** first 5 churches get the Partner Kit (normally $497) at $297, live Zoom Q&A included, in exchange for: attendance counts, permission to use anonymized results and one facilitator testimonial. The cap of 5 is real: each pilot costs Joel ~1 hour of live Zoom plus setup, and he is one operator. State it exactly that way. Never restate the cap after it stops being true.
- After 5 pilots: $297 Core / $497 Partner, per the one-pager.

## 3. Two channels, one week

**Channel A: one post (FB page + Skool, same copy adapted).** Needs Joel approval before posting (hard line: no public posting without sign-off). Draft:

> Church folks, I need your help. I built a 6-week blood pressure program a health ministry can run itself. Leader guide, weekly sessions, member workbooks, and your church gets its own 90-second BP quiz link. I am piloting it with 5 churches and I will personally join each one on Zoom for a live Q&A. If your church has a health ministry, a parish nurse, or a seniors group, comment CHURCH or email brave.works.marketing@gmail.com with subject "Church Kit." (Everything I teach works alongside your doctor, never instead of.)

- Comment keyword CHURCH: handle manually or via ManyChat IF a new flow is approved (ManyChat key is read/trigger only, no flow CRUD; likely manual replies at this volume).

**Channel B: direct email to the Louisville list.** Adapt `church-outreach-email-template.md`: lead with the free 30-minute "Know Your Numbers" talk (already the template's ask, low friction), and add one paragraph offering the 6-week kit as the follow-on ("if your ministry wants more than one afternoon, I built a 6-week program your team can run"). Send individually from Joel's account, 5 to 10 per week, personalized per the template's customization notes. These are real people: NOT bulk Resend, no campaign machinery, and each send is Joel pressing send himself.

## 4. Prerequisites before first sale (Joel decisions flagged)

1. **Build the actual PDFs** from `offer-one-pager.md` and `facilitator-guide-outline.md` (guide, session plans, workbook masters). Biggest lift, ~M effort. Reuse existing $17-kit assets where they fit (BP tracker, doctor sheet, paced breathing card, meal/recipe pages) after a NEWSTART compliance grep including animal-product terms.
2. **Payment:** two Stripe payment links ($297 kit, $497 partner). Stripe writes require Joel's approval; do NOT reuse the $297 case-review link (different product, avoid another metadata-only $297 collision). Alternative for pilots: plain Stripe invoice per church, zero new links.
3. **Church quiz codes:** none needed in code. `bpquiz.com/quiz?utm_source=church-<code>` works today; PostHog already captures utm_source. Assign one slug per church (e.g. `church-ststephen`). Known caveat: exit_intent pollutes utm_source, so count by unique slug, not totals.
4. **Reply inbox:** use brave.works.marketing@gmail.com (concierge@bpquiz.com is unverified; do not print it).

## 5. Fulfillment checklist (per church, after payment)

1. Assign church code, record it (church, contact, code, date) in a simple tracker in repo `memory/`.
2. Send welcome email: kit PDFs attached or linked, their quiz link, suggested start date.
3. Partner tier: book the Zoom Q&A (Calendly), ideally Week 2 to 5 of their run. Record the first Q&A (with permission) so future churches can get the recording option (Who Not How).
4. Check-in email at their Week 3: "how is it going, what is confusing" (product feedback).
5. Week 6: request the pilot deliverables (counts, testimonial, permissioned stories).

**Joel-hours per church:** ~1 hr live Zoom (Partner/pilot only) + ~15 min setup + ~15 min check-ins. Ceiling ~1.5 hrs. Five pilots ≈ 7.5 hrs total, schedulable around Sabbath (no Friday-evening or Saturday sessions).

## 6. Proof to collect (the pilot's real product)

- Quiz takes per church code (PostHog, utm_source=church-<slug>) and downstream $17 purchases per code
- Attendance Week 1 vs Week 6 (completion rate)
- Before/after quiz corner results, anonymized, with written permission
- 1 facilitator testimonial + 1 member story per church (written permission, "results not typical" attached to any number)
- Photos of a session if the church allows
- What broke: facilitator questions, confusing pages, timing overruns (feeds v2 of the guide)

**Success bar for scaling past 5:** at least 3 of 5 churches finish Week 6, and at least 10 quiz takes per church. If met, raise to full pricing and extend outreach beyond Louisville (the list format is replicable per city).

## 7. Expected math (honest, small numbers)

5 pilots × $297 = $1,485 direct. Each church plausibly 10 to 30 quiz takers at existing ~1.8% buy rate: small direct revenue, but each church is a standing distribution partner at $0 CAC, and the proof pack is what sells churches 6 through 20 at $297 to $497.
