// /api/reply-agent — daily Vercel cron that scans Joel's inbox for replies
// to the drip emails, classifies them, drafts responses in his voice,
// creates Gmail drafts (saved to Drafts folder for review), and sends Joel
// a summary digest of what came in and what's drafted vs needs his eyes.
//
// Schedule: see vercel.json — "0 1 * * *" = 1:00 UTC daily = 8 PM CT.
//
// Required env vars (all already documented in _gmail-client.js comments):
//   GMAIL_OAUTH_CLIENT_ID
//   GMAIL_OAUTH_CLIENT_SECRET
//   GMAIL_OAUTH_REFRESH_TOKEN
//   ANTHROPIC_API_KEY
//   RESEND_API_KEY      (already configured)
//   CRON_AUTH_TOKEN     (already configured)
// Optional:
//   GMAIL_INBOX_ADDRESS         — defaults to braveworksrn@gmail.com
//   REPLY_AGENT_DIGEST_TO       — defaults to brave.works.marketing@gmail.com
//   REPLY_AGENT_FROM_NAME       — defaults to 'Joel Polley, RN'
//
// Idempotency: each processed Gmail message gets the label
// "BraveWorks/Replied" so subsequent cron fires skip it.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import {
  getGmailClient,
  listRecentReplies,
  getMessageContent,
  createDraftReply,
  ensureLabel,
  labelMessage,
} from './_gmail-client.js';
import { classifyAndDraft } from './_reply-classifier.js';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 300 };

const INBOX = process.env.GMAIL_INBOX_ADDRESS || 'braveworksrn@gmail.com';
const DIGEST_TO = process.env.REPLY_AGENT_DIGEST_TO || 'brave.works.marketing@gmail.com';
const FROM_NAME = process.env.REPLY_AGENT_FROM_NAME || 'Joel Polley, RN';
const PROCESSED_LABEL = 'BraveWorks/Replied';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Extract sender's email from "Name <email@x.com>" format
function parseFromAddress(fromHeader) {
  const m = String(fromHeader || '').match(/<([^>]+)>/);
  if (m) return m[1].toLowerCase().trim();
  return String(fromHeader || '').toLowerCase().trim();
}

// Infer which drip Day they were replying to. If the subject contains
// a known day-N marker or matches a known drip subject, return the day.
function inferDripDay(subject) {
  if (!subject) return null;
  const s = subject.toLowerCase();
  const dayMatch = s.match(/day\s*([0-9]{1,2})/);
  if (dayMatch) return Number(dayMatch[1]);
  // Match known subjects (refined Days 1-7)
  if (s.includes('3 lies your doctor')) return 1;
  if (s.includes('poison sitting on your counter')) return 2;
  if (s.includes('marlene')) return 3;
  if (s.includes('hidden ratio')) return 4;
  if (s.includes('savory')) return 5;
  if (s.includes('hidden corner')) return 6;
  if (s.includes('shifts already happening')) return 7;
  return null;
}

