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
  distributor?: string | null;
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

/** รูป UPS แบบ "ภาพแทน" (generated) — เลือกตามขนาด VA และชื่อรุ่นแบบคงที่ */
const UPS_IMAGES = [
  "/ups-placeholders/ups-1.png",
  "/ups-placeholders/ups-2.png",
  "/ups-placeholders/ups-3.png",
  "/ups-placeholders/ups-4.png",
  "/ups-placeholders/ups-5.png",
];

export function upsPlaceholder(name?: string | null): string {
  const n = (name ?? "").toUpperCase();
  const va = Number(n.match(/(\d{3,5})\s*VA/)?.[1] ?? 0);
  if (va >= 3000) return UPS_IMAGES[3];
  if (va >= 1500) return UPS_IMAGES[1];
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 100000;
  return [UPS_IMAGES[0], UPS_IMAGES[2], UPS_IMAGES[4]][hash % 3];
}
/** รูป CPU แบบ "ภาพแทน" — ใช้แทนภาพที่มีลายน้ำจากดิสทริบิวเตอร์ */
const CPU_IMAGES = [
  "/cpu-placeholders/cpu-1.png",
  "/cpu-placeholders/cpu-2.png",
  "/cpu-placeholders/cpu-3.png",
  "/cpu-placeholders/cpu-4.png",
];

export function cpuPlaceholder(name?: string | null): string {
  const n = (name ?? "").toUpperCase();
  if (/AMD|RYZEN|ATHLON/.test(n)) return CPU_IMAGES[0];
  if (/INTEL|CORE I|PENTIUM|CELERON|ULTRA/.test(n)) return CPU_IMAGES[3];
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 100000;
  return [CPU_IMAGES[1], CPU_IMAGES[2]][hash % 2];
}

export function isCpuProduct(category?: string | null, subcategory?: string | null, name?: string | null) {
  if (subcategory === "CPU" || category === "CPU") return true;
  return /^\s*cpu\b/i.test(name ?? "");
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
  distributor,
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (category === "Computer Set") {
    const placeholder = computerSetPlaceholder(productName ?? alt);
    return <img src={placeholder} alt={alt} loading={loading} className={className} />;
  }

  // UPS จาก ADVICE ใช้ภาพแทนที่สร้างไว้ ส่วน SYNNEX ใช้ภาพจริง
  if (category === "UPS" && ((distributor ?? "").toUpperCase() === "ADVICE" || error || !src)) {
    return (
      <div className="relative h-full w-full">
        <img
          src={upsPlaceholder(productName ?? alt)}
          alt={alt}
          loading={loading}
          className={className}
        />
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          ภาพแทน
        </span>
      </div>
    );
  }

  // CPU จาก ADVICE มีลายน้ำในภาพต้นทาง → ใช้ภาพแทนที่สร้างไว้
  if (
    isCpuProduct(category, subcategory, productName ?? alt) &&
    ((distributor ?? "").toUpperCase() === "ADVICE" || error || !src)
  ) {
    return (
      <div className="relative h-full w-full">
        <img
          src={cpuPlaceholder(productName ?? alt)}
          alt={alt}
          loading={loading}
          className={className}
        />
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          ภาพแทน
        </span>
      </div>
    );
  }


  if ((error || !src) && isSlipPrinter(subcategory, productName ?? alt)) {
    return (
      <img
        src={slipPrinterPlaceholder(productName ?? alt)}
        alt={alt}
        loading={loading}
        className={className}
      />
    );
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
