import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench, ClipboardList, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductImage } from "@/components/product-image";
import cpuFallback from "@/assets/pc-parts/cpu.jpg";
import mbFallback from "@/assets/pc-parts/mb.jpg";
import ramFallback from "@/assets/pc-parts/ram.jpg";
import gpuFallback from "@/assets/pc-parts/gpu.jpg";
import ssdFallback from "@/assets/pc-parts/ssd.jpg";
import osFallback from "@/assets/pc-parts/os.jpg";

const PART_FALLBACK: Record<string, string> = {
  CPU: cpuFallback,
  MB: mbFallback,
  RAM: ramFallback,
  GPU: gpuFallback,
  SSD: ssdFallback,
  Storage: ssdFallback,
  OS: osFallback,
};

type Part = {
  icon: string;
  type: string;
  name: string;
  price: number | null; // null = ติดต่อสอบถาม
};

type Preset = {
  id: string;
  label: string;
  emoji: string;
  parts: Part[];
};

type SampleRow = {
  image_url: string | null;
  name: string | null;
};

const PRESETS: Preset[] = [
  {
    id: "gaming",
    label: "Gaming PC",
    emoji: "🎮",
    parts: [
      { icon: "🔲", type: "CPU", name: "AMD Ryzen 5 7600X", price: 8790 },
      { icon: "🟩", type: "MB", name: "GIGABYTE B850M DS3H DDR5", price: 4290 },
      { icon: "💾", type: "RAM", name: "Corsair 32GB DDR5 5600MHz", price: 4590 },
      { icon: "🎮", type: "GPU", name: "NVIDIA RTX 5060 Ti 8GB", price: null },
    ],
  },
  {
    id: "office",
    label: "Office/Work",
    emoji: "💼",
    parts: [
      { icon: "🔲", type: "CPU", name: "Intel Core i5-14400F", price: 6390 },
      { icon: "🟩", type: "MB", name: "MSI PRO B850M-P WIFI DDR5", price: 4590 },
      { icon: "💾", type: "RAM", name: "Corsair 16GB DDR4", price: 6390 },
      { icon: "💿", type: "SSD", name: "512GB NVMe SSD", price: 1290 },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    emoji: "🎨",
    parts: [
      { icon: "🔲", type: "CPU", name: "AMD Ryzen 7 9800X3D", price: 18990 },
      { icon: "🟩", type: "MB", name: "ASUS TUF GAMING B850M-PLUS", price: 7390 },
      { icon: "💾", type: "RAM", name: "Corsair 64GB DDR5", price: null },
      { icon: "🎮", type: "GPU", name: "NVIDIA RTX 5080 16GB", price: null },
    ],
  },
  {
    id: "server",
    label: "Server",
    emoji: "🖥️",
    parts: [
      { icon: "🔲", type: "CPU", name: "AMD Ryzen Threadripper 9960X", price: 63990 },
      { icon: "💾", type: "RAM", name: "64GB ECC DDR5", price: null },
      { icon: "💿", type: "Storage", name: "Enterprise NVMe", price: null },
      { icon: "🪟", type: "OS", name: "Windows Server 2025", price: 37990 },
    ],
  },
];

function formatTHB(n: number) {
  return "฿" + n.toLocaleString("th-TH");
}

async function fetchSamplesForPart(part: Part): Promise<SampleRow[]> {
  let query: any = supabase
    .from("synnex_products")
    .select("image_url,name")
    .eq("price_approved", true)
    .not("image_url", "is", null)
    .limit(10);

  switch (part.type) {
    case "CPU":
      query = query
        .eq("category", "Components")
        .or(
          "name.ilike.%CPU%,name.ilike.%Ryzen%,name.ilike.%Core i%,name.ilike.%Core Ultra%",
        );
      break;
    case "MB":
      query = query
        .eq("category", "Components")
        .or(
          "name.ilike.%Mainboard%,name.ilike.%B850M%,name.ilike.%B760M%,name.ilike.%Motherboard%",
        );
      break;
    case "RAM":
      query = query
        .eq("category", "Storage")
        .ilike("name", "%DDR%")
        .not("name", "ilike", "%SSD%");
      break;
    case "GPU":
      query = query
        .eq("category", "Components")
        .or(
          "name.ilike.%RTX%,name.ilike.%Radeon%,name.ilike.%GeForce%,name.ilike.%RX 7%,name.ilike.%RX 9%",
        )
        .not("name", "ilike", "%CPU%")
        .not("name", "ilike", "%Mainboard%");
      break;
    case "SSD":
    case "Storage":
      query = query
        .eq("category", "Storage")
        .or("name.ilike.%SSD%,name.ilike.%NVMe%");
      break;
    case "OS":
      query = query.eq("category", "Software").ilike("name", "%Windows%");
      break;
    default:
      query = query.ilike("name", `%${part.name.split(" ")[0]}%`);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return [];
  return data as SampleRow[];
}

function pickBestSample(samples: SampleRow[], type: string): SampleRow | null {
  if (!samples || samples.length === 0) return null;
  const avoidAdvice = samples.filter(
    (s) => s.image_url && !s.image_url.includes("img.advice.co.th"),
  );
  const pool = avoidAdvice.length > 0 ? avoidAdvice : samples;

  const scored = pool.map((s) => {
    const n = s.name?.toLowerCase() ?? "";
    let score = 0;
    if (s.image_url?.includes("dealerapi.synnex.co.th")) score += 2;
    if (type === "GPU") {
      if (/rtx\s?(4|5|6|7|8|9)/.test(n)) score += 5;
      if (/radeon\s?rx\s?(5|6|7|8|9)/.test(n)) score += 4;
      if (/gt\s?730|gt\s?710|gt\s?1030/.test(n)) score -= 3;
    } else if (type === "CPU") {
      if (/ryzen\s?(5|7|9)|core\s?i(5|7|9)|core\s?ultra/.test(n)) score += 4;
      if (/athlon|threadripper/.test(n)) score -= 2;
    } else if (type === "RAM") {
      if (/ddr5/.test(n)) score += 3;
      if (/32gb|64gb/.test(n)) score += 2;
    } else if (type === "MB") {
      if (/b850m|b760m|x670|tuf\s?gaming/.test(n)) score += 3;
    } else if (type === "SSD" || type === "Storage") {
      if (/nvme|m\.2/.test(n)) score += 3;
    } else if (type === "OS") {
      if (/windows\s?11/.test(n)) score += 3;
    }
    return { sample: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].sample;
}

export function PcBuilderLanding() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>("gaming");
  const preset = PRESETS.find((p) => p.id === activeId) ?? PRESETS[0];

  const samplesQuery = useQuery({
    queryKey: ["pc-builder-samples", activeId],
    queryFn: async () => {
      const rows = await Promise.all(
        preset.parts.map(async (part) => {
          const samples = await fetchSamplesForPart(part);
          return pickBestSample(samples, part.type);
        }),
      );
      return rows;
    },
    staleTime: 5 * 60_000,
  });

  const samples = (samplesQuery.data ?? []) as (SampleRow | null)[];

  const { subtotal, hasByOrder } = useMemo(() => {
    let sum = 0;
    let byOrder = false;
    preset.parts.forEach((p) => {
      if (p.price == null) byOrder = true;
      else sum += p.price;
    });
    return { subtotal: sum, hasByOrder: byOrder };
  }, [preset]);

  // rough range: +50% upper bound when has by-order items
  const rangeLow = subtotal;
  const rangeHigh = hasByOrder ? Math.round(subtotal * 1.5) : subtotal;

  const quoteSubject = encodeURIComponent(
    `ขอใบเสนอราคา PC Build: ${preset.label}`,
  );
  const quoteBody = encodeURIComponent(
    `สวัสดีครับ/ค่ะ\n\nต้องการขอใบเสนอราคาสำหรับสเปก ${preset.label}:\n` +
      preset.parts
        .map(
          (p) =>
            `• ${p.type}: ${p.name} — ${
              p.price != null ? formatTHB(p.price) : "ติดต่อสอบถาม"
            }`,
        )
        .join("\n") +
      `\n\nขอบคุณครับ/ค่ะ`,
  );

  return (
    <section
      className="w-full py-16"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2d1f 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Hero banner with generated image */}
        <div className="relative mb-10 overflow-hidden rounded-3xl">
          <img
            src="/pc-builder-hero.jpg"
            alt="Custom PC build"
            loading="lazy"
            width={1344}
            height={768}
            className="h-64 w-full object-cover md:h-80"
          />
          <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent px-6 md:px-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-green-300 backdrop-blur">
              <Wrench className="h-4 w-4" />
              NEW FEATURE
            </div>
            <h2 className="mb-3 text-3xl font-black text-white md:text-5xl">
              Config PC ในแบบของคุณ
            </h2>
            <p className="max-w-xl text-base text-slate-200 md:text-lg">
              เลือกชิ้นส่วนที่ใช่ สร้าง PC ตามงบและการใช้งาน
              ทีมงานตรวจสอบความเข้ากันได้ทุกชิ้น
            </p>
          </div>
        </div>

        {/* Use case tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {PRESETS.map((p) => {
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={
                  "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all " +
                  (selected
                    ? "border-white/40 bg-white/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white")
                }
              >
                <span className="mr-1.5">{p.emoji}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Hardware cards with real product images */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {preset.parts.map((part, i) => {
            const sample = samples[i];
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur transition-all duration-200 hover:scale-[1.02] hover:bg-white/15"
              >
                <div className="relative mb-3 h-32 overflow-hidden rounded-xl bg-white/90 p-2">
                  <ProductImage
                    src={sample?.image_url}
                    alt={part.name}
                    category={null}
                    productName={part.name}
                    className="h-full w-full object-contain"
                    fallbackLabel="ไม่มีรูปสินค้า"
                  />
                  <span
                    className={
                      "absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                      (part.price != null
                        ? "bg-green-500/20 text-green-300"
                        : "bg-orange-500/20 text-orange-300")
                    }
                  >
                    {part.price != null ? "ราคา" : "By Order"}
                  </span>
                </div>
                <div className="mb-1 text-xs text-slate-400">{part.type}</div>
                <div className="min-h-[2.5rem] text-sm font-semibold leading-snug text-white">
                  {part.name}
                </div>
                <div className="mt-3 text-base font-bold text-green-300">
                  {part.price != null
                    ? formatTHB(part.price)
                    : "ติดต่อสอบถาม"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated total */}
        <div className="mt-8 text-center">
          <div className="mb-1 text-sm text-slate-300">ประมาณการราคา</div>
          <div className="text-2xl font-black text-white md:text-3xl">
            {rangeLow === rangeHigh
              ? formatTHB(rangeLow)
              : `${formatTHB(rangeLow)} – ${formatTHB(rangeHigh)}`}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            (คำนวณจากชิ้นส่วนที่มีราคา ไม่รวม By Order)
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate({ to: "/pc-builder" })}
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-green-400"
          >
            <Wrench className="h-5 w-5" />
            Config PC เองเลย →
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigate({ to: "/pc-builder" });
              setTimeout(() => {
                const el = document.getElementById("pc-builder-quote");
                if (el) {
                  const headerOffset = window.innerWidth < 768 ? 60 : 80;
                  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }, 150);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-lg text-white transition-colors hover:bg-white/10"
          >
            <ClipboardList className="h-5 w-5" />
            ขอใบเสนอราคา Build นี้
          </button>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-400 md:gap-8">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            ตรวจสอบความเข้ากันได้ทุก Build
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            ประกอบโดยช่างผู้เชี่ยวชาญ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            รับประกันหลังการขาย
          </span>
        </div>
      </div>
    </section>
  );
}
