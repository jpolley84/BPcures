// /ask — the clinical-question bridge (DM Engine Revamp, 2026-08-10).
//
// The DM automation cannot and will not answer personal medical questions
// (RN liability). It used to deflect to an email address — which ~nobody used.
// Now the clinical lane hands out ONE button that lands here: a prefilled
// 2-minute form. Submit -> /api/ask-submit -> KV queue + instant auto-ack;
// Joel answers by email within 48h.
//
// Prefill via query params: ?cid=<manychat contact id>&fn=<first name>.
// Standalone conversion page (no SiteLayout), editorial-apothecary tokens
// like the other capture pages. No health claims anywhere.
import { useMemo, useState } from 'react';
import { track } from '../utils/analytics';

function useQueryPrefill() {
  return useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return { cid: p.get('cid') || '', fn: p.get('fn') || '' };
    } catch {
      return { cid: '', fn: '' };
    }
  }, []);
}

export default function AskPage() {
  const { cid, fn } = useQueryPrefill();
  const [name, setName] = useState(fn);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [doctorSaid, setDoctorSaid] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setErrMsg('');
    try {
      const r = await fetch('/api/ask-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, question, doctor_said: doctorSaid, cid, company: '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.success) {
        setState('done');
        try { track('ask_submitted', { has_cid: !!cid }); } catch { /* non-fatal */ }
      } else {
        setState('error');
        setErrMsg(j.error || 'Something went wrong — please try again.');
      }
    } catch {
      setState('error');
      setErrMsg('Something went wrong — please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#2c2a26]" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8a6d3b] font-semibold">BraveWorks RN</p>
        <h1 className="mt-2 text-3xl sm:text-4xl leading-tight">Ask me properly.</h1>
        <p className="mt-4 leading-relaxed text-[#4a463f]">
          I can&apos;t answer personal medical questions in a DM — you deserve better than a guess
          from half the picture. Put it here instead. Every one gets read, and I answer by email,
          usually within <strong>48 hours</strong>.
        </p>

        {state === 'done' ? (
          <div className="mt-8 rounded-2xl border border-[#d8cfbe] bg-white p-6 shadow-sm">
            <h2 className="text-xl">Got it. It&apos;s in my queue.</h2>
            <p className="mt-3 leading-relaxed text-[#4a463f]">
              Check your inbox — a confirmation from me is on its way (peek in spam if it hides).
              I&apos;ll answer within 48 hours. If anything changes and feels urgent before then,
              don&apos;t wait on me — get seen.
            </p>
            <p className="mt-4 text-sm text-[#6b6455]">
              Want answers live instead? I take questions every Wednesday 7pm ET inside my{' '}
              <a className="underline" href="https://skool.com/braveworksrn/about">Weekly Reset group</a> ($27/mo).
            </p>
            <p className="mt-4">— Joel, RN</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            {/* honeypot — humans never see it */}
            <input type="text" name="company" tabIndex="-1" autoComplete="off" aria-hidden="true"
              className="hidden" onChange={() => {}} />
            <div>
              <label className="block text-sm font-semibold" htmlFor="ask-name">First name</label>
              <input id="ask-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cfbe] bg-white px-4 py-3 outline-none focus:border-[#B85A36]"
                placeholder="Your first name" />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="ask-email">Email <span className="text-[#B85A36]">*</span></label>
              <input id="ask-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cfbe] bg-white px-4 py-3 outline-none focus:border-[#B85A36]"
                placeholder="Where I should send your answer" />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="ask-q">Your question <span className="text-[#B85A36]">*</span></label>
              <textarea id="ask-q" required rows={5} value={question} onChange={(e) => setQuestion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cfbe] bg-white px-4 py-3 outline-none focus:border-[#B85A36]"
                placeholder="Say it the way you'd say it to a nurse you trust. Numbers welcome." />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="ask-doc">What has your doctor said about it? <span className="font-normal text-[#6b6455]">(optional)</span></label>
              <textarea id="ask-doc" rows={3} value={doctorSaid} onChange={(e) => setDoctorSaid(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cfbe] bg-white px-4 py-3 outline-none focus:border-[#B85A36]"
                placeholder="If you've talked to them — what did they say?" />
            </div>

            {state === 'error' && (
              <p className="rounded-lg bg-[#fdf3f3] border border-[#e3b3b3] px-4 py-3 text-sm text-[#a33]">{errMsg}</p>
            )}

            <button type="submit" disabled={state === 'sending'}
              className="w-full rounded-xl bg-[#B85A36] px-6 py-4 text-lg font-semibold text-white shadow hover:opacity-90 disabled:opacity-60">
              {state === 'sending' ? 'Sending…' : 'Send my question to Joel'}
            </button>

            <p className="text-xs leading-relaxed text-[#6b6455]">
              What you get back is education to take to your own doctor — not medical advice, not a
              diagnosis, and it doesn&apos;t create a nurse–patient relationship. If you have chest
              pain, trouble breathing, a reading over 180/120, sudden weakness or numbness, or
              anything that feels wrong right now: don&apos;t type — call 911 or get to urgent care.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
