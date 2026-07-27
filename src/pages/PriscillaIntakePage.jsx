// PriscillaIntakePage (route: /priscilla-assessment) — the deep 90-Day intake
// for Priscilla Harlins ($1,997 All-In buyer). Modeled on the Wakita/Consandra
// deep-dive: sectioned, thorough, one job. Covers all eight NEWSTART pillars,
// her daily lifestyle/eating/drinking habits, which of the causes we teach are
// present in her life, a structured optional labs block, and photo/PDF upload
// of labs and reports. On submit it POSTs to /api/priscilla-intake, which emails
// Joel every answer grouped by section with her documents attached, then the
// success screen books the 90-Day onboarding call.
//
// Standing rules: ZERO em dashes in visible copy, NEWSTART-aligned, educational
// verbs only, never treat/cure/prescribe. Her platelet history (ITP, ~50k) is
// why the supplements question carries a "talk to your doctor first" line.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Upload, X, CalendarCheck } from 'lucide-react';
import { track } from '../utils/analytics.js';

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };
const CALENDLY_URL = import.meta.env.VITE_CALENDLY_ONBOARDING_URL || 'https://calendly.com/braveworksrn/60min';

// Each field: { id, label, hint?, type: 'text'|'textarea'|'radio'|'checkbox', options?, rows? }
const SECTIONS = [
  {
    title: 'Where you are right now',
    intro: 'Start here. Rough numbers are fine, I just need the real picture.',
    fields: [
      { id: 'bp_recent', label: 'Your most recent home blood pressure', hint: 'Top over bottom, and roughly when you took it.', type: 'text', placeholder: 'e.g. 168/58, this morning' },
      { id: 'bp_range', label: 'On a normal week, your readings run…', type: 'text', placeholder: 'e.g. systolic 130 to 172, diastolic mid 50s to mid 60s' },
      { id: 'pulse', label: 'Resting heart rate', type: 'text', placeholder: 'e.g. mid 50s' },
      { id: 'time_of_day', label: 'When is your pressure usually highest?', type: 'radio', options: ['Morning', 'Afternoon', 'Evening / night', 'It jumps around', 'Not sure'] },
      { id: 'weight', label: 'Current weight (and height if you have it)', type: 'text', placeholder: 'e.g. 165 lb, 5 foot 4' },
      { id: 'feeling', label: 'How are you feeling in your body these days?', hint: 'Energy, dizziness, headaches, anything you notice.', type: 'textarea', rows: 3 },
    ],
  },
  {
    title: 'Your diagnoses and medications',
    intro: 'This section keeps you safe. The more complete it is, the better I can build around it.',
    fields: [
      { id: 'bp_meds', label: 'Blood pressure medications you take now, with doses', hint: 'Names and mg if you have them. I never change your medications.', type: 'textarea', rows: 3, placeholder: 'e.g. Hydralazine 200mg daily, Losartan 200mg daily' },
      { id: 'med_cannot', label: 'Medications you are allergic to or cannot take', type: 'textarea', rows: 2, placeholder: 'e.g. lisinopril, amlodipine, metoprolol' },
      { id: 'conditions', label: 'Other diagnoses you live with', hint: 'Everything, even if it seems unrelated.', type: 'textarea', rows: 3, placeholder: 'e.g. ITP since 2001, splenectomy, arteriosclerosis, mild sleep apnea' },
      { id: 'platelets', label: 'If you have a blood condition, your latest platelet count', hint: 'This matters a lot for which natural options are safe for you.', type: 'text', placeholder: 'e.g. around 50,000' },
      { id: 'supplements', label: 'Supplements, herbs, or teas you take now', hint: 'Please list everything. With any bleeding or platelet history, some of these need your doctor cleared first, so I want the full list.', type: 'textarea', rows: 3, placeholder: 'e.g. hawthorn drops, olive leaf, hibiscus tea daily' },
      { id: 'sleep_apnea', label: 'Sleep apnea', type: 'radio', options: ['Diagnosed, I use a CPAP nightly', 'Diagnosed, I do not use a CPAP', 'Suspected but not tested', 'No'] },
      { id: 'doctor', label: 'Who manages your care, and how is that going?', hint: 'Primary, cardiologist, hematologist, and anything you wish were different.', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'N · Nutrition',
    intro: 'Walk me through a normal day of eating. Be honest, not aspirational.',
    fields: [
      { id: 'day_of_eating', label: 'A typical day, first food to last', hint: 'Breakfast, lunch, dinner, and how it really looks on a busy day.', type: 'textarea', rows: 5 },
      { id: 'plant_forward', label: 'How much of your plate is plants (vegetables, fruit, beans, grains)?', type: 'radio', options: ['Almost all of it', 'More than half', 'About half', 'Less than half', 'Very little'] },
      { id: 'animal_products', label: 'Animal products (meat, dairy, eggs) show up…', type: 'radio', options: ['Never', 'A few times a month', 'A few times a week', 'Most days', 'Every day'] },
      { id: 'salt', label: 'Added salt and salty/processed foods', type: 'radio', options: ['I rarely add salt or eat processed food', 'Some', 'A fair amount', 'A lot, and I know it'] },
      { id: 'sugar', label: 'Sugar and sweets (desserts, soda, juice, sweetened coffee)', type: 'radio', options: ['Rarely', 'A few times a week', 'Most days', 'Daily, more than once'] },
      { id: 'eating_window', label: 'From first food to last food, how many hours?', type: 'text', placeholder: 'e.g. about 12 hours, 8am to 8pm' },
    ],
  },
  {
    title: 'E · Exercise and movement',
    fields: [
      { id: 'move_freq', label: 'How many days a week do you move on purpose?', type: 'radio', options: ['0', '1 to 2', '3 to 4', '5 or more'] },
      { id: 'move_type', label: 'What kind of movement?', hint: 'Pick all that apply.', type: 'checkbox', options: ['Walking', 'Hiking', 'Gym / weights', 'Boxing / cardio classes', 'Yard work / housework', 'Stretching', 'Very little right now'] },
      { id: 'move_notes', label: 'Any limits, pain, or things that stop you?', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'W · Water',
    fields: [
      { id: 'water', label: 'Glasses of plain water on a normal day', type: 'radio', options: ['0 to 2', '3 to 5', '6 to 8', 'More than 8'] },
      { id: 'first_drink', label: 'First thing you drink in the morning', type: 'text' },
      { id: 'other_drinks', label: 'Other drinks through the day', hint: 'Pick all that apply.', type: 'checkbox', options: ['Coffee', 'Black or green tea', 'Herbal / caffeine-free tea', 'Soda (regular)', 'Diet soda', 'Juice', 'Sports / energy drinks', 'Alcohol'] },
    ],
  },
  {
    title: 'S · Sunlight',
    fields: [
      { id: 'sun', label: 'Time outdoors in daylight on a normal day', type: 'radio', options: ['Almost none', 'A few minutes', '15 to 30 minutes', 'An hour or more'] },
    ],
  },
  {
    title: 'T · Temperance',
    intro: 'What you take in, and what you already know you overdo.',
    fields: [
      { id: 'alcohol', label: 'Alcohol', type: 'radio', options: ['None', 'A few times a month', 'A few times a week', 'Most days'] },
      { id: 'caffeine', label: 'Caffeine (coffee, tea, soda, energy)', type: 'radio', options: ['None', '1 cup a day', '2 to 3 a day', '4 or more a day'] },
      { id: 'tobacco', label: 'Tobacco or vaping', type: 'radio', options: ['Never', 'In the past, quit', 'Currently'] },
      { id: 'overdo', label: 'What is the one thing you know you overdo?', hint: 'Food, screens, work, worry, anything. No judgment.', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'A · Air and breathing',
    fields: [
      { id: 'breathing', label: 'Do you ever do slow breathing to settle down?', type: 'radio', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { id: 'breath_notes', label: 'Shortness of breath, snoring, or waking gasping?', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'R · Rest and sleep',
    intro: 'This one matters most for you, so give it real thought.',
    fields: [
      { id: 'sleep_hours', label: 'Hours of sleep on a normal night', type: 'radio', options: ['Less than 5', '5 to 6', '6 to 7', '7 to 8', 'More than 8'] },
      { id: 'sleep_quality', label: 'How is the quality of that sleep?', type: 'radio', options: ['Deep and restful', 'Okay', 'Broken', 'Poor, I wake up tired'] },
      { id: 'wake_time', label: 'What time do you usually wake up?', type: 'text' },
      { id: 'night_waking', label: 'Do you wake in the night? Why?', hint: 'Bathroom, racing mind, pain, apnea, no reason.', type: 'textarea', rows: 2 },
      { id: 'screens', label: 'Screens (phone, TV) in the last hour before bed?', type: 'radio', options: ['Never', 'Sometimes', 'Most nights', 'Every night'] },
    ],
  },
  {
    title: 'T · Trust, stress and support',
    intro: 'The corner most people underestimate. It is not weakness to answer honestly here.',
    fields: [
      { id: 'stress', label: 'Your stress load right now, 1 (calm) to 10 (overwhelmed)', type: 'text', placeholder: 'e.g. 7' },
      { id: 'carrying', label: 'What are you carrying that nobody hands you help with?', type: 'textarea', rows: 3 },
      { id: 'support', label: 'Who is in your corner day to day?', type: 'textarea', rows: 2 },
      { id: 'faith', label: 'Does faith or a community play a part in your life?', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'The causes we talk about, which are yours?',
    intro: 'Pick every one you honestly see in your own life. This maps your 90 days.',
    fields: [
      { id: 'causes', label: 'Present in my life right now', type: 'checkbox', options: [
        'Chronic stress that never lets go',
        'Poor or broken sleep',
        'Sleep apnea',
        'Too much sodium / processed food',
        'Sugar and sweets',
        'Sitting most of the day',
        'Alcohol',
        'Too much caffeine',
        'Not enough water',
        'Hormone changes (menopause and after)',
        'Stiff arteries / age',
        'Strong family history',
        'Belly / midsection weight',
        'Medications that are not working',
      ] },
      { id: 'loudest', label: 'If you had to name the ONE thing driving your numbers, what would you guess?', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'Your 90 days',
    fields: [
      { id: 'goal', label: 'What does winning look like 90 days from now?', hint: 'A number, a feeling, a conversation with your doctor that goes differently. Your words.', type: 'textarea', rows: 4 },
      { id: 'tried', label: 'What have you already tried that did not work?', type: 'textarea', rows: 3 },
      { id: 'anything', label: 'Anything else I should know before we start?', type: 'textarea', rows: 3 },
    ],
  },
];

// Optional structured labs. All optional.
const LAB_FIELDS = [
  { key: 'bp', label: 'Latest BP', ph: 'e.g. 168/58' },
  { key: 'platelets', label: 'Platelet count', ph: 'e.g. 50,000' },
  { key: 'a1c', label: 'A1C or fasting glucose', ph: 'if known' },
  { key: 'cholesterol', label: 'Cholesterol (total / LDL)', ph: 'e.g. 210 / 120' },
  { key: 'potassium', label: 'Potassium', ph: 'if known' },
  { key: 'magnesium', label: 'Magnesium', ph: 'if known' },
  { key: 'kidney', label: 'Kidney (eGFR / creatinine)', ph: 'if known' },
  { key: 'thyroid', label: 'Thyroid (TSH)', ph: 'if known' },
  { key: 'hormones', label: 'Any hormone labs', ph: 'if known' },
];

const MAX_FILES = 8;
const MAX_TOTAL_BYTES = 3_600_000;
const MAX_PDF_BYTES = 2_000_000;

function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1600;
        let { width, height } = img;
        if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve({ base64: canvas.toDataURL('image/jpeg', 0.72).split(',')[1], type: 'image/jpeg', name: file.name.replace(/\.(heic|heif|png|webp|jpe?g)$/i, '') + '.jpg' });
      } catch (err) { URL.revokeObjectURL(url); reject(err); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
  });
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
  try { return new URLSearchParams(window.location.search).get('email') || ''; } catch { return ''; }
}

export default function PriscillaIntakePage() {
  const prefillEmail = useMemo(readEmailParam, []);
  const [fields, setFields] = useState({ name: '', email: prefillEmail });
  const [answers, setAnswers] = useState({});
  const [labs, setLabs] = useState({});
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fileNote, setFileNote] = useState('');

  const setField = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const setText = (id) => (e) => setAnswers((a) => ({ ...a, [id]: e.target.value }));
  const setRadio = (id, val) => setAnswers((a) => ({ ...a, [id]: val }));
  const toggleCheck = (id, val) => setAnswers((a) => {
    const cur = Array.isArray(a[id]) ? a[id] : [];
    return { ...a, [id]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] };
  });
  const setLab = (k) => (e) => setLabs((l) => ({ ...l, [k]: e.target.value }));

  async function onFiles(e) {
    setFileNote('');
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    const next = [...files]; const skipped = [];
    for (const file of picked) {
      if (next.length >= MAX_FILES) { skipped.push(`${file.name} (max ${MAX_FILES})`); continue; }
      let entry = null;
      try {
        if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
          const dImg = await downscaleImage(file); entry = { ...dImg, bytes: Math.ceil((dImg.base64.length * 3) / 4) };
        } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
          if (file.size > MAX_PDF_BYTES) { skipped.push(`${file.name} (PDF over 2MB, email it instead)`); continue; }
          const dRaw = await readRawBase64(file); entry = { ...dRaw, bytes: file.size };
        } else { skipped.push(`${file.name} (photos and PDFs only)`); continue; }
      } catch {
        if (file.size <= 1_600_000) { const dRaw = await readRawBase64(file); entry = { ...dRaw, bytes: file.size }; }
        else { skipped.push(`${file.name} (could not process)`); continue; }
      }
      if (next.reduce((n, f) => n + f.bytes, 0) + entry.bytes > MAX_TOTAL_BYTES) { skipped.push(`${entry.name} (over the upload limit)`); continue; }
      next.push(entry);
    }
    setFiles(next);
    if (skipped.length) setFileNote(`Not added: ${skipped.join('; ')}. You can also reply to your confirmation email with those attached.`);
  }
  const removeFile = (i) => setFiles((fs) => fs.filter((_, idx) => idx !== i));

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) { setError('Please enter the email you used at checkout.'); return; }
    setBusy(true); setError('');
    track('priscilla_intake_submitted');
    // Flatten to an ordered list the API prints back grouped by section.
    const ordered = [];
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        const v = answers[f.id];
        const val = Array.isArray(v) ? v.join(', ') : (v || '');
        ordered.push({ section: s.title, label: f.label, value: String(val) });
      }
    }
    const attachments = files.map((f) => ({ filename: f.name, contentBase64: f.base64, type: f.type }));
    try {
      const res = await fetch('/api/priscilla-intake', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fields.name, email: fields.email, answers: ordered, labs, attachments }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setDone(true); window.scrollTo({ top: 0 }); }
      else setError(data.error || 'That did not go through. Please try again.');
    } catch { setError('That did not go through. Please check your connection and try again.'); }
    finally { setBusy(false); }
  }

  const input = { width: '100%', padding: '0.8rem 0.95rem', borderRadius: 10, border: '1.5px solid var(--line, #D8CFBD)', fontFamily: 'inherit', fontSize: '1rem', background: '#fff', color: 'var(--ink, #121110)', boxSizing: 'border-box' };
  const labelS = { display: 'block', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.2rem', color: 'var(--ink, #121110)' };
  const hintS = { fontSize: '0.82rem', color: 'var(--muted, #7A7061)', margin: '0 0 0.55rem' };
  const optRow = { display: 'flex', gap: '0.55rem', alignItems: 'flex-start', padding: '0.5rem 0.7rem', border: '1px solid var(--line, #E5DFD2)', borderRadius: 9, marginBottom: '0.4rem', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1.4, background: '#fff' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #FBF8F1)', fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--ink, #121110)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--line, #E5DFD2)', background: '#fff' }}>
        <span style={{ fontWeight: 800 }}>BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.12em', color: 'var(--clay, #B85A36)' }}>RN</span></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--dark-gray, #555)' }}>
          <Lock size={13} aria-hidden /> Your 90-Day intake · Read by Joel only
        </span>
      </header>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 2.25rem) 1.25rem 3rem' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <CheckCircle2 size={44} aria-hidden style={{ color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.8rem' }} />
            <h1 style={{ ...serif, fontSize: '1.8rem', margin: '0 0 0.6rem' }}>This is the foundation. Thank you.</h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '46ch', margin: '0 auto 1.8rem' }}>
              Everything you just gave me is on my desk. The last step is yours: pick the time
              for our 90-Day onboarding call, and we build your plan from here.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noreferrer" onClick={() => track('priscilla_intake_book_call')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem', padding: '1rem 1.6rem', background: 'var(--clay, #B85A36)', color: '#fff', borderRadius: 10, fontSize: '1.05rem', fontWeight: 800, textDecoration: 'none' }}>
              <CalendarCheck size={19} aria-hidden /> Book My Onboarding Call
            </a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', lineHeight: 1.2, margin: '0 0 0.5rem' }}>Your 90-Day foundation.</h1>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1.6rem' }}>
              This is the most important thing you will do in our first week. It takes about 15
              minutes. The more honest and complete you are, the better your plan gets, because
              I build every one of your 90 days from what you tell me here. I read every word myself.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelS}>Your name</label>
              <input style={input} value={fields.name} onChange={setField('name')} autoComplete="name" />
            </div>
            <div style={{ marginBottom: '1.8rem' }}>
              <label style={labelS}>The email you used at checkout</label>
              <input style={input} type="email" value={fields.email} onChange={setField('email')} required autoComplete="email" />
            </div>

            {SECTIONS.map((s) => (
              <div key={s.title} style={{ margin: '0 0 2rem', paddingTop: '1rem', borderTop: '2px solid var(--line, #E5DFD2)' }}>
                <h2 style={{ ...serif, fontSize: '1.2rem', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.35rem' }}>{s.title}</h2>
                {s.intro && <p style={{ fontSize: '0.88rem', color: 'var(--muted, #7A7061)', lineHeight: 1.5, margin: '0 0 1.1rem' }}>{s.intro}</p>}
                {s.fields.map((f) => (
                  <div key={f.id} style={{ marginBottom: '1.3rem' }}>
                    <label style={labelS}>{f.label}</label>
                    {f.hint && <p style={hintS}>{f.hint}</p>}
                    {f.type === 'text' && <input style={input} value={answers[f.id] || ''} onChange={setText(f.id)} placeholder={f.placeholder || ''} />}
                    {f.type === 'textarea' && <textarea style={{ ...input, resize: 'vertical' }} rows={f.rows || 3} value={answers[f.id] || ''} onChange={setText(f.id)} placeholder={f.placeholder || ''} />}
                    {f.type === 'radio' && f.options.map((o) => (
                      <label key={o} style={{ ...optRow, borderColor: answers[f.id] === o ? 'var(--clay, #B85A36)' : 'var(--line, #E5DFD2)' }}>
                        <input type="radio" name={f.id} checked={answers[f.id] === o} onChange={() => setRadio(f.id, o)} style={{ marginTop: 3 }} />
                        <span>{o}</span>
                      </label>
                    ))}
                    {f.type === 'checkbox' && f.options.map((o) => {
                      const on = Array.isArray(answers[f.id]) && answers[f.id].includes(o);
                      return (
                        <label key={o} style={{ ...optRow, borderColor: on ? 'var(--clay, #B85A36)' : 'var(--line, #E5DFD2)' }}>
                          <input type="checkbox" checked={on} onChange={() => toggleCheck(f.id, o)} style={{ marginTop: 3 }} />
                          <span>{o}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}

            {/* Structured labs */}
            <div style={{ margin: '0 0 2rem', paddingTop: '1rem', borderTop: '2px solid var(--line, #E5DFD2)' }}>
              <h2 style={{ ...serif, fontSize: '1.2rem', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.35rem' }}>Recent lab values <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--muted, #7A7061)' }}>(optional)</span></h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted, #7A7061)', lineHeight: 1.5, margin: '0 0 1rem' }}>Fill in only what you have. Skip the rest.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {LAB_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label style={{ ...labelS, fontWeight: 600, fontSize: '0.85rem' }}>{f.label}</label>
                    <input style={input} value={labs[f.key] || ''} onChange={setLab(f.key)} placeholder={f.ph} />
                  </div>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div style={{ marginBottom: '1.8rem' }}>
              <h2 style={{ ...serif, fontSize: '1.2rem', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.35rem' }}>Upload your labs and reports</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted, #7A7061)', lineHeight: 1.5, margin: '0 0 0.9rem' }}>
                Take a photo of a lab sheet, an after-visit summary, your med list, or your sleep study,
                or attach a PDF. Photos and PDFs, up to {MAX_FILES} files. I read them myself.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem 1rem', border: '1.5px dashed var(--line, #C9BFA8)', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 700, color: 'var(--sage-deep, #2E3A30)' }}>
                <Upload size={18} aria-hidden /> Choose photos or PDFs
                <input type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" multiple onChange={onFiles} style={{ display: 'none' }} />
              </label>
              {files.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.8rem 0 0' }}>
                  {files.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', padding: '0.5rem 0.7rem', background: '#fff', border: '1px solid var(--line, #E5DFD2)', borderRadius: 8, marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name} <span style={{ color: 'var(--muted, #7A7061)' }}>· {(f.bytes / 1024).toFixed(0)} KB</span></span>
                      <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--clay, #B85A36)', display: 'flex' }}><X size={16} /></button>
                    </li>
                  ))}
                </ul>
              )}
              {fileNote && <p style={{ fontSize: '0.8rem', color: 'var(--clay, #B85A36)', margin: '0.5rem 0 0' }}>{fileNote}</p>}
            </div>

            {error && <p role="alert" style={{ color: 'var(--clay, #B85A36)', fontSize: '0.9rem', margin: '0 0 0.9rem' }}>{error}</p>}

            <button type="button" onClick={submit} disabled={busy}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem 1.4rem', background: busy ? 'var(--sage-deep, #2E3A30)' : 'var(--clay, #B85A36)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1.05rem', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {busy ? 'Sending to Joel...' : <>Send My Foundation + Book My Call <ArrowRight size={18} /></>}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted, #7A7061)', margin: '0.7rem 0 0' }}>
              Education and lifestyle support alongside your doctor, never instead of them.
              See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
