// api/reconcile-purchases.js — nightly PostHog purchase-capture reconciliation.
//
// Why this exists: the Stripe webhooks fire the authoritative PostHog
// `purchase` event, but analytics is deliberately non-fatal there (a PostHog
// hiccup must never 500 a paid buyer's fulfillment). Jul 7-13 2026 showed the
// cost: Jul 9 had 5 Stripe-paid sessions and 0 PostHog purchase events. This
// cron is the safety net. Every successful capture now writes a
// ph:purchase:<session.id> marker (see _triangle-posthog.js / _posthog.js);
// this cron lists the last 48h of paid Stripe checkout sessions, finds ours
// with no marker, and backfills the `purchase` event (source:'reconciliation')
// with the same property shape the webhooks emit.
//
// Scope: only sessions we can positively identify as ours on the shared
// Stripe account — braveworks funnel metadata, triangle kit tier price ids,
// case-review / call-97 / upgrade price ids, or SVUTU tea (steady + satin) /
// Samson price ids. Foreign funnels (RestoreHER, chinhair, launcher-untagged
// legacy bpquiz sales, etc.) are left alone.
//
// Schedule: vercel.json cron "30 8 * * *" UTC = 03:30 America/Chicago (CDT).
// Auth: same isAuthorizedCron pattern as every other cron in this repo.
// Alert: if more than 1 session is backfilled, email Joel a short table
// (subject '[BPQuiz] Purchase-capture gap: N backfilled').

import Stripe from 'stripe';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { capturePurchase } from './_triangle-posthog.js';
import { REPLY_TO } from './_triangle-email.js';
import {
  AMOUNT_TO_TIER,
  TIER_PRICE_IDS,
  TEA_PRICE_IDS,
  SATIN_PRICE_IDS,
  SAMSON_PRICE_IDS,
  UPGRADE_PRICE_TO_TIER,
  CASE_REVIEW_PRICE_ID,
  CASE_REVIEW_PRODUCT_ID,
  CALL_97_PRICE_ID,
  CALL_97_PRODUCT_ID,
} from './triangle-webhook.js';

const WINDOW_SECONDS = 48 * 60 * 60; // last 48h of sessions
const MAX_PAGES = 30;                // 30 x 100 sessions — safety cap

function hasAny(priceIds, set) {
  for (const id of priceIds) {
    if (set.has(id)) return true;
  }
  return false;
}

// Classify a paid checkout session against every product family the two
// webhooks route, in the same precedence order they use. Returns
// { tier, product, amountCents } for ours, or null for foreign sessions.
function classifySession(session, priceIds, productIds) {
  const md = session.metadata || {};
  const isBraveworks = md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp';
  const subtotalFirst = session.amount_subtotal ?? session.amount_total ?? 0;
  const totalFirst = session.amount_total ?? session.amount_subtotal ?? 0;

  // $297 case review (metadata marker or authoritative price/product id)
  if (
    ((md.kind === 'case-review' || md.offer === 'case-review') && isBraveworks) ||
    priceIds.includes(CASE_REVIEW_PRICE_ID) ||
    productIds.includes(CASE_REVIEW_PRODUCT_ID)
  ) {
    return { tier: 'case_review', product: "Joel's Eyes On Your Case", amountCents: subtotalFirst };
  }

  // $97 1:1 call
  if (
    (md.kind === 'call-97' && isBraveworks) ||
    priceIds.includes(CALL_97_PRICE_ID) ||
    productIds.includes(CALL_97_PRODUCT_ID)
  ) {
    return { tier: 'call-97', product: null, amountCents: subtotalFirst };
  }

  // SVUTU Steady tea
  if (md.funnel === 'svutu-tea' || hasAny(priceIds, TEA_PRICE_IDS)) {
    return { tier: 'svutu-tea', product: null, amountCents: totalFirst };
  }

  // SVUTU Satin tea
  if (md.blend === 'satin' || md.venture === 'svutu' || hasAny(priceIds, SATIN_PRICE_IDS)) {
    return { tier: 'svutu-satin', product: null, amountCents: totalFirst };
  }

  // Samson Formula
  if (md.funnel === 'samson' || hasAny(priceIds, SAMSON_PRICE_IDS)) {
    return { tier: 'samson', product: null, amountCents: totalFirst };
  }

  // /welcome difference-priced upgrades
  for (const id of priceIds) {
    if (UPGRADE_PRICE_TO_TIER[id]) {
      return { tier: UPGRADE_PRICE_TO_TIER[id], product: null, amountCents: subtotalFirst };
    }
  }
  if (md.kind === 'upgrade' && isBraveworks && (md.target_tier === 'top2' || md.target_tier === 'complete')) {
    return { tier: md.target_tier, product: null, amountCents: subtotalFirst };
  }

  // Kit tiers (corner / complete ladder) — funnel marker or tier price id,
  // then the same amount map the triangle webhook routes by.
  if (isBraveworks || hasAny(priceIds, TIER_PRICE_IDS)) {
    return { tier: AMOUNT_TO_TIER[subtotalFirst] || 'unknown', product: null, amountCents: subtotalFirst };
  }

  return null; // not ours — leave foreign funnels alone
}

