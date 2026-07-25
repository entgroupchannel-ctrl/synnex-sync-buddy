/**
 * supabase/functions/send-po-email/index.ts
 * ส่งใบสั่งซื้อ (PO) ทางอีเมลถึง distributor พร้อมลิงก์ PDF (สร้าง signed URL ใหม่ทุกครั้ง)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, sendResend, FROM_EMAIL, buildPurchaseOrderPdf, SELLER } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { po_id, to_email, to_name, subject, body_html } = await req.json();
    if (!po_id || !to_email) return json({ error: 'po_id และ to_email จำเป็นต้องมี' }, 400);

    const sb = admin();
    const { data: po, error } = await sb
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', po_id)
      .single();
    if (error || !po) return json({ error: 'ไม่พบใบสั่งซื้อนี้' }, 404);

    const path = `${po.po_number}.pdf`;

    // ถ้ายังไม่เคยสร้าง PDF ให้สร้างให้เลย จะได้ไม่ส่งอีเมลเปล่า
    const { data: existing } = await sb.storage.from('purchase-orders').list('', { search: path });
    if (!existing?.some((f) => f.name === path)) {
      const pdfBytes = await buildPurchaseOrderPdf({
        poNumber: po.po_number,
        dateLabel: `วันที่ ${new Date().toISOString().slice(0, 10)}`,
        distributor: po.distributor,
        buyer: SELLER,
        notes: po.notes ?? undefined,
        items: (po.purchase_order_items ?? []).map((it: Record<string, unknown>) => ({
          product_sku: it.product_sku as string,
          product_name: (it.product_name as string) ?? null,
          quantity: it.quantity as number,
          cost_price: it.cost_price as number,
          subtotal: it.subtotal as number,
          ship_to_name: it.ship_to_name as string,
          order_number: it.order_number as string,
        })),
      });
      const { error: upErr } = await sb.storage.from('purchase-orders').upload(path, pdfBytes, {
        contentType: 'application/pdf', upsert: true,
      });
      if (upErr) return json({ error: `อัปโหลด PDF ไม่สำเร็จ: ${upErr.message}` }, 500);
    }

    const { data: signed, error: signErr } = await sb.storage
      .from('purchase-orders').createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signErr) return json({ error: `สร้างลิงก์ PDF ไม่สำเร็จ: ${signErr.message}` }, 500);
    const pdfUrl = signed!.signedUrl;

    const finalSubject = subject || `ใบสั่งซื้อ ${po.po_number} — ENT Group`;
    const html = `
      <div style="font-family: 'IBM Plex Sans Thai', Arial, sans-serif; max-width:620px; margin:0 auto; color:#1e293b;">
        <div style="background:#0B2A4A; padding:20px; text-align:center;">
          <span style="color:#fff; font-size:18px; font-weight:bold;">ENT Group IT Shop</span>
        </div>
        <div style="padding:24px; background:#f8fafc;">
          ${body_html || `<p>เรียน ${to_name || 'ทีมงาน'},</p><p>ขอส่งใบสั่งซื้อเลขที่ <b>${po.po_number}</b> รบกวนตรวจสอบและยืนยันกลับด้วยครับ/ค่ะ</p>`}
          <table style="width:100%; margin:16px 0; font-size:14px;">
            <tr><td style="color:#64748b;">เลขที่ใบสั่งซื้อ</td><td align="right"><b>${po.po_number}</b></td></tr>
            <tr><td style="color:#64748b;">Distributor</td><td align="right">${po.distributor}</td></tr>
            <tr><td style="color:#64748b;">จำนวนรายการ</td><td align="right">${(po.purchase_order_items ?? []).length}</td></tr>
            <tr><td style="color:#64748b;">ยอดรวม (ก่อน VAT)</td><td align="right">฿${Number(po.total_cost).toLocaleString('th-TH')}</td></tr>
          </table>
          <p style="margin:24px 0;">
            <a href="${pdfUrl}" style="background:#0B2A4A; color:#fff; padding:11px 22px; border-radius:6px; text-decoration:none; font-weight:bold;">
              ดาวน์โหลดใบสั่งซื้อ (PDF)
            </a>
          </p>
          <p style="color:#64748b; font-size:12px;">ลิงก์นี้มีอายุ 30 วัน</p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
          <p style="color:#64748b; font-size:12px; margin:0;">
            ${SELLER.name}<br/>${SELLER.address}<br/>โทร 02-045-6104
          </p>
        </div>
      </div>
    `;

    const { ok, data } = await sendResend({ to: to_email, from: FROM_EMAIL, subject: finalSubject, html });

    await sb.from('email_logs').insert({
      order_id: null,
      email_type: 'purchase_order',
      recipient: to_email,
      subject: finalSubject,
      status: ok ? 'sent' : 'failed',
      resend_message_id: (data as { id?: string })?.id ?? null,
      error_message: ok ? null : JSON.stringify(data),
    });

    if (!ok) return json({ error: `ส่งอีเมลไม่สำเร็จ: ${JSON.stringify(data)}` }, 500);

    await sb.from('purchase_orders').update({ status: 'sent', pdf_url: pdfUrl }).eq('id', po_id);

    return json({ success: true, pdf_url: pdfUrl });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
