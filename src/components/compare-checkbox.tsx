import { Scale } from "lucide-react";
import { useCompare, type CompareItem } from "@/lib/compare-store";

/**
 * ปุ่มติ๊กเพื่อเลือกสินค้าไปเปรียบเทียบ — วางทับมุมการ์ดสินค้า
 * ป้องกันการคลิกทะลุไปเปิดหน้าสินค้า (stopPropagation + preventDefault)
 */
export function CompareCheckbox({
  item,
  className = "",
}: {
  item: CompareItem;
  className?: string;
}) {
  const { isSelected, toggle } = useCompare();
  const selected = isSelected(item.id);

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? "เอาออกจากรายการเปรียบเทียบ" : "เพิ่มเข้ารายการเปรียบเทียบ"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
        selected
          ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-navy)] text-white"
          : "border-slate-200 bg-white/90 text-slate-600 hover:border-[color:var(--brand-navy)] hover:text-[color:var(--brand-navy)]"
      } ${className}`}
    >
      <Scale className="h-3 w-3" />
      {selected ? "เทียบอยู่" : "เทียบ"}
    </button>
  );
}
