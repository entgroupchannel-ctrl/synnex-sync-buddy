// Notify admin + applicant about a B2B credit line application / decision.
import { admin, sendResend, CORS } from '../_shared/email.ts';

const ADMIN_EMAIL = 'Sales@entgroup.co.th';
const baht = (n: number) => `฿${Number(n).toLocaleString('en-US')}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

  try {
    const { application_number, decision, credit_limit, payment_terms_days, rejection_reason } = await req.json();
    if (!application_number) return json({ error: 'application_number required' }, 400);

    const sb = admin();
    const { data: app } = await sb
      .from('credit_applications')
      .select('*')
      .eq('application_number', application_number)
      .maybeSingle();
    if (!app) return json({ error: 'Not found' }, 404);

    const wrap = (inner: string) =>
      `<div style="font-family:sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">${inner}
        <p style="color:#64748b;font-size:12px;margin-top:24px">ENT Group IT Shop · โทร 02-045-6104 · Sales@entgroup.co.th</p>
      </div>`;

    if (!decision) {
      // New application: notify admin + confirm to applicant
      await sendResend({
        to: ADMIN_EMAIL,
        subject: `[Credit Application] ${app.company_name} ขอวงเงิน ${baht(app.requested_credit_limit)}`,
        html: wrap(`<h2>คำขอวงเงินเครดิตใหม่</h2>
          <p><b>เลขที่:</b> ${app.application_number}</p>
          <p><b>บริษัท:</b> ${app.company_name} (${app.company_type ?? '-'})<br/>
          <b>เลขผู้เสียภาษี:</b> ${app.tax_id}<br/>
          <b>ที่อยู่:</b> ${app.company_address}</p>
          <p><b>ผู้ติดต่อ:</b> ${app.contact_name} (${app.contact_position})<br/>
          ${app.contact_phone} · ${app.contact_email}</p>
          <p><b>วงเงินที่ขอ:</b> ${baht(app.requested_credit_limit)}<br/>
          <b>รายได้ต่อปี:</b> ${app.annual_revenue ?? '-'}<br/>
          <b>ดำเนินธุรกิจ:</b> ${app.years_in_business ?? '-'}</p>
          <p><a href="https://shop.entgroup.co.th/admin/credit-applications">เปิดหน้าจัดการคำขอ</a></p>`),
      });

      const r = await sendResend({
        to: app.contact_email,
        subject: `ได้รับคำขอวงเงินเครดิตแล้ว — ${app.application_number}`,
        html: wrap(`<h2>ได้รับคำขอวงเงินเครดิตแล้ว</h2>
          <p>เรียนคุณ ${app.contact_name}</p>
          <p>เราได้รับคำขอวงเงินเครดิตของ <b>${app.company_name}</b> เลขที่ <b>${app.application_number}</b>
          จำนวน <b>${baht(app.requested_credit_limit)}</b> เรียบร้อยแล้ว</p>
          <p>ทีมงานจะติดต่อกลับภายใน 3-5 วันทำการ</p>`),
      });
      await sb.from('email_logs').insert({
        user_id: app.user_id, email_type: 'credit_application', recipient: app.contact_email,
        subject: `ได้รับคำขอวงเงินเครดิตแล้ว — ${app.application_number}`,
        status: r.ok ? 'sent' : 'failed',
      });
      return json({ ok: true });
    }

    const approved = decision === 'approved';
    const subject = approved
      ? `✅ อนุมัติวงเงินเครดิต ${baht(credit_limit ?? 0)} — ${app.application_number}`
      : `แจ้งผลคำขอวงเงินเครดิต — ${app.application_number}`;
    const html = approved
      ? wrap(`<h2>อนุมัติวงเงินเครดิตแล้ว</h2>
          <p>เรียนคุณ ${app.contact_name} (${app.company_name})</p>
          <p>วงเงินที่อนุมัติ: <b>${baht(credit_limit ?? 0)}</b><br/>
          เงื่อนไขการชำระ: <b>${payment_terms_days ?? 30} วัน</b></p>
          <p>ท่านสามารถเลือกชำระด้วยวงเงินเครดิตได้ที่หน้าชำระเงิน</p>
          <p><a href="https://shop.entgroup.co.th/my-account/credit">ดูวงเงินของฉัน</a></p>`)
      : wrap(`<h2>แจ้งผลคำขอวงเงินเครดิต</h2>
          <p>เรียนคุณ ${app.contact_name} (${app.company_name})</p>
          <p>ขออภัย เราไม่สามารถอนุมัติคำขอวงเงินเครดิตของท่านได้ในขณะนี้</p>
          ${rejection_reason ? `<p><b>เหตุผล:</b> ${rejection_reason}</p>` : ''}
          <p>หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อทีมงาน</p>`);

    const r = await sendResend({ to: app.contact_email, subject, html });
    await sb.from('email_logs').insert({
      user_id: app.user_id, email_type: `credit_${decision}`, recipient: app.contact_email,
      subject, status: r.ok ? 'sent' : 'failed',
    });
    return json({ ok: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
