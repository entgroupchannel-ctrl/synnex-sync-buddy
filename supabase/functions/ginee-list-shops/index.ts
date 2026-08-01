// ทดสอบว่า Access Key/Secret Key ของ Ginee ใช้งานได้ + ดึงรายชื่อร้านที่เชื่อมไว้ใน Ginee dashboard
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGineeApi, gineeSucceeded } from "../_shared/ginee.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "ไม่พบ SUPABASE_URL/SERVICE_ROLE_KEY" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { ok, status, data } = await callGineeApi("/openapi/shop/v1/list", "POST", {
      page: 0,
      size: 50,
    });

    await supabase.from("ginee_sync_log").insert({
      action: "list_shops",
      request_path: "/openapi/shop/v1/list",
      status: gineeSucceeded(data) ? "success" : "error",
      detail: (data as object) ?? { http_status: status },
    });

    if (!gineeSucceeded(data)) {
      return new Response(
        JSON.stringify({
          connected: false,
          message: (data as { message?: string })?.message ?? "เรียก Ginee API ไม่สำเร็จ",
          raw: data,
        }),
        { status: ok ? 200 : status, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const shops = ((data as { data?: { content?: unknown[] } })?.data?.content ?? []) as Array<{
      shopId?: string;
      id?: string;
      shopName?: string;
      name?: string;
      channel?: string;
    }>;

    for (const s of shops) {
      const shopId = s.shopId ?? s.id;
      if (!shopId) continue;
      await supabase.from("ginee_shop_connections").upsert(
        {
          ginee_shop_id: String(shopId),
          shop_name: s.shopName ?? s.name ?? null,
          channel: s.channel ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ginee_shop_id" },
      );
    }

    return new Response(JSON.stringify({ connected: true, shops }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await supabase
      .from("ginee_sync_log")
      .insert({ action: "list_shops", status: "error", detail: { message } });
    return new Response(JSON.stringify({ connected: false, error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
