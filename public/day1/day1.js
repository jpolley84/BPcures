/* Day 1 homework: Find Your Big Domino (streamlined, 2026-09-22 pm).
   Private by design: every answer lives in localStorage on this device only.
   The only network traffic is PostHog events carrying enum values, never text.
   Quiz questions and STARTS content mirror src/data/triggerQuestions.js and
   the TRIGGERS block in src/pages/TriggerQuizPage.jsx. Change both together. */
(function () {
  'use strict';
  var KEY = 'cmlc:day1:2026-09-22';
  var LAST = 6;
  var LABEL = { stress: 'STRESS', sugar: 'SUGAR', sodium: 'SODIUM', sleep: 'SLEEP', stillness: 'STILLNESS', hormones: 'HORMONE CHANGES / BIGGER PATTERN', unsure: 'STILL LOOKING' };
  var FEELING = { clearer: 'I feel clearer.', relieved: 'I feel relieved.', hopeful: 'I feel hopeful.', lessafraid: 'I feel less afraid of the information.', somewhere: 'I finally feel like I have somewhere to start.', questions: "I still have questions, but I don't feel as lost." };

  var STARTS = {
    stress: { name: 'The Stress Spike',
      copy: 'When stress never stops, your blood vessels stay squeezed too long. This is not in your head. It is your body’s alarm stuck in the on position.',
      herb: 'Ashwagandha. An herb many people use to help their body handle stress.',
      food: 'Cut the caffeine. Swap it for chamomile or hibiscus tea. Add foods rich in magnesium, like pumpkin seeds and leafy greens.',
      habit: 'Build one calm moment into your day. Even 3 slow breaths before you check your phone.' },
    sugar: { name: 'The Sugar Surge',
      copy: 'Every spike and crash sends out the same stress chemicals that push blood pressure up. It is not about willpower. It is how often your blood sugar swings without you knowing it.',
      herb: 'Cinnamon. Many people add it to meals to help keep blood sugar steady.',
      food: 'Do not eat carbs alone. Pair them with protein or fiber. It softens the swing.',
      habit: 'Take a short walk after you eat. Even 10 minutes softens a blood sugar spike.' },
    sodium: { name: 'The Sodium Trap',
      copy: 'It is rarely the salt shaker. Most salt hides in bread, sauces, canned food, and “healthy” frozen meals, and most of us do not eat enough fresh food with potassium to balance it.',
      herb: 'Hibiscus. An herb tea long used to support healthy water balance and blood flow.',
      food: 'Eat one food rich in potassium most days: a banana, a sweet potato, spinach, or beans.',
      habit: 'For one week, read the salt number on food labels the way you would read sugar. Just notice.' },
    sleep: { name: 'The Midnight Drift',
      copy: 'Your blood pressure is supposed to drop at night. Broken sleep steals that dip, so your numbers never get their break.',
      herb: 'Chamomile or passionflower. Gentle herbs many people use to wind down before bed.',
      food: 'Skip heavy or sugary meals in the 2 to 3 hours before bed. They work against the nightly dip.',
      habit: 'Wake up at the same time every day, even on weekends. It does more than a strict bedtime.' },
    stillness: { name: 'The Stillness Trigger',
      copy: 'Movement is the signal that keeps your blood vessels soft and springy. Long sitting means they stop getting that signal.',
      herb: 'Hawthorn. An herb long used to support the heart and healthy blood flow.',
      food: 'Add plant omega-3s a few times a week: walnuts, ground flaxseed, or chia seeds.',
      habit: 'Get up and move every 60 to 90 minutes. Even 2 minutes of standing and stretching counts.' },
    hormones: { name: 'The Bigger Pattern',
      copy: 'When sleep, belly weight, energy, mood, and readings all changed in the same season, they are usually one connected story, not five separate problems. Annie teaches this on Day 2.',
      herb: 'Come to Day 2 tomorrow at 12pm ET / 11am CT with your Five Numbers in hand. That is where this one gets answered.',
      food: 'Start tomorrow with a whole-food, plant-based breakfast that has fiber and protein, like oats with ground flaxseed and berries. Steady mornings calm the whole pattern.',
      habit: 'Get 10 minutes of daylight and a walk before noon. It anchors sleep, mood, and energy on the same clock.' },
    unsure: { name: 'Still Looking',
      copy: 'Still looking is different from hiding. Tonight you looked. Pick the smallest honest start.',
      herb: 'Swap one caffeinated drink tomorrow for hibiscus or chamomile tea.',
      food: 'Eat one food rich in potassium tomorrow: a banana, a sweet potato, spinach, or beans.',
      habit: 'Take a 10-minute walk after one meal tomorrow, and notice how you feel an hour later.' }
  };

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
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { write({ v: 2, step: step, answers: collect() }); }, 300);
  }
  function saveNow() { clearTimeout(saveTimer); write({ v: 2, step: step, answers: collect() }); }

  /* ---------- quiz scoring (same rule as TriggerQuizPage: first pick wins ties) ---------- */
  function score(a) {
    var s = { stress: 0, sugar: 0, sodium: 0, sleep: 0, stillness: 0 }, order = [], answered = 0;
    ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(function (q) {
      var k = a[q]; if (!k) return; answered++;
      if (k in s) { s[k]++; if (order.indexOf(k) < 0) order.push(k); }
    });
    var top = null, best = 0;
    order.forEach(function (k) { if (s[k] > best) { best = s[k]; top = k; } });
    return { top: top, answered: answered, count: best };
  }
  function showVerdict() {
    var a = collect(), r = score(a);
    var el = document.getElementById('quizTop'), note = document.getElementById('quizNote');
    if (!r.top) { el.textContent = '—'; note.textContent = 'Answer the five questions on the last screen to see your result.'; return; }
    el.textContent = LABEL[r.top] + ' · ' + STARTS[r.top].name;
    note.textContent = r.count + ' of your ' + r.answered + ' answers pointed here. Use it as another clue, not a diagnosis.';
    var d = app.querySelector('[name="domino"]:checked');
    if (!d) { app.querySelector('[name="domino"][value="' + r.top + '"]').checked = true; showStarts(); }
  }
  function showStarts() {
    var a = collect(), box = document.getElementById('starts');
    if (!a.domino) { box.hidden = true; return; }
    var s = STARTS[a.domino];
    document.getElementById('startsName').textContent = s.name;
    document.getElementById('startsCopy').textContent = s.copy;
    document.getElementById('startHerb').textContent = s.herb;
    document.getElementById('startFood').textContent = s.food;
    document.getElementById('startHabit').textContent = s.habit;
    box.hidden = false;
  }

  /* ---------- navigation ---------- */
  function go(n, opts) {
    n = Math.max(0, Math.min(LAST, n));
    step = n;
    screens.forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    var s = screens[n];
    document.getElementById('progress').style.width = (n / LAST * 100) + '%';
    var mins = s.dataset.minutes ? ' · About ' + s.dataset.minutes + ' minutes' : '';
    document.getElementById('stepLabel').textContent = 'Step ' + (n + 1) + ' of ' + (LAST + 1) + ' · ' + s.dataset.part + mins;
    if (n === 4) { showVerdict(); showStarts(); }
    if (n === 6) renderRecap();
    if (!(opts && opts.silent)) window.scrollTo({ top: 0, behavior: 'smooth' });
    saveNow();
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-next],[data-back]');
    if (!t) return;
    if (t.hasAttribute('data-track')) track(t.getAttribute('data-track'));
    if (t.hasAttribute('data-back')) { go(step - 1); return; }
    if (step === 4 && !collect().domino && !nudged) {
      nudged = true; document.getElementById('dominoNudge').hidden = false; return;
    }
    track('day1_step', { step: step + 1 });
    go(step + 1);
  });

  app.addEventListener('input', save);
  app.addEventListener('change', function (e) {
    if (e.target.name === 'domino') { showStarts(); document.getElementById('dominoNudge').hidden = true; }
    save();
  });

  /* ---------- recap ---------- */
  function renderRecap() {
    var a = collect();
    var dom = a.domino && LABEL[a.domino] ? a.domino : 'unsure';
    var s = STARTS[dom];
    document.getElementById('recapDomino').textContent = LABEL[dom];
    document.getElementById('recapStarts').innerHTML = [s.herb, s.food, s.habit].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    document.getElementById('recapBefore').textContent = a.before || '';
    document.getElementById('recapTonight').textContent = a.tonight || '';
    document.getElementById('recapNow').textContent = a.now || '';
    var feel = FEELING[a.feeling] || '';
    document.getElementById('recapFeeling').textContent = feel ? '“' + feel + '”' : '';
    buildAppendix(a);
    var r = score(a);
    track('day1_complete', { domino: dom, quiz_top: r.top || '', feeling: a.feeling || '' });
  }

  var NUMBERS = { bp: 'Blood pressure', weight: 'Weight', a1c: 'A1C / blood sugar', cholesterol: 'Cholesterol', meds: 'Medication count', age: 'Age' };
  var APPENDIX = [
    ['Part 1: The Number You\'ve Been Carrying', [
      ['The number(s) taking up space', function (a) { return (a['p1_numbers[]'] || []).map(function (v) { return v === 'other' ? a.p1_other : NUMBERS[v]; }).filter(Boolean).join(', '); }],
      ['I\'m afraid it means', 'p1_fear']]],
    ['Part 2: Your Five Numbers', [
      ['The story I have been attaching to this number', 'fear_story'],
      ['What I know', 'health_know'],
      ['What I\'ve been telling myself it means', 'health_story'],
      ['Money: spent in the last year', function (a) { return a.money_amount ? '$' + a.money_amount : ''; }],
      ['Time: how long this has taken up space', function (a) { return a.time_amount ? a.time_amount + ' ' + a.time_unit : ''; }],
      ['What I want my health for', 'life_capacity']]],
    ['Part 3: The 5 Hidden Triggers', [
      ['My answers pointed most toward', function (a) { var r = score(a); return r.top ? LABEL[r.top] + ' (' + r.count + ' of ' + r.answered + ')' : ''; }]]],
    ['Part 4: My Big Domino', [
      ['My possible Big Domino', function (a) { return a.domino ? LABEL[a.domino] : ''; }],
      ['3 things to start right away', function (a) { var s = STARTS[a.domino || 'unsure']; return '1. ' + s.herb + '\n2. ' + s.food + '\n3. ' + s.habit; }],
      ['The one clue that convinced me', 'clue1']]],
    ['Part 5: My Day 1 Unlock', [
      ['Before tonight, I thought', 'before'], ['Tonight, I realized', 'tonight'], ['And now I know', 'now'],
      ['How I feel', function (a) { return FEELING[a.feeling] || ''; }]]]
  ];
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
  if (saved && saved.v === 2 && saved.answers) { fill(saved.answers); go(saved.step || 0, { silent: true }); }
  else { try { localStorage.removeItem(KEY); } catch (e) {} go(0, { silent: true }); }

  window.Day1 = { go: go, save: saveNow, load: read, collect: collect, score: function () { return score(collect()); } };
})();
