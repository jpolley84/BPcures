// audit_resend_14d.mjs — Pull recent emails from Resend
const KEY = process.env.RESEND_API_KEY;
if (!KEY) { console.error('NO RESEND_API_KEY'); process.exit(1); }

const fourteenDaysAgo = Date.now() - 14 * 86400 * 1000;

async function fetchEmails(cursor) {
  const url = new URL('https://api.resend.com/emails');
  url.searchParams.set('limit', '100');
  if (cursor) url.searchParams.set('after', cursor);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

const all = [];
let cursor = null;
let page = 0;
let stop = false;
while (!stop) {
  page++;
  let data;
  try { data = await fetchEmails(cursor); } catch (e) { console.error(e.message); break; }
  if (!data.data || !Array.isArray(data.data)) {
    console.error('Resend response unexpected shape:', JSON.stringify(data).slice(0, 500));
    break;
  }
  for (const em of data.data) {
    const t = new Date(em.created_at).getTime();
    if (t < fourteenDaysAgo) { stop = true; break; }
    all.push(em);
  }
  if (stop || !data.has_more) break;
  cursor = data.data[data.data.length - 1]?.id || null;
  if (!cursor) break;
  if (page > 20) break;
}

const sent = all.length;
let bounced = 0, complained = 0, delivered = 0;
for (const em of all) {
  if (em.last_event === 'bounced') bounced++;
  if (em.last_event === 'complained') complained++;
  if (em.last_event === 'delivered') delivered++;
}

const recent5 = all.slice(0, 5).map(em => ({
  ts: em.created_at,
  to: Array.isArray(em.to) ? em.to[0] : em.to,
  subject: em.subject,
  status: em.last_event,
}));

console.log(JSON.stringify({
  total_sent: sent,
  delivered, bounced, complained,
  bounce_rate: sent ? ((bounced / sent) * 100).toFixed(2) + '%' : 'n/a',
  complaint_rate: sent ? ((complained / sent) * 100).toFixed(2) + '%' : 'n/a',
  most_recent_5: recent5,
}, null, 2));
