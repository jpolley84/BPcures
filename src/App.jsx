import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ExitIntentPopup from './components/ExitIntentPopup';
import CheckoutPage from './pages/CheckoutPage';
import UpsellPage from './pages/UpsellPage';
import SuccessPage from './pages/SuccessPage';
import DownloadsPage from './pages/DownloadsPage';

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
      </Routes>
    </Router>
  );
}

export default App;
