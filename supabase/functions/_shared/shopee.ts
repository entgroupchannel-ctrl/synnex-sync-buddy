// supabase/functions/_shared/shopee.ts
// ตัวช่วยกลางสำหรับเซ็น request และเรียก Shopee Open Platform v2 API
// เอกสาร: https://open.shopee.com/documents

export const SHOPEE_HOST_LIVE = "https://partner.shopeemobile.com";
export const SHOPEE_HOST_SANDBOX = "https://partner.test-stable.shopeemobile.com";

export function shopeeHost(): string {
  // ค่าเริ่มต้นเป็น sandbox — ตั้ง SHOPEE_ENV=live เมื่อพร้อมใช้งานจริง
  const env = Deno.env.get("SHOPEE_ENV") ?? "sandbox";
  return env === "live" ? SHOPEE_HOST_LIVE : SHOPEE_HOST_SANDBOX;
}

function getPartnerCreds() {
  const partnerId = Deno.env.get("SHOPEE_PARTNER_ID");
  const partnerKey = Deno.env.get("SHOPEE_PARTNER_KEY");
  if (!partnerId || !partnerKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY ใน Supabase Edge Function secrets",
    );
  }
  return { partnerId: Number(partnerId), partnerKey };
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** สร้างลิงก์ authorize shop (ลิงก์มีอายุ 5 นาที) */
export async function buildAuthUrl(redirectUrl: string): Promise<string> {
  const { partnerId, partnerKey } = getPartnerCreds();
  const path = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = await hmacSha256Hex(partnerKey, `${partnerId}${path}${timestamp}`);

  const url = new URL(shopeeHost() + path);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("redirect", redirectUrl);
  return url.toString();
}

/** เรียก API แบบ public (ยังไม่มี access_token/shop_id) */
export async function callPublicApi(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const { partnerId, partnerKey } = getPartnerCreds();
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = await hmacSha256Hex(partnerKey, `${partnerId}${path}${timestamp}`);

  const url = new URL(shopeeHost() + path);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, partner_id: partnerId }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/** ขอ access_token ใหม่ด้วย refresh_token (access_token อายุ 4 ชม., refresh_token 30 วัน) */
export async function refreshAccessToken(
  shopId: number,
  refreshToken: string,
): Promise<{ ok: boolean; data: unknown }> {
  const { partnerId } = getPartnerCreds();
  const { ok, data } = await callPublicApi("/api/v2/auth/access_token/get", {
    refresh_token: refreshToken,
    shop_id: shopId,
    partner_id: partnerId,
  });
  return { ok, data };
}

/** เรียก API แบบ shop-level (ต้องมี access_token + shop_id) */
export async function callShopApi(
  path: string,
  shopId: number,
  accessToken: string,
  body: Record<string, unknown> = {},
  method: "GET" | "POST" = "POST",
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const { partnerId, partnerKey } = getPartnerCreds();
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = await hmacSha256Hex(
    partnerKey,
    `${partnerId}${path}${timestamp}${accessToken}${shopId}`,
  );

  const url = new URL(shopeeHost() + path);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("shop_id", String(shopId));

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
