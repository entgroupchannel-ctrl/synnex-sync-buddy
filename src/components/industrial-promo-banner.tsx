import bannerAsset from "@/assets/midyear-sale-2026.png.asset.json";
import { ArrowUpRight } from "lucide-react";

const INDUSTRIAL_URL = "https://www.entgroup.co.th";

type Props = {
  className?: string;
  /** compact = สำหรับหน้าใน (สูงน้อยลง) */
  compact?: boolean;
};

/**
 * แบนเนอร์โปรโมชัน Mid Year Sale 2026 — ลิงก์ไปเว็บ Industrial Computer ของ ENT Group
 */
export function IndustrialPromoBanner({ className, compact }: Props) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 ${compact ? "py-3" : "py-5"} ${className ?? ""}`}>
      <a
        href={INDUSTRIAL_URL}
        target="_blank"
        rel="noopener"
        aria-label="Mid Year Sale 2026 — ดูสินค้า Industrial Computer ที่ entgroup.co.th"
        className="group relative block overflow-hidden rounded-xl border border-amber-200/40 shadow-md transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <img
          src={bannerAsset.url}
          alt="ENT Group Mid Year Sale 2026 ลดสูงสุด 12% สินค้า Industrial Computer แถมฟรี Windows 10/11 Pro OEM"
          loading="lazy"
          width={1584}
          height={648}
          className="block h-auto w-full object-contain transition duration-500 group-hover:scale-[1.01]"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-lg sm:text-sm">
          ดูสินค้า Industrial Computer
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </a>
    </section>
  );
}
