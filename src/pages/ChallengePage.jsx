import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star, Shield, Clock, Users, Mail, Play, BookOpen, Video, MessageCircle, Zap } from 'lucide-react';

const VIP_LINK = 'https://buy.stripe.com/14A28r0RBgqi77l0oVfnO0w';
const PREMIUM_LINK = 'https://buy.stripe.com/3cI5kDdEn1voajx6NjfnO0B';

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } };

export default function ChallengePage() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <HeroSection />
      <TriangleExplainer />
      <FreeTier />
      <VIPTier />
      <PremiumTier />
      <GuaranteeSection />
      <WhyThisPrice />
      <FinalCTA />
      <PageFooter />
    </div>
  );
}

/* ---- HERO ---- */
function HeroSection() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 6vw, 4rem)' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft)' }}>
              Free 30-Day Challenge · Starts Friday May 1 — 8 AM ET
            </span>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-5)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 1.25rem', fontVariationSettings: '"SOFT" 50, "opsz" 120' }}>
            The Pressure <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)' }}>Triangle</em>
          </h1>

          <p style={{ fontSize: 'var(--step-1)', lineHeight: 1.55, color: 'rgba(251,248,241,0.8)', margin: '0 0 2rem', maxWidth: '52ch' }}>
            Blood pressure. Cortisol. Blood sugar. They're not three problems — they're three corners of the same loop. Break the loop in 30 days.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#free" className="btn btn-lg" style={{ background: 'var(--clay)', color: 'var(--cream)', padding: '0.95rem 1.5rem', borderRadius: 12, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Join Free <ArrowRight size={16} />
            </a>
            <a href="#vip" style={{ padding: '0.95rem 1.5rem', borderRadius: 12, border: '1px solid rgba(251,248,241,0.25)', color: 'var(--cream)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              See VIP & Premium <ArrowRight size={14} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', color: 'rgba(251,248,241,0.6)', fontSize: '0.88rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(251,248,241,0.08)', border: '1px solid rgba(251,248,241,0.15)', display: 'grid', placeItems: 'center', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--cream)' }}>JP</div>
            <span>Joel Polley, RN · 20 years ICU & Emergency</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---- TRIANGLE EXPLAINER ---- */
function TriangleExplainer() {
  return (
    <section id="triangle" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>The science</span>
          <h2 className="display-m" style={{ margin: '0 0 1.5rem', maxWidth: '20ch' }}>
            Why one-thing fixes <em className="ital-display" style={{ color: 'var(--clay)' }}>don't work.</em>
          </h2>

          <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>
            <TriangleCorner
              icon="🔺"
              title="Cortisol"
              text="Tightens your vessels and holds onto sodium. Your body thinks it's in danger — 24/7."
            />
            <TriangleCorner
              icon="🔺"
              title="Blood Sugar"
              text="Inflames your artery walls and triggers more cortisol. The spike-crash cycle never stops."
            />
            <TriangleCorner
              icon="🔺"
              title="Blood Pressure"
              text="Damages your endothelium and kills nitric oxide production — which makes the first two worse."
            />
          </div>

          <div style={{ background: 'var(--paper-warm)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.5, margin: 0, color: 'var(--ink)', fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              Each corner feeds the next two. You can't pull on one corner of a triangle without the other two pulling back. <strong style={{ color: 'var(--clay)' }}>For 30 days, we're breaking the loop.</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TriangleCorner({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <strong style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', display: 'block', marginBottom: '0.2rem' }}>{title}</strong>
        <span style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>{text}</span>
      </div>
    </div>
  );
}

/* ---- FREE TIER ---- */
function FreeTier() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus('sending');
    try {
      await fetch('/api/challenge-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
    } catch {}
    setStatus('done');
  }

  return (
    <section id="free" style={{ padding: 'clamp(2rem, 4vw, 3rem) 0 clamp(3rem, 6vw, 5rem)' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <div style={{ background: 'var(--cream)', borderRadius: 20, border: '2px solid var(--line)', padding: 'clamp(1.75rem, 4vw, 2.5rem)', position: 'relative' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sage)', fontWeight: 600, marginBottom: '0.75rem' }}>
              🆓 The Free Challenge
            </div>

            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              30 days. 30 emails. The full protocol.
            </h3>

            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: '52ch' }}>
              The same protocol I use with the ICU patients I've watched walk in on five medications and walk out on two — sometimes one. No card. No upsell wall. Just enroll.
            </p>

            {status === 'done' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'var(--sage)', borderRadius: 12, color: 'var(--cream)' }}>
                <Check size={20} />
                <div>
                  <strong style={{ display: 'block' }}>You're in.</strong>
                  <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>Friday 8 AM EST — watch your inbox.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="text" placeholder="First name" value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--paper)', fontSize: '0.95rem', flex: '0 0 140px' }} />
                <input type="email" required placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--paper)', fontSize: '0.95rem', flex: '1 1 200px', minWidth: 0 }} />
                <button type="submit" disabled={status === 'sending'} style={{ padding: '0.85rem 1.5rem', background: 'var(--sage)', color: 'var(--cream)', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: 'none', cursor: 'pointer' }}>
                  {status === 'sending' ? 'Joining…' : 'Join Free'} <ArrowRight size={16} />
                </button>
              </form>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
              Free. No card required. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---- VIP TIER ---- */
