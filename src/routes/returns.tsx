import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "การคืนสินค้า / รับประกัน — ENT Group IT Retail Shop" },
      { name: "description", content: "นโยบายคืนสินค้า 7 วัน เปลี่ยนสินค้าชำรุดจากโรงงานทันที — ENT Group IT Retail Shop" },
      { property: "og:title", content: "การคืนสินค้า / รับประกัน — ENT Group IT Retail Shop" },
      { property: "og:description", content: "นโยบายคืนสินค้า 7 วัน — ENT Group IT Retail Shop" },
    ],
  }),
  component: Returns,
});

function Returns() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">การคืนสินค้า / รับประกัน</h1>
        <p className="text-slate-600 mb-8">นโยบายที่โปร่งใสและเป็นธรรม</p>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">📅 ระยะเวลาคืนสินค้า</h2>
          <p className="text-sm text-slate-700">คืนสินค้าได้ภายใน <span className="font-semibold">7 วัน</span> นับจากวันที่ได้รับสินค้า</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">✅ เงื่อนไขการคืน</h2>
          <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
            <li>สินค้าต้องอยู่ในสภาพสมบูรณ์ ไม่ผ่านการใช้งาน</li>
            <li>บรรจุภัณฑ์ อุปกรณ์เสริม และเอกสารครบถ้วน</li>
            <li>สินค้าชำรุดจากโรงงาน — เปลี่ยนใหม่ทันที</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">❌ ไม่รับคืน</h2>
          <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
            <li>Software license ที่ activate แล้ว</li>
            <li>สินค้าที่แกะซีลหรือเปิดใช้งานแล้วโดยไม่มีข้อบกพร่อง</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">💰 ระยะเวลาคืนเงิน</h2>
          <p className="text-sm text-slate-700">3-7 วันทำการ หลังจากทีมงานตรวจรับสินค้าคืน</p>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm text-slate-700 mb-3">ติดต่อฝ่ายบริการลูกค้าเพื่อคืนสินค้า</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:0204561040" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">📞 02-045-6104</a>
            <a href="mailto:sales@entgroup.co.th" className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-medium">✉️ sales@entgroup.co.th</a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
