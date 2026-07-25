import type { ReactNode } from "react";
import {
  Sparkles,
  Flame,
  Tag,
  Star,
  Trophy,
  Zap,
  ThumbsUp,
  BadgeDollarSign,
  AlertCircle,
  Eye,
  CheckCircle,
  Truck,
} from "lucide-react";

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
  { label: string; bg: string; text: string; icon: ReactNode; pulse: boolean }
> = {
  new: { label: "NEW", bg: "bg-blue-500", text: "text-white", icon: <Sparkles className="h-3 w-3" />, pulse: true },
  hot: { label: "HOT", bg: "bg-red-500", text: "text-white", icon: <Flame className="h-3 w-3" />, pulse: true },
  sale: { label: "SALE", bg: "bg-orange-500", text: "text-white", icon: <Tag className="h-3 w-3" />, pulse: false },
  popular: { label: "ยอดนิยม", bg: "bg-purple-500", text: "text-white", icon: <Star className="h-3 w-3" />, pulse: false },
  best: { label: "ขายดี", bg: "bg-green-500", text: "text-white", icon: <Trophy className="h-3 w-3" />, pulse: false },
  limited: { label: "LIMITED", bg: "bg-slate-800", text: "text-white", icon: <Zap className="h-3 w-3" />, pulse: true },
  recommended: { label: "แนะนำ", bg: "bg-teal-500", text: "text-white", icon: <ThumbsUp className="h-3 w-3" />, pulse: false },
  cheap: { label: "ราคาดี", bg: "bg-yellow-400", text: "text-slate-900", icon: <BadgeDollarSign className="h-3 w-3" />, pulse: false },
};

export function SaleBadge({ type, className = "" }: { type: BadgeType; className?: string }) {
  const c = BADGE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none shadow-sm ${c.bg} ${c.text} ${
        c.pulse ? "animate-pulse" : ""
      } ${className}`}
    >
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
}

export function UrgencyIndicator({ index }: { index: number }) {
  const items: { icon: ReactNode; text: string; cls: string }[] = [
    { icon: <AlertCircle className="h-3 w-3 animate-pulse" />, text: "เหลือน้อย!", cls: "text-red-600" },
    { icon: <Eye className="h-3 w-3" />, text: "12 คนดูอยู่", cls: "text-orange-600" },
    { icon: <CheckCircle className="h-3 w-3" />, text: "พร้อมส่งวันนี้", cls: "text-green-600" },
    { icon: <Truck className="h-3 w-3" />, text: "ส่งฟรี กทม.", cls: "text-blue-600" },
    { icon: <Star className="h-3 w-3" />, text: "ลูกค้านิยม", cls: "text-purple-600" },
  ];
  const item = items[index % items.length];
  return (
    <div className={`inline-flex items-center gap-1 text-[11px] font-medium ${item.cls}`}>
      {item.icon}
      {item.text}
    </div>
  );
}
