import { describe, expect, it } from "vitest";
import { CLEAR_STALE_BROWSE_FILTERS } from "@/lib/search-defaults";

// กันการ regression ของบั๊กจริง: เลือกแบรนด์ (เช่น Huawei) หลังค้นหาคำอื่นไว้ก่อน (เช่น "AirPods")
// แล้วเจอ "ไม่พบสินค้า" ทั้งที่มีสินค้าจริง เพราะ q/min/max/ramSpec ฯลฯ ตกค้างจากการเข้าชมก่อนหน้า
describe("CLEAR_STALE_BROWSE_FILTERS", () => {
  it("ต้องล้างข้อความค้นหา (q) กลับเป็นค่าว่างเสมอ", () => {
    expect(CLEAR_STALE_BROWSE_FILTERS.q).toBe("");
  });

  it("ต้องล้างช่วงราคากลับเป็นค่าเริ่มต้นเต็มช่วงเสมอ", () => {
    expect(CLEAR_STALE_BROWSE_FILTERS.min).toBe(0);
    expect(CLEAR_STALE_BROWSE_FILTERS.max).toBe(100000);
  });

  it("ต้องล้างตัวกรองหมวดย่อยทั้งหมดที่อาจตกค้าง (RAM/Components/Jetson/subcategory)", () => {
    expect(CLEAR_STALE_BROWSE_FILTERS.sub).toBe("");
    expect(CLEAR_STALE_BROWSE_FILTERS.ramSpec).toBe("");
    expect(CLEAR_STALE_BROWSE_FILTERS.ramGen).toBe("");
    expect(CLEAR_STALE_BROWSE_FILTERS.jetsonType).toBe("");
    expect(CLEAR_STALE_BROWSE_FILTERS.compType).toBe("all");
  });

  it("ไม่ควรมี category อยู่ในนี้ — แต่ละจุดเรียกต้องตัดสินใจเอง (เช่น Smart Life ต้องคงหมวดไว้)", () => {
    expect("category" in CLEAR_STALE_BROWSE_FILTERS).toBe(false);
  });
});
