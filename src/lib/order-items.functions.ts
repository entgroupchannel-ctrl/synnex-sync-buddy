import { createServerFn } from "@tanstack/react-start";
import { insertOrderItemsSchema, type OrderItemInput } from "@/lib/order-items.schema";

export type { OrderItemInput };

/**
 * บันทึก order_items พร้อมเติม cost_price / brand / category จากฝั่งเซิร์ฟเวอร์
 * client ส่งเฉพาะข้อมูลที่ตัวเองรู้อยู่แล้ว และ handler ไม่คืน cost_price กลับไป
 */
export const insertOrderItems = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => insertOrderItemsSchema.parse(input))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();



    const skus = [...new Set(data.items.map((i) => i.product_sku).filter(Boolean))];

    const { data: productRows, error: productsError } = await supabaseAdmin
      .from("synnex_products")
      .select("sku, cost_price, brand, category")
      .in("sku", skus);
    if (productsError) throw new Error(`ตรวจสอบข้อมูลสินค้าไม่สำเร็จ: ${productsError.message}`);

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
    if (error) {
      console.error("[order-items] insert failed", { code: error.code, message: error.message });
      throw new Error(`บันทึกรายการสินค้าไม่สำเร็จ: ${error.message}`);
    }

    return { inserted: rows.length };
  });
