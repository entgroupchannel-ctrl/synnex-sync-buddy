import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderNumberSchema = z.object({ orderNumber: z.string().min(3).max(64) });

/**
 * แทนที่ query ตรงจาก client — ปลอดภัยเหมือน getPublicTracking (ไม่ส่ง cost_price/distributor ออกไป)
 * ถ้า service role key หายจาก environment จะ fallback ไปอ่านผ่าน publishable key + RPC
 * get_order_confirmation (security definer, คืนเฉพาะคอลัมน์ปลอดภัย) เพื่อไม่ให้หน้าออเดอร์ล่มทั้งหน้า
 */
export const getOrderConfirmation = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => orderNumberSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { getAdminClient } = await import("@/lib/supabase-admin.server");
      const supabaseAdmin = getAdminClient();
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select(`
          id, order_number, created_at, customer_name, customer_phone, customer_email, customer_type, user_id,
          shipping_name, shipping_phone, shipping_address, shipping_district, shipping_province, shipping_postcode,
          payment_method, payment_status, payment_slip_url, subtotal, cod_fee, total, status,
          need_tax_invoice, company_name,
          order_items(id, product_sku, product_name, product_image_url, unit_price, quantity, subtotal)
        `)
        .eq("order_number", data.orderNumber)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return order ?? null;
    } catch (adminErr) {
      console.warn("[order-confirmation] admin client ใช้ไม่ได้ ใช้ RPC สำรอง", adminErr);
      const { getPublicClient } = await import("@/lib/supabase-public.server");
      const { data: row, error } = await getPublicClient().rpc("get_order_confirmation", {
        p_order_number: data.orderNumber,
      });
      if (error) throw new Error(error.message);
      return (row as Awaited<ReturnType<typeof getOrderConfirmationShape>>) ?? null;
    }
  });

// ตัวช่วยด้าน type เท่านั้น (ไม่ถูกเรียกใช้จริง)
declare function getOrderConfirmationShape(): Promise<Record<string, unknown> | null>;

const paymentStatusSchema = z.object({ orderId: z.string().uuid() });
export const getOrderPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => paymentStatusSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { getAdminClient } = await import("@/lib/supabase-admin.server");
      const supabaseAdmin = getAdminClient();
      const { data: order } = await supabaseAdmin
        .from("orders").select("payment_status").eq("id", data.orderId).maybeSingle();
      return { payment_status: order?.payment_status ?? null };
    } catch {
      const { getPublicClient } = await import("@/lib/supabase-public.server");
      const { data: status } = await getPublicClient().rpc("get_order_payment_status", {
        p_order_id: data.orderId,
      });
      return { payment_status: (status as string | null) ?? null };
    }
  });


const submitSlipSchema = z.object({ orderNumber: z.string().min(3).max(64), path: z.string().min(3) });
export const submitPaymentSlip = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSlipSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();
    const sb = supabaseAdmin;
    const { data: order, error: findErr } = await sb
      .from("orders").select("id, status").eq("order_number", data.orderNumber).maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!order) throw new Error("ไม่พบคำสั่งซื้อ");

    const { error: updErr } = await sb.from("orders").update({ payment_slip_url: data.path }).eq("id", order.id);
    if (updErr) throw new Error(updErr.message);

    await sb.from("order_status_history").insert({
      order_id: order.id, status: order.status ?? "pending",
      note: "ลูกค้าแนบสลิปโอนเงิน", changed_by: "customer",
    });
    return { order_id: order.id };
  });

const linkGuestSchema = z.object({ orderNumber: z.string().min(3).max(64), userId: z.string().uuid() });
export const linkGuestOrderToAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => linkGuestSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();
    const sb = supabaseAdmin;
    const { data: order, error: findErr } = await sb
      .from("orders").select("id, user_id").eq("order_number", data.orderNumber).maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!order) throw new Error("ไม่พบคำสั่งซื้อ");
    if (order.user_id) throw new Error("ออเดอร์นี้ผูกบัญชีไปแล้ว");

    const { error: updErr } = await sb.from("orders")
      .update({ user_id: data.userId, customer_type: "b2c" }).eq("id", order.id);
    if (updErr) throw new Error(updErr.message);
    return { success: true };
  });

const orderIdSchema = z.object({ orderId: z.string().uuid() });

/** ประวัติสถานะออเดอร์ — ผ่านเซิร์ฟเวอร์ เพราะ RLS ปิดการอ่านตรงจาก client ของ guest แล้ว */
export const getOrderStatusHistory = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => orderIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();
    const { data: rows, error } = await supabaseAdmin
      .from("order_status_history")
      .select("id, status, note, created_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** ผลตรวจสลิปแบบย่อสำหรับลูกค้า (ไม่ส่งข้อมูลผู้โอน/ธนาคารออกไป) */
export const getOrderSlipStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => orderIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();
    const { data: row, error } = await supabaseAdmin
      .from("slip_verifications")
      .select("risk_flags, auto_approved, error_message")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

const createdHistorySchema = z.object({
  orderId: z.string().uuid(),
  changedBy: z.string().max(120).optional(),
});

/** บันทึกประวัติ "ลูกค้าสร้าง order" — guest เขียนตรงไม่ได้อีกแล้ว */
export const logOrderCreated = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createdHistorySchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase-admin.server");
    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin.from("order_status_history").insert({
      order_id: data.orderId,
      status: "pending",
      note: "ลูกค้าสร้าง order",
      changed_by: data.changedBy ?? "customer",
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });
