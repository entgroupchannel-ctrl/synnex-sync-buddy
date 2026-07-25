import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VolumeRule = {
  id: string;
  apply_to: string | null;
  apply_value: string | null;
  min_qty: number;
  max_qty: number | null;
  discount_type: string | null;
  discount_value: number;
  label_th: string | null;
  is_active: boolean | null;
};

/** All active volume discount rules (shared cache). */
export function useVolumeRules() {
  return useQuery({
    queryKey: ["volume-discount-rules"],
    queryFn: async (): Promise<VolumeRule[]> => {
      const { data } = await supabase
        .from("volume_discount_rules")
        .select("id,apply_to,apply_value,min_qty,max_qty,discount_type,discount_value,label_th,is_active")
        .eq("is_active", true)
        .order("min_qty", { ascending: true });
      return (data ?? []) as VolumeRule[];
    },
    staleTime: 10 * 60_000,
  });
}

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/** Rules that apply to a given product (matched by brand or category). */
export function rulesForProduct(
  rules: VolumeRule[] | undefined,
  product: { brand?: string | null; category?: string | null },
): VolumeRule[] {
  if (!rules?.length) return [];
  const b = norm(product.brand);
  const c = norm(product.category);
  return rules
    .filter((r) => {
      const v = norm(r.apply_value);
      if (!v) return false;
      return (r.apply_to === "brand" && v === b) || (r.apply_to === "category" && v === c) || v === b || v === c;
    })
    .sort((a, b2) => a.min_qty - b2.min_qty);
}

export function hasVolumeDiscount(
  rules: VolumeRule[] | undefined,
  product: { brand?: string | null; category?: string | null },
): boolean {
  return rulesForProduct(rules, product).length > 0;
}

export function tierQtyLabel(r: VolumeRule): string {
  return r.max_qty ? `ซื้อ ${r.min_qty}-${r.max_qty} ชิ้น` : `ซื้อ ${r.min_qty}+ ชิ้น`;
}

export function tierDiscountLabel(r: VolumeRule): string {
  return r.discount_type === "percent"
    ? `ลด ${Number(r.discount_value)}%`
    : `ลด ฿${Number(r.discount_value).toLocaleString("th-TH")}`;
}

export type VolumeGroupResult = {
  key: string;
  qty: number;
  total: number;
  rule: VolumeRule;
  discount: number;
};

export type VolumeCartItem = {
  brand?: string | null;
  category?: string | null;
  price: number;
  qty: number;
};

/** Group cart items by brand (fallback: category) and apply the best matching rule per group. */
export function getVolumeDiscount(
  items: VolumeCartItem[],
  rules: VolumeRule[] | undefined,
): { total: number; groups: VolumeGroupResult[] } {
  if (!rules?.length) return { total: 0, groups: [] };
  const groups = new Map<string, { qty: number; total: number; brand: string | null; category: string | null }>();
  for (const it of items) {
    const key = norm(it.brand) || norm(it.category);
    if (!key) continue;
    const g = groups.get(key) ?? { qty: 0, total: 0, brand: it.brand ?? null, category: it.category ?? null };
    g.qty += it.qty;
    g.total += (it.price || 0) * it.qty;
    groups.set(key, g);
  }

  const results: VolumeGroupResult[] = [];
  let total = 0;
  for (const [key, g] of groups) {
    const applicable = rulesForProduct(rules, { brand: g.brand, category: g.category })
      .filter((r) => r.min_qty <= g.qty)
      .filter((r) => !r.max_qty || r.max_qty >= g.qty)
      .sort((a, b) => b.min_qty - a.min_qty);
    const rule = applicable[0];
    if (!rule) continue;
    const discount =
      rule.discount_type === "percent"
        ? Math.round(g.total * (Number(rule.discount_value) / 100))
        : Math.min(g.total, Number(rule.discount_value));
    if (discount <= 0) continue;
    total += discount;
    results.push({ key: g.brand || g.category || key, qty: g.qty, total: g.total, rule, discount });
  }
  return { total, groups: results };
}
