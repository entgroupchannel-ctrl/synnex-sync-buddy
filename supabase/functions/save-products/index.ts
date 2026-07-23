// Supabase Edge Function: save-products
// Accepts POST { products: Product[] } from the browser and upserts them
// into synnex_products, then writes a row to sync_logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Product {
  sku: string;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  stock_qty?: number | null;
  stock_status?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  brand?: string | null;
}

function sanitize(p: unknown): Product | null {
  if (!p || typeof p !== "object") return null;
  const r = p as Record<string, unknown>;
  const sku = typeof r.sku === "string" ? r.sku.trim() : "";
  if (!sku) return null;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 2000) : null;
  const num = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v.replace(/[,฿\s]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const int = (v: unknown) => {
    const n = num(v);
    return n === null ? null : Math.trunc(n);
  };
  return {
    sku: sku.slice(0, 200),
    name: str(r.name),
    description: str(r.description),
    price: num(r.price),
    stock_qty: int(r.stock_qty),
    stock_status: str(r.stock_status),
    image_url: str(r.image_url),
    product_url: str(r.product_url),
    brand: str(r.brand),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const started_at = new Date().toISOString();
  const { data: log, error: logErr } = await supabase
    .from("sync_logs")
    .insert({ started_at, status: "running", products_found: 0 })
    .select("id")
    .single();
  if (logErr) {
    console.error("[save-products] log insert failed:", logErr);
    return new Response(JSON.stringify({ error: logErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    const raw = Array.isArray(body?.products) ? body.products : null;
    if (!raw) throw new Error("Body must be { products: Product[] }");
    if (raw.length > 5000) throw new Error("Too many products (max 5000)");

    const clean: Product[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      const s = sanitize(item);
      if (!s || seen.has(s.sku)) continue;
      seen.add(s.sku);
      clean.push(s);
    }
    if (clean.length === 0) throw new Error("No valid products (need a sku)");

    const now = new Date().toISOString();
    // Incoming price = distributor cost. Save to cost_price and mirror to
    // `price` (legacy). selling_price is cleared and price_approved reset —
    // admin must approve pricing before customers see it.
    const rows = clean.map((p) => ({
      ...p,
      cost_price: p.price,
      selling_price: null,
      price_approved: false,
      synced_at: now,
    }));
    const { error: upErr } = await supabase
      .from("synnex_products")
      .upsert(rows, { onConflict: "sku" });
    if (upErr) throw new Error(`Upsert failed: ${upErr.message}`);


    await supabase
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        products_found: clean.length,
        status: "success",
        message: `Imported ${clean.length} products from client`,
      })
      .eq("id", log.id);

    console.log(`[save-products] imported ${clean.length}`);
    return new Response(
      JSON.stringify({ status: "success", productsFound: clean.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[save-products] error:", msg);
    await supabase
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        message: msg.slice(0, 500),
      })
      .eq("id", log.id);
    return new Response(JSON.stringify({ status: "error", message: msg }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
