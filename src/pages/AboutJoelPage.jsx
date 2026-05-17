// src/pages/AboutJoelPage.jsx
//
// Author authority page for "The Blood Pressure Guy" SEO push.
// E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is
// the single biggest ranking signal for medical content. This page
// concentrates every credential Joel has so Google can attribute
// authorship correctly across every BraveWorks article.
//
// Reachable at /about/joel — added to App.jsx route table 2026-05-17.
// Linked from every blog post byline and from sitemap.xml.
//
// Schema: Person + MedicalBusiness + WebPage with about/mainEntity
// pointing to Joel. This is what gets cited in Google AI Overviews
// when answering "who is the blood pressure guy" / "is Joel Polley a
// real RN" / etc.

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Stethoscope, Heart, Leaf } from 'lucide-react';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://bpquiz.com/about/joel#joel',
      name: 'Joel Polley',
      alternateName: 'The Blood Pressure Guy',
      jobTitle: 'Registered Nurse · Naturopathic Practitioner',
      description:
        'Joel Polley, RN, is an ICU and emergency-medicine nurse of 20 years who turned to naturopathic medicine after seeing the limits of pharmaceutical-only blood-pressure care. He is the founder of BraveWorks RN and the creator of the BP Triangle method.',
      url: 'https://bpquiz.com/about/joel',
      image: 'https://bpquiz.com/headshot.jpg',
      sameAs: [
        'https://www.tiktok.com/@braveworksrn',
        'https://bpquiz.com',
      ],
      knowsAbout: [
        'Hypertension',
        'Natural remedies for high blood pressure',
        'Cortisol and blood pressure',
        'Hydration and blood pressure',
        'Blood sugar and cardiovascular health',
        'Magnesium and blood pressure',
        'Hibiscus and ACE inhibition',
        'Vagus nerve and autonomic regulation',
      ],
      hasCredential: [
        {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'license',
          name: 'Registered Nurse (RN)',
        },
      ],
      worksFor: {
        '@type': 'Organization',
        name: 'BraveWorks RN',
        url: 'https://bpquiz.com',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://bpquiz.com/about/joel',
      url: 'https://bpquiz.com/about/joel',
      name: 'About Joel Polley, RN — The Blood Pressure Guy',
      description:
        'Meet Joel Polley, RN — 20 years in ICU and emergency medicine, now teaching natural blood-pressure protocols through BraveWorks RN. Author of every article on bpquiz.com.',
      mainEntity: { '@id': 'https://bpquiz.com/about/joel#joel' },
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        url: 'https://bpquiz.com',
        name: 'BraveWorks RN — Blood Pressure Natural Remedies',
      },
    },
    {
      '@type': 'MedicalBusiness',
      name: 'BraveWorks RN',
      url: 'https://bpquiz.com',
      founder: { '@id': 'https://bpquiz.com/about/joel#joel' },
      medicalSpecialty: 'Cardiovascular',
      description:
        'BraveWorks RN teaches natural blood-pressure protocols through a 4-mechanism framework: vascular health, cortisol regulation, blood-sugar balance, and inflammation control.',
    },
  ],
};

const CREDS = [
  { icon: Stethoscope, title: '20 Years ICU + ER', body: 'Cardiovascular crash carts, hypertensive emergencies, pulmonary edema, post-MI care. The places blood pressure stops being theoretical.' },
  { icon: Heart, title: 'Registered Nurse', body: 'Licensed RN with clinical experience across critical care, emergency medicine, pediatrics, and primary care.' },
  { icon: Leaf, title: 'Naturopathic Practitioner', body: 'Trained in the herbal, mineral, and lifestyle protocols that the pharmaceutical model leaves out. Joining clinical rigor to root-cause medicine.' },
];

const PILLARS = [
  {
    name: 'Vascular Pressure',
    body: 'Endothelial damage, nitric oxide deficiency, mineral depletion. The mechanical corner — what your vessels are physically doing.',
  },
  {
    name: 'Cortisol Pressure',
    body: 'Stress, sleep, autonomic dysregulation. The fastest-moving corner and the one most doctors won\'t mention.',
  },
  {
    name: 'Blood Sugar Pressure',
    body: 'Insulin resistance, glucose-driven vessel damage, sodium retention. The metabolic corner — your A1c, fasting glucose, and fasting insulin all live here.',
  },
];

