import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "นโยบายความเป็นส่วนตัว (PDPA) — ENT Group IT Shop" },
      { name: "description", content: "นโยบายคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA พ.ศ. 2562 — ENT Group IT Shop" },
      { property: "og:title", content: "นโยบายความเป็นส่วนตัว (PDPA) — ENT Group IT Shop" },
      { property: "og:description", content: "นโยบายคุ้มครองข้อมูลส่วนบุคคลตาม PDPA" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-slate-600 mb-8">สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">📋 ข้อมูลที่เราเก็บรวบรวม</h2>
          <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
            <li>ชื่อ-นามสกุล</li>
            <li>ที่อยู่จัดส่ง</li>
            <li>เบอร์โทรศัพท์</li>
            <li>อีเมล</li>
            <li>ข้อมูลบริษัท (สำหรับลูกค้า B2B และการออกใบกำกับภาษี)</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🎯 วัตถุประสงค์การใช้ข้อมูล</h2>
          <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
            <li>จัดส่งสินค้าไปยังที่อยู่ของท่าน</li>
            <li>ติดต่อยืนยันคำสั่งซื้อและบริการหลังการขาย</li>
            <li>ออกใบกำกับภาษี / ใบเสร็จรับเงิน</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🔒 การเปิดเผยข้อมูล</h2>
          <p className="text-sm text-slate-700">เราไม่เปิดเผยข้อมูลส่วนบุคคลของท่านให้บุคคลที่สาม ยกเว้นบริษัทขนส่ง (Kerry / Flash Express) เพื่อใช้ในการจัดส่งสินค้าเท่านั้น</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🗑️ การขอลบข้อมูล</h2>
          <p className="text-sm text-slate-700">ท่านมีสิทธิ์ขอลบข้อมูลส่วนบุคคลได้ทุกเมื่อ โดยติดต่อ sales@entgroup.co.th</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">🏢 ผู้ควบคุมข้อมูล</h2>
          <p className="text-sm text-slate-700">บริษัท อีเอ็นที กรุ๊ป จำกัด</p>
          <p className="text-sm text-slate-600">เลขประจำตัวผู้เสียภาษี: 0135558013167</p>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm text-slate-700 mb-3">มีคำถามเกี่ยวกับข้อมูลส่วนตัว?</p>
          <a href="mailto:sales@entgroup.co.th" className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium">✉️ sales@entgroup.co.th</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
