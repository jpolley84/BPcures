// bpquiz.com/777: the $7 "7-7-7 Challenge". Aim for 7 lbs in 7 days for $7,
// Wed Oct 21 to Tue Oct 27, 2026. Ported from Joel's approved HTML draft
// (Downloads/7-in-7-for-7-Challenge-Page-2026-10-19.html) with his 10-19 changes:
// NO live classes and NO Zoom. 14:24 CT rework: the 7 days are the Lemonade Detox
// (Master Cleanse, public/downloads/lemonade-detox-guide.pdf) with on-ramp and off-ramp. Self-guided plan, sent the moment they join,
// plus a private encouragement group. Co-hosted by Joel and Annie.
//
// Checkout: POST /api/create-hosted-checkout { tier: 'seven-challenge' }, same
// fetch/redirect pattern as SprintPage. Webhook: api/_seven-challenge.js.
// Not wrapped in SiteLayout (focused sales page, no nav to leak clicks).
// ZERO em dashes in visible copy. NEWSTART: plants only, no caffeine.
import { useEffect, useState } from 'react';
import { track, getDistinctId } from '../utils/analytics';
import { zonedInstant } from '../utils/tz.js';

const START = zonedInstant('2026-10-21T06:00:00', 'America/Chicago');
const PHOTO = '/777/joel-annie.jpg';

const RAMP_ON = ['ON-RAMP · MON OCT 19 AND TUE OCT 20', 'Get ready on plants', 'Eat plants only: vegetables, fruit, beans, and whole grains. Cut salt and sugar, drink plenty of water, and take a walk. Joining after Tuesday? Do one day of plants and water, then start.'];
const RAMP_OFF = ['OFF-RAMP · WED OCT 28 TO FRI OCT 30', 'Ease back to food', 'Day 1: fresh orange juice mixed half and half with water, plus lemonade. Day 2: add vegetable broth and fruit. Day 3: light plant meals like salads and steamed vegetables. Then the everyday eating plan.'];

const DAYS = [
  ['LEMONADE DAY 1 · WED OCT 21', 'Start strong', 'Make a full pitcher in the morning so it is ready all day. Drink a glass whenever you feel hungry.'],
  ['LEMONADE DAY 2 · THU OCT 22', 'The hardest day', 'Day 2 is often the hardest. Headaches, hunger, and low energy are common. Drink more lemonade and water, and rest.'],
  ['LEMONADE DAY 3 · FRI OCT 23', 'The turn', 'For many people, headaches and hunger start to ease by day 3 or 4. Energy starts coming back.'],
  ['LEMONADE DAY 4 · SAT OCT 24', 'Sabbath rest', 'Still a lemonade day. It is the Sabbath, so rest, and no group posts from Joel today.', true],
  ['LEMONADE DAY 5 · SUN OCT 25', 'Find your rhythm', 'Keep the same routine. Gentle walking only, no hard exercise. Stand up slowly.'],
  ['LEMONADE DAY 6 · MON OCT 26', 'Keep going', 'Share a win in the group. Feeling chilly is common, so dress warm and drink warm lemon water.'],
  ['LEMONADE DAY 7 · TUE OCT 27', 'Weigh in and finish', 'Weigh in at the same time as day 1. Do not jump back to solid food. Tomorrow the off-ramp starts.'],
];

