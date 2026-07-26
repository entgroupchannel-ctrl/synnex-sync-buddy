import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  id: string;
  sku: string;
  slug: string | null;
  name: string;
  price: number;
  image_url: string | null;
  distributor: string | null;
  qty: number;
  category?: string | null;
};

/** Heavy pre-built PC bundles ship at a flat 15 kg — used by the Kerry weight tariff. */
export const COMPUTER_SET_WEIGHT_KG = 15;

/** Kerry weight-per-item for shipping calculators. Defaults to 1 kg per unit. */
export function getItemWeightKg(item: { category?: string | null }): number {
  return item.category === "Computer Set" ? COMPUTER_SET_WEIGHT_KG : 1;
}

const KEY = "cart-v1";
const EVT = "cart-changed";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const cur = read();
    const idx = cur.findIndex((x) => x.id === item.id);
    if (idx >= 0) cur[idx].qty += qty;
    else cur.push({ ...item, qty });
    write(cur);
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    const cur = read().map((x) => (x.id === id ? { ...x, qty } : x)).filter((x) => x.qty > 0);
    write(cur);
  }, []);
  const remove = useCallback((id: string) => {
    write(read().filter((x) => x.id !== id));
  }, []);
  const clear = useCallback(() => write([]), []);

  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + x.qty * x.price, 0);

  return { items, add, setQty, remove, clear, count, total };
}

export const priceFmt = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

/**
 * Customer tier used to resolve the correct price for a product.
 *   - guest                           → selling_price
 *   - b2c / b2c_silver / b2c_gold / b2c_vip → member_price (fallback selling_price * 0.95), then tier discount
 *   - b2b / b2b_silver / b2b_gold     → b2b_price, then tier discount
 */
export type CustomerTier =
  | "guest"
  | "b2c"
  | "b2c_silver"
  | "b2c_gold"
  | "b2c_vip"
  | "b2b"
  | "b2b_silver"
  | "b2b_gold";

export type PricingProduct = {
  selling_price?: number | null;
  member_price?: number | null;
  b2b_price?: number | null;
  price_approved?: boolean | null;
  min_tier_price?: number | null;
};

function round(n: number): number {
  return Math.round(n);
}

/**
 * Returns the customer-facing price for the given tier, or null when not yet approved / no base price.
 * Shop pages must show "ติดต่อสอบถาม" instead of ฿0.
 */
export function getSellingPrice(p: PricingProduct, tier: CustomerTier = "guest"): number | null {
  const selling = Number(p.selling_price ?? 0);
  if (!selling || selling <= 0) return null;
  if (selling > 70000) return null; // ราคาเกิน 70,000 → ให้ระบบขึ้น "ติดต่อสอบถาม" แทนราคา

  const memberBase = Number(p.member_price ?? 0) > 0 ? Number(p.member_price) : selling * 0.95;
  const b2bBase = Number(p.b2b_price ?? 0) > 0 ? Number(p.b2b_price) : null;
  const floor = Number(p.min_tier_price ?? 0) > 0 ? Number(p.min_tier_price) : 0;

  // ห้ามราคาหลังลด tier ต่ำกว่าพื้นทุน+margin ขั้นต่ำเด็ดขาด (ป้องกันขายขาดทุนอัตโนมัติ)
  const clamp = (n: number) => (floor > 0 ? Math.max(n, floor) : n);

  switch (tier) {
    case "guest":
      return round(selling);
    case "b2c":
      return round(clamp(memberBase));
    case "b2c_silver":
      return round(clamp(memberBase * 0.97));
    case "b2c_gold":
      return round(clamp(memberBase * 0.94));
    case "b2c_vip":
      return round(clamp(memberBase * 0.92));
    case "b2b":
      return round(clamp(b2bBase ?? memberBase));
    case "b2b_silver":
      return round(clamp((b2bBase ?? memberBase) * 0.98));
    case "b2b_gold":
      return round(clamp((b2bBase ?? memberBase) * 0.95));
    default:
      return round(selling);
  }
}

