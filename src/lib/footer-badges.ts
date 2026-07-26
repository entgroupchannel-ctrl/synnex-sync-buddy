import {
  Banknote,
  CreditCard,
  Landmark,
  Package,
  QrCode,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Badge ของ payment / carrier ใน SiteFooter
 *
 * วิธีใส่โลโก้จริง (ทำทีละอันได้ ไม่ต้องครบ):
 *   1. อัปโหลดไฟล์โลโก้เข้า Lovable ที่ src/assets/payments/ หรือ src/assets/carriers/
 *      จะได้ไฟล์ <NAME>.png.asset.json มา (pattern เดียวกับ src/assets/brands/)
 *   2. import ด้านบน:  import VISA from "@/assets/payments/VISA.png.asset.json";
 *   3. ใส่ logoUrl: VISA.url  ใน badge ตัวนั้น
 * ถ้า logoUrl ว่างหรือรูปโหลดไม่ขึ้น จะ fallback เป็น lucide icon อัตโนมัติ
 */
export type FooterBadge = {
  label: string;
  icon: LucideIcon;
  logoUrl?: string;
  /** true = ยังไม่เปิดให้บริการ แสดงแบบจาง + ป้ายกำกับ */
  comingSoon?: boolean;
};

export const PAYMENT_BADGES: FooterBadge[] = [
  { label: "PromptPay", icon: QrCode },
  { label: "โอนเงิน", icon: Banknote },
  { label: "KBank", icon: Landmark },
  { label: "SCB", icon: Landmark },
  { label: "Visa", icon: CreditCard, comingSoon: true },
  { label: "Mastercard", icon: CreditCard, comingSoon: true },
];

export const CARRIER_BADGES: FooterBadge[] = [
  { label: "Kerry Express", icon: Truck },
  { label: "Flash Express", icon: Zap },
  { label: "ไปรษณีย์ไทย", icon: Package },
  { label: "SCG Express", icon: Truck },
];
