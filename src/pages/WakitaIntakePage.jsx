// src/pages/WakitaIntakePage.jsx
//
// Personalized pre-call intake for Wakita Cirillo Browne ahead of her
// 2026-05-13 12:00 PM coaching call with Joel Polley, RN.
//
// Reachable at:
//   - https://wakita.bpquiz.com (subdomain — see App.jsx SUBDOMAIN_PAGE map)
//   - https://bpquiz.com/wakita (fallback path, always works)
//
// Built from her chart: Orlando Health Dec 23 2025 – Jan 3 2026 (EGD/EUS/
// MRI/HIDA/CT/colonoscopy/tumor markers/gastric emptying), Mexico Bio Life
// nano scan 2026-05-10, and her hand-written supplement list.
//
// Click-driven: 90%+ of questions are radio buttons or multi-select chips
// so a 60-year-old can finish in <10 minutes without thumb fatigue. Free
// text reserved for numbers (BP, weight) and 3 questions where it matters.
//
// Posts answers to /api/wakita-intake. KV-stored; emails Joel a structured
// summary + a branded PDF attachment. Both Joel and Wakita can download
// the PDF after submit via /api/wakita-intake-pdf?id=<intakeId>.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Download } from 'lucide-react';

// ============================================================
// Field schema — almost entirely click-driven.
// Field types:
//   radio       — single-choice, value = string
//   multi       — multi-select chips, value = array of strings
//   short_text  — small input for numbers (BP, weight, height)
//   textarea    — free text (only where the answer can't be canned)
// ============================================================

