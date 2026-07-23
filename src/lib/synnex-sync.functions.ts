import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const runSynnexSync = createServerFn({ method: "POST" }).handler(async () => {
  const username = process.env.SYNNEX_USERNAME;
  const password = process.env.SYNNEX_PASSWORD;
  if (!username || !password) {
    return { status: "error" as const, productsFound: 0, message: "Missing Synnex credentials" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { scrapeSynnexProducts } = await import("./synnex-scraper.server");

  const startedAt = new Date().toISOString();
  const { data: logRow, error: logErr } = await supabaseAdmin
    .from("sync_logs")
    .insert({ started_at: startedAt, status: "running", products_found: 0 })
    .select("id")
    .single();
  if (logErr) throw new Error(logErr.message);
  const logId = logRow.id;

  try {
    const products = await scrapeSynnexProducts(username, password);

    if (products.length > 0) {
      const rows = products.map((p) => ({ ...p, synced_at: new Date().toISOString() }));
      const { error: upErr } = await supabaseAdmin
        .from("synnex_products")
        .upsert(rows, { onConflict: "sku" });
      if (upErr) throw new Error(upErr.message);
    }

    await supabaseAdmin
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        products_found: products.length,
        status: "success",
        message: `Synced ${products.length} products`,
      })
      .eq("id", logId);

    return {
      status: "success" as const,
      productsFound: products.length,
      message: `Synced ${products.length} products`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        message: msg.slice(0, 500),
      })
      .eq("id", logId);
    return { status: "error" as const, productsFound: 0, message: msg };
  }
});

export const getSyncStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: latest }, { count }] = await Promise.all([
    supabaseAdmin
      .from("sync_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("synnex_products").select("*", { count: "exact", head: true }),
  ]);
  return { latest, total: count ?? 0 };
});

const listSchema = z.object({
  search: z.string().optional().default(""),
  page: z.number().int().min(1).default(1),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pageSize = 50;
    const from = (data.page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("synnex_products")
      .select("*", { count: "exact" })
      .order("synced_at", { ascending: false })
      .range(from, to);

    if (data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, "");
      query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0, page: data.page, pageSize };
  });
