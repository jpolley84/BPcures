// Shared field-label map for Wakita's pre-call intake.
//
// Mirrors the SECTIONS array in src/pages/WakitaIntakePage.jsx so the
// generated PDF + email summary read with full labels even when the
// React bundle isn't loaded server-side. If you add or rename a question
// on the page, mirror it here.
//
// 2026-05-17: rebuilt for the week-1 coaching deep-dive intake.
// Sections now cover: vitals progress, symptom progress, detailed diet,
// 5-trigger GI drill-down, hormones, fasting/detox openness, daily habits,
// relationship + emotional weight, coaching cadence, this week's focus.
//
// Each section: { title, fields: [[id, label], ...] }

export const SECTION_MAP = [
  {
    title: 'Quick check-in',
    fields: [
      ['bp_recent', 'Most recent home BP'],
      ['bp_trend', 'BP trend vs. last week'],
      ['weight', 'Weight'],
      ['weight_trend', 'Weight trend vs. last week'],
      ['overall_feeling', 'Overall feeling since last call'],
    ],
  },
  {
    title: 'Symptom progress this week',
    fields: [
      ['pain_status', 'Abdominal pain — current status'],
      ['reflux_freq', 'Reflux frequency this week'],
      ['bloating_freq', 'Bloating frequency this week'],
      ['bowels_freq', 'Bowel movements this week'],
      ['energy_pattern', 'Energy pattern this week'],
      ['sleep_quality', 'Sleep quality this week'],
    ],
  },
  {
    title: 'A typical day of eating',
    fields: [
      ['wake_time', 'Wake time'],
      ['first_thing', 'First thing in the morning'],
      ['breakfast_foods', 'Breakfast foods'],
      ['lunch_foods', 'Lunch foods'],
      ['dinner_foods', 'Dinner foods'],
      ['snacks', 'Snacks between meals'],
      ['drinks_day', 'Drinks throughout the day'],
      ['water_glasses', 'Glasses of water per day'],
      ['last_food_time', 'Last food of the day — time'],
      ['eating_window', 'Eating window (first food → last food)'],
    ],
  },
  {
    title: 'GI triggers — the 5 big ones',
    fields: [
      ['gluten_freq', 'Gluten frequency'],
      ['gluten_after', 'After eating gluten'],
      ['dairy_freq', 'Dairy frequency'],
      ['dairy_after', 'After eating dairy'],
      ['red_meat_freq', 'Red meat frequency'],
      ['processed_meat_freq', 'Processed meat frequency'],
      ['meat_after', 'After heavy meat meals'],
      ['alcohol_freq', 'Alcohol frequency'],
      ['alcohol_after', 'After alcohol'],
      ['sugar_freq', 'Sugar / sweets frequency'],
      ['sugar_after', 'After sugar'],
      ['spicy_freq', 'Spicy food frequency'],
      ['fried_freq', 'Fried food frequency'],
      ['fast_food_freq', 'Fast food / restaurant frequency'],
      ['foods_already_off', 'Foods she already avoids'],
      ['gut_intuition', 'Her guess about her #1 trigger food'],
    ],
  },
  {
    title: 'Hormones',
    fields: [
      ['hormones_checked', 'Hormones blood-checked status'],
      ['menopause_status', 'Menopause status'],
      ['thyroid_history', 'Thyroid history'],
      ['hot_flashes', 'Hot flashes / night sweats'],
      ['sleep_2_4_am', 'Waking 2–4 AM'],
      ['belly_weight', 'Belly weight gain'],
      ['hormone_symptoms', 'Hormone-dysfunction symptoms (last 3–6 months)'],
      ['cortisol_pattern', 'Most exhausted time of day'],
    ],
  },
  {
    title: 'Fasting + detox openness',
    fields: [
      ['water_fast_history', 'Longest water fast ever'],
      ['intermittent_fast', 'Intermittent fasting comfort'],
      ['past_detoxes', 'Past detoxes / cleanses'],
      ['water_fast_open', 'Open to supervised 3-day water fast'],
      ['liver_flush_open', 'Open to liver / gallbladder flush'],
      ['enema_open', 'Open to colon hydrotherapy / enemas'],
    ],
  },
  {
    title: 'Daily habits + lifestyle',
    fields: [
      ['movement_daily', 'Movement this week'],
      ['walk_minutes', 'Walking minutes per day'],
      ['sun_minutes', 'Direct sunlight minutes per day'],
      ['phone_before_bed', 'Phone / screens before bed'],
      ['bedtime', 'Bedtime'],
      ['stress_level', 'Stress level last 7 days (1–10)'],
      ['stress_outlets', 'Stress outlets'],
    ],
  },
  {
    title: 'Relationship + emotional weight',
    fields: [
      ['relationship_status', 'Relationship status'],
      ['relationship_security', 'Relationship security 1–10'],
      ['unforgiveness', 'Unforgiveness in relationship'],
      ['resentment_other', 'Resentment toward others'],
      ['spiritual_practice', 'Spiritual practice'],
      ['who_supports', 'Who she talks to when overwhelmed'],
    ],
  },
  {
    title: 'Coaching schedule',
    fields: [
      ['monday_8pm', 'Monday 8 PM ET works?'],
      ['alt_day', 'Alternative days that work'],
      ['alt_time', 'Alternative time of day'],
      ['whatsapp_window', 'Best WhatsApp window'],
      ['reminder_pref', 'Reminder preference'],
    ],
  },
  {
    title: 'This week + questions for Joel',
    fields: [
      ['top_focus', 'Top priorities this week'],
      ['wins_this_week', 'Wins this week'],
      ['anything_new', 'Anything new since last call'],
      ['questions_for_joel', 'Her questions for Joel'],
    ],
  },
];

// Formats one answer value (string or array) for plain-text/HTML display
export function formatAnswer(v) {
  if (Array.isArray(v)) {
    return v.length > 0 ? v.join(', ') : '';
  }
  return String(v ?? '').trim();
}
