// /api/postiz-cron — daily multi-platform poster via Postiz API.
//
// Schedule: 13:00 UTC = 8 AM CDT (1h after drip-cron at 12:00 UTC).
// Reads `services/config/social-content-bank.json`, computes today's day index,
// fetches connected Postiz integrations (channels), adapts content per-platform,
// and submits one POST /posts call to fan out across all channels.
//
// Joel's flow: he OAuth-connects each platform once in the Postiz dashboard.
// Cron handles the daily distribution from there. Platforms not connected are
// silently skipped — adding a new platform is just another OAuth in the Postiz UI.
//
// Env vars:
//   POSTIZ_API_KEY    — set via vercel env
//   KV_REST_API_*     — for tracking what's posted (no double-posts)
//   CRON_AUTH_TOKEN   — optional, for manual triggering
//
// Auth: x-vercel-cron header (auto-set by Vercel cron) OR Bearer token.

import { kv } from '@vercel/kv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchLatestVideos } from './_youtube-fetch.js';
import { generateImage } from './_postiz-mcp.js';
import { generateAndUploadQuoteCard } from './_image-gen.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Window in which a new YouTube video counts as "fresh" enough to be the
// day's source content. After this, fall back to the curated content bank.
const YT_FRESHNESS_HOURS = 36;

const POSTIZ_BASE = 'https://api.postiz.com/public/v1';
const CTA_URL_BASE = 'https://bpquiz.com';
const DRY_RUN = process.env.POSTIZ_DRY_RUN === '1';

// Per-platform character limits (incl. URL space).
const PLATFORM_LIMITS = {
  x: 280,
  bluesky: 300,
  threads: 500,
  mastodon: 500,
  linkedin: 3000,
  youtube: 1500,
  reddit: 40000,        // Reddit is generous, but content needs subreddit-specific tuning
  pinterest: 500,
  tiktok: 2200,
  facebook: 5000,
  instagram: 2200,
};

// Platforms we know how to adapt content for AND have valid Postiz settings.
const SUPPORTED_PLATFORMS = ['x', 'bluesky', 'threads', 'mastodon', 'linkedin', 'youtube', 'facebook', 'tiktok', 'reddit', 'instagram', 'pinterest'];
const PLATFORMS_ALWAYS_SKIPPED = []; // (none currently)

// Pinterest board to pin to. Resolved from Joel's connected account via the
// Postiz MCP `triggerTool` → `boards` call. The 'BraveWorksRN' board.
const PINTEREST_BOARD_ID = '920212205052100281';

// Reddit subreddits to post to. Joel's audience: women 40-60 with elevated BP.
// Picking subs with high health-discussion volume + relatively friendly to
// natural-health/RN-credentialed posters. Adjust if mod-removed.
const REDDIT_SUBREDDITS = ['Hypertension'];
// Note: r/Hypertension is the primary BP sub. ~25K members, mod-friendly to
// evidence-based posts. Skipping r/HighBloodPressure (smaller, less active) and
// r/Naturopathy (mods aggressive on outbound links). Add more subs once we see
// what survives auto-mod on the first round.

// Build the platform-specific settings object that Postiz requires per-post.
// Each platform has different schema — see https://docs.postiz.com/llms-full.txt
function buildPlatformSettings(platform, post) {
  switch (platform) {
    case 'x':
      return { __type: 'x', who_can_reply_post: 'everyone' };
    case 'facebook':
      return { __type: 'facebook' };
    case 'threads':
      return { __type: 'threads' };
    case 'linkedin':
      return { __type: 'linkedin', post_as_images_carousel: false };
    case 'youtube':
      return {
        __type: 'youtube',
        title: post.topic.slice(0, 100),
        type: 'public',
        tags: (post.tags || []).slice(0, 5).map((t) => ({ value: t, label: t })),
      };
    case 'bluesky':
      return { __type: 'bluesky' };
    case 'mastodon':
      return { __type: 'mastodon' };
    case 'tiktok':
      return { __type: 'tiktok' };
    case 'instagram':
      return { __type: 'instagram', post_type: 'post' };
    case 'pinterest':
      // Pinterest pin: title = day's hook (clickable), link = the UTM-tagged
      // bpquiz.com URL so every pin click goes straight to the quiz.
      return {
        __type: 'pinterest',
        board: PINTEREST_BOARD_ID,
        title: (post.hook || post.topic || '').slice(0, 100),
        link: 'https://bpquiz.com?utm_source=pinterest&utm_medium=organic&utm_campaign=daily-post',
        dominant_color: '#B85A36',
      };
    case 'reddit':
      // Reddit needs an array of subreddit destinations. Each has its own
      // title (Reddit titles are separate from body). We use post.hook as the
      // title across all subs and let Postiz fan out the same body to each.
      return {
        __type: 'reddit',
        subreddit: REDDIT_SUBREDDITS.map((sub) => ({
          value: {
            subreddit: sub,
            title: post.hook.slice(0, 290), // Reddit title cap is 300 chars
            type: 'text',
            flair: { id: '', name: '' },
            is_flair_required: false,
          },
        })),
      };
    default:
      return { __type: platform };
  }
}

