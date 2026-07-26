/**
 * แบนเนอร์ "ประกอบคอมโดยช่างผู้ชำนาญ" สำหรับหมวด Computer Set
 * — ภาพช่างประกอบคอมจริง + Timeline 5 ขั้นตอน ตั้งแต่เลือกสเปกจนถึงจัดส่ง
 */
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LineQrDialog } from "@/components/line-qr-dialog";
import {
  MousePointerClick,
  Cpu,
  CreditCard,
  Wrench,
  Truck,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Gauge,
  PackageCheck,
} from "lucide-react";
import pcBuild from "@/assets/computer-set/pc-build-tech.jpg";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";

const STEPS: { icon: typeof Cpu; title: string; desc: string }[] = [
  { icon: MousePointerClick, title: "1. เลือกสินค้า", desc: "เลือกเซ็ตสำเร็จ หรือบอกงบมา เราแนะนำให้" },
  { icon: Cpu, title: "2. จัดสเปก", desc: "ปรับ CPU/การ์ดจอ/แรม/SSD ให้ตรงการใช้งาน" },
  { icon: CreditCard, title: "3. ชำระเงิน", desc: "โอน/พร้อมเพย์/บัตรเครดิต ออกใบกำกับภาษีได้" },
  { icon: Wrench, title: "4. ช่างประกอบ", desc: "ประกอบ เก็บสาย ลงระบบ เบิร์นอินทดสอบก่อนส่ง" },
  { icon: Truck, title: "5. จัดส่งถึงบ้าน", desc: "แพ็กกันกระแทกอย่างดี พร้อมใช้งานทันที" },
];

export function ComputerSetBanner({ className = "" }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      aria-label="บริการจัดสเปกและประกอบคอมพิวเตอร์โดยช่างผู้ชำนาญ"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white">
        <img
          src={pcBuild}
          alt="ช่างคอมพิวเตอร์กำลังประกอบเครื่องคอมพิวเตอร์ให้ลูกค้า"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/20" />

        <div className="relative p-5 sm:p-7">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" /> จัดสเปก · ประกอบ · ทดสอบ · ส่งถึงบ้าน
          </div>
          <h2 className="text-xl font-bold leading-snug sm:text-2xl">
            ใคร ๆ ก็เป็นเจ้าของคอมแรง ๆ ได้ — ให้ช่างของเราประกอบให้
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-200">
            ไม่ต้องรู้เรื่องสเปกก็สั่งได้ บอกแค่ว่าจะเอาไปทำอะไรและงบเท่าไหร่
            ทีมช่าง ENT Group จัดสเปกให้ ประกอบด้วยมือ เก็บสายเรียบร้อย
            ทดสอบเบิร์นอินทุกเครื่องก่อนส่ง
          </p>

          <ul className="mt-3 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-3">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> อะไหล่ของแท้ ประกันศูนย์</li>
            <li className="flex items-center gap-2"><Gauge className="h-4 w-4 text-emerald-400" /> ทดสอบเบิร์นอินก่อนส่งทุกเครื่อง</li>
            <li className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-emerald-400" /> แพ็กกันกระแทก พร้อมใช้ทันที</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-600 font-semibold hover:bg-emerald-700">
              <Link to="/pc-builder">
                <Cpu className="mr-1.5 h-4 w-4" /> จัดสเปกเองที่ PC Builder
              </Link>
            </Button>
            <LineQrDialog>
              <Button variant="outline" className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20">
                <MessageCircle className="mr-1.5 h-4 w-4" /> ปรึกษาช่างทาง LINE
              </Button>
            </LineQrDialog>
            <Button asChild variant="outline" className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20">
              <a href={`tel:${PHONE_TEL}`}>
                <Phone className="mr-1.5 h-4 w-4" /> {PHONE}
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline 5 ขั้นตอน */}
      <div className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="mb-4 text-sm font-bold text-slate-800">
          สั่งง่ายแค่ 5 ขั้นตอน
        </div>

        <ol className="relative grid gap-5 sm:grid-cols-5 sm:gap-3">
          {/* เส้น timeline แนวนอน (desktop) */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-5 hidden h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 sm:block"
          />
          {/* เส้น timeline แนวตั้ง (mobile) */}
          <span
            aria-hidden
            className="absolute bottom-2 left-5 top-2 w-0.5 bg-gradient-to-b from-emerald-200 via-emerald-400 to-emerald-200 sm:hidden"
          />

          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
              >
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-slate-800">{s.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
