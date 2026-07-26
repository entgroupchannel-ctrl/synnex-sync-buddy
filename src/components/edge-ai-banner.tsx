/**
 * แบนเนอร์ "วางระบบ Edge AI" สำหรับหมวด Edge AI Box / NVIDIA Jetson
 * — ภาพวิศวกรติดตั้งจริง + สิ่งที่ AI ช่วยโครงการคุณได้ + ฟอร์มขอคำปรึกษา/ทำ PoC
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LineQrDialog } from "@/components/line-qr-dialog";
import {
  BrainCircuit,
  Phone,
  Send,
  ScanEye,
  HardHat,
  Car,
  Boxes,
  Activity,
  ServerCog,
  Wrench,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import edgeAiTeam from "@/assets/edge-ai/edge-ai-team.jpg";

const PHONE_TEL = "020456104";

type ServiceType = "consult" | "poc" | "install";

const SERVICES: { key: ServiceType; label: string }[] = [
  { key: "consult", label: "ปรึกษาเลือกรุ่น/ออกแบบระบบ" },
  { key: "poc", label: "ทำ PoC ทดสอบโมเดล" },
  { key: "install", label: "ติดตั้ง + Config หน้างาน" },
];

const USE_CASES: { icon: typeof ScanEye; title: string; desc: string }[] = [
  { icon: ScanEye, title: "นับคน–วิเคราะห์พฤติกรรม", desc: "นับลูกค้าเข้าร้าน จุดที่คนยืนนาน คิวหน้าเคาน์เตอร์" },
  { icon: HardHat, title: "ความปลอดภัยในโรงงาน", desc: "ตรวจหมวก–เสื้อสะท้อนแสง (PPE) และการล้ำเขตอันตราย" },
  { icon: Car, title: "อ่านป้ายทะเบียน (LPR)", desc: "เปิดไม้กั้นอัตโนมัติ บันทึกรถเข้า–ออกโครงการ" },
  { icon: Boxes, title: "ตรวจคุณภาพชิ้นงาน", desc: "หาตำหนิบนสายพานด้วย Computer Vision แทนสายตาคน" },
  { icon: Activity, title: "พยากรณ์–แจ้งเตือนล่วงหน้า", desc: "Machine Learning จับความผิดปกติของเครื่องจักรก่อนเสีย" },
  { icon: ServerCog, title: "AI ในองค์กร ข้อมูลไม่ออกนอกไซต์", desc: "รันโมเดล/LLM บนเครื่องที่หน้างาน ลดค่าคลาวด์และความเสี่ยงข้อมูลรั่ว" },
];

export function EdgeAiConsultDialog({
  open,
  onOpenChange,
  defaultService = "consult",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: ServiceType;
}) {
  const [service, setService] = useState<ServiceType>(defaultService);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
  const [cameras, setCameras] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }
    setSubmitting(true);
    const detail = [
      company.trim() ? `บริษัท: ${company.trim()}` : null,
      line.trim() ? `LINE: ${line.trim()}` : null,
      cameras.trim() ? `จำนวนกล้อง/จุดติดตั้ง: ${cameras.trim()}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");
    const label = SERVICES.find((s) => s.key === service)?.label ?? "";
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      product_name: `ระบบ Edge AI – ${label}`,
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมวิศวกร AI จะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setCompany(""); setPhone(""); setLine(""); setEmail(""); setCameras(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ปรึกษาโครงการ Edge AI</DialogTitle>
          <DialogDescription>
            บอกโจทย์ของคุณสั้น ๆ ทีมวิศวกรจะช่วยออกแบบระบบ เลือกรุ่นที่พอดี และเสนอแนวทางติดตั้ง–Config ให้
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>ต้องการให้เราช่วยเรื่อง</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setService(s.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    service === s.key
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="ai-name">ชื่อ-นามสกุล *</Label>
            <Input id="ai-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="ai-company">บริษัท / หน่วยงาน</Label>
            <Input id="ai-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ai-phone">เบอร์โทรศัพท์ *</Label>
              <Input id="ai-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
            </div>
            <div>
              <Label htmlFor="ai-line">LINE ID</Label>
              <Input id="ai-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={60} />
            </div>
          </div>
          <div>
            <Label htmlFor="ai-email">อีเมล</Label>
            <Input id="ai-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label htmlFor="ai-cams">จำนวนกล้อง / จุดติดตั้งโดยประมาณ</Label>
            <Input id="ai-cams" value={cameras} onChange={(e) => setCameras(e.target.value)} maxLength={60} placeholder="เช่น 8 กล้อง 2 อาคาร" />
          </div>
          <div>
            <Label htmlFor="ai-msg">อยากให้ AI ทำอะไรให้คุณ</Label>
            <Textarea
              id="ai-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={800}
              rows={3}
              placeholder="เช่น นับคนเข้าร้าน, ตรวจว่าพนักงานใส่หมวกนิรภัยไหม, อ่านป้ายทะเบียนหน้าโครงการ"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Send className="mr-1.5 h-4 w-4" /> {submitting ? "กำลังส่ง..." : "ส่งข้อมูลให้ทีมวิศวกรติดต่อกลับ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EdgeAiBanner({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceType>("consult");

  function openWith(s: ServiceType) {
    setService(s);
    setOpen(true);
  }

  return (
    <section
      className={`overflow-hidden rounded-xl bg-slate-900 text-white ${className}`}
      aria-label="บริการวางระบบ Edge AI"
    >
      <div className="relative">
        <img
          src={edgeAiTeam}
          alt="วิศวกร ENT Group กำลังติดตั้งและตั้งค่าเครื่อง Edge AI พร้อมระบบวิเคราะห์ภาพจากกล้อง"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/40" />

        <div className="relative p-5 sm:p-7">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            <BrainCircuit className="h-3.5 w-3.5" /> ติดตั้งและ Config ให้เบื้องต้น โดยทีมวิศวกร AI
          </div>
          <h2 className="max-w-2xl text-xl font-bold leading-snug sm:text-2xl">
            AI ช่วยอะไรกับโครงการของคุณได้บ้าง?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            คุณเลือกว่าอยากให้ AI ทำอะไร — เราเชี่ยวชาญการติดตั้งและส่งมอบให้ใช้งานได้จริง
            ทั้ง Computer Vision, Machine Learning และงาน AI ด้านอื่น ๆ บนแพลตฟอร์ม NVIDIA Jetson
            จะเป็นโครงการเล็กจุดเดียวหรือใหญ่ทั้งโรงงาน เรายินดีบริการ
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => openWith("consult")} className="bg-emerald-600 font-semibold hover:bg-emerald-700">
              <Send className="mr-1.5 h-4 w-4" /> ปรึกษาโครงการ / ขอใบเสนอราคา
            </Button>
            <Button
              onClick={() => openWith("poc")}
              variant="outline"
              className="border-white/30 bg-white/10 font-semibold text-white hover:bg-white/20"
            >
              <GraduationCap className="mr-1.5 h-4 w-4" /> ขอทดสอบ PoC
            </Button>
            <a
              href={`tel:${PHONE_TEL}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            >
              <Phone className="h-4 w-4" /> 02-045-6104
            </a>
            <LineQrDialog>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                LINE @entgroup
              </button>
            </LineQrDialog>
          </div>
        </div>
      </div>

      {/* AI ช่วยอะไรได้บ้าง */}
      <div className="grid gap-2 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((u) => (
          <div key={u.title} className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <u.icon className="h-4 w-4" /> {u.title}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{u.desc}</p>
          </div>
        ))}
      </div>

      {/* ก่อน–ระหว่าง–หลังการส่งมอบ */}
      <div className="grid gap-3 border-t border-white/10 bg-slate-900 p-4 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <ScanEye className="h-4 w-4 text-emerald-400" /> ก่อนซื้อ
          </div>
          <p className="mt-1 text-[12px] text-slate-300">
            ฟังโจทย์ ประเมินจำนวนกล้อง/โมเดลที่ต้องรัน แล้วเลือกรุ่น Jetson ที่พอดีกับงบและงาน
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Wrench className="h-4 w-4 text-emerald-400" /> ระหว่างติดตั้ง
          </div>
          <p className="mt-1 text-[12px] text-slate-300">
            ลง JetPack/CUDA/TensorRT/DeepStream เชื่อมกล้องและเครือข่าย ทดสอบโมเดลจนเห็นผลจริงหน้างาน
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> หลังส่งมอบ
          </div>
          <p className="mt-1 text-[12px] text-slate-300">
            สอนทีมของคุณใช้งาน ส่งเอกสารการตั้งค่า พร้อมดูแลต่อเนื่องและปรับจูนโมเดลเมื่อหน้างานเปลี่ยน
          </p>
        </div>
      </div>

      <EdgeAiConsultDialog open={open} onOpenChange={setOpen} defaultService={service} />
    </section>
  );
}
