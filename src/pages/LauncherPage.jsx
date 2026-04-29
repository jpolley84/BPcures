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
      <EpiphanyBridge />
      <ProblemSection />
      <ImagineSection />
      <WhatYouGet />
      <ReplaceSection />
      <NotForYou />
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
            Your entire health coaching business — installed in one conversation. By the ICU nurse who built it for himself first, and believes your clients are waiting for you to show up.
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
   EPIPHANY BRIDGE — Joel's origin story (Brunson + Myron)
   ================================================================ */
function EpiphanyBridge() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', borderBottom: '1px solid var(--line)' }}>
      <div className="shell" style={{ maxWidth: 720 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Why I built this</span>
          <h2 className="display-s" style={{ margin: '0 0 1.5rem' }}>
            20 years in the ICU taught me one thing.
          </h2>

          <div style={{ fontSize: 'var(--step-0)', lineHeight: 1.75, color: 'var(--ink-soft)', display: 'grid', gap: '1.25rem' }}>
            <p style={{ margin: 0 }}>
              I spent two decades watching the same story repeat: patient comes in, blood pressure through the roof, doctor adjusts the meds, patient goes home, nothing changes. I knew — because I'd seen it thousands of times — that the answer wasn't another prescription. It was what they ate, how they moved, what they believed about their own body.
            </p>
            <p style={{ margin: 0 }}>
              So I left. Built BraveWorks RN. Started making TikToks about herbs and blood pressure from my kitchen. Within months, the emails flooded in — nurses, naturopaths, health coaches — all saying the same thing: <em style={{ color: 'var(--clay)' }}>"I know what you know. I just can't get anyone to listen."</em>
            </p>
            <p style={{ margin: 0 }}>
              They didn't have a knowledge problem. They had a delivery problem. So I built them a delivery system — the same one running BraveWorks right now. The quiz funnel, the email engine, the AI content team, the Stripe checkout, all of it. And I realized: if I can install this once, I can install it again.
            </p>
            <p style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', color: 'var(--ink)', fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              That's what this page is. Not a course. Not a template. A <strong style={{ color: 'var(--clay)' }}>functioning business</strong> — installed, wired, and generating content before you hang up the setup call.
            </p>
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
  /* CORE DELIVERABLES */
  const core = [
    { icon: <Globe size={20} />, title: 'A website that converts strangers into subscribers while you sleep', desc: 'Your brand. Your niche quiz. Mobile-optimized, sub-2-second load. Free hosting forever. When you want something changed, you say it out loud and it\'s live in 90 seconds. No Wix. No ClickFunnels. No developer invoices.', value: '$12,000' },
    { icon: <Mail size={20} />, title: 'A marketing team that writes, sends, and improves your emails without you logging in', desc: 'Welcome sequences on signup. Broadcast campaigns. The AI monitors open rates and rewrites underperforming copy automatically. No dashboard to learn. No drag-and-drop editor to fight with.', value: '$4,000' },
    { icon: <Layers size={20} />, title: 'A checkout system that collects money while you\'re with clients', desc: 'Tiered pricing, payment links, pre-launch pricing, seat caps, order bumps. All configured. All live. Stripe handles the money — you handle the healing.', value: '$2,500' },
    { icon: <MessageSquare size={20} />, title: 'A 24/7 team that builds what you describe — in plain English', desc: 'Claude Opus 4 powering every agent. You open a conversation and say what you need — content, emails, site changes, analytics, strategy. It learns your voice. It gets better the more you use it. Like a $10K/month marketing director who never sleeps.', value: '$8,000/mo' },
    { icon: <PenTool size={20} />, title: 'Content that sounds like you — written faster than you can think it', desc: 'TikTok scripts, YouTube scripts, email copy, social captions, hashtags — all in YOUR voice from your brand profile. The AI knows which health claims get flagged and rewrites around them before you post.', value: '$4,000/mo' },
  ];

  /* BONUSES — Hormozi stack effect */
  const bonuses = [
    { icon: <BookOpen size={20} />, title: 'BONUS: Your book, published on Amazon', desc: 'The intake agent interviews you across 7–10 sessions. A full KDP-ready manuscript in your voice, on your niche. Live on Amazon within 60 days. You walk away a published author with a lead magnet that never expires.', value: '$11,000' },
    { icon: <Zap size={20} />, title: 'BONUS: 90-day content runway — done before Day 1', desc: '30 TikTok scripts. 30 email teachings. 15 YouTube outlines. A complete 30-day challenge sequence. Three months of content loaded and ready to fire. All in your voice.', value: '$4,500' },
    { icon: <Users size={20} />, title: 'BONUS: Client intake assessment that makes you look like a 10-person clinic', desc: 'A scored assessment that profiles your client\'s health situation, recommends the right program, and sends personalized results. Clinical-grade feel. Automated.', value: '$4,000' },
    { icon: <BarChart3 size={20} />, title: 'BONUS: AI A/B testing that optimizes while you sleep', desc: 'Dispatch splits your audience, tests subject lines and copy variants, picks winners, and swaps them in automatically. The same thing a $8,000/month agency does.', value: '$2,000/mo' },
    { icon: <Smartphone size={20} />, title: 'BONUS: Social media intelligence that finds trends before your competitors', desc: 'Scans your TikTok and YouTube, identifies top performers, reverse-engineers why they worked, and generates new content in the same pattern.', value: '$2,500/mo' },
    { icon: <Shield size={20} />, title: 'BONUS: $17 digital product already in your funnel', desc: 'Your quiz immediately upsells a $17 digital product tailored to your niche. Wired into Stripe. Converts quiz-takers into buyers from Day 1. Your first revenue while they\'re still on the page.', value: '$2,500' },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 860 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>What gets installed</span>
          <h2 className="display-m" style={{ margin: '0 0 0.75rem' }}>
            11 systems. One setup call. <em className="ital-display" style={{ color: 'var(--clay)' }}>Live by Friday.</em>
          </h2>
          <p className="lede" style={{ margin: '0 0 2.5rem' }}>
            Not templates. Not tutorials. A functioning business — installed, connected, and generating content before you hang up the call.
          </p>
        </motion.div>

        {/* CORE */}
        <div style={{ display: 'grid', gap: '0' }}>
          {core.map((item, i) => (
            <motion.div key={i} {...stagger(i)} style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr auto', gap: '1rem', alignItems: 'start', padding: '1.25rem 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ color: 'var(--sage)', paddingTop: '0.15rem' }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{item.desc}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap', paddingTop: '0.2rem' }}>{item.value}</div>
            </motion.div>
          ))}
        </div>

        {/* BONUS STACK — Hormozi progressive reveal */}
        <motion.div {...fade} style={{ marginTop: '2.5rem' }}>
          <div style={{ background: 'var(--paper-warm)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', border: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', fontWeight: 400, color: 'var(--ink)', margin: '0 0 0.25rem', fontVariationSettings: '"SOFT" 60' }}>
              But I'm not stopping there.
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Every founding cohort member also gets these — included at no extra charge:
            </p>

            <div style={{ display: 'grid', gap: '0' }}>
              {bonuses.map((item, i) => (
                <motion.div key={i} {...stagger(i)} style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr auto', gap: '1rem', alignItems: 'start', padding: '1.25rem 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ color: 'var(--clay)', paddingTop: '0.15rem' }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{item.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap', paddingTop: '0.2rem' }}>{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* TOTAL */}
        <div style={{ borderTop: '2px solid var(--ink)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', fontWeight: 500, color: 'var(--ink)' }}>Total replacement value</span>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, color: 'var(--clay)', letterSpacing: '-0.02em' }}>$143,000+</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
            Based on hiring a developer, copywriter, social media manager, email strategist, marketing director, and book ghostwriter at market rates.
          </p>
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
   NOT FOR YOU — Hormozi disqualification + Myron conviction
   ================================================================ */
function NotForYou() {
  return (
    <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700 }}>
        <motion.div {...fade}>
          <h2 className="display-s" style={{ margin: '0 0 1.5rem' }}>
            This is <em className="ital-display" style={{ color: 'var(--clay)' }}>not</em> for everyone.
          </h2>

          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              "You haven't finished your certification yet. Finish that first — this will be here.",
              "You're looking for a $99 course with worksheets. This is a done-for-you installation, not an education product.",
              "You're not willing to show up and record content. The AI writes it — you still have to be the face.",
              "You want to 'think about it' for six months. The founding cohort has 10 spots. They won't wait.",
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'start', fontSize: '0.92rem', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--clay)', fontWeight: 700, fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>✕</span>
                <span style={{ color: 'var(--ink-soft)' }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--sage-deep)', borderRadius: 16, padding: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--cream)' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.5, margin: 0, fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              I believe every health coach who has the knowledge to help people deserves a system that matches their calling. I built this because I watched too many nurses and practitioners give up — not because they couldn't help people, but because they couldn't figure out Mailchimp. <strong style={{ color: 'var(--clay-soft)' }}>That ends here.</strong>
            </p>
          </div>
        </motion.div>
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
            Pick the math. <em className="ital-display" style={{ color: 'var(--clay)' }}>The machine is the same.</em>
          </h2>
          <p className="lede" style={{ margin: '0 auto', textAlign: 'center' }}>
            Founding cohort pricing — I'm building my first 10 success stories. When I have them, this goes to full price.
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
              Same full install. Lower upfront. I have skin in the game — I only profit if your practice does. Aligned incentives.
            </p>

            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                'Everything in Practice Launcher',
                'Lower upfront investment',
                'Joel has skin in the game — 10% rev share',
                'Monthly revenue check-ins for 12 months',
                'Same "First Client" guarantee',
                'Revenue share capped at a fair ceiling — details on call',
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
            Your first paying client — at least $500 in collected revenue — within 60 days of launch. If it doesn't happen, I personally work with you until it does. No time limit. No extra charge. And if after 90 days you still haven't landed that first client, I refund your setup fee in full and you keep everything installed.
          </p>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'rgba(251,248,241,0.8)', marginBottom: '1.5rem' }}>
            I take all the risk because I've already done this — on my own business, with my own money. BraveWorks RN is running this exact system right now. I'm not teaching theory. I'm installing a machine I built and use every single day.
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
      a: "Same full installation as the Practice Launcher — lower upfront ($4,997 instead of $9,997), plus 10% of your gross revenue for 12 months with a fair cap. I only profit if your practice does. It's for coaches who believe in the system but want to ease the upfront investment. We cover the specifics on the application call."
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

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.65, color: 'rgba(247,243,236,0.7)', margin: '0 auto 1.5rem', maxWidth: '48ch' }}>
            She has a team. It just happens to fit inside one conversation.
          </p>

          {/* Brunson stack recap */}
          <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'rgba(247,243,236,0.5)', margin: '0 auto 2rem', maxWidth: '52ch' }}>
            Remember — you're getting the quiz funnel, the email engine, the AI command center, tiered checkout, a content engine in your voice, your book on Amazon, 90 days of pre-built content, a client intake assessment, A/B testing, social intelligence, and a $17 product already in your funnel. Over $143,000 in replacement value. Starting at $2,997.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a href="#tiers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1.05rem 2rem', borderRadius: 12, background: 'var(--clay)', color: 'var(--cream)', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>
              Choose your tier <ArrowRight size={16} />
            </a>
          </div>

          {/* Kennedy P.S. */}
          <div style={{ textAlign: 'left', background: 'rgba(247,243,236,0.04)', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid rgba(247,243,236,0.08)', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(247,243,236,0.6)', margin: 0 }}>
              <strong style={{ color: 'rgba(247,243,236,0.8)' }}>P.S.</strong> — The founding cohort has 10 total spots. When they fill, the price goes to $14,997 and the "First Client" guarantee changes. If you're reading this, a slot is still open. <a href="#tiers" style={{ color: 'var(--clay-soft)', textDecoration: 'underline' }}>Claim yours now.</a>
            </p>
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
