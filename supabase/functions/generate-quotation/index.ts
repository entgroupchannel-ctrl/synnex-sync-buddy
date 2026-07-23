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

    const docNumber = `QT-${order.order_number}`;
    const today = new Date();
    const expiry = new Date(today.getTime() + 7 * 86400_000);

    const pdfBytes = await buildPdf({
      title: 'ใบเสนอราคา / QUOTATION',
      docNumber,
      dateLabel: `วันที่ ${today.toISOString().slice(0, 10)}`,
      expiryLabel: `ยืนยันภายใน ${expiry.toISOString().slice(0, 10)} (7 วัน)`,
      customer: {
        name: order.customer_name ?? '',
        phone: order.customer_phone,
        email: order.customer_email,
        address: [order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(' '),
        company_name: order.company_name,
        tax_id: order.tax_id,
      },
      seller: SELLER,
      items: (order.order_items ?? []).map((it: { product_name: string; quantity: number; unit_price: number; subtotal: number }) => ({
        product_name: it.product_name, quantity: it.quantity, unit_price: it.unit_price, subtotal: it.subtotal,
      })),
      showVat: true,
      footerNote: 'เงื่อนไข: ราคานี้ยังไม่รวมค่าจัดส่งกรณีพิเศษ · ราคายืนยัน 7 วันนับจากวันที่ออกใบเสนอราคา',
    });

    const path = `${order.order_number}.pdf`;
    console.log('[generate-quotation] uploading', path, 'bytes=', pdfBytes.byteLength);
    const { data: upData, error: upErr } = await sb.storage.from('quotations').upload(path, pdfBytes, {
      contentType: 'application/pdf', upsert: true,
    });
    console.log('[generate-quotation] upload result', { upData, upErr });
    if (upErr) return json({ error: `upload failed: ${upErr.message}` }, 500);

    // Bucket is private — create a long-lived signed URL for admin access
    const { data: signed, error: signErr } = await sb.storage
      .from('quotations').createSignedUrl(path, 60 * 60 * 24 * 365);
    console.log('[generate-quotation] signed url', { signed, signErr });
    const quotation_url = signed?.signedUrl ?? path;

    console.log('[generate-quotation] updating orders.quotation_url', { order_id, quotation_url });
    const { data: updData, error: updErr } = await sb
      .from('orders').update({ quotation_url }).eq('id', order_id).select('id, quotation_url');
    console.log('[generate-quotation] update result', { updData, updErr });
    if (updErr) return json({ error: `db update failed: ${updErr.message}` }, 500);

    const subject = `ใบเสนอราคา ENT Group — ${docNumber}`;
    const html = emailHtml({
      title: 'ใบเสนอราคาของคุณพร้อมแล้ว',
      body: `เรียน คุณ${escapeHtml(order.customer_name ?? '')},<br/>แนบไฟล์ใบเสนอราคาเลขที่ <b>${docNumber}</b> มาด้วย ยืนยันภายใน 7 วัน`,
      cta: null,
    });
    const { ok, data } = await sendResend({
      to: order.customer_email, subject, html,
      attachments: [{ filename: `${docNumber}.pdf`, content: u8ToBase64(pdfBytes) }],
    });
    await logEmail({ order_id, email_type: 'quotation', recipient: order.customer_email, subject, ok, data });
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
function emailHtml(o: { title: string; body: string; cta: { label: string; href: string } | null }) {
  return `<div style="font-family:Sarabun,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#0f172a;">
    <div style="background:#0b1e3f;padding:20px;color:#fff;text-align:center;"><h1 style="margin:0;font-size:18px;">ENT Group IT Shop</h1></div>
    <div style="padding:24px;"><h2>${o.title}</h2><p>${o.body}</p>${o.cta ? `<div style="text-align:center;margin-top:16px;"><a href="${o.cta.href}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">${o.cta.label}</a></div>` : ''}</div>
    <div style="background:#f8fafc;padding:14px;text-align:center;font-size:12px;color:#64748b;">โทร: 02-045-6104 · info@entgroup.co.th</div>
  </div>`;
}
