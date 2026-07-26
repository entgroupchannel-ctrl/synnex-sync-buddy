import { Info } from "lucide-react";
import { VAT_NOTES } from "@/lib/order-helpers";

export const VAT_EXCLUSIVE_LABEL = "ราคาไม่รวม VAT 7%";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

/** Standard "prices exclude 7% VAT" note used across the storefront. */
export function VatNote({ size = "sm", className = "" }: Props) {
  const sizeCls = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <div className={`${sizeCls} leading-tight text-slate-500 ${className}`}>
      {VAT_EXCLUSIVE_LABEL}
    </div>
  );
}

/** Fuller note for cart / checkout / quotation summaries. */
export function VatNoteDetailed({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200 ${className}`}
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <div>
          <div className="font-semibold text-slate-700">{VAT_EXCLUSIVE_LABEL}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {VAT_NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
