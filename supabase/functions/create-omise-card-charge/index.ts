/**
 * supabase/functions/create-omise-card-charge/index.ts  (ไฟล์ใหม่)
 * สร้าง charge บัตรเครดิต/เดบิตสำหรับออเดอร์ รองรับ 3 กรณี:
 *  1. จ่ายด้วย token ใหม่ (ไม่บันทึกบัตร) → charge ด้วย token ตรงๆ
 *  2. จ่ายด้วย token ใหม่ + save_card=true → สร้าง Omise customer ผูกบัตร แล้ว charge ด้วย customer+card
 *  3. จ่ายด้วยบัตรที่เคยบันทึกไว้ (saved_card_id) → charge ด้วย customer+card เดิม ไม่ต้อง tokenize ใหม่
 *
 * รองรับ 3D Secure: ถ้า Omise ต้องการ verify เพิ่ม จะได้ authorize_uri กลับมาให้ redirect ลูกค้าไป
 * แล้ว omise-webhook (มีอยู่แล้ว) จะอัปเดตผลลัพธ์สุดท้ายกลับมาที่ orders
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function omiseAuthHeader(): string {
  const secretKey = Deno.env.get('OMISE_SECRET_KEY');
  if (!secretKey) throw new Error('Missing OMISE_SECRET_KEY secret');
  return 'Basic ' + btoa(`${secretKey}:`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await sb.auth.getUser();
    const userId = userData.user?.id ?? null;

    const { order_id, token, saved_card_id, save_card, return_uri } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);
    if (!token && !saved_card_id) return json({ error: 'ต้องมี token หรือ saved_card_id' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', order_id).single();
    if (orderErr || !order) return json({ error: 'ไม่พบออเดอร์' }, 404);
    if (order.payment_status === 'paid') return json({ error: 'ออเดอร์นี้ชำระเงินแล้ว' }, 400);

    const chargeParams = new URLSearchParams({
      amount: String(Math.round(Number(order.total) * 100)), // สตางค์
      currency: 'thb',
      description: `ENT Group Order ${order.order_number}`,
      return_uri: return_uri ?? `https://shop.entgroup.co.th/order/${order.order_number}`,
    });
    chargeParams.set('metadata[order_id]', order.id);
    chargeParams.set('metadata[order_number]', order.order_number);

    if (saved_card_id) {
      // ใช้บัตรที่บันทึกไว้ — ต้องเป็นของ user คนนี้เท่านั้น
      if (!userId) return json({ error: 'ต้องเข้าสู่ระบบเพื่อใช้บัตรที่บันทึกไว้' }, 401);
      const { data: card, error: cardErr } = await admin
        .from('saved_cards').select('*').eq('id', saved_card_id).eq('user_id', userId).single();
      if (cardErr || !card) return json({ error: 'ไม่พบบัตรนี้' }, 404);
      const { data: profile } = await admin.from('user_profiles').select('omise_customer_id').eq('id', userId).single();
      if (!profile?.omise_customer_id) return json({ error: 'ไม่พบข้อมูลลูกค้าใน Omise' }, 400);
      chargeParams.set('customer', profile.omise_customer_id);
      chargeParams.set('card', card.omise_card_id);
    } else if (save_card && userId) {
      // tokenize ใหม่ + บันทึกบัตรไว้ใช้ครั้งหน้า (เรียก save-omise-card ก่อน แล้วค่อย charge ด้วย customer+card)
      const saveRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/save-omise-card`, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) return json({ error: saveData?.error ?? 'บันทึกบัตรไม่สำเร็จ' }, 400);
      const { data: profile } = await admin.from('user_profiles').select('omise_customer_id').eq('id', userId).single();
      chargeParams.set('customer', profile!.omise_customer_id);
      chargeParams.set('card', saveData.card.omise_card_id);
    } else {
      // จ่ายครั้งเดียว ไม่บันทึกบัตร
      chargeParams.set('card', token);
    }

    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: { Authorization: omiseAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: chargeParams,
    });
    const charge = await chargeRes.json();
    if (!chargeRes.ok) return json({ error: charge?.message ?? 'ชำระเงินไม่สำเร็จ' }, 400);

    // charge.status: "successful" | "pending" (รอ 3D secure) | "failed"
    const updates: Record<string, unknown> = { payment_gateway_ref: charge.id, payment_method: 'credit_card' };
    if (charge.status === 'successful') {
      updates.payment_status = 'paid';
      updates.paid_at = new Date().toISOString();
    }
    await admin.from('orders').update(updates).eq('id', order_id);

    await admin.from('order_status_history').insert({
      order_id,
      status: order.status ?? 'pending',
      note: charge.status === 'successful' ? 'ชำระด้วยบัตรเครดิตสำเร็จ' : `สถานะชำระเงินบัตร: ${charge.status}`,
      changed_by: 'omise',
    });

    return json({
      success: true,
      status: charge.status,
      authorize_uri: charge.authorize_uri ?? null, // ถ้ามีค่านี้ ต้อง redirect ลูกค้าไปยืนยัน 3D Secure
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
