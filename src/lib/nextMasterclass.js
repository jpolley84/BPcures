// The next free masterclass, in one place for the browser. The server keeps
// its own copy in api/masterclass-register.js (NEXT_MASTERCLASS); change both
// together when a new class is set.
//
// After `endsAt`, the one-click button stops naming a date and saves her to
// the waitlist instead ("we will email you the next date").
export const NEXT_MASTERCLASS = {
  eventKey: '2026-11-09',
  title: '4 Hidden Health Mistakes',
  when: 'Monday, November 9, 7 PM Eastern (6 PM Central)',
  endsAt: Date.parse('2026-11-10T01:30:00Z'), // Mon 9:30 PM Eastern, class over
};

export function nextClassIsSet(now = Date.now()) {
  return now < NEXT_MASTERCLASS.endsAt;
}
