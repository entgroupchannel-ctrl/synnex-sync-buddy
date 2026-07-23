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

function roundTo10(n: number) {
  return Math.round(n / 10) * 10;
}

export const applyPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: rules } = await supabase
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

    // Fetch all products in pages of 1000
    const pageSize = 1000;
    let offset = 0;
    let updated = 0;
    let scanned = 0;
    let total = 0;

    while (true) {
      const { data, error, count } = await supabase
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
        const { error: uerr } = await supabase
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
    const { supabase } = context;
    const [unapproved, zero, total] = await Promise.all([
      supabase.from("synnex_products").select("*", { count: "exact", head: true }).eq("price_approved", false),
      supabase.from("synnex_products").select("*", { count: "exact", head: true }).or("selling_price.is.null,selling_price.eq.0"),
      supabase.from("synnex_products").select("*", { count: "exact", head: true }),
    ]);
    return {
      unapproved: unapproved.count ?? 0,
      zero: zero.count ?? 0,
      total: total.count ?? 0,
    };
  });
