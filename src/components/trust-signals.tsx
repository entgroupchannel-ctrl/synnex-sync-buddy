import type { ReactElement } from "react";
import {
  ShieldCheck,
  Package,
  RotateCcw,
  Headphones,
  Lock,
  Truck,
  Phone,
  Mail,
  Check,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** 4-column trust bar shown below Add to Cart on the product detail page. */
export function ProductTrustBar(): ReactElement {
  const items: { icon: ReactElement; text: string }[] = [
    { icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, text: "ธุรกรรมปลอดภัย" },
    { icon: <Package className="h-5 w-5 text-slate-700" />, text: "บรรจุภัณฑ์มาตรฐาน" },
    { icon: <RotateCcw className="h-5 w-5 text-slate-700" />, text: "รับประกันสินค้า 7 วัน" },
    { icon: <Headphones className="h-5 w-5 text-slate-700" />, text: "บริการหลังการขาย จันทร์–ศุกร์ 9:00–18:00 น." },
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e2e8f0] pt-3 sm:grid-cols-4">
      {items.map((i, idx) => (
        <div key={idx} className="flex flex-col items-center gap-1 text-center">
          {i.icon}
          <span className="text-[12px] font-medium text-slate-700">{i.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Collapsible return policy for the product detail page. */
export function ReturnPolicyAccordion(): ReactElement {
  return (
    <Accordion type="single" collapsible className="mt-3 rounded-lg border border-[#e2e8f0] bg-white px-4">
      <AccordionItem value="policy" className="border-0">
        <AccordionTrigger className="text-[13px] font-semibold hover:no-underline">
          <span className="inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-slate-700" />
            นโยบายการรับประกันและคืนสินค้า
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-[13px] leading-relaxed text-slate-700">
          <div className="space-y-3">
            <p>
              กรณีสินค้าชำรุดจากกระบวนการผลิต: สามารถดำเนินการคืนสินค้าได้ภายใน 7 วัน
              นับจากวันที่ได้รับสินค้า
            </p>
            <p>
              กรณีจัดส่งสินค้าผิดรุ่นหรือผิดสี: บริษัทฯ ดำเนินการเปลี่ยนสินค้าให้ทันที
              โดยไม่มีค่าใช้จ่าย
            </p>
            <div>
              <div className="font-medium text-slate-900">ติดต่อฝ่ายบริการลูกค้า</div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <a href="mailto:info@entgroup.co.th" className="text-[color:var(--brand-navy)] underline">
                    info@entgroup.co.th
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <a href="tel:020456104" className="text-[color:var(--brand-navy)] underline">
                    02-045-6104
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-900">ขั้นตอนการรับประกัน</div>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>แจ้งปัญหาพร้อมหลักฐานภาพถ่าย</li>
                <li>บริษัทฯ จัดส่งสินค้าทดแทนให้</li>
                <li>รับคืนสินค้าชำรุดโดยไม่เสียค่าใช้จ่าย</li>
              </ol>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Reassurance strip for the cart page (below cart summary). */
export function CartReassurance(): ReactElement {
  const items: { icon: ReactElement; text: string }[] = [
    { icon: <Lock className="h-4 w-4 text-emerald-600" />, text: "ข้อมูลของคุณปลอดภัย" },
    { icon: <Truck className="h-4 w-4 text-slate-700" />, text: "จัดส่งพร้อมประกันสินค้า" },
    { icon: <Phone className="h-4 w-4 text-slate-700" />, text: "สอบถามเพิ่มเติม โทร 02-045-6104" },
  ];
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] text-slate-700">
      {items.map((i, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {i.icon}
          <span>{i.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Checkout page trust sidebar. */
export function CheckoutTrustBox(): ReactElement {
  const items = [
    "สินค้าของแท้ 100%",
    "รับประกันศูนย์ไทยทุกชิ้น",
    "จัดส่งทั่วประเทศ Kerry / Flash Express",
    "บริการหลังการขายโดยทีมงานผู้เชี่ยวชาญ",
    "ออกใบกำกับภาษีได้ (แจ้งในขั้นตอนสั่งซื้อ)",
  ];
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] text-slate-700">
      <div className="mb-2 font-semibold text-slate-900">ทำไมถึงซื้อกับ ENT Group?</div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
