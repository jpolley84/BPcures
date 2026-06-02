// src/pages/LuveniaIntakePage.jsx
//
// BP Triangle Diagnostic intake for Luvenia N Truss.
// $297 buyer — 1:1 with Joel Polley, RN on Tuesday June 9 at 8 PM Central.
// This deep intake walks her through the THREE PRESSURES framework
// (stress / sugar / pipe) and the NEWSTART pillars so Joel arrives at the
// call already inside her situation. She skips the small talk and we go
// straight to the protocol.
//
// Reachable at:
//   - https://luvenia.bpquiz.com (subdomain — see App.jsx SUBDOMAIN_PAGE map)
//   - https://bpquiz.com/luvenia (fallback path)
//
// Same token-gating + email-Joel-with-PDF pattern as the Wakita intake.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Download } from 'lucide-react';

// ============================================================
// Field schema — almost entirely click-driven for thumb friendliness.
// Field types:
//   radio       — single-choice, value = string
//   multi       — multi-select chips, value = array of strings
//   short_text  — small input for numbers (BP, weight)
//   textarea    — free text (only where the answer can't be canned)
// ============================================================

const SECTIONS = [
  // ──────────────────────────────────────────────────────────
  {
    id: 'welcome',
    title: 'Welcome, Luvenia',
    intro:
      "You bought the BP Triangle Diagnostic with me. Our call is Tuesday June 9 at 8 PM Central. This intake is how I come to your call already knowing the inside of your situation — so you skip the small talk and we go straight to your protocol. Answer what you can. \"Don't know\" is a fine answer. About 15–20 minutes — and it auto-saves on every tap, so you can leave and come back.",
    fields: [
      { id: 'full_name', label: 'Your full name', type: 'short_text', placeholder: 'Luvenia N Truss', required: true },
      { id: 'age', label: 'Your age', type: 'short_text', placeholder: 'e.g., 58' },
      { id: 'weight', label: 'Current weight', type: 'short_text', placeholder: 'e.g., 172 lb' },
      { id: 'location', label: 'City + state', type: 'short_text', placeholder: 'e.g., Memphis, TN' },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'bp_history',
    title: 'Your BP — the numbers',
    intro:
      "I want a clear picture of where your blood pressure has been running and what's already been tried. Round numbers are fine.",
    fields: [
      { id: 'bp_typical', label: 'Your TYPICAL blood pressure right now', helper: 'Best guess of where it usually lives.', type: 'short_text', placeholder: 'e.g., 148/92', required: true },
      { id: 'bp_highest', label: 'Highest reading you remember seeing', type: 'short_text', placeholder: 'e.g., 180/108' },
      { id: 'bp_lowest', label: 'Lowest reading you remember seeing', type: 'short_text', placeholder: 'e.g., 118/76' },
      {
        id: 'bp_meds',
        label: 'BP medications you are on right now (pick all)',
        helper: "We'll get into doses on the call. For now, just check what's in the bottle.",
        type: 'multi',
        options: [
          'Not on any BP medication',
          'Lisinopril / Enalapril (ACE inhibitor)',
          'Losartan / Valsartan (ARB)',
          'Amlodipine / Norvasc (calcium channel)',
          'Metoprolol / Atenolol / Carvedilol (beta blocker)',
          'Hydrochlorothiazide / HCTZ (diuretic)',
          'Spironolactone',
          'Clonidine',
          'Combo pill (two meds in one)',
          "I'm on something but don't remember the name",
        ],
        required: true,
      },
      {
        id: 'meds_history',
        label: 'How long have you been on BP medication overall?',
        type: 'radio',
        options: ['Not on any', 'Less than 1 year', '1–3 years', '3–5 years', '5–10 years', 'More than 10 years', 'More than 20 years'],
      },
      {
        id: 'meds_working',
        label: 'Have your BP meds stopped working as well as they used to?',
        helper: "Have doses gone up, or have you been switched / had a med added?",
        type: 'radio',
        options: ['Not on meds', 'They still work fine', 'Doctor added a second med', 'Doctor raised the dose', 'Doctor added a third med', 'Nothing they try seems to control it'],
      },
      {
        id: 'bp_started_year',
        label: 'About when did your BP first become a problem?',
        type: 'radio',
        options: ['Less than 1 year ago', '1–3 years ago', '3–5 years ago', '5–10 years ago', '10–20 years ago', 'More than 20 years ago', "I'm not sure"],
        required: true,
      },
      {
        id: 'family_history',
        label: 'Family history (pick all that apply)',
        type: 'multi',
        options: [
          'Mother had high BP',
          'Father had high BP',
          'A sibling has high BP',
          'Mother or father had stroke',
          'Mother or father had heart attack',
          'Mother or father had diabetes',
          'Mother or father had kidney problems',
          'No major family history',
          "I don't know my family history",
        ],
      },
      {
        id: 'recent_labs',
        label: 'Recent labs you have on hand (pick all)',
        helper: "Anything you've had drawn in the last 12 months. Bring the actual numbers to the call if you can.",
        type: 'multi',
        options: [
          'A1c (blood sugar over 3 months)',
          'Fasting glucose',
          'Full lipid panel (cholesterol)',
          'Kidney function (BUN / creatinine / eGFR)',
          'TSH / thyroid panel',
          'Vitamin D',
          'B12',
          'CRP / inflammation',
          'CMP / basic metabolic',
          "Nothing recent — haven't had labs in over a year",
        ],
      },
      {
        id: 'last_cardiology',
        label: 'Last cardiology visit',
        type: 'radio',
        options: ['Within the last 6 months', '6–12 months ago', '1–2 years ago', 'More than 2 years ago', "I've never seen a cardiologist"],
      },
      {
        id: 'cardiology_said',
        label: 'What did the cardiologist (or your doctor) tell you the last visit?',
        type: 'textarea',
        rows: 2,
        placeholder: '1–2 sentences. The headline they gave you.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'stress_pressure',
    title: 'Pressure #1 — STRESS (cortisol)',
    intro:
      "Cortisol is the body's stress hormone. When it runs hot for years, it drives BP through one corner of the triangle. We're looking for your CAUSES here, not just symptoms.",
    fields: [
      {
        id: 'sleep_falling',
        label: 'Falling asleep at night',
        type: 'radio',
        options: ['I fall asleep within 15 minutes', '15–30 minutes', '30–60 minutes', "Over an hour — mind won't quiet", 'I only sleep with a pill'],
        required: true,
      },
      {
        id: 'sleep_staying',
        label: 'Staying asleep through the night',
        type: 'radio',
        options: ['Sleep straight through', 'Wake up once but go right back', 'Wake up 2–3 times', 'Wake up multiple times — restless all night', 'I rarely get more than 4 hours'],
      },
      {
        id: 'sleep_3am',
        label: 'Do you wake up between 2 and 4 AM and can\'t get back to sleep?',
        helper: "Classic cortisol-spike pattern — important data.",
        type: 'radio',
        options: ['Almost never', 'Once a week', '2–3 nights a week', 'Most nights', 'Every single night'],
        required: true,
      },
      {
        id: 'morning_energy',
        label: 'Morning energy — when you first wake up, you feel…',
        type: 'radio',
        options: ['Rested and ready', 'Slow to start but OK', 'Tired even though I slept', 'Wired but exhausted at the same time', 'Already dreading the day'],
      },
      {
        id: 'daily_stress_sources',
        label: 'Where is daily stress coming from? (pick all)',
        type: 'multi',
        options: [
          'Work / job pressure',
          'Finances / money worry',
          'Marriage / relationship',
          'Caregiving for a parent',
          'Caregiving for a child or grandchild',
          'Health worries — mine',
          'Health worries — a loved one',
          'Grief from a recent loss',
          'Church / community responsibilities',
          "Honestly — not much daily stress right now",
        ],
        required: true,
      },
      {
        id: 'recent_stress',
        label: 'Any specific big stress events in the last 6 months?',
        helper: "Death, divorce, job loss, move, diagnosis, family crisis. Be honest.",
        type: 'textarea',
        rows: 3,
        placeholder: '1–3 sentences. If nothing, type "nothing major."',
      },
      {
        id: 'belly_weight_pattern',
        label: 'Belly weight — when did it show up?',
        helper: "Cortisol stores fat specifically around the middle.",
        type: 'radio',
        options: ['No belly weight', "I've always had it", 'Showed up after a major life event', 'Showed up around menopause', 'Showed up after starting a medication', 'Slowly added on over the last 5–10 years', "It's gotten worse the last 2 years"],
      },
      {
        id: 'afternoon_crash',
        label: 'Afternoon crash (1–4 PM)',
        type: 'radio',
        options: ['No crash — steady all day', 'Mild — could push through', 'Real crash — I need caffeine or sugar', 'I have to lay down most afternoons', 'I rely on a nap to get through'],
      },
      {
        id: 'evening_2nd_wind',
        label: 'Do you get a "second wind" of energy at night?',
        helper: "Cortisol pattern often runs backwards — tired all day, wired at 10 PM.",
        type: 'radio',
        options: ['No — I wind down at night', 'A little — but I can still sleep', 'Yes — I get my best work done after 9 PM', 'Yes — and I can\'t fall asleep', "I don't notice"],
      },
      {
        id: 'stress_cravings',
        label: 'When stressed, what do you crave?',
        type: 'multi',
        options: ['Salt / salty snacks', 'Sugar / sweets', 'Carbs / bread / pasta', 'Caffeine — more coffee', 'Alcohol', 'Chocolate', 'Cheese', 'Comfort food from childhood', "Nothing — I lose my appetite"],
      },
      {
        id: 'white_coat',
        label: 'White-coat effect — does your BP spike specifically AT the doctor?',
        helper: "If your home readings are way lower than your office readings, that's stress-driven.",
        type: 'radio',
        options: ['Home and office readings match', 'Office is a little higher', 'Office is much higher — clearly stress', "Office is much higher and they won't believe my home readings", "I haven't compared", "I don't take it at home"],
        required: true,
      },
      {
        id: 'trauma_history',
        label: 'Anything from earlier in life that\'s still sitting in your body?',
        helper: "Optional — only what you\'re willing to share. Trauma drives long-term cortisol. Can be private and brief.",
        type: 'textarea',
        rows: 3,
        placeholder: 'Skip if you\'d rather discuss on the call.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'sugar_pressure',
    title: 'Pressure #2 — SUGAR (insulin)',
    intro:
      "Insulin resistance is the silent driver of most adult BP. We're looking at how your body handles sugar and carbs.",
    fields: [
      {
        id: 'a1c_last',
        label: 'Last A1c result',
        helper: "If you have a number, type it. If not, pick the range.",
        type: 'radio',
        options: ['Below 5.7 (normal)', '5.7–6.0 (pre-diabetic)', '6.1–6.4 (pre-diabetic)', '6.5–7.0 (diabetic)', 'Above 7.0 (diabetic, uncontrolled)', "I've never had it checked", "I had it checked but don't remember"],
        required: true,
      },
      {
        id: 'a1c_when',
        label: 'When was your last A1c?',
        type: 'radio',
        options: ['Within 3 months', '3–6 months ago', '6–12 months ago', '1–2 years ago', 'More than 2 years ago', 'Never'],
      },
      {
        id: 'fasting_glucose',
        label: 'Fasting glucose — if you know it',
        type: 'short_text',
        placeholder: 'e.g., 102',
      },
      {
        id: 'diabetes_meds',
        label: 'Diabetes / blood sugar medications (pick all)',
        type: 'multi',
        options: [
          'None',
          'Metformin',
          'Glipizide / Glyburide',
          'Ozempic / Wegovy / Mounjaro',
          'Insulin',
          'Other diabetes medication',
        ],
      },
      {
        id: 'carb_sleepiness',
        label: 'After a meal with bread, pasta, or rice — do you get sleepy?',
        helper: "Carb-induced sleepiness = insulin resistance signal.",
        type: 'radio',
        options: ['No — I feel normal', 'A little drowsy', 'Yes — I need a nap', 'Yes — I CAN\'T avoid the nap', "I avoid carbs so I don't know"],
        required: true,
      },
      {
        id: 'afternoon_cravings',
        label: 'Afternoon sugar / carb cravings (2–4 PM)',
        type: 'radio',
        options: ['Never', 'Sometimes — mild', 'Most afternoons', 'Every afternoon — I plan a snack for it', 'Multiple times in the afternoon'],
      },
      {
        id: 'evening_cravings',
        label: 'Evening sweet tooth (after dinner)',
        type: 'radio',
        options: ['No — I don\'t want sweets at night', 'Sometimes', 'Most nights I want something sweet', 'I eat dessert every night', 'I eat sweets late at night even when I\'m not hungry'],
      },
      {
        id: 'weight_5yr',
        label: 'Weight history over the last 5 years',
        type: 'radio',
        options: ['Stable — same weight as 5 years ago', 'Lost weight on purpose', 'Lost weight unintentionally', 'Gained 5–15 lbs', 'Gained 15–30 lbs', 'Gained more than 30 lbs', 'It\'s gone up and down a lot'],
        required: true,
      },
      {
        id: 'family_diabetes',
        label: 'Family history of diabetes / metabolic syndrome',
        type: 'multi',
        options: ['Mother had diabetes', 'Father had diabetes', 'Sibling has diabetes', 'Adult child has diabetes', 'Grandparent had diabetes', 'No known family history', "I don't know"],
      },
      {
        id: 'fasting_pattern',
        label: 'When you go without food (skipping a meal), how do you feel?',
        type: 'radio',
        options: ['Fine — I can skip meals easily', 'A little hungry but fine', 'Shaky / lightheaded / hangry', 'I get headaches if I miss a meal', "I can't go more than 3–4 hours without eating"],
      },
      {
        id: 'processed_food',
        label: 'Processed foods (chips, crackers, fast food, packaged snacks) — how do they sit with you?',
        type: 'multi',
        options: ['They sit fine', 'Bloating', 'Heartburn', 'Energy crash 1–2 hours later', 'Cravings for more', 'Headache', 'I rarely eat them', "I never paid attention"],
      },
      {
        id: 'belly_first_thing',
        label: 'First thing in the morning — is your belly flat or distended?',
        helper: "Flat AM belly = good. Bloated AM belly = inflammation / metabolic problem.",
        type: 'radio',
        options: ['Flat — flatter than at night', 'About the same as at night', 'Still bloated in the morning', "I'm not sure"],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'pipe_pressure',
    title: 'Pressure #3 — PIPE (vascular)',
    intro:
      "The pipes themselves — arteries, vessels, circulation. We're looking at how flexible and clean your pipes are.",
    fields: [
      {
        id: 'systolic_vs_diastolic',
        label: 'Which number is more elevated for you?',
        helper: "Systolic = top number (force during heartbeat). Diastolic = bottom number (force between beats).",
        type: 'radio',
        options: ['Both elevated about the same', 'Top number (systolic) is the bigger problem', 'Bottom number (diastolic) is the bigger problem', "I'm not sure"],
        required: true,
      },
      {
        id: 'cold_extremities',
        label: 'Cold hands and / or feet',
        type: 'radio',
        options: ['Never — always warm', 'Sometimes — in winter', 'Often — even in summer', 'Always — even with socks on', "Sometimes my fingers turn white or blue"],
      },
      {
        id: 'family_stroke',
        label: 'Family history of stroke or heart attack — be specific',
        helper: "Who had what, and at what age if you know.",
        type: 'textarea',
        rows: 3,
        placeholder: 'e.g., "Father — heart attack at 62. Brother — stroke at 58."',
      },
      {
        id: 'inflammation_markers',
        label: 'Inflammation signs (pick all)',
        type: 'multi',
        options: [
          'Joint pain — knees, hips, hands',
          'Morning stiffness',
          'Gum disease / bleeding gums',
          'Periodontal disease (diagnosed)',
          'High CRP on bloodwork',
          'Frequent infections',
          'Skin issues (eczema, psoriasis, rash)',
          'Allergies / sinus issues',
          'IBS / chronic gut problems',
          'Autoimmune diagnosis',
          'None of these',
        ],
      },
      {
        id: 'smoking_history',
        label: 'Smoking history',
        type: 'radio',
        options: ['Never smoked', 'Quit more than 10 years ago', 'Quit 5–10 years ago', 'Quit 1–5 years ago', 'Quit in the last year', 'Still smoke occasionally', 'Still smoke daily', 'Vape only'],
        required: true,
      },
      {
        id: 'exercise_tolerance',
        label: 'Exercise tolerance — compared to 5 years ago',
        type: 'radio',
        options: ['Stronger than ever', 'About the same', 'A little less stamina', 'Noticeably less — get winded easier', 'A lot less — used to walk far, now I struggle', "I haven't exercised in years"],
      },
      {
        id: 'shortness_breath',
        label: 'Shortness of breath',
        type: 'radio',
        options: ['Never', 'Only with hard exercise', 'Climbing stairs', 'Walking flat for a few minutes', 'Just walking around the house', 'At rest sometimes'],
      },
      {
        id: 'swelling_legs',
        label: 'Swelling in ankles, feet, or lower legs',
        type: 'radio',
        options: ['Never', 'Occasional — after long sitting / flying', 'Often by end of day', 'Daily — visible swelling', 'Constant — even in the morning'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_nutrition',
    title: 'NEWSTART — N for NUTRITION',
    intro:
      "This is where I most need honesty. Be real about what's actually going in — not the ideal version.",
    fields: [
      {
        id: 'breakfast_typical',
        label: 'Typical breakfast (pick all that show up in a normal week)',
        type: 'multi',
        options: [
          'Skip breakfast',
          'Just coffee or tea',
          'Eggs',
          'Bacon / sausage / ham',
          'Toast / bagel / English muffin',
          'Oatmeal / hot cereal',
          'Cold cereal',
          'Grits',
          'Pancakes / waffles',
          'Yogurt',
          'Fruit',
          'Smoothie / shake',
          'Leftovers',
        ],
        required: true,
      },
      {
        id: 'lunch_typical',
        label: 'Typical lunch (pick all)',
        type: 'multi',
        options: [
          'Sandwich / wrap',
          'Salad with protein',
          'Salad alone',
          'Soup',
          'Leftovers',
          'Chicken + veg + starch',
          'Fish + veg + starch',
          'Fast food',
          'Restaurant takeout',
          'A snack instead — nuts, fruit, cheese',
          'Skip lunch',
        ],
        required: true,
      },
      {
        id: 'dinner_typical',
        label: 'Typical dinner (pick all)',
        type: 'multi',
        options: [
          'Chicken + veg + starch',
          'Fish or seafood',
          'Beef (steak, ground, etc.)',
          'Pork (chops, ribs)',
          'Pasta',
          'Pizza',
          'Rice + beans / rice + protein',
          'Soup or stew',
          'Big salad as the meal',
          'Vegetarian meal (no meat)',
          'Eat out / takeout',
          'Skip dinner',
        ],
        required: true,
      },
      {
        id: 'cook_vs_eat_out',
        label: 'Cook at home vs. eat out — honest split',
        type: 'radio',
        options: ['Cook 100% at home', 'Cook 75% / eat out 25%', '50/50', 'Eat out 75% / cook 25%', 'Eat out almost every meal'],
        required: true,
      },
      {
        id: 'veggies_per_day',
        label: 'Vegetables — about how many servings per day?',
        helper: "1 serving = 1 cup raw or 1/2 cup cooked.",
        type: 'radio',
        options: ['0–1 servings', '2 servings', '3 servings', '4–5 servings', '6+ servings'],
        required: true,
      },
      {
        id: 'fruits_per_day',
        label: 'Fruits — about how many servings per day?',
        type: 'radio',
        options: ['None', '1 serving', '2 servings', '3 servings', '4+ servings'],
      },
      {
        id: 'processed_freq',
        label: 'Processed food (bread, packaged snacks, fast food) frequency',
        type: 'radio',
        options: ['Almost never', '1–2 times a week', '3–5 times a week', 'Daily — once a day', 'Multiple times a day'],
        required: true,
      },
      {
        id: 'cooking_oils',
        label: 'Cooking oils / fats you use (pick all)',
        type: 'multi',
        options: [
          'Olive oil',
          'Avocado oil',
          'Butter',
          'Coconut oil',
          'Vegetable / canola oil',
          'Corn oil',
          'Lard / bacon grease',
          'Ghee',
          'I don\'t really cook',
        ],
      },
      {
        id: 'animal_products',
        label: 'Animal products you eat (pick all)',
        type: 'multi',
        options: [
          'Chicken',
          'Beef',
          'Pork',
          'Fish',
          'Shellfish',
          'Eggs',
          'Cow milk / cheese / yogurt',
          'Goat / sheep dairy',
          'Processed meats (bacon, sausage, deli)',
          'None — plant-based',
        ],
      },
      {
        id: 'caffeine_sources',
        label: 'Caffeine sources (pick all)',
        type: 'multi',
        options: [
          'Coffee',
          'Black tea',
          'Green tea',
          'Diet soda',
          'Regular soda',
          'Energy drinks',
          'Pre-workout',
          'None',
        ],
      },
      {
        id: 'caffeine_amount',
        label: 'Total caffeine per day',
        type: 'radio',
        options: ['None', '1 cup coffee / tea', '2 cups', '3 cups', '4+ cups', 'I lose count'],
      },
      {
        id: 'alcohol_pattern',
        label: 'Alcohol pattern — honest answer',
        type: 'radio',
        options: ['Never drink', 'Special occasions only', '1–2 drinks a week', '3–7 drinks a week', '1–2 drinks most days', '2+ drinks most days'],
        required: true,
      },
      {
        id: 'supplements_current',
        label: 'Supplements / vitamins you take right now (pick all)',
        type: 'multi',
        options: [
          'None',
          'Multivitamin',
          'Vitamin D',
          'Magnesium',
          'Fish oil / omega-3',
          'CoQ10',
          'B-complex / B12',
          'Vitamin C',
          'Probiotics',
          'Garlic',
          'Turmeric',
          'Hibiscus',
          'Berberine',
          'Other (mention on the call)',
        ],
      },
      {
        id: 'food_sensitivities',
        label: 'Known food sensitivities or reactions',
        type: 'textarea',
        rows: 2,
        placeholder: 'e.g., "Dairy gives me sinus drainage." If none, type "none."',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_exercise',
    title: 'NEWSTART — E for EXERCISE',
    intro: "Movement lowers BP and resensitizes insulin. We need to know what's realistic for you.",
    fields: [
      {
        id: 'movement_current',
        label: 'Current movement — type and frequency',
        type: 'multi',
        options: [
          'Walking — neighborhood / outside',
          'Walking — treadmill',
          'Gardening / yard work',
          'Housework (count it)',
          'Job is physical (count it)',
          'Strength / weights',
          'Yoga / Pilates',
          'Swimming',
          'Biking',
          'Dance / Zumba',
          'Group fitness class',
          'Nothing right now',
        ],
        required: true,
      },
      {
        id: 'days_per_week',
        label: 'How many days a week do you move on purpose?',
        type: 'radio',
        options: ['0 days', '1 day', '2 days', '3 days', '4–5 days', '6–7 days'],
        required: true,
      },
      {
        id: 'minutes_per_session',
        label: 'Minutes per session (typical)',
        type: 'radio',
        options: ['0–10 min', '10–20 min', '20–30 min', '30–45 min', '45–60 min', 'More than 60 min'],
      },
      {
        id: 'energy_movement',
        label: 'When do you have the most energy for movement?',
        type: 'radio',
        options: ['Morning', 'Mid-day', 'Afternoon', 'Evening', "I don't really have energy"],
      },
      {
        id: 'pain_barriers',
        label: 'Joint or pain barriers to movement (pick all)',
        type: 'multi',
        options: [
          'Knees',
          'Hips',
          'Back',
          'Feet / plantar',
          'Shoulders',
          'Ankle / arthritis',
          'Old injury',
          'Balance issues',
          'No pain barriers',
        ],
      },
      {
        id: 'past_athletic',
        label: 'Past athletic life — were you ever active?',
        type: 'radio',
        options: ['Lifelong athlete', 'Athletic in school', 'Active in my 20s–30s', 'Active in my 40s', 'Never really athletic'],
      },
      {
        id: 'movement_obstacles',
        label: 'What gets in the way of moving more right now?',
        type: 'textarea',
        rows: 2,
        placeholder: '1–2 sentences. Time, pain, energy, weather, motivation — be honest.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_water',
    title: 'NEWSTART — W for WATER',
    intro: "Hydration directly affects blood volume and pressure. Plain water — not coffee, not soda.",
    fields: [
      {
        id: 'water_glasses',
        label: 'Glasses of plain water per day (rough estimate)',
        type: 'radio',
        options: ['Fewer than 2', '2–4', '4–6', '6–8', 'More than 8'],
        required: true,
      },
      {
        id: 'water_quality',
        label: 'Water you usually drink',
        type: 'radio',
        options: ['Tap — straight from the faucet', 'Tap — Brita / pitcher filter', 'Refrigerator-filtered', 'Bottled water', 'Reverse osmosis / under-sink filter', 'Well water', 'Spring water'],
      },
      {
        id: 'other_liquids',
        label: 'Other liquids in your day (pick all)',
        type: 'multi',
        options: [
          'Coffee',
          'Tea (sweetened)',
          'Tea (unsweetened)',
          'Diet soda',
          'Regular soda',
          'Fruit juice',
          'Sports drinks',
          'Sparkling water',
          'Milk / plant milk',
          'Smoothies',
          'Alcohol',
        ],
      },
      {
        id: 'hydration_symptoms',
        label: 'Hydration warning signs you notice (pick all)',
        type: 'multi',
        options: [
          'Dry mouth — often',
          'Dark yellow urine',
          'Headaches',
          'Muscle cramps',
          'Dry skin',
          'Dizzy when standing up',
          'None of these',
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_sunlight',
    title: 'NEWSTART — S for SUNLIGHT',
    intro: "Sun on skin makes vitamin D and resets circadian rhythm — both BP regulators.",
    fields: [
      {
        id: 'outdoor_time',
        label: 'Time outdoors per day (sunlight on skin)',
        type: 'radio',
        options: ['Almost none — indoors all day', '5–15 minutes', '15–30 minutes', '30–60 minutes', '1–2 hours', 'More than 2 hours'],
        required: true,
      },
      {
        id: 'vitamin_d',
        label: 'Vitamin D level — if you know it',
        type: 'radio',
        options: ['Below 20 (deficient)', '20–30 (low)', '30–50 (in range)', '50–80 (optimal)', 'Above 80', "I've never had it tested", "Tested but don't remember"],
      },
      {
        id: 'sun_timing',
        label: 'When do you get most of your sun exposure?',
        type: 'radio',
        options: ['Morning (before 10 AM)', 'Mid-morning (10 AM–noon)', 'Mid-day (noon–2 PM)', 'Afternoon (2–5 PM)', 'Evening', 'I rarely see the sun'],
      },
      {
        id: 'sunscreen_use',
        label: 'Sunscreen pattern',
        type: 'radio',
        options: ['Never wear it', 'Only at the beach / outdoor events', 'Face only — daily', 'Full body whenever outside', 'Whenever I might be in sun more than 10 min'],
      },
      {
        id: 'screens_at_night',
        label: 'Screens (phone / TV / tablet) at night',
        type: 'radio',
        options: ['No screens after dark', 'Some TV, no phone', 'Phone until 30 min before bed', 'Phone in bed for 15–30 min', 'Phone until I fall asleep'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_temperance',
    title: 'NEWSTART — T for TEMPERANCE',
    intro: "Temperance = moderation in good things, avoidance of harmful things. Real numbers help me build a real plan.",
    fields: [
      {
        id: 'alcohol_amount',
        label: 'Alcohol — type and amount',
        helper: "Cross-check with the earlier alcohol question.",
        type: 'multi',
        options: [
          'Wine',
          'Beer',
          'Liquor / spirits',
          'Mixed drinks',
          'Hard seltzer',
          "I don't drink",
        ],
      },
      {
        id: 'tobacco_current',
        label: 'Tobacco / vaping right now',
        type: 'radio',
        options: ['Never used', 'Quit years ago', 'Quit recently (less than 1 year)', 'Smoke under 5 cigarettes a day', 'Half a pack a day', 'Pack a day or more', 'Vape only', 'Chew / dip'],
      },
      {
        id: 'recreational',
        label: 'Recreational substances — anything you want me to know?',
        helper: "Optional. Marijuana, edibles, etc. — only what you\'re comfortable sharing.",
        type: 'textarea',
        rows: 2,
        placeholder: 'If none, type "none."',
      },
      {
        id: 'sugar_temperance',
        label: 'Sugar — how moderate are you?',
        type: 'radio',
        options: ['Very moderate — rarely eat it', 'Moderate — special occasions', 'Daily small amount', 'Daily — multiple servings', 'I have a real sugar problem'],
        required: true,
      },
      {
        id: 'processed_temperance',
        label: 'Processed / fast food — moderation level',
        type: 'radio',
        options: ['I avoid it', 'Once a week or less', '2–3 times a week', 'Most days', 'Multiple times a day'],
      },
      {
        id: 'screen_time',
        label: 'Total screen time per day (phone + TV + computer)',
        type: 'radio',
        options: ['Under 2 hours', '2–4 hours', '4–6 hours', '6–10 hours', 'More than 10 hours'],
      },
      {
        id: 'over_doing',
        label: 'Anything else you know you\'re over-doing?',
        type: 'textarea',
        rows: 2,
        placeholder: 'Honest answer. Coffee, news, social media, work, snacks. Skip if none.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_air',
    title: 'NEWSTART — A for AIR',
    intro: "Air quality and breathing patterns affect BP overnight more than people realize.",
    fields: [
      {
        id: 'home_air',
        label: 'Home air quality (pick all that apply)',
        type: 'multi',
        options: [
          'Central HVAC with regular filter changes',
          'HEPA air purifier in bedroom',
          'Window AC',
          'Open windows when weather is good',
          'House plants',
          'Smoke / cooking smells linger',
          'Mold I know about',
          'Pet dander',
          'No idea — never thought about it',
        ],
      },
      {
        id: 'work_air',
        label: 'Workplace air',
        type: 'radio',
        options: ['Outdoor / fresh air at work', 'Office with good ventilation', 'Office that feels stuffy', 'Factory / industrial', 'Healthcare / clinical', 'I work from home', 'Retired / not working'],
      },
      {
        id: 'outdoor_air_time',
        label: 'Time outdoors in fresh air per day',
        type: 'radio',
        options: ['Almost none', '5–15 minutes', '15–30 minutes', '30–60 minutes', 'More than an hour'],
      },
      {
        id: 'breathing_pattern',
        label: 'Breathing patterns (pick all)',
        type: 'multi',
        options: [
          'Breathe through my nose mostly',
          'Mouth-breather',
          'Snore loudly',
          'Wake up with dry mouth',
          'Diagnosed sleep apnea',
          'On CPAP',
          'Stop breathing in sleep (partner has told me)',
          'Allergies — congested often',
          'Asthma',
          'None of these',
        ],
      },
      {
        id: 'sleep_apnea_check',
        label: 'Has anyone ever told you that you stop breathing while you sleep?',
        helper: "Untreated sleep apnea is a top cause of medication-resistant BP.",
        type: 'radio',
        options: ['Never been told', 'Partner mentioned it', 'I\'ve been told by multiple people', 'Diagnosed but not treated', 'Diagnosed and on CPAP', 'Sleep alone — no one would know'],
        required: true,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_rest',
    title: 'NEWSTART — R for REST',
    intro: "Real rest isn't just sleep — it's recovery. We're checking both.",
    fields: [
      {
        id: 'sleep_hours',
        label: 'Average hours of sleep per night',
        type: 'radio',
        options: ['Less than 5', '5–6', '6–7', '7–8', '8–9', 'More than 9'],
        required: true,
      },
      {
        id: 'sleep_quality',
        label: 'Sleep quality — overall',
        type: 'radio',
        options: ['Best sleep of my life', 'Generally good', 'OK — some good, some bad', 'Poor — most nights restless', 'Awful — chronic insomnia'],
      },
      {
        id: 'naps',
        label: 'Naps during the day',
        type: 'radio',
        options: ['Never nap', 'Occasional power nap', '1 short nap most days', 'Long naps most days', 'I need a nap to function'],
      },
      {
        id: 'sabbath_day',
        label: 'Do you have a day off / Sabbath day weekly?',
        type: 'radio',
        options: ['Yes — strict Sabbath observance', 'Yes — a full day off most weeks', 'Half-day off', 'Sometimes — depends on the week', 'No — I work / am busy 7 days a week'],
      },
      {
        id: 'downtime',
        label: 'Do you actually rest when you have downtime?',
        type: 'radio',
        options: ['Yes — I can fully unwind', 'Mostly — but I usually have something running', 'I rest physically but my mind doesn\'t stop', 'I fill all downtime with tasks', "I don't really get downtime"],
      },
      {
        id: 'hobbies',
        label: 'Hobbies that recharge you (pick all)',
        type: 'multi',
        options: [
          'Reading',
          'Gardening',
          'Cooking / baking for joy',
          'Crafts / sewing / quilting',
          'Music — playing or singing',
          'Music — listening',
          'Time in nature',
          'Walking for pleasure',
          'Time with grandchildren',
          'Painting / art',
          'Travel',
          'Honestly — none right now',
        ],
      },
      {
        id: 'last_vacation',
        label: 'Last real vacation (where you fully unplugged)',
        type: 'radio',
        options: ['Within the last 3 months', '3–6 months ago', '6–12 months ago', '1–2 years ago', 'More than 2 years ago', "I don't take vacations"],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'newstart_trust',
    title: 'NEWSTART — T for TRUST (faith + connection)',
    intro:
      "Spiritual life and human connection are blood-pressure medicine. These answers stay between us.",
    fields: [
      {
        id: 'faith_practice',
        label: 'Spiritual life / faith practice (pick all)',
        type: 'multi',
        options: [
          'Personal prayer',
          'Scripture reading',
          'Church attendance',
          'Worship / hymns',
          'Sabbath observance',
          'Bible study group',
          'Service to others',
          'Time in nature as worship',
          'None right now',
        ],
      },
      {
        id: 'prayer_freq',
        label: 'Prayer / meditation frequency',
        type: 'radio',
        options: ['Multiple times daily', 'Once a day', 'A few times a week', 'When I need it', 'Rarely'],
      },
      {
        id: 'community',
        label: 'Where do you find community? (pick all)',
        type: 'multi',
        options: [
          'Church family',
          'Bible study small group',
          'Close family',
          'Long-term friends',
          'Neighbors',
          'Online community',
          'Work friends',
          'I feel pretty isolated right now',
        ],
      },
      {
        id: 'three_am_mind',
        label: 'What wakes you at 3 AM in your mind? What\'s the worry?',
        helper: "The thing that keeps replaying. Be honest.",
        type: 'textarea',
        rows: 3,
        placeholder: '1–3 sentences.',
      },
      {
        id: 'sources_joy',
        label: 'Where is your joy / hope coming from right now? (pick all)',
        type: 'multi',
        options: [
          'My faith',
          'My spouse / partner',
          'My children',
          'My grandchildren',
          'Friends',
          'A new project / purpose',
          'Service / ministry',
          'My health getting better',
          "Honestly — running low on joy right now",
        ],
      },
      {
        id: 'support_strength',
        label: 'How strong is your support system right now?',
        type: 'radio',
        options: ['Very strong — surrounded', 'Strong — a few solid people', 'OK — could be better', 'Thin — one or two people', 'Very thin — mostly on my own'],
      },
      {
        id: 'who_supports',
        label: 'Who do you call when life is hard? (pick all)',
        type: 'multi',
        options: [
          'Spouse / partner',
          'Best friend',
          'A sibling',
          'My pastor',
          'A counselor / therapist',
          'My adult kids',
          'I keep it to myself',
          'God in prayer',
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'call_outcomes',
    title: 'What you want from our call',
    intro: "Last section. Tell me what to bring to Tuesday.",
    fields: [
      {
        id: 'top_3_outcomes',
        label: 'Top 3 things you want to walk away from this call with',
        helper: "Pick up to 3.",
        type: 'multi',
        options: [
          'A clear protocol I can start this week',
          'Lower BP numbers',
          'A plan to reduce or come off a medication',
          'Better sleep',
          'More energy',
          'Lose belly weight',
          'Get my A1c down',
          'Understand WHY my BP is high (root cause)',
          'A supplement / herb plan',
          'A food plan I can actually follow',
          'Hope — proof this is reversible',
          'A clear next step (the very first move)',
        ],
        required: true,
      },
      {
        id: 'tried_didnt_work',
        label: 'What have you ALREADY tried for your BP that didn\'t work?',
        type: 'textarea',
        rows: 3,
        placeholder: 'Diets, supplements, programs, exercise. The honest list.',
      },
      {
        id: 'afraid_to_try',
        label: 'Is there anything you\'re afraid to try?',
        helper: "Fasting, coming off meds, certain foods, exercise. Be honest — I won\'t push you somewhere you don\'t want to go.",
        type: 'textarea',
        rows: 2,
        placeholder: 'Skip if nothing.',
      },
      {
        id: 'anything_else',
        label: 'Anything else I should know that I didn\'t ask?',
        type: 'textarea',
        rows: 4,
        placeholder: 'As much or as little as you want. This is your space.',
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
export default function LuveniaIntakePage() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [intakeId, setIntakeId] = useState(null);
  const [error, setError] = useState('');

  // Token comes from the URL Joel sends Luvenia: ?token=<secret>
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
      const r = await fetch('/api/luvenia-intake?token=' + encodeURIComponent(accessToken), {
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
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 1rem', lineHeight: 1.2 }}>Got it, Luvenia.</h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            Your BP Triangle intake just landed in my inbox. I'll read every word before our Tuesday June 9 call — so when we hop on Zoom, we go straight to your protocol instead of catching me up.
          </p>

          {intakeId && (
            <a
              href={`/api/luvenia-intake-pdf?id=${encodeURIComponent(intakeId)}&token=${encodeURIComponent(accessToken)}`}
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
                BP Triangle intake — for Luvenia
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: 2 }}>Joel Polley, RN — BraveWorks</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
            Luvenia's BP Triangle Intake — for your June 9 call with Joel
          </h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            You bought the BP Triangle Diagnostic with me. Our call is <strong>Tuesday June 9 at 8 PM Central.</strong> This intake is how I come to your call already knowing the inside of your situation — so you skip the small talk and we go straight to your protocol.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            About <strong>15–20 minutes</strong>. Almost all tap-the-answer. <strong>It auto-saves on every tap</strong> — you can leave and come back. "Don't know" is a fine answer. Required questions are flagged with a <span style={{ color: CLAY, fontWeight: 600 }}>·</span>. We're looking for your <em>causes</em>, not just your symptoms.
          </p>
          <div style={{ background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.9rem', color: SAGE_DEEP, lineHeight: 1.5 }}>
            <strong>Confidential.</strong> Your answers go directly to me. Not shared with anyone. You'll get a PDF copy of everything once you submit.
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
            {submitting ? 'Sending to Joel…' : 'Save & send to Joel'}
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
