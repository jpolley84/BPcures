// api/sabbath-reminder.js — "email me when the Sabbath ends" button on every
// Sabbath gate (bpquiz SPA, /tea static, challenge-b, hormoneteas Shopify,
// minoritypossible shop — they all POST here cross-origin).
//
// Uses Resend's scheduled_at so the email arrives AT Saturday sundown with no
// cron: one POST now, one delivery later. The client sends its computed
// endsAtMs (every gate already carries the shared sunset math); the server
// CLAMPS it to a sane window so a forged timestamp cannot schedule mail weeks
// out or in the past.

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const ALLOWED_ORIGINS = new Set([
  'https://bpquiz.com', 'https://www.bpquiz.com',
  'https://changemylifechallenge.com', 'https://www.changemylifechallenge.com',
  'https://hormoneteas.com', 'https://www.hormoneteas.com',
  'https://minoritypossible.com', 'https://www.minoritypossible.com',
]);

// Where "we're open again" should send them, per gate.
const RETURN_LINKS = {
  bpquiz:    { label: 'Take the free quiz',            url: 'https://bpquiz.com/quiz' },
  tea:       { label: 'Shop STEADY',                   url: 'https://hormoneteas.com/products/steady' },
  shopify:   { label: 'Shop STEADY',                   url: 'https://hormoneteas.com/products/steady' },
  challenge: { label: 'See the Change My Life Challenge', url: 'https://changemylifechallenge.com/' },
  'mp-shop': { label: 'Back to the shop',              url: 'https://minoritypossible.com/shop' },
};

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  const source = String(b.source || 'bpquiz').trim().slice(0, 30);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'bad_email' });

  // Clamp the requested send time: at least 5 minutes out, at most 36 hours
  // (a full Sabbath window plus slack). Anything else collapses to +25h,
  // which is "roughly next sundown" from any point inside the window.
  const now = Date.now();
  let endsAt = Number(b.endsAtMs);
  if (!Number.isFinite(endsAt) || endsAt < now + 5 * 60e3 || endsAt > now + 36 * 3600e3) {
    endsAt = now + 25 * 3600e3;
  }
  const sendAt = new Date(endsAt + 2 * 60e3); // 2 min after sundown, doors open

  if (!process.env.RESEND_API_KEY) {
    console.error('sabbath-reminder: RESEND_API_KEY missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  const link = RETURN_LINKS[source] || RETURN_LINKS.bpquiz;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [email], reply_to: 'braveworksrn@gmail.com',
        scheduled_at: sendAt.toISOString(),
        subject: 'The Sabbath has ended — we are open again',
        text: [
          'Hi,',
          '',
          'You asked us to let you know when the Sabbath ended. It just did, and everything is open again.',
          '',
          `${link.label}: ${link.url}`,
          '',
          'Thank you for respecting our rest. It means more than you know.',
          '',
          'Joel Polley, RN and Annie Chitate, RN',
          '',
          'This is a one-time reminder you requested. There is nothing to unsubscribe from because we will not write to you again unless you ask us to.',
        ].join('\n'),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('sabbath-reminder: resend rejected', j);
      return res.status(502).json({ error: 'send_failed' });
    }
    return res.status(200).json({ ok: true, sendAt: sendAt.toISOString() });
  } catch (err) {
    console.error('sabbath-reminder: exception', err.message);
    return res.status(500).json({ error: 'send_failed' });
  }
}
