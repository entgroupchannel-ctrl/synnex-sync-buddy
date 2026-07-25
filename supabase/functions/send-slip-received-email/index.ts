/**
 * supabase/functions/send-slip-received-email/index.ts  (ไฟล์ใหม่)
 * ส่งอีเมลแจ้งลูกค้าทันทีที่แนบสลิปสำเร็จ — "ได้รับสลิปแล้ว กำลังตรวจสอบก่อนยืนยันคำสั่งซื้อ"
 * ใช้ pattern เดียวกับ send-order-confirmation ที่มีอยู่แล้ว (CORS, admin(), sendResend, logEmail)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CORS, admin, sendResend, logEmail, FROM_EMAIL } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);

    const sb = admin();
    const { data: order, error } = await sb.from('orders').select('*').eq('id', order_id).single();
    if (error || !order) return json({ error: 'Order not found' }, 404);

    const toEmail = order.customer_email;
    if (!toEmail) return json({ success: true, skipped: 'no customer email' });

    const subject = `ได้รับสลิปแล้ว — กำลังตรวจสอบ #${order.order_number}`;
    const html = `
      <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 560px; margin: 0 auto; color:#1e293b;">
        <div style="background:#0B2A4A; padding:20px; text-align:center;">
          <span style="color:#fff; font-size:18px; font-weight:bold;">ENT Group IT Shop</span>
        </div>
        <div style="padding:24px; background:#f8fafc;">
          <h2 style="color:#0B2A4A; margin-top:0;">ได้รับสลิปการโอนเงินแล้ว ✅</h2>
          <p>เรียนคุณ ${order.customer_name ?? ''},</p>
          <p>
            ทีมงานได้รับหลักฐานการโอนเงินสำหรับคำสั่งซื้อ
            <strong>#${order.order_number}</strong> เรียบร้อยแล้ว
          </p>
          <p style="background:#fef9c3; border-radius:8px; padding:12px 16px; color:#854d0e;">
            📋 ระบบกำลัง<strong>ตรวจสอบความถูกต้องของสลิป</strong>โดยอัตโนมัติ
            (เทียบยอดเงิน / บัญชีปลายทาง / กันสลิปซ้ำ) ก่อนยืนยันรับคำสั่งซื้ออย่างเป็นทางการ
            ใช้เวลาไม่เกินไม่กี่นาที
          </p>
          <p>เมื่อตรวจสอบผ่านแล้ว ท่านจะได้รับอีเมลยืนยันอีกฉบับ พร้อมเริ่มกระบวนการจัดส่งทันที</p>
          <p style="margin-top: 24px;">
            <a href="https://shop.entgroup.co.th/order/${order.order_number}"
               style="background:#0B2A4A; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
              ดูสถานะคำสั่งซื้อ
            </a>
          </p>
          <p style="color:#64748b; font-size:12px; margin-top:32px;">
            หากมีข้อสงสัย ติดต่อ ENT Group โทร 02-045-6104
          </p>
        </div>
      </div>
    `;

    await sendResend({ to: toEmail, from: FROM_EMAIL, subject, html });
    await logEmail(sb, { order_id, type: 'slip_received', to: toEmail, subject });

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
