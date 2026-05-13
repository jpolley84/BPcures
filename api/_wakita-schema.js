// Shared field-label map for Wakita's pre-call intake.
//
// Mirrors the SECTIONS array in src/pages/WakitaIntakePage.jsx so the
// generated PDF + email summary read with full labels even when the
// React bundle isn't loaded server-side. If you add or rename a question
// on the page, mirror it here.
//
// Each section: { title, fields: [[id, label], ...] }

export const SECTION_MAP = [
  {
    title: 'Quick vitals',
    fields: [
      ['bp_recent', 'Most recent home BP'],
      ['bp_typical', 'BP usually runs'],
      ['bp_meds', 'BP medications now'],
      ['bp_meds_names', 'BP medication names'],
      ['weight', 'Weight'],
      ['height', 'Height'],
    ],
  },
  {
    title: 'How you feel right now',
    fields: [
      ['pain_status', 'Abdominal pain — current status'],
      ['pain_triggers', 'Pain triggers'],
      ['pain_quality', 'Pain quality'],
      ['melena_when', 'Melena — last episode'],
      ['reflux', 'Heartburn / reflux frequency'],
      ['bloating', 'Bloating frequency'],
      ['bowels_freq', 'Bowel movements — frequency'],
      ['bowels_form', 'Bowel form'],
      ['straining', 'Straining'],
      ['energy', 'Energy pattern'],
      ['sleep_hours', 'Sleep hours per night'],
      ['sleep_wakes', 'Night wake-ups'],
      ['snoring', 'Snoring / apnea'],
      ['mood', 'Mood (last 3 months)'],
      ['other_symptoms', 'Other symptoms'],
    ],
  },
  {
    title: 'Medications from the hospital',
    fields: [
      ['ppi_status', 'Pantoprazole status'],
      ['ppi_side_effects', 'PPI side effects'],
      ['bentyl_status', 'Bentyl (dicyclomine) status'],
      ['nsaid_use_kinds', 'NSAIDs used in past year'],
      ['nsaid_frequency', 'NSAID frequency'],
      ['tylenol_freq', 'Tylenol frequency'],
      ['benadryl_itching', 'Itching status'],
    ],
  },
  {
    title: 'Bio Life regimen (Mexico)',
    fields: [
      ['biolife_started', 'Started Bio Life'],
      ['biolife_response', 'Subjective response'],
      ['biolife_side_effects', 'Bio Life side effects'],
      ['biolife_chaparro_reaction', 'Chaparro Amargo reaction'],
      ['biolife_selenium_dose', 'Selenium Plus dose'],
      ['biolife_pink_powder', 'Pink powder identity'],
      ['mexico_findings_told', 'What Mexico clinic told her they found'],
    ],
  },
  {
    title: 'Existing supplements',
    fields: [
      ['supps_still_taking', 'Still taking daily'],
      ['supps_other', 'Other supplements / meds / herbs'],
    ],
  },
  {
    title: 'A typical day of eating',
    fields: [
      ['breakfast', 'Breakfast'],
      ['lunch', 'Lunch'],
      ['dinner', 'Dinner'],
      ['water', 'Water'],
      ['coffee', 'Coffee'],
      ['alcohol', 'Alcohol'],
      ['sweets', 'Sweets / soda / juice'],
      ['food_triggers', 'Suspected food triggers'],
    ],
  },
  {
    title: 'Lifestyle + stress',
    fields: [
      ['movement', 'Movement / activity'],
      ['stress', 'Stress 1-10'],
      ['stress_carries', 'Body carries stress where'],
      ['sun_time', 'Sun time'],
      ['caregiver', 'Caregiver responsibilities'],
    ],
  },
  {
    title: 'Family history',
    fields: [
      ['fam_htn', 'HTN'],
      ['fam_diabetes', 'Type 2 diabetes / pre-diabetes'],
      ['fam_cardiac', 'Heart attack / stroke / sudden death'],
      ['fam_cancer', 'Cancer'],
      ['fam_autoimmune', 'Autoimmune'],
      ['fam_gi', 'GI conditions'],
    ],
  },
  {
    title: 'Personal history',
    fields: [
      ['pcp_status', 'PCP status'],
      ['menopause', 'Menopause status'],
      ['hrt', 'HRT history'],
      ['surgeries', 'Major surgeries'],
      ['allergies', 'Allergies'],
      ['smoking', 'Smoking / vaping'],
    ],
  },
  {
    title: 'Goals',
    fields: [
      ['top_3_goals', 'Top 90-day goals'],
      ['biggest_fear', 'Biggest fear if NOT dialed in'],
      ['past_failures', 'What has let her down'],
      ['support_at_home', 'Support at home'],
      ['coaching_interest', 'Coaching interest level'],
      ['why_now', 'Why now'],
    ],
  },
  {
    title: 'Questions for Joel',
    fields: [
      ['questions_for_joel', 'Her questions'],
      ['preferred_followup', 'Preferred follow-up channel'],
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
