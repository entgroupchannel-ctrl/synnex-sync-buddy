import { describe, expect, it } from "vitest";
import { CATEGORIES, detectCategory } from "@/lib/cart";

describe("CATEGORIES", () => {
  it("มีหมวด CCTV & Security แยกออกจาก Smart Life แล้ว", () => {
    expect(CATEGORIES).toContain("CCTV & Security");
    expect(CATEGORIES).toContain("Smart Life");
  });
});

describe("detectCategory — เส้นทางกล้องวงจรปิด/CCTV", () => {
  it.each([
    "กล้องวงจรปิด 3.6mm IP Camera DAHUA HFW1239TL1-A-IL",
    "2MP WizColor+SmartDualLight HDCVI Fixed-focal IP Camera",
    "DHI-NVR4216-16P-4KS3",
    "DS-2CD2026G2-IU(D)(2.8MM) DVR",
    "กล้องวงจรปิด 2.8mm IP Camera VIGI C420I",
  ])("ต้องแยกไปหมวด CCTV & Security: %s", (name) => {
    expect(detectCategory(name)).toBe("CCTV & Security");
  });

  it("สินค้า TP-LINK ที่ไม่ใช่กล้อง (เช่น Smart Plug) ต้องไม่ไปหมวด CCTV & Security", () => {
    expect(detectCategory("ปลั๊กไฟอัจฉริยะ TP-LINK TAPO WI-FI Smart Plug TP-LINK (P100)"))
      .not.toBe("CCTV & Security");
  });

  it("เส้นทางเดิม (Notebook/Monitor/ฯลฯ) ยังทำงานถูกต้องเหมือนเดิม", () => {
    expect(detectCategory("ASUS Notebook Vivobook 15")).toBe("Notebook");
    expect(detectCategory("Dell Monitor 24 นิ้ว")).toBe("Monitor");
    expect(detectCategory("HP Printer LaserJet")).toBe("Printer");
  });
});
