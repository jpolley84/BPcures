# Day 1 Homework webapp: Find Your Big Domino

Date: 2026-09-22. Cohort: The Change My Life Challenge, Sept 22 to 24, 2026 (12pm ET / 11am CT). Ship before Day 2 at 11am CT on 2026-09-23.

## Purpose

Turn the printed "Day 1 Homework: Find Your Big Domino" worksheet into a guided 20-minute web experience participants complete on their phone the night of Day 1. It ends with one answer they can type in tomorrow's chat: STRESS, SUGAR, SODIUM, HORMONE CHANGES / BIGGER PATTERN, or STILL LOOKING.

## Decisions (Joel, 2026-09-22)

1. Answers are private only. Nothing a participant types leaves their device. No login, no KV, no API.
2. Lives at `changemylifechallenge.com/day1` (also reachable at `bpquiz.com/day1`) as a static page in the bpquiz-site Vercel project.
3. One part per screen wizard, plus a shareable recap card at the end.
4. Part 4 opens bpquiz.com in a new tab; the participant picks their quiz result from a dropdown when they return.
5. Visual language matches the live `public/challenge-b/index.html` page.

## Files

- `public/day1/index.html`: markup for all screens, inline critical copy. Keep the worksheet wording verbatim; it is Joel's copy.
- `public/day1/day1.css`: tokens copied from challenge-b (`--navy #103a36`, `--teal #23675f`, `--gold #b78a39`, `--coral #c9513e`, `--soft #f2f5f3`, `--ink #182a27`, `--muted #536560`, `--line #d5e0da`), Georgia headings, Arial body, print stylesheet.
- `public/day1/day1.js`: vanilla JS, no build step. State, navigation, persistence, PostHog events, copy and print actions.
- `vercel.json`: add `day1/|day1$` to the SPA rewrite exclusion regex next to `challenge-b/|challenge-b$` so `/day1` never falls through to the React shell.

No changes to `middleware.js`, the SPA, or any API.

## Screens

Every screen shows a progress bar (step N of 8), the part title, and the worksheet's "About N minutes" label. Back and Next buttons are 44px tall. No field is required; Next on Part 5 shows a soft nudge if Big Domino is empty but still allows continuing.

| # | Screen | Inputs |
|---|---|---|
| 0 | Welcome | Intro copy through "Let's begin." Begin button. |
| 1 | Part 1: The number you've been carrying | Checkbox list (BP, weight, A1C, cholesterol, medication count, age, another number + text). "The number I keep thinking about is" text. "I'm afraid it means..." textarea. The prompts and the FEAR CAN TAKE ONE NUMBER line. |
| 2 | Part 2: Your Five Numbers | Accordion of 5 panels, one open at a time. Fear: 2 textareas + "The story I have been attaching" sentence. Health: "What I know" textarea, "What I don't know" textarea, two-column table Know / Telling-myself with add-row button (min 1 row each). Money: dollar field, cost checklist, "The cost I feel the most" text. Time: number + months/years toggle, "how long saying" text, two forward-look textareas. Life: checklist, "the thing I most want to be able to do" text, "something I still have NOT done" text. |
| 3 | Part 3: Look for the pattern | Four blocks (Stress, Sugar, Sodium, Hormone changes) each with the two questions and a "What I notice" textarea. Gut pick radio (5 options) + "I chose it because" text. |
| 4 | Part 4: Take the BP Triangle Quiz | Button "Open the quiz" (target _blank, `https://bpquiz.com`). Dropdown "My quiz result pointed me toward" (Stress, Sugar, Sodium, Hormone changes, I did not take it yet). "My gut pointed me toward" read-only, filled from screen 3. Yes/No/Somewhat radio. "What pattern keeps raising its hand?" textarea. |
| 5 | Part 5: Find your Big Domino | Radio: Stress, Sugar, Sodium, Hormone changes / bigger pattern, Still looking. Three clue fields. "Three clues. Not 76." |
| 6 | Part 6: Your Day 1 Unlock | "I want my health for..." (prefilled from screen 2 life answer, editable). "The first area I am willing to pay closer attention to is..." (prefilled from Big Domino, editable). Before tonight / Tonight I realized / And now I know textareas. Three "Things I know tonight" checkboxes. Feeling picker (6 options + something else text). |
| 7 | Recap card | Big Domino in large type, the three sentences, the feeling line, "Tomorrow we ask: who found a clue? Type your Big Domino in the chat." Buttons: Copy my Big Domino, Save as PDF, Start over. What happens next block (see Promises). Footer disclaimer verbatim. |

