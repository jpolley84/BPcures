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
// 2026-07-03: "Your Triangle Kit" section added ABOVE the legacy list.
// Buyer emails point here as "your library", but the page listed only the
// legacy PDFs and ZERO Triangle kit files. The section is built from
// public/downloads/manifest.json (written by the bundle build script) so it
// never drifts from what is actually on disk. If the manifest fetch fails,
// the section simply does not render; the legacy list below is unaffected.
//
// Files are public — security model is "URL-knowledge gate" (same as
// before). The customer reaches /downloads only via post-purchase
// redirects and the email confirmation link. We don't authenticate
// downloads because the existing pattern doesn't either.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ArrowLeft, BookOpen, Users, Stethoscope, ArrowRight } from 'lucide-react';
import TeaOffer from '../components/TeaOffer';

const groups = [
  {
    title: 'Blood Pressure',
    desc: 'Every BP protocol Joel publishes. Start with the Day 1 quick win and the master Reset Kit.',
    files: [
      { name: 'BP Reset Day 1 + Full Challenge', desc: 'Day-by-day BP protocol with checklists. Start here.', file: 'bp-reset-day1-and-beyond.pdf' },
      { name: 'BP Reset Kit (8-PDF zip)', desc: 'The full clinical system: hypertension guide, supplement protocol, meal plan, BP tracker, doctor templates.', file: 'bp-reset-kit.zip' },
      { name: 'BP Reset Book (full deep-dive guide)', desc: 'The complete BP Reset book. Every protocol explained in depth.', file: 'bp-reset-book.pdf' },
      { name: 'Master Blood Pressure Document', desc: 'The full protocol. What to take, when to take it, how much.', file: 'master-blood-pressure-document.pdf' },
      { name: 'Top 10 Herbs Deep Dive', desc: 'Each herb matched to the drug it mimics, with dosages your doctor never learned in med school.', file: 'top-10-herbs-deep-dive.pdf' },
      { name: 'White Coat Syndrome Guide', desc: 'Why your readings at the doctor are probably wrong, and the 2-minute trick nurses use to get real numbers.', file: 'white-coat-syndrome-guide.pdf' },
      { name: 'Blood Pressure FAQ', desc: "25 questions you're too afraid to ask your doctor, answered plainly by a nurse who's heard them all.", file: 'blood-pressure-faq.pdf' },
    ],
  },
  {
    title: 'Cortisol',
    desc: 'For the stress corner of the Triangle: Stress, Sugar, Sodium.',
    files: [
      { name: '10-Day Cortisol Cure (full protocol)', desc: 'Day-by-day cortisol reset with adrenal-recovery guide.', file: 'cortisol-cure-10-day.pdf' },
      { name: 'Cortisol Day 1: Wired and Tired Diagnosis', desc: 'Self-diagnose your cortisol pattern. Day 1 of the protocol.', file: 'cortisol-day1-diagnosis.pdf' },
    ],
  },
  {
    title: 'Blood Sugar',
    desc: 'For the glucose corner: insulin resistance, meal timing, food sequencing.',
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
      { name: 'Overmedicated Boomers (bonus)', desc: 'The complete book on getting off prescription overload. Included with every purchase.', file: 'overmedicated-boomers.pdf' },
    ],
  },
];

// Corners of the Triangle, in canonical order, for the manifest-driven section.
const TRIANGLE_CORNERS = [
  { key: 'stress', label: 'Stress' },
  { key: 'sugar', label: 'Sugar' },
  { key: 'sodium', label: 'Sodium' },
];

// 2026-07-16 Annie-v2: the two extra quiz triggers, each its own 3-piece set
// (not part of the Triangle; sold at the $17 corner tier).
const EXTRA_TRIGGERS_LIST = [
  { key: 'sleep', label: 'The Midnight Drift' },
  { key: 'stillness', label: 'The Stillness Trigger' },
];

