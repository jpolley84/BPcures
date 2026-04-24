import { Route, Routes, BrowserRouter as Router, Navigate, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ExitIntentPopup from './components/ExitIntentPopup';
import Navbar from './components/Navbar';
import AnnouncementTicker from './components/AnnouncementTicker';
import ChallengeBanner from './components/ChallengeBanner';
import Footer from './components/Footer';
import QuizPage from './pages/QuizPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LearnPage from './pages/LearnPage';
import LibraryPage from './pages/LibraryPage';
import BlogPostPage from './pages/BlogPostPage';
import UpsellPage from './pages/UpsellPage';
import SuccessPage from './pages/SuccessPage';
import DownloadsPage from './pages/DownloadsPage';

function StoreLayout({ children }) {
  return (
    <>
      <header className="store-header">
        <Navbar />
        <AnnouncementTicker />
      </header>
      <ChallengeBanner />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function BlogRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/learn/${slug}`} replace />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ExitIntentPopup />
      <Routes>
        {/* Storefront — wrapped with Navbar + Ticker + Footer */}
        <Route path="/" element={<StoreLayout><QuizPage /></StoreLayout>} />
        <Route path="/shop" element={<StoreLayout><ShopPage /></StoreLayout>} />
        <Route path="/shop/:slug" element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
        <Route path="/learn" element={<StoreLayout><LearnPage /></StoreLayout>} />
        <Route path="/learn/:slug" element={<StoreLayout><BlogPostPage /></StoreLayout>} />
        <Route path="/library" element={<StoreLayout><LibraryPage /></StoreLayout>} />
        <Route path="/library/:slug" element={<StoreLayout><ProductDetailPage /></StoreLayout>} />

        {/* Legacy blog routes — redirect to /learn */}
        <Route path="/blog" element={<Navigate to="/learn" replace />} />
        <Route path="/blog/:slug" element={<BlogRedirect />} />

        {/* Purchase funnel — standalone pages (no nav/footer) */}
        <Route path="/upsell" element={<UpsellPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
