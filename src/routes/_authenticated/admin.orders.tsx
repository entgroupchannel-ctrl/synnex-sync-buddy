import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_META, PAYMENT_STATUS_META, ORDER_STATUSES, distMeta, bahtFmt, isValidStatus } from "@/lib/order-helpers";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "จัดการออเดอร์ — ENT Admin" }] }),
  component: AdminOrdersPage,
});

type Row = {
  id: string;
  order_number: string;
  created_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number | null;
  status: string | null;
  payment_status: string;
  payment_method: string | null;
  order_items: { distributor: string | null }[];
};

function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payFilter, setPayFilter] = useState<string>("all");

  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,created_at,customer_name,customer_phone,total,status,payment_status,payment_method,order_items(distributor)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = query.data ?? [];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (payFilter !== "all" && r.payment_status !== payFilter) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !(r.order_number ?? "").toLowerCase().includes(s) &&
          !(r.customer_name ?? "").toLowerCase().includes(s) &&
          !(r.customer_phone ?? "").includes(s)
        ) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter, payFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">จัดการออเดอร์</h1>
            <p className="text-sm text-slate-500">รวม {rows.length} ออเดอร์ · แสดง {filtered.length}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: เลขออเดอร์ / ชื่อ / เบอร์" className="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">การชำระทั้งหมด</SelectItem>
                <SelectItem value="pending">รอชำระ</SelectItem>
                <SelectItem value="paid">ชำระแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="grid grid-cols-[170px_150px_1fr_120px_120px_130px_180px_70px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Order #</div>
            <div>วันที่</div>
            <div>ลูกค้า</div>
            <div className="text-right">ยอดรวม</div>
            <div>ชำระ</div>
            <div>สถานะ</div>
            <div>Distributor</div>
            <div className="text-right">Action</div>
          </div>
          {query.isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">ไม่พบออเดอร์</div>
          ) : (
            filtered.map((r) => {
              const st = isValidStatus(r.status) ? r.status : "pending";
              const stMeta = STATUS_META[st];
              const payKey = r.payment_status === "paid" ? "paid" : "pending";
              const pMeta = PAYMENT_STATUS_META[payKey];
              const dists = [...new Set((r.order_items ?? []).map((i) => (i.distributor ?? "").toUpperCase()).filter(Boolean))];
              return (
                <div key={r.id} className="grid grid-cols-[170px_150px_1fr_120px_120px_130px_180px_70px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50">
                  <div className="font-mono text-xs font-semibold">{r.order_number}</div>
                  <div className="text-slate-600">{r.created_at ? new Date(r.created_at).toLocaleString("th-TH") : "-"}</div>
                  <div className="min-w-0">
                    <div className="truncate">{r.customer_name ?? "-"}</div>
                    <div className="truncate text-xs text-slate-500">{r.customer_phone ?? ""}</div>
                  </div>
                  <div className="text-right font-semibold">{bahtFmt.format(Number(r.total ?? 0))}</div>
                  <div><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${pMeta.badge}`}>{pMeta.label}</span></div>
                  <div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${stMeta.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${stMeta.dot}`} />{stMeta.label}</span></div>
                  <div className="flex flex-wrap gap-1">
                    {dists.length === 0 ? <span className="text-xs text-slate-400">—</span> : dists.map((d) => {
                      const m = distMeta(d);
                      return <span key={d} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.text} ring-1 ${m.ring}`}><span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />{m.label}</span>;
                    })}
                  </div>
                  <div className="text-right">
                    <Link to="/admin/orders/$id" params={{ id: r.id }} className="text-sm font-semibold text-[color:var(--brand-green,#10B981)] hover:underline">
                      ดู →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
