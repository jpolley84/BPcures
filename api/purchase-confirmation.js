import { Resend } from 'resend';
import { looksLikeValidEmail as sharedLooksLikeValidEmail } from './_email-validation.js';

// 2026-05-13: dropped `Stripe` + `kv` imports — they were only used by the
// dead webhook handler that's been removed (verified via Stripe API: the
// live account routes all checkout.session.completed events to
// /api/stripe-webhook, not here). If a future change re-adds a handler
// here, restore those imports + the idempotency pattern from
// api/stripe-webhook.js.

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
// Resend requires a verified sender domain. gmail.com is NOT verified —
// bpquiz.com IS. Replies still route to braveworksrn@gmail.com via REPLY_TO.
const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

const DOWNLOADS = {
  bp_kit_zip: {
    label: 'The BP Reset Kit, 8 PDFs (zip)',
    file: 'bp-reset-kit.zip',
  },
  bp_day1: {
    label: 'The 10-Day BP Reset, Day 1 &amp; Full Challenge',
    file: 'bp-reset-day1-and-beyond.pdf',
  },
  cortisol_challenge: {
    label: 'The 10-Day Cortisol Cure, Full Protocol',
    file: 'cortisol-cure-10-day.pdf',
  },
  blood_sugar_challenge: {
    label: 'The 10-Day Blood Sugar Reset, Full Protocol',
    file: 'blood-sugar-reset-10-day.pdf',
  },
  cookbook: {
    label: 'Cook For Life, Plant-Based Cookbook',
    file: 'cook-for-life-cookbook.pdf',
  },
  overmedicated_boomers: {
    label: 'The Overmedicated Boomer (bonus ebook)',
    file: 'overmedicated-boomers.pdf',
  },
  vip_book: {
    label: 'The BP Reset Book (digital, complete deep-dive guide)',
    file: 'bp-reset-book.pdf',
  },
  // 2026-05-20: $12.99 post-purchase ebook upsell (mirror of bpcures'
  // $17+$12 mechanic). Source: pipeline/ready/blood-pressure-cures/interior.pdf
  // copied into public/downloads/bp-cures-10-day-reset.pdf.
  // 2026-06-09 compliance: "Cures" banned in visible copy — label renamed,
  // file path unchanged.
  bp_cures_book: {
    label: 'The 10-Day Nurse\'s Reset Companion (full ebook)',
    file: 'bp-cures-10-day-reset.pdf',
  },
};

// SKOOL_URL = The Weekly Reset, the paid braveworksrn group ($27/mo, first
// 7 days free, live group coaching). 2026-06-09 rebuild: this is the one
// canonical community CTA for kit buyers (the old free-group + DM-Joel
// 2-step is retired from this email).
const SKOOL_URL = 'https://www.skool.com/braveworksrn/about';
// The FREE ~1,200-member community. Still used by the 90-Day Sprint
// coaching block (Sprint clients join free, then DM Joel for VIP access).
const FREE_SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

// ─────────────────────────────────────────────────────────────────────────
// VERIFIED CATEGORY-AWARE — do not flag as "BP-only for all tiers"
//
// 2026-05-11 daily review re-audit: this file IS already category-aware
// and has been since at least the 2026-05-09 funnel-fix pass. Routing chain:
//   1. stripe-webhook.js receives checkout.session.completed
//   2. amount_subtotal → AMOUNT_TO_TIER → kitTier (default '1' = BP starter)
//   3. stripe-webhook.js lines 502-521 refine kitTier=1 →
//        '1-cortisol' or '1-blood-sugar' by inspecting line-item product
//        names ("cortisol" / "blood sugar" / "glucose" / "diabetes")
//   4. sendPurchaseConfirmation(tier=refined) → renderPurchaseEmail
//        reads TIER_CONFIG[tier] for product name + subject + downloads
//
// Separate TIER_CONFIG entries exist for: '1', '1-cortisol', '1-blood-sugar',
// '2', 'vip'. Each has its own `product`, `subject`, `downloads`, and
// `upgradeUrl`. A cortisol $17 buyer correctly receives the cortisol-branded
// email with the cortisol PDFs and the cortisol upgrade link.
//
// If an audit flags "purchase-confirmation hardcodes BP for all tiers", the
// audit is stale. Verify by running a $17 test purchase on the cortisol
// product and inspecting the resulting Resend email.
// ─────────────────────────────────────────────────────────────────────────

