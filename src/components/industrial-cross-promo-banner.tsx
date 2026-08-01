import { ArrowUpRight, Factory, Cpu, MonitorSmartphone, Network, ScanEye, Printer, Boxes } from "lucide-react";

const WWW = "https://www.entgroup.co.th";

type Target = {
  label: string;
  paths: { label: string; path: string }[];
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
};

const CONSUMER_PC: Target = {
  label: "คอมพิวเตอร์สำหรับงานอุตสาหกรรม",
  icon: Cpu,
  blurb: "เครื่องรุ่นอุตสาหกรรม ทนฝุ่น ทนอุณหภูมิ ทำงาน 24/7 ไม่มีพัดลม",
  paths: [
    { label: "Mini PC", path: "/mini-pc" },
    { label: "Industrial PC", path: "/industrial-pc" },
  ],
};

const MONITOR: Target = {
  label: "จอสัมผัสอุตสาหกรรม",
  icon: MonitorSmartphone,
  blurb: "จอ Touch สำหรับหน้างานโรงงาน และจอ Interactive สำหรับห้องประชุม",
  paths: [
    { label: "Industrial Touch Monitor", path: "/industrial-touch-monitor" },
    { label: "Interactive Display", path: "/interactive-display" },
  ],
};

const NETWORK: Target = {
  label: "IoT Gateway & Firewall",
  icon: Network,
  blurb: "อุปกรณ์เครือข่ายระดับอุตสาหกรรม สำหรับโรงงานและงาน IoT",
  paths: [
    { label: "IoT Gateway", path: "/iot-gateway" },
    { label: "Mini PC Firewall", path: "/mini-pc-firewall" },
  ],
};

const VISION: Target = {
  label: "Edge AI & กล้องวิเคราะห์ภาพ",
  icon: ScanEye,
  blurb: "ประมวลผล AI ที่หน้างาน นับคน ตรวจจับวัตถุ ด้วย NVIDIA Jetson",
  paths: [
    { label: "Edge Computing", path: "/edge-computing" },
    { label: "NVIDIA Jetson", path: "/nvidia-jetson" },
  ],
};

const KIOSK: Target = {
  label: "Panel PC & ตู้ Kiosk",
  icon: Printer,
  blurb: "เครื่องหน้าร้าน/หน้างานแบบ All-in-One และตู้บริการตนเอง",
  paths: [
    { label: "Panel PC", path: "/panel-pc" },
    { label: "Kiosk", path: "/kiosk" },
  ],
};

const ACCESSORIES: Target = {
  label: "อุปกรณ์เสริมสำหรับงานอุตสาหกรรม",
  icon: Boxes,
  blurb: "ขายึด VESA, อะแดปเตอร์, สาย และอุปกรณ์ติดตั้งเกรดอุตสาหกรรม",
  paths: [{ label: "Accessories", path: "/accessories" }],
};

const FALLBACK: Target = {
  label: "สินค้า Industrial Computer",
  icon: Factory,
  blurb: "โซลูชันคอมพิวเตอร์อุตสาหกรรมครบวงจร โดย ENT Group",
  paths: [{ label: "ดูสินค้าอุตสาหกรรมทั้งหมด", path: "" }],
};

/** map หมวดสินค้าใน shop → หน้าสินค้า Industrial บน www.entgroup.co.th */
export function resolveIndustrialTarget(category?: string | null, subcategory?: string | null): Target {
  const c = `${category ?? ""} ${subcategory ?? ""}`.toLowerCase();
  if (!c.trim()) return FALLBACK;
  if (/accessor|อุปกรณ์เสริม/.test(c)) return ACCESSORIES;
  if (/notebook|laptop|desktop|aio|all.?in.?one|server|computer set|\bpc\b|component/.test(c)) return CONSUMER_PC;
  if (/monitor|จอ|display/.test(c)) return MONITOR;
  if (/network|router|switch|access point|\bap\b/.test(c)) return NETWORK;
  if (/cctv|security|webcam|camera|กล้อง|edge ai/.test(c)) return VISION;
  if (/printer|pos|barcode|scanner|label/.test(c)) return KIOSK;
  return FALLBACK;
}

export function IndustrialCrossPromoBanner({
  category,
  subcategory,
}: {
  category?: string | null;
  subcategory?: string | null;
}) {
  const t = resolveIndustrialTarget(category, subcategory);
  const Icon = t.icon;

  return (
    <aside className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            ENT Group Industrial Solutions
          </div>
          <div className="truncate text-sm font-bold sm:text-base">{t.label}</div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{t.blurb}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.paths.map((p) => (
            <a
              key={p.path || "home"}
              href={`${WWW}${p.path}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {p.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
