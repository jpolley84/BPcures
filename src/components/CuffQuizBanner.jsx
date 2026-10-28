// CuffQuizBanner — Life Beyond the Cuff (bloodpressurerepair.com) ad on the
// quiz results screen.
//
// 2026-10-27 (Joel): "we need to add a blood pressure repair.com ad on
// bpquiz.com." Joel chose the results page only; it replaces the stale
// Sept 22-24 ChallengeQuizBanner. The homepage stays one bar (masterclass) so
// the quiz is still the only thing to do there.
//
// Offer facts from the live sales page: 8-module self-paced course, Joel with
// Annie featured, $297 one time, doors open Monday, November 2 (modules
// unlock 11:00 UTC = 5 AM CT, same as bloodpressurerepair-site/api/_modules.js).
// After that moment the eyebrow says the doors are open instead of the date.
import { track } from '../utils/analytics.js';

const DOORS_OPEN = Date.UTC(2026, 10, 2, 11, 0, 0);

export default function CuffQuizBanner({ placement }) {
  const open = Date.now() >= DOORS_OPEN;
  return (
    <a
      href={`https://bloodpressurerepair.com/?utm_source=bpquiz&utm_medium=banner&utm_campaign=cuff-launch&utm_content=${placement}`}
      onClick={() => track('cuff_banner_click', { placement, doors_open: open })}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(120deg, #0E3B36, #12504A 60%, #0B2F2B)',
        borderRadius: 14,
        padding: '14px 18px',
        margin: '0 0 14px',
        boxShadow: '0 10px 26px rgba(14,59,54,0.28)',
        border: '1px solid rgba(255,216,168,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFD8A8', marginBottom: 3 }}>
            {open ? 'New · Doors are open' : 'New · Doors open Monday, November 2'}
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35 }}>
            Done what you were told and still dread the next reading? Life Beyond the Cuff: the
            8-week Blood Pressure Repair System with Joel &amp; Annie, RNs.
          </div>
        </div>
        <div style={{ flex: '0 0 auto', background: '#FFD8A8', color: '#0E3B36', fontWeight: 800, fontSize: '0.8rem', borderRadius: 999, padding: '11px 16px', minHeight: 44, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          See the course &middot; $297 &rarr;
        </div>
      </div>
    </a>
  );
}