Quiz result and Big Domino values share one enum: `stress`, `sugar`, `sodium`, `hormones`, `unsure`.

## State and persistence

- One object `{ v: 1, step: n, answers: {...} }` in `localStorage` key `cmlc:day1:2026-09-22`.
- Saved on every `input` and `change` event, debounced 300ms.
- On load, if the key exists, resume at the saved step with fields filled.
- Start over: `confirm()` then delete the key and reload.
- If `localStorage` throws, keep state in memory and show a one-line notice: "Private mode: your answers will not survive a page reload."
- Nothing is ever POSTed. The only outbound calls are PostHog.

## Analytics

PostHog is loaded the same way as challenge-b. Events, none carrying free text:
- `day1_start` on Begin
- `day1_step` with `{ step }` on each Next
- `day1_complete` with `{ domino, quiz_result, agreement, feeling }` when the recap renders
- `day1_copy`, `day1_print`, `day1_quiz_open`

## Print and copy

- Save as PDF calls `window.print()`. Print stylesheet hides nav and buttons and prints the recap card first, then a full-answers appendix listing every filled field under its worksheet heading.
- Copy my Big Domino writes the uppercase label (for example `SODIUM`) to the clipboard and shows "Copied" for 2 seconds. Fallback: select the text in a hidden input.

## Promises from the Day 1 call

From the first 72 minutes of the 2026-09-22 Zoom transcript and the chat log (Joel skipped the rest on 2026-09-22 20:58). Each appears on the recap screen's "What happens next" block so the homework page and the call agree:

1. Day 2 is tomorrow, Wednesday September 23, 2026 at 12:00pm ET / 11:00am CT. Annie teaches hormones. "Hormones is day 2, don't miss it."
2. The recording of each day is posted in the Skool community.
3. Tomorrow opens with "Who found a clue?" Type your Big Domino in the chat.
4. VIP bonus day on fear is Sunday September 27, 2026 (VIP only; shown as one line, no upsell on this page).

Not on the page: the cookbook offer, tea, and MaxCalm mentions from the Q&A. Those are follow-up email items, not homework.

## Accessibility and mobile

- Works at 375px, no horizontal scroll, 16px side gutter.
- Labels tied to inputs, radio and checkbox groups in `fieldset` with `legend`.
- Color contrast AA on the cream background (use `--teal` and `--navy` for text, never `--gold` for body text).
- Progress announced via `aria-live="polite"` on step change.

## Verification

1. `vercel dev` or a Vite preview is not needed; open `public/day1/index.html` through the Vercel preview deploy (SSO protected, Joel opens) and through `bpquiz.com/day1` after production deploy.
2. Walk all 8 screens on desktop and at 375px with injected viewport CSS. Screenshot each.
3. Reload on screen 3 and confirm resume with answers intact.
4. Open the quiz button in a new tab, return, pick a result, confirm the gut pick auto-fills.
5. Copy button on the recap, paste into a text field.
6. Save as PDF, confirm the card prints first and the appendix follows.
7. Start over clears the key.
8. PostHog live events show `day1_start` and `day1_complete`.
9. Dispatch `live-page-verifier` on `https://changemylifechallenge.com/day1` after deploy.

## Out of scope

Server-side storage, cohort tally, drip segmentation, Day 2 and Day 3 homework (same shell can be reused later at `/day2`, `/day3`).
