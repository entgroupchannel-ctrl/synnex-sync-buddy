import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Truck, Building2, User, Loader2, Tag, X, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { priceFmt, useCart } from "@/lib/cart";
import { useSupabaseUser } from "@/lib/auth-sheet";
import {
  getShippingOptions,
  applyDiscountCode,
  recordDiscountUsage,
  type ShippingOption,
  type DiscountApplied,
  type UserType,
} from "@/lib/shipping";


export const Route = createFileRoute("/checkout")({
  ssr: false,
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "ชำระเงิน — ENT Group IT Shop" },
      { name: "description", content: "หน้ายืนยันคำสั่งซื้อ — รองรับใบกำกับภาษี, โอนเงิน และเก็บเงินปลายทาง" },
      { property: "og:title", content: "ชำระเงิน — ENT Group IT Shop" },
      { property: "og:description", content: "หน้ายืนยันคำสั่งซื้อ ENT Group" },
    ],
  }),
});

const COD_FEE = 50;
const phoneRe = /^0\d{8,9}$/;

const shippingSchema = z.object({
  customer_name: z.string().trim().min(1, "กรอกชื่อ").max(100),
  customer_phone: z.string().trim().regex(phoneRe, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"),
  customer_email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255),
  shipping_name: z.string().trim().min(1, "กรอกชื่อผู้รับ").max(100),
  shipping_phone: z.string().trim().regex(phoneRe, "เบอร์ผู้รับไม่ถูกต้อง"),
  shipping_address: z.string().trim().min(5, "กรอกที่อยู่").max(500),
  shipping_district: z.string().trim().min(1, "กรอกเขต/อำเภอ").max(100),
  shipping_province: z.string().trim().min(1, "กรอกจังหวัด").max(100),
  shipping_postcode: z.string().trim().regex(/^\d{5}$/, "รหัสไปรษณีย์ 5 หลัก"),
});
const taxSchema = z.object({
  company_name: z.string().trim().min(2, "กรอกชื่อบริษัท/ผู้เสียภาษี").max(200),
  tax_id: z.string().trim().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้อง 13 หลัก"),
  company_address: z.string().trim().min(5, "กรอกที่อยู่ออกใบกำกับ").max(500),
});
type Fields = z.infer<typeof shippingSchema>;

