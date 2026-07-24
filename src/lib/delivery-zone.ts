import { useEffect, useState } from "react";

export type DeliveryZone = "bkk" | "upcountry" | "pickup";

const KEY = "ent_delivery_zone";
const EVENT = "ent-delivery-zone-change";
const OPEN_EVENT = "ent-delivery-zone-open";

export const ZONE_INFO: Record<
  DeliveryZone,
  { label: string; short: string; hint: string; courier: string; freeOver: number | null; feeRange: string }
> = {
  bkk: {
    label: "กรุงเทพฯ และปริมณฑล",
    short: "กทม.",
    hint: "🚚 กทม./ปริมณฑล: รับใน 1-2 วันทำการ",
    courier: "Kerry Express · 1-2 วันทำการ",
    freeOver: 5000,
    feeRange: "฿50-100",
  },
  upcountry: {
    label: "ต่างจังหวัดทั่วไทย",
    short: "ต่างจังหวัด",
    hint: "🚚 ต่างจังหวัด: รับใน 2-5 วันทำการ",
    courier: "Kerry / Flash · 2-5 วันทำการ",
    freeOver: 10000,
    feeRange: "฿50-400 (ตามน้ำหนัก)",
  },
  pickup: {
    label: "รับสินค้าที่สำนักงาน (ฟรี)",
    short: "รับเอง",
    hint: "🏢 รับที่สำนักงาน ปากเกร็ด (ฟรี)",
    courier: "จ-ศ 9:00-18:00 · 70/5 หมู่ 4 เมทโทร บิซทาวน์ ปากเกร็ด นนทบุรี",
    freeOver: 0,
    feeRange: "ฟรี ไม่มีค่าส่ง",
  },
};

export function getDeliveryZone(): DeliveryZone | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "bkk" || v === "upcountry" || v === "pickup" ? v : null;
}

export function setDeliveryZone(zone: DeliveryZone) {
  window.localStorage.setItem(KEY, zone);
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** เปิด dialog เลือกพื้นที่จัดส่งจากที่ไหนก็ได้ */
export function openDeliveryZoneDialog() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function useDeliveryZone(): DeliveryZone | null {
  const [zone, setZone] = useState<DeliveryZone | null>(null);
  useEffect(() => {
    setZone(getDeliveryZone());
    const sync = () => setZone(getDeliveryZone());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return zone;
}

export const DELIVERY_ZONE_EVENTS = { CHANGE: EVENT, OPEN: OPEN_EVENT, SESSION_KEY: "ent_delivery_zone_shown" };