function VIPTier() {
  return (
    <section id="vip" style={{ background: 'var(--paper-warm)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <div style={{ background: 'var(--ink)', borderRadius: 22, padding: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>

            <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clay-soft)', fontWeight: 600, marginBottom: '0.75rem' }}>
              ⭐ VIP · Pre-Launch Pricing
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 500, letterSpacing: '-0.02em' }}>$97</span>
              <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1.1rem' }}>$147</span>
              <span style={{ background: 'var(--clay)', color: 'var(--cream)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.65rem', borderRadius: 999 }}>Save $50</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'rgba(251,248,241,0.5)', marginBottom: '1.5rem' }}>
              $3.23/day for 30 days. Less than your prescription co-pay.
            </p>

            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 400, lineHeight: 1.2, margin: '0 0 0.5rem', fontVariationSettings: '"SOFT" 60, "opsz" 72' }}>
              For the women who want the deeper room.
            </h3>
            <p style={{ color: 'rgba(251,248,241,0.75)', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
              Everything in the free challenge, plus live coaching with Joel every Monday.
            </p>

            <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '2rem' }}>
              <FeatureRow icon={<BookOpen size={16} />} text="The full Be There in 30 book — 560 pages, every chapter expanded" />
              <FeatureRow icon={<BookOpen size={16} />} text="3 supporting books: BP Cure + Overmedicated Boomer + Cook For Life" />
              <FeatureRow icon={<Play size={16} />} text="Mondays at 10 PM EST live with Joel — coaching, troubleshooting, your questions answered" />
              <FeatureRow icon={<Video size={16} />} text="Lifetime replays of every call" />
              <FeatureRow icon={<Users size={16} />} text="Skool VIP room — where the women who finished before you share what worked" />
              <FeatureRow icon={<Zap size={16} />} text="4 fast-action bonuses: 7-Day BP Drop Protocol, Pressure Triangle Tracker, Joel's Stall Cheat Sheet, 30-Day Future Self Journal" />
            </div>

            <div style={{ background: 'rgba(251,248,241,0.06)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.75rem', border: '1px solid rgba(251,248,241,0.1)' }}>
              <span style={{ fontSize: '0.82rem', color: 'rgba(251,248,241,0.5)' }}>Total value: </span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500 }}>$777</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(251,248,241,0.5)' }}> · Your price: </span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: 'var(--clay-soft)' }}>$97</span>
            </div>

            <a href={VIP_LINK} target="_top" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clay)', color: 'var(--cream)', padding: '1rem 2rem', borderRadius: 12, fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none', transition: 'transform 0.15s' }}>
              Lock in VIP — $97 <ArrowRight size={16} />
            </a>

            <p style={{ fontSize: '0.78rem', color: 'rgba(251,248,241,0.4)', marginTop: '0.75rem' }}>
              Pre-launch price. Jumps to $147 Friday at 8 AM EST.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---- PREMIUM TIER ---- */
