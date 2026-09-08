/* pixels.js — shared analytics loader for STATIC pages (2026-08-24).
 *
 * The SPA (index.html) has its own env-gated loaders (VITE_META_PIXEL_ID etc.)
 * and posthog-js via src/utils/analytics.js — this file is for the static HTML
 * pages under public/ (challenge-b, masterclass, tea, tea-review, coaching
 * assets, rising, app legal pages), which Vite does NOT process, so env
 * placeholders never substitute there.
 *
 * 1. PostHog — inits ONLY if the page has not already loaded its own snippet
 *    (masterclass, tea, tea/thankyou carry their own; the guard makes this
 *    file safe to include everywhere).
 * 2. Meta Pixel — gated behind META_PIXEL_ID below. Empty string = the whole
 *    block no-ops, zero network traffic. PASTE THE PIXEL ID HERE (one place)
 *    when Joel creates it in Meta Events Manager. The SPA's copy is separate:
 *    set VITE_META_PIXEL_ID in Vercel env for the SPA.
 * 3. window.bwPixelLead(props) / window.bwPixelPurchase(value, currency)
 *    helpers — safe no-ops until the pixel ID is set, so pages can call them
 *    unconditionally on conversion.
 */
(function () {
  'use strict';

  /* ── 1. PostHog (public client token — same project 467819 as the SPA) ── */
  var PH_TOKEN = 'phc_tyPhu6kt2jmfzhBPBjttdp3crfxNY4JdsZBoKa7SRgzS';
  var PH_HOST = 'https://us.i.posthog.com';
  if (!window.posthog) {
    try {
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset get_distinct_id".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      window.posthog.init(PH_TOKEN, { api_host: PH_HOST });
    } catch (e) { /* analytics never blocks UX */ }
  }

  /* ── 2. Meta Pixel — PASTE THE PIXEL ID BETWEEN THE QUOTES BELOW ──────── */
  var META_PIXEL_ID = '1882792309771339'; // Meta Events Manager pixel (activated 2026-09-07)
  if (META_PIXEL_ID) {
    try {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    } catch (e) { /* pixel errors never block UX */ }
  }

  /* ── 3. Conversion helpers (no-ops until fbq exists) ──────────────────── */
  window.bwPixelLead = function (props) {
    try { if (window.fbq) window.fbq('track', 'Lead', props || {}); } catch (e) {}
  };
  window.bwPixelPurchase = function (value, currency) {
    try {
      if (window.fbq) window.fbq('track', 'Purchase', value != null ? { value: value, currency: currency || 'USD' } : {});
    } catch (e) {}
  };
})();
