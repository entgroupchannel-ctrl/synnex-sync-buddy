import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Save, FileText, Truck, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, STATUS_META, PAYMENT_STATUS_META, distMeta, bahtFmt, isValidStatus } from "@/lib/order-helpers";
import { SHIPPING_PROVIDERS, EVENT_PRESETS, buildTrackingUrl, providerLabel, eventLabel } from "@/lib/shipping";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "รายละเอียดออเดอร์ — ENT Admin" }] }),
  component: AdminOrderDetail,
});

type OrderItem = {
  id: string;
  product_sku: string;
  product_name: string;
  product_image_url: string | null;
  distributor: string | null;
  cost_price: number | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};
type HistoryRow = {
  id: string;
  status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};
type Order = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_type: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_district: string | null;
  shipping_province: string | null;
  shipping_postcode: string | null;
  need_tax_invoice: boolean;
  company_name: string | null;
  tax_id: string | null;
  company_address: string | null;
  payment_method: string | null;
  payment_status: string;
  payment_slip_url: string | null;
  subtotal: number | null;
  cod_fee: number;
  total: number | null;
  status: string | null;
  notes: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  quotation_url: string | null;
  tax_invoice_url: string | null;
  order_items: OrderItem[];
  history: HistoryRow[];
};

type ShippingEvent = {
  id: string;
  event_time: string | null;
  status: string | null;
  location: string | null;
  description: string | null;
  description_en: string | null;
};

