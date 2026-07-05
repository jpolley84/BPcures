# EMAIL SEQUENCES PAUSED — 2026-07-05 ~10:00 ET (Joel's call: app launch first)

All customer email sequence crons removed from vercel.json. Still running:
calendly-poll (SMS to Joel), postiz (social), reply-agent (Gmail drafts),
daily-digest (ops email to Joel). Purchase-delivery emails (stripe-webhook /
triangle-webhook) and the instant quiz-result email still send — contractual.
Newsletter cron was already gated OFF and is now also unscheduled.

TO RESUME: restore this cron block to vercel.json and redeploy:

```json
[
  {
    "path": "/api/tier-1-cron",
    "schedule": "45 12 * * *"
  },
  {
    "path": "/api/tier-2-cron",
    "schedule": "30 13 * * *"
  },
  {
    "path": "/api/tier-3-cron",
    "schedule": "45 13 * * *"
  },
  {
    "path": "/api/tier-4-cron",
    "schedule": "30 14 * * *"
  },
  {
    "path": "/api/triangle-lead-cron",
    "schedule": "0 15 * * *"
  },
  {
    "path": "/api/triangle-buyer-cron",
    "schedule": "30 15 * * *"
  },
  {
    "path": "/api/newsletter-cron",
    "schedule": "0 16 * * 2"
  }
]
```
