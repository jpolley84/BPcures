// bpquiz.com/777/thanks: after a $7 7-7-7 Challenge checkout
// (success_url from api/create-hosted-checkout.js tier 'seven-challenge').
// Group link from VITE_SEVEN_GROUP_URL (set in Vercel); without it the page
// says the link is coming in the confirmation email. ZERO em dashes.
import { useEffect } from 'react';
import { track } from '../utils/analytics';
import { CSS } from './SevenChallengePage';

const GROUP_URL = (import.meta.env.VITE_SEVEN_GROUP_URL || '').trim();

export default function SevenChallengeThanksPage() {
  useEffect(() => {
    document.title = "You're in | The 7-7-7 Challenge";
    track('seven_thanks_view');
  }, []);

  return (
    <div className="s7">
      <style>{CSS}</style>
      <header className="hero">
        <div className="wrap" style={{ maxWidth: 760, textAlign: 'center' }}>
          <span className="kicker">Payment received · 7-7-7 Challenge</span>
          <h1>You're in. Lemonade day 1 is Wednesday, October 21.</h1>
          <p className="lead" style={{ margin: '0 auto' }}>Thank you for joining Annie and Joel for 7 days. Your confirmation email with the recipe and your full plan is on its way. Check your inbox, and your spam or promotions folder if you don't see it.</p>
        </div>
      </header>

      <section style={{ paddingTop: 24 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="price" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: 30 }}>Step 1: Join the encouragement group</h2>
            {GROUP_URL ? (
              <>
                <p className="muted">This is where you post your wins, ask questions, and cheer each other on.</p>
                <a className="btn wide" href={GROUP_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('seven_group_click')}>Join the group</a>
              </>
            ) : (
              <p className="muted">Your group link is coming in your email. Watch for a message from Joel Polley, RN at joel@bpquiz.com.</p>
            )}
          </div>

          <div className="card" style={{ marginTop: 22 }}>
            <h3>What happens next</h3>
            <ol style={{ paddingLeft: 22, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>On-ramp, Monday and Tuesday (Oct 19 and 20): plants only, less salt and sugar, plenty of water, and a walk. Joining after Tuesday? Do one day of plants and water first.</li>
              <li style={{ marginBottom: 8 }}>Shop for fresh lemons, Grade A Dark maple syrup, and cayenne. <a href="/downloads/lemonade-detox-guide.pdf" target="_blank" rel="noopener noreferrer">Download the Lemonade Detox guide</a>.</li>
              <li style={{ marginBottom: 8 }}>Lemonade days, Wednesday Oct 21 to Tuesday Oct 27: 6 to 12 glasses a day, plus plain water. Saturday is the Sabbath, still a lemonade day.</li>
              <li>Off-ramp, Wednesday Oct 28 to Friday Oct 30: ease back to food slowly. Do not skip it.</li>
            </ol>
          </div>

          <p className="fine">Seven pounds is the target, not a promise. Results vary. Early weight change is often water weight. If you take medication, especially for blood pressure or blood sugar, or you are pregnant, nursing, or have a health condition, talk with your doctor before starting. Keep taking your medicine. Stop and get help if you feel faint, confused, or your heart races. This challenge is education, not medical advice. If you feel you didn't get your $7 worth, reply to your confirmation email and we'll refund it.</p>
        </div>
      </section>

      <footer><div className="wrap">© 2026 BraveWorks RN · bpquiz.com</div></footer>
    </div>
  );
}
