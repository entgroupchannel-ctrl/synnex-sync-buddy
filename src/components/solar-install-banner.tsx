/**
 * แบนเนอร์ "ติดตั้งระบบโซลาร์เซลล์" สำหรับหมวด Solar & Energy
 * — ภาพช่างติดตั้งจริง + โลโก้ HUAWEI + ปุ่มโทร/LINE + ฟอร์มขอใบเสนอราคา/นัดสำรวจ
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
import { Phone, MessageCircle, Send, Sun, ShieldCheck, Wrench, ClipboardCheck } from "lucide-react";
import solarInstall from "@/assets/solar/solar-install-team.jpg";
import HUAWEI from "@/assets/brands/HUAWEI.png.asset.json";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const MOBILE = "095-739-1053";

type ServiceType = "quote" | "survey" | "callback";

const SERVICES: { key: ServiceType; label: string }[] = [
  { key: "quote", label: "ขอใบเสนอราคา" },
  { key: "survey", label: "นัดสำรวจหน้างาน" },
  { key: "callback", label: "ให้ติดต่อกลับ" },
];

export function SolarInstallDialog({
  open,
  onOpenChange,
  defaultService = "quote",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: ServiceType;
}) {
  const [service, setService] = useState<ServiceType>(defaultService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bill, setBill] = useState("");
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
      line.trim() ? `LINE: ${line.trim()}` : null,
      address.trim() ? `สถานที่ติดตั้ง: ${address.trim()}` : null,
      bill.trim() ? `ค่าไฟเฉลี่ย/เดือน: ${bill.trim()} บาท` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");
    const label = SERVICES.find((s) => s.key === service)?.label ?? "";
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      product_name: `ระบบโซลาร์เซลล์ – ${label}`,
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมงานโซลาร์จะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setPhone(""); setLine(""); setEmail(""); setAddress(""); setBill(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอคำปรึกษาระบบโซลาร์เซลล์</DialogTitle>
          <DialogDescription>
            กรอกข้อมูล ทีมงานจะติดต่อกลับเพื่อประเมินขนาดระบบ เสนอราคา และนัดหมายช่างเข้าสำรวจหน้างาน
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
            <Label htmlFor="sl-name">ชื่อ-นามสกุล *</Label>
            <Input id="sl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="sl-phone">เบอร์โทรศัพท์ *</Label>
            <Input id="sl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="sl-line">LINE ID</Label>
              <Input id="sl-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={50} />
            </div>
            <div>
              <Label htmlFor="sl-email">อีเมล</Label>
              <Input id="sl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div>
            <Label htmlFor="sl-addr">สถานที่ติดตั้ง (เขต/อำเภอ-จังหวัด)</Label>
            <Input id="sl-addr" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="เช่น บางนา กรุงเทพฯ" />
          </div>
          <div>
            <Label htmlFor="sl-bill">ค่าไฟเฉลี่ยต่อเดือน (บาท)</Label>
            <Input id="sl-bill" value={bill} onChange={(e) => setBill(e.target.value)} maxLength={20} placeholder="เช่น 4,500" />
          </div>
          <div>
            <Label htmlFor="sl-msg">รายละเอียดเพิ่มเติม</Label>
            <Textarea
              id="sl-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น บ้าน 2 ชั้น หลังคากระเบื้อง ไฟ 1 เฟส อยากติด 5kW พร้อมแบตเตอรี่"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Send className="mr-1.5 h-4 w-4" /> {submitting ? "กำลังส่ง..." : "ส่งข้อมูลให้ทีมงานติดต่อกลับ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SolarInstallBanner({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceType>("quote");

  function openWith(s: ServiceType) {
    setService(s);
    setOpen(true);
  }

  return (
    <section
      className={`relative overflow-hidden rounded-xl bg-slate-900 text-white ${className}`}
      aria-label="บริการติดตั้งระบบโซลาร์เซลล์"
    >
      <img
        src={solarInstall}
        alt="ช่างกำลังติดตั้งแผงโซลาร์เซลล์บนหลังคาบ้าน"
        loading="lazy"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/30" />

      <div className="relative grid gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Sun className="h-3.5 w-3.5" /> บริการติดตั้งครบวงจร โดยทีมช่างมืออาชีพ
          </div>
          <h2 className="text-xl font-bold leading-snug sm:text-2xl">
            อยากติดโซลาร์เซลล์ที่บ้าน แต่ไม่รู้จะเริ่มยังไง?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-200">
            ENT Group เป็นสะพานเชื่อมระหว่างคุณกับทีมช่างที่มีประสบการณ์ — ช่วยประเมินขนาดระบบให้เหมาะกับค่าไฟบ้านคุณ
            เสนอราคาแบบชัดเจน นัดหมายช่างเข้าสำรวจหน้างาน ติดตั้ง และแนะนำเอกสารขออนุญาตการไฟฟ้า
          </p>

          <ul className="mt-3 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-2">
            <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-400" /> ประเมินขนาดระบบ + ใบเสนอราคาฟรี</li>
            <li className="flex items-center gap-2"><Wrench className="h-4 w-4 text-emerald-400" /> นัดช่างเข้าสำรวจหน้างานถึงที่</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> อุปกรณ์ของแท้ มีการรับประกัน</li>
            <li className="flex items-center gap-2"><Sun className="h-4 w-4 text-emerald-400" /> ดูแลเอกสารขออนุญาต PEA/MEA</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => openWith("quote")} className="bg-emerald-600 font-semibold hover:bg-emerald-700">
              <Send className="mr-1.5 h-4 w-4" /> ขอใบเสนอราคา
            </Button>
            <Button
              onClick={() => openWith("survey")}
              variant="outline"
              className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20"
            >
              <Wrench className="mr-1.5 h-4 w-4" /> นัดช่างสำรวจหน้างาน
            </Button>
            <LineQrDialog>
              <Button variant="outline" className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20">
                <MessageCircle className="mr-1.5 h-4 w-4" /> แอดไลน์ @entgroup
              </Button>
            </LineQrDialog>
            <Button asChild variant="outline" className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20">
              <a href={`tel:${PHONE_TEL}`}>
                <Phone className="mr-1.5 h-4 w-4" /> {PHONE}
              </a>
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-300">มือถือ/ไลน์ {MOBILE} · sales@entgroup.co.th</div>
        </div>

        {/* กล่องความน่าเชื่อถือ + โลโก้ HUAWEI */}
        <div className="flex flex-col justify-center gap-2 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
            พาร์ทเนอร์อุปกรณ์หลัก
          </div>
          <div className="flex items-center justify-center rounded-md bg-white px-4 py-3">
            <img src={HUAWEI.url} alt="HUAWEI" loading="lazy" className="h-8 w-auto object-contain" />
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            ใช้อินเวอร์เตอร์และแบตเตอรี่ HUAWEI FusionSolar ของแท้ พร้อมแอปมอนิเตอร์การผลิตไฟแบบเรียลไทม์
          </p>
        </div>
      </div>

      <SolarInstallDialog open={open} onOpenChange={setOpen} defaultService={service} />
    </section>
  );
}
