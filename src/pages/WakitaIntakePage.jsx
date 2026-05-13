// src/pages/WakitaIntakePage.jsx
//
// Personalized clinical intake for Wakita Cirillo Browne ahead of her
// 2026-05-13 12:00 PM coaching call with Joel Polley, RN.
//
// Reachable at:
//   - https://wakita.bpquiz.com (subdomain — see App.jsx host detection)
//   - https://bpquiz.com/wakita (fallback path)
//
// Built from her chart: Orlando Health GI workup Dec 23 2025 – Jan 3 2026
// (EGD/EUS/MRI/HIDA/CT/colonoscopy/tumor markers/gastric emptying), plus
// Mexico Bio Life nano scan 2026-05-10 and her hand-written supplement list.
//
// Posts answers to /api/wakita-intake (KV-stored, emails Joel).
// Single-page; no token gate — Joel sends her one private link.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

// ---------- form schema (sections > fields) ----------
const SECTIONS = [
  {
    id: 'vitals',
    title: 'Quick vitals',
    intro:
      "These three numbers anchor everything else. Not in your chart from Orlando — I need them from you.",
    fields: [
      { id: 'bp_recent', label: "Your most recent home blood pressure (top/bottom + when taken)", type: 'text', placeholder: 'e.g., 138/86 this morning', required: true },
      { id: 'bp_typical', label: "What does it usually run? Any pattern (morning vs evening, sitting vs standing)?", type: 'textarea', rows: 3 },
      { id: 'bp_meds', label: "On any blood-pressure medication? Name + dose + how long", type: 'textarea', rows: 2 },
      { id: 'weight', label: "Current weight (rough is fine)", type: 'text', placeholder: 'e.g., 168 lb' },
      { id: 'height', label: "Height", type: 'text', placeholder: "e.g., 5'5\"" },
      { id: 'waist', label: "Waist measurement (if you know it — at the belly button)", type: 'text', placeholder: 'optional' },
    ],
  },
  {
    id: 'symptoms_now',
    title: 'How you feel right now',
    intro:
      "Your December workup found mild gastritis, a small liver hemangioma, a calcified fibroid, and rapid gastric emptying — all benign on paper. I want to know what your body is actually telling you today.",
    fields: [
      { id: 'pain_status', label: "The epigastric/right upper quadrant pain that started this whole workup — where is it now?", type: 'textarea', rows: 4, placeholder: 'Gone, better, the same, worse? Any specific triggers (after meals, certain foods, stress)?' },
      { id: 'pain_pattern', label: "When pain shows up, what does it feel like? (burning, gnawing, sharp, pressure, fullness)", type: 'textarea', rows: 2 },
      { id: 'melena_status', label: "Black tarry stools (melena) — when was the last episode? Any since the workup?", type: 'textarea', rows: 2, helper: "Your chart referenced a melena history. I need to know if it's resolved or still happening." },
      { id: 'reflux', label: "Heartburn / acid reflux / sour taste — frequency?", type: 'textarea', rows: 2 },
      { id: 'bloating', label: "Bloating, gas, fullness after meals?", type: 'textarea', rows: 2 },
      { id: 'bowels', label: "Bowel pattern: how many stools per week? Hard or loose? Straining?", type: 'textarea', rows: 3, helper: "The Mexico ultrasound noted constipation/slow transit — worth confirming." },
      { id: 'energy', label: "Energy through the day — when's your peak, when's your crash?", type: 'textarea', rows: 3 },
      { id: 'sleep', label: "Sleep: hours per night, wake-ups, snoring (yours or partner's), morning grogginess?", type: 'textarea', rows: 3 },
      { id: 'mood', label: "Mood the last 3 months — anxiety, sadness, irritability, brain fog?", type: 'textarea', rows: 2 },
      { id: 'other_symptoms', label: "Anything else your body is doing that bothers you? (joint pain, headaches, skin, vision, hair)", type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'meds',
    title: 'Medications you walked out of the hospital with',
    intro:
      "On 12/31 Dr. Kathi prescribed five things. Tell me what you're actually taking — and how it's making you feel.",
    fields: [
      { id: 'ppi_status', label: "Pantoprazole 40 mg twice a day (Protonix) — still on it? Skipping doses? Side effects?", type: 'textarea', rows: 3, required: true },
      { id: 'bentyl_status', label: "Dicyclomine 20 mg twice a day (Bentyl) — finished the 10 days? Any side effects (dry mouth, blurry vision, constipation)?", type: 'textarea', rows: 3 },
      { id: 'simethicone_use', label: "Simethicone (Mylicon) — using it? How often?", type: 'text' },
      { id: 'tylenol_use', label: "Tylenol — how many pills per week typically?", type: 'text' },
      { id: 'benadryl_use', label: "Benadryl for itching — what's the itching about? Any rash or hives?", type: 'textarea', rows: 2 },
      { id: 'nsaid_history', label: "Critical: any ibuprofen, Advil, Motrin, Aleve, naproxen, or aspirin in the last year? How often, what for, what dose?", type: 'textarea', rows: 3, required: true, helper: "Now that H. pylori came back negative, NSAID history is the next likely cause of your gastritis. This is a big question." },
    ],
  },
  {
    id: 'biolife',
    title: 'The Bio Life regimen (Mexico, 5/10)',
    intro:
      "I see six bottles in the photo you sent: Magnesium (breakfast), Selenium Plus (before bed), Plant Protein (1 scoop), Hepa D-Tox, Curcumin Plus, Chaparro Amargo (1 each meal). Plus a pink powder. Walk me through how you're using it.",
    fields: [
      { id: 'biolife_started', label: "Have you started the Bio Life protocol? Which day are you on?", type: 'text' },
      { id: 'biolife_feelings', label: "Since starting Bio Life, what's better, worse, or different?", type: 'textarea', rows: 4 },
      { id: 'biolife_side_effects', label: "Any side effects from the Bio Life supplements? (nausea, looser stools, headaches, anything)", type: 'textarea', rows: 3 },
      { id: 'biolife_selenium_dose', label: "If you can grab the Selenium Plus bottle — what's the dose per serving (micrograms)? This one matters for safety.", type: 'text', placeholder: "e.g., 200 mcg per teaspoon" },
      { id: 'biolife_chaparro_response', label: "The Chaparro Amargo (bitter herb) — any reaction in your gut when you take it?", type: 'textarea', rows: 2 },
      { id: 'biolife_pink_powder', label: "What's the pink powder? (label name + what they told you it's for)", type: 'text' },
      { id: 'mexico_notes', label: "What did the Mexico clinic tell you they found on the nano scan? What did they recommend besides the supplements?", type: 'textarea', rows: 5 },
    ],
  },
  {
    id: 'existing_supplements',
    title: 'Your existing supplement list',
    intro:
      "You sent me 18 supplements you're currently using, with a note that many will be discontinued. Quick reality check on which ones are actually still going down the hatch.",
    fields: [
      { id: 'supps_still_taking', label: "Of the original 18 — which ones are you still taking daily?", type: 'textarea', rows: 6, helper: "Just list them. Doses if you know them." },
      { id: 'supps_dropped', label: "Which ones have you already stopped, and what made you stop?", type: 'textarea', rows: 4 },
      { id: 'supps_other', label: "Anything else you take — prescription, OTC, herbal, tea, tincture — that's not on either list?", type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'diet',
    title: 'What a typical day of eating looks like',
    intro:
      "Your BUN of 5 (low) tells me you're under-eating protein. Your fasting glucose of 109 tells me carbs are doing some work. I want to see the actual day before I assume.",
    fields: [
      { id: 'breakfast', label: "Breakfast — what + roughly when?", type: 'textarea', rows: 2 },
      { id: 'lunch', label: "Lunch — what + when?", type: 'textarea', rows: 2 },
      { id: 'dinner', label: "Dinner — what + when?", type: 'textarea', rows: 2 },
      { id: 'snacks', label: "Snacks between meals — what + how often?", type: 'textarea', rows: 2 },
      { id: 'water', label: "Water intake — how many glasses (or bottles) per day?", type: 'text' },
      { id: 'coffee_tea', label: "Coffee, tea, or any caffeinated drinks — how many cups, when, with what?", type: 'textarea', rows: 2 },
      { id: 'alcohol', label: "Alcohol — type, frequency, how many drinks at a sitting?", type: 'textarea', rows: 2, required: true, helper: "Honest answer matters. Alcohol is a top driver of gastritis and rapid emptying." },
      { id: 'sugar_sweets', label: "Sweets, soda, juice, desserts — frequency?", type: 'textarea', rows: 2 },
      { id: 'gluten_dairy', label: "Any foods you suspect bother you? (gluten, dairy, spicy, fried, raw veg)", type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle + stress',
    intro:
      "The cortisol corner of the BP Triangle lives here. The hospital workup didn't ask about any of this. I will.",
    fields: [
      { id: 'movement', label: "Movement: walking, gym, yoga, gardening — what does a typical week look like?", type: 'textarea', rows: 3 },
      { id: 'stress_now', label: "On a 1-10 scale, how stressed have you felt the last 3 months? What's driving it?", type: 'textarea', rows: 3 },
      { id: 'stress_signal', label: "Where does your body carry stress? (chest tightness, jaw, stomach, headache, sleep loss)", type: 'textarea', rows: 2 },
      { id: 'sun_time', label: "How much time outside / in direct sunlight per day?", type: 'text' },
      { id: 'home', label: "Who do you live with? Caregiver responsibilities?", type: 'textarea', rows: 2 },
      { id: 'work', label: "Working currently? Doing what? Retired?", type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'family_hx',
    title: 'Family history (just the big ones)',
    intro:
      "Quick yes/no flags — what runs in your family on either side.",
    fields: [
      { id: 'fam_htn', label: "High blood pressure?", type: 'textarea', rows: 2 },
      { id: 'fam_diabetes', label: "Type 2 diabetes or pre-diabetes?", type: 'textarea', rows: 2 },
      { id: 'fam_cardiac', label: "Heart attack, stroke, or sudden cardiac death? At what age?", type: 'textarea', rows: 2 },
      { id: 'fam_cancer', label: "Cancer — what kinds, who, at what age?", type: 'textarea', rows: 2 },
      { id: 'fam_autoimmune', label: "Autoimmune anything? (thyroid, lupus, RA, celiac, Hashimoto's)", type: 'textarea', rows: 2 },
      { id: 'fam_gi', label: "GI issues? (Crohn's, ulcerative colitis, colon cancer, stomach problems)", type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'history',
    title: 'A few personal-history checks',
    intro:
      "Things the Orlando workup either didn't capture or that I need to hear from you directly.",
    fields: [
      { id: 'pcp_status', label: "Your chart literally says 'PCP: None.' Do you have a primary care doctor at the moment? If yes — who, where, how long since you saw them?", type: 'textarea', rows: 3, required: true },
      { id: 'asa_grade_iii', label: "Anesthesia at the hospital marked you as 'ASA Grade III — severe systemic disease.' Do you know what they were referring to?", type: 'textarea', rows: 3 },
      { id: 'menopause', label: "When was menopause? Any hormone replacement therapy, now or in the past?", type: 'textarea', rows: 2 },
      { id: 'surgeries', label: "Major surgeries (anything other than the December scopes)?", type: 'textarea', rows: 2 },
      { id: 'allergies', label: "Drug or food allergies / sensitivities?", type: 'textarea', rows: 2 },
      { id: 'smoke_vape', label: "Smoking / vaping — ever, now, when did you quit?", type: 'text' },
    ],
  },
  {
    id: 'goals',
    title: 'Your goals',
    intro:
      "This is what I'll be working backwards from when we talk tomorrow.",
    fields: [
      { id: 'why_now', label: "Why now? What flipped the switch on getting serious about this?", type: 'textarea', rows: 4, required: true },
      { id: 'top_3_goals', label: "Top 3 things you want to be true 90 days from today.", type: 'textarea', rows: 4, required: true },
      { id: 'biggest_fear', label: "What are you most afraid of if you DON'T get this dialed in?", type: 'textarea', rows: 3 },
      { id: 'past_attempts', label: "What have you tried before that didn't stick? Why didn't it stick?", type: 'textarea', rows: 4 },
      { id: 'support_at_home', label: "Who at home is on your team for this — and who isn't?", type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'questions_for_joel',
    title: 'Your questions for me',
    intro:
      "Last one. What do you want me to be ready to answer when we get on Zoom?",
    fields: [
      { id: 'questions_for_joel', label: "List as many or as few as you want. The more honest, the better the call.", type: 'textarea', rows: 6 },
      { id: 'preferred_followup', label: "If I had to follow up with you after the call, would you prefer email, text, or phone?", type: 'text' },
    ],
  },
];

const REQUIRED_FIELDS = SECTIONS.flatMap((s) => s.fields.filter((f) => f.required).map((f) => f.id));

// ---------- styling helpers ----------
const PAPER = '#FBF8F1';
const INK = '#2C2A26';
const INK_SOFT = '#5B564C';
const MUTED = '#9C9485';
const SAGE_DEEP = '#3F5A3C';
const SAGE_SOFT = '#E6EBE0';
const CLAY = '#B85A36';
const CLAY_SOFT = '#F5E4DA';
const BORDER = '#E6DECE';

// ---------- the page ----------
export default function WakitaIntakePage() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const setAns = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const missingRequired = useMemo(
    () => REQUIRED_FIELDS.filter((id) => !String(answers[id] || '').trim()),
    [answers]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (missingRequired.length > 0) {
      setError(`A few required fields are still blank. Scroll up — they're marked in clay.`);
      const firstMissing = document.getElementById(`field-${missingRequired[0]}`);
      if (firstMissing) firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/wakita-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Submit failed (${r.status})`);
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not submit. Try again, or reply to Joel directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: PAPER, display: 'grid', placeItems: 'center', padding: '3rem 1.5rem', color: INK }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 560, textAlign: 'center' }}
        >
          <div style={{ width: 64, height: 64, margin: '0 auto 1.5rem', borderRadius: '50%', background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, display: 'grid', placeItems: 'center' }}>
            <Check size={28} color={SAGE_DEEP} />
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 1rem', lineHeight: 1.2 }}>Got it, Wakita.</h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
            Your intake just landed in my inbox. I'll read every word tonight so when we hop on Zoom tomorrow at noon, we're using the time on <em>your</em> situation — not catching me up.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            See you tomorrow.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: INK, margin: 0 }}>— Joel Polley, RN</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: PAPER, color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
      {/* Header / personal note from Joel */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: '#FFFDF7' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="64"
                height="64"
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BORDER}` }}
              />
            </picture>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: CLAY, fontWeight: 600 }}>
                Pre-call intake — for Wakita
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: 2 }}>Joel Polley, RN — BraveWorks</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
            Hi Wakita — I've read your file.
          </h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            All of it. The Orlando Health workup from late December (the EGD, the EUS, the MRI, the HIDA, the colonoscopy, the gastric emptying study, all the tumor markers). The Mexico ultrasound from April. The Bio Life nano scan from May 10. The supplement list. The photo of the bottles on your kitchen table.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            Before we talk tomorrow at noon, I want to know what those reports <em>don't</em> tell me — what your body is doing right now, what's still scaring you, and what you actually want the next 90 days to look like.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            Take your time. You can fill in what you want and skip what you don't — only a few questions are required (marked with a <span style={{ color: CLAY, fontWeight: 600 }}>·</span>). Hit Submit at the bottom when you're done.
          </p>
          <div style={{ background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.9rem', color: SAGE_DEEP, lineHeight: 1.5 }}>
            <strong>About 15–20 minutes.</strong> Mobile or desktop — both work. No login. Your answers go straight to me.
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {SECTIONS.map((section, sIdx) => (
          <section key={section.id} style={{ marginBottom: '2.5rem', paddingTop: sIdx === 0 ? 0 : '1rem', borderTop: sIdx === 0 ? 'none' : `1px solid ${BORDER}` }}>
            <div style={{ marginBottom: '1.25rem', marginTop: sIdx === 0 ? 0 : '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: MUTED, fontWeight: 600, marginBottom: 6 }}>
                Section {sIdx + 1} of {SECTIONS.length}
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', margin: '0 0 0.5rem', color: INK }}>{section.title}</h2>
              {section.intro && <p style={{ color: INK_SOFT, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{section.intro}</p>}
            </div>

            {section.fields.map((f) => (
              <Field
                key={f.id}
                field={f}
                value={answers[f.id] || ''}
                onChange={(v) => setAns(f.id, v)}
                missing={f.required && !String(answers[f.id] || '').trim() && error}
              />
            ))}
          </section>
        ))}

        {/* Submit bar */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#FFFDF7', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: CLAY_SOFT, border: `1px solid ${CLAY}`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: CLAY }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{error}</div>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'block', width: '100%', padding: '1rem 1.5rem',
              background: submitting ? MUTED : SAGE_DEEP, color: '#FBF8F1',
              border: 'none', borderRadius: 10, fontSize: '1.05rem', fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer', letterSpacing: '0.02em',
              transition: 'background 0.2s ease',
            }}
          >
            {submitting ? 'Sending to Joel…' : 'Submit intake to Joel'}
          </button>
          <p style={{ fontSize: '0.82rem', color: MUTED, textAlign: 'center', margin: '0.75rem 0 0' }}>
            Your responses go directly to Joel Polley, RN. Not shared with anyone else.
          </p>
        </div>
      </form>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '1.5rem', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>
        BraveWorks RN · Joel Polley, RN · braveworksrn@gmail.com
      </footer>
    </main>
  );
}

// ---------- field component ----------
function Field({ field, value, onChange, missing }) {
  const id = `field-${field.id}`;
  const labelStyle = {
    display: 'block', fontSize: '0.95rem', fontWeight: 600, color: INK,
    marginBottom: 6, lineHeight: 1.4,
  };
  const helperStyle = {
    fontSize: '0.82rem', color: MUTED, margin: '0 0 8px', lineHeight: 1.5,
  };
  const inputBase = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '0.7rem 0.85rem', fontSize: '0.95rem',
    background: '#FFFDF7',
    border: `1.5px solid ${missing ? CLAY : BORDER}`,
    borderRadius: 8, color: INK,
    fontFamily: 'inherit', lineHeight: 1.5,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    outline: 'none',
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor={id} style={labelStyle}>
        {field.label}
        {field.required && <span style={{ color: CLAY, marginLeft: 6 }}>·</span>}
      </label>
      {field.helper && <p style={helperStyle}>{field.helper}</p>}
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          placeholder={field.placeholder || ''}
          style={{ ...inputBase, resize: 'vertical', minHeight: 80 }}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          style={inputBase}
        />
      )}
    </div>
  );
}
