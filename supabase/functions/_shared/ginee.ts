// ตัวช่วยกลางสำหรับเซ็น request และเรียก Ginee Open API
// เอกสาร: https://doc.ginee.com/_get_started.html
// signature ของ Ginee ไม่มี timestamp (ต่างจาก Shopee)

const GINEE_HOST = "https://api.ginee.com";

function getGineeCreds() {
  const accessKey = Deno.env.get("GINEE_ACCESS_KEY");
  const secretKey = Deno.env.get("GINEE_SECRET_KEY");
  if (!accessKey || !secretKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า GINEE_ACCESS_KEY / GINEE_SECRET_KEY ใน Supabase Edge Function secrets",
    );
  }
  return { accessKey, secretKey };
}

async function hmacSha256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  // Ginee ใช้ Base64 (ไม่ใช่ hex แบบ Shopee)
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
}

/**
 * เรียก Ginee Open API — ทุก endpoint ใช้รูปแบบเดียวกัน
 * signature = Base64(HMAC-SHA256(secretKey, "{METHOD}$" + "{path}" + "$"))
 * Authorization header = "{accessKey}:{signature}"
 */
export async function callGineeApi(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
  country = "TH",
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const { accessKey, secretKey } = getGineeCreds();
  const signString = `${method}$${path}$`;
  const signature = await hmacSha256Base64(secretKey, signString);

  const res = await fetch(GINEE_HOST + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Advai-Country": country,
      Authorization: `${accessKey}:${signature}`,
    },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/** ทุก response ของ Ginee มีรูปแบบเดียวกัน — เช็ค code แทน HTTP status เสมอ */
export function gineeSucceeded(data: unknown): boolean {
  return !!data && typeof data === "object" && (data as { code?: string }).code === "SUCCESS";
}
