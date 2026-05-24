// api/_email-shared.js — shared email components imported by all 5 tier
// sequences (_tier-lead/1/2/3/4-emails.js). One source of truth for the
// YouTube-first footer + 3-tier Skool ladder CTAs.
//
// 2026-05-24: Joel directive — YouTube is now primary social driver
// ("free content can get you off pills"). Skool free → Premium $9/m →
// VIP $47/m is the new value ladder. These two blocks appear at the
// bottom of EVERY tier email.

// Match the canonical /about marketing URL used in tier email files.
// Internal-only — tier files keep their own SKOOL_URL export to avoid
// import collision. Not exported here.
const SKOOL_URL    = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';
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
// Placed at the BOTTOM of every email body, but ABOVE the Skool tier
// ladder. This is the "trust-first" exit ramp for readers not ready to
// spend a dollar. Kennedy: lower perceived self-interest = higher trust.
//
// Copy is intentionally non-pushy. "Watch a free video" is the lowest-
// friction CTA in the entire ladder.
export function youtubePrimaryCTA() {
  return `<div style="margin:36px 0 20px;padding:28px 26px;background:#FFFFFF;border:2px solid ${PALETTE.accentClay};border-radius:14px;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accentClay};font-weight:700;margin-bottom:10px;">Not ready to spend a dollar yet?</div>
    <p style="font-size:16px;line-height:1.6;color:${PALETTE.text};margin:0 0 16px;font-weight:500;">
      That's completely fine. The same protocols I run with my private clients I teach on my YouTube — free, no signup, no email required.
    </p>
    <p style="font-size:15px;line-height:1.55;color:${PALETTE.textSoft};margin:0 0 20px;">
      I've watched these protocols get people off pills who thought they'd be on them for life. Your move.
    </p>
    <a href="${YOUTUBE_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
      Check out the latest video →
    </a>
  </div>`;
}

// ─── Block 2: Skool 3-tier ladder footer ──────────────────────────────
// Placed AFTER the YouTube CTA. Lists all three Skool tiers — Free /
// Premium $9 / VIP $47 — so every email exposes the upgrade path.
// Hormozi: "5-7x more offers than you think." Every email should
// expose every rung of the ladder, not just the next one.
//
// All three tiers route to the same community URL — Skool's UI shows
// the subscribe option once they're inside. We explain in copy.
export function skoolTiersFooter() {
  return `<div style="margin:0 0 28px;padding:24px 22px;background:${PALETTE.outerBg};border-radius:12px;border-left:4px solid ${PALETTE.accentSage};">
    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.accentSage};font-weight:700;margin-bottom:14px;">3 ways to go deeper inside the community</div>

    <div style="margin:0 0 14px;">
      <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">
        → <a href="${SKOOL_URL}" style="color:${PALETTE.text};text-decoration:none;">Standard · Free</a>
      </p>
      <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">
        The 10-Day Challenge, the BP Reset Kit, the community.
      </p>
    </div>

    <div style="margin:0 0 14px;">
      <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">
        → <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;">Premium · $9/mo</a>
      </p>
      <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">
        Private Zoom Hot-Seat room every Monday at 10 PM ET. Hand goes up first. Skip the chat queue.
      </p>
    </div>

    <div>
      <p style="font-size:14.5px;line-height:1.5;color:${PALETTE.text};margin:0 0 4px;font-weight:600;">
        → <a href="${SKOOL_URL}" style="color:${PALETTE.accentClay};text-decoration:none;">VIP · $47/mo</a>
      </p>
      <p style="font-size:13.5px;line-height:1.5;color:${PALETTE.textSoft};margin:0 0 0 16px;">
        1-on-1 live consults · Personal protocol reviews · Classroom courses · WhatsApp Office Hours.
      </p>
    </div>

    <p style="font-size:12px;line-height:1.55;color:#999;margin:18px 0 0;font-style:italic;">
      Inside Skool: Settings → Subscription → pick your tier.
    </p>
  </div>`;
}

// ─── Block 3: In-body Premium/VIP pitch (for B-list days only) ────────
// Used in lead-cron Days 5/7 + tier-1-cron Days 3/7/14 — the engaged-
// but-not-ready-for-$297 stage where Premium ($9) and VIP ($47) are
// the right next rungs.
//
// This is a STRONGER pitch than the footer ladder. Goes inline in the
// email body, not in the footer.
export function premiumVipBodyPitch() {
  return `<div style="margin:32px 0;padding:28px 26px;background:#2C3E50;border-radius:14px;color:#FFFFFF;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#FFD700;font-weight:700;margin-bottom:12px;">A real clinician in your corner — without the $297 commitment</div>

    <p style="font-size:17px;line-height:1.55;color:#FFFFFF;margin:0 0 18px;font-weight:500;">
      Two new ways to get me on the phone with you Monday nights:
    </p>

    <div style="margin:0 0 16px;padding:16px 18px;background:rgba(255,255,255,0.06);border-radius:10px;">
      <p style="font-size:15px;line-height:1.5;color:#FFFFFF;margin:0 0 6px;font-weight:600;">
        Premium · $9/month — the Monday Hot Seat
      </p>
      <p style="font-size:13.5px;line-height:1.55;color:rgba(255,255,255,0.85);margin:0;">
        Private Zoom room. Hand goes up first. Real answers about YOUR numbers, not "ask your doctor."
      </p>
    </div>

    <div style="margin:0 0 22px;padding:16px 18px;background:rgba(255,255,255,0.06);border-radius:10px;">
      <p style="font-size:15px;line-height:1.5;color:#FFFFFF;margin:0 0 6px;font-weight:600;">
        VIP · $47/month — the closest thing to private client
      </p>
      <p style="font-size:13.5px;line-height:1.55;color:rgba(255,255,255,0.85);margin:0;">
        Everything in Premium + 1-on-1 consults + personal protocol reviews + WhatsApp Office Hours.
      </p>
    </div>

    <a href="${SKOOL_URL}" style="display:inline-block;background:${PALETTE.accentClay};color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">
      See both tiers in Skool →
    </a>
  </div>`;
}
