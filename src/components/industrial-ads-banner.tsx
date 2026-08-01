import { ArrowUpRight, Factory } from "lucide-react";
import adIndustrialPc from "@/assets/industrial-ads/ad-industrial-pc.jpg";
import adPanelPc from "@/assets/industrial-ads/ad-panel-pc.jpg";
import adEdgeAi from "@/assets/industrial-ads/ad-edge-ai.jpg";
import adIotNetwork from "@/assets/industrial-ads/ad-iot-network.jpg";
import adKiosk from "@/assets/industrial-ads/ad-kiosk.jpg";

const WWW = "https://www.entgroup.co.th";

export type IndustrialAdKey = "industrial-pc" | "panel-pc" | "edge-ai" | "iot-network" | "kiosk";

export type IndustrialAd = {
  key: IndustrialAdKey;
  image: string;
  eyebrow: string;
  title: string;
  blurb: string;
  cta: string;
  path: string;
};

export const INDUSTRIAL_ADS: IndustrialAd[] = [
  {
    key: "industrial-pc",
    image: adIndustrialPc,
    eyebrow: "Industrial Computer",
    title: "Mini PC / Industrial PC ไร้พัดลม ทำงาน 24/7",
    blurb: "ทนฝุ่น ทนอุณหภูมิ -20~60°C พอร์ต COM/DIO ครบ สำหรับโรงงานและงานควบคุมเครื่องจักร",
    cta: "ดู Industrial PC",
    path: "/industrial-pc",
  },
  {
    key: "panel-pc",
    image: adPanelPc,
    eyebrow: "Panel PC & Touch Monitor",
    title: "จอสัมผัสอุตสาหกรรม IP65 ติดหน้าไลน์ผลิต",
    blurb: "All-in-One Panel PC และจอ Touch กันน้ำกันฝุ่น ใช้กับ MES/SCADA ได้ทันที",
    cta: "ดู Panel PC",
    path: "/panel-pc",
  },
  {
    key: "edge-ai",
    image: adEdgeAi,
    eyebrow: "Edge AI & Vision",
    title: "Edge AI Box นับคน ตรวจจับวัตถุ ด้วย NVIDIA Jetson",
    blurb: "ประมวลผล AI ที่หน้างาน ไม่ต้องส่งขึ้นคลาวด์ ต่อกล้องได้หลายตัว",
    cta: "ดู Edge AI",
    path: "/edge-computing",
  },
  {
    key: "iot-network",
    image: adIotNetwork,
    eyebrow: "IoT Gateway & Network",
    title: "IoT Gateway และสวิตช์เกรดอุตสาหกรรม",
    blurb: "DIN-rail, PoE, Fiber, ไฟสำรอง 2 ชุด สำหรับตู้คอนโทรลและงานกลางแจ้ง",
    cta: "ดู IoT Gateway",
    path: "/iot-gateway",
  },
  {
    key: "kiosk",
    image: adKiosk,
    eyebrow: "Kiosk & Rugged Tablet",
    title: "ตู้ Kiosk บริการตนเอง และแท็บเล็ตทนงานหนัก",
    blurb: "สั่งอาหาร ลงทะเบียน ชำระเงิน พร้อมอุปกรณ์ต่อพ่วงครบ ติดตั้งโดยทีมงานไทย",
    cta: "ดู Kiosk",
    path: "/kiosk",
  },
];

export function pickIndustrialAd(category?: string | null, subcategory?: string | null): IndustrialAd {
  const c = `${category ?? ""} ${subcategory ?? ""}`.toLowerCase();
  const by = (k: IndustrialAdKey) => INDUSTRIAL_ADS.find((a) => a.key === k)!;
  if (/monitor|จอ|display|pos|printer|kiosk|barcode|scanner/.test(c)) return by("kiosk");
  if (/cctv|camera|กล้อง|edge ai|jetson|gpu/.test(c)) return by("edge-ai");
  if (/network|router|switch|access point|\bap\b|iot/.test(c)) return by("iot-network");
  if (/tablet|touch|panel/.test(c)) return by("panel-pc");
  return by("industrial-pc");
}

/** แบนเนอร์ภาพเดี่ยว — ใช้แทรกในหน้าต่างๆ */
export function IndustrialAdBanner({
  ad,
  category,
  subcategory,
  className = "",
}: {
  ad?: IndustrialAdKey;
  category?: string | null;
  subcategory?: string | null;
  className?: string;
}) {
  const item = ad ? INDUSTRIAL_ADS.find((a) => a.key === ad)! : pickIndustrialAd(category, subcategory);
  return (
    <a
      href={`${WWW}${item.path}`}
      target="_blank"
      rel="noopener"
      className={`group relative block overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${className}`}
    >
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        width={1280}
        height={640}
        className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
      <div className="relative flex min-h-[168px] flex-col justify-center gap-1.5 p-5 sm:min-h-[196px] sm:max-w-[62%]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Factory className="h-3.5 w-3.5" /> {item.eyebrow}
        </div>
        <h3 className="text-base font-bold leading-snug text-slate-50 sm:text-lg">{item.title}</h3>
        <p className="text-xs leading-relaxed text-slate-300">{item.blurb}</p>
        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          {item.cta}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}

/** กริดรวมทั้ง 5 ภาพ — ใช้ในหน้าแรก / หน้า corporate */
export function IndustrialAdsGrid() {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">โซลูชันคอมพิวเตอร์อุตสาหกรรม โดย ENT Group</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            เครื่องเกรดอุตสาหกรรม ทนงานหนัก ใช้ในโรงงาน ร้านค้า และงาน AI หน้างาน
          </p>
        </div>
        <a
          href={WWW}
          target="_blank"
          rel="noopener"
          className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline sm:inline-flex"
        >
          ดูทั้งหมด <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <IndustrialAdBanner ad="industrial-pc" className="lg:col-span-2" />
        <IndustrialAdBanner ad="edge-ai" />
        <IndustrialAdBanner ad="panel-pc" />
        <IndustrialAdBanner ad="iot-network" />
        <IndustrialAdBanner ad="kiosk" />
      </div>
    </section>
  );
}

/** แถบเล็กท้ายเว็บ — แสดงทุกหน้า */
export function IndustrialAdsFooterStrip() {
  return (
    <div className="border-t border-slate-800 py-6">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          ENT Group Industrial Solutions
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {INDUSTRIAL_ADS.map((a) => (
            <a
              key={a.key}
              href={`${WWW}${a.path}`}
              target="_blank"
              rel="noopener"
              className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              <img
                src={a.image}
                alt={a.title}
                loading="lazy"
                width={1280}
                height={640}
                className="h-20 w-full object-cover opacity-80 transition group-hover:opacity-100"
              />
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-200">{a.eyebrow}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
