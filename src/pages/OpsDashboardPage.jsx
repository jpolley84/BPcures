import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  DollarSign,
  FileText,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Mail,
  Package,
  RefreshCw,
  Search,
  Settings,
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

// ─── Shared small pieces (Orders + Traffic) ───────────────────────────
function StatCard({ title, value, sub, accent = 'text-stone-100' }) {
  return (
    <Tile title={title}>
      <div
        className={`text-3xl leading-none ${accent}`}
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-stone-400 mt-2 leading-snug">{sub}</div>}
    </Tile>
  );
}

function InlineWarning({ children }) {
  if (!children) return null;
  return (
    <div className="mb-3 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded-lg px-3 py-2 flex items-start gap-2">
      <AlertCircle size={12} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function TabButton({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors border ${
        active
          ? 'bg-stone-800 border-stone-600 text-stone-100'
          : 'bg-transparent border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-800/40'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function FilterPill({ active, onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-emerald-900/40 border-emerald-700/60 text-emerald-300'
          : 'bg-stone-900/40 border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-600'
      }`}
    >
      {children}
    </button>
  );
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

// ─── Orders tab ───────────────────────────────────────────────────────
const BLEND_STYLES = {
  steady: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  satin: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
};

const STATUS_ORDER = { new: 0, pending: 1, fulfilled: 2 };

function formatAddress(address) {
  if (!address) return '';
  const { line1, line2, city, state, postal_code: postal, country } = address;
  const cityLine = [city, state].filter(Boolean).join(', ');
  const lastLine = [cityLine, postal].filter(Boolean).join(' ');
  return [line1, line2, lastLine, country].filter(Boolean).join('\n');
}

function shortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TeaOrderRow({ order, passcode, onStatusChange }) {
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState('');
  const [copied, setCopied] = useState(false);
  const addressText = formatAddress(order.address);

  const setStatus = async (next) => {
    if (next === order.status || busy) return;
    const previous = order.status;
    setRowError('');
    setBusy(true);
    onStatusChange(order.id, next); // optimistic
    try {
      const res = await fetch('/api/ops-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Ops-Pass': passcode },
        body: JSON.stringify({ id: order.id, status: next }),
      });
      if (!res.ok) {
        onStatusChange(order.id, previous); // revert
        setRowError(`Update failed (HTTP ${res.status})`);
      }
    } catch (e) {
      onStatusChange(order.id, previous); // revert
      setRowError(e.message || 'Network error');
    } finally {
      setBusy(false);
    }
  };

  const copyOne = () => {
    const block = [
      order.name || '(no name)',
      addressText,
      `${order.item || order.blend || 'tea'} x ${order.qty ?? 1}`,
    ]
      .filter(Boolean)
      .join('\n');
    copyToClipboard(block).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => setRowError('Clipboard blocked')
    );
  };

  const blendKey = String(order.blend || '').toLowerCase();
  const blendClass = BLEND_STYLES[blendKey] || 'bg-stone-700/40 text-stone-300 border-stone-600/50';

  return (
    <div className="py-4 border-b border-stone-700/60 last:border-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <span className="text-[11px] font-mono text-stone-500 shrink-0 pt-0.5">
          {shortDate(order.date)}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0 ${blendClass}`}
        >
          {order.blend || 'tea'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-stone-200 font-medium truncate">
            {order.name || '(no name)'}
          </div>
          <div className="text-xs text-stone-500 truncate">{order.email || '—'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm text-stone-200 font-mono">{formatMoney(order.amountCents)}</div>
          <div className="text-[10px] text-stone-500">
            {order.item || '—'} × {order.qty ?? 1}
          </div>
        </div>
      </div>

      {order.subscription && (
        <div className="mt-2 text-[10px] uppercase tracking-wider text-amber-400/80">
          subscription
        </div>
      )}

      {order.addressLooksLikeName && (
        <div className="mt-2 inline-flex items-start gap-1.5 text-[10px] uppercase tracking-wider bg-amber-900/30 text-amber-300 border border-amber-700/50 rounded px-2 py-1">
          <AlertTriangle size={11} className="mt-px shrink-0" />
          Name looks like address — confirm before shipping
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-start gap-3">
        <pre className="flex-1 min-w-[200px] text-xs text-stone-300 font-mono whitespace-pre-wrap bg-stone-900/50 border border-stone-700/60 rounded-lg px-3 py-2 leading-relaxed">
          {addressText || 'No shipping address on file'}
        </pre>
        <button
          onClick={copyOne}
          className="shrink-0 text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-200 transition-colors flex items-center gap-1 px-2 py-2"
          title="Copy this address block"
        >
          <Copy size={11} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {['new', 'pending', 'fulfilled'].map((s) => {
          const active = order.status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={busy}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                active
                  ? s === 'fulfilled'
                    ? 'bg-emerald-900/50 border-emerald-600/60 text-emerald-300'
                    : s === 'pending'
                    ? 'bg-amber-900/50 border-amber-600/60 text-amber-300'
                    : 'bg-stone-700/60 border-stone-500/60 text-stone-100'
                  : 'bg-stone-900/40 border-stone-700 text-stone-500 hover:text-stone-200 hover:border-stone-600'
              }`}
            >
              {active && s === 'fulfilled' && <CheckCircle2 size={10} className="inline -mt-0.5 mr-1" />}
              {s}
            </button>
          );
        })}
        {busy && <RefreshCw size={11} className="text-stone-500 animate-spin ml-1" />}
        {order.status === 'fulfilled' && order.fulfilledAt && (
          <span className="text-[10px] text-stone-500 ml-1">{timeAgo(order.fulfilledAt)}</span>
        )}
      </div>

      {rowError && (
        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
          <AlertCircle size={11} /> {rowError}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ passcode, refreshNonce }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [blendFilter, setBlendFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [copiedList, setCopiedList] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/ops-orders', {
          headers: { 'X-Ops-Pass': passcode },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [passcode, refreshNonce]);

  const handleStatusChange = useCallback((id, status) => {
    setData((prev) => {
      if (!prev || !Array.isArray(prev.tea)) return prev;
      return { ...prev, tea: prev.tea.map((o) => (o.id === id ? { ...o, status } : o)) };
    });
  }, []);

  const tea = Array.isArray(data?.tea) ? data.tea : [];
  const kits = Array.isArray(data?.kits) ? data.kits : [];
  const summary = data?.summary || {};

  const filteredTea = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = tea.filter((o) => {
      const status = o.status || 'new';
      if (statusFilter === 'open' && status === 'fulfilled') return false;
      if (statusFilter !== 'all' && statusFilter !== 'open' && status !== statusFilter) return false;
      if (blendFilter !== 'all' && String(o.blend || '').toLowerCase() !== blendFilter) return false;
      if (q) {
        const hay = `${o.email || ''} ${o.name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Open work first, then newest first
    return rows.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 0;
      const sb = STATUS_ORDER[b.status] ?? 0;
      if (sa !== sb) return sa - sb;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [tea, statusFilter, blendFilter, query]);

  const copyShippingList = () => {
    const open = filteredTea.filter((o) => (o.status || 'new') !== 'fulfilled');
    if (open.length === 0) {
      setCopiedList('Nothing open to copy');
      setTimeout(() => setCopiedList(''), 2000);
      return;
    }
    const text = open
      .map((o) =>
        [
          o.name || '(no name)',
          formatAddress(o.address),
          `${o.item || o.blend || 'tea'} x ${o.qty ?? 1}`,
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n\n---\n\n');
    copyToClipboard(text).then(
      () => {
        setCopiedList(`Copied ${open.length} order${open.length === 1 ? '' : 's'}`);
        setTimeout(() => setCopiedList(''), 2000);
      },
      () => {
        setCopiedList('Clipboard blocked');
        setTimeout(() => setCopiedList(''), 2000);
      }
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 text-stone-400 text-sm py-16 justify-center">
        <RefreshCw size={16} className="animate-spin" />
        Loading orders...
      </div>
    );
  }

  if (error && !data) {
    return (
      <Tile title="Orders">
        <div className="text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      </Tile>
    );
  }

  const openCount = (summary.teaNew ?? 0) + (summary.teaPending ?? 0);

  return (
    <>
      {error && <InlineWarning>Refresh failed: {error} (showing last good data)</InlineWarning>}

      {/* Summary strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard
          title="Open tea orders"
          value={openCount}
          accent={openCount > 0 ? 'text-amber-300' : 'text-stone-100'}
          sub={`${formatMoney(summary.teaOpenRevenueCents)} unshipped · ${summary.teaNew ?? 0} new · ${
            summary.teaPending ?? 0
          } pending`}
        />
        <StatCard
          title="Fulfilled"
          value={summary.teaFulfilled ?? 0}
          sub={`of ${summary.teaTotal ?? 0} tea orders · ${formatMoney(summary.teaRevenueCents)} lifetime`}
        />
        <StatCard
          title="Blend split"
          value={`${summary.teaSteady ?? 0} / ${summary.teaSatin ?? 0}`}
          sub="Steady / Satin"
        />
        <StatCard
          title="Kit orders"
          value={summary.kitCount ?? 0}
          sub={`${formatMoney(summary.kitRevenueCents)} · digital, auto-delivered`}
        />
      </section>

      {/* Tea worklist */}
      <section className="mb-4">
        <Tile title={`Tea orders — shipping worklist (${filteredTea.length})`}>
          {data?.teaError && <InlineWarning>{data.teaError}</InlineWarning>}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-stone-700/60">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ['open', 'Open'],
                ['all', 'All'],
                ['new', 'New'],
                ['pending', 'Pending'],
                ['fulfilled', 'Fulfilled'],
              ].map(([key, label]) => (
                <FilterPill
                  key={key}
                  active={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </FilterPill>
              ))}
            </div>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ['all', 'All blends'],
                ['steady', 'Steady'],
                ['satin', 'Satin'],
              ].map(([key, label]) => (
                <FilterPill key={key} active={blendFilter === key} onClick={() => setBlendFilter(key)}>
                  {label}
                </FilterPill>
              ))}
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email or name"
                className="w-full bg-stone-900/50 border border-stone-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              onClick={copyShippingList}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-wider border border-stone-700 bg-stone-900/40 text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
            >
              <Copy size={11} /> {copiedList || 'Copy shipping list'}
            </button>
          </div>

          {filteredTea.length === 0 ? (
            <div className="text-stone-500 text-sm italic py-6 text-center">
              No orders match this filter.
            </div>
          ) : (
            <div className="-my-1">
              {filteredTea.map((o) => (
                <TeaOrderRow
                  key={o.id}
                  order={o}
                  passcode={passcode}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </Tile>
      </section>

      {/* Kits — read only */}
      <section className="mb-4">
        <Tile title={`Kits & upsells (${kits.length}) — digital, auto-delivered`}>
          {data?.kitsError && <InlineWarning>{data.kitsError}</InlineWarning>}
          {kits.length === 0 ? (
            <div className="text-stone-500 text-sm italic py-4">No kit orders yet.</div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 text-left">
                    <th className="font-semibold pb-2 pr-3">Date</th>
                    <th className="font-semibold pb-2 pr-3">Email</th>
                    <th className="font-semibold pb-2 pr-3">Label</th>
                    <th className="font-semibold pb-2 pr-3">Corner</th>
                    <th className="font-semibold pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60">
                  {kits.map((k) => (
                    <tr key={k.id} className="text-stone-300">
                      <td className="py-2 pr-3 font-mono text-stone-500 whitespace-nowrap">
                        {shortDate(k.date)}
                      </td>
                      <td className="py-2 pr-3 max-w-[200px] truncate">{k.email || '—'}</td>
                      <td className="py-2 pr-3 text-stone-200">{k.label || '—'}</td>
                      <td className="py-2 pr-3 text-stone-500">{k.corner || '—'}</td>
                      <td className="py-2 text-right font-mono text-stone-200 whitespace-nowrap">
                        {formatMoney(k.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tile>
      </section>
    </>
  );
}

// ─── Traffic tab ──────────────────────────────────────────────────────
function pctLabel(v) {
  return v == null ? '—' : `${v}%`;
}

function TrendBars({ trend }) {
  if (!Array.isArray(trend) || trend.length === 0) {
    return <div className="text-stone-500 text-sm italic">No trend data.</div>;
  }
  const maxViews = Math.max(...trend.map((d) => d.pageviews || 0), 1);
  const visitorSeries = trend.map((d) => d.visitors || 0);
  const totalViews = trend.reduce((a, d) => a + (d.pageviews || 0), 0);
  const totalVisitors = trend.reduce((a, d) => a + (d.visitors || 0), 0);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs text-stone-400">
          <span className="text-stone-200 font-medium">{totalViews.toLocaleString('en-US')}</span>{' '}
          pageviews
          <span className="text-stone-600 mx-2">·</span>
          <span className="text-stone-200 font-medium">{totalVisitors.toLocaleString('en-US')}</span>{' '}
          visitors
        </div>
        <Sparkline values={visitorSeries} width={90} height={28} stroke="#10b981" />
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex items-end gap-[2px] h-24 min-w-[280px]">
          {trend.map((d) => {
            const h = Math.max(2, Math.round(((d.pageviews || 0) / maxViews) * 96));
            return (
              <div
                key={d.day}
                className="flex-1 min-w-[3px] bg-emerald-600/60 hover:bg-emerald-500 rounded-sm transition-colors"
                style={{ height: `${h}px` }}
                title={`${d.day}: ${d.pageviews || 0} views · ${d.visitors || 0} visitors`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-stone-600 mt-2 font-mono">
        <span>{trend[0]?.day || ''}</span>
        <span>{trend[trend.length - 1]?.day || ''}</span>
      </div>
    </div>
  );
}

function SetupCard({ setup }) {
  return (
    <Tile title="Analytics not configured">
      <div className="flex items-start gap-3 mb-4">
        <Settings size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-stone-300 leading-snug">
          {setup?.why || 'Analytics source is not connected yet.'}
        </div>
      </div>
      {Array.isArray(setup?.steps) && setup.steps.length > 0 && (
        <ol className="space-y-2 text-sm text-stone-400 border-t border-stone-700 pt-4">
          {setup.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-wider text-stone-600 font-mono mt-1 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="leading-snug break-words min-w-0">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </Tile>
  );
}

function TrafficTab({ passcode, refreshNonce }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ops-analytics?days=${days}`, {
          headers: { 'X-Ops-Pass': passcode },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [passcode, days, refreshNonce]);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 text-stone-400 text-sm py-16 justify-center">
        <RefreshCw size={16} className="animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (error && !data) {
    return (
      <Tile title="Traffic">
        <div className="text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      </Tile>
    );
  }

  if (data && data.configured === false) {
    return <SetupCard setup={data.setup} />;
  }

  const conv = data?.conversion || {};
  const pages = Array.isArray(data?.pages) ? data.pages : [];
  const sources = Array.isArray(data?.sources) ? data.sources : [];

  return (
    <>
      {error && <InlineWarning>Refresh failed: {error} (showing last good data)</InlineWarning>}

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-semibold">
          Range
        </span>
        {[7, 30, 90].map((d) => (
          <FilterPill key={d} active={days === d} onClick={() => setDays(d)} disabled={loading}>
            {d}d
          </FilterPill>
        ))}
        {loading && <RefreshCw size={12} className="text-stone-500 animate-spin" />}
      </div>

      {/* Conversion stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <StatCard
          title="Visitors"
          value={(conv.visitors ?? 0).toLocaleString('en-US')}
          sub={`${(conv.quizStarters ?? 0).toLocaleString('en-US')} started the quiz`}
        />
        <StatCard
          title="Leads"
          value={(conv.leads ?? 0).toLocaleString('en-US')}
          sub={`${(conv.checkoutClicks ?? 0).toLocaleString('en-US')} checkout clicks`}
        />
        <StatCard
          title="Purchases"
          value={(conv.purchases ?? 0).toLocaleString('en-US')}
          accent="text-emerald-300"
          sub={`${pctLabel(conv.visitorToPurchasePct)} of visitors`}
        />
      </section>

      <section className="mb-4">
        <Tile title="Conversion rates">
          {data?.conversionError && <InlineWarning>{data.conversionError}</InlineWarning>}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['Visitor → quiz', conv.visitorToQuizPct],
              ['Quiz → lead', conv.quizToLeadPct],
              ['Lead → purchase', conv.leadToPurchasePct],
              ['Visitor → purchase', conv.visitorToPurchasePct],
              ['OTO take rate', conv.otoTakeRatePct],
            ].map(([label, val]) => (
              <div key={label}>
                <div
                  className="text-2xl text-stone-100 leading-none"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                >
                  {pctLabel(val)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-1.5 leading-snug">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Tile>
      </section>

      <section className="mb-4">
        <Tile title={`Traffic trend (${data?.days ?? days}d)`}>
          {data?.trendError && <InlineWarning>{data.trendError}</InlineWarning>}
          <TrendBars trend={data?.trend} />
        </Tile>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <Tile title="Top pages">
          {data?.pagesError && <InlineWarning>{data.pagesError}</InlineWarning>}
          {pages.length === 0 ? (
            <div className="text-stone-500 text-sm italic">No page data.</div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[320px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 text-left">
                    <th className="font-semibold pb-2 pr-3">Path</th>
                    <th className="font-semibold pb-2 pr-3 text-right">Views</th>
                    <th className="font-semibold pb-2 text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60">
                  {pages.map((p, i) => (
                    <tr key={`${p.path}-${i}`} className="text-stone-300">
                      <td className="py-2 pr-3 font-mono max-w-[220px] truncate">{p.path || '—'}</td>
                      <td className="py-2 pr-3 text-right font-mono text-stone-200">
                        {(p.views ?? 0).toLocaleString('en-US')}
                      </td>
                      <td className="py-2 text-right font-mono text-stone-400">
                        {(p.visitors ?? 0).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tile>

        <Tile title="Traffic sources">
          {data?.sourcesError && <InlineWarning>{data.sourcesError}</InlineWarning>}
          {sources.length === 0 ? (
            <div className="text-stone-500 text-sm italic">No source data.</div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[280px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 text-left">
                    <th className="font-semibold pb-2 pr-3">Source</th>
                    <th className="font-semibold pb-2 text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700/60">
                  {sources.map((s, i) => (
                    <tr key={`${s.source}-${i}`} className="text-stone-300">
                      <td className="py-2 pr-3 max-w-[220px] truncate">{s.source || 'direct'}</td>
                      <td className="py-2 text-right font-mono text-stone-200">
                        {(s.visitors ?? 0).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tile>
      </section>
    </>
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
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshNonce, setRefreshNonce] = useState(0);
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
              onClick={() => {
                fetchState();
                setRefreshNonce((n) => n + 1);
              }}
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

        {/* Tab bar */}
        <nav className="flex items-center gap-1 mb-4 overflow-x-auto -mx-1 px-1 border-b border-stone-700/60 pb-3">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            Icon={LayoutDashboard}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            Icon={Package}
            label="Orders"
          />
          <TabButton
            active={activeTab === 'traffic'}
            onClick={() => setActiveTab('traffic')}
            Icon={BarChart3}
            label="Traffic"
          />
        </nav>

        {activeTab === 'overview' && (
          <>
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
          </>
        )}

        {activeTab === 'orders' && <OrdersTab passcode={passcode} refreshNonce={refreshNonce} />}

        {activeTab === 'traffic' && <TrafficTab passcode={passcode} refreshNonce={refreshNonce} />}

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