function PremiumTier() {
  return (
    <section id="premium" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <div style={{ background: 'linear-gradient(135deg, #6C3483 0%, #4A2D5E 100%)', borderRadius: 22, padding: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clay-soft)', fontWeight: 600 }}>
                🌟 Premium · 50 Seats · Hard Cap
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 500, letterSpacing: '-0.02em' }}>$397</span>
              <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1.1rem' }}>$497</span>
              <span style={{ background: 'var(--clay)', color: 'var(--cream)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.65rem', borderRadius: 999 }}>Save $100</span>
            </div>

            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 400, lineHeight: 1.2, margin: '0.5rem 0 0.75rem', fontVariationSettings: '"SOFT" 60, "opsz" 72' }}>
              The 50-seat problem.
            </h3>

            <p style={{ color: 'rgba(251,248,241,0.8)', lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: '52ch' }}>
              Premium includes a personal 15-minute Loom video review — I sit down, watch your numbers, look at your protocol, and film you a video walking through what to fix. Just you. Just me. From my kitchen.
            </p>

            <p style={{ color: 'rgba(251,248,241,0.65)', lineHeight: 1.6, margin: '0 0 1.75rem', fontSize: '0.92rem' }}>
              At 50 seats, that's 12.5 hours of recording I can fit into a launch month without quality dropping. Past 50, I can't. The cap protects you, not me.
            </p>

            <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
              <FeatureRow icon={<Check size={16} />} text="Everything in VIP" highlight />
              <FeatureRow icon={<Video size={16} />} text="Joel's personal Loom review of YOUR protocol" highlight />
              <FeatureRow icon={<Star size={16} />} text="RestoreHER Virtual Ticket (June 24–25 — Barbara O'Neill keynoting, Annie teaching)" highlight />
              <FeatureRow icon={<MessageCircle size={16} />} text="Skip-the-line Q&A in every Monday call" />
              <FeatureRow icon={<Clock size={16} />} text="24-hour early access to all replays" />
              <FeatureRow icon={<Users size={16} />} text="Premium Skool room — direct line to Joel" />
            </div>

            <div style={{ background: 'rgba(251,248,241,0.08)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem', border: '1px solid rgba(251,248,241,0.15)' }}>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, margin: 0, color: 'rgba(251,248,241,0.85)' }}>
                <strong>The math that matters:</strong> The RestoreHER virtual ticket alone is $297 at everydaynurse.com. Premium is $100 more — and gets you the ticket, the Loom review, and everything else.
              </p>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, margin: '0.75rem 0 0', color: 'rgba(251,248,241,0.85)' }}>
                You can buy a $297 ticket. Or you can buy a <strong>$397 transformation.</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'rgba(251,248,241,0.5)' }}>Total value: </span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500 }}>$1,662</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(251,248,241,0.5)' }}> · Your price: </span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: 'var(--clay-soft)' }}>$397</span>
            </div>

            <a href={PREMIUM_LINK} target="_top" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: '#6C3483', padding: '1rem 2rem', borderRadius: 12, fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none' }}>
              Claim Your Seat — $397 <ArrowRight size={16} />
            </a>

            <p style={{ fontSize: '0.78rem', color: 'rgba(251,248,241,0.4)', marginTop: '0.75rem' }}>
              Pre-launch price. Jumps to $497 Friday 8 AM. Gone at 50 seats.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureRow({ icon, text, highlight }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ color: highlight ? 'var(--clay-soft)' : 'rgba(251,248,241,0.5)', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(251,248,241,0.9)' }}>{text}</span>
    </div>
  );
}

