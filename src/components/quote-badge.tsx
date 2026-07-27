import { FileText } from "lucide-react";

type Props = {
  sellingPrice?: number | null;
  fulfillmentType?: string | null;
  className?: string;
  size?: "sm" | "md";
};

export function needsQuote(
  sellingPrice?: number | null,
  fulfillmentType?: string | null,
): boolean {
  return (sellingPrice == null || sellingPrice === 0) || fulfillmentType === "by_order";
}

export function QuoteBadge({ sellingPrice, fulfillmentType, className = "", size = "sm" }: Props) {
  if (!needsQuote(sellingPrice, fulfillmentType)) return null;
  const isSmall = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ${className}`}
    >
      <FileText className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ขอใบเสนอราคา
    </span>
  );
}
