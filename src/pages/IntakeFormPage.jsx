import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

/* ============================================================
   IntakeFormPage — async voice intake
   ----------------------------------------------------------------
   Route: /intake/:clientSlug?token=<unique>
   Standalone (no SiteLayout). Mobile-first. Saves progress to
   the server every 2s after a change, persists across sessions
   until the client clicks Submit.
   ============================================================ */

const SECTIONS = [
  {
    id: 'identity',
    title: 'Identity',
    intro:
      "Get the basics on the page. Most of these are short. Spelling matters here — every email, every page, every byline starts from what you write below.",
    questions: [
      {
        id: 'q1_full_name',
        label: 'Full name + how you want to be addressed',
        helper:
          "Example: Karen Bush, RN — but call me Karen. Or: Dr. Sarah Park — Dr. Park in writing, Sarah on calls. Get it right on the first email.",
        type: 'text',
        rows: 2,
        required: true,
      },
      {
        id: 'q2_designation',
        label: 'Professional designation + credentials you want visible',
        helper:
          "RN, NP, MD, IIN, NTA, FDN-P, naturopathic, PhD, none — list the exact letters you want after your name in print. If you don't want any, write 'none'.",
        type: 'text',
        rows: 2,
        required: false,
      },
      {
        id: 'q3_years_in_practice',
        label: 'Years in practice — total + in this niche specifically',
        helper:
          "Example: 22 years total, 6 in functional/naturopathic. The credibility marker (Joel uses 'twenty years in the ICU') comes from here.",
        type: 'text',
        rows: 2,
        required: false,
      },
      {
        id: 'q4_location',
        label: 'Where do you currently practice from? Geographic + virtual?',
        helper:
          "City, state, country. In-person, virtual-only, or hybrid. Influences regulatory framing and who shows up in your case-study material.",
        type: 'text',
        rows: 2,
        required: false,
      },
    ],
  },
  {
    id: 'origin',
    title: 'Origin Story',
    intro:
      "This is the story that lives in your hero section, your About page, and the opening line of half your emails. Be specific. The boring details (the room, the patient, the year) are what make it sound like you.",
    questions: [
      {
        id: 'q5_the_moment',
        label: 'Walk me through the moment you decided this is what you wanted to do.',
        helper:
          "I'm listening for the specific patient, the specific event, the specific frustration. Joel's version: watching the same blood-pressure patient come back for the third time. Yours doesn't have to be dramatic — it has to be true.",
        type: 'textarea',
        rows: 7,
        required: true,
        minWords: 60,
      },
      {
        id: 'q6_first_year',
        label: 'What did the first year look like?',
        helper:
          "Where you struggled. What you tried that didn't work. The pivot point. Humility markers go here — they make the success markers later believable.",
        type: 'textarea',
        rows: 6,
        required: false,
        minWords: 40,
      },
      {
        id: 'q7_elevator_pitch',
        label: "What's the story you tell when someone asks 'what do you do?'",
        helper:
          "Give it to me the way you'd say it at a dinner party — not the cleaned-up website version. This becomes your elevator pitch in your actual voice.",
        type: 'textarea',
        rows: 5,
        required: false,
        minWords: 30,
      },
    ],
  },
  {
    id: 'niche',
    title: 'Niche + Audience',
    intro:
      "Who is this for. Specific beats broad every time. 'Women 30 to 65' is too wide a net to catch anyone. 'Postpartum nurses still nursing in their fifties' is a person.",
    questions: [
      {
        id: 'q8_ideal_client',
        label: 'Who is your ideal client? Describe one specifically.',
        helper:
          "Name (or first initial). Age. Job. Life stage. The specific health problem they walked in with. What they tried before they found you.",
        type: 'textarea',
        rows: 6,
        required: true,
        minWords: 50,
      },
      {
        id: 'q9_sick_of_hearing',
        label: "What's the one thing your ideal client is sick of hearing from other practitioners?",
        helper:
          "Their answer becomes a 'we don't do X' line in your copy. Examples Joel uses: 'just lose weight', 'cut out salt', 'try yoga'.",
        type: 'textarea',
        rows: 4,
        required: false,
        minWords: 20,
      },
      {
        id: 'q10_90_day_result',
        label: "What's the result your client gets when they work with you for 90 days?",
        helper:
          "Specifics. 'Better sleep' is too vague. 'Wakes up without an alarm by week 6' is a usable claim. Whatever you write here, you'll see in headlines for the next year.",
        type: 'textarea',
        rows: 5,
        required: false,
        minWords: 30,
      },
      {
        id: 'q11_surprising_question',
        label: "What's the question your clients ask most often that surprises you?",
        helper:
          "Whatever answer you give here is your next quarter of TikTok and email content. The question that surprises you is the question your audience has been carrying without permission to ask.",
        type: 'textarea',
        rows: 4,
        required: false,
        minWords: 20,
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice + Phrasing',
    intro:
      "This is the section that decides whether the system sounds like you or sounds like a generic health brand. Don't polish the answers. Write the way you talk.",
    questions: [
      {
        id: 'q12_direct_speech',
        label: "Write 3 to 4 sentences exactly the way you'd talk to a client when you're being honest with them.",
        helper:
          "Don't write what you think a coach should say. Write what you actually say. Sentence fragments, regional turns of phrase, slightly-too-long sentences — leave them in. This is the cadence the system trains on.",
        type: 'textarea',
        rows: 7,
        required: true,
        minWords: 50,
      },
      {
        id: 'q13_signature_phrase',
        label: "What's a phrase you find yourself repeating with clients?",
        helper:
          "Joel's: 'you don't have a knowledge problem, you have a delivery problem.' Yours might be one line, might be three. Whatever you say so often your spouse rolls their eyes at it — that's the one.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
      {
        id: 'q14_banned_phrase',
        label: "What's a phrase you HATE that other practitioners in your space use?",
        helper:
          "Goes straight into the banned-phrase list. Anything the installed system writes that contains your banned phrases gets auto-flagged. Be petty here. The pettier the better.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
      {
        id: 'q15_humor',
        label: 'How comfortable are you with humor in your professional voice?',
        helper:
          "Some practitioners want warmth + occasional dry humor. Some want pure clinical. Some are full Bo Burnham. Tell me where you sit.",
        type: 'textarea',
        rows: 3,
        required: false,
      },
      {
        id: 'q16_vulnerability',
        label: 'How comfortable are you with vulnerability in your content?',
        helper:
          "Determines whether origin-story content hits the personal hard or stays at 'I learned X from working with Y patients.' Both work — but I have to know which is yours.",
        type: 'textarea',
        rows: 3,
        required: false,
      },
    ],
  },
  {
    id: 'faith',
    title: 'Faith + Values',
    intro:
      "Where your values live in the public-facing version of your work. There's no wrong answer — there's just what's true for you.",
    questions: [
      {
        id: 'q17_faith_posture',
        label: 'Does faith play a role in how you frame your work? If yes — how visible do you want it?',
        helper:
          "Pick one and explain in a sentence: not at all / values-aligned but not named / faith-leaning (occasional reference) / faith-central (explicit anchor of brand). Joel sits at faith-leaning.",
        type: 'select',
        options: [
          { value: 'not_at_all', label: 'Not at all' },
          { value: 'values_aligned', label: 'Values-aligned but not named' },
          { value: 'faith_leaning', label: 'Faith-leaning (occasional reference)' },
          { value: 'faith_central', label: 'Faith-central (explicit anchor of brand)' },
        ],
        required: false,
      },
      {
        id: 'q17b_faith_notes',
        label: 'Anything you want to add about how faith shows up in your work?',
        helper:
          "Optional. If you picked anything other than 'not at all' above, a sentence or two about how it shows up helps the system get the tone right.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
      {
        id: 'q18_off_limits',
        label: 'Are there topics you DO NOT want your installed system to touch?',
        helper:
          "Politics, vaccines, specific dietary frameworks, abortion, gender, race — name them. These become hard exclusions. The system will refuse to publish content that touches them.",
        type: 'textarea',
        rows: 5,
        required: false,
      },
      {
        id: 'q19_healing_approach',
        label: 'How would you describe your healing approach?',
        helper:
          "Pick all that apply, then tell me which is the lead descriptor. Examples: functional, naturopathic, integrative, holistic, faith-based, clinical, spiritual, conventional.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
    ],
  },
  {
    id: 'assets',
    title: 'Existing Assets',
    intro:
      "What you already have. Don't apologize for what's missing — every client starts somewhere. I just need an honest inventory so I don't rebuild things you already own.",
    questions: [
      {
        id: 'q20_voice_canon',
        label: 'Do you have existing content I should treat as voice canon?',
        helper:
          "Paste links to: best podcast episode, most-shared blog post, favorite IG caption, the email that got the most replies. These get marked as voice-training source material.",
        type: 'textarea',
        rows: 5,
        required: false,
      },
      {
        id: 'q21_email_list',
        label: 'Do you have an existing email list? Size? Last broadcast date?',
        helper:
          "Mailchimp, ConvertKit, Beehiiv, Substack, none — tell me what you're on and how big the list is. Determines whether we migrate, start fresh, or layer on top.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
      {
        id: 'q22_existing_offers',
        label: 'Existing offers — pricing + how they convert',
        helper:
          "Low-ticket entry, mid-tier, high-ticket. What you charge. How often someone buys. Where the funnel leaks. Don't sanitize the numbers — they tell me where to focus.",
        type: 'textarea',
        rows: 5,
        required: false,
      },
      {
        id: 'q23_tech_stack',
        label: 'Existing tech stack — what stays, what gets retired?',
        helper:
          "Squarespace, Shopify, Kajabi, Teachable, custom WordPress, none. Some of you have a site you emotionally don't want to kill. That's fine. Tell me and I work around it.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
      {
        id: 'q24_what_failed',
        label: "Anything you've tried that DIDN'T work, and why?",
        helper:
          "Saves us both from re-recommending burned bridges. The course that flopped. The launch that fell flat. The platform that ate three months and gave you nothing back.",
        type: 'textarea',
        rows: 5,
        required: false,
      },
    ],
  },
  {
    id: 'future',
    title: 'Future Self',
    intro:
      "Twelve months out. The version of your practice that's working. Be specific — the system gets built FOR this version, not the current one.",
    questions: [
      {
        id: 'q25_tuesday_morning',
        label: '12 months from now, the version of your practice that\'s working — describe a Tuesday morning in detail.',
        helper:
          "What time you wake up. What you do first. What you eat. What you write. Who you talk to. How much money came in this week. The specifics become the language of your hero section.",
        type: 'textarea',
        rows: 8,
        required: true,
        minWords: 80,
      },
      {
        id: 'q26_10k_client',
        label: 'Who is the version of your client at $10K per month? What does she charge? What does she turn away?',
        helper:
          "The system gets built for the future client, not the current one. If you write 'I don't know yet' here, write a guess. Specificity is more useful than accuracy.",
        type: 'textarea',
        rows: 6,
        required: false,
        minWords: 40,
      },
      {
        id: 'q27_headline',
        label: 'One year from now, what\'s the headline you want to read about your business?',
        helper:
          "Imagine a magazine profile, a podcast intro, a friend describing you to a stranger. The headline is the brand promise in your own voice — written by someone who already trusts you.",
        type: 'textarea',
        rows: 4,
        required: false,
        minWords: 25,
      },
      {
        id: 'q28_edge_of_expansion',
        label: "What's the version of your work that scares you a little to commit to publicly?",
        helper:
          "The thing you almost-but-not-quite own yet. The book you haven't admitted you want to write. The course you've rehearsed in your head but not on paper. This is the edge the system grows you into.",
        type: 'textarea',
        rows: 5,
        required: false,
        minWords: 25,
      },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics',
    intro:
      "Final stretch. Plumbing details so the install can hook into the rails you already have.",
    questions: [
      {
        id: 'q29_calendly',
        label: 'Calendly URL we should embed for sales calls',
        helper:
          "Your link, not Joel's. If you don't have one yet, write 'need help setting up' and Joel will route you through the install.",
        type: 'text',
        rows: 2,
        required: false,
      },
      {
        id: 'q30_stripe',
        label: 'Stripe account status — do you have one? Need help setting up?',
        helper:
          "Active and live, in onboarding, never set up. Stripe takes 24-48 hours to verify, so the earlier we know the better.",
        type: 'textarea',
        rows: 3,
        required: false,
      },
      {
        id: 'q31_domain',
        label: 'Domain ownership status — do you own it? Where\'s it registered?',
        helper:
          "GoDaddy, Namecheap, Squarespace, Google Domains, none. If you own it, who manages the DNS? If you don't, what name do you want to grab?",
        type: 'textarea',
        rows: 3,
        required: false,
      },
      {
        id: 'q32_email_forwarding',
        label: 'Email forwarding preferences — where do incoming reply emails route?',
        helper:
          "Your Gmail, your Outlook, an existing assistant inbox, a help-desk address. Wherever 'reply to this email' lands, that's the inbox we wire to.",
        type: 'textarea',
        rows: 3,
        required: false,
      },
      {
        id: 'q33_async_channel',
        label: 'Your preferred async channel for the install',
        helper:
          "Loom, Slack, email, text. How do you like to give feedback when you're moving fast? Joel matches your channel — he doesn't fight your preferences.",
        type: 'textarea',
        rows: 3,
        required: false,
      },
      {
        id: 'q34_audio_links',
        label: 'Optional: paste links to any voice-training audio (Loom, Drive, Dropbox)',
        helper:
          "If you'd rather record any of these answers as audio, paste a Drive, Dropbox, or Loom link to the recording here and reference which question it covers. Audio uploads will land in your bundle in v2 — for now, links.",
        type: 'textarea',
        rows: 4,
        required: false,
      },
    ],
  },
];

const REQUIRED_QUESTION_IDS = SECTIONS.flatMap((s) =>
  s.questions.filter((q) => q.required).map((q) => q.id)
);

const TOTAL_SECTIONS = SECTIONS.length;

const cream = 'var(--cream)';
const ink = 'var(--ink)';
const inkSoft = 'var(--ink-soft)';
const muted = 'var(--muted)';
const line = 'var(--line)';
const sage = 'var(--sage)';
const sageDeep = 'var(--sage-deep)';
const sageSoft = 'var(--sage-soft)';
const clay = 'var(--clay)';
const paper = 'var(--paper)';
const paperWarm = 'var(--paper-warm)';

function countWords(s) {
  if (!s) return 0;
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

function timeAgo(ts) {
  if (!ts) return '';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function IntakeFormPage() {
  const { clientSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [authState, setAuthState] = useState('checking'); // checking, valid, invalid, used
  const [authMessage, setAuthMessage] = useState('');
  const [clientName, setClientName] = useState('');

  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const saveTimer = useRef(null);
  const dirtyRef = useRef(false);

  // ── Auth + load progress on mount ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!clientSlug || !token) {
        setAuthState('invalid');
        setAuthMessage('Missing intake link parameters.');
        return;
      }
      try {
        const r = await fetch(
          `/api/intake-validate-token?slug=${encodeURIComponent(clientSlug)}&token=${encodeURIComponent(token)}`
        );
        if (cancelled) return;
        if (r.status === 410) {
          setAuthState('used');
          setAuthMessage('This intake has already been submitted. If you need to make a change, contact joel@bpquiz.com.');
          return;
        }
        if (!r.ok) {
          setAuthState('invalid');
          setAuthMessage('This link has expired or been revoked. Contact joel@bpquiz.com for a fresh one.');
          return;
        }
        const data = await r.json().catch(() => ({}));
        if (data.clientName) setClientName(data.clientName);
        setAuthState('valid');

        // Try to load existing progress
        try {
          const lr = await fetch(
            `/api/intake-load?slug=${encodeURIComponent(clientSlug)}&token=${encodeURIComponent(token)}`
          );
          if (lr.ok) {
            const ld = await lr.json().catch(() => ({}));
            if (ld && ld.answers && typeof ld.answers === 'object') {
              setAnswers(ld.answers);
            }
            if (typeof ld.sectionIndex === 'number' && ld.sectionIndex >= 0 && ld.sectionIndex < TOTAL_SECTIONS) {
              setSectionIndex(ld.sectionIndex);
            }
            if (ld.lastSaved) setLastSaved(ld.lastSaved);
          }
        } catch {
          // No progress yet — fine
        }
      } catch {
        if (cancelled) return;
        setAuthState('invalid');
        setAuthMessage('Could not reach the server. Check your connection and reload the page.');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [clientSlug, token]);

  // ── Re-render the "saved 12s ago" indicator every 10s ─────
  useEffect(() => {
    const id = setInterval(() => setSavedTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  // ── Debounced save on any change ───────────────────────────
  function scheduleSave(nextAnswers, nextSectionIndex) {
    if (authState !== 'valid' || submitted) return;
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(nextAnswers, nextSectionIndex);
    }, 2000);
  }

  async function saveProgress(nextAnswers = answers, nextSectionIndex = sectionIndex) {
    if (authState !== 'valid' || submitted) return;
    setSaving(true);
    try {
      await fetch(
        `/api/intake-save?slug=${encodeURIComponent(clientSlug)}&token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: nextAnswers,
            sectionIndex: nextSectionIndex,
            lastSaved: Date.now(),
          }),
        }
      );
      setLastSaved(Date.now());
      dirtyRef.current = false;
    } catch {
      // Silent fail — next debounce will try again
    } finally {
      setSaving(false);
    }
  }

  function setAnswer(qid, value) {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: value };
      scheduleSave(next, sectionIndex);
      return next;
    });
  }

  async function saveAndStay() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveProgress(answers, sectionIndex);
  }

  async function saveAndAdvance() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const next = Math.min(sectionIndex + 1, TOTAL_SECTIONS - 1);
    await saveProgress(answers, next);
    setSectionIndex(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function goBack() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const prev = Math.max(sectionIndex - 1, 0);
    await saveProgress(answers, prev);
    setSectionIndex(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function goToReview() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveProgress(answers, sectionIndex);
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitError('');
    // Client-side required check — just for the load-bearing ones
    const missing = REQUIRED_QUESTION_IDS.filter((id) => !String(answers[id] || '').trim());
    if (missing.length > 0) {
      setSubmitError(
        `A few load-bearing answers are still blank. Go back and fill in: ${missing.join(', ')}.`
      );
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(
        `/api/intake-submit?slug=${encodeURIComponent(clientSlug)}&token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, sectionIndex }),
        }
      );
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setSubmitError(data.error || 'Submit failed. Try again, or email joel@bpquiz.com.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Could not reach the server. Try again in a minute.');
      setSubmitting(false);
    }
  }

  // ── Render gates ───────────────────────────────────────────
  if (authState === 'checking') {
    return <FullScreenMessage title="Loading your intake..." sub="One second." />;
  }
  if (authState === 'used') {
    return <FullScreenMessage title="Already submitted" sub={authMessage} />;
  }
  if (authState === 'invalid') {
    return <FullScreenMessage title="Link expired" sub={authMessage} />;
  }
  if (submitted) {
    return (
      <FullScreenMessage
        title="Thank you."
        sub="Joel will review your intake and have your voice profile drafted within 48 hours. You'll hear from him directly at the email he has on file."
        accent
      />
    );
  }

  const section = SECTIONS[sectionIndex];
  const progressPct = ((sectionIndex + 1) / TOTAL_SECTIONS) * 100;
  const lastSavedLabel =
    saving ? 'saving...' : lastSaved ? `saved ${timeAgo(lastSaved)}` : 'unsaved';

  return (
    <div style={{ background: paper, minHeight: '100vh', color: ink }}>
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(247,243,236,0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${line}`,
        }}
      >
        <div
          className="shell-tight"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: sageDeep,
                whiteSpace: 'nowrap',
              }}
            >
              BraveWorks RN
            </span>
            <span style={{ color: line }}>·</span>
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: muted }}>
              Voice Intake
            </span>
          </div>
          <SavedIndicator label={lastSavedLabel} active={saving} _tick={savedTick} />
        </div>
        <div style={{ height: 3, background: paperWarm }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: clay,
              transition: 'width 0.4s var(--ease-out, cubic-bezier(0.22,1,0.36,1))',
            }}
          />
        </div>
      </header>

      {reviewing ? (
        <ReviewPane
          answers={answers}
          onEdit={(idx) => {
            setReviewing(false);
            setSectionIndex(idx);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
          clientName={clientName}
        />
      ) : (
        <main className="shell-tight" style={{ padding: '2rem 1rem 4rem', maxWidth: 760 }}>
          {sectionIndex === 0 && Object.keys(answers).length === 0 && (
            <PrelaunchHeader clientName={clientName} />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <SectionHeader index={sectionIndex} total={TOTAL_SECTIONS} title={section.title} intro={section.intro} />
              <div style={{ display: 'grid', gap: '2rem', marginTop: '1.5rem' }}>
                {section.questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    q={q}
                    value={answers[q.id] || ''}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${line}`,
              paddingTop: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {sectionIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.7rem 1rem',
                    background: 'transparent',
                    color: inkSoft,
                    border: `1px solid ${line}`,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={saveAndStay}
                style={{
                  padding: '0.7rem 1rem',
                  background: 'transparent',
                  color: sage,
                  border: `1px solid ${sageSoft}`,
                  borderRadius: 8,
                  fontSize: '0.9rem',
                }}
              >
                Save & continue later
              </button>
              {sectionIndex < TOTAL_SECTIONS - 1 ? (
                <button
                  type="button"
                  onClick={saveAndAdvance}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.7rem 1.1rem',
                    background: sageDeep,
                    color: cream,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  Save & next section <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToReview}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.7rem 1.1rem',
                    background: clay,
                    color: cream,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  Review & submit <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          <SectionDots
            count={TOTAL_SECTIONS}
            active={sectionIndex}
            onJump={async (i) => {
              if (saveTimer.current) clearTimeout(saveTimer.current);
              await saveProgress(answers, i);
              setSectionIndex(i);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      )}
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function FullScreenMessage({ title, sub, accent }) {
  return (
    <div
      style={{
        background: paper,
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 400,
            fontSize: 'var(--step-3)',
            margin: '0 0 1rem',
            color: accent ? clay : sageDeep,
            fontVariationSettings: '"SOFT" 60, "opsz" 96',
          }}
        >
          {title}
        </h1>
        <p style={{ color: inkSoft, lineHeight: 1.6, margin: 0 }}>{sub}</p>
      </div>
    </div>
  );
}

function PrelaunchHeader({ clientName }) {
  const greeting = clientName ? `${clientName}, ` : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: '2rem' }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: clay,
          fontWeight: 600,
          marginBottom: '0.65rem',
        }}
      >
        Practice Launcher · Voice Intake
      </div>
      <h1
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 400,
          fontSize: 'var(--step-4)',
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          margin: '0 0 1rem',
          fontVariationSettings: '"SOFT" 50, "opsz" 120',
        }}
      >
        {greeting}let&rsquo;s capture your voice.
      </h1>
      <p
        style={{
          fontSize: 'var(--step-1)',
          lineHeight: 1.55,
          color: inkSoft,
          maxWidth: '56ch',
          margin: '0 0 1.25rem',
        }}
      >
        Thirty-three questions across eight short sections. Most folks finish in 60-90 minutes spread over 2-3 sittings.
        Your progress saves automatically &mdash; close the tab whenever you need to. Come back to the same link.
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          lineHeight: 1.55,
          color: muted,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        The more specific you are, the more your installed system will sound like you.
      </p>
    </motion.div>
  );
}

function SectionHeader({ index, total, title, intro }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: muted,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: '0.6rem',
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <h2
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 400,
          fontSize: 'var(--step-3)',
          lineHeight: 1.1,
          margin: '0 0 0.85rem',
          color: sage,
          fontVariationSettings: '"SOFT" 60, "opsz" 96',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: inkSoft, margin: 0, maxWidth: '60ch' }}>{intro}</p>
    </div>
  );
}

function QuestionField({ q, value, onChange }) {
  const wc = countWords(value);
  const showWordCount = q.type === 'textarea';
  const minWords = q.minWords || 0;
  const meetsMin = !minWords || wc >= minWords;
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontFamily: 'Fraunces, serif',
          fontWeight: 500,
          fontSize: 'var(--step-1)',
          lineHeight: 1.3,
          color: ink,
          marginBottom: '0.45rem',
          fontVariationSettings: '"SOFT" 60, "opsz" 48',
        }}
      >
        {q.label}
        {q.required && (
          <span
            style={{
              marginLeft: '0.4rem',
              fontSize: '0.7rem',
              color: clay,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            required
          </span>
        )}
      </label>
      {q.helper && (
        <p
          style={{
            fontSize: '0.86rem',
            lineHeight: 1.55,
            color: muted,
            margin: '0 0 0.7rem',
          }}
        >
          {q.helper}
        </p>
      )}
      {q.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyle({ height: 'auto' })}
        >
          <option value="">Pick one</option>
          {q.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : q.type === 'text' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyle({})}
        />
      ) : (
        <textarea
          rows={q.rows || 5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyle({ minHeight: (q.rows || 5) * 22 + 24 })}
        />
      )}
      {showWordCount && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.4rem',
            fontSize: '0.78rem',
            color: meetsMin ? muted : clay,
          }}
        >
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {wc} word{wc === 1 ? '' : 's'}
            {minWords ? ` · suggested minimum ${minWords}` : ''}
          </span>
          {minWords && !meetsMin && wc > 0 && (
            <span style={{ fontStyle: 'italic' }}>
              keep going &mdash; specifics here pay off later
            </span>
          )}
          {minWords && meetsMin && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: sage }}>
              <Check size={12} /> good depth
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function fieldStyle({ minHeight, height }) {
  return {
    width: '100%',
    padding: '0.7rem 0.85rem',
    background: cream,
    color: ink,
    border: `1px solid ${line}`,
    borderRadius: 8,
    fontSize: '0.95rem',
    lineHeight: 1.55,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    resize: 'vertical',
    outline: 'none',
    minHeight,
    height,
  };
}

function SavedIndicator({ label, active }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.78rem',
        color: muted,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? clay : sage,
          animation: active ? 'savedPulse 1.2s ease-in-out infinite' : 'none',
        }}
      />
      {label}
      <style>
        {`@keyframes savedPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}
      </style>
    </div>
  );
}

function SectionDots({ count, active, onJump }) {
  return (
    <div
      style={{
        marginTop: '2.5rem',
        display: 'flex',
        gap: '0.4rem',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          type="button"
          key={i}
          onClick={() => onJump(i)}
          aria-label={`Jump to section ${i + 1}`}
          style={{
            width: i === active ? 26 : 10,
            height: 10,
            borderRadius: 999,
            background: i === active ? clay : i < active ? sageSoft : line,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s var(--ease-out, cubic-bezier(0.22,1,0.36,1))',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

function ReviewPane({ answers, onEdit, onSubmit, submitting, submitError, clientName }) {
  return (
    <main className="shell-tight" style={{ padding: '2rem 1rem 4rem', maxWidth: 820 }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: clay,
            fontWeight: 600,
            marginBottom: '0.65rem',
          }}
        >
          Final review
        </div>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 400,
            fontSize: 'var(--step-4)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            margin: '0 0 0.75rem',
            fontVariationSettings: '"SOFT" 50, "opsz" 120',
          }}
        >
          Here&rsquo;s what you wrote{clientName ? `, ${clientName}` : ''}.
        </h1>
        <p style={{ fontSize: 'var(--step-1)', color: inkSoft, lineHeight: 1.55, margin: '0 0 2rem' }}>
          Skim it. Anything you want to change, click the section title to jump back. When it reads true, hit submit.
        </p>

        {SECTIONS.map((section, idx) => (
          <div
            key={section.id}
            style={{
              border: `1px solid ${line}`,
              borderRadius: 12,
              padding: '1.25rem 1.4rem',
              marginBottom: '1rem',
              background: cream,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 400,
                  fontSize: 'var(--step-2)',
                  margin: 0,
                  color: sage,
                  fontVariationSettings: '"SOFT" 60, "opsz" 72',
                }}
              >
                {String(idx + 1).padStart(2, '0')} · {section.title}
              </h2>
              <button
                type="button"
                onClick={() => onEdit(idx)}
                style={{
                  fontSize: '0.8rem',
                  color: clay,
                  border: `1px solid ${clay}`,
                  background: 'transparent',
                  padding: '0.3rem 0.7rem',
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                Edit section
              </button>
            </div>
            <dl style={{ margin: 0, display: 'grid', gap: '0.85rem' }}>
              {section.questions.map((q) => {
                const v = answers[q.id];
                const display = q.type === 'select'
                  ? (q.options.find((o) => o.value === v)?.label || (v ? v : '—'))
                  : (v && String(v).trim() ? String(v) : '—');
                return (
                  <div key={q.id}>
                    <dt
                      style={{
                        fontSize: '0.78rem',
                        color: muted,
                        fontWeight: 500,
                        marginBottom: '0.2rem',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {q.label}
                    </dt>
                    <dd
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        lineHeight: 1.55,
                        color: display === '—' ? muted : ink,
                        whiteSpace: 'pre-wrap',
                        fontStyle: display === '—' ? 'italic' : 'normal',
                      }}
                    >
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}

        {submitError && (
          <div
            style={{
              border: `1px solid ${clay}`,
              background: 'rgba(184,90,54,0.08)',
              padding: '0.85rem 1rem',
              borderRadius: 8,
              color: clay,
              margin: '1.25rem 0',
              fontSize: '0.9rem',
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onEdit(0)}
            style={{
              padding: '0.8rem 1.2rem',
              background: 'transparent',
              color: inkSoft,
              border: `1px solid ${line}`,
              borderRadius: 8,
              fontSize: '0.95rem',
            }}
          >
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Back to start
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            style={{
              padding: '0.85rem 1.5rem',
              background: clay,
              color: cream,
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 600,
              opacity: submitting ? 0.65 : 1,
              cursor: submitting ? 'progress' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit my intake'}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
