import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYNC_PRODUCT_COLUMNS =
  "id, sku, name, description, brand, category, distributor, image_url, product_url, cost_price, price, selling_price, markup_override, price_approved, stock_qty, stock_status, synced_at";

export const runSynnexSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    await adminContext(context.userId);
    const { data, error } = await context.supabase.functions.invoke("sync-synnex", {
      body: {},
    });
    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { status: "error" as const, productsFound: 0, message: msg };
    }
    return {
      status: (data?.status ?? "success") as "success" | "error",
      productsFound: (data?.productsFound ?? 0) as number,
      message: (data?.message ?? "") as string,
    };
  });

export const getSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);
    const [{ data: latest }, { count }] = await Promise.all([
      db
        .from("sync_logs")
        .select("id, status, message, products_found, started_at, finished_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from("synnex_products").select("id", { count: "exact", head: true }),
    ]);
    return { latest, total: count ?? 0 };
  });

const listSchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(["all", "ready", "out"]).optional().default("all"),
  page: z.number().int().min(1).default(1),
});

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { adminContext } = await import("@/lib/pricing-admin.server");
    const db = await adminContext(context.userId);
    const pageSize = 20;
    const from = (data.page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("synnex_products")
      .select(SYNC_PRODUCT_COLUMNS, { count: "exact" })
      .order("synced_at", { ascending: false })
      .range(from, to);

    if (data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, "");
      query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
    }
    if (data.status === "ready") query = query.eq("stock_status", "พร้อมจัดส่ง");
    if (data.status === "out") query = query.eq("stock_status", "สินค้าหมด");

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0, page: data.page, pageSize };
  });
