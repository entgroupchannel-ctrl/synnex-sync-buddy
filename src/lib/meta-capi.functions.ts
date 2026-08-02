// Meta Conversions API (server-side) — เสริม Meta Pixel (client-side ใน meta-pixel.ts)
// ยิงตรงจาก server ไปหา Meta เลย ไม่ผ่าน browser จึงไม่โดน ad blocker/ITP/Safari บล็อก
// เหมือนฝั่ง client-only — แม่นกว่าสำหรับการ optimize โฆษณา
//
// ต้องตั้งค่า 2 secret ก่อนถึงจะทำงานจริง (Project Settings → Secrets):
//   META_PIXEL_ID            — Pixel ID เดียวกับที่ตั้งฝั่ง client (VITE_META_PIXEL_ID)
//   META_CAPI_ACCESS_TOKEN   — สร้างที่ Events Manager → Data Sources → Pixel → Settings
//                               → Conversions API → Generate access token
// ถ้ายังไม่ตั้ง จะ log แล้วข้ามเงียบๆ ไม่ throw (ไม่กระทบ checkout ของลูกค้าเด็ดขาด)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "node:crypto";

const GRAPH_API_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

const purchaseEventSchema = z.object({
  eventId: z.string().min(1),
  eventSourceUrl: z.string().url(),
  value: z.number().nonnegative(),
  currency: z.string().default("THB"),
  contentIds: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const sendMetaPurchaseEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => purchaseEventSchema.parse(data))
  .handler(async ({ data }) => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.warn(
        "[meta-capi] ยังไม่ได้ตั้งค่า META_PIXEL_ID/META_CAPI_ACCESS_TOKEN — ข้าม Purchase event",
      );
      return { sent: false };
    }

    const userData: Record<string, string[]> = {};
    if (data.email) userData.em = [sha256(data.email)];
    if (data.phone) userData.ph = [sha256(data.phone.replace(/\D/g, ""))];

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: data.eventId, // ต้องตรงกับ eventID ที่ Pixel ฝั่ง client ยิงไป เพื่อให้ Meta dedupe
          event_source_url: data.eventSourceUrl,
          action_source: "website",
          user_data: userData,
          custom_data: {
            currency: data.currency,
            value: data.value,
            content_ids: data.contentIds,
            content_type: "product",
          },
        },
      ],
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        console.error("[meta-capi] Meta ตอบ error:", await res.text());
        return { sent: false };
      }
      return { sent: true };
    } catch (err) {
      // ยิง analytics ล้มไม่ควรทำให้ checkout ของลูกค้าพังตาม — log แล้วปล่อยผ่าน
      console.error("[meta-capi] ส่ง event ไม่สำเร็จ:", err instanceof Error ? err.message : err);
      return { sent: false };
    }
  });
