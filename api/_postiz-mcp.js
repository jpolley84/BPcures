// _postiz-mcp.js — minimal MCP client for Postiz's HTTP-streamable MCP server.
// Handles session init + JSON-RPC tool calls. Used by postiz-cron.js to call
// generateImageTool (and later generateVideoTool) since these are not exposed
// on Postiz's REST public API.
//
// Auth: same Postiz API key works for both REST and MCP endpoints.
// Session lifecycle: each cron run inits its own session, calls one or two
// tools, then exits. Postiz MCP server tracks the session-id header.
//
// Underscore prefix = private module, not a Vercel endpoint.

const POSTIZ_MCP_URL = 'https://mcp.postiz.com/mcp';
const PROTOCOL_VERSION = '2025-03-26';

let _msgId = 1;
function nextId() { return _msgId++; }

// Parse the response body, which can be either pure JSON or an SSE stream.
async function parseResponse(res) {
  const text = await res.text();
  // Streamable HTTP responses are sometimes JSON, sometimes "data: <json>\n\n" SSE.
  // Try direct JSON first.
  try {
    return JSON.parse(text);
  } catch {
    // Try SSE format — extract first "data: " line.
    const m = text.match(/^data:\s*(\{[\s\S]*?\})\s*$/m);
    if (m) {
      try { return JSON.parse(m[1]); } catch {}
    }
    // Fallback: surface raw text in error.
    throw new Error(`MCP response not JSON: ${text.slice(0, 250)}`);
  }
}

async function mcpFetch(payload, headers = {}) {
  const res = await fetch(POSTIZ_MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: process.env.POSTIZ_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  return res;
}

// ─── Session init ─────────────────────────────────────────────────────
// Returns the session ID. Required for all subsequent calls.
export async function initSession() {
  const res = await mcpFetch({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'bpquiz-cron', version: '1.0.0' },
    },
  });
  const sessionId = res.headers.get('mcp-session-id');
  if (!sessionId) {
    const body = await res.text();
    throw new Error(`MCP init: no session-id in response. Status ${res.status}, body: ${body.slice(0, 200)}`);
  }
  // Send initialized notification (per MCP spec).
  await mcpFetch(
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { 'Mcp-Session-Id': sessionId }
  );
  return sessionId;
}

// ─── Tool call ────────────────────────────────────────────────────────
export async function callTool(sessionId, toolName, args) {
  const res = await mcpFetch(
    {
      jsonrpc: '2.0',
      id: nextId(),
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    },
    { 'Mcp-Session-Id': sessionId }
  );
  const parsed = await parseResponse(res);
  if (parsed.error) {
    throw new Error(`MCP ${toolName} error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
  }
  return parsed.result;
}

// ─── Convenience: generate an image and return its public URL ─────────
// Creates a session if one isn't passed in. Returns { id, path } from Postiz.
// `path` is a public URL we can attach to posts. `id` is the internal Postiz
// media reference.
export async function generateImage(prompt, sessionId = null) {
  const sid = sessionId || (await initSession());
  const result = await callTool(sid, 'generateImageTool', { prompt });
  // Tool result is wrapped: { content: [{ type: 'text', text: JSON-stringified output }], structuredContent: { id, path } } | etc.
  // Try structuredContent first (newest MCP spec), fall back to parsed text.
  if (result?.structuredContent?.id && result?.structuredContent?.path) {
    return result.structuredContent;
  }
  if (result?.content?.[0]?.text) {
    try {
      const parsed = JSON.parse(result.content[0].text);
      if (parsed.id && parsed.path) return parsed;
    } catch {}
  }
  throw new Error(`generateImage: unexpected response shape: ${JSON.stringify(result).slice(0, 250)}`);
}

// ─── Convenience: generate a video ────────────────────────────────────
// Reserved for high-leverage days. Joel's plan: 10 videos/mo budget.
// `identifier` comes from generateVideoOptions (e.g., 'image-text-slides' or 'veo3').
export async function generateVideo({ identifier, output = 'vertical', customParams = [] }, sessionId = null) {
  const sid = sessionId || (await initSession());
  const result = await callTool(sid, 'generateVideoTool', { identifier, output, customParams });
  if (result?.structuredContent?.url) return result.structuredContent;
  if (result?.content?.[0]?.text) {
    try {
      const parsed = JSON.parse(result.content[0].text);
      if (parsed.url) return parsed;
    } catch {}
  }
  throw new Error(`generateVideo: unexpected response shape: ${JSON.stringify(result).slice(0, 250)}`);
}
