/**
 * supabase/functions/omise-webhook/index.ts
 * รับ webhook จาก Omise แล้วยืนยันสถานะ charge กับ Omise API เองก่อนอัปเดต orders
 * Webhook URL: https://wuieuiohusgfdilemplj.supabase.co/functions/v1/omise-webhook
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
    const event = await req.json();

    const chargeId: string | undefined = event?.data?.id ?? event?.key?.split?.('.')?.[0];
    if (!chargeId || !String(chargeId).startsWith('chrg_')) {
      return json({ received: true, ignored: true });
    }

    // ยืนยันสถานะจริงจาก Omise เอง ไม่เชื่อ payload ที่ webhook ส่งมา
    const verifyRes = await fetch(`https://api.omise.co/charges/${chargeId}`, {
      headers: { Authorization: omiseAuthHeader() },
    });
    const charge = await verifyRes.json();
    if (!verifyRes.ok) {
      console.error('[omise-webhook] verify charge failed:', JSON.stringify(charge));
      return json({ error: 'verify failed' }, 500);
    }

    const orderId: string | undefined = charge?.metadata?.order_id;
    if (!orderId) {
      console.warn('[omise-webhook] charge ไม่มี metadata.order_id:', chargeId);
      return json({ received: true, ignored: true });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order } = await admin
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      console.warn('[omise-webhook] ไม่พบออเดอร์:', orderId);
      return json({ received: true, ignored: true });
    }
    if (order.payment_status === 'paid') {
      return json({ received: true, already_paid: true });
    }

    if (charge.status === 'successful') {
      await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_gateway_ref: charge.id,
        })
        .eq('id', orderId);

      await admin.from('order_status_history').insert({
        order_id: orderId,
        status: order.status ?? 'pending',
        note: 'ชำระเงินผ่าน PromptPay สำเร็จ (ยืนยันจาก Omise webhook)',
        changed_by: 'omise',
      });
    } else if (charge.status === 'failed') {
      await admin.from('order_status_history').insert({
        order_id: orderId,
        status: order.status ?? 'pending',
        note: `การชำระเงิน PromptPay ล้มเหลว: ${charge.failure_message ?? charge.failure_code ?? 'ไม่ทราบสาเหตุ'}`,
        changed_by: 'omise',
      });
    }

    return json({ received: true, status: charge.status });
  } catch (e) {
    console.error('[omise-webhook] error:', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
