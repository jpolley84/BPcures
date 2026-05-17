// src/pages/WakitaIntakePage.jsx
//
// Week 1 coaching deep-dive intake for Wakita Cirillo Browne.
// Sunday 2026-05-17 — building on the May 13 initial intake. Joel has her
// chart, supplement list, and Bio Life status. This second intake digs
// deeper into the levers we couldn't reach in 60 minutes the first time:
//
//   1. A real picture of what she eats every day
//   2. The 5 main GI triggers — gluten, dairy, meat, alcohol, sugar — frequency
//      and intensity, so we can identify causes beyond stress
//   3. Hormone-dysfunction symptoms in everyday-nurse language
//   4. Fasting + detox openness + her longest water fast
//   5. Daily habits + lifestyle (sleep, movement, sun, screens)
//   6. Partner relationship + emotional weight (security 1-10, unforgiveness)
//   7. Coaching cadence — is Monday 8 PM ET a sustainable weekly slot
//   8. This week's focus + questions for Joel
//
// Reachable at:
//   - https://wakita.bpquiz.com (subdomain — see App.jsx SUBDOMAIN_PAGE map)
//   - https://bpquiz.com/wakita (fallback path)
//
// Same token-gating + email-Joel-with-PDF pattern as the May 13 intake.

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
    id: 'checkin',
    title: 'Quick check-in',
    intro:
      "Just the numbers — same anchors as last week so we can see the trend.",
    fields: [
      { id: 'bp_recent', label: 'Your most recent home BP reading', type: 'short_text', placeholder: 'e.g., 134/82', required: true },
      {
        id: 'bp_trend',
        label: 'Compared to last week, your BP is…',
        type: 'radio',
        options: ['Definitely lower', 'A little lower', 'About the same', 'A little higher', 'I haven\'t been tracking'],
      },
      { id: 'weight', label: 'Current weight', type: 'short_text', placeholder: 'e.g., 168 lb' },
      {
        id: 'weight_trend',
        label: 'Weight since last week',
        type: 'radio',
        options: ['Down a couple pounds', 'Down a little', 'About the same', 'Up a little', 'Up a couple pounds'],
      },
      {
        id: 'overall_feeling',
        label: 'Overall, since last Tuesday\'s call, how are you feeling?',
        type: 'radio',
        options: ['Much better', 'A little better', 'About the same', 'A little worse', 'Worse'],
        required: true,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'symptoms_progress',
    title: 'Symptom progress this week',
    intro:
      "Click what's actually happening — no judgment if nothing changed yet.",
    fields: [
      {
        id: 'pain_status',
        label: 'Abdominal pain right now',
        type: 'radio',
        options: ['Gone', 'A lot better', 'About the same', 'Worse', 'Comes and goes'],
      },
      {
        id: 'reflux_freq',
        label: 'Heartburn / reflux / sour taste this week',
        type: 'radio',
        options: ['None', '1–2 times this week', '3–5 times', 'Daily', 'Multiple times a day'],
      },
      {
        id: 'bloating_freq',
        label: 'Bloating or gas after meals this week',
        type: 'radio',
        options: ['None', 'A few times', 'After most meals', 'All day every day'],
      },
      {
        id: 'bowels_freq',
        label: 'Bowel movements this week',
        type: 'radio',
        options: ['Multiple times a day', 'Once a day', 'Every other day', '2–3 times all week', 'Less than that'],
      },
      {
        id: 'energy_pattern',
        label: 'Energy through the day this week',
        type: 'radio',
        options: ['Steady all day', 'Strong morning, afternoon crash', 'Slow morning, better later', 'Tired most of the day', 'Up and down'],
      },
      {
        id: 'sleep_quality',
        label: 'Sleep quality this week',
        type: 'radio',
        options: ['Best sleep I\'ve had in a while', 'Good — most nights', 'OK — some good, some bad', 'Poor — most nights restless', 'Awful'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'diet_typical_day',
    title: 'A typical day of eating — walk me through it',
    intro:
      "This is the section I most need. Be honest — I can't help you if I don't know what's actually going in. Pick everything that's on the table for you on a normal day, not just yesterday.",
    fields: [
      {
        id: 'wake_time',
        label: 'About what time do you wake up?',
        type: 'radio',
        options: ['Before 5 AM', '5–6 AM', '6–7 AM', '7–8 AM', '8–9 AM', 'After 9 AM'],
      },
      {
        id: 'first_thing',
        label: 'First thing that goes in your mouth in the morning',
        type: 'multi',
        options: ['Water', 'Coffee', 'Tea', 'Lemon water', 'Bio Life shake', 'Supplements with water', 'Breakfast right away', 'Nothing for a few hours'],
        required: true,
      },
      {
        id: 'breakfast_foods',
        label: 'Breakfast — pick everything you eat (on different days is fine)',
        type: 'multi',
        options: [
          'Skip breakfast entirely',
          'Just coffee or tea',
          'Toast / bagel / English muffin',
          'Cereal (boxed)',
          'Oatmeal or hot cereal',
          'Eggs',
          'Bacon / sausage / ham',
          'Yogurt',
          'Fruit',
          'Smoothie / protein shake',
          'Pancakes / waffles / French toast',
          'Grits or hash browns',
          'Leftovers from dinner',
        ],
        required: true,
      },
      {
        id: 'lunch_foods',
        label: 'Lunch — pick everything that shows up in a normal week',
        type: 'multi',
        options: [
          'Salad with protein',
          'Salad with no protein',
          'Sandwich on bread',
          'Wrap or tortilla',
          'Soup',
          'Leftovers',
          'Chicken + veg + starch',
          'Fish + veg + starch',
          'Fast food / takeout',
          'Just a snack — nuts, fruit, cheese',
          'Smoothie or shake',
          'Skip lunch',
        ],
        required: true,
      },
      {
        id: 'dinner_foods',
        label: 'Dinner — pick everything that shows up in a normal week',
        type: 'multi',
        options: [
          'Chicken + veg + starch',
          'Fish or seafood',
          'Beef (steak, ground, etc.)',
          'Pork (chops, ribs, etc.)',
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
        id: 'snacks',
        label: 'Snacks between meals (pick all that apply)',
        type: 'multi',
        options: [
          'Don\'t really snack',
          'Fruit',
          'Nuts / seeds',
          'Cheese or cheese sticks',
          'Crackers / chips / pretzels',
          'Granola bar / protein bar',
          'Yogurt',
          'Vegetables + dip',
          'Cookies / pastries / sweets',
          'Ice cream',
          'Popcorn',
          'Trail mix',
        ],
      },
      {
        id: 'drinks_day',
        label: 'Drinks throughout the day (pick all that apply)',
        type: 'multi',
        options: [
          'Plain water',
          'Sparkling / mineral water',
          'Coffee with cream / sugar',
          'Black coffee',
          'Tea (sweetened)',
          'Tea (unsweetened)',
          'Diet soda',
          'Regular soda',
          'Fruit juice',
          'Milk',
          'Plant milk (almond, oat, soy)',
          'Sports drinks',
          'Smoothies',
          'Alcohol',
        ],
      },
      {
        id: 'water_glasses',
        label: 'Glasses of plain water per day (roughly)',
        type: 'radio',
        options: ['Fewer than 2', '2–4', '4–6', '6–8', 'More than 8'],
      },
      {
        id: 'last_food_time',
        label: 'About what time do you eat your LAST food of the day?',
        type: 'radio',
        options: ['Before 6 PM', '6–7 PM', '7–8 PM', '8–9 PM', '9–10 PM', 'After 10 PM'],
      },
      {
        id: 'eating_window',
        label: 'From first food in the morning to last food at night, how many hours is your eating window?',
        type: 'radio',
        options: ['Less than 8 hours', '8–10 hours', '10–12 hours', '12–14 hours', 'More than 14 hours', 'I\'m not sure'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'gi_triggers',
    title: 'GI triggers — the 5 big ones',
    intro:
      "Stress isn't the only cause of GI pain. Five food categories are the usual suspects. Be honest about how often each one shows up — \"a few times a week\" is real data, not a confession.",
    fields: [
      {
        id: 'gluten_freq',
        label: 'GLUTEN — bread, pasta, cereal, crackers, pastries, tortillas, breaded foods. How often?',
        type: 'radio',
        options: ['Never / strictly avoid', '1–2 times a week', '3–5 times a week', 'Daily — once a day', 'Daily — at multiple meals'],
        required: true,
      },
      {
        id: 'gluten_after',
        label: 'After you eat something with gluten, do you notice any of these?',
        type: 'multi',
        options: ['No noticeable effect', 'Bloating', 'Gas', 'Cramps', 'Loose stools', 'Constipation', 'Brain fog / sleepy', 'Joint aches', 'Skin breakouts', 'Heartburn', "I've never paid attention"],
      },
      {
        id: 'dairy_freq',
        label: 'DAIRY — milk, cheese, yogurt, ice cream, cream in coffee, butter. How often?',
        type: 'radio',
        options: ['Never / strictly avoid', '1–2 times a week', '3–5 times a week', 'Daily — once a day', 'Daily — at multiple meals'],
        required: true,
      },
      {
        id: 'dairy_after',
        label: 'After dairy, do you notice any of these?',
        type: 'multi',
        options: ['No noticeable effect', 'Bloating', 'Gas', 'Cramps', 'Loose stools', 'Constipation', 'Sinus / phlegm', 'Skin breakouts', 'Heartburn', "I've never paid attention"],
      },
      {
        id: 'red_meat_freq',
        label: 'RED MEAT — beef, pork, lamb (steaks, burgers, chops, ribs). How often?',
        type: 'radio',
        options: ['Never', '1–2 times a month', '1–2 times a week', '3–5 times a week', 'Most days'],
        required: true,
      },
      {
        id: 'processed_meat_freq',
        label: 'PROCESSED MEAT — bacon, sausage, hot dogs, deli meat, salami, pepperoni. How often?',
        type: 'radio',
        options: ['Never', '1–2 times a month', '1–2 times a week', '3–5 times a week', 'Most days'],
        required: true,
      },
      {
        id: 'meat_after',
        label: 'After a heavy meat meal, do you notice any of these?',
        type: 'multi',
        options: ['No noticeable effect', 'Heavy / sluggish', 'Cramps or pain', 'Constipation', 'Long delay before bowel movement', 'Hard stool', 'Bad breath / coated tongue', "I've never paid attention"],
      },
      {
        id: 'alcohol_freq',
        label: 'ALCOHOL — beer, wine, liquor, mixed drinks. Honest answer.',
        type: 'radio',
        options: ['Never drink', 'Special occasions only', '1–2 drinks a week', '3–7 drinks a week', '1–2 drinks most days', '2+ drinks most days'],
        required: true,
      },
      {
        id: 'alcohol_after',
        label: 'After alcohol, the next morning you usually feel…',
        type: 'multi',
        options: ['No effect', 'Fine — just tired', 'Stomach upset', 'Headache', 'Bloated', 'Anxious or low mood', 'Slept badly', 'Skipped breakfast', "I don't drink"],
      },
      {
        id: 'sugar_freq',
        label: 'SUGAR + SWEETS — desserts, candy, soda, juice, sweetened coffee, ice cream, baked goods. How often?',
        type: 'radio',
        options: ['Rarely', '1–2 times a week', '3–5 times a week', 'Daily — one sweet thing', 'Multiple times a day'],
        required: true,
      },
      {
        id: 'sugar_after',
        label: 'After sugar, you notice…',
        type: 'multi',
        options: ['No noticeable effect', 'Energy crash 1–2 hours later', 'Stronger cravings later', 'Mood dip / irritability', 'Sleep disruption', 'Headache', 'Bloating', 'Heartburn'],
      },
      {
        id: 'spicy_freq',
        label: 'SPICY FOOD — hot sauce, peppers, curry, spicy dishes',
        type: 'radio',
        options: ['Never / can\'t handle it', 'Mild only', '1–2 times a week', 'Several times a week', 'Most meals'],
      },
      {
        id: 'fried_freq',
        label: 'FRIED FOOD — fries, fried chicken, anything deep-fried',
        type: 'radio',
        options: ['Almost never', '1–2 times a month', '1–2 times a week', '3+ times a week', 'Most days'],
      },
      {
        id: 'fast_food_freq',
        label: 'FAST FOOD or RESTAURANT FOOD',
        type: 'radio',
        options: ['Never / cook everything at home', 'Once a month', 'Once a week', '2–3 times a week', 'Most meals'],
      },
      {
        id: 'foods_already_off',
        label: 'Are there any foods you ALREADY avoid because they bother you? (pick all)',
        type: 'multi',
        options: ['Nothing I avoid', 'Gluten / wheat', 'Dairy', 'Spicy', 'Fried', 'Tomatoes / acidic', 'Coffee', 'Onions / garlic', 'Eggs', 'Chocolate', 'Citrus', 'Beans / legumes'],
      },
      {
        id: 'gut_intuition',
        label: 'If you had to GUESS what food is most likely behind your GI pain — what would you guess?',
        type: 'textarea',
        rows: 2,
        placeholder: 'One sentence. No wrong answer — gut intuition matters.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'hormones',
    title: 'Hormones — quick check',
    intro:
      "Plain language only. Just check anything that has been showing up for you in the last 3–6 months.",
    fields: [
      {
        id: 'hormones_checked',
        label: 'Have you ever had your hormones checked with bloodwork?',
        type: 'radio',
        options: ['Yes — within the last year', 'Yes — but more than a year ago', 'Yes — but I don\'t remember when', 'Never been checked', 'I\'m not sure what counts'],
      },
      {
        id: 'menopause_status',
        label: 'Menopause status',
        type: 'radio',
        options: ['Still having cycles (regular or irregular)', 'Going through it now — cycles are unpredictable', 'My last cycle was 6–12 months ago', 'Past menopause 1–5 years', 'Past menopause 5+ years', 'Surgical menopause (hysterectomy / oophorectomy)'],
      },
      {
        id: 'thyroid_history',
        label: 'Thyroid history',
        type: 'radio',
        options: ['Never been told I had a thyroid issue', 'Was told my thyroid was borderline', 'Diagnosed with hypothyroidism (low)', 'Diagnosed with hyperthyroidism (high)', 'On thyroid medication', 'Family has thyroid problems but I haven\'t been checked'],
      },
      {
        id: 'hot_flashes',
        label: 'Hot flashes or night sweats',
        type: 'radio',
        options: ['Never', 'A few times a week', 'Daily — mild', 'Daily — disruptive', 'Multiple times a day + every night'],
      },
      {
        id: 'sleep_2_4_am',
        label: 'Waking up between 2 and 4 AM and not being able to get back to sleep',
        type: 'radio',
        options: ['Almost never', 'Once a week', '2–3 nights a week', 'Most nights', 'Every single night'],
      },
      {
        id: 'belly_weight',
        label: 'Weight gain especially around the middle (belly) that wasn\'t there before',
        type: 'radio',
        options: ['No', 'A little', 'Yes — noticeable', 'Yes — and it\'s gotten worse over the years', 'Yes — and nothing makes it budge'],
      },
      {
        id: 'hormone_symptoms',
        label: 'Tap anything that has been showing up regularly in the last 3–6 months',
        type: 'multi',
        options: [
          'Brain fog / forgetfulness',
          'Mood swings or irritability',
          'Anxiety I didn\'t used to have',
          'Sad / low / weepy',
          'Hair thinning or shedding more',
          'Dry skin / changes in skin',
          'Acne / breakouts as an adult',
          'Dry vagina / discomfort',
          'Low sex drive',
          'Painful or tender breasts',
          'Bloating that gets worse around cycle (if still cycling)',
          'Joint aches / stiff in the morning',
          'Tired even after a full night of sleep',
          'Cold hands and feet',
          'Heart racing for no reason',
          'None of these are happening',
        ],
      },
      {
        id: 'cortisol_pattern',
        label: 'When in the day are you MOST exhausted?',
        type: 'radio',
        options: ['Right when I wake up', 'Mid-morning (10–11 AM)', 'Afternoon (1–3 PM)', 'Evening (6–9 PM)', 'It varies', 'I don\'t feel exhausted'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'fasting_detox',
    title: 'Fasting + detoxes — openness check',
    intro:
      "We may use fasting and water-cure techniques in your protocol. I need to know your history and comfort level before I recommend anything.",
    fields: [
      {
        id: 'water_fast_history',
        label: 'Longest you\'ve ever gone without food (water only — not juice, not bone broth)',
        type: 'radio',
        options: ['Never gone more than 12 hours', '12–16 hours (overnight)', '16–24 hours', '24–48 hours (1–2 full days)', '3–5 days', '5–7 days', 'More than 7 days'],
        required: true,
      },
      {
        id: 'intermittent_fast',
        label: 'Comfortable with skipping breakfast or doing an overnight 16-hour fast?',
        type: 'radio',
        options: ['Already do it', 'Sounds doable — willing to try', 'Not sure — would need guidance', 'Resistant — I get shaky / lightheaded', 'Absolutely not'],
      },
      {
        id: 'past_detoxes',
        label: 'Detoxes or cleanses you\'ve tried in the past (pick all)',
        type: 'multi',
        options: [
          'Never done one',
          'Juice cleanse',
          'Master cleanse (lemon / cayenne)',
          'Herbal cleanse / colon cleanse',
          'Liver / gallbladder flush',
          'Parasite cleanse',
          'Heavy metal detox',
          'Whole30 / Daniel Fast',
          'Bio Life is my first real cleanse',
        ],
      },
      {
        id: 'water_fast_open',
        label: 'Open to a SUPERVISED 3-day water fast at some point in the next 90 days?',
        type: 'radio',
        options: ['Yes — let\'s plan it', 'Maybe — depends what it looks like', 'Nervous — would need a lot of hand-holding', 'Probably not', 'No'],
      },
      {
        id: 'liver_flush_open',
        label: 'Open to a guided liver / gallbladder flush?',
        type: 'radio',
        options: ['Yes', 'Maybe — tell me more', 'No', 'I don\'t know what that is'],
      },
      {
        id: 'enema_open',
        label: 'Open to colon hydrotherapy or coffee enemas if it would speed up healing?',
        type: 'radio',
        options: ['Yes — already done one or willing', 'Maybe — depends on guidance', 'Uncomfortable but open', 'No', 'I don\'t know what that is'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'daily_habits',
    title: 'Daily habits + lifestyle',
    intro: "Quick taps.",
    fields: [
      {
        id: 'movement_daily',
        label: 'Movement / exercise this week',
        type: 'radio',
        options: ['Sedentary — barely moved', 'Some light walking', 'Walked most days', 'Walked + 1 workout', '2+ workouts', 'Active most days'],
      },
      {
        id: 'walk_minutes',
        label: 'Minutes of walking per day on a typical day',
        type: 'radio',
        options: ['0–10', '10–20', '20–30', '30–45', '45–60', 'More than 60'],
      },
      {
        id: 'sun_minutes',
        label: 'Direct sunlight on your skin (face / arms) — minutes per day',
        type: 'radio',
        options: ['0–10', '10–20', '20–30', '30–60', 'More than 60', 'Almost none — indoors most days'],
      },
      {
        id: 'phone_before_bed',
        label: 'Screens / phone in bed before sleep',
        type: 'radio',
        options: ['No screens after 8 PM', 'A little — TV in background', 'Phone for 15–30 min', 'Phone for 30–60 min', 'Phone until I fall asleep'],
      },
      {
        id: 'bedtime',
        label: 'Usual bedtime',
        type: 'radio',
        options: ['Before 9 PM', '9–10 PM', '10–11 PM', '11 PM–midnight', 'After midnight'],
      },
      {
        id: 'stress_level',
        label: 'Stress level the last 7 days (1 = calm, 10 = constantly overwhelmed)',
        type: 'radio',
        options: ['1–2 (calm)', '3–4 (low-medium)', '5–6 (medium)', '7–8 (high)', '9–10 (overwhelmed)'],
      },
      {
        id: 'stress_outlets',
        label: 'When stress is high, what do you reach for? (pick all)',
        type: 'multi',
        options: ['Prayer / scripture', 'Walk outside', 'Talking to a friend / family', 'Music or hymns', 'Sleep / nap', 'Eating', 'Sweets / dessert', 'Alcohol', 'TV / streaming', 'Phone scroll', 'Shopping', 'Nothing — I just push through'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'relationship',
    title: 'Relationship + emotional weight',
    intro:
      "Stress that lives in your body often started somewhere upstream of food. These three questions are confidential — they go to me only.",
    fields: [
      {
        id: 'relationship_status',
        label: 'Relationship status',
        type: 'radio',
        options: ['Married — living together', 'Married — living apart', 'Long-term partner', 'Dating someone', 'Single — by choice', 'Single — would like a partner', 'Widowed', 'Divorced'],
      },
      {
        id: 'relationship_security',
        label: 'On a 1–10 scale, how secure and happy do you feel in your primary relationship right now? (1 = miserable, 10 = deeply safe & loved)',
        type: 'radio',
        options: ['1 — miserable', '2', '3', '4', '5 — neutral', '6', '7', '8', '9', '10 — deeply safe & loved', 'Not in a relationship'],
      },
      {
        id: 'unforgiveness',
        label: 'Have you struggled with unforgiveness in this relationship — something they did (or didn\'t do) that you haven\'t fully let go of?',
        type: 'radio',
        options: ['No — we\'re clear', 'Some smaller things that linger', 'Yes — one big thing', 'Yes — several things', 'A lot — and I think it\'s affecting my health', 'Not in a relationship'],
      },
      {
        id: 'resentment_other',
        label: 'Outside of romantic relationships — anyone else you\'re carrying resentment, hurt, or grief toward? (pick all)',
        type: 'multi',
        options: ['No one — I\'m clear', 'A parent', 'A sibling', 'An adult child', 'A friend', 'A former pastor / spiritual leader', 'A doctor / the medical system', 'God', 'Myself', 'A deceased loved one'],
      },
      {
        id: 'spiritual_practice',
        label: 'Spiritual practice (pick all that apply)',
        type: 'multi',
        options: ['Personal prayer', 'Scripture reading', 'Church attendance', 'Worship music / hymns', 'Sabbath observance', 'Service to others', 'Time in nature', 'None right now'],
      },
      {
        id: 'who_supports',
        label: 'Who do you talk to when you\'re really overwhelmed?',
        type: 'multi',
        options: ['Spouse / partner', 'A best friend', 'A sibling', 'My pastor', 'A counselor / therapist', 'My adult kids', 'I keep it to myself', 'God in prayer'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'coaching_cadence',
    title: 'Our coaching schedule',
    intro:
      "Locking in the weekly slot so it doesn't compete with the rest of your life.",
    fields: [
      {
        id: 'monday_8pm',
        label: 'Monday nights at 8 PM Eastern — does that work as your weekly 1:1 with me?',
        type: 'radio',
        options: ['Yes — perfect', 'Yes — but later (8:30 or 9 PM) would be even better', 'Not Monday — another day would be better', 'Not 8 PM — another time would be better', 'I\'m not sure yet'],
        required: true,
      },
      {
        id: 'alt_day',
        label: 'If NOT Monday — which day would work better? (pick all that work)',
        type: 'multi',
        options: ['Sunday evening', 'Tuesday evening', 'Wednesday evening', 'Thursday evening', 'Saturday morning', 'Saturday afternoon', 'Monday is fine — skip this question'],
      },
      {
        id: 'alt_time',
        label: 'If NOT 8 PM ET — what time of day works better?',
        type: 'radio',
        options: ['Early morning (7–9 AM ET)', 'Late morning (9–11 AM ET)', 'Lunch (11 AM–1 PM ET)', 'Afternoon (1–4 PM ET)', 'Early evening (5–7 PM ET)', 'Late evening (9–10 PM ET)', '8 PM is fine — skip this question'],
      },
      {
        id: 'whatsapp_window',
        label: 'Daily WhatsApp office hours run Sun–Thu, 9 AM–5 PM ET. When are you most likely to message me or respond?',
        type: 'radio',
        options: ['Morning (9–11 AM ET)', 'Midday (11 AM–1 PM ET)', 'Early afternoon (1–3 PM ET)', 'Late afternoon (3–5 PM ET)', 'After hours — I\'ll send when I can'],
      },
      {
        id: 'reminder_pref',
        label: 'Best way to remind you about the call each Monday',
        type: 'radio',
        options: ['Text / SMS the morning of', 'Text the night before', 'Email a few hours before', 'WhatsApp reminder', 'I don\'t need a reminder'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  {
    id: 'this_week',
    title: 'This week + questions for me',
    intro: "Last one.",
    fields: [
      {
        id: 'top_focus',
        label: 'If we could move ONE thing this week, what would it be? (pick all top priorities)',
        type: 'multi',
        options: [
          'Get off the pantoprazole',
          'Lower the BP',
          'End the abdominal pain',
          'Sleep through the night',
          'Lose a few pounds',
          'More daily energy',
          'Mental clarity / less brain fog',
          'Better mood',
          'Process some emotional weight',
          'Get a clean baseline on hormones',
        ],
        required: true,
      },
      {
        id: 'wins_this_week',
        label: 'Anything you\'re proud of this week — even small? (pick all)',
        type: 'multi',
        options: [
          'Stuck with the Bio Life protocol',
          'Drank more water',
          'Walked outside',
          'Slept better at least one night',
          'Cooked at home more',
          'Cut back on something (specify in next box)',
          'Resisted a craving',
          'Talked to someone honestly',
          'Prayed / read scripture',
          'Reduced a medication',
          'Nothing — survival week',
        ],
      },
      {
        id: 'anything_new',
        label: 'Anything NEW since last Tuesday\'s call — new symptom, new test result, new med, new stressor?',
        type: 'textarea',
        rows: 3,
        placeholder: '1–3 sentences. If nothing new, just type "nothing new."',
      },
      {
        id: 'questions_for_joel',
        label: 'What do you want me to be ready to answer on today\'s call?',
        type: 'textarea',
        rows: 5,
        placeholder: 'As many or as few as you want.',
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

  // Token comes from the URL Joel sends Wakita: ?token=<secret>
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
      const r = await fetch('/api/wakita-intake?token=' + encodeURIComponent(accessToken), {
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
            Your week-1 deep-dive just landed in my inbox. I'll read every word before we hop on Zoom — so we can use the time on <em>your</em> next move, not catching me up.
          </p>

          {intakeId && (
            <a
              href={`/api/wakita-intake-pdf?id=${encodeURIComponent(intakeId)}&token=${encodeURIComponent(accessToken)}`}
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
                Week 1 deep-dive — for Wakita
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: 2 }}>Joel Polley, RN — BraveWorks</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
            Hi Wakita — round two.
          </h1>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
            Last Tuesday we anchored the big picture. This week I want to go deeper on the four levers I couldn't fully reach in 60 minutes: <strong>what you actually eat every day</strong>, <strong>which foods are most likely behind the GI pain</strong>, <strong>your hormone picture</strong>, and <strong>how open you are to fasting + detox techniques</strong>.
          </p>
          <p style={{ color: INK_SOFT, fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            About <strong>10–12 minutes</strong>. Almost all tap-the-answer — only a few short typing questions. Required questions are flagged with a <span style={{ color: CLAY, fontWeight: 600 }}>·</span>. Be honest — the more honest, the better the protocol I can build for you.
          </p>
          <div style={{ background: SAGE_SOFT, border: `1px solid ${SAGE_DEEP}`, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.9rem', color: SAGE_DEEP, lineHeight: 1.5 }}>
            <strong>Confidential.</strong> Your answers go directly to me. Not shared with anyone — not even Annie. You'll get a PDF copy of everything once you submit.
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
            {submitting ? 'Sending to Joel…' : 'Submit deep-dive to Joel'}
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
