export type BadgeType =
  | "new"
  | "hot"
  | "sale"
  | "popular"
  | "best"
  | "limited"
  | "recommended"
  | "cheap";

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; bg: string; text: string; icon: string; pulse: boolean }
> = {
  new: { label: "NEW", bg: "bg-blue-500", text: "text-white", icon: "✨", pulse: true },
  hot: { label: "HOT", bg: "bg-red-500", text: "text-white", icon: "🔥", pulse: true },
  sale: { label: "SALE", bg: "bg-orange-500", text: "text-white", icon: "🏷️", pulse: false },
  popular: { label: "ยอดนิยม", bg: "bg-purple-500", text: "text-white", icon: "⭐", pulse: false },
  best: { label: "ขายดี", bg: "bg-green-500", text: "text-white", icon: "🏆", pulse: false },
  limited: { label: "LIMITED", bg: "bg-slate-800", text: "text-white", icon: "⚡", pulse: true },
  recommended: { label: "แนะนำ", bg: "bg-teal-500", text: "text-white", icon: "👍", pulse: false },
  cheap: { label: "ราคาดี", bg: "bg-yellow-400", text: "text-slate-900", icon: "💰", pulse: false },
};

export function SaleBadge({ type, className = "" }: { type: BadgeType; className?: string }) {
  const c = BADGE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none shadow-sm ${c.bg} ${c.text} ${
        c.pulse ? "animate-pulse" : ""
      } ${className}`}
    >
      <span aria-hidden>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
}

export function UrgencyIndicator({ index }: { index: number }) {
  const items = [
    { text: "🔴 เหลือน้อย!", cls: "text-red-600" },
    { text: "👁️ 12 คนดูอยู่", cls: "text-orange-600" },
    { text: "✅ พร้อมส่งวันนี้", cls: "text-green-600" },
    { text: "🚚 ส่งฟรี กทม.", cls: "text-blue-600" },
    { text: "⭐ ลูกค้านิยม", cls: "text-purple-600" },
  ];
  const item = items[index % items.length];
  return <div className={`text-[11px] font-medium ${item.cls}`}>{item.text}</div>;
}
