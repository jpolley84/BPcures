import { useState, useEffect } from 'react';
import { X, Loader2, Gift } from 'lucide-react';

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hasShown = localStorage.getItem('cookbookPopupShown');
    if (hasShown === 'true') return;

    const purchaseCompleted = localStorage.getItem('purchaseCompleted');
    if (purchaseCompleted === 'true') return;

    const handleMouseLeave = (e) => {
      if (localStorage.getItem('cookbookPopupShown') === 'true') return;
      if (e.clientY <= 0) {
        setIsVisible(true);
        localStorage.setItem('cookbookPopupShown', 'true');
      }
    };

    const timer = setTimeout(() => {
      if (localStorage.getItem('cookbookPopupShown') !== 'true') {
        setIsVisible(true);
        localStorage.setItem('cookbookPopupShown', 'true');
      }
    }, 10000);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => setIsVisible(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 popup-backdrop" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-[420px] w-full relative shadow-2xl popup-card" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200 border-none cursor-pointer"
          aria-label="Close popup"
        >
          <X size={18} />
        </button>

        {/* Purple accent bar at top */}
        <div className="h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, var(--purple), var(--gold))' }} />

        <div className="p-8">
          {!isSubmitted ? (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Gift size={28} style={{ color: 'var(--purple)' }} />
                </div>
              </div>

              <h2 className="font-extrabold mb-3 text-center" style={{ color: 'var(--navy)', fontSize: '22px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                Get the Cook for Life Cookbook — Free
              </h2>
              <p className="font-semibold mb-3 text-center" style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: '1.4' }}>
                42 pages of plant-based recipes your doctor told you to eat but never showed you how
              </p>
              <p className="mb-6 text-center" style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: '1.5' }}>
                45+ recipes, 14-day meal plan, shopping lists, and a 4-day juice detox — all written by a nurse who spent 20 years watching what works.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 text-[15px]"
                  disabled={isLoading}
                />

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-standard btn-cta text-white font-bold text-[16px] disabled:opacity-50 disabled:cursor-not-allowed gradient-purple-btn"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} /> Sending...
                    </span>
                  ) : (
                    'Get the Cookbook'
                  )}
                </button>

                <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '11px', lineHeight: '1.4' }}>
                  Your free PDF arrives in your inbox instantly. No spam. Unsubscribe anytime.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center" style={{ animation: 'scaleIn 0.5s ease-out' }}>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Gift size={32} className="text-green-500" />
              </div>
              <h2 className="font-extrabold mb-3" style={{ color: 'var(--navy)', fontSize: '22px', lineHeight: '1.2' }}>
                Check your inbox!
              </h2>
              <p style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: '1.5' }}>
                Your free Cook for Life Cookbook is on its way.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full btn-standard text-white font-semibold gradient-purple-btn"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
