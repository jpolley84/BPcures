// api/stripe-webhook.js — Stripe checkout.session.completed handler.
//
// Cloned (trimmed to v1) from bpquiz-site/api/stripe-webhook.js. On a
// completed purchase it:
//   1. Verifies the Stripe signature (STRIPE_WEBHOOK_SECRET).
//   2. Dedupes by event id in KV (Stripe retries — never double-process).
//   3. Maps amount_subtotal → tier via AMOUNT_TO_TIER (saved-card / one-click
//      upsell amounts included so the $47 bump also resolves).
//   4. Transitions the bwbp:drip:<email> state machine (lead → buyer) so the
//      BUYER email sequence takes over. State transitions happen HERE on
//      purchase only, never on a timer (mirrors the bpquiz state machine).
//   5. Hands off to the buyer delivery email (Phase 2 agent #4).
//
// Webhook URL registered in Stripe: <site>/api/triangle-webhook (we_1TojYK)
// Event to subscribe: checkout.session.completed
//
// Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, KV_REST_API_URL.
// Returns 200 after signature verification even on downstream failure, so
// Stripe doesn't retry and double-send.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import {
  FROM, REPLY_TO, SITE_URL, SKOOL_TRIAL_URL, PALETTE,
  p, h2, callout, ctaButton, downloadRow, complianceFooterHtml, complianceFooterText, emailShell, buildEmail,
} from './_triangle-email.js';
import { modulesForTier, bundleNameForTier, bundleLabelForTier } from './_kit-manifest.js';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { capturePurchase } from './_triangle-posthog.js';

// ─── AMOUNT_TO_TIER (3-tier ladder) ───────────────────────────────────
// cents → tier key. The ladder is cumulative good-better-best. Amount-routing
// stays the single source of truth (matches bpquiz; promotion codes resolve via
// amount_subtotal, not amount_total).
//   $27 Your Corner Reset        2700 → 'corner'   (the #1 corner set)
//   $47 Your Top 2 Corners       4700 → 'top2'     (the two loudest corner sets + Skool trial)
//   $97 The Complete Triangle    9700 → 'complete' (all three sets + Freedom Finale + Skool trial)
// Note: each price link is a STANDALONE purchase (the comparison box sends the
// buyer straight to one Stripe link), so there are no combined-bump totals to
// map here. If a discounted price is ever introduced, add its amount here.
export const AMOUNT_TO_TIER = {
  1700: 'corner',   // $17 launch sale (price_1ToBlW…). The 1700↔RestoreHER $17-kit collision is handled by DISABLING RestoreHER's Stripe webhook (we_1TZDAW…), not by price-dodging.
  1699: 'corner',   // $16.99 launch sale (price_1To1kJ…) — legacy, kept for any in-flight session
  2700: 'corner',
  // 2026-07 ladder change (Joel): the COMPLETE kit now sells at $47 (was $97);
  // top2 is RETIRED from sale. 4700 therefore maps to 'complete'. A stray buy on
  // the old top2 $47 link also lands here and is delivered the complete kit
  // (strictly more than they ordered, never less). 9700 stays as the legacy $97
  // complete for any in-flight session. NOTE the $97 1:1 call is ALSO 9700 but is
  // recognized by its OWN price id BEFORE this map (see CALL_97 below).
  4700: 'complete',
  9700: 'complete',
};

// ─── $297 case-review disambiguation (NOT by amount) ──────────────────
// "Joel's Eyes On Your Case" is a braveworks-owned $297 product (29700 cents).
// We MUST recognize it by its SPECIFIC price id / product / funnel marker, never
// by the raw amount 29700, because bpquiz shares this one Stripe account and its
// webhook maps 29700 -> its 'diagnostic' tier. Routing the $297 by amount would
// risk the buyer being cross-enrolled in bpquiz's diagnostic flow. Matching on
// the price id keeps braveworks' $297 distinct from any amount bucket bpquiz owns.
//
// price + product ids are the live Stripe assets (see project_braveworks_bp_rebuild
// memory). The funnel/kind metadata marker is also stamped on the payment link's
// sessions as a secondary signal. Env can override the price id if it is ever
// rotated, without a code change.
const CASE_REVIEW_PRICE_ID = process.env.CASE_REVIEW_PRICE_ID || 'price_1TmZsIHseZnO3rRZmIhg9S7i';
const CASE_REVIEW_PRODUCT_ID = process.env.CASE_REVIEW_PRODUCT_ID || 'prod_Um8829DP1hSr5A';

// ─── $97 1:1 call with Joel (2026-07 ladder, the upsell from the $47 kit) ───
// Recognized by its SPECIFIC price/product id or metadata kind:'call-97', NEVER
// by amount: 9700 collides with the legacy $97 complete kit in AMOUNT_TO_TIER.
// Fulfillment = a confirmation email with the Calendly booking link (the payment
// link also redirects to /call-booked which embeds the same calendar). Per Joel,
// NO Joel-alert email for these (Calendly notifies him when the buyer books).
const CALL_97_PRICE_ID = process.env.CALL_97_PRICE_ID || 'price_1TpqZIHseZnO3rRZzYrYOfLf';
const CALL_97_PRODUCT_ID = process.env.CALL_97_PRODUCT_ID || 'prod_UpVar8dVNe2aV5';
const CALL_BOOKING_URL =
  process.env.CALL_BOOKING_URL || process.env.VITE_CALENDLY_DIAGNOSTIC_URL || '';

// ─── SVUTU Steady tea (bpquiz.com/tea) ────────────────────────────────
// Physical product on the same Stripe account. Every tea payment link stamps
// metadata funnel:'svutu-tea'; the price ids below are the authoritative match
// (the $17 sampler is 1700 cents, which COLLIDES with the kit's corner tier, so
// tea MUST be recognized before any amount routing). A tea purchase is:
//   1. recorded in KV (tea:sales:<Chicago-date>) for the nightly shipping
//      digest cron (api/tea-daily-cron.js), and
//   2. tagged in Resend (the "Tea Buyers (SVUTU Steady)" audience).
// No per-sale Joel notification (his rule: only $297 alerts); the daily digest
// to braveworksrn@gmail.com + annie@everydaynurse.com is the fulfillment feed.
const TEA_AUDIENCE_ID = process.env.TEA_AUDIENCE_ID || 'e70381dc-129d-45a4-9eff-e51e90e8da2b';
const TEA_PRICE_IDS = new Set([
  'price_1TqGiWHseZnO3rRZ9XnHorV0', // Ritual 3-pouch $120 (legacy link)
  'price_1TqGiZHseZnO3rRZSDRdhYPl', // Monthly sub $42/mo
  'price_1TqGiaHseZnO3rRZhSCeTi1H', // 1-Month pouch $48
  'price_1TqJJwHseZnO3rRZy09UUxGY', // 1-Week sampler $17
]);

// Chicago calendar date (YYYY-MM-DD) — the digest cron and the webhook must
// bucket sales by the SAME day boundary Joel lives in, not UTC.
export function chicagoDateKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(d);
}
// 3-pay plan: a recurring monthly price (subscription mode) that the webhook caps
// at 3 cycles via cancel_at. The price id is an env seam (set after Joel creates
// the recurring price in Stripe); the metadata marker offer:'case-review' +
// plan:'3pay' is the primary recognition signal, so the env is a backstop only.
const CASE_REVIEW_3PAY_PRICE_ID = process.env.STRIPE_CASE_REVIEW_3PAY_PRICE_ID || '';
// Cap = 3 monthly charges (day 0, ~day 30, ~day 60). cancel_at at now + 65 days
// ends the subscription after the 3rd charge and before a 4th can bill.
const CASE_REVIEW_3PAY_CANCEL_SECONDS = 65 * 24 * 60 * 60;
// Monthly capacity counter (read by api/case-review-slots.js). One key per
// calendar month (UTC), incremented on every fulfilled case-review purchase.
function caseReviewCountKey() {
  return `bwbp:casereview:count:${new Date().toISOString().slice(0, 7)}`;
}

