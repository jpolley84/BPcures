// api/_kit-manifest.js — single source of truth for the rendered kit PDFs and
// which tier delivers which pieces.
//
// Phase 2 (agent #4 — Email + delivery), upgraded to the PREMIUM deliverable
// set, then to the 3-TIER LADDER. The render script (scripts/render-kits.mjs)
// writes these exact filenames into public/downloads/. The at-purchase email
// (stripe-webhook.js) and the buyer onboarding sequence (_buyer-emails.js) both
// read this map so they never drift. The /library page can import
// public/downloads/manifest.json, generated from this same data.
//
// Tier keys match AMOUNT_TO_TIER in stripe-webhook.js and products.json. The
// ladder is cumulative good-better-best:
//   corner    = $27 (2700), the reader's #1 (loudest) corner as a SET: the
//               corner protocol + that corner's Herb Formulary + that corner's
//               "Bring This To Your Doctor" sheet.
//   top2      = $47 (4700), the reader's TWO highest-scoring corners, each as a
//               full set (2 protocols + 2 formularies + 2 doctor sheets), plus a
//               free trial of the Skool community.
//   complete  = $97 (9700), ALL three corner sets (3 protocols + 3 formularies +
//               3 doctor sheets) + the Freedom Finale (the 30 day system, fully
//               closed loop), plus the Skool trial.
//
// Legacy aliases (kept so older records / amounts never break): 'entry' -> the
// one corner set (== 'corner'); 'triangle' -> all three sets + Finale (==
// 'complete' minus nothing). normalizeTier() maps them.
//
// Each corner therefore ships THREE designed PDFs:
//   <corner>.pdf                  the 10 day protocol module
//   <corner>-formulary.pdf        the standalone Herb Formulary (premium)
//   <corner>-doctor-sheet.pdf     the one page "Bring This To Your Doctor" sheet
//
// The four protocol modules render from the read-only source markdown at
// bpquiz-site/content/triangle-reset/. The formulary + doctor sheet content is
// authored as structured data in scripts/render-kits.mjs (the formulary is
// distilled from each module's Formulary section; the doctor sheet is net-new,
// compliance-first content). This file only describes the file map; it carries
// no clinical copy.

// ─── The three pieces a single corner ships ───────────────────────────
// `corner` ties an entry buyer's quiz corner to the files they receive.
// `kind` lets the renderer pick the right template (protocol vs formulary vs
// doctor-sheet) and lets the library/email group pieces under their corner.
export const MODULES = {
  // ── STRESS corner ──
  stress: {
    file: 'stress.pdf',
    corner: 'stress',
    kind: 'protocol',
    title: 'The Stress Corner, 10-Day Reset',
    blurb: 'Calm the cortisol that tightens your vessels and tells your kidneys to hold sodium.',
  },
  'stress-formulary': {
    file: 'stress-formulary.pdf',
    corner: 'stress',
    kind: 'formulary',
    title: 'The Stress Corner Herb Formulary',
    blurb: 'Your adrenal and calming herbs, each with dose, why it helps, and the cautions that matter.',
  },
  'stress-doctor-sheet': {
    file: 'stress-doctor-sheet.pdf',
    corner: 'stress',
    kind: 'doctor-sheet',
    title: 'Bring This To Your Doctor, Stress Corner',
    blurb: 'A one page sheet to take to your next visit so you and your doctor read your numbers together.',
  },

  // ── SUGAR corner ──
  sugar: {
    file: 'sugar.pdf',
    corner: 'sugar',
    kind: 'protocol',
    title: 'The Sugar Corner, 10-Day Reset',
    blurb: 'Steady the blood sugar and insulin that quietly drive your kidneys to hold sodium.',
  },
  'sugar-formulary': {
    file: 'sugar-formulary.pdf',
    corner: 'sugar',
    kind: 'formulary',
    title: 'The Sugar Corner Herb Formulary',
    blurb: 'Your metabolic herbs, each with a safe starting range, why it helps, and the cautions that matter.',
  },
  'sugar-doctor-sheet': {
    file: 'sugar-doctor-sheet.pdf',
    corner: 'sugar',
    kind: 'doctor-sheet',
    title: 'Bring This To Your Doctor, Sugar Corner',
    blurb: 'A one page sheet to take to your next visit so you and your doctor read your numbers together.',
  },

  // ── SODIUM corner ──
  sodium: {
    file: 'sodium.pdf',
    corner: 'sodium',
    kind: 'protocol',
    title: 'The Sodium Corner, 10-Day Reset',
    blurb: 'Drain the lake where stress and sugar both empty out, plus the salt on your plate.',
  },
  'sodium-formulary': {
    file: 'sodium-formulary.pdf',
    corner: 'sodium',
    kind: 'formulary',
    title: 'The Sodium Corner Herb Formulary',
    blurb: 'Your vascular herbs and the potassium seesaw, each with use, why it helps, and the cautions.',
  },
  'sodium-doctor-sheet': {
    file: 'sodium-doctor-sheet.pdf',
    corner: 'sodium',
    kind: 'doctor-sheet',
    title: 'Bring This To Your Doctor, Sodium Corner',
    blurb: 'A one page sheet to take to your next visit so you and your doctor read your numbers together.',
  },

  // ── The capstone (triangle tier only) ──
  'freedom-finale': {
    file: 'freedom-finale.pdf',
    corner: null,
    kind: 'protocol',
    title: 'The Freedom Finale, Days 26 to 30',
    blurb: 'Graduate from daily policing to a body you trust, with your doctor right beside you.',
  },
};

