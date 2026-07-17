// api/_email-shared.js — shared email styling + compliance helpers.
//
// Phase 2 (agent #4 — Email + delivery). One visual system for the lead
// nurture, the buyer onboarding sequence, and the at-purchase delivery email
// fired from stripe-webhook.js, so every BraveWorks BP email looks like it
// came from the same hand.
//
// Brand: BraveWorks BP — "The Blood Pressure Triangle." Palette + type pulled
// up from src/styles/tokens.css (the canonical cream/clay/sage editorial-
// apothecary system, plus the three corner colors Stress / Sugar / Sodium).
// Author identity Joel Polley, RN. Reuses the live Resend sender
// joel@bpquiz.com (reply-to braveworksrn@gmail.com).
//
// This is the SHARED VISUAL SYSTEM only. The sequence content lives in
// _lead-emails.js + _buyer-emails.js and the at-purchase email in
// stripe-webhook.js; they import the helpers below (p, h2, bigQuote,
// ctaButton, downloadRow, callout, emailShell, buildEmail, complianceFooter*).
// The public API (function names + signatures) is held stable on purpose so
// those callers keep working; this upgrade changes what the helpers RENDER,
// not how they are called. Every helper still takes exactly the same args; a
// couple gained OPTIONAL extras (emailShell/buildEmail accept an optional
// `corner` for a corner-color accent) that default to the prior look.
//
// Email-client reality this is built for: table-based layout, inline styles,
// ~600px, web-safe fonts with graceful serif/sans fallback, an Outlook (VML)
// bulletproof button, a dark-mode-friendly head <style>, and a mobile media
// query. Nothing here depends on external images or web fonts, so it degrades
// to clean type + brand colors everywhere.
//
// Compliance spine baked in here so no individual email can forget it:
//   - CAN-SPAM postal line (env BUSINESS_POSTAL_ADDRESS only, never hardcoded) + one-click
//     unsubscribe footer link.
//   - "Education alongside your doctor, never instead" disclaimer.
//   - ZERO em-dashes anywhere in VISIBLE copy (commas / periods / parentheses
//     only). Comments in this file may use them; rendered strings do not.

// ─── Identity (reuse the live bpquiz Resend sender) ───────────────────
export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// ─── Skool community free-trial link (env seam) ───────────────────────
// The $47 (top2) and $97 (complete) tiers include a free trial of the Skool
// community. The URL is an env seam so Joel sets it once without a code change.
// TODO: Joel sets the Skool trial URL (set SKOOL_TRIAL_URL in Vercel). Until it
// is set, SKOOL_TRIAL_URL is '' and callers omit the trial line gracefully
// rather than shipping a dead/placeholder link.
export const SKOOL_TRIAL_URL = process.env.SKOOL_TRIAL_URL || 'https://www.skool.com/braveworksrn/about';

// CAN-SPAM physical postal address. Read ONLY from BUSINESS_POSTAL_ADDRESS in
// the environment. Never hardcode a mailing address here (Joel's request). If
// unset, the footer omits the line, so it MUST be set in Vercel before sending
// live marketing email (CAN-SPAM requires a valid physical postal address).
export const POSTAL_ADDRESS = process.env.BUSINESS_POSTAL_ADDRESS || '';

// ─── Palette ──────────────────────────────────────────────────────────
// Pulled up from src/styles/tokens.css so the email reads as the same brand
// as the site. The legacy keys (outerBg, panelBg, text, textSoft, textMute,
// accentClay, accentSage, border) are PRESERVED and re-pointed at the
// canonical token values, because stripe-webhook.js / _lead-emails.js /
// _buyer-emails.js read PALETTE.accentClay + PALETTE.accentSage directly in
// their own inline styles. New keys are added alongside, not in place of them.
export const PALETTE = {
  // ---- legacy keys (kept for backward-compatible callers) ----
  outerBg: '#F1EADC',   // page behind the card (paper-warm, a touch deeper than the card)
  panelBg: '#FBF8F1',   // the card itself (cream)
  text: '#121110',      // ink — headlines / strong
  textSoft: '#2B2824',  // ink-soft — body copy
  textMute: '#7A7061',  // muted — secondary / fine print
  accentClay: '#B85A36',
  accentSage: '#4A5D4E',
  border: '#D8CFBD',    // line

  // ---- extended brand tokens (mirror tokens.css) ----
  ink: '#121110',
  inkSoft: '#2B2824',
  paper: '#F7F3EC',
  paperWarm: '#EFE8DB',
  cream: '#FBF8F1',
  line: '#D8CFBD',
  lineSoft: '#E8E1D1',
  muted: '#7A7061',
  sage: '#4A5D4E',
  sageDeep: '#2E3A30',
  clay: '#B85A36',
  clayHover: '#A44B28',
  claySoft: '#E8B799',
  gold: '#C8A252',
  // the three Triangle corners
  cornerStress: '#6B4A58', // plum
  cornerSugar: '#B85A36',  // clay
  cornerSodium: '#4A5D4E', // sage
};

