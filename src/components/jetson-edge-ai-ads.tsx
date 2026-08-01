import { ArrowUpRight, Cpu } from "lucide-react";
import ad1 from "@/assets/jetson/jetson-ad-1.jpg.asset.json";
import ad2 from "@/assets/jetson/jetson-ad-2.jpg.asset.json";
import ad3 from "@/assets/jetson/jetson-ad-3.jpg.asset.json";
import ad4 from "@/assets/jetson/jetson-ad-4.jpg.asset.json";

const JETSON_URL = "https://entgroup.co.th/nvidia-jetson";

const ADS = [
  { src: ad1.url, alt: "NVIDIA Jetson Edge AI IPC รุ่น 11F1E2 Orin NX/Nano สูงสุด 157 TOPS โดย ENT Group" },
  { src: ad2.url, alt: "I/O ครบสำหรับงานอุตสาหกรรม 2x GigE, 4x USB 3.0, HDMI, 4x COM, CAN, GPIO, 4G SIM" },
  { src: ad3.url, alt: "Edge AI สำหรับ Machine Vision, AGV/AMR, Predictive Maintenance และ Smart City" },
  { src: ad4.url, alt: "ทำไมต้องซื้อกับ ENT Group — ตัวแทนจำหน่ายอย่างเป็นทางการ รับประกัน 1 ปี บริการ Onsite" },
];

/** Jetson Ads — สำหรับหมวด Edge AI Box (NVIDIA Jetson Industrial AI PC) */
export function JetsonEdgeAiAds({ className = "" }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#04140B] via-[#0A2416] to-[#050B18] p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-lime-400/50 bg-lime-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-lime-200">
            <Cpu className="h-3.5 w-3.5" /> NVIDIA Elite Partner · PLink-AI
          </div>
          <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            Edge AI Box <span className="text-lime-300">NVIDIA Jetson Orin</span>
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            Fanless Industrial AI PC สูงสุด 157 TOPS · I/O ครบ GigE / COM / CAN / GPIO / 4G — จำหน่ายและบริการโดย ENT Group
          </p>
        </div>
        <a
          href={JETSON_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-400"
        >
          ดูรุ่น NVIDIA Jetson <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ADS.map((ad) => (
          <a
            key={ad.src}
            href={JETSON_URL}
            target="_blank"
            rel="noopener"
            className="group relative overflow-hidden rounded-xl border border-white/15 bg-white"
          >
            <img
              src={ad.src}
              alt={ad.alt}
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-lime-500 text-slate-950 opacity-0 transition group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
