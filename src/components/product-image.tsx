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
  ramGeneration?: string | null;
  subcategory?: string | null;
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

export function computerSetPlaceholder(name?: string | null): string {
  const n = (name ?? "").toLowerCase();
  if (/ryzen|amd/.test(n)) return "/case-placeholders/red-black.png";
  if (/intel|core (i|ultra)/.test(n)) {
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 1000;
    return hash % 2 === 0 ? "/case-placeholders/black-rgb.png" : "/case-placeholders/white-rgb.png";
  }
  return "/case-placeholders/silver-minimal.png";
}

/** เลือกรูป placeholder ของแรมตามรุ่นและประเภท */
export function ramPlaceholder(
  ramGeneration?: string | null,
  subcategory?: string | null,
): string {
  const isNotebook = subcategory === "RAM Notebook";
  const gen = (ramGeneration ?? "").toUpperCase();
  if (isNotebook) {
    return gen === "DDR5"
      ? "/ram-placeholders/ddr5-sodimm.png"
      : "/ram-placeholders/ddr4-sodimm.png";
  }
  if (gen === "DDR5") return "/ram-placeholders/ddr5-desktop.png";
  if (gen === "DDR4") return "/ram-placeholders/ddr4-desktop.png";
  return "/ram-placeholders/ddr3-desktop.png";
}

const SLIP_PRINTER_IMAGES = [
  "/printer-placeholders/slip-front.png",
  "/printer-placeholders/slip-plain.png",
  "/printer-placeholders/slip-receipt.png",
  "/printer-placeholders/slip-roll.png",
  "/printer-placeholders/slip-ports.png",
];

/** เลือกรูป placeholder เครื่องพิมพ์ใบเสร็จแบบคงที่ตามชื่อสินค้า */
export function slipPrinterPlaceholder(name?: string | null): string {
  const n = (name ?? "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 100000;
  return SLIP_PRINTER_IMAGES[hash % SLIP_PRINTER_IMAGES.length];
}

function isSlipPrinter(subcategory?: string | null, name?: string | null) {
  if (subcategory === "Slip Printer") return true;
  return /slip|ใบเสร็จ|receipt|thermal|tm-t\d|pos printer/i.test(name ?? "");
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
  ramGeneration,
  subcategory,
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (category === "Computer Set") {
    const placeholder = computerSetPlaceholder(productName ?? alt);
    return <img src={placeholder} alt={alt} loading={loading} className={className} />;
  }

  if (category === "RAM" && (error || !src)) {
    return (
      <img
        src={ramPlaceholder(ramGeneration, subcategory)}
        alt={alt}
        loading={loading}
        className={className}
      />
    );
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
