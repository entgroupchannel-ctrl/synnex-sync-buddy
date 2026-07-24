import { useEffect, useState, useCallback } from "react";

export type ShippingMethod = "delivery" | "pickup" | "express";

const KEY = "ent_shipping_method";
const EVT = "ent-shipping-method-changed";

export const SHIPPING_METHOD_LABEL: Record<ShippingMethod, string> = {
  delivery: "จัดส่งทั่วประเทศไทย",
  pickup: "รับสินค้าที่สำนักงาน",
  express: "ส่งด่วนใน กทม./ปริมณฑล",
};

export const OFFICE_ADDRESS = {
  name: "บริษัท เอ็นที กรุ๊ป จำกัด",
  line1: "เลขที่ 70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2 ถ.หอการค้าไทย",
  line2: "ต.คลองพระอุดม อ.ปากเกร็ด จ.นนทบุรี 11120",
  district: "ปากเกร็ด",
  province: "นนทบุรี",
  postcode: "11120",
  phone: "02-045-6104",
  fax: "02-045-6105",
  hours: "จ-ศ 9:00-18:00 น.",
  lat: 13.9125,
  lng: 100.5018,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("70/5 หมู่4 เมทโทร บิซทาวน์ แจ้งวัฒนะ2 ปากเกร็ด นนทบุรี"),
  embedUrl:
    "https://www.google.com/maps?q=" +
    encodeURIComponent("70/5 หมู่4 เมทโทร บิซทาวน์ แจ้งวัฒนะ2 ปากเกร็ด นนทบุรี") +
    "&output=embed",
};

export function readShippingMethod(): ShippingMethod {
  if (typeof window === "undefined") return "delivery";
  const v = localStorage.getItem(KEY);
  return v === "pickup" || v === "express" ? v : "delivery";
}

export function writeShippingMethod(m: ShippingMethod) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, m);
  window.dispatchEvent(new Event(EVT));
}

export function useShippingMethod(): [ShippingMethod, (m: ShippingMethod) => void] {
  const [m, setM] = useState<ShippingMethod>("delivery");
  useEffect(() => {
    setM(readShippingMethod());
    const h = () => setM(readShippingMethod());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const set = useCallback((next: ShippingMethod) => writeShippingMethod(next), []);
  return [m, set];
}
