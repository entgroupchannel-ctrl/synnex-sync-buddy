/**
 * ตรรกะคำนวณราคาขาย ต้องตรงกับฟังก์ชัน DB: calc_markup_pct / calc_min_profit / calc_selling_price
 * แยกออกมาจาก pricing.functions.ts เพื่อให้เทสได้โดยไม่ต้องต่อ DB จริง
 */

export type PricingRuleRow = {
  id: string;
  rule_type: string | null;
  target: string | null;
  markup_percent: number | null;
  is_active: boolean | null;
  min_cost: number | null;
  max_cost: number | null;
  min_profit: number | null;
};

export type PricingProductInput = {
  brand: string | null;
  category: string | null;
  markup_override: number | null;
};

export type RuleIndex = {
  globalPct: number;
  byCatPct: Map<string, number>;
  byBrandPct: Map<string, number>;
  byBrandMinProfit: Map<string, number>;
  byCatMinProfit: Map<string, number>;
  costBandByCat: Map<string, PricingRuleRow[]>;
  costBandGlobal: PricingRuleRow[];
};

/** สร้าง index จากรายการกฎที่ active เพื่อค้นหาเร็วขึ้นเวลาไล่สินค้าเป็นพันแถว */
export function buildRuleIndex(rules: PricingRuleRow[]): RuleIndex {
  const global = rules.find((r) => r.rule_type === "global");
  const byCatPct = new Map<string, number>();
  const byBrandPct = new Map<string, number>();
  const byBrandMinProfit = new Map<string, number>();
  const byCatMinProfit = new Map<string, number>();
  const costBandByCat = new Map<string, PricingRuleRow[]>();
  const costBandGlobal: PricingRuleRow[] = [];

  for (const r of rules) {
    const t = r.target ? r.target.toLowerCase() : null;
    if (r.rule_type === "category" && t) byCatPct.set(t, Number(r.markup_percent ?? 0));
    if (r.rule_type === "brand" && t) byBrandPct.set(t, Number(r.markup_percent ?? 0));
    if (r.rule_type === "brand" && t && r.min_profit != null) byBrandMinProfit.set(t, Number(r.min_profit));
    if (r.rule_type === "category" && t && r.min_profit != null) byCatMinProfit.set(t, Number(r.min_profit));
    if (r.rule_type === "cost_band") {
      if (t) {
        const arr = costBandByCat.get(t) ?? [];
        arr.push(r);
        costBandByCat.set(t, arr);
      } else {
        costBandGlobal.push(r);
      }
    }
  }

  return {
    globalPct: Number(global?.markup_percent ?? 15),
    byCatPct,
    byBrandPct,
    byBrandMinProfit,
    byCatMinProfit,
    costBandByCat,
    costBandGlobal,
  };
}

/** จับคู่กฎ cost_band ตามลำดับ min_cost มากไปน้อย (แถวแรกที่ cost อยู่ในช่วง [min_cost, max_cost)) */
export function matchCostBand(rows: PricingRuleRow[], cost: number): PricingRuleRow | undefined {
  return rows
    .filter((r) => cost >= Number(r.min_cost ?? 0) && (r.max_cost == null || cost < Number(r.max_cost)))
    .sort((a, b) => Number(b.min_cost ?? 0) - Number(a.min_cost ?? 0))[0];
}

/** ลำดับต้องตรงกับ calc_markup_pct: override > brand > cost_band(หมวด) > cost_band(global) > category > global */
export function resolveMarkupPct(idx: RuleIndex, p: PricingProductInput, cost: number): number {
  if (p.markup_override != null) return Number(p.markup_override);
  const brand = p.brand ? p.brand.toLowerCase() : null;
  const cat = p.category ? p.category.toLowerCase() : null;
  if (brand && idx.byBrandPct.has(brand)) return idx.byBrandPct.get(brand)!;
  if (cat && idx.costBandByCat.has(cat)) {
    const m = matchCostBand(idx.costBandByCat.get(cat)!, cost);
    if (m) return Number(m.markup_percent ?? 0);
  }
  const gm = matchCostBand(idx.costBandGlobal, cost);
  if (gm) return Number(gm.markup_percent ?? 0);
  if (cat && idx.byCatPct.has(cat)) return idx.byCatPct.get(cat)!;
  return idx.globalPct;
}

/** ลำดับต้องตรงกับ calc_min_profit: brand > cost_band(หมวด) > category > 0 */
export function resolveMinProfit(idx: RuleIndex, p: PricingProductInput, cost: number): number {
  const brand = p.brand ? p.brand.toLowerCase() : null;
  if (brand && idx.byBrandMinProfit.has(brand)) return idx.byBrandMinProfit.get(brand)!;
  const cat = p.category ? p.category.toLowerCase() : null;
  if (cat && idx.costBandByCat.has(cat)) {
    const m = matchCostBand(idx.costBandByCat.get(cat)!, cost);
    if (m && m.min_profit != null) return Number(m.min_profit);
  }
  if (cat && idx.byCatMinProfit.has(cat)) return idx.byCatMinProfit.get(cat)!;
  return 0;
}

function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}

/** ตรงกับ calc_selling_price: max(ทุน × markup, ทุน + กำไรขั้นต่ำ) ปัดหลักสิบ */
export function computeSellingPrice(idx: RuleIndex, p: PricingProductInput, cost: number): number {
  const pct = resolveMarkupPct(idx, p, cost);
  const minProfit = resolveMinProfit(idx, p, cost);
  return roundTo10(Math.max(cost * (1 + pct / 100), cost + minProfit));
}

/**
 * การ์ดกัน applyPricing ลดราคา: recalculation ต้องไม่ทำให้ selling_price ที่มีอยู่แล้วลดลง
 * (เช่น ราคาที่ตั้งมือไว้สูงกว่ากฎที่คำนวณได้) — คืนราคาที่จะใช้จริง + ว่าโดนกันไว้หรือไม่
 */
export function guardAgainstPriceDrop(
  computed: number,
  existing: number | null,
): { finalPrice: number; guarded: boolean } {
  if (existing != null && existing > 0 && computed < existing) {
    return { finalPrice: existing, guarded: true };
  }
  return { finalPrice: computed, guarded: false };
}
