/**
 * supabase/functions/create-omise-charge/index.ts
 * สร้าง Omise Source (type=promptpay) แล้ว charge เพื่อได้ QR code ให้ลูกค้าสแกนจ่าย
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PROMPTPAY_MAX_AMOUNT = 150000;

const BANK_ACCOUNTS = [
  { bank: 'กสิกรไทย (KBank)', account: '000-0-00000-0', name: 'บริษัท อี เอ็น ที กรุ๊ป จำกัด' },
];

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
    const { order_id, amount } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);
    if (!amount || amount <= 0) return json({ error: 'amount ไม่ถูกต้อง' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, order_number, payment_status')
      .eq('id', order_id)
      .single();
    if (orderErr || !order) return json({ error: 'ไม่พบออเดอร์' }, 404);
    if (order.payment_status === 'paid') return json({ error: 'ออเดอร์นี้ชำระเงินแล้ว' }, 400);

    if (amount > PROMPTPAY_MAX_AMOUNT) {
      return json({ requires_manual_transfer: true, bank_accounts: BANK_ACCOUNTS, amount });
    }

    // 1) Source (promptpay)
    const sourceParams = new URLSearchParams({
      type: 'promptpay',
      amount: String(Math.round(Number(amount) * 100)),
      currency: 'thb',
    });
    const sourceRes = await fetch('https://api.omise.co/sources', {
      method: 'POST',
      headers: { Authorization: omiseAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: sourceParams,
    });
    const source = await sourceRes.json();
    if (!sourceRes.ok) return json({ error: source?.message ?? 'สร้าง PromptPay source ไม่สำเร็จ' }, 400);

    // 2) Charge
    const chargeParams = new URLSearchParams({
      amount: String(Math.round(Number(amount) * 100)),
      currency: 'thb',
      source: source.id,
      description: `ENT Group Order ${order.order_number}`,
    });
    chargeParams.set('metadata[order_id]', order.id);
    chargeParams.set('metadata[order_number]', order.order_number);

    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: { Authorization: omiseAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: chargeParams,
    });
    const charge = await chargeRes.json();
    if (!chargeRes.ok) return json({ error: charge?.message ?? 'สร้าง charge ไม่สำเร็จ' }, 400);

    const qrImageUrl: string | undefined =
      charge?.source?.scannable_code?.image?.download_uri ?? charge?.source?.scannable_code?.image?.uri;
    if (!qrImageUrl) {
      console.error('[create-omise-charge] ไม่พบ qr image ใน response:', JSON.stringify(charge));
      return json({ error: 'ไม่ได้รับ QR code จาก Omise (เช็ค log ฝั่ง server)' }, 500);
    }

    await admin.from('orders').update({ payment_gateway_ref: charge.id }).eq('id', order_id);

    return json({
      qr_code_url: qrImageUrl,
      expires_at: charge.expires_at,
      charge_id: charge.id,
      amount,
    });
  } catch (e) {
    console.error('[create-omise-charge] error:', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
