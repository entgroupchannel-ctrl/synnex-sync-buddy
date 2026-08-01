// เรียกจากปุ่ม "เชื่อมต่อร้าน Shopee" ในหน้า admin — คืนลิงก์ authorize (อายุ 5 นาที)
import { buildAuthUrl } from "../_shared/shopee.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("ไม่พบ SUPABASE_URL");

    const redirectUrl = `${supabaseUrl}/functions/v1/shopee-oauth-callback`;
    const authUrl = await buildAuthUrl(redirectUrl);

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