// ─── Existing-asset BONUSES (cumulative, on top of the core corner kit) ──
// These are already-built BraveWorks RN assets reused as tier bonuses. They do
// NOT overlap the core corner protocols/formularies/doctor sheets. Each is
// flagged `bonus: true` so the delivery page and email render them under their
// own "Your bonuses" heading, separate from the core kit. The first four live
// in public/downloads/bonuses/; the legacy-library bonuses (added 2026-07-13,
// per Joel: the $17 kit ships ALL 8 items the homepage stack promises) live at
// the downloads root, where the 2026-07-06 restoration put them. Compliance:
// the bonus files are paid deliverables and may carry supplement doses; the
// OFFER COPY in products.json that describes them states no doses.
export const BONUS_MODULES = {
  'bonus-bp-tracker': {
    file: 'bonuses/bp-tracker.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Bonus: Blood Pressure Tracker',
    blurb: 'A printable dashboard to log your morning and evening readings and walk a clean trend into your next visit.',
  },
  'bonus-doctor-templates': {
    file: 'bonuses/doctor-templates.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Bonus: Doctor Conversation Templates',
    blurb: 'Ready to use scripts and questions so you lead the conversation at your visit instead of nodding along.',
  },
  'bonus-cook-for-life': {
    file: 'bonuses/cook-for-life-cookbook.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Bonus: Cook for Life Cookbook',
    blurb: 'Whole-food recipes you can cook for years, the kind of everyday cooking that quietly supports all three corners.',
  },
  'bonus-meal-plan': {
    file: 'bonuses/meal-plan.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Bonus: The Triangle Meal Plan',
    blurb: 'A plant-based, high-fiber day of eating that front-loads breakfast and tapers to a light supper, built to support all three corners at once.',
  },

  // ── Legacy library (2026-07-13, per Joel): the full 8-item stack the
  // homepage and quiz results promise now ships on EVERY tier, starting at
  // $17. These PDFs were restored to public/downloads/ on 2026-07-06. Titles
  // match the CheckoutPage value stack so the promise and the delivery email
  // read as the same kit. ──
  'bonus-master-bp-doc': {
    file: 'master-blood-pressure-document.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Master Blood Pressure Document',
    blurb: 'The full protocol in one place: what to take, when to take it, and how much, so you always know the next step.',
  },
  'bonus-top-10-herbs': {
    file: 'top-10-herbs-deep-dive.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Top 10 Herbs Deep Dive',
    blurb: 'The ten herbs Joel reaches for most, each explained plainly with how it is used and the cautions that matter.',
  },
  'bonus-white-coat': {
    file: 'white-coat-syndrome-guide.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'White Coat Syndrome Guide',
    blurb: 'Why readings at the office often run high, and the simple steps nurses use to get numbers you can trust.',
  },
  'bonus-bp-faq': {
    file: 'blood-pressure-faq.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Blood Pressure FAQ',
    blurb: '25 questions people are afraid to ask their doctor, answered plainly by a nurse who has heard them all.',
  },
  'bonus-overmedicated': {
    file: 'overmedicated-boomers.pdf',
    bonus: true,
    kind: 'bonus',
    title: 'Overmedicated Boomers (Book)',
    blurb: 'The book on what your generation was never told about the prescriptions you carry, and the questions to bring to your doctor.',
  },
};

