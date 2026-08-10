// SINGLE SOURCE OF TRUTH for the Life Change Accelerator intake questions.
//
// Imported by all four consumers so they can never drift apart:
//   src/pages/AcceleratorAssessmentPage.jsx   the live form
//   api/_accelerator-schema.js                labels for the filled-in PDF
//   api/_accelerator-blank-pdf.js             the printable blank form
//   api/accelerator-assessments.js            the read-all admin view
//
// Before this file existed the question list lived in the React page and the
// labels were hand-mirrored in the schema. That works right up until someone
// edits one and forgets the other, at which point answers silently vanish from
// the PDF Joel reads. Now there is one list.
//
// 2026-08-10: merges Joel's BP/labs layer, Annie's full Everyday Nurse Wellness
// Assessment, and the logistics promised on the orientation call.

export const t = (id, label, opts = {}) => ({ kind: 'text', id, label, ...opts });
export const area = (id, label, opts = {}) => ({ kind: 'textarea', id, label, rows: 3, ...opts });
export const one = (id, label, choices, opts = {}) => ({ kind: 'radio', id, label, choices, ...opts });
export const many = (id, label, choices, opts = {}) => ({ kind: 'checks', id, label, choices, ...opts });
export const note = (text) => ({ kind: 'note', text });

const FREQ = ['Never', 'Occasionally', 'Often', 'Daily'];
const YN = ['No', 'Yes'];

