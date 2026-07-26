import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: "วิธีชำระเงิน — ENT Group IT Retail Shop" },
      { name: "description", content: "ชำระเงินผ่าน PromptPay QR, โอนธนาคาร KBank / SCB — ENT Group IT Retail Shop" },
      { property: "og:title", content: "วิธีชำระเงิน — ENT Group IT Retail Shop" },
      { property: "og:description", content: "ชำระเงินผ่าน PromptPay QR หรือโอนธนาคาร KBank / SCB" },
    ],
  }),
  component: PaymentMethods,
});

function PaymentMethods() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-[color:var(--brand-navy)]">วิธีชำระเงิน</h1>
        <p className="text-slate-600 mb-8">ช่องทางชำระเงินที่ปลอดภัยและสะดวก</p>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">💚 PromptPay QR Code <span className="text-xs text-emerald-600 font-medium ml-2">แนะนำ</span></h2>
          <p className="text-sm text-slate-600">สแกนจ่ายผ่าน Mobile Banking ได้ทุกธนาคาร ระบบยืนยันการชำระเงินอัตโนมัติ</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-3">🏦 โอนเงินผ่านธนาคาร</h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-800">ธนาคารกสิกรไทย (KBank)</div>
              <div className="text-slate-600">เลขที่บัญชี: <span className="font-mono">841-2-05851-9</span></div>
              <div className="text-slate-600">ชื่อบัญชี: บริษัท อีเอ็นที กรุ๊ป จำกัด</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-800">ธนาคารไทยพาณิชย์ (SCB)</div>
              <div className="text-slate-600">เลขที่บัญชี: <span className="font-mono">406-817747-1</span></div>
              <div className="text-slate-600">ชื่อบัญชี: บริษัท อีเอ็นที กรุ๊ป จำกัด</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">หลังโอน แจ้งสลิปผ่าน Line @entgroup หรืออีเมล sales@entgroup.co.th</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">💳 บัตรเครดิต / เดบิต</h2>
          <p className="text-sm text-slate-600">เร็วๆ นี้ — กำลังเปิดให้บริการ</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 mb-4">
          <h2 className="font-semibold text-lg mb-2">📦 เก็บเงินปลายทาง (COD)</h2>
          <p className="text-sm text-slate-600">ไม่รองรับในขณะนี้</p>
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm text-slate-700">มีคำถามเกี่ยวกับการชำระเงิน?</p>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
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
