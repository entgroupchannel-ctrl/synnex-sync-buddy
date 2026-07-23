// Send B2B account approval/rejection email to customer
import { admin, sendResend, CORS } from '../_shared/email.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { user_id, status } = await req.json();
    if (!user_id || !['active', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const sb = admin();
    const { data: profile } = await sb.from('user_profiles').select('*').eq('id', user_id).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const { data: userRes } = await sb.auth.admin.getUserById(user_id);
    const email = userRes?.user?.email;
    if (!email) return new Response(JSON.stringify({ error: 'No email' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const isApproved = status === 'active';
    const subject = isApproved
      ? '✅ บัญชี B2B ของคุณได้รับการยืนยันแล้ว — ENT Group'
      : 'บัญชี B2B ของคุณ — ENT Group';
    const html = isApproved
      ? `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#0f172a">ยินดีต้อนรับสู่ ENT Group IT Shop</h2>
          <p>เรียนคุณ ${profile.full_name ?? ''} (${profile.company_name ?? ''})</p>
          <p>บัญชี B2B ของท่านได้รับการยืนยันเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบและสั่งซื้อสินค้าได้ทันที</p>
          <p><a href="https://shop.entgroup.co.th/auth" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">เข้าสู่ระบบ</a></p>
          <p style="color:#64748b;font-size:12px">หากมีข้อสงสัย ติดต่อ 02-045-6104 หรือ Sales@entgroup.co.th</p>
        </div>`
      : `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#0f172a">แจ้งสถานะบัญชี B2B</h2>
          <p>เรียนคุณ ${profile.full_name ?? ''}</p>
          <p>ขออภัย เราไม่สามารถอนุมัติบัญชี B2B ของท่านได้ในขณะนี้ หากต้องการข้อมูลเพิ่มเติมกรุณาติดต่อทีมงาน</p>
          <p style="color:#64748b;font-size:12px">โทร 02-045-6104 · Sales@entgroup.co.th</p>
        </div>`;

    await sendResend({ to: email, subject, html });
    await sb.from('email_logs').insert({ user_id, email_type: `b2b_${status}`, recipient: email, status: 'sent' });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
