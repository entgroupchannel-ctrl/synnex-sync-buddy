import { ArrowUpRight, Cctv, Cpu, HardDrive, Network, ShieldCheck, Thermometer } from "lucide-react";
import gtMain from "@/assets/gt9000/gt9000-main.jpg.asset.json";
import gtFront from "@/assets/gt9000/gt9000-front.jpg.asset.json";
import gtAngle from "@/assets/gt9000/gt9000-angle.jpg.asset.json";

const GT9000_URL = "https://entgroup.co.th/gt-series?tab=gt9000";

const SPECS = [
  { icon: Network, label: "Dual LAN", sub: "แยกวง CCTV / Office" },
  { icon: HardDrive, label: "6× COM + GPIO", sub: "ต่อ NVR · Sensor · Access" },
  { icon: Thermometer, label: "Fanless −40~70°C", sub: "ตู้คอนโทรลไม่ต้องมีแอร์" },
  { icon: ShieldCheck, label: "ทำงาน 24/7", sub: "อัดกล้องต่อเนื่องไม่หลุด" },
];

/** GT9000 Ad — สำหรับหมวด CCTV & Security (เครื่องบันทึก/วิเคราะห์ภาพเกรดอุตสาหกรรม) */
export function Gt9000CctvAd({ className = "" }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#050B18] via-[#0A1730] to-[#050B18] ${className}`}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
        {/* Copy */}
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            <Cctv className="h-3.5 w-3.5" /> CCTV & Security · Industrial Grade
          </div>
          <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            GT9000 <span className="text-emerald-300">Industrial Box PC</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-200">
            เครื่องสำหรับงานกล้องวงจรปิดโดยเฉพาะ — ใช้เป็น VMS / NVR Server, Video Analytics
            และเครื่องคุมระบบ Access Control ไร้พัดลม ทนฝุ่นทนร้อน ติดตั้งในตู้คอนโทรลได้ทันที
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPECS.map((s) => (
              <div
                key={s.label}
                className="flex items-start gap-2 rounded-xl border border-white/15 bg-white/[0.08] p-2.5"
              >
                <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">{s.label}</div>
                  <div className="truncate text-[11px] text-slate-300">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <a
            href={GT9000_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            ดูสเปก GT9000 <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {/* Images */}
        <a
          href={GT9000_URL}
          target="_blank"
          rel="noopener"
          className="group relative grid grid-cols-2 gap-2 p-4 sm:p-5 lg:pl-0"
        >
          <div className="col-span-2 overflow-hidden rounded-xl border border-white/10 bg-white">
            <img
              src={gtMain.url}
              alt="GT9000 Industrial Box PC พอร์ต Dual LAN, USB, HDMI, GPIO"
              loading="lazy"
              width={800}
              height={800}
              className="h-40 w-full object-contain transition duration-500 group-hover:scale-105 sm:h-48"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
            <img
              src={gtFront.url}
              alt="GT9000 ด้านหน้า พอร์ต COM 6 ช่อง และ USB"
              loading="lazy"
              width={800}
              height={800}
              className="h-24 w-full object-contain sm:h-28"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
            <img
              src={gtAngle.url}
              alt="GT9000 ภายในเครื่อง ระบายความร้อนแบบ Fanless"
              loading="lazy"
              width={1070}
              height={642}
              className="h-24 w-full object-cover sm:h-28"
            />
          </div>
          <div className="pointer-events-none absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </a>
      </div>
    </section>
  );
}
