export type PricingRule = {
  id: string;
  rule_type: string | null;
  target: string | null;
  markup_percent: number | null;
  is_active: boolean | null;
};

export type PricingRulesIndex = {
  global: number;
  byBrand: Map<string, number>;
  byCategory: Map<string, number>;
};

export function indexPricingRules(rules: PricingRule[] | null | undefined, fallbackGlobal = 15): PricingRulesIndex {
  const active = (rules ?? []).filter((r) => r.is_active !== false);
  const global = active.find((r) => r.rule_type === "global");
  const byBrand = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const r of active) {
    if (!r.target) continue;
    const pct = Number(r.markup_percent ?? 0);
    if (r.rule_type === "brand") byBrand.set(r.target.toLowerCase(), pct);
    else if (r.rule_type === "category") byCategory.set(r.target.toLowerCase(), pct);
  }
  return { global: Number(global?.markup_percent ?? fallbackGlobal), byBrand, byCategory };
}

export function effectiveMarkup(
  p: { brand?: string | null; category?: string | null; markup_override?: number | null },
  idx: PricingRulesIndex,
): { pct: number; source: "override" | "brand" | "category" | "global" } {
  if (p.markup_override != null) return { pct: Number(p.markup_override), source: "override" };
  if (p.brand && idx.byBrand.has(p.brand.toLowerCase())) return { pct: idx.byBrand.get(p.brand.toLowerCase())!, source: "brand" };
  if (p.category && idx.byCategory.has(p.category.toLowerCase())) return { pct: idx.byCategory.get(p.category.toLowerCase())!, source: "category" };
  return { pct: idx.global, source: "global" };
}

export function computeSelling(cost: number, markupPct: number): number {
  return Math.round((cost * (1 + markupPct / 100)) / 10) * 10;
}

export const bahtFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
