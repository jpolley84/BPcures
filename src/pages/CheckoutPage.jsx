import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ShoppingBag, Calendar, Heart, Users, Loader2, Play, TrendingUp, Star, Shield, Zap, Stethoscope, Leaf, Activity, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useHomeVariant } from '@/hooks/useHomeVariant';
// 2026-06-08 — exit-intent / dwell popup now drives the about-to-bounce
// visitor to the FREE quiz (lower-commitment than the $17 ask; the quiz
// captures the email and routes back to the kit on its results page).
// Triggers on mouseleave OR 14s dwell, once per visitor (localStorage
// quizExitPopupShown). Suppressed after purchase. See ExitIntentPopup.jsx.
// 2026-06-09 perf: lazy-load so the homepage stops eagerly pulling
// framer-motion (~11KB gz) for a popup that can't fire for 14s. Streams
// during idle; drops vendor-motion from the homepage's critical path.
import { lazy, Suspense } from 'react';
const ExitIntentPopup = lazy(() => import('../components/ExitIntentPopup'));
// HomepageEmailCapture ("Get Day 1 free") — REMOVED from the page 2026-07-05 at
// Joel's request. Component preserved at src/components/HomepageEmailCapture.jsx.
import { track } from '../utils/analytics.js';

// TRIANGLE MIGRATION: the front product is the $17 Corner Reset, one corner,
// Stress by default. The actual charge is fixed by the Stripe Price behind the
// inline /pay checkout (create-embedded-checkout.js resolves tier=corner to the
// $17 price), NOT by this display constant. 2026-07-03: the "regularly $27,
// today $17" compare-at framing was REMOVED site-wide. $17 is the permanent
// price; there is no sale window in code, so showing one was a fake-sale
// pattern. Anchoring now uses real costs (copays, pill refills), not a
// crossed-out price.
const PRICE = '$17';

// RestoreHER live event (Barbara O'Neill, Galt House, Louisville). Event
// promos on this page stop rendering after the event ends, midnight ET
// June 26, so the evergreen homepage never advertises a past event.
const RESTOREHER_EVENT_OVER = Date.now() > Date.parse('2026-06-26T04:00:00Z');
// 2026-05-18: env-var pattern with hardcoded fallback. The hardcoded ID is
// the front-kit Stripe price; it stays as the safety net so a missing env var
// doesn't break checkout. THIS PRICE OBJECT IS WHAT THE BUYER IS ACTUALLY
// CHARGED — the on-page $27 display (PRICE const above) does NOT change it.
// PHASE 1 (2026-06-22): the real charge is now $27. VITE_STRIPE_KIT_PRICE_ID is
// set in Vercel prod to the $27 price, and the fallback below is the $27 price
// too. To revert to $17, repoint the env var to price_1TQTOlHseZnO3rRZANYJQnpG.
// Product title behind this price reads "...Starter Kit + Companion" (not "Cures").
const STRIPE_KIT_PRICE_ID = import.meta.env.VITE_STRIPE_KIT_PRICE_ID || 'price_1TlYAFHseZnO3rRZoOCNHviq';

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useScrollAnimation(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// 2026-06-09: the BP Triangle method-mark — the brand's signature, proprietary
// visual (drawn on the quiz, previously invisible on the homepage). CSS-only
// draw-on-scroll (.in toggled by the same IntersectionObserver hook); the
// global reduced-motion query renders the final state. No framer-motion on
// this page (React-19 compat + bundle).
function BpTriangle() {
  const [ref, isVisible] = useScrollAnimation(0.3);
  return (
    <div ref={ref} style={{ margin: '26px auto 0', width: 200 }}>
      <svg className={`bp-tri ${isVisible ? 'in' : ''}`} viewBox="0 0 200 174" width="200" height="174" role="img" aria-label="The BP Triangle: Stress, Sugar, and Sodium">
        <polygon points="100,28 36,140 164,140" />
        <circle className="tri-dot d1" cx="100" cy="28" r="4.5" fill="#C8A252" />
        <circle className="tri-dot d2" cx="36" cy="140" r="4.5" fill="#4A5D4E" />
        <circle className="tri-dot d3" cx="164" cy="140" r="4.5" fill="#B85A36" />
        <text className="tri-lab" x="100" y="18" textAnchor="middle" style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '13px', fill: '#5A5F52' }}>Sodium</text>
        <text className="tri-lab" x="22" y="157" textAnchor="middle" style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '13px', fill: '#5A5F52' }}>Stress</text>
        <text className="tri-lab" x="178" y="157" textAnchor="middle" style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '13px', fill: '#5A5F52' }}>Sugar</text>
      </svg>
    </div>
  );
}

