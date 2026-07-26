import { describe, expect, it } from "vitest";
import { PRODUCT_PUBLIC_COLUMNS } from "@/lib/product-columns";

/**
 * กันไม่ให้คอลัมน์ต้นทุน/มาร์กอัปหลุดกลับเข้าไปในลิสต์ที่ส่งให้ฝั่ง client
 */
const FORBIDDEN = [
  "cost_price",
  "markup_applied",
  "markup_override",
  "b2b_markup_applied",
];

describe("PRODUCT_PUBLIC_COLUMNS", () => {
  const columns = String(PRODUCT_PUBLIC_COLUMNS)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  it.each(FORBIDDEN)("ต้องไม่มีคอลัมน์ %s", (col) => {
    expect(columns).not.toContain(col);
  });

  it("ต้องไม่ใช่ค่า * (ต้องระบุคอลัมน์ชัดเจน)", () => {
    expect(columns).not.toContain("*");
    expect(columns.length).toBeGreaterThan(5);
  });

  it("ต้องมีคอลัมน์ที่หน้าเว็บใช้จริงครบ", () => {
    for (const need of [
      "id",
      "sku",
      "name",
      "selling_price",
      "member_price",
      "b2b_price",
      "price_approved",
      "image_url",
      "image_gallery",
      "stock_status",
      "fulfillment_type",
      "created_at",
      "description",
    ]) {
      expect(columns).toContain(need);
    }
  });
});
