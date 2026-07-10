// Shared field-label map for John Treadwell's 30-day program assessment.
//
// Mirrors the SECTIONS array in src/pages/JohnTAssessmentPage.jsx so the
// generated PDF + email summary read with full labels even when the React
// bundle isn't loaded server-side. If you add or rename a question on the
// page, mirror it here.
//
// 2026-07-09: built for John Treadwell (Stage 4 CKD, high BP, daughter
// Berneita administering). Covers medical/kidney history, diet, all three
// Triangle corners (stress/sugar/sodium), motivation, ideology/readiness,
// habits/lifestyle, and support/logistics — per Joel's request for an
// in-depth pre-plan assessment, mostly click-answer.
//
// Each section: { title, fields: [[id, label], ...] }

export const SECTION_MAP = [
  {
    title: 'Quick check-in',
    fields: [
      ['bp_recent', 'Most recent BP reading'],
      ['bp_context', 'Where that reading was taken'],
      ['weight', 'Current weight'],
      ['swelling', 'Swelling / fluid retention'],
      ['energy_level', 'Energy level lately'],
      ['appetite', 'Appetite'],
    ],
  },
  {
    title: 'Kidney + medical history',
    fields: [
      ['ckd_stage_confirmed', 'CKD stage status'],
      ['dialysis_status', 'Dialysis status'],
      ['nephrologist_frequency', 'Nephrologist visit frequency'],
      ['original_cause', 'What originally caused the kidney decline'],
      ['imaging_available', 'Imaging / records from Emory'],
      ['other_conditions', 'Other diagnosed conditions'],
      ['current_medications', 'Current medications (name + dose)'],
      ['allergies', 'Allergies / reactions to avoid'],
    ],
  },
  {
    title: 'A typical day of eating',
    fields: [
      ['breakfast_foods', 'Breakfast — typical foods'],
      ['lunch_foods', 'Lunch — typical foods'],
      ['dinner_foods', 'Dinner — typical foods'],
      ['snacks', 'Snacks'],
      ['protein_sources', 'Main protein sources'],
      ['salt_shaker_use', 'Salt shaker at the table'],
      ['fluid_intake', 'Fluid intake pattern'],
      ['water_glasses', 'Glasses of plain water per day'],
    ],
  },
  {
    title: 'Sodium corner',
    fields: [
      ['processed_food_freq', 'Processed / packaged food frequency'],
      ['canned_foods_freq', 'Canned food frequency'],
      ['fast_food_freq', 'Fast food / restaurant frequency'],
      ['reads_labels', 'Reads nutrition labels for sodium'],
      ['hidden_sodium_awareness', 'Awareness of hidden sodium sources'],
    ],
  },
  {
    title: 'Sugar corner',
    fields: [
      ['sweets_freq', 'Sweets / desserts frequency'],
      ['sugary_drinks_freq', 'Sugary drinks frequency'],
      ['blood_sugar_history', 'Blood sugar / diabetes history'],
    ],
  },
  {
    title: 'Stress corner',
    fields: [
      ['major_life_changes', 'Major life changes / losses (recent years)'],
      ['grief_processing', 'How grief has been processed'],
      ['stress_level', 'Stress level lately (1–10)'],
      ['sleep_quality', 'Sleep quality'],
      ['stress_outlets', 'Current stress outlets'],
      ['spiritual_practice', 'Spiritual practice'],
    ],
  },
  {
    title: 'Habits + lifestyle',
    fields: [
      ['movement_daily', 'Movement / activity level'],
      ['mobility_limitations', 'Mobility limitations'],
      ['sun_exposure', 'Sunlight exposure'],
      ['smoking_status', 'Smoking status'],
      ['alcohol_use', 'Alcohol use'],
    ],
  },
  {
    title: 'Motivation + goals',
    fields: [
      ['primary_goal', 'What he wants most out of this'],
      ['motivation_level', 'Motivation level right now (1–10)'],
      ['past_attempts', 'What he has already tried'],
      ['biggest_fear', 'Biggest fear or worry'],
      ['support_system', 'Who is supporting him through this'],
    ],
  },
  {
    title: 'Ideology + readiness',
    fields: [
      ['openness_to_plantbased', 'Openness to a mostly plant-based diet'],
      ['faith_background', 'Faith background'],
      ['willingness_scale', 'Readiness to make real changes (1–10)'],
      ['biggest_obstacle', 'Biggest obstacle to changing'],
    ],
  },
  {
    title: 'Support + logistics',
    fields: [
      ['who_completing_this', 'Who is completing this assessment'],
      ['caregiver_role', "Berneita's day-to-day role"],
      ['best_contact_method', 'Best way to reach the family'],
      ['best_contact_time', 'Best time of day to reach out'],
      ['anything_else', 'Anything else Joel should know'],
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
