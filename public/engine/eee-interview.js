/* bpquiz.com/engine: the AI-driven Expertise Extraction Interview (browser side).
 *
 * The browser owns the transcript; /api/engine-interview decides each next
 * turn (scripted surface first, then the model) and writes the Snapshot at the
 * end. State lives in localStorage so a refresh resumes where she left off.
 */
(function () {
  const API = '/api/engine-interview';
  const RESULTS = '/engine/results';
  const STORE = 'eee_state_v1';
  const STAGES = ['Your Story', 'Your Evidence', 'Your Pattern', 'Your Direction', 'Your Snapshot'];
  const EARLY_RESULT_AT = 9;

  const el = (id) => document.getElementById(id);
  const start = el('quiz-start'), app = el('quiz-app'), thinking = el('quiz-thinking'), preview = el('quiz-preview');
  const answerBox = el('eee-answer'), listening = el('eee-listening');
  const nextBtn = el('eee-next'), skipBtn = el('eee-skip'), startBtn = el('eee-start-btn');

  let state = load() || fresh();
  let current = null;      // the question on screen
  let busy = false;
  let wantResult = false;

  function fresh() {
    return { sid: mintSid(), name: '', email: '', transcript: [], done: false, v: 1 };
  }
  function mintSid() {
    const a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return 'e' + Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); return s && s.sid && Array.isArray(s.transcript) ? s : null; } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }

  // ─── start card ──────────────────────────────────────────────────────────
  const nameIn = el('eee-name'), emailIn = el('eee-email');
  if (state.transcript.length && !state.done) {
    nameIn.value = state.name || '';
    emailIn.value = state.email || '';
    startBtn.textContent = 'CONTINUE MY INTERVIEW';
    note(startCard(), 'Welcome back. Your answers so far are saved on this device.');
  }
  function startCard() { return start.querySelector('.quiz-optin'); }
  function note(parent, text, isError) {
    let n = parent.querySelector('.eee-note');
    if (!n) { n = document.createElement('p'); n.className = 'quiz-micro eee-note'; parent.appendChild(n); }
    n.textContent = text;
    n.style.color = isError ? '#b4232f' : '';
  }

  startBtn.onclick = async () => {
    const name = nameIn.value.trim();
    const email = emailIn.value.trim().toLowerCase();
    if (!name) { note(startCard(), 'Tell us your first name so the Snapshot can speak to you.', true); nameIn.focus(); return; }
    if (!validEmail(email)) { note(startCard(), 'Enter the email where your full Snapshot should land.', true); emailIn.focus(); return; }
    if (state.done || (state.email && state.email !== email)) { state = fresh(); }
    state.name = name; state.email = email; save();
    start.classList.add('quiz-hidden');
    app.classList.remove('quiz-hidden');
    track('eee_interview_started', { resumed: state.transcript.length > 0 });
    await nextTurn();
  };

  // ─── turns ───────────────────────────────────────────────────────────────
  async function post(payload) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; }
    return r.json();
  }
  function base() {
    return { sid: state.sid, name: state.name, email: state.email, stage: stageOf(), transcript: state.transcript };
  }
  function stageOf() {
    const t = state.transcript.find((x) => x.id === 'U1');
    return t && t.values && t.values[0] || '';
  }

  async function nextTurn() {
    setBusy(true, state.transcript.length < 4 ? 'One moment…' : 'Reading your answer…');
    try {
      const turn = await post({ action: 'next', wantResult, ...base() });
      if (turn.action === 'FINISH') return finish();
      render(turn);
    } catch (err) {
      showError('We lost the connection for a second.', () => nextTurn());
    } finally {
      setBusy(false);
    }
  }

  function render(q) {
    current = q;
    const turns = state.transcript.length;
    const stageIdx = Math.max(0, STAGES.indexOf(q.progress_stage || 'Your Evidence'));
    el('eee-phase').textContent = q.progress_stage || STAGES[Math.min(stageIdx, 4)];
    el('eee-progress-text').textContent = turns < 4 ? 'Finding the clues' : turns < 10 ? 'Connecting the evidence' : turns < 16 ? 'Testing the pattern' : 'Making sure';
    // Stage-based progress, never "7 of 14": the length is dynamic.
    const pct = Math.min(92, 6 + stageIdx * 18 + Math.min(14, turns * 1.2));
    el('eee-progress-bar').style.width = pct + '%';

    listening.textContent = q.listening_line || '';
    listening.classList.toggle('show', Boolean(q.listening_line));
    el('eee-kicker').textContent = q.kicker || '';
    el('eee-question').textContent = q.question_text;
    el('eee-help').textContent = q.helper_text || '';

    answerBox.innerHTML = '';
    if (q.answer_type === 'single' || q.answer_type === 'multi') {
      const wrap = document.createElement('div');
      wrap.className = 'quiz-options';
      wrap.setAttribute('role', q.answer_type === 'single' ? 'radiogroup' : 'group');
      (q.options || []).forEach(([value, label]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'quiz-option'; b.dataset.value = value; b.textContent = label;
        b.setAttribute('aria-pressed', 'false');
        b.onclick = () => {
          if (q.answer_type === 'single') wrap.querySelectorAll('.quiz-option').forEach((x) => { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.toggle('selected');
          b.setAttribute('aria-pressed', b.classList.contains('selected') ? 'true' : 'false');
          if (q.answer_type === 'single') setTimeout(() => advance(false), 160);
        };
        wrap.appendChild(b);
      });
      answerBox.appendChild(wrap);
    } else {
      const input = document.createElement(q.answer_type === 'text' ? 'input' : 'textarea');
      input.className = q.answer_type === 'text' ? 'quiz-input' : 'quiz-textarea';
      input.id = 'eee-current-input';
      input.placeholder = q.answer_type === 'text' ? 'Your answer…' : 'A sentence or two is plenty. Real examples beat summaries.';
      input.setAttribute('aria-label', q.question_text);
      if (q.answer_type === 'text') input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); advance(false); } });
      else input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); advance(false); } });
      answerBox.appendChild(input);
      setTimeout(() => input.focus(), 50);
    }
    earlyResultControl(turns);
    track('eee_question_viewed', { id: q.question_id, source: q.source, turn: turns + 1 });
    const top = app.getBoundingClientRect().top + window.scrollY - 24;
    if (window.scrollY > top + 80 || window.innerWidth < 760) window.scrollTo({ top, behavior: 'smooth' });
  }

  function earlyResultControl(turns) {
    let c = el('eee-early');
    if (turns < EARLY_RESULT_AT) { if (c) c.remove(); return; }
    if (!c) {
      c = document.createElement('div');
      c.id = 'eee-early';
      c.style.cssText = 'margin-top:14px;text-align:center;font-size:.9rem;color:#667085';
      c.innerHTML = 'Short on time? <button type="button" id="eee-early-btn" class="quiz-secondary" style="padding:4px 6px">Show me what you have so far</button> <span style="opacity:.75">The more you share, the clearer your Snapshot.</span>';
      app.querySelector('.quiz-body').appendChild(c);
      el('eee-early-btn').onclick = () => { wantResult = true; track('eee_show_results_early'); advance(true); };
    }
  }

  function readAnswer() {
    if (!current) return { a: '', values: undefined };
    if (current.answer_type === 'single' || current.answer_type === 'multi') {
      const picked = Array.from(answerBox.querySelectorAll('.quiz-option.selected'));
      return { a: picked.map((x) => x.textContent).join('; '), values: picked.map((x) => x.dataset.value) };
    }
    const inp = el('eee-current-input');
    return { a: inp ? inp.value.trim() : '', values: undefined };
  }

  async function advance(skipped) {
    if (busy || !current) return;
    const { a, values } = readAnswer();
    const isSkip = skipped || !a;
    state.transcript.push({ id: current.question_id, q: current.question_text, a: isSkip ? '' : a, values: isSkip ? undefined : values, skipped: isSkip });
    save();
    track(isSkip ? 'eee_question_skipped' : 'eee_question_answered', { id: current.question_id, len: a.length });
    await nextTurn();
  }
  nextBtn.onclick = () => advance(false);
  skipBtn.onclick = () => advance(true);

  function setBusy(on, label) {
    busy = on;
    nextBtn.disabled = on; skipBtn.disabled = on;
    nextBtn.textContent = on ? (label || 'Thinking…') : 'CONTINUE';
    nextBtn.style.opacity = on ? '.7' : '';
  }

  function showError(msg, retry) {
    listening.textContent = msg + ' ';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'quiz-secondary'; b.textContent = 'Try again';
    b.onclick = () => { listening.classList.remove('show'); retry(); };
    listening.appendChild(b);
    listening.classList.add('show');
  }

  // ─── finish ──────────────────────────────────────────────────────────────
  async function finish() {
    app.classList.add('quiz-hidden');
    preview.classList.add('quiz-hidden');
    thinking.classList.remove('quiz-hidden');
    thinking.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const msgs = [
      ['We’re reviewing your evidence.', 'Looking across your jobs, lived experience, repeated requests, strengths, and results.'],
      ['We’re looking for repetition.', 'The strongest clues are the ones that show up in more than one part of your life.'],
      ['We’re separating labels from evidence.', 'A title like “coach” or “creative” matters less than what people actually trust you to do.'],
      ['We’re scoring the themes.', 'Proof, ease, echo, energy, story, demand. Each one, 0 to 3.'],
      ['Writing your Snapshot.', 'The full read is on its way to ' + (state.email || 'your inbox') + ' as well.'],
    ];
    let i = 0;
    const timer = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); el('eee-thinking-title').textContent = msgs[i][0]; el('eee-thinking-copy').textContent = msgs[i][1]; }, 2200);
    try {
      const out = await post({ action: 'finish', ...base() });
      clearInterval(timer);
      state.done = true; save();
      track('eee_interview_completed', { sid: state.sid, turns: state.transcript.length, emailed: Boolean(out.emailed) });
      window.location.assign(RESULTS + '?sid=' + encodeURIComponent(state.sid));
    } catch (err) {
      clearInterval(timer);
      el('eee-thinking-title').textContent = 'One more second.';
      el('eee-thinking-copy').innerHTML = 'We hit a snag writing your Snapshot. Your answers are saved. <button type="button" class="quiz-primary" id="eee-finish-retry">Try again</button>';
      el('eee-finish-retry').onclick = () => finish();
    }
  }

  function track(event, props) {
    try { window.posthog && window.posthog.capture && window.posthog.capture(event, props || {}); } catch { /* noop */ }
  }

  // CTA buttons scroll to the interview.
  document.querySelectorAll('a[href="#expertise-interview"]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); el('expertise-interview').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });
})();
