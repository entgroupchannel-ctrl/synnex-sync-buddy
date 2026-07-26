import { Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  BatteryCharging,
  Boxes,
  Cable,
  Camera,
  Droplets,
  HardDrive,
  MonitorPlay,
  Network,
  Plug,
  Printer,
  Receipt,
  Router,
  ScanLine,
  Server,
  ShieldCheck,
  Sun,
  Video,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CLEAR_STALE_BROWSE_FILTERS } from "@/lib/search-defaults";
import type { MegaMenuConfig, MegaMenuFilter } from "@/lib/mega-menu-config";

const ICONS: Record<string, LucideIcon> = {
  BatteryCharging,
  Boxes,
  Cable,
  Camera,
  Droplets,
  HardDrive,
  MonitorPlay,
  Network,
  Plug,
  Printer,
  Receipt,
  Router,
  ScanLine,
  Server,
  ShieldCheck,
  Sun,
  Video,
  Wifi,
  Wrench,
  Zap,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Boxes;
  return <C className={className} />;
}

/** สร้าง search params สำหรับหน้า "/" โดยล้างตัวกรองค้างเสมอ */
function buildSearch(category: string, filter: MegaMenuFilter = {}) {
  return {
    ...CLEAR_STALE_BROWSE_FILTERS,
    category,
    brands: "",
    ...filter,
    page: 1,
  } as never;
}

export function CategoryMegaMenu({ config }: { config: MegaMenuConfig }) {
  const [open, setOpen] = useState(false);
  /** ตำแหน่งซ้ายของ panel เทียบกับตัว trigger — คำนวณให้อยู่ในจอเสมอ */
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    const el = wrapRef.current;
    if (el && typeof window !== "undefined") {
      const rect = el.getBoundingClientRect();
      const margin = 12;
      const maxLeft = window.innerWidth - config.width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setOffset(left - rect.left);
    }
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to="/"
        search={buildSearch(config.category)}
        className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm transition hover:text-[color:var(--brand-orange)]"
        style={{ color: open ? "#fff" : undefined }}
      >
        <Icon name={config.triggerIcon} className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </Link>

      {open && (
        <div
          className="absolute top-full z-50 rounded-xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-slate-200"
          style={{ width: config.width, left: offset, borderTop: "3px solid #10B981" }}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1d1d1f]">
            <Icon name={config.triggerIcon} className="h-4 w-4 text-[#10B981]" />
            {config.panelTitle}
          </div>

          <div className={config.brands?.length ? "grid grid-cols-[1fr_200px] gap-5" : ""}>
            <div className="grid grid-cols-2 gap-2">
              {config.items.map((it) => (
                <Link
                  key={it.title}
                  to="/"
                  search={buildSearch(config.category, it.filter)}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-[#f5f5f7]"
                >
                  <span className="mt-0.5 text-[#10B981]">
                    <Icon name={it.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1d1d1f] group-hover:text-[#10B981]">{it.title}</div>
                    <div className="text-xs leading-snug text-slate-500">{it.sub}</div>
                  </div>
                </Link>
              ))}
            </div>

            {config.brands?.length ? (
              <div className="border-l border-slate-100 pl-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {config.brandsTitle ?? "แบรนด์"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {config.brands.map((b) => {
                    const logo = getBrandLogoUrl(b.brand);
                    return (
                      <Link
                        key={b.brand}
                        to="/"
                        search={buildSearch(config.category, { brands: b.brand })}
                        onClick={() => setOpen(false)}
                        title={b.label}
                        className="flex h-12 items-center justify-center rounded-lg bg-white px-2 ring-1 ring-slate-200 transition hover:ring-[#10B981] hover:shadow-sm"
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={`โลโก้ ${b.label}`}
                            loading="lazy"
                            className="max-h-6 max-w-full object-contain"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = "none";
                              img.parentElement?.insertAdjacentText("beforeend", b.label);
                            }}
                          />
                        ) : (
                          <span className="text-center text-[11px] font-semibold leading-tight text-slate-600">
                            {b.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {config.promo && (
            <Link
              to={config.promo.to}
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center gap-3 rounded-lg bg-[#10B981]/8 p-3 ring-1 ring-[#10B981]/20 transition hover:bg-[#10B981]/15"
            >
              <Wrench className="h-5 w-5 shrink-0 text-[#10B981]" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1d1d1f]">{config.promo.title}</div>
                <div className="text-xs text-slate-500">{config.promo.sub}</div>
              </div>
            </Link>
          )}

          <Link
            to="/"
            search={buildSearch(config.category)}
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-lg bg-[#1d1d1f] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-black"
          >
            {config.ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
