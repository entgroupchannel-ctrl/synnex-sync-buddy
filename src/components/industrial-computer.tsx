import { ArrowUpRight, Shield, Cpu, Thermometer, Factory } from "lucide-react";
import ruggedTablet from "@/assets/industrial/rugged-tablet.asset.json";
import panelPc from "@/assets/industrial/panel-pc.asset.json";
import miniPc from "@/assets/industrial/mini-pc.asset.json";
import jetsonIpc from "@/assets/industrial/jetson-ipc.asset.json";
import aiKiosk from "@/assets/industrial/ai-kiosk.asset.json";
import selfOrderKiosk from "@/assets/industrial/self-order-kiosk.asset.json";

const EXTERNAL_URL = "https://www.entgroup.co.th";

type Tile = {
  src: string;
  title: string;
  subtitle: string;
  href: string;
  className: string;
};

const TILES: Tile[] = [
  {
    src: jetsonIpc.url,
    title: "NVIDIA Jetson Edge AI IPC",
    subtitle: "Orin NX/Nano · สูงสุด 157 TOPS · Fanless MIL-Grade",
    href: `${EXTERNAL_URL}/edge-ai`,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: ruggedTablet.url,
    title: "Rugged Tablet / Handheld",
    subtitle: "IP65 · Barcode / RFID · Windows 11",
    href: `${EXTERNAL_URL}/rugged-tablet`,
    className: "md:col-span-2",
  },
  {
    src: panelPc.url,
    title: "Industrial Panel PC",
    subtitle: 'GK1004 · 10.4" Touch · Core i5 Gen 11',
    href: `${EXTERNAL_URL}/panel-pc`,
    className: "",
  },
  {
    src: miniPc.url,
    title: "Fanless Mini PC · IPC-118",
    subtitle: "Dual LAN + HDMI + VGA · Intel N100",
    href: `${EXTERNAL_URL}/mini-pc`,
    className: "",
  },
  {
    src: aiKiosk.url,
    title: "AI Self-Order Kiosk",
    subtitle: "Personalized Menu · NVIDIA Jetson",
    href: `${EXTERNAL_URL}/kiosk`,
    className: "",
  },
  {
    src: selfOrderKiosk.url,
    title: "Kiosk 3 รูปแบบ",
    subtitle: "Floor / Counter / Wall — QSR · Café · Food Court",
    href: `${EXTERNAL_URL}/kiosk`,
    className: "",
  },
];

const FEATURES = [
  { icon: Shield, label: "IP65 / MIL-Grade", sub: "กันน้ำ กันฝุ่น ทนสั่นสะเทือน" },
  { icon: Thermometer, label: "−25°C ถึง 65°C", sub: "รันได้ทุกสภาพหน้างาน" },
  { icon: Cpu, label: "Edge AI Ready", sub: "NVIDIA Jetson · Elite Partner" },
  { icon: Factory, label: "Industrial Grade", sub: "ออกแบบสำหรับโรงงาน 24/7" },
];

export function IndustrialComputer() {
  return (
    <section className="mt-10 mb-10">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0B1E3F] via-[#0F2A5C] to-[#0B1E3F] text-white relative">
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative p-5 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium tracking-wide">
                <Factory className="w-3.5 h-3.5" />
                Industrial Solution · ENT Group
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mt-3 leading-tight">
                Industrial Grade Computer
              </h2>
              <p className="text-white/70 text-sm md:text-base mt-1 max-w-2xl">
                คอมพิวเตอร์อุตสาหกรรม · Rugged Tablet · Panel PC · Edge AI · Kiosk
                — ออกแบบสำหรับโรงงาน คลังสินค้า และงานภาคสนามโดยเฉพาะ
              </p>
            </div>
            <a
              href={EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0B1E3F] font-semibold text-sm hover:bg-white/90 transition shadow-lg self-start md:self-auto"
            >
              เข้าสู่ entgroup.co.th
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-3">
            {TILES.map((t) => (
              <a
                key={t.title}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/30 transition ${t.className}`}
              >
                <img
                  src={t.src}
                  alt={t.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04122B]/95 via-[#04122B]/30 to-transparent" />
                <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end">
                  <div className="text-white font-semibold text-sm md:text-base leading-tight drop-shadow">
                    {t.title}
                  </div>
                  <div className="text-white/80 text-[11px] md:text-xs mt-0.5 line-clamp-2">
                    {t.subtitle}
                  </div>
                </div>
                <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 text-[#0B1E3F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>

          {/* Feature strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-400/15 text-emerald-300 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{f.label}</div>
                  <div className="text-[11px] text-white/60 truncate">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm">
              <div className="font-semibold">มองหาสินค้าอุตสาหกรรม? ปรึกษาทีม ENT Group</div>
              <div className="text-white/70 text-xs mt-0.5">
                Industrial Computer · Automation · Edge AI — ครบทุก Solution
              </div>
            </div>
            <a
              href={EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#04122B] font-semibold text-sm transition"
            >
              ดูสินค้าทั้งหมดที่ entgroup.co.th
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
