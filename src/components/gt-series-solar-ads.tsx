import { ArrowUpRight, Sun } from "lucide-react";
import iboxGt from "@/assets/gt-series/ibox-gt-series.png.asset.json";
import iboxGty from "@/assets/gt-series/ibox-gty-series.png.asset.json";
import gtIo from "@/assets/gt-series/gt-series-io.png.asset.json";
import gtMulti from "@/assets/gt-series/gt-series-multidisplay.png.asset.json";

const GT_URL = "https://entgroup.co.th/gt-series";

const ADS = [
  { src: iboxGt.url, alt: "IBOX-GT Series Industrial Box PC ทนทาน Fanless 24/7" },
  { src: iboxGty.url, alt: "IBOX-GTY Series High-Performance Industrial PC Multi-LAN Multi-Display" },
  { src: gtIo.url, alt: "GT Series COM GPIO Dual LAN WiFi ครบทุก I/O อุตสาหกรรม" },
  { src: gtMulti.url, alt: "GT Series Multi-Display 4x HDMI Dual LAN USB 3.0" },
];

/** แบนเนอร์ GT Series — ใช้คู่กับงานติดตั้ง Solar (ควบคุม/มอนิเตอร์ระบบ 24/7) */
export function GtSeriesSolarAds({ className = "" }: { className?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Sun className="h-3.5 w-3.5" /> ใช้คู่กับงานติดตั้ง Solar Cell
          </div>
          <h2 className="text-base font-bold text-slate-50 sm:text-lg">
            GT Series — Industrial Box PC สำหรับมอนิเตอร์และควบคุมระบบโซลาร์ 24/7
          </h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Fanless ทนฝุ่น −40°C ~ 70°C · COM/GPIO/Dual LAN/WiFi ครบ · Mid Year Sale ลดสูงสุด 12%
          </p>
        </div>
        <a
          href={GT_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          ดู GT Series ทั้งหมด <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ADS.map((a) => (
          <a
            key={a.src}
            href={GT_URL}
            target="_blank"
            rel="noopener"
            className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
          >
            <img
              src={a.src}
              alt={a.alt}
              loading="lazy"
              width={1040}
              height={1040}
              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
