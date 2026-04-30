import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  GitBranch,
  Inbox,
  Mail,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// ─── Utilities ────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatMoney(cents) {
  if (typeof cents !== 'number') return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Inline SVG sparkline — no chart lib
function Sparkline({ values = [], width = 120, height = 32, stroke = '#10b981' }) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots on each datapoint */}
      {values.map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * height;
        return <circle key={i} cx={x} cy={y} r="1.5" fill={stroke} />;
      })}
    </svg>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────
function PasscodePrompt({ onSubmit, error, busy }) {
  const [value, setValue] = useState('');
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div
            className="text-3xl mb-2 tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            BraveWorks Operations
          </div>
          <div className="text-xs uppercase tracking-widest text-stone-500">restricted</div>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter ops passcode"
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-medium transition-colors"
        >
          {busy ? 'Verifying...' : 'Enter'}
        </button>
        {error && (
          <div className="mt-4 text-sm text-rose-400 text-center flex items-center justify-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Tile shell ───────────────────────────────────────────────────────
function Tile({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-stone-700 bg-stone-800 p-5 ${className}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-semibold mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Hero stat tiles ──────────────────────────────────────────────────
function RevenueTile({ stripe }) {
  if (!stripe || stripe.error) {
    return (
      <Tile title="Stripe revenue">
        <div className="text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {stripe?.error || 'unavailable'}
        </div>
      </Tile>
    );
  }
  const todayDelta = stripe.todayCustomers || 0;
  const todayMoney = stripe.todayRevenue || '$0.00';
  const trendUp = todayDelta > 0;
  return (
    <Tile title="Revenue (Stripe live)">
      <div className="flex items-baseline justify-between">
        <div
          className="text-4xl text-stone-100 leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          {stripe.revenue}
        </div>
        {Array.isArray(stripe.sparkline7d) && stripe.sparkline7d.some((v) => v > 0) && (
          <Sparkline values={stripe.sparkline7d} width={90} height={28} stroke="#10b981" />
        )}
      </div>
      <div className="text-sm text-stone-400 mt-2">
        {stripe.customers} customers
      </div>
      <div className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-stone-500'}`}>
        {trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} className="opacity-30" />}
        {todayDelta} today (+{todayMoney})
      </div>
    </Tile>
  );
}

function LeadPoolTile({ pool }) {
  if (!pool || pool.error) {
    return (
      <Tile title="Lead pool">
        <div className="text-stone-500 text-sm italic">{pool?.error || 'no data'}</div>
      </Tile>
    );
  }
  const gold = pool.goldRemaining ?? pool.goldUnsent ?? 0;
  const days = pool.daysAtCurrentBurn ?? pool.daysRemaining ?? Math.floor(gold / 5);
  const pct = Math.min(100, Math.round((gold / 25) * 100));
  const burnLow = days < 5;
  return (
    <Tile title="Lead pool (GOLD)">
      <div
        className="text-4xl text-stone-100 leading-none"
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
      >
        {gold}
      </div>
      <div className="mt-3 h-2 rounded-full bg-stone-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${burnLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-xs mt-2 ${burnLow ? 'text-rose-400' : 'text-stone-400'}`}>
        ~{days} days at 5/day
        {pool.totalSentEver != null && (
          <span className="text-stone-500"> · {pool.totalSentEver} sent ever</span>
        )}
      </div>
    </Tile>
  );
}

function FunnelStep({ Icon, value, label, isLast }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="text-stone-500 mb-1">
          <Icon size={14} />
        </div>
        <div
          className="text-2xl text-stone-100 leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          {value ?? 0}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-1">{label}</div>
      </div>
      {!isLast && <ChevronRight size={14} className="text-stone-600 shrink-0" />}
    </div>
  );
}

function FunnelTile({ funnel }) {
  if (!funnel || funnel.error) {
    return (
      <Tile title="Today's funnel">
        <div className="text-stone-500 text-sm italic">{funnel?.error || 'no data'}</div>
      </Tile>
    );
  }
  return (
    <Tile title="Today's funnel">
      <div className="flex items-stretch gap-1">
        <FunnelStep Icon={Mail} value={funnel.coldSendsToday} label="cold" />
        <FunnelStep Icon={ClipboardList} value={funnel.quizSubmissionsToday} label="quiz" />
        <FunnelStep Icon={FileText} value={funnel.auditsSentToday} label="audit" />
        <FunnelStep Icon={Calendar} value={funnel.callsBookedToday} label="calls" isLast />
      </div>
      {funnel.fm0AppsToday != null && (
        <div className="text-[10px] text-stone-500 mt-3 pt-3 border-t border-stone-700">
          FM#0 applications today: <span className="text-stone-300">{funnel.fm0AppsToday}</span>
        </div>
      )}
    </Tile>
  );
}

// ─── Crons table ──────────────────────────────────────────────────────
function statusDot(state) {
  if (state === 'green') return 'bg-emerald-500';
  if (state === 'yellow') return 'bg-amber-500';
  if (state === 'red') return 'bg-rose-500';
  return 'bg-stone-500';
}

function CronsTile({ crons }) {
  const [expanded, setExpanded] = useState(null);
  if (!Array.isArray(crons) || crons.length === 0) {
    return (
      <Tile title="Scheduled tasks">
        <div className="text-stone-500 text-sm italic">No cron data yet.</div>
      </Tile>
    );
  }
  return (
    <Tile title="Scheduled tasks">
      <div className="divide-y divide-stone-700/60 -my-1">
        {crons.map((c) => {
          const isOpen = expanded === c.id;
          return (
            <div key={c.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full flex items-center gap-3 py-2 text-left hover:bg-stone-700/30 px-1 -mx-1 rounded transition-colors"
              >
                <span className={`shrink-0 w-2 h-2 rounded-full ${statusDot(c.statusState)}`} />
                <span className="font-medium text-stone-200 text-sm flex-1 truncate">{c.id}</span>
                <span className="text-[10px] text-stone-500 hidden sm:inline">{c.schedule}</span>
                <span className="text-[10px] text-stone-500">{timeAgo(c.lastRun)}</span>
                <ChevronDown size={12} className={`text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="bg-stone-900/40 -mx-5 px-5 py-3 border-l-2 border-emerald-600/40">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-2">Recent cycles</div>
                  {Array.isArray(c.recentCycles) && c.recentCycles.length > 0 ? (
                    <ul className="space-y-1 text-xs text-stone-400 font-mono">
                      {c.recentCycles.slice(0, 5).map((cycle, idx) => (
                        <li key={idx} className="truncate">
                          <span className="text-stone-500">{(cycle.ts || '').slice(11, 19)}</span>{' '}
                          {cycle.summary || JSON.stringify(cycle).slice(0, 80)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-stone-500 italic">No cycle history logged yet.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

// ─── Latest deploy ────────────────────────────────────────────────────
function DeployTile({ deploy }) {
  if (!deploy || deploy.error) {
    return (
      <Tile title="Latest deploy">
        <div className="text-stone-500 text-sm italic">{deploy?.error || 'no data'}</div>
      </Tile>
    );
  }
  const stateLabel = deploy.vercelState || 'READY';
  const stateColor =
    stateLabel === 'READY'
      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
      : stateLabel === 'BUILDING'
      ? 'bg-amber-900/40 text-amber-300 border-amber-700/50'
      : 'bg-rose-900/40 text-rose-300 border-rose-700/50';
  return (
    <Tile title="Latest deploy">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-sm text-stone-200">{deploy.latestSha || '—'}</span>
        <span className={`text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 ${stateColor}`}>
          {stateLabel}
        </span>
      </div>
      <div className="text-xs text-stone-300 leading-snug line-clamp-3">
        {deploy.latestCommitMessage || '—'}
      </div>
      <div className="text-[10px] text-stone-500 mt-3 flex items-center gap-1">
        <GitBranch size={10} /> {timeAgo(deploy.latestCommitDate)}
      </div>
    </Tile>
  );
}

// ─── Replies / Joel queue ─────────────────────────────────────────────
function RepliesTile({ replies }) {
  const [expanded, setExpanded] = useState(false);
  const count = replies?.count ?? 0;
  const recent = Array.isArray(replies?.recent) ? replies.recent : [];
  return (
    <Tile title="Replies waiting">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div
          className="text-4xl text-stone-100 leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          {count}
        </div>
        <div className="text-xs text-stone-400 mt-2">unread in marketing inbox</div>
      </button>
      {expanded && recent.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-stone-700 space-y-2 text-xs">
          {recent.slice(0, 3).map((r, i) => (
            <li key={i}>
              <div className="text-stone-200 font-medium truncate">{r.subject || '(no subject)'}</div>
              <div className="text-stone-500 truncate">from {r.from || 'unknown'}</div>
              <div className="text-stone-400 line-clamp-2 mt-1">{r.snippet || ''}</div>
            </li>
          ))}
        </ul>
      )}
      {expanded && recent.length === 0 && (
        <div className="text-xs text-stone-500 italic mt-3 pt-3 border-t border-stone-700">
          No recent replies (or marketing-inbox source not yet wired into heartbeat).
        </div>
      )}
    </Tile>
  );
}

function JoelQueueTile({ items }) {
  if (!items || items.length === 0) {
    return (
      <Tile title="Joel queue">
        <div className="text-stone-500 text-sm italic">No [JOEL] items in TODO.md.</div>
      </Tile>
    );
  }
  return (
    <Tile title="Joel queue">
      <ul className="space-y-2 text-sm">
        {items.slice(0, 6).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-stone-300">
            <span className="text-amber-500 mt-1.5">·</span>
            <span className="line-clamp-3 leading-snug">{item}</span>
          </li>
        ))}
      </ul>
      {items.length > 6 && (
        <div className="text-[10px] text-stone-500 mt-3 pt-3 border-t border-stone-700">
          +{items.length - 6} more in TODO.md
        </div>
      )}
    </Tile>
  );
}

// ─── Activity stream ──────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  'cold-send': Mail,
  audit: FileText,
  quiz: ClipboardList,
  'fm0-app': Zap,
  'calendly-book': Calendar,
  stripe: DollarSign,
  deploy: GitBranch,
  default: Activity,
};

function ActivityStream({ events }) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <Tile title="Activity stream (24h)">
        <div className="text-stone-500 text-sm italic">No events in the last 24 hours.</div>
      </Tile>
    );
  }
  return (
    <Tile title={`Activity stream (24h · ${events.length})`}>
      <div className="max-h-80 overflow-y-auto pr-1 space-y-1.5 -mx-1 px-1">
        {events.map((e, i) => {
          const Icon = ACTIVITY_ICONS[e.type] || ACTIVITY_ICONS.default;
          return (
            <div
              key={i}
              className="flex items-start gap-3 text-xs text-stone-300 py-1.5 border-b border-stone-700/40 last:border-0"
            >
              <Icon size={12} className="text-stone-500 mt-0.5 shrink-0" />
              <span className="text-stone-500 font-mono shrink-0 w-12 text-right">
                {(e.ts || '').slice(11, 16)}
              </span>
              <span className="flex-1 leading-snug">{e.description || JSON.stringify(e)}</span>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

// ─── Headline strip ───────────────────────────────────────────────────
function HeadlineStrip({ stripe, funnel }) {
  if (!stripe || stripe.error) return null;
  return (
    <div className="hidden md:block text-center text-xs text-stone-400">
      <span className="text-stone-200 font-medium">{stripe.revenue}</span>
      <span className="text-stone-600 mx-2">·</span>
      <span>{stripe.customers} customers</span>
      <span className="text-stone-600 mx-2">·</span>
      <span>{funnel?.coldSendsToday ?? 0} cold today</span>
      <span className="text-stone-600 mx-2">·</span>
      <span>{funnel?.quizSubmissionsToday ?? 0} quiz</span>
      <span className="text-stone-600 mx-2">·</span>
      <span>{funnel?.callsBookedToday ?? 0} calls</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────
const STORAGE_KEY = 'OPS_AUTH';
const POLL_INTERVAL_MS = 10_000;

export default function OpsDashboardPage() {
  const [passcode, setPasscode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [state, setState] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const pollTimer = useRef(null);

  const fetchState = useCallback(
    async (pass) => {
      const code = pass ?? passcode;
      if (!code) return null;
      try {
        const res = await fetch('/api/ops-state', {
          method: 'GET',
          headers: { 'X-Ops-Pass': code },
          cache: 'no-store',
        });
        if (res.status === 401) {
          // Clear stored bad passcode
          try { localStorage.removeItem(STORAGE_KEY); } catch {}
          setPasscode('');
          setAuthError('Invalid passcode');
          return null;
        }
        if (!res.ok) {
          setFetchError(`HTTP ${res.status}`);
          return null;
        }
        const data = await res.json();
        setState(data);
        setLastFetched(new Date());
        setFetchError(null);
        return data;
      } catch (e) {
        setFetchError(e.message || String(e));
        return null;
      }
    },
    [passcode]
  );

  const handleSubmitPasscode = useCallback(
    async (pass) => {
      setAuthBusy(true);
      setAuthError('');
      try {
        const res = await fetch('/api/ops-state', {
          method: 'GET',
          headers: { 'X-Ops-Pass': pass },
          cache: 'no-store',
        });
        if (res.status === 401) {
          setAuthError('Invalid passcode');
          return;
        }
        if (!res.ok) {
          setAuthError(`Server error (HTTP ${res.status})`);
          return;
        }
        const data = await res.json();
        try { localStorage.setItem(STORAGE_KEY, pass); } catch {}
        setPasscode(pass);
        setState(data);
        setLastFetched(new Date());
      } catch (e) {
        setAuthError(e.message || 'Network error');
      } finally {
        setAuthBusy(false);
      }
    },
    []
  );

  const handleLogout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPasscode('');
    setState(null);
    setLastFetched(null);
  }, []);

  // Poll while authed
  useEffect(() => {
    if (!passcode) return;
    fetchState(passcode);
    pollTimer.current = setInterval(() => fetchState(passcode), POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [passcode, fetchState]);

  // Tick "last refresh" indicator each second
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!passcode) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [passcode]);

  if (!passcode) {
    return <PasscodePrompt onSubmit={handleSubmitPasscode} error={authError} busy={authBusy} />;
  }

  // Initial loading state (auth ok, no data yet)
  if (!state) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 grid place-items-center">
        <div className="flex items-center gap-3 text-stone-400">
          <RefreshCw size={16} className="animate-spin" />
          {fetchError ? `Error: ${fetchError}` : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-stone-900 text-stone-100"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(16,185,129,0.04), transparent 60%), radial-gradient(ellipse at bottom right, rgba(180,140,40,0.03), transparent 60%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div
              className="text-xl sm:text-2xl text-stone-100 leading-tight truncate"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              BraveWorks Operations
            </div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">
              Practice Launcher · live
            </div>
          </div>

          <div className="hidden md:block flex-1 px-4">
            <HeadlineStrip stripe={state.stripe} funnel={state.funnel} />
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">{lastFetched ? timeAgo(lastFetched.toISOString()) : '—'}</span>
            <button
              onClick={() => fetchState()}
              className="ml-1 text-stone-500 hover:text-stone-200 transition-colors"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="ml-2 text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile headline */}
        <div className="md:hidden mb-4">
          <HeadlineStrip stripe={state.stripe} funnel={state.funnel} />
        </div>

        {fetchError && (
          <div className="mb-4 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded-lg px-3 py-2">
            Connection error: {fetchError} (showing last good data)
          </div>
        )}

        {/* Zone 1 — hero */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <RevenueTile stripe={state.stripe} />
          <LeadPoolTile pool={state.pool} />
          <FunnelTile funnel={state.funnel} />
        </section>

        {/* Zone 2 — system pulse */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <CronsTile crons={state.crons} />
          <DeployTile deploy={state.deploy} />
        </section>

        {/* Zone 3 — action queue */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <RepliesTile replies={state.replies} />
          <JoelQueueTile items={state.joelQueue} />
        </section>

        {/* Zone 4 — activity */}
        <section className="mb-4">
          <ActivityStream events={state.activity} />
        </section>

        {/* Footer / Mailchimp */}
        <footer className="text-[10px] uppercase tracking-widest text-stone-600 text-center pt-4 pb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>
            <Users size={10} className="inline -mt-0.5 mr-1" />
            {state.mailchimp?.subscribers?.toLocaleString('en-US') || '—'} subscribers
          </span>
          <span className="text-stone-700">·</span>
          <span>
            <Inbox size={10} className="inline -mt-0.5 mr-1" />
            heartbeat {state.heartbeatAge != null ? `${Math.floor(state.heartbeatAge / 60)}m` : '—'}
          </span>
          <span className="text-stone-700">·</span>
          <span>polling every 10s</span>
          {state.refreshedAt && (
            <>
              <span className="text-stone-700">·</span>
              <span className="font-mono text-stone-500">{new Date(state.refreshedAt).toLocaleTimeString()}</span>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
