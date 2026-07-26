import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildRuleIndex, computeSellingPrice, guardAgainstPriceDrop, type PricingRuleRow } from "@/lib/pricing-calc";

type Rule = PricingRuleRow;

type Product = {
  id: string;
  brand: string | null;
  category: string | null;
  cost_price: number | null;
  price: number | null;
  markup_override: number | null;
  selling_price: number | null;
};

export type PricingProductRow = {
  id: string;
  sku: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  distributor: string | null;
  image_url: string | null;
  cost_price: number | null;
  price: number | null;
  selling_price: number | null;
  markup_override: number | null;
  price_approved: boolean | null;
  updated_at: string | null;
};

export const applyPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);

    const { data: rules } = await db
      .from("pricing_rules")
      .select("id, rule_type, target, markup_percent, is_active, min_cost, max_cost, min_profit")
      .eq("is_active", true);
    const active = (rules ?? []) as Rule[];
    const ruleIndex = buildRuleIndex(active);

    const pageSize = 1000;
    let offset = 0;
    let updated = 0;
    let scanned = 0;
    let guarded = 0;
    let total = 0;

    while (true) {
      const { data, error, count } = await db
        .from("synnex_products")
        .select("id, brand, category, cost_price, price, markup_override, selling_price", { count: "exact" })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(error.message);
      if (count != null && total === 0) total = count;
      const rows = (data ?? []) as Product[];
      if (rows.length === 0) break;

      for (const p of rows) {
        scanned++;
        const cost = Number(p.cost_price ?? p.price ?? 0);
        if (!cost || cost <= 0) continue;

        const computed = computeSellingPrice(ruleIndex, p, cost);
        const existing = p.selling_price != null ? Number(p.selling_price) : null;

        // การ์ด: ห้าม recalculation ทำให้ราคาลดลงจากที่มีอยู่ (เช่น ราคาที่ตั้งมือไว้สูงกว่ากฎ) — ข้ามและนับไว้แทนการทับเงียบๆ
        const { finalPrice, guarded: wasGuarded } = guardAgainstPriceDrop(computed, existing);
        if (wasGuarded) {
          guarded++;
          continue;
        }

        const { error: uerr } = await db
          .from("synnex_products")
          .update({ selling_price: finalPrice, price_approved: true })
          .eq("id", p.id);
        if (!uerr) updated++;
      }

      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    return { updated, scanned, guarded, total };
  });

export const getPricingSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);
    const [unapproved, zero, total] = await Promise.all([
      db.from("synnex_products").select("id", { count: "exact", head: true }).eq("price_approved", false),
      db.from("synnex_products").select("id", { count: "exact", head: true }).or("selling_price.is.null,selling_price.eq.0"),
      db.from("synnex_products").select("id", { count: "exact", head: true }),
    ]);
    return {
      unapproved: unapproved.count ?? 0,
      zero: zero.count ?? 0,
      total: total.count ?? 0,
    };
  });

/** รายการสินค้าสำหรับหน้า /admin/pricing/products (อ่าน cost_price / markup_override ฝั่งเซิร์ฟเวอร์) */
export const listPricingProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    q: string;
    distributor: string;
    category: string;
    status: string;
    brands: string[];
    sort: string;
    page: number;
    pageSize: number;
  }) => input)
  .handler(async ({ context, data: search }) => {
    const { adminContext, SORT_MAP, ADMIN_PRODUCT_COLUMNS } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);

    const from = (search.page - 1) * search.pageSize;
    const to = from + search.pageSize - 1;
    const so = SORT_MAP[search.sort] ?? SORT_MAP.sku_asc;

    let qq = db
      .from("synnex_products")
      .select(ADMIN_PRODUCT_COLUMNS as "*", { count: "exact" })
      .order(so.col, { ascending: so.asc, nullsFirst: false })
      .range(from, to);

    const s = search.q.trim().replace(/[%,]/g, "");
    if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
    if (search.distributor !== "all") qq = qq.eq("distributor", search.distributor);
    if (search.category !== "all") qq = qq.eq("category", search.category);
    if (search.brands.length > 0) qq = qq.in("brand", search.brands);
    if (search.status === "unapproved") qq = qq.or("price_approved.eq.false,selling_price.is.null");
    else if (search.status === "zero") qq = qq.or("selling_price.is.null,selling_price.eq.0");
    else if (search.status === "approved") qq = qq.eq("price_approved", true);

    const { data, error, count } = await qq;
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as unknown as PricingProductRow[], count: count ?? 0 };
  });

/** ดึงข้อมูลสินค้าตาม id สำหรับคำนวณ markup แบบ bulk */
export const getProductsForBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => input)
  .handler(async ({ context, data }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);
    const { data: rows, error } = await db
      .from("synnex_products")
      .select("id, sku, name, cost_price, price, selling_price, markup_override")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Array<{
      id: string;
      sku: string;
      name: string | null;
      cost_price: number | null;
      price: number | null;
      selling_price: number | null;
      markup_override: number | null;
    }>;
  });

/** ดึงข้อมูลทั้งชุดตาม filter สำหรับ export CSV */
export const exportPricingProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    q: string;
    distributor: string;
    category: string;
    status: string;
    brands: string[];
    sort: string;
  }) => input)
  .handler(async ({ context, data: search }) => {
    const { adminContext, SORT_MAP } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);
    const so = SORT_MAP[search.sort] ?? SORT_MAP.sku_asc;

    const build = () => {
      let qq = db
        .from("synnex_products")
        .select(
          "sku, name, brand, category, distributor, cost_price, price, selling_price, markup_override, price_approved, updated_at",
          { count: "exact" },
        )
        .order(so.col, { ascending: so.asc, nullsFirst: false });
      const s = search.q.trim().replace(/[%,]/g, "");
      if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
      if (search.distributor !== "all") qq = qq.eq("distributor", search.distributor);
      if (search.category !== "all") qq = qq.eq("category", search.category);
      if (search.brands.length > 0) qq = qq.in("brand", search.brands);
      if (search.status === "unapproved") qq = qq.or("price_approved.eq.false,selling_price.is.null");
      else if (search.status === "zero") qq = qq.or("selling_price.is.null,selling_price.eq.0");
      else if (search.status === "approved") qq = qq.eq("price_approved", true);
      return qq;
    };

    type ExportRow = {
      sku: string;
      name: string | null;
      brand: string | null;
      category: string | null;
      distributor: string | null;
      cost_price: number | null;
      price: number | null;
      selling_price: number | null;
      markup_override: number | null;
      price_approved: boolean | null;
      updated_at: string | null;
    };

    const CHUNK = 1000;
    const all: ExportRow[] = [];
    const first = await build().range(0, CHUNK - 1);
    if (first.error) throw new Error(first.error.message);
    for (const r of first.data ?? []) all.push(r as unknown as ExportRow);
    const total = first.count ?? all.length;
    let start = CHUNK;
    while (start < total) {
      const next = await build().range(start, start + CHUNK - 1);
      if (next.error) throw new Error(next.error.message);
      for (const r of next.data ?? []) all.push(r as unknown as ExportRow);
      start += CHUNK;
    }
    return all;
  });
