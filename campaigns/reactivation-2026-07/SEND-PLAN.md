# SEND-PLAN — Dead-List Reactivation, July 2026

**Status: DRAFT. Nothing sends until Joel approves a /send-campaign dry run. No exceptions.**

Campaign: 5-email honest re-introduction arc (`email-1.md` … `email-5.md` in this folder).
Sender: `Joel Polley, RN <joel@bpquiz.com>`, reply-to `braveworksrn@gmail.com` (matches both live machines).

---

## 0. Pre-flight checks (run BEFORE tranche 1, and the quota check before EVERY send day)

1. **Resend quota check (FIRST, every send day).** Open the Resend dashboard Usage page for the account and read month-to-date sends vs the plan cap. Quota was at 47-80% in June and **overage is OFF**, which means hitting the cap silently blocks ALL mail, including $17 kit delivery emails and legacy drip sends. Rule: today's planned campaign volume must fit inside (monthly cap minus month-to-date sent) while leaving a reserve of at least 20% of the cap for transactional and cron mail. If the rule fails, shrink or delay the tranche. Never borrow from the reserve.
2. **Weekly-letter dependency (BLOCKER).** Email 1 promises "one idea, once a week, starts now." `newsletter-cron.js` exists but is NOT scheduled. Before tranche 1 goes out, either (a) schedule the weekly newsletter for post-arc recipients, or (b) Joel commits to a manual weekly send. Do not send an apology for going silent and then go silent again.
3. **Unsubscribe wiring.** Campaign footer unsubscribe must suppress the address in BOTH stores (`drip:*` via api/unsubscribe.js logic AND `bwbp:drip:*` via triangle-unsubscribe logic). Today each endpoint only touches its own store. The send tooling must write both flags. Verify this before tranche 1 (CAN-SPAM).
4. **Footer fields.** `{{BUSINESS_POSTAL_ADDRESS}}` comes from env, no fallback, never hardcoded. `{{UNSUBSCRIBE_URL}}` per recipient.
5. **Link check.** https://bpquiz.com/quiz and https://bpquiz.com/pay?tier=corner&corner=stress load and charge $17; Skool about page loads. UTM params may be appended at send time (`utm_campaign=reactivation-2026-07&utm_content=email-N`) but paths stay exactly as written in the emails.

## 1. Audience and segment order

Pull fresh counts at send time. Estimates from the 2026-07-03 legacy map:

| Order | Segment | Definition | Est. size |
|---|---|---|---|
| A | Parked newsletter | `drip:*` with `state='newsletter'` (finished the 21-day arc, then silence) | ~3,590 |
| B | Stalled legacy leads | `drip:*` `state='lead'` AND day since `stateEnteredAt` >= 24 (21-day arc plus the 3-day catch-up window is over) | pull count |
| C | Stalled triangle leads | `bwbp:drip:*` `state='lead'` AND day >= 9 (triangle lead arc ends day 6) | pull count |

Fill tranches in A then B then C order. Segment A goes first: they explicitly finished the arc and are the warmest of the cold.

## 2. Suppression rules (evaluated per address, against BOTH stores, at EVERY send, not just tranche start)

Skip an address if ANY of these is true:

1. Unsubscribed in `drip:*` OR in `bwbp:drip:*` (unsubscribe does not cross machines today, so check both by hand).
2. Buyer anywhere: `drip:*` state in tier-1 / tier-2 / tier-3 / tier-4, OR `bwbp:drip:*` state = 'buyer'. Email 4 sells a kit they may already own.
3. In an active arc: `drip:*` 'lead' with day < 24, or `bwbp:drip:*` 'lead' with day < 9 (they are still being mailed by a live cron; do not double-mail).
4. Hard-bounce or complaint flag on the record, if present.
5. Already tagged into this campaign by an earlier tranche (idempotency, see section 4).
6. **Mid-arc conversion:** if a recipient buys during the arc (their `bwbp:drip:*` flips to 'buyer'), drop them from all remaining campaign emails. The buyer drip takes over. Re-check before each send day.

Dedupe by lowercase email across segments; the segment-A record wins.

## 3. Tranche schedule and cadence

Four weekly tranches of ~1,000, starting on successive Mondays. Per-recipient cadence within a tranche:

| Email | Recipient day | Weekday | Time |
|---|---|---|---|
| 1 (apology) | Day 0 | Monday | 9:00 AM ET |
| 2 (stress teach) | Day 3 | Thursday | 9:00 AM ET |
| 3 (Michael + Maureen) | Day 7 | Monday | 9:00 AM ET |
| 4 (the $17 offer) | Day 10 | Thursday | 9:00 AM ET |
| 5 (the fork) | Day 14 | Monday | 9:00 AM ET |

- Tranche N starts Monday of week N. Peak overlap: Mondays carry up to 3 tranches (~3,000 sends), Thursdays up to 2 (~2,000). Both must pass the section-0 quota rule that morning.
- **No sends between Friday sundown and Saturday sundown** (none are scheduled under this cadence; keep the rule anyway if dates shift).
- If segments A+B+C exceed ~4,000, the overflow becomes tranche 5, only after a fresh quota check and Joel's explicit OK.
- Total volume: ~4,000-4,600 recipients x up to 5 emails ≈ 20,000-23,000 sends across ~6 weeks, spanning two Resend billing months. Recheck quota at the month boundary.

## 4. Idempotency tagging

On a recipient's first campaign send, stamp their record (e.g. `reactivation_2026_07 = { tranche, day0 }`). Every other broadcast or new cron must exclude tagged addresses until their Day 14 send + 7 days. Re-running a tranche must be a no-op for already-tagged addresses.

## 5. Mandatory dry-run gate

Every tranche goes through the **/send-campaign** skill, which enforces:

1. Segment pull with live counts and a sample of actual recipient addresses.
2. Fully rendered previews of all 5 emails (footer, unsubscribe, postal address included).
3. **Dry-run sent to Joel's own test address(es), full arc, before tranche 1.**
4. Joel's explicit written approval per tranche. Any copy change re-triggers the dry run.

No direct Resend API sends outside the skill. This plan is the input to that skill, not a license to send.

## 6. Monitoring and stop rules

After each send day, read Resend bounce / complaint / unsubscribe numbers for the campaign tag:

- Complaint rate > 0.1% on any email → PAUSE campaign, review with Joel.
- Hard bounces > 5% on a tranche → PAUSE; the list is stale after months of silence, expect segment A to be the worst. Consider verifying the remainder before continuing.
- Unsubscribes > 3% on any single email → PAUSE and revisit copy before the next tranche.

Success metrics (PostHog + Stripe): clicks to /quiz, quiz completions, $17 purchases with `utm_campaign=reactivation-2026-07`, and net list health (unsubs are fine; silence was worse).

## 7. Copy invariants (do not edit these out during revisions)

- 4th-grade reading level, no em dashes, no hype, no fake scarcity or deadlines.
- "Alongside your doctor, never instead of" in every email.
- Feel-It-or-Free is a product-satisfaction guarantee only, never a health-outcome promise.
- Testimonials: ONLY Michael T. and Maureen K. on-record quotes, always with "Results not typical."
- Paced breathing only (never box breathing or meditation). Plant-based only. Christian framing welcome.
- $17 stated plainly with no compare-at price and no sale window. /case-review and the $297 offer are NOT in this arc.
