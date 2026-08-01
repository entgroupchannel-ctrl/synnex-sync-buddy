import { ArrowUpRight, Network } from "lucide-react";
import hero from "@/assets/volktek/volktek-hero.png.asset.json";
import quality from "@/assets/volktek/volktek-quality.png.asset.json";
import taiwan from "@/assets/volktek/volktek-taiwan.png.asset.json";

const VOLKTEK_URL = "https://entgroup.co.th/volktek";

const ADS = [
  { src: hero.url, alt: "Volktek เครือข่ายอุตสาหกรรมที่วางใจได้ — ตัวแทนจำหน่ายอย่างเป็นทางการในไทยโดย ENT Group" },
  { src: quality.url, alt: "Volktek สวิตช์อุตสาหกรรมระดับพรีเมียม ทนทาน ซัพพอร์ตยาว คุ้มค่าระยะยาว" },
  { src: taiwan.url, alt: "Volktek เทคโนโลยีไต้หวัน มาตรฐานโลก DNV/GL ISO FCC CE VCCI" },
];

/** Volktek Ads — สำหรับหมวด Network (อุปกรณ์เครือข่ายองค์กร / อุตสาหกรรม) */
export function VolktekNetworkAds({ className = "" }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#050B18] via-[#0A1730] to-[#050B18] p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-200">
            <Network className="h-3.5 w-3.5" /> Industrial Network · Volktek
          </div>
          <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            อุปกรณ์เครือข่ายองค์กร <span className="text-sky-300">Volktek จากไต้หวัน</span>
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            Managed / PoE++ Industrial Switch ทนอุณหภูมิ −40~75°C · ENT Group ตัวแทนจำหน่ายอย่างเป็นทางการในไทย
          </p>
        </div>
        <a
          href={VOLKTEK_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
        >
          ดูสินค้า Volktek <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ADS.map((ad) => (
          <a
            key={ad.src}
            href={VOLKTEK_URL}
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
            <span className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white opacity-0 transition group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
