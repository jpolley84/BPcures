import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShoppingBag, Calendar, Heart, Users, Loader2, Play, TrendingUp, Star, Shield, Zap } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
// 2026-06-08 — exit-intent / dwell popup now drives the about-to-bounce
// visitor to the FREE quiz (lower-commitment than the $17 ask; the quiz
// captures the email and routes back to the kit on its results page).
// Triggers on mouseleave OR 14s dwell, once per visitor (localStorage
// quizExitPopupShown). Suppressed after purchase. See ExitIntentPopup.jsx.
import ExitIntentPopup from '../components/ExitIntentPopup';

const PRICE = '$17';
// 2026-05-18: env-var pattern with hardcoded fallback. The hardcoded ID is
// the $17 kit price; it stays as the safety net so a missing env var doesn't
// break checkout. To change the price, update VITE_STRIPE_KIT_PRICE_ID in
// Vercel, no code deploy needed.
// 2026-06-08: product copy renamed off "Blood Pressure Cures" sitewide.
// JOEL TODO: rename the product TITLE in the Stripe Dashboard so receipts
// don't say "Cures" (price/link IDs unchanged).
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

  // 2026-06-08 conversion + compliance pass: collapsed the stack to 5 honest,
  // distinct items at believable values (total $89). The free quiz is listed
  // as a $0 post-purchase bonus, not a priced anchor. The "BP Cures" companion
  // book was REMOVED from this free stack because the post-purchase upsell
  // charges for it separately (was a double-charge). A believable ~5x anchor
  // ($89 → $17) converts better than a fake 26x.
  const whatIsIncluded = [
    // 2026-05-12 naming-taxonomy note: "Protocol" keeps this distinct from
    // /challenge (the paid $97 BP Triangle Cohort) and the email lead magnet.
    { name: '10-Day BP Reset Protocol', description: "Wake up. Open that day's PDF. Follow the checklist. That's the whole system.", value: '$29' },
    { name: 'Master Blood Pressure Document', description: 'The full guide. What to take, when to take it, how much.', value: '$19' },
    { name: 'Top 10 Herbs Deep Dive', description: 'The herbs most studied for blood pressure and lifestyle support, and how each is traditionally used.', value: '$19' },
    { name: 'Cook For Life Cookbook', description: 'Plant-based recipes built around the herbs and foods that support healthy numbers.', value: '$12' },
    { name: 'White Coat Syndrome Guide + BP FAQ + Tracker', description: 'Why your readings at the doctor can read high, plus 25 plain answers and a fridge tracker to log your progress.', value: '$10' },
    { name: 'BONUS: Free BP Triangle Quiz, RN-built', description: 'After you buy, take the free quiz with your numbers and meds handy. It maps your loudest Pressure and tells you the one thing to do first. No pitch, just nursing.', value: '$0' },
  ];

  const timeEffortKillers = [
    { icon: Clock, headline: '15 minutes a day', description: "That's it. Follow the daily checklist." },
    { icon: ShoppingBag, headline: 'Common grocery store ingredients', description: 'No specialty shops. No strange powders.' },
    { icon: Calendar, headline: 'A clear daily step from Day 1', description: "Most people finish the day's checklist in under 15 minutes." },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top credibility strip. 2026-06-08 conversion pass.
          Was a /quiz link, which gave buy-ready traffic a free exit at the
          very top of the page. Replaced with a non-clickable credibility
          strip so the first thing a visitor sees is proof + price + risk
          reversal, not an off-ramp. A subtle quiz path still lives in the
          footer for visitors who genuinely want the diagnostic first. */}
      <div
        className="block text-center"
        style={{
          background: '#3F5A3C',
          color: '#FBF8F1',
          padding: '14px 16px',
          fontSize: '16px',
          fontWeight: 600,
          lineHeight: 1.6,
          letterSpacing: '0.01em',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        RN-built. Trusted by 165K+. {PRICE}.&nbsp;
        <span style={{ color: '#C7A95E' }}>30-day Feel-It-or-Free.</span>
      </div>

      {/* Headshot — WebP for modern browsers (14KB) + JPG fallback (36KB).
          2026-05-12: was a 2MB PNG that killed mobile LCP. Now <40KB total. */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center">
          <div className="headshot-ring">
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN. The Blood Pressure Guy. 20 years ICU and emergency medicine, naturopathic-trained"
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

      {/* Credential Bar. 2026-06-08: text bumped to 16px/1.6 for aging eyes,
          and the secondary "free BP quiz" off-ramp removed so the bar reads as
          pure credibility (the quiz now lives only in the footer). */}
      <div className="credential-bar py-3.5" style={{ animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
        <div className="container-mobile-first">
          <p className="text-center font-medium" style={{ color: 'var(--white)', fontSize: '16px', lineHeight: '1.6', letterSpacing: '0.02em' }}>
            Joel Polley, RN · The Blood Pressure Guy · 20 Years ICU & Emergency Medicine
          </p>
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
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
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
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
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
                className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-110"
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

      {/* Hero. 2026-06-08 conversion pass.
          H1 is now outcome-first and compliant (no cure / reverse / off-meds).
          The backstory ("I gave this to my mom first") moves to the subhead.
          Risk reversal and the honest $89 → $17 anchor now sit above the fold
          in the subline so buyers see proof + price + guarantee before scroll. */}
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
            The 10-Day Plan an ICU Nurse Built to Help His Mother Take Charge of Her Blood Pressure, Alongside Her Doctor.
          </h1>
          <p className="mb-3" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: '1.7' }}>
            I'm Joel Polley, RN. 20 years ICU and ER. They call me <strong>The Blood Pressure Guy</strong> because I gave this protocol to my mom first. Now I give it to you.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '15px', lineHeight: '1.5' }}>
            7 guides &middot; 47 herbs &middot; Daily checklists &middot; <strong style={{ color: 'var(--dark-gray)' }}>$89 value, just {PRICE}</strong> &middot; 30-day Feel-It-or-Free guarantee
          </p>
        </div>
      </AnimatedSection>

      {/* AND Statement + Bible catechism. 2026-06-08: moved UP to sit right
          below the hero so the "alongside your doctor, not instead of it"
          complement message frames the offer before any buy ask. The closing
          independence phrase was removed (it implied replacing care).
          "Pills manage output. Protocol fixes input." is the brand's
          most-repeated line; cold buyers see it again in drip emails. */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="max-w-[520px] mx-auto text-center">
            <p style={{ color: 'var(--dark-gray)', fontSize: '17px', lineHeight: '1.5', fontWeight: 600, margin: '0 0 14px' }}>
              Pills manage output. Protocol fixes input.
            </p>
            <p className="italic" style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
              This works alongside your doctor's care, not instead of it. Natural support AND medical guidance. That's the BraveWorks way.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Gradient Divider */}
      <hr className="gradient-divider" />

      {/* Gut Punch Quote */}
      <AnimatedSection className="section-spacing" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <blockquote className="quote-accent italic pl-5 py-1" style={{ color: 'var(--dark-gray)', fontSize: '20px', lineHeight: '1.5', fontWeight: 500 }}>
            Genetics writes the recipe. Lifestyle bakes the cake.
            <footer style={{ marginTop: '0.75rem', fontSize: '14px', fontStyle: 'normal', fontWeight: 600, color: 'var(--clay, #B85A36)' }}>Joel, RN</footer>
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
                <span className="line-through text-[#9CA3AF] text-[15px] mr-2">$89 value</span>
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

              {/* Detailed refund block. Closes the buy-decision loop with risk reversal. */}
              <div className="mt-5 max-w-[420px] mx-auto p-4 rounded-xl text-left" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                <div className="flex items-start gap-2.5">
                  <Shield size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#6C3483' }} />
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#4A2964', fontSize: '14px' }}>
                      The Feel-It-or-Free Promise
                    </p>
                    <p style={{ color: '#3E2451', fontSize: '15px', lineHeight: '1.55' }}>
                      Joel's promise: Run the full 10-day plan. If you don't feel a difference, reply with the word <strong>REFUND</strong> and your money comes back. Keep the books either way. No hoops, no doctor visits, no fine print.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Testimonials. 2026-06-08: lead quote is now a BP-number +
              physician-oversight story (was a weight-loss / "off 2 meds"
              quote with no doctor context). Every quote now keeps the doctor
              in the loop. "Results not typical" note added below. */}
          <AnimatedSection className="pt-14 pb-4">
            <h3 className="text-center font-bold text-[18px] text-[#2C3E50] mb-8">What people are saying</h3>
            <div className="flex flex-col md:flex-row gap-5">
              {[
                { quote: "My numbers went from the 150s/90s to the 130s/80s over six weeks, and my doctor and I are watching it together.", source: 'Michael T., 61 · Denver, CO' },
                { quote: "This kit gave me something to show my doctor instead of just saying 'I want to try natural.' Now we're working together.", source: 'Deborah R., 54 · Houston, TX' },
                { quote: "Joel explained what my cardiologist never did, in a 60-second video. I started the protocol that same day.", source: 'Maureen K., 62 · Tampa, FL' },
              ].map((t, i) => (
                <div key={i} className="testimonial-card p-5 flex-1 flex flex-col">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="fill-[#F39C12] text-[#F39C12]" />
                    ))}
                  </div>
                  <p className="text-[#4A4A4A] italic text-[15px] mb-4 flex-grow leading-relaxed">"{t.quote}"</p>
                  <p className="text-[#9CA3AF] text-[13px] font-medium">{t.source}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-6" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: '1.5' }}>
              Results not typical. Most readers see modest results or none. Always work with your doctor.
            </p>
            <p className="text-center mt-2" style={{ color: 'var(--dark-gray)', fontSize: '15px', fontWeight: 600, lineHeight: '1.5' }}>
              But most <em>doers</em> see modest to excellent results. The difference is doing the work.
            </p>
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
              { icon: Heart, text: 'Naturopathic-Trained' },
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
                `Buy Now for ${PRICE}`
              )}
            </button>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              Instant access &middot; Secure checkout &middot; 30-day Feel-It-or-Free
            </p>

            {/* P.S. block. 2026-06-08: restates the offer, guarantee, and
                instant download in plain language. Compliant: no outcome or
                timing claims. */}
            <p className="mt-8 max-w-[480px] mx-auto text-left" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px', lineHeight: '1.7' }}>
              <strong style={{ color: 'var(--white)' }}>P.S.</strong> You get all 7 guides, the 47-herb deep dive, and the daily checklists for {PRICE}. Download them to your phone the second you buy. Run the full 10-day plan, and if you don't feel a difference, reply REFUND and your money comes back. Keep the books either way. That's the 30-day Feel-It-or-Free promise.
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
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Buy Now for ${PRICE}`}
            </button>
          </div>
        </div>
      )}

      {/* Cross-sell box: hormones (RestoreHER). For homepage visitors whose
          real struggle is hormonal imbalance, not blood pressure. Links to the
          sister site. Placed under the kit/close. 2026-06-08. */}
      <div className="py-12" style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="mx-auto text-center" style={{ maxWidth: '540px', background: 'var(--light-gray)', borderRadius: '16px', padding: '30px 24px' }}>
              <p className="mb-2" style={{ color: 'var(--muted-gray)', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
                For women
              </p>
              <h3 className="mb-3" style={{ color: 'var(--navy)', fontSize: '23px', fontWeight: 700, lineHeight: 1.3 }}>
                Is it your hormones, not just your pressure?
              </h3>
              <p className="mb-6 mx-auto" style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.65, maxWidth: '440px' }}>
                Hot flashes, weight that will not move, mood swings, the bone-deep tired. If hormonal imbalance is the real story, our sister program <strong>RestoreHER Hormones</strong> was built for you, with a live, in-person event featuring Barbara O'Neill.
              </p>
              <a
                href="https://restoreherhormones.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold transition-all duration-200 active:scale-95"
                style={{ border: '1.5px solid var(--navy)', color: 'var(--navy)', borderRadius: '12px', padding: '13px 26px', fontSize: '15px' }}
              >
                Visit RestoreHER Hormones
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Footer. 2026-06-08 conversion + compliance pass.
          The old prominent "Not ready to buy? Take the quiz" section was a
          styled button that competed with the buy decision; it's now a small
          inline text link inside this footer (discoverable, not a CTA).
          Added a legal disclosure block because this page renders standalone
          with no shared site Footer, so /disclaimer /terms /privacy were
          otherwise unreachable. */}
      <div className="py-8" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <p className="text-center mb-4" style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: '1.55' }}>
            Not ready to buy? <Link to="/quiz" style={{ color: 'var(--purple)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Take the free 90-second BP quiz first.</Link>
          </p>

          {/* Legal disclosure */}
          <div className="max-w-[560px] mx-auto text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px' }}>
              These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, or prevent any disease.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              Educational and lifestyle content only. Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or adjust medication without your doctor.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              Results not typical. Most readers see modest results or none.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <a href="/disclaimer" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Disclaimer</a>
              {' · '}
              <a href="/terms" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</a>
              {' · '}
              <a href="/privacy" style={{ color: 'var(--muted-gray)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy</a>
            </p>
            <p style={{ margin: 0 }}>
              &copy; 2026 BraveWorks RN. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Exit-intent + dwell-time popup -> drives to the free /quiz. Renders an
          absolutely-positioned overlay; tree position doesn't matter for layout.
          One-shot per visitor (localStorage quizExitPopupShown). Suppressed
          after purchase (localStorage purchaseCompleted). */}
      <ExitIntentPopup />
    </div>
  );
};

export default CheckoutPage;
