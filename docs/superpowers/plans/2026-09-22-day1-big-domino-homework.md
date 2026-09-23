# Day 1 Big Domino Homework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `changemylifechallenge.com/day1`, a private, guided 8-screen version of the Day 1 "Find Your Big Domino" worksheet with a shareable recap card.

**Architecture:** Three static files under `public/day1/` in the bpquiz-site Vercel project (HTML, CSS, vanilla JS). State lives in `localStorage`; no API, no build step. One `vercel.json` regex edit keeps `/day1` out of the SPA rewrite.

**Tech Stack:** Plain HTML/CSS/JS, PostHog snippet (copied from `public/masterclass/index.html:843-844`), Vercel static hosting.

Spec: `docs/superpowers/specs/2026-09-22-day1-big-domino-homework-design.md`.

## Global Constraints

- Worksheet copy is Joel's; keep wording verbatim, including trademark marks (Big Domino™, Five Numbers™, Blood Pressure Triangle™).
- No answer text ever leaves the device. PostHog events carry only enum values.
- Design tokens from `public/challenge-b/index.html`: `--navy #103a36`, `--teal #23675f`, `--gold #b78a39`, `--coral #c9513e`, `--soft #f2f5f3`, `--ink #182a27`, `--muted #536560`, `--line #d5e0da`, `--teal-soft #e7f0e9`, `--gold-soft #f8ecd2`. Headings Georgia, body Arial.
- Works at 375px wide, 44px tap targets, no horizontal scroll.
- Storage key `cmlc:day1:2026-09-22`. Enum for domino and quiz result: `stress | sugar | sodium | hormones | unsure`.
- Dates on page: Day 2 is Wednesday September 23, 2026, 12:00pm ET / 11:00am CT. VIP bonus day Sunday September 27, 2026.
- Do not push to BPCures master. Commit locally; Joel pushes (or deploys via `vercel --prod` from this dir if he says go).

---

### Task 1: Routing and page shell

**Files:**
- Modify: `vercel.json:50` (rewrite exclusion regex)
- Create: `public/day1/index.html`
- Create: `public/day1/day1.css`

**Produces:** a page at `/day1/` with head meta, PostHog snippet, a `<main id="app">` containing eight `<section class="screen" data-step="0..7">` elements, a `<header>` with progress bar `#progress` and `#stepLabel`, and a footer disclaimer. Only step 0 visible (others `hidden`).

- [ ] **Step 1: Edit the rewrite exclusion**

In `vercel.json` line 50 change `challenge-b/|challenge-b$|` to `challenge-b/|challenge-b$|day1/|day1$|`.

- [ ] **Step 2: Write `index.html`** with the full worksheet copy laid into the eight screens per the spec table. Form controls named per this map (JS reads these `name` attributes):

| Screen | Names |
|---|---|
| 1 | `p1_numbers[]` (checkboxes: bp, weight, a1c, cholesterol, meds, age, other), `p1_other`, `p1_number`, `p1_fear` |
| 2 | `fear_worst`, `fear_reminds`, `fear_story`, `health_know`, `health_unknown`, `health_rows` (JSON of `[{know, story}]` built from `.kv-row` inputs), `money_amount`, `money_costs[]`, `money_other`, `money_most`, `time_amount`, `time_unit` (months/years), `time_saying`, `time_concern`, `time_lose`, `life_wants[]`, `life_other`, `life_capacity`, `life_notdone` |
| 3 | `tri_stress`, `tri_sugar`, `tri_sodium`, `tri_hormones`, `gut` (radio enum), `gut_why` |
| 4 | `quiz_result` (select enum + `notyet`), `agreement` (yes/no/somewhat), `pattern` |
| 5 | `domino` (radio enum), `clue1`, `clue2`, `clue3` |
| 6 | `unlock_for`, `unlock_area`, `before`, `tonight`, `now`, `know1`, `know2`, `know3` (checkboxes), `feeling` (radio: clearer, relieved, hopeful, lessafraid, somewhere, questions, other), `feeling_other` |

- [ ] **Step 3: Write `day1.css`** with tokens, `.screen`, `.progress`, `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.choice` (checkbox/radio rows, 44px min height), `.kv-table`, `.accordion`, `.recap`, `.nudge`, and `@media print` that shows only `#recapCard` and `#printAppendix`.

