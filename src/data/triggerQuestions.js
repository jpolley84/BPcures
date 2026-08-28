// The 5 Hidden Triggers quiz questions.
//
// 2026-08-27: extracted out of TriggerQuizPage.jsx so the quiz-first homepage
// can render question one WITHOUT statically importing the whole quiz page.
// Importing the page pulled all 900 lines of it into the main bundle that
// every route loads, which is the opposite of what a homepage needs.
//
// kind: 'trigger' questions are the five scored, diagnostic ones (and the only
// ones that tap-to-advance). 'belief' and 'spend' are profiling, multi-select.
export const QUESTIONS = [
  {
    kind: 'trigger',
    title: 'When your day gets stressful, what does your body actually do?',
    options: [
      { key: 'stress', text: 'My chest tightens and my heart pounds for a while after.' },
      { key: 'sugar', text: 'I crave something sweet almost immediately.' },
      { key: 'sodium', text: 'I reach for something salty and crunchy without thinking.' },
      { key: 'sleep', text: 'I get wired, and it messes with me falling asleep that night.' },
      { key: 'stillness', text: 'I just sit and scroll. I do not move at all.' },
    ],
  },
  {
    kind: 'trigger',
    title: 'How do you feel an hour or two after a big meal of pasta, bread, or dessert?',
    options: [
      { key: 'stress', text: 'My body feels fine, but my mind races more than usual.' },
      { key: 'sugar', text: 'Slow and foggy. Sometimes shaky or dizzy.' },
      { key: 'sodium', text: 'Puffy. My rings or shoes feel tighter than that morning.' },
      { key: 'sleep', text: 'I crash hard and want a nap right away.' },
      { key: 'stillness', text: 'I do not really notice. I am usually sitting anyway.' },
    ],
  },
  {
    kind: 'trigger',
    title: 'How often does your food come from a box, can, restaurant, or drive-thru?',
    options: [
      { key: 'stress', text: 'More when I am stressed. It is just the fastest option.' },
      { key: 'sugar', text: 'Often, and it usually comes with something sweet too.' },
      { key: 'sodium', text: 'Most days. Easy wins over cooking.' },
      { key: 'sleep', text: 'Late at night, when I should be winding down instead.' },
      { key: 'stillness', text: 'Often, and I eat it sitting at a desk or on the couch.' },
      { key: 'none', text: "I cook almost everything myself, so this doesn't really apply." },
    ],
  },
  {
    kind: 'trigger',
    title: 'What does a normal night of sleep really look like for you?',
    options: [
      { key: 'stress', text: 'My mind will not shut off. I replay the whole day.' },
      { key: 'sugar', text: 'I wake up around 2 or 3 a.m., sometimes hungry.' },
      { key: 'sodium', text: 'I get up to use the bathroom more than once a night.' },
      { key: 'sleep', text: 'I am tired all day, no matter how many hours I got.' },
      { key: 'stillness', text: 'I sleep fine, but I wake up stiff and heavy anyway.' },
    ],
  },
  {
    kind: 'trigger',
    title: 'Add up desk, car, and couch. How much of your day do you spend sitting?',
    options: [
      { key: 'stress', text: 'A lot, and I feel tension build the longer I sit.' },
      { key: 'sugar', text: 'A lot, and I snack more the longer I sit at my desk.' },
      { key: 'sodium', text: 'A lot. My legs or ankles feel swollen by evening.' },
      { key: 'sleep', text: 'A lot, but I still do not feel rested at the end of it.' },
      { key: 'stillness', text: 'Most of it. Some days 8 hours or more, easily.' },
    ],
  },
  {
    kind: 'belief',
    title: 'Where do you think high blood pressure really comes from? Pick all you have heard.',
    options: [
      { key: 'genetic', text: 'It is genetic. It runs in my family, so nothing helps.' },
      { key: 'heart', text: 'It means something is wrong with my heart.' },
      { key: 'permanent', text: 'Once you have it, you have it for life.' },
      { key: 'tablesalt', text: 'It comes from table salt. Put down the shaker and you are fine.' },
      { key: 'none', text: 'None of the above.' },
    ],
  },
  {
    kind: 'spend',
    title: 'What did health care cost you this past year? Count visits, meds, copays, and tests.',
    options: [
      { key: 'spend-under-500', text: 'Under $500' },
      { key: 'spend-500-2000', text: '$500 to $2,000' },
      { key: 'spend-2000-5000', text: '$2,000 to $5,000' },
      { key: 'spend-over-5000', text: 'More than $5,000' },
      { key: 'spend-unsure', text: 'Honestly, I have lost track.' },
    ],
  },
];