const FAQ = [
  ['Will I really lose 7 pounds?', 'Seven pounds is the target, not a promise. Results vary. Much of the early loss is often water weight. Your result depends on your body, your starting point, and how closely you follow the plan.'],
  ['What exactly do I drink?', 'For each 8 to 10 oz glass: 2 tablespoons fresh lemon juice, 2 tablespoons Grade A Dark maple syrup, a pinch (about 1/10 teaspoon) of cayenne, and 8 to 10 oz water. Drink 6 to 12 glasses a day, plus plain water. Peppermint tea is optional.'],
  ['What about the salt water flush and the laxative tea?', 'Both are optional, for an extra cleanse. Skip the salt water flush if you have high blood pressure, take blood pressure or heart medicine, or have kidney or heart disease. One flush is about 4,600 mg of sodium in one drink.'],
  ['I take medication. Can I join?', 'If you take medication, especially for blood pressure or blood sugar, or you are pregnant, nursing, or have a health condition, talk with your doctor before starting. Keep taking your medicine. Stop and get help if you feel faint, confused, or your heart races.'],
  ['How does it work day to day?', 'The moment you join, you get your full plan by email, plus the link to our private encouragement group. You follow the plan on your own time and check in with the group. No set class times, nothing to log in to.'],
  ['What is the encouragement group?', 'A private group (Facebook or WhatsApp) for people doing the challenge the same week. Post your wins, ask questions, and cheer each other on. The link comes in your confirmation email.'],
  ['What happens on Saturday?', 'Saturday, October 24 is still a lemonade day. It is the Sabbath, so we rest, and Joel does not post in the group that day.'],
  ['Why only $7?', 'Because we want you to try it. Paying a little helps you follow through, and $7 means there is no reason to wait.'],
];

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = Math.max(0, target - now);
  return { d: Math.floor(t / 864e5), h: Math.floor((t % 864e5) / 36e5), m: Math.floor((t % 36e5) / 6e4), s: Math.floor((t % 6e4) / 1e3), done: t === 0 };
}

