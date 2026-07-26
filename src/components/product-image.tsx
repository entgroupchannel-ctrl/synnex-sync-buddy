import { useEffect, useState } from "react";
import { Cpu, MemoryStick, HardDrive, CircuitBoard, Fan, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  fallbackLabel?: string;
  loading?: "eager" | "lazy";
  category?: string | null;
  productName?: string | null;
};

function pickIcon(category?: string | null, name?: string | null): { Icon: LucideIcon; color: string } {
  const hay = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  if (/gpu|graphic|geforce|radeon|rtx|gtx|\brx ?\d/.test(hay)) return { Icon: Fan, color: "text-purple-400" };
  if (/\bcpu\b|processor|ryzen|core i\d|threadripper/.test(hay)) return { Icon: Cpu, color: "text-blue-400" };
  if (/\bram\b|ddr\d|memory/.test(hay)) return { Icon: MemoryStick, color: "text-emerald-400" };
  if (/ssd|nvme|hdd|hard disk|storage/.test(hay)) return { Icon: HardDrive, color: "text-slate-400" };
  if (/motherboard|mainboard|mobo/.test(hay)) return { Icon: CircuitBoard, color: "text-green-400" };
  return { Icon: Package, color: "text-slate-300" };
}

function computerSetPlaceholder(name?: string | null): string {
  const n = (name ?? "").toLowerCase();
  if (/ryzen|amd/.test(n)) return "/case-placeholders/red-black.svg";
  if (/intel|core (i|ultra)/.test(n)) {
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 1000;
    return hash % 2 === 0 ? "/case-placeholders/black-rgb.svg" : "/case-placeholders/white-rgb.svg";
  }
  return "/case-placeholders/silver-minimal.svg";
}

export function ProductImage({
  src,
  alt = "",
  className = "h-full w-full object-contain",
  iconClassName = "h-10 w-10",
  fallbackLabel = "ไม่มีรูปสินค้า",
  loading = "lazy",
  category,
  productName,
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (category === "Computer Set") {
    const placeholder = computerSetPlaceholder(productName ?? alt);
    return <img src={placeholder} alt={alt} loading={loading} className={className} />;
  }

  if (error || !src) {
    const { Icon, color } = pickIcon(category, productName ?? alt);
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-md bg-gradient-to-br from-slate-50 to-slate-100">
        <Icon className={`${iconClassName} ${color}`} strokeWidth={1.5} />
        <span className="text-[11px] text-slate-400">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setError(true)}
      className={className}
    />
  );
}
