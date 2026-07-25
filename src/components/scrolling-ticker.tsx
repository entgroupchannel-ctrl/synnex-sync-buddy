import type { ReactNode } from "react";
import { Flame, Zap, Tag, Building2, Truck, ShieldCheck } from "lucide-react";

const MESSAGES: { icon: ReactNode; text: string }[] = [
  { icon: <Flame className="h-3.5 w-3.5 text-red-500" />, text: "สินค้าใหม่ iPhone 17 Pro Max มาแล้ว!" },
  { icon: <Zap className="h-3.5 w-3.5 text-yellow-500" />, text: "ลดราคา Computer Set RTX5090 วันนี้เท่านั้น" },
  { icon: <Tag className="h-3.5 w-3.5 text-green-500" />, text: "Smart Life Sale ลดสูงสุด 20%" },
  { icon: <Building2 className="h-3.5 w-3.5 text-blue-500" />, text: "สมัครวงเงินเครดิต B2B ได้แล้ววันนี้" },
  { icon: <Truck className="h-3.5 w-3.5 text-purple-500" />, text: "ส่งฟรีเมื่อซื้อครบ ฿5,000 กทม./ปริมณฑล" },
  { icon: <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />, text: "ลิขสิทธิ์แท้ Microsoft Office 2024 พร้อมส่ง" },
];

export function ScrollingTicker() {
  const items = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden border-y border-slate-200 bg-gradient-to-r from-yellow-50 via-white to-yellow-50">
      <div className="animate-marquee flex whitespace-nowrap py-1.5 text-xs font-medium text-amber-800">
        {items.map((item, i) => (
          <span key={i} className="mx-6 inline-flex shrink-0 items-center gap-1.5">
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
