// Sends staged abandoned-cart reminder emails (3h / 24h / 72h) to logged-in
// users who have saved carts. Triggered by pg_cron once a day.
import { admin, CORS, sendResend } from "../_shared/email.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://shop.entgroup.co.th";

type Snap = { name: string; price: number; qty: number; image_url: string | null; sku: string };

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

function itemsTable(items: Snap[], stockMap?: Record<string, number>) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
    ${items
      .map((i) => {
        const stock = stockMap?.[i.sku];
        const lowStock =
          typeof stock === "number" && stock > 0 && stock < 5
            ? `<div style="color:#dc2626;font-size:12px;margin-top:4px">⚠ เหลือเพียง ${stock} ชิ้น</div>`
            : "";
        return `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee;width:64px;vertical-align:top">
            ${i.image_url ? `<img src="${i.image_url}" width="56" style="border-radius:6px;background:#f8fafc" />` : ""}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px">
            <div style="font-weight:600;color:#0f172a">${i.name}</div>
            <div style="color:#64748b;font-size:12px">SKU: ${i.sku}</div>
            ${lowStock}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;font-size:14px">
            ${i.qty} × ${fmtTHB(i.price)}
          </td>
        </tr>`;
      })
      .join("")}
  </table>`;
}

function shell(inner: string) {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;color:#0f172a">
    <div style="background:#0f172a;padding:20px;text-align:center">
      <div style="color:#fff;font-size:20px;font-weight:700">ENT Group IT Shop</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:4px">Computer for all</div>
    </div>
    <div style="padding:24px">${inner}</div>
    <div style="background:#f8fafc;padding:16px;text-align:center;color:#64748b;font-size:12px">
      บริษัท อี เอ็น ที กรุ๊ป จำกัด · โทร 02-045-6104
    </div>
  </div>`;
}

function reminder1(items: Snap[], total: number) {
  return shell(`
    <h2 style="margin:0 0 8px;font-size:20px">🛒 คุณลืมอะไรไว้ที่ ENT Group IT Shop</h2>
    <p style="color:#475569;font-size:14px">สินค้าในตะกร้ายังรอคุณอยู่ ดำเนินการสั่งซื้อได้เลย</p>
    ${itemsTable(items)}
    <div style="text-align:right;font-size:16px;font-weight:700;margin:8px 0 20px">รวม ${fmtTHB(total)}</div>
    <div style="text-align:center">
      <a href="${SITE_URL}/cart" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">ดำเนินการสั่งซื้อ</a>
    </div>`);
}

function reminder2(items: Snap[], total: number, stockMap: Record<string, number>) {
  return shell(`
    <h2 style="margin:0 0 8px;font-size:20px">⚡ สินค้าของคุณอาจหมดสต็อก</h2>
    <p style="color:#dc2626;font-size:14px;font-weight:600">สต็อกมีจำกัด อย่าปล่อยให้หมด</p>
    ${itemsTable(items, stockMap)}
    <div style="text-align:right;font-size:16px;font-weight:700;margin:8px 0 20px">รวม ${fmtTHB(total)}</div>
    <div style="text-align:center">
      <a href="${SITE_URL}/cart" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">สั่งซื้อเลย</a>
    </div>`);
}

function reminder3(items: Snap[], total: number) {
  return shell(`
    <h2 style="margin:0 0 8px;font-size:20px">🎁 ของขวัญพิเศษสำหรับคุณ</h2>
    <p style="color:#475569;font-size:14px">เราเก็บตะกร้าไว้ให้คุณ — ติดต่อเราเพื่อรับส่วนลดพิเศษ</p>
    ${itemsTable(items)}
    <div style="text-align:right;font-size:16px;font-weight:700;margin:8px 0 12px">รวม ${fmtTHB(total)}</div>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:16px 0;font-size:14px">
      💬 <b>ส่วนลดพิเศษ</b> — โทร <a href="tel:020456104" style="color:#0f172a">02-045-6104</a>
    </div>
    <div style="text-align:center">
      <a href="${SITE_URL}/cart" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">ดูตะกร้า</a>
      <a href="${SITE_URL}/contact" style="display:inline-block;background:#10b981;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">ติดต่อเรา</a>
    </div>`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const db = admin();

  const { data: rows, error } = await db
    .from("cart_reminders")
    .select("id, customer_email, cart_snapshot, cart_total, reminder_count, reminder_sent_at, updated_at, recovered")
    .eq("recovered", false)
    .lt("reminder_count", 3);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  const now = Date.now();
  const H = 3600 * 1000;
  const due = (rows ?? []).filter((r) => {
    const rc = r.reminder_count ?? 0;
    const upd = r.updated_at ? new Date(r.updated_at).getTime() : 0;
    const sent = r.reminder_sent_at ? new Date(r.reminder_sent_at).getTime() : 0;
    if (rc === 0) return now - upd >= 3 * H;
    if (rc === 1) return now - sent >= 24 * H;
    if (rc === 2) return now - sent >= 72 * H;
    return false;
  });

  const results: unknown[] = [];
  for (const r of due) {
    const snap = (r.cart_snapshot as Snap[]) || [];
    if (!snap.length || !r.customer_email) continue;
    const total = Number(r.cart_total ?? snap.reduce((s, x) => s + x.qty * x.price, 0));
    const rc = r.reminder_count ?? 0;

    let subject = "";
    let html = "";
    if (rc === 0) {
      subject = "🛒 คุณลืมอะไรไว้ที่ ENT Group IT Shop";
      html = reminder1(snap, total);
    } else if (rc === 1) {
      const skus = snap.map((s) => s.sku).filter(Boolean);
      const { data: prods } = await db
        .from("synnex_products")
        .select("sku, stock_qty")
        .in("sku", skus);
      const stockMap: Record<string, number> = {};
      (prods ?? []).forEach((p) => { stockMap[p.sku as string] = Number(p.stock_qty ?? 0); });
      subject = "⚡ สินค้าของคุณอาจหมดสต็อก — ENT Group";
      html = reminder2(snap, total, stockMap);
    } else {
      subject = "🎁 ของขวัญพิเศษสำหรับคุณ — ENT Group";
      html = reminder3(snap, total);
    }

    const send = await sendResend({ to: r.customer_email, subject, html });
    if (send.ok) {
      await db
        .from("cart_reminders")
        .update({ reminder_sent_at: new Date().toISOString(), reminder_count: rc + 1 })
        .eq("id", r.id);
      results.push({ id: r.id, sent: true, stage: rc + 1 });
    } else {
      results.push({ id: r.id, sent: false, error: send.data });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
