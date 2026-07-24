export const SHIPPING_PROVIDERS = [
  { value: "kerry",    label: "Kerry Express" },
  { value: "flash",    label: "Flash Express" },
  { value: "thaipost", label: "ไปรษณีย์ไทย" },
  { value: "scg",      label: "SCG Express" },
  { value: "nim",      label: "Nim Express" },
  { value: "other",    label: "อื่นๆ" },
] as const;

export type ShippingProvider = (typeof SHIPPING_PROVIDERS)[number]["value"];

export const TRACKING_URLS: Record<ShippingProvider, ((n: string) => string) | null> = {
  kerry:    (n) => `https://th.kerryexpress.com/th/track/?track=${encodeURIComponent(n)}`,
  flash:    (n) => `https://www.flashexpress.co.th/tracking/?se=${encodeURIComponent(n)}`,
  thaipost: (n) => `https://track.thailandpost.co.th/?trackNumber=${encodeURIComponent(n)}`,
  scg:      (n) => `https://www.scgexpress.co.th/tracking/?tracking=${encodeURIComponent(n)}`,
  nim:      (n) => `https://www.nimexpress.com/web/app/tracking#${encodeURIComponent(n)}`,
  other:    null,
};

export function buildTrackingUrl(provider: string | null | undefined, tracking: string | null | undefined): string | null {
  if (!provider || !tracking) return null;
  const fn = TRACKING_URLS[provider as ShippingProvider];
  return fn ? fn(tracking) : null;
}

export function providerLabel(p?: string | null): string {
  return SHIPPING_PROVIDERS.find((s) => s.value === p)?.label ?? (p ?? "-");
}

export const EVENT_PRESETS = [
  { value: "picked_up",       label: "รับพัสดุแล้ว",         labelEn: "Picked up" },
  { value: "in_transit",      label: "กำลังขนส่ง",           labelEn: "In transit" },
  { value: "arrived_hub",     label: "ถึงศูนย์กระจายสินค้า", labelEn: "Arrived at hub" },
  { value: "out_for_delivery",label: "กำลังนำส่ง",           labelEn: "Out for delivery" },
  { value: "delivered",       label: "ส่งสำเร็จ",             labelEn: "Delivered" },
  { value: "failed",          label: "ลูกค้าไม่อยู่",         labelEn: "Delivery failed" },
] as const;

export type EventStatus = (typeof EVENT_PRESETS)[number]["value"];

export function eventLabel(s?: string | null) {
  return EVENT_PRESETS.find((p) => p.value === s)?.label ?? s ?? "-";
}

export function eventIcon(s?: string | null) {
  return s === "delivered" ? "✅" : s === "failed" ? "⚠️" : "📦";
}

// ---------- Shipping fee + options ----------

import { supabase } from "@/integrations/supabase/client";

export interface ShippingMethodRow {
  id: string;
  name: string;
  name_en: string;
  provider: string;
  base_fee: number;
  per_kg_fee: number;
  free_threshold: number | null;
  estimated_days: string;
  is_active: boolean;
  sort_order: number | null;
}

export interface ShippingOption {
  id: string;
  name: string;
  name_en: string;
  provider: string;
  fee: number;
  originalFee: number;
  isFree: boolean;
  estimatedDays: string;
  freeThreshold: number | null;
}

export function calculateShippingFee(
  method: Pick<ShippingMethodRow, "base_fee" | "per_kg_fee" | "free_threshold">,
  orderTotal: number,
  weightKg: number = 1,
): number {
  const extraKg = Math.max(0, weightKg - 1);
  const fee = Number(method.base_fee) + extraKg * Number(method.per_kg_fee);
  if (method.free_threshold && orderTotal >= Number(method.free_threshold)) return 0;
  return Math.round(fee);
}

export async function getShippingOptions(orderTotal: number, weightKg: number = 1): Promise<ShippingOption[]> {
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id, name, name_en, provider, base_fee, per_kg_fee, free_threshold, estimated_days, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as ShippingMethodRow[])
    .map((m) => {
      const originalFee = Number(m.base_fee) + Math.max(0, weightKg - 1) * Number(m.per_kg_fee);
      const fee = calculateShippingFee(m, orderTotal, weightKg);
      return {
        id: m.id,
        name: m.name,
        name_en: m.name_en,
        provider: m.provider,
        fee: Math.round(fee),
        originalFee: Math.round(originalFee),
        isFree: fee === 0,
        estimatedDays: m.estimated_days,
        freeThreshold: m.free_threshold != null ? Number(m.free_threshold) : null,
      };
    })
    .sort((a, b) => a.fee - b.fee || a.originalFee - b.originalFee);
}

