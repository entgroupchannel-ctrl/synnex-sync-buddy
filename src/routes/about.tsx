import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Scale,
  Sparkles,
  CreditCard,
  FileText,
  Users,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Award,
  GitCompare,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "เกี่ยวกับเรา — ENT Group IT Retail Shop" },
      {
        name: "description",
        content:
          "ENT Group IT Retail Shop แพลตฟอร์มช้อปไอทีที่เข้าใจงานโครงการและองค์กรจริง วงเงินเครดิต B2B ระบบเปรียบเทียบและแนะนำสินค้าอัจฉริยะ พร้อมโปรแกรมสมาชิกสะสมส่วนลด",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "เกี่ยวกับเรา — ENT Group IT Retail Shop" },
      {
        property: "og:description",
        content:
          "แพลตฟอร์มช้อปไอทีสำหรับงานโครงการและองค์กร พร้อมเครื่องมือช่วยตัดสินใจซื้อที่ฉลาดกว่า",
      },
      { property: "og:url", content: "https://shop.entgroup.co.th/about" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "เกี่ยวกับเรา — ENT Group IT Retail Shop" },
    ],
    links: [{ rel: "canonical", href: "https://shop.entgroup.co.th/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About ENT Group IT Retail Shop",
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
            <Award className="h-3.5 w-3.5" /> ให้บริการมาตั้งแต่ปี 2558
          </div>
          <h1 className="mt-4 text-3xl font-black md:text-5xl">ไม่ใช่แค่ที่ขายของไอที</h1>
          <p className="mt-3 max-w-3xl text-white/85 md:text-lg">
            ENT Group IT Retail Shop สร้างขึ้นมาเพื่อคนที่ซื้อไอทีแบบ &ldquo;ต้องใช้จริง&rdquo; —
            องค์กรที่ต้องมีใบเสนอราคาและเครดิตเทอมก่อนอนุมัติงบ ทีมไอทีที่ต้องเทียบสเปกให้ตรงงาน
            และลูกค้าที่กลับมาซื้อซ้ำจนอยากได้อะไรที่มากกว่าราคาถูกที่สุดในตลาด
          </p>
        </div>
      </section>

      {/* เราคือใคร */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">
            เราคือใคร
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
            <p>
              เราคือหน้าร้านออนไลน์ของ บริษัท อี เอ็น ที กรุ๊ป จำกัด
              ที่ตั้งใจสร้างขึ้นมาเป็นแพลตฟอร์มของตัวเอง ไม่ใช่แค่แคตตาล็อกสินค้าที่ยกมาจากที่อื่น
              เราเลือกที่จะรู้จริงว่าลูกค้าแต่ละกลุ่มซื้อไอทีอย่างไร —
              ฝ่ายจัดซื้อองค์กรต้องการอะไรก่อนตัดสินใจ ทีมไอทีต้องเทียบอะไรก่อนสั่ง
              และลูกค้าทั่วไปอยากได้ความมั่นใจแบบไหนก่อนกดสั่งซื้อของหลักหมื่นหลักแสน
            </p>
            <p>
              เราไม่ได้แข่งด้วยการเป็นเว็บที่ราคาถูกที่สุดในทุกตัวเสมอไป —
              เพราะนั่นไม่ใช่สิ่งที่เราอยากเป็น
              เราอยากเป็นที่ที่ลูกค้าองค์กรและโครงการไว้ใจให้ดูแลตั้งแต่ใบเสนอราคาแรกจนถึงหลังส่งมอบสินค้า
              และเป็นที่ที่ลูกค้าประจำรู้สึกว่าซื้อซ้ำแล้วคุ้มขึ้นเรื่อยๆ
              ไม่ใช่แค่ราคาตายตัวแบบเดิมทุกครั้ง
            </p>
          </div>
        </div>
      </section>

      {/* ค่านิยมที่เราใส่ลงในเว็บนี้ */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">
            ค่านิยมที่เราใส่ลงในเว็บนี้
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                icon: FileText,
                title: "เข้าใจงานโครงการจริง",
                desc: "ใบเสนอราคาออกได้ทันที ใบกำกับภาษี VAT ครบ วงเงินเครดิต B2B สูงสุด ฿1,000,000 บาท เครดิต 15-30 วัน อนุมัติภายใน 3-5 วันทำการ — สำหรับองค์กร หน่วยงานราชการ และรัฐวิสาหกิจที่ต้องมีเอกสารจัดซื้อถูกระเบียบ ไม่ใช่แค่กดซื้อแล้วจบ",
              },
              {
                icon: Sparkles,
                title: "เทคโนโลยีที่ช่วยตัดสินใจ ไม่ใช่แค่โชว์สินค้า",
                desc: "ระบบเปรียบเทียบสินค้าในหมวดเดียวกันแบบเลือกได้จากหน้ารวม และระบบแนะนำสินค้าที่ประเมินจากพฤติกรรมการซื้อจริง ไม่ใช่สุ่มสินค้ามาใส่ตามหมวดเฉยๆ",
              },
              {
                icon: Users,
                title: "รางวัลสำหรับคนที่กลับมาซื้อซ้ำ",
                desc: "โปรแกรมสมาชิกสะสม Silver / Gold / VIP ให้ส่วนลดเพิ่มขึ้นเรื่อยๆ ตามยอดซื้อสะสม ยิ่งซื้อกับเรานาน ราคาที่เห็นครั้งต่อไปยิ่งดีกว่าเดิม",
              },
              {
                icon: Scale,
                title: "ตรงไปตรงมาเรื่องราคา",
                desc: "เราไม่ได้อ้างว่าถูกที่สุดในตลาด ราคาที่เห็นคือราคาจริงบวกมาร์จิ้นที่เปิดเผยได้ ไม่มีค่าธรรมเนียมแอบแฝง สิ่งที่เราแลกมาคือความไว้วางใจและบริการที่ครบกว่า ไม่ใช่ตัวเลขที่ต่ำที่สุดเพียงอย่างเดียว",
              },
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

      {/* ลูกค้าได้อะไรจากนวัตกรรมที่เราสร้าง */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">
            ลูกค้าได้อะไรจากนวัตกรรมที่เราสร้าง
          </h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-3 rounded-lg border bg-white p-5">
              <GitCompare className="h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
              <p className="text-sm leading-relaxed text-slate-700">
                เปรียบเทียบสินค้าได้จากหน้ารวมสินค้าทันที — ไม่ต้องเปิดหลายแท็บสลับดูเอง
                เลือกสินค้าที่สนใจในหมวดเดียวกันแล้วดูตารางสเปก/ราคาเทียบกันข้างๆ ได้เลย
                ประหยัดเวลาตัดสินใจ โดยเฉพาะตอนต้องเลือกระหว่างรุ่นใกล้เคียงกันหลายตัว
              </p>
            </div>
            <div className="flex gap-3 rounded-lg border bg-white p-5">
              <Sparkles className="h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
              <p className="text-sm leading-relaxed text-slate-700">
                ระบบแนะนำสินค้าที่ฉลาดขึ้นเรื่อยๆ — ทุกครั้งที่มีคนสั่งซื้อ
                ระบบจะเรียนรู้ว่าสินค้าใดถูกซื้อคู่กันจริง
                แล้วนำมาแนะนำให้ลูกค้าคนต่อไปที่ดูสินค้าใกล้เคียงกัน
                ไม่ใช่การสุ่มหยิบสินค้าในหมวดเดียวกันมาใส่เฉยๆ
              </p>
            </div>
            <div className="flex gap-3 rounded-lg border bg-white p-5">
              <CreditCard className="h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
              <p className="text-sm leading-relaxed text-slate-700">
                เครดิตเทอมและเอกสารที่พร้อมสำหรับงบองค์กร —
                ไม่ต้องเสียเวลาหาที่อื่นสำหรับใบเสนอราคาทางการ ใบกำกับภาษี
                หรือขอวงเงินเครดิตแยกทีหลัง ทุกอย่างอยู่ในที่เดียวตั้งแต่เริ่มดูสินค้า
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company facts */}
      <section className="border-b bg-slate-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 pt-10 md:grid-cols-4">
          {[
            { label: "ก่อตั้ง", value: "พ.ศ. 2558" },
            { label: "สินค้าในระบบ", value: "900+ รายการ" },
            { label: "วงเงินเครดิต B2B", value: "สูงสุด ฿1,000,000" },
            { label: "จัดส่ง", value: "ทั่วประเทศไทย" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4 text-center">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="mt-1 text-lg font-bold text-[color:var(--brand-navy)]">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6">
          <div className="flex items-start gap-3 rounded-lg border bg-white p-5">
            <ShieldCheck className="h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
            <p className="text-sm leading-relaxed text-slate-700">
              สินค้าทุกชิ้นแท้ 100% รับประกันโดยศูนย์บริการอย่างเป็นทางการในประเทศไทย —
              เป็นมาตรฐานพื้นฐานที่เรายืนยันได้ ไม่ใช่จุดที่เราอยากให้เป็นเหตุผลเดียวที่เลือกเรา
            </p>
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">
            ข้อมูลบริษัท
          </h2>
          <div className="mt-6 grid gap-3 rounded-lg border bg-white p-6 text-sm md:grid-cols-2">
            <div>
              <span className="text-slate-500">ชื่อทางการ:</span>{" "}
              <strong>บริษัท อี เอ็น ที กรุ๊ป จำกัด</strong>
            </div>
            <div>
              <span className="text-slate-500">English:</span> ENT Group Co., Ltd.
            </div>
            <div>
              <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span> 0135558013167
            </div>
            <div>
              <span className="text-slate-500">ก่อตั้ง:</span> 2558 (2015)
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>
                เลขที่ 70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2 ถ.หอการค้าไทย ต.คลองพระอุดม
                อ.ปากเกร็ด จ.นนทบุรี 11120
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <a href="tel:+6620456104" className="text-[color:var(--brand-navy)] hover:underline">
                02-045-6104
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <a
                href="mailto:sales@entgroup.co.th"
                className="text-[color:var(--brand-navy)] hover:underline"
              >
                sales@entgroup.co.th
              </a>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-1">
            <iframe
              src="https://maps.google.com/maps?q=13.9320709,100.4819588&z=16&output=embed"
              width="100%"
              height={250}
              style={{ border: 0, borderRadius: "12px" }}
              allowFullScreen
              loading="lazy"
              title="ENT GROUP Office Location"
            />
          </div>
          <a
            href="https://www.google.com/maps/place/ENT+GROUP+Co.,Ltd./@13.9320709,100.4819588,17z"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-green)] hover:underline"
          >
            <MapPin className="h-4 w-4" /> เปิดใน Google Maps →
          </a>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="rounded-md bg-[color:var(--brand-green)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              ติดต่อฝ่ายขาย
            </Link>
            <Link
              to="/credit-application"
              className="rounded-md bg-[color:var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              สมัครวงเงินเครดิต B2B
            </Link>
            <Link
              to="/"
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              ดูสินค้าทั้งหมด
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
