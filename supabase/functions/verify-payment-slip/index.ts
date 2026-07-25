/**
 * supabase/functions/verify-payment-slip/index.ts  (แทนที่ไฟล์เดิมทั้งไฟล์ — เปลี่ยนจาก EasySlip เป็น SlipOK)
 * ตรวจสอบสลิปโอนเงินกับธุรกรรมจริงในระบบธนาคาร ผ่าน SlipOK API (https://slipok.com)
 *
 * ⚠️ ต้องตั้ง secret ใน Supabase project:
 *    SLIPOK_API_KEY    — API key จากหน้า SlipOK dashboard
 *    SLIPOK_BRANCH_ID  — Branch ID ของร้าน (ผูกบัญชี KBank/SCB ไว้ในสาขานี้แล้ว)
 *
 * ตรวจ 3 เรื่องหลัก (SlipOK เช็คให้อัตโนมัติเมื่อส่ง log:true):
 *   1. สลิปซ้ำ (error 1012) — เอาสลิปเดิมมาใช้ซ้ำ
 *   2. ยอดไม่ตรง (error 1013) — matchAmount
 *   3. บัญชีผิด (error 1014) — ไม่ตรงกับบัญชีหลักของร้านที่ผูกไว้กับ Branch ID
 * ผ่านทุกข้อ → auto mark payment_status = paid
 * ไม่ผ่านข้อไหน → ตั้ง fraud_review_required = true ให้ admin ตรวจมือ พร้อมเหตุผล
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

// แปล error code ของ SlipOK เป็น risk flag ภายในระบบเรา
function flagForCode(code: number): string {
  switch (code) {
    case 1012: return 'DUPLICATE_SLIP';
    case 1013: return 'AMOUNT_MISMATCH';
    case 1014: return 'ACCOUNT_MISMATCH';
    case 1006:
    case 1007:
    case 1008:
    case 1011: return 'FAKE_OR_INVALID_SLIP'; // ไม่มี QR / QR ไม่ใช่ QR ชำระเงิน / ธุรกรรมไม่มีอยู่จริง — สัญญาณสลิปปลอมชัดเจน
    default: return `SLIPOK_ERROR_${code}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'order_id required' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', order_id).single();
    if (orderErr || !order) return json({ error: 'ไม่พบออเดอร์' }, 404);
    if (!order.payment_slip_url) return json({ error: 'ออเดอร์นี้ยังไม่มีสลิปแนบมา' }, 400);

    const apiKey = Deno.env.get('SLIPOK_API_KEY');
    const branchId = Deno.env.get('SLIPOK_BRANCH_ID');
    if (!apiKey || !branchId) return json({ error: 'ยังไม่ได้ตั้งค่า SLIPOK_API_KEY หรือ SLIPOK_BRANCH_ID' }, 500);

    // ดาวน์โหลดไฟล์สลิปจาก private bucket มาส่งเป็น multipart ตรงๆ
    // (ไม่ใช้ url เพราะเอกสาร SlipOK เตือนว่า signed URL แบบ S3 อาจใช้ไม่ได้)
    const { data: fileBlob, error: dlErr } = await admin.storage.from('payment-slips').download(order.payment_slip_url);
    if (dlErr || !fileBlob) return json({ error: 'ดาวน์โหลดไฟล์สลิปไม่สำเร็จ' }, 500);

    const form = new FormData();
    form.append('files', fileBlob, 'slip.jpg');
    form.append('log', 'true');
    form.append('amount', String(Number(order.total)));

    const slipokRes = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers: { 'x-authorization': apiKey },
      body: form,
    });
    const result = await slipokRes.json();

    // --- กรณีสำเร็จ 100% (HTTP 200, ไม่มี error code) ---
    if (slipokRes.ok && result.success) {
      const d = result.data;
      await admin.from('slip_verifications').insert({
        order_id,
        provider: 'slipok',
        trans_ref: d.transRef,
        slip_amount: d.amount,
        sender_name: d.sender?.displayName ?? d.sender?.name ?? null,
        sender_bank: d.sendingBank,
        receiver_name: d.receiver?.displayName ?? d.receiver?.name ?? null,
        receiver_bank: d.receivingBank,
        is_duplicate: false,
        is_amount_matched: true,
        is_account_matched: true,
        risk_flags: [],
        auto_approved: true,
        raw_response: result,
      });
      await admin.from('orders').update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        fraud_review_required: false,
      }).eq('id', order_id);
      await admin.from('order_status_history').insert({
        order_id, status: order.status ?? 'pending',
        note: `✅ ตรวจสอบสลิปอัตโนมัติผ่าน (เลขอ้างอิง ${d.transRef})`,
        changed_by: 'slip-verification',
      });
      return json({ success: true, auto_approved: true, risk_flags: [] });
    }

    // --- กรณีธนาคารดีเลย์ (1009, 1010) — ยังไม่ใช่การพบทุจริต แค่ต้องลองใหม่ทีหลัง ---
    if (result.code === 1009 || result.code === 1010) {
      await admin.from('slip_verifications').insert({
        order_id, provider: 'slipok',
        error_message: result.message,
        risk_flags: [],
      });
      return json({ success: false, retry_later: true, message: result.message });
    }

    // --- กรณีอื่นๆ ที่ไม่ใช่ปัญหาความถูกต้องของสลิป (auth/quota/branch ผิด) ---
    if ([1000, 1001, 1002, 1003, 1004, 1005].includes(result.code)) {
      await admin.from('slip_verifications').insert({
        order_id, provider: 'slipok',
        error_message: result.message,
        risk_flags: [`SLIPOK_CONFIG_ERROR_${result.code}`],
      });
      return json({ error: result.message, code: result.code }, 500);
    }

    // --- กรณีพบความผิดปกติจริง (1006/1007/1008/1011/1012/1013/1014) ---
    const flag = flagForCode(result.code);
    const d = result.data ?? {}; // SlipOK ยังส่งรายละเอียดสลิปมาให้แม้จะ error (ยกเว้น 1010)

    const { error: insErr } = await admin.from('slip_verifications').insert({
      order_id,
      provider: 'slipok',
      trans_ref: d.transRef ?? null,
      slip_amount: d.amount ?? null,
      sender_name: d.sender?.displayName ?? d.sender?.name ?? null,
      sender_bank: d.sendingBank ?? null,
      receiver_name: d.receiver?.displayName ?? d.receiver?.name ?? null,
      receiver_bank: d.receivingBank ?? null,
      is_duplicate: flag === 'DUPLICATE_SLIP',
      is_amount_matched: flag !== 'AMOUNT_MISMATCH',
      is_account_matched: flag !== 'ACCOUNT_MISMATCH',
      risk_flags: [flag],
      auto_approved: false,
      raw_response: result,
    });

    // ชนกับ unique index ของเราเอง (trans_ref ซ้ำ) — เผื่อ SlipOK พลาดไม่จับเอง
    const finalFlags = insErr ? [flag, 'DUPLICATE_SLIP_IN_OUR_SYSTEM'] : [flag];

    await admin.from('orders').update({ fraud_review_required: true }).eq('id', order_id);
    await admin.from('order_status_history').insert({
      order_id, status: order.status ?? 'pending',
      note: `⚠️ ตรวจสอบสลิปพบความผิดปกติ: ${result.message} (${finalFlags.join(', ')}) — รอ admin ตรวจสอบ`,
      changed_by: 'slip-verification',
    });

    return json({ success: true, auto_approved: false, risk_flags: finalFlags, message: result.message });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
