import { describe, expect, it } from "vitest";
import { crc16, generatePromptPayPayload } from "../promptpay";

describe("promptpay payload", () => {
  it("คำนวณ CRC16-CCITT ถูกต้อง", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("เบอร์มือถือ + จำนวนเงิน ตรงกับผลของ promptpay-qr", () => {
    // ค่าอ้างอิงมาตรฐาน (0812345678, 100.00 บาท)
    expect(generatePromptPayPayload("0812345678", { amount: 100 })).toBe(
      "00020101021229370016A000000677010111011300668123456785802TH53037645406100.006304BB8A",
    );

  });

  it("ไม่ระบุจำนวนเงิน → POI method 11 และไม่มี tag 54", () => {
    const p = generatePromptPayPayload("0812345678");
    expect(p.startsWith("000201010211")).toBe(true);
    expect(p.includes("5406")).toBe(false);
  });

  it("เลขนิติบุคคล 13 หลัก ใช้ target 02", () => {
    expect(generatePromptPayPayload("0105561000000", { amount: 1 })).toContain("02130105561000000");
  });
});
