import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy, Package, Upload, FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { BANK_ACCOUNT, SUPPORT_PHONE, STATUS_META, isValidStatus, bahtFmt } from "@/lib/order-helpers";
import { GuestSignupPrompt } from "@/components/guest-signup-prompt";

export const Route = createFileRoute("/order/$orderNumber")({
  ssr: false,
  component: OrderConfirm,
  head: ({ params }) => ({
    meta: [
      { title: `คำสั่งซื้อ ${params.orderNumber} — ENT Group` },
      { name: "description", content: "รายละเอียดคำสั่งซื้อและการชำระเงิน" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold text-[color:var(--brand-navy)]">ไม่พบคำสั่งซื้อ</h1>
        <p className="mt-2 text-slate-500">ตรวจสอบเลขที่คำสั่งซื้ออีกครั้ง</p>
        <Button asChild className="mt-6"><Link to="/">กลับหน้าหลัก</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">โหลดคำสั่งซื้อไม่สำเร็จ</h1>
        <p className="mt-2 text-slate-500">{error.message}</p>
      </div>
    </div>
  ),
});

type OrderItemRow = {
  id: string;
  product_sku: string;
  product_name: string;
  product_image_url: string | null;
  distributor: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};
type OrderRow = {
  id: string;
  order_number: string;
  created_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_type: string | null;
  user_id: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_district: string | null;
  shipping_province: string | null;
  shipping_postcode: string | null;
  payment_method: string | null;
  payment_status: string;
  payment_slip_url: string | null;
  subtotal: number | null;
  cod_fee: number;
  total: number | null;
  status: string | null;
  need_tax_invoice: boolean;
  company_name: string | null;
  order_items: OrderItemRow[];
};

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function OrderConfirm() {
  const { orderNumber } = Route.useParams();

  const q = useQuery({
    queryKey: ["order-by-number", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as OrderRow;
    },
  });

  const order = q.data;

  const [uploading, setUploading] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!order?.payment_slip_url) { setSlipUrl(null); return; }
    (async () => {
      // payment-slips bucket is private → signed URL
      const path = order.payment_slip_url!;
      const { data } = await supabase.storage.from("payment-slips").createSignedUrl(path, 60 * 60);
      setSlipUrl(data?.signedUrl ?? null);
    })();
  }, [order?.payment_slip_url]);

  const copyAcct = async () => {
    await navigator.clipboard.writeText(BANK_ACCOUNT.account);
    toast.success("คัดลอกเลขบัญชีแล้ว");
  };

  const uploadSlip = async (file: File) => {
    if (!order) return;
    if (file.size > MAX_SIZE) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${order.order_number}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-slips")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: uErr } = await supabase
        .from("orders")
        .update({ payment_slip_url: path })
        .eq("id", order.id);
      if (uErr) throw uErr;
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: order.status ?? "pending",
        note: "ลูกค้าแนบสลิปโอนเงิน",
        changed_by: "customer",
      });
      toast.success("อัปโหลดสำเร็จ ✓");
      q.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }
  if (!order) return null;

  const statusKey = isValidStatus(order.status) ? order.status : "pending";
  const stMeta = STATUS_META[statusKey];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Success card */}
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm md:p-10">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[color:var(--brand-green,#10B981)]" />
          <h1 className="mt-4 text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">สั่งซื้อสำเร็จ!</h1>
          <div className="mt-1 text-sm text-slate-500">
            เลขที่คำสั่งซื้อ · <span className="font-mono font-bold text-slate-800">{order.order_number}</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" >
            <span className={`h-2 w-2 rounded-full ${stMeta.dot}`} />
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stMeta.badge}`}>สถานะ: {stMeta.label}</span>
          </div>
        </div>

        {/* Items */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">รายการสินค้า</h2>
          <div className="space-y-2">
            {order.order_items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded bg-slate-50">
                  {it.product_image_url ? <img src={it.product_image_url} alt="" className="h-full w-full object-contain" /> : <Package className="h-6 w-6 text-slate-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium">{it.product_name}</div>
                  <div className="text-xs text-slate-500">SKU: {it.product_sku} · × {it.quantity}</div>
                </div>
                <div className="text-sm font-semibold">{bahtFmt.format(it.subtotal)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>รวมสินค้า</span><span>{bahtFmt.format(Number(order.subtotal ?? 0))}</span>
            </div>
            {order.cod_fee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่ง COD</span><span>{bahtFmt.format(order.cod_fee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-black">
              <span>ยอดชำระทั้งหมด</span>
              <span className="text-[color:var(--brand-orange)]">{bahtFmt.format(Number(order.total ?? 0))}</span>
            </div>
          </div>
        </section>

        {/* Guest signup prompt */}
        {order.customer_type === "guest" && !order.user_id && order.customer_email && (
          <GuestSignupPrompt
            orderId={order.id}
            orderNumber={order.order_number}
            email={order.customer_email}
            fullName={order.customer_name}
            phone={order.customer_phone}
            onLinked={() => q.refetch()}
          />
        )}

        {/* Payment */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">
            วิธีชำระเงิน: {order.payment_method === "cod" ? "เก็บเงินปลายทาง (COD)" : "โอนเงิน"}
          </h2>

          {order.payment_method === "transfer" && (
            <>
              <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">ข้อมูลบัญชีธนาคาร</div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  <div><span className="text-slate-500">ธนาคาร: </span>{BANK_ACCOUNT.bank}</div>
                  <div><span className="text-slate-500">สาขา: </span>{BANK_ACCOUNT.branch}</div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">เลขที่บัญชี: </span>
                    <button onClick={copyAcct} className="inline-flex items-center gap-1.5 font-mono font-bold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-orange)]">
                      {BANK_ACCOUNT.account} <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="sm:col-span-2"><span className="text-slate-500">ชื่อบัญชี: </span>{BANK_ACCOUNT.name}</div>
                </div>
              </div>

              <div className="mt-4">
                {slipUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <FileCheck2 className="h-5 w-5" />
                    <span>อัปโหลดสลิปสำเร็จ ✓</span>
                    <a href={slipUrl} target="_blank" rel="noreferrer" className="ml-auto underline">ดูสลิป</a>
                  </div>
                ) : (
                  <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-sm font-semibold text-[color:var(--brand-navy)] hover:bg-slate-50 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    {uploading ? "กำลังอัปโหลด..." : "แนบสลิปโอนเงิน"}
                    <input type="file" accept={ACCEPT} className="hidden" disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && uploadSlip(e.target.files[0])} />
                  </label>
                )}
                <p className="mt-2 text-xs text-slate-500">รองรับ JPG, PNG, WebP, PDF ไม่เกิน 5MB</p>
              </div>
            </>
          )}
        </section>

        {/* Shipping info */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">ที่อยู่จัดส่ง</h2>
          <div className="text-sm text-slate-700">
            <div className="font-semibold">{order.shipping_name} · {order.shipping_phone}</div>
            <div className="mt-1 whitespace-pre-line">
              {[order.shipping_address, order.shipping_district, order.shipping_province, order.shipping_postcode].filter(Boolean).join(" ")}
            </div>
          </div>
          {order.need_tax_invoice && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              ต้องการใบกำกับภาษี · <b>{order.company_name}</b>
            </div>
          )}
        </section>

        {/* Support */}
        <div className="mt-6 rounded-2xl bg-[color:var(--brand-navy)] p-6 text-center text-white">
          <div className="text-sm">ทีมงานจะติดต่อกลับภายใน 1 วันทำการ</div>
          <div className="mt-1 text-xl font-black">โทร {SUPPORT_PHONE}</div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">เลือกซื้อสินค้าเพิ่มเติม</Link>
          </Button>
          <Button asChild>
            <Link to="/account/orders">ดูประวัติคำสั่งซื้อ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