// Bonus stack per tier, cumulative (good-better-best). Each higher tier inherits
// every lower tier's bonuses.
// 2026-07-13 (Joel): the corner tier now carries the FULL legacy library plus
// Cook For Life, so the $17 buyer receives every item the homepage 8-item
// stack promises (Master BP Doc, Top 10 Herbs, Cook For Life, White Coat,
// FAQ, Tracker, Overmedicated; the 8th item, the 10-Day Reset Protocol, is
// the corner's core protocol). Higher tiers add the doctor templates.
const CORNER_BONUS_KEYS = [
  'bonus-master-bp-doc',
  'bonus-top-10-herbs',
  'bonus-cook-for-life',
  'bonus-white-coat',
  'bonus-bp-faq',
  'bonus-bp-tracker',
  'bonus-overmedicated',
  'bonus-meal-plan',
];

const BONUS_KEYS_BY_TIER = {
  corner: [...CORNER_BONUS_KEYS],
  top2: [...CORNER_BONUS_KEYS, 'bonus-doctor-templates'],
  complete: [...CORNER_BONUS_KEYS, 'bonus-doctor-templates'],
};

// The ordered bonus modules a tier delivers. Pure lookup, no clinical copy.
export function bonusesForTier(tier) {
  const t = normalizeTier(tier);
  return (BONUS_KEYS_BY_TIER[t] || []).map((k) => BONUS_MODULES[k]).filter(Boolean);
}

// The three corners, in the order Joel walks them.
export const ALL_CORNERS = ['stress', 'sugar', 'sodium'];

// The kinds a corner ships, in delivery order (protocol first, then the two
// premium companions). Used to assemble a corner's full set from its key.
const CORNER_PIECE_ORDER = ['protocol', 'formulary', 'doctor-sheet'];

// All pieces (protocol + formulary + doctor sheet) for one corner, in order.
export function cornerSet(corner) {
  const key = ALL_CORNERS.includes(corner) ? corner : 'sodium';
  const suffix = { protocol: '', formulary: '-formulary', 'doctor-sheet': '-doctor-sheet' };
  return CORNER_PIECE_ORDER.map((kind) => MODULES[`${key}${suffix[kind]}`]).filter(Boolean);
}

// Resolve the entry buyer's corner key from their quiz corner. Falls back to
// the Sodium corner (where the whole Triangle converges) when the corner is
// unknown, so a buyer is never handed a blank delivery.
export function entryModuleFor(corner) {
  const key = ALL_CORNERS.includes(corner) ? corner : 'sodium';
  return MODULES[key];
}

// ─── Tier normalization (3-tier ladder + legacy aliases) ──────────────
// The canonical tiers are corner / top2 / complete. Older drip records and the
// old AMOUNT_TO_TIER could carry 'entry' (== corner) or 'triangle' (== complete
// minus nothing, i.e. all three + Finale). Map them so delivery never breaks.
export function normalizeTier(tier) {
  if (tier === 'entry') return 'corner';
  if (tier === 'triangle') return 'complete';
  if (tier === 'corner' || tier === 'top2' || tier === 'complete') return tier;
  return 'corner'; // safest default: deliver at least the one corner set
}