const SECTIONS = [
  // ──────────────────────────────────────────────────────────
  {
    id: 'vitals',
    title: 'Quick vitals',
    intro:
      "Three numbers that anchor everything. None of these are in your Orlando chart.",
    fields: [
      { id: 'bp_recent', label: 'Your most recent home BP reading', type: 'short_text', placeholder: 'e.g., 138/86', required: true },
      {
        id: 'bp_typical',
        label: "What does your BP usually run?",
        type: 'radio',
        options: [
          'Always under 130/80',
          '120s–130s / 70s–80s',
          '130s–140s / 80s–90s',
          '140s–150s / 80s–95s',
          '150s+ / 90s+',
          "I don't really track it",
        ],
      },
      {
        id: 'bp_meds',
        label: 'Any prescription blood-pressure medications right now?',
        type: 'radio',
        options: ['None', '1 medication', '2 medications', '3 or more', 'I just stopped one'],
      },
      { id: 'bp_meds_names', label: 'If yes — what are they (just names if you remember)?', type: 'short_text', placeholder: 'optional' },
      { id: 'weight', label: 'Current weight', type: 'short_text', placeholder: 'e.g., 168 lb' },
      { id: 'height', label: 'Height', type: 'short_text', placeholder: "e.g., 5'5\"" },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'symptoms_now',
    title: 'How you feel right now',
    intro:
      "December's workup found mild gastritis, a benign liver hemangioma, a calcified fibroid, and rapid gastric emptying. Tell me what your body is actually doing today.",
    fields: [
      {
        id: 'pain_status',
        label: 'The abdominal pain that started this workup — where is it now?',
        type: 'radio',
        options: ['Completely gone', 'A lot better', 'About the same', 'Worse', 'Comes and goes'],
      },
      {
        id: 'pain_triggers',
        label: 'When pain shows up, what triggers it? (pick all that apply)',
        type: 'multi',
        options: ['After eating', 'On an empty stomach', 'Certain foods', 'Stress', 'Lying down', 'No clear pattern'],
      },
      {
        id: 'pain_quality',
        label: 'What does the pain feel like? (pick all that apply)',
        type: 'multi',
        options: ['Burning', 'Gnawing', 'Sharp / stabbing', 'Pressure / heavy', 'Fullness / bloated', 'Cramping'],
      },
      {
        id: 'melena_when',
        label: 'Black tarry stools (melena) — when was the last episode?',
        type: 'radio',
        options: ["Never had it", 'Once, before December', 'During the December workup', 'Within the last month', 'This week or yesterday'],
      },
      {
        id: 'reflux',
        label: 'Heartburn, acid reflux, sour taste — how often?',
        type: 'radio',
        options: ['Never', 'Less than weekly', '1–3 times a week', 'Daily', 'Multiple times a day'],
      },
      {
        id: 'bloating',
        label: 'Bloating, gas, fullness after meals?',
        type: 'radio',
        options: ['Never', 'Occasionally', 'After most meals', 'All day, every day'],
      },
      {
        id: 'bowels_freq',
        label: 'How often do you have a bowel movement?',
        type: 'radio',
        options: ['Multiple times a day', 'Once a day', 'Every other day', '2–3 times a week', 'Less than weekly'],
      },
      {
        id: 'bowels_form',
        label: 'When you do go — what does it usually look like? (pick all that apply)',
        type: 'multi',
        options: ['Hard pellets', 'Formed and easy', 'Soft / loose', 'Urgent / runny', 'Varies a lot'],
      },
      {
        id: 'straining',
        label: 'Do you strain to go?',
        type: 'radio',
        options: ['Never', 'Sometimes', 'Most days', 'Every time'],
      },
      {
        id: 'energy',
        label: 'Energy through the day looks like…',
        type: 'radio',
        options: ['Steady all day', 'Strong morning, crash afternoon', 'Slow morning, better later', 'Tired most of the day', 'Up and down — unpredictable'],
      },
      {
        id: 'sleep_hours',
        label: 'Average hours of sleep per night',
        type: 'radio',
        options: ['Less than 5', '5–6', '6–7', '7–8', 'More than 8'],
      },
      {
        id: 'sleep_wakes',
        label: 'Do you wake up during the night?',
        type: 'radio',
        options: ['Sleep through', 'Wake 1×', 'Wake 2–3×', 'Wake 4+ times', "Often can't get back to sleep"],
      },
      {
        id: 'snoring',
        label: 'Snoring or breathing pauses at night?',
        type: 'radio',
        options: ['No / partner says no', 'Some snoring', 'Loud snoring', 'Diagnosed sleep apnea (on CPAP or other)', "Don't know"],
      },
      {
        id: 'mood',
        label: 'In the last 3 months you have felt… (pick all that apply)',
        type: 'multi',
        options: ['Mostly fine', 'Anxious', 'Sad / low', 'Irritable', 'Foggy / forgetful', 'Lonely', 'Overwhelmed'],
      },
      {
        id: 'other_symptoms',
        label: 'Anything else bothering you? (pick all that apply)',
        type: 'multi',
        options: ['Joint pain', 'Headaches', 'Skin issues', 'Vision changes', 'Hair loss / thinning', 'Hot flashes', 'Cold hands / feet', 'Numbness / tingling', 'None of these'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'meds',
    title: 'Medications from the hospital',
    intro:
      'On 12/31 you walked out with 5 prescriptions. Tell me what you actually took — no judgment.',
    fields: [
      {
        id: 'ppi_status',
        label: 'Pantoprazole 40 mg twice a day (Protonix) — what are you doing with it?',
        type: 'radio',
        options: ['Taking both doses as prescribed', 'Taking 1× a day', 'Stopped taking it', 'Never started it', 'Take it sometimes'],
        required: true,
      },
      {
        id: 'ppi_side_effects',
        label: 'Any side effects from the Protonix? (pick all that apply)',
        type: 'multi',
        options: ['None', 'Headaches', 'Gas / bloating', 'Loose stools', 'Constipation', 'Brain fog', 'Joint aches'],
      },
      {
        id: 'bentyl_status',
        label: 'Dicyclomine 20 mg twice a day (Bentyl, 10-day course) — status?',
        type: 'radio',
        options: ['Finished the full 10 days', 'Still taking', 'Stopped early — side effects', 'Never started', "Don't remember"],
      },
      {
        id: 'nsaid_use_kinds',
        label: 'In the last year, which of these have you taken? (pick all that apply)',
        type: 'multi',
        options: ['Ibuprofen / Advil / Motrin', 'Aleve / naproxen', 'Aspirin (daily)', 'Aspirin (occasional)', 'Celebrex', 'Other prescription NSAID', "None of these"],
        required: true,
      },
      {
        id: 'nsaid_frequency',
        label: 'How often did you take them?',
        type: 'radio',
        options: ['Never', 'A few times the whole year', 'Once or twice a month', 'Weekly', 'Almost daily'],
      },
      {
        id: 'tylenol_freq',
        label: 'Tylenol (acetaminophen) — how often?',
        type: 'radio',
        options: ['Never', 'Occasionally', '1–3× per week', 'Daily', 'Multiple times a day'],
      },
      {
        id: 'benadryl_itching',
        label: 'You were prescribed Benadryl for itching — is the itching still happening?',
        type: 'radio',
        options: ["No itching anymore", 'A little, mild', 'Yes, regularly', 'Comes and goes', 'Never had itching'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'biolife',
    title: 'The Bio Life regimen from Mexico',
    intro:
      "Six bottles in your photo: Magnesium, Selenium Plus, Plant Protein, Hepa D-Tox, Curcumin Plus, Chaparro Amargo — plus a pink powder. Quick check-in.",
    fields: [
      {
        id: 'biolife_started',
        label: 'Have you started the Bio Life protocol?',
        type: 'radio',
        options: ['Not yet', 'Day 1 or 2', 'Day 3–5', 'Day 6–10', 'More than 10 days in'],
      },
      {
        id: 'biolife_response',
        label: 'Since starting Bio Life, you feel…',
        type: 'radio',
        options: ['Much better', 'A little better', 'About the same', 'A little worse', 'Haven\'t started yet'],
      },
      {
        id: 'biolife_side_effects',
        label: 'Any side effects from the Bio Life supplements? (pick all that apply)',
        type: 'multi',
        options: ['None so far', 'Looser stools', 'Nausea', 'Headache', 'More energy', 'Sleep changes', 'Other'],
      },
      {
        id: 'biolife_chaparro_reaction',
        label: 'The Chaparro Amargo (bitter herb taken with each meal) — your gut\'s reaction?',
        type: 'radio',
        options: ['No reaction at all', 'Mild stomach discomfort', 'Stronger bowel movements', 'Nausea', "Haven't started this one"],
      },
      { id: 'biolife_selenium_dose', label: 'If you can grab the Selenium Plus bottle — micrograms (mcg) per serving?', type: 'short_text', placeholder: 'e.g., 200 mcg per teaspoon' },
      { id: 'biolife_pink_powder', label: 'What\'s the pink powder? (label name)', type: 'short_text', placeholder: 'optional' },
      {
        id: 'mexico_findings_told',
        label: 'What did the Mexico clinic tell you they found? (pick all that apply)',
        type: 'multi',
        options: ['Liver hemangioma', 'Liver / hepatic cysts', 'Gallbladder dyskinesia / sluggish bile', 'Constipation / colon issues', 'Toxins / heavy metals', 'Parasites', 'Hormone imbalance', "Don't fully remember"],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'existing_supplements',
    title: 'Your existing supplement list',
    intro:
      "You sent me 18. Check the ones you're STILL taking daily. Anything you've already stopped, just leave unchecked.",
    fields: [
      {
        id: 'supps_still_taking',
        label: 'Which of these am I still taking? (check all that apply)',
        type: 'multi',
        options: [
          'Melatonin', 'Magnesium (separate from Bio Life)', 'Inositol', 'Vitamin C',
          "Women's multivitamin", 'Liposomal turmeric (separate from Bio Life)', 'SAMe', 'B6',
          'Potassium gluconate', '60 billion probiotic', 'Vitamin E', 'Areds 2 (eye)',
          'Calcium', 'Omega 3 EPA & DHA', 'Spirulina', 'Chlorella',
          'Irish Sea Moss', 'Moringa',
        ],
      },
      {
        id: 'supps_other',
        label: 'Anything ELSE you take that I don\'t already know about? (other prescriptions, herbs, teas)',
        type: 'textarea',
        rows: 3,
        placeholder: 'optional',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'diet',
    title: 'A typical day of eating',
    intro:
      "Your BUN of 5 told me you're under-eating protein. Glucose of 109 told me carbs are doing some work. Click through what a normal day looks like.",
    fields: [
      {
        id: 'breakfast',
        label: 'Breakfast usually is… (pick all that apply)',
        type: 'multi',
        options: ['Skip / coffee only', 'Toast or bread', 'Cereal', 'Eggs', 'Bio Life protein shake', 'Fruit', 'Oatmeal', 'Yogurt', 'Something heartier'],
      },
      {
        id: 'lunch',
        label: 'Lunch usually is…',
        type: 'multi',
        options: ['Salad', 'Sandwich', 'Leftovers', 'Soup', 'Fast food / takeout', 'Smoothie / shake', 'Light snack only'],
      },
      {
        id: 'dinner',
        label: 'Dinner usually is…',
        type: 'multi',
        options: ['Chicken or fish + sides', 'Beef or pork + sides', 'Pasta or rice based', 'Soup or stew', 'Vegetarian meal', 'Skip dinner', 'Eat out / takeout'],
      },
      {
        id: 'water',
        label: 'Glasses of water per day',
        type: 'radio',
        options: ['Fewer than 2', '2–4', '4–6', '6–8', 'More than 8'],
      },
      {
        id: 'coffee',
        label: 'Cups of coffee per day',
        type: 'radio',
        options: ['None', '1 cup', '2 cups', '3 cups', '4 or more'],
      },
      {
        id: 'alcohol',
        label: 'Alcohol — honest answer',
        type: 'radio',
        options: ['Never drink', 'Special occasions only', '1–2 drinks a week', '3–7 drinks a week', 'A drink most days'],
        required: true,
      },
      {
        id: 'sweets',
        label: 'Sweets, soda, juice, dessert — how often?',
        type: 'radio',
        options: ['Rarely', 'Once a week', 'A few times a week', 'Daily', 'Multiple times a day'],
      },
      {
        id: 'food_triggers',
        label: 'Any foods you\'re pretty sure bother you? (pick all that apply)',
        type: 'multi',
        options: ['Spicy', 'Fried', 'Gluten / bread / pasta', 'Dairy', 'Tomato / acidic', 'Coffee', 'Raw vegetables', 'Onion or garlic', 'Nothing I can pin down'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'lifestyle',
    title: 'Lifestyle + stress',
    intro:
      "The cortisol corner of the Triangle. Click through.",
    fields: [
      {
        id: 'movement',
        label: 'How active are you in a typical week?',
        type: 'radio',
        options: ['Mostly sedentary', 'Light walking 1–2× a week', 'Walk most days', 'Gym or class 1–3× a week', 'Active most days'],
      },
      {
        id: 'stress',
        label: 'On a 1–10 scale, your stress level the last 3 months has been…',
        type: 'radio',
        options: ['1–3 (low)', '4–5 (medium-low)', '6–7 (medium-high)', '8–9 (high)', '10 (constantly overwhelmed)'],
      },
      {
        id: 'stress_carries',
        label: 'Where does your body carry stress? (pick all that apply)',
        type: 'multi',
        options: ['Chest tightness', 'Jaw / teeth grinding', 'Stomach / gut', 'Shoulders / neck', 'Headache', 'Sleep loss', 'Skin breakouts', 'I shut down emotionally'],
      },
      {
        id: 'sun_time',
        label: 'Time outside / direct sunlight on a typical day',
        type: 'radio',
        options: ['Very little — mostly indoors', '15–30 min', '30–60 min', 'More than 1 hour'],
      },
      {
        id: 'caregiver',
        label: 'Caregiver responsibilities at home',
        type: 'multi',
        options: ['Just me — no caregiving', 'Spouse / partner', 'Aging parents', 'Adult children', 'Grandkids', 'Pet(s)'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'family_hx',
    title: 'Family history',
    intro: 'Quick taps — what runs in your family.',
    fields: [
      { id: 'fam_htn', label: 'High blood pressure in family', type: 'radio', options: ['No', 'Yes — parents or siblings', 'Yes — grandparents or aunts/uncles', "Don't know"] },
      { id: 'fam_diabetes', label: 'Type 2 diabetes or pre-diabetes', type: 'radio', options: ['No', 'Yes — parents or siblings', 'Yes — grandparents or aunts/uncles', "Don't know"] },
      { id: 'fam_cardiac', label: 'Heart attack, stroke, or sudden cardiac death', type: 'radio', options: ['No', 'Yes — before age 65', 'Yes — after age 65', "Don't know"] },
      { id: 'fam_cancer', label: 'Cancer in family', type: 'multi', options: ['None I know of', 'Breast', 'Colon', 'Pancreatic', 'Liver', 'Prostate', 'Lung', 'Other'] },
      { id: 'fam_autoimmune', label: 'Autoimmune conditions', type: 'multi', options: ['None', 'Thyroid (Hashimoto / Graves)', 'Lupus', 'Rheumatoid arthritis', 'Celiac', 'Type 1 diabetes', "Don't know"] },
      { id: 'fam_gi', label: 'GI conditions in family', type: 'multi', options: ['None', "Crohn's or colitis", 'Colon cancer', 'Stomach cancer or ulcers', 'IBS', "Don't know"] },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'history',
    title: 'A few personal-history checks',
    intro:
      'Things the Orlando workup either missed or that I need from you directly.',
    fields: [
      {
        id: 'pcp_status',
        label: "Your chart literally says 'PCP: None.' Status?",
        type: 'radio',
        options: ['I have a regular PCP I see annually', 'I had one but haven\'t seen in a year+', "I don't currently have a PCP", 'I just use specialists when I need to'],
        required: true,
      },
      {
        id: 'menopause',
        label: 'Menopause status',
        type: 'radio',
        options: ['Pre-menopausal', 'Going through it now', 'Past menopause 1–5 years', 'Past menopause 5–10 years', 'Past menopause 10+ years'],
      },
      {
        id: 'hrt',
        label: 'Hormone replacement therapy (HRT)',
        type: 'radio',
        options: ['Never used', 'Used in the past, stopped', 'On HRT now', 'Considering it'],
      },
      {
        id: 'surgeries',
        label: 'Major surgeries (besides the December scopes)',
        type: 'multi',
        options: ['None', 'Gallbladder removal', 'Hysterectomy', 'Appendectomy', 'Joint replacement (hip/knee)', 'Spine / back', 'Cardiac', 'Other'],
      },
      {
        id: 'allergies',
        label: 'Drug or food allergies',
        type: 'multi',
        options: ['None', 'Penicillin', 'Sulfa', 'Other medication', 'Latex', 'Shellfish', 'Tree nuts', 'Other food'],
      },
      {
        id: 'smoking',
        label: 'Smoking / vaping history',
        type: 'radio',
        options: ['Never smoked', 'Quit 10+ years ago', 'Quit within the last 10 years', 'Currently smoke', 'Vape only'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'goals',
    title: 'Your goals',
    intro:
      "What I'll be working backwards from when we talk tomorrow.",
    fields: [
      {
        id: 'top_3_goals',
        label: 'Top things you want to be true 90 days from today (pick up to 5)',
        type: 'multi',
        options: [
          'Get off the pantoprazole',
          'Lower my BP naturally',
          'End the abdominal pain for good',
          'Stop taking 18 supplements',
          'Lose weight',
          'More daily energy',
          'Better sleep',
          'Mental clarity',
          'Get my labs all in range',
          'Feel safe in my own body again',
          "Doctor-cleared independence from pills",
        ],
        required: true,
      },
      {
        id: 'biggest_fear',
        label: "What you're most afraid of if you DON'T get this dialed in (pick all that apply)",
        type: 'multi',
        options: ['Cancer or sudden death', 'More medications added', 'Surgery', 'Losing independence', 'Becoming a burden', 'Wasting money on supplements', 'Never feeling well again'],
      },
      {
        id: 'past_failures',
        label: 'What\'s let you down in the past? (pick all that apply)',
        type: 'multi',
        options: ['Diets that didn\'t stick', 'Exercise programs I quit', 'Supplements that did nothing', 'Other coaches or practitioners', 'Doctors who rushed me', 'My own motivation', 'Family / spouse not on board'],
      },
      {
        id: 'support_at_home',
        label: 'Support at home for making changes',
        type: 'radio',
        options: ['Fully supported by family', 'Some support', 'Going it alone', 'Some pushback at home'],
      },
      {
        id: 'coaching_interest',
        label: 'How interested are you in 1:1 or group coaching with me (separate from this consult)?',
        type: 'radio',
        options: ['Very interested — tell me about it', 'Maybe — depends on details', 'Not sure yet', 'Just want this consult for now'],
      },
      { id: 'why_now', label: 'Why now? What flipped the switch on getting serious? (the only required typing question — 1–3 sentences is plenty)', type: 'textarea', rows: 4, required: true },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'questions_for_joel',
    title: 'Your questions for me',
    intro: "Last one.",
    fields: [
      { id: 'questions_for_joel', label: 'What do you want me to be ready to answer on the call tomorrow?', type: 'textarea', rows: 5, placeholder: 'As many or as few as you want.' },
      {
        id: 'preferred_followup',
        label: "After the call, the best way to reach you is…",
        type: 'radio',
        options: ['Email', 'Text / SMS', 'Phone call', 'All are fine'],
      },
    ],
  },
];

const REQUIRED_FIELDS = SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.required).map((f) => f.id)
);

// ============================================================
// Palette + styling helpers (inline to avoid touching index.css)
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
export default function WakitaIntakePage() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [intakeId, setIntakeId] = useState(null);
  const [error, setError] = useState('');

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
      const r = await fetch('/api/wakita-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Submit failed (${r.status})`);
      }
      const data = await r.json();
      setIntakeId(data.intakeId || null);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not submit. Try again or text Joel directly.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Thank-you state with PDF download ─────────────
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
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            Your intake just landed in my inbox. I'll read every word tonight so when we hop on Zoom tomorrow at noon, we're using the time on <em>your</em> situation — not catching me up.
          </p>

          {intakeId && (
            <a
              href={`/api/wakita-intake-pdf?id=${encodeURIComponent(intakeId)}`}
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
              Download your intake summary (PDF)
            </a>
          )}

          <p style={{ color: MUTED, fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            Save the PDF if you'd like a clean copy of everything you just told me.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: INK, margin: 0 }}>— Joel Polley, RN</p>
        </motion.div>
      </main>
    );
  }

  // ── Main form ─────────────
  return (
    <main style={{ minHeight: '100vh', background: PAPER, color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif' }}>
      {/* Header / personal note */}
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
                Pre-call intake — for Wakita
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: 2 }}>Joel Polley, RN — BraveWorks</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
            Hi Wakita — I've read your file.
          </h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            All of it. Orlando Health from December (EGD, EUS, MRI, HIDA, colonoscopy, gastric emptying study, all the tumor markers). The Mexico ultrasound. The Bio Life nano scan. The supplement list. The photo of the bottles on your table.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            Before we talk tomorrow at 12:00 PM, walk through this. It's almost all <strong>tap-the-answer</strong> — no big paragraphs to write. About <strong>8–10 minutes</strong>. Required questions are marked <span style={{ color: CLAY, fontWeight: 600 }}>·</span>; skip the rest if you want.
          </p>
          <div style={{ background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.9rem', color: SAGE_DEEP, lineHeight: 1.5 }}>
            <strong>Mobile-friendly.</strong> No login. Your answers go straight to me. You'll get a PDF copy of everything once you submit.
          </div>
        </div>
      </header>

      {/* Form */}
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

        {/* Submit bar */}
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
            {submitting ? 'Sending to Joel…' : 'Submit intake to Joel'}
          </button>
          <p style={{ fontSize: '0.82rem', color: MUTED, textAlign: 'center', margin: '0.75rem 0 0' }}>
            Your responses go directly to Joel Polley, RN. Not shared with anyone else.
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
// Field renderer — dispatches to the right control type
// ============================================================
function Field({ field, value, onChange, showMissing }) {
  const id = `field-${field.id}`;
  const labelStyle = {
    display: 'block', fontSize: '0.97rem', fontWeight: 600, color: INK,
    marginBottom: 8, lineHeight: 1.4,
  };
  const helperStyle = { fontSize: '0.82rem', color: MUTED, margin: '0 0 10px', lineHeight: 1.5 };
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
      {field.helper && <p style={helperStyle}>{field.helper}</p>}

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

// Pill-button radio group — touch-friendly
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

// Multi-select pill chips
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
