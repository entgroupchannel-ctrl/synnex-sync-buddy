import type { ReactElement } from "react";

export type DeliveryKind = "software" | "computer_set" | "default";

export function getDeliveryKind(category?: string | null): DeliveryKind {
  const c = (category ?? "").toLowerCase();
  if (c.includes("software")) return "software";
  if (c.includes("computer set") || c === "pc" || c.includes("คอมประกอบ")) return "computer_set";
  return "default";
}

/** Compact one-liner shown on product cards (below price). */
export function DeliveryHint({ category }: { category?: string | null }): ReactElement {
  const kind = getDeliveryKind(category);
  const text =
    kind === "software"
      ? "📧 ส่ง Email 24 ชม."
      : kind === "computer_set"
        ? "🚚 ส่งฟรี กทม ≥฿5,000"
        : "🚚 1-5 วันทำการ";
  return <div className="mt-1 text-[11px] text-slate-600">{text}</div>;
}

/** Full info block on the product detail page. */
export function DeliveryInfoBox({ category }: { category?: string | null }): ReactElement {
  const kind = getDeliveryKind(category);
  if (kind === "software") {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 px-4 text-[13px] text-slate-700">
        <div className="mb-1 font-semibold text-slate-900">📧 ข้อมูลการจัดส่ง</div>
        <div>ส่งทาง Email ภายใน 24 ชั่วโมง</div>
        <div className="text-slate-500">(หลังยืนยันการชำระเงิน)</div>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 px-4 text-[13px] text-slate-700">
      <div className="font-semibold text-slate-900">🚚 ข้อมูลการจัดส่ง</div>
      <div>
        <div className="font-medium">📍 กรุงเทพฯ และปริมณฑล</div>
        <div className="pl-5 text-slate-600">ส่งด่วน 1 วันทำการ (Kerry / Flash Express)</div>
      </div>
      <div>
        <div className="font-medium">🗺 ต่างจังหวัด</div>
        <div className="pl-5 text-slate-600">3-5 วันทำการ (Kerry / ไปรษณีย์ไทย)</div>
      </div>
      {kind === "computer_set" && (
        <div>
          <div className="font-medium">📦 Computer Set</div>
          <div className="pl-5 text-slate-600">ส่งฟรีใน กทม เมื่อซื้อครบ ฿5,000</div>
        </div>
      )}
    </div>
  );
}
