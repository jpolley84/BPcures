// /downloads — Universal post-purchase library page.
//
// Every customer lands here at the end of their checkout chain. We
// show ALL available BraveWorks downloads (BP Reset Kit + new BP Cures
// book + Cookbook + Cortisol + Blood Sugar + Bonus Boomers book).
//
// 2026-05-20 rewrite: the prior version referenced 4 PDF filenames
// that don't exist in public/downloads/ (master-bp-document.pdf,
// top-10-herbs.pdf, 10-day-reset-challenge.pdf, white-coat-syndrome-
// guide.pdf). All links 404'd. New version mirrors the actual files
// on disk + adds the new bp-cures-10-day-reset.pdf book.
//
// Files are public — security model is "URL-knowledge gate" (same as
// before). The customer reaches /downloads only via post-purchase
// redirects and the email confirmation link. We don't authenticate
// downloads because the existing pattern doesn't either.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ArrowLeft, BookOpen } from 'lucide-react';

const groups = [
  {
    title: 'Blood Pressure',
    desc: 'Every BP protocol Joel publishes — start with the Day 1 quick win and the master Reset Kit.',
    files: [
      { name: 'BP Reset Day 1 + Full Challenge', desc: 'Day-by-day BP protocol with checklists. Start here.', file: 'bp-reset-day1-and-beyond.pdf' },
      { name: 'BP Reset Kit (8-PDF zip)', desc: 'The full clinical system: hypertension guide, supplement protocol, meal plan, BP tracker, doctor templates.', file: 'bp-reset-kit.zip' },
      { name: 'BP Reset Book (full deep-dive guide)', desc: 'The complete BP Reset book — every protocol explained in depth.', file: 'bp-reset-book.pdf' },
      { name: 'Blood Pressure Cures — 10-Day Nurse\'s Reset', desc: 'Master document + top 10 herbs deep-dive (each matched to the drug it mimics) + White Coat guide + FAQ.', file: 'bp-cures-10-day-reset.pdf' },
    ],
  },
  {
    title: 'Cortisol',
    desc: 'For the stress corner of the Pressure Triangle.',
    files: [
      { name: '10-Day Cortisol Cure (full protocol)', desc: 'Day-by-day cortisol reset with adrenal-recovery guide.', file: 'cortisol-cure-10-day.pdf' },
      { name: 'Cortisol Day 1 — Wired and Tired Diagnosis', desc: 'Self-diagnose your cortisol pattern. Day 1 of the protocol.', file: 'cortisol-day1-diagnosis.pdf' },
    ],
  },
  {
    title: 'Blood Sugar',
    desc: 'For the glucose corner — insulin resistance, meal timing, food sequencing.',
    files: [
      { name: '10-Day Blood Sugar Reset (full protocol)', desc: 'Day-by-day glucose reset with herb stack + meal timing.', file: 'blood-sugar-reset-10-day.pdf' },
      { name: 'Blood Sugar Day 1', desc: 'Day 1 of the blood sugar protocol. Quick win.', file: 'blood-sugar-day1.pdf' },
    ],
  },
  {
    title: 'Kitchen + Bonuses',
    desc: 'Meal prep + the bonus library.',
    files: [
      { name: 'Cook For Life Cookbook', desc: 'Plant-based recipes built to lower BP and stabilize blood sugar.', file: 'cook-for-life-cookbook.pdf' },
      { name: 'Overmedicated Boomers (bonus)', desc: 'The complete book on getting off prescription overload — included with every purchase.', file: 'overmedicated-boomers.pdf' },
    ],
  },
];

export default function DownloadsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
      <div className="shell-tight">
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.82rem', color: 'var(--muted)',
          letterSpacing: '0.06em', marginBottom: '2rem',
        }}>
          <ArrowLeft size={14} /> Home
        </Link>

        <span className="kicker kicker-dot">Your library</span>
        <h1 className="display-l" style={{ margin: '1rem 0 1rem' }}>Your downloads.</h1>
        <p className="lede" style={{ marginBottom: '0.75rem' }}>
          Every BraveWorks protocol Joel publishes — ready to download instantly. Click any file to save it to your device.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
          Bookmark this page. Your access never expires.
        </p>

        {groups.map((group, gi) => (
          <section key={group.title} style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <BookOpen size={16} style={{ color: 'var(--clay)' }} />
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', fontWeight: 500, margin: 0, color: 'var(--ink)' }}>
                {group.title}
              </h2>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginTop: 0, marginBottom: '1rem' }}>
              {group.desc}
            </p>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {group.files.map((f, i) => (
                <motion.div
                  key={f.file}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (gi * group.files.length + i) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '1.1rem',
                    alignItems: 'center',
                    padding: '1.1rem 1.4rem',
                    background: 'var(--cream, #FFFFFF)',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                  }}
                >
                  <div style={{
                    width: 40, height: 40,
                    display: 'grid', placeItems: 'center',
                    borderRadius: 10,
                    background: 'var(--paper-warm)',
                    border: '1px solid var(--line)',
                  }}>
                    <FileText size={16} style={{ color: 'var(--sage-deep)' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.02rem', fontWeight: 500, lineHeight: 1.25 }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                      {f.desc}
                    </div>
                  </div>
                  <a href={`/downloads/${f.file}`} download className="btn btn-ink btn-sm" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.55rem 0.9rem', borderRadius: 8,
                    background: 'var(--ink, #2C3E50)', color: 'var(--cream, #FBF8F1)',
                    textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    <Download size={14} /> PDF
                  </a>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--line)', borderRadius: 14, padding: '1.5rem 1.75rem', marginTop: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Save this page.</strong> All your downloads stay here. You can also find the same links in your confirmation email from Joel Polley, RN.
          </p>
        </div>
      </div>
    </main>
  );
}
