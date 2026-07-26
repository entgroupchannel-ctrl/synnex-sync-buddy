/**
 * ตรวจสิทธิ์ผู้ดูแลระบบฝั่งเซิร์ฟเวอร์
 *
 * requireSupabaseAuth ตรวจแค่ว่า "ล็อกอินอยู่" ไม่ได้ตรวจว่าเป็น admin
 * เมื่อ server function ใช้ service role (bypass RLS) จึงต้องตรวจสิทธิ์ที่ระดับโค้ด
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdmin(userId: string): Promise<void> {
  if (!userId) throw new Error("Forbidden: ไม่พบผู้ใช้");

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error("Forbidden: ตรวจสอบสิทธิ์ไม่สำเร็จ");
  if (!data?.is_admin) throw new Error("Forbidden: ต้องเป็นผู้ดูแลระบบเท่านั้น");
}
