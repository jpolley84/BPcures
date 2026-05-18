// /cohort2 — BP Triangle Cohort 2 application page.
//
// 2026-05-18 launch prep. Replaces the price-reveal Cohort 2 framing
// per Joel's "vacation-selling page with application quiz" direction.
//
// No price visible. Outcome-focused. Application-only qualifying.
// 90-day group program opening Sunday May 24, 2026.
//
// Voice: Hardy future-self + Salesgirls warmth + Brunson application-
// funnel structure. Annie + Joel as the guides for the transformation
// journey, not the protocol-pushers. Premium-buyer language throughout.
//
// Application POSTs to /api/coaching-apply (window now extended through
// Aug 31). Submissions reach braveworksrn@gmail.com for manual review.

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Sunrise, Heart, Compass, Send, ShieldCheck, Mail, Loader2 } from 'lucide-react';

export default function Cohort2Page() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    ageRange: '', bpRange: '', bpMeds: '',
    investmentRange: '', whyNow: '', whenStart: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const required = ['name', 'email', 'phone', 'whyNow'];
    const missing = required.filter((k) => !String(form[k] || '').trim());
    if (missing.length) {
      setError('Please fill out name, email, phone, and the "Why now" question.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/coaching-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Submission failed (${r.status})`);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not submit. Try again or email braveworksrn@gmail.com.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Thank-you state ─────────────────────────────────────────────
  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--paper)', display: 'grid', placeItems: 'center', padding: '3rem 1.5rem', color: 'var(--ink)' }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 1.5rem', borderRadius: '50%', background: 'var(--sage-soft)', border: '1px solid var(--sage-deep)', display: 'grid', placeItems: 'center' }}>
            <CheckCircle2 size={32} color="var(--sage-deep)" />
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', margin: '0 0 1rem', lineHeight: 1.2 }}>
            Your application is in.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
            I'll personally read every word over the next 48 hours. If we're a fit, you'll hear from me by email with a link to book a 30-minute conversation.
          </p>
          <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
            If now isn't the moment, I'll tell you that too — and point you toward what is.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'var(--ink)', margin: 0 }}>— Joel</p>
        </div>
      </main>
    );
  }

  // ─── Main page ───────────────────────────────────────────────────
  return (
    <main style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24" style={{ background: 'var(--paper-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#FCEED9', color: '#B85A36', letterSpacing: '0.16em' }}>
            BraveWorks RN · Cohort 2 · Opens Sunday May 24
          </div>
          <h1 className="font-serif mb-6 leading-tight" style={{ color: 'var(--ink)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}>
            Imagine the version of you who isn't afraid of her own blood pressure anymore.
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Ninety days from now, your morning numbers are lower. Your energy is back. Your husband notices. Your cardiologist starts asking <em>what are you doing differently?</em> And you're not on as many pills as you were the day you joined.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02]"
            style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}
          >
            Apply for Cohort 2 <ArrowRight size={18} />
          </a>
          <div className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
            Application-only · 30-minute fit call if it's right · No payment collected at application
          </div>
        </div>
      </section>

      {/* ─── THE INVITATION ─────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            The Cohort
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-6 text-center" style={{ color: 'var(--ink)' }}>
            Ninety days with your nurse, your hormone coach, and a small group of women doing this with you.
          </h2>
          <p className="text-base sm:text-lg mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            This isn't a course. It isn't a chatbot. It isn't a $19 PDF.
          </p>
          <p className="text-base sm:text-lg mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            It's twelve weeks of real human guidance from a registered nurse with twenty years in ICU and emergency medicine, his wife — a hormone-corner co-coach who's walked her own restoration — and a curated group of women in the same season of life, doing this together.
          </p>
          <p className="text-base sm:text-lg" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            You're not figuring out blood pressure alone anymore. You're not Googling your medications anymore. You're not wondering whether to take that supplement anymore. You have guides who answer.
          </p>
        </div>
      </section>

      {/* ─── WHAT YOU BECOME ──────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--sage-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>
            The Transformation
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-10 text-center" style={{ color: 'var(--ink)' }}>
            Picture yourself ninety days from now.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Sunrise, title: 'Mornings feel different.', body: 'You sleep through. You wake without an alarm. Your first read of the day is fifteen to twenty-five points lower than the day you started.' },
              { icon: Heart, title: 'Your body trusts you again.', body: 'The bloating is gone. The 3 PM crash is gone. The reflux is gone. You\'re not eating less; you\'re eating differently — and you can taste food again.' },
              { icon: Sparkles, title: 'The conversation with your doctor shifts.', body: 'You walk in with a clean BP log and a one-page script. They taper a medication. Then another. They start asking what you\'re doing.' },
              { icon: Compass, title: 'You stop being afraid of food.', body: 'You stop being afraid of restaurants, vacations, parties. You stop carrying mental load about whether the salt at dinner will spike you. You have a framework that holds you.' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="p-6 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
                  <Icon size={28} strokeWidth={1.5} color="var(--sage-deep)" />
                  <h3 className="font-serif text-xl mt-3 mb-2" style={{ color: 'var(--ink)' }}>{card.title}</h3>
                  <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHO IS THIS FOR ──────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            Cohort 2 is for you if…
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-8" style={{ color: 'var(--ink)' }}>
            Read this honestly. If three of these describe you, apply.
          </h2>
          <ul className="space-y-4">
            {[
              "You're on one or more blood pressure medications and your numbers still aren't where you want them.",
              "You've tried the supplements, the apps, the YouTube videos — and you're tired of figuring it out alone.",
              "You're 45+ and you suspect hormones are part of what's happening to your body — but no one has actually checked.",
              "You want to bring your spouse along on this. Their support matters to you.",
              "You're spiritually inclined. You believe healing involves more than chemistry — and you want guides who get that without making it weird.",
              "You're ready to invest in yourself — financially, in time, in attention — for the next 90 days.",
            ].map((line) => (
              <li key={line} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <CheckCircle2 size={22} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span className="text-base sm:text-lg" style={{ lineHeight: 1.65 }}>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── MEET THE GUIDES ──────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            Your guides
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-10 text-center" style={{ color: 'var(--ink)' }}>
            You're not doing this with strangers.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>
              <picture>
                <source srcSet="/headshot.webp" type="image/webp" />
                <img src="/headshot.jpg" alt="Joel Polley, RN"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper-light)', boxShadow: '0 6px 16px rgba(44,42,38,0.15)', margin: '0 auto 1rem' }} />
              </picture>
              <h3 className="font-serif text-xl mb-1" style={{ color: 'var(--ink)' }}>Joel Polley, RN</h3>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.12em' }}>The Blood Pressure Guy</p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
                Twenty years in ICU and emergency medicine. The blood pressure protocols here came from watching what didn't work in the hospital — and what did, once people went home.
              </p>
            </div>
            <div className="p-6 rounded-xl text-center" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>
              <picture>
                <source srcSet="/annie.webp" type="image/webp" />
                <img src="/annie.jpg" alt="Annie Chitate, RN"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper-light)', boxShadow: '0 6px 16px rgba(44,42,38,0.15)', margin: '0 auto 1rem' }} />
              </picture>
              <h3 className="font-serif text-xl mb-1" style={{ color: 'var(--ink)' }}>Annie Chitate, RN</h3>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.12em' }}>Hormone-corner co-coach</p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
                Registered nurse, hormone restoration specialist, and Joel's wife. She walked her own restoration — perimenopause, weight, energy, BP — and now guides other women through theirs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT'S INSIDE (no price) ────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            What's inside the 90 days
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-8" style={{ color: 'var(--ink)' }}>
            Real human guidance. Weekly.
          </h2>
          <ul className="space-y-5">
            {[
              { h: 'Weekly live cohort calls with Joel.', p: 'Monday evenings. We work case-by-case in front of the cohort — your numbers, your supplements, your medication taper. You learn from your own protocol and from everyone else\'s.' },
              { h: 'Daily group office hours with Joel.', p: 'WhatsApp thread, Sun-Thu, 9 AM-5 PM ET. Send a photo of a lab, a question, a confusing symptom — same-day answer in front of the cohort so everyone benefits.' },
              { h: 'Hormone session with Annie.', p: 'One scheduled call with Annie inside the 90 days for women whose loudest Pressure is cortisol or hormones. Optional, but most of the women in Cohort 2 will use it.' },
              { h: 'Full deprescribing plan, worked WITH your doctor.', p: 'You bring the script to your prescriber. We adjust based on what they say. We never go around them. Most clients drop one to three medications inside 90 days.' },
              { h: 'Partner inclusion guide.', p: 'Your spouse gets a 30-minute briefing call so they\'re rowing with you, not pulling against you. Protocols stick when the household is aligned.' },
              { h: 'The complete Cohort 2 Kit.', p: 'Every BraveWorks PDF — BP, cortisol, blood sugar, hormones — plus the daily tracker, the doctor scripts, and the recipe library.' },
            ].map((row) => (
              <li key={row.h} className="flex gap-4">
                <CheckCircle2 size={22} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 4 }} />
                <div>
                  <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--ink)' }}>{row.h}</h3>
                  <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>{row.p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── APPLICATION FORM ────────────────────────────────── */}
      <section id="apply" className="py-16" style={{ background: 'var(--sage-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>
            Step 1 of 3 · Application
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-4 text-center" style={{ color: 'var(--ink)' }}>
            Apply for Cohort 2
          </h2>
          <p className="text-base sm:text-lg mb-7 text-center" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            Six honest questions. I read every word. If we're a fit, you'll hear from me within 48 hours with a link to book a 30-minute conversation.
          </p>

          <form onSubmit={submit} className="space-y-5 p-6 sm:p-8 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
            {[
              { id: 'name', label: 'Your first and last name', type: 'text', required: true },
              { id: 'email', label: 'Email', type: 'email', required: true },
              { id: 'phone', label: 'Phone (for the fit call if we move forward)', type: 'tel', required: true },
            ].map((f) => (
              <div key={f.id}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                  {f.label} {f.required && <span style={{ color: 'var(--clay)' }}>·</span>}
                </label>
                <input
                  type={f.type}
                  required={f.required}
                  value={form[f.id]}
                  onChange={set(f.id)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-base"
                  style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>Age range</label>
              <select value={form.ageRange} onChange={set('ageRange')} className="w-full px-3.5 py-2.5 rounded-lg text-base" style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', outline: 'none' }}>
                <option value="">Pick one…</option>
                <option>Under 35</option><option>35-44</option><option>45-54</option><option>55-64</option><option>65-74</option><option>75+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>How many BP medications are you on right now?</label>
              <select value={form.bpMeds} onChange={set('bpMeds')} className="w-full px-3.5 py-2.5 rounded-lg text-base" style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', outline: 'none' }}>
                <option value="">Pick one…</option>
                <option>None — but my numbers are creeping up</option>
                <option>1 medication</option><option>2 medications</option><option>3 medications</option><option>4 or more</option>
                <option>I'm coming off them</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>If we're a fit, what investment range are you ready to commit to your health for the next 90 days?</label>
              <select value={form.investmentRange} onChange={set('investmentRange')} className="w-full px-3.5 py-2.5 rounded-lg text-base" style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', outline: 'none' }}>
                <option value="">Pick one…</option>
                <option>Under $500</option>
                <option>$500-$1,500</option>
                <option>$1,500-$3,000</option>
                <option>$3,000+</option>
                <option>I'd rather discuss on the call</option>
              </select>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>Honesty here helps me know if we're a fit. No price commitment at application.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                Why now? <span style={{ color: 'var(--clay)' }}>·</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.whyNow}
                onChange={set('whyNow')}
                placeholder="What happened recently that made you say 'something has to change'? Two or three sentences is plenty."
                className="w-full px-3.5 py-2.5 rounded-lg text-base"
                style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', outline: 'none', resize: 'vertical', minHeight: 100 }}
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-lg text-sm" style={{ background: '#FEF2EC', border: '1px solid var(--clay)', color: 'var(--clay)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-7 py-3.5 rounded-lg font-semibold text-base flex items-center justify-center gap-2"
              style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer' }}
            >
              {submitting ? <><Loader2 className="animate-spin" size={18} /> Submitting…</> : <>Submit application <Send size={16} /></>}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Joel reads every application personally. Expect to hear back within 48 hours.
            </p>
          </form>
        </div>
      </section>

      {/* ─── Disclaimer footer ───────────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck size={22} color="var(--muted)" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '64ch', margin: '0 auto' }}>
            BraveWorks RN Cohort 2 is a nursing-led group coaching program rooted in twenty years of ICU and emergency medicine. It is education-based, not diagnostic. Your protocol always works alongside your physician — never as a replacement. Never start, stop, or change a prescribed medication without your doctor's supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
