import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ orderNumber: z.string().min(3).max(64) });

export const getPublicTracking = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;

    const { data: order, error } = await sb
      .from("orders")
      .select("id, order_number, status, shipping_provider, tracking_number, tracking_url, estimated_delivery, shipped_at, delivered_at, shipping_name, shipping_phone, shipping_address, shipping_district, shipping_province, shipping_postcode, created_at")
      .eq("order_number", data.orderNumber)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) return null;

    const { data: events } = await sb
      .from("shipping_events")
      .select("id, event_time, status, location, description, description_en")
      .eq("order_id", order.id)
      .order("event_time", { ascending: true });

    // Redact PII: mask phone middle digits and truncate address
    const maskPhone = (p: string | null) => {
      if (!p) return null;
      const digits = p.replace(/\D/g, "");
      if (digits.length < 6) return p;
      return digits.slice(0, 3) + "-xxx-" + digits.slice(-4);
    };
    const truncAddr = (a: string | null) => {
      if (!a) return null;
      return a.length > 40 ? a.slice(0, 40) + "…" : a;
    };

    return {
      order_number: order.order_number,
      status: order.status,
      shipping_provider: order.shipping_provider,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      estimated_delivery: order.estimated_delivery,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      created_at: order.created_at,
      shipping: {
        name: order.shipping_name,
        phone: maskPhone(order.shipping_phone),
        address: truncAddr(order.shipping_address),
        district: order.shipping_district,
        province: order.shipping_province,
        postcode: order.shipping_postcode,
      },
      events: events ?? [],
    };
  });