async function sendGapAlert(backfilledRows) {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.JOEL_NOTIFY_EMAIL || REPLY_TO;
  const lines = backfilledRows.map(
    (r) => `${r.sessionId}  ${r.email}  ${r.tier}  $${(r.amountCents / 100).toFixed(2)}`
  );
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'BraveWorks Ops <joel@bpquiz.com>',
      to,
      replyTo: REPLY_TO,
      subject: `[BPQuiz] Purchase-capture gap: ${backfilledRows.length} backfilled`,
      text: `The nightly reconciliation cron found paid Stripe sessions with no PostHog purchase event and backfilled them (source: reconciliation).

This means the webhook's capture failed or was lost for these sales. Fulfillment is separate (check the webhook logs if buyers report missing kits), but analytics now shows them.

Session id  |  buyer  |  tier  |  amount
${lines.join('\n')}

Sessions scanned: last 48 hours. Automated by api/reconcile-purchases.js.`,
    });
  } catch (err) {
    console.error('reconcile-purchases: gap alert email failed', err.message);
  }
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const createdGte = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;

  let scanned = 0;
  let ours = 0;
  let skippedNoEmail = 0;
  let notCaptured = 0; // marker already present (webhook captured it) OR the capture failed
  const backfilledRows = [];

  let startingAfter = undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    let batch;
    try {
      batch = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        created: { gte: createdGte },
        expand: ['data.line_items'],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
    } catch (err) {
      console.error('reconcile-purchases: Stripe session list failed', err.message);
      return res.status(500).json({ error: `stripe list failed: ${err.message}`, scanned, backfilled: backfilledRows.length });
    }

    for (const session of batch.data || []) {
      scanned++;
      if (session.payment_status !== 'paid') continue;

      const lineItems = session.line_items?.data || [];
      const priceIds = lineItems.map((i) => i.price?.id).filter(Boolean);
      const productIds = lineItems
        .map((i) => {
          const prod = i.price?.product;
          return prod && typeof prod === 'object' ? prod.id : prod;
        })
        .filter(Boolean);

      const cls = classifySession(session, priceIds, productIds);
      if (!cls) continue;
      ours++;

      const email = session.customer_details?.email;
      if (!email) {
        skippedNoEmail++;
        continue;
      }

      // Backfill. capturePurchase does the ph:purchase:<id> marker read itself
      // (markSession) — no separate pre-read here, one KV read per candidate.
      // It returns true only when the event actually flushed; false means the
      // marker already existed (webhook captured it) or the capture failed.
      const captured = await capturePurchase({
        email,
        amountCents: cls.amountCents,
        tier: cls.tier,
        product: cls.product,
        source: 'reconciliation',
        sessionId: session.id,
        markSession: true,
        deviceDistinctId: session.metadata?.ph_distinct_id || null,
        // 2026-07-26: the reconciler was the ONE session-keyed caller that
        // dropped the homepage A/B variant (every webhook call site passes
        // it), so backfilled purchases landed unattributed and the arms could
        // not be compared on the metric that decides the test. The metadata is
        // already on the session; it just was never read.
        abHomeVariant: session.metadata?.ab_home_variant || null,
      });
      if (captured) {
        backfilledRows.push({
          sessionId: session.id,
          email: String(email).trim().toLowerCase(),
          tier: cls.tier,
          amountCents: cls.amountCents,
        });
      } else {
        notCaptured++;
      }
    }

    if (!batch.has_more || !(batch.data || []).length) break;
    startingAfter = batch.data[batch.data.length - 1].id;
  }

  const summary = {
    scanned,
    ours,
    backfilled: backfilledRows.length,
    skippedNoEmail,
    notCaptured,
    windowHours: WINDOW_SECONDS / 3600,
  };
  console.log('reconcile-purchases summary:', JSON.stringify(summary), backfilledRows.length ? `backfilled sessions: ${backfilledRows.map((r) => r.sessionId).join(', ')}` : '');

  if (backfilledRows.length > 1) {
    await sendGapAlert(backfilledRows);
  }

  return res.status(200).json({ ok: true, ...summary, backfilledSessions: backfilledRows });
}
