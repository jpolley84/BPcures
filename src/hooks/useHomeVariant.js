import { useState, useEffect } from 'react';

// Homepage A/B: "control" = the proven purple/Inter/cold-white sales letter
// (the split-test winner — never change blind). "cream" = the quiz's premium
// system (cream bg + Fraunces headings + clay CTA + gold serif price anchor),
// applied as a CSS skin via [data-hpvariant="cream"] — token/color/font only,
// zero layout or copy change.
//
// SAFETY: ships DISABLED. While AB_CREAM_ENABLED is false, 100% of traffic
// gets control and nothing visual changes. Flip to true ONLY after eyeballing
// the cream variant on a preview deploy (append ?hp=cream to force it). To
// kill a running test instantly, set this back to false and push.
export const AB_CREAM_ENABLED = false;

// Split when enabled (0.5 = 50/50). Lower this to dip a toe (e.g. 0.2 = 20% cream).
const CREAM_SHARE = 0.5;

const KEY = 'hp_variant';

function pick() {
  // URL override always wins (for QA / forcing a variant on a preview):
  //   ?hp=cream  or  ?hp=control
  try {
    const q = new URLSearchParams(window.location.search).get('hp');
    if (q === 'cream' || q === 'control') return q;
  } catch { /* no-op */ }

  if (!AB_CREAM_ENABLED) return 'control';

  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'cream' || saved === 'control') return saved;
    const assigned = Math.random() < CREAM_SHARE ? 'cream' : 'control';
    localStorage.setItem(KEY, assigned);
    return assigned;
  } catch {
    return 'control';
  }
}

// Returns 'control' on the very first render (SSR-safe / no flash for the
// dominant control path), then resolves the real bucket after mount.
export function useHomeVariant() {
  const [variant, setVariant] = useState('control');
  useEffect(() => {
    const v = pick();
    setVariant(v);
    // Meta-pixel dimension so the test is readable in Ads Manager alongside
    // the Stripe-metadata truth stamped at checkout.
    try {
      if (window.fbq && v === 'cream') window.fbq('trackCustom', 'HomeVariantCream');
    } catch { /* pixel errors never matter */ }
  }, []);
  return variant;
}
