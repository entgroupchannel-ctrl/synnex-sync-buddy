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
};

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

  const memberBase = Number(p.member_price ?? 0) > 0 ? Number(p.member_price) : selling * 0.95;
  const b2bBase = Number(p.b2b_price ?? 0) > 0 ? Number(p.b2b_price) : null;

  switch (tier) {
    case "guest":
      return round(selling);
    case "b2c":
      return round(memberBase);
    case "b2c_silver":
      return round(memberBase * 0.97);
    case "b2c_gold":
      return round(memberBase * 0.94);
    case "b2c_vip":
      return round(memberBase * 0.92);
    case "b2b":
      return round(b2bBase ?? memberBase);
    case "b2b_silver":
      return round((b2bBase ?? memberBase) * 0.98);
    case "b2b_gold":
      return round((b2bBase ?? memberBase) * 0.95);
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
  "Computer Set",
  "Software",
  "Accessories",
  "Network",
  "Storage",
  "Smart Phone & Tablet",
] as const;

export function detectCategory(name: string | null | undefined): string {
  const n = (name || "").toLowerCase();
  if (/(notebook|laptop|\bnb\b)/i.test(n)) return "Notebook";
  if (/(monitor|จอ)/i.test(n)) return "Monitor";
  if (/(printer|print)/i.test(n)) return "Printer";
  if (/(desktop|tower|\bpc\b)/i.test(n)) return "PC";
  if (/(software|license|office)/i.test(n)) return "Software";
  if (/(switch|router|network|wifi|access point)/i.test(n)) return "Network";
  if (/(\bhdd\b|\bssd\b|storage|\bnas\b)/i.test(n)) return "Storage";
  if (/(phone|ipad|tablet)/i.test(n)) return "Smart Phone & Tablet";
  return "Accessories";
}
