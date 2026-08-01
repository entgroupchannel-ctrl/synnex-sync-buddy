// ผลัก synnex_products เข้า Ginee Master Product — Ginee จะซิงค์ต่อไปยัง channel ที่เชื่อมไว้
// ต้อง map หมวดหมู่ของเรากับ Ginee fullCategoryId ก่อน (ตาราง ginee_category_map)
// เรียกได้ 2 แบบ: { product_id } หรือ { category, limit }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGineeApi, gineeSucceeded } from "../_shared/ginee.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Product = {
  id: string;
  sku: string;
  name: string | null;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  image_url: string | null;
  selling_price: number | null;
  cost_price: number | null;
};

async function syncOne(
  supabase: ReturnType<typeof createClient>,
  product: Product,
): Promise<{ ok: boolean; reason: string }> {
  const { data: catMap } = await supabase
    .from("ginee_category_map")
    .select("ginee_full_category_id")
    .eq("our_category", product.category ?? "")
    .or(`our_subcategory.eq.${product.subcategory ?? ""},our_subcategory.is.null`)
    .limit(1)
    .maybeSingle();

  if (!catMap) {
    await supabase.from("ginee_product_sync").upsert(
      {
        product_id: product.id,
        sync_status: "skipped_no_category",
        last_error: `ยังไม่ได้ map หมวด "${product.category}"${product.subcategory ? " / " + product.subcategory : ""} กับ Ginee fullCategoryId`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
    return { ok: false, reason: "no_category_map" };
  }

  const payload = {
    name: (product.name ?? product.sku).slice(0, 300),
    spu: product.sku,
    fullCategoryId: (catMap as { ginee_full_category_id: unknown }).ginee_full_category_id,
    condition: "NEW",
    description: (product.description || product.name || product.sku).slice(0, 60000),
    variantOptions: [],
    type: "NORMAL",
    status: "PENDING_REVIEW",
    images: product.image_url ? [product.image_url] : [],
    brand: product.brand ?? undefined,
    variations: [
      {
        optionValues: ["-"],
        sku: product.sku,
        status: "ACTIVE",
        images: product.image_url ? [product.image_url] : [],
        sellingPrice: { amount: Number(product.selling_price ?? 0), currencyCode: "THB" },
        purchasePrice: product.cost_price
          ? { amount: Number(product.cost_price), currencyCode: "THB" }
          : {},
        stock: { availableStock: 10, safetyAlert: false, safetyStock: 0 },
      },
    ],
  };

  const { data } = await callGineeApi("/openapi/product/master/v1/create", "POST", payload);
  const success = gineeSucceeded(data) && (data as { data?: { success?: boolean } })?.data?.success;

  await supabase.from("ginee_sync_log").insert({
    action: "sync_product",
    request_path: "/openapi/product/master/v1/create",
    status: success ? "success" : "error",
    detail: { product_id: product.id, sku: product.sku, response: data },
  });

  if (success) {
    const d = (data as { data?: { productId?: string; variationIds?: string[] } }).data!;
    await supabase.from("ginee_product_sync").upsert(
      {
        product_id: product.id,
        ginee_product_id: d.productId,
        ginee_variation_id: d.variationIds?.[0] ?? null,
        sync_status: "synced",
        last_synced_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
    return { ok: true, reason: "synced" };
  }

  const errMsg = JSON.stringify(
    (data as { data?: { invalidFields?: unknown } })?.data?.invalidFields ?? data,
  );
  await supabase.from("ginee_product_sync").upsert(
    {
      product_id: product.id,
      sync_status: "error",
      last_error: errMsg.slice(0, 2000),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );
  return { ok: false, reason: errMsg };
}

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
    const body = await req.json().catch(() => ({}));
    const cols =
      "id, sku, name, description, category, subcategory, brand, image_url, selling_price, cost_price";

    let products: Product[] = [];
    if (body.product_id) {
      const { data, error } = await supabase
        .from("synnex_products")
        .select(cols)
        .eq("id", body.product_id)
        .maybeSingle();
      if (error) throw error;
      if (data) products = [data as unknown as Product];
    } else if (body.category) {
      const { data: already } = await supabase
        .from("ginee_product_sync")
        .select("product_id")
        .eq("sync_status", "synced");
      const excludeIds = (already ?? []).map((r) => (r as { product_id: string }).product_id);
      let q = supabase
        .from("synnex_products")
        .select(cols)
        .eq("category", body.category)
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .limit(body.limit ?? 20);
      if (excludeIds.length) q = q.not("id", "in", `(${excludeIds.join(",")})`);
      const { data, error } = await q;
      if (error) throw error;
      products = (data as unknown as Product[]) ?? [];
    } else {
      return new Response(JSON.stringify({ error: "ต้องระบุ product_id หรือ category" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ product_id: string; sku: string; ok: boolean; reason: string }> = [];
    for (const p of products) {
      const r = await syncOne(supabase, p);
      results.push({ product_id: p.id, sku: p.sku, ...r });
      await new Promise((res) => setTimeout(res, 300)); // กัน rate limit
    }

    return new Response(JSON.stringify({ total: results.length, results }), {
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