- [ ] **Step 4: Verify** by opening `public/day1/index.html` from a local static server (`npx serve public -l 5173` from bpquiz-site) at `http://localhost:5173/day1/`. Expected: welcome screen renders with progress bar, no console errors.

- [ ] **Step 5: Commit** `git add vercel.json public/day1 && git commit -m "day1: page shell and worksheet copy"`.

### Task 2: Wizard logic and persistence

**Files:**
- Create: `public/day1/day1.js`
- Modify: `public/day1/index.html` (add `<script src="/day1/day1.js" defer>`)

**Produces:** `window.Day1` with `go(step)`, `save()`, `load()`, `reset()`, `collect()` returning the answers object.

- [ ] **Step 1: Implement** step navigation (`[data-next]`, `[data-back]` buttons), progress width `step/7*100%`, `aria-live` label "Step N of 8 · Part X · About N minutes", accordion for screen 2 (one panel open, "Next number" advances), `.kv-table` add-row, auto-fill of `gut` into screen 4 read-only field and of `life_capacity` into `unlock_for` and `domino` label into `unlock_area` (only when those are empty), soft nudge on screen 5 when `domino` is empty (`.nudge` shown once, Next still works on second click).

- [ ] **Step 2: Implement** persistence: `collect()` walks all named controls, `save()` writes `{v:1, step, answers}` debounced 300ms on `input`/`change`, `load()` restores on DOMContentLoaded and calls `go(step)`. Wrap every storage call in try/catch; on failure set `memoryOnly=true` and show `#storageNotice`.

- [ ] **Step 3: Implement** reset: `confirm('Start over? This erases tonight\'s answers on this device.')` then remove key and `location.reload()`.

- [ ] **Step 4: Verify** in the browser: fill screen 1 and 2, reload, land on the same screen with answers intact. Run `localStorage.getItem('cmlc:day1:2026-09-22')` in console and confirm JSON.

- [ ] **Step 5: Commit** `git commit -am "day1: wizard navigation and localStorage persistence"`.

### Task 3: Recap card, copy, print, analytics

**Files:**
- Modify: `public/day1/day1.js`, `public/day1/index.html`, `public/day1/day1.css`

- [ ] **Step 1: Render recap** on entering step 7: `#recapDomino` = label map `{stress:'STRESS', sugar:'SUGAR', sodium:'SODIUM', hormones:'HORMONE CHANGES / BIGGER PATTERN', unsure:'STILL LOOKING'}` (empty domino renders STILL LOOKING), three sentences, feeling line, "What happens next" block (Day 2 Wed Sept 23 12pm ET / 11am CT, Annie on hormones; recordings in the Skool community; type your Big Domino in the chat; VIP bonus day Sunday Sept 27). Build `#printAppendix` from `collect()` with worksheet headings, skipping empty fields.

- [ ] **Step 2: Copy button** writes the label via `navigator.clipboard.writeText`, fallback to a hidden textarea + `document.execCommand('copy')`, button text "Copied" for 2s.

- [ ] **Step 3: Print button** calls `window.print()`.

- [ ] **Step 4: PostHog** helper `track(name, props)` guarded by `window.posthog`; fire `day1_start` (Begin), `day1_step {step}`, `day1_complete {domino, quiz_result, agreement, feeling}`, `day1_copy`, `day1_print`, `day1_quiz_open`.

- [ ] **Step 5: Verify** copy pastes `SODIUM`, print preview shows card then appendix, PostHog network request visible in devtools.

- [ ] **Step 6: Commit** `git commit -am "day1: recap card, copy, print, PostHog events"`.

### Task 4: Full walkthrough and mobile pass

- [ ] **Step 1:** Walk all 8 screens desktop, screenshot each.
- [ ] **Step 2:** Inject `body{max-width:375px;margin:0 auto}` and walk again; confirm no horizontal scroll (`document.documentElement.scrollWidth <= 375`).
- [ ] **Step 3:** Fix anything found, commit.
- [ ] **Step 4:** Report to Joel with screenshots and the exact deploy command (`vercel --prod` from `bpquiz-site`), which he runs or approves.