function renderDigestHtml({ stats, drafted, needsYou, urgent }) {
  const draftedRows = drafted.map((d) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #EFE9DA;vertical-align:top;width:160px;">
        <div style="font-size:13px;font-weight:700;color:#2C2A26;">${escapeHtml(d.senderName || d.senderEmail)}</div>
        <div style="font-size:11px;color:#9C9485;">${escapeHtml(d.bucket)}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #EFE9DA;font-size:13px;line-height:1.5;color:#2C2A26;">
        <em style="color:#5B564C;">they said:</em> "${escapeHtml((d.snippet || '').slice(0, 180))}"<br>
        <em style="color:#5B564C;margin-top:4px;display:inline-block;">you'll say:</em> ${escapeHtml((d.draft || '').slice(0, 240))}…
        <br><a href="https://mail.google.com/mail/u/0/#drafts" style="color:#3F5A3C;font-size:12px;font-weight:600;">open drafts →</a>
      </td>
    </tr>
  `).join('');

  const needsRows = needsYou.map((n) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F5E4DA;vertical-align:top;width:160px;">
        <div style="font-size:13px;font-weight:700;color:#2C2A26;">${escapeHtml(n.senderName || n.senderEmail)}</div>
        <div style="font-size:11px;color:#B85A36;">${escapeHtml(n.bucket)}${n.urgentTopic ? ' · 🚨' : ''}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F5E4DA;font-size:13px;line-height:1.5;color:#2C2A26;">
        <em style="color:#5B564C;">they said:</em> "${escapeHtml((n.snippet || '').slice(0, 240))}"<br>
        ${n.urgentTopic ? `<div style="color:#B85A36;font-weight:700;margin-top:6px;">⚠ ${escapeHtml(n.urgentTopic)}</div>` : ''}
        <div style="font-size:12px;color:#5B564C;margin-top:6px;">${escapeHtml(n.reasoning)}</div>
      </td>
    </tr>
  `).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#2C2A26;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
<tr><td style="padding:24px 28px;">
<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;">Reply Roundup</div>
<h1 style="font-family:Georgia,serif;font-size:24px;margin:6px 0 18px;color:#2C2A26;">${stats.total} replies · ${stats.drafted} drafted · ${stats.needsYou} need you</h1>
${urgent.length > 0 ? `<div style="background:#F5E4DA;border:2px solid #B85A36;border-radius:8px;padding:12px 14px;margin:0 0 18px;">
  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:6px;">🚨 ${urgent.length} URGENT · review first</div>
  ${urgent.map((u) => `<div style="font-size:13px;color:#2C2A26;margin-top:4px;"><strong>${escapeHtml(u.senderName || u.senderEmail)}</strong> · ${escapeHtml(u.urgentTopic)}</div>`).join('')}
</div>` : ''}
${drafted.length > 0 ? `
<h2 style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:24px 0 8px;">✓ Drafted &amp; waiting in Gmail (${drafted.length})</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${draftedRows}</table>` : ''}
${needsYou.length > 0 ? `
<h2 style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;border-bottom:1px solid #F5E4DA;padding-bottom:6px;margin:24px 0 8px;">⚠ Need you (${needsYou.length})</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${needsRows}</table>` : ''}
<h2 style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:24px 0 8px;">Patterns today</h2>
<ul style="font-size:13px;color:#5B564C;line-height:1.7;margin:0;padding-left:22px;">
  <li>Total inbound replies scanned: ${stats.scanned}</li>
  <li>Already processed (skipped): ${stats.alreadyProcessed}</li>
  <li>By bucket: ${Object.entries(stats.byBucket).map(([k, v]) => `${k}=${v}`).join(' · ') || 'none'}</li>
  <li>Drip-day distribution: ${Object.entries(stats.byDripDay).map(([k, v]) => `D${k}=${v}`).join(' · ') || 'none'}</li>
</ul>
<p style="font-size:11px;color:#9C9485;margin:22px 0 0;">Drafts wait in your Gmail Drafts folder. Open Gmail → Drafts to review + send.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startedAt = Date.now();
  const stats = {
    scanned: 0,
    alreadyProcessed: 0,
    total: 0,
    drafted: 0,
    needsYou: 0,
    errors: 0,
    byBucket: {},
    byDripDay: {},
  };
  const drafted = [];
  const needsYou = [];
  const urgent = [];
  const errors = [];

  try {
    const gmail = getGmailClient();
    const processedLabelId = await ensureLabel(gmail, PROCESSED_LABEL);

    // Pull last 24h of inbound replies. We filter to anything that looks
    // like a reply (subject starts with "Re:") to keep volume reasonable.
    const messages = await listRecentReplies(gmail, {
      hoursBack: 24,
      query: 'newer_than:1d in:inbox subject:"Re:"',
    });
    stats.scanned = messages.length;

    for (const m of messages) {
      try {
        const msg = await getMessageContent(gmail, m.id);
        // Skip if already processed by this agent
        if (msg.labelIds.includes(processedLabelId)) {
          stats.alreadyProcessed++;
          continue;
        }
        // Skip if the message is FROM Joel (he replied to himself or it's a sent item)
        const senderEmail = parseFromAddress(msg.from);
        if (senderEmail === INBOX.toLowerCase()) continue;

        const dripDay = inferDripDay(msg.subject);
        if (dripDay) stats.byDripDay[dripDay] = (stats.byDripDay[dripDay] || 0) + 1;

        const classification = await classifyAndDraft({
          sender: msg.from,
          subject: msg.subject,
          body: msg.body || msg.snippet,
          dayContext: dripDay ? `Day ${dripDay}` : null,
        });

        stats.byBucket[classification.bucket] = (stats.byBucket[classification.bucket] || 0) + 1;
        stats.total++;

        const senderName = (msg.from.match(/^([^<]+)</) || [, msg.from])[1].trim();

        if (!classification.escalate && classification.draft) {
          // Create Gmail draft
          try {
            await createDraftReply(gmail, {
              to: senderEmail,
              fromName: FROM_NAME,
              fromAddress: INBOX,
              subject: msg.subject.toLowerCase().startsWith('re:') ? msg.subject : `Re: ${msg.subject}`,
              bodyText: classification.draft,
              threadId: msg.threadId,
              inReplyTo: msg.inReplyTo || `<${msg.id}@mail.gmail.com>`,
            });
            stats.drafted++;
            drafted.push({
              senderEmail, senderName,
              bucket: classification.bucket,
              snippet: msg.snippet || (msg.body || '').slice(0, 220),
              draft: classification.draft,
              dripDay,
            });
          } catch (draftErr) {
            console.error(`reply-agent: draft create failed for ${m.id}:`, draftErr.message);
            stats.errors++;
            errors.push({ id: m.id, error: draftErr.message });
          }
        } else {
          stats.needsYou++;
          const row = {
            senderEmail, senderName,
            bucket: classification.bucket,
            snippet: msg.snippet || (msg.body || '').slice(0, 240),
            reasoning: classification.reasoning,
            urgentTopic: classification.urgentTopic,
            dripDay,
          };
          needsYou.push(row);
          if (classification.urgentTopic) urgent.push(row);
        }

        // Mark message as processed so we don't re-classify on next fire
        await labelMessage(gmail, m.id, processedLabelId);
      } catch (innerErr) {
        stats.errors++;
        errors.push({ id: m.id, error: innerErr.message });
        console.error(`reply-agent: error on ${m.id}:`, innerErr.message);
      }
    }

    // Send digest via Resend
    if (stats.total > 0 || stats.errors > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const subject = stats.total === 0
        ? `Reply Roundup · 0 inbound · ${stats.errors} errors`
        : `Reply Roundup · ${stats.total} in · ${stats.drafted} drafted · ${stats.needsYou} need you${urgent.length ? ` · 🚨 ${urgent.length} URGENT` : ''}`;
      await resend.emails.send({
        from: 'BraveWorks Ops <noreply@bpquiz.com>',
        to: DIGEST_TO,
        replyTo: INBOX,
        subject,
        html: renderDigestHtml({ stats, drafted, needsYou, urgent }),
      });
    }

    return res.status(200).json({
      ok: true,
      stats,
      drafted: drafted.length,
      needsYou: needsYou.length,
      urgent: urgent.length,
      errors: errors.slice(0, 10),
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('reply-agent: fatal', err.stack || err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
