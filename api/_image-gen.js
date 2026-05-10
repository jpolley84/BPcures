// _image-gen.js — generate branded BraveWorks quote-card images via @vercel/og
// and upload them to Postiz so they're "verified" URLs the publishing pipeline
// will accept (Instagram, Pinterest, TikTok, YouTube all reject external URLs).
//
// Free path. No external image API. The cron uses this when Postiz's own
// generateImageTool returns "Unsafe URL" or any other failure.
//
// Brand: cream background, terracotta clay accent, sage green secondary,
// Georgia serif headlines, the day's hook centered, "BraveWorks RN ·
// bpquiz.com" small footer. 1080x1080 square — Instagram + Pinterest friendly.
//
// Underscore prefix = private module, not a Vercel endpoint.

import { ImageResponse } from '@vercel/og';
import React from 'react';

const PALETTE = {
  bg: '#FBF8F1',           // cream
  text: '#2C3E50',         // primary text
  textSoft: '#3A3A3A',
  accentClay: '#B85A36',
  accentSage: '#4A6741',
  border: '#E8E2D4',
};

// Render a value-rich infographic card: title + 3 numbered points + CTA.
// Cream bg, sage numbered circles, clay accent on CTA.
async function renderInfographicBuffer({ title, points }) {
  const e = React.createElement;

  const numberedPoint = (idx, text) =>
    e('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '20px',
        width: '100%',
      },
    },
      // Number circle
      e('div', {
        style: {
          width: '56px',
          height: '56px',
          minWidth: '56px',
          backgroundColor: PALETTE.accentSage,
          color: '#FBF8F1',
          fontSize: '28px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginTop: '4px',
        },
      }, String(idx)),
      // Point text
      e('div', {
        style: {
          fontSize: '30px',
          lineHeight: 1.35,
          color: PALETTE.text,
          flex: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          paddingTop: '4px',
        },
      }, text)
    );

  const card = e('div', {
    style: {
      width: '1080px',
      height: '1080px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: PALETTE.bg,
      padding: '64px 72px 56px 72px',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
  },
    // Top: brand chip + sage divider
    e('div', { style: { display: 'flex', flexDirection: 'column' } },
      e('div', {
        style: {
          fontSize: '20px',
          letterSpacing: '5px',
          textTransform: 'uppercase',
          color: PALETTE.accentClay,
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginBottom: '24px',
        },
      }, 'BraveWorks Health · Joel Polley, RN'),
      e('div', { style: { width: '100px', height: '4px', backgroundColor: PALETTE.accentSage } })
    ),
    // Middle: title + numbered points
    e('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        paddingTop: '24px',
        paddingBottom: '24px',
      },
    },
      e('div', {
        style: {
          fontSize: '54px',
          lineHeight: 1.16,
          fontWeight: 600,
          color: PALETTE.text,
          letterSpacing: '-0.5px',
          marginBottom: '40px',
          maxWidth: '960px',
        },
      }, title),
      ...points.map((p, i) => numberedPoint(i + 1, p))
    ),
    // Bottom: CTA block on clay background
    e('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: PALETTE.accentClay,
        color: '#FBF8F1',
        padding: '24px 32px',
        borderRadius: '14px',
      },
    },
      e('div', {
        style: {
          fontSize: '18px',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontWeight: 600,
          opacity: 0.92,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginBottom: '6px',
        },
      }, 'Personal RN protocol → free 90-sec quiz'),
      e('div', {
        style: {
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.5px',
        },
      }, 'bpquiz.com')
    )
  );

  const response = new ImageResponse(card, { width: 1080, height: 1080 });
  const ab = await response.arrayBuffer();
  return Buffer.from(ab);
}

