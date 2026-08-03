import { describe, expect, it } from "vitest";
import { insertOrderItemsSchema } from "../order-items.schema";

const validItem = {
  order_id: "6e6cf60c-cbf0-4f7b-b45b-66db11a2a227",
  product_sku: "TEST-001",
  product_name: "สินค้าทดสอบ",
  product_image_url: "https://shop.entgroup.co.th/favicon.png",
  distributor: "OTHER",
  unit_price: 100,
  quantity: 1,
  subtotal: 100,
  category: null,
};

describe("order item input", () => {
  it("accepts a valid cart item", () => {
    expect(insertOrderItemsSchema.parse({ items: [validItem] }).items).toHaveLength(1);
  });

  it("rejects an empty order", () => {
    expect(() => insertOrderItemsSchema.parse({ items: [] })).toThrow();
  });

  it("rejects invalid quantity and price", () => {
    expect(() =>
      insertOrderItemsSchema.parse({
        items: [{ ...validItem, quantity: 0, unit_price: Number.NaN }],
      }),
    ).toThrow();
  });
});