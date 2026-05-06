import { sendPurchaseConfirmation, TIER_CONFIG } from './purchase-confirmation.js';

const DEFAULT_TEST_EMAIL = 'braveworksrn@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.method === 'GET' ? req.query : (req.body || {});
  const { tier: rawTier, email: rawEmail, name, apology } = params;
  const apologyMode = apology === true || apology === 'true' || apology === 1 || apology === '1';

  // Accept numeric tiers (1/2/3) AND the string tier keys ('vip', '1+pt-stack',
  // '2+pt-stack') so we can resend the VIP welcome to buyers whose webhook
  // missed delivery.
  // Order matters — check string keys FIRST, since parseInt('2+pt-stack')
  // returns 2 (parses leading digits) and would shadow the string key.
  let tier;
  if (typeof rawTier === 'string' && TIER_CONFIG[rawTier]) {
    tier = rawTier;
  } else {
    const numTier = parseInt(rawTier, 10);
    if (numTier && [1, 2, 3].includes(numTier)) {
      tier = numTier;
    } else {
      return res.status(400).json({
        error: 'tier parameter required (1, 2, 3, or a string key like "vip")',
        usage: 'POST /api/test-purchase-email with { "tier": "vip", "email": "you@example.com" }',
        validTiers: Object.keys(TIER_CONFIG).map((t) => ({ tier: t, product: TIER_CONFIG[t].product })),
      });
    }
  }

  const email = rawEmail || DEFAULT_TEST_EMAIL;

  try {
    await sendPurchaseConfirmation({
      email,
      name: name || 'Joel',
      tier,
      apologyMode,
    });

    return res.status(200).json({
      success: true,
      tier,
      product: TIER_CONFIG[tier].product,
      sentTo: email,
      subject: apologyMode
        ? `Sorry — here's your kit (plus the full Pressure Triangle Stack as my apology)`
        : TIER_CONFIG[tier].subject,
      apologyMode,
    });
  } catch (err) {
    console.error('test-purchase-email failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