export function displayPrice(p: PricingProduct, tier: CustomerTier = "guest"): string {
  const s = getSellingPrice(p, tier);
  return s == null ? "ติดต่อสอบถาม" : priceFmt.format(s);
}

/**
 * Hook that resolves the current customer's pricing tier from Supabase auth + user_profiles.
 * Returns "guest" until the profile is loaded.
 */
export function useCustomerTier(): CustomerTier {
  const [tier, setTier] = useState<CustomerTier>("guest");
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setTier("guest");
        return;
      }
      const { data } = await supabase
        .from("user_profiles")
        .select("user_type, loyalty_tier, b2b_tier")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      const ut = (data?.user_type ?? "b2c").toLowerCase();
      if (ut === "b2b") {
        const t = (data?.b2b_tier ?? "").toLowerCase();
        setTier(t === "gold" ? "b2b_gold" : t === "silver" ? "b2b_silver" : "b2b");
      } else {
        const t = (data?.loyalty_tier ?? "").toLowerCase();
        setTier(
          t === "vip" ? "b2c_vip" : t === "gold" ? "b2c_gold" : t === "silver" ? "b2c_silver" : "b2c",
        );
      }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return tier;
}


export const CATEGORIES = [
  "Notebook",
  "Monitor",
  "Printer",
  "PC",
  "UPS",
  "Computer Set",
  "Components",
  "RAM",
  "Edge AI Box",
  "Software",
  "Accessories",
  "Network",
  "Storage",
  "Smart Phone & Tablet",
  "Solar & Energy",
  "Smart Life",
  "Speaker & Audio",
] as const;

/** หมวดย่อยของแต่ละหมวดหลัก — คีย์ต้องตรงกับค่าใน synnex_products.category */
export const SUBCATEGORIES: Record<string, string[]> = {
  RAM: ["RAM Desktop", "RAM Notebook"],
  Printer: ["Slip Printer", "Laser", "Inkjet / Ink Tank", "Scanner", "3D Printer"],
};

/** ป้ายชื่อสั้นสำหรับแสดงบนเมนู */
export const SUBCATEGORY_LABELS: Record<string, string> = {
  "RAM Desktop": "แรมคอมตั้งโต๊ะ",
  "RAM Notebook": "แรมโน้ตบุ๊ก",
  "Slip Printer": "เครื่องพิมพ์ใบเสร็จ",
  Laser: "เลเซอร์",
  "Inkjet / Ink Tank": "อิงค์เจ็ท / แท็งก์",
  Scanner: "สแกนเนอร์",
  "3D Printer": "เครื่องพิมพ์ 3 มิติ",
};

/** รุ่นแรมเรียงจากใหม่ไปเก่า ใช้ทำตัวกรองและ badge */
export const RAM_GENERATIONS = ["DDR5", "DDR4", "DDR3L", "DDR3", "DDR2"] as const;

export function detectCategory(name: string | null | undefined): string {
  const n = (name || "").toLowerCase();
  if (/(notebook|laptop|\bnb\b)/i.test(n)) return "Notebook";
  if (/(monitor|จอ)/i.test(n)) return "Monitor";
  if (/(printer|print)/i.test(n)) return "Printer";
  if (/(desktop|tower|\bpc\b)/i.test(n)) return "PC";
  if (/(software|license|office)/i.test(n)) return "Software";
  if (/(\bcpu\b|ryzen|core ultra|\bddr\d\b|\bram\b|memory)/i.test(n)) return "Components";
  if (/(switch|router|network|wifi|access point)/i.test(n)) return "Network";
  if (/(\bhdd\b|\bssd\b|storage|\bnas\b)/i.test(n)) return "Storage";
  if (/(phone|ipad|tablet)/i.test(n)) return "Smart Phone & Tablet";
  return "Accessories";
}
