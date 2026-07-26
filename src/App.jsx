import React, { lazy, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from './components/ScrollToTop';
import SabbathGate from './components/SabbathGate';
// ExitIntentPopup (free-cookbook lead-magnet) — pulled 2026-05-11 at Joel's
// request. Component preserved in src/components/ExitIntentPopup.jsx if we
// want it back. ChallengeBanner — also pulled (2026-05-10).
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// 2026-05-12: The new landing page is the bpcures-style sales letter
// (CheckoutPage.jsx — ported from Hostinger Horizons bpcures.com). Quiz moved
// to /quiz for SEO + warm-traffic landing. The split test showed cold TikTok
// traffic converts ~3× higher on the sales-letter format vs the quiz.
import CheckoutPage from './pages/CheckoutPage'; // eager — landing page
// 2026-07-16 A/B test: '/' renders HomeSplit, a sticky 50/50 split between
// CheckoutPage (variant 'a', unchanged) and QuizFirstLanding (variant 'b',
// quiz-first). Eager import — it wraps the landing. See pages/HomeSplit.jsx.
import HomeSplit from './pages/HomeSplit';

// All other routes are lazy-loaded. Users who land on `/` (99% of traffic)
// only download the landing chunk; the rest stream on-demand when their
// route is visited.
const QuizPage = lazy(() => import('./pages/QuizPage'));
// 2026-07-16 Annie-v2 funnel: the 5 Hidden Triggers quiz (variant B of the
// homepage split routes here). Landing lives in pages/TriggerLanding.jsx and
// renders via HomeSplit; the quiz + email gate + results live at /triggers.
const TriggerQuizPage = lazy(() => import('./pages/TriggerQuizPage'));
// 2026-07-26 foods101-v1: the squeeze + its tripwire thank-you page.
const FoodsGuideLanding = lazy(() => import('./pages/FoodsGuideLanding'));
const FoodsGuideThanks = lazy(() => import('./pages/FoodsGuideThanks'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const LauncherPage = lazy(() => import('./pages/LauncherPage'));
const LauncherQuizPage = lazy(() => import('./pages/LauncherQuizPage'));
const LauncherResultsPage = lazy(() => import('./pages/LauncherResultsPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const UpsellBpResetKitPage = lazy(() => import('./pages/UpsellBpResetKitPage'));
const OtoCompletePage = lazy(() => import('./pages/OtoCompletePage'));
const SprintAssessmentPage = lazy(() => import('./pages/SprintAssessmentPage'));
const UpsellBpCureBookPage = lazy(() => import('./pages/UpsellBpCureBookPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
// Inline Stripe embedded checkout for the new Triangle kits (no buy.stripe.com
// redirect). Ported from braveworks-bp; charges via /api/create-embedded-checkout.
const PayPage = lazy(() => import('./pages/PayPage'));
// Post-purchase landing for the Triangle inline checkout. create-embedded-
// checkout.js sets return_url to /welcome; ported from braveworks-bp.
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
// Post-purchase landing for the $97 1:1 call with Joel (2026-07 ladder). The
// call payment link redirects here; embeds the Calendly booking calendar.
const CallBookedPage = lazy(() => import('./pages/CallBookedPage'));
const OpsDashboardPage = lazy(() => import('./pages/OpsDashboardPage'));
// WaitlistApplicationPage (the stale $1,297 /1on1 page) is no longer routed:
// /1on1 now redirects to /coaching (2026-07-03). The file is preserved at
// src/pages/WaitlistApplicationPage.jsx if we ever want it back.
// 2026-07-16 Be There funnel: /coaching + /coaching-vip land on the minimal
// Be There landing (webinar video + one CTA), /apply runs the 8-step
// prequalification wizard. Old ApplyPage.jsx / CoachingOptinPage.jsx are
// preserved on disk, unrouted.
const BeThereLandingPage = lazy(() => import('./pages/BeThereLandingPage'));
const BeThereApplyPage = lazy(() => import('./pages/BeThereApplyPage'));
const IntakeFormPage = lazy(() => import('./pages/IntakeFormPage'));
const CoachingPage = lazy(() => import('./pages/CoachingPage'));
const TeaThanksPage = lazy(() => import('./pages/TeaThanksPage'));
const CoachingWelcomePage = lazy(() => import('./pages/CoachingWelcomePage'));
const SprintWelcomePage = lazy(() => import('./pages/SprintWelcomePage'));
const Cohort2Page = lazy(() => import('./pages/Cohort2Page'));
const SeminarPage = lazy(() => import('./pages/SeminarPage'));
const SeminarWelcomePage = lazy(() => import('./pages/SeminarWelcomePage'));
const WakitaIntakePage = lazy(() => import('./pages/WakitaIntakePage'));
const LuveniaIntakePage = lazy(() => import('./pages/LuveniaIntakePage'));
// John Treadwell (Stage 4 CKD) 30-day program assessment (2026-07-09).
// Click-based intake; submit emails Joel a PDF via api/johnt-assessment.js.
const JohnTAssessmentPage = lazy(() => import('./pages/JohnTAssessmentPage'));
// Blog / Articles — re-enabled 2026-05-17 for the "Blood Pressure Guy"
// rebrand SEO content hub.
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const AboutJoelPage = lazy(() => import('./pages/AboutJoelPage'));
// Legal pages - added 2026-06-04 podcast-prep audit
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
// $297 "Joel's Eyes On Your Case" — sales page + the post-purchase landing the
// Stripe payment link redirects to (2026-07-03; the redirect used to 404).
const CaseReviewPage = lazy(() => import('./pages/CaseReviewPage'));
const CaseReviewConfirmedPage = lazy(() => import('./pages/CaseReviewConfirmedPage'));
// $1,997 "All In" 90-Day Program checkout (offer stack + embedded Stripe, 3 pay
// options: full / deposit / bi-weekly plan). Focused checkout, no SiteLayout.
const AllInPage = lazy(() => import('./pages/AllInPage'));
const AllInWelcomePage = lazy(() => import('./pages/AllInWelcomePage'));
// SVUTU Satin (hormoneteas.com) on the embedded rail — Satin-branded checkout +
// post-purchase "double your order for a friend" one-click. hormoneteas.com
// buy buttons link here. Focused checkout, no SiteLayout.
const SatinCheckoutPage = lazy(() => import('./pages/SatinCheckoutPage'));
const SatinThanksPage = lazy(() => import('./pages/SatinThanksPage'));
// /score — tokenized "see my saved result" page for email links (2026-07-03).
const ScorePage = lazy(() => import('./pages/ScorePage'));
// /waitlist — BraveWorks BP iPhone-app waitlist (2026-07-05). Standalone
// conversion page (own header/footer, no Navbar); /app redirects there for
// bio links. Signup endpoint: api/app-waitlist.js.
const AppWaitlistPage = lazy(() => import('./pages/AppWaitlistPage'));

// Subdomain → page map. When the SPA boots on a vanity subdomain like
// `wakita.bpquiz.com`, the root route renders that client's intake instead of
// the default landing page. Add new clients here as one-line entries; no
// vercel.json edit needed (Vercel routes both apex + subdomains to this SPA).
const SUBDOMAIN_PAGE = {
  'wakita.bpquiz.com': WakitaIntakePage,
  // App waitlist vanity subdomain (2026-07-05). Same page as /waitlist on
  // the apex; the subdomain serves it at its root.
  'waitlist.bpquiz.com': AppWaitlistPage,
};
const subdomainPage =
  typeof window !== 'undefined' ? SUBDOMAIN_PAGE[window.location.hostname] : null;

function SiteLayout({ children }) {
  return (
    <>
      <header className="store-header">
        <Navbar />
      </header>
      <main>{children}</main>
      <Footer />
    </>
  );
}

// Minimal route-loading fallback. No spinner — quiet flash of cream-paper
// background while the chunk streams (usually 50-200ms on the second hit
// thanks to HTTP/2 + edge cache). A spinner here would just add jank for a
// load that's already imperceptible on most connections.
function RouteFallback() {
  return <div style={{ minHeight: '60vh', background: 'var(--paper, #FBF8F1)' }} />;
}

function App() {
  return (
    <Router>
      {/* Vercel Web Analytics — pageviews, referrers, country/device.
          Speed Insights — Core Web Vitals per route. Both auto-route-track
          (no manual page-event firing needed). Free on Pro plan. */}
      <Analytics />
      <SpeedInsights />
      <ScrollToTop />
      {/* Sabbath closure — overlays the storefront from sundown Fri → sundown
          Sat (Fordsville KY local sunset). Renders nothing outside those hours.
          Fails open. See components/SabbathGate.jsx. */}
      <SabbathGate />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Single-page sales letter at / — the new landing for cold TikTok
              traffic (2026-05-12 split-test winner over the quiz format).
              SiteLayout intentionally omitted: bpcures-style standalone page
              has its own header/footer/social-proof bar, no Navbar needed.

              Subdomain override: if the visitor is on a per-client vanity
              subdomain (e.g. wakita.bpquiz.com), serve that client's intake
              at the root path instead of the public landing page. See
              SUBDOMAIN_PAGE map above. */}
          {/* 2026-06-07: REVERTED homepage to the direct $17 sales letter
              (CheckoutPage, the bpcures-modeled page). Rationale: the list
              diagnosis showed cold email captured by the quiz converts ~0, so
              optimizing the homepage for immediate $17 sale + a warm-buyer
              inbox beats optimizing for passive email capture. The quiz still
              lives at /quiz + /start for bio links and warm traffic who want
              the diagnostic first. TO RE-REVERT to quiz-first: put
              <SiteLayout><QuizPage /></SiteLayout> back on `/` and remove the
              /offer redirect. (CheckoutPage renders standalone — its own
              header/footer/social bar, no SiteLayout.) */}
          {/* 2026-07-16: '/' now renders HomeSplit (50/50 A/B). Variant 'a'
              is CheckoutPage exactly as before. Vanity subdomains still bypass
              the split. */}
          {/* 2026-07-26 (Joel, foods101-v1): variant 'b' is no longer the
              Annie-v2 TriggerLanding. It is now FoodsGuideLanding, a Brunson
              squeeze page for the free "101 Foods and Herbs" guide, which
              hands off to /101foods-thanks where the $17 kit is the tripwire.
              "lets get rid of page B as it stands." TriggerLanding.jsx is left
              on disk but is no longer rendered by any route: /triggers and
              /quiz still serve TriggerQuizPage, so the quiz itself is intact. */}
          <Route path="/" element={subdomainPage ? React.createElement(subdomainPage) : <HomeSplit />} />
          <Route path="/offer" element={<Navigate to="/" replace />} />

          {/* 101 Foods funnel — the squeeze is also reachable directly (for ad
              and email traffic that should skip the A/B split entirely), and
              the thank-you page carries the $17 offer. */}
          <Route path="/101foods" element={<FoodsGuideLanding />} />
          <Route path="/101foods-thanks" element={<FoodsGuideThanks />} />

          {/* Quiz moved to /quiz — for SEO landing, email CTAs, and warm
              traffic that wants the diagnostic before buying. */}
          {/* 2026-07-16 (Joel): /quiz IS the 5 Hidden Triggers quiz now, for
              BOTH homepage variants. The old Triangle QuizPage stays routed
              at /start only. */}
          <Route path="/quiz" element={<TriggerQuizPage />} />

          {/* /triggers — the 5 Hidden Triggers quiz (Annie-v2 funnel,
              2026-07-16). Standalone (own mini header + compliance footer):
              quiz -> email gate -> result -> /pay upsell. Variant B's landing
              CTAs navigate here. */}
          <Route path="/triggers" element={<TriggerQuizPage />} />

          {/* /start — quiz-first entry for social bio links (TikTok/FB/IG).
              2026-05-29: the homepage sales letter was leaking 98% of cold
              traffic (1.7% email capture). /start routes that audience to the
              44%-converting quiz instead. Same QuizPage, clean URL for bios
              + UTM attribution. */}
          <Route path="/start" element={<SiteLayout><QuizPage /></SiteLayout>} />

          {/* 2026-07-04: /challenge RETIRED. The page was the May pre-launch
              build (price-jump countdowns, 50-seat caps, Monday 10 PM copy,
              expired RestoreHER ticket bonus, signup form whose endpoint now
              410s) — fake scarcity on a trust brand. The $97 shadow seat is
              sold by direct Stripe link from the tier-1 Day-20 email instead. */}
          <Route path="/challenge" element={<Navigate to="/" replace />} />

          {/* Practice Launcher — three-stage funnel (standalone, no SiteLayout) */}
          <Route path="/launcher" element={<LauncherPage />} />
          <Route path="/launcher/quiz" element={<LauncherQuizPage />} />
          <Route path="/launcher/results/:slug" element={<LauncherResultsPage />} />

          {/* Old routes → redirect to quiz */}
          <Route path="/shop" element={<Navigate to="/" replace />} />
          <Route path="/shop/:slug" element={<Navigate to="/" replace />} />
          <Route path="/upsell" element={<Navigate to="/" replace />} />

          {/* Blog / Articles — Joel's SEO content hub (2026-05-17 re-enabled
              for the "Blood Pressure Guy" rebrand. Articles target queries
              like "blood pressure natural remedies", "cortisol and blood
              pressure", etc. /learn + /articles are aliases for /blog.) */}
          <Route path="/blog" element={<SiteLayout><BlogListPage /></SiteLayout>} />
          <Route path="/blog/:slug" element={<SiteLayout><BlogPostPage /></SiteLayout>} />
          <Route path="/learn" element={<Navigate to="/blog" replace />} />
          <Route path="/learn/:slug" element={<Navigate to="/blog/:slug" replace />} />
          <Route path="/articles" element={<Navigate to="/blog" replace />} />
          <Route path="/articles/:slug" element={<Navigate to="/blog/:slug" replace />} />

          {/* Author authority page — E-E-A-T anchor for medical SEO. Every
              blog post byline links here. Schema covers Person +
              MedicalBusiness so Google attributes article authorship
              correctly. */}
          <Route path="/about/joel" element={<SiteLayout><AboutJoelPage /></SiteLayout>} />
          <Route path="/about" element={<Navigate to="/about/joel" replace />} />

          {/* Inline checkout for the new Triangle kits. Every BP buy CTA points
              at /pay?tier=corner&corner=<corner>; charges inline (no redirect).
              STANDALONE (2026-07-13 checkout overhaul): SiteLayout's Navbar put
              a competing free Skool CTA + exits above the card form. PayPage
              renders its own minimal locked header. SabbathGate still covers
              this route (it mounts above the router, not inside SiteLayout). */}
          <Route path="/pay" element={<PayPage />} />
          <Route path="/tea-thanks" element={<SiteLayout><TeaThanksPage /></SiteLayout>} />

          {/* Post-purchase Triangle landing. The inline checkout's return_url is
              /welcome?tier=<tier>. Shows the buyer's unlocked kit + locked higher
              tiers with difference-priced upgrade CTAs. Wrapped in SiteLayout. */}
          {/* True one-click OTO between the $17 corner checkout and /welcome.
              Standalone (no SiteLayout): zero exits at the offer moment. */}
          <Route path="/oto" element={<OtoCompletePage />} />
          {/* Deep assessment for $297/$97 Sprint buyers (fulfillment, no nav). */}
          <Route path="/sprint-assessment" element={<SprintAssessmentPage />} />
          <Route path="/welcome" element={<SiteLayout><WelcomePage /></SiteLayout>} />

          {/* Post-purchase landing for the $97 1:1 call (Calendly booking). The
              call payment link's after_completion redirects here. */}
          <Route path="/call-booked" element={<SiteLayout><CallBookedPage /></SiteLayout>} />

          {/* Post-purchase — standalone (no nav/footer) */}
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/upsell-bp-reset-kit" element={<UpsellBpResetKitPage />} />
          {/* $12.99 BP Cures ebook upsell — inserted BETWEEN $17 Kit success
              and the $47 Reset Kit upsell. Ported from bpcures' $17+$12
              upsell mechanic (26% take rate vs 14.6% order-bump alone). */}
          <Route path="/upsell-bp-cure-book" element={<UpsellBpCureBookPage />} />
          {/* Downloads route — route is /library because public/downloads/
              is a static asset folder (PDF files) and Vercel shadows the
              SPA route when the folder exists. PDFs at /downloads/*.pdf
              continue to serve normally; this is just the React page.
              /downloads → /library handled at Vercel level via vercel.json
              redirect (React Router never sees the request — Vercel 404s
              before SPA fallback runs). */}
          <Route path="/library" element={<DownloadsPage />} />

          {/* $297 case review — "Joel's Eyes On Your Case". Sales page with a
              live capacity read (/api/case-review-slots) + the post-purchase
              landing the Stripe payment link redirects to. The confirmed page
              used to 404 (no route), dumping fresh $297 buyers back on the
              homepage sales letter. Both wrapped in SiteLayout. */}
          <Route path="/case-review" element={<SiteLayout><CaseReviewPage /></SiteLayout>} />
          <Route path="/case-review-confirmed" element={<SiteLayout><CaseReviewConfirmedPage /></SiteLayout>} />

          {/* $1,997 All In 90-Day Program. /allin = focused checkout (offer
              stack + embedded Stripe, 3 pay options), NO SiteLayout so nothing
              leaks the click. /allin-welcome = post-purchase landing the
              embedded checkout redirects to. */}
          <Route path="/allin" element={<AllInPage />} />
          <Route path="/allin-welcome" element={<SiteLayout><AllInWelcomePage /></SiteLayout>} />

          {/* SVUTU Satin embedded checkout + post-purchase double-order OTO.
              hormoneteas.com links here. No SiteLayout (Satin-branded, focused). */}
          <Route path="/satin" element={<SatinCheckoutPage />} />
          <Route path="/satin-thanks" element={<SatinThanksPage />} />

          {/* /score — tokenized saved-result page for email links:
              /score?e=<email>&t=<token> → GET /api/score-get. Gentle fallback
              to /quiz when the token is invalid or expired. */}
          <Route path="/score" element={<SiteLayout><ScorePage /></SiteLayout>} />

          {/* BraveWorks BP iPhone-app waitlist. Standalone; /app is the
              short alias for bio links + the app's own marketing. */}
          <Route path="/waitlist" element={<AppWaitlistPage />} />
          <Route path="/app" element={<Navigate to="/waitlist" replace />} />

          <Route path="/JohnT" element={<JohnTAssessmentPage />} />

          {/* /1on1 — 2026-07-03: redirects to /coaching. The old
              WaitlistApplicationPage quoted a stale $1,297 single-pay price
              while /coaching lists the live $1,500+ tiers; two conflicting
              prices were reachable at once. File kept for history. */}
          <Route path="/1on1" element={<Navigate to="/coaching" replace />} />
          {/* /apply — 2026-07-16: the Be There 8-step prequalification wizard
              (BeThereApplyPage). Legacy ?tier= links still land here; tier
              defaults to 'be-there'. POSTs to /api/coaching-apply with
              source: 'bethere-apply'. Old ApplyPage.jsx preserved unrouted. */}
          <Route path="/apply" element={<BeThereApplyPage />} />

          {/* 2026-06-08 RELAUNCHED: /coaching is live again, listing Joel's
              four 1:1 tiers (Triangle Session $1,500 one-time, Inner Circle
              $1,500/mo, Brave Household $5,000/mo, Pillar Year $50,000/yr).
              Entry points live on the post-purchase /downloads page (a group
              + a 1:1 CTA), intentionally kept OFF the cold homepage. Close
              mechanism is mailto concierge@bpquiz.com; that alias MUST forward
              to Joel or the high-ticket inquiries bounce. */}
          {/* 2026-07-15: /coaching temporarily repointed to the "Be There"
              application (webinar-only $1,997 90-day cohort — webinar script
              was titled The Front Row, offer is branded Be There — see
              The_Front_Row_Webinar_Script.pdf) for this cohort's traffic.
              Previous behavior (opt-in funnel page 1) preserved at
              /coaching-vip so it can be swapped back with a one-line revert. */}
          {/* 2026-07-16: /coaching (and the /coaching-vip alias) now render the
              minimal Be There landing (webinar embed + one apply CTA). The old
              CoachingOptinPage.jsx stays on disk, unrouted. */}
          <Route path="/coaching" element={<BeThereLandingPage />} />
          <Route path="/coaching-vip" element={<BeThereLandingPage />} />
          <Route path="/coaching-offers" element={<CoachingPage />} />
          {/* Post-$297-purchase landing — Stripe Payment Link redirect target.
              Configure the after_completion.redirect.url on the $297 link to:
              https://bpquiz.com/coaching-welcome?session_id={CHECKOUT_SESSION_ID} */}
          <Route path="/coaching-welcome" element={<CoachingWelcomePage />} />
          {/* Post-$1,700/$1,997 Sprint purchase landing. Stripe Payment Link
              for sprint-with-diagnostic-credit redirects here. */}
          <Route path="/sprint-welcome" element={<SprintWelcomePage />} />
          {/* Cohort 2 application page — vacation-style sales letter, no
              price reveal, application form posts to /api/coaching-apply.
              (Note: as of 2026-06-04 /coaching no longer prescreens into
              Cohort 2 — it lists Joel's 1:1 tiers. This page remains the
              direct-apply path for buyers who want the Sprint specifically.) */}
          <Route path="/cohort2" element={<Cohort2Page />} />

          {/* Free 6-day Annie+Joel seminar — May 18-23 2026.
              Email-capture-before-Zoom-link. FB + TikTok bio link target.
              UTM-aware so we can attribute source. */}
          <Route path="/seminar" element={<SeminarPage />} />
          <Route path="/seminar/welcome" element={<SeminarWelcomePage />} />
          <Route path="/intimacy" element={<Navigate to="/seminar" replace />} />
          <Route path="/annie" element={<Navigate to="/seminar" replace />} />

          {/* Per-client pre-call intake — also reachable via subdomain
              wakita.bpquiz.com (see SUBDOMAIN_PAGE map). Standalone — no nav. */}
          <Route path="/wakita" element={<WakitaIntakePage />} />

          {/* Luvenia's BP Triangle pre-call intake — standalone, no nav/footer.
              Texted privately. POST → /api/luvenia-intake → KV save + PDF
              + email to Joel. Same shape as /wakita. */}
          <Route path="/luvenia" element={<LuveniaIntakePage />} />

          {/* Operations dashboard — passcode-gated, standalone */}
          <Route path="/ops" element={<OpsDashboardPage />} />

          {/* DFY client voice-intake — token-gated, standalone (no nav/footer).
              Each client gets a unique URL like /intake/karen-bush?token=... */}
          <Route path="/intake/:clientSlug" element={<IntakeFormPage />} />

          {/* Legal pages - shipped 2026-06-04 podcast-prep audit. */}
          <Route path="/privacy" element={<SiteLayout><PrivacyPage /></SiteLayout>} />
          <Route path="/terms" element={<SiteLayout><TermsPage /></SiteLayout>} />
          <Route path="/disclaimer" element={<SiteLayout><DisclaimerPage /></SiteLayout>} />

          {/* 404 catch-all. Unknown URLs redirect to home instead of rendering
              an empty <Routes/> that crawlers read as a hung page. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
