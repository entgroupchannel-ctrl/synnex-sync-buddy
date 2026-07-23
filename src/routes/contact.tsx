import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Send, MessageCircle, Globe, ArrowLeft, CreditCard, Printer, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const LINE_ID = "@entgroup";
const LINE_ADD_URL = "https://line.me/R/ti/p/%40entgroup";
const LINE_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(LINE_ADD_URL)}`;
const PHONES = ["02-045-6104", "095-739-1053", "084-046-1315"];
const FAX = "02-045-6105";
const SALES_EMAIL = "Sales@entgroup.co.th";

export const Route = createFileRoute("/contact")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ติดต่อเรา — ENT Group IT Shop" },
      { name: "description", content: "ติดต่อ ENT Group สอบถามสินค้า Mini PC, Panel PC, Industrial Computer ขอใบเสนอราคา โทร 02-045-6104 สำนักงานปากเกร็ด นนทบุรี" },
      { property: "og:title", content: "ติดต่อเรา — ENT Group IT Shop" },
      { property: "og:description", content: "ติดต่อทีมงาน ENT Group — พร้อมให้คำปรึกษาและดูแลทุกโครงการ" },
    ],
  }),
  component: ContactPage,
});

const CATEGORIES = [
  "GT Series — Mini PC", "GB Series — Compact", "EPC Series", "EPC Box Series",
  "GK Series — Panel PC", "Panel PC GTG/GTY", "UTC Series",
  "Smart Display & KIOSK", "Rugged Tablet / Notebook", "Volktek Switch",
  "Mini PC Firewall", "vCloudPoint", "Waterproof PC IP69K", "อื่นๆ",
];
const CALLBACK_TIMES = [
  "เช้า (9:00-12:00)", "บ่าย (13:00-16:00)", "เย็น (16:00-18:00)", "เวลาใดก็ได้",
];

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("ENT Group 70/5 Metro Biztown Chaengwattana 2, Pak Kret, Nonthaburi 11120");

function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", lineId: "", whatsapp: "",
    category: "", callback: "", message: "", subscribe: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("กรุณากรอก ชื่อ อีเมล และข้อความ");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: [
          form.company && `บริษัท: ${form.company}`,
          form.lineId && `LINE: ${form.lineId}`,
          form.whatsapp && `WhatsApp: ${form.whatsapp}`,
          form.category && `หมวดหมู่: ${form.category}`,
          form.callback && `เวลาโทรกลับ: ${form.callback}`,
          form.subscribe && "รับข่าวสาร: ใช่",
          "",
          form.message,
        ].filter(Boolean).join("\n"),
        payment_method: "contact",
        total: 0,
        items: [],
        status: "inquiry",
      };
      const { error } = await supabase.from("orders").insert(payload as never);
      if (error) throw error;
      setDone(true);
      toast.success("ส่งข้อความเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชม.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      {/* Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[color:var(--brand-navy)] via-[color:var(--brand-navy-2)] to-[color:var(--brand-navy)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #10b981 0, transparent 45%), radial-gradient(circle at 80% 70%, #f97316 0, transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-black text-white md:text-5xl">ติดต่อเรา</h1>
          <p className="mt-2 max-w-2xl text-base text-white/80 md:text-lg">
            ติดต่อทีมงานของเรา — พร้อมให้คำปรึกษาและดูแลทุกโครงการ
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:py-12 lg:grid-cols-[1fr_1.4fr]">
        {/* Contact info */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-11 place-items-center rounded-md bg-[color:var(--brand-green)] font-black text-white">ENT</div>
              <div>
                <div className="font-bold text-[color:var(--brand-navy)]">บริษัท อีเอ็นที กรุ๊ป จำกัด</div>
                <div className="text-[11px] text-slate-500">ENT Group Co., Ltd.</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-semibold text-[color:var(--brand-navy)]">สำนักงานใหญ่ & สำนักงานขาย</div>
                  <div className="whitespace-pre-line text-slate-600">
                    70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2{"\n"}
                    ตำบลคลองพระอุดม อำเภอปากเกร็ด{"\n"}
                    นนทบุรี 11120
                  </div>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--brand-green)] hover:underline">
                    เปิดใน Google Maps →
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-semibold text-[color:var(--brand-navy)]">โทรศัพท์</div>
                  <a href="tel:020456104" className="text-slate-600 hover:text-[color:var(--brand-green)]">02-045-6104</a>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-semibold text-[color:var(--brand-navy)]">อีเมลฝ่ายขาย</div>
                  <a href="mailto:info@entgroup.co.th" className="text-slate-600 hover:text-[color:var(--brand-green)]">info@entgroup.co.th</a>
                </div>
              </div>

              <div className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-semibold text-[color:var(--brand-navy)]">LINE Official</div>
                  <div className="text-slate-600">แอดไลน์ <span className="font-mono">@entgroup</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-semibold text-[color:var(--brand-navy)]">เว็บไซต์</div>
                  <a href="https://entgroup.co.th" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-[color:var(--brand-green)]">www.entgroup.co.th</a>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-3">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">เลขประจำตัวผู้เสียภาษี</div>
                  <div className="font-mono text-sm text-slate-700">0135558013167</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-red-50 p-5">
            <div className="font-bold text-[color:var(--brand-navy)]">ต้องการใบเสนอราคา?</div>
            <p className="mt-1 text-sm text-slate-600">เลือกสินค้าและจำนวน — ฝ่ายขายจะจัดทำใบเสนอราคาให้ภายใน 24 ชม.</p>
            <Button asChild className="mt-3 bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]">
              <Link to="/">ขอใบเสนอราคา →</Link>
            </Button>
          </div>
        </aside>

        {/* Form */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          {done ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--brand-green)]/10 text-3xl">✓</div>
              <h2 className="mt-4 text-xl font-black text-[color:var(--brand-navy)]">ส่งข้อความเรียบร้อย!</h2>
              <p className="mt-1 text-sm text-slate-600">ขอบคุณที่ติดต่อเรา ทีมงานจะตอบกลับโดยเร็วที่สุด</p>
              <Button variant="outline" className="mt-6" onClick={() => { setDone(false); setForm({ name: "", email: "", phone: "", company: "", lineId: "", whatsapp: "", category: "", callback: "", message: "", subscribe: false }); }}>
                ส่งข้อความอีกครั้ง
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-[color:var(--brand-navy)] md:text-2xl">ส่งข้อความถึงเรา</h2>
              <p className="mt-1 text-sm text-slate-500">กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>

              <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="ชื่อ *" htmlFor="name">
                  <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ชื่อ-นามสกุล" />
                </Field>
                <Field label="อีเมล *" htmlFor="email">
                  <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@company.com" />
                </Field>
                <Field label="โทรศัพท์" htmlFor="phone">
                  <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08x-xxx-xxxx" />
                </Field>
                <Field label="บริษัท" htmlFor="company">
                  <Input id="company" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="ชื่อบริษัท / หน่วยงาน" />
                </Field>
                <Field label="LINE ID" htmlFor="lineId">
                  <Input id="lineId" value={form.lineId} onChange={(e) => set("lineId", e.target.value)} placeholder="@lineid" />
                </Field>
                <Field label="WhatsApp" htmlFor="whatsapp">
                  <Input id="whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+66..." />
                </Field>
                <Field label="หมวดหมู่สินค้า">
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="เวลาที่สะดวกให้ติดต่อกลับ">
                  <Select value={form.callback} onValueChange={(v) => set("callback", v)}>
                    <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                    <SelectContent>
                      {CALLBACK_TIMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <Field label="ข้อความ *" htmlFor="message">
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="รายละเอียดที่ต้องการสอบถาม เช่น จำนวน สเปกที่ต้องการ งบประมาณ..."
                    />
                  </Field>
                </div>

                <label className="flex items-start gap-2 text-sm text-slate-600 md:col-span-2">
                  <Checkbox checked={form.subscribe} onCheckedChange={(v) => set("subscribe", v === true)} className="mt-0.5" />
                  สมัครรับข่าวสาร โปรโมชั่น และอัปเดตจาก ENT Group
                </label>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 bg-[color:var(--brand-green)] font-bold hover:bg-[color:var(--brand-green-dark)] md:col-span-2"
                  size="lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "กำลังส่ง..." : "ส่งข้อความ"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
