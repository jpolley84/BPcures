import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, MessageSquare, Globe, Mail, BarChart3, BookOpen, Zap, Shield, Clock, Users, Layers, Code2, Smartphone, PenTool, TrendingUp, ChevronRight } from 'lucide-react';

const STARTER_LINK = '#starter-apply';
const LAUNCHER_LINK = '#launcher-apply';
const REVENUE_LINK = '#revenue-apply';
const CALENDLY_LINK = 'https://calendly.com/braveworksrn/practice-launcher';

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } };
const stagger = (i) => ({ ...fade, transition: { ...fade.transition, delay: i * 0.1 } });

export default function LauncherPage() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <HeroSection />
      <ProblemSection />
      <ImagineSection />
      <WhatYouGet />
      <ReplaceSection />
      <TierSection />
      <GuaranteeSection />
      <FAQSection />
      <FinalCTA />
      <PageFooter />
    </div>
  );
}

/* ================================================================
   HERO
   ================================================================ */
function HeroSection() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3.5rem, 9vw, 7rem) 0 clamp(3rem, 7vw, 5rem)' }}>
      <div className="shell" style={{ maxWidth: 860 }}>
        <motion.div {...fade}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft)' }}>
              5 slots per month · Founding Cohort Open
            </span>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-5)', fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.03em', margin: '0 0 1.5rem', fontVariationSettings: '"SOFT" 50, "opsz" 120' }}>
            Talk to your business.
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)', fontVariationSettings: '"SOFT" 100, "opsz" 120' }}>Watch it listen.</em>
          </h1>

          <p style={{ fontSize: 'var(--step-1)', lineHeight: 1.55, color: 'rgba(251,248,241,0.82)', margin: '0 0 1.75rem', maxWidth: '54ch' }}>
            Your entire health coaching business — website, email automation, payment processing, AI content engine, and a 24/7 team that builds what you describe — installed in one setup. By the nurse who built it for himself first.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a href="#tiers" className="btn btn-lg" style={{ background: 'var(--clay)', color: 'var(--cream)', padding: '1rem 1.75rem', borderRadius: 12, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              See the three tiers <ArrowRight size={16} />
            </a>
            <a href="#imagine" style={{ padding: '1rem 1.75rem', borderRadius: 12, border: '1px solid rgba(251,248,241,0.2)', color: 'var(--cream)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              How it works <ArrowRight size={14} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              ['$143,000/yr', 'in staff & software — replaced'],
              ['72 hours', 'from setup call to live site'],
              ['60 days', 'to first paying client — guaranteed'],
            ].map(([big, small], i) => (
              <motion.div key={i} {...stagger(i)} style={{ background: 'rgba(251,248,241,0.06)', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid rgba(251,248,241,0.08)' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.25rem' }}>{big}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(251,248,241,0.55)', lineHeight: 1.4 }}>{small}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem', color: 'rgba(251,248,241,0.55)', fontSize: '0.88rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(251,248,241,0.08)', border: '1px solid rgba(251,248,241,0.15)', display: 'grid', placeItems: 'center', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--cream)' }}>JP</div>
            <span>Joel Polley, RN · Built this system for BraveWorks RN · Now installing it in yours</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   PROBLEM — Why most health coaches fail
   ================================================================ */
function ProblemSection() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 780 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>The real problem</span>
          <h2 className="display-m" style={{ margin: '0 0 1.5rem', maxWidth: '24ch' }}>
            You don't have a knowledge problem. You have a <em className="ital-display" style={{ color: 'var(--clay)' }}>delivery</em> problem.
          </h2>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: '58ch' }}>
            You passed the certification. You know the protocols. You've helped people one-on-one and watched them transform. But right now, your "business" is a Canva logo, a free Mailchimp account, and an Instagram page with 200 followers that you haven't posted to in three weeks.
          </p>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'var(--ink-soft)', marginBottom: '2rem', maxWidth: '58ch' }}>
            The gap between what you know and what you earn isn't your fault. It's a systems gap. You need a developer, a copywriter, a social media manager, an email strategist, and a marketing director — and you can't afford any of them.
          </p>

          <div style={{ background: 'var(--paper-warm)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.45, margin: 0, color: 'var(--ink)', fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              What if you didn't need to hire any of them? What if you could <strong style={{ color: 'var(--clay)' }}>describe what you want</strong> — in plain English — and a team of AI agents built it, sent it, posted it, and optimized it while you focused on the one thing you're actually trained to do: <strong style={{ color: 'var(--clay)' }}>helping people get well?</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   IMAGINE — Conversational walkthrough
   ================================================================ */
function ImagineSection() {
  const scenarios = [
    {
      icon: <Smartphone size={20} />,
      you: '"Write me a TikTok script about magnesium glycinate for women over 45 who can\'t sleep through the night. Use my voice. Make it 60 seconds."',
      result: 'Sixty seconds later — a script in your cadence, your phrases, optimized so TikTok doesn\'t suppress it for health claims. Description, hashtags, and a CTA that drives to your email list. Record over lunch. Post. Done.',
    },
    {
      icon: <Code2 size={20} />,
      you: '"Change the headline on my quiz page to \'The 3-minute quiz that tells you which herbs match your blood profile.\' Push it live."',
      result: 'Done. No login to Wix. No dragging boxes in ClickFunnels. No waiting for your developer. Your site updates in 90 seconds — deployed on the same infrastructure Netflix uses. Free hosting. Forever.',
    },
    {
      icon: <BarChart3 size={20} />,
      you: 'You didn\'t even ask. Your AI team says:',
      result: '"Open rates dropped 6% over three days. I rewrote tomorrow\'s subject line and A/B tested two variants on a 10% segment this morning. Variant B won — 34% open rate vs. 21%. Already swapped it in for the full send."',
    },
    {
      icon: <TrendingUp size={20} />,
      you: '"What should I focus on this week based on my data?"',
      result: 'Dispatch scans your TikTok, your email stats, your Stripe revenue, and your quiz conversion rate — then tells you the one lever that moves the needle most. Like a $10,000/month marketing director who never takes a day off.',
    },
  ];

  return (
    <section id="imagine" style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3rem, 7vw, 5.5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 780 }}>
        <motion.div {...fade}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft)', marginBottom: '1rem', display: 'block' }}>
            Imagine this
          </span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 2.5rem', fontVariationSettings: '"SOFT" 50, "opsz" 96' }}>
            You speak. <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)', fontVariationSettings: '"SOFT" 100' }}>It happens.</em>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {scenarios.map((s, i) => (
            <motion.div key={i} {...stagger(i)} style={{ background: 'rgba(251,248,241,0.04)', border: '1px solid rgba(251,248,241,0.08)', borderRadius: 18, padding: 'clamp(1.5rem, 3vw, 2rem)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--clay-soft)' }}>
                {s.icon}
                <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {i === 2 ? 'Automatic' : 'You say'}
                </span>
              </div>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.45, color: 'var(--cream)', margin: '0 0 1rem', fontVariationSettings: '"SOFT" 70, "opsz" 72', fontStyle: 'italic' }}>
                {s.you}
              </p>
              <div style={{ borderTop: '1px solid rgba(251,248,241,0.08)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(251,248,241,0.7)', margin: 0 }}>
                  {s.result}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   WHAT YOU GET — Full stack inventory
   ================================================================ */
