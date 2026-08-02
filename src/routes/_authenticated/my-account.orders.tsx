import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { priceFmt } from "@/lib/cart";
import { Package, FileText, Receipt, Truck } from "lucide-react";
import { STATUS_META, PAYMENT_STATUS_META, isValidStatus } from "@/lib/order-helpers";
import { OrderProgressStepper } from "@/components/order-progress-stepper";
import { providerLabel, eventLabel } from "@/lib/shipping";
import { ReorderButton } from "@/components/reorder-dialog";
import { FrequentlyBought } from "@/components/frequently-bought";
import { ProductImage } from "@/components/product-image";

export const Route = createFileRoute("/_authenticated/my-account/orders")({
  head: () => ({
    meta: [
      { title: "ประวัติการสั่งซื้อ — ENT Group IT Retail Shop" },
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
  tracking_number: string | null;
  shipping_provider: string | null;
  order_items: { product_name: string; quantity: number; product_image_url: string | null }[];
  shipping_events: { status: string | null; event_time: string | null }[];
};

function MyOrders() {
  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,created_at,status,payment_status,payment_method,total,quotation_url,tax_invoice_url,tracking_number,shipping_provider,order_items(product_name,quantity,product_image_url),shipping_events(status,event_time)")
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
          <div key={o.id} className="rounded-lg border bg-white p-3 transition hover:shadow-md sm:p-4">
            <Link to="/order/$orderNumber" params={{ orderNumber: o.order_number }} className="block">
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-semibold text-slate-800">{o.order_number}</div>
                  <div className="text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleString("th-TH") : ""}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${stMeta.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${stMeta.dot}`} />{stMeta.label}</span>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${payMeta.badge}`}>{payMeta.label}</span>
                  <div className="text-base font-black text-[color:var(--brand-orange)] sm:text-lg">{priceFmt.format(Number(o.total ?? 0))}</div>
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <OrderProgressStepper status={o.status} compact />
              </div>
              <div className="mt-2 space-y-2 border-t pt-2 text-sm text-slate-700 sm:mt-3 sm:pt-3">
                {items.slice(0, 3).map((i, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-slate-50 p-0.5 sm:h-14 sm:w-14 sm:p-1">
                      <ProductImage
                        src={i.product_image_url}
                        alt={i.product_name}
                        className="h-full w-full object-contain"
                        iconClassName="h-5 w-5 text-slate-300 sm:h-6 sm:w-6"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-xs font-medium text-slate-800">{i.product_name}</div>
                      <div className="text-xs text-slate-500">จำนวน {i.quantity}</div>
                    </div>
                  </div>
                ))}
                {items.length > 3 && <div className="text-xs text-slate-500">และอีก {items.length - 3} รายการ</div>}
              </div>
            </Link>
            {o.tracking_number && (
              <div className="mt-2 grid grid-cols-1 gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs sm:mt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:px-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-emerald-800">
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">{providerLabel(o.shipping_provider)}</span>
                  <span className="truncate font-mono">{o.tracking_number}</span>
                  {(o.shipping_events?.length ?? 0) > 0 && (
                    <span className="text-slate-500">— {eventLabel(o.shipping_events[o.shipping_events.length - 1].status)}</span>
                  )}
                </div>
                <Link to="/track/$orderNumber" params={{ orderNumber: o.order_number }} className="font-semibold text-emerald-700 hover:underline sm:text-right">
                  ติดตามพัสดุ →
                </Link>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 sm:mt-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:pt-3">
              {canUploadSlip && (
                <Link to="/order/$orderNumber" params={{ orderNumber: o.order_number }} className="rounded-md bg-[color:var(--brand-green)] px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:opacity-90 sm:px-3">
                  แนบสลิป
                </Link>
              )}
              {o.quotation_url && (
                <a href={o.quotation_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50 sm:px-3">
                  <FileText className="h-3.5 w-3.5" /> ใบเสนอราคา
                </a>
              )}
              {o.tax_invoice_url && (
                <a href={o.tax_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50 sm:px-3">
                  <Receipt className="h-3.5 w-3.5" /> ใบกำกับภาษี
                </a>
              )}
              <div className="col-span-full flex justify-end sm:col-span-auto sm:ml-auto">
                <ReorderButton orderId={o.id} />
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