type EmailLog = {
  id: string;
  created_at: string;
  email_type: string | null;
  recipient: string | null;
  status: string | null;
  error_message: string | null;
};

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [notes, setNotes] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string>("");
  const [shipProvider, setShipProvider] = useState<string>("kerry");
  const [estDelivery, setEstDelivery] = useState<string>("");
  const [shippedAt, setShippedAt] = useState<string>("");
  const [events, setEvents] = useState<ShippingEvent[]>([]);
  const [savingShip, setSavingShip] = useState(false);
  const [newEvent, setNewEvent] = useState<{ time: string; status: string; location: string }>({
    time: "", status: "in_transit", location: "",
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailBusy, setEmailBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: o }, { data: h }, { data: logs }, { data: evs }] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle(),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      supabase.from("email_logs").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("shipping_events").select("*").eq("order_id", id).order("event_time", { ascending: true }),
    ]);
    if (o) {
      const merged = { ...(o as Record<string, unknown>), history: (h ?? []) as HistoryRow[] } as unknown as Order;
      setOrder(merged);
      setStatus(merged.status ?? "pending");
      setPaymentStatus(merged.payment_status ?? "pending");
      setNotes(merged.notes ?? "");
      setTracking(merged.tracking_number ?? "");
      setShipProvider(merged.shipping_provider ?? "kerry");
      setEstDelivery(merged.estimated_delivery ?? "");
      setShippedAt(merged.shipped_at ? merged.shipped_at.slice(0, 10) : "");
      if (merged.payment_slip_url) {
        const { data } = await supabase.storage.from("payment-slips").createSignedUrl(merged.payment_slip_url, 60 * 60);
        setSlipUrl(data?.signedUrl ?? null);
      } else {
        setSlipUrl(null);
      }
    }
    setEvents((evs ?? []) as ShippingEvent[]);
    setEmailLogs((logs ?? []) as EmailLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const [byOrderSkus, setByOrderSkus] = useState<Set<string>>(new Set());
  useEffect(() => {
    const skus = (order?.order_items ?? []).map((i) => i.product_sku).filter(Boolean);
    if (skus.length === 0) { setByOrderSkus(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("synnex_products").select("sku,fulfillment_type").in("sku", skus);
      if (cancelled) return;
      const s = new Set<string>();
      for (const r of data ?? []) {
        if ((r as { fulfillment_type: string | null }).fulfillment_type === "by_order") s.add((r as { sku: string }).sku);
      }
      setByOrderSkus(s);
    })();
    return () => { cancelled = true; };
  }, [order]);
  const hasByOrder = byOrderSkus.size > 0;

  const grouped = useMemo(() => {
    const g = new Map<string, OrderItem[]>();
    for (const it of order?.order_items ?? []) {
      const k = (it.distributor ?? "OTHER").toUpperCase();
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(it);
    }
    return [...g.entries()];
  }, [order]);

  const save = async () => {
    if (!order) return;
    setSaving(true);
    const wasStatus = order.status ?? "pending";
    const wasPay = order.payment_status ?? "pending";
    const { error } = await supabase.from("orders").update({
      status, payment_status: paymentStatus, notes, tracking_number: tracking || null,
    }).eq("id", id);
    if (error) { setSaving(false); toast.error(error.message); return; }

    // Log history rows for changes
    const changes: { note: string; status: string }[] = [];
    if (status !== wasStatus) changes.push({ status, note: statusNote || `เปลี่ยนสถานะ: ${wasStatus} → ${status}` });
    if (paymentStatus !== wasPay) changes.push({ status, note: `การชำระเงิน: ${wasPay} → ${paymentStatus}` });
    if (changes.length) {
      const { data: userData } = await supabase.auth.getUser();
      const by = userData?.user?.email ?? "admin";
      await supabase.from("order_status_history").insert(changes.map((c) => ({
        order_id: id, status: c.status, note: c.note, changed_by: by,
      })));
    }
    // Auto-send shipping notification when status transitions to 'shipped'
    if (status === "shipped" && wasStatus !== "shipped") {
      supabase.functions.invoke("send-shipping-notification", {
        body: { order_id: id, tracking_number: tracking || null },
      }).catch((e) => console.warn("[send-shipping-notification]", e));
      toast.info("กำลังส่งอีเมลแจ้งจัดส่ง...");
    }
    setSaving(false);
    setStatusNote("");
    toast.success("บันทึกแล้ว");
    load();
  };

  const invokeFn = async (fn: string, label: string, extra?: Record<string, unknown>) => {
    setEmailBusy(fn);
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { order_id: id, ...(extra ?? {}) },
      });
      if (error) throw error;
      const payload = data as { success?: boolean; error?: string } | null;
      if (payload && payload.success === false) throw new Error(payload.error ?? "ส่งไม่สำเร็จ");
      toast.success(`${label} สำเร็จ`);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ส่งไม่สำเร็จ";
      toast.error(`${label} ล้มเหลว: ${msg}`);
    } finally {
      setEmailBusy(null);
    }
  };

  const saveShipping = async () => {
    if (!order) return;
    if (!tracking.trim()) { toast.error("กรุณาระบุเลขพัสดุ"); return; }
    setSavingShip(true);
    const wasStatus = order.status ?? "pending";
    const trackingUrl = buildTrackingUrl(shipProvider, tracking.trim());
    const shippedAtIso = shippedAt ? new Date(shippedAt + "T00:00:00").toISOString() : new Date().toISOString();
    const { error } = await supabase.from("orders").update({
      shipping_provider: shipProvider,
      tracking_number: tracking.trim(),
      tracking_url: trackingUrl,
      estimated_delivery: estDelivery || null,
      shipped_at: shippedAtIso,
      status: "shipped",
    }).eq("id", id);
    if (error) { setSavingShip(false); toast.error(error.message); return; }

    const { data: userData } = await supabase.auth.getUser();
    const by = userData?.user?.email ?? "admin";

    // Initial shipping event
    await supabase.from("shipping_events").insert({
      order_id: id,
      event_time: shippedAtIso,
      status: "picked_up",
      location: "คลังสินค้า ENT Group นนทบุรี",
      description: `รับพัสดุแล้ว — ${providerLabel(shipProvider)} ${tracking.trim()}`,
      description_en: `Picked up — ${providerLabel(shipProvider)} ${tracking.trim()}`,
    });

    // Status history
    if (wasStatus !== "shipped") {
      await supabase.from("order_status_history").insert({
        order_id: id, status: "shipped",
        note: `จัดส่งโดย ${providerLabel(shipProvider)} · ${tracking.trim()}`,
        changed_by: by,
      });
    }

    setStatus("shipped");
    // Fire notification
    supabase.functions.invoke("send-shipping-notification", {
      body: { order_id: id, tracking_number: tracking.trim() },
    }).catch((e) => console.warn("[send-shipping-notification]", e));

    toast.success("บันทึกและแจ้งลูกค้าแล้ว");
    setSavingShip(false);
    load();
  };

  const addShippingEvent = async () => {
    if (!newEvent.status) { toast.error("เลือกสถานะ"); return; }
    const t = newEvent.time ? new Date(newEvent.time).toISOString() : new Date().toISOString();
    const preset = EVENT_PRESETS.find((p) => p.value === newEvent.status);
    const { error } = await supabase.from("shipping_events").insert({
      order_id: id,
      event_time: t,
      status: newEvent.status,
      location: newEvent.location || null,
      description: preset?.label ?? newEvent.status,
      description_en: preset?.labelEn ?? newEvent.status,
    });
    if (error) { toast.error(error.message); return; }

    // If delivered → update order
    if (newEvent.status === "delivered") {
      await supabase.from("orders").update({
        delivered_at: t, status: "delivered",
      }).eq("id", id);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("order_status_history").insert({
        order_id: id, status: "delivered", note: "ลูกค้าได้รับพัสดุแล้ว",
        changed_by: userData?.user?.email ?? "admin",
      });
    }

    setNewEvent({ time: "", status: "in_transit", location: "" });
    toast.success("เพิ่มสถานะแล้ว");
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">ไม่พบออเดอร์</div>
      </div>
    );
  }

  const stMeta = STATUS_META[isValidStatus(order.status) ? order.status : "pending"];
  const payMeta = PAYMENT_STATUS_META[order.payment_status === "paid" ? "paid" : "pending"];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> กลับไปรายการออเดอร์
        </Link>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">
              <span className="font-mono">{order.order_number}</span>
            </h1>
            <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString("th-TH")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${stMeta.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${stMeta.dot}`} />{stMeta.label}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${payMeta.badge}`}>{payMeta.label}</span>
              {order.customer_type === "b2b" && <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">B2B</span>}
              {order.need_tax_invoice && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"><FileText className="h-3 w-3" />ใบกำกับภาษี</span>}
              {hasByOrder && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-300" title="ต้องสั่ง distributor ก่อน 30 วัน">📋 มีสินค้า By Order</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500">ยอดรวม</div>
            <div className="text-2xl font-bold text-[color:var(--brand-orange)]">{bahtFmt.format(Number(order.total ?? 0))}</div>
          </div>
        </div>

        {hasByOrder && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <div className="font-semibold">📋 ออเดอร์นี้มีสินค้า By Order</div>
            <div>ต้องสั่ง distributor ก่อน — ระยะเวลาจัดหา ~30 วัน</div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">ข้อมูลลูกค้า</h2>
              <dl className="space-y-3 text-sm">
                <Row k="ชื่อ" v={order.customer_name} />
                <Row k="เบอร์โทร" v={order.customer_phone} />
                <Row k="อีเมล" v={order.customer_email} />
                <Row k="ประเภท" v={order.customer_type ?? "-"} />
              </dl>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">ที่อยู่จัดส่ง</h2>
              <div className="text-sm">
                <div className="font-semibold">{order.shipping_name} · {order.shipping_phone}</div>
                <div className="mt-1 whitespace-pre-line text-slate-700">
                  {[order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(" ")}
                </div>
              </div>
            </div>

            {order.need_tax_invoice && (
              <div className="rounded-lg border bg-white p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">ใบกำกับภาษี</h2>
                <dl className="space-y-2 text-sm">
                  <Row k="ชื่อ" v={order.company_name} />
                  <Row k="เลขผู้เสียภาษี" v={order.tax_id} />
                  <Row k="ที่อยู่" v={order.company_address} multi />
                </dl>
              </div>
            )}

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">การชำระเงิน</h2>
              <div className="mb-3 text-sm">
                วิธี: <b>{order.payment_method === "cod" ? "COD" : "โอนเงิน"}</b>
              </div>
              {slipUrl ? (
                <a href={slipUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border">
                  <img src={slipUrl} alt="payment slip" className="max-h-64 w-full object-contain bg-slate-50" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="border-t bg-slate-50 px-3 py-2 text-xs">เปิดสลิป ↗</div>
                </a>
              ) : (
                <div className="text-sm text-slate-500">ยังไม่มีสลิป</div>
              )}
              <div className="mt-3">
                <label className="text-xs font-bold uppercase text-slate-500">สถานะการชำระ</label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">รอชำระ</SelectItem>
                    <SelectItem value="paid">ชำระแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">สถานะออเดอร์</h2>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} className="mt-2" placeholder="โน๊ตการเปลี่ยนสถานะ (บันทึกใน timeline)" />
            </div>

            {/* Shipping panel */}
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Truck className="h-4 w-4" /> 📦 ข้อมูลการจัดส่ง
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">บริษัทขนส่ง</label>
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {SHIPPING_PROVIDERS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setShipProvider(p.value)}
                        className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${shipProvider === p.value ? "border-[color:var(--brand-green)] bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">เลขพัสดุ</label>
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="เช่น EF123456789TH"
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">วันที่ส่งออก</label>
                    <input type="date" value={shippedAt} onChange={(e) => setShippedAt(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">กำหนดส่ง (ประมาณ)</label>
                    <input type="date" value={estDelivery} onChange={(e) => setEstDelivery(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  </div>
                </div>
                {tracking && buildTrackingUrl(shipProvider, tracking) && (
                  <a href={buildTrackingUrl(shipProvider, tracking)!} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                    <ExternalLink className="h-3 w-3" /> ตรวจสอบที่ {providerLabel(shipProvider)}
                  </a>
                )}
                <Button onClick={saveShipping} disabled={savingShip}
                  className="w-full bg-[color:var(--brand-green,#10B981)] hover:bg-emerald-600">
                  <Save className="mr-2 h-4 w-4" />
                  {savingShip ? "กำลังบันทึก..." : "บันทึก + แจ้งลูกค้า"}
                </Button>
              </div>

              {/* Shipping events timeline */}
              {events.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">เหตุการณ์การจัดส่ง</h3>
                  <ol className="relative space-y-3 border-l-2 border-slate-200 pl-4">
                    {events.map((ev) => (
                      <li key={ev.id} className="relative">
                        <span className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${ev.status === "delivered" ? "bg-emerald-500" : ev.status === "failed" ? "bg-red-500" : "bg-blue-500"}`} />
                        <div className="text-xs text-slate-500">{ev.event_time ? new Date(ev.event_time).toLocaleString("th-TH") : ""}</div>
                        <div className="text-sm font-semibold">{eventLabel(ev.status)}</div>
                        {(ev.description || ev.location) && (
                          <div className="text-xs text-slate-600">
                            {ev.description}{ev.location && <span className="text-slate-400"> · {ev.location}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Add new event */}
              <div className="mt-5 border-t pt-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">+ เพิ่มสถานะการจัดส่ง</h3>
                <div className="space-y-2">
                  <input type="datetime-local" value={newEvent.time}
                    onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  <Select value={newEvent.status} onValueChange={(v) => setNewEvent((s) => ({ ...s, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input value={newEvent.location}
                    onChange={(e) => setNewEvent((s) => ({ ...s, location: e.target.value }))}
                    placeholder="สถานที่ (เช่น ศูนย์กระจายสินค้ากรุงเทพ)"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  <Button onClick={addShippingEvent} variant="outline" className="w-full">
                    <Plus className="mr-1 h-4 w-4" /> เพิ่มเหตุการณ์
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Admin Notes</h2>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="โน๊ตภายใน" />
              <Button onClick={save} disabled={saving} className="mt-3 w-full bg-[color:var(--brand-green,#10B981)] hover:bg-emerald-600">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {grouped.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-sm text-slate-500">ไม่มีรายการสินค้า</div>}
            {grouped.map(([dist, items]) => {
              const meta = distMeta(dist);
              const subtotal = items.reduce((s, it) => s + Number(it.subtotal ?? 0), 0);
              return (
                <div key={dist} className="overflow-hidden rounded-lg border bg-white">
                  <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${meta.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <span className={`font-bold ${meta.text}`}>{meta.label}</span>
                      {meta.url && <span className="text-xs text-slate-500">สั่งซื้อที่: {meta.url.replace(/^https?:\/\//, "")}</span>}
                    </div>
                    {meta.url && (
                      <a href={meta.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className={`${meta.text} border-current`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" /> เปิด {meta.label}
                        </Button>
                      </a>
                    )}
                  </div>
                  <div>
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded border"><ProductImage src={it.product_image_url} alt={it.product_name} iconClassName="h-5 w-5 text-slate-300" fallbackLabel="" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{it.product_name}</div>
                          <div className="text-xs text-slate-500">SKU: {it.product_sku}</div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          {it.cost_price != null && <div>ทุน {bahtFmt.format(Number(it.cost_price))}</div>}
                        </div>
                        <div className="text-sm text-slate-600">× {it.quantity}</div>
                        <div className="w-28 text-right text-sm font-semibold">{bahtFmt.format(Number(it.subtotal))}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">รวม {meta.label}</span>
                    <span className="text-base font-bold">{bahtFmt.format(subtotal)}</span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg border bg-white p-5">
              <div className="grid gap-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>รวมสินค้า</span><span>{bahtFmt.format(Number(order.subtotal ?? 0))}</span>
                </div>
                {order.cod_fee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ค่า COD</span><span>{bahtFmt.format(order.cod_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-black">
                  <span>ยอดรวม</span><span className="text-[color:var(--brand-orange)]">{bahtFmt.format(Number(order.total ?? 0))}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Timeline</h2>
              {order.history.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่มีประวัติ</div>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-slate-200 pl-4">
                  {order.history.map((h) => {
                    const m = isValidStatus(h.status) ? STATUS_META[h.status] : null;
                    return (
                      <li key={h.id} className="relative">
                        <span className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${m?.dot ?? "bg-slate-400"}`} />
                        <div className="text-xs text-slate-500">
                          {new Date(h.created_at).toLocaleString("th-TH")} · {h.changed_by ?? "system"}
                        </div>
                        <div className="text-sm font-semibold">{m?.label ?? h.status}</div>
                        {h.note && <div className="text-sm text-slate-600">{h.note}</div>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">📋 เอกสารและอีเมล</h2>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  disabled={emailBusy === "send-order-confirmation" || !order.customer_email}
                  onClick={() => invokeFn("send-order-confirmation", "ส่งยืนยัน Order")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {emailBusy === "send-order-confirmation" ? "กำลังส่ง..." : "📧 ส่งยืนยัน Order อีกครั้ง"}
                </Button>
                <Button
                  variant="outline"
                  disabled={emailBusy === "generate-quotation" || !order.customer_email}
                  onClick={() => invokeFn("generate-quotation", "ส่งใบเสนอราคา")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {emailBusy === "generate-quotation" ? "กำลังสร้าง..." : "📄 ส่งใบเสนอราคา (Quotation)"}
                </Button>
                <Button
                  variant="outline"
                  disabled={emailBusy === "generate-tax-invoice" || !order.tax_id || !order.customer_email}
                  onClick={() => invokeFn("generate-tax-invoice", "ออกใบกำกับภาษี")}
                  title={!order.tax_id ? "ต้องระบุเลขผู้เสียภาษีก่อน" : undefined}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {emailBusy === "generate-tax-invoice"
                    ? "กำลังสร้าง..."
                    : `🧾 ออกใบกำกับภาษี${!order.tax_id ? " (ต้องระบุเลขผู้เสียภาษีก่อน)" : ""}`}
                </Button>
                {order.tracking_number && (
                  <Button
                    variant="outline"
                    disabled={emailBusy === "send-shipping-notification"}
                    onClick={() =>
                      invokeFn("send-shipping-notification", "ส่งแจ้งจัดส่ง", {
                        tracking_number: order.tracking_number,
                      })
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {emailBusy === "send-shipping-notification" ? "กำลังส่ง..." : "📦 ส่งแจ้งจัดส่งอีกครั้ง"}
                  </Button>
                )}
              </div>

              {(order.quotation_url || order.tax_invoice_url) && (
                <div className="mt-4 space-y-1 text-xs">
                  {order.quotation_url && (
                    <button
                      onClick={async () => {
                        const { data } = await supabase.storage.from("quotations").createSignedUrl(order.quotation_url!, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}
                      className="text-emerald-700 underline"
                    >
                      📄 ดาวน์โหลดใบเสนอราคาล่าสุด
                    </button>
                  )}
                  {order.tax_invoice_url && (
                    <div>
                      <button
                        onClick={async () => {
                          const { data } = await supabase.storage.from("tax-invoices").createSignedUrl(order.tax_invoice_url!, 3600);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        }}
                        className="text-emerald-700 underline"
                      >
                        🧾 ดาวน์โหลดใบกำกับภาษีล่าสุด
                      </button>
                    </div>
                  )}
                </div>
              )}

              <h3 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">ประวัติการส่งอีเมล</h3>
              {emailLogs.length === 0 ? (
                <div className="text-xs text-slate-400">ยังไม่มีประวัติ</div>
              ) : (
                <ul className="space-y-1 text-xs">
                  {emailLogs.map((log) => (
                    <li key={log.id} className="flex items-start gap-2">
                      <span>{log.status === "sent" ? "✅" : "❌"}</span>
                      <div className="min-w-0 flex-1">
                        <div>
                          <span className="text-slate-500">{new Date(log.created_at).toLocaleString("th-TH")}</span>
                          {" — "}
                          <span className="font-semibold">{log.email_type}</span>
                        </div>
                        <div className="truncate text-slate-500">→ {log.recipient}</div>
                        {log.status !== "sent" && log.error_message && (
                          <div className="truncate text-red-600">{log.error_message}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, multi }: { k: string; v: string | null; multi?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
      <dd className={`mt-0.5 text-slate-800 ${multi ? "whitespace-pre-line" : ""}`}>{v || "-"}</dd>
    </div>
  );
}
