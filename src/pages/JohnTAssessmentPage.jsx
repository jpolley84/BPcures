// src/pages/JohnTAssessmentPage.jsx
//
// 30-day program assessment for John Treadwell (Stage 4 CKD, high BP).
// Built 2026-07-09 after the intake call with his daughter Berneita, who
// will complete this on his behalf. Discovery-level intake — not a
// treatment plan — that feeds Joel's day-by-day 30-day protocol build.
//
// Covers: kidney/medical history, a typical day of eating, all three
// Triangle corners (sodium, sugar, stress), habits/lifestyle, motivation +
// goals, ideology/readiness, and support/logistics. Mostly tap-the-answer
// per Joel's request — free text reserved only for medication names, exact
// records, and open-ended goals/fears where accuracy matters more than speed.
//
// Reachable at https://bpquiz.com/JohnT
// Same token-gating + email-Joel-with-PDF pattern as the Wakita intake.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Download } from 'lucide-react';

// ============================================================
// Field schema
// ============================================================

const SECTIONS = [
  {
    id: 'checkin',
    title: 'Quick check-in',
    intro: "Just the numbers, so Joel has a clean starting point.",
    fields: [
      { id: 'bp_recent', label: "John's most recent blood pressure reading", type: 'short_text', placeholder: 'e.g., 148/92', required: true },
      {
        id: 'bp_context',
        label: 'Where was that reading taken?',
        type: 'radio',
        options: ['At home, our own cuff', 'At a doctor visit', 'At dialysis / a clinic', "Not sure / can't recall"],
      },
      { id: 'weight', label: "John's current weight", type: 'short_text', placeholder: 'e.g., 172 lb' },
      {
        id: 'swelling',
        label: 'Any swelling or fluid retention?',
        type: 'radio',
        options: ['None noticed', 'Feet / ankles', 'Hands / face', 'Significant, all over', 'Not sure'],
        required: true,
      },
      {
        id: 'energy_level',
        label: "John's energy level lately",
        type: 'radio',
        options: ['Good most days', 'OK, tires by afternoon', 'Low most days', 'Very low / mostly resting', 'Varies a lot day to day'],
      },
      {
        id: 'appetite',
        label: 'Appetite',
        type: 'radio',
        options: ['Good — eats full meals', 'Picky / smaller portions', 'Poor — has to be encouraged', 'Very poor — skipping meals'],
      },
    ],
  },

  {
    id: 'medical',
    title: 'Kidney + medical history',
    intro:
      "The details here matter for what we can safely recommend. If you're not sure of something, click the closest answer and we'll confirm later.",
    fields: [
      {
        id: 'ckd_stage_confirmed',
        label: 'CKD stage status',
        type: 'radio',
        options: ['Stage 4 confirmed by his nephrologist', 'Told it was Stage 4 but not fully sure', 'Stage has changed recently', "Not sure of the exact stage"],
        required: true,
      },
      {
        id: 'dialysis_status',
        label: 'Dialysis status',
        type: 'radio',
        options: ['Not on dialysis', 'Dialysis being discussed by his doctor', 'Started dialysis recently', 'Declined dialysis so far', 'Not sure'],
        required: true,
      },
      {
        id: 'nephrologist_frequency',
        label: 'How often does he see his nephrologist?',
        type: 'radio',
        options: ['Monthly or more', 'Every few months', 'Once or twice a year', "Hasn't been in a while", 'Not sure'],
      },
      {
        id: 'original_cause',
        label: "What originally caused the kidney decline, as best you know?",
        type: 'radio',
        options: ['A ruptured blood vessel / vascular event', 'Long-term high blood pressure', 'Diabetes', 'Not sure', 'Something else'],
        required: true,
      },
      {
        id: 'imaging_available',
        label: 'Imaging or records from Emory',
        type: 'radio',
        options: ['Yes, we have copies', 'We can request them', 'Not sure how to get them', 'No'],
      },
      {
        id: 'other_conditions',
        label: 'Any other diagnosed conditions? (pick all that apply)',
        type: 'multi',
        options: ['Diabetes', 'Heart disease', 'Prior stroke', 'Gout', 'Anemia', 'None of these', 'Something else'],
      },
      {
        id: 'current_medications',
        label: 'Every medication he currently takes, with dose if you know it',
        type: 'textarea',
        rows: 4,
        placeholder: 'List each one on its own line — name + dose (e.g., "Lisinopril 20mg, once daily"). This is the one place exact detail really matters.',
        required: true,
      },
      {
        id: 'allergies',
        label: 'Any allergies or reactions we should know about?',
        type: 'textarea',
        rows: 2,
        placeholder: 'Medications, foods, herbs — anything. Type "none" if none.',
      },
    ],
  },

  {
    id: 'diet',
    title: 'A typical day of eating',
    intro: "Pick everything that's normal for him, not just yesterday.",
    fields: [
      {
        id: 'breakfast_foods',
        label: 'Breakfast — pick everything that shows up in a normal week',
        type: 'multi',
        options: ['Skips breakfast', 'Coffee or tea only', 'Toast / biscuit / cereal', 'Oatmeal or grits', 'Eggs', 'Bacon / sausage / ham', 'Fruit', 'Leftovers'],
        required: true,
      },
      {
        id: 'lunch_foods',
        label: 'Lunch — pick everything that shows up in a normal week',
        type: 'multi',
        options: ['Sandwich', 'Soup', 'Leftovers', 'Meat + veg + starch', 'Salad', 'Fast food / takeout', 'Just a snack', 'Skips lunch'],
        required: true,
      },
      {
        id: 'dinner_foods',
        label: 'Dinner — pick everything that shows up in a normal week',
        type: 'multi',
        options: ['Chicken + veg + starch', 'Fish or seafood', 'Beef', 'Pork', 'Pasta', 'Rice + beans / rice + protein', 'Soup or stew', 'Vegetable-forward meal, little or no meat', 'Eats out / takeout'],
        required: true,
      },
      {
        id: 'snacks',
        label: "Snacks between meals (pick all that apply)",
        type: 'multi',
        options: ["Doesn't really snack", 'Fruit', 'Nuts / seeds', 'Crackers / chips', 'Cheese', 'Cookies / sweets', 'Ice cream'],
      },
      {
        id: 'protein_sources',
        label: 'Main protein sources most days (pick all)',
        type: 'multi',
        options: ['Chicken', 'Beef', 'Pork', 'Fish', 'Eggs', 'Beans / legumes', 'Dairy (cheese, milk)', 'Not much protein at all'],
      },
      {
        id: 'salt_shaker_use',
        label: 'Salt shaker at the table',
        type: 'radio',
        options: ['Uses it on most meals', 'Uses it sometimes', "Rarely / doesn't use it", 'Already avoiding added salt'],
      },
      {
        id: 'fluid_intake',
        label: 'General fluid intake pattern',
        type: 'radio',
        options: ['Drinks freely all day', 'Moderate, spread through the day', 'Limited — doctor has restricted fluids', 'Not sure how much he drinks'],
      },
      {
        id: 'water_glasses',
        label: 'Glasses of plain water per day (roughly)',
        type: 'radio',
        options: ['Fewer than 2', '2–4', '4–6', '6–8', 'More than 8'],
      },
    ],
  },

  {
    id: 'sodium',
    title: 'Sodium corner',
    intro: "The sodium that drives blood pressure comes far more from packaged food than the salt shaker.",
    fields: [
      {
        id: 'processed_food_freq',
        label: 'Processed or packaged food (frozen meals, boxed sides, deli meat, chips)',
        type: 'radio',
        options: ['Rarely', '1–2 times a week', '3–5 times a week', 'Daily', 'Multiple times a day'],
        required: true,
      },
      {
        id: 'canned_foods_freq',
        label: 'Canned foods (soups, vegetables, beans)',
        type: 'radio',
        options: ['Rarely', '1–2 times a week', '3–5 times a week', 'Most days'],
      },
      {
        id: 'fast_food_freq',
        label: 'Fast food or restaurant food',
        type: 'radio',
        options: ['Never / cooks at home', 'Once a month', 'Once a week', '2–3 times a week', 'Most meals'],
      },
      {
        id: 'reads_labels',
        label: 'Reads nutrition labels for sodium content',
        type: 'radio',
        options: ['Always', 'Sometimes', 'Never', "Didn't know to look"],
      },
      {
        id: 'hidden_sodium_awareness',
        label: 'Awareness that bread, cereal, and canned goods often carry more sodium than people realize',
        type: 'radio',
        options: ['Already aware of this', 'Somewhat aware', 'Not aware at all'],
      },
    ],
  },

  {
    id: 'sugar',
    title: 'Sugar corner',
    intro: "Quick taps.",
    fields: [
      {
        id: 'sweets_freq',
        label: 'Sweets / desserts',
        type: 'radio',
        options: ['Rarely', '1–2 times a week', '3–5 times a week', 'Daily', 'Multiple times a day'],
        required: true,
      },
      {
        id: 'sugary_drinks_freq',
        label: 'Sugary drinks (soda, sweet tea, juice)',
        type: 'radio',
        options: ['Rarely / never', '1–2 times a week', '3–5 times a week', 'Daily'],
      },
      {
        id: 'blood_sugar_history',
        label: 'Blood sugar history',
        type: 'radio',
        options: ['Diagnosed diabetic', 'Prediabetic / borderline', 'Normal, as far as we know', 'Not sure — never checked'],
      },
    ],
  },

  {
    id: 'stress',
    title: 'Stress corner',
    intro:
      "Grief and life changes carry real physical weight, even when they happened years ago. This section is confidential — it goes to Joel only.",
    fields: [
      {
        id: 'major_life_changes',
        label: 'Major life changes or losses in the last several years (pick all that apply)',
        type: 'multi',
        options: ['Loss of a spouse', 'Loss of another close family member', 'Retirement', 'Major health decline', 'Financial stress', 'Moving / loss of home', 'Loss of independence', 'None of these'],
        required: true,
      },
      {
        id: 'grief_processing',
        label: 'How has that grief generally been processed?',
        type: 'radio',
        options: ['Talked through it with family or a pastor', 'Mostly kept it inside', "Still very raw / hasn't been processed", 'Not sure', 'Not applicable'],
      },
      {
        id: 'stress_level',
        label: 'His stress level lately, 1 (calm) to 10 (constantly overwhelmed)',
        type: 'radio',
        options: ['1–2 (calm)', '3–4 (low-medium)', '5–6 (medium)', '7–8 (high)', '9–10 (overwhelmed)'],
        required: true,
      },
      {
        id: 'sleep_quality',
        label: 'Sleep quality',
        type: 'radio',
        options: ['Good, restful', 'OK, some rough nights', 'Poor, restless most nights', "Doesn't sleep well at all"],
      },
      {
        id: 'stress_outlets',
        label: 'What does he lean on when stress is high? (pick all)',
        type: 'multi',
        options: ['Prayer / scripture', 'Talking to family', 'Time outside', 'Watching TV', 'Keeps it to himself', 'Eating', 'Nothing in particular'],
      },
      {
        id: 'spiritual_practice',
        label: 'Spiritual practice (pick all that apply)',
        type: 'multi',
        options: ['Personal prayer', 'Scripture reading', 'Church attendance', 'Worship music / hymns', 'None right now'],
      },
    ],
  },

  {
    id: 'habits',
    title: 'Habits + lifestyle',
    intro: "Quick taps.",
    fields: [
      {
        id: 'movement_daily',
        label: 'Movement / activity level',
        type: 'radio',
        options: ['Mostly sedentary', 'Short walks sometimes', 'Walks most days', 'Regular activity most days'],
        required: true,
      },
      {
        id: 'mobility_limitations',
        label: 'Mobility limitations',
        type: 'radio',
        options: ['None', 'Some — moves slower, tires easily', 'Significant — needs help getting around', 'Uses a walker or wheelchair'],
      },
      {
        id: 'sun_exposure',
        label: 'Time outside in direct sunlight most days',
        type: 'radio',
        options: ['Very little — mostly indoors', '10–20 minutes', '20–40 minutes', 'More than 40 minutes'],
      },
      {
        id: 'smoking_status',
        label: 'Smoking status',
        type: 'radio',
        options: ['Never smoked', 'Former smoker, quit', 'Currently smokes'],
      },
      {
        id: 'alcohol_use',
        label: 'Alcohol use',
        type: 'radio',
        options: ['None', 'Rare / special occasions', 'A drink or two a week', 'Most days'],
      },
    ],
  },

  {
    id: 'motivation',
    title: 'Motivation + goals',
    intro:
      "What does John actually want out of this? Steep goals are fine to name honestly here — that's exactly what this section is for.",
    fields: [
      {
        id: 'primary_goal',
        label: 'What does he want most out of this program? (pick all that genuinely apply)',
        type: 'multi',
        options: ['Real healing for his kidneys', 'Avoid needing dialysis', 'Live another 20 years', 'Companionship / possibly remarry', 'Be there for his family, long-term', 'Get off some medications', 'More daily energy', "Just wants to feel like himself again"],
        required: true,
      },
      {
        id: 'motivation_level',
        label: "John's motivation to actually make changes, 1 (low) to 10 (all-in)",
        type: 'radio',
        options: ['1–2', '3–4', '5–6', '7–8', '9–10'],
        required: true,
      },
      {
        id: 'past_attempts',
        label: 'What has he already tried, health-wise, before this?',
        type: 'textarea',
        rows: 3,
        placeholder: 'Diets, supplements, doctors, anything. A sentence or two is fine.',
      },
      {
        id: 'biggest_fear',
        label: "What's his biggest fear or worry about his health right now?",
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'support_system',
        label: 'Who is actively supporting him through this? (pick all)',
        type: 'multi',
        options: ['Berneita (daughter)', 'Other family', 'Church community', 'Friends', "Doesn't have much support right now"],
      },
    ],
  },

  {
    id: 'ideology',
    title: 'Ideology + readiness',
    intro: "Where he's starting from, honestly.",
    fields: [
      {
        id: 'openness_to_plantbased',
        label: 'Openness to eating a mostly plant-based way (more vegetables, less meat)',
        type: 'radio',
        options: ['Already leaning that way', 'Open to it, would need guidance', 'Hesitant but willing to try', 'Resistant — meat and potatoes guy', 'Not sure yet'],
        required: true,
      },
      {
        id: 'faith_background',
        label: 'Faith background',
        type: 'radio',
        options: ['Christian, active in a church', 'Christian, not currently active', 'Some other faith background', 'No particular faith background', 'Prefer not to say'],
      },
      {
        id: 'willingness_scale',
        label: 'Overall readiness to make real day-to-day changes, 1 (not ready) to 10 (ready now)',
        type: 'radio',
        options: ['1–2', '3–4', '5–6', '7–8', '9–10'],
        required: true,
      },
      {
        id: 'biggest_obstacle',
        label: "Biggest obstacle standing in the way",
        type: 'radio',
        options: ['Cost', 'Needs help cooking / meal prep', 'Transportation', 'Motivation / follow-through', 'Family not on board', "Doesn't fully understand what to do yet", 'Physical limitations'],
      },
    ],
  },

  {
    id: 'logistics',
    title: 'Support + logistics',
    intro: "Last section.",
    fields: [
      {
        id: 'who_completing_this',
        label: 'Who is filling this out?',
        type: 'radio',
        options: ['Berneita, on his behalf', 'John himself', 'Filled out together'],
        required: true,
      },
      {
        id: 'caregiver_role',
        label: "Berneita's day-to-day role in his care",
        type: 'radio',
        options: ['Primary caregiver — handles most of it', 'Helps with doctors and logistics, lives separately', 'Checks in regularly but not day-to-day', 'Other family member is primary, she supports'],
      },
      {
        id: 'best_contact_method',
        label: 'Best way to reach the family with updates',
        type: 'radio',
        options: ['Email', 'Text', 'Phone call', 'Whatever is easiest'],
      },
      {
        id: 'best_contact_time',
        label: 'Best time of day to reach out',
        type: 'radio',
        options: ['Morning', 'Afternoon', 'Evening', 'Whatever works'],
      },
      {
        id: 'anything_else',
        label: 'Anything else Joel should know before building the 30-day plan?',
        type: 'textarea',
        rows: 4,
      },
    ],
  },
];

