// Abandoned cart reminder helpers.
// - Persists the current cart to `cart_reminders` for logged-in users so a
//   scheduled edge function can email them if they don't complete checkout.
// - Provides a hook that surfaces an in-app notice when a saved cart is older
//   than 3 hours.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

async function findOpenReminder(userId: string) {
  const { data } = await supabase
    .from("cart_reminders")
    .select("id, updated_at, cart_total, cart_snapshot")
    .eq("user_id", userId)
    .eq("recovered", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function saveCartReminder(
  userId: string,
  email: string,
  items: CartItem[],
  total: number,
) {
  if (!items.length) {
    await deleteCartReminder(userId);
    return;
  }
  const existing = await findOpenReminder(userId);
  const snapshot = items.map((i) => ({
    id: i.id,
    sku: i.sku,
    slug: i.slug,
    name: i.name,
    price: i.price,
    image_url: i.image_url,
    qty: i.qty,
  }));
  const now = new Date().toISOString();
  if (existing) {
    await supabase
      .from("cart_reminders")
      .update({
        customer_email: email,
        cart_snapshot: snapshot,
        cart_total: total,
        updated_at: now,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("cart_reminders").insert({
      user_id: userId,
      customer_email: email,
      cart_snapshot: snapshot,
      cart_total: total,
    });
  }
}

export async function deleteCartReminder(userId: string) {
  await supabase
    .from("cart_reminders")
    .delete()
    .eq("user_id", userId)
    .eq("recovered", false);
}

export async function markCartRecovered(userId: string) {
  await supabase
    .from("cart_reminders")
    .update({ recovered: true, recovered_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("recovered", false);
}

export type AbandonedCartNotice = {
  itemCount: number;
  total: number;
  updatedAt: string;
} | null;

/** Returns a notice when the user has a saved cart older than 3 hours. */
export function useAbandonedCartNotice(userId: string | null | undefined) {
  const [notice, setNotice] = useState<AbandonedCartNotice>(null);
  useEffect(() => {
    if (!userId) {
      setNotice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const row = await findOpenReminder(userId);
      if (cancelled || !row) return setNotice(null);
      const updated = new Date(row.updated_at as string).getTime();
      const ageHrs = (Date.now() - updated) / 36e5;
      if (ageHrs < 3) return setNotice(null);
      const snap = (row.cart_snapshot as { qty: number }[]) || [];
      const itemCount = snap.reduce((s, x) => s + (x.qty || 0), 0);
      setNotice({
        itemCount,
        total: Number(row.cart_total ?? 0),
        updatedAt: row.updated_at as string,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return notice;
}
