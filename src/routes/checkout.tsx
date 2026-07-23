import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "ชำระเงิน — IT Dealer" },
      { name: "description", content: "หน้ายืนยันคำสั่งซื้อ" },
    ],
  }),
});

const schema = z.object({
  customer_name: z.string().trim().min(1, "กรอกชื่อ").max(100),
  customer_phone: z.string().trim().min(6, "กรอกเบอร์โทร").max(30),
  customer_email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255),
  customer_address: z.string().trim().min(5, "กรอกที่อยู่").max(500),
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", customer_address: "" });
  const [payment, setPayment] = useState<"transfer" | "cod">("transfer");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("ตะกร้าว่างเปล่า"); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("orders").insert({
      ...parsed.data,
      items: items.map((i) => ({ id: i.id, sku: i.sku, name: i.name, price: i.price, qty: i.qty, image_url: i.image_url, distributor: i.distributor ?? null })),
      total,
      status: "pending",
    }).select("id").single();
    setSubmitting(false);
    if (error || !data) { toast.error(error?.message ?? "ผิดพลาด"); return; }
    const orderId = data.id;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`order-${orderId}`, JSON.stringify({
        id: orderId,
        payment,
        total,
        items,
        customer: parsed.data,
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
        <h1 className="mb-6 text-2xl font-bold text-[color:var(--brand-navy)]">ชำระเงิน</h1>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">ข้อมูลผู้รับ</h2>
              <div>
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input id="name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required maxLength={100} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input id="phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} required maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} required maxLength={255} />
                </div>
              </div>
              <div>
                <Label htmlFor="addr">ที่อยู่จัดส่ง</Label>
                <Textarea id="addr" rows={4} value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} required maxLength={500} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border bg-white p-6">
              <h2 className="font-bold text-[color:var(--brand-navy)]">วิธีการชำระเงิน</h2>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "transfer" | "cod")} className="grid gap-2 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${payment === "transfer" ? "border-[color:var(--brand-orange)] bg-orange-50" : "hover:bg-slate-50"}`}>
                  <RadioGroupItem value="transfer" />
                  <Banknote className="h-5 w-5 text-[color:var(--brand-navy)]" />
                  <div>
                    <div className="font-semibold">โอนเงิน</div>
                    <div className="text-xs text-slate-500">รับส่วนลด 1%</div>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${payment === "cod" ? "border-[color:var(--brand-orange)] bg-orange-50" : "hover:bg-slate-50"}`}>
                  <RadioGroupItem value="cod" />
                  <Truck className="h-5 w-5 text-[color:var(--brand-navy)]" />
                  <div>
                    <div className="font-semibold">เก็บเงินปลายทาง</div>
                    <div className="text-xs text-slate-500">ชำระเมื่อได้รับสินค้า</div>
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
            <div className="my-2 h-px bg-slate-200" />
            <div className="flex justify-between text-xl font-black text-[color:var(--brand-orange)]">
              <span>รวม</span><span>{priceFmt.format(total)}</span>
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
