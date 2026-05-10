// _youtube-fetch.js — pulls latest video metadata from Joel's YouTube channel.
// Used by postiz-cron.js to detect fresh content and generate posts that link
// back to the new video.
//
// Underscore prefix = private module, not a Vercel endpoint.
//
// Strategy: tries YouTube Data API v3 first (when YOUTUBE_API_KEY is set),
// falls back to RSS scrape if API not configured. The RSS path tends to get
// IP-blocked from Vercel Lambda IPs (returns 500), so YT API is the
// production path. RSS works locally for dev.

import { kv } from '@vercel/kv';

const CHANNEL_HANDLE = 'braveworksrn'; // Joel's YouTube
const CHANNEL_ID_KV_KEY = `yt-channel-id:${CHANNEL_HANDLE}`;
// Fixed channel ID — already resolved 2026-05-09 from the @handle landing page.
// Hardcoded so we don't need to scrape the channel page from Lambda IPs.
const CHANNEL_ID_FALLBACK = 'UC4rhBzvMd2F3iZ9yaRxP9yA';

// Health-keyword filter — videos with these in title or description count
// as on-brand for the BPQuiz funnel. Off-brand videos (vlogs, personal,
// non-health) get filtered out so we don't post them with the kit CTA.
const HEALTH_KEYWORDS = [
  'blood pressure', 'bp', 'hypertension', 'cortisol', 'stress',
  'blood sugar', 'insulin', 'diabetes', 'metabolic',
  'sodium', 'salt', 'potassium', 'magnesium', 'electrolyte',
  'sleep', 'breathwork', 'breath', 'cuff',
  'doctor', 'medication', 'meds', 'lisinopril',
  'naturopath', 'rn', 'nurse', 'protocol', 'reset',
  'inflammation', 'vascular', 'kidney', 'heart',
];

// ─── Channel ID resolution ────────────────────────────────────────────
async function resolveChannelId(handle) {
  const cached = await kv.get(CHANNEL_ID_KV_KEY);
  if (cached) return cached;
  // Fall back to the hardcoded ID — saves us from needing to scrape the
  // channel page from a Lambda IP (often blocked).
  return CHANNEL_ID_FALLBACK;
}

// ─── YouTube Data API v3 ──────────────────────────────────────────────
// When YOUTUBE_API_KEY is set, this is the primary path. Free up to 10K
// units/day; one search.list call is 100 units, so 100 daily fetches/day
// is fine. We use a single search.list with channelId + order=date to
// get the latest videos with full metadata in one call.
async function fetchViaDataAPI(channelId, maxResults = 10) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/youtube/v3/search`
    + `?key=${apiKey}`
    + `&channelId=${encodeURIComponent(channelId)}`
    + `&part=snippet`
    + `&order=date`
    + `&type=video`
    + `&maxResults=${maxResults}`;

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`YT Data API v3 ${res.status}: ${txt.slice(0, 250)}`);
  }
  const json = await res.json();
  return (json.items || []).map((item) => ({
    videoId: item.id?.videoId || null,
    title: item.snippet?.title || '',
    url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : null,
    published: item.snippet?.publishedAt || null,
    updated: item.snippet?.publishedAt || null,
    description: item.snippet?.description || '',
    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || null,
  }));
}

// ─── RSS parsing ──────────────────────────────────────────────────────
// YouTube RSS uses Atom format. We extract entries with regex (avoiding
// a full XML parser dependency for a single, well-formed feed source).
function parseAtomFeed(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch;
  while ((entryMatch = entryRe.exec(xml)) !== null) {
    const entryXml = entryMatch[1];
    const get = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const m = entryXml.match(re);
      return m ? m[1].trim() : null;
    };
    const link = entryXml.match(/<link[^>]*href="([^"]+)"/);
    const videoId = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const description = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const thumbnail = entryXml.match(/<media:thumbnail[^>]*url="([^"]+)"/);

    entries.push({
      videoId: videoId ? videoId[1] : null,
      title: decodeXml(get('title') || ''),
      url: link ? link[1] : null,
      published: get('published'),
      updated: get('updated'),
      description: decodeXml(description ? description[1].trim() : ''),
      thumbnail: thumbnail ? thumbnail[1] : null,
    });
  }
  return entries;
}

function decodeXml(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ─── On-brand filter ──────────────────────────────────────────────────
function isOnBrand(video) {
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  return HEALTH_KEYWORDS.some((kw) => haystack.includes(kw));
}

// ─── Public API ───────────────────────────────────────────────────────
/**
 * Fetch latest videos from Joel's YouTube channel.
 * @param {object} opts
 * @param {boolean} opts.onlyOnBrand - filter to health-relevant videos only (default true)
 * @param {number} opts.maxAgeHours - only return videos newer than N hours; null for no limit
 * @returns {Promise<{channelId: string, latest: object|null, all: object[]}>}
 */
export async function fetchLatestVideos({ onlyOnBrand = true, maxAgeHours = null } = {}) {
  const channelId = await resolveChannelId(CHANNEL_HANDLE);

  // Try Data API first (production path). Falls back to RSS if API key not set.
  let videos = await fetchViaDataAPI(channelId, 15);

  if (!videos) {
    // No API key — try RSS scrape (works locally; usually blocked from Vercel).
    const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BraveWorks-Bot/1.0)' },
    });
    if (!rssRes.ok) {
      throw new Error(`YT RSS fetch failed: ${rssRes.status} (set YOUTUBE_API_KEY env to use the official Data API instead)`);
    }
    const xml = await rssRes.text();
    videos = parseAtomFeed(xml);
  }

  if (onlyOnBrand) {
    videos = videos.filter(isOnBrand);
  }

  if (maxAgeHours != null) {
    const cutoff = Date.now() - maxAgeHours * 3600_000;
    videos = videos.filter((v) => {
      const pub = v.published ? new Date(v.published).getTime() : 0;
      return pub >= cutoff;
    });
  }

  return {
    channelId,
    latest: videos[0] || null,
    all: videos,
  };
}

/**
 * Returns true if the latest on-brand video was published within `windowHours`.
 * Used by postiz-cron to branch between "post about new video" vs "post from content bank."
 */
export async function hasFreshOnBrandVideo(windowHours = 24) {
  try {
    const { latest } = await fetchLatestVideos({ onlyOnBrand: true, maxAgeHours: windowHours });
    return latest != null;
  } catch (err) {
    console.warn('youtube-fetch: hasFreshOnBrandVideo failed (assuming no):', err.message);
    return false;
  }
}
