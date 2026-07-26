// SprintAssessmentPage (route: /sprint-assessment) — the deep assessment
// every $297/$97 Sprint buyer fills out after purchase. Submission POSTs to
// api/sprint-assessment.js, which emails Joel every answer + any uploaded lab
// documents ([ACTION]) and confirms receipt to the buyer. Linked from the
// case-review confirmation email and /case-review-confirmed.
// 2026-07-26: added an optional structured lab-values block, document/photo
// upload (images downscaled client-side so the POST stays under Vercel's body
// limit), and a Calendly booking step on the success screen so the buyer books
// their onboarding call the moment they finish. Standalone page, ZERO em dashes.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Upload, X, CalendarCheck } from 'lucide-react';
import { track } from '../utils/analytics.js';

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const CALENDLY_URL =
  import.meta.env.VITE_CALENDLY_ONBOARDING_URL ||
  'https://calendly.com/braveworksrn/60min';

const QUESTIONS = [
  { key: 'readings', label: 'Your recent blood pressure readings', hint: 'The last few numbers you remember, and when you took them. Rough is fine.', rows: 3 },
  { key: 'meds', label: 'Medications and supplements you take now', hint: 'Names and doses if you have them. I never change your medications. Your doctor owns that.', rows: 3 },
  { key: 'tried', label: 'What have you already tried for your pressure?', hint: 'Diets, walking, apps, anything. Tell me what stuck and what did not.', rows: 4 },
  { key: 'health', label: 'The rest of your health picture', hint: 'Sleep, stress, energy, any diagnoses you live with.', rows: 4 },
  { key: 'struggle', label: 'What is the hardest part right now?', hint: 'Be honest. This is the question that shapes your plan the most.', rows: 3 },
  { key: 'goal', label: 'What does winning look like in 30 days?', hint: 'A number, a feeling, a doctor visit that goes differently. Your words.', rows: 3 },
  { key: 'notes', label: 'Anything else I should know?', hint: 'Optional.', rows: 3 },
];

// Optional structured labs. Every one is optional; skip anything you do not have.
const LAB_FIELDS = [
  { key: 'bp', label: 'Latest blood pressure', ph: 'e.g. 148 / 92' },
  { key: 'bpDate', label: 'Date of that reading', ph: 'e.g. last week' },
  { key: 'pulse', label: 'Resting heart rate', ph: 'e.g. 74 bpm' },
  { key: 'weight', label: 'Current weight', ph: 'e.g. 190 lb' },
  { key: 'a1c', label: 'A1C or fasting glucose', ph: 'e.g. A1C 5.9' },
  { key: 'cholesterol', label: 'Cholesterol (total / LDL)', ph: 'e.g. 210 / 130' },
  { key: 'potassium', label: 'Potassium', ph: 'e.g. 4.1' },
  { key: 'magnesium', label: 'Magnesium', ph: 'if you know it' },
  { key: 'kidney', label: 'Kidney (eGFR or creatinine)', ph: 'e.g. eGFR 72' },
  { key: 'thyroid', label: 'Thyroid (TSH)', ph: 'if you know it' },
];

const MAX_FILES = 6;
const MAX_TOTAL_BYTES = 3_600_000; // stay well under Vercel's 4.5MB body limit
const RAW_IMG_FALLBACK = 1_600_000; // if downscale fails, only send small raw images
const MAX_PDF_BYTES = 2_000_000;

// Downscale an image file to <=1600px JPEG so lab-sheet photos post cleanly.
function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1600;
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve({ base64: dataUrl.split(',')[1], type: 'image/jpeg', name: renameJpeg(file.name) });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
  });
}

function renameJpeg(name) {
  return name.replace(/\.(heic|heif|png|webp|jpe?g)$/i, '') + '.jpg';
}

function readRawBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve({ base64: String(fr.result).split(',')[1], type: file.type, name: file.name });
    fr.onerror = () => reject(new Error('read failed'));
    fr.readAsDataURL(file);
  });
}

function readEmailParam() {
  try {
    return new URLSearchParams(window.location.search).get('email') || '';
  } catch {
    return '';
  }
}

