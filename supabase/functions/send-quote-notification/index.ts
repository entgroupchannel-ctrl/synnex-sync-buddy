// Sends PC Builder quotation notification email via Resend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const priceFmt = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n || 0);

const LABELS: Record<string, string> = {
  cpu: "CPU",
  mb: "Mainboard",
  ram: "RAM",
  ssd: "SSD",
  os: "OS/Software",
  gpu: "GPU",
  psu: "PSU/Case",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      quote_number,
      customer_name,
      customer_email,
      customer_phone,
      components = {},
      total_price = 0,
      note,
    } = body ?? {};

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_Synex");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rows = Object.entries(components)
      .filter(([, p]) => p)
      .map(([k, p]: [string, any]) => {
        const label = LABELS[k] ?? k.toUpperCase();
        return `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;"><b>${label}</b></td><td style="padding:6px 10px;border-bottom:1px solid #eee;">${p.name ?? ""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${priceFmt(p.selling_price ?? 0)}</td></tr>`;
      })
      .join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#065f46;">📋 คำขอใบเสนอราคา PC Builder</h2>
        <p><b>เลขที่:</b> ${quote_number ?? "-"}</p>
        <h3>ข้อมูลลูกค้า</h3>
        <p>ชื่อ: ${customer_name}<br/>อีเมล: ${customer_email}<br/>โทร: ${customer_phone}</p>
        ${note ? `<p><b>หมายเหตุ:</b> ${note}</p>` : ""}
        <h3>รายการสเปค</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="2" style="padding:10px;text-align:right;"><b>รวม</b></td><td style="padding:10px;text-align:right;"><b>${priceFmt(total_price)}</b></td></tr></tfoot>
        </table>
        <p style="margin-top:20px;color:#666;font-size:12px;">ENT Group IT Shop — ทีมงานจะติดต่อกลับภายใน 1 วันทำการ</p>
      </div>
    `;

    const sendEmail = async (to: string, subject: string) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ENT Group IT Shop <noreply@entgroup.co.th>",
          to: [to],
          subject,
          html,
        }),
      });
      return res.ok;
    };

    await sendEmail("sales@entgroup.co.th", `[PC Builder] ${quote_number} - ${customer_name}`);
    if (customer_email) {
      await sendEmail(customer_email, `ยืนยันคำขอใบเสนอราคา ${quote_number} - ENT Group`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
