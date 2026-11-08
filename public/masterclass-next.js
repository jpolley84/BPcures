/* masterclass-next.js — the static-page twin of src/components/MasterclassNextButton.jsx.
   2026-11-08 (Joel): every thank-you page gets a one-click "join the next masterclass".
   Renders into every [data-masterclass-next] element (data-page names the page).
   Email: the page's own email box, else what the quiz or an opt-in saved in
   localStorage. Posts source 'next-masterclass-oneclick'; the server decides
   between a seat in the next dated class and the waitlist.
   Keep NEXT in step with src/lib/nextMasterclass.js and api/masterclass-register.js. */
(function () {
  var NEXT = { title: '4 Hidden Health Mistakes', when: 'Monday, November 9, 7 PM Eastern (6 PM Central)', endsAt: Date.parse('2026-11-10T01:30:00Z') };
  var set = Date.now() < NEXT.endsAt;
  var RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function knownEmail() {
    var f = document.querySelector('input[type=email], input[name=email]');
    if (f && RE.test((f.value || '').trim())) return f.value.trim();
    try { var e = localStorage.getItem('bwbp_lead_email'); if (e && RE.test(e)) return e; } catch (x) {}
    return '';
  }
  function knownName() {
    var f = document.querySelector('input[name=name], input[name=first_name]');
    return f ? (f.value || '').trim() : '';
  }

  function render(el) {
    if (el.getAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    var page = el.getAttribute('data-page') || 'thank-you';
    el.innerHTML =
      '<form style="background:#102b47;color:#fff;border-radius:14px;padding:18px;margin:18px auto;max-width:640px;text-align:left;font-family:inherit">' +
      '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#d7b579;text-transform:uppercase;margin-bottom:4px">Free live masterclass with Joel &amp; Annie, RNs</div>' +
      '<div style="font-weight:700;font-size:18px;line-height:1.35;margin-bottom:4px">' + (set ? NEXT.title : 'Join the next masterclass') + '</div>' +
      '<div style="font-size:15px;line-height:1.5;color:#e8eef4;margin-bottom:12px">' + (set ? NEXT.when + '. Live on Zoom. No replay.' : 'Save your spot and we will email you the date.') + '</div>' +
      '<input type="email" placeholder="Your best email" aria-label="Your email" style="display:none;width:100%;box-sizing:border-box;min-height:46px;border-radius:10px;border:0;padding:10px 12px;font-size:16px;margin-bottom:10px">' +
      '<button type="submit" style="width:100%;min-height:48px;background:#d7b579;color:#102b47;border:0;border-radius:10px;font-weight:800;font-size:16px;cursor:pointer;font-family:inherit">' + (set ? 'Join the masterclass, one click' : 'Join the next masterclass') + ' &rarr;</button>' +
      '<div data-note style="font-size:13px;color:#b9c7d4;margin-top:8px"></div></form>';
    var form = el.querySelector('form'), input = el.querySelector('input'), btn = el.querySelector('button'), note = el.querySelector('[data-note]');
    var email = knownEmail();
    // On an opt-in page the visitor types her email into the page's own form
    // first, so read it again at click time instead of asking twice.
    var pageField = document.querySelector('input[type=email], input[name=email]');
    if (email) note.textContent = 'Your seat goes to ' + email + '.';
    else if (!pageField || pageField.closest('[data-masterclass-next]')) input.style.display = 'block';

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var addr = email || knownEmail() || (input.value || '').trim();
      if (!RE.test(addr)) { input.style.display = 'block'; note.textContent = 'Please enter your email.'; return; }
      btn.disabled = true; btn.textContent = 'Saving...';
      fetch('/api/masterclass-register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr, name: knownName(), source: 'next-masterclass-oneclick', site: page })
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.d.error || 'Something went wrong. Please try again.');
          try { localStorage.setItem('bwbp_lead_email', addr); } catch (x) {}
          try { window.posthog && window.posthog.capture('masterclass_oneclick_join', { page: page, one_click: !!email, waitlisted: !!res.d.waitlisted }); } catch (x) {}
          form.innerHTML = '<div style="font-weight:800;font-size:17px;margin-bottom:4px">' + (res.d.waitlisted ? 'You are on the list.' : 'You are in.') + '</div>' +
            '<div style="font-size:15px;color:#e8eef4">' + (res.d.waitlisted ? 'We will email you the date of the next free masterclass.' : 'Check your email for your Zoom link. See you ' + NEXT.when + '.') + '</div>';
        })
        .catch(function (err) { btn.disabled = false; btn.textContent = 'Try again'; note.textContent = err.message; });
    });
  }

  function scan() { document.querySelectorAll('[data-masterclass-next]').forEach(render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.renderMasterclassNext = scan;
})();