function CheckoutPage() {

  const { items, total: subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useSupabaseUser();

  const [f, setF] = useState<Fields>({
    customer_name: "", customer_phone: "", customer_email: "",
    shipping_name: "", shipping_phone: "",
    shipping_address: "", shipping_district: "", shipping_province: "", shipping_postcode: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | keyof z.infer<typeof taxSchema>, string>>>({});
  const [wantsTaxInvoice, setWantsTaxInvoice] = useState(false);
  const [tax, setTax] = useState({ company_name: "", tax_id: "", company_address: "" });
  const [payment, setPayment] = useState<"transfer" | "cod">("transfer");
  const [submitting, setSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  // Shipping
  const totalWeight = useMemo(() => items.reduce((s, i) => s + i.qty, 0) || 1, [items]);
  const [shipOptions, setShipOptions] = useState<ShippingOption[]>([]);
  const [shipId, setShipId] = useState<string>("");

  // Discount
  const [codeInput, setCodeInput] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  const [discount, setDiscount] = useState<DiscountApplied | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Guard: cart must be non-empty
  useEffect(() => {
    if (items.length === 0 && !orderCreated) {
      const t = setTimeout(() => {
        if (items.length === 0 && !orderCreated) navigate({ to: "/cart" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [items.length, navigate, orderCreated]);

  // Load shipping options (recompute when subtotal or weight changes)
  useEffect(() => {
    let cancelled = false;
    getShippingOptions(subtotal, totalWeight).then((opts) => {
      if (cancelled) return;
      setShipOptions(opts);
      setShipId((prev) => prev && opts.find((o) => o.id === prev) ? prev : (opts[0]?.id ?? ""));
    });
    return () => { cancelled = true; };
  }, [subtotal, totalWeight]);

  // Prefill from user profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
      const { data: addr } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      setF((prev) => ({
        ...prev,
        customer_name: profile?.full_name ?? prev.customer_name,
        customer_phone: profile?.phone ?? prev.customer_phone,
        customer_email: user.email ?? prev.customer_email,
        shipping_name: addr?.recipient ?? profile?.full_name ?? prev.shipping_name,
        shipping_phone: addr?.phone ?? profile?.phone ?? prev.shipping_phone,
        shipping_address: addr?.address_line ?? prev.shipping_address,
        shipping_district: addr?.district ?? prev.shipping_district,
        shipping_province: addr?.province ?? prev.shipping_province,
        shipping_postcode: addr?.postcode ?? prev.shipping_postcode,
      }));
      if (profile?.user_type === "b2b" && profile?.wants_tax_invoice) {
        setWantsTaxInvoice(true);
        setTax({
          company_name: profile.company_name ?? "",
          tax_id: profile.tax_id ?? "",
          company_address: profile.company_address ?? "",
        });
      }
    })();
  }, [user]);

  const selectedShip = shipOptions.find((o) => o.id === shipId) ?? null;
  const codFee = payment === "cod" ? COD_FEE : 0;
  const shippingFee = selectedShip
    ? (discount?.isFreeShipping ? 0 : selectedShip.fee)
    : 0;
  const discountAmount = discount?.discountAmount ?? 0;
  const grandTotal = Math.max(0, subtotal + shippingFee + codFee - discountAmount);

  const userType: UserType = user
    ? (wantsTaxInvoice ? "b2b" : "b2c")
    : "guest";

  async function onApplyCode() {
    if (!codeInput.trim()) return;
    setApplyingCode(true);
    setCodeError(null);
    try {
      const res = await applyDiscountCode({
        code: codeInput,
        subtotal,
        shippingFee: selectedShip?.fee ?? 0,
        userType,
        userId: user?.id ?? null,
      });
      if (res.ok) {
        setDiscount(res.applied);
        toast.success(`ใช้โค้ด ${res.applied.code} แล้ว`);
      } else {
        setDiscount(null);
        setCodeError(res.error);
      }
    } finally {
      setApplyingCode(false);
    }
  }

  function clearDiscount() {
    setDiscount(null);
    setCodeInput("");
    setCodeError(null);
  }


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("ตะกร้าว่างเปล่า"); return; }
    setErrors({});
    const base = shippingSchema.safeParse(f);
    if (!base.success) {
      const errs: Record<string, string> = {};
      for (const iss of base.error.issues) errs[iss.path.join(".")] = iss.message;
      setErrors(errs);
      toast.error(base.error.issues[0].message);
      return;
    }
    let taxInvoice: z.infer<typeof taxSchema> | null = null;
    if (wantsTaxInvoice) {
      const t = taxSchema.safeParse(tax);
      if (!t.success) {
        const errs: Record<string, string> = {};
        for (const iss of t.error.issues) errs[iss.path.join(".")] = iss.message;
        setErrors(errs);
        toast.error(t.error.issues[0].message);
        return;
      }
      taxInvoice = t.data;
    }

    setSubmitting(true);
    try {
      const customerType = user ? (taxInvoice ? "b2b" : "b2c") : "guest";
      const fullAddr = [f.shipping_address, f.shipping_district, f.shipping_province, f.shipping_postcode].filter(Boolean).join(" ");

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          order_number: "", // trigger will fill
          user_id: user?.id ?? null,
          is_guest: !user,
          customer_type: customerType,
          customer_name: base.data.customer_name,
          customer_phone: base.data.customer_phone,
          customer_email: base.data.customer_email,
          customer_address: fullAddr,
          shipping_name: base.data.shipping_name,
          shipping_phone: base.data.shipping_phone,
          shipping_address: base.data.shipping_address,
          shipping_district: base.data.shipping_district,
          shipping_province: base.data.shipping_province,
          shipping_postcode: base.data.shipping_postcode,
          shipping_method_id: selectedShip?.id ?? null,
          shipping_method_name: selectedShip?.name ?? null,
          shipping_provider: selectedShip?.provider ?? null,
          shipping_weight_kg: totalWeight,
          shipping_fee: shippingFee,
          discount_code: discount?.code ?? null,
          discount_code_id: discount?.codeId ?? null,
          discount_amount: discountAmount,
          discount: discountAmount,
          need_tax_invoice: !!taxInvoice,
          company_name: taxInvoice?.company_name ?? null,
          tax_id: taxInvoice?.tax_id ?? null,
          company_address: taxInvoice?.company_address ?? null,
          payment_method: payment,
          payment_status: "pending",
          subtotal,
          cod_fee: codFee,
          total: grandTotal,
          status: "pending",
        })
        .select("id, order_number")
        .single();


      if (oErr || !order) throw oErr ?? new Error("ไม่สามารถบันทึกออเดอร์ได้");

      const itemRows = items.map((it) => ({
        order_id: order.id,
        product_sku: it.sku,
        product_name: it.name,
        product_image_url: it.image_url,
        brand: null,
        category: null,
        distributor: (it.distributor ?? "OTHER"),
        cost_price: null,
        unit_price: it.price,
        quantity: it.qty,
        subtotal: it.price * it.qty,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemRows);
      if (iErr) throw iErr;

      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "pending",
        note: "ลูกค้าสร้าง order",
        changed_by: user?.email ?? "customer",
      });

      // Fire-and-forget: send order confirmation email
      supabase.functions.invoke("send-order-confirmation", { body: { order_id: order.id } })
        .catch((e) => console.warn("[send-order-confirmation]", e));

      if (order?.order_number) {
        setOrderCreated(true);
        if (user?.id) {
          const { markCartRecovered } = await import("@/lib/cart-reminder");
          markCartRecovered(user.id).catch(() => {});
        }
        await navigate({ to: "/order/$orderNumber", params: { orderNumber: order.order_number } });
        clear();
        localStorage.removeItem("ent_cart");
      } else {
        throw new Error("ไม่พบเลขที่คำสั่งซื้อ");
      }
    } catch (err) {
      console.error("[checkout] submit failed:", err);
      const anyErr = err as { message?: string; details?: string; hint?: string; code?: string } | Error;
      const msg =
        (anyErr as { message?: string })?.message ||
        (anyErr as { details?: string })?.details ||
        (anyErr as { hint?: string })?.hint ||
        "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ";
      const code = (anyErr as { code?: string })?.code;
      toast.error(msg, {
        description: code ? `รหัสข้อผิดพลาด: ${code} — ตะกร้ายังอยู่ ลองอีกครั้ง` : "ตะกร้ายังอยู่ — ลองอีกครั้ง",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (k: string) => errors[k as keyof typeof errors];
  const setField = (k: keyof Fields, v: string) => {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/cart" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> กลับไปตะกร้า
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-[color:var(--brand-navy)]">ชำระเงิน</h1>

        {!user && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <div className="text-slate-700">
              <b>สั่งซื้อในฐานะ Guest</b> — สมัครสมาชิกเพื่อติดตามคำสั่งซื้อได้ง่ายขึ้น
            </div>
            <Link to="/auth" search={{ tab: "b2c", redirect: "/checkout" } as never} className="rounded-md bg-[color:var(--brand-navy)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-navy-2)]">
              สมัครสมาชิก
            </Link>
          </div>
        )}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Contact */}
            <section className="space-y-4 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">ข้อมูลผู้ติดต่อ</h2>
              <div>
                <Label htmlFor="cname">ชื่อ-นามสกุล *</Label>
                <Input id="cname" value={f.customer_name} onChange={(e) => setField("customer_name", e.target.value)} maxLength={100} aria-invalid={!!fieldError("customer_name")} />
                {fieldError("customer_name") && <p className="mt-1 text-xs text-red-600">{fieldError("customer_name")}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cphone">เบอร์โทรศัพท์ *</Label>
                  <Input id="cphone" value={f.customer_phone} onChange={(e) => setField("customer_phone", e.target.value)} placeholder="0812345678" maxLength={10} aria-invalid={!!fieldError("customer_phone")} />
                  {fieldError("customer_phone") && <p className="mt-1 text-xs text-red-600">{fieldError("customer_phone")}</p>}
                </div>
                <div>
                  <Label htmlFor="cemail">อีเมล *</Label>
                  <Input id="cemail" type="email" value={f.customer_email} onChange={(e) => setField("customer_email", e.target.value)} maxLength={255} aria-invalid={!!fieldError("customer_email")} />
                  {fieldError("customer_email") && <p className="mt-1 text-xs text-red-600">{fieldError("customer_email")}</p>}
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section className="space-y-4 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">ที่อยู่จัดส่ง</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sname">ชื่อผู้รับ *</Label>
                  <Input id="sname" value={f.shipping_name} onChange={(e) => setField("shipping_name", e.target.value)} maxLength={100} aria-invalid={!!fieldError("shipping_name")} />
                  {fieldError("shipping_name") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_name")}</p>}
                </div>
                <div>
                  <Label htmlFor="sphone">เบอร์ผู้รับ *</Label>
                  <Input id="sphone" value={f.shipping_phone} onChange={(e) => setField("shipping_phone", e.target.value)} placeholder="0812345678" maxLength={10} aria-invalid={!!fieldError("shipping_phone")} />
                  {fieldError("shipping_phone") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_phone")}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="saddr">ที่อยู่ *</Label>
                <Textarea id="saddr" rows={3} value={f.shipping_address} onChange={(e) => setField("shipping_address", e.target.value)} maxLength={500} placeholder="เลขที่ / ซอย / ถนน / แขวง" aria-invalid={!!fieldError("shipping_address")} />
                {fieldError("shipping_address") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_address")}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="sdistrict">เขต/อำเภอ *</Label>
                  <Input id="sdistrict" value={f.shipping_district} onChange={(e) => setField("shipping_district", e.target.value)} maxLength={100} aria-invalid={!!fieldError("shipping_district")} />
                  {fieldError("shipping_district") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_district")}</p>}
                </div>
                <div>
                  <Label htmlFor="sprov">จังหวัด *</Label>
                  <Input id="sprov" value={f.shipping_province} onChange={(e) => setField("shipping_province", e.target.value)} maxLength={100} aria-invalid={!!fieldError("shipping_province")} />
                  {fieldError("shipping_province") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_province")}</p>}
                </div>
                <div>
                  <Label htmlFor="szip">รหัสไปรษณีย์ *</Label>
                  <Input id="szip" value={f.shipping_postcode} onChange={(e) => setField("shipping_postcode", e.target.value)} maxLength={5} inputMode="numeric" aria-invalid={!!fieldError("shipping_postcode")} />
                  {fieldError("shipping_postcode") && <p className="mt-1 text-xs text-red-600">{fieldError("shipping_postcode")}</p>}
                </div>
              </div>
            </section>

            {/* Tax invoice */}
            <section className="space-y-4 rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
                    {wantsTaxInvoice ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    ประเภทลูกค้า
                  </h2>
                  <p className="text-xs text-slate-500">{wantsTaxInvoice ? "ต้องการใบกำกับภาษี (B2B)" : "บุคคลทั่วไป"}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={wantsTaxInvoice} onCheckedChange={setWantsTaxInvoice} />
                  <span>ต้องการใบกำกับภาษี</span>
                </label>
              </div>

              {wantsTaxInvoice && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <Label>ชื่อบริษัท / ชื่อ-นามสกุล (สำหรับใบกำกับ) *</Label>
                    <Input value={tax.company_name} onChange={(e) => setTax({ ...tax, company_name: e.target.value })} maxLength={200} aria-invalid={!!fieldError("company_name")} />
                    {fieldError("company_name") && <p className="mt-1 text-xs text-red-600">{fieldError("company_name")}</p>}
                  </div>
                  <div>
                    <Label>เลขประจำตัวผู้เสียภาษี (13 หลัก) *</Label>
                    <Input value={tax.tax_id} onChange={(e) => setTax({ ...tax, tax_id: e.target.value.replace(/\D/g, "").slice(0, 13) })} maxLength={13} inputMode="numeric" aria-invalid={!!fieldError("tax_id")} />
                    {(fieldError("tax_id") || (tax.tax_id.length > 0 && tax.tax_id.length !== 13)) && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldError("tax_id") ?? `ต้องเป็นตัวเลข 13 หลัก (${tax.tax_id.length}/13)`}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>ที่อยู่ออกใบกำกับ *</Label>
                    <Textarea rows={3} value={tax.company_address} onChange={(e) => setTax({ ...tax, company_address: e.target.value })} maxLength={500} aria-invalid={!!fieldError("company_address")} />
                    {fieldError("company_address") && <p className="mt-1 text-xs text-red-600">{fieldError("company_address")}</p>}
                  </div>
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="space-y-3 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">วิธีการชำระเงิน</h2>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "transfer" | "cod")} className="grid gap-2 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${payment === "transfer" ? "border-[color:var(--brand-orange)] bg-orange-50" : "hover:bg-slate-50"}`}>
                  <RadioGroupItem value="transfer" />
                  <Banknote className="h-5 w-5 text-[color:var(--brand-navy)]" />
                  <div>
                    <div className="font-semibold">โอนเงิน</div>
                    <div className="text-xs text-slate-500">แนบสลิปหลังชำระ</div>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${payment === "cod" ? "border-[color:var(--brand-orange)] bg-orange-50" : "hover:bg-slate-50"}`}>
                  <RadioGroupItem value="cod" />
                  <Truck className="h-5 w-5 text-[color:var(--brand-navy)]" />
                  <div>
                    <div className="font-semibold">เก็บเงินปลายทาง</div>
                    <div className="text-xs text-slate-500">+฿{COD_FEE} ค่าธรรมเนียม</div>
                  </div>
                </label>
              </RadioGroup>
            </section>
          </div>

          <aside className="h-fit space-y-3 rounded-lg border bg-white p-5 lg:sticky lg:top-32">
            <h2 className="font-bold text-[color:var(--brand-navy)]">รายการสั่งซื้อ</h2>
            <div className="max-h-56 space-y-2 overflow-y-auto text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-2">
                  <div className="min-w-0 flex-1 truncate">{i.name} × {i.qty}</div>
                  <div className="shrink-0">{priceFmt.format(i.price * i.qty)}</div>
                </div>
              ))}
              {items.length === 0 && <div className="text-slate-500">ตะกร้าว่างเปล่า</div>}
            </div>
            <div className="my-2 h-px bg-slate-200" />
            <div className="flex justify-between text-sm">
              <span>ยอดสินค้า</span><span>{priceFmt.format(subtotal)}</span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between text-sm text-slate-700">
                <span>ค่าเก็บปลายทาง (COD)</span><span>{priceFmt.format(codFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-500">
              <span>ค่าจัดส่ง</span><span>ทีมงานแจ้ง</span>
            </div>
            <div className="my-2 h-px bg-slate-200" />
            <div className="flex justify-between text-xl font-black text-[color:var(--brand-orange)]">
              <span>รวม</span><span>{priceFmt.format(grandTotal)}</span>
            </div>
            <Button type="submit" disabled={submitting || items.length === 0} className="w-full bg-[color:var(--brand-orange)] font-bold hover:bg-[color:var(--brand-orange-dark)]" size="lg">
              {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังส่ง...</>) : "ยืนยันคำสั่งซื้อ"}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}
