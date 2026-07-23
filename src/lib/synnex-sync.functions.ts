import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const runSynnexSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.functions.invoke("sync-synnex", {
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
    const { supabase } = context;
    const [{ data: latest }, { count }] = await Promise.all([
      supabase
        .from("sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("synnex_products").select("*", { count: "exact", head: true }),
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
    const { supabase } = context;
    const pageSize = 20;
    const from = (data.page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("synnex_products")
      .select("*", { count: "exact" })
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
