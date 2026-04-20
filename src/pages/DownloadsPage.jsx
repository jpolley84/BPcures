import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ArrowLeft } from 'lucide-react';

const files = [
  { name: 'Master Blood Pressure Document', desc: 'Complete protocol with daily checklists and tracking sheets.', file: 'master-bp-document.pdf' },
  { name: 'Top 10 Herbs Deep Dive', desc: 'Dosing, timing, and what to look for on the label.', file: 'top-10-herbs.pdf' },
  { name: '10-Day Blood Pressure Reset Challenge', desc: 'Step-by-step daily plan with meal ideas.', file: '10-day-reset-challenge.pdf' },
  { name: 'Cook For Life Cookbook', desc: '50+ heart-healthy recipes using common ingredients.', file: 'cook-for-life-cookbook.pdf' },
  { name: 'White Coat Syndrome Guide', desc: 'How to get accurate readings at home and at the doctor.', file: 'white-coat-syndrome-guide.pdf' },
  { name: 'Bonus · Overmedicated Boomers', desc: 'The complete book on prescription overload.', file: 'overmedicated-boomers.pdf' },
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
        <p className="lede" style={{ marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
          Every file you've purchased — ready to download, instantly. Click any item to save it to your device.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '3rem' }}>
          {files.map((f, i) => (
            <motion.div
              key={f.file}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '1.25rem',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                borderRadius: 16,
              }}
            >
              <div style={{
                width: 44, height: 44,
                display: 'grid', placeItems: 'center',
                borderRadius: 12,
                background: 'var(--paper-warm)',
                border: '1px solid var(--line)',
              }}>
                <FileText size={18} style={{ color: 'var(--sage-deep)' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.08rem', fontWeight: 500, lineHeight: 1.25 }}>
                  {f.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  {f.desc}
                </div>
              </div>
              <a href={`/downloads/${f.file}`} download className="btn btn-ink btn-sm">
                <Download size={14} /> PDF
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