// Resolve the buyer's TWO loudest corners from their stored quiz `scores`
// ({ stress, sugar, sodium } 0-100). Returns an ordered array of two corner
// keys, loudest first. Ties break by CORNER_TIEBREAK-equivalent order
// (sodium > stress > sugar, the loop-convergence order) so the same scores
// always resolve the same pair. Falls back gracefully:
//   - a known `corner` with no/garbled scores -> [corner, <next by tiebreak>]
//   - nothing usable at all                    -> ['sodium', 'stress']
const TIEBREAK_ORDER = ['sodium', 'stress', 'sugar'];

export function topTwoCorners(scores, corner) {
  return orderedCorners(scores, corner).slice(0, 2);
}

// All three corners in the order the buyer should walk them, loudest first,
// derived from the stored quiz `scores` ({ stress, sugar, sodium } 0-100). This
// is the single source of truth for corner order across the buyer journey (the
// 30-day email arc walks corner 1 -> 2 -> 3 by this order). Ties break by
// TIEBREAK_ORDER (sodium > stress > sugar, the loop-convergence order) so the
// same scores always resolve the same sequence. Falls back gracefully:
//   - a known `corner` with no/garbled scores -> [corner, ...the rest by tiebreak]
//   - nothing usable at all                   -> ['sodium', 'stress', 'sugar']
export function orderedCorners(scores, corner) {
  const valid =
    scores && typeof scores === 'object' &&
    ALL_CORNERS.every((c) => typeof scores[c] === 'number' && Number.isFinite(scores[c]));

  if (valid) {
    // Sort by score desc; on a tie, earlier-in-TIEBREAK_ORDER wins.
    return [...ALL_CORNERS].sort((a, b) => {
      const d = (scores[b] ?? 0) - (scores[a] ?? 0);
      if (d !== 0) return d;
      return TIEBREAK_ORDER.indexOf(a) - TIEBREAK_ORDER.indexOf(b);
    });
  }

  // No usable scores. Anchor on the known loudest corner if we have one, then
  // append the remaining corners by tiebreak order so all three still resolve
  // to a stable, distinct sequence.
  const first = ALL_CORNERS.includes(corner) ? corner : 'sodium';
  const rest = TIEBREAK_ORDER.filter((c) => c !== first);
  return [first, ...rest];
}

// The full ordered list of pieces a given tier delivers, by the buyer's score.
//   corner   -> the buyer's ONE loudest corner: protocol + formulary + sheet.
//   top2     -> the buyer's TWO loudest corners, each as a full set.
//   complete -> all three corner sets, then the Freedom Finale.
// Then, appended at the end, the tier's cumulative existing-asset bonuses (each
// flagged `bonus: true`). The core kit pieces always come first so callers that
// want only the core kit can stop at the first bonus, and callers that render a
// separate "Your bonuses" section (the welcome page, the delivery email) can
// partition on the flag. `corner` is the buyer's #1 corner; `scores` (optional)
// resolves the #2 for the top2 tier. Unknown corner/scores fall back to sensible
// defaults so a buyer is never handed a blank delivery.
export function modulesForTier(tier, corner, scores) {
  const t = normalizeTier(tier);

  let core;
  if (t === 'complete') {
    core = [
      ...ALL_CORNERS.flatMap((c) => cornerSet(c)),
      MODULES['freedom-finale'],
    ];
  } else if (t === 'top2') {
    const [c1, c2] = topTwoCorners(scores, corner);
    core = [...cornerSet(c1), ...cornerSet(c2)];
  } else {
    // corner: the one loudest corner's full set
    core = cornerSet(corner);
  }

  return [...core, ...bonusesForTier(t)];
}

