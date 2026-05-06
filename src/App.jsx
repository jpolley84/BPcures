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

        {/* Operations dashboard — passcode-gated, standalone */}
        <Route path="/ops" element={<OpsDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
