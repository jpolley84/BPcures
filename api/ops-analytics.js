// /api/ops-analytics — PostHog traffic + conversion stats for the /ops dashboard.
//
// 2026-07-19 (Joel): "the traffic log and stats for all my pages from posthog.
// and then my statistics like conversion rate, visitors etc."
//
// Auth: same X-Ops-Pass header + OPS_DASHBOARD_PASSWORD as the rest of /ops.
//
// REQUIRES a PostHog PERSONAL API key (phx_...) in env POSTHOG_PERSONAL_API_KEY.
// The VITE_POSTHOG_KEY already in env is the client-side WRITE key (phc_...)
// and cannot read analytics. Until the personal key is set this endpoint
// returns { configured:false } with setup instructions instead of failing, so
// the dashboard renders a clear "add this key" card rather than an error.
//
// Project: 467819 (BPQuiz.com), host us.posthog.com. Queries use the HogQL
// query API so everything is one round trip per metric.
import crypto from 'node:crypto';

const PH_HOST = (process.env.POSTHOG_API_HOST || 'https://us.posthog.com').replace(/\/$/, '');
const PH_PROJECT = process.env.POSTHOG_PROJECT_ID || '467819';
const PH_KEY = process.env.POSTHOG_PERSONAL_API_KEY || '';
const TIMEOUT_MS = 12000;

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a, 'utf8'), B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  try { return crypto.timingSafeEqual(A, B); } catch { return false; }
}
function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  if (!expected) return false;
  return constantTimeEqual(String(req.headers['x-ops-pass'] || ''), String(expected));
}

// Run one HogQL query against the PostHog query API.
async function hogql(query) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PH_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return { error: `PostHog ${r.status}: ${body.slice(0, 200)}` };
    }
    const j = await r.json();
    return { results: j.results || [] };
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'PostHog timed out' : err.message };
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (!PH_KEY) {
    return res.status(200).json({
      configured: false,
      setup: {
        why: 'The key in env (VITE_POSTHOG_KEY) is the client write key and cannot read analytics.',
        steps: [
          'PostHog → click your avatar (top right) → Personal API keys',
          'Create key, scopes: Query Read + Insight Read (project: BPQuiz.com)',
          'Copy the phx_... value and send it to Claude, or add it in Vercel as POSTHOG_PERSONAL_API_KEY (Production) and redeploy',
        ],
      },
    });
  }

  const days = Math.min(Math.max(parseInt(req.query?.days, 10) || 30, 1), 90);

  // 1) Daily visitors + pageviews trend
  const trendQ = `
    SELECT toDate(timestamp) AS day,
           count() AS pageviews,
           count(DISTINCT person_id) AS visitors
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY day ORDER BY day ASC`;

  // 2) Top pages by views + unique visitors
  const pagesQ = `
    SELECT properties.$pathname AS path,
           count() AS views,
           count(DISTINCT person_id) AS visitors
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY path ORDER BY views DESC LIMIT 40`;

  // 3) Funnel counts for the conversion rates Joel asks about
  const funnelQ = `
    SELECT event, count() AS n, count(DISTINCT person_id) AS people
    FROM events
    WHERE timestamp >= now() - INTERVAL ${days} DAY
      AND event IN ('$pageview','quiz_started','quiz_completed','quiz_email_submitted',
                    'quizfirst_start_clicked','checkout_clicked','pay_page_viewed',
                    'purchase','oto_viewed','oto_accepted')
    GROUP BY event ORDER BY people DESC`;

  // 4) Traffic sources
  const sourceQ = `
    SELECT coalesce(nullIf(properties.$initial_utm_source,''), nullIf(properties.utm_source,''), 'direct/organic') AS source,
           count(DISTINCT person_id) AS visitors
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY source ORDER BY visitors DESC LIMIT 15`;

  const [trend, pages, funnel, sources] = await Promise.all([
    hogql(trendQ), hogql(pagesQ), hogql(funnelQ), hogql(sourceQ),
  ]);

  // Derive the headline conversion rates from the funnel counts.
  const f = {};
  (funnel.results || []).forEach(([event, , people]) => { f[event] = people; });
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
  const visitors = f['$pageview'] || 0;
  const conversion = {
    visitors,
    quizStarters: f.quiz_started || 0,
    leads: f.quiz_email_submitted || 0,
    checkoutClicks: f.checkout_clicked || 0,
    purchases: f.purchase || 0,
    visitorToQuizPct: pct(f.quiz_started || 0, visitors),
    quizToLeadPct: pct(f.quiz_email_submitted || 0, f.quiz_started || 0),
    leadToPurchasePct: pct(f.purchase || 0, f.quiz_email_submitted || 0),
    visitorToPurchasePct: pct(f.purchase || 0, visitors),
    otoTakeRatePct: pct(f.oto_accepted || 0, f.oto_viewed || 0),
  };

  return res.status(200).json({
    configured: true,
    days,
    trend: trend.results ? trend.results.map(([day, pageviews, v]) => ({ day, pageviews, visitors: v })) : [],
    trendError: trend.error || null,
    pages: pages.results ? pages.results.map(([path, views, v]) => ({ path, views, visitors: v })) : [],
    pagesError: pages.error || null,
    sources: sources.results ? sources.results.map(([source, v]) => ({ source, visitors: v })) : [],
    sourcesError: sources.error || null,
    conversion,
    funnelError: funnel.error || null,
    generatedAt: new Date().toISOString(),
  });
}