const CheckoutPage = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  // Homepage A/B skin (control = proven purple; cream = quiz premium system).
  // Disabled by default — returns 'control' for everyone until AB_CREAM_ENABLED.
  const hpVariant = useHomeVariant();
  const navigate = useNavigate();

  useEffect(() => {
    // 2026-05-20 funnel-audit: dropped threshold 2000 → 600 so the sticky
    // buy bar appears just after the hero. Mobile buyers with mid-page
    // buy-intent no longer have to scroll back to the top to checkout.
    const handleScroll = () => setShowStickyBar(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // TRIANGLE MIGRATION: the buy CTA no longer POSTs to /api/checkout and
  // redirects to buy.stripe.com (the step cold buyers abandoned). It now routes
  // to the INLINE embedded checkout at /pay for the $17 Corner Reset, one
  // corner, Stress by default (a quiz-skipper gets the Stress kit; a buyer who
  // took the quiz gets their own corner, since PayPage reads ?corner then the
  // stored quiz result). The authoritative `purchase` event still fires
  // server-side from the Triangle webhook once payment confirms.
  const handleBuyNow = () => {
    setIsProcessing(true);
    setCheckoutError('');

    // PostHog purchase-intent signal.
    track('checkout_clicked', { product: 'bp-corner-reset', value: 17.00, source: 'checkout-page', homepage_variant: hpVariant });

    // Meta Pixel AddToCart / InitiateCheckout for ad attribution. The Purchase
    // event fires server-side after the webhook confirms.
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', { value: 17.00, currency: 'USD', content_name: 'BP Corner Reset', homepage_variant: hpVariant });
        window.fbq('track', 'InitiateCheckout', { value: 17.00, currency: 'USD', homepage_variant: hpVariant });
      }
    } catch { /* pixel errors must never block checkout */ }

    // Inline checkout: Stress corner by default. PayPage lets ?corner and the
    // stored quiz result override this for buyers who already know their corner.
    navigate('/pay?tier=corner&corner=stress');
  };

  // 2026-06-08 conversion + compliance pass: collapsed the stack to 5 honest,
  // distinct items at believable values (total $89). The free quiz is listed
  // as a $0 post-purchase bonus, not a priced anchor. The "BP Cures" companion
  // book was REMOVED from this free stack because the post-purchase upsell
  // charges for it separately (was a double-charge). A believable ~5x anchor
  // ($89 → $17) converts better than a fake 26x.
  const whatIsIncluded = [
    // These are the EXACT 5 pieces the $17 Corner Reset delivers (api/_kit-manifest.js
    // modulesForTier('corner'): your corner's protocol + formulary + doctor sheet,
    // plus the Tracker and Meal Plan bonuses). Everything listed here is actually
    // shipped in the kit. The Cook For Life cookbook, the other two corners, and the
    // Freedom Finale are $47/$97 upgrade content, so they are NOT promised here.
    // Value stack below totals $258 against the $17 price (Joel restore 2026-07-06).
    // Full 8-item value stack restored by Joel 2026-07-06 (clearer, more appealing
    // names, updated PDFs + the old library). $258 total against the $17 price.
    // DELIVERY MUST MATCH: every item here needs its PDF shipped in the kit (see
    // DownloadsPage / api/_kit-manifest.js) or buyers hit the not-received gap.
    { name: 'Master Blood Pressure Document', description: "The full protocol. What to take, when to take it, how much.", value: '$47' },
    { name: 'Top 10 Herbs Deep Dive', description: "Each herb matched to the drug it mimics, with dosages your doctor never learned in med school.", value: '$27' },
    { name: '10-Day BP Reset Protocol', description: "Wake up. Open that day's PDF. Follow the checklist. That's the whole system.", value: '$97' },
    { name: 'Cook For Life Cookbook', description: "Plant-based recipes built around the herbs and foods that move your numbers.", value: '$27' },
    { name: 'White Coat Syndrome Guide', description: "Why your readings at the doctor are probably wrong, and the 2-minute trick nurses use to get real numbers.", value: '$17' },
    { name: 'Blood Pressure FAQ', description: "25 questions you're too afraid to ask your doctor, answered plainly by a nurse who's heard them all.", value: '$12' },
    { name: 'Health & Progress Tracker', description: "Print it. Stick it on your fridge. Log your numbers. Watch what happens.", value: '$12' },
    { name: 'BONUS: Overmedicated Boomers Book', description: "The book Big Pharma doesn't want on your nightstand. What your generation was never told about the drugs you're taking.", value: '$19' },
  ];

  const timeEffortKillers = [
    { icon: Clock, headline: '15 minutes a day', description: "That's it. Follow the daily checklist." },
    { icon: ShoppingBag, headline: 'Common grocery store ingredients', description: 'No specialty shops. No strange powders.' },
    { icon: Calendar, headline: 'A clear daily step from Day 1', description: "Most people finish the day's checklist in under 15 minutes." },
  ];

  return (
    <div className="min-h-screen bg-white pb-20" data-hpvariant={hpVariant}>
      {/* Top credibility strip. 2026-06-08 conversion pass.
          Was a /quiz link, which gave buy-ready traffic a free exit at the
          very top of the page. Replaced with a non-clickable credibility
          strip so the first thing a visitor sees is proof + price + risk
          reversal, not an off-ramp. A subtle quiz path still lives in the
          footer for visitors who genuinely want the diagnostic first. */}
      {/* RestoreHER live-event banner. The FIRST thing a visitor sees:
          colorful urgency-style ad with both ticket paths (in-person +
          virtual). Date-gated: stops rendering after the event ends
          (June 25, 2026) so the evergreen page never advertises a past
          event. 2026-06-11: upgraded from the slim ribbon per Joel. */}
      {!RESTOREHER_EVENT_OVER && (
        <>
          <style>{`
            @keyframes rhShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            .rh-ribbon-shine {
              background: linear-gradient(100deg, #C7A95E 20%, #FFF3D6 40%, #C7A95E 60%);
              background-size: 200% auto;
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: rhShimmer 3.5s linear infinite;
            }
            @keyframes rhPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(242, 212, 155, 0.55); }
              50% { box-shadow: 0 0 0 7px rgba(242, 212, 155, 0); }
            }
            .rh-urgency-chip { animation: rhPulse 2s ease-in-out infinite; }
            .rh-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .rh-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.28); }
            @media (prefers-reduced-motion: reduce) {
              .rh-ribbon-shine { animation: none; -webkit-text-fill-color: #C7A95E; }
              .rh-urgency-chip { animation: none; }
            }
          `}</style>
          <div
            className="text-center"
            style={{
              background: 'linear-gradient(135deg, #4A1224 0%, #7A2238 45%, #93283F 70%, #5C1A2E 100%)',
              padding: '18px 16px 20px',
              borderBottom: '3px solid #C7A95E',
            }}
          >
            <div
              className="rh-urgency-chip"
              style={{
                display: 'inline-block',
                background: '#F2D49B',
                color: '#4A1224',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                padding: '5px 14px',
                marginBottom: '10px',
              }}
            >
              🔥 Live event · Tickets going fast
            </div>
            <div style={{ color: '#FDF6EA', fontSize: 'clamp(19px, 3.4vw, 26px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '0.01em' }}>
              <span className="rh-ribbon-shine">Barbara O&rsquo;Neill</span> LIVE in Louisville &mdash; Restore Your Hormones
            </div>
            <div style={{ color: '#E9C8A6', fontSize: '15px', fontWeight: 600, marginTop: '4px', marginBottom: '14px' }}>
              June 24 &amp; 25 &middot; The Galt House Hotel &middot; in-person seats are limited
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://restoreherhormones.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rh-btn inline-flex items-center justify-center gap-2"
                style={{
                  background: '#F2D49B',
                  color: '#4A1224',
                  fontWeight: 800,
                  fontSize: '15px',
                  borderRadius: '12px',
                  padding: '13px 24px',
                  textDecoration: 'none',
                  minWidth: '220px',
                }}
              >
                🎟 In-Person Tickets <span aria-hidden="true">&rarr;</span>
              </a>
              <a
                href="https://www.everydaynurse.com/event-virtual"
                target="_blank"
                rel="noopener noreferrer"
                className="rh-btn inline-flex items-center justify-center gap-2"
                style={{
                  background: 'transparent',
                  color: '#FDF6EA',
                  border: '2px solid #C7A95E',
                  fontWeight: 700,
                  fontSize: '15px',
                  borderRadius: '12px',
                  padding: '11px 24px',
                  textDecoration: 'none',
                  minWidth: '220px',
                }}
              >
                💻 Virtual Tickets <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </>
      )}

      <div
        className="block text-center"
        style={{
          background: '#3F5A3C',
          color: '#FBF8F1',
          padding: '14px 16px',
          fontSize: '16px',
          fontWeight: 600,
          lineHeight: 1.6,
          letterSpacing: '0.01em',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        RN-built. Trusted by 500K+. {PRICE}.&nbsp;
        <span style={{ color: '#C7A95E' }}>30-day Feel-It-or-Free.</span>
      </div>

      {/* Headshot — WebP for modern browsers (14KB) + JPG fallback (36KB).
          2026-05-12: was a 2MB PNG that killed mobile LCP. Now <40KB total. */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center">
          <div className="headshot-ring">
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN. The Blood Pressure Guy. 20 years ICU and emergency medicine, naturopathic-trained"
                width="180"
                height="180"
                fetchpriority="high"
                className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-full shadow-xl"
                style={{ objectFit: 'cover', border: '4px solid white' }}
              />
            </picture>
          </div>
        </div>
      </div>

      {/* Credential Bar. 2026-06-08: text bumped to 16px/1.6 for aging eyes,
          and the secondary "free BP quiz" off-ramp removed so the bar reads as
          pure credibility (the quiz now lives only in the footer). */}
      <div className="credential-bar py-3.5" style={{ animation: 'softRise 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
        <div className="container-mobile-first">
          <p className="text-center font-medium" style={{ color: 'var(--white)', fontSize: '16px', lineHeight: '1.6', letterSpacing: '0.02em' }}>
            Joel Polley, RN · The Blood Pressure Guy · 20 Years ICU & Emergency Medicine
          </p>
        </div>
      </div>

      {/* 2026-06-09 UI: ECG heartbeat brand-rule — the medical-system
          signature, drawn from the asset already in index.css. Decorative,
          aria-hidden, animation neutralized by the global reduced-motion query. */}
      <div aria-hidden="true" style={{ padding: '6px 0 2px', background: '#F8F9FA' }}>
        <svg className="ecg-rule" viewBox="0 0 600 28" preserveAspectRatio="none">
          <path d="M0,14 L250,14 L262,14 L270,3 L279,25 L288,6 L296,14 L600,14" />
        </svg>
      </div>

      {/* Social Proof Strip — 2026-05-25: clickable FB/TikTok/IG icons +
          500K subscriber count. Inline SVG for TikTok (not in lucide). */}
      <div className="py-5 bg-[#F8F9FA]" style={{ animation: 'softRise 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
        <div className="container-mobile-first">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <span className="text-[13px] text-[#555] font-medium uppercase" style={{ letterSpacing: '0.08em' }}>
              Trusted by over 500K subscribers
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/61569919026849"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on Facebook"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
                style={{ background: '#1877F2', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.1 24 18.1 24 12.07z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@braveworksrn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on TikTok"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
                style={{ background: '#000000', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/braveworksrn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on Instagram"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
                style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.38C1.35 2.67.94 3.34.63 4.13c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.33 1.35 20.66.94 19.87.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>
                </svg>
              </a>
              {/* App Store icon -> app waitlist (2026-07-05). Same round-icon
                  treatment as the socials, with a tiny "coming soon" caption. */}
              <Link
                to="/waitlist"
                aria-label="BraveWorks RN app, coming soon. Join the waitlist"
                onClick={() => track('waitlist_cta_click', { source: 'social_strip' })}
                className="inline-flex items-center gap-2"
                style={{ textDecoration: 'none' }}
              >
                <span
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
                  style={{ background: '#0D1117', color: '#FFFFFF' }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </span>
                <span style={{ color: 'var(--dark-gray)', fontSize: '11px', lineHeight: 1.3, fontWeight: 600, textAlign: 'left' }}>
                  App coming<br />soon &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero. 2026-06-08 conversion pass.
          H1 is now outcome-first and compliant (no cure / reverse / off-meds).
          The backstory ("I gave this to my mom first") moves to the subhead.
          Risk reversal and the honest $89 → $17 anchor now sit above the fold
          in the subline so buyers see proof + price + guarantee before scroll. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          {/* Community proof badge — replaces the refund badge above the H1.
              The refund moves to microcopy (post-hook, where it removes
              friction instead of pre-empting it). */}
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full" style={{ background: '#F3E8FF', border: '1px solid #E9D5FF' }}>
            <Users size={13} style={{ color: '#6C3483' }} />
            <span style={{ color: '#6C3483', fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
              Read by 1,100+ in the BraveWorks community
            </span>
          </div>
          {/* Hero rework (2026-07-05, Joel): no TikTok phrasing, fast-scan
              punchy lines instead of paragraphs. Drug-name callout stays (the
              pattern interrupt); everything after it is one short line each. */}
          <h1 className="font-extrabold mb-5 text-balance" style={{ color: 'var(--navy)', fontSize: '30px', lineHeight: '1.15', letterSpacing: '-0.03em' }}>
            Amlodipine. Lopressor. HCTZ.<br />Still taking them. Still high?
          </h1>
          <p className="mb-4" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: '1.6' }}>
            A 20-year ICU nurse built a 10-day reset for people on BP meds. They call him <strong>The Blood Pressure Guy</strong>.
          </p>
          <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['Your pressure has three corners.', 'Stress. Sugar. Sodium.'],
              ['Pills work one corner.', 'The other two pull your number right back.'],
              ['This kit works all three.', 'Alongside your doctor, never instead.'],
            ].map(([lead, rest], i) => (
              <p key={i} style={{ margin: 0, color: 'var(--dark-gray)', fontSize: '16px', lineHeight: '1.5' }}>
                <strong style={{ color: 'var(--navy)' }}>{lead}</strong> {rest}
              </p>
            ))}
          </div>
          <p style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.5' }}>
            Your Corner Reset &middot; 10 days &middot; <strong style={{ color: 'var(--dark-gray)' }}>{PRICE}, one time</strong> &middot; 30-day Feel-It-or-Free guarantee
          </p>
          {/* Above-the-fold CTA: one-tap kit buy for TikTok traffic (mobile + desktop),
              plus a quiz off-ramp for anyone who wants to see their corner first. */}
          <div className="mt-6 mx-auto" style={{ maxWidth: '400px' }}>
            <button
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="w-full btn-standard btn-cta text-white font-bold text-[17px] gradient-purple-btn"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                `Get my $17 kit`
              )}
            </button>
            <Link
              to="/quiz"
              className="block text-center mt-3"
              style={{ color: 'var(--purple, #6C3483)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Want to see your corner first? Take the free quiz
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* What's Inside */}
      <div className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-8 text-balance" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: '1.3' }}>
              What's inside
            </h2>
          </AnimatedSection>

          <div className="space-y-3 mb-8">
            {whatIsIncluded.map((item, index) => (
              <AnimatedSection key={index} delay={index * 60}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                  <CheckCircle2 size={22} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--purple)' }} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold mb-0.5" style={{ color: 'var(--dark-gray)', fontSize: '17px' }}>{item.name}</p>
                        <p style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.4' }}>{item.description}</p>
                      </div>
                      <span className="value-strike flex-shrink-0 font-medium" style={{ color: 'var(--muted-gray)', fontSize: '15px' }}>{item.value}</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Total value as a BIG addition problem right under the stack (Joel
              2026-07-05), with the CTA button as the very next element. */}
          <AnimatedSection>
            <div className="pt-4 text-center">
              <p className="mb-1" style={{ color: 'var(--muted-gray)', fontSize: '17px', fontWeight: 600, letterSpacing: '0.02em' }}>
                $47 + $27 + $97 + $27 + $17 + $12 + $12 + $19
              </p>
              <div className="mx-auto mb-2" style={{ width: '220px', borderBottom: '2px solid var(--navy)' }} />
              <p className="font-extrabold mb-5" style={{ color: 'var(--navy)', fontSize: '34px', lineHeight: 1.1 }}>
                = <span className="line-through" style={{ textDecorationThickness: '3px' }}>$258</span> value
              </p>

              {checkoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center w-full sm:max-w-[440px] mx-auto">
                  {checkoutError}
                </div>
              )}

              {/* "You pay $17" IS the button (Joel 2026-07-05): one big CTA
                  right under the total, no redundant price line above it. */}
              <button
                onClick={handleBuyNow}
                disabled={isProcessing}
                className="w-full sm:max-w-[440px] mx-auto block btn-cta text-white font-extrabold mb-3 gradient-purple-btn"
                style={{ fontSize: '24px', padding: '22px 32px', borderRadius: '16px' }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={24} /> Processing...
                  </span>
                ) : (
                  `You pay ${PRICE}`
                )}
              </button>

              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[#9CA3AF]" />
                  <span style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#9CA3AF]" />
                  <span style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>Instant download</span>
                </div>
              </div>
              <p className="mt-2" style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>That's less than one copay.</p>

              {/* Detailed refund block. Closes the buy-decision loop with risk reversal. */}
              <div className="mt-5 max-w-[420px] mx-auto p-4 rounded-xl text-left" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                <div className="flex items-start gap-2.5">
                  <Shield size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#6C3483' }} />
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#4A2964', fontSize: '14px' }}>
                      The Feel-It-or-Free Promise
                    </p>
                    <p style={{ color: '#3E2451', fontSize: '15px', lineHeight: '1.55' }}>
                      Joel's promise: Run the full 10-day plan. If you don't feel a difference, reply with the word <strong>REFUND</strong> and your money comes back. Keep the books either way. No hoops, no doctor visits, no fine print.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* What else $17 buys you (funny perspective) vs the price of saying
              no. Both listicles (Joel 2026-07-05). */}
          <AnimatedSection>
            <div className="max-w-[640px] mx-auto mt-10 grid gap-4 sm:grid-cols-2">
              <div className="p-5 rounded-xl text-left" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="font-bold mb-2" style={{ color: '#166534', fontSize: '16px' }}>What else $17 buys you</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'One DoorDash burrito, after the fees',
                    'Two fancy coffees and a tip',
                    'A month of a streaming service you forgot you pay for',
                    'About half of one copay',
                  ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ShoppingBag size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
                      <span style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.5 }}>{line}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mt-3">
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#166534' }} />
                  <span className="font-semibold" style={{ color: '#166534', fontSize: '14px', lineHeight: 1.5 }}>
                    Or: a nurse-built reset you keep for life.
                  </span>
                </div>
              </div>
              <div className="p-5 rounded-xl text-left" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="font-bold mb-2" style={{ color: '#991B1B', fontSize: '16px' }}>The price of saying no</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Another year of refills and copays',
                    'The number creeping up',
                    'The dose creeping up with it',
                    'The same dread before every reading',
                  ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <XCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                      <span style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.5 }}>{line}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mt-3">
                  <XCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#991B1B' }} />
                  <span className="font-semibold" style={{ color: '#991B1B', fontSize: '14px', lineHeight: 1.5 }}>
                    That path costs a lot more than $17.
                  </span>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Testimonials. 2026-06-08: lead quote is now a BP-number +
              physician-oversight story (was a weight-loss / "off 2 meds"
              quote with no doctor context). Every quote now keeps the doctor
              in the loop. "Results not typical" note added below. */}
          <AnimatedSection className="pt-14 pb-4">
            <h3 className="text-center font-bold text-[18px] text-[#2C3E50] mb-8">What people are saying</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { quote: "My numbers went from the 150s/90s to the 130s/80s over six weeks, and my doctor and I are watching it together.", source: 'Michael T., 61 · Denver, CO' },
                { quote: "I was on Lisinopril for 9 years. After 3 weeks on the protocol my systolic dropped 18 points and my doctor cut my dose in half. First time in a decade anyone suggested I might need less medication.", source: 'Deborah R., 54 · Houston, TX' },
                { quote: "Fasting glucose went from 134 to 112. Resting heart rate from 86 to 74. My cardiologist asked what I changed. I showed him Joel's protocol and he said 'keep doing that.'", source: 'Maureen K., 62 · Tampa, FL' },
                { quote: "I was on 14 BP pills and my pressure was still high. I started doing what Joel taught me, and it came down so far my doctor told me I could start coming off my meds.", source: 'Jackie B.' },
              ].map((t, i) => (
                <div key={i} className="testimonial-card p-6 flex flex-col h-full">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="fill-[#F39C12] text-[#F39C12]" />
                    ))}
                  </div>
                  <p className="text-[#4A4A4A] italic text-[15px] mb-4 flex-grow leading-relaxed">"{t.quote}"</p>
                  <p className="text-[#9CA3AF] text-[13px] font-medium">{t.source}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-6" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: '1.5' }}>
              Results not typical. Most readers see modest results or none. Always work with your doctor.
            </p>
            <p className="text-center mt-2" style={{ color: 'var(--dark-gray)', fontSize: '15px', fontWeight: 600, lineHeight: '1.5' }}>
              But most <em>doers</em> see modest to excellent results. The difference is doing the work.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* Mid-page quiz CTA (2026-06-18): captures scrollers who aren't
          ready to buy. Positioned BELOW the offer + testimonials so it
          never competes with the buy decision — only catches people who
          scrolled past it. Soft tone, no competing button style. */}
      <AnimatedSection>
        <div className="py-8 text-center" style={{ background: '#FAFAFA' }}>
          <div className="container-mobile-first">
            <p style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 10px' }}>
              Not sure if this kit is right for you?
            </p>
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all hover:shadow-md"
              style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', color: '#6C3483', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}
            >
              <Activity size={16} />
              Take the free 90-second BP quiz
              <ArrowRight size={15} />
            </Link>
            <p style={{ color: '#B0B0B0', fontSize: '12px', marginTop: '8px' }}>
              No email required. See where your numbers stand.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== THE METHOD — relocated BELOW the offer (2026-06-12, Joel:
          "offer stack as close to the top as possible; method under it").
          Flow: reframe → mechanism (Triangle) → destination (the path) →
          punchline. ===== */}
      <hr className="gradient-divider" />

      {/* Reframe band — the big idea */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <p className="text-center" style={{ color: 'var(--clay, #B85A36)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 18px' }}>
            The BP Triangle Method
          </p>
          <div
            className="max-w-[600px] mx-auto text-center rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #FBF8F1 0%, #F3E8FF 100%)',
              border: '1px solid #E9D5FF',
              padding: 'clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px)',
            }}
          >
            <p
              className="font-extrabold text-balance"
              style={{ color: 'var(--navy)', fontSize: 'clamp(22px, 4.5vw, 28px)', lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0 }}
            >
              You don't have a blood pressure problem.{' '}
              <span style={{ color: 'var(--purple, #6C3483)' }}>You have a Triangle problem.</span>
            </p>
            <p
              className="text-balance"
              style={{ color: 'var(--dark-gray)', fontSize: 'clamp(16px, 3.2vw, 19px)', lineHeight: 1.6, margin: '14px 0 0', fontWeight: 600 }}
            >
              Fix the Triangle and your BP fixes itself — under your doctor's supervision, without pills, without herbs, for life.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* The 3 lies debunked — for the logical buyer who wants the reasoning
          below the offer. Genetic, permanent, and a heart problem: all three wrong. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <h2 className="text-center font-bold text-balance" style={{ color: 'var(--navy)', fontSize: 'clamp(20px, 4vw, 26px)', lineHeight: 1.3, margin: '0 0 8px' }}>
            The 3 lies you've been told about your blood pressure
          </h2>
          <p className="text-center mx-auto" style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 28px' }}>
            Every one of these keeps people managing a number for thirty years instead of working the cause. Here is what twenty years at the bedside taught me instead.
          </p>
          <div className="max-w-[640px] mx-auto flex flex-col gap-4">
            {[
              {
                lie: 'It is genetic.',
                truth: 'Your genes may load the odds, but what you eat, how you move, and how you handle stress drive your number far more than your DNA does. That is the part you actually get to work.',
              },
              {
                lie: 'It is permanent. You will be on pills for life.',
                truth: 'Managed for thirty years is not the same as addressed. A pill quiets one corner while the other two keep pulling. Work all three and the number has room to move, always alongside your doctor, never instead of.',
              },
              {
                lie: 'It is a heart problem.',
                truth: 'Your heart is the pump reading the pressure, not the source of it. The pressure itself is a loop of three drivers, Stress, Sugar, and Sodium. You work the drivers, not just the pump.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: 'var(--white, #FFFFFF)', border: '1px solid var(--light-gray, #E5E7EB)', boxShadow: '0 1px 3px rgba(18,17,16,0.05)' }}>
                <p className="font-bold mb-2" style={{ color: '#B91C1C', fontSize: '16px' }}>
                  <span aria-hidden="true">&#10007;</span>{' '}
                  <span style={{ textDecoration: 'line-through', textDecorationColor: 'rgba(185,28,28,0.5)' }}>&ldquo;{item.lie}&rdquo;</span>
                </p>
                <p style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--navy)' }}>The truth:</strong> {item.truth}
                </p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* AND Statement + Triangle diagram — the mechanism */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="max-w-[520px] mx-auto text-center">
            <p style={{ color: 'var(--dark-gray)', fontSize: '17px', lineHeight: '1.5', fontWeight: 600, margin: '0 0 14px' }}>
              Pills manage output. Protocol fixes input.
            </p>
            <p className="italic" style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
              This works alongside your doctor's care, not instead of it. Natural support AND medical guidance. That's the BraveWorks way.
            </p>
            <BpTriangle />
          </div>
        </div>
      </AnimatedSection>

      {/* Where this is headed — the destination/"vacation". Every medication
          step doctor-led + explicit "never stop on your own" guardrail. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="max-w-[600px] mx-auto">
            <p className="text-center" style={{ color: 'var(--clay, #B85A36)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Where this is headed
            </p>
            <h2 className="font-bold text-balance text-center" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: 1.25, margin: '0 0 8px' }}>
              The goal was never more pills. It's freedom.
            </h2>
            <p className="text-center" style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Here is the whole path, in plain words. You walk it <strong>with your doctor</strong>, one step at a time.
            </p>

            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['1', 'We find the cause.', 'Most plans just chase the number. We look for what is pushing it up: your Stress, your Sugar, your Sodium. Fix the cause, and the number follows.'],
                ['2', 'We build you up, naturally.', 'While your body gets stronger, we lean on real food, simple daily habits, and natural supports. This walks with your doctor’s care, never instead of it.'],
                ['3', 'Your doctor may lower your medicine.', 'As your numbers steady, many people work with their doctor to step their pills down. Only your doctor makes that call. Never start, stop, or change a medicine on your own.'],
                ['4', 'The extra supports wind down.', 'Once the cause stays fixed, your body needs less help. Fewer things to take. Fewer things to think about.'],
                ['5', 'You put the cuff away.', 'The dream: a steady, healthy number you trust, and a cuff that lives in a drawer. Some folks toss it in the trash.'],
              ].map(([n, title, body]) => (
                <li key={n} className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-gray-100">
                  <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full font-bold" style={{ width: 30, height: 30, background: 'var(--navy)', color: '#fff', fontSize: 15 }}>{n}</span>
                  <div className="flex-1">
                    <p style={{ color: 'var(--navy)', fontSize: 17, fontWeight: 700, lineHeight: 1.3, margin: '0 0 3px' }}>{title}</p>
                    <p style={{ color: 'var(--dark-gray)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-center font-bold" style={{ color: 'var(--navy)', fontSize: 18, lineHeight: 1.5, margin: '24px 0 0' }}>
              Find the cause. Heal it. Walk free, with your doctor beside you the whole way.
            </p>

            <p style={{ color: 'var(--muted-gray)', fontSize: 13, lineHeight: 1.6, margin: '16px 0 0', textAlign: 'center', fontStyle: 'italic' }}>
              This is education, not medical advice, and not a promise of any result. Your doctor guides every step that involves your medication. Never start, stop, or change any medicine on your own.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Gut Punch Quote — closes the method */}
      <AnimatedSection className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <blockquote className="quote-accent italic pl-5 py-1" style={{ color: 'var(--dark-gray)', fontSize: '20px', lineHeight: '1.5', fontWeight: 500 }}>
            Genetics writes the recipe. Lifestyle bakes the cake.
            <footer style={{ marginTop: '0.75rem', fontSize: '14px', fontStyle: 'normal', fontWeight: 600, color: 'var(--clay, #B85A36)' }}>Joel, RN</footer>
          </blockquote>
        </div>
      </AnimatedSection>

      {/* Supporting Text */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first text-center">
          <p className="mb-2" style={{ color: 'var(--dark-gray)', fontSize: '15px' }}>
            Instant download to your phone. Start today.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
            Secure checkout. Credit card, debit, Apple Pay, or Google Pay.
          </p>
        </div>
      </AnimatedSection>

      {/* Time & Effort Killers */}
      <div className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {timeEffortKillers.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <AnimatedSection key={index} delay={index * 120}>
                  <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,93,78,0.09)', border: '1px solid rgba(74,93,78,0.18)' }}>
                      <IconComponent size={28} style={{ color: '#3F5A3C' }} />
                    </div>
                    <p className="font-bold mb-2" style={{ color: 'var(--dark-gray)', fontSize: '18px' }}>{item.headline}</p>
                    <p style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.5' }}>{item.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10">
            {[
              { icon: Stethoscope, text: '20-Year ICU/ER Nurse' },
              { icon: Leaf, text: 'Naturopathic-Trained' },
              { icon: Users, text: '500K+ across TikTok, Facebook & Instagram' },
            ].map((item, index) => (
              <div key={index} className="proof-badge px-5 py-3">
                <item.icon size={20} style={{ color: '#B85A36' }} />
                <span className="font-medium" style={{ color: 'var(--dark-gray)', fontSize: '15px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA */}
      <div className="section-spacing gradient-navy">
        <div className="container-mobile-first text-center">
          <AnimatedSection>
            <p className="mb-8" style={{ color: 'var(--white)', fontSize: '19px', lineHeight: '1.7' }}>
              You've watched the videos. You've commented. You've wondered if there's another way. There is. And it's {PRICE}.
            </p>
            <button
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="btn-standard text-white font-bold text-[16px] mb-4"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                `Buy Now for ${PRICE}`
              )}
            </button>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              Instant access &middot; Secure checkout &middot; 30-day Feel-It-or-Free
            </p>

            {/* P.S. block. 2026-06-08: restates the offer, guarantee, and
                instant download in plain language. Compliant: no outcome or
                timing claims. 2026-07-03: compare-at framing removed here too. */}
            <p className="mt-8 max-w-[480px] mx-auto text-left" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px', lineHeight: '1.7' }}>
              <strong style={{ color: 'var(--white)' }}>P.S.</strong> Your Corner Reset is your loudest corner worked first, Stress by default, as a set of three: the day by day protocol, the herb formulary with safe amounts and cautions, and a one page sheet to bring to your doctor. It is {PRICE}, one time. Pills and copays run hundreds a year; this is one copay, once. Download it the second you buy. Run the full 10 days. If you do not feel it was worth it, reply REFUND and your money comes back. Keep the guides either way. That is the 30-day Feel-It-or-Free promise.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* Sticky Mobile Buy Bar. 2026-06-09: always rendered, slides up via
          transform instead of hard-popping at scrollY>600 (read as a glitch).
          Same showStickyBar flag + 600px threshold (tuned — do not change).
          iOS safe-area padding so it clears the home-gesture zone. */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 sticky-bar"
        style={{
          minHeight: '64px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transform: showStickyBar ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
        aria-hidden={!showStickyBar}
      >
        <div className="flex items-center justify-between px-4 max-w-[640px] mx-auto" style={{ height: '64px' }}>
            <div>
              <p className="font-bold truncate max-w-[140px]" style={{ color: 'var(--white)', fontSize: '15px' }}>
                Corner Reset
              </p>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--gold)' }}>{PRICE}</p>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="px-6 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-70 gradient-purple-btn"
              style={{ color: 'var(--white)', fontSize: '14px', minHeight: '44px' }}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Buy Now for ${PRICE}`}
            </button>
          </div>
        </div>

      {/* Cross-sell box: hormones (RestoreHER). REMOVED FOR NOW (2026-07-01, Joel's
          request). Kept behind a false gate so it is one edit to bring back for a
          future RestoreHER event. Nothing in this block renders. */}
      {false && (
      <div className="py-12" style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="mx-auto text-center" style={{ maxWidth: '540px', background: 'var(--light-gray)', borderRadius: '16px', padding: '30px 24px' }}>
              <p className="mb-2" style={{ color: 'var(--muted-gray)', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
                For women
              </p>
              <h3 className="mb-3" style={{ color: 'var(--navy)', fontSize: '23px', fontWeight: 700, lineHeight: 1.3 }}>
                Is it your hormones, not just your pressure?
              </h3>
              <p className="mb-6 mx-auto" style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.65, maxWidth: '440px' }}>
                Hot flashes, weight that will not move, mood swings, the bone-deep tired. If hormonal imbalance is the real story, our sister program <strong>RestoreHER Hormones</strong> was built for you{RESTOREHER_EVENT_OVER ? '.' : ', and Barbara O\'Neill is teaching it live, in person, this month.'}
              </p>
              {!RESTOREHER_EVENT_OVER && (
                <a href="https://restoreherhormones.com" target="_blank" rel="noopener noreferrer" className="block mb-3 mx-auto" style={{ maxWidth: '420px' }}>
                  <img
                    src="/images/restoreher-flyer.jpg"
                    alt="Restore Your Hormones. Featuring Barbara O'Neill, internationally acclaimed speaker and natural health expert. PCOS, perimenopause, menopause, feel like yourself again. June 24 and 25, 2026, two powerful days. The Galt House Hotel, Louisville, Kentucky. Register today at restoreherhormones.com"
                    loading="lazy"
                    style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 28px rgba(92,26,46,0.25)' }}
                  />
                </a>
              )}
              {!RESTOREHER_EVENT_OVER && (
                <p className="mb-5 mx-auto" style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.6, maxWidth: '440px' }}>
                  <strong>VIP Platinum perk:</strong> buy a VIP Platinum ticket, get a friend to grab her VIP Platinum ticket too, and your hotel room at the Galt House is on us.
                </p>
              )}
              <a
                href="https://restoreherhormones.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold transition-all duration-200 active:scale-95"
                style={RESTOREHER_EVENT_OVER
                  ? { border: '1.5px solid var(--navy)', color: 'var(--navy)', borderRadius: '12px', padding: '13px 26px', fontSize: '15px' }
                  : { background: '#7A2238', color: '#FFFFFF', borderRadius: '12px', padding: '14px 28px', fontSize: '15px', fontWeight: 700 }}
              >
                {RESTOREHER_EVENT_OVER ? 'Visit RestoreHER Hormones' : 'Register today'}
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </div>
      )}

      {/* BraveWorks RN app waitlist — simple founder-perks CTA (2026-07-05). */}
      <div className="py-10" style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--light-gray)' }}>
        <div className="container-mobile-first text-center">
          <p className="mb-1" style={{ color: 'var(--muted-gray)', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
            Coming soon
          </p>
          <h3 className="mb-2" style={{ color: 'var(--navy)', fontSize: '21px', fontWeight: 700 }}>
            The BraveWorks RN app is coming.
          </h3>
          <p className="mb-5 mx-auto" style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.6, maxWidth: '420px' }}>
            Want to join the waitlist for founder perks? It takes ten seconds.
          </p>
          <Link
            to="/waitlist"
            onClick={() => track('waitlist_cta_click', { source: 'landing_page' })}
            className="inline-flex items-center gap-2 font-bold transition-all duration-200 active:scale-95"
            style={{ background: 'var(--purple, #6C3483)', color: '#FFFFFF', borderRadius: '12px', padding: '14px 28px', fontSize: '15px' }}
          >
            Join the waitlist
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* "Get Day 1 free" email capture REMOVED 2026-07-05 (Joel's request).
          Component preserved at src/components/HomepageEmailCapture.jsx. */}

      {/* Footer. 2026-06-08 conversion + compliance pass.
          The old prominent "Not ready to buy? Take the quiz" section was a
          styled button that competed with the buy decision; it's now a small
          inline text link inside this footer (discoverable, not a CTA).
          Added a legal disclosure block because this page renders standalone
          with no shared site Footer, so /disclaimer /terms /privacy were
          otherwise unreachable. */}
      <div className="py-8" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <p className="text-center mb-4" style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: '1.55' }}>
            Not ready to buy? <Link to="/quiz" style={{ color: 'var(--purple)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Take the free 90-second BP quiz first.</Link>
          </p>

          {/* Legal disclosure */}
          <div className="max-w-[560px] mx-auto text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px' }}>
              These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, or prevent any disease.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              Educational and lifestyle content only. Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or adjust medication without your doctor.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              Results not typical. Most readers see modest results or none.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <a href="/disclaimer" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Disclaimer</a>
              {' · '}
              <a href="/terms" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</a>
              {' · '}
              <a href="/privacy" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy</a>
            </p>
            <p style={{ margin: 0 }}>
              &copy; 2026 BraveWorks RN. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Exit-intent + dwell-time popup -> drives to the free /quiz. Renders an
          absolutely-positioned overlay; tree position doesn't matter for layout.
          One-shot per visitor (localStorage quizExitPopupShown). Suppressed
          after purchase (localStorage purchaseCompleted). */}
      <Suspense fallback={null}><ExitIntentPopup /></Suspense>
    </div>
  );
};

export default CheckoutPage;
