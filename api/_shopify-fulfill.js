// api/_shopify-fulfill.js — push fulfillment OUT to Shopify.
//
// WHY (2026-09-08): the Shopify bridge was one-way. Orders flowed IN to the KV
// ledger, but marking one shipped on our side never went back, so Shopify sat
// on 14 orders showing "Unfulfilled" for three weeks while the buyers had
// already been emailed that their tea was on its way. Cosmetic (Shopify is our
// own store, so there is no seller penalty) but it makes the order status page
// lie to any customer who checks it.
//
// Called from the two places that mark a tea order shipped:
//   scripts/tea-mark-fulfilled.mjs  and  api/ops-orders.js (POST status)
//
// Env:
//   SHOPIFY_ADMIN_TOKEN   required (shpat_…). Without it this is a silent no-op.
//   SHOPIFY_SHOP          defaults to h1vygf-kk.myshopify.com
//   SHOPIFY_FULFILL_NOTIFY=1  let Shopify email the buyer. OFF by default: we
//                         send our own shipped notice (_tea-shipped-email.js),
//                         and two "your order shipped" emails is worse than none.
//
// NEVER throws into the caller. A Shopify outage must not stop an order being
// marked shipped on our side — the ledger is the source of truth, this is a
// best-effort mirror.

const API_VERSION = '2025-01';

function shopDomain() {
  return process.env.SHOPIFY_SHOP || 'h1vygf-kk.myshopify.com';
}

async function gql(query, variables) {
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const r = await fetch(`https://${shopDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`Shopify HTTP ${r.status}`);
  if (j?.errors?.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  return j?.data;
}

// A Shopify order is fulfilled through its fulfillment ORDERS, not directly.
// Only OPEN / IN_PROGRESS ones can be actioned; anything else is already done.
export async function fulfillShopifyOrder({ shopifyOrderId, notifyCustomer = null } = {}) {
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!token) return { ok: false, skipped: true, reason: 'no_admin_token' };
  if (!shopifyOrderId) return { ok: false, skipped: true, reason: 'no_order_id' };

  const notify = notifyCustomer === null ? process.env.SHOPIFY_FULFILL_NOTIFY === '1' : !!notifyCustomer;
  const gid = `gid://shopify/Order/${String(shopifyOrderId).replace(/\D/g, '')}`;

  try {
    const data = await gql(
      `query($id: ID!) {
         order(id: $id) {
           id
           displayFulfillmentStatus
           fulfillmentOrders(first: 20) { nodes { id status } }
         }
       }`,
      { id: gid },
    );
    const order = data?.order;
    if (!order) return { ok: false, skipped: true, reason: 'order_not_found' };

    const actionable = (order.fulfillmentOrders?.nodes || [])
      .filter((n) => n.status === 'OPEN' || n.status === 'IN_PROGRESS');
    if (!actionable.length) {
      return { ok: true, skipped: true, reason: 'already_fulfilled', status: order.displayFulfillmentStatus };
    }

    const res = await gql(
      `mutation($f: FulfillmentInput!) {
         fulfillmentCreate(fulfillment: $f) {
           fulfillment { id status }
           userErrors { field message }
         }
       }`,
      {
        f: {
          notifyCustomer: notify,
          lineItemsByFulfillmentOrder: actionable.map((n) => ({ fulfillmentOrderId: n.id })),
        },
      },
    );
    const out = res?.fulfillmentCreate;
    const errs = out?.userErrors || [];
    if (errs.length) return { ok: false, reason: errs.map((e) => e.message).join('; ') };
    return { ok: true, fulfillmentId: out?.fulfillment?.id, status: out?.fulfillment?.status, notified: notify };
  } catch (err) {
    console.error('fulfillShopifyOrder failed (non-fatal)', shopifyOrderId, err.message);
    return { ok: false, reason: err.message };
  }
}

// Convenience for callers holding a ledger row: only Shopify-sourced orders
// have anything to push, and only when we know the Shopify order id.
export async function syncFulfillmentToShopify(order) {
  if (!order || !String(order.source || '').startsWith('shopify')) {
    return { ok: false, skipped: true, reason: 'not_a_shopify_order' };
  }
  const id = order.shopifyOrderId || String(order.sessionId || '').replace(/^shopify-/, '');
  return fulfillShopifyOrder({ shopifyOrderId: id });
}
