// <DownloadsSection /> — embeddable downloads list.
//
// Used on every post-purchase surface so customers can grab their PDFs
// immediately without waiting for confirmation email or navigating to
// /library. Per Joel 2026-05-20: "we don't need security on those links
// i don't care" — links are visible to anyone who reaches a post-
// purchase page. URL-knowledge gating is the only barrier (same as
// /library + the existing /downloads/*.pdf static asset pattern).
//
// Two variants:
//   variant="compact"   — small list at top of upsell pages (above the offer)
//   variant="full"      — full /library-style grouped layout (used on /library)

import { Download, FileText } from 'lucide-react';

const ALL_FILES = [
  { name: 'BP Reset Day 1 + Full Challenge', file: 'bp-reset-day1-and-beyond.pdf', category: 'BP' },
  { name: 'BP Reset Kit (8-PDF zip)', file: 'bp-reset-kit.zip', category: 'BP' },
  { name: 'BP Reset Book (full guide)', file: 'bp-reset-book.pdf', category: 'BP' },
  { name: 'Blood Pressure Cures — 10-Day Reset', file: 'bp-cures-10-day-reset.pdf', category: 'BP' },
  { name: '10-Day Cortisol Cure', file: 'cortisol-cure-10-day.pdf', category: 'Cortisol' },
  { name: 'Cortisol Day 1 — Diagnosis', file: 'cortisol-day1-diagnosis.pdf', category: 'Cortisol' },
  { name: '10-Day Blood Sugar Reset', file: 'blood-sugar-reset-10-day.pdf', category: 'Blood Sugar' },
  { name: 'Blood Sugar Day 1', file: 'blood-sugar-day1.pdf', category: 'Blood Sugar' },
  { name: 'Cook For Life Cookbook', file: 'cook-for-life-cookbook.pdf', category: 'Kitchen' },
  { name: 'Overmedicated Boomers (bonus)', file: 'overmedicated-boomers.pdf', category: 'Bonus' },
];

export default function DownloadsSection({ variant = 'compact', title }) {
  if (variant === 'compact') {
    return (
      <div style={{
        background: 'var(--paper-warm, #F5F1E8)',
        border: '1px solid var(--line, #E8E2D4)',
        borderRadius: 14,
        padding: '1.5rem 1.5rem 1.25rem',
        marginBottom: '2rem',
        textAlign: 'left',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}>
          <Download size={18} style={{ color: 'var(--clay, #B85A36)' }} />
          <h3 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '1.05rem',
            fontWeight: 600,
            margin: 0,
            color: 'var(--ink, #2C3E50)',
          }}>
            {title || 'Your downloads — grab them now'}
          </h3>
        </div>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--ink-soft, #5A5A5A)',
          margin: '0 0 1rem',
          lineHeight: 1.5,
        }}>
          Click any file to save it. You can come back to this page anytime — or visit{' '}
          <a href="/library" style={{ color: 'var(--clay, #B85A36)', textDecoration: 'underline', fontWeight: 600 }}>bpquiz.com/library</a>.
        </p>

        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {ALL_FILES.map((f) => (
            <a
              key={f.file}
              href={`/downloads/${f.file}`}
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                background: 'var(--cream, #FFFFFF)',
                border: '1px solid var(--line, #E8E2D4)',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'var(--ink, #2C3E50)',
                fontSize: '0.88rem',
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--paper-warm, #F5F1E8)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--cream, #FFFFFF)'}
            >
              <FileText size={14} style={{ color: 'var(--sage-deep, #4A6741)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'Fraunces, Georgia, serif' }}>{f.name}</span>
              <Download size={13} style={{ color: 'var(--muted, #9A9A9A)', flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // variant === 'full' — used by /library page. Returns null because the
  // DownloadsPage.jsx already implements the full grouped layout. Reserved
  // for future use if we want to consolidate.
  return null;
}
