// Shared field-label map for the Life Change Accelerator deep intake.
//
// Mirrors the SECTIONS array in src/pages/AcceleratorAssessmentPage.jsx so the
// generated PDF, the email summary, and the read-all admin view all render full
// labels without loading the React bundle. If you add or rename a question on
// the page, mirror it here or it will silently vanish from the PDF.
//
// 2026-08-10: built for the 9-person founding cohort. Three sources merged:
//   1. Joel's BP/numbers layer (extends what /sprint-assessment already asked)
//   2. Annie's "Everyday Nurse Wellness Assessment" PDF, in full: general
//      health, hormonal symptoms, cycle, lifestyle/diet, stress + emotions,
//      environmental toxins, the postnatal module, and birth control /
//      medical interventions
//   3. Program logistics Joel promised on the 2026-08-10 orientation call:
//      shipping address for the 90-day tea, plus-one details, meeting-day vote
//
// Each section: { title, fields: [[id, label], ...] }

export const SECTION_MAP = [
  {
    title: 'About you',
    fields: [
      ['full_name', 'Full name'],
      ['email', 'Email'],
      ['phone', 'Phone'],
      ['age', 'Age'],
      ['timezone', 'Time zone'],
      ['ship_name', 'Ship tea to (name)'],
      ['ship_street', 'Street address'],
      ['ship_city', 'City'],
      ['ship_state', 'State / region'],
      ['ship_zip', 'ZIP / postal code'],
      ['ship_country', 'Country'],
    ],
  },
  {
    title: 'Your numbers',
    fields: [
      ['bp_recent', 'Most recent blood pressure'],
      ['bp_date', 'When that was taken'],
      ['bp_range', 'Typical range lately'],
      ['pulse', 'Resting heart rate'],
      ['weight', 'Current weight'],
      ['height', 'Height'],
      ['a1c', 'A1C or fasting glucose'],
      ['cholesterol', 'Cholesterol (total / LDL)'],
      ['kidney', 'Kidney (eGFR or creatinine)'],
      ['thyroid', 'Thyroid (TSH and any others)'],
      ['potassium', 'Potassium'],
      ['magnesium', 'Magnesium'],
      ['vitamin_d', 'Vitamin D'],
      ['other_labs', 'Any other labs you have'],
      ['has_cuff', 'Do you own a blood pressure cuff?'],
    ],
  },
  {
    title: 'Medications and supplements',
    fields: [
      ['medications', 'Medications you take now (name + dose)'],
      ['supplements', 'Supplements you take now'],
      ['med_changes', 'Any recent medication changes'],
      ['allergies', 'Allergies or reactions to avoid'],
      ['pharmacy_notes', 'Anything your doctor has said about reducing a medication'],
    ],
  },
  {
    title: 'General health and well-being',
    fields: [
      ['overall_health', 'Overall health in one word'],
      ['unexplained_fatigue', 'Feel unwell or fatigued without explanation'],
      ['sick_frequency', 'How often you get sick'],
      ['chronic_conditions', 'Diagnosed chronic conditions'],
      ['digestive_issues', 'Digestive issues (bloating, constipation, reflux)'],
      ['food_cravings', 'Unexplained food cravings'],
      ['headaches', 'Headaches or migraines'],
      ['cold_extremities', 'Feel cold often, hands and feet'],
      ['skin_changes', 'Changes in your skin'],
      ['joint_pain', 'Joint or muscle pain without clear cause'],
    ],
  },
  {
    title: 'Hormonal symptoms',
    fields: [
      ['hormone_symptoms', 'Symptoms checked'],
      ['hormone_symptom_count', 'Number checked'],
      ['cycle_regularity', 'Menstrual cycle regularity'],
      ['pms_severity', 'Severe PMS symptoms'],
      ['period_pain', 'Extreme period pain, heavy bleeding, clotting'],
      ['diagnosed_conditions', 'Diagnosed or suspected (PCOS, endometriosis, fibroids, thyroid, adrenal, insulin resistance)'],
      ['pregnancy_complications', 'Pregnancy complications, infertility, or miscarriage'],
      ['postpartum_recovery', 'How postpartum recovery went'],
      ['libido_changes', 'Changes in libido or sexual function'],
      ['vaginal_dryness', 'Vaginal dryness or discomfort'],
      ['body_hair_changes', 'Changes in body hair growth'],
      ['hot_flashes', 'Hot flashes or night sweats'],
      ['menopause_stage', 'Where you are with menopause'],
    ],
  },
  {
    title: 'Postnatal recovery',
    fields: [
      ['time_since_birth', 'Time since you gave birth'],
      ['postnatal_symptoms', 'Symptoms you still experience'],
      ['postnatal_education', 'Were you taught how to heal after birth'],
      ['baby_blues', 'Baby blues, postpartum depression or anxiety'],
      ['overwhelmed_do_it_all', 'Feel overwhelmed or like you have to do it all'],
      ['body_after_children', 'How you feel about your body after children'],
      ['birth_grief', 'Resentment, grief, or guilt about your birth experience'],
      ['motherhood_support', 'Support system that understands your motherhood journey'],
      ['selfcare_frequency', 'How often you care for yourself beyond surviving the day'],
    ],
  },
  {
    title: 'Birth control and medical interventions',
    fields: [
      ['natural_openness', 'Openness to natural solutions'],
      ['hormonal_bc_history', 'Hormonal birth control history'],
      ['post_bc_symptoms', 'Symptoms after stopping birth control'],
      ['antibiotics_steroids', 'Frequent antibiotics or steroids'],
      ['surgeries', 'Major surgeries, including C-sections'],
      ['thyroid_disorder', 'Thyroid disorder diagnosed or suspected'],
    ],
  },
  {
    title: 'Lifestyle and diet',
    fields: [
      ['processed_foods', 'Processed or fast food'],
      ['vegetable_servings', 'Vegetable servings daily'],
      ['disrupting_foods', 'Sugar, dairy, soy, processed meats, seed oils'],
      ['caffeine', 'Caffeine'],
      ['alcohol', 'Alcohol'],
      ['water_intake', 'Water daily'],
      ['sugary_drinks', 'Sugary beverages'],
      ['tobacco', 'Tobacco or nicotine'],
      ['typical_day_food', 'What a typical day of eating looks like'],
      ['food_restrictions', 'Allergies, dislikes, or foods you will not eat'],
      ['who_else_eats', 'Who else eats at your table'],
      ['food_budget', 'Anything I should know about your grocery budget'],
      ['cooking_reality', 'How much cooking is realistic for you'],
    ],
  },
  {
    title: 'Movement',
    fields: [
      ['activity_frequency', 'Physical activity now'],
      ['movement_limits', 'Physical limitations, pain, or mobility aids'],
      ['chair_or_wheelchair', 'Do you need chair or wheelchair friendly movement'],
      ['movement_enjoy', 'Movement you actually enjoy'],
    ],
  },
  {
    title: 'Stress, emotions and mental health',
    fields: [
      ['stress_level', 'Stress level'],
      ['sleep_quality', 'Sleep quality'],
      ['sleep_waking', 'Do you wake in the night, and what time'],
      ['anxiety', 'Anxiety or feeling on edge'],
      ['emotional_support', 'Feel emotionally supported'],
      ['resentment', 'Resentment, bitterness, or unforgiveness'],
      ['unresolved_trauma', 'Unresolved trauma'],
      ['sense_of_purpose', 'Sense of purpose or fulfillment'],
      ['burnout', 'Burned out, overwhelmed, running on empty'],
      ['selfcare_time', 'Time for self-care and relaxation'],
      ['peace_with_body', 'At peace with your body'],
      ['grief_loss', 'Any grief or loss you are carrying'],
    ],
  },
  {
    title: 'Environment and toxin exposure',
    fields: [
      ['plastics', 'Plastic containers or bottles'],
      ['conventional_products', 'Conventional cleaning, skincare, or makeup'],
      ['toxin_environment', 'High-toxin living or working environment'],
      ['filtered_water', 'Filtered or purified water'],
      ['mold_exposure', 'Mold exposure'],
    ],
  },
  {
    title: 'Your history',
    fields: [
      ['already_tried', 'What you have already tried'],
      ['what_stuck', 'What actually stuck, and what did not'],
      ['what_derailed', 'What has derailed you before'],
      ['hardest_part', 'The hardest part right now'],
      ['biggest_fear', 'Your biggest frustration or fear about your health'],
    ],
  },
  {
    title: 'What winning looks like',
    fields: [
      ['change_one_thing', 'If you could change ONE thing about your health today'],
      ['win_12_weeks', 'What winning looks like in 12 weeks'],
      ['win_one_year', 'What winning looks like in a year'],
      ['life_change_day', 'The thing you want your health back in order to do'],
      ['anything_else', 'Anything else I should know'],
    ],
  },
  {
    title: 'Your plus one',
    fields: [
      ['plus_one_has', 'Bringing a plus one'],
      ['plus_one_name', 'Plus one name'],
      ['plus_one_email', 'Plus one email'],
      ['plus_one_relationship', 'Relationship to you'],
      ['plus_one_assessment', 'Should they get their own assessment'],
      ['plus_one_own_call', 'Do they want their own 1:1 call'],
    ],
  },
  {
    title: 'Logistics',
    fields: [
      ['meeting_vote', 'Weekly coaching day vote (7pm Eastern)'],
      ['meeting_conflicts', 'Days or times that never work'],
      ['call_availability', 'Best days and times for your 1:1 with Joel and Annie'],
      ['consent_ack', 'Acknowledgement'],
    ],
  },
];

// Flat id -> label lookup, for the admin read-all view.
export const LABELS = Object.fromEntries(
  SECTION_MAP.flatMap((s) => s.fields.map(([id, label]) => [id, label]))
);

// Checkbox groups arrive as arrays; everything else is a string.
export function formatAnswer(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  return String(v ?? '').trim();
}

// Fields we surface at the top of Joel's notification email so he can triage
// without opening the PDF.
export const HEADLINE_FIELDS = [
  ['full_name', 'Name'],
  ['bp_recent', 'Latest BP'],
  ['medications', 'Medications'],
  ['hormone_symptom_count', 'Hormone symptoms checked'],
  ['hardest_part', 'Hardest part'],
  ['win_12_weeks', 'Winning in 12 weeks'],
  ['meeting_vote', 'Meeting vote'],
];
