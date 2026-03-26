import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ShoppingBag, Calendar, Heart, Users, Loader2, Play, TrendingUp, Star, Shield, Zap } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const PRICE = '$17';
const STRIPE_KIT_PRICE_ID = import.meta.env.VITE_STRIPE_KIT_PRICE_ID;

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useScrollAnimation(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const CheckoutPage = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 2000);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBuyNow = async () => {
    setIsProcessing(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_KIT_PRICE_ID,
          successUrl: `${window.location.origin}/upsell`,
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

  const whatIsIncluded = [
    { name: 'Master Blood Pressure Document', description: 'The full protocol. What to take, when to take it, how much.', value: '$47' },
    { name: 'Top 10 Herbs Deep Dive', description: 'Each herb matched to the drug it mimics — with dosages your doctor never learned in med school.', value: '$27' },
    { name: '10-Day Blood Pressure Reset Challenge', description: "Wake up. Open that day's PDF. Follow the checklist. That's the whole system.", value: '$97' },
    { name: 'Cook For Life Cookbook', description: 'Plant-based recipes built around the herbs and foods that move your numbers.', value: '$27' },
    { name: 'White Coat Syndrome Guide', description: 'Why your readings at the doctor are probably wrong — and the 2-minute trick nurses use to get real numbers.', value: '$17' },
    { name: 'Blood Pressure FAQ', description: "25 questions you're too afraid to ask your doctor, answered plainly by a nurse who's heard them all.", value: '$12' },
    { name: 'Health & Progress Tracker', description: 'Print it. Stick it on your fridge. Log your numbers. Watch what happens.', value: '$12' },
    { name: 'BONUS: Overmedicated Boomers Book', description: "The book Big Pharma doesn't want on your nightstand. What your generation was never told about the drugs you're taking.", value: '$19' },
  ];

  const timeEffortKillers = [
    { icon: Clock, headline: '15 minutes a day', description: "That's it. Follow the daily checklist." },
    { icon: ShoppingBag, headline: 'Common grocery store ingredients', description: 'No specialty shops. No strange powders.' },
    { icon: Calendar, headline: 'Most people notice a shift by Day 4', description: 'Check your numbers. See for yourself.' },
  ];

  return (
    <div className={`min-h-screen bg-white ${showStickyBar ? 'pb-20' : ''}`}>
      {/* Headshot */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center">
          <div className="headshot-ring">
            <img
              src="/headshot.png"
              alt="Professional headshot of Joel Polley, RN"
              className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-full shadow-xl"
              style={{ objectFit: 'cover', border: '4px solid white' }}
            />
          </div>
        </div>
      </div>

      {/* Credential Bar */}
      <div className="credential-bar py-3.5" style={{ animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
        <div className="container-mobile-first">
          <p className="text-center font-medium" style={{ color: 'var(--white)', fontSize: '14px', lineHeight: '1.4', letterSpacing: '0.02em' }}>
            Joel Polley, RN — 20 Years ICU & Emergency Medicine | Naturopathic Practitioner
          </p>
        </div>
      </div>

      {/* Social Proof Strip */}
      <div className="py-5 bg-[#F8F9FA]" style={{ animation: 'fadeIn 0.6s ease-out 0.4s both' }}>
        <div className="container-mobile-first">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {[
              { icon: Play, text: '90,000+ followers on TikTok' },
              { icon: Users, text: '1,100+ community members' },
              { icon: TrendingUp, text: 'As seen on TikTok' },
            ].map((item, i) => (
              <div key={i} className="proof-badge">
                <item.icon size={15} className="text-[#6C3483]" />
                <span className="text-[13px] text-[#555] font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <h1 className="font-extrabold mb-5 text-balance" style={{ color: 'var(--navy)', fontSize: '30px', lineHeight: '1.15', letterSpacing: '-0.03em' }}>
            An ICU Nurse's 10-Day Blood Pressure Protocol — Yours for {PRICE}
          </h1>
          <p className="mb-3" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: '1.7' }}>
            I spent 20 years starting IVs on people in hypertensive crisis. So I built what I wish every patient had BEFORE they ended up in my unit.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '16px', lineHeight: '1.5' }}>
            7 guides. 47 herbs. Daily checklists. Plus the full Overmedicated Boomers book.
          </p>
        </div>
      </AnimatedSection>

      {/* Gradient Divider */}
      <hr className="gradient-divider" />

      {/* Gut Punch Quote */}
      <AnimatedSection className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <blockquote className="quote-accent italic pl-5 py-1" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: '1.7' }}>
            Your doctor has 12 minutes with you. Twelve. That's enough time to write a script, not enough time to ask what you're eating, how you're sleeping, or whether you've tried anything else. This is what you do with the other 23 hours and 48 minutes.
          </blockquote>
        </div>
      </AnimatedSection>

      {/* What's Inside */}
      <div className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-8 text-balance" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: '1.3' }}>
              What's inside
            </h2>
          </AnimatedSection>

          <div className="space-y-3 mb-8">
            {whatIsIncluded.map((item, index) => (
              <AnimatedSection key={index} delay={index * 60}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                  <CheckCircle2 size={22} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--purple)' }} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold mb-0.5" style={{ color: 'var(--dark-gray)', fontSize: '17px' }}>{item.name}</p>
                        <p style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.4' }}>{item.description}</p>
                      </div>
                      <span className="value-strike flex-shrink-0 font-medium" style={{ color: 'var(--muted-gray)', fontSize: '15px' }}>{item.value}</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="pt-6 mt-2 text-center">
              <div className="inline-block mb-4 px-5 py-2 rounded-full bg-purple-50 border border-purple-100">
                <span className="line-through text-[#9CA3AF] text-[15px] mr-2">$258 value</span>
                <span className="font-bold text-[#6C3483] text-[20px]">Just {PRICE}</span>
              </div>

              {checkoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center w-full sm:max-w-[400px] mx-auto">
                  {checkoutError}
                </div>
              )}

              <button
                onClick={handleBuyNow}
                disabled={isProcessing}
                className="w-full sm:max-w-[400px] mx-auto block btn-standard btn-cta text-white font-bold mb-3 text-[17px] gradient-purple-btn"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Processing...
                  </span>
                ) : (
                  `Buy Now for ${PRICE}`
                )}
              </button>

              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[#9CA3AF]" />
                  <span style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#9CA3AF]" />
                  <span style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>Instant download</span>
                </div>
              </div>
              <p className="mt-2" style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>That's less than one copay.</p>
            </div>
          </AnimatedSection>

          {/* Testimonials */}
          <AnimatedSection className="pt-14 pb-4">
            <h3 className="text-center font-bold text-[18px] text-[#2C3E50] mb-8">What people are saying</h3>
            <div className="flex flex-col md:flex-row gap-5">
              {[
                { quote: "Followed your directions on TikTok and lost 20 lbs. Off 2 of my meds. Keep it up!", source: 'TikTok follower' },
                { quote: "Joel explained what my cardiologist never did — in a 60-second video. I started the protocol that same day.", source: 'Community member' },
                { quote: "I was scared to go off my meds. This kit gave me something to show my doctor instead of just saying 'I want to try natural.' Now we're working together.", source: 'Kit buyer' },
              ].map((t, i) => (
                <div key={i} className="testimonial-card p-5 flex-1 flex flex-col">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="fill-[#F39C12] text-[#F39C12]" />
                    ))}
                  </div>
                  <p className="text-[#4A4A4A] italic text-[15px] mb-4 flex-grow leading-relaxed">"{t.quote}"</p>
                  <p className="text-[#9CA3AF] text-[13px] font-medium">— {t.source}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Supporting Text */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first text-center">
          <p className="mb-2" style={{ color: 'var(--dark-gray)', fontSize: '15px' }}>
            Instant download to your phone. Start today.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
            Secure checkout. Credit card, debit, Apple Pay, Google Pay, or PayPal.
          </p>
        </div>
      </AnimatedSection>

      {/* Time & Effort Killers */}
      <div className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {timeEffortKillers.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <AnimatedSection key={index} delay={index * 120}>
                  <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:border-purple-100 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                      <IconComponent size={28} style={{ color: 'var(--purple)' }} />
                    </div>
                    <p className="font-bold mb-2" style={{ color: 'var(--dark-gray)', fontSize: '18px' }}>{item.headline}</p>
                    <p style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.5' }}>{item.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10">
            {[
              { icon: Heart, text: '20-Year ICU/ER Nurse' },
              { icon: Heart, text: 'Naturopathic Practitioner' },
              { icon: Users, text: '90,000+ TikTok followers' },
            ].map((item, index) => (
              <div key={index} className="proof-badge px-5 py-3">
                <item.icon size={20} style={{ color: 'var(--purple)' }} />
                <span className="font-medium" style={{ color: 'var(--dark-gray)', fontSize: '15px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* AND Statement */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="max-w-[480px] mx-auto">
            <p className="text-center italic" style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.7' }}>
              This works alongside your doctor's care, not instead of it. Natural support AND medical guidance — that's the BraveWorks way.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA */}
      <div className="section-spacing gradient-navy">
        <div className="container-mobile-first text-center">
          <AnimatedSection>
            <p className="mb-8" style={{ color: 'var(--white)', fontSize: '19px', lineHeight: '1.7' }}>
              You've watched the videos. You've commented. You've wondered if there's another way. There is. And it's {PRICE}.
            </p>
            <button
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="btn-standard text-white font-bold text-[16px] mb-4"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                `Get the Kit — ${PRICE}`
              )}
            </button>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              Genetics writes the recipe. Lifestyle bakes the cake.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* Sticky Mobile Buy Bar */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 sticky-bar" style={{ height: '64px' }}>
          <div className="h-full flex items-center justify-between px-4 max-w-[640px] mx-auto">
            <div>
              <p className="font-bold truncate max-w-[140px]" style={{ color: 'var(--white)', fontSize: '15px' }}>
                BP Reset Kit
              </p>
              <p className="text-[12px] font-semibold" style={{ color: 'var(--gold)' }}>{PRICE}</p>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-70 gradient-purple-btn"
              style={{ color: 'var(--white)', fontSize: '14px' }}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Get It Now'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-8" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px' }}>
            &copy; 2026 BraveWorks RN. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