export default function SevenChallengePage() {
  const cd = useCountdown(START);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'The 7-7-7 Challenge | Joel Polley, RN and Annie Chitate, RN';
    track('seven_page_view');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Inter:wght@400;600;800&display=swap';
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  async function startCheckout() {
    if (busy) return;
    setBusy(true); setError('');
    track('seven_checkout_click');
    try {
      const res = await fetch('/api/create-hosted-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'seven-challenge', distinctId: getDistinctId(), source: 'seven-777-page' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || data.error || 'Could not start checkout');
      window.location.assign(data.url);
    } catch (err) {
      setBusy(false);
      setError(err.message || 'Could not start checkout. Please try again.');
    }
  }

  return (
    <div className="s7">
      <style>{CSS}</style>

      <div className="bar">THE 7-7-7 CHALLENGE STARTS WED, OCT 21 · $7 <a href="#join">SAVE MY SPOT →</a></div>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="kicker">With Joel Polley, RN and Annie Chitate, RN · 7 days · Oct 21 to 27</span>
            <h1>Aim for <em>7 pounds in 7 days</em>, for <em>$7</em>. With two nurses in your corner.</h1>
            <p className="lead">For 7 days we do the Lemonade Detox together: fresh lemon, maple syrup, a pinch of cayenne, and water. You get a 2-day on-ramp to get ready, a 3-day off-ramp to ease back to food, and a private group cheering you on.</p>
            <a className="btn" href="#join">Join for $7</a>
            <div className="sub">One payment. No subscription. Your full plan, sent the moment you join.</div>
          </div>
          <div className="seven">
            <div className="n">7·7·7</div>
            <div className="row">
              <div>7 LBS<br /><small>THE TARGET</small></div>
              <div>7 DAYS<br /><small>OCT 21 TO 27</small></div>
              <div>$7<br /><small>TO JOIN</small></div>
            </div>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="count">
          <h3>{cd.done ? 'THE CHALLENGE HAS STARTED' : 'THE CHALLENGE STARTS IN'}</h3>
          <div className="clock">
            <div><b>{cd.d}</b><span>DAYS</span></div>
            <div><b>{cd.h}</b><span>HOURS</span></div>
            <div><b>{cd.m}</b><span>MINUTES</span></div>
            <div><b>{cd.s}</b><span>SECONDS</span></div>
          </div>
          <div className="sub">Lemonade day 1 is Wednesday, October 21, 2026</div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <h2>How the Lemonade Detox works</h2>
          <div className="why">
            <div>
              <p>For 7 days you drink a simple lemonade instead of solid food. It is the Master Cleanse, the same plan in Joel's Lemonade Detox guide.</p>
              <p>A lot of what the scale shows in the first week isn't fat. It's water. Your result depends on your body, so 7 pounds is the target, not a promise.</p>
              <p>We're both registered nurses, and Joel spent 20 years in the ICU and the ER. We tell you what to expect each day, and when to stop.</p>
            </div>
            <div className="card">
              <h3>Each glass (8 to 10 oz):</h3>
              <ul className="list">
                <li>2 tablespoons fresh lemon juice</li>
                <li>2 tablespoons Grade A Dark maple syrup</li>
                <li>A pinch of cayenne (about 1/10 teaspoon)</li>
                <li>8 to 10 oz water</li>
              </ul>
              <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>Drink 6 to 12 glasses a day, plus plain water. Peppermint tea is optional.</p>
            </div>
          </div>
          <div className="card" style={{ marginTop: 18 }}><b>Optional, for an extra cleanse:</b> a morning salt water flush (2 teaspoons non-iodized sea salt in 1 quart warm water) and a nightly herbal laxative tea. <b>Skip the salt water flush if you have high blood pressure, take blood pressure or heart medicine, or have kidney or heart disease.</b> One flush is about 4,600 mg of sodium in one drink.</div>
          <div className="stats">
            <div className="stat"><b>2</b>registered nurses</div>
            <div className="stat"><b>7</b>lemonade days</div>
            <div className="stat"><b>$7</b>one-time</div>
          </div>
        </div>
      </section>

      <section className="tint">
        <div className="wrap">
          <h2>Your 12 days</h2>
          <p className="center muted">2 days to get ready, 7 lemonade days, 3 days to ease back. Self-guided, with the group cheering you on.</p>
          <div className="days">
            <div className="day ramp"><small>{RAMP_ON[0]}</small><h3>{RAMP_ON[1]}</h3>{RAMP_ON[2]}</div>
          </div>
          <div className="days">
            {DAYS.map(([d, t, b, rest]) => (
              <div key={d} className={rest ? 'day rest' : 'day'}><small>{d}</small><h3>{t}</h3>{b}</div>
            ))}
          </div>
          <div className="days">
            <div className="day ramp"><small>{RAMP_OFF[0]}</small><h3>{RAMP_OFF[1]}</h3>{RAMP_OFF[2]}</div>
          </div>
          <div className="center" style={{ marginTop: 28 }}><a className="btn" href="#join">I'm in for $7</a></div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2>Is this for you?</h2>
          <div className="isnot">
            <div className="card"><h3>This is for you if…</h3><ul className="list">
              <li>You want a clear, short reset with a start and an end</li>
              <li>You're ready to drink lemonade instead of solid food for 7 days</li>
              <li>You want a group doing it with you the same week</li>
              <li>You'd like nurses to tell you what to expect</li>
            </ul></div>
            <div className="card"><h3>This is NOT for you if…</h3><ul className="list no">
              <li>You want a pill or a shake</li>
              <li>You can't rest and take it easy this week</li>
              <li>You want someone to do it for you</li>
            </ul></div>
          </div>
          <div className="card" style={{ marginTop: 18 }}><b>What this is:</b> a 7-day self-guided Lemonade Detox, with an on-ramp, an off-ramp, and a private group for encouragement. <b>What it isn't:</b> medical care, a diet pill, or a promise of a number on the scale.</div>
        </div>
      </section>

      <section className="tint">
        <div className="wrap hosts">
          <img src={PHOTO} alt="Annie Chitate, RN and Joel Polley, RN" width="565" height="800" loading="lazy" />
          <div>
            <h2 style={{ textAlign: 'left' }}>Hi, we're Joel Polley, RN and Annie Chitate, RN.</h2>
            <p><b>Joel</b> worked 20 years as a nurse in the ICU and the ER. He watched too many people pay for salt and sugar with their health. Now he teaches the simple, plant-based habits that help people take back their blood pressure, their blood sugar, and their energy.</p>
            <p><b>Annie</b> is a registered nurse who teaches women how their hormones work, and how food, sleep, and stress move them.</p>
            <p>Seven days, seven dollars, and a group doing it with you.</p>
          </div>
        </div>
      </section>

      <section id="join">
        <div className="wrap">
          <h2>Join the 7-7-7 Challenge</h2>
          <div className="price">
            <div className="muted" style={{ fontWeight: 800 }}>7 DAYS · OCT 21 TO 27, 2026</div>
            <div className="amt">$7</div>
            <div className="muted">one-time payment</div>
            <ul className="list">
              <li>Your full plan, sent the moment you join: the recipe, the on-ramp, and the off-ramp</li>
              <li>Joel's Lemonade Detox guide (PDF)</li>
              <li>The private encouragement group, so you're not doing it alone</li>
              <li>One tip for every day, so you know what to expect</li>
              <li>Created by two registered nurses</li>
            </ul>
            <button type="button" className="btn wide" onClick={startCheckout} disabled={busy}>
              {busy ? 'Opening secure checkout…' : 'Save my spot for $7'}
            </button>
            {error && <div className="err" role="alert">{error}</div>}
            <div className="sub">Secure checkout. If you feel you didn't get your $7 worth, email us and we'll refund it.</div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <h2>Questions</h2>
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap center">
          <a className="btn" href="#join">Start Wednesday for $7</a>
          <p className="fine">This challenge is education, not medical advice, diagnosis, or treatment. Individual results vary. Seven pounds is a goal, and a specific result is not guaranteed. Early weight change is often water weight. If you take medication, especially for blood pressure or blood sugar, or you are pregnant, nursing, or have a health condition, talk with your doctor before starting. Keep taking your medicine. Stop and get help if you feel faint, confused, or your heart races. This site is not part of Facebook or Meta and is not endorsed by them.</p>
        </div>
      </section>

      <footer><div className="wrap">© 2026 BraveWorks RN · bpquiz.com · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div></footer>
    </div>
  );
}

export const CSS = `
.s7{--green:#1f6f4a;--green-d:#14503a;--leaf:#e9f5ee;--gold:#f4b400;--ink:#14231c;--muted:#51625a;--cream:#fbfaf5;--line:#dfe8e2;font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--cream);line-height:1.55;min-height:100vh}
.s7 *{box-sizing:border-box}
.s7 p{margin:0 0 1em}
.s7 h1,.s7 h2,.s7 h3{font-family:Fraunces,Georgia,serif;line-height:1.12;margin:0 0 .5em}
.s7 .wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.s7 .bar{position:sticky;top:0;z-index:9;background:var(--green-d);color:#fff;text-align:center;font-weight:800;font-size:14px;padding:10px 12px;letter-spacing:.3px}
.s7 .bar a{color:var(--gold);text-decoration:none;margin-left:8px}
.s7 .btn{display:inline-block;background:var(--gold);color:#1b1b1b;font-weight:800;font-size:18px;padding:18px 34px;border-radius:999px;text-decoration:none;box-shadow:0 8px 0 #c99200;transition:transform .1s;border:0;cursor:pointer;font-family:inherit}
.s7 .btn:hover{transform:translateY(2px);box-shadow:0 6px 0 #c99200}
.s7 .btn.wide{width:100%}
.s7 .btn:disabled{opacity:.7;cursor:wait}
.s7 .err{margin-top:12px;color:#b3261e;font-weight:600}
.s7 .sub{font-size:13px;color:var(--muted);margin-top:12px}
.s7 .hero{padding:56px 0 40px;background:radial-gradient(1200px 500px at 80% 0,#d6efe1 0,transparent 60%)}
.s7 .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center}
.s7 .kicker{display:inline-block;background:var(--leaf);color:var(--green);font-weight:800;font-size:13px;padding:6px 14px;border-radius:999px;margin-bottom:16px}
.s7 .hero h1{font-size:clamp(36px,5.4vw,60px)}.s7 .hero h1 em{font-style:normal;color:var(--green)}
.s7 .lead{font-size:19px;color:var(--muted);max-width:560px}
.s7 .seven{background:var(--green);color:#fff;border-radius:24px;padding:28px;text-align:center}
.s7 .seven .n{font-family:Fraunces,Georgia,serif;font-size:96px;font-weight:800;line-height:1;color:var(--gold)}
.s7 .seven div{font-weight:800;letter-spacing:1px}
.s7 .seven .row{display:flex;justify-content:space-around;margin-top:14px}
.s7 .count{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;margin:-12px auto 0;max-width:640px;text-align:center}
.s7 .count h3{font-family:Inter,system-ui,sans-serif;font-size:13px;letter-spacing:1px;color:var(--muted);margin-bottom:8px}
.s7 .clock{display:flex;gap:12px;justify-content:center}.s7 .clock div{min-width:64px}.s7 .clock b{display:block;font-family:Fraunces,Georgia,serif;font-size:34px;color:var(--green)}
.s7 .clock span{font-size:12px;color:var(--muted)}
.s7 section{padding:64px 0}.s7 section.tint{background:var(--leaf)}
.s7 h2{font-size:clamp(28px,3.6vw,42px);text-align:center}
.s7 .center{text-align:center}.s7 .muted{color:var(--muted)}
.s7 .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}
.s7 .stat{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;text-align:center}
.s7 .stat b{display:block;font-family:Fraunces,Georgia,serif;font-size:40px;color:var(--green)}
.s7 .why{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center}
.s7 .card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px}
.s7 .days{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:28px}
.s7 .day{background:#fff;border:1px solid var(--line);border-left:6px solid var(--green);border-radius:16px;padding:18px}
.s7 .day small{font-weight:800;color:var(--green);letter-spacing:.5px}.s7 .day h3{font-size:22px;margin:6px 0}
.s7 .day.ramp{border-left-color:#7a8f84;background:#f4f7f5}
.s7 .days+.days{margin-top:14px}
.s7 .day.rest{border-left-color:var(--gold);background:#fffbea}
.s7 .list{list-style:none;padding:0;margin:0}.s7 .list li{padding:8px 0 8px 32px;position:relative}
.s7 .list li:before{content:"✓";position:absolute;left:0;top:6px;width:22px;height:22px;border-radius:50%;background:var(--leaf);color:var(--green);font-weight:800;text-align:center;font-size:14px;line-height:22px}
.s7 .no li:before{content:"✕";background:#fdeceb;color:#b3261e}
.s7 .isnot{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.s7 .price{max-width:520px;margin:28px auto 0;background:#fff;border:3px solid var(--green);border-radius:26px;padding:34px;text-align:center;box-shadow:0 20px 60px rgba(20,80,58,.12)}
.s7 .price .amt{font-family:Fraunces,Georgia,serif;font-size:88px;font-weight:800;color:var(--green);line-height:1}
.s7 .price ul{text-align:left;margin:22px 0}
.s7 .hosts{display:grid;grid-template-columns:300px 1fr;gap:32px;align-items:center}
.s7 .hosts img{width:100%;height:auto;border-radius:22px;box-shadow:0 16px 40px rgba(20,80,58,.15);display:block}
.s7 details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 20px;margin:10px 0}
.s7 summary{font-weight:800;cursor:pointer}
.s7 .fine{font-size:12px;color:var(--muted);line-height:1.6;max-width:760px;margin:28px auto 0}
.s7 footer{background:var(--green-d);color:#d9eadf;padding:40px 0;text-align:center}
.s7 footer a{color:#d9eadf}
@media (max-width:760px){.s7 .hero-grid,.s7 .why,.s7 .isnot,.s7 .hosts{grid-template-columns:1fr}.s7 .stats{grid-template-columns:1fr}.s7 .hosts img{max-width:320px;margin:0 auto}.s7 .seven .n{font-size:72px}.s7 .clock div{min-width:54px}}
`;
