/* bpquiz.com/engine/results: fill the page with her Expertise Snapshot and
 * wire the $47 Client-Ready Blueprint buttons to hosted Stripe checkout. */
(function () {
  const params = new URLSearchParams(window.location.search);
  let sid = (params.get('sid') || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sid) {
    try { const s = JSON.parse(localStorage.getItem('eee_state_v1') || 'null'); if (s && s.sid) sid = s.sid; } catch { /* noop */ }
  }
  const purchased = params.get('purchased') === '1';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cards = Array.from(document.querySelectorAll('.result-card'));
  const topOk = document.querySelector('.topline .ok');
  const download = document.querySelector('.topline .download');
  const resultsH2 = document.querySelector('.results h2');
  const bridge = document.querySelector('.bridge .wrap');
  const buyButtons = Array.from(document.querySelectorAll('a.btn')).filter((a) => /\$47/.test(a.textContent));

  function fillCard(card, out) {
    if (!card) return;
    const h3 = card.querySelector('h3');
    const p = card.querySelector('.personal');
    if (!out || !out.headline) {
      h3.textContent = 'Take the free interview to see this.';
      if (p) p.innerHTML = '<a href="/engine#expertise-interview" style="text-decoration:underline;color:var(--navy);font-weight:800">Start the interview</a>';
      return;
    }
    h3.textContent = out.headline;
    const receipts = (out.evidence || []).slice(0, 4).map((e) => `<li>“${esc(e.quote)}”${e.from ? ` <span style="color:#697281">— ${esc(e.from)}</span>` : ''}</li>`).join('');
    if (p) p.innerHTML = `<strong>Why we see it:</strong> ${esc(out.summary)}${receipts ? `<ul style="margin:10px 0 0;padding-left:18px;font-size:.95rem">${receipts}</ul>` : ''}`;
  }

  function showGap(text) {
    if (!bridge || !text) return;
    const h2 = bridge.querySelector('h2');
    const p = document.createElement('p');
    p.className = 'lead';
    p.style.cssText = 'margin:18px auto 0;color:#dbe2eb;text-align:left';
    p.textContent = text;
    h2.insertAdjacentElement('afterend', p);
  }

  function noResult(reason) {
    if (topOk) topOk.textContent = reason || 'Take the free interview first, then come back here.';
    if (download) { download.textContent = 'Start the free interview'; download.href = '/engine#expertise-interview'; }
    cards.forEach((c) => fillCard(c, null));
  }

  async function loadResult() {
    if (!sid) return noResult();
    try {
      const r = await fetch('/api/engine-result?sid=' + encodeURIComponent(sid), { cache: 'no-store' });
      if (r.status === 404) return noResult('We could not find that Snapshot. It may have expired (30 days).');
      if (!r.ok) throw new Error('http ' + r.status);
      const data = await r.json();
      const res = data.result || {};
      const name = res.first_name ? res.first_name : '';
      if (resultsH2 && name) resultsH2.textContent = `Here’s What We Found About You, ${name}.`;
      fillCard(cards[0], res.hidden_expertise);
      fillCard(cards[1], res.strongest_pattern);
      fillCard(cards[2], res.unfair_advantage);
      showGap(res.commercial_gap);
      if (download) { download.href = '/api/engine-result?sid=' + encodeURIComponent(sid) + '&format=html'; download.target = '_blank'; download.rel = 'noopener'; }
      if (topOk) topOk.textContent = res.degraded
        ? '✓ Your answers are saved. We are still reviewing them; the full Snapshot lands in your email.'
        : `✓ Your Expertise Snapshot™ is ready${data.email ? `. The full version is in your inbox (${data.email}).` : '.'}`;
      track('eee_result_viewed', { sid, degraded: Boolean(res.degraded) });
    } catch (err) {
      noResult('We could not load your Snapshot right now. Check your email for the full version.');
    }
  }

  // ─── $47 Client-Ready Blueprint ──────────────────────────────────────────
  function sayUnder(btn, text) {
    let n = btn.parentElement.querySelector('.eee-buy-note');
    if (!n) { n = document.createElement('div'); n.className = 'micro eee-buy-note'; n.style.marginTop = '10px'; btn.insertAdjacentElement('afterend', n); }
    n.textContent = text;
  }
  buyButtons.forEach((btn) => {
    btn.href = '#';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (btn.dataset.busy) return;
      btn.dataset.busy = '1';
      const label = btn.textContent;
      btn.textContent = 'Opening secure checkout…';
      track('eee_oto_click', { sid });
      try {
        const r = await fetch('/api/create-hosted-checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'engine-blueprint', sid, source: 'engine-results' }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.url) { window.location.assign(data.url); return; }
        if (r.status === 503) sayUnder(btn, 'Checkout for the Blueprint opens shortly. Your Snapshot is saved, and we will email you the moment it is live.');
        else sayUnder(btn, 'We could not open checkout. Please try again in a moment.');
      } catch {
        sayUnder(btn, 'We could not open checkout. Please try again in a moment.');
      } finally {
        btn.textContent = label;
        delete btn.dataset.busy;
      }
    });
  });

  if (purchased) {
    const bar = document.createElement('div');
    bar.style.cssText = 'background:#276749;color:#fff;text-align:center;padding:14px 20px;font-weight:800';
    bar.textContent = 'Payment received. Your Client-Ready Blueprint™ is being built from your interview and will arrive by email.';
    document.body.insertBefore(bar, document.body.firstChild);
    track('eee_oto_purchased', { sid });
  }

  function track(event, props) {
    try { window.posthog && window.posthog.capture && window.posthog.capture(event, props || {}); } catch { /* noop */ }
  }

  loadResult();
})();
