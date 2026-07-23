import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Truck, Building2, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { priceFmt, useCart } from "@/lib/cart";
import { useSupabaseUser } from "@/lib/auth-sheet";

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

const baseSchema = z.object({
  customer_name: z.string().trim().min(1, "กรอกชื่อ").max(100),
  customer_phone: z.string().trim().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"),
  customer_email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255),
  customer_address: z.string().trim().min(5, "กรอกที่อยู่").max(500),
});
const taxSchema = z.object({
  company_name: z.string().trim().min(2, "กรอกชื่อบริษัท/ผู้เสียภาษี").max(200),
  tax_id: z.string().trim().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้อง 13 หลัก"),
  company_address: z.string().trim().min(5, "กรอกที่อยู่ออกใบกำกับ").max(500),
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useSupabaseUser();

  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", customer_address: "" });
  const [wantsTaxInvoice, setWantsTaxInvoice] = useState(false);
  const [tax, setTax] = useState({ company_name: "", tax_id: "", company_address: "" });
  const [payment, setPayment] = useState<"transfer" | "cod">("transfer");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from user profile if logged in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
      const { data: addr } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      setForm((f) => ({
        customer_name: profile?.full_name ?? addr?.recipient ?? f.customer_name,
        customer_phone: profile?.phone ?? addr?.phone ?? f.customer_phone,
        customer_email: user.email ?? f.customer_email,
        customer_address: addr ? [addr.address_line, addr.district, addr.province, addr.postcode].filter(Boolean).join(" ") : f.customer_address,
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

  const shipping = 0;
  const codFee = payment === "cod" ? COD_FEE : 0;
  const grandTotal = total + shipping + codFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("ตะกร้าว่างเปล่า"); return; }
    const base = baseSchema.safeParse(form);
    if (!base.success) { toast.error(base.error.issues[0].message); return; }
    let taxInvoice: z.infer<typeof taxSchema> | null = null;
    if (wantsTaxInvoice) {
      const t = taxSchema.safeParse(tax);
      if (!t.success) { toast.error(t.error.issues[0].message); return; }
      taxInvoice = t.data;
    }
    setSubmitting(true);
    const customerType = user ? (taxInvoice ? "b2b" : "b2c") : "guest";
    const { data, error } = await supabase.from("orders").insert({
      ...base.data,
      items: items.map((i) => ({ id: i.id, sku: i.sku, name: i.name, price: i.price, qty: i.qty, image_url: i.image_url, distributor: i.distributor ?? null })),
      total: grandTotal,
      status: "pending",
      user_id: user?.id ?? null,
      is_guest: !user,
      customer_type: customerType,
      tax_invoice: taxInvoice,
      payment_method: payment,
    }).select("id").single();
    setSubmitting(false);
    if (error || !data) { toast.error(error?.message ?? "ผิดพลาด"); return; }
    const orderId = data.id;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`order-${orderId}`, JSON.stringify({
        id: orderId,
        payment,
        total: grandTotal,
        items,
        customer: base.data,
        tax_invoice: taxInvoice,
        is_guest: !user,
        created_at: new Date().toISOString(),
      }));
    }
    clear();
    navigate({ to: "/order/$id", params: { id: orderId } });
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
              <b>สั่งซื้อในฐานะ Guest</b> — สมัครสมาชิกเพื่อติดตามคำสั่งซื้อและใช้ส่วนลดสมาชิก
            </div>
            <Link to="/auth" search={{ tab: "b2c", redirect: "/checkout" } as never} className="rounded-md bg-[color:var(--brand-navy)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-navy-2)]">
              สมัครสมาชิก
            </Link>
          </div>
        )}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">ข้อมูลผู้รับ</h2>
              <div>
                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                <Input id="name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required maxLength={100} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                  <Input id="phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} required placeholder="0812345678" maxLength={10} />
                </div>
                <div>
                  <Label htmlFor="email">อีเมล *</Label>
                  <Input id="email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} required maxLength={255} />
                </div>
              </div>
              <div>
                <Label htmlFor="addr">ที่อยู่จัดส่ง *</Label>
                <Textarea id="addr" rows={4} value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} required maxLength={500} />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-white p-6">
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
                    <Input value={tax.company_name} onChange={(e) => setTax({ ...tax, company_name: e.target.value })} maxLength={200} />
                  </div>
                  <div>
                    <Label>เลขประจำตัวผู้เสียภาษี (13 หลัก) *</Label>
                    <Input
                      value={tax.tax_id}
                      onChange={(e) => setTax({ ...tax, tax_id: e.target.value.replace(/\D/g, "") })}
                      inputMode="numeric"
                      maxLength={13}
                      placeholder="0105558XXXXXX"
                    />
                    {tax.tax_id.length > 0 && tax.tax_id.length !== 13 && (
                      <p className="mt-1 text-xs text-red-600">ต้องเป็นตัวเลข 13 หลัก ({tax.tax_id.length}/13)</p>
                    )}
                  </div>
                  <div>
                    <Label>ที่อยู่ออกใบกำกับ *</Label>
                    <Textarea rows={3} value={tax.company_address} onChange={(e) => setTax({ ...tax, company_address: e.target.value })} maxLength={500} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">วิธีการชำระเงิน</h2>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "transfer" | "cod")} className="grid gap-2 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${payment === "transfer" ? "border-[color:var(--brand-orange)] bg-orange-50" : "hover:bg-slate-50"}`}>
                  <RadioGroupItem value="transfer" />
                  <Banknote className="h-5 w-5 text-[color:var(--brand-navy)]" />
                  <div>
                    <div className="font-semibold">โอนเงิน</div>
                    <div className="text-xs text-slate-500">รับรายละเอียดบัญชีหลังยืนยัน</div>
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
            </div>
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
              <span>ยอดสินค้า</span><span>{priceFmt.format(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>ค่าจัดส่ง</span><span>ทีมงานแจ้ง</span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between text-sm text-slate-700">
                <span>ค่าเก็บปลายทาง</span><span>{priceFmt.format(codFee)}</span>
              </div>
            )}
            <div className="my-2 h-px bg-slate-200" />
            <div className="flex justify-between text-xl font-black text-[color:var(--brand-orange)]">
              <span>รวม</span><span>{priceFmt.format(grandTotal)}</span>
            </div>
            <Button type="submit" disabled={submitting || items.length === 0} className="w-full bg-[color:var(--brand-orange)] font-bold hover:bg-[color:var(--brand-orange-dark)]" size="lg">
              {submitting ? "กำลังส่ง..." : "ยืนยันคำสั่งซื้อ"}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}
