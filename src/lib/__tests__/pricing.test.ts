import { describe, expect, it } from "vitest";
import { getSellingPrice } from "@/lib/cart";

// clamp ไม่ทำงาน (min_tier_price ต่ำกว่าราคาทุก tier)
const normal = {
  selling_price: 1000,
  member_price: 950,
  b2b_price: 900,
  min_tier_price: 700,
};

// clamp ทำงาน (พื้นราคาสูงกว่าราคาหลังลด)
const clamped = {
  selling_price: 1000,
  member_price: 950,
  b2b_price: 900,
  min_tier_price: 960,
};

describe("getSellingPrice — บันไดราคาแต่ละ tier", () => {
  it.each([
    ["guest", 1000],
    ["b2c", 950],
    ["b2c_silver", 922],
    ["b2c_gold", 893],
    ["b2c_vip", 874],
    ["b2b", 900],
    ["b2b_silver", 882],
    ["b2b_gold", 855],
  ] as const)("tier %s ได้ราคา %i", (tier, expected) => {
    expect(getSellingPrice(normal, tier)).toBe(expected);
  });
});

describe("getSellingPrice — พื้นราคาขั้นต่ำ (clamp)", () => {
  it("ห้ามขายต่ำกว่า min_tier_price ในทุก tier ที่มีส่วนลด", () => {
    for (const tier of [
      "b2c",
      "b2c_silver",
      "b2c_gold",
      "b2c_vip",
      "b2b",
      "b2b_silver",
      "b2b_gold",
    ] as const) {
      expect(getSellingPrice(clamped, tier)).toBeGreaterThanOrEqual(960);
    }
  });

  it("guest ไม่โดน clamp เพราะไม่มีส่วนลด", () => {
    expect(getSellingPrice(clamped, "guest")).toBe(1000);
  });
});

describe("getSellingPrice — กรณีขอบ", () => {
  it("ไม่มี member_price ให้ถือว่าเป็น 95% ของราคาปกติ", () => {
    expect(
      getSellingPrice({ selling_price: 1000, min_tier_price: 0 }, "b2c"),
    ).toBe(950);
  });

  it("ไม่มี b2b_price ให้ตกกลับไปใช้ฐานราคาสมาชิก", () => {
    expect(
      getSellingPrice(
        { selling_price: 1000, member_price: 950, min_tier_price: 0 },
        "b2b",
      ),
    ).toBe(950);
  });

  it("ราคาเกิน 70,000 ต้องคืน null เพื่อให้หน้าเว็บขึ้น 'ติดต่อสอบถาม'", () => {
    expect(getSellingPrice({ selling_price: 80000 }, "guest")).toBeNull();
  });

  it("ไม่มีราคาหรือราคาเป็น 0 ต้องคืน null", () => {
    expect(getSellingPrice({ selling_price: 0 }, "guest")).toBeNull();
    expect(getSellingPrice({ selling_price: null }, "guest")).toBeNull();
  });
});
