import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrderConfirmation, submitPaymentSlip } from "@/lib/order-confirmation.functions";

import { CheckCircle2, Copy, Package, Upload, FileCheck2, Loader2, Phone, Smartphone, MessageCircle, Mail } from "lucide-react";


import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductImage } from "@/components/product-image";

import { Button } from "@/components/ui/button";
import { BANK_ACCOUNTS, STATUS_META, VAT_NOTES, isValidStatus, bahtFmt } from "@/lib/order-helpers";
import { OrderProgressStepper } from "@/components/order-progress-stepper";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { CustomerSlipStatus } from "@/components/customer-slip-status";
import { GuestSignupPrompt } from "@/components/guest-signup-prompt";
import { PromptPayPaymentModal } from "@/components/promptpay-modal";
import { LineQrDialog } from "@/components/line-qr-dialog";

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
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function OrderConfirm() {
  const { orderNumber } = Route.useParams();

  const fetchOrder = useServerFn(getOrderConfirmation);
  const submitSlip = useServerFn(submitPaymentSlip);

  const q = useQuery({
    queryKey: ["order-by-number", orderNumber],
    queryFn: async () => {
      const data = await fetchOrder({ data: { orderNumber } });
      if (!data) throw notFound();
      return data as unknown as OrderRow;
    },
  });


  const order = q.data;

  const [uploading, setUploading] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [replacingSlip, setReplacingSlip] = useState(false);

  const selectFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) หรือ PDF เท่านั้น กรุณาเลือกไฟล์ใหม่");
      return;
    }
    if (file.size > MAX_SIZE) { toast.error("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่เล็กลง"); return; }
    setPendingFile(file);
    setPendingPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const cancelPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    await uploadSlip(pendingFile);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setReplacingSlip(false);
  };



  useEffect(() => {
    if (!order?.payment_slip_url) { setSlipUrl(null); return; }
    (async () => {
      // payment-slips bucket is private → signed URL
      const path = order.payment_slip_url!;
      const { data } = await supabase.storage.from("payment-slips").createSignedUrl(path, 60 * 60);
      setSlipUrl(data?.signedUrl ?? null);
    })();
  }, [order?.payment_slip_url]);

  const copyAcct = async (account: string) => {
    await navigator.clipboard.writeText(account);
    toast.success("คัดลอกเลขบัญชีแล้ว");
  };

  const uploadSlip = async (file: File) => {
    if (!order) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${order.order_number}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-slips")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      await submitSlip({ data: { orderNumber: order.order_number, path } });

      toast.success("อัปโหลดสำเร็จ ✓ กำลังตรวจสอบสลิปอัตโนมัติ...");

      // แจ้งอีเมลลูกค้าทันที ว่าได้รับสลิปแล้วกำลังตรวจสอบ (fire-and-forget)
      supabase.functions.invoke("send-slip-received-email", { body: { order_id: order.id } })
        .catch((e) => console.warn("[send-slip-received-email]", e));

      // ตรวจสอบสลิปกับธนาคารจริงทันที (fire-and-forget — ไม่บล็อก UI ลูกค้า)
      supabase.functions.invoke("verify-payment-slip", { body: { order_id: order.id } })
        .then(({ data }) => {
          if (data?.auto_approved) toast.success("ยืนยันการชำระเงินอัตโนมัติแล้ว ✓");
        })
        .catch((e) => console.warn("[verify-payment-slip]", e));
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
          <div className="mt-6">
            <OrderProgressStepper status={order.status} />
          </div>
        </div>

        {/* Items */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">รายการสินค้า</h2>
          <div className="space-y-2">
            {order.order_items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded bg-slate-50">
                  <ProductImage src={it.product_image_url} alt={it.product_name} iconClassName="h-6 w-6 text-slate-300" fallbackLabel="" />
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

        {/* Order status timeline */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">ความคืบหน้าออเดอร์</h2>
          <OrderStatusTimeline orderId={order.id} />
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

        {/* PromptPay QR modal (auto-opens on load) */}
        {order.payment_method === "promptpay" && order.payment_status !== "paid" && (
          <PromptPayPaymentModal
            orderId={order.id}
            orderNumber={order.order_number}
            amount={Number(order.total ?? 0)}
            onPaid={() => q.refetch()}
          />
        )}

        {/* Payment */}
        <section className="mt-4 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">
            วิธีชำระเงิน: {order.payment_method === "cod" ? "เก็บเงินปลายทาง (COD)" : order.payment_method === "promptpay" ? "PromptPay QR" : "โอนเงิน"}
          </h2>

          {order.payment_method === "transfer" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {BANK_ACCOUNTS.map((b) => (
                  <div key={b.account} className="rounded-lg border bg-slate-50 p-4 text-sm">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{b.bank}</div>
                    <div className="grid gap-1.5">
                      <div><span className="text-slate-500">สาขา: </span>{b.branch} · {b.type}</div>
                      <div>
                        <span className="text-slate-500">เลขที่บัญชี: </span>
                        <button onClick={() => copyAcct(b.account)} className="inline-flex items-center gap-1.5 font-mono font-bold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-orange)]">
                          {b.account} <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div><span className="text-slate-500">ชื่อบัญชี: </span>{b.name}</div>
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {VAT_NOTES.map((n) => <li key={n}>• {n}</li>)}
              </ul>

              <div className="mt-4">
                {slipUrl && !replacingSlip ? (
                  <div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <div className="flex items-center gap-3">
                        <FileCheck2 className="h-5 w-5" />
                        <span>อัปโหลดสลิปสำเร็จ ✓</span>
                        <div className="ml-auto flex items-center gap-2">
                          <a href={slipUrl} target="_blank" rel="noreferrer" className="underline">ดูสลิป</a>
                          <button
                            type="button"
                            onClick={() => setReplacingSlip(true)}
                            className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            แทนที่สลิป
                          </button>
                        </div>
                      </div>
                      <img
                        src={slipUrl}
                        alt="สลิปที่อัปโหลด"
                        className="mt-3 max-h-64 w-full rounded-md border bg-white object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    {order && <CustomerSlipStatus orderId={order.id} />}
                  </div>
                ) : pendingFile ? (
                  <div className="rounded-lg border-2 border-slate-200 bg-white p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-700">ตรวจสอบไฟล์ก่อนส่ง</div>
                    {pendingPreview ? (
                      <img src={pendingPreview} alt="ตัวอย่างสลิป" className="max-h-64 w-full rounded-md border object-contain bg-slate-50" />
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border bg-slate-50 p-3 text-sm text-slate-600">
                        <FileCheck2 className="h-5 w-5" /> {pendingFile.name}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={cancelPending}
                        disabled={uploading}
                        className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        ยกเลิก / เลือกใหม่
                      </button>
                      <button
                        type="button"
                        onClick={confirmUpload}
                        disabled={uploading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[color:var(--brand-green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "กำลังส่ง..." : "ยืนยันส่งสลิป"}
                      </button>
                    </div>
                    {uploading && (
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full w-1/3 rounded-full bg-[color:var(--brand-green)]" style={{ animation: "slide 1.2s ease-in-out infinite" }} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">กำลังอัปโหลดและส่งข้อมูล กรุณาอย่าปิดหน้านี้...</p>
                        <style>{`@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-sm font-semibold text-[color:var(--brand-navy)] hover:bg-slate-50">
                    <Upload className="h-5 w-5" />
                    แนบสลิปโอนเงิน
                    <input type="file" accept={ACCEPT} className="hidden"
                      onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])} />
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
        <SupportContact />


        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">เลือกซื้อสินค้าเพิ่มเติม</Link>
          </Button>
          <Button asChild>
            <Link to="/my-account/orders">ดูประวัติคำสั่งซื้อ</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function SupportContact() {
  return (
    <div className="mt-6 rounded-2xl bg-green-800 p-6 text-white">
      <div className="text-center text-sm">ทีมงานจะติดต่อกลับภายใน 1 วันทำการ</div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <a href="tel:020456104" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
          <Phone className="h-4 w-4" /> 02-045-6104
        </a>
        <a href="tel:0957391053" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
          <Smartphone className="h-4 w-4" /> 095-739-1053
        </a>
        <a href="mailto:sales@entgroup.co.th" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
          <Mail className="h-4 w-4" /> sales@entgroup.co.th
        </a>
        <LineQrDialog>
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
            <MessageCircle className="h-4 w-4 text-green-300" /> Line: @entgroup
          </button>
        </LineQrDialog>
      </div>
    </div>
  );
}
