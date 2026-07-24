import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FrequentItem = {
  product_sku: string;
  product_name: string;
  product_image_url: string | null;
  last_unit_price: number;
  last_purchased_at: string | null;
  buy_count: number;
  total_qty: number;
  current: {
    id: string;
    slug: string | null;
    selling_price: number | null;
    member_price: number | null;
    b2b_price: number | null;
    price_approved: boolean | null;
    stock_status: string | null;
    distributor: string | null;
    image_url: string | null;
    name: string | null;
  } | null;
};

async function fetchUserAndEmail(): Promise<{ userId: string | null; email: string | null }> {
  const { data } = await supabase.auth.getUser();
  return { userId: data.user?.id ?? null, email: data.user?.email ?? null };
}

/** Aggregated purchase history for the signed-in user (via user_id or matching email). */
export function useFrequentlyBought(limit = 6) {
  return useQuery({
    queryKey: ["frequently-bought", limit],
    queryFn: async (): Promise<FrequentItem[]> => {
      const { userId, email } = await fetchUserAndEmail();
      if (!userId && !email) return [];

      // 1) find matching orders (user_id or customer_email)
      const orFilter = [
        userId ? `user_id.eq.${userId}` : null,
        email ? `customer_email.eq.${email}` : null,
      ].filter(Boolean).join(",");
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .or(orFilter)
        .neq("status", "cancelled");
      const orderIds = (orders ?? []).map((o) => o.id);
      if (orderIds.length === 0) return [];

      // 2) all items for those orders
      const { data: items } = await supabase
        .from("order_items")
        .select("product_sku,product_name,product_image_url,unit_price,quantity,created_at")
        .in("order_id", orderIds);
      if (!items || items.length === 0) return [];

      // 3) aggregate by SKU
      const map = new Map<string, FrequentItem>();
      for (const it of items) {
        const sku = it.product_sku;
        const prev = map.get(sku);
        const created = it.created_at ?? null;
        if (!prev) {
          map.set(sku, {
            product_sku: sku,
            product_name: it.product_name,
            product_image_url: it.product_image_url,
            last_unit_price: Number(it.unit_price ?? 0),
            last_purchased_at: created,
            buy_count: 1,
            total_qty: Number(it.quantity ?? 0),
            current: null,
          });
        } else {
          prev.buy_count += 1;
          prev.total_qty += Number(it.quantity ?? 0);
          if (created && (!prev.last_purchased_at || created > prev.last_purchased_at)) {
            prev.last_purchased_at = created;
            prev.last_unit_price = Number(it.unit_price ?? 0);
          }
        }
      }
      const sorted = [...map.values()].sort((a, b) => b.buy_count - a.buy_count).slice(0, limit);

      // 4) enrich with current product data
      const skus = sorted.map((s) => s.product_sku);
      const { data: currents } = await supabase
        .from("synnex_products")
        .select("id,sku,slug,name,image_url,selling_price,member_price,b2b_price,price_approved,stock_status,distributor")
        .in("sku", skus);
      const byS = new Map((currents ?? []).map((c) => [c.sku, c]));
      for (const row of sorted) {
        const c = byS.get(row.product_sku);
        row.current = c
          ? {
              id: c.id,
              slug: c.slug,
              selling_price: c.selling_price,
              member_price: c.member_price,
              b2b_price: c.b2b_price,
              price_approved: c.price_approved,
              stock_status: c.stock_status,
              distributor: c.distributor,
              image_url: c.image_url,
              name: c.name,
            }
          : null;
      }
      return sorted;
    },
  });
}

/** How many times / when the signed-in user has purchased a given SKU. */
export function usePurchaseHistoryForSku(sku: string | null | undefined) {
  return useQuery({
    enabled: !!sku,
    queryKey: ["purchase-history-sku", sku],
    queryFn: async () => {
      const { userId, email } = await fetchUserAndEmail();
      if (!userId && !email) return { count: 0, lastDate: null as string | null, lastPrice: 0 };
      const orFilter = [
        userId ? `user_id.eq.${userId}` : null,
        email ? `customer_email.eq.${email}` : null,
      ].filter(Boolean).join(",");
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .or(orFilter)
        .neq("status", "cancelled");
      const ids = (orders ?? []).map((o) => o.id);
      if (ids.length === 0) return { count: 0, lastDate: null, lastPrice: 0 };
      const { data } = await supabase
        .from("order_items")
        .select("unit_price,created_at")
        .in("order_id", ids)
        .eq("product_sku", sku!)
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      return {
        count: rows.length,
        lastDate: rows[0]?.created_at ?? null,
        lastPrice: Number(rows[0]?.unit_price ?? 0),
      };
    },
  });
}