export default function AboutJoelPage() {
  return (
    <main style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* Hero */}
      <section className="section surface-paper" style={{ paddingTop: 'clamp(2.5rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN — The Blood Pressure Guy — 20 years ICU and emergency medicine"
                width="160"
                height="160"
                style={{
                  width: 'clamp(120px, 18vw, 160px)',
                  height: 'clamp(120px, 18vw, 160px)',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--paper-light)',
                  boxShadow: '0 10px 30px rgba(44,42,38,0.15)',
                  marginBottom: '1.5rem',
                }}
              />
            </picture>
            <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>About</span>
            <h1 className="display-l" style={{ margin: '1rem auto 0.5rem', lineHeight: 1.05, maxWidth: '20ch' }}>
              I'm Joel. The Blood Pressure Guy.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 auto', lineHeight: 1.65 }}>
              Registered Nurse · 20 years in ICU and ER · Naturopathic practitioner · Founder of BraveWorks RN
            </p>
          </motion.div>
        </div>
      </section>

      {/* Credentials grid */}
      <section className="section" style={{ background: 'var(--paper-light)', paddingTop: 'clamp(2rem, 4vw, 3rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <div className="shell">
          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {CREDS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} style={{ background: 'var(--paper)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <Icon size={28} color="var(--sage-deep)" strokeWidth={1.5} />
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', margin: '0.5rem 0 0.4rem', color: 'var(--ink)' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section surface-paper" style={{ paddingTop: 'clamp(2.5rem, 5vw, 4rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div className="shell-tight">
          <span className="kicker kicker-dot">My story</span>
          <h2 className="display-m" style={{ margin: '1rem 0 1.5rem', lineHeight: 1.1 }}>
            Twenty years on the floor taught me what the pill can't do.
          </h2>
          <div style={{ fontSize: '1.02rem', lineHeight: 1.75, color: 'var(--ink)' }}>
            <p style={{ margin: '0 0 1.25rem' }}>
              I started in the ICU. Stage 2 hypertensive emergencies. Patients on three medications who still couldn't get their numbers down. The cardiology team would add a fourth pill, then a fifth, then start talking about resistant hypertension and renal denervation.
            </p>
            <p style={{ margin: '0 0 1.25rem' }}>
              What nobody in those rooms talked about was that the pills were never designed to fix anything. They were designed to manage a number. The number is high because something upstream is broken. The pill doesn't touch the upstream thing.
            </p>
            <p style={{ margin: '0 0 1.25rem' }}>
              I spent the next decade in emergency medicine watching the same pattern. The same patients coming back with the same numbers, just on more pills than the last time. By year 15 I'd seen enough that I had to stop and ask a different question. Not "what pill do they need" — but "what's actually driving this?"
            </p>
            <p style={{ margin: '0 0 1.25rem' }}>
              That question is what BraveWorks is. The protocols on this site are what I learned by walking out of the pharmaceutical-only frame and into the herbs, the minerals, the foods, the sleep architecture, the breathing patterns, the gratitude practice, and the lab interpretation that actually move the upstream drivers of high blood pressure.
            </p>
            <p style={{ margin: '0 0 1.25rem', fontStyle: 'italic', color: 'var(--ink-soft)', borderLeft: '3px solid var(--sage-deep)', paddingLeft: '1rem' }}>
              Pills manage output. Protocol fixes input. That's the whole sentence.
            </p>
            <p style={{ margin: 0 }}>
              If you've been on BP medication for years and your numbers aren't where they should be, you don't have a heart problem. You have an input problem with a heart-shaped symptom. The articles on this site, the BP Reset Kit, and the coaching program exist for one reason — to give you the input fixes that the pharmaceutical model never offered you.
            </p>
          </div>
        </div>
      </section>

      {/* The BP Triangle */}
      <section className="section" style={{ background: 'var(--sage-soft)', paddingTop: 'clamp(2.5rem, 5vw, 4rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div className="shell-tight">
          <span className="kicker kicker-dot" style={{ color: 'var(--sage-deep)' }}>The framework</span>
          <h2 className="display-m" style={{ margin: '1rem 0 0.75rem', lineHeight: 1.1, color: 'var(--ink)' }}>
            The BP Triangle
          </h2>
          <p style={{ fontSize: '1.02rem', color: 'var(--ink-soft)', maxWidth: '60ch', margin: '0 0 2rem', lineHeight: 1.65 }}>
            Every elevated blood-pressure reading is driven by at least one of three corners. Identify your loudest corner, move that input, and the numbers move with it. This is the framework underneath every article, the BP Reset Kit, and the Sprint coaching program.
          </p>
          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {PILLARS.map((p, i) => (
              <div key={p.name} style={{ background: 'var(--paper-light)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>Corner {i + 1}</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: '0 0 0.6rem', color: 'var(--ink)' }}>{p.name}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/quiz" className="btn btn-ink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Find your corner (free, 3 minutes) <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Read the journal */}
      <section className="section surface-paper" style={{ paddingTop: 'clamp(2.5rem, 5vw, 4rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div className="shell-tight">
          <span className="kicker kicker-dot">Where to start</span>
          <h2 className="display-m" style={{ margin: '1rem 0 1.5rem', lineHeight: 1.1 }}>
            Read the journal.
          </h2>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-soft)', margin: '0 0 1.75rem', maxWidth: '60ch' }}>
            Every article is written by me, an RN with 20 years on the floor, in plain language with the clinical citations. Pick the one that lines up with your situation and start there.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {[
              { slug: 'cortisol-and-blood-pressure', title: 'Cortisol and Blood Pressure — the stress hormone driving your numbers' },
              { slug: 'why-bp-is-still-high', title: "Why Your Blood Pressure Is Still High (and what your pill doesn't touch)" },
              { slug: '30-day-challenge-starts-may-1', title: 'The 30-Day Blood Pressure Reset Challenge' },
            ].map((a) => (
              <li key={a.slug}>
                <Link to={`/blog/${a.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--paper-light)', borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)', gap: '1rem' }}>
                  <span style={{ fontSize: '0.98rem', lineHeight: 1.45 }}>{a.title}</span>
                  <ArrowRight size={18} color="var(--sage-deep)" style={{ flexShrink: 0 }} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Work with me */}
      <section className="section" style={{ background: 'var(--paper-light)', paddingTop: 'clamp(2.5rem, 5vw, 4rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <div className="shell-tight">
          <span className="kicker kicker-dot">Work with me</span>
          <h2 className="display-m" style={{ margin: '1rem 0 1.5rem', lineHeight: 1.1 }}>
            Three ways in.
          </h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <Link to="/quiz" style={{ display: 'block', padding: '1.5rem', background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>Free · 3 minutes</div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: '0 0 0.5rem' }}>The BP Triangle Quiz</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>Find which corner of the Triangle is driving your numbers. Free quiz, no signup wall.</p>
            </Link>
            <a href="/" style={{ display: 'block', padding: '1.5rem', background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>$17 · own it forever</div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: '0 0 0.5rem' }}>The BP Reset Kit</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>Full 10-day protocol, herb deep dive, recipe library, tracker. 180+ pages of clinical education.</p>
            </a>
            <Link to="/coaching" style={{ display: 'block', padding: '1.5rem', background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>Application · founding cohort</div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: '0 0 0.5rem' }}>The 90-Day Sprint</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>Weekly 1:1 with me. Daily WhatsApp office hours. Personalized protocol. 12-week intensive.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section style={{ padding: '2rem 1.5rem', background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--muted)', maxWidth: '64ch', margin: '0 auto' }}>
            All content on this site is educational only and not a substitute for medical advice. Always work with your physician before making changes to medications or treatment plans. Joel Polley, RN, is a licensed registered nurse and naturopathic practitioner; he is not your prescribing physician unless you have entered into a direct clinical relationship.
          </p>
        </div>
      </section>
    </main>
  );
}
