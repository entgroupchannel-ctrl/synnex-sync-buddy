import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/how-to-order")({
  head: () => ({
    meta: [
      { title: "วิธีสั่งซื้อสินค้า — ENT Group IT Retail Shop" },
      { name: "description", content: "ขั้นตอนสั่งซื้อสินค้าไอทีจาก ENT Group IT Retail Shop — เลือกสินค้า ชำระเงิน และรับสินค้าอย่างปลอดภัย" },
      { property: "og:title", content: "วิธีสั่งซื้อสินค้า — ENT Group IT Retail Shop" },
      { property: "og:description", content: "ขั้นตอนสั่งซื้อสินค้าไอทีจาก ENT Group IT Retail Shop" },
    ],
  }),
  component: HowToOrder,
});

const STEPS = [
  { step: 1, title: "เลือกสินค้า", desc: "เลือกสินค้าที่ต้องการจากหมวดหมู่ หรือค้นหาด้วยชื่อสินค้า/รุ่น กดปุ่ม 'ใส่ตะกร้า' หรือ 'สั่งซื้อทันที'" },
  { step: 2, title: "ตรวจสอบตะกร้าสินค้า", desc: "ตรวจสอบรายการสินค้า จำนวน และราคา กดปุ่ม 'ดำเนินการชำระเงิน' เพื่อไปขั้นตอนถัดไป" },
  { step: 3, title: "กรอกข้อมูลการจัดส่ง", desc: "กรอกชื่อ-นามสกุล ที่อยู่จัดส่ง เบอร์โทร และอีเมล เพื่อให้ทีมงานติดต่อกลับได้" },
  { step: 4, title: "เลือกวิธีชำระเงิน", desc: "ชำระด้วย PromptPay QR Code สแกนผ่าน Mobile Banking ทุกธนาคาร หรือโอนเงินผ่านธนาคาร" },
  { step: 5, title: "รับการยืนยัน", desc: "รับอีเมลยืนยันคำสั่งซื้อ ทีมงานจะติดต่อกลับภายใน 1 วันทำการ เพื่อยืนยันและแจ้งกำหนดจัดส่ง" },
];

function HowToOrder() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">วิธีสั่งซื้อสินค้า</h1>
        <p className="text-slate-600 mb-8">ขั้นตอนการสั่งซื้อสินค้าจาก ENT Group IT Retail Shop</p>

        <div className="space-y-4">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="rounded-2xl border bg-white p-6 flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                {step}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-[color:var(--brand-navy)]">{title}</h2>
                <p className="text-sm text-slate-600 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <h3 className="font-semibold text-[color:var(--brand-navy)] mb-2">💬 ต้องการความช่วยเหลือ?</h3>
          <p className="text-sm text-slate-700 mb-4">ทีมงาน ENT Group พร้อมให้คำแนะนำ จันทร์-ศุกร์ 9:00-18:00</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:0204561040" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">📞 02-045-6104</a>
            <LineQrDialog>
              <button type="button" className="rounded-full bg-[#06C755] text-white px-4 py-2 text-sm font-medium">💚 Line: @entgroup</button>
            </LineQrDialog>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