// ─── Difference-priced /welcome UPGRADE disambiguation (NOT by amount) ──
// The /welcome page upsell unlocks a higher tier for the GAP in price:
//   corner -> top2     = 2000 ($20)  price_1TmhuvHseZnO3rRZ6jXBe6II  -> 'top2'
//   corner -> complete = 7000 ($70)  price_1TmhuwHseZnO3rRZbrSRoKfh  -> 'complete'
//   top2   -> complete = 5000 ($50)  price_1TmhuxHseZnO3rRZ3T43Sz77  -> 'complete'
// These MUST be recognized by their SPECIFIC price id / metadata, NEVER by the
// raw amount: corner->top2 is 2000, which collides with the legacy $20 one-click
// OTO amount (charge-upsell.js). The legacy OTO is a bare off_session
// PaymentIntent (no checkout.session.completed event, and 2000 is not even in
// AMOUNT_TO_TIER), so it never reaches this handler. But the upgrade IS a
// checkout.session.completed from a payment link, so we resolve its TARGET tier
// from the price id (authoritative) or the session/price metadata target_tier
// (cheap signal stamped on the payment link), and early-return BEFORE the
// AMOUNT_TO_TIER lookup (same pattern the $297 case-review uses). Env can
// override each price id if Stripe ever rotates them, without a code change.
const UPGRADE_PRICE_TO_TIER = {
  [process.env.UPGRADE_CORNER_TO_TOP2_PRICE_ID || 'price_1TmhuvHseZnO3rRZ6jXBe6II']: 'top2',
  [process.env.UPGRADE_CORNER_TO_COMPLETE_PRICE_ID || 'price_1TmhuwHseZnO3rRZbrSRoKfh']: 'complete',
  [process.env.UPGRADE_TOP2_TO_COMPLETE_PRICE_ID || 'price_1TmhuxHseZnO3rRZ3T43Sz77']: 'complete',
  // 2026-07 ladder: the LIVE upgrade is the corner -> complete OTO for $27
  // (Joel: better psychological number than $30). The $30 price below it and the
  // three legacy prices above stay ONLY for in-flight session recognition.
  [process.env.UPGRADE_CORNER_TO_COMPLETE_30_PRICE_ID || 'price_1TpqZHHseZnO3rRZYIRok6fG']: 'complete',
  [process.env.UPGRADE_CORNER_TO_COMPLETE_OTO_PRICE_ID || 'price_1TpqyjHseZnO3rRZk05rso0U']: 'complete',
};
const UPGRADE_TARGET_TIERS = new Set(['top2', 'complete']);

// State the buyer's drip record moves to on purchase. v1: any paid tier →
// 'buyer' (the buyer delivery/onboarding sequence). Kept as a function so
// Phase 2 can split entry-buyer vs triangle-buyer states if needed.
function purchaseToState(/* tier */) {
  return 'buyer';
}

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

function firstNameOf(fullName) {
  return (fullName || '').trim().split(/\s+/)[0] || '';
}

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─── Seam 1: at-purchase delivery email (Day 0 of the buyer journey) ──
// Mirrors bpquiz sendPurchaseConfirmation(). Delivers the kit by direct
// /downloads/*.pdf links (no attachments), branched by tier on the 3-tier
// ladder (resolved from the buyer's quiz corner + scores on the drip record):
//   corner   -> the reader's #1 (loudest) corner set.
//   top2     -> the reader's TWO loudest corner sets + a Skool trial link.
//   complete -> all three corner sets + the Freedom Finale + a Skool trial link.
// If the corner/scores are unknown (no matching lead record), modulesForTier
// falls back gracefully (corner -> sodium set; top2 -> sodium+stress;
// complete -> everything) so a paid buyer is never handed a blank delivery.
// The follow-on onboarding days are handled by _buyer-emails.js. Education
// alongside the doctor, ZERO em-dashes.
//
// buildBuyerDeliveryEmail is the PURE renderer: given the buyer's fields it
// returns { subject, html, text } and sends nothing. It is exported so the
// preview script (scripts/preview-sequence.mjs) can render this Day 0 email
// exactly as the webhook ships it, byte for byte, without a live Stripe event.
// sendBuyerDelivery (below) calls it and is the only thing that sends, so the
// runtime behavior is unchanged.
export function buildBuyerDeliveryEmail({ firstName, tier, corner, scores, unsubUrl }) {
  const allModules = modulesForTier(tier, corner, scores);
  // modulesForTier returns the core kit first, then the tier's cumulative
  // bonuses (flagged `bonus: true`). Split them so the email lists the bonuses
  // under their own "Your bonuses" heading, separate from the core kit.
  const modules = allModules.filter((m) => !m.bonus);
  const bonuses = allModules.filter((m) => m.bonus);
  // The SINGLE tier bundle is the PRIMARY download: one ZIP holding every PDF
  // below (core kit + bonuses), resolved from tier + corner(s) the same way the
  // file list is. bundleNameForTier falls back exactly like modulesForTier
  // (unknown corner -> sodium, unknown pair -> the resolved top two), so the ZIP
  // contents always match the listed files. The individual rows stay below it as
  // a contents view, so a buyer who wants one file still has it.
  const bundleFile = bundleNameForTier(tier, corner, scores);
  const bundleUrl = `${SITE_URL}/downloads/bundles/${bundleFile}`;
  const bundleLabel = bundleLabelForTier(tier);
  const libraryUrl = `${SITE_URL}/library`;
  const isComplete = tier === 'complete' || tier === 'triangle';
  const isTop2 = tier === 'top2';
  // Skool trial rides along with EVERY tier now, including corner (the $27/mo
  // Weekly Reset community is the continuity path for every buyer). Env
  // SKOOL_TRIAL_URL stays the seam; when unset we fall back to the public trial
  // page instead of hiding the block.
  const skoolUrl = SKOOL_TRIAL_URL || 'https://www.skool.com/braveworksrn/about';
  const includeSkool = Boolean(skoolUrl);

  const subject = isComplete
    ? 'Your full BP Triangle is ready, open it now'
    : isTop2
      ? 'Your top two corners are ready, open them now'
      : 'Your BP reset is ready, open it now';

  const intro = isComplete
    ? `Your full 30 day Triangle is ready. Every piece is below: all three corner protocols, each corner's Herb Formulary and its Bring This To Your Doctor sheet, plus the Freedom Finale. You do not start them all at once. Begin at your loudest corner, give it the first ten days, then walk the next, and the next.`
    : isTop2
      ? `Your two loudest corners are ready, each as a full set: the day by day protocol, the Herb Formulary (every herb with its dose, why it helps, and the cautions), and a one page Bring This To Your Doctor sheet. Start with the louder of the two corners, give it the first ten days, then walk the second.`
      : `Your 10 day corner reset is ready, and it comes as a set of three: the day by day protocol, the Herb Formulary for your corner (every herb with its dose, why it helps, and the cautions), and a one page Bring This To Your Doctor sheet so you and your doctor read your numbers together.`;

  const firstStep = (isComplete || isTop2)
    ? `Open your loudest corner's module, read Day 1, and take your baseline blood pressure (sit quietly five minutes, same arm, average two or three readings). That number is your starting line.`
    : `Read Day 1 of your module and take your baseline blood pressure (sit quietly five minutes, same arm, average two or three readings). Write it down. That is your starting line.`;

  const skoolHtml = includeSkool
    ? callout({
        kicker: 'Your community trial',
        body: `Your purchase includes a free 7 day trial of the Skool community, where I teach the Triangle live and you can ask me your questions. <a href="${skoolUrl}" style="color:${PALETTE.accentClay};font-weight:700;">Start your free trial here.</a>`,
      })
    : '';

  // Bonus block (cumulative existing-asset stack), only when the tier carries
  // bonuses. Rendered under its own heading, after the core kit + first step.
  const bonusHtml = bonuses.length
    ? h2('Your bonuses') +
      p(`These come on top of your kit, yours to keep. Print the ones you want on the fridge and reach for them whenever you need a hand.`) +
      bonuses.map((m) => downloadRow({ title: m.title, blurb: m.blurb, file: m.file })).join('')
    : '';

  const bodyHtml = [
    `<div style="display:inline-block;font-size:12px;font-weight:700;color:${PALETTE.accentSage};border:1px solid ${PALETTE.accentSage};border-radius:999px;padding:5px 12px;margin-bottom:18px;font-family:-apple-system,Segoe UI,sans-serif;">Purchase confirmed</div>`,
    p(`Hi ${firstName || 'there'},`),
    p(`First, thank you. You did the thing most people never do, you went after the cause instead of just the number.`),
    p(intro),
    h2('Your kit is ready'),
    p(`Everything in one file: your whole kit and every bonus, zipped together. Open this and you have it all. The individual pieces are listed under it if you would rather grab one at a time.`),
    ctaButton(`Open my ${bundleLabel} now`, bundleUrl),
    p(`<strong>What's inside, piece by piece:</strong>`, { margin: '6px 0 12px' }),
    modules.map((m) => downloadRow({ title: m.title, blurb: m.blurb, file: m.file })).join(''),
    callout({ kicker: 'What to do first', body: firstStep }),
    bonusHtml,
    skoolHtml,
    p(`Everything lives in your library, and your access never expires: <a href="${libraryUrl}" style="color:${PALETTE.accentClay};font-weight:700;">open your library</a>.`),
    p(`I will check in over the next few days with what to watch for. If your numbers come down, that is wonderful news you bring to your doctor, who makes any calls about your medication. We never change a prescription on our own.`),
    p(`Joel Polley, RN`),
  ].join('');

  const skoolText = includeSkool
    ? `\nYOUR COMMUNITY TRIAL\nYour purchase includes a free 7 day trial of the Skool community, where I teach the Triangle live. Start it here: ${skoolUrl}\n`
    : '';

  const bonusText = bonuses.length
    ? `\nYOUR BONUSES (on top of your kit, yours to keep)\n${bonuses.map((m) => `- ${m.title}: ${SITE_URL}/downloads/${m.file}`).join('\n')}\n`
    : '';

  const bodyText = `Hi ${firstName || 'there'},

Thank you. You went after the cause instead of just the number.

${intro}

YOUR DOWNLOADS
Everything in one file (your whole kit and every bonus, zipped together):
Download your complete ${bundleLabel} bundle: ${bundleUrl}

What's inside, piece by piece:
${modules.map((m) => `- ${m.title}: ${SITE_URL}/downloads/${m.file}`).join('\n')}

WHAT TO DO FIRST
${firstStep}
${bonusText}${skoolText}
Everything lives in your library (access never expires): ${libraryUrl}

If your numbers come down, bring that news to your doctor, who makes any medication calls. We never change a prescription on our own.

Joel Polley, RN`;

  const html = emailShell(bodyHtml + complianceFooterHtml(unsubUrl), { preheader: subject });
  const text = `${bodyText}\n\n${complianceFooterText(unsubUrl)}`;
  return { subject, html, text };
}

