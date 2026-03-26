import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, BookOpen, ArrowRight } from 'lucide-react';

const STRIPE_BOOK_PRICE_ID = import.meta.env.VITE_STRIPE_BOOK_PRICE_ID;

const UpsellPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const navigate = useNavigate();

  const handleAddBook = async () => {
    setIsProcessing(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_BOOK_PRICE_ID,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Purchase Confirmation Banner */}
      <div
        className="py-4 px-4 flex items-center justify-center gap-3"
        style={{ backgroundColor: 'var(--success-light)', animation: 'fadeIn 0.5s ease-out' }}
      >
        <CheckCircle2 size={24} style={{ color: '#059669' }} />
        <p className="font-medium text-center" style={{ color: '#065F46', fontSize: '16px' }}>
          Your BP Reset Kit purchase is confirmed!
        </p>
      </div>

      {/* The Bridge */}
      <div className="pt-12 pb-8" style={{ animation: 'fadeInUp 0.7s ease-out 0.2s both' }}>
        <div className="container-mobile-first max-w-[520px] text-center">
          <p className="font-bold tracking-widest mb-4" style={{ color: 'var(--muted-gray)', fontSize: '12px', letterSpacing: '0.15em' }}>
            WAIT — ONE MORE THING BEFORE YOU GO
          </p>
          <h1 className="font-extrabold mb-6 text-balance" style={{ color: 'var(--navy)', fontSize: 'clamp(26px, 5vw, 32px)', lineHeight: '1.15', letterSpacing: '-0.03em' }}>
            You just got the protocol. Want the full story behind it?
          </h1>
          <p style={{ color: 'var(--dark-gray)', fontSize: '17px', lineHeight: '1.7' }}>
            The kit you just bought tells you exactly what to do. But if you're the kind of person who wants to know <em>why</em> it works—the clinical research, the history of these herbs, and the exact mechanisms of how they heal the endothelium—you need the book.
          </p>
        </div>
      </div>

      <hr className="gradient-divider" />

      {/* The Book */}
      <div className="py-10" style={{ animation: 'fadeInUp 0.7s ease-out 0.4s both' }}>
        <div className="container-mobile-first">
          <div className="card-elevated p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #F3E8FF 100%)' }}>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                <BookOpen size={32} style={{ color: 'var(--purple)' }} />
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '21px' }}>
                Be Your Own Doctor: The Blood Pressure Cure
              </h2>
              <p className="mb-1" style={{ color: 'var(--muted-gray)', fontSize: '15px' }}>
                The complete guide from a 20-year ICU nurse
              </p>
              <p className="italic" style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
                By Joel Polley, RN — Naturopathic Practitioner
              </p>
            </div>

            <div className="space-y-4 max-w-[480px] mx-auto">
              {[
                'Deep dive into the clinical research behind the 47 herbs',
                'The hidden limitations of common blood pressure drugs',
                'The complete NEWSTART framework for cardiovascular health',
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-purple-50">
                  <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--purple)' }} />
                  <p style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: '1.5' }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The Price */}
      <div className="py-6 text-center" style={{ animation: 'fadeInUp 0.7s ease-out 0.6s both' }}>
        <div className="container-mobile-first">
          <p className="line-through mb-1" style={{ color: 'var(--muted-gray)', fontSize: '16px' }}>$24.99 retail</p>
          <div className="inline-block px-6 py-2 rounded-full bg-purple-50 border border-purple-100 mb-3">
            <span className="font-extrabold" style={{ color: 'var(--purple)', fontSize: '30px' }}>$12</span>
            <span className="ml-2 font-medium" style={{ color: 'var(--purple)', fontSize: '15px' }}>for kit buyers only</span>
          </div>
          <p style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>This price is only available right now on this page.</p>
        </div>
      </div>

      {/* The Reason Why */}
      <div className="py-4">
        <div className="container-mobile-first max-w-[480px]">
          <p className="quote-accent text-center italic pl-5 py-1" style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.7' }}>
            "I want this information in as many hands as possible. Since you've already committed to the 10-Day Reset, I'm giving you the book at cost."
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="pt-8 pb-6">
        <div className="container-mobile-first text-center">
          {checkoutError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm max-w-[400px] mx-auto">
              {checkoutError}
            </div>
          )}

          <button
            onClick={handleAddBook}
            disabled={isProcessing}
            className="w-full sm:max-w-[400px] mx-auto btn-standard btn-cta text-white font-bold text-[17px] gradient-purple-btn"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">Add the Book — $12 <ArrowRight size={18} /></span>
            )}
          </button>

          <div className="mt-6">
            <button
              onClick={() => navigate('/downloads')}
              disabled={isProcessing}
              className="hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--muted-gray)', fontSize: '15px', textDecoration: 'underline', textUnderlineOffset: '4px' }}
            >
              No thanks — take me to my downloads &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Urgency Reinforcement */}
      <div className="pb-12">
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
            After you leave this page, the book returns to its regular $24.99 price.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpsellPage;