// ---------- Discount codes ----------

export type DiscountApplied = {
  codeId: string;
  code: string;
  type: "free_shipping" | "fixed" | "percent";
  discountAmount: number;   // amount off subtotal
  isFreeShipping: boolean;  // if true, shipping fee becomes 0
  description?: string | null;
};

export type UserType = "guest" | "b2c" | "b2b";

type DiscountRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  applies_to: string | null;
  is_active: boolean | null;
};

export async function applyDiscountCode(params: {
  code: string;
  subtotal: number;
  shippingFee: number;
  userType: UserType;
  userId?: string | null;
}): Promise<{ ok: true; applied: DiscountApplied } | { ok: false; error: string }> {
  const code = params.code.toUpperCase().trim();
  if (!code) return { ok: false, error: "กรุณากรอกโค้ด" };

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  const row = data as DiscountRow | null;
  if (error || !row) return { ok: false, error: "โค้ดไม่ถูกต้องหรือหมดอายุแล้ว" };

  const now = new Date();
  if (row.valid_from && new Date(row.valid_from) > now) return { ok: false, error: "โค้ดยังไม่เริ่มใช้งาน" };
  if (row.valid_until && new Date(row.valid_until) < now) return { ok: false, error: "โค้ดไม่ถูกต้องหรือหมดอายุแล้ว" };
  if (row.usage_limit != null && (row.used_count ?? 0) >= row.usage_limit)
    return { ok: false, error: "โค้ดนี้ใช้ครบจำนวนแล้ว" };
  if ((row.min_order_amount ?? 0) > params.subtotal)
    return { ok: false, error: `ยอดซื้อขั้นต่ำ ฿${Number(row.min_order_amount).toLocaleString()}` };

  const applies = (row.applies_to ?? "all").toLowerCase();
  if (applies !== "all") {
    if (applies === "b2c" && params.userType !== "b2c") return { ok: false, error: "โค้ดนี้ใช้ได้เฉพาะสมาชิก B2C" };
    if (applies === "b2b" && params.userType !== "b2b") return { ok: false, error: "โค้ดนี้ใช้ได้เฉพาะองค์กร B2B" };
    if (applies === "member" && params.userType === "guest") return { ok: false, error: "โค้ดนี้ใช้ได้เฉพาะสมาชิกเท่านั้น" };
    if (applies === "new_customer" && params.userId) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", params.userId);
      if ((count ?? 0) > 0) return { ok: false, error: "โค้ดนี้ใช้ได้เฉพาะลูกค้าใหม่" };
    }
  }

  const type = row.discount_type as DiscountApplied["type"];
  let discountAmount = 0;
  let isFreeShipping = false;
  if (type === "free_shipping") {
    isFreeShipping = true;
    discountAmount = 0;
  } else if (type === "fixed") {
    discountAmount = Math.min(Number(row.discount_value ?? 0), params.subtotal);
  } else if (type === "percent") {
    let amt = (params.subtotal * Number(row.discount_value ?? 0)) / 100;
    if (row.max_discount_amount) amt = Math.min(amt, Number(row.max_discount_amount));
    discountAmount = Math.round(amt);
  } else {
    return { ok: false, error: "ประเภทโค้ดไม่ถูกต้อง" };
  }

  return {
    ok: true,
    applied: {
      codeId: row.id,
      code: row.code,
      type,
      discountAmount,
      isFreeShipping,
      description: row.description,
    },
  };
}

export async function recordDiscountUsage(params: {
  codeId: string;
  orderId: string;
  userId?: string | null;
  customerEmail?: string | null;
  discountAmount: number;
}) {
  const { data: cur } = await supabase
    .from("discount_codes")
    .select("used_count")
    .eq("id", params.codeId)
    .maybeSingle();
  const nextCount = (Number((cur as { used_count?: number } | null)?.used_count ?? 0)) + 1;
  await supabase.from("discount_codes").update({ used_count: nextCount }).eq("id", params.codeId);
  await supabase.from("discount_code_usage").insert({
    code_id: params.codeId,
    order_id: params.orderId,
    user_id: params.userId ?? null,
    customer_email: params.customerEmail ?? null,
    discount_amount: params.discountAmount,
  });
}

