/* sabbath-gate.js — standalone Sabbath gate for STATIC sales pages.
   (challenge-b on changemylifechallenge.com, and copied into
   minoritypossible-site/public/assets/ for the /shop page there.)

   FOURTH/FIFTH twin of the same gate (React: SabbathGate.jsx + utils/sabbath.js;
   static: public/tea/index.html; Shopify: snippets/sabbath-gate.liquid). The
   sunset math below is VERBATIM from those. If the algorithm ever changes,
   change it in ALL twins or they disagree about the minute the doors open.

   2026-08-21 (Joel): every gate now carries (1) a real explanation of the
   Sabbath, never a bare wall; (2) a live countdown to Saturday sundown;
   (3) an email-me-when-it-ends button (POST https://bpquiz.com/api/sabbath-reminder,
   which schedules one Resend email for two minutes after sundown).

   Config via window.SABBATH_SOURCE ('challenge' | 'mp-shop' | ...), set by the
   including page BEFORE this script. Hosts are allow-listed below; preview and
   localhost never gate. ?sabbath=force shows it anytime, ?sabbath=off hides.
   FAIL OPEN: any error and the page stays visible. */
(function () {
  try {
    var LAT = 37.6362, LNG = -86.710, ZENITH = 90.833, TZ = 'America/Chicago';
    var D2R = Math.PI / 180, R2D = 180 / Math.PI;

    function sunsetUTHours(y, m, d) {
      var N1 = Math.floor((275 * m) / 9), N2 = Math.floor((m + 9) / 12);
      var N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
      var N = N1 - N2 * N3 + d - 30;
      var lngHour = LNG / 15;
      var t = N + (18 - lngHour) / 24;
      var M = 0.9856 * t - 3.289;
      var L = M + 1.916 * Math.sin(M * D2R) + 0.02 * Math.sin(2 * M * D2R) + 282.634;
      L = ((L % 360) + 360) % 360;
      var RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
      RA = ((RA % 360) + 360) % 360;
      var Lq = Math.floor(L / 90) * 90, RAq = Math.floor(RA / 90) * 90;
      RA = (RA + (Lq - RAq)) / 15;
      var sinDec = 0.39782 * Math.sin(L * D2R);
      var cosDec = Math.cos(Math.asin(sinDec));
      var cosH = (Math.cos(ZENITH * D2R) - sinDec * Math.sin(LAT * D2R)) / (cosDec * Math.cos(LAT * D2R));
      if (cosH > 1 || cosH < -1) return null;
      var H = R2D * Math.acos(cosH) / 15;
      var T = H + RA - 0.06571 * t - 6.622;
      var UT = T - lngHour;
      return ((UT % 24) + 24) % 24;
    }
    function centralParts(date) {
      var fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
      var p = {};
      fmt.formatToParts(date).forEach(function (part) { p[part.type] = part.value; });
      var wk = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { y: +p.year, m: +p.month, d: +p.day, weekday: wk[p.weekday], hour: (+p.hour) % 24, minute: +p.minute };
    }
    function sunsetInstant(y, m, d) {
      var ut = sunsetUTHours(y, m, d);
      if (ut == null) return null;
      var offs = [0, 1, -1];
      for (var i = 0; i < offs.length; i++) {
        var inst = new Date(Date.UTC(y, m - 1, d + offs[i]) + ut * 3600 * 1000);
        var lp = centralParts(inst);
        if (lp.y === y && lp.m === m && lp.d === d) return inst;
      }
      return new Date(Date.UTC(y, m - 1, d) + ut * 3600 * 1000);
    }
    function fridayOfWeek(cNow) {
      var delta = cNow.weekday >= 5 ? cNow.weekday - 5 : cNow.weekday + 2;
      var a = new Date(Date.UTC(cNow.y, cNow.m - 1, cNow.d, 12));
      a.setUTCDate(a.getUTCDate() - delta);
      return { y: a.getUTCFullYear(), m: a.getUTCMonth() + 1, d: a.getUTCDate() };
    }
    function sabbathStatus(now) {
      try {
        var cNow = centralParts(now);
        var fri = fridayOfWeek(cNow);
        var satA = new Date(Date.UTC(fri.y, fri.m - 1, fri.d, 12)); satA.setUTCDate(satA.getUTCDate() + 1);
        var sat = { y: satA.getUTCFullYear(), m: satA.getUTCMonth() + 1, d: satA.getUTCDate() };
        var friSunset = sunsetInstant(fri.y, fri.m, fri.d);
        var satSunset = sunsetInstant(sat.y, sat.m, sat.d);
        if (!friSunset || !satSunset) return { active: false };
        return { active: now >= friSunset && now < satSunset, satSunset: satSunset };
      } catch (e) { return { active: false }; }
    }
    function reopenLabel(satSunset) {
      try {
        return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(satSunset) + ' CT';
      } catch (e) { return 'sundown Saturday'; }
    }

    var params = new URLSearchParams(location.search);
    var override = params.get('sabbath');
    var host = location.hostname;
    var HOSTS = ['changemylifechallenge.com', 'www.changemylifechallenge.com',
                 'minoritypossible.com', 'www.minoritypossible.com',
                 'bpquiz.com', 'www.bpquiz.com'];
    var hostOk = override === 'force' || HOSTS.indexOf(host) !== -1;
    var source = window.SABBATH_SOURCE || 'challenge';

    var gateEl = null, tickTimer = null;

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function show(st) {
      if (gateEl) return;
      var opensMs = st.satSunset ? st.satSunset.getTime() : Date.now() + 25 * 3600e3;
      gateEl = document.createElement('div');
      gateEl.setAttribute('role', 'dialog');
      gateEl.setAttribute('aria-label', 'Closed for the Sabbath');
      gateEl.id = 'sabbathgate';
      gateEl.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#171310;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;';
      gateEl.innerHTML =
        '<div style="max-width:520px;text-align:center;font-family:Inter,system-ui,sans-serif;color:#fbf7f1;">' +
        '<div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c9a44c;font-weight:600;">From our family to yours</div>' +
        '<svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true" style="margin:20px auto 16px;display:block;"><line x1="6" y1="40" x2="62" y2="40" stroke="#6b5537" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="40" r="13" fill="#c9a44c"/><g stroke="#c9a44c" stroke-width="2" stroke-linecap="round"><line x1="34" y1="14" x2="34" y2="6"/><line x1="16" y1="22" x2="11" y2="17"/><line x1="52" y1="22" x2="57" y2="17"/><line x1="9" y1="34" x2="3" y2="32"/><line x1="59" y1="34" x2="65" y2="32"/></g></svg>' +
        '<h1 style="font-family:Georgia,serif;font-size:30px;font-weight:700;margin:0 0 14px;">We are resting.</h1>' +
        '<p style="font-size:15px;line-height:1.65;color:#e6dcd2;margin:0 0 10px;">From sundown Friday to sundown Saturday, our family observes the Sabbath. It is not a glitch and nothing is wrong &mdash; we simply close everything we sell for one day a week, rest, and put our attention on God and on each other.</p>' +
        '<p style="font-size:14px;line-height:1.6;color:#b9aca2;margin:0 0 18px;">We would rather keep that promise than take your money on the one day we ask nothing of anyone, including ourselves.</p>' +
        '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c9a44c;margin:0 0 6px;">Doors open again in</div>' +
        '<div id="sgCountdown" style="font-family:Georgia,serif;font-size:38px;letter-spacing:.04em;margin:0 0 4px;">--:--:--</div>' +
        '<div style="font-size:13px;color:#b9aca2;margin:0 0 22px;">' + reopenLabel(st.satSunset) + '</div>' +
        '<form id="sgRemind" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;max-width:400px;margin:0 auto;">' +
        '<input name="email" type="email" required placeholder="Your email" aria-label="Your email" style="flex:1 1 200px;min-width:0;padding:12px 15px;border-radius:999px;border:1px solid #4a3f36;background:#241e19;color:#fbf7f1;font-size:14px;"/>' +
        '<button type="submit" style="flex:0 0 auto;padding:12px 20px;border-radius:999px;border:0;background:#c9a44c;color:#171310;font-weight:800;font-size:13px;cursor:pointer;">EMAIL ME WHEN IT ENDS</button>' +
        '</form>' +
        '<p id="sgMsg" role="status" aria-live="polite" style="min-height:18px;font-size:12.5px;color:#b9aca2;margin:10px 0 0;"></p>' +
        '<p style="font-size:12px;color:#8a7f74;font-style:italic;margin:20px 0 0;">&ldquo;Remember the Sabbath day, to keep it holy.&rdquo; &mdash; Exodus 20:8</p>' +
        '</div>';
      document.body.appendChild(gateEl);
      document.documentElement.style.overflow = 'hidden';

      var cd = gateEl.querySelector('#sgCountdown');
      function tick() {
        var left = opensMs - Date.now();
        if (left <= 0) { hide(); return; }
        var h = Math.floor(left / 3600e3), m = Math.floor((left % 3600e3) / 60e3), s = Math.floor((left % 60e3) / 1e3);
        cd.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
      }
      tick();
      tickTimer = setInterval(tick, 1000);

      gateEl.querySelector('#sgRemind').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = e.target, msg = gateEl.querySelector('#sgMsg');
        var email = f.email.value.trim();
        if (!email) return;
        var btn = f.querySelector('button');
        btn.disabled = true; btn.textContent = 'ONE MOMENT';
        fetch('https://bpquiz.com/api/sabbath-reminder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, source: source, endsAtMs: opensMs }),
        }).then(function (r) { return r.ok; }).catch(function () { return false; })
          .then(function (ok) {
            if (ok) {
              f.style.display = 'none';
              msg.style.color = '#c9a44c';
              msg.textContent = 'Done. One email, right when the doors open. Rest well.';
            } else {
              btn.disabled = false; btn.textContent = 'EMAIL ME WHEN IT ENDS';
              msg.textContent = 'That did not go through. Please try again.';
            }
          });
      });
    }
    function hide() {
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      if (gateEl) { try { gateEl.remove(); } catch (e) {} gateEl = null; }
      document.documentElement.style.overflow = '';
    }
    function sync() {
      var st = sabbathStatus(new Date());
      var active = override === 'force' ? true : override === 'off' ? false : st.active;
      if (active && hostOk) show(st); else hide();
    }
    sync();
    setInterval(sync, 60000);
  } catch (e) { /* fail open */ }
})();
