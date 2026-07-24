import type { ReactElement } from "react";

/** Best-effort warranty label per category / brand. */
export function getWarrantyLabel(category?: string | null, name?: string | null): string | null {
  const c = (category ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  if (c.includes("software")) return "ลิขสิทธิ์แท้ตลอดชีพ";
  if (n.includes("iphone") || n.includes("ipad")) return "ประกัน 1 ปี Apple";
  if (c.includes("monitor")) return "ประกัน 3 ปี";
  if (c.includes("storage") || n.includes("ssd") || n.includes("nvme")) return "ประกัน 3-5 ปี";
  if (
    c.includes("notebook") ||
    c.includes("macbook") ||
    c.includes("pc") ||
    c.includes("computer set") ||
    c.includes("คอมประกอบ") ||
    c.includes("network") ||
    c.includes("printer") ||
    c.includes("smart phone") ||
    c.includes("tablet")
  ) {
    return "ประกัน 1 ปี";
  }
  return null;
}

export function WarrantyBadge({ category, name, className = "" }: { category?: string | null; name?: string | null; className?: string }): ReactElement | null {
  const label = getWarrantyLabel(category, name);
  if (!label) return null;
  return (
    <div className={`text-[11px] font-medium text-emerald-700 ${className}`}>
      🛡 {label}
    </div>
  );
}