// ─── Per-tier bundle resolution (ONE download per buyer) ──────────────
// Each tier ships as a single ZIP that contains exactly the core kit PDFs that
// tier+corner delivers PLUS that tier's cumulative bonus PDFs. The bundle build
// script (scripts/build-bundles.mjs) writes these into public/downloads/bundles/
// using the SAME modulesForTier() resolution, so the file name resolved here
// always points at a real, matching ZIP. Naming is fully deterministic from
// tier + the buyer's corner(s):
//   corner   -> bundle-corner-<corner>.zip          (the #1 corner)
//   top2     -> bundle-top2-<a>-<b>.zip              (the two corners in STABLE
//                                                     stress,sugar,sodium order)
//   complete -> bundle-complete.zip                  (all three + Finale + bonuses)
// The STABLE ordering (BUNDLE_CORNER_ORDER) means the same pair of corners maps
// to one canonical file regardless of which scored louder, so there is exactly
// one ZIP per pair to build and resolve.
export const BUNDLE_CORNER_ORDER = ['stress', 'sugar', 'sodium'];

// Sort a set of corners into the stable bundle-name order.
function stableCorners(corners) {
  return [...corners].sort(
    (a, b) => BUNDLE_CORNER_ORDER.indexOf(a) - BUNDLE_CORNER_ORDER.indexOf(b),
  );
}

// Resolve the deterministic bundle ZIP filename for a tier + the buyer's corner
// and scores. Mirrors modulesForTier's corner resolution exactly:
//   corner   -> the one loudest corner
//   top2     -> the two loudest corners, normalized to stable order
//   complete -> the single all-in bundle
// Falls back the same way modulesForTier does (unknown corner -> sodium; unknown
// pair -> the resolved top-two with the same tiebreak), so a buyer is never
// pointed at a missing file.
export function bundleNameForTier(tier, corner, scores) {
  const t = normalizeTier(tier);
  if (t === 'complete') return 'bundle-complete.zip';
  if (t === 'top2') {
    const pair = stableCorners(topTwoCorners(scores, corner));
    return `bundle-top2-${pair[0]}-${pair[1]}.zip`;
  }
  // corner: the one loudest corner's full set
  const key = ALL_CORNERS.includes(corner) ? corner : 'sodium';
  return `bundle-corner-${key}.zip`;
}

// A friendly, human label for a tier's bundle, used in the primary-download
// copy on the welcome page and in the delivery email ("Download your complete
// <label> bundle"). No doses, no clinical claims, zero em-dashes.
export function bundleLabelForTier(tier) {
  const t = normalizeTier(tier);
  if (t === 'complete') return 'Complete Triangle Reset';
  if (t === 'top2') return 'Top 2 Corners';
  return 'Corner Reset';
}

// Every deterministic bundle the build script must produce, as { tier, corner,
// scores, file } specs. The build script maps each to its core+bonus PDF list
// via modulesForTier and zips it. Kept here so the file map stays the single
// source of truth (the script never hand-lists corners). `scores` is null for
// each spec; corner alone drives corner/top2 resolution here.
export function allBundleSpecs() {
  const specs = [];
  // corner: one per corner
  for (const c of BUNDLE_CORNER_ORDER) {
    specs.push({ tier: 'corner', corner: c, scores: null, file: `bundle-corner-${c}.zip` });
  }
  // top2: one per unordered pair, in stable order
  for (let i = 0; i < BUNDLE_CORNER_ORDER.length; i++) {
    for (let j = i + 1; j < BUNDLE_CORNER_ORDER.length; j++) {
      const a = BUNDLE_CORNER_ORDER[i];
      const b = BUNDLE_CORNER_ORDER[j];
      // Pass both corners as scores so modulesForTier resolves this exact pair
      // (top of 100 each) regardless of tiebreak; the file name uses stable order.
      const scores = { stress: 0, sugar: 0, sodium: 0, [a]: 100, [b]: 100 };
      specs.push({ tier: 'top2', corner: a, scores, file: `bundle-top2-${a}-${b}.zip` });
    }
  }
  // complete: one bundle
  specs.push({ tier: 'complete', corner: null, scores: null, file: 'bundle-complete.zip' });
  return specs;
}

// Flat array form, handy for generating the static public/downloads/manifest.json
// and for the render script to iterate every PDF it must produce.
export const ALL_MODULES = Object.values(MODULES);