// Read content bank at module load. Vercel reads from /var/task in prod.
function loadContentBank() {
  const tries = [
    path.resolve(__dirname, '../services/config/social-content-bank.json'),
    path.resolve(process.cwd(), 'services/config/social-content-bank.json'),
  ];
  for (const p of tries) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  throw new Error('social-content-bank.json not found in any expected location');
}

// Today's post number relative to the bank's startDate.
function computeTodaysDayIndex(bank, now = Date.now()) {
  const start = new Date(bank.startDate).getTime();
  const days = Math.floor((now - start) / 86_400_000) + 1;
  return days;
}

// Build a Postiz-MCP image prompt from the day's post. Bias toward the
// brand palette (cream / clay / sage), clinical-but-warm aesthetic, no text
// overlay (Postiz's image gen tends to render bad text). Topic-driven so
// each day's image is visually distinct.
function buildImagePrompt(post) {
  const brandStyle = 'clean editorial health-education illustration, cream off-white background, terracotta clay and sage green accents, soft natural lighting, professional clinical aesthetic, no text or letters in image, square 1080x1080';
  return `${post.topic} — ${brandStyle}`;
}

// Generate an image for the day's post. Tries Postiz MCP first (uses your
// 100/mo subscription quota when it's working), falls back to a vercel/og
// branded quote card uploaded to Postiz (free, autonomous, always works).
//
// Caches in KV per day so re-triggers don't regenerate. Returns { id, path,
// source } on success, null only if BOTH paths fail.
async function generateAndCacheImage(post, dayKey) {
  const cacheKey = `postiz-img:${dayKey}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached?.path) {
      return { path: cached.path, id: cached.id, source: cached.source || 'cache', cached: true };
    }
  } catch { /* continue */ }

  // Path 1: Postiz MCP generateImageTool (uses paid quota). Currently
  // returns "Unsafe URL" on Joel's account — likely needs provider config in
  // Postiz dashboard. Will start working when fixed; until then we fall through.
  let result = null;
  let mcpError = null;
  try {
    const prompt = buildImagePrompt(post);
    result = await generateImage(prompt);
    if (result?.path) {
      try {
        await kv.set(cacheKey, { path: result.path, id: result.id, prompt, source: 'postiz-mcp', generatedAt: new Date().toISOString() }, { ex: 30 * 86400 });
      } catch {}
      return { path: result.path, id: result.id, source: 'postiz-mcp', cached: false };
    }
  } catch (err) {
    mcpError = err.message;
    console.warn(`postiz-cron: MCP image gen failed (${err.message}) — falling back to vercel/og`);
  }

  // Path 2: vercel/og quote card → upload to Postiz. Free, brand-controlled.
  try {
    const upload = await generateAndUploadQuoteCard(post);
    try {
      await kv.set(cacheKey, { path: upload.path, id: upload.id, source: 'vercel-og', mcpError, generatedAt: new Date().toISOString() }, { ex: 30 * 86400 });
    } catch {}
    return { path: upload.path, id: upload.id, source: 'vercel-og', cached: false };
  } catch (err) {
    console.warn(`postiz-cron: vercel/og fallback also failed (${err.message}) — posting text-only`);
    return null;
  }
}

// Build the per-platform CTA URL with UTM tagging.
function ctaUrl(platform, dayNum) {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'organic',
    utm_campaign: 'daily-post',
    utm_content: `day-${dayNum}`,
  });
  return `${CTA_URL_BASE}?${params.toString()}`;
}

// Format inline hashtags from the post.tags array for platforms that use them.
function inlineHashtags(tags, platform) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  // Different platforms have different hashtag norms.
  // X/Bluesky/Threads/Mastodon/Pinterest: hashtags appended inline.
  // LinkedIn: 3-5 hashtags at end is conventional.
  // Reddit: NO hashtags (treated as spam).
  // YouTube Community: hashtags at end OK.
  // Facebook/Instagram: hashtags inline OK.
  if (platform === 'reddit') return '';
  const limit = ['linkedin', 'youtube'].includes(platform) ? 5 : 4;
  const tagged = tags.slice(0, limit).map((t) => `#${t}`).join(' ');
  return `\n\n${tagged}`;
}

