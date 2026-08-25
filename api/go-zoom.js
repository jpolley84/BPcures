// api/go-zoom.js — tracked redirect to the challenge Zoom room (2026-08-24).
//
// Show-up measurement for the Change My Life Challenge. Emails link
//   https://bpquiz.com/api/go-zoom?c=2026-08-24            (bulk sends)
//   https://bpquiz.com/api/go-zoom?c=2026-08-24&e=<email>  (per-recipient sends)
// This handler captures a server-side PostHog `chal_zoom_click` and 302s to
// CHALLENGE_ZOOM_URL. Server-side capture cannot be ad-blocked, and the click
// happens in an email client, so it is the ONLY place show-up intent can be
// measured at all.
//
// Deliberately dumb and reliable: the redirect is the product, the analytics
// is a passenger. Any analytics failure is logged and swallowed. If the env is
// missing the visitor is sent to /challenge (where the schedule and support
// email live) rather than to a dead end, with a loud console.error so the
// broken config is visible in the function logs.
//
// distinct_id: lowercased email when the ?e= param carries one (matching how
// every other server-side event identifies people), otherwise an anonymous
// per-click id so the event still counts without inventing a person.

import { captureEvent } from './_posthog.js';
import { looksLikeValidEmail } from './_email-validation.js';

export default async function handler(req, res) {
  const zoomUrl = (process.env.CHALLENGE_ZOOM_URL || '').trim();

  const cohort = String(req.query?.c || '').slice(0, 40);
  const rawEmail = String(req.query?.e || '').trim().toLowerCase();
  const email = looksLikeValidEmail(rawEmail) ? rawEmail : '';
  const distinctId = email || `zoom-click-anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    await captureEvent({
      distinctId,
      event: 'chal_zoom_click',
      properties: {
        cohort: cohort || null,
        identified: Boolean(email),
        source: 'email-zoom-cta',
      },
    });
  } catch (err) {
    // captureEvent already swallows its own errors; this belt-and-suspenders
    // catch exists because NOTHING may stand between the click and the room.
    console.error('go-zoom: capture failed (redirecting anyway)', err?.message);
  }

  if (!zoomUrl) {
    console.error('go-zoom: CHALLENGE_ZOOM_URL is not set — redirecting to /challenge instead of the room');
    res.setHeader('Location', '/challenge');
    return res.status(302).end();
  }

  res.setHeader('Location', zoomUrl);
  return res.status(302).end();
}
