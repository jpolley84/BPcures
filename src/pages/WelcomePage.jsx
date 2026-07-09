// WelcomePage - the on-site post-purchase home (route /welcome).
//
// PORTED from braveworks-bp into the old bpquiz-site so the reverted site's
// inline Triangle checkout (/pay) has a warm "you're in, here's your kit"
// landing to return to. create-embedded-checkout.js sets return_url to
// ${SITE_URL}/welcome, so a completed Triangle purchase lands here.
//
// ADAPTED FOR THE OLD SITE:
//   - The braveworks-bp SiteChrome wrapper is removed; App.jsx wraps this route
//     in the local SiteLayout (Navbar + Footer), so this returns the section only.
//   - The braveworks-bp design-system utility classes (.stack, .h-display,
//     .measure, .center-x, .tlink, .row, etc.) do NOT exist in bpquiz-site's
//     index.css, so the presentation is expressed with inline styles + CSS var
//     fallbacks (the same self-contained pattern PayPage.jsx uses), which keeps
//     this change from depending on or clobbering the shared stylesheet.
//   - Analytics: bpquiz-site's utils/analytics exports `track` (not `capture`).
//
// THE FLOW: each tier's checkout redirects here at
// /welcome?tier={corner|top2|complete}&upgraded=1 so a buyer always lands back on
// the site with their kit in front of them. The at-purchase email
// (api/triangle-webhook.js) is still the durable delivery; this page is the warm
// moment right after paying. The page renders ALL THREE tier levels stacked: the
// level(s) the buyer owns are UNLOCKED (downloadable); higher levels are LOCKED
// behind an upgrade CTA (src/data/upgradeOffers.js).
//
// 2026-07-03 pass:
//   - Skool trial card now shows for EVERY tier (corner included) and sits FIRST
//     after the download card. Every kit includes the 7-day trial.
//   - Upgrade CTAs state the real add-on price plainly ("Add your second corner
//     for $20"). The old "add only the difference" claim was removed: it was
//     computed off the retired $27 front price and overstated the math.
//
// This is a POST-PURCHASE page: a noindex,nofollow robots meta is set on mount.
//
// Compliance: education and lifestyle support, alongside the doctor. No doses,
// no diagnosis, no outcome promise. ZERO em-dashes in this file's visible copy.

import { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Users, ArrowRight, Stethoscope, CheckCircle2, Lock } from 'lucide-react';
import TriangleVisual from '../components/TriangleVisual';
import TeaOneClickOffer from '../components/TeaOneClickOffer';
import {
  normalizeTier,
  bundleNameForTier,
  bundleLabelForTier,
  cornerSet,
  bonusesForTier,
  orderedCorners,
  MODULES,
} from '../../api/_kit-manifest.js';
import { SITE_URL } from '../lib/loadEnv';
import { upgradeFor, CALL_97_OFFER } from '../data/upgradeOffers';
import { track } from '../utils/analytics';

// The three valid tier keys this page understands. Anything else normalizes to a
// safe default inside modulesForTier, so a junk ?tier= never breaks the page.
const VALID_TIERS = new Set(['corner', 'top2', 'complete']);
const VALID_CORNERS_SET = new Set(['stress', 'sugar', 'sodium']);

// Tier -> numeric level, so we can compare "owned" vs "higher" cleanly.
// 2026-07 ladder: TWO kit levels (corner / complete). Legacy top2 owners are
// treated as level 1 for display; their delivered files came by email, and they
// can complete the Triangle for the same $30 difference.
const TIER_LEVEL = { corner: 1, top2: 1, complete: 2 };

// Skool community trial link (env seam, same var the emails use). EVERY tier's
// kit includes the 7-day trial. When it is unset we omit the card rather than
// ship a dead link.
const SKOOL_TRIAL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SKOOL_TRIAL_URL) ||
  'https://www.skool.com/braveworksrn/about';

// Pretty corner names for teasers ("your Sugar corner"). Falls back to the raw
// key if an unexpected value ever appears.
const CORNER_LABEL = { stress: 'Stress', sugar: 'Sugar', sodium: 'Sodium' };
function cornerLabel(c) {
  return CORNER_LABEL[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : '');
}

