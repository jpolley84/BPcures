// api/_gmail-client.js
//
// Gmail OAuth2 + API helpers for the reply-agent cron.
//
// Required env vars:
//   GMAIL_OAUTH_CLIENT_ID       — from Google Cloud Console
//   GMAIL_OAUTH_CLIENT_SECRET   — from Google Cloud Console
//   GMAIL_OAUTH_REFRESH_TOKEN   — generated once via the OAuth flow
//   GMAIL_INBOX_ADDRESS         — defaults to braveworksrn@gmail.com
//
// One-time setup:
//   1. https://console.cloud.google.com/ → create project (or reuse)
//   2. Enable Gmail API
//   3. APIs & Services → Credentials → Create OAuth Client ID
//      • Application type: Desktop app (simplest for refresh-token flow)
//      • Save the client ID + secret
//   4. Run a one-shot OAuth-handshake script to mint a refresh token
//      against scope "https://www.googleapis.com/auth/gmail.modify"
//   5. Drop client_id / secret / refresh_token into Vercel env

import { google } from 'googleapis';

export function getGmailClient() {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail OAuth not configured — set GMAIL_OAUTH_CLIENT_ID / _CLIENT_SECRET / _REFRESH_TOKEN in env');
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

// List message IDs received in the last `hoursBack` hours.
// Optional filter: only those that are replies to drip emails (to keep
// the scan cheap and ignore unrelated mail).
export async function listRecentReplies(gmail, { hoursBack = 24, query } = {}) {
  // Gmail search query: anything received in the last N hours.
  // `newer_than:1d` is gmail's syntax; we add an `is:inbox` to skip Sent.
  const q = query || `newer_than:${Math.max(1, Math.ceil(hoursBack / 24))}d in:inbox`;
  const res = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: 100,
  });
  return res.data.messages || []; // [{ id, threadId }, ...]
}

// Fetch headers + plain-text body for a message id.
export async function getMessageContent(gmail, id) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  });
  const msg = res.data;
  const headers = (msg.payload?.headers || []).reduce((acc, h) => {
    acc[h.name.toLowerCase()] = h.value;
    return acc;
  }, {});
  const body = extractPlainText(msg.payload);
  return {
    id,
    threadId: msg.threadId,
    from: headers.from || '',
    to: headers.to || '',
    subject: headers.subject || '',
    inReplyTo: headers['in-reply-to'] || '',
    snippet: msg.snippet || '',
    body,
    receivedAt: new Date(Number(msg.internalDate)).toISOString(),
    labelIds: msg.labelIds || [],
  };
}

function extractPlainText(payload) {
  if (!payload) return '';
  // Single part with body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  // Multi-part — prefer text/plain
  const parts = payload.parts || [];
  const plain = parts.find((p) => p.mimeType === 'text/plain');
  if (plain?.body?.data) return decodeBase64Url(plain.body.data);
  // Recurse for nested multipart/alternative
  for (const p of parts) {
    if (p.parts) {
      const nested = extractPlainText(p);
      if (nested) return nested;
    }
  }
  // Fallback: any html stripped of tags
  const html = parts.find((p) => p.mimeType === 'text/html');
  if (html?.body?.data) {
    return decodeBase64Url(html.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function decodeBase64Url(s) {
  if (!s) return '';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

// Create a Gmail draft. The draft will appear in Joel's Drafts folder
// for review + manual send. `replyToMessageId` ensures the draft is
// threaded under the original reply.
export async function createDraftReply(gmail, {
  to,           // recipient email
  fromName,     // display name e.g. "Joel Polley, RN"
  fromAddress,  // sender email (Gmail account)
  subject,      // typically "Re: <original subject>"
  bodyText,     // plain text body
  threadId,     // Gmail threadId for proper threading
  inReplyTo,    // Message-ID header of the original
}) {
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
  ];
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
    lines.push(`References: ${inReplyTo}`);
  }
  lines.push('', bodyText);
  const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: { raw, threadId },
    },
  });
  return res.data; // { id, message: { id, threadId, ... } }
}

// Find or create a Gmail label and apply it to a message.
// Useful for marking messages as "processed by reply-agent" so we don't
// re-process them on the next cron fire.
export async function ensureLabel(gmail, name) {
  const list = await gmail.users.labels.list({ userId: 'me' });
  const found = (list.data.labels || []).find((l) => l.name === name);
  if (found) return found.id;
  const res = await gmail.users.labels.create({
    userId: 'me',
    requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
  });
  return res.data.id;
}

export async function labelMessage(gmail, messageId, labelId) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { addLabelIds: [labelId] },
  });
}
