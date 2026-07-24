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
