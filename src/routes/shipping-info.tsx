import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/shipping-info")({
  head: () => ({
    meta: [
      { title: "ข้อมูลการจัดส่ง — ENT Group IT Retail Shop" },
      { name: "description", content: "จัดส่ง Kerry / Flash Express ทั่วไทย ฟรีค่าจัดส่งเมื่อซื้อครบตามเงื่อนไข" },
      { property: "og:title", content: "ข้อมูลการจัดส่ง — ENT Group IT Retail Shop" },
      { property: "og:description", content: "จัดส่ง Kerry / Flash Express ทั่วไทย" },
    ],
  }),
  component: ShippingInfo,
});

function ShippingInfo() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">ข้อมูลการจัดส่ง</h1>
        <p className="text-slate-600 mb-8">จัดส่งทั่วประเทศไทยด้วย Kerry Express และ Flash Express</p>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-3">🚚 อัตราค่าจัดส่ง</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li><span className="font-medium">กรุงเทพฯ และปริมณฑล:</span> 1-2 วันทำการ ค่าจัดส่ง ฿50-100</li>
            <li><span className="font-medium">ต่างจังหวัด:</span> 2-5 วันทำการ ค่าจัดส่ง ฿50-400 (ตามน้ำหนัก)</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-3">🎁 ฟรีค่าจัดส่ง</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✅ กทม./ปริมณฑล เมื่อซื้อครบ <span className="font-semibold">฿5,000</span></li>
            <li>✅ ทั่วไทย เมื่อซื้อครบ <span className="font-semibold">฿10,000</span></li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🏢 รับสินค้าที่สำนักงาน (ฟรี)</h2>
          <p className="text-sm text-slate-700">เปิดทำการ จันทร์-ศุกร์ 9:00-18:00</p>
          <p className="text-sm text-slate-600 mt-2">70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2 ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120</p>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm text-slate-700">ต้องการติดตามสถานะจัดส่ง?</p>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            <a href="tel:0204561040" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">📞 02-045-6104</a>
            <a href="https://line.me/R/ti/p/@entgroup" target="_blank" rel="noreferrer" className="rounded-full bg-[#06C755] text-white px-4 py-2 text-sm font-medium">💚 Line: @entgroup</a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
