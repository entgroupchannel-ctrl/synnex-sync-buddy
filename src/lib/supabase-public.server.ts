// Server-only: publishable-key client สำหรับอ่านข้อมูลสาธารณะ/RPC สำรอง
// ใช้เมื่อ service role key ใช้งานไม่ได้ เพื่อไม่ให้หน้าเว็บล่มทั้งหน้า
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function getPublicClient(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error("ระบบเชื่อมต่อฐานข้อมูลไม่ได้ชั่วคราว กรุณาลองอีกครั้ง");
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers: h });
      },
    },
  });
}
