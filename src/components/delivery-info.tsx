import type { ReactElement } from "react";
import { Mail, Truck, MapPin } from "lucide-react";

export type DeliveryKind =
  | "software"
  | "computer_set_bkk_free"
  | "computer_set_other"
  | "notebook"
  | "phone"
  | "network"
  | "default";

type HintInput = {
  category?: string | null;
  name?: string | null;
  price?: number | null;
};

export function getDeliveryKind({ category, name, price }: HintInput): DeliveryKind {
  const c = (category ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  if (c.includes("software")) return "software";
  if (c.includes("computer set") || c.includes("คอมประกอบ")) {
    return (price ?? 0) >= 5000 ? "computer_set_bkk_free" : "computer_set_other";
  }
  if (c.includes("notebook") || n.includes("notebook") || n.includes("macbook") || n.includes("laptop")) {
    return "notebook";
  }
  if (
    c.includes("smart phone") ||
    c.includes("tablet") ||
    n.includes("iphone") ||
    n.includes("ipad") ||
    n.includes("galaxy")
  ) {
    return "phone";
  }
  if (c.includes("network") || c.includes("storage") || c.includes("accessor")) {
    return "network";
  }
  return "default";
}

const HINT_META: Record<DeliveryKind, { text: string; cls: string; icon: "mail" | "truck" }> = {
  software: {
    text: "ส่งอีเมลภายใน 24 ชั่วโมง",
    cls: "bg-[#dbeafe] text-[#1d4ed8]",
    icon: "mail",
  },
  computer_set_bkk_free: {
    text: "ส่งฟรี กรุงเทพฯ / ปริมณฑล",
    cls: "bg-[#dcfce7] text-[#15803d]",
    icon: "truck",
  },
  computer_set_other: {
    text: "คิดค่าจัดส่งตามน้ำหนัก",
    cls: "bg-slate-100 text-slate-600",
    icon: "truck",
  },
  notebook: {
    text: "จัดส่ง 1–3 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
    icon: "truck",
  },
  phone: {
    text: "จัดส่ง 1–2 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
    icon: "truck",
  },
  network: {
    text: "จัดส่ง 2–5 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
    icon: "truck",
  },
  default: {
    text: "จัดส่ง 2–5 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
    icon: "truck",
  },
};

/** Compact badge shown on product cards (below price). */
export function DeliveryHint({ category, name, price }: HintInput): ReactElement {
  const kind = getDeliveryKind({ category, name, price });
  const { text, cls, icon } = HINT_META[kind];
  const Icon = icon === "mail" ? Mail : Truck;
  return (
    <div className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
}

const BOX_CLS =
  "mt-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px] text-slate-700";

/** Full info block on the product detail page. */
export function DeliveryInfoBox({ category, name, price }: HintInput): ReactElement {
  const kind = getDeliveryKind({ category, name, price });

  if (kind === "software") {
    return (
      <div className={BOX_CLS}>
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
          <Mail className="h-4 w-4" />
          การจัดส่งแบบดิจิทัล
        </div>
        <div className="pl-6 text-slate-600">
          <div>จัดส่ง License Key ทางอีเมล</div>
          <div>ภายใน 24 ชั่วโมงหลังยืนยันการชำระเงิน</div>
        </div>
      </div>
    );
  }

  if (kind === "computer_set_bkk_free" || kind === "computer_set_other") {
    return (
      <div className={`${BOX_CLS} space-y-3`}>
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Truck className="h-4 w-4" />
          การจัดส่งสินค้า
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            กรุงเทพมหานคร และปริมณฑล
          </div>
          <div className="pl-5 text-slate-600">
            <div>ฟรีค่าจัดส่ง เมื่อยอดสั่งซื้อครบ ฿5,000</div>
            <div>ระยะเวลาจัดส่งประมาณ 3–5 วันทำการ</div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            ต่างจังหวัด ทั่วราชอาณาจักรไทย
          </div>
          <div className="pl-5 text-slate-600">
            <div>คิดค่าจัดส่งตามน้ำหนักจริง (ประมาณ 15 กก.)</div>
            <div>บริการจัดส่งโดย Kerry Express</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${BOX_CLS} space-y-3`}>
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <Truck className="h-4 w-4" />
        การจัดส่งสินค้า
      </div>
      <div>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="h-3.5 w-3.5" />
          กรุงเทพมหานคร และปริมณฑล
        </div>
        <div className="pl-5 text-slate-600">
          <div>Kerry Express — จัดส่งภายใน 1 วันทำการ</div>
          <div>ฟรีค่าจัดส่ง เมื่อยอดสั่งซื้อครบ ฿3,000</div>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="h-3.5 w-3.5" />
          ต่างจังหวัด ทั่วราชอาณาจักรไทย
        </div>
        <div className="pl-5 text-slate-600">
          <div>บริการจัดส่งโดย Kerry Express / ไปรษณีย์ไทย</div>
          <div>ระยะเวลาจัดส่งประมาณ 3–5 วันทำการ</div>
          <div>ฟรีค่าจัดส่ง เมื่อยอดสั่งซื้อครบ ฿5,000</div>
        </div>
      </div>
    </div>
  );
}
