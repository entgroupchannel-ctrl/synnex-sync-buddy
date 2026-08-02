import { createServerFn } from "@tanstack/react-start";

export type OrderItemInput = {
  order_id: string;
  product_sku: string;
  product_name: string | null;
  product_image_url: string | null;
  distributor: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  category: string | null;
};

/**
 * บันทึก order_items พร้อมเติม cost_price / brand / category จากฝั่งเซิร์ฟเวอร์
 * client ส่งเฉพาะข้อมูลที่ตัวเองรู้อยู่แล้ว และ handler ไม่คืน cost_price กลับไป
 */
export const insertOrderItems = createServerFn({ method: "POST" })
  .inputValidator((input: { items: OrderItemInput[] }) => input)
  .handler(async ({ data }) => {
    let supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
    try {
      ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
      // แตะ client ครั้งแรกเพื่อให้ error เรื่อง env โผล่ตรงนี้ ไม่ใช่กลางทาง
      void supabaseAdmin.from("order_items");
    } catch (e) {
      console.error("[insertOrderItems] service role ใช้งานไม่ได้", e);
      throw new Error(
        "ระบบหลังบ้านยังเชื่อมต่อฐานข้อมูลไม่ได้ (SUPABASE_SERVICE_ROLE_KEY หาย) กรุณาแจ้งผู้ดูแลระบบ",
      );
    }


    const skus = [...new Set(data.items.map((i) => i.product_sku).filter(Boolean))];

    const { data: productRows } = await supabaseAdmin
      .from("synnex_products")
      .select("sku, cost_price, brand, category")
      .in("sku", skus);

    const meta = new Map(
      (productRows ?? []).map((p) => [
        p.sku,
        { cost_price: p.cost_price, brand: p.brand, category: p.category },
      ]),
    );

    const rows = data.items.map((it) => {
      const m = meta.get(it.product_sku);
      return {
        order_id: it.order_id,
        product_sku: it.product_sku,
        product_name: it.product_name ?? it.product_sku,

        product_image_url: it.product_image_url,
        brand: m?.brand ?? null,
        category: m?.category ?? it.category ?? null,
        distributor: it.distributor,
        cost_price: m?.cost_price ?? null,
        unit_price: it.unit_price,
        quantity: it.quantity,
        subtotal: it.subtotal,
      };
    });

    const { error } = await supabaseAdmin.from("order_items").insert(rows);
    if (error) throw new Error(error.message);

    return { inserted: rows.length };
  });