// Build the "Your Triangle Kit" groups from the manifest. Same {title, desc,
// files:[{name, desc, href}]} shape the legacy groups use, except each file
// carries an explicit href (bundle ZIPs live under /downloads/bundles/).
function buildTriangleGroups(manifest) {
  if (!manifest || !Array.isArray(manifest.modules) || manifest.modules.length === 0) return [];
  const rowFor = (m) => ({
    name: m.title,
    desc: m.blurb,
    href: m.url || `/downloads/${m.file}`,
    file: m.file,
  });
  const built = TRIANGLE_CORNERS.map(({ key, label }) => ({
    title: `The ${label} Corner`,
    desc: `Your ${label} corner of the Triangle: the 10-day protocol, the herb formulary, and the bring-to-your-doctor sheet.`,
    files: [
      ...manifest.modules.filter((m) => m.corner === key).map(rowFor),
      {
        name: `The ${label} Corner, one file`,
        desc: 'The whole corner set plus the kit bonuses, zipped into one download.',
        href: `/downloads/bundles/bundle-corner-${key}.zip`,
        file: `bundle-corner-${key}.zip`,
      },
    ],
  }));
  // Extra-trigger sets render only when the manifest actually carries their
  // modules (so a stale manifest.json never shows an empty section).
  for (const { key, label } of EXTRA_TRIGGERS_LIST) {
    const mods = manifest.modules.filter((m) => m.corner === key);
    if (mods.length === 0) continue;
    built.push({
      title: label,
      desc: `Your ${label.replace('The ', '')} trigger set: the 10-day protocol, the herb formulary, and the bring-to-your-doctor sheet.`,
      files: [
        ...mods.map(rowFor),
        {
          name: `${label}, one file`,
          desc: 'The whole trigger set plus the kit bonuses, zipped into one download.',
          href: `/downloads/bundles/bundle-corner-${key}.zip`,
          file: `bundle-corner-${key}.zip`,
        },
      ],
    });
  }

  const finale = manifest.modules.find((m) => m.file === 'freedom-finale.pdf');
  built.push({
    title: 'The Complete Triangle',
    desc: 'All three corners plus the Freedom Finale, the whole loop closed.',
    files: [
      ...(finale ? [rowFor(finale)] : []),
      {
        name: 'The Complete Triangle Reset, one file',
        desc: 'Every corner set, the Freedom Finale, and every bonus in one download.',
        href: '/downloads/bundles/bundle-complete.zip',
        file: 'bundle-complete.zip',
      },
    ],
  });
  built.push({
    title: 'Two-Corner Bundles',
    desc: 'For Top 2 Corners buyers: your pair, zipped into one file. Grab the pair that matches your kit.',
    files: [
      { name: 'Stress + Sugar', desc: 'Both corner sets plus your bonuses, one download.', href: '/downloads/bundles/bundle-top2-stress-sugar.zip', file: 'bundle-top2-stress-sugar.zip' },
      { name: 'Stress + Sodium', desc: 'Both corner sets plus your bonuses, one download.', href: '/downloads/bundles/bundle-top2-stress-sodium.zip', file: 'bundle-top2-stress-sodium.zip' },
      { name: 'Sugar + Sodium', desc: 'Both corner sets plus your bonuses, one download.', href: '/downloads/bundles/bundle-top2-sugar-sodium.zip', file: 'bundle-top2-sugar-sodium.zip' },
    ],
  });
  return built;
}

// One download row card — the exact visual style the legacy groups use.
function FileRow({ f, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
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
      <a href={f.href || `/downloads/${f.file}`} download className="btn btn-ink btn-sm" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.55rem 0.9rem', borderRadius: 8,
        background: 'var(--ink, #2C3E50)', color: 'var(--cream, #FBF8F1)',
        textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
      }}>
        <Download size={14} /> {String(f.file || '').endsWith('.zip') ? 'ZIP' : 'PDF'}
      </a>
    </motion.div>
  );
}

