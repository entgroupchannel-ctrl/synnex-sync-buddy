// Shopee redirect มาที่นี่หลังแอดมินกด "อนุญาต" — ?code=xxx&shop_id=yyy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPublicApi } from "../_shared/shopee.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlResponse(title: string, message: string, ok: boolean) {
  const color = ok ? "#16a34a" : "#dc2626";
  const body = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:48px 16px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.1)">
<h1 style="color:${color};font-size:20px;margin:0 0 8px">${title}</h1>
<p style="color:#334155;font-size:14px;margin:0 0 12px">${message}</p>
<p style="color:#94a3b8;font-size:12px;margin:0">ปิดแท็บนี้แล้วกลับไปที่หน้า Admin ได้เลย</p>
</div></body></html>`;
  return new Response(body, { headers: { ...cors, "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const shopIdRaw = url.searchParams.get("shop_id");

  if (!code || !shopIdRaw) {
    return htmlResponse(
      "เชื่อมต่อไม่สำเร็จ",
      "ไม่พบ code หรือ shop_id จาก Shopee — ลองกดเชื่อมต่อใหม่อีกครั้ง",
      false,
    );
  }
  const shopId = Number(shopIdRaw);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return htmlResponse("ตั้งค่าไม่ครบ", "ไม่พบ SUPABASE_URL/SERVICE_ROLE_KEY", false);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const partnerId = Number(Deno.env.get("SHOPEE_PARTNER_ID"));
    const { ok, data } = await callPublicApi("/api/v2/auth/token/get", {
      code,
      shop_id: shopId,
      partner_id: partnerId,
    });

    const result = data as {
      access_token?: string;
      refresh_token?: string;
      expire_in?: number;
      error?: string;
      message?: string;
    } | null;

    if (!ok || !result?.access_token) {
      await supabase.from("shopee_sync_log").insert({
        shop_id: shopId,
        action: "oauth_callback",
        request_path: "/api/v2/auth/token/get",
        status: "error",
        detail: result ?? { message: "no response" },
      });
      return htmlResponse(
        "เชื่อมต่อไม่สำเร็จ",
        result?.message || result?.error || "แลก token ไม่สำเร็จ ดู log ในตาราง shopee_sync_log",
        false,
      );
    }

    const expiresAt = new Date(Date.now() + (result.expire_in ?? 14400) * 1000).toISOString();
    const isSandbox = (Deno.env.get("SHOPEE_ENV") ?? "sandbox") !== "live";

    const { error: upsertError } = await supabase.from("shopee_shop_connections").upsert(
      {
        shop_id: shopId,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        access_token_expires_at: expiresAt,
        is_sandbox: isSandbox,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" },
    );

    await supabase.from("shopee_sync_log").insert({
      shop_id: shopId,
      action: "oauth_callback",
      request_path: "/api/v2/auth/token/get",
      status: upsertError ? "error" : "success",
      detail: upsertError ? { message: upsertError.message } : { shop_id: shopId },
    });

    if (upsertError) {
      return htmlResponse("เชื่อมต่อไม่สำเร็จ", `บันทึกลง DB ไม่สำเร็จ: ${upsertError.message}`, false);
    }

    return htmlResponse("เชื่อมต่อสำเร็จ 🎉", `เชื่อมต่อร้าน Shopee (shop_id: ${shopId}) เรียบร้อยแล้ว`, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await supabase.from("shopee_sync_log").insert({
      shop_id: shopId,
      action: "oauth_callback",
      status: "error",
      detail: { message },
    });
    return htmlResponse("เชื่อมต่อไม่สำเร็จ", message, false);
  }
});
