# BraveWorksRN App Waitlist — Email Sequence

*Authored 2026-07-05 per the Corey Haines `emails` skill (marketingskills). Voice: Joel,
4th-grade plain, no health claims, AND-not-INSTEAD-OF framing. No em dashes in body copy.*

## Sequence Overview

```
Sequence Name: App Waitlist Pre-Launch
Trigger: signup at bpquiz.com/waitlist (POST /api/app-waitlist)
Goal: keep the list warm until launch; convert to App Store install on launch day
Length: 5 emails (1 automated + 4 sent via /send-campaign)
Timing: instant → day 2 → day 5 → launch day → launch +3
Exit Conditions: reply "remove" (Email 0 offer), unsubscribe link on campaign
  sends, or launch +3 sent (sequence complete)
Segment source: KV set `waitlist:app:members` (records at `waitlist:app:<email>`).
  Mirrored into Resend audience "BraveWorksRN App Waitlist"
  (id bf8e34e2-3656-4bf8-8916-41d95ac39f40, env RESEND_APP_WAITLIST_AUDIENCE_ID),
  so launch emails can also go out as a Resend Broadcast against that audience.
```

**Sending mechanics.** Email 0 is transactional and fires automatically from
`api/app-waitlist.js`. Emails 1, 2, L, L+3 are marketing sends: run them through
**/send-campaign** (mandatory dry-run + Joel approval, unsubscribe + postal footer
handled there). No cron was wired on purpose: launch date is unknown, list is young,
and a rigid drip could fire the wrong email at the wrong time. When volume justifies
automation, promote 1 and 2 into a small cron on the state-machine pattern.

**Core principles applied:** one email one job · value before ask · fewer better
emails · every email moves them one step.

---

## Email 0 — Confirmation (IMPLEMENTED, automatic)

```
Send: instantly on signup (api/app-waitlist.js)
Subject: You're #{position} in line for the BraveWorksRN app
Job: confirm + set expectations + one useful next step (quiz)
CTA: Take the quiz → bpquiz.com/quiz
```

Copy lives in `api/app-waitlist.js` (`confirmationEmail`). Position number is real,
from the KV counter. Reply-to goes to braveworksrn@gmail.com.

---

## Email 1 — Story / Why (Day 2)

```
Send: ~2 days after signup (via /send-campaign)
Subject: Why I built an app that can't talk to me
Preview: No account. No cloud. Your readings stay in your pocket.
Job: build trust with the privacy story; zero ask
CTA (soft): reply with the one thing you want the app to do
```

Hi {firstName|friend},

Quick story about the app you're waiting on.

Every health app I've ever downloaded wanted three things before I logged a single
number. My email. An account. A subscription.

So when we built the BraveWorksRN app, I made one rule: **the app never phones home.**

No account. No cloud. No password to forget. Your readings live on your phone and
nowhere else. There's even a "Clear my data" button in Settings that wipes everything,
because your blood pressure history is yours, not mine.

That's also why the app can't email you. It literally has no idea who you are.

This list is the only way I can reach you about it. So here's my one question while we
wait on Apple: **what's the one thing you want a BP app to do for you?** Hit reply and
tell me. I read every answer, and the best ones shape version 2.

Talk soon,
Joel Polley, RN

---

## Email 2 — Feature Spotlight: the Doctor Report (Day 5)

```
Send: ~5 days after signup (via /send-campaign)
Subject: The one page your doctor actually wants to see
Preview: Not your phone. Not a notebook. One clean page.
Job: sell the standout feature; bridge to the quiz for non-takers
CTA: Take the 2-minute BP quiz → bpquiz.com/quiz
```

Hi {firstName|friend},

Twenty years in the ICU taught me something about doctor visits:

The patients who get taken seriously walk in with **numbers on paper.**

Not "it's been running high lately." Not scrolling through a notes app while the
doctor waits. A page. Dates, readings, pattern. Doctors are trained to read data,
and when you hand it over, the whole conversation changes. You stop being a
complaint and become a chart.

That's the feature I'm proudest of in the BraveWorksRN app. You log your readings as you
go. Before your appointment, you tap **Doctor Report** and the app builds a clean
one-page PDF: your readings, your trend, ready to print, email, or AirDrop.

One tap. One page. A better appointment.

While you wait for launch: if you haven't taken the BP quiz yet, do that this week.
It shows you which of the Three Pressures is loudest for you, and that's exactly the
conversation to have with your doctor when you bring your first report.

[Take the 2-minute quiz] → https://bpquiz.com/quiz

Joel Polley, RN

---

## Email L — Launch Day (send the day the app is live)

```
Send: launch day (via /send-campaign, Joel triggers)
Subject: It's live. The BraveWorksRN app is on the App Store
Preview: You waited in line. The doors just opened.
Job: convert the waitlist to installs. One CTA, no detours.
CTA: Get the BraveWorksRN app → {APP_STORE_URL}
```

{firstName|Friend}, it's live.

The BraveWorksRN app is on the App Store right now.

{PRICING_LINE — fill at launch. Waitlist promise: they hear the price first.
Examples: "It's {PRICE}, and waitlist members are seeing that before anyone
else." / "It's {PRICE} for everyone, {WAITLIST_PRICE} for you through Friday."}

[Get the BraveWorksRN app] → {APP_STORE_URL}

Three things to do in your first five minutes:

1. **Log today's reading.** Two taps. That's your baseline.
2. **Set your rhythm.** Same time every morning beats perfect and random.
3. **Peek at the Doctor Report button.** In a few weeks of readings, that one tap
   will be worth the wait.

You were #{position} in line, and you're getting this before I post it anywhere
public. Thank you for waiting with me.

One favor: if the app helps you, leave it a rating. Ratings decide whether other
people ever find it.

Joel Polley, RN

---

## Email L+3 — Launch Reminder (non-installers / non-openers)

```
Send: launch +3 days (via /send-campaign; segment: no click on Email L if
  tracking allows, else full list minus repliers)
Subject: Still holding your spot
Preview: Two taps tonight. That's the whole start.
Job: catch the busy ones. Short.
CTA: Get the BraveWorksRN app → {APP_STORE_URL}
```

Hi {firstName|friend},

Life gets loud, so one nudge and I'll hush.

The BraveWorksRN app is out on the App Store. No account needed. Tonight,
before bed: grab it, log one reading. Two taps. That's the whole start.

[Get the BraveWorksRN app] → {APP_STORE_URL}

Joel Polley, RN

---

## Metrics Plan

| Email | Watch | Healthy sign |
|---|---|---|
| 0 Confirm | delivery rate | > 98% delivered (transactional) |
| 1 Story | open rate, replies | 50%+ opens (warm list), any replies = gold, feed v2 |
| 2 Doctor Report | quiz clickthrough | 5-10% CTR to /quiz |
| L Launch | CTR to App Store | 30%+ CTR on a true waitlist |
| L+3 Reminder | incremental installs | +20-30% over Email L alone |

Page-side funnel is instrumented in PostHog: `waitlist_viewed` → `waitlist_joined`
(with real position). Compare against installs on launch week.