// Plain-language line for each upgrade rung, stating the REAL price of the
// add-on. Keyed "<fromTier>_<targetTier>" to match upgradeOffers.js.
const UPGRADE_LINE = {
  corner_top2: (price) => `Add your second corner for ${price}.`,
  corner_complete: (price) => `Add the other two corners and the Freedom Finale for ${price}.`,
  top2_complete: (price) => `Add your third corner and the Freedom Finale for ${price}.`,
};

// Read { corner, scores } out of sessionStorage('bp_quiz'). Same key + shape the
// quiz writes and the result page reads. Returns nulls (never throws) when the
// record is missing or unparseable.
function readQuiz() {
  try {
    const raw = sessionStorage.getItem('bp_quiz');
    if (!raw) return { corner: null, scores: null };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { corner: null, scores: null };
    const corner = typeof data.corner === 'string' ? data.corner : null;
    const scores =
      data.scores && typeof data.scores === 'object' ? data.scores : null;
    return { corner, scores };
  } catch {
    return { corner: null, scores: null };
  }
}

// ─── Inline style helpers (self-contained; CSS var fallbacks) ─────────────
const CARD = {
  background: 'var(--cream, #FBF8F1)',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 14,
  padding: '1.4rem 1.5rem',
  maxWidth: 720,
  margin: '1.25rem auto 0',
};
const KICKER = {
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--sage, #4A5D4E)',
};
const LEDE = {
  fontSize: 'clamp(1.02rem, 1vw + 0.9rem, 1.2rem)',
  lineHeight: 1.6,
  color: 'var(--ink-soft, #2B2824)',
};
const SMALL = { fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6, color: 'var(--muted, #7A7061)' };
const BTN_CLAY = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  alignSelf: 'flex-start',
  background: 'var(--clay, #B85A36)',
  color: '#FFFFFF',
  fontWeight: 700,
  textDecoration: 'none',
  padding: '0.7rem 1.15rem',
  borderRadius: 10,
  border: 'none',
};
const TLINK = { color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' };

// A single download row (clay PDF glyph + title + one-line blurb + link). When
// `locked` is true it renders the SAME row greyed + blurred with no working link.
function DownloadItem({ module, fileUrl, locked = false }) {
  return (
    <li
      style={{
        display: 'flex',
        gap: '0.9rem',
        alignItems: 'flex-start',
        padding: '0.9rem 0',
        borderTop: '1px solid var(--line-soft, #E8E1D1)',
        listStyle: 'none',
        ...(locked ? { opacity: 0.55 } : null),
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.4rem',
          height: '2.4rem',
          borderRadius: '0.6rem',
          background: locked ? 'var(--paper-warm, #EFE8DB)' : 'var(--clay-soft, #E8B799)',
          color: locked ? 'var(--muted, #7A7061)' : 'var(--clay, #B85A36)',
          flexShrink: 0,
          marginTop: '0.1rem',
        }}
      >
        {locked ? <Lock size={16} strokeWidth={2} /> : <Download size={18} strokeWidth={2} />}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink, #121110)' }}>{module.title}</span>
        <span
          style={{
            display: 'block',
            color: 'var(--muted, #7A7061)',
            fontSize: 'var(--step--1, 0.82rem)',
            lineHeight: 1.5,
            margin: '0.2rem 0 0.5rem',
            ...(locked ? { filter: 'blur(3px)', userSelect: 'none' } : null),
          }}
        >
          {module.blurb}
        </span>
        {locked ? (
          <span style={{ fontWeight: 700, fontSize: 'var(--step--1, 0.82rem)', color: 'var(--muted, #7A7061)' }}>
            <Lock size={13} strokeWidth={2.4} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} aria-hidden />
            Locked
          </span>
        ) : (
          <a
            href={fileUrl(module.file)}
            style={{ ...TLINK, fontSize: 'var(--step--1, 0.82rem)' }}
            target="_blank"
            rel="noopener"
          >
            Open it now
            <ArrowRight size={14} strokeWidth={2.4} style={{ verticalAlign: 'middle', marginLeft: '0.25rem' }} aria-hidden />
          </a>
        )}
      </span>
    </li>
  );
}

// The Freedom Finale module (the capstone the complete tier adds on top of the
// three corner sets). Resolved once from the manifest.
const FINALE = MODULES['freedom-finale'];

