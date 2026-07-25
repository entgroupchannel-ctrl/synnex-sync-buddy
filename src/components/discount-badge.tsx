import type { ReactNode } from "react";

export function getDiscountPct(
  sellingPrice: number | null | undefined,
  discountPrice: number | null | undefined,
): number | null {
  if (!sellingPrice || !discountPrice) return null;
  if (discountPrice >= sellingPrice) return null;
  const pct = Math.round((1 - discountPrice / sellingPrice) * 100);
  return pct >= 5 ? pct : null;
}

function b2bColor(pct: number): string {
  if (pct >= 20) return "bg-red-500 animate-pulse";
  if (pct >= 15) return "bg-orange-500";
  if (pct >= 10) return "bg-green-500";
  return "bg-blue-500";
}

type B2BBadgeProps = {
  sellingPrice: number | null | undefined;
  b2bPrice: number | null | undefined;
  className?: string;
};

/** Small B2B discount badge with hover tooltip. Renders nothing below 5%. */
export function B2BBadge({ sellingPrice, b2bPrice, className }: B2BBadgeProps) {
  const pct = getDiscountPct(sellingPrice, b2bPrice);
  if (!pct) return null;
  return (
    <div className={`relative group inline-block ${className ?? ""}`}>
      <span
        className={`inline-flex items-center gap-0.5 rounded-full ${b2bColor(pct)} px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer`}
      >
        B2B -{pct}%
      </span>
      <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl group-hover:block">
        ราคาพิเศษสำหรับองค์กร
        <br />
        <span className="font-bold text-blue-300">
          ฿{Number(b2bPrice).toLocaleString("th-TH")}
        </span>
        <span className="text-slate-400"> (ประหยัด -{pct}%)</span>
        <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}

type MemberBadgeProps = {
  sellingPrice: number | null | undefined;
  memberPrice: number | null | undefined;
  className?: string;
};

export function MemberBadge({ sellingPrice, memberPrice, className }: MemberBadgeProps) {
  const pct = getDiscountPct(sellingPrice, memberPrice);
  if (!pct) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900 ${className ?? ""}`}
    >
      สมาชิก -{pct}%
    </span>
  );
}

type BadgeRowProps = {
  sellingPrice: number | null | undefined;
  b2bPrice?: number | null;
  memberPrice?: number | null;
  className?: string;
  children?: ReactNode;
};

/** Row of discount badges. Renders nothing when no discounts qualify. */
export function DiscountBadgeRow({
  sellingPrice,
  b2bPrice,
  memberPrice,
  className,
  children,
}: BadgeRowProps) {
  const b2b = getDiscountPct(sellingPrice, b2bPrice);
  const member = getDiscountPct(sellingPrice, memberPrice);
  if (!b2b && !member && !children) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {b2b ? <B2BBadge sellingPrice={sellingPrice} b2bPrice={b2bPrice} /> : null}
      {member ? (
        <MemberBadge sellingPrice={sellingPrice} memberPrice={memberPrice} />
      ) : null}
      {children}
    </div>
  );
}

type LargeB2BBadgeProps = {
  sellingPrice: number | null | undefined;
  b2bPrice: number | null | undefined;
  className?: string;
};

/** Large B2B badge for product detail pages, includes baht savings. */
export function B2BBadgeLarge({ sellingPrice, b2bPrice, className }: LargeB2BBadgeProps) {
  const pct = getDiscountPct(sellingPrice, b2bPrice);
  if (!pct || !sellingPrice || !b2bPrice) return null;
  const saving = Math.round(sellingPrice - b2bPrice);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white ${className ?? ""}`}
    >
      💼 B2B ประหยัด {pct}% = ฿{saving.toLocaleString("th-TH")}
    </span>
  );
}
