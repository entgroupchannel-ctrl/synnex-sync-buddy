import type { ReactElement } from "react";

type Props = {
  stockQty?: number | null;
  fulfillmentType?: string | null;
  stockStatus?: string | null;
  distributor?: string | null;
  className?: string;
};

const styles: Record<string, string> = {
  green: "bg-[#dcfce7] text-[#15803d]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  orange: "bg-[#ffedd5] text-[#c2410c]",
  red: "bg-[#fee2e2] text-[#b91c1c]",
  gray: "bg-[#f1f5f9] text-[#64748b]",
  blue: "bg-[#dbeafe] text-[#1d4ed8]",
};

export function getStockBadge(
  stockQty?: number | null,
  fulfillmentType?: string | null,
  stockStatus?: string | null,
  distributor?: string | null,
):
  | { label: string; tone: keyof typeof styles }
  | null {
  if (fulfillmentType === "by_order") return { label: "By Order ~30 วัน", tone: "blue" };
  const q = stockQty ?? 0;
  // Out of stock explicit
  if (stockStatus === "สินค้าหมด") return { label: "สินค้าหมด", tone: "gray" };
  // No reliable qty (ADVICE or qty=0 but ready): show nothing, ready state handled elsewhere
  const unreliable = (distributor ?? "").toUpperCase() === "ADVICE";
  if (unreliable || q <= 0) return null;
  if (q === 1) return { label: "เหลือ 1 ชิ้นสุดท้าย!", tone: "red" };
  if (q <= 4) return { label: `เหลือ ${q} ชิ้น`, tone: "red" };
  if (q <= 9) return { label: "เหลือน้อย", tone: "orange" };
  if (q <= 19) return { label: "ใกล้หมด", tone: "amber" };
  if (q <= 49) return { label: "มีสินค้า", tone: "green" };
  return null;
}

export function StockBadge({ stockQty, fulfillmentType, stockStatus, distributor, className = "" }: Props): ReactElement | null {
  const b = getStockBadge(stockQty, fulfillmentType, stockStatus, distributor);
  if (!b) return null;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[b.tone]} ${className}`}
    >
      {b.label}
    </span>
  );
}
