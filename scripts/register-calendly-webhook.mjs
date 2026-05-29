// One-shot: register the Calendly webhook subscription so invitee.created
// events POST to /api/calendly-webhook (which texts Joel). Idempotent-ish:
// lists existing subs first and skips if our callback URL is already there.
// Run AFTER the endpoint is deployed. 2026-05-28.

const TOKEN = process.env.CALENDLY_TOKEN;
const SECRET = process.env.CALENDLY_WEBHOOK_SECRET || 'd52e9245be996ce2469ac862b85e0e24';
const CALLBACK = `https://bpquiz.com/api/calendly-webhook?secret=${SECRET}`;

if (!TOKEN) { console.error('CALENDLY_TOKEN missing'); process.exit(1); }

const me = await (await fetch('https://api.calendly.com/users/me', {
  headers: { Authorization: 'Bearer ' + TOKEN },
})).json();
const org = me.resource.current_organization;
const user = me.resource.uri;

// Skip if already registered
const existing = await (await fetch(
  `https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(org)}&scope=organization`,
  { headers: { Authorization: 'Bearer ' + TOKEN } },
)).json();
const already = (existing.collection || []).find(w => (w.callback_url || '').startsWith('https://bpquiz.com/api/calendly-webhook'));
if (already) {
  console.log('Webhook already registered:', already.uri, '| state:', already.state);
  process.exit(0);
}

const r = await fetch('https://api.calendly.com/webhook_subscriptions', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: CALLBACK,
    events: ['invitee.created'],
    organization: org,
    user,
    scope: 'user',
  }),
});
const j = await r.json();
if (!r.ok) { console.error('✗ Registration failed:', JSON.stringify(j, null, 2)); process.exit(1); }
console.log('✓ Webhook registered');
console.log('   URI  :', j.resource.uri);
console.log('   State:', j.resource.state);
console.log('   Events:', JSON.stringify(j.resource.events));
if (j.resource.signing_key) {
  console.log('\\n   Signing key (optional — add as CALENDLY_WEBHOOK_SIGNING_KEY for sig verification):');
  console.log('   ' + j.resource.signing_key);
}