function WhatYouGet() {
  const items = [
    { icon: <Globe size={20} />, title: 'Custom Quiz Funnel Website', desc: 'Your brand. Your niche quiz. Mobile-optimized, sub-2-second load. Free hosting on Vercel — the same infrastructure Netflix uses. When you want something changed, you tell Dispatch and it\'s live in 90 seconds.', value: '$8,000–15,000' },
    { icon: <Mail size={20} />, title: 'Email Automation System', desc: 'Instant welcome emails on signup. Marketing broadcasts. AI monitors open rates, click rates, and unsubscribes — rewrites underperforming copy automatically. No dashboard to learn. No drag-and-drop editor to fight with.', value: '$3,000–5,000' },
    { icon: <Layers size={20} />, title: 'Stripe Tiered Checkout', desc: 'Free tier, mid-tier, premium tier — whatever your offer structure is. Payment links, pre-launch pricing, seat caps, order bumps. All configured. All live.', value: '$1,500–3,000' },
    { icon: <MessageSquare size={20} />, title: 'AI Command Center (Dispatch)', desc: 'Claude Opus 4 powering every agent. You open a conversation and say what you need — content, emails, site changes, analytics, strategy. It learns your voice. It works 24/7. It gets better the more you use it.', value: 'Priceless' },
    { icon: <PenTool size={20} />, title: 'Content Engine', desc: 'TikTok scripts, YouTube scripts, email copy, social captions, hashtags — all generated in YOUR voice from your brand profile. The AI knows which health claims get flagged and rewrites around them before you post.', value: '$3,000–5,000/mo' },
    { icon: <BarChart3 size={20} />, title: 'AI A/B Testing & Auto-Optimization', desc: 'Dispatch splits your email audience, tests subject lines and copy variants, picks winners, and swaps them in — while you sleep. The same thing a $8,000/month agency does, except it happens automatically.', value: '$2,000/mo' },
    { icon: <BookOpen size={20} />, title: 'Your Book, Published on Amazon', desc: 'The intake agent interviews you across 7–10 sessions. The book-builder creates a full KDP-ready manuscript in your voice, on your niche. Live on Amazon within 60 days. You walk away a published author.', value: '$7,000–15,000' },
    { icon: <Zap size={20} />, title: '90-Day Content Runway', desc: '30 TikTok scripts. 30 email teachings. 15 YouTube outlines. A complete 30-day challenge sequence. Your social media calendar for 90 days — done before Day 1. All in your voice. Ready to record and send.', value: '$4,500' },
    { icon: <Users size={20} />, title: 'Client Intake Assessment Quiz', desc: 'Not just lead capture. A scored assessment that profiles your client\'s health situation, recommends the right program, and sends personalized results. Clinical-grade feel. Your clients think you have a 10-person team.', value: '$3,000–5,000' },
    { icon: <Smartphone size={20} />, title: 'Social Media Intelligence', desc: 'Dispatch scans your TikTok and YouTube, identifies top performers, reverse-engineers why they worked, and generates new content in the same pattern. Watches your niche for trending topics before your competitors see them.', value: '$2,500/mo' },
    { icon: <Shield size={20} />, title: '$17 Digital Product in Your Funnel', desc: 'Your quiz immediately upsells a $17 digital product tailored to your niche — a starter guide, protocol, or toolkit. Wired into Stripe. Converts quiz-takers into buyers from Day 1. Your first revenue while they\'re still on the page.', value: '$2,000–3,000' },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 860 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>What gets installed</span>
          <h2 className="display-m" style={{ margin: '0 0 0.75rem' }}>
            Everything. <em className="ital-display" style={{ color: 'var(--clay)' }}>Wired.</em>
          </h2>
          <p className="lede" style={{ margin: '0 0 2.5rem' }}>
            Not templates. Not tutorials. A functioning business — installed, connected, and generating content before you hang up the setup call.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gap: '0' }}>
          {items.map((item, i) => (
            <motion.div key={i} {...stagger(i)} style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr auto', gap: '1rem', alignItems: 'start', padding: '1.25rem 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ color: 'var(--sage)', paddingTop: '0.15rem' }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{item.desc}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap', paddingTop: '0.2rem' }}>{item.value}</div>
            </motion.div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', fontWeight: 500, color: 'var(--ink)' }}>Total replacement value</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, color: 'var(--clay)', letterSpacing: '-0.02em' }}>$85,000+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   REPLACE — What this replaces (cost comparison)
   ================================================================ */
function ReplaceSection() {
  const replacements = [
    ['Web developer', '$5,000–15,000 one-time + $150/hr changes', '"Hey Dispatch, change my headline."'],
    ['Social media manager', '$2,000–5,000/month', '"Write me three scripts for this week."'],
    ['Copywriter', '$3,000–5,000 per project', '"Draft my launch sequence."'],
    ['Email marketing specialist', '$1,500–3,000/month', 'An AI that A/B tests while you sleep.'],
    ['Marketing strategist', '$5,000–10,000/month retainer', '"What should I focus on this week?"'],
    ['ClickFunnels + Mailchimp + Hostinger + Canva + VA', '$700–2,400/month in software & people', 'One setup. One conversation.'],
  ];

  return (
    <section style={{ background: 'var(--paper-warm)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 860 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>The math</span>
          <h2 className="display-m" style={{ margin: '0 0 0.5rem' }}>
            Replace <em className="ital-display" style={{ color: 'var(--clay)' }}>$143,000/year</em>
          </h2>
          <p className="lede" style={{ margin: '0 0 2.5rem' }}>in staff and software with one conversation.</p>
        </motion.div>

        <div style={{ display: 'grid', gap: '0' }}>
          {replacements.map(([role, cost, replacement], i) => (
            <motion.div key={i} {...stagger(i)} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', padding: '1.25rem 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{role}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textDecoration: 'line-through' }}>{cost}</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--sage)', fontStyle: 'italic' }}>→ {replacement}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   TIERS — Three pricing options
   ================================================================ */
function TierSection() {
  return (
    <section id="tiers" style={{ padding: 'clamp(3.5rem, 7vw, 6rem) 0' }}>
      <div className="shell" style={{ maxWidth: 1060 }}>
        <motion.div {...fade} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem', justifyContent: 'center' }}>Choose your tier</span>
          <h2 className="display-m" style={{ margin: '0 0 0.75rem' }}>
            Three paths. <em className="ital-display" style={{ color: 'var(--clay)' }}>One destination.</em>
          </h2>
          <p className="lede" style={{ margin: '0 auto', textAlign: 'center' }}>
            A business that works while you sleep.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* STARTER */}
          <motion.div {...stagger(0)} style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(1.5rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>Starter Kit</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '0.5rem' }}>$2,997</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              The tech wired. You bring the content.
            </p>
            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                'Custom quiz funnel website on Vercel',
                'Email automation (Resend) wired',
                'Stripe checkout — tiered pricing configured',
                '$17 digital product upsell in your funnel',
                'Dispatch AI command center configured',
                'Brand profile intake session',
                'GitHub + Vercel deploy pipeline',
                'Dedicated Gmail + integrations',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'start', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  <Check size={16} style={{ color: 'var(--sage)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-soft)' }}>{item}</span>
                </div>
              ))}
            </div>
            <a href={STARTER_LINK} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.95rem 1.5rem', borderRadius: 12, border: '1px solid var(--ink)', background: 'transparent', color: 'var(--ink)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', marginTop: 'auto', transition: 'all 0.3s' }}>
              Apply for Starter <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* PRACTICE LAUNCHER — featured */}
          <motion.div {...stagger(1)} style={{ background: 'var(--sage-deep)', color: 'var(--cream)', borderRadius: 20, padding: 'clamp(1.5rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column', position: 'relative', border: '2px solid var(--clay)' }}>
            <div style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--clay)', color: 'var(--cream)', padding: '0.3rem 1rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft)', marginBottom: '0.75rem', marginTop: '0.5rem' }}>The Practice Launcher</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>$9,997</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(251,248,241,0.45)', textDecoration: 'line-through' }}>$14,997</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--clay-soft)', marginBottom: '1.25rem' }}>Founding cohort price — 10 spots total</p>

            <p style={{ fontSize: '0.88rem', color: 'rgba(251,248,241,0.7)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Everything installed. Book published. Content loaded. First client guaranteed.
            </p>

            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                'Everything in Starter Kit',
                'Your book published on Amazon KDP',
                '90-day content runway (30 scripts, 30 emails, 15 YT outlines)',
                'Full 30-day challenge email sequence',
                'Client intake assessment quiz',
                'AI A/B testing & auto-optimization on all emails',
                'Social media intelligence & trend scanning',
                '"First Client" guarantee — 60 days or I keep working',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'start', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  <Check size={16} style={{ color: 'var(--clay-soft)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(251,248,241,0.85)' }}>{item}</span>
                </div>
              ))}
            </div>

            <a href={LAUNCHER_LINK} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: 12, background: 'var(--clay)', color: 'var(--cream)', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', marginTop: 'auto', transition: 'all 0.3s' }}>
              Apply for Practice Launcher <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* REVENUE SHARE */}
          <motion.div {...stagger(2)} style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(1.5rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>Revenue Share</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '0.25rem' }}>$4,997</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>+ 10% of gross revenue for 12 months</p>

            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Same full install. Lower upfront. I only win big if you win big. Aligned incentives.
            </p>

            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                'Everything in Practice Launcher',
                'Lower upfront investment',
                'Joel has skin in the game — 10% rev share',
                'Monthly revenue check-ins for 12 months',
                'Same "First Client" guarantee',
                'Revenue share caps at $15,000 total',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'start', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  <Check size={16} style={{ color: 'var(--sage)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-soft)' }}>{item}</span>
                </div>
              ))}
            </div>

            <a href={REVENUE_LINK} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.95rem 1.5rem', borderRadius: 12, border: '1px solid var(--ink)', background: 'transparent', color: 'var(--ink)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none', marginTop: 'auto', transition: 'all 0.3s' }}>
              Apply for Revenue Share <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>

        {/* Spanish upsell callout */}
        <motion.div {...fade} style={{ marginTop: '2rem', background: 'var(--paper-warm)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)', display: 'flex', gap: '1.25rem', alignItems: 'start', flexWrap: 'wrap' }}>
          <Globe size={24} style={{ color: 'var(--clay)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>Add-on: Spanish Content Expansion — $2,997</div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>
              Double your addressable market overnight. Full bilingual TikTok and YouTube pipeline — Spanish voiceover, translated scripts, localized SEO, separate channel strategy. Available with any tier.
            </p>
          </div>
        </motion.div>

        {/* Concierge callout */}
        <motion.div {...fade} style={{ marginTop: '1rem', background: 'var(--paper-warm)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)', display: 'flex', gap: '1.25rem', alignItems: 'start', flexWrap: 'wrap' }}>
          <Clock size={24} style={{ color: 'var(--sage)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>Optional: Concierge Retainer — $997/month</div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>
              Quarterly system tune-ups. New skill updates as the AI evolves. Launch support for each new offer you create. Joel personally reviews your system and optimizes.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   GUARANTEE
   ================================================================ */
function GuaranteeSection() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700 }}>
        <motion.div {...fade} style={{ textAlign: 'center' }}>
          <Shield size={40} style={{ color: 'var(--clay-soft)', marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', fontWeight: 400, lineHeight: 1.12, letterSpacing: '-0.02em', margin: '0 0 1.5rem', fontVariationSettings: '"SOFT" 60, "opsz" 72' }}>
            The "First Client" <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)' }}>Guarantee.</em>
          </h2>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'rgba(251,248,241,0.8)', marginBottom: '1.25rem' }}>
            Your first paying client within 60 days of launch — or I personally work with you until it happens. No time limit. No extra charge. I don't stop until your system produces revenue.
          </p>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'rgba(251,248,241,0.8)', marginBottom: '1.5rem' }}>
            I take all the risk because I've already done this — on my own business, with my own money. The system is running right now. I'm not teaching theory. I'm installing a proven machine.
          </p>

          <div style={{ background: 'rgba(251,248,241,0.06)', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid rgba(251,248,241,0.08)', display: 'inline-block' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 'var(--step-0)', color: 'var(--clay-soft)', margin: 0, lineHeight: 1.5, fontVariationSettings: '"SOFT" 100' }}>
              "His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things." — Matthew 25:21
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   FAQ
   ================================================================ */
function FAQSection() {
  const [open, setOpen] = useState(null);

  const faqs = [
    {
      q: "I'm not technical. Can I really do this?",
      a: "You don't touch code. Ever. I build everything during setup. After that, you talk to Dispatch in plain English — 'change this headline,' 'write me an email,' 'what should I post today.' If you can send a text message, you can run this system."
    },
    {
      q: "How is this different from Kajabi or ClickFunnels?",
      a: "Kajabi gives you a platform and says 'figure it out.' ClickFunnels gives you templates and says 'drag and drop.' Neither of them can hear you when you talk. This system is a living team — it writes your content, builds your pages, sends your emails, and optimizes based on real data. You don't log into a dashboard. You have a conversation."
    },
    {
      q: "What if the AI doesn't sound like me?",
      a: "The intake agent spends the first session building your complete brand profile — your voice, your phrases, your philosophy, your tone. Every piece of content it generates pulls from that profile. After 30 days of feedback, it sounds more like you than a hired copywriter ever could."
    },
    {
      q: "What happens after the setup? Am I on my own?",
      a: "Dispatch is yours permanently. It doesn't expire. The AI command center, the content engine, the email system — they keep running. The optional $997/month concierge retainer gets you quarterly tune-ups and launch support, but it's not required. The system works without it."
    },
    {
      q: "Why only 5 coaches per month?",
      a: "Each setup requires my personal attention during the intake call, brand profile build, and first-launch review. Five is the number where quality stays high. When the slots fill, the page closes until next month. That's not a marketing line — it's math."
    },
    {
      q: "What's the revenue share option?",
      a: "Same full installation as the Practice Launcher — lower upfront ($4,997 instead of $9,997), plus 10% of your gross revenue for 12 months, capped at $15,000 total. I only win big if you win big. It's for coaches who believe in the system but want to ease the upfront investment."
    },
    {
      q: "Do I need my own content already?",
      a: "No. The 90-Day Content Runway bonus pre-generates 30 TikTok scripts, 30 email teachings, 15 YouTube outlines, and your full challenge sequence — all in your voice — before Day 1. You launch with three months of content already in the chamber."
    },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700 }}>
        <motion.div {...fade}>
          <h2 className="display-s" style={{ margin: '0 0 2rem' }}>Questions.</h2>
        </motion.div>

        <div style={{ display: 'grid', gap: 0 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i} {...stagger(i)} style={{ borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit', color: 'var(--ink)' }}>
                <span style={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.4 }}>{faq.q}</span>
                <ChevronRight size={18} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform 0.3s', transform: open === i ? 'rotate(90deg)' : 'rotate(0deg)' }} />
              </button>
              {open === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ paddingBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)' }} />
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   FINAL CTA
   ================================================================ */
function FinalCTA() {
  return (
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(3.5rem, 7vw, 6rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700, textAlign: 'center' }}>
        <motion.div {...fade}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 1.25rem', fontVariationSettings: '"SOFT" 50, "opsz" 96' }}>
            The version of you who has a <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)', fontVariationSettings: '"SOFT" 100' }}>waitlist</em> doesn't know Mailchimp.
          </h2>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.65, color: 'rgba(247,243,236,0.7)', margin: '0 auto 2rem', maxWidth: '48ch' }}>
            She has a team. It just happens to fit inside one conversation. Five slots this month. When they fill, this page closes.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a href="#tiers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1.05rem 2rem', borderRadius: 12, background: 'var(--clay)', color: 'var(--cream)', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>
              Choose your tier <ArrowRight size={16} />
            </a>
          </div>

          <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(247,243,236,0.4)', lineHeight: 1.6, margin: 0, fontVariationSettings: '"SOFT" 100' }}>
            Genetics writes the recipe. Lifestyle bakes the cake. Be your own doctor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */
function PageFooter() {
  return (
    <footer style={{ background: 'var(--ink)', borderTop: '1px solid rgba(247,243,236,0.08)', padding: '2rem 0' }}>
      <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'rgba(247,243,236,0.4)', fontSize: '0.78rem' }}>
        <span>© {new Date().getFullYear()} BraveWorks RN · Joel Polley, RN · Practice Launcher</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="https://tiktok.com/@braveworksrn" style={{ color: 'inherit', textDecoration: 'none' }}>TikTok</a>
          <a href="https://bpquiz.com" style={{ color: 'inherit', textDecoration: 'none' }}>BPQuiz.com</a>
        </div>
      </div>
    </footer>
  );
}