export default function DownloadsPage() {
  // Manifest for the current Triangle kit line. null = not loaded (or failed);
  // the section renders only when we have real modules to show.
  const [triangleGroups, setTriangleGroups] = useState([]);
  useEffect(() => {
    let alive = true;
    fetch('/downloads/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (alive && m) setTriangleGroups(buildTriangleGroups(m)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

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
          Every BraveWorks protocol Joel publishes, ready to download instantly. Click any file to save it to your device.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
          Bookmark this page. Your access never expires.
        </p>

        {/* ---- Your Triangle Kit (the current product line, manifest-driven) ---- */}
        {triangleGroups.length > 0 && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="kicker kicker-dot">Your Triangle Kit</span>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', margin: '0.5rem 0 0' }}>
                The BP Triangle kits: Stress, Sugar, and Sodium. If your purchase email sent you here,
                your files are below. Start with your loudest corner.
              </p>
            </div>
            {triangleGroups.map((group, gi) => (
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
                    <FileRow key={f.file} f={f} delay={(gi * 4 + i) * 0.04} />
                  ))}
                </div>
              </section>
            ))}
            <div style={{ borderTop: '1px dashed var(--line)', margin: '0 0 3rem' }} />
          </>
        )}

        {/* ---- Legacy library (kept: earlier buyers' links still work) ---- */}
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
                <FileRow key={f.file} f={f} delay={(gi * group.files.length + i) * 0.04} />
              ))}
            </div>
          </section>
        ))}

        {/* SVUTU Steady tea — the done-for-you hibiscus the protocol calls for.
            Buyers are the warmest audience for the consumable subscription. */}
        <TeaOffer />

        {/* Coaching CTAs. Buyers are the warmest audience for both the $27/mo
            group (Skool) and Joel's 1:1 tiers (/coaching). Kept off the cold
            homepage on purpose; this is the right place for them. 2026-06-08. */}
        <section style={{ marginTop: '1rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <BookOpen size={16} style={{ color: 'var(--clay)' }} />
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', fontWeight: 500, margin: 0, color: 'var(--ink)' }}>
              Ready for more support?
            </h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginTop: 0, marginBottom: '1rem' }}>
            The PDFs get you started. These put a nurse in your corner.
          </p>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {/* Group coaching -> Skool */}
            <a
              href="https://www.skool.com/braveworksrn"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.1rem', alignItems: 'center',
                padding: '1.1rem 1.4rem', background: 'var(--cream, #FFFFFF)',
                border: '1px solid var(--line)', borderRadius: 14, textDecoration: 'none',
              }}
            >
              <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'var(--paper-warm)', border: '1px solid var(--line)' }}>
                <Users size={16} style={{ color: 'var(--sage-deep)' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.02rem', fontWeight: 500, lineHeight: 1.25, color: 'var(--ink)' }}>
                  Ready for group coaching?
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                  Join the BraveWorks RN community: weekly live coaching with Joel, the full library, and a group beside you. $27/mo, first 7 days free.
                </div>
              </div>
              <span className="btn btn-ink btn-sm" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.55rem 0.9rem', borderRadius: 8,
                background: 'var(--ink, #2C3E50)', color: 'var(--cream, #FBF8F1)',
                fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                Join <ArrowRight size={14} />
              </span>
            </a>
            {/* 1:1 coaching -> /coaching */}
            <Link
              to="/coaching"
              style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.1rem', alignItems: 'center',
                padding: '1.1rem 1.4rem', background: 'var(--cream, #FFFFFF)',
                border: '1px solid var(--line)', borderRadius: 14, textDecoration: 'none',
              }}
            >
              <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'var(--paper-warm)', border: '1px solid var(--line)' }}>
                <Stethoscope size={16} style={{ color: 'var(--sage-deep)' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.02rem', fontWeight: 500, lineHeight: 1.25, color: 'var(--ink)' }}>
                  Want 1:1 coaching with Joel?
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                  A protocol built just for you, with a nurse's eyes on your own numbers. A few private tiers, by inquiry.
                </div>
              </div>
              <span className="btn btn-ink btn-sm" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.55rem 0.9rem', borderRadius: 8,
                background: 'var(--ink, #2C3E50)', color: 'var(--cream, #FBF8F1)',
                fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                See options <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </section>

        <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--line)', borderRadius: 14, padding: '1.5rem 1.75rem', marginTop: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Save this page.</strong> All your downloads stay here. You can also find the same links in your confirmation email from Joel Polley, RN.
          </p>
        </div>
      </div>
    </main>
  );
}
