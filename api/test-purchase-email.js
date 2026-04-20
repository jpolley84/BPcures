import { sendPurchaseConfirmation, TIER_CONFIG } from './purchase-confirmation.js';

const DEFAULT_TEST_EMAIL = 'braveworksrn@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.method === 'GET' ? req.query : (req.body || {});
  const { tier: rawTier, email: rawEmail, name } = params;

  const tier = parseInt(rawTier, 10);
  if (!tier || ![1, 2, 3].includes(tier)) {
    return res.status(400).json({
      error: 'tier parameter required (1, 2, or 3)',
      usage: 'POST /api/test-purchase-email with { "tier": 1, "email": "you@example.com" }',
      validTiers: Object.entries(TIER_CONFIG).map(([t, c]) => ({ tier: Number(t), product: c.product })),
    });
  }

  const email = rawEmail || DEFAULT_TEST_EMAIL;

  try {
    await sendPurchaseConfirmation({
      email,
      name: name || 'Joel',
      tier,
    });

    return res.status(200).json({
      success: true,
      tier,
      product: TIER_CONFIG[tier].product,
      sentTo: email,
      subject: TIER_CONFIG[tier].subject,
    });
  } catch (err) {
    console.error('test-purchase-email failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
