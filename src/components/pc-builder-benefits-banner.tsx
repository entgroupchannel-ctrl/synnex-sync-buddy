import {
  MessageCircle,
  Wrench,
  Truck,
  Tag,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { LineQrDialog } from "@/components/line-qr-dialog";

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Admin ตอบแชท จัดสเปคให้",
    desc: "ทีมงานเทคนิคช่วยเลือกชิ้นส่วนให้เหมาะกับงานและงบประมาณของคุณ",
  },
  {
    icon: Wrench,
    title: "เลือกของให้ตรงสเปค",
    desc: "ตรวจสอบความเข้ากันได้ของ CPU, Mainboard, RAM ก่อนประกอบทุกเครื่อง",
  },
  {
    icon: Truck,
    title: "ส่งไว ถึงมือรวดเร็ว",
    desc: "จัดส่งทั่วประเทศ พร้อมแพ็คกันกระแทกอย่างดี ส่งตรงเวลาตามที่ตกลง",
  },
  {
    icon: Tag,
    title: "ราคาดีงาม คุ้มค่า",
    desc: "ได้ราคาจากตัวแทนจำหน่ายหลัก พร้อมส่วนลด Member / B2B สำหรับลูกค้าประจำ",
  },
  {
    icon: ShieldCheck,
    title: "มีประกันของแท้ 100%",
    desc: "สินค้าทุกชิ้นเป็นของแท้จากศูนย์ไทย รับประกันตามเงื่อนไขผู้ผลิต",
  },
];

export function PcBuilderBenefitsBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[color:var(--brand-navy)] via-[color:var(--brand-navy-2)] to-emerald-900 py-12 text-white sm:py-16">
      {/* subtle radial glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">
            ประกอบคอมกับ ENT Group ดียังไง?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
            ไม่ใช่แค่ขายอุปกรณ์ — เราช่วยเลือกชิ้นส่วน ตรวจสอบความเข้ากันได้
            และดูแลหลังการขายจนเครื่องพร้อมใช้งาน
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
            >
              <div className="mb-3 inline-flex rounded-xl bg-emerald-500/20 p-2.5 text-emerald-300 ring-1 ring-emerald-400/20 transition group-hover:scale-110 group-hover:text-emerald-200">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-sm font-semibold leading-snug sm:text-base">
                {b.title}
              </h3>
              <p className="text-xs leading-relaxed text-white/70 sm:text-sm">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
          <LineQrDialog>
            <button className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 hover:shadow-emerald-900/30">
              <MessageCircle className="h-4 w-4" />
              ปรึกษาทีมงานผ่าน LINE
            </button>
          </LineQrDialog>
          <a
            href="tel:061-260-7999"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            โทรสอบถามเพิ่มเติม
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