// Resolve a corner key (stress|sugar|sodium) to its accent color. Anything
// unknown / undefined falls back to clay, the house accent, so an email that
// does not know the reader's corner still looks intentional.
function cornerAccent(corner) {
  if (corner === 'stress') return PALETTE.cornerStress;
  if (corner === 'sugar') return PALETTE.cornerSugar;
  if (corner === 'sodium') return PALETTE.cornerSodium;
  return PALETTE.clay;
}

// Web-safe font stacks. Display = a real serif for headlines (Georgia leads,
// so it renders everywhere; Fraunces only if a client ever had it). Body = the
// system sans stack. No web-font fetch, so nothing flashes or fails to load.
const FONT_HEAD =
  "Georgia, 'Fraunces', 'Times New Roman', Times, serif";
const FONT_BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// ─── Block helpers ────────────────────────────────────────────────────
// Same signatures as before; richer rendering.

export function p(html, { margin = '0 0 18px' } = {}) {
  return `<p style="font-size:16px;line-height:1.7;color:${PALETTE.inkSoft};margin:${margin};font-family:${FONT_BODY};-webkit-text-size-adjust:100%;">${html}</p>`;
}

export function h2(text) {
  return `<h2 style="font-size:22px;line-height:1.3;color:${PALETTE.ink};margin:32px 0 14px;font-family:${FONT_HEAD};font-weight:700;letter-spacing:-0.01em;">${text}</h2>`;
}

// Pull quote for the villain line / the "three faucets one sink" teaching.
// A serif italic with a clay rule on the left, set on a faint cream panel.
export function bigQuote(text) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0;border-collapse:separate;">
    <tr>
      <td width="4" style="width:4px;background:${PALETTE.clay};border-radius:4px;font-size:1px;line-height:1px;">&nbsp;</td>
      <td style="padding:6px 0 6px 18px;">
        <p style="font-size:21px;line-height:1.45;color:${PALETTE.ink};margin:0;font-family:${FONT_HEAD};font-weight:600;font-style:italic;">${text}</p>
      </td>
    </tr>
  </table>`;
}

// Primary call-to-action button. Bulletproof: a VML roundrect for Outlook
// (which ignores border-radius + padding on <a>) wrapped in MSO comments, and
// the styled anchor for every other client. Rounded, brand clay, white label.
export function ctaButton(label, url, { accent = PALETTE.clay } = {}) {
  const safeUrl = url || '#';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 26px;">
    <tr><td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:50px;v-text-anchor:middle;width:320px;" arcsize="16%" strokecolor="${accent}" fillcolor="${accent}">
        <w:anchorlock/>
        <center style="color:#FFFFFF;font-family:${FONT_BODY};font-size:16px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${safeUrl}" style="display:inline-block;padding:15px 32px;border-radius:10px;background:${accent};color:#FFFFFF;font-size:16px;font-weight:700;line-height:1;text-decoration:none;font-family:${FONT_BODY};box-shadow:0 2px 5px rgba(18,17,16,0.16);">${label}&nbsp;&rarr;</a>
      <!--<![endif]-->
    </td></tr>
  </table>`;
}

