import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "จัดการออเดอร์ — ENT Admin" }] }),
  component: AdminOrdersPage,
});

type OrderItem = { distributor?: string | null };
type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string | null;
  total: number | null;
  status: string | null;
  items: OrderItem[] | null;
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function distributorsOf(items: OrderItem[] | null): string[] {
  if (!Array.isArray(items)) return [];
  const set = new Set<string>();
  for (const it of items) {
    const d = (it?.distributor ?? "").toString().trim().toUpperCase();
    if (d) set.add(d);
  }
  return [...set];
}

function DistBadge({ d }: { d: string }) {
  const isSynnex = d === "SYNNEX";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isSynnex ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isSynnex ? "bg-blue-500" : "bg-orange-500"}`} />
      {d}
    </span>
  );
}

function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,created_at,customer_name,total,status,items")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setRows(data as unknown as OrderRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      shortId(r.id).toLowerCase().includes(s) ||
      (r.customer_name ?? "").toLowerCase().includes(s) ||
      (r.status ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">จัดการออเดอร์</h1>
            <p className="text-sm text-slate-500">รวม {rows.length} ออเดอร์</p>
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: เลขออเดอร์ / ชื่อลูกค้า / สถานะ"
            className="max-w-sm"
          />
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="grid grid-cols-[110px_150px_1fr_120px_120px_180px_90px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Order #</div>
            <div>วันที่</div>
            <div>ชื่อลูกค้า</div>
            <div className="text-right">ยอดรวม</div>
            <div>สถานะ</div>
            <div>Distributor</div>
            <div className="text-right">Action</div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">ไม่พบออเดอร์</div>
          ) : (
            filtered.map((r) => {
              const dists = distributorsOf(r.items);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[110px_150px_1fr_120px_120px_180px_90px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50"
                >
                  <div className="font-mono text-xs font-semibold text-slate-700">{shortId(r.id)}</div>
                  <div className="text-slate-600">{new Date(r.created_at).toLocaleString("th-TH")}</div>
                  <div className="truncate">{r.customer_name ?? "-"}</div>
                  <div className="text-right font-semibold">฿{Number(r.total ?? 0).toLocaleString("th-TH")}</div>
                  <div>
                    <Badge variant="outline" className="capitalize">{r.status ?? "pending"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dists.length === 0 ? <span className="text-xs text-slate-400">—</span> : dists.map((d) => <DistBadge key={d} d={d} />)}
                  </div>
                  <div className="text-right">
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: r.id }}
                      className="text-sm font-semibold text-[color:var(--brand-green,#10B981)] hover:underline"
                    >
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
