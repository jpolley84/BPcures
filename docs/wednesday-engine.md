# The Wednesday Engine — one hour of Joel, a week of output

The Wednesday 7pm ET Skool call (BraveWorks RN, skool.com/braveworksrn) is the engine room of the
business. One recorded hour feeds four flywheels: content (clips + newsletter), proof (testimonials),
continuity (Skool), and ascension (case review + cohort, offered live and honestly). Joel spends
~15 minutes on top of the call itself; the AI instance does the rest on Thursday.

## Joel's weekly checklist (~15 min beyond the call)

**On the call (Wednesday, no extra time):**
1. Hit record before the call starts. Every week, no exceptions.
2. Testimonial ask, once per call: "If the kit or these calls moved your numbers or your habits,
   type it in the chat or say it now. I may share it (first name only) unless you tell me not to."
   Get a yes on the call or in DM before anything is reused.
3. Live offers, in this order, only what is true this week:
   - **Skool, always:** "If you are watching a replay or a clip of this, the Weekly Reset is $27/mo
     with a 7-day free trial at skool.com/braveworksrn/about. This call happens every Wednesday."
   - **Case review, only when slots remain:** check the daily digest's Case-Review SLA pane
     (cap 5/month). "I take five case reviews a month. X are left for [month]." If zero remain, say
     so and skip the pitch. Real capacity is the scarcity; never invent a deadline.
   - **Quarterly cohort, only when a real cohort with a real start date exists.** Otherwise silence.

**Thursday or Friday (~15 min):**
4. Upload/confirm the recording is where the AI can reach it (Skool recording link or file).
5. Review the AI's Thursday output: approve/kill each clip caption, skim the newsletter draft,
   approve any testimonial before it is used. Approve, do not rewrite; flag patterns instead.

## What the AI instance does each Thursday

1. **Transcript.** Pull the recording, transcribe (Whisper or captions).
2. **Clip selection (5 to 10 clips, 20 to 60 sec each).** Selection prompt criteria:
   - a complete thought with a hook in the first 2 seconds (a question, a myth, a surprising number)
   - one Triangle corner per clip (Stress, Sugar, or Sodium), never all three mushed together
   - member questions and Joel's plain answers outrank monologue
   - nothing clinical-promising, nothing naming a member without recorded permission
   - each clip gets: caption (4th-grade level, no em dashes), CTA "Take the free quiz at bpquiz.com"
     or the Skool trial link, and 3 to 5 hashtags per platform.
3. **Distribution.** Queue clips through the existing Postiz pipeline (`api/postiz-cron.js` posts
   daily at 8 AM CT from the content bank; add the week's clips to
   `services/config/social-content-bank.json` so TikTok/FB/IG fan-out uses them). One clip per day
   beats ten at once.
4. **Newsletter (one issue).** Draft from the transcript: subject = the best question of the night,
   body = the answer in Joel's voice (300 to 500 words), one clip embedded or linked, PS = the same
   live offers made on the call (Skool always; case review only if slots remain). Sends to the
   parked `state='newsletter'` list once the newsletter cron exists; until then Joel sends manually
   or it waits. Check Resend quota before any bulk send (overage is OFF).
5. **Testimonial capture.** Pull any chat/spoken testimonials from the transcript, draft a one-line
   permission DM for Joel to send, file approved ones (first name, "Results not typical").
6. **Compliance filter (run on every clip, caption, and the newsletter before Joel sees it):**
   - plant-based only: no caffeine, no animal products, no honey
   - no yoga, no meditation, no Eastern practice; "paced breathing," never box breathing
   - "alongside your doctor, never instead of" on anything protocol-adjacent
   - no health-outcome promises; guarantees are product-satisfaction only
   - no dosing advice for an individual; education only
   - honest numbers, no fake scarcity, no fake deadlines; capacity claims must match the digest
   - 4th-grade reading level, no em dashes, no hype
   - Christian framing welcome; testimonials only with permission + "Results not typical"

Anything that fails the filter is fixed or cut before Joel reviews. A short week (3 clips) that
passes beats a full week that does not.

## The one metric to read each week

**Trailing-30d revenue per captured email** (the Governing Metric pane at the top of the daily
digest). Target: **$6.00 per email.** Read it every Thursday when reviewing the AI output.
- Going up: the engine is working, keep feeding it.
- Flat or down: the list is growing faster than it is monetizing. Fix the ascension path (Skool
  invite, case review pipe, newsletter) before chasing more traffic.

Everything else in the digest is operations. This one number is the scoreboard.
