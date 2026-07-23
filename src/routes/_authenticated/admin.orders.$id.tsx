import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "รายละเอียดออเดอร์ — ENT Admin" }] }),
  component: AdminOrderDetail,
});

type OrderItem = {
  id?: string;
  sku?: string;
  name?: string;
  price?: number;
  qty?: number;
  image_url?: string | null;
  distributor?: string | null;
};

type Order = {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  items: OrderItem[] | null;
  total: number | null;
  status: string | null;
  notes: string | null;
};

const STATUSES = ["pending", "confirmed", "ordered", "shipped", "done"] as const;

const DISTRIBUTOR_META: Record<string, { label: string; url: string; color: string; dot: string; ring: string; text: string; bg: string }> = {
  SYNNEX: {
    label: "SYNNEX", url: "https://www.synnex.co.th/Dealer", color: "blue",
    dot: "bg-blue-500", ring: "ring-blue-200", text: "text-blue-700", bg: "bg-blue-50",
  },
  VSTECS: {
    label: "VSTECS", url: "https://online.vstecs.co.th", color: "orange",
    dot: "bg-orange-500", ring: "ring-orange-200", text: "text-orange-700", bg: "bg-orange-50",
  },
};

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        const o = data as unknown as Order;
        setOrder(o);
        setStatus(o.status ?? "pending");
        setNotes(o.notes ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  const grouped = useMemo(() => {
    const groups = new Map<string, OrderItem[]>();
    for (const it of order?.items ?? []) {
      const key = (it.distributor ?? "").toString().trim().toUpperCase() || "OTHER";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    return [...groups.entries()];
  }, [order]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status, notes }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("บันทึกแล้ว");
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

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> กลับไปรายการออเดอร์
        </Link>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">
              ออเดอร์ #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString("th-TH")}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500">ยอดรวม</div>
            <div className="text-2xl font-bold text-[color:var(--brand-accent,#f97316)]">
              ฿{Number(order.total ?? 0).toLocaleString("th-TH")}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* LEFT: customer */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">ข้อมูลลูกค้า</h2>
              <dl className="space-y-3 text-sm">
                <Row k="ชื่อ" v={order.customer_name} />
                <Row k="เบอร์โทร" v={order.customer_phone} />
                <Row k="อีเมล" v={order.customer_email} />
                <Row k="ที่อยู่" v={order.customer_address} multi />
              </dl>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">สถานะ</h2>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Admin Notes</h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="เช่น สั่ง Synnex แล้ว PO#12345 วันที่ 23/7/69"
              />
              <Button onClick={save} disabled={saving} className="mt-3 w-full bg-[color:var(--brand-green,#10B981)] hover:bg-emerald-600">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>

          {/* RIGHT: items grouped */}
          <div className="space-y-4">
            {grouped.length === 0 && (
              <div className="rounded-lg border bg-white p-6 text-center text-sm text-slate-500">ไม่มีรายการสินค้า</div>
            )}
            {grouped.map(([dist, items]) => {
              const meta = DISTRIBUTOR_META[dist] ?? {
                label: dist, url: "", color: "slate",
                dot: "bg-slate-400", ring: "ring-slate-200", text: "text-slate-700", bg: "bg-slate-100",
              };
              const subtotal = items.reduce((s, it) => s + Number(it.price ?? 0) * Number(it.qty ?? 0), 0);
              return (
                <div key={dist} className="overflow-hidden rounded-lg border bg-white">
                  <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${meta.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <span className={`font-bold ${meta.text}`}>{meta.label}</span>
                      {meta.url && (
                        <span className="text-xs text-slate-500">
                          สั่งซื้อที่: {meta.url.replace(/^https?:\/\//, "")}
                        </span>
                      )}
                    </div>
                    {meta.url && (
                      <a href={meta.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className={`${meta.text} border-current`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          เปิด {meta.label}
                        </Button>
                      </a>
                    )}
                  </div>
                  <div>
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                        {it.image_url ? (
                          <img src={it.image_url} alt="" className="h-12 w-12 rounded border object-contain" />
                        ) : (
                          <div className="h-12 w-12 rounded border bg-slate-50" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{it.name ?? it.sku}</div>
                          <div className="text-xs text-slate-500">{it.sku}</div>
                        </div>
                        <div className="text-sm text-slate-600">× {it.qty ?? 0}</div>
                        <div className="w-28 text-right text-sm font-semibold">
                          ฿{(Number(it.price ?? 0) * Number(it.qty ?? 0)).toLocaleString("th-TH")}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">รวม {meta.label}</span>
                    <span className="text-base font-bold">฿{subtotal.toLocaleString("th-TH")}</span>
                  </div>
                </div>
              );
            })}
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