// Best-effort: a send failure never fails the webhook (the buyer cron is the
// backstop). Renders via buildBuyerDeliveryEmail so the preview and the live
// send stay identical.
async function sendBuyerDelivery({ email, firstName, tier, corner, scores }) {
  // One-click unsubscribe for this transactional-but-ongoing relationship.
  const unsubToken = signUnsubToken({ email });
  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;

  const { subject, html, text } = buildBuyerDeliveryEmail({ firstName, tier, corner, scores, unsubUrl });

  await getResend().emails.send({
    from: FROM,
    to: String(email).trim(),
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

// ─── Seam 2: unmapped-amount alert ────────────────────────────────────
// A buyer paid but the amount has no tier in AMOUNT_TO_TIER, so we cannot
// deliver. Email Joel so a paid buyer is never silently dropped (mirrors
// bpquiz). Best-effort: never throws into the webhook path.
async function alertUnmappedAmount({ sessionId, amountCents, email }) {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.JOEL_NOTIFY_EMAIL || REPLY_TO;
  const dollars = typeof amountCents === 'number' ? `$${(amountCents / 100).toFixed(2)}` : 'unknown';
  try {
    await getResend().emails.send({
      from: 'BraveWorks Ops <joel@bpquiz.com>',
      to,
      replyTo: REPLY_TO,
      subject: `[ACTION] BP buyer paid an unmapped amount (${dollars})`,
      text: `A BraveWorks BP checkout completed with an amount that is not in AMOUNT_TO_TIER, so no kit was delivered automatically.

Amount: ${dollars} (${amountCents} cents)
Buyer email: ${email || 'unknown'}
Stripe session: ${sessionId}

Fix: add ${amountCents} to AMOUNT_TO_TIER in api/stripe-webhook.js (and re-deliver this buyer manually). This usually means a discounted price, a combined one-click bump total, or a new product.`,
    });
  } catch (err) {
    console.error('stripe-webhook: failed to send unmapped-amount alert', err.message);
  }
}

// ─── $297 case-review handling ────────────────────────────────────────
// Decide whether a completed session is the "Joel's Eyes On Your Case" $297
// purchase, by the SPECIFIC price id / product / funnel marker (NEVER by amount,
// see CASE_REVIEW_PRICE_ID above). Checks the session metadata marker first
// (cheap), then expands line items and matches the price/product id (the
// authoritative signal). Returns the plan ('full' for the one-time price,
// '3pay' for the 3-payment subscription) or null when the session is not a
// case review. Best-effort, never throws.
async function resolveCaseReviewPlan(session) {
  // 1) Cheap path: the payment link stamps kind:'case-review' and the embedded
  // checkout stamps offer:'case-review' + plan onto the Checkout Session metadata
  // (always alongside the funnel/brand marker).
  const md = session.metadata || {};
  const isBraveworks = md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp';
  if ((md.kind === 'case-review' || md.offer === 'case-review') && isBraveworks) {
    return md.plan === '3pay' ? '3pay' : 'full';
  }
  // 2) Authoritative path: inspect the line items' price + product ids. The
  // 3-pay price id is checked FIRST because both plans can live on the same
  // Stripe product; a product-id match alone resolves the plan from whether the
  // price is recurring.
  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
      expand: ['data.price.product'],
    });
    for (const item of items.data || []) {
      const price = item.price || {};
      if (CASE_REVIEW_3PAY_PRICE_ID && price.id === CASE_REVIEW_3PAY_PRICE_ID) return '3pay';
      if (price.id && price.id === CASE_REVIEW_PRICE_ID) return 'full';
      const product = price.product;
      const productId = product && typeof product === 'object' ? product.id : product;
      if (productId && productId === CASE_REVIEW_PRODUCT_ID) {
        return price.recurring ? '3pay' : 'full';
      }
    }
  } catch (err) {
    console.warn('stripe-webhook: case-review line-item check failed (non-fatal)', err.message);
  }
  return null;
}

// The branded buyer confirmation for a $297 case-review purchase. Built with the
// shared buildEmail renderer so it looks like every other BraveWorks BP email.
// Outcome-framed, gratitude-first, NO doses, NO diagnosis, NO clinical promise,
// ZERO em-dashes.
function buildCaseReviewEmail({ firstName, unsubUrl }) {
  const preheader = 'Joel has your case. He will review it himself and email you within 2 business days.';
  const bodyHtml = [
    `<div style="display:inline-block;font-size:12px;font-weight:700;color:${PALETTE.accentSage};border:1px solid ${PALETTE.accentSage};border-radius:999px;padding:5px 12px;margin-bottom:18px;font-family:-apple-system,Segoe UI,sans-serif;">Case received</div>`,
    p(`Hi ${firstName || 'there'},`),
    p(`Thank you, truly. This one comes straight to me. You did not just buy a kit, you asked a nurse to read your case, and I do not take that lightly.`),
    h2('What happens next'),
    p(`I will sit down with your quiz, your corners, and what you have tried so far, and I will write back your exact next moves in plain language, for your situation, not a generic plan.`),
    callout({
      kicker: 'Your timing',
      body: `It lands in your inbox within 2 business days. Keep an eye out, and peek in your spam folder just in case. If you do not hear from me, reply to this email and I will make it right.`,
    }),
    p(`Everything I send is education and lifestyle support to stand alongside your own doctor, never instead of them. Your doctor makes any calls about your medication, and you never start, stop, or change a prescription on your own.`),
    p(`Talk soon,`),
    p(`Joel Polley, RN`),
  ].join('');

  const bodyText = `Hi ${firstName || 'there'},

Thank you, truly. This one comes straight to me. You asked a nurse to read your case, and I do not take that lightly.

WHAT HAPPENS NEXT
I will sit down with your quiz, your corners, and what you have tried so far, and write back your exact next moves in plain language, for your situation, not a generic plan.

YOUR TIMING
It lands in your inbox within 2 business days. Keep an eye out, and peek in your spam folder just in case. If you do not hear from me, reply to this email and I will make it right.

Everything I send is education and lifestyle support to stand alongside your own doctor, never instead of them. Your doctor makes any calls about your medication, and you never start, stop, or change a prescription on your own.

Talk soon,
Joel Polley, RN`;

  return buildEmail({ preheader, bodyHtml, bodyText, unsubUrl });
}

// ─── $97 1:1 call: recognition + confirmation ─────────────────────────
// True when this session is the $97 1:1 call (metadata marker first, then the
// authoritative price/product ids). Mirrors the case-review pattern exactly.
async function isCall97Session(session) {
  const md = session.metadata || {};
  if (md.kind === 'call-97' && (md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp')) {
    return true;
  }
  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
      expand: ['data.price.product'],
    });
    for (const item of items.data || []) {
      const price = item.price || {};
      if (price.id && price.id === CALL_97_PRICE_ID) return true;
      const product = price.product;
      const productId = product && typeof product === 'object' ? product.id : product;
      if (productId && productId === CALL_97_PRODUCT_ID) return true;
    }
  } catch (err) {
    console.warn('stripe-webhook: call-97 line-item check failed (non-fatal)', err.message);
  }
  return false;
}