// A single kit-download row (title + one-line what-it-is + download link).
// Card surface, a clay file glyph, and a styled "Download PDF" link-button.
export function downloadRow({ title, blurb, file }) {
  const url = `${SITE_URL}/downloads/${file}`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px;border:1px solid ${PALETTE.line};border-radius:12px;background:${PALETTE.cream};border-collapse:separate;">
    <tr>
      <td width="46" valign="top" style="width:46px;padding:18px 0 18px 18px;">
        <div style="width:34px;height:34px;border-radius:8px;background:${PALETTE.claySoft};color:${PALETTE.clay};font-family:${FONT_BODY};font-size:15px;font-weight:700;text-align:center;line-height:34px;">PDF</div>
      </td>
      <td style="padding:16px 18px;font-family:${FONT_BODY};">
        <div style="font-size:16px;font-weight:700;color:${PALETTE.ink};margin-bottom:4px;">${title}</div>
        <div style="font-size:14px;line-height:1.5;color:${PALETTE.muted};margin-bottom:11px;">${blurb}</div>
        <a href="${url}" style="display:inline-block;font-size:14px;font-weight:700;color:${PALETTE.clay};text-decoration:none;border-bottom:2px solid ${PALETTE.claySoft};padding-bottom:1px;">Open it now &rarr;</a>
      </td>
    </tr>
  </table>`;
}

// A soft callout panel (used for "what to do first" and gentle nudges).
// Cream panel, sage left rule, uppercase sage kicker.
export function callout({ kicker, body }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;border-collapse:separate;">
    <tr>
      <td width="4" style="width:4px;background:${PALETTE.sage};border-radius:4px;font-size:1px;line-height:1px;">&nbsp;</td>
      <td style="padding:18px 22px;background:${PALETTE.paperWarm};border-radius:0 10px 10px 0;font-family:${FONT_BODY};">
        ${kicker ? `<div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:9px;">${kicker}</div>` : ''}
        <div style="font-size:15px;line-height:1.65;color:${PALETTE.inkSoft};">${body}</div>
      </td>
    </tr>
  </table>`;
}

// ─── Branded header ───────────────────────────────────────────────────
// A cream band with the BraveWorks wordmark and a small Triangle motif whose
// three vertices carry the corner colors (Stress plum / Sugar clay / Sodium
// sage). The triangle is a tiny inline SVG; clients that strip SVG (Outlook,
// some Gmail states) get the alt text and the wordmark still reads. Sits at
// the top of every email, optionally under a corner-color rule.
function triangleMark() {
  // 44x40 triangle, three colored vertex dots. role/aria + alt-ish title so
  // it is announced, but it is decorative and the wordmark carries meaning.
  return `<span style="display:inline-block;vertical-align:middle;line-height:0;">
    <!--[if !mso]><!-- -->
    <svg width="40" height="36" viewBox="0 0 44 40" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;" aria-hidden="true">
      <polygon points="22,4 40,36 4,36" fill="none" stroke="${PALETTE.line}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="22" cy="4" r="4" fill="${PALETTE.cornerStress}"/>
      <circle cx="40" cy="36" r="4" fill="${PALETTE.cornerSugar}"/>
      <circle cx="4" cy="36" r="4" fill="${PALETTE.cornerSodium}"/>
    </svg>
    <!--<![endif]-->
    <!--[if mso]>
    <span style="font-size:22px;color:${PALETTE.clay};font-weight:700;">&#9651;</span>
    <![endif]-->
  </span>`;
}

function headerBand() {
  return `<tr>
    <td style="padding:26px 36px 22px;background:${PALETTE.paper};border-radius:14px 14px 0 0;border-bottom:1px solid ${PALETTE.line};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td valign="middle" style="padding-right:14px;width:40px;">${triangleMark()}</td>
          <td valign="middle">
            <div style="font-family:${FONT_HEAD};font-size:21px;font-weight:700;color:${PALETTE.ink};letter-spacing:-0.01em;line-height:1.1;">BraveWorks RN</div>
            <div style="font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.sage};margin-top:3px;">The Blood Pressure Triangle</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── Compliance footer ────────────────────────────────────────────────
// Education-alongside disclaimer + outcome rider + CAN-SPAM (postal address
// and one-click unsubscribe link). unsubUrl is provided by _state-cron.js;
// for the at-purchase email from stripe-webhook.js it is built by hand.
const DISCLAIMER =
  'Education that walks alongside your doctor, never instead of your doctor. Nothing here is medical advice, a diagnosis, or a prescription, and you never change a medication on your own. Results vary and are not typical.';

export function complianceFooterHtml(unsubUrl) {
  const unsubLink = unsubUrl
    ? `<a href="${unsubUrl}" style="color:${PALETTE.muted};text-decoration:underline;">Unsubscribe</a>`
    : '';
  const unsubLine = unsubUrl
    ? `You are getting this because you asked for my BP teaching at bpquiz.com. ${unsubLink}<br/>`
    : 'You are getting this because you asked for my BP teaching at bpquiz.com.<br/>';
  // Small three-dot triangle motif echoes the header, set in the corner
  // colors, so the footer feels designed rather than tacked on.
  const dots = `<span style="display:inline-block;vertical-align:middle;margin-right:8px;letter-spacing:2px;">` +
    `<span style="color:${PALETTE.cornerStress};">&bull;</span>` +
    `<span style="color:${PALETTE.cornerSugar};">&bull;</span>` +
    `<span style="color:${PALETTE.cornerSodium};">&bull;</span></span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:34px;border-top:1px solid ${PALETTE.line};">
    <tr><td style="padding-top:20px;font-family:${FONT_BODY};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;border-collapse:separate;">
        <tr><td style="padding:14px 16px;background:${PALETTE.paperWarm};border-radius:10px;">
          <p style="font-size:12px;line-height:1.6;color:${PALETTE.muted};margin:0;">${DISCLAIMER}</p>
        </td></tr>
      </table>
      <p style="font-size:11px;line-height:1.65;color:${PALETTE.muted};margin:0;">${dots}${unsubLine}BraveWorks RN &middot; Joel Polley, RN${POSTAL_ADDRESS ? ` &middot; ${POSTAL_ADDRESS}` : ''}</p>
    </td></tr>
  </table>`;
}

export function complianceFooterText(unsubUrl) {
  const unsubLine = unsubUrl ? `\nUnsubscribe: ${unsubUrl}` : '';
  return `--
${DISCLAIMER}

You are getting this because you asked for my BP teaching at bpquiz.com.${unsubLine}
BraveWorks RN  .  Joel Polley, RN${POSTAL_ADDRESS ? '  .  ' + POSTAL_ADDRESS : ''}`;
}

// ─── Page shell ───────────────────────────────────────────────────────
// Wraps body HTML in the centered, 600px, branded card: corner-color rule on
// top, the branded header band, then the content well. innerHtml already
// includes the body + the compliance footer (callers concatenate them), which
// is why the footer lands inside the card.
//
// Options (all OPTIONAL, all backward-compatible):
//   preheader  string  hidden inbox-preview text (as before)
//   corner     'stress'|'sugar'|'sodium'  tints the top rule + reading-progress
//              accent to the reader's corner; omitted => house clay.
export function emailShell(innerHtml, { preheader = '', corner } = {}) {
  const accent = cornerAccent(corner);
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;">${preheader}</div>` +
      // Spacer so the preheader text is not immediately followed in the inbox
      // preview by the raw HTML that follows it.
      `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>`
    : '';
  // Dark-mode + mobile via a head <style>. Email clients that support it use
  // it; ones that strip <style> simply keep the inline (light) styles, which
  // is the graceful fallback. .dm-* hooks only bite under prefers-color-scheme.
  const headStyle = `
    <style>
      /* Mobile: tighten the gutters and ease the headline down a notch. */
      @media only screen and (max-width:600px) {
        .bw-card { width:100% !important; border-radius:0 !important; }
        .bw-pad { padding-left:22px !important; padding-right:22px !important; }
        .bw-head { padding-left:22px !important; padding-right:22px !important; }
        .bw-wordmark { font-size:19px !important; }
      }
      /* No dark-mode transform on purpose. Email clients darken the background
         but cannot reliably re-color inline-styled text, which produced
         dark-on-dark. This template stays light and high-contrast everywhere:
         dark ink on a cream card, legible in light and dark clients alike. */
    </style>`;
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
${headStyle}
</head>
<body class="bw-bg" style="margin:0;padding:0;background:${PALETTE.outerBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${pre}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="bw-bg" style="background:${PALETTE.outerBg};">
  <tr><td align="center" style="padding:30px 14px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="bw-card" style="max-width:600px;width:100%;background:${PALETTE.cream};border-radius:14px;border:1px solid ${PALETTE.line};overflow:hidden;">
      <tr><td style="height:5px;background:${accent};font-size:1px;line-height:1px;">&nbsp;</td></tr>
      ${headerBand()}
      <tr><td class="bw-pad" style="padding:32px 36px 36px;">
        ${innerHtml}
      </td></tr>
    </table>
    <div style="max-width:600px;width:100%;margin:16px auto 0;font-family:${FONT_BODY};font-size:11px;color:${PALETTE.muted};text-align:center;">
      &copy; BraveWorks RN &middot; Education alongside your doctor, never instead.
    </div>
  </td></tr>
</table>
</body></html>`;
}

// 2026-07-17 (Joel): every sequence email drives YouTube at the bottom.
// Sits ABOVE the compliance footer, below the sign-off. One quiet line,
// Martell "4 More To Explore" energy without the noise.
export const YOUTUBE_URL = process.env.YOUTUBE_CHANNEL_URL || 'https://www.youtube.com/@braveworksrn';
function youtubeBlockHtml() {
  return `<p style="font-size:13px;line-height:1.6;color:${PALETTE.muted};margin:26px 0 0;border-top:1px solid ${PALETTE.line};padding-top:14px;">
    Want more? <a href="${YOUTUBE_URL}" style="color:${PALETTE.clay};font-weight:600;text-decoration:none;">Check out my latest video on YouTube &raquo;</a>
  </p>`;
}
function youtubeBlockText() {
  return `Want more? Check out my latest video on YouTube: ${YOUTUBE_URL}`;
}

// Convenience: assemble a full email from body + footer, both formats.
// Accepts the same fields as before plus an OPTIONAL `corner` passed through
// to emailShell for the corner-color accent (sequences may forward ctx.corner).
export function buildEmail({ preheader, bodyHtml, bodyText, unsubUrl, corner }) {
  return {
    html: emailShell(bodyHtml + youtubeBlockHtml() + complianceFooterHtml(unsubUrl), { preheader, corner }),
    text: `${bodyText}\n\n${youtubeBlockText()}\n\n${complianceFooterText(unsubUrl)}`,
  };
}
