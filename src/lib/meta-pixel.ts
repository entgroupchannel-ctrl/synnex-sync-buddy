// Meta Pixel (client-side) — ทำงานคู่กับ Conversions API ฝั่ง server (meta-capi.functions.ts)
// ยิงทั้งสองทางพร้อม event_id เดียวกันเพื่อให้ Meta dedupe เอง (มาตรฐานที่ Meta แนะนำ)
//
// ต้องตั้งค่า VITE_META_PIXEL_ID ก่อนถึงจะทำงาน (Project Settings → Secrets ใน Lovable
// หรือ .env ฝั่ง build) — ถ้ายังไม่ตั้ง ฟังก์ชันทุกตัวในไฟล์นี้จะ no-op เงียบๆ ไม่ error
declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: unknown;
  }
}

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
};

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let initialized = false;

/** ฝัง Meta Pixel base code ครั้งเดียว — เรียกจาก root layout */
export function initMetaPixel() {
  if (typeof window === "undefined" || !PIXEL_ID || initialized) return;
  initialized = true;

  // ตัวโหลดสคริปต์มาตรฐานของ Meta (เหมือนที่ได้จาก Events Manager)
  if (!window.fbq) {
    const queue: unknown[] = [];
    const fbq = function (this: FbqFn, ...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else queue.push(args);
    } as FbqFn;
    fbq.queue = queue;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = window._fbq ?? fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }

  window.fbq?.("init", PIXEL_ID);
}

/** ยิง PageView — เรียกทุกครั้งที่เปลี่ยนหน้า (SPA route change ไม่ reload จริง ต้องยิงเอง) */
export function trackPageView() {
  window.fbq?.("track", "PageView");
}

/**
 * ยิง event มาตรฐาน พร้อม eventId เดียวกับที่จะส่งให้ server (meta-capi.functions.ts)
 * เพื่อให้ Meta dedupe เหตุการณ์เดียวกันที่มาจากทั้ง Pixel (client) และ CAPI (server)
 */
export function trackMetaEvent(
  name: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  params: Record<string, unknown>,
  eventId: string,
) {
  window.fbq?.("track", name, params, { eventID: eventId });
}

export function isMetaPixelConfigured() {
  return Boolean(PIXEL_ID);
}
