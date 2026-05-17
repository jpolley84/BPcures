import React, { lazy, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from './components/ScrollToTop';
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

// All other routes are lazy-loaded. Users who land on `/` (99% of traffic)
// only download the landing chunk; the rest stream on-demand when their
// route is visited.
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const LauncherPage = lazy(() => import('./pages/LauncherPage'));
const LauncherQuizPage = lazy(() => import('./pages/LauncherQuizPage'));
const LauncherResultsPage = lazy(() => import('./pages/LauncherResultsPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const UpsellBpResetKitPage = lazy(() => import('./pages/UpsellBpResetKitPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const OpsDashboardPage = lazy(() => import('./pages/OpsDashboardPage'));
const WaitlistApplicationPage = lazy(() => import('./pages/WaitlistApplicationPage'));
const IntakeFormPage = lazy(() => import('./pages/IntakeFormPage'));
const CoachingPage = lazy(() => import('./pages/CoachingPage'));
const WakitaIntakePage = lazy(() => import('./pages/WakitaIntakePage'));
// Blog / Articles — re-enabled 2026-05-17 for the "Blood Pressure Guy"
// rebrand SEO content hub.
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const AboutJoelPage = lazy(() => import('./pages/AboutJoelPage'));

// Subdomain → page map. When the SPA boots on a vanity subdomain like
// `wakita.bpquiz.com`, the root route renders that client's intake instead of
// the default landing page. Add new clients here as one-line entries; no
// vercel.json edit needed (Vercel routes both apex + subdomains to this SPA).
const SUBDOMAIN_PAGE = {
  'wakita.bpquiz.com': WakitaIntakePage,
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
          <Route path="/" element={subdomainPage ? React.createElement(subdomainPage) : <CheckoutPage />} />

          {/* Quiz moved to /quiz — for SEO landing, email CTAs, and warm
              traffic that wants the diagnostic before buying. */}
          <Route path="/quiz" element={<SiteLayout><QuizPage /></SiteLayout>} />

          {/* Challenge sales page — restored 2026-05-05 as VIP-focused upsell.
              Premium ($397) section is hidden inside ChallengePage but the page
              now serves as the dedicated VIP ($97) upgrade landing surface for
              email upsells, Skool posts, and the new home-page VIP row. */}
          <Route path="/challenge" element={<SiteLayout><ChallengePage /></SiteLayout>} />

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

          {/* Post-purchase — standalone (no nav/footer) */}
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/upsell-bp-reset-kit" element={<UpsellBpResetKitPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />

          {/* 1:1 BP Triangle Premium waitlist application — $1,297 tier, application-gated */}
          <Route path="/1on1" element={<WaitlistApplicationPage />} />
          <Route path="/apply" element={<Navigate to="/1on1" replace />} />

          {/* 90-Day BP Triangle Freedom Sprint — $4,997 flagship. Joel + Annie
              co-coach. Application-only (no buy button — Brunson high-ticket).
              Launched 2026-05-12, first cohort target 5 slots. */}
          <Route path="/coaching" element={<CoachingPage />} />

          {/* Per-client pre-call intake — also reachable via subdomain
              wakita.bpquiz.com (see SUBDOMAIN_PAGE map). Standalone — no nav. */}
          <Route path="/wakita" element={<WakitaIntakePage />} />

          {/* Operations dashboard — passcode-gated, standalone */}
          <Route path="/ops" element={<OpsDashboardPage />} />

          {/* DFY client voice-intake — token-gated, standalone (no nav/footer).
              Each client gets a unique URL like /intake/karen-bush?token=... */}
          <Route path="/intake/:clientSlug" element={<IntakeFormPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
