// scripts/import-skool-members-2026-05-15.mjs
//
// One-time migration: fold Skool community members ("How to Be Your Own
// Doctor") into the Vercel KV drip:* system. CSV exported from Skool on
// 2026-05-15 has 1,237 members. Emails are stored in `Answer2` (response
// to "What is your email?"), NOT the `Email` column (which is mostly
// empty because Skool's primary identifier is the username, not email).
//
// CSV path: ~/Downloads/community_members (9).csv
//
// Modes:
//   --dry-run            Parse, dedupe, sample (no writes)
//   --import             Idempotent KV writes — adds the new ones
//
// Adds cohort: 'skool-import-2026-05-15' + tags ['skool-member', 'how-to-be-your-own-doctor']
// optedIn: true (joining Skool == high-intent opt-in)
// Q&A captured: biggest health challenge + what they want to learn
//   (so future agent prompts can use this signal for personalization)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CSV_PATH = path.join(os.homedir(), 'Downloads', 'community_members (9).csv');

function loadEnv() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1')), '..');
  for (const file of ['.env.local', '.env']) {
    const p = path.join(repoRoot, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

// ─── CSV parser (handles quoted fields with commas) ───────────────────

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return t.length >= 5 && t.length < 254 && EMAIL_RE.test(t) && !/[\r\n\0]/.test(t);
}

function extractMembers() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(text);
  const header = rows[0];
  const idx = {
    firstName: header.indexOf('FirstName'),
    lastName: header.indexOf('LastName'),
    email: header.indexOf('Email'),
    joined: header.indexOf('JoinedDate'),
    answer1: header.indexOf('Answer1'),
    answer2: header.indexOf('Answer2'),
    answer3: header.indexOf('Answer3'),
  };
  const out = [];
  const seen = new Set();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.length) continue;
    // Email lives in Answer2 (most common) OR sometimes the Email column
    const candidate = [r[idx.email], r[idx.answer2]].filter(Boolean).map((s) => String(s).trim().toLowerCase());
    const email = candidate.find(isValidEmail);
    if (!email) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      firstName: String(r[idx.firstName] || '').trim(),
      lastName: String(r[idx.lastName] || '').trim(),
      joined: String(r[idx.joined] || '').trim(),
      challenge: String(r[idx.answer1] || '').trim(),  // biggest health challenge
      wantsToLearn: String(r[idx.answer3] || '').trim(),
    });
  }
  return out;
}

// ─── KV diff + import ─────────────────────────────────────────────────

async function pullKvDripEmails() {
  const { kv } = await import('@vercel/kv');
  const keys = await kv.keys('drip:*');
  const set = new Set();
  for (const k of keys) {
    const r = await kv.get(k);
    if (r?.email) set.add(String(r.email).toLowerCase().trim());
  }
  return set;
}

async function importToKv(members) {
  const { kv } = await import('@vercel/kv');
  const out = { written: 0, skipped: 0, errors: 0 };
  for (const m of members) {
    const key = `drip:${m.email}`;
    try {
      const existing = await kv.get(key);
      if (existing) {
        // Tag-only update — add Skool tag to existing record without
        // touching enrollment state.
        const tags = Array.from(new Set([...(existing.tags || []), 'skool-member', 'how-to-be-your-own-doctor']));
        await kv.set(key, { ...existing, tags, skoolJoined: m.joined || existing.skoolJoined });
        out.skipped++;
        continue;
      }
      await kv.set(key, {
        email: m.email,
        firstName: m.firstName || '',
        lastName: m.lastName || '',
        cohort: 'skool-import-2026-05-15',
        enrolledAt: new Date().toISOString(),
        lastSentDay: 0,
        optedIn: true,
        source: 'skool-migration',
        skoolJoined: m.joined,
        skoolChallenge: m.challenge,
        skoolWantsToLearn: m.wantsToLearn,
        tags: ['skool-member', 'how-to-be-your-own-doctor', 'skool-import-2026-05-15'],
      });
      out.written++;
    } catch (err) {
      console.error('  err for', m.email, err.message);
      out.errors++;
    }
  }
  return out;
}

// ─── Modes ────────────────────────────────────────────────────────────

const members = extractMembers();
console.log(`CSV parsed: ${members.length} valid email rows`);

const mode = process.argv[2];

if (mode === '--dry-run' || !mode) {
  const existing = await pullKvDripEmails();
  const newOnes = members.filter((m) => !existing.has(m.email));
  const tagOnly = members.length - newOnes.length;
  console.log(`KV drip:* current: ${existing.size}`);
  console.log(`Will add (NET-NEW):   ${newOnes.length}`);
  console.log(`Will tag-only (existing): ${tagOnly}`);
  console.log();
  console.log('Sample of net-new (first 8):');
  for (const m of newOnes.slice(0, 8)) {
    console.log('  ' + m.email + (m.firstName ? '  (' + m.firstName + ' ' + m.lastName + ')' : ''));
  }
  console.log();
  console.log('Re-run with --import to execute.');
} else if (mode === '--import') {
  console.log(`Importing ${members.length} Skool members to KV...`);
  const r = await importToKv(members);
  console.log();
  console.log(`Done: ${r.written} new added, ${r.skipped} tag-only-updated (already existed), ${r.errors} errors`);
} else {
  console.error('Usage: --dry-run | --import');
  process.exit(1);
}
