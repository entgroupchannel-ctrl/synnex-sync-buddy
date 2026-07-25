/**
 * supabase/functions/generate-purchase-order/index.ts  (ไฟล์ใหม่ทั้งไฟล์)
 * รับ po_id → ดึงข้อมูลจาก purchase_orders + purchase_order_items → สร้าง PDF → อัปโหลดเข้า
 * storage bucket "purchase-orders" (สร้างไว้แล้ว) → บันทึก pdf_url กลับเข้า purchase_orders
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, SELLER, buildPurchaseOrderPdf } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { po_id } = await req.json();
    if (!po_id) return json({ error: 'po_id required' }, 400);

    const sb = admin();
    const { data: po, error } = await sb
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', po_id)
      .single();
    if (error || !po) return json({ error: 'Purchase order not found' }, 404);

    const today = new Date();
    const pdfBytes = await buildPurchaseOrderPdf({
      poNumber: po.po_number,
      dateLabel: `วันที่ ${today.toISOString().slice(0, 10)}`,
      distributor: po.distributor,
      buyer: SELLER,
      notes: po.notes ?? undefined,
      items: (po.purchase_order_items ?? []).map((it: {
        product_sku: string; product_name: string | null; quantity: number;
        cost_price: number; subtotal: number; ship_to_name: string; order_number: string;
      }) => ({
        product_sku: it.product_sku,
        product_name: it.product_name,
        quantity: it.quantity,
        cost_price: it.cost_price,
        subtotal: it.subtotal,
        ship_to_name: it.ship_to_name,
        order_number: it.order_number,
      })),
    });

    const path = `${po.po_number}.pdf`;
    const { error: upErr } = await sb.storage.from('purchase-orders').upload(path, pdfBytes, {
      contentType: 'application/pdf', upsert: true,
    });
    if (upErr) return json({ error: `upload failed: ${upErr.message}` }, 500);

    const { data: signed, error: signErr } = await sb.storage
      .from('purchase-orders').createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) return json({ error: `sign failed: ${signErr.message}` }, 500);
    const pdf_url = signed?.signedUrl ?? path;

    const { error: updErr } = await sb.from('purchase_orders').update({ pdf_url }).eq('id', po_id);
    if (updErr) return json({ error: `db update failed: ${updErr.message}` }, 500);

    return json({ success: true, pdf_url, po_number: po.po_number });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