export const SECTIONS = [
  {
    title: 'About you',
    blurb: 'The basics, plus where to ship your 90 day supply of tea.',
    fields: [
      t('full_name', 'Your full name', { required: true }),
      t('email', 'Email', { type: 'email', required: true }),
      t('phone', 'Phone', { type: 'tel' }),
      t('age', 'Age'),
      t('timezone', 'Your time zone', { placeholder: 'e.g. Eastern, Central, Pacific' }),
      note('Your tea is included in the program. Tell us where to send it.'),
      t('ship_name', 'Ship to (name)'),
      t('ship_street', 'Street address'),
      t('ship_city', 'City'),
      t('ship_state', 'State or region'),
      t('ship_zip', 'ZIP or postal code'),
      t('ship_country', 'Country', { placeholder: 'United States' }),
    ],
  },
  {
    title: 'Your numbers',
    blurb: 'Whatever you have. Rough is fine, and blank is fine. We will fill the gaps together.',
    fields: [
      t('bp_recent', 'Most recent blood pressure', { placeholder: 'e.g. 148 / 92' }),
      t('bp_date', 'When was that taken?', { placeholder: 'e.g. this morning, last week' }),
      t('bp_range', 'What does it usually run lately?', { placeholder: 'e.g. 130s to 150s' }),
      one('has_cuff', 'Do you own a blood pressure cuff?', ['Yes, and I use it', 'Yes, but I rarely use it', 'No, I need one']),
      t('pulse', 'Resting heart rate', { placeholder: 'e.g. 74' }),
      t('weight', 'Current weight'),
      t('height', 'Height'),
      t('a1c', 'A1C or fasting glucose', { placeholder: 'if you know it' }),
      t('cholesterol', 'Cholesterol (total / LDL)', { placeholder: 'if you know it' }),
      t('kidney', 'Kidney (eGFR or creatinine)', { placeholder: 'if you know it' }),
      t('thyroid', 'Thyroid (TSH, T3, T4)', { placeholder: 'if you know it' }),
      t('potassium', 'Potassium', { placeholder: 'if you know it' }),
      t('magnesium', 'Magnesium', { placeholder: 'if you know it' }),
      t('vitamin_d', 'Vitamin D', { placeholder: 'if you know it' }),
      area('other_labs', 'Any other labs you have in hand', { rows: 2 }),
    ],
  },
  {
    title: 'Medications and supplements',
    blurb: 'We never change your medications. Your doctor owns that. We just need the full picture.',
    fields: [
      area('medications', 'Medications you take now, with doses if you have them', { rows: 4 }),
      area('supplements', 'Supplements you take now', { rows: 3 }),
      area('med_changes', 'Any recent changes, added or stopped', { rows: 2 }),
      area('allergies', 'Allergies or reactions we should avoid', { rows: 2 }),
      area('pharmacy_notes', 'Has your doctor ever mentioned reducing a medication?', { rows: 2 }),
    ],
  },
  {
    title: 'General health',
    blurb: 'Answer honestly. Nobody is judging you here.',
    fields: [
      one('overall_health', 'Your overall health in one word', ['Excellent', 'Good', 'Fair', 'Poor']),
      one('unexplained_fatigue', 'How often do you feel unwell or tired for no clear reason?', ['Rarely', 'Occasionally', 'Often', 'Daily']),
      one('sick_frequency', 'How often do you get sick?', ['Hardly ever', 'Once or twice a year', 'Several times a year', 'Constantly']),
      area('chronic_conditions', 'Any diagnosed chronic conditions?', { rows: 2 }),
      one('digestive_issues', 'Digestive issues (bloating, constipation, reflux)', FREQ),
      one('food_cravings', 'Unexplained cravings (sugar, salt, carbs)', ['No', 'Occasionally', 'Often', 'Daily']),
      one('headaches', 'Headaches or migraines', ['No', 'Occasionally', 'Often', 'Daily']),
      one('cold_extremities', 'Do you feel cold often, especially hands and feet?', ['No', 'Occasionally', 'Yes, frequently']),
      area('skin_changes', 'Changes in your skin, dryness or acne', { rows: 2 }),
      one('joint_pain', 'Joint or muscle pain without a clear cause', ['No', 'Occasionally', 'Often']),
    ],
  },
  {
    title: 'Hormones',
    blurb: 'This is Annie’s section. Check everything that applies, even if it feels unrelated.',
    fields: [
      many('hormone_symptoms', 'Check all that apply', [
        'Irregular periods',
        'Fatigue no matter how much I sleep',
        'Weight gain, especially the belly',
        'Bloating or digestive issues',
        'Low libido',
        'Hair thinning or hair loss',
        'Mood swings, anxiety, or depression',
        'Brain fog or trouble focusing',
        'Cold hands and feet',
        'Frequent headaches or migraines',
        'Facial or chin hair',
        'Night sweats',
      ]),
      one('menopause_stage', 'Where are you with menopause?', [
        'Still cycling normally', 'Perimenopause', 'Menopause', 'Post-menopause', 'Not sure',
      ]),
      one('cycle_regularity', 'How regular is your cycle?', [
        'Very regular', 'Somewhat regular', 'Irregular', 'No cycle',
      ]),
      one('pms_severity', 'Severe PMS symptoms?', ['No', 'Occasionally', 'Yes, every cycle']),
      one('period_pain', 'Extreme period pain, heavy bleeding, or clotting?', ['No', 'Occasionally', 'Yes, every cycle', 'Not applicable']),
      many('diagnosed_conditions', 'Diagnosed with or suspect any of these?', [
        'PCOS', 'Endometriosis', 'Fibroids', 'Thyroid disorder',
        'Adrenal fatigue', 'Diabetes or insulin resistance', 'None of the above',
      ]),
      one('hot_flashes', 'Hot flashes or night sweats', ['No', 'Occasionally', 'Often', 'Daily']),
      area('pregnancy_complications', 'Pregnancy complications, infertility, or miscarriage', { rows: 2 }),
      one('postpartum_recovery', 'How was your postpartum recovery?', ['Easy', 'Challenging', 'Very hard', 'I have not given birth']),
      area('libido_changes', 'Changes in libido or sexual function', { rows: 2 }),
      one('vaginal_dryness', 'Vaginal dryness or discomfort', ['No', 'Occasionally', 'Often']),
      area('body_hair_changes', 'Changes in body hair growth, increase or decrease', { rows: 2 }),
    ],
  },
  {
    title: 'After childbirth',
    blurb: 'Whether you gave birth 6 weeks ago or 16 years ago, your body remembers. Skip if it does not apply.',
    fields: [
      one('time_since_birth', 'How long since you gave birth?', [
        'Less than 6 months', '6 months to 2 years', '2 to 5 years', '5+ years', 'Does not apply',
      ]),
      many('postnatal_symptoms', 'Do you still experience any of these?', [
        'Unexplained weight gain, especially the belly',
        'Hair loss or thinning',
        'Vaginal dryness or discomfort',
        'Low libido or feeling disconnected from intimacy',
        'Exhaustion even with enough sleep',
        'Lower back or pelvic pain or weakness',
        'Leaking urine when sneezing, coughing, or laughing',
        'C-section scar or abdominal muscles that feel disconnected',
      ]),
      one('postnatal_education', 'Were you taught how to actually heal after birth?', [
        'Yes, I had great support', 'Somewhat, but I still have lingering issues', 'No, I was expected to move on',
      ]),
      one('baby_blues', 'Did you experience baby blues or postpartum depression or anxiety?', [
        'No, I felt stable', 'A little, but it passed', 'Yes, and it lasted longer than I expected', 'I am still struggling with it',
      ]),
      one('overwhelmed_do_it_all', 'Do you feel you have to do it all?', [
        'No, I feel supported', 'Sometimes, but I manage', 'Yes, I constantly feel like I am drowning',
      ]),
      one('body_after_children', 'How do you feel about your body after children?', [
        'Strong and grateful', 'Neutral, some days good some bad', 'Frustrated or disconnected',
      ]),
      one('birth_grief', 'Any resentment, grief, or guilt about your birth experience?', [
        'No, I have made peace with it', 'Sometimes, but I try not to dwell', 'Yes, I still carry a lot',
      ]),
      one('motherhood_support', 'Do you have people who understand your motherhood journey?', [
        'Yes, a great network', 'Somewhat, but they do not fully get it', 'No, I often feel alone',
      ]),
      one('selfcare_frequency', 'How often do you care for yourself beyond just surviving the day?', [
        'Regularly', 'Occasionally, when I remember', 'Rarely, there is never time for me',
      ]),
    ],
  },
  {
    title: 'Birth control and medical history',
    fields: [
      one('natural_openness', 'How do you feel about natural approaches?', [
        'I want a holistic approach', 'Open to learning more', 'I prefer conventional treatment',
      ]),
      one('hormonal_bc_history', 'Have you ever used hormonal birth control?', ['No', 'Yes, currently', 'Yes, but not anymore']),
      area('post_bc_symptoms', 'If you stopped, did symptoms follow?', { rows: 2 }),
      one('antibiotics_steroids', 'Frequent antibiotics or steroids in the past?', ['No', 'Occasionally', 'Yes, many times']),
      area('surgeries', 'Major surgeries, including C-sections', { rows: 2 }),
      one('thyroid_disorder', 'Thyroid disorder diagnosed or suspected?', ['No', 'Suspected', 'Yes, diagnosed']),
    ],
  },
  {
    title: 'Food',
    fields: [
      one('processed_foods', 'Processed or fast food', ['No', 'Occasionally', 'Often']),
      one('vegetable_servings', 'Vegetable servings a day', ['0 to 1', '2 to 3', '4 to 5', '6+']),
      one('disrupting_foods', 'Sugar, dairy, soy, processed meat, seed oils', ['No', 'Occasionally', 'Often']),
      one('caffeine', 'Caffeine', ['No', 'Occasionally', 'Daily']),
      one('alcohol', 'Alcohol', ['Never', 'Occasionally', '1 to 2 times a week', '3+ times a week']),
      one('water_intake', 'Water a day', ['Less than 2 cups', '2 to 4 cups', '5 to 8 cups', 'More than 8 cups']),
      one('sugary_drinks', 'Sugary drinks, soda, sweetened coffee or tea', ['Never', 'Occasionally', 'Regularly']),
      one('tobacco', 'Tobacco or nicotine', ['No', 'Occasionally', 'Daily']),
      area('typical_day_food', 'Walk me through a normal day of eating for you', { rows: 4 }),
      area('food_restrictions', 'Anything you will not or cannot eat', { rows: 2 }),
      t('who_else_eats', 'Who else eats at your table?'),
      one('cooking_reality', 'Honestly, how much cooking is realistic for you?', [
        'I enjoy cooking and have time', 'I can do simple, quick meals', 'Very little, I need easy',
      ]),
      area('food_budget', 'Anything I should know about your grocery budget?', { rows: 2 }),
    ],
  },
  {
    title: 'Movement',
    fields: [
      one('activity_frequency', 'Physical activity now', ['None', '1 to 2 times a week', '3 to 4 times a week', '5+ times a week']),
      one('chair_or_wheelchair', 'Do you need chair or wheelchair friendly movement?', [
        'No', 'Sometimes, for harder days', 'Yes, always',
      ]),
      area('movement_limits', 'Pain, injuries, balance, or mobility aids I should design around', { rows: 3 }),
      area('movement_enjoy', 'Any movement you actually enjoy?', { rows: 2 }),
    ],
  },
  {
    title: 'Stress and the heart of it',
    blurb: 'This is often where the real cause lives. Take your time.',
    fields: [
      one('stress_level', 'Your stress level', ['Low', 'Moderate', 'High', 'Overwhelming']),
      one('sleep_quality', 'Sleep', [
        'I wake up refreshed', 'I sleep but still feel tired', 'I struggle with insomnia or restless sleep',
      ]),
      t('sleep_waking', 'If you wake in the night, what time?', { placeholder: 'e.g. 2 to 3am' }),
      one('anxiety', 'Anxiety or feeling on edge', ['No', 'Occasionally', 'Often']),
      one('emotional_support', 'Do you feel emotionally supported?', ['Yes', 'Somewhat', 'No']),
      one('resentment', 'Resentment, bitterness, or unforgiveness toward someone', [
        'No', 'Occasionally', 'Yes, and it affects me deeply',
      ]),
      one('unresolved_trauma', 'Trauma you feel is unresolved', ['No', 'Not sure', 'Yes']),
      area('grief_loss', 'Any grief or loss you are carrying right now', { rows: 3 }),
      one('sense_of_purpose', 'Sense of purpose in your daily life', ['Yes, most days', 'Sometimes', 'No, I feel lost or stuck']),
      one('burnout', 'Burned out, overwhelmed, running on empty', ['No', 'Occasionally', 'Often']),
      one('selfcare_time', 'Time for rest and self-care', ['Yes, regularly', 'Sometimes, not enough', 'No, I struggle to make time']),
      one('peace_with_body', 'Do you feel at peace with your body?', ['No', 'Occasionally', 'Often']),
    ],
  },
  {
    title: 'Your environment',
    fields: [
      one('plastics', 'Plastic containers or bottles', ['Never', 'Occasionally', 'Often']),
      one('conventional_products', 'Conventional cleaning products, skincare, makeup', [
        'No, I use non-toxic options', 'Some, but I try to avoid the worst', 'Yes, whatever is available',
      ]),
      one('toxin_environment', 'High exposure to pollution, pesticides, chemicals, or heavy metals', ['No', 'Possibly', 'Yes']),
      one('filtered_water', 'Filtered or purified water', ['Yes, always', 'Sometimes', 'No']),
      one('mold_exposure', 'Mold exposure at home or work', ['No', 'Not sure', 'Yes']),
    ],
  },
  {
    title: 'What you have already tried',
    fields: [
      area('already_tried', 'What have you tried for your health so far?', { rows: 4 }),
      area('what_stuck', 'What actually stuck, and what did not?', { rows: 3 }),
      area('what_derailed', 'What has derailed you before?', { rows: 3 }),
      area('hardest_part', 'What is the hardest part right now?', { rows: 3 }),
      area('biggest_fear', 'Your biggest frustration or fear about your health', { rows: 3 }),
    ],
  },
  {
    title: 'What winning looks like',
    fields: [
      area('change_one_thing', 'If you could change ONE thing about your health today, what would it be?', { rows: 3 }),
      area('win_12_weeks', 'What does winning look like in 12 weeks?', { rows: 3 }),
      area('win_one_year', 'And in a year?', { rows: 3 }),
      area('life_change_day', 'What do you want your health back in order to do? Wear the dress, take the trip, play with the grandkids.', { rows: 3 }),
      area('anything_else', 'Anything else I should know?', { rows: 3 }),
    ],
  },
  {
    title: 'Your plus one',
    blurb: 'Your seat includes one other person, free. Spouse, sister, friend.',
    fields: [
      one('plus_one_has', 'Are you bringing someone?', ['Yes', 'Not yet, but I might', 'No']),
      t('plus_one_name', 'Their name'),
      t('plus_one_email', 'Their email', { type: 'email' }),
      t('plus_one_relationship', 'Who are they to you?'),
      one('plus_one_assessment', 'Should we send them their own assessment?', YN),
      one('plus_one_own_call', 'Would they like their own 1:1 call?', ['No, they will join mine', 'Yes, their own call']),
    ],
  },
  {
    title: 'Last thing',
    fields: [
      one('meeting_vote', 'Our weekly coaching call is 7pm Eastern. Which day works best for you?', [
        'Monday', 'Tuesday', 'Wednesday', 'Any of them work',
      ]),
      area('meeting_conflicts', 'Any days or times that never work for you?', { rows: 2 }),
      area('call_availability', 'Best days and times for your 1:1 with Joel and Annie', { rows: 2 }),
      one('consent_ack', 'Please confirm', [
        'I understand this is education alongside my doctor, not medical advice, and I will not change any medication on my own.',
      ], { required: true }),
    ],
  },
];

// Derived: id -> label map used by the filled-in PDF, email, and admin view.
// hormone_symptom_count is appended because the server computes it rather than
// asking her to tally her own checkboxes.
export const SECTION_MAP = SECTIONS.map((s) => ({
  title: s.title,
  fields: s.fields
    .filter((f) => f.kind !== 'note')
    .map((f) => [f.id, f.label])
    .concat(s.title === 'Hormones' ? [['hormone_symptom_count', 'Number checked']] : []),
}));

export const LABELS = Object.fromEntries(
  SECTION_MAP.flatMap((s) => s.fields.map(([id, label]) => [id, label]))
);

export function formatAnswer(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  return String(v ?? '').trim();
}

export const HEADLINE_FIELDS = [
  ['full_name', 'Name'],
  ['bp_recent', 'Latest BP'],
  ['medications', 'Medications'],
  ['hormone_symptom_count', 'Hormone symptoms checked'],
  ['hardest_part', 'Hardest part'],
  ['win_12_weeks', 'Winning in 12 weeks'],
  ['meeting_vote', 'Meeting vote'],
];
