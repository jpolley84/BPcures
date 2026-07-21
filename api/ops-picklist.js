// /api/ops-picklist — streams a print-ready PDF packing list of every
// UNFULFILLED tea order, for the "Download packing list" button on /ops.
//
// One block per order: buyer name, full shipping address, order date, blend,
// every line item with quantity, order ref, and amount. Oldest order first so
// the ones waiting longest ship first. Reads the raw tea:order:* KV records so
// the full items array and full address are present (the /ops Orders tab only
// surfaces the first item).
//
// Auth: same X-Ops-Pass header + OPS_DASHBOARD_PASSWORD as the rest of /ops.
// Uses pdfkit's built-in Helvetica fonts (no font files), so it runs on
// Vercel serverless with nothing to bundle.
import PDFDocument from 'pdfkit';
import { kv } from '@vercel/kv';
import crypto from 'node:crypto';

const INK = '#2C2A26';
const MUTED = '#8A8275';
const SAGE = '#3F5A3C';
const CLAY = '#B85A36';
const BORDER = '#D9D2C4';

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a, 'utf8');
  const B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}
function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  const got = req.headers['x-ops-pass'];
  return !!expected && typeof got === 'string' && constantTimeEqual(got, expected);
}

const ref = (s) => String(s || '').slice(-8).toUpperCase();
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const dateLong = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'unknown date';
  return d.toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric' });
};

// Some order records carry an address in the name field (checkout autofill),
// which would print "Ship to: 206 West Shirley Avenue" with no person. Detect
// and fall back to the address's own line1 for the label.
function shipName(o) {
  const raw = String(o.name || '').trim();
  if (raw && !/^\d/.test(raw) && !(o.address && raw === o.address.line1)) return raw;
  return '(name not on file)';
}

function addressLines(a) {
  if (!a) return ['(no shipping address on file)'];
  const out = [];
  if (a.line1) out.push(a.line1);
  if (a.line2) out.push(a.line2);
  const cityLine = [a.city, a.state].filter(Boolean).join(', ') + (a.postal_code ? ` ${a.postal_code}` : '');
  if (cityLine.trim()) out.push(cityLine.trim());
  if (a.country && a.country !== 'US') out.push(a.country);
  return out.length ? out : ['(no shipping address on file)'];
}

async function loadUnfulfilled() {
  const orders = [];
  let cursor = '0';
  let guard = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'tea:order:*', count: 500 });
    cursor = next;
    for (const key of batch) {
      const o = await kv.get(key);
      if (o && !o.fulfilled) orders.push(o);
    }
  } while (cursor !== '0' && ++guard < 20);
  orders.sort((a, b) => new Date(a.at) - new Date(b.at)); // oldest first
  return orders;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  let orders;
  try {
    orders = await loadUnfulfilled();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read orders: ' + err.message });
  }

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    bufferPages: true,
    info: { Title: 'BraveWorks Tea — Packing List', Author: 'BraveWorks RN', Subject: 'Unfulfilled tea orders to ship' },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {
    const buf = Buffer.concat(chunks);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tea-packing-list-${stamp}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(buf);
  });
  doc.on('error', () => { try { res.status(500).end(); } catch { /* already sent */ } });

  const { left, right } = doc.page.margins;
  const contentW = doc.page.width - left - right;

  // ── Header ──
  doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(9)
    .text('BRAVEWORKS RN · TEA PACKING LIST', left, 46, { characterSpacing: 1.4 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(20)
    .text(`${orders.length} order${orders.length === 1 ? '' : 's'} to ship`, left, 60);
  doc.fillColor(MUTED).font('Helvetica').fontSize(10)
    .text(`Generated ${dateLong(Date.now())} · oldest orders first`, left, 86);
  doc.moveTo(left, 106).lineTo(left + contentW, 106).strokeColor(BORDER).lineWidth(1).stroke();

  let y = 122;

  if (orders.length === 0) {
    doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(14)
      .text('Nothing to ship. Every tea order is fulfilled.', left, y);
    doc.end();
    return;
  }

  const blockGap = 16;

  orders.forEach((o, i) => {
    const items = Array.isArray(o.items) && o.items.length ? o.items : [{ name: o.blend === 'satin' ? 'SVUTU Satin' : 'SVUTU Steady', qty: 1 }];
    const addr = addressLines(o.address);
    // Estimate block height so we page-break cleanly instead of splitting a card.
    const blockH = 34 + addr.length * 13 + items.length * 14 + 22;
    if (y + blockH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    const boxTop = y;
    // number chip
    doc.fillColor(SAGE).font('Helvetica-Bold').fontSize(11)
      .text(`${i + 1}.`, left, y + 2, { width: 22 });

    const colX = left + 24;
    const colW = contentW - 24;

    // name + ref + date row
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(shipName(o), colX, y, { width: colW - 150, continued: false });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
      .text(`#${ref(o.sessionId)}  ·  ordered ${dateLong(o.at)}`, colX + colW - 150, y + 2, { width: 150, align: 'right' });
    y += 18;

    // SHIP TO
    doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(7.5).text('SHIP TO', colX, y, { characterSpacing: 1 });
    y += 11;
    doc.fillColor(INK).font('Helvetica').fontSize(11);
    addr.forEach((line) => { doc.text(line, colX, y, { width: colW }); y += 13; });

    // items + amount
    y += 3;
    doc.fillColor(CLAY).font('Helvetica-Bold').fontSize(7.5).text('PACK', colX, y, { characterSpacing: 1 });
    y += 11;
    items.forEach((it) => {
      const blend = /satin/i.test(it.name) ? '  [SATIN]' : /steady/i.test(it.name) ? '  [STEADY]' : '';
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
        .text(`${it.qty || 1} x `, colX, y, { continued: true })
        .font('Helvetica').text(`${it.name}${blend}`, { width: colW });
      y += 14;
    });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
      .text(`Paid ${money(o.amountCents)}${o.email ? '  ·  ' + o.email : ''}`, colX, y);
    y += 14;

    // divider
    doc.moveTo(left, y + 2).lineTo(left + contentW, y + 2).strokeColor(BORDER).lineWidth(0.75).stroke();
    y += blockGap;
  });

  // page numbers
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
      .text(`Page ${p + 1} of ${range.count}`, left, doc.page.height - 38, { width: contentW, align: 'center' });
  }

  doc.end();
}