// Build the per-LEVEL content each tier ADDS, so the stacked sections read as a
// good-better-best ladder (each section shows only its increment). Resolution
// mirrors the manifest exactly (see braveworks-bp original for the full note).
// 2026-07 ladder: TWO levels. Level 1 = the buyer's loudest corner (the $17
// Corner Reset). Level 2 = EVERYTHING else in the complete kit: the other two
// corners, the Freedom Finale, and every remaining bonus, unlocked together for
// the $30 difference (total $47, the complete price).
function buildLevels(ordered, knewCorner) {
  const cornerBonuses = bonusesForTier('corner');
  const completeBonuses = bonusesForTier('complete');
  const bonusDelta = (higher, lower) => {
    const lowerFiles = new Set(lower.map((b) => b.file));
    return higher.filter((b) => !lowerFiles.has(b.file));
  };

  const c1 = ordered[0];
  const c2 = ordered[1];
  const c3 = ordered[2];

  return [
    {
      tier: 'corner',
      level: 1,
      teaser: knewCorner
        ? `Your ${cornerLabel(c1)} corner, worked first.`
        : 'Your loudest corner, worked first.',
      modules: cornerSet(c1),
      bonuses: cornerBonuses,
    },
    {
      tier: 'complete',
      level: 2,
      teaser: knewCorner
        ? `Your ${cornerLabel(c2)} and ${cornerLabel(c3)} corners plus the Freedom Finale, the whole loop closed so none of the three quietly pulls your number back.`
        : 'Your other two corners plus the Freedom Finale, the whole loop closed so none of the three quietly pulls your number back.',
      modules: [...cornerSet(c2), ...cornerSet(c3), FINALE].filter(Boolean),
      bonuses: bonusDelta(completeBonuses, cornerBonuses),
    },
  ];
}

// Short, human heading for each level's section.
const LEVEL_HEADING = {
  corner: 'Your first corner',
  complete: 'The rest of your Triangle',
};

