/* Day 1 homework: Find Your Big Domino.
   Private by design: every answer lives in localStorage on this device only.
   The only network traffic is PostHog events carrying enum values, never text. */
(function () {
  'use strict';
  var KEY = 'cmlc:day1:2026-09-22';
  var LAST = 7;
  var LABEL = { stress: 'STRESS', sugar: 'SUGAR', sodium: 'SODIUM', hormones: 'HORMONE CHANGES / BIGGER PATTERN', unsure: 'STILL LOOKING', notyet: 'NOT TAKEN YET' };
  var FEELING = { clearer: 'I feel clearer.', relieved: 'I feel relieved.', hopeful: 'I feel hopeful.', lessafraid: 'I feel less afraid of the information.', somewhere: 'I finally feel like I have somewhere to start.', questions: "I still have questions, but I don't feel as lost." };

  var app = document.getElementById('app');
  var screens = [].slice.call(document.querySelectorAll('.screen'));
  var step = 0, memoryOnly = false, mem = null, nudged = false, saveTimer = null;

  function track(name, props) {
    try { if (window.posthog && posthog.capture) posthog.capture(name, props || {}); } catch (e) {}
  }

  /* ---------- storage ---------- */
  function read() {
    if (memoryOnly) return mem;
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { memoryOnly = true; showStorageNotice(); return mem; }
  }
  function write(obj) {
    mem = obj;
    if (memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(obj)); }
    catch (e) { memoryOnly = true; showStorageNotice(); }
  }
  function showStorageNotice() { var n = document.getElementById('storageNotice'); if (n) n.hidden = false; }

  /* ---------- answers ---------- */
  function controls() { return [].slice.call(app.querySelectorAll('[name]')); }

  function collect() {
    syncRows();
    var a = {};
    controls().forEach(function (el) {
      var n = el.name;
      if (el.type === 'checkbox') {
        if (/\[\]$/.test(n)) { a[n] = a[n] || []; if (el.checked) a[n].push(el.value); }
        else a[n] = el.checked ? '1' : '';
      } else if (el.type === 'radio') {
        if (el.checked) a[n] = el.value; else if (!(n in a)) a[n] = '';
      } else a[n] = el.value;
    });
    return a;
  }

  function fill(a) {
    if (!a) return;
    controls().forEach(function (el) {
      var n = el.name; if (!(n in a)) return;
      if (el.type === 'checkbox') el.checked = /\[\]$/.test(n) ? (a[n] || []).indexOf(el.value) > -1 : a[n] === '1';
      else if (el.type === 'radio') el.checked = a[n] === el.value;
      else el.value = a[n];
    });
    restoreRows(a.health_rows);
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { write({ v: 1, step: step, answers: collect() }); }, 300);
  }
  function saveNow() { clearTimeout(saveTimer); write({ v: 1, step: step, answers: collect() }); }

  /* ---------- know / story table ---------- */
  var kv = document.getElementById('kvTable');
  function syncRows() {
    var rows = [].slice.call(kv.querySelectorAll('.kv-row')).map(function (r) {
      return { know: r.querySelector('.kv-know').value, story: r.querySelector('.kv-story').value };
    });
    app.querySelector('[name="health_rows"]').value = JSON.stringify(rows);
  }
  function addRow(know, story) {
    var r = document.createElement('div'); r.className = 'kv-row';
    r.innerHTML = '<input type="text" class="field kv-know" aria-label="What I know" placeholder="Fact">' +
                  '<input type="text" class="field kv-story" aria-label="What I\'ve been telling myself it means" placeholder="Story">';
    r.querySelector('.kv-know').value = know || '';
    r.querySelector('.kv-story').value = story || '';
    kv.appendChild(r);
    return r;
  }
  function restoreRows(json) {
    var rows; try { rows = JSON.parse(json || '[]'); } catch (e) { rows = []; }
    if (!rows.length) return;
    [].slice.call(kv.querySelectorAll('.kv-row')).forEach(function (r) { r.remove(); });
    rows.forEach(function (x) { addRow(x.know, x.story); });
  }
  document.getElementById('addRow').addEventListener('click', function () { addRow().querySelector('.kv-know').focus(); save(); });

  /* ---------- navigation ---------- */
  function go(n, opts) {
    n = Math.max(0, Math.min(LAST, n));
    step = n;
    screens.forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    var s = screens[n];
    document.getElementById('progress').style.width = (n / LAST * 100) + '%';
    var mins = s.dataset.minutes ? ' · About ' + s.dataset.minutes + ' minutes' : '';
    document.getElementById('stepLabel').textContent = 'Step ' + (n + 1) + ' of ' + (LAST + 1) + ' · ' + s.dataset.part + mins;
    if (n === 4) echoGut();
    if (n === 6) prefillUnlock();
    if (n === 7) renderRecap();
    if (!(opts && opts.silent)) window.scrollTo({ top: 0, behavior: 'smooth' });
    saveNow();
  }

  function echoGut() {
    var a = collect();
    document.getElementById('gutEcho').textContent = a.gut ? LABEL[a.gut].replace('BIGGER PATTERN', 'THE BIGGER PATTERN') : '—';
  }
  function prefillUnlock() {
    var a = collect();
    var f = app.querySelector('[name="unlock_for"]'), r = app.querySelector('[name="unlock_area"]');
    if (!f.value && a.life_capacity) f.value = a.life_capacity;
    if (!r.value && a.domino && a.domino !== 'unsure') r.value = titleCase(LABEL[a.domino]);
  }
  function titleCase(s) { return s.toLowerCase().replace(/(^|\s|\/)\S/g, function (c) { return c.toUpperCase(); }); }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-next],[data-back],[data-panel-next]');
    if (!t) return;
    if (t.hasAttribute('data-track')) track(t.getAttribute('data-track'));
    if (t.hasAttribute('data-panel-next')) {
      var d = t.closest('details'); d.removeAttribute('open'); d.classList.add('done');
      var nx = d.nextElementSibling; if (nx) { nx.setAttribute('open', ''); nx.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    if (t.hasAttribute('data-back')) { go(step - 1); return; }
    if (step === 5 && !collect().domino && !nudged) {
      nudged = true; document.getElementById('dominoNudge').hidden = false; return;
    }
    track('day1_step', { step: step + 1 });
    go(step + 1);
  });

  // quiz link is an <a>, not a button
  var quizLink = app.querySelector('a[data-track]');
  if (quizLink) quizLink.addEventListener('click', function () { track('day1_quiz_open'); });

  app.addEventListener('input', save);
  app.addEventListener('change', function (e) {
    if (e.target.name === 'gut') echoGut();
    save();
  });

  /* ---------- recap ---------- */
  function renderRecap() {
    var a = collect();
    var dom = a.domino && LABEL[a.domino] ? a.domino : 'unsure';
    document.getElementById('recapDomino').textContent = LABEL[dom];
    document.getElementById('recapBefore').textContent = a.before || '';
    document.getElementById('recapTonight').textContent = a.tonight || '';
    document.getElementById('recapNow').textContent = a.now || '';
    var feel = a.feeling === 'other' ? a.feeling_other : (FEELING[a.feeling] || '');
    document.getElementById('recapFeeling').textContent = feel ? '“' + feel + '”' : '';
    buildAppendix(a);
    track('day1_complete', { domino: dom, quiz_result: a.quiz_result || '', agreement: a.agreement || '', feeling: a.feeling || '' });
  }

  var APPENDIX = [
    ['Part 1: The Number You\'ve Been Carrying', [
      ['The number(s) taking up space', function (a) { return listWith(a['p1_numbers[]'], a.p1_other, { bp: 'Blood pressure', weight: 'Weight', a1c: 'A1C / blood sugar', cholesterol: 'Cholesterol', meds: 'Medication count', age: 'Age' }); }],
      ['The number I keep thinking about is', 'p1_number'],
      ['I\'m afraid it means', 'p1_fear']]],
    ['Part 2: Your Five Numbers', [
      ['Fear: what I am most afraid could happen', 'fear_worst'],
      ['Fear: what this reminds me of', 'fear_reminds'],
      ['The story I have been attaching to this number', 'fear_story'],
      ['Health: what I actually know', 'health_know'],
      ['Health: what I don\'t know yet', 'health_unknown'],
      ['What I know / what I\'ve been telling myself it means', function (a) {
        var rows; try { rows = JSON.parse(a.health_rows || '[]'); } catch (e) { rows = []; }
        return rows.filter(function (r) { return r.know || r.story; }).map(function (r) { return (r.know || '—') + '  →  ' + (r.story || '—'); }).join('\n');
      }],
      ['Money: spent in the last year', function (a) { return a.money_amount ? '$' + a.money_amount : ''; }],
      ['What else this has cost me', function (a) { return listWith(a['money_costs[]'], a.money_other); }],
      ['The cost I feel the most', 'money_most'],
      ['Time: how long this has taken up space', function (a) { return a.time_amount ? a.time_amount + ' ' + a.time_unit : ''; }],
      ['How long I have been saying I need to do something', 'time_saying'],
      ['What would concern me most in five years', 'time_concern'],
      ['What I do NOT want to lose another five years to', 'time_lose'],
      ['Life: what I want my health for', function (a) { return listWith(a['life_wants[]'], a.life_other); }],
      ['The thing I most want to be able to do', 'life_capacity'],
      ['Something I still have NOT done that I intend to do', 'life_notdone']]],
    ['Part 3: Look for the Pattern', [
      ['Stress, what I notice', 'tri_stress'], ['Sugar, what I notice', 'tri_sugar'],
      ['Sodium, what I notice', 'tri_sodium'], ['Hormone changes, what I notice', 'tri_hormones'],
      ['From my gut, the area that stands out', function (a) { return a.gut ? LABEL[a.gut] : ''; }],
      ['I chose it because', 'gut_why']]],
    ['Part 4: The BP Triangle Quiz', [
      ['My quiz result pointed me toward', function (a) { return a.quiz_result ? LABEL[a.quiz_result] : ''; }],
      ['Did quiz and gut agree', 'agreement'],
      ['What pattern keeps raising its hand', 'pattern']]],
    ['Part 5: My Big Domino', [
      ['My possible Big Domino', function (a) { return a.domino ? LABEL[a.domino] : ''; }],
      ['Clue 1', 'clue1'], ['Clue 2', 'clue2'], ['Clue 3', 'clue3']]],
    ['Part 6: My Day 1 Unlock', [
      ['I want my health for', 'unlock_for'],
      ['The first area I am willing to pay closer attention to', 'unlock_area'],
      ['Before tonight, I thought', 'before'], ['Tonight, I realized', 'tonight'], ['And now I know', 'now']]]
  ];
  function listWith(arr, other, map) {
    arr = arr || []; map = map || {};
    return arr.map(function (v) { return v === 'other' ? (other || '') : (map[v] || v); }).filter(Boolean).join(', ');
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function buildAppendix(a) {
    var html = '<h2>My Day 1 answers</h2><p>Private. Printed from this device on ' + new Date().toLocaleDateString() + '.</p>';
    APPENDIX.forEach(function (sec) {
      var items = sec[1].map(function (it) {
        var v = typeof it[1] === 'function' ? it[1](a) : a[it[1]];
        return v ? '<dt>' + esc(it[0]) + '</dt><dd>' + esc(v) + '</dd>' : '';
      }).join('');
      if (items) html += '<h3>' + esc(sec[0]) + '</h3><dl>' + items + '</dl>';
    });
    document.getElementById('printAppendix').innerHTML = html;
  }

  /* ---------- copy / print / reset ---------- */
  document.getElementById('copyBtn').addEventListener('click', function () {
    var btn = this, text = document.getElementById('recapDomino').textContent;
    function done() { var was = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = was; }, 2000); track('day1_copy'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
    else { legacyCopy(text); done(); }
  });
  function legacyCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove();
  }
  document.getElementById('printBtn').addEventListener('click', function () { track('day1_print'); window.print(); });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm("Start over? This erases tonight's answers on this device.")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    mem = null; location.reload();
  });

  /* ---------- boot ---------- */
  var saved = read();
  if (saved && saved.answers) { fill(saved.answers); go(saved.step || 0, { silent: true }); }
  else go(0, { silent: true });

  window.Day1 = { go: go, save: saveNow, load: read, reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }, collect: collect };
})();
