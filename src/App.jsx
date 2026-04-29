import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ExitIntentPopup from './components/ExitIntentPopup';
import ChallengeBanner from './components/ChallengeBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import QuizPage from './pages/QuizPage';
import ChallengePage from './pages/ChallengePage';
import LauncherPage from './pages/LauncherPage';
import SuccessPage from './pages/SuccessPage';
import DownloadsPage from './pages/DownloadsPage';

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

        {/* Challenge sales page — standalone (no banner/nav clutter) */}
        <Route path="/challenge" element={<ChallengePage />} />

        {/* Practice Launcher — health coach offer (standalone) */}
        <Route path="/launcher" element={<LauncherPage />} />

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
        <Route path="/downloads" element={<DownloadsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
