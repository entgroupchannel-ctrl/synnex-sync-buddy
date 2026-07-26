/**
 * แบนเนอร์ "บริการวางระบบห้องประชุมออนไลน์" สำหรับหมวด Webcam & Conference
 * — ภาพช่างติดตั้งจริง + โลโก้ LOGITECH/POLY + คุณค่าก่อน/ระหว่าง/หลังการขาย
 *   + ปุ่มโทร/LINE + ฟอร์มสำรวจ/ติดตั้ง/ดูแลระบบ
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
  Phone,
  MessageCircle,
  Send,
  Video,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  Search,
  PackageCheck,
  LifeBuoy,
  Presentation,
  Mic,
  GraduationCap,
} from "lucide-react";
import confInstall from "@/assets/conference/conference-install-team.jpg";
import LOGITECH from "@/assets/brands/LOGITECH.png.asset.json";
import POLY from "@/assets/brands/POLY.png.asset.json";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const MOBILE = "095-739-1053";

export type ConfServiceType = "survey" | "install" | "quote" | "maintenance";

const SERVICES: { key: ConfServiceType; label: string }[] = [
  { key: "survey", label: "นัดสำรวจห้องประชุม" },
  { key: "install", label: "ติดตั้ง + สอนใช้งาน" },
  { key: "quote", label: "ขอใบเสนอราคา" },
  { key: "maintenance", label: "ดูแลระบบต่อเนื่อง (MA)" },
];

const ROOM_TYPES = [
  "โต๊ะทำงาน/ส่วนตัว",
  "ห้องประชุมเล็ก 2-6 คน",
  "ห้องประชุมกลาง 6-12 คน",
  "ห้องประชุมใหญ่/ห้องอบรม",
  "หลายห้องพร้อมกัน",
];

const PLATFORMS = ["Zoom", "Microsoft Teams", "Google Meet", "Webex", "ยังไม่ระบุ"];

export function ConferenceInstallDialog({
  open,
  onOpenChange,
  defaultService = "survey",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: ConfServiceType;
}) {
  const [service, setService] = useState<ConfServiceType>(defaultService);
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[1]);
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
  const [rooms, setRooms] = useState("");
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
      `ขนาดห้อง: ${roomType}`,
      `แพลตฟอร์มที่ใช้: ${platform}`,
      rooms.trim() ? `จำนวนห้อง: ${rooms.trim()} ห้อง` : null,
      company.trim() ? `บริษัท: ${company.trim()}` : null,
      line.trim() ? `LINE: ${line.trim()}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");
    const label = SERVICES.find((s) => s.key === service)?.label ?? "";
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      product_name: `ระบบห้องประชุมออนไลน์ (Video Conference) – ${label}`,
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมงาน AV/Conference จะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setCompany(""); setPhone(""); setLine(""); setEmail(""); setRooms(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอคำปรึกษาระบบห้องประชุมออนไลน์</DialogTitle>
          <DialogDescription>
            บอกขนาดห้องและแพลตฟอร์มที่ใช้ ทีมงานจะออกแบบชุดอุปกรณ์ที่พอดีกับห้อง เสนอราคา และนัดช่างเข้าติดตั้ง
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
            <Label>ขนาดห้อง</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {ROOM_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRoomType(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    roomType === s
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>แพลตฟอร์มที่ใช้ประชุม</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PLATFORMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPlatform(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    platform === s
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="cf-name">ชื่อ-นามสกุล *</Label>
            <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cf-company">บริษัท/หน่วยงาน</Label>
              <Input id="cf-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={150} />
            </div>
            <div>
              <Label htmlFor="cf-phone">เบอร์โทรศัพท์ *</Label>
              <Input id="cf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cf-line">LINE ID</Label>
              <Input id="cf-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={50} />
            </div>
            <div>
              <Label htmlFor="cf-email">อีเมล</Label>
              <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div>
            <Label htmlFor="cf-rooms">จำนวนห้องที่ต้องการติดตั้ง</Label>
            <Input id="cf-rooms" value={rooms} onChange={(e) => setRooms(e.target.value)} maxLength={10} placeholder="เช่น 3" />
          </div>
          <div>
            <Label htmlFor="cf-msg">รายละเอียดเพิ่มเติม</Label>
            <Textarea
              id="cf-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น ห้องประชุม 10 ที่นั่ง มีจอ 65 นิ้วอยู่แล้ว อยากได้กล้องเก็บทั้งโต๊ะ ไมค์ไม่มีเสียงก้อง เชื่อม Teams"
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

const STAGES: {
  tag: string;
  title: string;
  icon: typeof Search;
  items: string[];
}[] = [
  {
    tag: "ก่อนการขาย",
    title: "สำรวจห้อง & ออกแบบระบบ",
    icon: Search,
    items: [
      "ช่างเข้าสำรวจห้องประชุมฟรี ในเขตกรุงเทพฯ–ปริมณฑล",
      "วัดขนาดห้อง ระยะกล้อง จุดวางไมค์ และสภาพเสียงสะท้อน",
      "จัดชุดอุปกรณ์ให้พอดีกับห้อง ไม่ขายเกินความจำเป็น",
      "ใบเสนอราคาโปร่งใส แยกค่าอุปกรณ์/ค่าติดตั้งชัดเจน",
    ],
  },
  {
    tag: "ระหว่างติดตั้ง",
    title: "ติดตั้ง & เซ็ตอัประบบ",
    icon: Wrench,
    items: [
      "ช่างชำนาญงาน AV เดินสาย เก็บงานเรียบร้อยสวยงาม",
      "ติดตั้งจอ/กล้อง/ไมค์ พร้อมปรับมุมภาพและระดับเสียงจริง",
      "เชื่อมต่อ Zoom / Teams / Google Meet / Webex ให้พร้อมใช้",
      "ทดสอบประชุมจริงกับปลายทางก่อนส่งมอบ",
    ],
  },
  {
    tag: "หลังการขาย",
    title: "ส่งมอบ & ดูแลต่อเนื่อง",
    icon: LifeBuoy,
    items: [
      "อบรมการใช้งานให้ทีมงาน พร้อมคู่มือใช้งานภาษาไทย",
      "ประกันศูนย์ของแท้ เคลมผ่านเราได้ ไม่ต้องวิ่งเอง",
      "ทีม Support ทางโทรศัพท์/LINE ตอบปัญหาก่อนเริ่มประชุม",
      "แพ็กเกจ MA ตรวจเช็กระบบประจำปี และอัปเดตเฟิร์มแวร์",
    ],
  },
];

export function ConferenceInstallBanner({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ConfServiceType>("survey");

  function openWith(s: ConfServiceType) {
    setService(s);
    setOpen(true);
  }

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      aria-label="บริการวางระบบห้องประชุมออนไลน์ Video Conference"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white">
        <img
          src={confInstall}
          alt="ทีมช่างกำลังติดตั้งและเซ็ตอัประบบประชุมออนไลน์ในห้องประชุมสำนักงาน"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/25" />

        <div className="relative grid gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Video className="h-3.5 w-3.5" /> ออกแบบ · ติดตั้ง · ดูแลระบบห้องประชุมออนไลน์ครบวงจร
            </div>
            <h2 className="text-xl font-bold leading-snug sm:text-2xl">
              ประชุมออนไลน์ให้ราบรื่น ไม่ใช่แค่ซื้อกล้อง — ต้องออกแบบทั้งห้อง
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              ENT Group วางระบบห้องประชุมให้ตั้งแต่สำรวจหน้างาน เลือกกล้อง/ไมค์/ลำโพงที่พอดีกับขนาดห้อง
              ติดตั้งด้วยทีมช่าง AV ชำนาญงาน เชื่อมต่อ Zoom / Teams / Google Meet ให้พร้อมใช้
              และมีทีมดูแลต่อเนื่องหลังส่งมอบ
            </p>

            <ul className="mt-3 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-2">
              <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-400" /> สำรวจห้อง + ใบเสนอราคาฟรี</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> อุปกรณ์ของแท้ ประกันศูนย์</li>
              <li className="flex items-center gap-2"><Mic className="h-4 w-4 text-emerald-400" /> เสียงชัด ไม่ก้อง ไม่มีเสียงย้อน</li>
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-400" /> สอนใช้งาน + ทีม Support ตลอดอายุใช้งาน</li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => openWith("survey")} className="bg-emerald-600 font-semibold hover:bg-emerald-700">
                <Search className="mr-1.5 h-4 w-4" /> นัดช่างสำรวจห้องประชุม
              </Button>
              <Button
                onClick={() => openWith("quote")}
                variant="outline"
                className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20"
              >
                <Send className="mr-1.5 h-4 w-4" /> ขอใบเสนอราคา
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

          {/* กล่องความน่าเชื่อถือ + โลโก้แบรนด์ */}
          <div className="flex flex-col justify-center gap-2 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
              แบรนด์ระบบประชุมที่เราติดตั้ง
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center rounded-md bg-white px-3 py-3">
                <img src={LOGITECH.url} alt="Logitech" loading="lazy" className="h-6 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center rounded-md bg-white px-3 py-3">
                <img src={POLY.url} alt="Poly" loading="lazy" className="h-6 w-auto object-contain" />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              รวมถึง HOSHI และแบรนด์ Room System อื่น ๆ — รับรองการใช้งานกับ Zoom / Microsoft Teams
              มีศูนย์บริการในไทย อะไหล่และอุปกรณ์เสริมหาได้ต่อเนื่อง
            </p>
          </div>
        </div>
      </div>

      {/* คุณค่า ก่อน / ระหว่าง / หลังการขาย */}
      <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
        {STAGES.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.tag} className="bg-white p-4">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                {st.tag}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Icon className="h-4 w-4 text-emerald-600" />
                {st.title}
              </div>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-slate-600">
                {st.items.map((it) => (
                  <li key={it} className="flex gap-1.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* แพ็กเกจบริการ */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold text-slate-500">เลือกบริการที่ต้องการ:</span>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("survey")}>
          <Search className="h-3.5 w-3.5" /> สำรวจห้องประชุม
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <Wrench className="h-3.5 w-3.5" /> ติดตั้ง + เดินสาย
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <PackageCheck className="h-3.5 w-3.5" /> ส่งมอบ + สอนใช้งาน
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("maintenance")}>
          <LifeBuoy className="h-3.5 w-3.5" /> ดูแลระบบต่อเนื่อง (MA)
        </Button>
        <span className="ml-auto hidden items-center gap-3 text-[11px] text-slate-500 sm:flex">
          <span className="inline-flex items-center gap-1"><Presentation className="h-3.5 w-3.5" /> รองรับ Zoom/Teams/Meet</span>
          <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> ตัดเสียงก้องอัตโนมัติ</span>
        </span>
      </div>

      <ConferenceInstallDialog open={open} onOpenChange={setOpen} defaultService={service} />
    </section>
  );
}
