import { lazy, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ScrollToTop from './components/ScrollToTop';
// ExitIntentPopup (free-cookbook lead-magnet) — pulled 2026-05-11 at Joel's
// request. Component preserved in src/components/ExitIntentPopup.jsx if we
// want it back. ChallengeBanner — also pulled (2026-05-10).
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import QuizPage from './pages/QuizPage'; // eager — landing page, must be in initial bundle

// All other routes are lazy-loaded. Users who land on `/` (99% of traffic)
// only download the QuizPage chunk; the rest stream on-demand when their
// route is visited. Big LCP/TTI win.
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
          {/* Single-page funnel: quiz → email → results → checkout */}
          <Route path="/" element={<SiteLayout><QuizPage /></SiteLayout>} />

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
          <Route path="/learn" element={<Navigate to="/" replace />} />
          <Route path="/learn/:slug" element={<Navigate to="/" replace />} />
          <Route path="/blog" element={<Navigate to="/" replace />} />
          <Route path="/blog/:slug" element={<Navigate to="/" replace />} />
          <Route path="/upsell" element={<Navigate to="/" replace />} />

          {/* Post-purchase — standalone (no nav/footer) */}
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/upsell-bp-reset-kit" element={<UpsellBpResetKitPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />

          {/* 1:1 BP Triangle Premium waitlist application — $1,297 tier, application-gated */}
          <Route path="/1on1" element={<WaitlistApplicationPage />} />
          <Route path="/apply" element={<Navigate to="/1on1" replace />} />

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
