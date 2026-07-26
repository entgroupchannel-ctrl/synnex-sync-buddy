import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "เงื่อนไขการใช้งาน — ENT Group IT Retail Shop" },
      { name: "description", content: "เงื่อนไขและข้อกำหนดการใช้บริการเว็บไซต์ shop.entgroup.co.th" },
      { property: "og:title", content: "เงื่อนไขการใช้งาน — ENT Group IT Retail Shop" },
      { property: "og:description", content: "เงื่อนไขและข้อกำหนดการใช้บริการ shop.entgroup.co.th" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">เงื่อนไขการใช้งาน</h1>
        <p className="text-slate-600 mb-8">ข้อกำหนดในการใช้งาน shop.entgroup.co.th</p>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">1. การยอมรับเงื่อนไข</h2>
          <p className="text-sm text-slate-700">การเข้าใช้งานหรือสั่งซื้อสินค้าจากเว็บไซต์ shop.entgroup.co.th ถือเป็นการยอมรับเงื่อนไขทั้งหมดที่ระบุไว้ในหน้านี้</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">2. ราคาสินค้า</h2>
          <p className="text-sm text-slate-700">ราคาสินค้าที่แสดงบนเว็บไซต์อาจเปลี่ยนแปลงได้โดยไม่แจ้งล่วงหน้า ราคาที่ยืนยันในคำสั่งซื้อจะเป็นราคาที่บริษัทฯ ใช้อ้างอิง</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">3. การยกเลิกคำสั่งซื้อ</h2>
          <p className="text-sm text-slate-700">บริษัทฯ ขอสงวนสิทธิ์ในการยกเลิกคำสั่งซื้อ กรณีที่ราคาสินค้าผิดพลาด สินค้าหมดสต็อก หรือข้อมูลไม่ถูกต้อง โดยจะแจ้งลูกค้าและคืนเงินเต็มจำนวน</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">4. ทรัพย์สินทางปัญญา</h2>
          <p className="text-sm text-slate-700">เนื้อหา ภาพ และเครื่องหมายการค้าบนเว็บไซต์ เป็นทรัพย์สินของบริษัท อีเอ็นที กรุ๊ป จำกัด และเจ้าของแบรนด์ที่เกี่ยวข้อง ห้ามคัดลอกโดยไม่ได้รับอนุญาต</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">5. กฎหมายที่บังคับใช้</h2>
          <p className="text-sm text-slate-700">เงื่อนไขนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ ให้อยู่ในเขตอำนาจศาลไทย</p>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm text-slate-700 mb-3">มีคำถามเกี่ยวกับเงื่อนไขการใช้งาน?</p>
          <a href="mailto:sales@entgroup.co.th" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">✉️ sales@entgroup.co.th</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
