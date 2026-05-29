import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShoppingBag, Calendar, Heart, Users, Loader2, Play, TrendingUp, Star, Shield, Zap, HelpCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
// 2026-05-14 — re-wired the exit-intent lead-magnet popup to plug the
// email-capture leak that opened when the quiz lost the homepage slot on
// 2026-05-12. Triggers on mouseleave OR 14s dwell, once per visitor
// (localStorage gate). POSTs to /api/lead-magnet → drip:* enrollment +
// Cook For Life cookbook delivery. See ExitIntentPopup.jsx for behavior.
import ExitIntentPopup from '../components/ExitIntentPopup';

const PRICE = '$17';
// 2026-05-18: env-var pattern with hardcoded fallback. The hardcoded ID is
// the $17 "Blood Pressure Cures — The 10-Day Nurse's Reset" price; it stays
// as the safety net so a missing env var doesn't break checkout. To change
// the price, update VITE_STRIPE_KIT_PRICE_ID in Vercel — no code deploy needed.
const STRIPE_KIT_PRICE_ID = import.meta.env.VITE_STRIPE_KIT_PRICE_ID || 'price_1TQTOlHseZnO3rRZANYJQnpG';

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
    // 2026-05-20 funnel-audit: dropped threshold 2000 → 600 so the sticky
    // buy bar appears just after the hero. Mobile buyers with mid-page
    // buy-intent no longer have to scroll back to the top to checkout.
    const handleScroll = () => setShowStickyBar(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBuyNow = async () => {
    setIsProcessing(true);
    setCheckoutError('');

    // Meta Pixel AddToCart event — fires when buyer initiates checkout. The
    // Purchase event fires on /success after webhook confirms. Together they
    // give Meta the full attribution signal for ad optimization.
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', { value: 17.00, currency: 'USD', content_name: 'BP Reset Kit' });
        window.fbq('track', 'InitiateCheckout', { value: 17.00, currency: 'USD' });
      }
    } catch { /* pixel errors must never block checkout */ }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_KIT_PRICE_ID,
          // 2026-05-20: success now goes to the BP Cures BOOK upsell first
          // ($12.99 ebook), then chains to the $30 Reset Kit OTO. Inserts
          // the bpcures-mirror flow between Kit and Reset Kit upsell.
          // saveCard:true makes both downstream upsells one-click — Stripe
          // saves the PaymentMethod off_session, and /upsell-bp-cure-book
          // + /upsell-bp-reset-kit hit /api/charge-saved-card to bill it.
          successUrl: `${window.location.origin}/upsell-bp-cure-book?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
          saveCard: true,
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
    // 2026-05-12 naming-taxonomy fix: was "10-Day Blood Pressure Reset Challenge"
    // which collided with /challenge (the actual paid $97 BP Triangle Cohort).
    // Renamed to "Protocol" so each tier has its own distinct noun:
    // — Inside $17 kit:  "10-Day BP Reset Protocol"   (this bonus, $97 anchor)
    // — Free email arc:  "30-Day BP Triangle Map"     (lead magnet)
    // — Paid $97 page:   "30-Day BP Triangle Cohort"  (group coaching)
    // — $1,297 1:1:      "BP Triangle Premium"        (application)
    // — $4,997 90-day:   "BP Triangle Freedom Sprint" (flagship)
    { name: '10-Day BP Reset Protocol', description: "Wake up. Open that day's PDF. Follow the checklist. That's the whole system.", value: '$97' },
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
      {/* Mobile-first quiz banner — sits at the very top of the page.
          Rationale: ExitIntentPopup uses mouseleave, which doesn't fire on
          touch devices. Without this banner, mobile bouncers leave with
          nothing. The 90-second quiz is the highest-converting email
          capture surface on the site (44% conversion) so it earns the
          top slot. UTM-tagged so we can measure its lift in Vercel
          Analytics → UTM Parameters tab. */}
      <a
        href="/quiz?utm_source=homepage-banner&utm_medium=top&utm_campaign=cohort1"
        className="block text-center no-underline"
        style={{
          background: '#3F5A3C',
          color: '#FBF8F1',
          padding: '14px 16px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          lineHeight: 1.4,
          letterSpacing: '0.01em',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        Not sure if this is for you?&nbsp;
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px', color: '#C7A95E' }}>
          Take the 90-second BP quiz
        </span>
        &nbsp;→
      </a>

      {/* Headshot — WebP for modern browsers (14KB) + JPG fallback (36KB).
          2026-05-12: was a 2MB PNG that killed mobile LCP. Now <40KB total. */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center">
          <div className="headshot-ring">
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN — The Blood Pressure Guy — 20 years ICU & emergency medicine, naturopathic practitioner"
                width="180"
                height="180"
                fetchpriority="high"
                className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-full shadow-xl"
                style={{ objectFit: 'cover', border: '4px solid white' }}
              />
            </picture>
          </div>
        </div>
      </div>

      {/* Credential Bar */}
      <div className="credential-bar py-3.5" style={{ animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
        <div className="container-mobile-first">
          <p className="text-center font-medium" style={{ color: 'var(--white)', fontSize: '14px', lineHeight: '1.4', letterSpacing: '0.02em' }}>
            Joel Polley, RN · The Blood Pressure Guy · 20 Years ICU & Emergency Medicine
          </p>
          <div className="text-center mt-2">
            <a
              href="/coaching"
              className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-[13px] font-medium transition-colors"
              style={{ textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.4)', textUnderlineOffset: '3px' }}
            >
              Free 30-min discovery call with Joel →
            </a>
          </div>
        </div>
      </div>

      {/* Social Proof Strip — 2026-05-25: clickable FB/TikTok/IG icons +
          400K subscriber count. Inline SVG for TikTok (not in lucide). */}
      <div className="py-5 bg-[#F8F9FA]" style={{ animation: 'fadeIn 0.6s ease-out 0.4s both' }}>
        <div className="container-mobile-first">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <span className="text-[13px] text-[#555] font-medium uppercase" style={{ letterSpacing: '0.08em' }}>
              Trusted by over 400K subscribers
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/61569919026849"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on Facebook"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform hover:scale-110"
                style={{ background: '#1877F2', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.1 24 18.1 24 12.07z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@braveworksrn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on TikTok"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform hover:scale-110"
                style={{ background: '#000000', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/braveworksrn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Joel Polley, RN on Instagram"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform hover:scale-110"
                style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: '#FFFFFF' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.38C1.35 2.67.94 3.34.63 4.13c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.33 1.35 20.66.94 19.87.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero — 2026-05-25 expert-panel rewrite.
          The previous H1 led with Joel's credentials ("An ICU Nurse's 10-Day…").
          The new H1 is a qualifying QUESTION that makes BP-medicated readers
          self-identify in <2 seconds, then bridges to Joel on line 2. Reasoning
          + alternate variants captured in the audit; this is Version A. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          {/* Community proof badge — replaces the refund badge above the H1.
              The refund moves to microcopy (post-hook, where it removes
              friction instead of pre-empting it). */}
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full" style={{ background: '#F3E8FF', border: '1px solid #E9D5FF' }}>
            <Users size={13} style={{ color: '#6C3483' }} />
            <span style={{ color: '#6C3483', fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
              Read by 1,100+ in the BraveWorks community
            </span>
          </div>
          <h1 className="font-extrabold mb-5 text-balance" style={{ color: 'var(--navy)', fontSize: '30px', lineHeight: '1.15', letterSpacing: '-0.03em' }}>
            Still on BP meds &mdash; and your numbers won't drop?
          </h1>
          <p className="mb-3" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: '1.7' }}>
            I'm Joel Polley, RN &mdash; 20 years ICU and ER. They call me <strong>The Blood Pressure Guy</strong> because I built the 10-day protocol I'd give my own mother.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.5' }}>
            7 guides &middot; 47 herbs &middot; Daily checklists &middot; {PRICE} &middot; 7-day refund, no questions
          </p>
        </div>
      </AnimatedSection>

      {/* Gradient Divider */}
      <hr className="gradient-divider" />

      {/* Gut Punch Quote */}
      <AnimatedSection className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <blockquote className="quote-accent italic pl-5 py-1" style={{ color: 'var(--dark-gray)', fontSize: '20px', lineHeight: '1.5', fontWeight: 500 }}>
            Genetics writes the recipe. Lifestyle bakes the cake.
            <footer style={{ marginTop: '0.75rem', fontSize: '14px', fontStyle: 'normal', fontWeight: 600, color: 'var(--clay, #B85A36)' }}>&mdash; Joel, RN</footer>
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

              {/* Detailed refund block — closes the buy-decision loop with risk reversal */}
              <div className="mt-5 max-w-[420px] mx-auto p-4 rounded-xl text-left" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                <div className="flex items-start gap-2.5">
                  <Shield size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#6C3483' }} />
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#4A2964', fontSize: '14px' }}>
                      The 7-Day Refund Promise
                    </p>
                    <p style={{ color: '#5B3B6E', fontSize: '13px', lineHeight: '1.55' }}>
                      Run the protocol for 7 days with honest effort. If your numbers haven't moved, hit reply with the word <strong>"refund"</strong> and your {PRICE} comes back. The kit is yours to keep either way.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Testimonials */}
          <AnimatedSection className="pt-14 pb-4">
            <h3 className="text-center font-bold text-[18px] text-[#2C3E50] mb-8">What people are saying</h3>
            <div className="flex flex-col md:flex-row gap-5">
              {[
                { quote: "Followed your directions on TikTok and lost 20 lbs. Off 2 of my meds. Keep it up!", source: 'Linda M., 58 · Phoenix, AZ' },
                { quote: "Joel explained what my cardiologist never did — in a 60-second video. I started the protocol that same day.", source: 'Maureen K., 62 · Tampa, FL' },
                { quote: "I was scared to go off my meds. This kit gave me something to show my doctor instead of just saying 'I want to try natural.' Now we're working together.", source: 'Deborah R., 54 · Houston, TX' },
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
              { icon: Users, text: '402K+ across TikTok, Facebook & Instagram' },
            ].map((item, index) => (
              <div key={index} className="proof-badge px-5 py-3">
                <item.icon size={20} style={{ color: 'var(--purple)' }} />
                <span className="font-medium" style={{ color: 'var(--dark-gray)', fontSize: '15px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* AND Statement + Bible catechism — 2026-05-12 funnel-coherence fix.
          "Pills manage output. Protocol fixes input." is the bible's most-
          repeated sentence; appears in 4+ drip emails. Anchoring it on the
          home page reinforces the brand voice cold buyers will see again
          in their inbox. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="max-w-[520px] mx-auto text-center">
            <p style={{ color: 'var(--dark-gray)', fontSize: '17px', lineHeight: '1.5', fontWeight: 600, margin: '0 0 14px' }}>
              Pills manage output. Protocol fixes input.
            </p>
            <p className="italic" style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
              This works alongside your doctor's care, not instead of it. Natural support AND medical guidance — that's the BraveWorks way. <strong style={{ color: 'var(--dark-gray)' }}>Doctor-cleared independence.</strong>
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
              Instant access &middot; Secure checkout &middot; 30-day money-back guarantee
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

      {/* Not-ready-yet quiz CTA — for visitors who want diagnostic before
          committing to the $17. Demoted to footer so it doesn't compete with
          the primary buy decision. 2026-05-12. */}
      <AnimatedSection className="py-10" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container-mobile-first text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-3" style={{ color: 'var(--muted-gray)', fontSize: '14px' }}>
            <HelpCircle size={16} />
            <span>Not ready to buy?</span>
          </div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--navy)', fontSize: '20px', lineHeight: '1.3' }}>
            Take the free 90-second BP Triangle Quiz first.
          </h3>
          <p className="mb-5 max-w-[440px] mx-auto" style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.55' }}>
            Find out which of the Three Pressures is driving YOUR numbers — Pipe Pressure, Stress Pressure, or Sugar Pressure. RN-built. Free. Instant results.
          </p>
          <Link
            to="/quiz"
            className="btn-standard inline-flex"
            style={{ background: 'transparent', color: 'var(--purple)', border: '2px solid var(--purple)', fontSize: '15px' }}
          >
            Take the 90-second quiz →
          </Link>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <div className="py-8" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px' }}>
            &copy; 2026 BraveWorks RN. All rights reserved.
          </p>
        </div>
      </div>

      {/* Exit-intent + dwell-time lead-magnet popup. Renders an absolutely-
          positioned overlay; tree position doesn't matter for layout.
          One-shot per visitor (localStorage cookbookPopupShown). Suppressed
          after purchase (localStorage purchaseCompleted). */}
      <ExitIntentPopup />
    </div>
  );
};

export default CheckoutPage;
