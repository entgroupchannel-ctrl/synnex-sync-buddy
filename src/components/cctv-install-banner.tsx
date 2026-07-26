/**
 * แบนเนอร์ "บริการติดตั้งระบบกล้องวงจรปิด" สำหรับหมวด CCTV & Security
 * — ภาพช่างติดตั้งจริง + โลโก้ HIKVISION/DAHUA + คุณค่าก่อน/ระหว่าง/หลังการขาย
 *   + ปุ่มโทร/LINE + ฟอร์มสำรวจ/ติดตั้ง/บำรุงรักษา
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
  Cctv,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  Search,
  PackageCheck,
  LifeBuoy,
  Video,
  HardDrive,
  Smartphone,
} from "lucide-react";
import cctvInstall from "@/assets/cctv/cctv-install-team.jpg";
import HIKVISION from "@/assets/brands/HIKVISION.png.asset.json";
import DAHUA from "@/assets/brands/DAHUA.png.asset.json";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const MOBILE = "095-739-1053";

export type CctvServiceType = "survey" | "install" | "quote" | "maintenance";

const SERVICES: { key: CctvServiceType; label: string }[] = [
  { key: "survey", label: "นัดสำรวจหน้างาน" },
  { key: "install", label: "ติดตั้งพร้อมส่งมอบ" },
  { key: "quote", label: "ขอใบเสนอราคา" },
  { key: "maintenance", label: "สัญญาบำรุงรักษา (MA)" },
];

const SITE_TYPES = ["บ้านพักอาศัย", "ร้านค้า/ร้านอาหาร", "สำนักงาน", "โรงงาน/คลังสินค้า", "อื่นๆ"];

export function CctvInstallDialog({
  open,
  onOpenChange,
  defaultService = "survey",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: CctvServiceType;
}) {
  const [service, setService] = useState<CctvServiceType>(defaultService);
  const [siteType, setSiteType] = useState<string>(SITE_TYPES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cams, setCams] = useState("");
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
      `ประเภทสถานที่: ${siteType}`,
      cams.trim() ? `จำนวนกล้องที่ต้องการ: ${cams.trim()} ตัว` : null,
      line.trim() ? `LINE: ${line.trim()}` : null,
      address.trim() ? `สถานที่ติดตั้ง: ${address.trim()}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");
    const label = SERVICES.find((s) => s.key === service)?.label ?? "";
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      product_name: `ระบบกล้องวงจรปิด CCTV – ${label}`,
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมงาน CCTV จะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setPhone(""); setLine(""); setEmail(""); setAddress(""); setCams(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอคำปรึกษาระบบกล้องวงจรปิด</DialogTitle>
          <DialogDescription>
            กรอกข้อมูล ทีมงานจะติดต่อกลับเพื่อออกแบบจุดติดตั้ง เสนอราคา นัดช่างเข้าสำรวจหน้างาน และดูแลหลังติดตั้ง
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
            <Label>ประเภทสถานที่</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SITE_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSiteType(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    siteType === s
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
            <Label htmlFor="cc-name">ชื่อ-นามสกุล *</Label>
            <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="cc-phone">เบอร์โทรศัพท์ *</Label>
            <Input id="cc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cc-line">LINE ID</Label>
              <Input id="cc-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={50} />
            </div>
            <div>
              <Label htmlFor="cc-email">อีเมล</Label>
              <Input id="cc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div>
            <Label htmlFor="cc-addr">สถานที่ติดตั้ง (เขต/อำเภอ-จังหวัด)</Label>
            <Input id="cc-addr" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="เช่น บางนา กรุงเทพฯ" />
          </div>
          <div>
            <Label htmlFor="cc-cams">จำนวนกล้องที่ต้องการ (ตัว)</Label>
            <Input id="cc-cams" value={cams} onChange={(e) => setCams(e.target.value)} maxLength={10} placeholder="เช่น 8" />
          </div>
          <div>
            <Label htmlFor="cc-msg">รายละเอียดเพิ่มเติม</Label>
            <Textarea
              id="cc-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น ร้านอาหาร 2 ชั้น อยากได้กล้องมีเสียงพูดโต้ตอบ ดูผ่านมือถือ เก็บภาพย้อนหลัง 30 วัน"
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
    title: "สำรวจ & ออกแบบระบบ",
    icon: Search,
    items: [
      "ช่างเข้าสำรวจหน้างานฟรี ในเขตกรุงเทพฯ–ปริมณฑล",
      "ออกแบบจุดติดตั้ง มุมกล้อง และความละเอียดที่เหมาะกับพื้นที่",
      "คำนวณพื้นที่ HDD ตามจำนวนวันที่ต้องเก็บย้อนหลัง",
      "ใบเสนอราคาโปร่งใส แยกค่าอุปกรณ์/ค่าติดตั้งชัดเจน",
    ],
  },
  {
    tag: "ระหว่างติดตั้ง",
    title: "ติดตั้ง & ส่งมอบงาน",
    icon: Wrench,
    items: [
      "ทีมช่างชำนาญงาน เดินสายเก็บงานเรียบร้อยได้มาตรฐาน",
      "ใช้อุปกรณ์ HIKVISION / DAHUA ของแท้ พร้อมใบรับประกันศูนย์",
      "ตั้งค่า NVR/DVR, บันทึกภาพ และแจ้งเตือนตรวจจับบุคคล",
      "ส่งมอบพร้อมสอนใช้งานผ่านมือถือ และเอกสารรับประกัน",
    ],
  },
  {
    tag: "หลังการขาย",
    title: "ดูแล & บำรุงรักษา",
    icon: LifeBuoy,
    items: [
      "รับประกันงานติดตั้ง พร้อมทีมซัพพอร์ตทางไลน์/โทรศัพท์",
      "แพ็กเกจ MA ตรวจเช็กประจำปี ล้างกล้อง เช็กสาย/ฮาร์ดดิสก์",
      "บริการเคลมอุปกรณ์กับศูนย์แทนลูกค้า",
      "ขยายระบบเพิ่มกล้างในอนาคตได้ต่อเนื่อง",
    ],
  },
];

export function CctvInstallBanner({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<CctvServiceType>("survey");

  function openWith(s: CctvServiceType) {
    setService(s);
    setOpen(true);
  }

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      aria-label="บริการติดตั้งระบบกล้องวงจรปิด CCTV"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white">
        <img
          src={cctvInstall}
          alt="ทีมช่างกำลังติดตั้งกล้องวงจรปิดบนอาคารสำนักงาน"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/25" />

        <div className="relative grid gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Cctv className="h-3.5 w-3.5" /> ออกแบบ · ติดตั้ง · ดูแลระบบกล้องวงจรปิดครบวงจร
            </div>
            <h2 className="text-xl font-bold leading-snug sm:text-2xl">
              ติดกล้องวงจรปิดทั้งที ต้องได้ทั้งของแท้ และช่างที่ติดตั้งเป็น
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              ENT Group ดูแลให้ตั้งแต่สำรวจหน้างาน ออกแบบจุดติดตั้ง ติดตั้งด้วยทีมช่างชำนาญงาน
              ส่งมอบพร้อมสอนใช้งาน และมีแพ็กเกจบำรุงรักษาต่อเนื่อง — เลือกได้ทั้ง HIKVISION และ DAHUA
            </p>

            <ul className="mt-3 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-2">
              <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-400" /> สำรวจหน้างาน + ใบเสนอราคาฟรี</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> อุปกรณ์ของแท้ ประกันศูนย์</li>
              <li className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-emerald-400" /> ดูสดผ่านมือถือ แจ้งเตือนอัจฉริยะ</li>
              <li className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-emerald-400" /> บริการหลังการขาย + สัญญา MA</li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => openWith("survey")} className="bg-emerald-600 font-semibold hover:bg-emerald-700">
                <Search className="mr-1.5 h-4 w-4" /> นัดช่างสำรวจหน้างาน
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
              แบรนด์กล้องที่เราติดตั้ง
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center rounded-md bg-white px-3 py-3">
                <img src={HIKVISION.url} alt="HIKVISION" loading="lazy" className="h-6 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center rounded-md bg-white px-3 py-3">
                <img src={DAHUA.url} alt="DAHUA" loading="lazy" className="h-6 w-auto object-contain" />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              สองแบรนด์ผู้นำระบบ CCTV ระดับโลก อะไหล่หาง่าย มีศูนย์บริการในไทย
              พร้อมแอปดูภาพย้อนหลังและแจ้งเตือนบนมือถือ
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
          <Search className="h-3.5 w-3.5" /> สำรวจหน้างาน
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <Wrench className="h-3.5 w-3.5" /> ติดตั้ง
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <PackageCheck className="h-3.5 w-3.5" /> ส่งมอบ + สอนใช้งาน
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("maintenance")}>
          <LifeBuoy className="h-3.5 w-3.5" /> สัญญาบำรุงรักษา (MA)
        </Button>
        <span className="ml-auto hidden items-center gap-3 text-[11px] text-slate-500 sm:flex">
          <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> ดูสดผ่านมือถือ</span>
          <span className="inline-flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> เก็บย้อนหลังตามต้องการ</span>
        </span>
      </div>

      <CctvInstallDialog open={open} onOpenChange={setOpen} defaultService={service} />
    </section>
  );
}
