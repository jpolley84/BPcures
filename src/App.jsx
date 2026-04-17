import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ExitIntentPopup from './components/ExitIntentPopup';
import CheckoutPage from './pages/CheckoutPage';
import UpsellPage from './pages/UpsellPage';
import SuccessPage from './pages/SuccessPage';
import DownloadsPage from './pages/DownloadsPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ExitIntentPopup />
      <Routes>
        <Route path="/" element={<CheckoutPage />} />
        <Route path="/upsell" element={<UpsellPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </Router>
  );
}

export default App;
