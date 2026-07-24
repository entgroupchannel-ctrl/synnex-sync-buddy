import type { ReactElement } from "react";
import { ShieldCheck, PackageCheck, Undo2, Headphones, Lock, Truck, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** 4-column trust bar shown below Add to Cart on the product detail page. */
export function ProductTrustBar(): ReactElement {
  const items: { icon: ReactElement; text: string }[] = [
    { icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, text: "ปลอดภัย 100%" },
    { icon: <PackageCheck className="h-5 w-5 text-slate-700" />, text: "แพ็คกิ้งแน่นหนา" },
    { icon: <Undo2 className="h-5 w-5 text-slate-700" />, text: "คืนสินค้าได้ 7 วัน" },
    { icon: <Headphones className="h-5 w-5 text-slate-700" />, text: "ซัพพอร์ต จ-ศ 9-18น" },
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
          ↩️ นโยบายคืนสินค้า
        </AccordionTrigger>
        <AccordionContent className="text-[13px] text-slate-700">
          <ul className="space-y-1.5">
            <li>• สินค้าชำรุดจากโรงงาน: คืนได้ภายใน 7 วัน</li>
            <li>• สินค้าผิดรุ่น/ผิดสี: เปลี่ยนให้ทันที</li>
            <li>
              • ติดต่อ:{" "}
              <a href="mailto:info@entgroup.co.th" className="text-[color:var(--brand-navy)] underline">
                info@entgroup.co.th
              </a>{" "}
              หรือ{" "}
              <a href="tel:020456104" className="text-[color:var(--brand-navy)] underline">
                02-045-6104
              </a>
            </li>
            <li>• ขั้นตอน: แจ้ง → เราส่งของใหม่ → รับคืนของเดิม</li>
          </ul>
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
    { icon: <Phone className="h-4 w-4 text-slate-700" />, text: "มีปัญหา? โทร 02-045-6104" },
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
    "Authorized Dealer สินค้าแท้ 100%",
    "ประกันศูนย์ไทยทุกชิ้น",
    "จัดส่งทั่วประเทศ Kerry/Flash",
    "ดูแลหลังการขายโดยทีมงาน",
    "ใบกำกับภาษีได้ (ขอในขั้นตอนสั่งซื้อ)",
  ];
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] text-slate-700">
      <div className="mb-2 font-semibold text-slate-900">ทำไมถึงซื้อกับ ENT Group?</div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
