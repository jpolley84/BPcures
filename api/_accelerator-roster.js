// Life Change Accelerator - the 12-week coaching cohort Joel + Annie run
// jointly (Annie's "GLOW Bootcamp" branding on the handouts). Meets
// Wednesdays 11:00 AM Central / 12:00 PM Eastern.
//
// This list is the single source of truth for cohort sends. Until 2026-09-23
// it lived only in memory and scattered Gmail threads, which is how that
// Wednesday's Zoom link got missed entirely.
//
// Beverly Brewster was REMOVED 2026-09-16 (Joel): never paid. Do not re-add.
// Chuck is Priscilla's +1 and the one man in the room - never address the
// group as "ladies" in anything that reaches him.
//
// To change the roster, edit this file. Nothing reads it from KV.
export const ACCELERATOR_ROSTER = [
  { first: 'Stella', email: 'stellapreowei38@gmail.com', note: 'international (Nigeria)' },
  { first: 'Balinda', email: 'bwvhoney300@yahoo.com' },
  { first: 'Shirley', email: 'shirleyarow@gmail.com', note: 'on dialysis' },
  { first: 'Luvenia', email: 'luvenia.truss@aol.com' },
  { first: 'Janie', email: 'kyquiltergirl@icloud.com' },
  { first: 'Deborah', email: 'debdcon@gmail.com', note: 'Zoom-chat trouble' },
  { first: 'Carolyn', email: 'carolynroyster@msn.com' },
  { first: 'Brenda', email: 'aka68@verizon.net' },
  { first: 'Brenda', email: 'llady1_2000@yahoo.com' },
  { first: 'Priscilla', email: 'priscilla.harlins@gmail.com' },
  { first: 'Chuck', email: 'chuckharlins@gmail.com', note: "Priscilla's +1" },
  { first: 'Sandra', email: 'sandravwilliams2013@gmail.com' },
  // Rahab LEFT the program 2026-10-01 (Joel). Her 10-01 payment of $1,295 was
  // refunded in full and her plan canceled. The row stays so she keeps being
  // excluded from every bulk send; `withdrawn` is what stops the cohort mail.
  { first: 'Rahab', email: 'sullivanrahab@yahoo.com', withdrawn: '2026-10-01' },
  // Added 2026-10-21: joined on the $7,500 tier at $350/mo, Accelerator
  // intake submitted 2026-10-20. She was missing from this file, so the
  // 10-21 replay send would have skipped her.
  { first: 'Karen', email: 'kpaug19@gmail.com', note: 'joined 2026-10-20' },
  // Added 2026-10-22: first Life Change Activated buyer, $200 deposit paid
  // 2026-10-22 19:00. Her welcome email promises Wednesday reminders, and
  // accelerator-reminder.js reads this file, so she has to be here for
  // that promise to hold.
  { first: 'Aurelia', email: 'smit842@cs.com', note: 'Life Change Activated, joined 2026-10-22' },
  { first: 'Yvonne', email: 'yvonnewint12@gmail.com', note: 'Sprint, joined 2026-09-30; card name reads Antonio bromfield' },
];
