// Shared field-label map for Luvenia's pre-call BP Triangle intake.
//
// Mirrors the SECTIONS array in src/pages/LuveniaIntakePage.jsx so the
// generated PDF + email summary read with full labels server-side. If
// you add or rename a question on the page, mirror it here.
//
// Auto-generated 2026-06-02 by scripts/extract-luvenia-schema.mjs.
// Re-run that script anytime the page schema changes.

export const SECTION_MAP = [
  {
    title: "Welcome, Luvenia",
    fields: [
      ["age", "Your age"],
      ["weight", "Current weight"],
      ["location", "City + state"],
    ],
  },
  {
    title: "Your BP — the numbers",
    fields: [
      ["bp_highest", "Highest reading you remember seeing"],
      ["bp_lowest", "Lowest reading you remember seeing"],
      ["bp_meds", "BP medications you are on right now (pick all)"],
      ["meds_history", "How long have you been on BP medication overall?"],
      ["meds_working", "Have your BP meds stopped working as well as they used to?"],
      ["bp_started_year", "About when did your BP first become a problem?"],
      ["family_history", "Family history (pick all that apply)"],
      ["recent_labs", "Recent labs you have on hand (pick all)"],
      ["last_cardiology", "Last cardiology visit"],
      ["cardiology_said", "What did the cardiologist (or your doctor) tell you the last visit?"],
    ],
  },
  {
    title: "Pressure #1 — STRESS (cortisol)",
    fields: [
      ["sleep_staying", "Staying asleep through the night"],
      ["sleep_3am", "Do you wake up between 2 and 4 AM and can\\"],
      ["morning_energy", "Morning energy — when you first wake up, you feel…"],
      ["daily_stress_sources", "Where is daily stress coming from? (pick all)"],
      ["recent_stress", "Any specific big stress events in the last 6 months?"],
      ["belly_weight_pattern", "Belly weight — when did it show up?"],
      ["afternoon_crash", "Afternoon crash (1–4 PM)"],
      ["evening_2nd_wind", "Do you get a "],
      ["stress_cravings", "When stressed, what do you crave?"],
      ["white_coat", "White-coat effect — does your BP spike specifically AT the doctor?"],
      ["trauma_history", "Anything from earlier in life that\\"],
    ],
  },
  {
    title: "Pressure #2 — SUGAR (insulin)",
    fields: [
      ["a1c_when", "When was your last A1c?"],
      ["fasting_glucose", "Fasting glucose — if you know it"],
      ["diabetes_meds", "Diabetes / blood sugar medications (pick all)"],
      ["carb_sleepiness", "After a meal with bread, pasta, or rice — do you get sleepy?"],
      ["afternoon_cravings", "Afternoon sugar / carb cravings (2–4 PM)"],
      ["evening_cravings", "Evening sweet tooth (after dinner)"],
      ["weight_5yr", "Weight history over the last 5 years"],
      ["family_diabetes", "Family history of diabetes / metabolic syndrome"],
      ["fasting_pattern", "When you go without food (skipping a meal), how do you feel?"],
      ["processed_food", "Processed foods (chips, crackers, fast food, packaged snacks) — how do they sit with you?"],
      ["belly_first_thing", "First thing in the morning — is your belly flat or distended?"],
    ],
  },
  {
    title: "Pressure #3 — PIPE (vascular)",
    fields: [
      ["cold_extremities", "Cold hands and / or feet"],
      ["family_stroke", "Family history of stroke or heart attack — be specific"],
      ["inflammation_markers", "Inflammation signs (pick all)"],
      ["smoking_history", "Smoking history"],
      ["exercise_tolerance", "Exercise tolerance — compared to 5 years ago"],
      ["shortness_breath", "Shortness of breath"],
      ["swelling_legs", "Swelling in ankles, feet, or lower legs"],
    ],
  },
  {
    title: "NEWSTART — N for NUTRITION",
    fields: [
      ["lunch_typical", "Typical lunch (pick all)"],
      ["dinner_typical", "Typical dinner (pick all)"],
      ["cook_vs_eat_out", "Cook at home vs. eat out — honest split"],
      ["veggies_per_day", "Vegetables — about how many servings per day?"],
      ["fruits_per_day", "Fruits — about how many servings per day?"],
      ["processed_freq", "Processed food (bread, packaged snacks, fast food) frequency"],
      ["cooking_oils", "Cooking oils / fats you use (pick all)"],
      ["animal_products", "Animal products you eat (pick all)"],
      ["caffeine_sources", "Caffeine sources (pick all)"],
      ["caffeine_amount", "Total caffeine per day"],
      ["alcohol_pattern", "Alcohol pattern — honest answer"],
      ["supplements_current", "Supplements / vitamins you take right now (pick all)"],
      ["food_sensitivities", "Known food sensitivities or reactions"],
    ],
  },
  {
    title: "NEWSTART — E for EXERCISE",
    fields: [
      ["days_per_week", "How many days a week do you move on purpose?"],
      ["minutes_per_session", "Minutes per session (typical)"],
      ["energy_movement", "When do you have the most energy for movement?"],
      ["pain_barriers", "Joint or pain barriers to movement (pick all)"],
      ["past_athletic", "Past athletic life — were you ever active?"],
      ["movement_obstacles", "What gets in the way of moving more right now?"],
    ],
  },
  {
    title: "NEWSTART — W for WATER",
    fields: [
      ["water_quality", "Water you usually drink"],
      ["other_liquids", "Other liquids in your day (pick all)"],
      ["hydration_symptoms", "Hydration warning signs you notice (pick all)"],
    ],
  },
  {
    title: "NEWSTART — S for SUNLIGHT",
    fields: [
      ["vitamin_d", "Vitamin D level — if you know it"],
      ["sun_timing", "When do you get most of your sun exposure?"],
      ["sunscreen_use", "Sunscreen pattern"],
      ["screens_at_night", "Screens (phone / TV / tablet) at night"],
    ],
  },
  {
    title: "NEWSTART — T for TEMPERANCE",
    fields: [
      ["tobacco_current", "Tobacco / vaping right now"],
      ["recreational", "Recreational substances — anything you want me to know?"],
      ["sugar_temperance", "Sugar — how moderate are you?"],
      ["processed_temperance", "Processed / fast food — moderation level"],
      ["screen_time", "Total screen time per day (phone + TV + computer)"],
      ["over_doing", "Anything else you know you\\"],
    ],
  },
  {
    title: "NEWSTART — A for AIR",
    fields: [
      ["work_air", "Workplace air"],
      ["outdoor_air_time", "Time outdoors in fresh air per day"],
      ["breathing_pattern", "Breathing patterns (pick all)"],
      ["sleep_apnea_check", "Has anyone ever told you that you stop breathing while you sleep?"],
    ],
  },
  {
    title: "NEWSTART — R for REST",
    fields: [
      ["sleep_quality", "Sleep quality — overall"],
      ["naps", "Naps during the day"],
      ["sabbath_day", "Do you have a day off / Sabbath day weekly?"],
      ["downtime", "Do you actually rest when you have downtime?"],
      ["hobbies", "Hobbies that recharge you (pick all)"],
      ["last_vacation", "Last real vacation (where you fully unplugged)"],
    ],
  },
  {
    title: "NEWSTART — T for TRUST (faith + connection)",
    fields: [
      ["prayer_freq", "Prayer / meditation frequency"],
      ["community", "Where do you find community? (pick all)"],
      ["three_am_mind", "What wakes you at 3 AM in your mind? What\\"],
      ["sources_joy", "Where is your joy / hope coming from right now? (pick all)"],
      ["support_strength", "How strong is your support system right now?"],
      ["who_supports", "Who do you call when life is hard? (pick all)"],
    ],
  },
  {
    title: "What you want from our call",
    fields: [
      ["tried_didnt_work", "What have you ALREADY tried for your BP that didn\\"],
      ["afraid_to_try", "Is there anything you\\"],
      ["anything_else", "Anything else I should know that I didn\\"],
    ],
  },
];

// Render a value into a single-line string for table cells / PDFs.
export function formatAnswer(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
