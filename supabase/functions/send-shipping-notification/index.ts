import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, sendResend, logEmail, buildPdf, SELLER, u8ToBase64 } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id, tracking_number } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);

    const sb = admin();
    const { data: order, error } = await sb
      .from('orders').select('*, order_items(*)').eq('id', order_id).single();
    if (error || !order) return json({ error: 'Order not found' }, 404);

    const tracking = tracking_number ?? order.tracking_number ?? null;

    // Delivery note PDF
    const pdfBytes = await buildPdf({
      title: 'ใบส่งของ / DELIVERY NOTE',
      docNumber: `DN-${order.order_number}`,
      dateLabel: `วันที่ ${new Date().toISOString().slice(0, 10)}`,
      customer: {
        name: order.shipping_name ?? order.customer_name ?? '',
        phone: order.shipping_phone ?? order.customer_phone,
        email: order.customer_email,
        address: [order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(' '),
        company_name: order.company_name,
      },
      seller: SELLER,
      items: (order.order_items ?? []).map((it: { product_name: string; quantity: number; unit_price: number; subtotal: number }) => ({
        product_name: it.product_name, quantity: it.quantity, unit_price: it.unit_price, subtotal: it.subtotal,
      })),
      showVat: false,
      footerNote: tracking ? `เลขพัสดุ: ${tracking}` : 'ประมาณ 1-3 วันทำการ',
    });

    const path = `${order.order_number}.pdf`;
    await sb.storage.from('delivery-notes').upload(path, pdfBytes, {
      contentType: 'application/pdf', upsert: true,
    });

    const itemsHtml = (order.order_items ?? []).map((it: { product_name: string; quantity: number }) =>
      `<li>${escapeHtml(it.product_name)} × ${it.quantity}</li>`).join('');

    const trackUrl = `https://shop.entgroup.co.th/track/${encodeURIComponent(order.order_number)}`;
    const carrierUrl = order.tracking_url ?? null;

    const subject = `📦 จัดส่งแล้ว! — ${order.order_number}`;
    const html = `<div style="font-family:Sarabun,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#0f172a;">
      <div style="background:#0b1e3f;padding:20px;color:#fff;text-align:center;"><h1 style="margin:0;font-size:18px;">ENT Group IT Shop</h1></div>
      <div style="padding:24px;">
        <h2>📦 สินค้าของคุณถูกจัดส่งแล้ว</h2>
        <p>เรียน คุณ${escapeHtml(order.customer_name ?? '')},</p>
        ${order.shipping_provider ? `<p><b>ขนส่ง:</b> ${escapeHtml(order.shipping_provider)}</p>` : ''}
        ${tracking ? `<p><b>เลขพัสดุ:</b> <span style="font-family:monospace;">${escapeHtml(tracking)}</span></p>` : ''}
        <div style="margin:18px 0;text-align:center;">
          <a href="${trackUrl}" style="display:inline-block;background:#10B981;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">ติดตามพัสดุ / Track Package →</a>
          ${carrierUrl ? `<div style="margin-top:8px;font-size:12px;"><a href="${carrierUrl}" style="color:#0b1e3f;">ตรวจสอบที่บริษัทขนส่ง →</a></div>` : ''}
        </div>
        <p><b>รายการสินค้าที่จัดส่ง:</b></p>
        <ul>${itemsHtml}</ul>
        <p><b>ที่อยู่จัดส่ง:</b><br/>${escapeHtml([order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(' '))}</p>
        <p style="color:#475569;">ประมาณ 1-3 วันทำการ · สอบถามเพิ่มเติม โทร 02-045-6104</p>
      </div>
    </div>`;
    const { ok, data } = await sendResend({
      to: order.customer_email, subject, html,
      attachments: [{ filename: `DN-${order.order_number}.pdf`, content: u8ToBase64(pdfBytes) }],
    });
    await logEmail({ order_id, email_type: 'shipping_notification', recipient: order.customer_email, subject, ok, data });
    return json({ success: ok, id: data?.id }, ok ? 200 : 502);
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
