import { describe, expect, it } from "vitest";
import {
  buildRuleIndex,
  computeSellingPrice,
  guardAgainstPriceDrop,
  resolveMarkupPct,
  resolveMinProfit,
  type PricingRuleRow,
} from "@/lib/pricing-calc";

function rule(partial: Partial<PricingRuleRow>): PricingRuleRow {
  return {
    id: partial.id ?? "r",
    rule_type: partial.rule_type ?? null,
    target: partial.target ?? null,
    markup_percent: partial.markup_percent ?? null,
    is_active: partial.is_active ?? true,
    min_cost: partial.min_cost ?? null,
    max_cost: partial.max_cost ?? null,
    min_profit: partial.min_profit ?? null,
  };
}

// จำลองกฎ RAM จริงที่ตั้งไว้: <500 / 500-1.5k / 1.5k-5k / 5k+ = 90/39/14/13%
const ramRules: PricingRuleRow[] = [
  rule({ rule_type: "cost_band", target: "ram", min_cost: 0, max_cost: 500, markup_percent: 90 }),
  rule({ rule_type: "cost_band", target: "ram", min_cost: 500, max_cost: 1500, markup_percent: 39 }),
  rule({ rule_type: "cost_band", target: "ram", min_cost: 1500, max_cost: 5000, markup_percent: 14 }),
  rule({ rule_type: "cost_band", target: "ram", min_cost: 5000, max_cost: null, markup_percent: 13 }),
  rule({ rule_type: "global", target: null, markup_percent: 15 }),
];

describe("resolveMarkupPct — ลำดับความสำคัญของกฎ", () => {
  it("cost_band ตามหมวด ต้องเลือกช่วงทุนที่ถูกต้อง", () => {
    const idx = buildRuleIndex(ramRules);
    expect(resolveMarkupPct(idx, { brand: null, category: "RAM", markup_override: null }, 300)).toBe(90);
    expect(resolveMarkupPct(idx, { brand: null, category: "RAM", markup_override: null }, 800)).toBe(39);
    expect(resolveMarkupPct(idx, { brand: null, category: "RAM", markup_override: null }, 2000)).toBe(14);
    expect(resolveMarkupPct(idx, { brand: null, category: "RAM", markup_override: null }, 6000)).toBe(13);
  });

  it("จับคู่หมวดแบบไม่สนตัวพิมพ์", () => {
    const idx = buildRuleIndex(ramRules);
    expect(resolveMarkupPct(idx, { brand: null, category: "ram", markup_override: null }, 300)).toBe(90);
  });

  it("หมวดที่ไม่มี cost_band ตกไปใช้ global", () => {
    const idx = buildRuleIndex(ramRules);
    expect(resolveMarkupPct(idx, { brand: null, category: "Printer", markup_override: null }, 10000)).toBe(15);
  });

  it("markup_override ของสินค้าต้องชนะทุกกฎ", () => {
    const idx = buildRuleIndex(ramRules);
    expect(resolveMarkupPct(idx, { brand: null, category: "RAM", markup_override: 5 }, 300)).toBe(5);
  });

  it("กฎ brand ต้องชนะ cost_band", () => {
    const idx = buildRuleIndex([...ramRules, rule({ rule_type: "brand", target: "Kingston", markup_percent: 20 })]);
    expect(resolveMarkupPct(idx, { brand: "Kingston", category: "RAM", markup_override: null }, 300)).toBe(20);
  });
});

describe("resolveMinProfit + computeSellingPrice — พื้นกำไรขั้นต่ำ", () => {
  const printerRules: PricingRuleRow[] = [
    rule({ rule_type: "cost_band", target: "printer", min_cost: 0, max_cost: 6000, markup_percent: 17, min_profit: 400 }),
    rule({ rule_type: "global", target: null, markup_percent: 15 }),
  ];

  it("ใช้กำไรขั้นต่ำเมื่อ markup % ให้กำไรน้อยกว่า", () => {
    const idx = buildRuleIndex(printerRules);
    // ทุน 1000 x 17% = 170 กำไร < 400 ขั้นต่ำ → ต้องใช้ 1000+400=1400 ปัดเป็น 1400
    const selling = computeSellingPrice(idx, { brand: null, category: "Printer", markup_override: null }, 1000);
    expect(selling).toBe(1400);
  });

  it("ใช้ markup % เมื่อให้กำไรมากกว่ากำไรขั้นต่ำ", () => {
    const idx = buildRuleIndex(printerRules);
    // ทุน 5000 x 17% = 850 กำไร > 400 ขั้นต่ำ → ใช้ markup: 5850 ปัดเป็น 5850 (หลักสิบอยู่แล้ว)
    const selling = computeSellingPrice(idx, { brand: null, category: "Printer", markup_override: null }, 5000);
    expect(selling).toBe(5850);
  });
});

describe("guardAgainstPriceDrop — การ์ดกัน applyPricing ลดราคา", () => {
  it("ราคาที่คำนวณใหม่ต่ำกว่าราคาเดิม ต้องถูกกันไว้ ไม่ทับ", () => {
    const result = guardAgainstPriceDrop(1000, 5000);
    expect(result.guarded).toBe(true);
    expect(result.finalPrice).toBe(5000);
  });

  it("ราคาที่คำนวณใหม่สูงกว่าหรือเท่าราคาเดิม ต้องอัปเดตได้ตามปกติ", () => {
    const higher = guardAgainstPriceDrop(6000, 5000);
    expect(higher.guarded).toBe(false);
    expect(higher.finalPrice).toBe(6000);

    const equal = guardAgainstPriceDrop(5000, 5000);
    expect(equal.guarded).toBe(false);
    expect(equal.finalPrice).toBe(5000);
  });

  it("ไม่มีราคาเดิม (สินค้าใหม่) ต้องใช้ราคาที่คำนวณได้เสมอ", () => {
    const result = guardAgainstPriceDrop(1000, null);
    expect(result.guarded).toBe(false);
    expect(result.finalPrice).toBe(1000);
  });

  it("ราคาเดิมเป็น 0 หรือติดลบ (ยังไม่เคยตั้งราคาจริง) ไม่ถือว่าโดนกัน", () => {
    const result = guardAgainstPriceDrop(1000, 0);
    expect(result.guarded).toBe(false);
    expect(result.finalPrice).toBe(1000);
  });
});

describe("สมมติฐานที่ทำให้เกิดบั๊ก -77%: cost_band ไม่ถูกมองเห็นโดยตรรกะเก่า", () => {
  it("สินค้า RAM ทุนต่ำที่เคยถูกตั้งราคาด้วย markup 90% ต้องไม่ถูกลดเหลือ global 15%", () => {
    const idx = buildRuleIndex(ramRules);
    const cost = 300;
    const correctSelling = computeSellingPrice(idx, { brand: null, category: "RAM", markup_override: null }, cost);
    // เคยตั้งราคาด้วย markup ที่ถูกต้อง (90%) ไว้แล้ว
    const existing = Math.round((cost * 1.9) / 10) * 10;
    const { finalPrice, guarded } = guardAgainstPriceDrop(correctSelling, existing);
    expect(correctSelling).toBe(existing); // ตรรกะใหม่คำนวณได้ตรงกับของเดิม ไม่มีอะไรถูกกัน
    expect(guarded).toBe(false);
    expect(finalPrice).toBe(existing);
  });
});
