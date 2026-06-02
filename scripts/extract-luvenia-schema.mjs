// scripts/extract-luvenia-schema.mjs
// One-shot. Reads src/pages/LuveniaIntakePage.jsx, extracts SECTIONS, and
// writes api/_luvenia-schema.js with SECTION_MAP + formatAnswer.
//
// Same shape as _wakita-schema.js so the cloned _luvenia-pdf.js renders
// identically.

import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1'));
const repoRoot = path.resolve(here, '..');
const source = fs.readFileSync(path.join(repoRoot, 'src/pages/LuveniaIntakePage.jsx'), 'utf8');

// Find the SECTIONS array — bracket-balanced parse starting from `const SECTIONS = [`
const start = source.indexOf('const SECTIONS = [');
if (start < 0) throw new Error('SECTIONS not found');
let i = source.indexOf('[', start);
let depth = 0;
let end = -1;
let inStr = null;
let prev = '';
for (; i < source.length; i++) {
  const ch = source[i];
  if (inStr) {
    if (ch === inStr && prev !== '\\') inStr = null;
  } else {
    if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  prev = ch;
}
const block = source.slice(start, end + 1);

// Section-by-section parse. Each section opens with `{` followed shortly by
// `id: '...', title: '...'` and contains `fields: [ ... ]` at depth 1.
// We scan top-level `{` blocks inside the array.
const sections = [];
// Walk through the block to find each section's title and field id+label pairs.
// Simple line-based regex extraction works because the agent generates clean code.

const sectionPattern = /\{\s*id:\s*['"]([a-z0-9_]+)['"]\s*,\s*title:\s*['"]([^'"]+)['"]/g;
const fieldPattern = /\{\s*id:\s*['"]([a-z0-9_]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]/g;

// Find all sections + their start indices
const sectionMatches = [];
let sm;
while ((sm = sectionPattern.exec(block)) !== null) {
  sectionMatches.push({ id: sm[1], title: sm[2], startIdx: sm.index });
}
// For each section, slurp fields up to the next section's start
for (let idx = 0; idx < sectionMatches.length; idx++) {
  const cur = sectionMatches[idx];
  const nextIdx = idx + 1 < sectionMatches.length ? sectionMatches[idx + 1].startIdx : block.length;
  const slice = block.slice(cur.startIdx, nextIdx);
  // Inside this slice, find all `id: '...', label: '...'` pairs.
  // Skip the section's own id (the FIRST id in the slice is the section id, not a field).
  const fields = [];
  let fm;
  const fp = new RegExp(fieldPattern.source, 'g');
  let first = true;
  while ((fm = fp.exec(slice)) !== null) {
    if (first) { first = false; continue; } // skip section's own id (which has title not label, but pattern still might match — defensive)
    fields.push([fm[1], fm[2]]);
  }
  // Defensive: re-check by ensuring section's own id isn't in fields
  const cleaned = fields.filter(([id]) => id !== cur.id);
  sections.push({ title: cur.title, fields: cleaned });
}

// Write schema
const out = [];
out.push("// Shared field-label map for Luvenia's pre-call BP Triangle intake.");
out.push("//");
out.push("// Mirrors the SECTIONS array in src/pages/LuveniaIntakePage.jsx so the");
out.push("// generated PDF + email summary read with full labels server-side. If");
out.push("// you add or rename a question on the page, mirror it here.");
out.push("//");
out.push("// Auto-generated 2026-06-02 by scripts/extract-luvenia-schema.mjs.");
out.push("// Re-run that script anytime the page schema changes.");
out.push("");
out.push("export const SECTION_MAP = [");
for (const s of sections) {
  out.push("  {");
  out.push(`    title: ${JSON.stringify(s.title)},`);
  out.push("    fields: [");
  for (const [id, label] of s.fields) {
    out.push(`      [${JSON.stringify(id)}, ${JSON.stringify(label)}],`);
  }
  out.push("    ],");
  out.push("  },");
}
out.push("];");
out.push("");
out.push("// Render a value into a single-line string for table cells / PDFs.");
out.push("export function formatAnswer(v) {");
out.push("  if (v == null) return '';");
out.push("  if (Array.isArray(v)) return v.filter(Boolean).join(', ');");
out.push("  if (typeof v === 'object') return JSON.stringify(v);");
out.push("  return String(v);");
out.push("}");
out.push("");

const outPath = path.join(repoRoot, 'api/_luvenia-schema.js');
fs.writeFileSync(outPath, out.join('\n'), 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`Sections: ${sections.length}`);
console.log(`Total fields: ${sections.reduce((s, x) => s + x.fields.length, 0)}`);
for (const s of sections) console.log(`  ${s.title.padEnd(45)} ${s.fields.length} fields`);