// The buyer confirmation for the $97 1:1 call: gratitude + the Calendly booking
// link + what to have ready. Education framing, no doses, no clinical promise,
// ZERO em-dashes.
function buildCall97Email({ firstName, unsubUrl }) {
  const preheader = 'Your 1:1 call with Joel is paid. Pick your time here.';
  const bookHtml = CALL_BOOKING_URL
    ? ctaButton({ label: 'Pick my call time', url: CALL_BOOKING_URL })
    : p(`Your booking link is on the page you just landed on. If you closed it, reply to this email and I will send your times directly.`);
  const bodyHtml = [
    `<div style="display:inline-block;font-size:12px;font-weight:700;color:${PALETTE.accentSage};border:1px solid ${PALETTE.accentSage};border-radius:999px;padding:5px 12px;margin-bottom:18px;font-family:-apple-system,Segoe UI,sans-serif;">Call confirmed</div>`,
    p(`Hi ${firstName || 'there'},`),
    p(`Thank you. You booked time with me, not a course, not a PDF, me. We will sit down together, walk your numbers and your Triangle, and leave you knowing exactly what to work first.`),
    h2('Book your time now'),
    bookHtml,
    h2('Have these ready'),
    p(`Your last few blood pressure readings, your current medication list, and your quiz result if you took it. The more real numbers we have, the more we can do with your 30 minutes.`),
    p(`This call is education and lifestyle support to stand alongside your own doctor, never instead of them. Your doctor makes any calls about your medication.`),
    p(`Talk soon,`),
    p(`Joel Polley, RN`),
  ].join('');
  const bodyText = `Hi ${firstName || 'there'},

Thank you. You booked time with me, not a course, not a PDF, me. We will sit down together, walk your numbers and your Triangle, and leave you knowing exactly what to work first.

BOOK YOUR TIME NOW
${CALL_BOOKING_URL || 'Your booking link is on the page you just landed on. If you closed it, reply to this email and I will send your times directly.'}

HAVE THESE READY
Your last few blood pressure readings, your current medication list, and your quiz result if you took it.

This call is education and lifestyle support to stand alongside your own doctor, never instead of them. Your doctor makes any calls about your medication.

Talk soon,
Joel Polley, RN`;
  return buildEmail({ preheader, bodyHtml, bodyText, unsubUrl });
}

async function sendCall97Confirmation({ email, firstName }) {
  const unsubToken = signUnsubToken({ email });
  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
  const { html, text } = buildCall97Email({ firstName, unsubUrl });
  await getResend().emails.send({
    from: FROM,
    to: String(email).trim(),
    replyTo: REPLY_TO,
    subject: 'Your 1:1 call with Joel is confirmed, pick your time',
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

// Handle the $97 call purchase end to end: dedupe, mark the drip record, email
// the booking link. NO Joel alert by design (Calendly notifies him on booking).
async function processCall97(session) {
  const customerEmail = session.customer_details?.email;
  const firstName = firstNameOf(session.customer_details?.name);
  const emailKey = String(customerEmail).trim().toLowerCase();
  const dedupeKey = `bwbp:call97:${emailKey}:${session.id}`;
  try {
    const already = await kv.get(dedupeKey);
    if (already) return { action: 'call97', deduplicated: true, customer_email: customerEmail };
  } catch (err) {
    console.warn('stripe-webhook: call97 dedupe read failed (non-fatal)', err.message);
  }
  let firstNameFinal = firstName;
  try {
    const dripKey = `bwbp:drip:${emailKey}`;
    const existing = await kv.get(dripKey);
    if (existing?.firstName) firstNameFinal = existing.firstName;
    if (existing) {
      await kv.set(dripKey, { ...existing, boughtCall97At: new Date().toISOString() });
    }
  } catch (err) {
    console.warn('stripe-webhook: call97 drip update failed (non-fatal)', err.message);
  }
  let delivered = false;
  try {
    await sendCall97Confirmation({ email: customerEmail, firstName: firstNameFinal });
    delivered = true;
  } catch (err) {
    console.error('stripe-webhook: call97 confirmation email failed (non-fatal)', err.message);
  }
  try {
    await kv.set(dedupeKey, { deliveredAt: new Date().toISOString() });
  } catch (err) {
    console.warn('stripe-webhook: call97 dedupe write failed (non-fatal)', err.message);
  }
  await capturePurchase({
    email: customerEmail,
    amountCents: session.amount_subtotal ?? session.amount_total ?? 9700,
    tier: 'call-97',
    sessionId: session.id,
  });
  return { action: 'call97', delivered, customer_email: customerEmail };
}

// ─── SVUTU Steady tea: recognition + recording ────────────────────────
// True when this session is a tea purchase (metadata marker first, then the
// authoritative price ids). Runs BEFORE the foreign-funnel guard and before any
// amount routing (the $17 sampler amount collides with the kit's corner tier).
async function isTeaSession(session) {
  const md = session.metadata || {};
  if (md.funnel === 'svutu-tea') return true;
  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10, expand: ['data.price'] });
    for (const item of items.data || []) {
      if (item.price?.id && TEA_PRICE_IDS.has(item.price.id)) return true;
    }
  } catch (err) {
    console.warn('stripe-webhook: tea line-item check failed (non-fatal)', err.message);
  }
  return false;
}

