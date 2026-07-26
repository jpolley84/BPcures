// HomeSplit: 50/50 sticky A/B split for the homepage ('/').
//   Variant 'a' = CheckoutPage (the $17 sales letter, unchanged).
//   Variant 'b' = FoodsGuideLanding (the 101 Foods squeeze page).
// Assignment is sticky per device via localStorage('bpq_ab_home').
//
// 2026-07-26 measurability fix: the assignment and the super-property
// registration MOVED to src/utils/analytics.js (resolveHomeVariant). They now
// run inside initAnalytics(), synchronously, before posthog fires the device's
// first $pageview, and a React component could never win that race, which is
// why the last test had a large share of pageviews with no ab_home_variant.
// This file just reads the resolved value and renders the arm. Forced preview:
// ?ab=a or ?ab=b renders that arm without touching the stored assignment,
// unless ?ab_persist=1 is also set. Storage access is fully guarded: private
// mode renders 'a' and stays out of the test rather than inflating arm A.
import { useEffect, useMemo } from 'react';
import CheckoutPage from './CheckoutPage';
import FoodsGuideLanding from './FoodsGuideLanding';
import MasterclassBanner from '../components/MasterclassBanner';
import { track, resolveHomeVariant, isHomeVariantCohorted } from '../utils/analytics.js';

export default function HomeSplit() {
  // Memoized in analytics.js, so this is the same value initAnalytics resolved
  // (and the fallback that assigns it when there is no PostHog key).
  const variant = useMemo(() => resolveHomeVariant(), []);

  // ONE view event for BOTH arms, fired from the one place that can see both.
  // Variant A used to fire nothing at all, so the arms had no shared
  // denominator and the test could not be read. Emitting it here instead of
  // inside CheckoutPage/FoodsGuideLanding keeps the two arms structurally
  // symmetric: there is no second call site to drift.
  useEffect(() => {
    track('home_variant_viewed', {
      variant,
      page: variant === 'b' ? 'foods101-squeeze' : 'checkout-letter',
      cohorted: isHomeVariantCohorted(),
    });
  }, [variant]);

  // 2026-07-22 (Joel): the free-masterclass banner rides above BOTH variants,
  // so A and B get it identically and it stays out of the split's copy.
  // showBanner={false} is load-bearing: FoodsGuideLanding defaults it to true
  // for its own /101foods route, and without this prop variant B stacked two
  // identical countdown banners and lost ~79px of fold.
  return (
    <>
      <MasterclassBanner />
      {variant === 'b' ? <FoodsGuideLanding showBanner={false} /> : <CheckoutPage />}
    </>
  );
}
