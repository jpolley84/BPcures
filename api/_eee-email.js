// api/_eee-email.js: the full Expertise Snapshot, by email, plus the printable
// HTML version the "Download My Free Snapshot" link opens.
//
// The results page shows the three headlines and a gap paragraph. THIS is the
// in-depth read: evidence receipts, the six-signal theme table, what she is
// underestimating, traps, what still needs testing, one thing to notice this
// week. Same JSON the analyst produced; two renderings.
import { p, ctaButton, buildEmail, PALETTE } from './_triangle-email.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function receiptsHtml(evidence) {
  if (!Array.isArray(evidence) || !evidence.length) return '';
  return '<ul style="margin:0 0 18px;padding-left:20px">' + evidence.map((e) =>
    `<li style="margin:0 0 8px;line-height:1.5"><em>“${esc(e.quote)}”</em>${e.from ? ` <span style="color:#697281">— ${esc(e.from)}</span>` : ''}</li>`,
  ).join('') + '</ul>';
}
function receiptsText(evidence) {
  if (!Array.isArray(evidence) || !evidence.length) return '';
  return evidence.map((e) => `  - "${e.quote}"${e.from ? ` (${e.from})` : ''}`).join('\n') + '\n';
}

function block(label, out) {
  const html = `<p style="margin:26px 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">${esc(label)}</p>`
    + `<h2 style="margin:0 0 10px;font-family:Georgia,serif;font-size:24px;line-height:1.2;color:#0b1730">${esc(out.headline)}</h2>`
    + p(esc(out.summary))
    + receiptsHtml(out.evidence);
  const text = `${label.toUpperCase()}\n${out.headline}\n${out.summary}\n${receiptsText(out.evidence)}`;
  return { html, text };
}

