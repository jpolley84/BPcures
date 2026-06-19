// =====================================================================
// Sabbath hours for BPQuiz — sundown Friday → sundown Saturday.
//
// "Sundown" = local sunset at Fordsville, Kentucky, computed fresh each
// week from a self-contained sunrise/sunset algorithm (no API, no key,
// works forever, auto-tracks the seasons). Ohio County, KY observes
// CENTRAL time, so all display strings render in America/Chicago.
//
// Design rule: FAIL OPEN. If anything in the calculation throws or looks
// wrong, isSabbathNow() returns false and the store stays OPEN. A bug
// should never silently black out the storefront for a week — far better
// to accidentally stay open than to accidentally close.
//
// Algorithm: "Almanac for Computers" sunrise/sunset (official zenith
// 90.833°). Accurate to ~1 minute, which is well inside the tolerance
// for a sundown-to-sundown observance.
// =====================================================================

// Fordsville, KY (Ohio County). Sunset varies by seconds across a town;
// these coordinates are accurate to the minute.
const LAT = 37.6362;
const LNG = -86.710;
export const FORDSVILLE = { lat: LAT, lng: LNG };
const TZ = 'America/Chicago';
const ZENITH = 90.833; // official sunset (sun's upper limb at horizon + refraction)

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Sunset as UTC time-of-day (hours in [0,24)) for a given calendar date at
// LAT/LNG. Returns null in the polar no-sunset case (never happens here).
function sunsetUTHours(y, m, d) {
  // Day of year
  const N1 = Math.floor((275 * m) / 9);
  const N2 = Math.floor((m + 9) / 12);
  const N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
  const N = N1 - N2 * N3 + d - 30;

  const lngHour = LNG / 15;
  const t = N + (18 - lngHour) / 24; // 18 = sunset (vs 6 for sunrise)

  const M = 0.9856 * t - 3.289; // mean anomaly
  let L = M + 1.916 * Math.sin(M * D2R) + 0.02 * Math.sin(2 * M * D2R) + 282.634;
  L = ((L % 360) + 360) % 360; // true longitude, normalized

  let RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
  RA = ((RA % 360) + 360) % 360;
  // Put RA in the same quadrant as L
  const Lq = Math.floor(L / 90) * 90;
  const RAq = Math.floor(RA / 90) * 90;
  RA = (RA + (Lq - RAq)) / 15; // into hours

  const sinDec = 0.39782 * Math.sin(L * D2R);
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosH =
    (Math.cos(ZENITH * D2R) - sinDec * Math.sin(LAT * D2R)) /
    (cosDec * Math.cos(LAT * D2R));
  if (cosH > 1 || cosH < -1) return null; // sun never sets that day

  let H = R2D * Math.acos(cosH) / 15; // sunset hour angle → hours
  const T = H + RA - 0.06571 * t - 6.622; // local mean time
  let UT = T - lngHour; // → UTC
  UT = ((UT % 24) + 24) % 24;
  return UT;
}

// Read the America/Chicago wall-clock parts of a Date instant.
function centralParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const p = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  const wkMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    weekday: wkMap[p.weekday],
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
  };
}

// Resolve sunset on a given LOCAL (Central) calendar date to the correct
// absolute UTC instant. West-longitude evening sunsets fall on the *next*
// UTC date, so we test candidate instants on d-1/d/d+1 and keep the one
// whose Central calendar date matches the date we asked for.
function sunsetInstant(y, m, d) {
  const ut = sunsetUTHours(y, m, d);
  if (ut == null) return null;
  for (const off of [0, 1, -1]) {
    const inst = new Date(Date.UTC(y, m - 1, d + off) + ut * 3600 * 1000);
    const lp = centralParts(inst);
    if (lp.y === y && lp.m === m && lp.d === d) return inst;
  }
  // Fallback (should never hit): anchor on the requested date.
  return new Date(Date.UTC(y, m - 1, d) + ut * 3600 * 1000);
}

// Given any date in a Central calendar week, return {y,m,d} of that week's
// Friday (the Friday on-or-before the date). Noon-UTC anchoring avoids any
// DST rollover when shifting days.
function fridayOfWeek(centralNow) {
  const { weekday, y, m, d } = centralNow;
  const deltaToFriday = weekday >= 5 ? weekday - 5 : weekday + 2; // Sun..Thu→+2..+6, Fri→0, Sat→1
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));
  anchor.setUTCDate(anchor.getUTCDate() - deltaToFriday);
  return { y: anchor.getUTCFullYear(), m: anchor.getUTCMonth() + 1, d: anchor.getUTCDate() };
}

function addDay({ y, m, d }) {
  const a = new Date(Date.UTC(y, m - 1, d, 12));
  a.setUTCDate(a.getUTCDate() + 1);
  return { y: a.getUTCFullYear(), m: a.getUTCMonth() + 1, d: a.getUTCDate() };
}

/**
 * Compute the current Sabbath window + whether we're inside it.
 * @param {Date} [nowArg] override "now" (for tests). Defaults to real now.
 * @returns {{ active:boolean, opensAt:Date|null, friSunset:Date, satSunset:Date }}
 *          or { active:false } on any failure (fail-open).
 */
export function sabbathStatus(nowArg) {
  try {
    const now = nowArg instanceof Date ? nowArg : new Date();
    const cNow = centralParts(now);
    const fri = fridayOfWeek(cNow);
    const sat = addDay(fri);
    const friSunset = sunsetInstant(fri.y, fri.m, fri.d);
    const satSunset = sunsetInstant(sat.y, sat.m, sat.d);
    if (!friSunset || !satSunset) return { active: false };
    const active = now >= friSunset && now < satSunset;
    return { active, opensAt: active ? satSunset : null, friSunset, satSunset };
  } catch {
    return { active: false }; // fail open
  }
}

/** True if the store should be closed for the Sabbath right now. */
export function isSabbathNow(nowArg) {
  return sabbathStatus(nowArg).active === true;
}

/** Human "reopens" string in Central time, e.g. "Saturday at 8:14 PM CT". */
export function reopenLabel(satSunset) {
  if (!(satSunset instanceof Date)) return 'sundown Saturday';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(satSunset).reduce((a, p) => ((a[p.type] = p.value), a), {});
  return `${parts.weekday} at ${parts.hour}:${parts.minute} ${parts.dayPeriod} CT`;
}
