/**
 * supabase/functions/delete-omise-card/index.ts  (ไฟล์ใหม่)
 * ลบบัตรที่บันทึกไว้ — ลบทั้งฝั่ง Omise (detach จาก customer) และแถวใน saved_cards
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

    const { saved_card_id } = await req.json();
    if (!saved_card_id) return json({ error: 'saved_card_id required' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: card, error: cardErr } = await admin
      .from('saved_cards')
      .select('*')
      .eq('id', saved_card_id)
      .eq('user_id', userId) // กันลบบัตรคนอื่น
      .single();
    if (cardErr || !card) return json({ error: 'ไม่พบบัตรนี้' }, 404);

    const { data: profile } = await admin
      .from('user_profiles')
      .select('omise_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.omise_customer_id) {
      const res = await fetch(
        `https://api.omise.co/customers/${profile.omise_customer_id}/cards/${card.omise_card_id}`,
        { method: 'DELETE', headers: { Authorization: omiseAuthHeader() } },
      );
      // ถ้า Omise ลบไม่สำเร็จ (เช่นเคย deleted ไปแล้ว) ยังคงลบออกจาก DB ของเราต่อได้ ไม่ block ผู้ใช้
      if (!res.ok) console.error('[delete-omise-card] omise delete failed', await res.text());
    }

    await admin.from('saved_cards').delete().eq('id', saved_card_id);

    // ถ้าลบใบที่เป็น default ไป ให้ตั้งใบแรกที่เหลือเป็น default แทนอัตโนมัติ
    if (card.is_default) {
      const { data: remaining } = await admin
        .from('saved_cards')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1);
      if (remaining && remaining.length > 0) {
        await admin.from('saved_cards').update({ is_default: true }).eq('id', remaining[0].id);
      }
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