function themesHtml(themes) {
  if (!Array.isArray(themes) || !themes.length) return '';
  const cols = ['Proof', 'Ease', 'Echo', 'Energy', 'Story', 'Demand'];
  const head = `<tr><th style="text-align:left;padding:8px 6px;border-bottom:1px solid #dfe3e9;font-size:12px">Theme</th>${cols.map((c) => `<th style="padding:8px 4px;border-bottom:1px solid #dfe3e9;font-size:12px">${c}</th>`).join('')}<th style="text-align:left;padding:8px 6px;border-bottom:1px solid #dfe3e9;font-size:12px">Read</th></tr>`;
  const rows = themes.map((t) => `<tr><td style="padding:8px 6px;border-bottom:1px solid #eef0f3;font-weight:700">${esc(t.theme)}</td>${cols.map((c) => `<td style="text-align:center;padding:8px 4px;border-bottom:1px solid #eef0f3">${Number(t.signals?.[c] ?? 0)}</td>`).join('')}<td style="padding:8px 6px;border-bottom:1px solid #eef0f3;font-size:13px">${esc(t.verdict || '')}${t.weakest_signal ? `<br><span style="color:#697281">weakest: ${esc(t.weakest_signal)}</span>` : ''}</td></tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 6px;font-size:14px">${head}${rows}</table>`
    + `<p style="margin:0 0 18px;font-size:12px;color:#697281">Each theme scored 0 to 3 on six signals. Strong on five or six is an unfair advantage. Strong on three or four is a candidate with one signal to fix. One or two is a hobby or a job skill, for now.</p>`;
}
function themesText(themes) {
  if (!Array.isArray(themes) || !themes.length) return '';
  return themes.map((t) => `  ${t.theme}: Proof ${t.signals?.Proof ?? 0} · Ease ${t.signals?.Ease ?? 0} · Echo ${t.signals?.Echo ?? 0} · Energy ${t.signals?.Energy ?? 0} · Story ${t.signals?.Story ?? 0} · Demand ${t.signals?.Demand ?? 0} → ${t.verdict || ''}${t.weakest_signal ? ` (weakest: ${t.weakest_signal})` : ''}`).join('\n') + '\n';
}

// Shared body for both renderings.
export function snapshotBody(result, { resultsUrl }) {
  const name = result.first_name || 'Friend';
  const d = result.deep || {};
  const he = block('Your Hidden Expertise', result.hidden_expertise);
  const sp = block('Your Strongest Pattern', result.strongest_pattern);
  const ua = block('Your Unfair Advantage', result.unfair_advantage);

  const parts = [];
  parts.push({ html: p(`${esc(name)}, this is your Expertise Snapshot. Not a label. A read of the evidence you gave us, in your own words, with the receipts.`), text: `${name}, this is your Expertise Snapshot. Not a label. A read of the evidence you gave us, in your own words, with the receipts.` });
  if (result.headline) parts.push({ html: `<p style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;line-height:1.3;color:#0b1730"><b>${esc(result.headline)}</b></p>`, text: result.headline });
  parts.push(he, sp, ua);

  if (d.themes?.length) parts.push({ html: `<p style="margin:26px 0 8px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">How the themes score</p>${themesHtml(d.themes)}`, text: `HOW THE THEMES SCORE\n${themesText(d.themes)}` });
  if (d.labels_not_accepted?.length) {
    const li = d.labels_not_accepted.map((l) => `<li style="margin:0 0 6px">You said “${esc(l.label)}.” We used: ${esc(l.used_instead)}</li>`).join('');
    parts.push({ html: `<p style="margin:22px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">Labels we did not accept as evidence</p><ul style="margin:0 0 18px;padding-left:20px">${li}</ul>`, text: `LABELS WE DID NOT ACCEPT AS EVIDENCE\n${d.labels_not_accepted.map((l) => `  - You said "${l.label}." We used: ${l.used_instead}`).join('\n')}\n` });
  }
  if (d.what_you_may_be_underestimating) parts.push({ html: `<p style="margin:22px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">What you may be underestimating</p>${p(esc(d.what_you_may_be_underestimating))}`, text: `WHAT YOU MAY BE UNDERESTIMATING\n${d.what_you_may_be_underestimating}` });
  if (d.traps) parts.push({ html: `<p style="margin:22px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">Traps to avoid building on</p>${p(esc(d.traps))}`, text: `TRAPS TO AVOID BUILDING ON\n${d.traps}` });
  if (d.what_still_needs_testing) parts.push({ html: `<p style="margin:22px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#8a6a09">What still needs testing</p>${p(esc(d.what_still_needs_testing))}`, text: `WHAT STILL NEEDS TESTING\n${d.what_still_needs_testing}` });
  if (d.one_thing_to_notice_this_week) parts.push({ html: `<div style="margin:22px 0;padding:16px 18px;border-left:4px solid ${PALETTE.accentClay || '#d1ae3d'};background:#fff8df"><b>One thing to notice this week:</b> ${esc(d.one_thing_to_notice_this_week)}</div>`, text: `ONE THING TO NOTICE THIS WEEK\n${d.one_thing_to_notice_this_week}` });
  if (d.confidence_note) parts.push({ html: `<p style="margin:0 0 18px;font-size:13px;color:#697281">${esc(d.confidence_note)}</p>`, text: d.confidence_note });

  parts.push({ html: `<hr style="border:0;border-top:1px solid #dfe3e9;margin:28px 0">` + p(esc(result.commercial_gap || 'This is what you have. The next question is what to do with it.')), text: `\n${result.commercial_gap || 'This is what you have. The next question is what to do with it.'}` });
  parts.push({ html: ctaButton('See your results page and the $47 Client-Ready Blueprint™', resultsUrl, { accent: PALETTE.accentClay }), text: `Your results page: ${resultsUrl}` });
  parts.push({ html: p('Joel Polley & Annie Chitate<br>Expertise Extraction Engine™ · Everyday Nurse LLC'), text: 'Joel Polley & Annie Chitate\nExpertise Extraction Engine · Everyday Nurse LLC' });

  return { bodyHtml: parts.map((x) => x.html).join(''), bodyText: parts.map((x) => x.text).join('\n\n') };
}

export function snapshotEmail({ result, resultsUrl, unsubUrl }) {
  const name = result.first_name || 'Friend';
  const { bodyHtml, bodyText } = snapshotBody(result, { resultsUrl });
  const { html, text } = buildEmail({
    preheader: result.headline || 'Your Expertise Snapshot, with the evidence.',
    bodyHtml,
    bodyText,
    unsubUrl,
  });
  return { html, text, subject: `${name}, your Expertise Snapshot™ is ready` };
}

// Printable page for the "Download My Free Snapshot" link.
export function snapshotPage({ result, resultsUrl }) {
  const { bodyHtml } = snapshotBody(result, { resultsUrl });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(result.first_name || 'Your')} Expertise Snapshot™</title>
<style>body{margin:0;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#182033;line-height:1.55}
.sheet{max-width:760px;margin:24px auto;background:#fff;border:1px solid #dfe3e9;border-radius:16px;padding:36px 40px}
.top{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#8a6a09;margin-bottom:6px}
h1{font-family:Georgia,serif;font-size:32px;line-height:1.1;margin:0 0 18px;color:#0b1730}
.print{display:inline-block;margin:0 0 18px;padding:10px 16px;border-radius:8px;background:#0b1730;color:#fff;font-weight:800;text-decoration:none;cursor:pointer;border:0}
@media print{.print{display:none}.sheet{border:0;margin:0;padding:0}body{background:#fff}}
@media(max-width:640px){.sheet{margin:0;border-radius:0;padding:24px 18px}}</style></head>
<body><div class="sheet"><div class="top">Expertise Extraction Engine™</div><h1>Your Expertise Snapshot™</h1>
<button class="print" onclick="window.print()">Save as PDF / Print</button>
${bodyHtml}</div></body></html>`;
}
