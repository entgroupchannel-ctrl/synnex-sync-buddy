import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Wrench, ClipboardList, CheckCircle2 } from "lucide-react";

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

export function PcBuilderLanding() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>("gaming");
  const preset = PRESETS.find((p) => p.id === activeId) ?? PRESETS[0];

  const { subtotal, hasByOrder } = useMemo(() => {
    let sum = 0;
    let byOrder = false;
    preset.parts.forEach((p) => {
      if (p.price == null) byOrder = true;
      else sum += p.price;
    });
    return { subtotal: sum, hasByOrder: byOrder };
  }, [preset]);

  // rough range: +15% upper bound when has by-order items
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
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-green-300 mb-4">
            🔧 NEW FEATURE
          </div>
          <h2 className="text-4xl font-black text-white mb-3">
            Config PC ในแบบของคุณ
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            เลือกชิ้นส่วนที่ใช่ สร้าง PC ตามงบและการใช้งาน
            ทีมงานตรวจสอบความเข้ากันได้ทุกชิ้น
          </p>
        </div>

        {/* Use case tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {PRESETS.map((p) => {
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={
                  "rounded-full px-5 py-2.5 text-sm font-semibold transition-all " +
                  (selected
                    ? "bg-white/20 border border-white/40 text-white"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white")
                }
              >
                <span className="mr-1.5">{p.emoji}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Hardware cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {preset.parts.map((part, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-4 transition-all duration-200 hover:bg-white/15 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{part.icon}</div>
                <span
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                    (part.price != null
                      ? "bg-green-500/20 text-green-300"
                      : "bg-orange-500/20 text-orange-300")
                  }
                >
                  {part.price != null ? "ราคา" : "By Order"}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-1">{part.type}</div>
              <div className="text-sm font-semibold text-white leading-snug min-h-[2.5rem]">
                {part.name}
              </div>
              <div className="mt-3 text-base font-bold text-green-300">
                {part.price != null ? formatTHB(part.price) : "ติดต่อสอบถาม"}
              </div>
            </div>
          ))}
        </div>

        {/* Estimated total */}
        <div className="text-center mt-8">
          <div className="text-slate-300 text-sm mb-1">ประมาณการราคา</div>
          <div className="text-2xl md:text-3xl font-black text-white">
            {rangeLow === rangeHigh
              ? formatTHB(rangeLow)
              : `${formatTHB(rangeLow)} – ${formatTHB(rangeHigh)}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            (คำนวณจากชิ้นส่วนที่มีราคา ไม่รวม By Order)
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => navigate({ to: "/pc-builder" })}
            className="inline-flex items-center gap-2 rounded-full bg-green-500 hover:bg-green-400 text-white px-8 py-4 text-lg font-bold transition-colors"
          >
            <Wrench className="h-5 w-5" />
            Config PC เองเลย →
          </button>
          <a
            href={`mailto:sales@entgroup.co.th?subject=${quoteSubject}&body=${quoteBody}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white px-8 py-4 text-lg hover:bg-white/10 transition-colors"
          >
            <ClipboardList className="h-5 w-5" />
            ขอใบเสนอราคา Build นี้
          </a>
        </div>

        {/* Trust bar */}
        <div className="text-slate-400 text-sm flex flex-wrap gap-4 md:gap-8 justify-center mt-8">
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
