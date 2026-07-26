import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Rule = {
  id: string;
  rule_type: string | null;
  target: string | null;
  markup_percent: number | null;
  is_active: boolean | null;
};

type Product = {
  id: string;
  brand: string | null;
  category: string | null;
  cost_price: number | null;
  price: number | null;
  markup_override: number | null;
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
    const { adminContext, roundTo10 } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);

    const { data: rules } = await db
      .from("pricing_rules")
      .select("id, rule_type, target, markup_percent, is_active")
      .eq("is_active", true);
    const active = (rules ?? []) as Rule[];
    const global = active.find((r) => r.rule_type === "global");
    const byCat = new Map<string, number>();
    const byBrand = new Map<string, number>();
    for (const r of active) {
      if (r.rule_type === "category" && r.target) byCat.set(r.target.toLowerCase(), Number(r.markup_percent ?? 0));
      if (r.rule_type === "brand" && r.target) byBrand.set(r.target.toLowerCase(), Number(r.markup_percent ?? 0));
    }
    const globalPct = Number(global?.markup_percent ?? 15);

    const pageSize = 1000;
    let offset = 0;
    let updated = 0;
    let scanned = 0;
    let total = 0;

    while (true) {
      const { data, error, count } = await db
        .from("synnex_products")
        .select("id, brand, category, cost_price, price, markup_override", { count: "exact" })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(error.message);
      if (count != null && total === 0) total = count;
      const rows = (data ?? []) as Product[];
      if (rows.length === 0) break;

      for (const p of rows) {
        scanned++;
        const cost = Number(p.cost_price ?? p.price ?? 0);
        if (!cost || cost <= 0) continue;
        let pct: number;
        if (p.markup_override != null) pct = Number(p.markup_override);
        else if (p.brand && byBrand.has(p.brand.toLowerCase())) pct = byBrand.get(p.brand.toLowerCase())!;
        else if (p.category && byCat.has(p.category.toLowerCase())) pct = byCat.get(p.category.toLowerCase())!;
        else pct = globalPct;

        const selling = roundTo10(cost * (1 + pct / 100));
        const { error: uerr } = await db
          .from("synnex_products")
          .update({ selling_price: selling, price_approved: true })
          .eq("id", p.id);
        if (!uerr) updated++;
      }

      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    return { updated, scanned, total };
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
