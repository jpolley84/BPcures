// HomeSplit — 50/50 sticky A/B split for the homepage ('/').
//   Variant 'a' = CheckoutPage (the current sales letter, unchanged).
//   Variant 'b' = TriggerLanding (Annie-v2 quiz opt-in landing, 2026-07-16;
//                 previously QuizFirstLanding).
// Assignment is sticky per device via localStorage('bpq_ab_home'). Every
// render re-registers the PostHog super property 'ab_home_variant' so ALL
// events on the device (both fresh assignments and returning visitors)
// carry the variant. Forced preview: ?ab=a or ?ab=b renders that variant
// without touching the stored assignment, unless ?ab_persist=1 is also set.
// localStorage access is fully guarded: private mode falls back to 'a' with
// no tracking crash.
import { useMemo } from 'react';
import CheckoutPage from './CheckoutPage';
import TriggerLanding from './TriggerLanding';
import MasterclassBanner from '../components/MasterclassBanner';
import { track, registerSuperProps } from '../utils/analytics.js';

const STORAGE_KEY = 'bpq_ab_home';

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'a' || v === 'b' ? v : null;
  } catch {
    return null;
  }
}

function persist(variant) {
  try {
    localStorage.setItem(STORAGE_KEY, variant);
    return true;
  } catch {
    return false;
  }
}

// Resolve the variant once per mount. Returns the variant to RENDER; the
// stored assignment is only written on first visit (or forced persist).
function resolveVariant() {
  let params = null;
  try {
    params = new URLSearchParams(window.location.search);
  } catch { /* noop */ }
  const forced = params ? params.get('ab') : null;
  const forcedValid = forced === 'a' || forced === 'b' ? forced : null;
  const forcePersist = params ? params.get('ab_persist') === '1' : false;

  let stored = readStored();

  if (forcedValid) {
    if (forcePersist) persist(forcedValid);
    return forcedValid;
  }

  if (!stored) {
    const assigned = Math.random() < 0.5 ? 'a' : 'b';
    const saved = persist(assigned);
    if (!saved) {
      // Private mode / storage blocked: default to 'a', no assignment event
      // (the assignment could never be sticky, so it is not a real cohort).
      return 'a';
    }
    stored = assigned;
    track('ab_home_assigned', { variant: assigned });
  }

  return stored;
}

export default function HomeSplit() {
  const variant = useMemo(() => resolveVariant(), []);

  // Re-register on every render so returning visitors (who skip assignment)
  // still stamp the super property before any other event fires.
  registerSuperProps({ ab_home_variant: variant });

  // 2026-07-22 (Joel): the free-masterclass banner rides above BOTH variants,
  // so A and B get it identically and it stays out of the split's copy.
  return (
    <>
      <MasterclassBanner />
      {variant === 'b' ? <TriggerLanding /> : <CheckoutPage />}
    </>
  );
}
