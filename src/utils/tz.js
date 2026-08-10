// Timezone helpers. Extracted from ChallengePage.jsx on 2026-08-10 so the
// countdown banner could reuse the DST-correct version instead of a second
// copy drifting out of sync. ChallengePage now imports from here, so there is
// exactly ONE implementation of this in the codebase. Keep it that way: a
// duplicated version of this that hardcodes -4 or -5 will silently move every
// deadline by an hour in November and nobody will notice until doors close at
// the wrong time.

// A real IANA offset AT AN INSTANT, not a hardcoded -4/-5.
export function zoneOffsetMs(d, timeZone) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(d.toLocaleString('en-US', { timeZone }));
    return local.getTime() - utc.getTime();
  } catch {
    return -4 * 3600 * 1000; // EDT fallback
  }
}

// 'YYYY-MM-DDTHH:mm:ss' read as wall time in `timeZone`, returned as a real
// instant. Two passes: the first uses the offset at the naive instant, the
// second re-reads the offset at the corrected instant, which is what makes it
// correct on either side of a DST boundary.
export function zonedInstant(isoLocal, timeZone = 'America/New_York') {
  const [datePart, timePart = '00:00:00'] = String(isoLocal).split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  const naive = Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, s || 0);
  let instant = naive - zoneOffsetMs(new Date(naive), timeZone);
  instant = naive - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}
