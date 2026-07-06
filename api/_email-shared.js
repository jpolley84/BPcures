// api/_email-shared.js — shared email components imported by all 5 tier
// sequences (_tier-lead/1/2/3/4-emails.js) + newsletter. One source of
// truth for the YouTube CTA + the Weekly Reset community footer.
//
// 2026-06-09: panel-approved realignment. The old 3-tier Skool ladder
// (Standard Free / Premium $9 / VIP $47, Monday Hot Seat) described a
// group that does not exist at skool.com/braveworksrn — killed. Every
// block now sells the single real offer: The Weekly Reset, $27/month,
// first 7 days free, four live group sessions a month (Wednesdays at
// 7 pm ET), full ebook library + community included.
// Export names kept (skoolTiersFooter, premiumVipBodyPitch) so importing
// tier files don't break; only the rendered content changed.
// The "get people off pills" line in youtubePrimaryCTA was an unwrapped
// medication-cessation claim rendered in every tier — deleted (stop-ship).

// Match the canonical /about marketing URL used in tier email files.
// Internal-only — tier files keep their own SKOOL_URL export to avoid
// import collision. Not exported here.
const SKOOL_URL    = 'https://www.skool.com/braveworksrn/about';
const YOUTUBE_URL  = 'https://www.youtube.com/@braveworksrn';

// Shared palette — matches existing tier email files
const PALETTE = {
  outerBg: '#FBF8F1',
  text: '#2C3E50',
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

// ─── Block 1: YouTube primary CTA ─────────────────────────────────────
// "Trust-first" exit ramp for readers not ready to spend a dollar.
// Copy is intentionally non-pushy and carries NO outcome claims —
// footers cannot carry riders, so they cannot carry claims that need them.
export function youtubePrimaryCTA() {
  return `<div style="margin:36px 0 20px;padding:28px 26px;background:#FFFFFF;border:2px solid ${PALETTE.accentClay};border-radius:14px;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:10px;">Not ready to spend a dollar yet?</div>
    <p style="font-size:16px;line-height:1.6;color:${PALETTE.text};margin:0 0 20px;font-weight:500;">
      That's completely fine. The same protocols I teach inside the paid programs are on my YouTube. Free, no signup, no email required.
    </p>
    <a href="${YOUTUBE_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
      Check out the latest video →
    </a>
  </div>`;
}

// ─── Block 2: Weekly Reset footer (export name kept for importers) ────
// Was the 3-tier Skool ladder. Now the single Weekly Reset offer.
export function skoolTiersFooter() {
  return `<div style="margin:0 0 28px;padding:24px 22px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:10px;">The Weekly Reset</div>
    <p style="font-size:14.5px;line-height:1.6;color:${PALETTE.textSoft};margin:0 0 14px;">
      Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Full ebook library and the community included. $27 a month, first 7 days free.
    </p>
    <a href="${SKOOL_URL}" style="display:inline-block;font-size:13px;color:${PALETTE.accentClay};text-decoration:none;font-weight:700;border-bottom:2px solid ${PALETTE.accentClay};padding-bottom:1px;">Start your free week →</a>
  </div>`;
}

// ─── Block 3: In-body Weekly Reset pitch (export name kept) ──────────
// Was the Premium/VIP dark card. Now the Weekly Reset dark card.
// Stronger than the footer block; goes inline in the email body.
export function premiumVipBodyPitch() {
  return `<div style="margin:32px 0;padding:28px 26px;background:#2C3E50;border-radius:14px;color:#FFFFFF;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#FFD700;font-weight:700;margin-bottom:12px;">A live room, every week</div>

    <p style="font-size:16px;line-height:1.6;color:#FFFFFF;margin:0 0 20px;">
      Four live group sessions a month with me, Wednesdays at 7 pm ET. Bring your numbers, your med list, your questions. Works alongside your doctor's plan, never instead of it. $27 a month, first 7 days free.
    </p>

    <a href="${SKOOL_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
      Start your free week →
    </a>
  </div>`;
}

// mondayCallReminder — imported by _newsletter-emails.js since 2026-05-24 but
// never defined here (latent import crash, caught 2026-06-08). The "Monday
// 10pm" call it referenced is retired; the live call is the Weekly Reset
// group session, Wednesdays 7 PM ET. Renders the honest current reminder.
// (Name kept so the newsletter import keeps working.)
export function mondayCallReminder() {
  return `<div style="margin:24px 0;padding:16px 20px;background:#FBF8F1;border-radius:12px;border:1px solid #E8E2D4;">
    <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">
      <strong style="color:#2C3E50;">Live this week:</strong> the Weekly Reset group session, Wednesday at 7 PM ET. Bring your numbers, your med list, your questions. First 7 days free.
      <a href="${SKOOL_URL}" style="color:#B85A36;font-weight:700;text-decoration:none;">Join here →</a>
    </p>
  </div>`;
}

// ─── Block 4: App-launch HERO (top-of-email #1 CTA, launch window only) ─
// BraveWorks RN app waitlist (bpquiz.com/waitlist). Gated by APP_LAUNCH_ACTIVE
// so the WHOLE funnel flips on/off with one env var:
//   APP_LAUNCH_ACTIVE=true  → hero renders atop every email (launch window)
//   unset / anything else   → renders nothing (evergreen default — dormant)
// Built dormant on 2026-07-05 so the compliance/price fixes can deploy WITHOUT
// showing the hero; flip the env var to true in Vercel (+ redeploy) to launch,
// remove it to revert. Injected at the TOP of each email body/textBody across
// every sequence so the waitlist is the #1 CTA during launch; the existing
// Skool/case-review offers stay in place below as secondary.
export const APP_LAUNCH_ACTIVE = process.env.APP_LAUNCH_ACTIVE === 'true';
export const APP_WAITLIST_URL = 'https://bpquiz.com/waitlist';

export function appLaunchHero() {
  if (!APP_LAUNCH_ACTIVE) return '';
  return `<div style="margin:0 0 30px;padding:26px 26px;background:${PALETTE.accentClay};border-radius:14px;">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#FFD98A;font-weight:700;margin-bottom:10px;">Coming soon &middot; Early access</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.3;color:#FFFFFF;font-weight:600;margin:0 0 12px;">The BraveWorks RN app is almost here.</div>
    <p style="font-size:15.5px;line-height:1.65;color:#FBECE4;margin:0 0 18px;">Everything I teach, now in your pocket. Log your blood pressure in seconds, see which corner of the Triangle (Stress, Sugar, or Sodium) is driving your numbers, walk your daily reset, and tap once to hand your doctor a clean one-page report. I'm opening early access to my email family first, in the order you join.</p>
    <a href="${APP_WAITLIST_URL}" style="display:inline-block;background:#FFFFFF;color:${PALETTE.accentClay};padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.01em;">Join the early-access waitlist &rarr;</a>
    <p style="font-size:12.5px;line-height:1.5;color:#FBECE4;margin:14px 0 0;">Free to join. Founding access goes out in waitlist order.</p>
  </div>`;
}

export function appLaunchHeroText() {
  if (!APP_LAUNCH_ACTIVE) return '';
  return `COMING SOON: THE BRAVEWORKS RN APP
Everything I teach, now in your pocket. Log your blood pressure in seconds, see which corner of the Triangle (Stress, Sugar, or Sodium) is driving your numbers, walk your daily reset, and tap once to hand your doctor a clean one-page report. I'm opening early access to my email family first, in the order you join.
Join the early-access waitlist: ${APP_WAITLIST_URL}
Free to join. Founding access goes out in waitlist order.

`;
}
