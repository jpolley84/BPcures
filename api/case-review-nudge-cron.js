// api/case-review-nudge-cron.js — chases case-review buyers who paid but never
// filled out their deep assessment.
//
// WHY THIS EXISTS (2026-08-22)
// The $297 Sprint / $97 flash confirmation promises "your plan lands within 2
// business days of your assessment." The whole fulfillment chain therefore
// waits on ONE action by the buyer, and until now nothing watched for it. If
// they never filled the form: the clock never started, no reminder went out,
// and Joel was never told a paying customer had gone quiet. The only way to
// notice was to remember. Zebedee Qawi Abdullah paid on 2026-08-21 and sat
// un-nudged, which is what prompted this.
//
// SOURCE OF TRUTH IS STRIPE, not KV. bwbp:crdone:<sessionId> records only
// timestamps (no email, no name) and expires after 30 days, so it cannot drive
// a chase loop. Stripe knows exactly who paid. Case-review volume is low
// (single digits), so paging recent sessions daily is cheap, and sweeping
// Stripe means a buyer is still caught if their webhook record failed or aged
// out — the failure mode that would otherwise hide the very customer we care
// about most.
//
// CADENCE per buyer, counted from purchase:
//   day 2  first nudge, warm, "I cannot start until this lands"
//   day 5  second nudge, offers to take the answers by email reply instead
//   day 7  STOP nudging the buyer; alert Joel that a paid customer is silent
// Sending stops immediately once bwbp:assessment:<email> exists.
//
// At most ONE email per buyer per run. Flags live in bwbp:crnudge:<email>
// (90-day TTL, comfortably longer than the 7-day arc) and are re-read fresh
// before every write so a concurrent run cannot clobber them.
//
// Schedule: vercel.json "15 16 * * *" (11:15 AM CT), after the buyer cron
// (15:30 UTC) and sprint-flash (15:45 UTC) so Joel's alerts arrive together
// rather than scattered through the day.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { FROM, REPLY_TO, SITE_URL, buildEmail, p, h2, ctaButton } from './_triangle-email.js';

export const config = { maxDuration: 300 };

const RATE_LIMIT_MS = 550;            // Resend 2/s ceiling
const DRY_RUN = process.env.CASE_REVIEW_NUDGE_DRY_RUN === '1';
const LOOKBACK_DAYS = 30;             // how far back to sweep Stripe
const NUDGE_DAYS = [2, 5];            // buyer-facing reminders
const JOEL_ALERT_DAY = 7;             // escalate, and stop emailing the buyer
const NUDGE_TTL = { ex: 60 * 60 * 24 * 90 };
const JOEL_NOTIFY = process.env.JOEL_NOTIFY_EMAIL || REPLY_TO;

const dayMs = 86400000;
const daysSinceMs = (ms, now = Date.now()) => Math.floor((now - ms) / dayMs);

// Pull paid case-review checkout sessions from the last LOOKBACK_DAYS.
// Recognized the same way the webhook recognizes them: the metadata marker,
// which both the payment link (kind) and embedded checkout (offer) stamp.
async function recentCaseReviewBuyers() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { buyers: [], error: 'no stripe key' };
  const auth = { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64') };
  const since = Math.floor((Date.now() - LOOKBACK_DAYS * dayMs) / 1000);
  const out = [];
  let url = `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${since}`;
  try {
    for (let page = 0; page < 6; page++) {
      const r = await fetch(url, { headers: auth });
      const j = await r.json();
      if (j.error) return { buyers: [], error: j.error.message };
      for (const s of j.data || []) {
        if (s.payment_status !== 'paid') continue;
        const md = s.metadata || {};
        const isCaseReview = md.kind === 'case-review' || md.offer === 'case-review';
        if (!isCaseReview) continue;
        const email = (s.customer_details?.email || s.customer_email || '').trim().toLowerCase();
        if (!email) continue;
        out.push({
          email,
          name: s.customer_details?.name || '',
          createdMs: s.created * 1000,
          sessionId: s.id,
          amountCents: s.amount_total,
          plan: md.plan || 'full',
        });
      }
      if (!j.has_more) break;
      url = `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${since}&starting_after=${j.data[j.data.length - 1].id}`;
    }
  } catch (err) {
    return { buyers: [], error: err.message };
  }
  // Oldest purchase wins if somebody bought twice: the earliest unfulfilled
  // case is the one that has been waiting longest.
  const byEmail = new Map();
  for (const b of out) {
    const prev = byEmail.get(b.email);
    if (!prev || b.createdMs < prev.createdMs) byEmail.set(b.email, b);
  }
  return { buyers: [...byEmail.values()], error: null };
}

