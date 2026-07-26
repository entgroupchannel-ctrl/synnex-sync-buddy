import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "@/lib/admin-guard.server";

export const SORT_MAP: Record<string, { col: string; asc: boolean }> = {
  sku_asc: { col: "sku", asc: true },
  sku_desc: { col: "sku", asc: false },
  name_asc: { col: "name", asc: true },
  name_desc: { col: "name", asc: false },
  cost_asc: { col: "cost_price", asc: true },
  cost_desc: { col: "cost_price", asc: false },
  markup_asc: { col: "markup_override", asc: true },
  markup_desc: { col: "markup_override", asc: false },
  selling_asc: { col: "selling_price", asc: true },
  selling_desc: { col: "selling_price", asc: false },
  status_pending: { col: "price_approved", asc: true },
  status_approved: { col: "price_approved", asc: false },
  updated_desc: { col: "updated_at", asc: false },
};

export const ADMIN_PRODUCT_COLUMNS =
  "id, sku, name, brand, category, distributor, image_url, cost_price, price, selling_price, markup_override, price_approved, updated_at";

export function roundTo10(n: number) {
  return Math.round(n / 10) * 10;
}

/** โหลด client service role + ตรวจสิทธิ์ admin ในขั้นตอนเดียว */
export async function adminContext(userId: string) {
  await assertAdmin(userId);
  return supabaseAdmin;
}