export const TIER_CONFIG = {
  // 2026-06-09 panel rebuild (tier 1 + variants): subject locked to the
  // drip's Day-0 spam-rescue P.S. quote (must match verbatim); hero CTA is
  // The Weekly Reset ($27/mo Skool, 7 days free) via includesWeeklyResetHero;
  // stale discovery-call block killed; $47 OTO demoted to honest optional
  // add-on (no fake urgency).
  1: {
    product: 'The 10-Day Nurse\'s Reset, Starter Protocol Kit',
    subject: 'Joel here. Your BP Reset Kit is inside (download links below)',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    includesWeeklyResetHero: true,
    // 2026-05-10 funnel-fix: was pointing to deactivated plink
    // 9B63cv8k3b5Y63h8VrfnO0z (Complete Book Bundle $27 — pulled from Stripe in
    // last week's streamline pass). Repointed to the canonical $47 BP Reset
    // Kit (cNieVdeIrca2fDR1sZfnO0k) — same category, the natural ladder rung.
    upgradeUrl: 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k',
    upgradeLabel: 'Want the complete clinical kit? (standard add-on)',
    upgradeDesc: 'Optional. The complete clinical kit is $47, its standard one-time price (the discounted one-click version is only offered on the checkout page right after purchase). It includes Joel\'s full 8-PDF stack: hypertension guide, supplement protocol, meal plan, BP tracker, doctor-conversation templates, quick-start, and cheat sheet. Totally optional. What you already downloaded stands on its own.',
    upgradeCta: 'Add the complete kit ($47) →',
  },
  '1-cortisol': {
    product: 'The Cortisol Healing Blueprint, Starter Kit',
    subject: 'You\'re in. Your 10-Day Cortisol Cure + 30-day challenge bonuses inside',
    downloads: [DOWNLOADS.cortisol_challenge, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    includesWeeklyResetHero: true,
    // 2026-05-10 funnel-fix: was pointing to deactivated plink. Repointed to
    // the canonical $47 Cortisol Reset Kit (3cIbJ1asbca2fDR2x3fnO0m) — same
    // category, the natural ladder rung.
    upgradeUrl: 'https://buy.stripe.com/3cIbJ1asbca2fDR2x3fnO0m',
    upgradeLabel: 'Want the complete Cortisol Reset Kit? (one-time add-on)',
    upgradeDesc: 'Optional. If you want the complete kit, you can add it once for $47. It includes Joel\'s full cortisol protocol PDFs: adrenal-recovery guide, herb-and-supplement stack, sleep-and-stress reset, and daily tracker. Totally optional. What you already downloaded stands on its own.',
    upgradeCta: 'Add the Cortisol Reset Kit ($47) →',
  },
  '1-blood-sugar': {
    product: 'Blood Sugar Cures, Starter Kit',
    subject: 'You\'re in. Your 10-Day Blood Sugar Reset + 30-day challenge bonuses inside',
    downloads: [DOWNLOADS.blood_sugar_challenge, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    includesWeeklyResetHero: true,
    // 2026-05-10 funnel-fix: was pointing to deactivated plink. Repointed to
    // the canonical $47 Blood Sugar Reset Kit (3cI28rdEn8XQfDRdbHfnO0o).
    upgradeUrl: 'https://buy.stripe.com/3cI28rdEn8XQfDRdbHfnO0o',
    upgradeLabel: 'Want the complete Blood Sugar Reset Kit? (one-time add-on)',
    upgradeDesc: 'Optional. If you want the complete kit, you can add it once for $47. It includes Joel\'s full glucose-control protocol PDFs: insulin-resistance guide, herb-and-supplement stack, meal-timing plan, and glucose tracker. Totally optional. What you already downloaded stands on its own.',
    upgradeCta: 'Add the Blood Sugar Reset Kit ($47) →',
  },
  // DEPRECATED 2026-05-09 streamline pass: the $12 Pressure Triangle Stack
  // bump was retired (panel: pre-checkout decision-points hurt conversion).
  // Kept in TIER_CONFIG so any in-flight $29 charge from before the cut
  // still delivers properly. No new sales should hit this — frontend
  // checkbox is hidden in QuizPage.jsx.
  '1+pt-stack': {
    product: 'The 10-Day Nurse\'s Reset + Pressure Triangle Stack (legacy bump)',
    subject: 'You\'re in. Your BP kit + Pressure Triangle Stack (4 bonus books) inside',
    downloads: [
      DOWNLOADS.bp_day1,
      DOWNLOADS.overmedicated_boomers,
      DOWNLOADS.cookbook,
      DOWNLOADS.cortisol_challenge,
      DOWNLOADS.blood_sugar_challenge,
    ],
    includesCoaching: false,
    includesChallenge: true,
    upgradeUrl: 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k',
    upgradeLabel: 'Upgrade to The BP Reset Kit ($47), the complete clinical system',
    upgradeDesc: 'You have the starter and the bonus library. The full BP Reset Kit adds Joel\'s 8-PDF clinical kit (hypertension guide, supplement protocol, meal plan, BP tracker, doctor templates, quick-start, cheat sheet). One-time price.',
    upgradeCta: 'Upgrade to BP Reset Kit ($47) →',
  },
  // 2026-05-20: BP Cures ebook upsell ($12.99 post-purchase, between Kit
  // and Reset Kit). Standalone deliverable — full 10-day reset PDF with
  // master protocol + herbs + checklists. Buyer already owns the Kit so
  // upgradeUrl points to Reset Kit (the natural next rung).
  // 2026-06-09 compliance: "Cures" is banned in visible copy — product +
  // subject renamed to the Companion framing. File path unchanged.
  'bp-cure-book': {
    product: 'The 10-Day Nurse\'s Reset Companion',
    subject: 'Your book is ready. The 10-Day Nurse\'s Reset Companion, full PDF inside',
    downloads: [DOWNLOADS.bp_cures_book],
    includesCoaching: false,
    includesChallenge: false,
    upgradeUrl: 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k',
    upgradeLabel: 'Add The BP Reset Kit ($47), the 8-PDF clinical stack',
    upgradeDesc: 'You now have the master document. The full BP Reset Kit adds Joel\'s 8-PDF clinical kit (hypertension guide, supplement protocol, meal plan, BP tracker, doctor templates, quick-start, cheat sheet). One-time price.',
    upgradeCta: 'Add the BP Reset Kit ($47) →',
  },
  2: {
    product: 'The BP Reset Kit',
    subject: 'Your BP Reset Kit is ready, all downloads inside',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    // 2026-06-09 v2 canon reconcile: a $47 kit buyer's next rung is the
    // $297 30-Day Personalized SPRINT. As a BUYER they get the $280
    // kit-credit Sprint link (7sY9ATe), not the cold flat-$297 link.
    // (Retired the afternoon "$297 Group" fork link dRm5kD.)
    upgradeUrl: 'https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P',
    upgradeLabel: 'Next step: the 30-Day Personalized Sprint ($280 with your kit credit)',
    upgradeDesc: 'You have the full kit. The 30-Day Sprint is where Joel reads YOUR numbers, YOUR meds, and builds you a personalized 30-day protocol, with live weekly group coaching (Wednesdays 7 PM ET) and daily accountability. Your kit counts as credit, so it is $280, not $297. Only 5 spots a month.',
    upgradeCta: 'Start the 30-Day Sprint ($280) →',
  },
  // DEPRECATED 2026-05-09 streamline pass — same reason as 1+pt-stack.
  // Kept for in-flight buyers; no new sales possible.
  '2+pt-stack': {
    product: 'BP Reset Kit + Pressure Triangle Stack',
    subject: 'Your BP Reset Kit + the full Pressure Triangle Stack inside',
    downloads: [
      DOWNLOADS.bp_kit_zip,
      DOWNLOADS.bp_day1,
      DOWNLOADS.cookbook,
      DOWNLOADS.cortisol_challenge,
      DOWNLOADS.blood_sugar_challenge,
    ],
    includesCoaching: false,
    includesChallenge: true,
    // 2026-06-09 v2 canon reconcile: $97 Challenge retired; next rung is the
    // $297 30-Day Personalized SPRINT at the $280 buyer kit-credit link.
    upgradeUrl: 'https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P',
    upgradeLabel: 'Next step: the 30-Day Personalized Sprint ($280 with your kit credit)',
    upgradeDesc: 'You already have the Kit + the Pressure Triangle PDFs. The 30-Day Sprint is where Joel looks at YOUR numbers, YOUR meds, and YOUR protocol: live weekly group coaching, daily accountability, and a personalized 30-day plan built with you. Your kit counts as credit, so it is $280. Only 5 spots a month.',
    upgradeCta: 'Start the 30-Day Sprint ($280) →',
  },
  // 2026-05-09 RESTRUCTURE: vip slot ($97 = 9700) is now the canonical
  // "30-Day BP Triangle Challenge + Skool" tier. Replaces the prior
  // standalone VIP product. Delivers the FULL BraveWorks bonus stack
  // (every BP/cortisol/BS PDF) + Skool access + weekly group coaching.
  // Upgrade path: $1,297 1:1 application at /1on1 (Apply, no direct buy).
  vip: {
    product: '30-Day BP Triangle Challenge + Skool',
    subject: 'You\'re in. Your BP Triangle Challenge + full bonus stack inside',
    downloads: [
      DOWNLOADS.bp_kit_zip,
      DOWNLOADS.vip_book,
      DOWNLOADS.bp_day1,
      DOWNLOADS.cookbook,
      DOWNLOADS.cortisol_challenge,
      DOWNLOADS.blood_sugar_challenge,
      DOWNLOADS.overmedicated_boomers,
    ],
    // Coaching for $97 BP Triangle Challenge happens entirely in Skool —
    // the challengeBlock above contains a 2-step Skool join + DM-Joel-
    // for-VIP-access flow. No separate Mondays-Zoom coaching panel; that
    // was the prior VIP product. Setting includesCoaching:false to skip
    // the redundant coaching block.
    includesCoaching: false,
    includesChallenge: true,
    coachingFlavor: 'vip',
    upgradeUrl: `${SITE_URL}/1on1`,
    upgradeLabel: 'Want 1:1 with Joel? Apply for the BP Triangle Premium ($1,297, application-gated)',
    upgradeDesc: 'For people on 4+ medications who need direct deprescribing support, 90 days of 1:1 work with Joel, weekly check-ins, full medication picture review, plan designed with your prescriber. Application-gated; Joel reads each one personally.',
    upgradeCta: 'Apply for 1:1 with Joel →',
  },
  // DEPRECATED 2026-05-09: $397 / $297 Premium tiers retired in funnel
  // restructure (canonical-ladder.md). Stripe links deactivated. Kept in
  // TIER_CONFIG only for historical webhook replay against legacy charges.
  // No new sales should hit this — if AMOUNT_TO_TIER 29700/39700 fires,
  // it's an in-flight buyer who pre-paid before deactivation.
  3: {
    product: 'Premium Protocol + 30-Day Challenge (legacy)',
    subject: 'Your 30-Day Challenge is confirmed, downloads + bonus stack inside',
    downloads: [
      DOWNLOADS.bp_kit_zip,
      DOWNLOADS.vip_book,
      DOWNLOADS.bp_day1,
      DOWNLOADS.cookbook,
      DOWNLOADS.cortisol_challenge,
      DOWNLOADS.blood_sugar_challenge,
      DOWNLOADS.overmedicated_boomers,
    ],
    includesCoaching: true,
    includesChallenge: true,
    coachingFlavor: 'premium',
    upgradeUrl: `${SITE_URL}/1on1`,
    upgradeLabel: 'Want 1:1 with Joel? Apply for the BP Triangle Premium 1:1',
    upgradeDesc: 'Application-gated 90-day 1:1 program. $1,297 single-pay. Apply at bpquiz.com/1on1.',
    upgradeCta: 'Apply for 1:1 →',
  },
  // 2026-05-15: Coaching tier — the 90-Day BP Triangle Freedom Sprint.
  // Two price points: $1,997 founding cohort + $6,997 regular. Application-
  // only via /coaching; buyer pays via Stripe invoice that Joel sends
  // after the fit call. Webhook fires this confirmation as a TIME-BUYER
  // — Joel still personally onboards within 24h with Calendly + kit
  // shipment + program schedule. No PDF downloads here — coaching is
  // 1:1 and the materials are custom.
  coaching: {
    product: 'BP Triangle Freedom Sprint, 90-Day Group Coaching',
    subject: "You're in the Sprint. Week 1 starts now",
    downloads: [], // intentional — group coaching, no kit PDFs
    includesCoaching: true,
    coachingFlavor: 'sprint',  // triggers Sprint-specific render block
    includesChallenge: false,
    upgradeUrl: 'https://bpquiz.com',
    upgradeLabel: 'Take the free BP quiz',
    upgradeDesc: 'While I set up your 1:1 scheduling, take the free BP quiz so you walk in knowing your loudest Pressure and where to start. Have your home BP log, prescription list, supplements, and any recent labs handy.',
    upgradeCta: 'Take the free BP quiz →',
  },

  // 2026-05-18: BP Triangle Diagnostic Session — the $297 mid-tier bridge
  // between $17 Kit and $1,997 Sprint, launched after the May 17 founding-
  // cohort post-mortem showed 0 applications from a $17→$1,997 jump.
  //
  // A single 60-min Zoom with Joel where he writes a custom 30-day protocol.
  // No downloads — the value is the LIVE call + the 30-day email-coaching
  // follow-up window. Buyer is enrolled in the 'diagnostic-prospect' drip
  // cohort by stripe-webhook.js — a separate 7-email sequence over 14 days
  // that warms them toward the Sprint upsell (Sprint price after $297
  // credit = $1,700; only mentioned inside that private email sequence,
  // never on the public /coaching page).
  //
  // Two AMOUNT_TO_TIER entries hit this tier:
  //   - 29700 ($297 standard)
  //   - 28000 ($280 kit-credit variant — for $17 Kit buyers via the
  //            Day 10/14/17 buyer-drip upsell emails)
  // 2026-06-09: Stripe product renamed "30-Day Personalized Sprint (4 Group
  // Coaching Sessions Included)". Welcome reframed to the two-step start:
  // book the kickoff call (Calendly env var, unchanged mechanism) + join the
  // group at skool.com/braveworksrn/about where the 4 included live sessions
  // happen.
  diagnostic: {
    product: '30-Day Personalized Sprint — personalized plan + 4 group coaching sessions',
    subject: 'Your 30-Day Personalized Sprint is paid. Two steps to start',
    downloads: [], // intentional — the Sprint itself is the deliverable
    includesCoaching: false,
    includesChallenge: false,
    upgradeUrl: process.env.VITE_CALENDLY_DIAGNOSTIC_URL || 'https://bpquiz.com',
    upgradeLabel: 'Step 1: Book your kickoff call',
    upgradeDesc: 'Pick a time on Joel\'s calendar. On that call he takes your full picture: your home BP log, your meds, your supplements, your story. Then he writes your personalized 30-day plan and walks you through it day by day. Step 2: Join the group at <a href="https://www.skool.com/braveworksrn/about" style="color:#B85A36;">skool.com/braveworksrn/about</a>. Your 4 live group coaching sessions a month are included with the Sprint; Joel will upgrade your access when you join.',
    upgradeCta: 'Book my kickoff call →',
  },

  // 2026-06-09 evening (v2 canon reconcile): RETIRED the 'group-30' fork.
  // It was an afternoon duplicate of the $297 rung wearing a different link
  // (dRm5kD…) and a different welcome. The settled canon is ONE $297 product:
  // the 'diagnostic' tier above, renamed "30-Day Personalized Sprint". All
  // $297 surfaces (/coaching flat 00weVdd, buyer $280 credit 7sY9ATe) map to
  // 29700/28000 → 'diagnostic'. The group-30 metadata route was removed from
  // stripe-webhook.js and the dRm5kD link deactivated in Stripe.
};

// Map Stripe amount_total (cents) → tier key
//
// 2026-05-09 STREAMLINE PASS: cut from 11 amount entries to 5 active tiers
// per panel consensus (each additional offer = ~30% conversion drop per
// Kennedy; future-self version of this op has 5 SKUs not 11 per Hardy).
//
// Active ladder: $17 → $30 OTO → $47 → $97 → $1,297 (application).
// Legacy entries kept ONLY for in-flight buyers; no frontend path.
//
// tier=1 is the default starter (BP-flavored). stripe-webhook.js refines
// to '1-cortisol' / '1-blood-sugar' by inspecting line item product name.
export const AMOUNT_TO_TIER = {
  // ── Active tiers (canonical) ────────────────────────────────────────
  1700: 1,        // $17 starter (BP / Cortisol / Blood Sugar)
  3000: 2,        // $30 BP Reset Kit OTO (post-checkout upgrade from $17)
  4700: 2,        // $47 BP Reset Kit (standalone)
  9700: 'vip',    // $97 BP Triangle Challenge + Skool (canonical post-restructure)

  // ── 2026-05-15: Coaching tier (90-Day BP Triangle Freedom Sprint) ──
  // Application-only via /coaching; Joel sends a Stripe invoice after
  // the fit call. These amounts MUST be mapped or the webhook silently
  // drops the buyer with no confirmation email. (Wakita's $1,997 payment
  // on 2026-05-13 hit this gap — manual onboarding fixed her case;
  // these entries prevent the next one.)
  199700: 'coaching',  // founding cohort ($1,997)
  699700: 'coaching',  // regular price  ($6,997)
  // 2026-06-09: these two Sprint variants are ACTIVELY SOLD in the live
  // lead-drip (_tier-lead-emails.js, "3 payments of $697") and diagnostic-
  // drip ("$1,700 with your diagnostic credit") — both amounts were
  // unmapped, so a buyer paid and got NO welcome (the May $12-bug class).
  69700: 'coaching',   // Sprint 3-pay — first $697 payment (subscription)
  170000: 'coaching',  // Sprint $1,700 diagnostic-credit variant

  // ── 2026-05-18: BP Triangle Diagnostic Session ($297 mid-tier) ──────
  // Bridges the $17 Kit → $1,997 Sprint jump. Two prices:
  //   29700 — standard $297 (sold publicly via /coaching)
  //   28000 — $280 kit-credit variant (sold only via Day 10/14/17
  //           buyer-drip upsell emails to existing $17 Kit buyers)
  // Both map to the 'diagnostic' tier so they get the same welcome
  // email + Calendly link + diagnostic-prospect drip enrollment.
  29700: 'diagnostic',
  28000: 'diagnostic',

  // ── 2026-05-20: BP Cures ebook upsell ($12.99 post-purchase) ────────
  // Inserted between $17 Kit and $47 Reset Kit upsell. Mirror of bpcures'
  // converter. Stripe price_1TNGMuHseZnO3rRZSIMPnPaO, Payment Link
  // plink_1TNGMvHseZnO3rRZlOi4zbxG, reactivated 2026-05-20.
  1299: 'bp-cure-book',
  // 2026-06-01: bpcures.com sells the SAME book via its own "$17+$12"
  // mechanic at a flat $12.00 (amount_subtotal 1200) — distinct price from
  // bpquiz's $12.99 upsell above. bpcures shares this one Stripe account +
  // webhook, and is NOT a FOREIGN_FUNNEL, so its charges route here. 1200
  // was unmapped → every $12 buyer paid and got NO welcome email (each one
  // fired an [ALERT] "Unmapped Stripe amount: $12.00"). Same deliverable
  // (bp-cures-10-day-reset.pdf) → same tier. ~17 buyers affected in May;
  // backfilled manually via /api/test-purchase-email.
  1200: 'bp-cure-book',

  // ── Legacy / in-flight only (no active payment links) ───────────────
  // Kept so any webhook replay against historical charges still delivers.
  // Frontend has no path to these; buyer can only land here via a saved
  // link from before the 2026-05-09 cleanup.
  2900: '1+pt-stack', // $17 + $12 Pressure Triangle Stack bump (cut 2026-05-09)
  5900: '2+pt-stack', // $47 + $12 Pressure Triangle Stack bump (cut 2026-05-09)
  // 29700 reclaimed 2026-05-18 → diagnostic (was legacy Premium tier 3)
  39700: 3,          // $397 legacy Premium (deactivated 2026-05-09 Phase A.2)
};

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function renderDownloadRow(d) {
  const url = `${SITE_URL}/downloads/${d.file}`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;background:#F5F1E8;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:8px;">${d.label}</div>
        <a href="${url}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Download PDF →
        </a>
      </td></tr>
    </table>
  `;
}

export function renderPurchaseEmail({ name, tier, apologyMode }) {
  const config = TIER_CONFIG[tier];
  const firstName = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const downloadRows = config.downloads.map(renderDownloadRow).join('');

  // Apology banner — set when this is a backfill resend for a buyer whose
  // original webhook silently dropped the welcome email. We acknowledge
  // the delay and frame the upgrade (full BP Reset Kit + Pressure Triangle
  // Stack) as a make-good, not a bonus.
  const apologyBanner = apologyMode ? `
    <tr><td style="padding:18px 28px 0;">
      <div style="background:#FEF2EC;border:2px solid #B85A36;border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:8px;">My apology</div>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 8px;">
          Your purchase confirmation didn't deliver when it should have. That's on me. Our system had a glitch and the welcome email went into the void instead of your inbox.
        </p>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">
          To make it right: I've upgraded everyone affected to the <strong>full BP Reset Kit + Pressure Triangle Stack</strong>, 5 PDFs total, at no extra cost. Everything is below.
        </p>
      </div>
    </td></tr>
  ` : '';

  // 2026-06-09 rebuild (panel-approved): the med-elimination refund guarantee
  // is DELETED for all tiers (FTC risk: refund conditioned on a medication-
  // reduction outcome = implied efficacy claim). The 2-step "join free Skool
  // + DM Joel for VIP" flow is replaced with the one-step Weekly Reset join.
  // The "one email a day for 30 days" promise is corrected to the honest
  // arc: ~10 short teaching emails over three weeks. Tiers with the Weekly
  // Reset hero (tier 1 + variants) skip the in-block Skool button so the
  // email keeps exactly one hero CTA.
  const challengeBlock = config.includesChallenge ? `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#4A6741;border-radius:14px;">
        <tr><td style="padding:24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:16px;">Included with your kit</div>

          <div>
            <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Your teaching emails start tomorrow</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Starting tomorrow, I will send you a short teaching email most days for the next three weeks. About ten in all. These are not sales emails. Each one teaches you the next piece of the protocol: which herb, which meal, the timing, and why. Open them. That is where the real change happens.
            </p>
          </div>
          ${config.includesWeeklyResetHero ? '' : `
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:10px;font-weight:500;">Your community access, one step</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 12px;">
              Join The Weekly Reset, live group coaching with me inside the BraveWorks community on Skool. Bring your numbers, your med list, and your questions to the next live session. Your first 7 days are free. Not for you? Cancel inside the first 7 days and pay nothing.
            </p>
            <a href="${SKOOL_URL}" style="display:inline-block;background:#FFFFFF;color:#4A6741;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Join The Weekly Reset &rarr;
            </a>
          </div>`}
        </td></tr>
      </table>
    </td></tr>
  ` : '';

  // 2026-06-09 rebuild: the stale discovery-call block ("one-on-one calls
  // are paused", false post-relaunch) is gone. Its slot now carries the one
  // hero CTA for $17 buyers: The Weekly Reset ($27/mo Skool group, first 7
  // days free), with a single attributed testimonial above it and the quiet
  // $280 Sprint step-up below it.
  const testimonialBlock = config.includesWeeklyResetHero ? `
    <tr><td style="padding:6px 28px 18px;">
      <div style="background:#F5F1E8;border-radius:12px;padding:18px 20px;">
        <p style="font-size:13px;color:#5A5A5A;margin:0 0 8px;">One note from a reader, in her words:</p>
        <p style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#2C3E50;font-style:italic;margin:0 0 8px;">
          &ldquo;Six weeks in, my doctor and I were able to step me down off one of my two blood pressure pills. I never thought I would see that number on my monitor again.&rdquo;
        </p>
        <p style="font-size:13px;font-weight:600;color:#2C3E50;margin:0 0 10px;">Janice J., Michigan</p>
        <p style="font-size:12px;line-height:1.55;color:#6A6A6A;margin:0;">
          Results not typical. Most readers see modest results or none. But the readers who actually do the work see modest to excellent results. Any change to medication was made with her own doctor, never on her own.
        </p>
      </div>
    </td></tr>
  ` : '';

  const weeklyResetBlock = config.includesWeeklyResetHero ? `
    <tr><td style="padding:6px 28px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5E5;border:2px solid #B85A36;border-radius:14px;">
        <tr><td style="padding:24px;">
          <div style="font-family:Georgia,serif;font-size:20px;line-height:1.35;color:#2C3E50;margin-bottom:10px;font-weight:500;">Your next step. The Weekly Reset, live group coaching with me.</div>
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 12px;">
            The kit shows you what to do. If you want me walking with you while you do it, this is for you. Every week I go live with our group. You bring your numbers, your med list, your questions. I walk you through what to do next, in plain language, on camera. In your first month that is 4 live sessions with me, plus my full ebook library and a group of people doing exactly what you are doing.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 14px;">
            It runs inside our BraveWorks community on Skool. It is $27 a month, and your first 7 days are free, so your first session costs you nothing. Stay if it helps. Leave anytime. Not for you? Cancel inside the first 7 days and pay nothing.
          </p>
          <a href="${SKOOL_URL}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            Start free, join the next live session &rarr;
          </a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 28px 18px;">
      <p style="font-size:13px;line-height:1.6;color:#5A5A5A;margin:8px 0 0;">
        Prefer it built with you, not on your own? My 30-Day Personalized Sprint is the 4 live sessions plus a day-by-day plan I write for your numbers and walk you through. It is education and coaching, alongside your doctor, never instead of your doctor. Your $17 kit purchase applies as a credit, so you pay $280, not $297.
        <a href="https://buy.stripe.com/7sY9ATeIra1Uajx9ZvfnO0P" style="color:#B85A36;font-weight:600;">See the Personalized Sprint &rarr;</a>
      </p>
    </td></tr>
  ` : '';

  // Soft P.S. for $17 buyers only: Barbara O'Neill live event FYI for women
  // over 40. No button, no price, just the link.
  const psBlock = config.includesWeeklyResetHero ? `
      <tr><td style="padding:0 28px 18px;">
        <p style="font-size:13px;color:#5A5A5A;line-height:1.6;margin:0;font-style:italic;">
          P.S. If you are a woman over 40 and hormones, midlife weight, or energy are part of your picture, there is a live in-person event with Barbara O'Neill on June 24-25 in Louisville you may want on your radar. No pressure, just passing it along. Details: <a href="https://restoreherhormones.com" style="color:#B85A36;">restoreherhormones.com</a>
        </p>
      </td></tr>
  ` : '';

  // Coaching block content varies by tier flavor:
  //   'vip'      → weekly group coaching only (Mondays 10pm EST)
  //   'premium'  → Barbara O'Neill LIVE + group coaching
  //   'sprint'   → 90-Day 1:1 Sprint kickoff (Joel + Annie, weekly Zoom,
  //                daily WhatsApp, Skool VIP, partner inclusion)
  let coachingBlock = '';
  if (config.includesCoaching && config.coachingFlavor === 'sprint') {
    coachingBlock = `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#3F5A3C;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:18px;">Your 90-Day Sprint. Week 1 starts now</div>

          <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Step 1. Take the free BP quiz, then I'll set your kickoff</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0 0 12px;">
              Start with the free BP quiz so we both know your loudest Pressure going in. I personally schedule your 60-minute kickoff and full lab review once you're in (watch for my text and welcome email). Have your home BP log, prescription list, supplements, and any labs from the last year handy.
            </p>
            <a href="https://bpquiz.com" style="display:inline-block;background:#FFFFFF;color:#3F5A3C;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Take the free BP quiz →
            </a>
          </div>

          <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Step 2. Meet your hormone-corner co-coach</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0;">
              Annie Chitate, RN, my wife and the hormone-corner co-coach. About half my caseload involves hormone work (cortisol, thyroid, estrogen, testosterone). Annie handles that thread directly. You'll meet her by Week 2 with a 30-minute hormone-baseline call if your case calls for it.
            </p>
          </div>

          <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Step 3. Daily WhatsApp office hours</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0 0 8px;">
              Sun–Thu, 9 AM–5 PM ET. Send me a question, a photo of a confusing lab, a "should I take this today". I answer same-day. The WhatsApp group invite arrives in a separate text from <strong>717-585-9505</strong> once your kickoff call is on the calendar.
            </p>
            <p style="font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);margin:0;">
              Text me from your phone first so I have your number to add. One word, "Sprint", is enough.
            </p>
          </div>

          <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Step 4. Spouse included free</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0;">
              Your spouse or partner is part of this, at no extra cost. They get a free 30-minute briefing in Week 2 so they're rowing with you, not pulling against. The protocols stick when the household is aligned. We'll schedule that on your kickoff call if you want it.
            </p>
          </div>

          <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Step 5. Skool VIP access</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0 0 12px;">
              Join the &ldquo;How to Be Your Own Doctor&rdquo; community. Once you're in, DM me, and I grant Sprint clients VIP access where the weekly group calls + protocol library live.
            </p>
            <a href="${FREE_SKOOL_URL}" style="display:inline-block;background:#FFFFFF;color:#3F5A3C;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Join the Skool community →
            </a>
          </div>

          <div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">What I'm preparing before our kickoff</div>
            <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:0 0 6px;">
              While you're booking, I'm already reading your file. By the time we meet, I'll have:
            </p>
            <ul style="font-size:14px;line-height:1.65;color:rgba(255,255,255,0.9);margin:8px 0 0;padding-left:20px;">
              <li>Your Week 1 protocol drafted (gratitudes practice, hydration with mineral salt, the one supplement to consider, the one to drop)</li>
              <li>A doctor-conversation script template ready to customize for your prescriber</li>
              <li>A short reading list, the 2–3 articles that explain why we're doing what we're doing</li>
            </ul>
          </div>

        </td></tr>
      </table>
    </td></tr>
    `;
  } else if (config.includesCoaching && config.coachingFlavor === 'vip') {
    coachingBlock = `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:20px;">Your VIP Coaching</div>

          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Live Group Coaching</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Mondays at 10pm EST, every week of the challenge</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Bring your numbers, your medications list, your questions. Joel walks you through the protocol live and answers anything in real time. The Zoom link arrives in a separate email before each call.
            </p>
          </div>

          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Direct Q&amp;A</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Submit questions in advance or ask live during the calls. Every question gets answered.
            </p>
          </div>

          <div>
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Replays, Yours to Keep</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Can't make a session live? The replay link arrives in your inbox within 24 hours.
            </p>
          </div>

        </td></tr>
      </table>
    </td></tr>
    `;
  } else if (config.includesCoaching) {
    // Default = Premium tier 3
    coachingBlock = `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:20px;">Your 2 Premium Bonuses</div>

          <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 1. Live Event</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Barbara O'Neill LIVE, June 24–25, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 10px;">
              Your virtual ticket is on me. I'll personally purchase your ticket at <a href="https://www.everydaynurse.com/event-virtual" style="color:#FFFFFF;text-decoration:underline;">everydaynurse.com/event-virtual</a> and email your registration confirmation within 48 hours.
            </p>
            <p style="font-size:13px;line-height:1.55;color:rgba(255,255,255,0.75);margin:0;">
              Block <strong style="color:#FFFFFF;">June 24 &amp; 25, 2026</strong> on your calendar now.
            </p>
          </div>

          <div>
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 2. 30-Day Challenge + Group Coaching</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">30-Day Challenge kicks off May 1, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Daily protocol emails and weekly live group coaching calls start May 1. Full schedule coming before kickoff.
            </p>
          </div>

        </td></tr>
      </table>
    </td></tr>
    `;
  }

  // 2026-06-09: kicker was "One-time offer — only available right now",
  // which was false (the link works any time). Honesty rule: no fake urgency.
  const upgradeBlock = config.upgradeUrl ? `
    <tr><td style="padding:6px 28px 18px;">
      <div style="background:#FBF8F1;border-radius:12px;padding:16px 18px;border:1px dashed rgba(0,0,0,0.12);">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;margin-bottom:6px;">Optional add-on</div>
        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:4px;">${config.upgradeLabel}</div>
        <div style="font-size:13px;line-height:1.5;color:#5A5A5A;margin-bottom:10px;">${config.upgradeDesc}</div>
        <a href="${config.upgradeUrl}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          ${config.upgradeCta || 'Upgrade now →'}
        </a>
      </div>
    </td></tr>
  ` : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">Your PDFs are ready to download right now, plus a short note on what comes next from me.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN · Twenty years ICU &amp; emergency</div>
      </td></tr>

      ${apologyBanner}

      <tr><td style="padding:18px 28px 16px;">
        <div style="display:inline-block;background:#F0FFF4;border:1px solid #68D391;border-radius:8px;padding:6px 14px;font-size:13px;color:#276749;font-weight:600;margin-bottom:16px;">
          ✓ Purchase confirmed
        </div>
        <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#2C3E50;margin:0 0 12px;font-weight:500;">
          ${greeting} you just did something most people never do.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">
          You took your health into your own hands. That decision matters more than any single herb or protocol. Here's everything you now have access to:
        </p>
        <p style="font-size:14px;line-height:1.6;color:#5A5A5A;margin:0 0 12px;">
          ${tier === 'coaching'
            ? 'You\'re in the Sprint. The next 90 days, you have a 20-year ICU/ER nurse, and a hormone-corner co-coach, in your corner daily. Below: every step of Week 1, your Calendly link, your Skool VIP path, and a heads-up on the WhatsApp office hours. Read the whole thing. It\'s the map for what happens next.'
            : tier === 3
            ? 'You\'re in the 30-Day Challenge. Here\'s your full BraveWorks library. Short teaching emails start tomorrow, and your Skool community access is live now. Weekly group coaching happens in Skool, schedule posted there.'
            : tier === 'vip'
            ? 'You\'re in. Your BP Triangle Challenge starts now. Your downloads below are the FULL BraveWorks bonus stack: BP, cortisol, AND blood sugar protocols. Short teaching emails begin tomorrow, about ten over the next three weeks. Your community access step is below.'
            : tier === 'diagnostic'
            ? 'Your 30-Day Personalized Sprint is paid and your spot is locked. There are two steps to start, both below: book your kickoff call with Joel, and join the group where your 4 live coaching sessions a month happen.'
            : tier === 1
            ? 'Your protocol kit is ready below. Download it now and save this email so you can come back to it.'
            : 'Your downloads are ready. Start with Day 1. It\'s the easiest one, and most people feel it within 72 hours.'
          }
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E6;border:1px solid #F6E05E;border-radius:10px;margin-bottom:4px;">
          <tr><td style="padding:12px 16px;">
            <p style="font-size:13px;line-height:1.5;color:#744210;margin:0;">
              <strong>Do this first.</strong> Add <strong>braveworksrn@gmail.com</strong> to your contacts or address book right now, and if you use Gmail, drag this email to your Primary tab. If you skip this, my teaching emails and protocol updates may quietly land in spam or promotions. It takes about ten seconds.
            </p>
          </td></tr>
        </table>
      </td></tr>

      ${challengeBlock}
      ${testimonialBlock}
      ${weeklyResetBlock}
      ${coachingBlock}

      <tr><td style="padding:6px 28px 18px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 14px;font-weight:500;">Your downloads</h2>
          ${downloadRows}
        </div>
      </td></tr>

      ${upgradeBlock}

      <tr><td style="padding:4px 28px 24px;">
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0 0 10px;">
          Reply to this email with questions about your protocol, your medications, or what to try first. I read what you send. I am a nurse, not a corporation.
        </p>
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0;">
          Joel Polley, RN<br/>BraveWorks RN
        </p>
      </td></tr>

      ${psBlock}

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="${SITE_URL}" style="color:#9A9A9A;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
          <br/>Educational content only. Not medical advice. Always complement, never replace, the care from your physician.
          <br/>You received this because you purchased a BraveWorks health protocol.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

// 2026-05-13: replaced local validator with the shared one from
// `_email-validation.js` (which adds CRLF header-injection protection on top
// of the same RFC-shape check). Kept the local alias name so the rest of
// this file's references continue to work.
const looksLikeValidEmail = sharedLooksLikeValidEmail;

export async function sendPurchaseConfirmation({ email, name, tier, apologyMode }) {
  const config = TIER_CONFIG[tier];
  if (!config) throw new Error(`Unknown tier: ${tier}`);
  if (!looksLikeValidEmail(email)) {
    // Throw loud — webhook handler logs + alerts, so Joel knows a buyer
    // didn't get their kit and can manually deliver.
    throw new Error(`sendPurchaseConfirmation: invalid email shape: ${JSON.stringify(email)}`);
  }
  const html = renderPurchaseEmail({ name, tier, apologyMode });
  // When apologyMode is set, override the subject so the buyer sees the
  // make-good framing immediately instead of a generic "you're in" line.
  const subject = apologyMode
    ? `Sorry, here's your kit (plus the full Pressure Triangle Stack as my apology)`
    : config.subject;
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email.trim(),
    replyTo: REPLY_TO,
    subject,
    html,
  });
}

// 2026-05-13 cleanup: removed the dead `export default handler` webhook entry
// point. Verified via Stripe API (GET /v1/webhook_endpoints) that the live
// account has exactly ONE webhook against bpquiz.com, pointing to
// /api/stripe-webhook — NOT this file. This module was never invoked as a
// webhook in production; the handler was leftover scaffolding from an
// earlier session.
//
// What this file still exports (used by api/stripe-webhook.js + others):
//   - TIER_CONFIG (amount → product/subject/downloads/upgrade map)
//   - AMOUNT_TO_TIER (cents → tier-key lookup)
//   - renderPurchaseEmail (HTML builder)
//   - sendPurchaseConfirmation (the actual Resend send, called by the
//     canonical webhook handler in api/stripe-webhook.js)
//
// If we ever need a second webhook endpoint for some reason, copy the
// pattern from api/stripe-webhook.js — it has the right idempotency dedupe,
// signature verification, and amount-routing in place.
