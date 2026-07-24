import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2, ShieldCheck, Truck, Phone, MapPin, Mail, Award, Building2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "เกี่ยวกับเรา — ENT Group Authorized Dealer ตั้งแต่ปี 2558" },
      { name: "description", content: "บริษัท อี เอ็น ที กรุ๊ป จำกัด Authorized Dealer ของ Synnex Thailand และ VST ECS Thailand ตั้งแต่ปี 2558 จำหน่ายสินค้าไอทีราคา Dealer จริง B2B และ Consumer พร้อมใบกำกับภาษีและรับประกันศูนย์ไทย" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "About ENT Group — Authorized IT Dealer Thailand" },
      { property: "og:description", content: "Authorized Dealer ของ Synnex และ VST ECS ตั้งแต่ปี 2558 จำหน่ายสินค้าไอทีสำหรับองค์กรและผู้ใช้ทั่วไป" },
      { property: "og:url", content: "https://shop.entgroup.co.th/about" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About ENT Group — Authorized IT Dealer Thailand" },
    ],
    links: [{ rel: "canonical", href: "https://shop.entgroup.co.th/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About ENT Group IT Shop",
          url: "https://shop.entgroup.co.th/about",
          about: {
            "@type": "Organization",
            name: "ENT Group Co., Ltd.",
            foundingDate: "2015",
            taxID: "0135558013167",
          },
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[color:var(--brand-navy)] to-[color:var(--brand-navy-2)] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <Award className="h-3.5 w-3.5" /> Authorized Dealer ตั้งแต่ปี 2558
          </div>
          <h1 className="mt-4 text-3xl font-black md:text-5xl">เกี่ยวกับ ENT Group</h1>
          <p className="mt-3 max-w-3xl text-white/85 md:text-lg">
            บริษัท อี เอ็น ที กรุ๊ป จำกัด (ENT Group Co., Ltd.) ผู้ให้บริการโซลูชันไอทีครบวงจร
            ตัวแทนจำหน่ายอย่างเป็นทางการของ <strong>Synnex Thailand</strong> และ <strong>VST ECS Thailand</strong>
            ให้บริการทั้งลูกค้าองค์กร (B2B) และผู้ใช้ทั่วไป (Consumer) ด้วยราคา Dealer จริงและบริการหลังการขายที่ไว้วางใจได้
          </p>
        </div>
      </section>

      {/* Company facts */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {[
            { label: "ก่อตั้ง", value: "พ.ศ. 2558" },
            { label: "สินค้าในระบบ", value: "900+ รายการ" },
            { label: "Authorized Dealer", value: "Synnex · VST ECS" },
            { label: "จัดส่ง", value: "ทั่วประเทศไทย" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4 text-center">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="mt-1 text-lg font-bold text-[color:var(--brand-navy)]">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us — E-E-A-T */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">ทำไมต้องซื้อกับ ENT Group</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Authorized Dealer อย่างเป็นทางการ", desc: "เราซื้อตรงจาก Synnex และ VST ECS Thailand ไม่ผ่านคนกลาง จึงมั่นใจได้ทั้งเรื่องราคาและความแท้" },
              { icon: CheckCircle2, title: "รับประกันศูนย์ไทยทุกชิ้น", desc: "สินค้าทุกรายการรับประกันโดยศูนย์บริการอย่างเป็นทางการในประเทศไทย" },
              { icon: Truck, title: "จัดส่งทั่วประเทศ", desc: "Kerry Express, Flash Express, ไปรษณีย์ไทย, SCG, NIM, J&T ค่าจัดส่งเริ่ม ฿35" },
              { icon: Building2, title: "รองรับทั้ง B2B และ Consumer", desc: "ราคา Dealer สำหรับองค์กร ประหยัดสูงสุด 10% ออกใบเสนอราคาและใบกำกับภาษีเต็มรูปแบบ" },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 rounded-lg border bg-white p-5">
                <f.icon className="h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
                <div>
                  <div className="font-bold">{f.title}</div>
                  <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">ข้อมูลบริษัท</h2>
          <div className="mt-6 grid gap-3 rounded-lg border bg-white p-6 text-sm md:grid-cols-2">
            <div><span className="text-slate-500">ชื่อทางการ:</span> <strong>บริษัท อี เอ็น ที กรุ๊ป จำกัด</strong></div>
            <div><span className="text-slate-500">English:</span> ENT Group Co., Ltd.</div>
            <div><span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span> 0135558013167</div>
            <div><span className="text-slate-500">ก่อตั้ง:</span> 2558 (2015)</div>
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>70/5 หมู่บ้านเมกาโฮม บิซทาวน์ ปากเกร็ด นนทบุรี 11120</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <a href="tel:+6620456104" className="text-[color:var(--brand-navy)] hover:underline">02-045-6104</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <a href="mailto:sales@entgroup.co.th" className="text-[color:var(--brand-navy)] hover:underline">sales@entgroup.co.th</a>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/contact" className="rounded-md bg-[color:var(--brand-green)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">ติดต่อฝ่ายขาย</Link>
            <Link to="/" className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">ดูสินค้าทั้งหมด</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