// Adapt the post for the given platform. Truncates body if needed and
// always appends the UTM-tagged CTA on its own line at the end.
//
// CTA strategy: each content bank entry has its own marketing-forward `cta`
// string with RN authority + 90-sec urgency + specificity ("find YOUR BP
// type"). We use that and append the UTM-tagged URL. Falls back to a generic
// CTA string only if the entry doesn't have one (legacy entries).
//
// SHORT-FORM compression: short platforms (X/Bluesky/Threads/Mastodon) drop
// the body and use hook + compressed CTA + URL only. The CTA on these is
// rewritten to a punchier version since char budget is tight.
function adaptForPlatform(post, platform, dayNum) {
  const limit = PLATFORM_LIMITS[platform] || 500;
  const url = ctaUrl(platform, dayNum);
  const longCta = post.cta || `Take the free BP Risk Quiz at bpquiz.com — RN-built, 90 sec, instant results.`;
  const shortCta = `Free 90-sec BP Risk Quiz (RN-built) → find your BP type:`;
  const ytLine = post.youtubeUrl ? `\n\n📺 Full breakdown: ${post.youtubeUrl}` : '';
  const tags = inlineHashtags(post.tags, platform);

  const longForm = ['linkedin', 'youtube', 'reddit', 'tiktok', 'facebook', 'instagram'].includes(platform);
  const shortForm = ['x', 'bluesky', 'threads', 'mastodon'].includes(platform);

  if (longForm) {
    // Long form: hook + body + (YT mention) + marketing CTA + UTM URL + tags
    const ctaBlock = `\n\n${longCta}\n${url}`;
    const text = `${post.hook}\n\n${post.body}${ytLine}${ctaBlock}${tags}`;
    return text.length > limit ? text.slice(0, limit - 1).trimEnd() + '…' : text;
  }

  if (shortForm) {
    // Short form: hook + short CTA + URL + tags. YT mention dropped (char budget).
    const ctaBlock = `\n\n${shortCta} ${url}`;
    const reserved = ctaBlock.length + tags.length;
    const hookLimit = limit - reserved;
    const hook = post.hook.length > hookLimit
      ? post.hook.slice(0, Math.max(20, hookLimit - 1)).trimEnd() + '…'
      : post.hook;
    return `${hook}${ctaBlock}${tags}`;
  }

  // Pinterest / fallback.
  const ctaBlock = `\n\n${longCta}\n${url}`;
  const fullText = `${post.hook}\n\n${post.body}${ytLine}${ctaBlock}${tags}`;
  return fullText.length > limit ? fullText.slice(0, limit - 1).trimEnd() + '…' : fullText;
}