// ─── Upload PNG buffer to Postiz so it becomes a "verified" URL ───────
// Postiz's POST /upload accepts multipart form-data with a `file` field.
async function uploadToPostiz(buffer, filename = 'quote-card.png') {
  const form = new FormData();
  const blob = new Blob([buffer], { type: 'image/png' });
  form.append('file', blob, filename);

  const res = await fetch('https://api.postiz.com/public/v1/upload', {
    method: 'POST',
    headers: { Authorization: process.env.POSTIZ_API_KEY },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Postiz upload failed ${res.status}: ${text.slice(0, 250)}`);
  }
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Postiz upload returned non-JSON: ${text.slice(0, 200)}`);
  }
  // Postiz upload returns { id, path } per their docs.
  if (!json.path && !json.id) {
    throw new Error(`Postiz upload missing id/path: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return { id: json.id, path: json.path };
}

// Strip emoji + hashtags so they don't render as ugly rectangles in @vercel/og.
function clean(s) {
  return String(s || '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '') // misc symbols
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Reusable layout pieces ───────────────────────────────────────────
const e = React.createElement;

function brandChip() {
  return e('div', { style: { display: 'flex', flexDirection: 'column' } },
    e('div', {
      style: {
        fontSize: '20px',
        letterSpacing: '5px',
        textTransform: 'uppercase',
        color: PALETTE.accentClay,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: '24px',
      },
    }, 'BraveWorks Health · Joel Polley, RN'),
    e('div', { style: { width: '100px', height: '4px', backgroundColor: PALETTE.accentSage } })
  );
}

function ctaBar() {
  return e('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: PALETTE.accentClay,
      color: '#FBF8F1',
      padding: '24px 32px',
      borderRadius: '14px',
    },
  },
    e('div', {
      style: {
        fontSize: '18px',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        fontWeight: 600,
        opacity: 0.92,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: '6px',
      },
    }, 'Personal RN protocol → free 90-sec quiz'),
    e('div', {
      style: {
        fontSize: '40px',
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '-0.5px',
      },
    }, 'bpquiz.com')
  );
}

function pageShell(middle) {
  return e('div', {
    style: {
      width: '1080px',
      height: '1080px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: PALETTE.bg,
      padding: '64px 72px 56px 72px',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
  }, brandChip(), middle, ctaBar());
}

// ─── Template B: Did You Know? ────────────────────────────────────────
async function renderDidYouKnowBuffer({ fact, source }) {
  const middle = e('div', {
    style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' },
  },
    e('div', {
      style: {
        fontSize: '36px',
        letterSpacing: '8px',
        textTransform: 'uppercase',
        color: PALETTE.accentClay,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: '32px',
      },
    }, 'Did you know?'),
    e('div', {
      style: {
        fontSize: '52px',
        lineHeight: 1.22,
        fontWeight: 600,
        color: PALETTE.text,
        letterSpacing: '-0.5px',
        marginBottom: source ? '32px' : 0,
      },
    }, fact),
    source ? e('div', {
      style: {
        fontSize: '24px',
        color: PALETTE.textSoft,
        fontStyle: 'italic',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    }, source) : null
  );
  const response = new ImageResponse(pageShell(middle), { width: 1080, height: 1080 });
  return Buffer.from(await response.arrayBuffer());
}

// ─── Template C: Startling Statistic ──────────────────────────────────
async function renderStatisticBuffer({ heroNumber, label, context }) {
  const middle = e('div', {
    style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  },
    e('div', {
      style: {
        fontSize: '220px',
        lineHeight: 1,
        fontWeight: 700,
        color: PALETTE.accentClay,
        letterSpacing: '-4px',
        fontFamily: 'Georgia, serif',
        marginBottom: '24px',
      },
    }, heroNumber),
    e('div', {
      style: {
        fontSize: '32px',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        color: PALETTE.accentSage,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: '24px',
      },
    }, label),
    e('div', {
      style: {
        fontSize: '36px',
        lineHeight: 1.32,
        color: PALETTE.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '900px',
      },
    }, context)
  );
  const response = new ImageResponse(pageShell(middle), { width: 1080, height: 1080 });
  return Buffer.from(await response.arrayBuffer());
}

// ─── Public API ───────────────────────────────────────────────────────
// Generate an image for a content-bank post. Picks template based on
// post.template field — defaults to 'listicle' for backwards compat:
//
//   'listicle'    → title + 3 numbered points + CTA  (default)
//   'didYouKnow'  → "Did you know?" header + big fact + source + CTA
//   'stat'        → hero number + label + context + CTA
export async function generateAndUploadQuoteCard(post) {
  const template = post.template || 'listicle';
  let buffer;

  if (template === 'didYouKnow') {
    buffer = await renderDidYouKnowBuffer({
      fact: clean(post.imageFact || post.hook || post.topic),
      source: clean(post.imageSource || ''),
    });
  } else if (template === 'stat') {
    buffer = await renderStatisticBuffer({
      heroNumber: clean(post.imageHero || ''),
      label: clean(post.imageStatLabel || post.topic || ''),
      context: clean(post.imageStatContext || post.hook || ''),
    });
  } else {
    // Default: listicle
    const title = clean(post.imageTitle || post.hook || post.topic || 'BraveWorks Health');
    const points = Array.isArray(post.imagePoints) && post.imagePoints.length > 0
      ? post.imagePoints.map(clean).filter(Boolean).slice(0, 3)
      : [clean(post.hook || post.topic || '')].filter(Boolean);
    buffer = await renderInfographicBuffer({ title, points });
  }

  return await uploadToPostiz(buffer);
}
