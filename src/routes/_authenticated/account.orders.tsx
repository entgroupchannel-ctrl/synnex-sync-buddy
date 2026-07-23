import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { priceFmt } from "@/lib/cart";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({
    meta: [
      { title: "ประวัติการสั่งซื้อ — ENT Group IT Shop" },
      { name: "description", content: "ประวัติคำสั่งซื้อของคุณที่ ENT Group IT Shop" },
      { property: "og:title", content: "ประวัติการสั่งซื้อ" },
      { property: "og:description", content: "ดูประวัติคำสั่งซื้อทั้งหมด" },
    ],
  }),
  component: AccountOrders,
});

function AccountOrders() {
  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-[color:var(--brand-navy)]">ประวัติการสั่งซื้อ</h1>

        {q.isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
        ) : (q.data?.length ?? 0) === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center text-slate-500">
            <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            ยังไม่มีคำสั่งซื้อ — <Link to="/" className="text-[color:var(--brand-navy)] underline">เลือกซื้อสินค้า</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {q.data!.map((o) => {
              const items = Array.isArray(o.items) ? (o.items as Array<{ name: string; qty: number }>) : [];
              return (
                <div key={o.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-slate-500">{new Date(o.created_at ?? Date.now()).toLocaleString("th-TH")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{o.status ?? "pending"}</Badge>
                      <div className="text-lg font-black text-[color:var(--brand-orange)]">{priceFmt.format(Number(o.total ?? 0))}</div>
                    </div>
                  </div>
                  <div className="mt-3 border-t pt-3 text-sm text-slate-700">
                    {items.slice(0, 3).map((i, idx) => (
                      <div key={idx} className="truncate">• {i.name} × {i.qty}</div>
                    ))}
                    {items.length > 3 && <div className="text-xs text-slate-500">และอีก {items.length - 3} รายการ</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
