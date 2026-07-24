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
 * Returns the customer-facing selling price, or null when not yet approved.
 * Shop pages must show "ติดต่อสอบถาม" instead of ฿0.
 */
export function getSellingPrice(p: { selling_price?: number | null; price_approved?: boolean | null }): number | null {
  const s = Number(p.selling_price ?? 0);
  if (!s || s <= 0) return null;
  return s;
}

export function displayPrice(p: { selling_price?: number | null; price_approved?: boolean | null }): string {
  const s = getSellingPrice(p);
  return s == null ? "ติดต่อสอบถาม" : priceFmt.format(s);
}


export const CATEGORIES = [
  "Notebook",
  "Monitor",
  "Printer",
  "PC",
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