export default function SprintAssessmentPage() {
  const prefillEmail = useMemo(readEmailParam, []);
  const [fields, setFields] = useState({ name: '', email: prefillEmail, age: '' });
  const [answers, setAnswers] = useState({});
  const [labs, setLabs] = useState({});
  const [files, setFiles] = useState([]); // { name, type, base64, bytes }
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fileNote, setFileNote] = useState('');

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const setA = (key) => (e) => setAnswers((a) => ({ ...a, [key]: e.target.value }));
  const setL = (key) => (e) => setLabs((l) => ({ ...l, [key]: e.target.value }));

  async function onFiles(e) {
    setFileNote('');
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    if (!picked.length) return;
    const next = [...files];
    const skipped = [];
    for (const file of picked) {
      if (next.length >= MAX_FILES) { skipped.push(`${file.name} (max ${MAX_FILES} files)`); continue; }
      let entry = null;
      try {
        if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
          const d = await downscaleImage(file);
          entry = { ...d, bytes: Math.ceil((d.base64.length * 3) / 4) };
        } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
          if (file.size > MAX_PDF_BYTES) { skipped.push(`${file.name} (PDF over 2MB, email it to me instead)`); continue; }
          const d = await readRawBase64(file);
          entry = { ...d, bytes: file.size };
        } else {
          skipped.push(`${file.name} (only photos and PDFs)`);
          continue;
        }
      } catch {
        // downscale failed (e.g. an odd format) — send raw only if small
        if (file.size <= RAW_IMG_FALLBACK) {
          const d = await readRawBase64(file);
          entry = { ...d, bytes: file.size };
        } else {
          skipped.push(`${file.name} (could not process, email it to me instead)`);
          continue;
        }
      }
      const total = next.reduce((n, f) => n + f.bytes, 0) + entry.bytes;
      if (total > MAX_TOTAL_BYTES) { skipped.push(`${entry.name} (would exceed the upload limit)`); continue; }
      next.push(entry);
    }
    setFiles(next);
    if (skipped.length) setFileNote(`Not added: ${skipped.join('; ')}. You can also just reply to your confirmation email with those attached.`);
  }

  const removeFile = (i) => setFiles((fs) => fs.filter((_, idx) => idx !== i));

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      setError('Please enter the email you used at checkout.');
      return;
    }
    setBusy(true);
    setError('');
    track('sprint_assessment_submitted');
    try {
      const attachments = files.map((f) => ({ filename: f.name, contentBase64: f.base64, type: f.type }));
      const res = await fetch('/api/sprint-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, ...answers, labs, attachments }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
        window.scrollTo({ top: 0 });
      } else {
        setError(data.error || 'That did not go through. Please try again.');
      }
    } catch {
      setError('That did not go through. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 0.95rem',
    borderRadius: 10,
    border: '1.5px solid var(--line, #D8CFBD)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    background: '#fff',
    color: 'var(--ink, #121110)',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--ink, #121110)' };
  const hintStyle = { fontSize: '0.82rem', color: 'var(--muted, #7A7061)', margin: '0 0 0.5rem' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #FBF8F1)', fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--ink, #121110)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--line, #E5DFD2)', background: '#fff' }}>
        <span style={{ fontWeight: 800 }}>
          BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.12em', color: 'var(--clay, #B85A36)' }}>RN</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--dark-gray, #555)' }}>
          <Lock size={13} aria-hidden /> Your Sprint assessment · Read by Joel only
        </span>
      </header>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 2.25rem) 1.25rem 3rem' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <CheckCircle2 size={44} aria-hidden style={{ color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.8rem' }} />
            <h1 style={{ ...serif, fontSize: '1.8rem', margin: '0 0 0.6rem' }}>Your case is on Joel&rsquo;s desk.</h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '46ch', margin: '0 auto 1.8rem' }}>
              I have everything I need to start building your 30 days. The last step is
              yours: pick the time for our 1:1 onboarding call. That call is where your
              plan becomes real.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('sprint_assessment_book_call')}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                padding: '1rem 1.6rem', background: 'var(--clay, #B85A36)', color: '#fff',
                borderRadius: 10, fontSize: '1.05rem', fontWeight: 800, textDecoration: 'none',
              }}
            >
              <CalendarCheck size={19} aria-hidden /> Book My Onboarding Call
            </a>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted, #7A7061)', margin: '1.1rem 0 0' }}>
              A confirmation is in your inbox too. If a time does not fit, reply to it and
              we will find one.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', lineHeight: 1.2, margin: '0 0 0.6rem' }}>
              Tell me about your case.
            </h1>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1.5rem' }}>
              This takes about 10 minutes, and it is the most important 10 minutes of your
              Sprint. The more honest you are here, the better your 30-day plan gets. I read
              every word myself. When you finish, you will book our 1:1 call.
            </p>

            <form onSubmit={submit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Your name</label>
                <input style={inputStyle} value={fields.name} onChange={set('name')} autoComplete="name" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>The email you used at checkout</label>
                <input style={inputStyle} type="email" value={fields.email} onChange={set('email')} autoComplete="email" required />
              </div>
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={labelStyle}>Your age range</label>
                <input style={inputStyle} value={fields.age} onChange={set('age')} placeholder="For example: 55 to 64" />
              </div>

              {QUESTIONS.map((q) => (
                <div key={q.key} style={{ marginBottom: '1.4rem' }}>
                  <label style={labelStyle}>{q.label}</label>
                  <p style={hintStyle}>{q.hint}</p>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={q.rows} value={answers[q.key] || ''} onChange={setA(q.key)} />
                </div>
              ))}

              {/* Optional structured labs */}
              <div style={{ margin: '2rem 0 1.4rem', padding: '1.2rem 1.1rem', background: '#fff', border: '1.5px solid var(--line, #E5DFD2)', borderRadius: 12 }}>
                <label style={{ ...labelStyle, fontSize: '1.05rem' }}>Recent lab values <span style={{ fontWeight: 500, color: 'var(--muted, #7A7061)' }}>(optional)</span></label>
                <p style={hintStyle}>Fill in only what you have handy. Skip the rest. Every number here sharpens your plan, but none of it is required.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.6rem' }}>
                  {LAB_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label style={{ ...labelStyle, fontWeight: 600, fontSize: '0.85rem' }}>{f.label}</label>
                      <input style={inputStyle} value={labs[f.key] || ''} onChange={setL(f.key)} placeholder={f.ph} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Document / photo upload */}
              <div style={{ marginBottom: '1.6rem' }}>
                <label style={labelStyle}>Upload lab results or documents <span style={{ fontWeight: 500, color: 'var(--muted, #7A7061)' }}>(optional)</span></label>
                <p style={hintStyle}>
                  Snap a photo of a lab sheet, after-visit summary, or med list, or attach a
                  PDF. Photos and PDFs only, up to {MAX_FILES} files. I read them myself.
                </p>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.9rem 1rem', border: '1.5px dashed var(--line, #C9BFA8)', borderRadius: 10,
                    background: '#fff', cursor: 'pointer', fontWeight: 700, color: 'var(--sage-deep, #2E3A30)',
                  }}
                >
                  <Upload size={18} aria-hidden /> Choose photos or PDFs
                  <input type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" multiple onChange={onFiles} style={{ display: 'none' }} />
                </label>
                {files.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0.8rem 0 0' }}>
                    {files.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', padding: '0.5rem 0.7rem', background: '#fff', border: '1px solid var(--line, #E5DFD2)', borderRadius: 8, marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.name} <span style={{ color: 'var(--muted, #7A7061)' }}>· {(f.bytes / 1024).toFixed(0)} KB</span>
                        </span>
                        <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--clay, #B85A36)', display: 'flex' }}>
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {fileNote && <p style={{ fontSize: '0.8rem', color: 'var(--clay, #B85A36)', margin: '0.5rem 0 0' }}>{fileNote}</p>}
              </div>

              {error && (
                <p role="alert" style={{ color: 'var(--clay, #B85A36)', fontSize: '0.9rem', margin: '0 0 0.9rem' }}>{error}</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '1rem 1.4rem',
                  background: busy ? 'var(--sage-deep, #2E3A30)' : 'var(--clay, #B85A36)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: '1.05rem', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {busy ? 'Sending your case to Joel...' : <>Send My Case + Book My Call <ArrowRight size={18} /></>}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted, #7A7061)', margin: '0.7rem 0 0' }}>
                Education and lifestyle support alongside your doctor, never instead of them.
                See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
