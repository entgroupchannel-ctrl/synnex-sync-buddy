/**
 * supabase/functions/save-omise-card/index.ts  (ไฟล์ใหม่)
 * รับ Omise token (tok_xxx) ที่ tokenize จากฝั่ง browser แล้วเท่านั้น — ไม่รับเลขบัตร/CVV ตรงๆ
 * สร้าง/ผูก Omise Customer แล้วบันทึกการ์ดลง saved_cards (เก็บแค่ brand/last4/expiry)
 *
 * ⚠️ ต้องตั้ง secret OMISE_SECRET_KEY ไว้ใน Supabase project (ใช้ key เดียวกับ create-omise-charge)
 * ถ้าใช้ชื่อ secret ต่างจากนี้ ให้แก้ชื่อ env var ในไฟล์นี้ให้ตรงกับที่มีอยู่จริง
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
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'ไม่ได้เข้าสู่ระบบ' }, 401);
    const userId = userData.user.id;

    const { token, set_default } = await req.json();
    if (!token) return json({ error: 'token required' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // เช็คว่า user นี้มี Omise customer อยู่แล้วหรือยัง
    const { data: profile } = await admin
      .from('user_profiles')
      .select('omise_customer_id')
      .eq('id', userId)
      .maybeSingle();

    let customerId = profile?.omise_customer_id as string | null;
    let cardResp: { id: string; brand: string; last_digits: string; expiration_month: number; expiration_year: number };

    if (!customerId) {
      // ยังไม่มี customer → สร้างใหม่พร้อมผูกบัตรใบแรก
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const res = await fetch('https://api.omise.co/customers', {
        method: 'POST',
        headers: { Authorization: omiseAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ card: token, email: authUser.user?.email ?? '', description: `ENT Group user ${userId}` }),
      });
      const customer = await res.json();
      if (!res.ok) return json({ error: customer?.message ?? 'สร้าง Omise customer ไม่สำเร็จ' }, 400);
      customerId = customer.id;
      cardResp = customer.cards.data[customer.cards.data.length - 1];
      await admin.from('user_profiles').update({ omise_customer_id: customerId }).eq('id', userId);
    } else {
      // มี customer อยู่แล้ว → ผูกบัตรใบใหม่เพิ่ม
      const res = await fetch(`https://api.omise.co/customers/${customerId}`, {
        method: 'PUT',
        headers: { Authorization: omiseAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ card: token }),
      });
      const customer = await res.json();
      if (!res.ok) return json({ error: customer?.message ?? 'เพิ่มบัตรไม่สำเร็จ' }, 400);
      cardResp = customer.cards.data[customer.cards.data.length - 1];
    }

    // มีบัตรอยู่ก่อนหน้าไหม (ถ้ายังไม่มีเลย บัตรใบแรกให้เป็น default อัตโนมัติ)
    const { count: existingCount } = await admin
      .from('saved_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const shouldBeDefault = set_default === true || (existingCount ?? 0) === 0;
    if (shouldBeDefault) {
      await admin.from('saved_cards').update({ is_default: false }).eq('user_id', userId);
    }

    const { data: saved, error: insErr } = await admin
      .from('saved_cards')
      .insert({
        user_id: userId,
        omise_card_id: cardResp.id,
        brand: cardResp.brand,
        last_digits: cardResp.last_digits,
        expiration_month: cardResp.expiration_month,
        expiration_year: cardResp.expiration_year,
        is_default: shouldBeDefault,
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ success: true, card: saved });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