const firstNameOf = (full) => String(full || '').trim().split(/\s+/)[0] || '';

function nudgeEmail(dayNum, firstName, email, unsubUrl) {
  const assessmentUrl = `${SITE_URL}/sprint-assessment${email ? `?email=${encodeURIComponent(email)}` : ''}`;
  const hi = firstName ? `Hi ${firstName},` : 'Hi,';

  if (dayNum === 2) {
    return buildEmail({
      preheader: 'I cannot start your 30 days until this one form lands.',
      unsubUrl,
      bodyHtml: [
        p(hi),
        p('Your case review is paid and sitting at the top of my list. I have not started it yet, and I want to tell you why.'),
        p('I build your 30 days from your own words: your numbers, your medications, what you have already tried, and what winning actually looks like for you. Without that, anything I sent you would be a generic plan, and you did not pay me for generic.'),
        ctaButton('Fill out your assessment', assessmentUrl),
        p('It takes about ten minutes, and it is the only thing standing between you and your plan. Your plan lands within two business days of it arriving.'),
        p('If the form gives you any trouble at all, just reply to this email and tell me what happened. I will sort it out personally.'),
        p('Joel Polley, RN'),
      ].join(''),
      bodyText: `${hi}

Your case review is paid and sitting at the top of my list. I have not started it yet, and I want to tell you why.

I build your 30 days from your own words: your numbers, your medications, what you have already tried, and what winning actually looks like for you. Without that, anything I sent you would be a generic plan, and you did not pay me for generic.

Fill out your assessment here:
${assessmentUrl}

It takes about ten minutes, and it is the only thing standing between you and your plan. Your plan lands within two business days of it arriving.

If the form gives you any trouble at all, just reply to this email and tell me what happened. I will sort it out personally.

Joel Polley, RN

Unsubscribe: ${unsubUrl}`,
    });
  }

  // Day 5: assume the form itself may be the obstacle and remove it.
  return buildEmail({
    preheader: 'If the form is the problem, just reply to this email instead.',
    unsubUrl,
    bodyHtml: [
      p(hi),
      p('I am still holding your case review, and I do not want it to quietly become one of those things you paid for and never got.'),
      p('If the form is the part that is not happening, forget the form. Hit reply and tell me these four things in your own words:'),
      h2('What I need'),
      p('1. Your last few blood pressure readings, roughly.<br>2. Any medications you take, with the doses if you have them handy.<br>3. What you have already tried.<br>4. What would make the next 30 days feel like a win.'),
      p('That is genuinely all of it. Type it in an email, send me a photo of a handwritten note, whatever is easiest. I will take it from there.'),
      ctaButton('Or use the form', assessmentUrl),
      p('Either way works. I just want to get started on your plan.'),
      p('Joel Polley, RN'),
    ].join(''),
    bodyText: `${hi}

I am still holding your case review, and I do not want it to quietly become one of those things you paid for and never got.

If the form is the part that is not happening, forget the form. Hit reply and tell me these four things in your own words:

1. Your last few blood pressure readings, roughly.
2. Any medications you take, with the doses if you have them handy.
3. What you have already tried.
4. What would make the next 30 days feel like a win.

That is genuinely all of it. Type it in an email, send me a photo of a handwritten note, whatever is easiest. I will take it from there.

Or use the form: ${assessmentUrl}

Either way works. I just want to get started on your plan.

Joel Polley, RN

Unsubscribe: ${unsubUrl}`,
  });
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const summary = { buyers: 0, alreadyAssessed: 0, nudged: {}, escalated: 0, skipped: 0, errors: 0, dryRun: DRY_RUN };

  const { buyers, error } = await recentCaseReviewBuyers();
  if (error) {
    console.error('case-review-nudge-cron: stripe sweep failed', error);
    return res.status(200).json({ ok: false, error, summary });
  }
  summary.buyers = buyers.length;

  for (const b of buyers) {
    try {
      // Done the moment their assessment exists. This is the stop condition.
      const assessment = await kv.get(`bwbp:assessment:${b.email}`);
      if (assessment) { summary.alreadyAssessed++; continue; }

      const day = daysSinceMs(b.createdMs);
      const flagKey = `bwbp:crnudge:${b.email}`;
      const state = (await kv.get(flagKey)) || {};

      // Past the buyer-facing window: tell Joel once, then stay quiet.
      if (day >= JOEL_ALERT_DAY) {
        if (state.joelEscalatedAt) { summary.skipped++; continue; }
        const paid = `$${(b.amountCents / 100).toLocaleString('en-US')}`;
        if (!DRY_RUN) {
          await resend.emails.send({
            from: 'BraveWorks Ops <joel@bpquiz.com>',
            to: JOEL_NOTIFY,
            replyTo: REPLY_TO,
            subject: `[ACTION] Paid case review, still no assessment after ${day} days (${b.email})`,
            text: `${b.name || '(no name)'} <${b.email}> paid ${paid} for the case review ${day} days ago and has never filled out the deep assessment.

They were reminded automatically on day 2 and day 5. Those have stopped, so nothing further is going out to them.

Purchased:      ${new Date(b.createdMs).toISOString().slice(0, 10)}
Stripe session: ${b.sessionId}

They paid and got nothing. Worth a personal email or a phone call, or a refund if they have gone cold. Their confirmation promised a plan within 2 business days of the assessment, so from their side this looks like silence.`,
          });
          const fresh = (await kv.get(flagKey)) || {};
          await kv.set(flagKey, { ...fresh, joelEscalatedAt: new Date().toISOString() }, NUDGE_TTL);
        }
        summary.escalated++;
        continue;
      }

      // Highest un-sent milestone they have reached. One email per run.
      const due = NUDGE_DAYS.filter((d) => day >= d && !state[`day${d}SentAt`]).pop();
      if (!due) { summary.skipped++; continue; }

      if (!DRY_RUN) {
        // signUnsubToken destructures { email }; passing a bare string yields a
        // token for an empty address and a dead unsubscribe link.
        const token = signUnsubToken({ email: b.email });
        const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${token}`;
        const { html, text } = nudgeEmail(due, firstNameOf(b.name), b.email, unsubUrl);
        const sent = await resend.emails.send({
          from: FROM,
          to: [b.email],
          replyTo: REPLY_TO,
          subject: due === 2
            ? 'Your case review is waiting on one thing'
            : 'Skip the form if it is easier, just reply to me',
          html,
          text,
          headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        });
        if (sent?.error) throw new Error(sent.error.message || JSON.stringify(sent.error));
        const fresh = (await kv.get(flagKey)) || {};
        await kv.set(flagKey, { ...fresh, [`day${due}SentAt`]: new Date().toISOString() }, NUDGE_TTL);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      }
      summary.nudged[`day${due}`] = (summary.nudged[`day${due}`] || 0) + 1;
    } catch (err) {
      summary.errors++;
      console.error(`case-review-nudge-cron: ${b.email} failed`, err.message);
    }
  }

  console.log('case-review-nudge-cron summary', JSON.stringify(summary));
  return res.status(200).json({ ok: true, summary });
}