// Shared tea-sale fulfillment: KV shipping-digest record + Resend "Tea Buyers"
// tag + buyer confirmation email + PostHog capture. Used by BOTH the Payment
// Link webhook path (processTeaPurchase, below) and the one-click upsell
// charge (api/tea-one-click.js), so a tea sale is recorded identically no
// matter which path it came through, and the nightly shipping digest cron
// never has to know the difference. dedupeId is whatever Stripe object id is
// globally unique for the sale (a Checkout Session id from the webhook, or a
// PaymentIntent id from the one-click charge, which never gets a
// checkout.session.completed event of its own).
export async function recordTeaSale({ dedupeId, email, name, items, amountCents, isSubscription, address, source }) {
  const customerEmail = email || '';
  const emailKey = String(customerEmail).trim().toLowerCase();

  const dedupeKey = `tea:sale:${dedupeId}`;
  try {
    const already = await kv.get(dedupeKey);
    if (already) return { action: 'tea_sale', deduplicated: true, customer_email: customerEmail };
  } catch (err) {
    console.warn('recordTeaSale: dedupe read failed (non-fatal)', err.message);
  }

  const addr = address || {};
  const record = {
    at: new Date().toISOString(),
    sessionId: dedupeId,
    email: customerEmail,
    name: name || '',
    items: items || [],
    amountCents: amountCents || 0,
    subscription: Boolean(isSubscription),
    source: source || 'checkout_session',
    address: {
      line1: addr.line1 || '', line2: addr.line2 || '', city: addr.city || '',
      state: addr.state || '', postal_code: addr.postal_code || '', country: addr.country || '',
    },
  };

  // Append to the Chicago-day bucket the digest cron reads. 21-day TTL.
  try {
    const dayKey = `tea:sales:${chicagoDateKey()}`;
    await kv.rpush(dayKey, JSON.stringify(record));
    await kv.expire(dayKey, 60 * 60 * 24 * 21);
  } catch (err) {
    console.error('recordTeaSale: tea sale KV record failed', err.message);
  }

  // Send the buyer their confirmation + ingredient flyer. Best-effort: a send
  // failure never fails the caller (the KV record + nightly shipping digest is
  // the fulfillment backstop, and Joel can resend). Fires once per new sale
  // because the dedupe guard above returns early on a repeat.
  if (customerEmail) {
    try {
      await sendTeaConfirmation({
        email: customerEmail,
        firstName: firstNameOf(record.name),
        items: record.items,
        amountCents: record.amountCents,
        address: record.address,
        name: record.name,
      });
    } catch (err) {
      console.error('recordTeaSale: tea confirmation email failed', err.message);
    }
  }

  // Tag the buyer in Resend (Tea Buyers audience). Existing contact -> Resend
  // returns an error we can ignore; the tag is the point, not uniqueness.
  if (emailKey) {
    try {
      const [first, ...restName] = String(record.name).trim().split(/\s+/);
      await fetch(`https://api.resend.com/audiences/${TEA_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailKey, first_name: first || '', last_name: restName.join(' '), unsubscribed: false }),
      });
    } catch (err) {
      console.warn('recordTeaSale: tea Resend tag failed (non-fatal)', err.message);
    }
  }

  try {
    await kv.set(dedupeKey, { recordedAt: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
  } catch (err) {
    console.warn('recordTeaSale: tea dedupe write failed (non-fatal)', err.message);
  }

  await capturePurchase({
    email: customerEmail,
    amountCents: record.amountCents,
    tier: 'svutu-tea',
    sessionId: dedupeId,
  });
  return { action: 'tea_sale', recorded: true, customer_email: customerEmail };
}

// Record the tea sale for the nightly shipping digest + tag the buyer in the
// Resend "Tea Buyers" audience. Never throws into the webhook. Thin wrapper
// around recordTeaSale() that pulls the shared fields out of a Stripe
// Checkout Session (the shape a tea Payment Link purchase arrives in).
async function processTeaPurchase(session) {
  const customerEmail = session.customer_details?.email || '';
  const customerName = session.customer_details?.name || '';

  // What they bought (product name + qty per line item).
  let items = [];
  try {
    const stripe = getStripe();
    const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    items = (li.data || []).map((i) => ({ name: i.description || 'Tea', qty: i.quantity || 1 }));
  } catch (err) {
    console.warn('stripe-webhook: tea line-items fetch failed (non-fatal)', err.message);
  }

  // Shipping address: classic API puts it at session.shipping_details; newer
  // API versions moved it under collected_information. Take whichever exists,
  // fall back to the billing address so the digest is never blank.
  const ship =
    session.shipping_details ||
    session.collected_information?.shipping_details ||
    null;
  const addr = ship?.address || session.customer_details?.address || {};

  return recordTeaSale({
    dedupeId: session.id,
    email: customerEmail,
    name: ship?.name || customerName,
    items,
    amountCents: session.amount_total ?? session.amount_subtotal ?? 0,
    isSubscription: session.mode === 'subscription',
    address: addr,
    source: 'checkout_session',
  });
}

// ─── SVUTU Steady: buyer confirmation email + ingredient flyer ────────
// The at-purchase email for a tea order. Three jobs: (1) verify what they bought,
// (2) set the hand crafted "ships within 5 to 7 business days" expectation, and
// (3) carry the same ingredient research flyer as bpquiz.com/tea, every herb
// linked to a real study. Reuses the shared BraveWorks email shell + compliance
// footer (Steady is Anchor 1 of the BP Triangle Method, so the family shell
// fits). Sender is Joel; the family framing is Joel + Annie. ZERO em-dashes in
// visible copy, per the email system's rule.
const TEA_EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Verified BP / BP-driver research, one study per botanical, mirroring the site.
const TEA_RESEARCH = [
  { name: 'Hibiscus', corner: 'Sodium', what: 'A Tufts RCT and meta-analyses studied it for lowering systolic blood pressure in adults.', url: 'https://pubmed.ncbi.nlm.nih.gov/20018807/' },
  { name: 'Hawthorn', corner: 'Arterial pressure', what: 'A 2025 meta-analysis of clinical trials studied it for lower systolic pressure in hypertension.', url: 'https://pubmed.ncbi.nlm.nih.gov/40732315/' },
  { name: 'Lemongrass', corner: 'Vascular', what: 'A 2022 review ties it to vessel relaxing (nitric oxide) and mild diuretic activity.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9598547/' },
  { name: 'Ginger', corner: 'Sodium and Sugar', what: 'A meta-analysis studied it for healthy blood pressure, and other trials for blood sugar.', url: 'https://pubmed.ncbi.nlm.nih.gov/30972845/' },
  { name: 'Nettle', corner: 'Sodium', what: 'Animal research studied it for lower blood pressure and for clearing sodium and water.', url: 'https://pubmed.ncbi.nlm.nih.gov/30097121/' },
  { name: 'Chamomile', corner: 'Stress and Sugar', what: 'A placebo controlled trial studied it for anxiety, and diabetic trials for blood sugar.', url: 'https://pubmed.ncbi.nlm.nih.gov/19593179/' },
  { name: 'Lavender', corner: 'Stress', what: 'A trial in high blood pressure patients studied it for lower blood pressure, heart rate and cortisol.', url: 'https://pubmed.ncbi.nlm.nih.gov/35708557/' },
  { name: 'Calendula', corner: 'Gentlest evidence', what: 'Animal research studied it for antioxidant support and healthier lipids on a high sugar diet.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10578091/' },
];

function teaFlyerHtml() {
  const rows = TEA_RESEARCH.map((r) => `
    <tr><td style="padding:13px 0;border-bottom:1px solid ${PALETTE.lineSoft};font-family:${TEA_EMAIL_FONT};">
      <div style="font-size:15px;font-weight:700;color:${PALETTE.ink};">${r.name} <span style="font-weight:600;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:${PALETTE.sage};">${r.corner}</span></div>
      <div style="font-size:13.5px;line-height:1.55;color:${PALETTE.inkSoft};margin:4px 0 6px;">${r.what}</div>
      <a href="${r.url}" style="font-size:12.5px;font-weight:700;color:${PALETTE.clay};text-decoration:none;">See the research &rarr;</a>
    </td></tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 10px;border-collapse:collapse;">${rows}</table>`;
}

function teaFlyerText() {
  return TEA_RESEARCH.map((r) => `- ${r.name} (${r.corner}): ${r.what}\n  ${r.url}`).join('\n');
}

function teaOrderLines(items) {
  return items && items.length ? items : [{ name: 'SVUTU Steady', qty: 1 }];
}

function teaOrderSummaryHtml(items, amountCents) {
  const lines = teaOrderLines(items)
    .map((i) => `<div style="font-size:15px;color:${PALETTE.inkSoft};font-family:${TEA_EMAIL_FONT};margin:0 0 4px;">${i.qty} &times; ${i.name}</div>`)
    .join('');
  const total = typeof amountCents === 'number' && amountCents > 0 ? `$${(amountCents / 100).toFixed(2)}` : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 14px;border:1px solid ${PALETTE.line};border-radius:12px;background:${PALETTE.cream};border-collapse:separate;">
    <tr><td style="padding:16px 20px;">
      ${lines}
      ${total ? `<div style="font-size:15px;font-weight:700;color:${PALETTE.ink};font-family:${TEA_EMAIL_FONT};margin-top:8px;border-top:1px solid ${PALETTE.lineSoft};padding-top:8px;">Total paid: ${total}</div>` : ''}
    </td></tr>
  </table>`;
}

function teaShipToHtml(address, name) {
  if (!address) return '';
  const parts = [address.line1, address.line2, [address.city, address.state].filter(Boolean).join(', '), address.postal_code].filter(Boolean);
  if (!parts.length) return '';
  return `<div style="font-size:13.5px;line-height:1.6;color:${PALETTE.muted};font-family:${TEA_EMAIL_FONT};margin:0 0 8px;">Shipping to: ${name ? name + ', ' : ''}${parts.join(', ')}. If anything looks off, reply to this email and we will fix it before it ships.</div>`;
}

export function buildTeaConfirmationEmail({ firstName, items, amountCents, address, name, unsubUrl }) {
  const preheader = 'Your order is confirmed. Hand crafted by our family and shipping within 5 to 7 business days. Here is what is in your cup.';
  const bodyHtml = [
    `<div style="display:inline-block;font-size:12px;font-weight:700;color:${PALETTE.accentSage};border:1px solid ${PALETTE.accentSage};border-radius:999px;padding:5px 12px;margin-bottom:18px;font-family:${TEA_EMAIL_FONT};">Order confirmed</div>`,
    p(`Hi ${firstName || 'there'},`),
    p(`Thank you for your order of <b>SVUTU Steady</b>, the daily ruby tea from The BP Triangle Method. Your payment went through and your order is confirmed.`),
    h2('Your order'),
    teaOrderSummaryHtml(items, amountCents),
    teaShipToHtml(address, name),
    callout({
      kicker: 'When it ships',
      body: `Every pouch is hand crafted and packaged with love by my family, so give us a few days. Your order will ship within <b>5 to 7 business days</b>, and you will get a note the moment it is on its way.`,
    }),
    h2('While your tea travels, here is what is in your cup'),
    p(`Steady is eight whole botanicals, and every one earns its place. Here is what researchers have studied each for, with the study one tap away, the same research we show on the site.`),
    teaFlyerHtml(),
    p(`<a href="${SITE_URL}/tea/#science" style="color:${PALETTE.clay};font-weight:700;text-decoration:none;">See the full science on the site &rarr;</a>`),
    h2('How to brew it'),
    p(`One heaping teaspoon per cup, water just off the boil. Cover and steep 7 to 9 minutes, because hibiscus and hawthorn want the time. Two to three cups a day is the rhythm the studies used. Lovely hot, and excellent iced with a slice of lemon.`),
    callout({
      kicker: 'Your 60 day guarantee',
      body: `Give Steady an honest 60 days, drinking it every day the way the research was run. If you have done that and you are still not glad you did, reply to this email and we will refund your order in full.`,
    }),
    p(`One honest note: if you take heart or blood pressure medication, you do not need to skip Steady. Just let your doctor know you are starting it, keep taking your prescriptions exactly as directed, and keep monitoring your numbers. As they come down, tell your doctor, because your dose may need adjusting. Steady joins your doctor's care, it never replaces it.`),
    p(`Thank you for trusting us with your cup.`),
    p(`Joel Polley, RN, and the family behind SVUTU`),
  ].join('');

  const bodyText = `Hi ${firstName || 'there'},

Thank you for your order of SVUTU Steady, the daily ruby tea from The BP Triangle Method. Your payment went through and your order is confirmed.

YOUR ORDER
${teaOrderLines(items).map((i) => `${i.qty} x ${i.name}`).join('\n')}${typeof amountCents === 'number' && amountCents > 0 ? `\nTotal paid: $${(amountCents / 100).toFixed(2)}` : ''}

WHEN IT SHIPS
Every pouch is hand crafted and packaged with love by my family, so give us a few days. Your order will ship within 5 to 7 business days, and you will get a note the moment it is on its way.

WHILE YOUR TEA TRAVELS, HERE IS WHAT IS IN YOUR CUP
Steady is eight whole botanicals, and every one earns its place. Here is what researchers have studied each for:

${teaFlyerText()}

See the full science: ${SITE_URL}/tea/#science

HOW TO BREW IT
One heaping teaspoon per cup, water just off the boil. Cover and steep 7 to 9 minutes. Two to three cups a day is the rhythm the studies used. Lovely hot, and excellent iced with a slice of lemon.

YOUR 60 DAY GUARANTEE
Give Steady an honest 60 days, drinking it every day the way the research was run. If you have done that and you are still not glad you did, reply to this email and we will refund your order in full.

One honest note: if you take heart or blood pressure medication, you do not need to skip Steady. Just let your doctor know you are starting it, keep taking your prescriptions exactly as directed, and keep monitoring your numbers. As they come down, tell your doctor, because your dose may need adjusting. Steady joins your doctor's care, it never replaces it.

Thank you for trusting us with your cup.
Joel Polley, RN, and the family behind SVUTU`;

  return buildEmail({ preheader, bodyHtml, bodyText, unsubUrl });
}

// Send the tea buyer their confirmation + flyer. Best-effort, never throws.
async function sendTeaConfirmation({ email, firstName, items, amountCents, address, name }) {
  if (!process.env.RESEND_API_KEY) return;
  const unsubToken = signUnsubToken({ email });
  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
  const { html, text } = buildTeaConfirmationEmail({ firstName, items, amountCents, address, name, unsubUrl });
  await getResend().emails.send({
    from: FROM,
    to: String(email).trim(),
    replyTo: REPLY_TO,
    subject: 'Your SVUTU Steady order is confirmed',
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

// Send the buyer's case-review confirmation. Best-effort: a send failure never
// fails the webhook (the Joel alert is the backstop for fulfillment).
async function sendCaseReviewConfirmation({ email, firstName }) {
  const unsubToken = signUnsubToken({ email });
  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
  const { html, text } = buildCaseReviewEmail({ firstName, unsubUrl });
  await getResend().emails.send({
    from: FROM,
    to: String(email).trim(),
    replyTo: REPLY_TO,
    subject: 'Joel has your case (what happens next)',
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

// Alert Joel that a $297 case review came in so he fulfills it manually. Reuses
// the same Joel-notify mechanism as alertUnmappedAmount (Resend email to
// JOEL_NOTIFY_EMAIL, [ACTION] subject). Best-effort, never throws.
async function alertJoelCaseReview({ sessionId, email, name, plan = 'full' }) {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.JOEL_NOTIFY_EMAIL || REPLY_TO;
  const planLine = plan === '3pay'
    ? '3-pay plan (3 monthly payments; the subscription is capped to end after the 3rd charge)'
    : 'paid in full ($297)';
  try {
    await getResend().emails.send({
      from: 'BraveWorks Ops <joel@bpquiz.com>',
      to,
      replyTo: REPLY_TO,
      subject: `[ACTION] New $297 case review to fulfill (${email || 'unknown'})`,
      text: `A buyer purchased "Joel's Eyes On Your Case" ($297). This is fulfilled MANUALLY by Joel.

Buyer:      ${name || '(no name)'} <${email || 'unknown'}>
Payment:    ${planLine}
Stripe session: ${sessionId}

Next step: pull their quiz + corners, review the case, and email them their exact next moves within 2 business days. Their automated confirmation (the "Joel has your case" email) has already gone out, so they are expecting you.`,
    });
  } catch (err) {
    console.error('stripe-webhook: failed to send case-review Joel alert', err.message);
  }
}

// The full case-review workflow: record a bwbp:-namespaced marker (so a retry is
// idempotent at the business level and the buyer record reflects it), bump the
// monthly capacity counter, flag the buyer's drip record, cap a 3-pay
// subscription at 3 cycles, send the buyer confirmation, and alert Joel.
// Returns a result object for the handler. plan: 'full' | '3pay'.
async function processCaseReview(session, plan = 'full') {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const firstName = firstNameOf(customerName);

  if (!customerEmail) {
    console.error('stripe-webhook: case-review session has no customer email', session.id);
    // Still alert Joel so the paid review is never silently dropped.
    await alertJoelCaseReview({ sessionId: session.id, email: null, name: customerName, plan });
    return { action: 'case_review', delivered: false, reason: 'no_email', plan };
  }

  const emailKey = String(customerEmail).trim().toLowerCase();

  // bwbp:-namespaced cohort record for the case-review buyer. Separate key space
  // from the drip state machine (bwbp:drip:) so it never collides with tier
  // delivery, and dedupes a Stripe retry at the business level.
  const reviewKey = `bwbp:casereview:${emailKey}`;
  try {
    const existing = await kv.get(reviewKey);
    if (existing && existing.confirmedAt) {
      return { action: 'case_review', deduplicated: true, customer_email: customerEmail, plan };
    }
    await kv.set(reviewKey, {
      email: emailKey,
      firstName,
      sessionId: session.id,
      confirmedAt: new Date().toISOString(),
      status: 'awaiting_review',
      plan,
    });
  } catch (err) {
    console.warn('stripe-webhook: case-review KV record failed (non-fatal)', err.message);
  }

  // ── Monthly capacity counter (read by api/case-review-slots.js) ──
  // Increments AFTER the dedupe check so a Stripe retry never double-counts a
  // slot. Best-effort: a counter failure never blocks fulfillment.
  try {
    await kv.incr(caseReviewCountKey());
  } catch (err) {
    console.warn('stripe-webhook: case-review slot counter incr failed (non-fatal)', err.message);
  }

  // ── Flag the buyer's drip record (do NOT flip their state) ──
  // A lead who buys the case review stays in state 'lead' (they still have no
  // kit, so the lead education arc still fits), but caseReview:true lets the
  // lead cron drop its selling CTAs for them. Only an EXISTING record is
  // touched; we never create a drip record here (that would enroll someone in
  // an email arc they never opted into).
  try {
    const dripKey = `bwbp:drip:${emailKey}`;
    const drip = await kv.get(dripKey);
    if (drip) {
      await kv.set(dripKey, {
        ...drip,
        caseReview: true,
        caseReviewAt: drip.caseReviewAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('stripe-webhook: case-review drip flag failed (non-fatal)', err.message);
  }

  // ── 3-pay: cap the subscription at 3 cycles ──
  // The 3-pay plan rides a Stripe subscription. Set cancel_at 65 days out so it
  // bills day 0, ~30, ~60 and ends before a 4th charge. GUARDED so only a
  // case-review subscription is ever touched: we re-read the subscription and
  // require the case-review marker on it (or on the session) before writing.
  if (plan === '3pay' && session.subscription) {
    try {
      const stripe = getStripe();
      const subId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const sub = await stripe.subscriptions.retrieve(subId);
      const smd = sub.metadata || {};
      const sessionMd = session.metadata || {};
      const isCaseReviewSub =
        smd.offer === 'case-review' ||
        smd.kind === 'case-review' ||
        sessionMd.offer === 'case-review' ||
        sessionMd.kind === 'case-review';
      if (!isCaseReviewSub) {
        console.warn('stripe-webhook: 3pay session resolved as case-review but subscription lacks the marker, NOT capping', subId);
      } else if (!sub.cancel_at) {
        const cancelAt = Math.floor(Date.now() / 1000) + CASE_REVIEW_3PAY_CANCEL_SECONDS;
        await stripe.subscriptions.update(subId, { cancel_at: cancelAt });
      }
    } catch (err) {
      // Loud log: if this fails the subscription bills PAST 3 payments until
      // capped by hand. The Joel alert below names the plan so he can verify.
      console.error('stripe-webhook: case-review 3pay cancel_at failed (cap the subscription manually)', err.message);
    }
  }

  let delivered = false;
  try {
    await sendCaseReviewConfirmation({ email: customerEmail, firstName });
    delivered = true;
  } catch (err) {
    console.error('stripe-webhook: case-review confirmation email failed (non-fatal)', err.message);
  }

  // Always alert Joel so he fulfills, even if the buyer email failed.
  await alertJoelCaseReview({ sessionId: session.id, email: customerEmail, name: customerName, plan });

  // ── Revenue attribution (PostHog) ── the $297 personal case review. Amount
  // from the session subtotal (falls back to the known 29700 price). For a
  // 3-pay purchase the subtotal is the FIRST installment only; the later two
  // charges bill on the subscription (no checkout.session.completed).
  await capturePurchase({
    email: customerEmail,
    amountCents: session.amount_subtotal ?? session.amount_total ?? 29700,
    tier: 'case_review',
    product: "Joel's Eyes On Your Case",
    source: 'case_review',
    sessionId: session.id,
  });

  return { action: 'case_review', delivered, customer_email: customerEmail, plan };
}

// ─── Difference-priced /welcome UPGRADE handling ──────────────────────
// Resolve the TARGET tier a completed session upgrades the buyer to, by the
// SPECIFIC upgrade price id / metadata (NEVER by amount, see UPGRADE_PRICE_TO_TIER
// above). Returns 'top2' | 'complete' for an upgrade purchase, or null when the
// session is not one of our upgrade SKUs. Checks the cheap session-metadata
// marker first, then expands line items and matches the price id (authoritative).
// Best-effort: never throws.
async function resolveUpgradeTargetTier(session) {
  // 1) Cheap path: the upgrade payment links stamp kind:'upgrade', funnel:
  // 'braveworks-bp', target_tier:<tier> onto the Checkout Session metadata.
  const md = session.metadata || {};
  if (md.kind === 'upgrade' && (md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp')) {
    if (UPGRADE_TARGET_TIERS.has(md.target_tier)) return md.target_tier;
  }
  // 2) Authoritative path: inspect the line items' price id (and its metadata).
  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
      expand: ['data.price'],
    });
    for (const item of items.data || []) {
      const price = item.price || {};
      if (price.id && UPGRADE_PRICE_TO_TIER[price.id]) return UPGRADE_PRICE_TO_TIER[price.id];
      const pmd = price.metadata || {};
      if (pmd.kind === 'upgrade' && UPGRADE_TARGET_TIERS.has(pmd.target_tier)) {
        return pmd.target_tier;
      }
    }
  } catch (err) {
    console.warn('stripe-webhook: upgrade line-item check failed (non-fatal)', err.message);
  }
  return null;
}

// The full upgrade workflow: deliver the TARGET tier's complete content (reuse
// the same buyer delivery email so they get the upgraded bundle + bonuses),
// bump the buyer's drip record paidTier to the target tier (so their BUYER email
// sequence reflects the new tier), and dedupe via a namespaced KV marker so a
// Stripe retry never double-delivers. The buyer's corner + scores come off their
// existing drip record so the upgraded bundle is resolved to THEIR corners.
async function processUpgrade(session, targetTier) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;

  if (!customerEmail) {
    console.error('stripe-webhook: upgrade session has no customer email', session.id);
    return { action: 'upgrade', delivered: false, reason: 'no_email', target_tier: targetTier };
  }

  const emailKey = String(customerEmail).trim().toLowerCase();

  // Namespaced dedupe marker, separate from the drip state machine and the
  // event-id idempotency. Keyed by email + target tier so a corner buyer who
  // later takes a DIFFERENT upgrade (top2 then complete) is not blocked, but a
  // Stripe retry of the SAME upgrade is.
  const upgradeKey = `bwbp:upgrade:${emailKey}:${targetTier}`;
  try {
    const existing = await kv.get(upgradeKey);
    if (existing && existing.deliveredAt) {
      return { action: 'upgrade', deduplicated: true, target_tier: targetTier, customer_email: customerEmail };
    }
  } catch (err) {
    console.warn('stripe-webhook: upgrade dedupe read failed (non-fatal)', err.message);
  }

  // Pull the buyer's corner + scores + name off their drip record, and bump
  // paidTier to the target tier so the BUYER sequence (buyer-cron.js branches on
  // normalizeTier(paidTier)) reflects the upgrade. Mirrors the purchase-path
  // record update; never throws into the webhook.
  let buyerCorner = null;
  let buyerScores = null;
  let buyerFirstName = firstNameOf(customerName);
  try {
    const dripKey = `bwbp:drip:${emailKey}`;
    const existing = await kv.get(dripKey);
    buyerCorner = existing?.corner || null;
    buyerScores = existing?.scores || null;
    if (existing?.firstName) buyerFirstName = existing.firstName;
    if (existing) {
      await kv.set(dripKey, {
        ...existing,
        isPaidCustomer: true,
        paidTier: targetTier,
        purchasedAt: existing.purchasedAt || new Date().toISOString(),
        upgradedAt: new Date().toISOString(),
      });
    } else {
      // Upgraded without a prior drip record (rare). Create a buyer record at the
      // target tier so the sequence + future delivery resolve.
      await kv.set(dripKey, {
        email: emailKey,
        firstName: buyerFirstName,
        enrolledAt: new Date().toISOString(),
        isPaidCustomer: true,
        paidTier: targetTier,
        purchasedAt: new Date().toISOString(),
        upgradedAt: new Date().toISOString(),
        state: 'buyer',
        stateEnteredAt: new Date().toISOString(),
        source: 'stripe-upgrade',
      });
    }
  } catch (err) {
    console.warn('stripe-webhook: upgrade drip update failed (non-fatal)', err.message);
  }

  // Deliver the TARGET tier's full content (upgraded bundle + bonuses), resolved
  // to the buyer's corner(s). Reuses the same delivery email the purchase path
  // sends. Best-effort: a send failure never fails the webhook (the buyer cron is
  // the onboarding backstop).
  let delivered = false;
  try {
    await sendBuyerDelivery({
      email: customerEmail,
      firstName: buyerFirstName,
      tier: targetTier,
      corner: buyerCorner,
      scores: buyerScores,
    });
    delivered = true;
  } catch (err) {
    console.error('stripe-webhook: upgrade delivery email failed (non-fatal)', err.message);
  }

  // ── Revenue attribution (PostHog) ── the difference-priced /welcome upgrade
  // (corner→top2 $20, corner→complete $70, top2→complete $50). Amount is the
  // session subtotal; tier = the TARGET tier the buyer upgraded into.
  await capturePurchase({
    email: customerEmail,
    amountCents: session.amount_subtotal ?? session.amount_total,
    tier: targetTier,
    source: 'upgrade',
    sessionId: session.id,
  });

  // Record the dedupe marker AFTER attempting delivery so a failed send can be
  // retried by Stripe rather than being permanently marked done.
  try {
    await kv.set(upgradeKey, {
      email: emailKey,
      targetTier,
      sessionId: session.id,
      deliveredAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('stripe-webhook: upgrade dedupe write failed (non-fatal)', err.message);
  }

  return { action: 'upgrade', delivered, target_tier: targetTier, customer_email: customerEmail };
}

// Disable Vercel's body parser so we can read the raw body for signature
// verification.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── Tier sale identification (foreign-funnel guard) ──────────────────
// This webhook is registered on a Stripe account SHARED with bpquiz, RestoreHER,
// chinhair, braveworksengine, etc. Every endpoint receives EVERY
// checkout.session.completed on the account, and our tier amounts (2700/4700/
// 9700) collide with those funnels (a RestoreHER or chinhair $97 = 9700). Routing
// a foreign sale by amount would mis-deliver a BP kit to their buyer. So before
// AMOUNT_TO_TIER we REQUIRE a positive braveworks tier match: the specific tier
// price id (authoritative) or the funnel marker (cheap). The $297 case-review and
// the upgrades are recognized separately above by their own price ids.
const TIER_PRICE_IDS = new Set([
  process.env.STRIPE_CORNER_PRICE_ID || 'price_1TlYAFHseZnO3rRZoOCNHviq',
  process.env.STRIPE_CORNER_SALE_PRICE_ID || 'price_1To1kJHseZnO3rRZX7sFvz1M', // $16.99 launch sale (legacy)
  'price_1ToBlWHseZnO3rRZtv4lbw2m', // $17 launch sale
  process.env.STRIPE_TOP2_PRICE_ID || 'price_1TmONNHseZnO3rRZeozMZ3O2',
  process.env.STRIPE_COMPLETE_PRICE_ID || 'price_1TmONOHseZnO3rRZidQTqdAH',
  process.env.STRIPE_COMPLETE_47_PRICE_ID || 'price_1TpqZHHseZnO3rRZWtW0s1L8', // $47 complete (2026-07 ladder)
]);

async function isBraveworksTierSession(session) {
  const md = session.metadata || {};
  if (md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp') return true;
  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10, expand: ['data.price'] });
    for (const item of items.data || []) {
      const price = item.price || {};
      if (price.id && TIER_PRICE_IDS.has(price.id)) return true;
    }
  } catch (err) {
    console.warn('stripe-webhook: tier line-item check failed (non-fatal)', err.message);
  }
  return false;
}

// ─── Per-event workflow ───────────────────────────────────────────────
async function processCheckoutCompleted(event) {
  const session = event.data.object;
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  // Route by amount_subtotal (pre-discount) so promo-code buyers still resolve.
  const amountCents = session.amount_subtotal ?? session.amount_total;

  if (!customerEmail) {
    console.error('stripe-webhook: no customer_details.email on session', session.id);
    return { action: 'skipped', reason: 'no_email' };
  }

  // ── $297 case-review check (BEFORE the amount lookup) ──
  // "Joel's Eyes On Your Case" is recognized by its SPECIFIC price/product id (or
  // funnel marker), never by amount 29700, so it cannot collide with any amount
  // bucket bpquiz owns on this shared Stripe account. Handle it and return early
  // so it never reaches AMOUNT_TO_TIER (where an unmapped 29700 would alert) and
  // never triggers tier (corner/top2/complete) delivery. Covers BOTH plans:
  // 'full' (one-time payment) and '3pay' (subscription-mode session, capped at
  // 3 cycles inside processCaseReview).
  const caseReviewPlan = await resolveCaseReviewPlan(session);
  if (caseReviewPlan) {
    return await processCaseReview(session, caseReviewPlan);
  }

  // ── $97 1:1 call check (BEFORE the amount lookup) ──
  // MUST run before AMOUNT_TO_TIER: the call is 9700 cents, which collides with
  // the legacy $97 complete kit. Recognized by its own price/product id or
  // metadata kind:'call-97'; fulfilled with the Calendly booking email.
  if (await isCall97Session(session)) {
    return await processCall97(session);
  }

  // ── SVUTU tea check (BEFORE the amount lookup AND the foreign guard) ──
  // The $17 sampler is 1700 cents (collides with the kit's corner tier), and
  // tea sessions are NOT braveworks-bp funnel sessions, so without this check
  // a tea sale would be skipped as foreign and never reach the shipping digest.
  if (await isTeaSession(session)) {
    return await processTeaPurchase(session);
  }

  // ── Difference-priced /welcome UPGRADE check (BEFORE the amount lookup) ──
  // An upgrade ("Unlock now to get the rest of the kit") is recognized by its
  // SPECIFIC upgrade price id / metadata, never by amount. This MUST run before
  // AMOUNT_TO_TIER because corner->top2 costs 2000, which collides with the
  // legacy $20 one-click OTO amount. Resolving the target tier here and returning
  // early delivers the upgraded bundle and updates paidTier without ever touching
  // the amount map (where 2000 is unmapped and would alert Joel).
  const upgradeTargetTier = await resolveUpgradeTargetTier(session);
  if (upgradeTargetTier) {
    return await processUpgrade(session, upgradeTargetTier);
  }

  // ── Foreign-funnel guard (shared Stripe account) ──
  // Past this point we route by amount, and our amounts collide with the other
  // funnels on this shared account. REQUIRE a positive braveworks tier match or
  // skip as foreign, so a RestoreHER / chinhair / bpquiz sale is never delivered
  // a BraveWorks BP kit.
  if (!(await isBraveworksTierSession(session))) {
    return { action: 'skipped', reason: 'foreign_funnel', amount: amountCents };
  }

  const tier = AMOUNT_TO_TIER[amountCents];
  if (!tier) {
    // Unmapped amount — buyer paid but we have no delivery mapping. Log loudly
    // AND email Joel so a paid buyer is never silently dropped (mirrors bpquiz).
    console.error('stripe-webhook: unmapped amount, no delivery', session.id, 'amount', amountCents);
    await alertUnmappedAmount({ sessionId: session.id, amountCents, email: customerEmail });
    return { action: 'skipped', reason: 'amount_not_mapped', amount: amountCents };
  }

  // ── State-machine transition (purchase event) ──
  // Move the lead → buyer so the BUYER sequence takes over and the lead
  // sequence stops. Reset stateEnteredAt only when the state actually changes.
  // Capture the buyer's quiz corner + first name so the delivery email can
  // resolve the right entry-corner module.
  let buyerCorner = null;
  let buyerScores = null;
  let buyerFirstName = firstNameOf(customerName);
  try {
    const dripKey = `bwbp:drip:${String(customerEmail).trim().toLowerCase()}`;
    const existing = await kv.get(dripKey);
    // Quiz-SKIPPERS have no drip record (capture-lead fires only from the quiz
    // result gate), so fall back to the corner the buy link stamped on the Stripe
    // session (create-embedded-checkout sets metadata.corner). Without this, a
    // Stress-by-default buyer who skipped the quiz gets the Sodium fallback kit in
    // their delivery email + ZIP even though the /welcome page shows Stress.
    const okCorner = (c) => c === 'stress' || c === 'sugar' || c === 'sodium';
    const sessionCorner = okCorner(session.metadata?.corner) ? session.metadata.corner : null;
    buyerCorner = existing?.corner || sessionCorner;
    buyerScores = existing?.scores || null; // resolves the #2 corner for top2 delivery
    if (existing?.firstName) buyerFirstName = existing.firstName;
    const newState = purchaseToState(tier);
    const stateFields = {
      state: newState,
      stateEnteredAt:
        existing && existing.state === newState && existing.stateEnteredAt
          ? existing.stateEnteredAt
          : new Date().toISOString(),
    };
    if (existing) {
      await kv.set(dripKey, {
        ...existing,
        corner: buyerCorner,
        isPaidCustomer: true,
        paidTier: tier,
        purchasedAt: existing.purchasedAt || new Date().toISOString(),
        ...stateFields,
      });
    } else {
      // Bought without ever taking the quiz — fresh buyer record. Persist the
      // session corner so the delivery email AND any later upgrade resolve it.
      await kv.set(dripKey, {
        email: String(customerEmail).trim().toLowerCase(),
        firstName: firstNameOf(customerName),
        corner: buyerCorner,
        enrolledAt: new Date().toISOString(),
        isPaidCustomer: true,
        paidTier: tier,
        purchasedAt: new Date().toISOString(),
        source: 'stripe-direct',
        ...stateFields,
      });
    }
  } catch (err) {
    console.warn('stripe-webhook: buyer state transition failed (non-fatal)', err.message);
  }

  // ── At-purchase delivery email (Day 0 of the buyer journey) ──
  // $27 corner → the reader's #1 corner set; $47 top2 → their two loudest
  // corner sets + Skool trial; $97 complete → all three sets + Freedom Finale +
  // Skool trial. The buyer's scores resolve the #2 corner for top2. Best-effort:
  // a send failure is logged but never fails the webhook, and the buyer cron
  // (_buyer-emails.js) is the backstop for onboarding.
  let delivered = false;
  try {
    await sendBuyerDelivery({
      email: customerEmail,
      firstName: buyerFirstName,
      tier,
      corner: buyerCorner,
      scores: buyerScores,
    });
    delivered = true;
  } catch (err) {
    console.error('stripe-webhook: buyer delivery email failed (non-fatal)', err.message);
  }

  // ── Revenue attribution (PostHog) ──
  // Authoritative `purchase` event, keyed by buyer email so it attaches to the
  // PostHog person the client identify(email) created at the result-page gate.
  // Best-effort: capturePurchase swallows its own errors and never throws.
  await capturePurchase({
    email: customerEmail,
    amountCents,
    tier,
    source: 'checkout',
    sessionId: session.id,
  });

  return { action: 'buyer_recorded', tier, delivered, customer_email: customerEmail };
}

// ─── Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('stripe-webhook: STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  const rawBody = await readRawBody(req);

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('stripe-webhook: signature verification failed:', err.message);
    return res.status(401).json({ error: `Webhook Error: ${err.message}` });
  }

  // Only act on completed purchases; ack everything else with 200.
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ ok: true, ignored: event.type });
  }

  // Idempotency — record each handled event id (24h TTL). Stripe retries on
  // network blips / our 5xx / dashboard "Resend"; same id twice → skip.
  try {
    // bwbp-namespaced so the legacy /api/stripe-webhook endpoint (own dedupe
    // key `stripe-evt:*`) never claims an event this handler still needs.
    const kvKey = `bwbp:stripe-evt:${event.id}`;
    const seen = await kv.get(kvKey);
    if (seen) {
      return res.status(200).json({ ok: true, deduplicated: true, eventId: event.id });
    }
    await kv.set(kvKey, { processedAt: new Date().toISOString() }, { ex: 86400 });
  } catch (err) {
    console.warn('stripe-webhook: KV idempotency check failed (continuing):', err.message);
  }

  try {
    const result = await processCheckoutCompleted(event);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    // Return 200 anyway — a duplicate delivery is worse than a missed log line.
    console.error('stripe-webhook: processing failed', err.stack || err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
