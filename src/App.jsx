import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ExitIntentPopup from './components/ExitIntentPopup';
import ChallengeBanner from './components/ChallengeBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import QuizPage from './pages/QuizPage';
import ChallengePage from './pages/ChallengePage';
import LauncherPage from './pages/LauncherPage';
import LauncherQuizPage from './pages/LauncherQuizPage';
import LauncherResultsPage from './pages/LauncherResultsPage';
import SuccessPage from './pages/SuccessPage';
import UpsellBpResetKitPage from './pages/UpsellBpResetKitPage';
import DownloadsPage from './pages/DownloadsPage';
import OpsDashboardPage from './pages/OpsDashboardPage';

function SiteLayout({ children }) {
  return (
    <>
      <ChallengeBanner />
      <header className="store-header">
        <Navbar />
      </header>
      <main>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ExitIntentPopup />
      <Routes>
        {/* Single-page funnel: quiz → email → results → checkout */}
        <Route path="/" element={<SiteLayout><QuizPage /></SiteLayout>} />

        {/* Challenge sales page — pulled from public funnel 2026-05-03 per
            audit Section 10. $397 Premium had $0 sales in 30+ days; testing
            "kill it for 30 days" (Hormozi prescription). Redirect to home
            until June 2; revisit then. The Stripe payment_link stays active
            for direct-link buyers from email upsells. */}
        <Route path="/challenge" element={<Navigate to="/" replace />} />

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

        {/* Operations dashboard — passcode-gated, standalone */}
        <Route path="/ops" element={<OpsDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
