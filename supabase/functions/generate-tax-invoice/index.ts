import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, sendResend, logEmail, buildPdf, SELLER, u8ToBase64 } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);

    const sb = admin();
    const { data: order, error } = await sb
      .from('orders').select('*, order_items(*)').eq('id', order_id).single();
    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (!order.tax_id) {
      return json({ error: 'กรุณาระบุเลขประจำตัวผู้เสียภาษีก่อนออกใบกำกับภาษี' }, 400);
    }

    const docNumber = `INV-${order.order_number}`;
    const today = new Date();

    const pdfBytes = await buildPdf({
      title: 'ใบกำกับภาษีเต็มรูปแบบ / TAX INVOICE',
      docNumber,
      dateLabel: `วันที่ ${today.toISOString().slice(0, 10)}`,
      customer: {
        name: order.customer_name ?? '',
        phone: order.customer_phone,
        email: order.customer_email,
        address: order.company_address || [order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(' '),
        company_name: order.company_name,
        tax_id: order.tax_id,
      },
      seller: SELLER,
      items: (order.order_items ?? []).map((it: { product_name: string; quantity: number; unit_price: number; subtotal: number }) => ({
        product_name: it.product_name, quantity: it.quantity, unit_price: it.unit_price, subtotal: it.subtotal,
      })),
      showVat: true,
      footerNote: 'เอกสารนี้เป็นใบกำกับภาษีเต็มรูปแบบตามมาตรา 86/4 แห่งประมวลรัษฎากร',
    });

    const path = `${order.order_number}.pdf`;
    const { error: upErr } = await sb.storage.from('tax-invoices').upload(path, pdfBytes, {
      contentType: 'application/pdf', upsert: true,
    });
    if (upErr) return json({ error: upErr.message }, 500);
    await sb.from('orders').update({ tax_invoice_url: path }).eq('id', order_id);

    const subject = `ใบกำกับภาษี ENT Group — ${docNumber}`;
    const html = `<div style="font-family:Sarabun,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#0f172a;">
      <div style="background:#0b1e3f;padding:20px;color:#fff;text-align:center;"><h1 style="margin:0;font-size:18px;">ENT Group IT Shop</h1></div>
      <div style="padding:24px;"><h2>ใบกำกับภาษี</h2><p>เรียน คุณ${escapeHtml(order.customer_name ?? '')},<br/>แนบไฟล์ใบกำกับภาษีเลขที่ <b>${docNumber}</b></p></div>
    </div>`;
    const { ok, data } = await sendResend({
      to: order.customer_email, subject, html,
      attachments: [{ filename: `${docNumber}.pdf`, content: u8ToBase64(pdfBytes) }],
    });
    await logEmail({ order_id, email_type: 'tax_invoice', recipient: order.customer_email, subject, ok, data });
    return json({ success: ok, id: data?.id, path }, ok ? 200 : 502);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
