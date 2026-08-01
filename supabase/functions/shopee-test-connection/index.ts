// ทดสอบว่าการเชื่อมต่อ Shopee ยังใช้งานได้ — refresh token ถ้าใกล้หมดอายุ แล้วเรียก get_shop_info
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callShopApi, refreshAccessToken } from "../_shared/shopee.ts";

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
    const { data: conn, error } = await supabase
      .from("shopee_shop_connections")
      .select("*")
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!conn) {
      return new Response(
        JSON.stringify({ connected: false, message: "ยังไม่มีร้าน Shopee เชื่อมต่อไว้เลย" }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    let accessToken = conn.access_token as string;
    const expiresAt = new Date(conn.access_token_expires_at as string).getTime();
    const nearExpiry = expiresAt - Date.now() < 5 * 60 * 1000;

    if (nearExpiry) {
      const { ok, data } = await refreshAccessToken(
        conn.shop_id as number,
        conn.refresh_token as string,
      );
      const r = data as {
        access_token?: string;
        refresh_token?: string;
        expire_in?: number;
        message?: string;
      } | null;
      if (!ok || !r?.access_token) {
        await supabase.from("shopee_sync_log").insert({
          shop_id: conn.shop_id,
          action: "refresh_token",
          status: "error",
          detail: r ?? {},
        });
        return new Response(
          JSON.stringify({
            connected: false,
            message: `Refresh token ไม่สำเร็จ: ${r?.message ?? "unknown"} — ต้อง authorize ร้านใหม่`,
          }),
          { headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      accessToken = r.access_token;
      await supabase
        .from("shopee_shop_connections")
        .update({
          access_token: r.access_token,
          refresh_token: r.refresh_token ?? conn.refresh_token,
          access_token_expires_at: new Date(
            Date.now() + (r.expire_in ?? 14400) * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("shop_id", conn.shop_id as number);
    }

    const { ok, data } = await callShopApi(
      "/api/v2/shop/get_shop_info",
      conn.shop_id as number,
      accessToken,
      {},
      "GET",
    );
    await supabase.from("shopee_sync_log").insert({
      shop_id: conn.shop_id,
      action: "test_connection",
      request_path: "/api/v2/shop/get_shop_info",
      status: ok ? "success" : "error",
      detail: data ?? {},
    });

    return new Response(
      JSON.stringify({
        connected: ok,
        shop_id: conn.shop_id,
        refreshed: nearExpiry,
        shopee_response: data,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return new Response(JSON.stringify({ connected: false, error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