export default function WelcomePage() {
  const [params] = useSearchParams();
  const rawTier = params.get('tier') || '';
  const tier = VALID_TIERS.has(rawTier) ? rawTier : 'corner';
  const justUpgraded = params.get('upgraded') === '1';

  // POST-PURCHASE page: keep it out of search indexes. Set the robots meta
  // imperatively and restore it on unmount (SPA, so the tag would otherwise leak
  // onto the next route the buyer navigates to).
  useEffect(() => {
    const prior = document.querySelector('meta[name="robots"]');
    const priorContent = prior ? prior.getAttribute('content') : null;
    let tag = prior;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (priorContent !== null) {
        tag.setAttribute('content', priorContent);
      } else if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    };
  }, []);

  // The buyer's corner + scores resolve which PDFs they get and the order of
  // their corners (loudest first) for the per-level sections.
  // Corner priority: the ?corner= the checkout return_url now passes (so a
  // quiz-skipping buyer lands on the SAME corner they paid for) wins, then the
  // quiz result in sessionStorage, then null (safe manifest default).
  const urlCorner = params.get('corner');
  const sessionId = params.get('session_id') || '';
  const { corner: quizCorner, scores } = useMemo(readQuiz, []);
  const corner = VALID_CORNERS_SET.has(urlCorner) ? urlCorner : quizCorner;
  const knewCorner = Boolean(corner);

  const ownedTier = normalizeTier(tier);
  const ownedLevel = TIER_LEVEL[ownedTier] || 1;
  const isComplete = ownedTier === 'complete';
  const isTop2 = ownedTier === 'top2';
  // 2026-07-03: every tier's kit includes the 7-day Skool trial, so the card
  // shows for ALL buyers (it used to be top2/complete only).
  const showSkool = Boolean(SKOOL_TRIAL_URL);

  const ordered = useMemo(() => orderedCorners(scores, corner), [scores, corner]);
  const levels = useMemo(() => buildLevels(ordered, knewCorner), [ordered, knewCorner]);

  const base = SITE_URL();
  const fileUrl = (file) => `${base}/downloads/${file}`;

  const bundleResolvable = isComplete || knewCorner;
  const bundleFile = bundleNameForTier(tier, corner, scores);
  const bundleUrl = `${base}/downloads/bundles/${bundleFile}`;
  const bundleLabel = bundleLabelForTier(tier);

  const heroLine = isComplete
    ? 'Your full Triangle is yours. Every corner, plus the Freedom Finale, is ready below.'
    : isTop2
      ? 'Your two loudest corners are yours. Both full sets are ready below, and the rest of the Triangle is one click away.'
      : 'Your reset is yours. Your corner is ready below, and the rest of your kit is one click away.';

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      {/* ---- Warm confirm header ---- */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <TriangleVisual size={110} showLabels={false} emphasis={corner || undefined} />
        <div style={{ ...KICKER, marginTop: '1rem' }}>
          <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} aria-hidden />
          {justUpgraded ? 'Upgrade unlocked' : 'Purchase confirmed'}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0.6rem auto 0.4rem', color: 'var(--ink, #121110)', maxWidth: '20ch' }}>
          {justUpgraded ? 'Unlocked. Thank you.' : 'Thank you. You are in.'}
        </h1>
        <p style={{ ...LEDE, maxWidth: '52ch', margin: '0 auto' }}>
          {justUpgraded
            ? 'The rest of your kit is open. Everything new is unlocked below, and it is on its way to your email too.'
            : heroLine}
        </p>
        <p style={{ ...SMALL, maxWidth: '58ch', margin: '0.75rem auto 0' }}>
          First, thank you. You did the thing most people never do, you went after the cause instead of
          just the number. Everything unlocked below is yours to keep.
        </p>
      </div>

      {/* ---- Primary one-file download (the buyer's owned-tier bundle) ---- */}
      <div style={CARD}>
        <span style={KICKER}>Instant access</span>
        <h2 style={{ fontSize: '1.3rem', margin: '0.5rem 0 0.5rem', color: 'var(--ink, #121110)' }}>Your kit</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)' }}>
          Open the first day, take your baseline reading (sit quietly five minutes, same arm, average
          two or three readings), and write it down. That number is your starting line.
        </p>

        {bundleResolvable ? (
          <div
            style={{
              background: 'var(--clay-soft, #E8B799)',
              border: '1px solid var(--line-soft, #E8E1D1)',
              borderRadius: 12,
              padding: '1.1rem 1.2rem',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--ink, #121110)', display: 'block' }}>
              Everything's ready, open it now
            </span>
            <p style={{ margin: '0.4rem 0 0.9rem', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.55 }}>
              Your whole kit and every bonus you own, zipped into one file. Grab this and you have it
              all, or scroll down to pick out a single piece.
            </p>
            <a href={bundleUrl} style={BTN_CLAY} target="_blank" rel="noopener">
              Open my {bundleLabel} now
              <ArrowRight size={17} strokeWidth={2} />
            </a>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6 }}>
            We also sent your full bundle to your email, matched to the corner driving your number most.
            Your individual pieces are listed below, and if anything here looks different from your
            result, your email copy is the one tuned to you.
          </p>
        )}
      </div>

      {/* ---- Skool community trial: FIRST thing after the downloads, all tiers ---- */}
      {showSkool && (
        <div style={{ ...CARD, borderTop: '4px solid var(--sage, #4A5D4E)' }}>
          <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', color: 'var(--sage-deep, #2E3A30)', fontWeight: 600 }}>
            <Users size={18} strokeWidth={2} aria-hidden /> Your community trial
          </span>
          <p style={{ margin: '0.5rem 0 0.9rem', color: 'var(--ink-soft, #2B2824)' }}>
            Your kit includes a 7-day free trial of the Weekly Reset community. Wednesday nights, live
            with Joel, RN. Bring your questions, walk the plan with other people, and make it stick.
          </p>
          <a
            href={SKOOL_TRIAL_URL}
            style={BTN_CLAY}
            target="_blank"
            rel="noopener"
            onClick={() => track('offer_cta_click', { tier: 'skool-trial', source: 'welcome_skool_card' })}
          >
            Start your free trial
            <ArrowRight size={17} strokeWidth={2} />
          </a>
        </div>
      )}

      {/* ---- SVUTU Steady tea: true one-click upsell off the kit's saved card ---- */}
      <TeaOneClickOffer sessionId={sessionId} />

      {/* ---- The three stacked tier levels: owned = unlocked, higher = locked ---- */}
      {levels.map((lvl) => {
        const owned = lvl.level <= ownedLevel;
        const upgrade = owned ? null : upgradeFor(ownedTier, lvl.tier);
        return (
          <TierSection key={lvl.tier} level={lvl} owned={owned} upgrade={upgrade} fileUrl={fileUrl} />
        );
      })}

      {/* ---- complete buyers: a short "you have the full Triangle" note ---- */}
      {isComplete && (
        <div
          style={{
            ...CARD,
            display: 'flex',
            gap: '0.7rem',
            alignItems: 'flex-start',
            background: 'var(--clay-soft, #E8B799)',
          }}
        >
          <span aria-hidden style={{ color: 'var(--clay, #B85A36)', flexShrink: 0, marginTop: 2 }}>
            <CheckCircle2 size={20} strokeWidth={1.9} />
          </span>
          <p style={{ margin: 0, color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6 }}>
            You have the full Triangle, all three corners and the Freedom Finale, with nothing held
            back. Thank you for going all the way. Start at your loudest corner, give it the first ten
            days, then walk the next, and the next.
          </p>
        </div>
      )}

      {/* ---- $97 1:1 call with Joel (the upsell from the $47 complete kit) ---- */}
      {isComplete && (
        <div style={{ ...CARD, borderTop: '4px solid var(--clay, #B85A36)' }}>
          <span style={KICKER}>Go deeper</span>
          <h2 style={{ fontSize: '1.3rem', margin: '0.5rem 0 0.5rem', color: 'var(--ink, #121110)' }}>
            Want Joel on YOUR numbers? Book a 1:1 call.
          </h2>
          <p style={{ margin: '0 0 0.9rem', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6 }}>
            You and Joel, one on one, walking your readings, your medication list, and your Triangle
            together, so you leave knowing exactly what to work first. You book your time the moment
            you pay, straight onto his calendar. Education alongside your doctor, never instead of.
          </p>
          <a
            href={CALL_97_OFFER.paymentLink}
            style={BTN_CLAY}
            onClick={() =>
              track('offer_cta_click', {
                tier: 'call-97',
                from: ownedTier,
                source: 'welcome_call_offer',
                price: CALL_97_OFFER.priceLabel,
              })
            }
          >
            Book my 1:1 call, {CALL_97_OFFER.priceLabel}
            <ArrowRight size={17} strokeWidth={2} />
          </a>
        </div>
      )}

      {/* ---- Doctor-partnership note (compliance spine) ---- */}
      <div
        style={{
          ...CARD,
          display: 'flex',
          gap: '0.7rem',
          alignItems: 'flex-start',
          background: 'var(--paper-warm, #EFE8DB)',
        }}
      >
        <span aria-hidden style={{ color: 'var(--sage, #4A5D4E)', flexShrink: 0, marginTop: 2 }}>
          <Stethoscope size={20} strokeWidth={1.9} />
        </span>
        <p style={{ margin: 0, color: 'var(--muted, #7A7061)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6 }}>
          If your numbers come down, that is wonderful news you bring to your doctor, who makes any
          calls about your medication. This is education to stand alongside your care, never instead of
          it, and you never change a prescription on your own.
        </p>
      </div>

      {/* ---- BraveWorks RN app waitlist (founder perks) ---- */}
      <div style={{ ...CARD, borderTop: '4px solid var(--sage, #4A5D4E)', textAlign: 'center' }}>
        <span style={KICKER}>Coming soon</span>
        <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0 0.4rem', color: 'var(--ink, #121110)' }}>
          The BraveWorks RN app is coming.
        </h2>
        <p style={{ margin: '0 auto 0.9rem', maxWidth: '46ch', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.6 }}>
          Your Triangle in your pocket. Want founder perks when it launches? Join the waitlist, it takes ten seconds.
        </p>
        <Link
          to="/waitlist"
          style={{ ...BTN_CLAY, alignSelf: 'center' }}
          onClick={() => track('waitlist_cta_click', { source: 'welcome_page' })}
        >
          Join the waitlist
          <ArrowRight size={17} strokeWidth={2} />
        </Link>
      </div>

      {/* ---- Single soft, optional mention of the case review (no hard sell) ---- */}
      <p style={{ ...SMALL, textAlign: 'center', maxWidth: '60ch', margin: '2rem auto 0' }}>
        Later on, if you ever want Joel to read your case himself and hand you your exact next moves, he
        offers that too. No need to decide now, your kit is the place to start.
      </p>

      <p style={{ ...SMALL, textAlign: 'center', maxWidth: '60ch', margin: '1rem auto 0' }}>
        This is education and lifestyle support, not medical advice, diagnosis, or treatment, and not a
        substitute for your physician. See our <Link to="/terms" style={TLINK}>Terms</Link> and{' '}
        <Link to="/privacy" style={TLINK}>Privacy Policy</Link>.
      </p>
    </section>
  );
}

// One tier level's section. Owned -> the increment shown UNLOCKED (downloadable
// pieces + any bonus this level adds). Higher than owned -> the SAME increment
// shown LOCKED behind an "Unlock now to get the rest of the kit" button that
// states the real add-on price plainly.
function TierSection({ level, owned, upgrade, fileUrl }) {
  const heading = LEVEL_HEADING[level.tier] || 'Your kit';
  const rows = [...level.modules, ...level.bonuses].filter(Boolean);
  const borderTop = owned ? '4px solid var(--clay, #B85A36)' : '4px solid var(--line, #D8CFBD)';
  const upgradeLine =
    upgrade && UPGRADE_LINE[`${upgrade.fromTier}_${upgrade.targetTier}`]
      ? UPGRADE_LINE[`${upgrade.fromTier}_${upgrade.targetTier}`](upgrade.priceLabel)
      : upgrade
        ? `Unlock this level for ${upgrade.priceLabel}.`
        : '';

  return (
    <div style={{ ...CARD, borderTop }}>
      <div>
        <span
          style={{
            display: 'inline-flex',
            gap: '0.5rem',
            alignItems: 'center',
            fontWeight: 600,
            color: owned ? 'var(--clay, #B85A36)' : 'var(--muted, #7A7061)',
          }}
        >
          {owned ? (
            <>
              <CheckCircle2 size={17} strokeWidth={2} aria-hidden /> Unlocked
            </>
          ) : (
            <>
              <Lock size={16} strokeWidth={2} aria-hidden /> Locked
            </>
          )}
        </span>
        <h2 style={{ fontSize: '1.25rem', margin: '0.4rem 0 0', color: 'var(--ink, #121110)' }}>{heading}</h2>
        {!owned && (
          <p style={{ margin: '0.4rem 0 0', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.55 }}>
            {level.teaser}
          </p>
        )}
      </div>

      <ul style={{ listStyle: 'none', margin: '0.6rem 0 0', padding: 0 }}>
        {rows.map((m) => (
          <DownloadItem key={m.file} module={m} fileUrl={fileUrl} locked={!owned} />
        ))}
      </ul>

      {/* Locked sections get the unlock CTA -> the right upgrade payment link,
          with the real add-on price stated plainly. */}
      {!owned && upgrade && upgrade.paymentLink && (
        <div
          style={{
            marginTop: '0.9rem',
            background: 'var(--paper-warm, #EFE8DB)',
            border: '1px solid var(--line-soft, #E8E1D1)',
            borderRadius: 12,
            padding: '1.1rem 1.2rem',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--ink, #121110)', display: 'block' }}>
            Unlock the rest of your Triangle
          </span>
          <p style={{ margin: '0.4rem 0 0.9rem', color: 'var(--ink-soft, #2B2824)', fontSize: 'var(--step--1, 0.82rem)', lineHeight: 1.55 }}>
            {upgradeLine} It opens right here the moment your payment goes through.
          </p>
          <a
            href={upgrade.paymentLink}
            style={BTN_CLAY}
            onClick={() =>
              track('offer_cta_click', {
                tier: upgrade.targetTier,
                from: upgrade.fromTier,
                source: 'welcome_upgrade',
                price: upgrade.priceLabel,
              })
            }
          >
            Unlock now to get the rest of the kit
            <ArrowRight size={17} strokeWidth={2} />
          </a>
        </div>
      )}
    </div>
  );
}
