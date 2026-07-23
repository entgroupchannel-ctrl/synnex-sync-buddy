import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, sendResend, logEmail } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);

    const sb = admin();
    const { data: order, error } = await sb
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single();
    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (!order.customer_email) return json({ error: 'No customer_email' }, 400);

    const itemsHtml = (order.order_items ?? []).map((it: {
      product_name: string; quantity: number; unit_price: number; subtotal: number;
    }) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eef2f7;">${escapeHtml(it.product_name)}</td>
        <td style="padding:10px;text-align:center;border-bottom:1px solid #eef2f7;">${it.quantity}</td>
        <td style="padding:10px;text-align:right;border-bottom:1px solid #eef2f7;">฿${Number(it.unit_price).toLocaleString('th-TH')}</td>
        <td style="padding:10px;text-align:right;border-bottom:1px solid #eef2f7;">฿${Number(it.subtotal).toLocaleString('th-TH')}</td>
      </tr>`).join('');

    const bankSection = order.payment_method === 'transfer' ? `
      <div style="margin-top:24px;padding:20px;background:#f0fdf9;border:1px solid #a7f3d0;border-radius:12px;">
        <h3 style="margin:0 0 12px;color:#065f46;">🏦 ข้อมูลการโอนเงิน</h3>
        <div style="display:block;">
          <div style="padding:12px;background:#fff;border:1px solid #d1fae5;border-radius:8px;margin-bottom:8px;">
            <p style="margin:2px 0;font-weight:bold;">ธนาคารกสิกรไทย (KBank)</p>
            <p style="margin:2px 0;font-family:monospace;font-weight:bold;">เลขที่บัญชี: 841-2-05851-9</p>
            <p style="margin:2px 0;">ชื่อบัญชี: บริษัท อี เอ็น ที กรุ๊ป จำกัด</p>
            <p style="margin:2px 0;color:#475569;font-size:13px;">สาขาบางเดื่อ ปทุมธานี · ออมทรัพย์</p>
          </div>
          <div style="padding:12px;background:#fff;border:1px solid #d1fae5;border-radius:8px;">
            <p style="margin:2px 0;font-weight:bold;">ธนาคารไทยพาณิชย์ (SCB)</p>
            <p style="margin:2px 0;font-family:monospace;font-weight:bold;">เลขที่บัญชี: 406-817747-1</p>
            <p style="margin:2px 0;">ชื่อบัญชี: บริษัท อี เอ็น ที กรุ๊ป จำกัด</p>
            <p style="margin:2px 0;color:#475569;font-size:13px;">สาขาบางเดื่อ (ปทุมธานี) · ออมทรัพย์</p>
          </div>
        </div>
        <p style="margin:12px 0 0;color:#b45309;font-weight:bold;">⏰ กรุณาโอนภายใน 24 ชั่วโมง</p>
      </div>
      <div style="margin-top:12px;padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;line-height:1.7;">
        <div>• อัตราค่าบริการยังไม่รวม VAT 7% (สำหรับนิติบุคคล)</div>
        <div>• นิติบุคคลยอดตั้งแต่ 1,000 บ. ขึ้นไป สามารถหักภาษี ณ ที่จ่าย 3%</div>
        <div>• ใบเสร็จ/ใบกำกับภาษีจะส่งหลังได้รับหนังสือหักฯ</div>
      </div>` : '';

    const orderUrl = `${Deno.env.get('APP_URL') ?? 'https://synnex-sync-buddy.lovable.app'}/order/${order.order_number}`;

    const html = `
      <div style="font-family:Sarabun,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#0f172a;">
        <div style="background:#0b1e3f;padding:24px;text-align:center;color:#fff;">
          <h1 style="margin:0;font-size:20px;">ENT Group IT Shop</h1>
          <div style="opacity:.75;font-size:12px;">Authorized Dealer — Synnex & VST ECS</div>
        </div>
        <div style="padding:28px;">
          <div style="text-align:center;">
            <div style="font-size:48px;">✅</div>
            <h2 style="margin:8px 0 4px;">ยืนยันคำสั่งซื้อของคุณ</h2>
            <div style="font-family:monospace;font-weight:bold;color:#0b1e3f;">${escapeHtml(order.order_number)}</div>
          </div>
          <p>เรียน คุณ${escapeHtml(order.customer_name ?? '')},</p>
          <p>ขอบคุณที่สั่งซื้อสินค้ากับ ENT Group ทีมงานได้รับคำสั่งซื้อของคุณแล้ว และจะดำเนินการติดต่อกลับภายใน 1 วันทำการ</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px;text-align:left;">รายการสินค้า</th>
                <th style="padding:10px;">จำนวน</th>
                <th style="padding:10px;text-align:right;">ราคา/ชิ้น</th>
                <th style="padding:10px;text-align:right;">รวม</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:14px;text-align:right;font-weight:bold;">ยอดชำระทั้งหมด</td>
                <td style="padding:14px;text-align:right;font-weight:bold;color:#ea580c;font-size:16px;">฿${Number(order.total).toLocaleString('th-TH')}</td>
              </tr>
            </tfoot>
          </table>
          ${bankSection}
          <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;">
            <div style="font-weight:bold;margin-bottom:6px;">📦 ที่อยู่จัดส่ง</div>
            <div>${escapeHtml(order.shipping_name ?? order.customer_name ?? '')} · ${escapeHtml(order.shipping_phone ?? order.customer_phone ?? '')}</div>
            <div style="color:#475569;">${escapeHtml([order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(' '))}</div>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="${orderUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">ดูสถานะคำสั่งซื้อ →</a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
          โทร: 02-045-6104 · ฝ่ายจัดซื้อ 082-249-7922<br/>
          accountant@entgroup.co.th · เลขผู้เสียภาษี 0135558013167<br/>
          © 2026 บริษัท อี เอ็น ที กรุ๊ป จำกัด
        </div>
      </div>`;

    const subject = `ยืนยันคำสั่งซื้อ ENT Group — ${order.order_number}`;
    const { ok, data } = await sendResend({ to: order.customer_email, subject, html });
    await logEmail({ order_id, email_type: 'order_confirmation', recipient: order.customer_email, subject, ok, data });
    return json({ success: ok, id: data?.id, error: ok ? null : data }, ok ? 200 : 502);
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
