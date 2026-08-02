// Server-only: ตัวช่วยเรียก service-role client แบบมี guard
// ใช้จากภายใน .handler() ของ createServerFn เท่านั้น: const sb = await getAdminClient();
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminClient = typeof supabaseAdmin;

export function getAdminClient(): AdminClient {
  const sb = supabaseAdmin as AdminClient | undefined;
  if (!sb || typeof (sb as { from?: unknown }).from !== "function") {
    console.error("[supabase-admin] service role client ใช้งานไม่ได้");
    throw new Error(
      "ระบบหลังบ้านเชื่อมต่อฐานข้อมูลไม่ได้ชั่วคราว (service role key หาย) กรุณาลองอีกครั้งหรือแจ้งผู้ดูแลระบบ",
    );
  }
  return sb;
}
