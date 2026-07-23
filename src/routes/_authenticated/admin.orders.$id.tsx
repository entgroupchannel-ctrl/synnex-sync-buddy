import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Save, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, STATUS_META, PAYMENT_STATUS_META, distMeta, bahtFmt, isValidStatus } from "@/lib/order-helpers";

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
  quotation_url: string | null;
  tax_invoice_url: string | null;
  order_items: OrderItem[];
  history: HistoryRow[];
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
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailBusy, setEmailBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: o }, { data: h }, { data: logs }] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle(),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      supabase.from("email_logs").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (o) {
      const merged = { ...(o as Record<string, unknown>), history: (h ?? []) as HistoryRow[] } as unknown as Order;
      setOrder(merged);
      setStatus(merged.status ?? "pending");
      setPaymentStatus(merged.payment_status ?? "pending");
      setNotes(merged.notes ?? "");
      setTracking(merged.tracking_number ?? "");
      if (merged.payment_slip_url) {
        const { data } = await supabase.storage.from("payment-slips").createSignedUrl(merged.payment_slip_url, 60 * 60);
        setSlipUrl(data?.signedUrl ?? null);
      } else {
        setSlipUrl(null);
      }
    }
    setEmailLogs((logs ?? []) as EmailLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500">ยอดรวม</div>
            <div className="text-2xl font-bold text-[color:var(--brand-orange)]">{bahtFmt.format(Number(order.total ?? 0))}</div>
          </div>
        </div>

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
                        {it.product_image_url ? <img src={it.product_image_url} alt="" className="h-12 w-12 rounded border object-contain" /> : <div className="h-12 w-12 rounded border bg-slate-50" />}
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