/* ---- GUARANTEES ---- */
function GuaranteeSection() {
  return (
    <section style={{ background: 'var(--paper-warm)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Your protection</span>
          <h2 className="display-m" style={{ margin: '0 0 2rem' }}>
            Three guarantees. <em className="ital-display" style={{ color: 'var(--clay)' }}>Zero risk.</em>
          </h2>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* VIP Guarantees */}
            <div style={{ background: 'var(--cream)', borderRadius: 18, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)', fontWeight: 600, marginBottom: '1rem' }}>
                <Shield size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                Triple Guarantee · VIP
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <GuaranteeItem
                  title="Numbers Guarantee"
                  text="Complete the 30 days. If your BP hasn't dropped, full refund. Keep the books."
                />
                <GuaranteeItem
                  title="Time Guarantee"
                  text="Under 20 minutes a day or full refund."
                />
                <GuaranteeItem
                  title="Better-Than-Money-Back Promise"
                  text="If you refund, I'll send you the RestoreHER Virtual Ticket ($297 value) free as my apology for missing."
                />
              </div>
            </div>

            {/* Premium Guarantee */}
            <div style={{ background: 'var(--cream)', borderRadius: 18, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '2px solid var(--gold)' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '1rem' }}>
                <Shield size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                Iron-Clad Guarantee · Premium
              </div>

              <GuaranteeItem
                title="The Premium Promise"
                text="If after your Loom review and 30 days your numbers haven't moved — full refund. Keep the books. Keep the ticket. Plus a second free Loom review when you're ready to try again."
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function GuaranteeItem({ title, text }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <Check size={18} style={{ color: 'var(--sage)', marginTop: 2, flexShrink: 0 }} />
      <div>
        <strong style={{ fontFamily: 'Fraunces, serif', display: 'block', marginBottom: '0.15rem' }}>{title}</strong>
        <span style={{ color: 'var(--ink-soft)', lineHeight: 1.55, fontSize: '0.95rem' }}>{text}</span>
      </div>
    </div>
  );
}

/* ---- WHY THIS PRICE ---- */
function WhyThisPrice() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>The reasoning</span>
          <h2 className="display-s" style={{ margin: '0 0 1.5rem' }}>
            Why $97? Why $397?
          </h2>

          <div style={{ display: 'grid', gap: '1.25rem', color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--ink)' }}>VIP is $97</strong> because that's roughly what one month of BP medication costs the average person. I priced it to be a wash on month one — and an investment for the rest of your life.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--ink)' }}>Premium is $397</strong> because past that price point, we're competing with $2,500 functional medicine packages — and frankly, this protocol works better than most of them.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--ink)' }}>Pre-launch pricing exists</strong> because you read every email I sent for the last year. You earned the discount. Friday at 8 AM the prices go up because that's fair to everyone else.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---- FINAL CTA ---- */
function FinalCTA() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 800, textAlign: 'center' }}>
        <motion.div {...fade}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
            Lock your seat <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)' }}>now.</em>
          </h2>

          <p style={{ color: 'rgba(251,248,241,0.7)', fontSize: '1rem', lineHeight: 1.6, margin: '0 auto 2rem', maxWidth: '44ch' }}>
            After Friday 8 AM, public pricing applies. After 50 Premium seats are gone, the personal Loom is gone with them.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#free" style={{ padding: '0.95rem 1.5rem', borderRadius: 12, border: '1px solid rgba(251,248,241,0.25)', color: 'var(--cream)', textDecoration: 'none', fontWeight: 500 }}>
              Join Free
            </a>
            <a href={VIP_LINK} target="_top" rel="noopener" style={{ padding: '0.95rem 1.5rem', borderRadius: 12, background: 'var(--clay)', color: 'var(--cream)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              VIP — $97 <ArrowRight size={14} />
            </a>
            <a href={PREMIUM_LINK} target="_top" rel="noopener" style={{ padding: '0.95rem 1.5rem', borderRadius: 12, background: '#FFFFFF', color: 'var(--sage-deep)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Premium — $397 <ArrowRight size={14} />
            </a>
          </div>

          <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(251,248,241,0.45)', marginTop: '2.5rem' }}>
            Genetics writes the recipe. Lifestyle bakes the cake. Be your own doctor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---- FOOTER ---- */
function PageFooter() {
  return (
    <footer style={{ background: 'var(--ink)', color: 'rgba(251,248,241,0.4)', padding: '2rem 0', textAlign: 'center', fontSize: '0.78rem', lineHeight: 1.6 }}>
      <div className="shell">
        <p style={{ margin: '0 0 0.5rem' }}>
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="https://bpquiz.com" style={{ color: 'rgba(251,248,241,0.5)' }}>bpquiz.com</a>
        </p>
        <p style={{ margin: '0 0 0.5rem' }}>
          TikTok: <a href="https://tiktok.com/@braveworksrn" style={{ color: 'var(--clay-soft)' }}>@braveworksrn</a>
        </p>
        <p style={{ margin: 0 }}>
          Educational content only. Not medical advice. Always complement — never replace — care from your physician.
        </p>
      </div>
    </footer>
  );
}
