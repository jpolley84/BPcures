# Period B revenue collapse (2026-06-24 → 06-28) — diagnosis

**Date:** 2026-07-03 · **Author:** diagnosis agent (read-only) · **Sources:** PostHog project 467819 (HogQL, tz America/Chicago), Stripe live API (charges + checkout sessions, UTC days), Resend send log (14,000 emails paginated back to 06-14), Vercel deployment history (project `bpquiz`), git history (BPcures repo).

## Verdict in one line

**No funnel step broke and no code change caused it.** The site did not change during the collapse (zero production deploys 06-21 10:23 UTC → 06-28 05:01 UTC, and the 06-28 deploy was markdown-only). The drop is the sum of four independent, mostly external factors: the recurring **month-end wallet trough** in a fixed-income 55+ audience, the **Barbara O'Neill event (06-24/25)** absorbing the audience's attention and dollars (promoted by Joel's own 1,617-recipient blast on 06-23 and a top-of-homepage ticket banner), the **unidentified "store" checkout integration going silent after 06-22**, and the **Sabbath gate landing on the single biggest traffic day of the month (06-27, 627 visitors, $0)**.

Also: **the "traffic rose" premise is a windowing artifact.** Period A's 252/day average is dragged down by a weak early June. Compare adjacent weeks: 06-15→06-23 ran **460 visitors/day**; period B ran **410/day** (and 627 of those landed on a Sabbath-closed store). Traffic actually fell ~11% week-over-week. There was never a "more traffic, less money" paradox to explain.

## Timeline table

PostHog days = America/Chicago; Stripe days = UTC (few-hour skew). "Sessions" = Stripe checkout sessions; `api` = homepage buy button (api/checkout.js, metadata `homepage_variant`), `plink` = payment-link opens (quiz result CTAs + drip emails + /shop). "Charges" split funnel vs the unidentified store integration (`cart_id`/`store_id` metadata).

| Day | Visitors | Quiz starts | Leads | CTA clicks | Sessions api/plink | Paid api/plink | Charges (funnel+store) | Gross $ |
|---|---|---|---|---|---|---|---|---|
| 06-15 | 546 | 100 | 66 | 22 | 12 / 26 | 4 / 2 | 6+2 | 131 |
| 06-16 | 507 | 104 | 69 | 23 | 18 / 31 | 4 / 7 | 13+1 | 251 |
| 06-17 | 497 | 93 | 58 | 18 | 9 / 19 | 2 / 4 | 6+0 | 102 |
| 06-18 | 366 | 89 | 51 | 17 | 12 / 34 | 2 / 4 | 6+1 | 119 |
| 06-19 | 271 | 43 | 28 | 14 | 19 / 27 | 6 / 1 | 7+0 | 119 |
| 06-20 Sabbath | 463 | 13 | 12 | 4 | 0 / 12 | 0 / 0 | 0 | 0 |
| 06-21 | 528 | 90 | 54 | 17 | 22 / 45 | 6 / 2 | 8+2 | 165 |
| 06-22 ⚠ | 596 | 110 | 74 | 34 | 33 / 62 | 2 / 2 | 4+1 | 85 |
| 06-23 blast | 363 | 62 | 39 | 13 | 14 / 27 | 2 / 3 | 6+0 | 182 |
| **06-24 EVENT** | 249 | 51 | 27 | 12 | 6 / 21 | 1 / 1 | 2+0 | **34** |
| **06-25 EVENT** | 414 | 96 | 55 | 19 | 10 / 15 | 1 / 1 | 2+0 | **34** |
| 06-26 | 473 | 78 | 48 | 16 | 17 / 33 | 1 / 4 | 5+0 | 85 |
| 06-27 Sabbath | **627** | 16 | 12 | 3 | 3 / 28 | 0 / 0 | 0 | 0 |
| 06-28 | 285 | 56 | 29 | 14 | 8 / 35 | 0 / 3 | 3+0 | 51 |

Notes: 06-23's $182 includes the only $97 sale of the window. ⚠ 06-22 is a one-day anomaly: sessions created doubled (96) while paid fell to 4 — consistent with a low-intent traffic spike (596 visitors) plus possible link-scanner noise; it precedes period B and was already sub-normal.

## Which step "broke"

Ratios, non-Sabbath days, late-A (06-15→06-23) vs B (06-24→06-28):

| Step | Late A | Period B | Moved? |
|---|---|---|---|
| Visitor → quiz start | 18.8% | 19.8% | No |
| Visitor → lead | 11.9% | 11.2% | No |
| Visitor → CTA click | 4.3% | 4.3% | No |
| Stripe sessions created/day | ~44 | ~34 | Mildly down (tracks traffic) |
| **Session → paid** | **15–21%** | **6–10%** | **Halved** |
| Funnel charges/day | 7.0 | 3.0 | Halved |

People took the quiz, gave their email, clicked buy, and landed on Stripe's hosted checkout at normal rates — then stopped entering their card. That is a wallet/attention signature, not a broken-wiring signature. Confirmed non-causes: no failed-charge spike (payments processed fine), Resend never stalled (~600–740 drip emails/day throughout), the homepage A/B flag never activated (every session metadata = `control`), quiz routing unchanged since 06-12, no deploy in the window.

## Attribution of the ~$67/day gap ($108 → $41)

Rough, overlapping, small-N (12 funnel charges in B) — directional weights:

1. **Month-end trough (~$25–30/day, recurring).** Late May shows the same sag: May 22–31 ran 5.7 charges/day vs 10.4/day May 1–21 (-45%), and June 1–3 was equally soft. The 55+ fixed-income audience is simply broke the last week of the month. Period B sits exactly in that week.
2. **Barbara O'Neill event diversion (~$15/day averaged, concentrated on 06-24/25).** 06-23: 2,425 emails sent, of which 1,617 = "Barbara O'Neill is here — tomorrow" pointing the entire list at the event; the homepage's first element was a "Tickets going fast" banner until its date gate closed 06-26 04:00 UTC. The two event days are the two deepest days ($34 each, 2 paid sessions/day vs ~6 expected); 06-26 (banner gone, event over) bounced back to 5 charges.
3. **Store integration silent after 06-22 (~$15–20/day).** The unidentified hosted-storefront checkout (`cart_id`/`store_id` ULIDs on the shared Stripe account) contributed ~1.2 × $17/day through 06-22, then zero. Platform still unidentified.
4. **Back-end lumpiness (~$10–15/day).** Late A included one $97, one $30, and $12.99 OTOs; B had none. With back-end take at ~0.3–4%, single sales swing the daily average.
5. **Sabbath collision.** 06-27 was the month's biggest traffic day (627 visitors, 31 sessions still got created) with the store closed — by design, but it deepens B's 5-day average.

## Commit/change most likely responsible

**None.** Vercel history: production deploys were 2ec7cfc (06-21 10:23 UTC, mid-page quiz CTA — 06-21/22/23 still converted normally afterward) and 8e0a7aa (06-28 05:01 UTC, markdown content only, deployed with a dirty tree via CLI). Nothing shipped on or before 06-24 that touched checkout. The known quiz Stress/Sugar routing bug predates B (since ≤06-12) and did not change; in fact its "retired" legacy links (Blood Sugar Cures, Cortisol Healing Blueprint, BP Cures 10-Day Reset — all $17) are still active and carried 39 of the ~60 paid sessions in the window.

**Confidence: high** that no deploy/code change caused it (deployment history is definitive). **Medium** on the exact weight split between month-end vs event vs store (small N, overlapping days).

## Is a fix still needed today?

The period-B drivers were transient (event over, month rolls over) — **no code fix reverses period B.** But post-revert data (07-01→07-03: ~$34/day on ~180 visitors/day) shows today's real problems:

1. **Traffic, not conversion, is today's fire.** Visitors fell from ~410–460/day (late June) to ~180/day (monolith 117 + residual bwbp ~64 on 07-02). Investigate posting cadence/FB reach and DNS/domain state after the cutover.
2. **Take the retired braveworks-bp deployment dark.** Still live, still capturing events, and it converted a purchase on 07-02 — it leaks revenue and pollutes every funnel metric.
3. **Identify the "store" platform** (Stripe metadata `store_01KMDAKJZB6N0ZDEJSXWDBRNBN`). It was ~$450/mo and stopped silently 06-22. Either revive it deliberately or retire it knowingly.
4. **Calendar rule going forward:** expect the last-week-of-month trough (visible in May AND June); never schedule cross-venture event blasts, funnel cutovers, or A/B evaluations in that week. The bwbp rebuild's "$0 for 2 days" verdict (06-29/30) was itself measured inside the month-end trough + post-event hangover — its failure is real (0 purchases from 100 leads) but the depth was exaggerated by the same seasonality diagnosed here.
