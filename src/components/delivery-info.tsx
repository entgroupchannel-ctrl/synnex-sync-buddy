import type { ReactElement } from "react";

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

const HINT_STYLES: Record<DeliveryKind, { text: string; cls: string }> = {
  software: {
    text: "📧 ส่ง Email ภายใน 24 ชม.",
    cls: "bg-[#dbeafe] text-[#1d4ed8]",
  },
  computer_set_bkk_free: {
    text: "🚚 ส่งฟรี กทม/ปริมณฑล",
    cls: "bg-[#dcfce7] text-[#15803d]",
  },
  computer_set_other: {
    text: "🚚 คิดค่าส่งตามน้ำหนัก",
    cls: "bg-slate-100 text-slate-600",
  },
  notebook: {
    text: "🚚 จัดส่ง 1-3 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
  },
  phone: {
    text: "🚚 จัดส่ง 1-2 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
  },
  network: {
    text: "🚚 จัดส่ง 2-5 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
  },
  default: {
    text: "🚚 จัดส่ง 2-5 วันทำการ",
    cls: "bg-slate-100 text-slate-600",
  },
};

/** Compact badge shown on product cards (below price). */
export function DeliveryHint({ category, name, price }: HintInput): ReactElement {
  const kind = getDeliveryKind({ category, name, price });
  const { text, cls } = HINT_STYLES[kind];
  return (
    <div className={`mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {text}
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
        <div className="mb-2 font-semibold text-slate-900">📧 การจัดส่ง Digital</div>
        <div className="pl-5 text-slate-600">
          <div>ส่ง License Key ทาง Email</div>
          <div>ภายใน 24 ชั่วโมง</div>
          <div>หลังยืนยันการชำระเงิน</div>
        </div>
      </div>
    );
  }

  if (kind === "computer_set_bkk_free" || kind === "computer_set_other") {
    return (
      <div className={`${BOX_CLS} space-y-3`}>
        <div className="font-semibold text-slate-900">🚚 การจัดส่ง</div>
        <div>
          <div className="font-medium">📍 กรุงเทพฯ/ปริมณฑล ส่งฟรี!</div>
          <div className="pl-5 text-slate-600">
            <div>เมื่อสั่งซื้อครบ ฿5,000</div>
            <div>ระยะเวลา 3-5 วันทำการ</div>
          </div>
        </div>
        <div>
          <div className="font-medium">🗺 ต่างจังหวัด</div>
          <div className="pl-5 text-slate-600">
            <div>คิดตามน้ำหนักจริง (15 kg)</div>
            <div>Kerry Express</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${BOX_CLS} space-y-3`}>
      <div className="font-semibold text-slate-900">🚚 การจัดส่ง</div>
      <div>
        <div className="font-medium">📍 กรุงเทพฯ และปริมณฑล</div>
        <div className="pl-5 text-slate-600">
          <div>Kerry Express ส่งด่วน 1 วัน</div>
          <div>ฟรีเมื่อสั่งซื้อครบ ฿3,000</div>
        </div>
      </div>
      <div>
        <div className="font-medium">🗺 ต่างจังหวัดทั่วไทย</div>
        <div className="pl-5 text-slate-600">
          <div>Kerry / ไปรษณีย์ไทย</div>
          <div>3-5 วันทำการ</div>
          <div>ฟรีเมื่อสั่งซื้อครบ ฿5,000</div>
        </div>
      </div>
    </div>
  );
}