const REQUIRED_FIELDS = SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.required).map((f) => f.id)
);

// ============================================================
// Palette + styling helpers
// ============================================================
const PAPER = '#FBF8F1';
const PAPER_LIGHT = '#FFFDF7';
const INK = '#2C2A26';
const INK_SOFT = '#5B564C';
const MUTED = '#9C9485';
const SAGE_DEEP = '#3F5A3C';
const SAGE_SOFT = '#E6EBE0';
const CLAY = '#B85A36';
const CLAY_SOFT = '#F5E4DA';
const BORDER = '#E6DECE';
const SELECTED_BG = '#E6EBE0';
const SELECTED_BORDER = '#3F5A3C';

// ============================================================
// The page
// ============================================================
export default function JohnTAssessmentPage() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);
  const [error, setError] = useState('');

  const accessToken = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') || '';
  }, []);

  const setAns = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const missingRequired = useMemo(() => {
    return REQUIRED_FIELDS.filter((id) => {
      const v = answers[id];
      if (Array.isArray(v)) return v.length === 0;
      return !String(v || '').trim();
    });
  }, [answers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (missingRequired.length > 0) {
      setError("A few required questions are still blank. Scroll up — they're flagged in clay.");
      const el = document.getElementById(`field-${missingRequired[0]}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/johnt-assessment?token=' + encodeURIComponent(accessToken), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Submit failed (${r.status})`);
      }
      const data = await r.json();
      setAssessmentId(data.assessmentId || null);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not submit. Try again or text Joel directly.');
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
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 1rem', lineHeight: 1.2 }}>Got it, thank you.</h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            This just landed in Joel's inbox. He'll read every answer before building John's 30-day plan.
          </p>

          {assessmentId && (
            <a
              href={`/api/johnt-assessment-pdf?id=${encodeURIComponent(assessmentId)}&token=${encodeURIComponent(accessToken)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '0.85rem 1.5rem', marginBottom: '1.25rem',
                background: SAGE_DEEP, color: PAPER_LIGHT,
                borderRadius: 10, textDecoration: 'none',
                fontSize: '0.98rem', fontWeight: 600,
              }}
            >
              <Download size={18} />
              Download a copy (PDF)
            </a>
          )}

          <p style={{ color: MUTED, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            Save the PDF if you'd like a clean copy of everything you just submitted.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: INK, margin: 0 }}>— Joel Polley, RN</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: PAPER, color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: PAPER_LIGHT }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img src="/headshot.jpg" alt="Joel Polley, RN" width="64" height="64"
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BORDER}` }} />
            </picture>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: CLAY, fontWeight: 600 }}>
                30-day program assessment — for John Treadwell
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: 2 }}>Joel Polley, RN — BraveWorks</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
            Hi Berneita — this is the assessment I mentioned.
          </h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            Before I build John's day-by-day plan, I want a real picture of his kidney history, what he actually eats, his stress and sodium and sugar patterns, and — just as important — what he's genuinely motivated to change. Answer for him as best you can; where you're not sure, there's a "not sure" option.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            About <strong>10–15 minutes</strong>. Almost all tap-the-answer — only a handful of typing questions, and those are the ones where exact detail matters (his medications, for one). Required questions are flagged with a <span style={{ color: CLAY, fontWeight: 600 }}>·</span>.
          </p>
          <div style={{ background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.9rem', color: SAGE_DEEP, lineHeight: 1.5 }}>
            <strong>Confidential.</strong> This goes directly to Joel. This is a discovery assessment, not a diagnosis or a substitute for John's nephrologist — we work alongside his doctors, never around them.
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {SECTIONS.map((section, sIdx) => (
          <section key={section.id} style={{ marginBottom: '2rem', paddingTop: sIdx === 0 ? 0 : '1.5rem', borderTop: sIdx === 0 ? 'none' : `1px solid ${BORDER}` }}>
            <div style={{ marginBottom: '1.25rem', marginTop: sIdx === 0 ? 0 : '0.5rem' }}>
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
                value={answers[f.id]}
                onChange={(v) => setAns(f.id, v)}
                showMissing={Boolean(error) && f.required && (
                  Array.isArray(answers[f.id]) ? answers[f.id].length === 0 : !String(answers[f.id] || '').trim()
                )}
              />
            ))}
          </section>
        ))}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: PAPER_LIGHT, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
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
              background: submitting ? MUTED : SAGE_DEEP, color: PAPER_LIGHT,
              border: 'none', borderRadius: 10, fontSize: '1.05rem', fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer', letterSpacing: '0.02em',
              transition: 'background 0.2s ease',
            }}
          >
            {submitting ? 'Sending to Joel…' : 'Submit assessment to Joel'}
          </button>
          <p style={{ fontSize: '0.82rem', color: MUTED, textAlign: 'center', margin: '0.75rem 0 0' }}>
            Goes directly to Joel Polley, RN. Not shared with anyone else.
          </p>
        </div>
      </form>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '1.5rem', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>
        BraveWorks RN · Joel Polley, RN · braveworksrn@gmail.com
      </footer>
    </main>
  );
}

