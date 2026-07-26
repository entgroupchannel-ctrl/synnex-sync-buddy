import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "ร่วมงานกับเรา — ENT Group IT Retail Shop" },
      { name: "description", content: "ร่วมงานกับ ENT Group — ตำแหน่งฝ่ายขาย IT Solutions, ช่างเทคนิค และ Logistics" },
      { property: "og:title", content: "ร่วมงานกับเรา — ENT Group IT Retail Shop" },
      { property: "og:description", content: "ร่วมงานกับ ENT Group — ตำแหน่งฝ่ายขาย, ช่างเทคนิค และ Logistics" },
    ],
  }),
  component: Careers,
});

const POSITIONS = [
  { title: "เจ้าหน้าที่ขาย IT Solutions (B2B)", desc: "ดูแลลูกค้าองค์กร นำเสนอโซลูชันไอที ประสบการณ์ด้านการขายไอทีจะพิจารณาเป็นพิเศษ" },
  { title: "ช่างเทคนิค / ซ่อมบำรุง", desc: "ประกอบและซ่อม PC / Notebook / Server ทดสอบสินค้าและติดตั้งระบบ" },
  { title: "เจ้าหน้าที่ Logistics / คลังสินค้า", desc: "จัดการสต็อก แพ็คสินค้า และประสานงานขนส่ง" },
];

function Careers() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">ร่วมงานกับเรา</h1>
        <p className="text-slate-600 mb-8">มาเป็นส่วนหนึ่งของทีม ENT Group — Computer for all</p>

        <div className="rounded-2xl border bg-white p-6 mb-6">
          <h2 className="font-semibold text-lg mb-3">💼 ตำแหน่งที่เปิดรับ</h2>
          <div className="space-y-3">
            {POSITIONS.map((p) => (
              <div key={p.title} className="rounded-lg bg-slate-50 p-4">
                <div className="font-medium text-slate-800">{p.title}</div>
                <div className="text-sm text-slate-600 mt-1">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🎁 สวัสดิการ</h2>
          <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
            <li>ประกันสังคม</li>
            <li>โบนัสประจำปีตามผลประกอบการ</li>
            <li>วันหยุดตามกฎหมายและวันหยุดพิเศษ</li>
            <li>สภาพแวดล้อมการทำงานที่เป็นกันเอง</li>
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <h3 className="font-semibold text-[color:var(--brand-navy)] mb-2">📩 ส่ง Resume มาที่</h3>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            <a href="mailto:hr@entgroup.co.th" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">✉️ hr@entgroup.co.th</a>
            <a href="tel:0204561040" className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium">📞 02-045-6104</a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
