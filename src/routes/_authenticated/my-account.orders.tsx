import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { priceFmt } from "@/lib/cart";
import { Package, FileText, Receipt } from "lucide-react";
import { STATUS_META, PAYMENT_STATUS_META, isValidStatus } from "@/lib/order-helpers";
import { ReorderButton } from "@/components/reorder-dialog";
import { FrequentlyBought } from "@/components/frequently-bought";

export const Route = createFileRoute("/_authenticated/my-account/orders")({
  head: () => ({
    meta: [
      { title: "ประวัติการสั่งซื้อ — ENT Group IT Shop" },
      { name: "description", content: "ประวัติคำสั่งซื้อของคุณ" },
      { property: "og:title", content: "ประวัติการสั่งซื้อ" },
      { property: "og:description", content: "ดูประวัติคำสั่งซื้อทั้งหมด" },
    ],
  }),
  component: MyOrders,
});

type Row = {
  id: string;
  order_number: string;
  created_at: string | null;
  status: string | null;
  payment_status: string;
  payment_method: string | null;
  total: number | null;
  quotation_url: string | null;
  tax_invoice_url: string | null;
  order_items: { product_name: string; quantity: number }[];
};

function MyOrders() {
  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,created_at,status,payment_status,payment_method,total,quotation_url,tax_invoice_url,order_items(product_name,quantity)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Row[];
    },
  });

  if (q.isLoading) return <div className="h-40 animate-pulse rounded-lg bg-slate-200" />;
  if ((q.data?.length ?? 0) === 0) return (
    <div className="rounded-lg border bg-white p-10 text-center text-slate-500">
      <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
      ยังไม่มีคำสั่งซื้อ — <Link to="/" className="text-[color:var(--brand-navy)] underline">เลือกซื้อสินค้า</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <FrequentlyBought />
      <div className="space-y-3">
      {q.data!.map((o) => {
        const stMeta = STATUS_META[isValidStatus(o.status) ? o.status : "pending"];
        const payMeta = PAYMENT_STATUS_META[o.payment_status === "paid" ? "paid" : "pending"];
        const items = o.order_items ?? [];
        const canUploadSlip = o.status === "pending" && o.payment_method === "transfer" && o.payment_status !== "paid";
        return (
          <div key={o.id} className="rounded-lg border bg-white p-4 transition hover:shadow-md">
            <Link to="/order/$orderNumber" params={{ orderNumber: o.order_number }} className="block">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs font-semibold text-slate-800">{o.order_number}</div>
                  <div className="text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleString("th-TH") : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${stMeta.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${stMeta.dot}`} />{stMeta.label}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${payMeta.badge}`}>{payMeta.label}</span>
                  <div className="text-lg font-black text-[color:var(--brand-orange)]">{priceFmt.format(Number(o.total ?? 0))}</div>
                </div>
              </div>
              <div className="mt-3 border-t pt-3 text-sm text-slate-700">
                {items.slice(0, 3).map((i, idx) => (
                  <div key={idx} className="truncate">• {i.product_name} × {i.quantity}</div>
                ))}
                {items.length > 3 && <div className="text-xs text-slate-500">และอีก {items.length - 3} รายการ</div>}
              </div>
            </Link>
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              {canUploadSlip && (
                <Link to="/order/$orderNumber" params={{ orderNumber: o.order_number }} className="rounded-md bg-[color:var(--brand-green)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                  แนบสลิปการโอน
                </Link>
              )}
              {o.quotation_url && (
                <a href={o.quotation_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50">
                  <FileText className="h-3.5 w-3.5" /> ใบเสนอราคา
                </a>
              )}
              {o.tax_invoice_url && (
                <a href={o.tax_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50">
                  <Receipt className="h-3.5 w-3.5" /> ใบกำกับภาษี
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
