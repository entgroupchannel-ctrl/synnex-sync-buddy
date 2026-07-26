import { describe, expect, it } from "vitest";
import { imagesFirst, imagesFirstShuffled } from "@/lib/product-sort";

type Item = { id: string; image_url: string | null };

describe("imagesFirst", () => {
  it("ดันสินค้าไม่มีรูปไปท้ายลิสต์เสมอ", () => {
    const items: Item[] = [
      { id: "a", image_url: "x.jpg" },
      { id: "b", image_url: null },
      { id: "c", image_url: "y.jpg" },
      { id: "d", image_url: null },
      { id: "e", image_url: "z.jpg" },
    ];
    const sorted = imagesFirst(items).map((p) => p.id);
    expect(sorted).toEqual(["a", "c", "e", "b", "d"]);
  });

  it("คงลำดับเดิมภายในแต่ละกลุ่มไว้ (stable) เช่นเรียงราคาถูกไปแพงมาก่อน", () => {
    const items: Item[] = [
      { id: "cheap-no-img", image_url: null },
      { id: "cheap-img", image_url: "a.jpg" },
      { id: "mid-img", image_url: "b.jpg" },
      { id: "mid-no-img", image_url: null },
    ];
    const sorted = imagesFirst(items).map((p) => p.id);
    expect(sorted).toEqual(["cheap-img", "mid-img", "cheap-no-img", "mid-no-img"]);
  });

  it("ลิสต์ว่างหรือมีรูปครบทุกชิ้น ไม่เปลี่ยนลำดับ", () => {
    const items: Item[] = [
      { id: "a", image_url: "x.jpg" },
      { id: "b", image_url: "y.jpg" },
    ];
    expect(imagesFirst(items).map((p) => p.id)).toEqual(["a", "b"]);
    expect(imagesFirst([])).toEqual([]);
  });

  it("image_url เป็น string ว่าง ('') ก็ถือว่าไม่มีรูป", () => {
    const items: Item[] = [
      { id: "a", image_url: "" },
      { id: "b", image_url: "x.jpg" },
    ];
    expect(imagesFirst(items).map((p) => p.id)).toEqual(["b", "a"]);
  });
});

describe("imagesFirstShuffled", () => {
  it("กลุ่มมีรูปต้องมาก่อนกลุ่มไม่มีรูปเสมอ แม้จะสุ่มลำดับภายในกลุ่ม", () => {
    const items: Item[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      image_url: i % 2 === 0 ? `img-${i}.jpg` : null,
    }));
    const result = imagesFirstShuffled(items);
    const firstNoImageIdx = result.findIndex((p) => !p.image_url);
    const lastImageIdx = result.map((p) => !!p.image_url).lastIndexOf(true);
    expect(lastImageIdx).toBeLessThan(firstNoImageIdx === -1 ? Infinity : firstNoImageIdx);
    expect(result).toHaveLength(items.length);
  });

  it("ไม่ทำของหาย และไม่เพิ่มของปลอม", () => {
    const items: Item[] = [
      { id: "a", image_url: "x.jpg" },
      { id: "b", image_url: null },
      { id: "c", image_url: "y.jpg" },
    ];
    const result = imagesFirstShuffled(items);
    expect(result.map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });
});
