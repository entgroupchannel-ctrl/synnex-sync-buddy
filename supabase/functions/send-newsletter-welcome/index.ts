// Sends newsletter welcome email to subscriber + notifies admin (Resend)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const G = "#10B981";
const NAVY = "#0a1628";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_Synex");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "missing RESEND_API_KEY_Synex" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const send = (payload: Record<string, unknown>) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

    const html = `
<div style="font-family:'IBM Plex Sans Thai',Arial,sans-serif;background:#f4f6f8;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:${NAVY};padding:28px 24px;text-align:center">
      <div style="color:#ffffff;font-size:22px;font-weight:700">ENT Group IT Shop</div>
      <div style="color:${G};font-size:13px;margin-top:4px">Computer for all</div>
    </div>
    <div style="padding:28px 24px">
      <h1 style="margin:0 0 8px;font-size:20px;color:${NAVY}">ยินดีต้อนรับครับ! 🎉</h1>
      <p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.7">
        คุณได้สมัครรับข่าวสารและโปรโมชั่นจาก ENT Group IT Shop เรียบร้อยแล้ว
      </p>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:16px 18px;margin-bottom:20px">
        <div style="font-weight:700;color:${NAVY};font-size:14px;margin-bottom:8px">สิทธิพิเศษที่คุณจะได้รับ:</div>
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.9">
          <li>โปรโมชั่นสินค้าไอทีก่อนใคร</li>
          <li>ข่าวสารสินค้าใหม่ล่าสุด</li>
          <li>ส่วนลดพิเศษสำหรับสมาชิก Newsletter</li>
          <li>เคล็ดลับการเลือกซื้อสินค้าไอที</li>
        </ul>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://shop.entgroup.co.th" style="display:inline-block;background:${G};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px">🛍️ ช้อปสินค้าเลย</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px" />
      <div style="font-size:11px;color:#94a3b8;line-height:1.8">
        หากต้องการยกเลิกการรับข่าวสาร กรุณาตอบกลับอีเมลนี้<br />
        บริษัท อีเอ็นที กรุ๊ป จำกัด | 02-045-6104 |
        <a href="mailto:sales@entgroup.co.th" style="color:${G}">sales@entgroup.co.th</a>
      </div>
    </div>
  </div>
</div>`;

    const [welcome] = await Promise.all([
      send({
        from: "ENT Group IT Shop <noreply@entgroup.co.th>",
        to: [email],
        subject: "🎉 ยินดีต้อนรับสู่ ENT Group IT Shop Newsletter!",
        html,
      }),
      send({
        from: "ENT Group IT Shop <noreply@entgroup.co.th>",
        to: ["therdpoom@entgroup.co.th"],
        subject: `[Newsletter] สมาชิกใหม่: ${email}`,
        html: `<p>มีสมาชิกใหม่สมัครรับข่าวสาร: <b>${email}</b></p><p>เวลา: ${new Date().toLocaleString("th-TH")}</p>`,
      }),
    ]);

    if (!welcome.ok) {
      const text = await welcome.text();
      console.error("resend error", welcome.status, text);
      return new Response(JSON.stringify({ error: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
