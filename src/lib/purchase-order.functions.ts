/**
 * src/lib/purchase-order.functions.ts  (ไฟล์ใหม่)
 * ระบบสร้างใบสั่งซื้อ (PO) แยกตาม distributor สำหรับ drop-ship ตรงถึงลูกค้า
 *
 * Flow การใช้งาน:
 * 1. Admin เปิดหน้า /admin/purchase-orders
 * 2. เรียก getPendingItemsByDistributor() → เห็นตาราง SKU ที่รอสั่ง จัดกลุ่มตาม distributor
 * 3. เลือก distributor ที่จะออก PO → เรียก getPendingOrderItemIds(distributor)
 * 4. เรียก generatePurchaseOrder({ distributor, orderItemIds }) → สร้าง PO + PO items
 * 5. เปิดหน้า /admin/purchase-orders/$poId เพื่อ preview/print PO (ใช้ pdf skill แปลงเป็น PDF)
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------------------------------------------------------------------
// 1) สรุปสินค้าที่รอสั่ง จัดกลุ่มตาม distributor (สำหรับหน้า dashboard)
// ---------------------------------------------------------------------------
export const getPendingItemsByDistributor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // ดึง order_items ที่จ่ายเงินแล้ว ยังไม่เคยถูกใส่ PO
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id, order_id, product_sku, product_name, quantity, cost_price, distributor,
        orders!inner(payment_status, admin_status, order_number)
      `)
      .is("po_item_id", null)
      .eq("orders.payment_status", "paid")
      .neq("orders.admin_status", "cancelled");

    if (error) throw new Error(error.message);

    // จัดกลุ่มฝั่ง client (จำนวนไม่เยอะ ไม่ต้องพึ่ง SQL GROUP BY)
    type Row = {
      distributor: string | null;
      product_sku: string;
      product_name: string | null;
      quantity: number;
      cost_price: number | null;
    };
    const rows = (data ?? []) as unknown as Row[];

    const byDistributor = new Map<
      string,
      { sku: string; name: string | null; qty: number; costPrice: number; subtotal: number }[]
    >();

    for (const r of rows) {
      const dist = r.distributor || "ไม่ระบุ";
      const list = byDistributor.get(dist) ?? [];
      const existing = list.find((x) => x.sku === r.product_sku);
      if (existing) {
        existing.qty += r.quantity;
        existing.subtotal += r.quantity * Number(r.cost_price ?? 0);
      } else {
        list.push({
          sku: r.product_sku,
          name: r.product_name,
          qty: r.quantity,
          costPrice: Number(r.cost_price ?? 0),
          subtotal: r.quantity * Number(r.cost_price ?? 0),
        });
      }
      byDistributor.set(dist, list);
    }

    return [...byDistributor.entries()].map(([distributor, items]) => ({
      distributor,
      itemCount: items.length,
      totalQty: items.reduce((s, i) => s + i.qty, 0),
      totalCost: items.reduce((s, i) => s + i.subtotal, 0),
      items,
    }));
  });

// ---------------------------------------------------------------------------
// 2) สร้าง PO จริง จาก order_item_ids ที่ admin เลือก (ต้องเป็น distributor เดียวกันทั้งหมด)
// ---------------------------------------------------------------------------
export const generatePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { distributor: string; orderItemIds: string[]; notes?: string }) => d)
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { distributor, orderItemIds, notes } = data;

    if (orderItemIds.length === 0) throw new Error("ไม่มีรายการที่เลือก");

    // ดึงรายละเอียด order_items + ที่อยู่จัดส่งจาก orders
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select(`
        id, order_id, product_sku, product_name, quantity, cost_price, distributor, po_item_id,
        orders!inner(order_number, shipping_name, shipping_phone, shipping_address, shipping_district, shipping_province, shipping_postcode)
      `)
      .in("id", orderItemIds);

    if (itemsErr) throw new Error(itemsErr.message);
    if (!items || items.length === 0) throw new Error("ไม่พบรายการสินค้า");

    // ป้องกันสั่งซ้ำ + ป้องกันปนกันคนละ distributor
    for (const it of items as any[]) {
      if (it.po_item_id) throw new Error(`รายการ ${it.product_sku} ถูกใส่ PO ไปแล้ว`);
      if (it.distributor !== distributor) throw new Error(`รายการ ${it.product_sku} ไม่ใช่ของ distributor นี้`);
    }

    const totalCost = (items as any[]).reduce((s, i) => s + i.quantity * Number(i.cost_price ?? 0), 0);
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${distributor
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`;

    // 1) สร้าง PO header
    const { data: po, error: poErr } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        distributor,
        status: "draft",
        total_cost: totalCost,
        total_items: items.length,
        notes: notes ?? null,
      })
      .select()
      .single();
    if (poErr) throw new Error(poErr.message);

    // 2) สร้าง PO line items (แต่ละบรรทัดผูกปลายทางลูกค้าของตัวเอง)
    const poItemsPayload = (items as any[]).map((it) => ({
      po_id: po.id,
      order_id: it.order_id,
      order_item_id: it.id,
      product_sku: it.product_sku,
      product_name: it.product_name,
      quantity: it.quantity,
      cost_price: Number(it.cost_price ?? 0),
      subtotal: it.quantity * Number(it.cost_price ?? 0),
      ship_to_name: it.orders.shipping_name,
      ship_to_phone: it.orders.shipping_phone,
      ship_to_address: it.orders.shipping_address,
      ship_to_district: it.orders.shipping_district,
      ship_to_province: it.orders.shipping_province,
      ship_to_postcode: it.orders.shipping_postcode,
      order_number: it.orders.order_number,
    }));

    const { data: poItems, error: poItemsErr } = await supabase
      .from("purchase_order_items")
      .insert(poItemsPayload)
      .select();
    if (poItemsErr) throw new Error(poItemsErr.message);

    // 3) stamp order_items ว่าถูกใส่ PO แล้ว (กันสั่งซ้ำ)
    for (const poItem of poItems as any[]) {
      await supabase
        .from("order_items")
        .update({ po_item_id: poItem.id })
        .eq("id", poItem.order_item_id);
    }

    return { poId: po.id, poNumber: po.po_number };
  });

// ---------------------------------------------------------------------------
// 3) ดึงรายละเอียด PO เต็ม สำหรับหน้า preview/print
// ---------------------------------------------------------------------------
export const getPurchaseOrderDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { poId: string }) => d)
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: po, error } = await supabase
      .from("purchase_orders")
      .select("*, purchase_order_items(*)")
      .eq("id", data.poId)
      .single();
    if (error) throw new Error(error.message);
    return po;
  });
