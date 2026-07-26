// kitStack.js - the canonical $17 kit offer stack, in ONE place.
//
// Extracted 2026-07-26 from PayPage.jsx (foods101-v1 funnel build). The same
// eleven items and the same $209 anchor are now rendered by the register
// (PayPage) and by the 101 Foods thank-you OTO (FoodsGuideThanks). Two hand
// typed copies of a price stack always drift, and a stack that says $209 on
// one page and $217 on the next is the kind of thing the 2026-07-25 audit
// flagged. Import from here. Do not re-declare the array anywhere else.
//
// Names and values are byte identical to the pre-extraction PayPage list, so
// pointing PayPage at this module changes nothing that renders.
//
// Delivery truth: the corner tier in api/_kit-manifest.js ships 11 PDFs. If an
// item is added or removed here, the manifest and scripts/build-bundles.mjs
// have to move with it, or buyers hit a not-received gap.
//
// ZERO em dashes in any string in this file (visible copy rule).

export const KIT_STACK = [
  { name: 'Your 10-Day Reset Plan, built for your trigger', value: 47 },
  { name: 'Your Herb Guide for that trigger', value: 19 },
  { name: 'Your Bring-To-Your-Doctor Sheet', value: 9 },
  { name: 'The Master Blood Pressure Document', value: 29 },
  { name: 'Top 10 Herbs Deep Dive', value: 17 },
  { name: 'Cook For Life Cookbook', value: 27 },
  { name: 'White Coat Syndrome Guide', value: 9 },
  { name: 'BP FAQ', value: 7 },
  { name: 'Overmedicated Boomers (the book)', value: 17 },
  { name: 'Your BP Tracker', value: 9 },
  { name: 'The Triangle Meal Plan', value: 19 },
];

// Computed, never typed: the anchor can never disagree with the rows above.
export const KIT_STACK_TOTAL = KIT_STACK.reduce((sum, item) => sum + item.value, 0);

// The one-time price the stack is anchored against.
export const KIT_PRICE = 17;

// Number of files a corner-tier buyer receives (matches api/_kit-manifest.js).
export const KIT_FILE_COUNT = KIT_STACK.length;

export default KIT_STACK;