// ─── Match a YouTube video to the best content-bank entry ─────────────
// Repurpose.io fabricates descriptions, so we NEVER use video.description
// for body text. Instead we score the bank's curated entries against the
// video title and pick the closest topical match. If nothing scores well,
// we fall through to today's day-N entry.
function matchVideoToBankEntry(video, bank) {
  if (!video) return null;
  const titleLower = (video.title || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of (bank.posts || [])) {
    let score = 0;
    // Tag match = strong signal (each tag is hand-picked).
    for (const tag of (entry.tags || [])) {
      if (titleLower.includes(tag.toLowerCase())) score += 3;
    }
    // Topic-word overlap = weaker signal. Skip stopwords.
    const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your']);
    const topicWords = (entry.topic || '').toLowerCase().split(/\s+/);
    for (const word of topicWords) {
      if (word.length > 3 && !STOPWORDS.has(word) && titleLower.includes(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  // Threshold: require at least one tag match (3) OR multiple word hits (2+).
  return bestScore >= 2 ? { entry: best, score: bestScore } : null;
}

// ─── Build post from video + matched bank entry ───────────────────────
// The body always comes from the curated bank — never from video.description.
// The video itself becomes the secondary "📺 Full breakdown" line.
function buildHybridPost({ video, bankEntry, sourceLabel }) {
  // Spread the full bank entry so imageTitle, imagePoints, cta, etc.
  // all flow through to the image renderer + per-platform adapter.
  return {
    ...bankEntry,
    youtubeUrl: video.url,
    tags: bankEntry.tags || ['bloodpressure', 'naturopath'],
    source: sourceLabel,
    sourceVideoId: video.videoId,
    sourcePublishedAt: video.published,
  };
}

// Postiz API helpers ---------------------------------------------------
async function pz(method, pathname, body) {
  const res = await fetch(`${POSTIZ_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: process.env.POSTIZ_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  if (!res.ok) {
    const err = new Error(`postiz ${method} ${pathname} → ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return parsed;
}

async function getIntegrations() {
  const data = await pz('GET', '/integrations');
  return Array.isArray(data) ? data : (data?.integrations || []);
}

async function postFanOut({ integrations, post, dayNum, image }) {
  // Build one entry per integration; skip platforms we don't yet support.
  // `image` (when present) is the Postiz-generated media: { id, path }. We
  // attach it to every post so each platform gets the day's visual, and it
  // unlocks Instagram + Pinterest (both REQUIRE images).
  const posts = [];
  const skipped = [];
  // Platforms that REQUIRE an image and would otherwise be skipped.
  const imageRequired = ['instagram', 'pinterest'];

  for (const integ of integrations) {
    const platform = integ.providerIdentifier || integ.identifier || integ.platform || 'unknown';
    if (PLATFORMS_ALWAYS_SKIPPED.includes(platform)) {
      skipped.push({ id: integ.id, platform, reason: 'needs_board_or_per-platform_config' });
      continue;
    }
    if (imageRequired.includes(platform) && !image) {
      skipped.push({ id: integ.id, platform, reason: 'image_required_but_unavailable' });
      continue;
    }
    if (!SUPPORTED_PLATFORMS.includes(platform) && !imageRequired.includes(platform)) {
      skipped.push({ id: integ.id, platform, reason: 'unsupported_platform' });
      continue;
    }
    if (integ.disabled || integ.refreshNeeded) {
      skipped.push({ id: integ.id, platform, reason: 'disabled_or_refresh_needed' });
      continue;
    }
    const content = adaptForPlatform(post, platform, dayNum);
    const imageArr = image ? [{ id: image.id, path: image.path }] : [];
    posts.push({
      integration: { id: integ.id },
      value: [{ content, image: imageArr }],
      settings: buildPlatformSettings(platform, post),
    });
  }

  if (posts.length === 0) {
    return { posted: 0, skipped, response: null };
  }

  if (DRY_RUN) {
    console.log('[POSTIZ DRY RUN] Would post:', JSON.stringify(posts, null, 2));
    return { posted: posts.length, skipped, response: { dryRun: true } };
  }

  const response = await pz('POST', '/posts', {
    type: 'now',
    date: new Date().toISOString(),
    posts,
    shortLink: false,
    tags: [],
  });

  return { posted: posts.length, skipped, response };
}

// Handler --------------------------------------------------------------
export default async function handler(req, res) {
  const fromVercelCron = req.headers['x-vercel-cron'] === '1';
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const manualOk = bearer && bearer === process.env.CRON_AUTH_TOKEN;
  if (!fromVercelCron && !manualOk) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }

  if (!process.env.POSTIZ_API_KEY) {
    return res.status(500).json({ error: 'POSTIZ_API_KEY not set' });
  }

  let bank;
  try {
    bank = loadContentBank();
  } catch (err) {
    return res.status(500).json({ error: 'content bank load failed', message: err.message });
  }

  const dayNum = computeTodaysDayIndex(bank);
  if (dayNum < 1) {
    return res.status(200).json({ ok: true, skipped: 'before-startDate', dayNum });
  }

  // Branching: try to find a fresh on-brand YouTube video. Body content ALWAYS
  // comes from the curated bank (never from video.description — Repurpose.io
  // sometimes fabricates). When a fresh video exists, we hybrid-pair it with the
  // best topical bank match. Otherwise it's just today's day-N entry.
  let post = null;
  let source = 'unknown';
  let ytLatest = null;
  let ytError = null;
  let ytTotalSeen = 0;
  let bankMatchScore = 0;

  try {
    const yt = await fetchLatestVideos({ onlyOnBrand: true, maxAgeHours: YT_FRESHNESS_HOURS });
    ytLatest = yt.latest;
    ytTotalSeen = yt.all?.length || 0;
    if (ytLatest) {
      const match = matchVideoToBankEntry(ytLatest, bank);
      if (match) {
        post = buildHybridPost({ video: ytLatest, bankEntry: match.entry, sourceLabel: 'youtube+match' });
        source = 'youtube+match';
        bankMatchScore = match.score;
      } else {
        // YT video fresh, but no good topical match — pair with today's day-N.
        const todayEntry = bank.posts.find((p) => p.day === dayNum);
        if (todayEntry) {
          post = buildHybridPost({ video: ytLatest, bankEntry: todayEntry, sourceLabel: 'youtube+day-N' });
          source = 'youtube+day-N';
        }
      }
    }
  } catch (err) {
    ytError = err.message;
    console.warn('postiz-cron: YT fetch failed, falling back to content bank:', err.message);
  }

  if (!post) {
    post = bank.posts.find((p) => p.day === dayNum) || null;
    source = post ? 'content-bank' : 'none';
  }

  if (!post) {
    return res.status(200).json({
      ok: true,
      skipped: 'no-content-for-day-and-no-fresh-yt',
      dayNum,
      ytLatestSeen: ytLatest?.title || null,
      bankAvailable: bank.posts.map((p) => p.day),
    });
  }

  // Idempotency — skip if today's post already went out (manual re-trigger safety).
  // Key includes source so a YT video posted earlier doesn't block a content-bank
  // re-trigger on the same day (and vice versa).
  const dateKey = new Date().toISOString().slice(0, 10);
  const kvKey = source === 'youtube' && post.sourceVideoId
    ? `postiz-yt:${post.sourceVideoId}`
    : `postiz-day:${dayNum}:${dateKey}`;
  try {
    const seen = await kv.get(kvKey);
    if (seen && !req.query?.force) {
      return res.status(200).json({ ok: true, deduplicated: true, dayNum, alreadyPostedAt: seen.postedAt, hint: 'add ?force=1 to repost' });
    }
  } catch (err) {
    console.warn('postiz-cron: KV idempotency check failed (continuing):', err.message);
  }

  let integrations;
  try {
    integrations = await getIntegrations();
  } catch (err) {
    return res.status(500).json({ error: 'fetch integrations failed', message: err.message });
  }

  if (integrations.length === 0) {
    return res.status(200).json({
      ok: true,
      dayNum,
      posted: 0,
      hint: 'No channels connected in Postiz yet. Connect platforms in the Postiz dashboard, then trigger again.',
    });
  }

  // Generate today's image via Postiz MCP. Cached per dayKey so re-triggers
  // don't burn quota. Failure → text-only post (Instagram/Pinterest skipped).
  const imgKey = source === 'youtube+match' || source === 'youtube+day-N'
    ? `day-${dayNum}-${dateKey}`
    : `day-${dayNum}-${dateKey}`;
  let image = null;
  let imageError = null;
  try {
    image = await generateAndCacheImage(post, imgKey);
  } catch (err) {
    imageError = err.message;
  }

  let result;
  try {
    result = await postFanOut({ integrations, post, dayNum, image });
  } catch (err) {
    return res.status(500).json({ error: 'fan-out failed', message: err.message, dayNum, integrations: integrations.length, image });
  }

  // Record success.
  try {
    await kv.set(kvKey, { postedAt: new Date().toISOString(), result }, { ex: 7 * 86400 });
  } catch (err) {
    console.warn('postiz-cron: KV write failed:', err.message);
  }

  console.log('postiz-cron summary:', JSON.stringify({ dayNum, source, ...result }));
  return res.status(200).json({
    ok: true,
    dayNum,
    source,
    topic: post.topic,
    youtubeUrl: post.youtubeUrl || null,
    ytDebug: { ytError, ytTotalSeen, ytLatestTitle: ytLatest?.title || null, ytLatestPublished: ytLatest?.published || null, bankMatchScore },
    image: image ? { id: image.id, path: image.path, source: image.source, cached: image.cached } : null,
    imageError,
    posted: result.posted,
    skipped: result.skipped,
    integrationsSeen: integrations.length,
    response: result.response,
  });
}