// ============================================================
// Field renderer
// ============================================================
function Field({ field, value, onChange, showMissing }) {
  const id = `field-${field.id}`;
  const labelStyle = {
    display: 'block', fontSize: '0.97rem', fontWeight: 600, color: INK,
    marginBottom: 8, lineHeight: 1.4,
  };
  const wrapperStyle = {
    marginBottom: '1.5rem',
    padding: showMissing ? '0.75rem' : 0,
    background: showMissing ? CLAY_SOFT : 'transparent',
    borderRadius: showMissing ? 8 : 0,
    border: showMissing ? `1px solid ${CLAY}` : 'none',
  };

  return (
    <div id={id} style={wrapperStyle}>
      <label style={labelStyle}>
        {field.label}
        {field.required && <span style={{ color: CLAY, marginLeft: 6 }}>·</span>}
      </label>

      {field.type === 'radio' && (
        <RadioGroup options={field.options} value={value} onChange={onChange} />
      )}
      {field.type === 'multi' && (
        <MultiSelect options={field.options} value={value || []} onChange={onChange} />
      )}
      {field.type === 'short_text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '0.7rem 0.85rem', fontSize: '1rem',
            background: PAPER_LIGHT, border: `1.5px solid ${BORDER}`,
            borderRadius: 8, color: INK, fontFamily: 'inherit', outline: 'none',
            maxWidth: 320,
          }}
        />
      )}
      {field.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={field.rows || 3}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '0.7rem 0.85rem', fontSize: '0.95rem',
            background: PAPER_LIGHT, border: `1.5px solid ${BORDER}`,
            borderRadius: 8, color: INK, fontFamily: 'inherit', lineHeight: 1.5,
            resize: 'vertical', minHeight: 80, outline: 'none',
          }}
        />
      )}
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              textAlign: 'left',
              padding: '0.7rem 0.9rem',
              background: selected ? SELECTED_BG : PAPER_LIGHT,
              border: `1.5px solid ${selected ? SELECTED_BORDER : BORDER}`,
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: selected ? 600 : 400,
              color: INK,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.12s ease, border-color 0.12s ease',
            }}
          >
            <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? SELECTED_BORDER : BORDER}`, background: selected ? SELECTED_BORDER : 'transparent', marginRight: 10, verticalAlign: '-4px' }} />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelect({ options, value, onChange }) {
  const toggle = (opt) => {
    const set = new Set(value);
    if (set.has(opt)) set.delete(opt); else set.add(opt);
    onChange(Array.from(set));
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '0.55rem 0.85rem',
              background: selected ? SELECTED_BG : PAPER_LIGHT,
              border: `1.5px solid ${selected ? SELECTED_BORDER : BORDER}`,
              borderRadius: 999,
              fontSize: '0.9rem',
              fontWeight: selected ? 600 : 400,
              color: INK,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.12s ease, border-color 0.12s ease',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {selected && <Check size={14} color={SELECTED_BORDER} strokeWidth={3} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
