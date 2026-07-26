/**
 * แบนเนอร์ "บริการวางระบบเครือข่ายองค์กร" สำหรับหมวด Network
 * — ภาพช่างติดตั้งจริง + โลโก้ CISCO/UBIQUITI/TPLINK/DLINK
 *   + ทีมช่างทั่วประเทศ + ทางเลือก DIY (ส่งของ + แนะนำจนติดตั้งเองสำเร็จ)
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
  Network,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  Search,
  PackageCheck,
  LifeBuoy,
  Wifi,
  MapPin,
  Router,
  Cable,
  GraduationCap,
  Activity,
} from "lucide-react";
import netInstall from "@/assets/network/network-install-team.jpg";
import CISCO from "@/assets/brands/CISCO.png.asset.json";
import UBIQUITI from "@/assets/brands/UBIQUITI.png.asset.json";
import TPLINK from "@/assets/brands/TPLINK.png.asset.json";
import DLINK from "@/assets/brands/DLINK.png.asset.json";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const MOBILE = "095-739-1053";

export type NetServiceType = "survey" | "install" | "quote" | "maintenance" | "diy";

const SERVICES: { key: NetServiceType; label: string }[] = [
  { key: "survey", label: "นัดสำรวจหน้างาน" },
  { key: "install", label: "ติดตั้ง + เดินสาย/เซ็ตอุปกรณ์" },
  { key: "quote", label: "ขอใบเสนอราคา" },
  { key: "maintenance", label: "ดูแลระบบต่อเนื่อง (MA)" },
  { key: "diy", label: "ซื้ออุปกรณ์ + ให้ทีมแนะนำติดตั้งเอง" },
];

const SITE_TYPES = [
  "ออฟฟิศ/สำนักงาน",
  "โรงงาน/คลังสินค้า",
  "ร้านค้า/สาขาหลายจุด",
  "โรงแรม/หอพัก/อพาร์ตเมนต์",
  "โรงเรียน/หน่วยงานราชการ",
  "บ้าน/ออฟฟิศขนาดเล็ก",
];

const SCOPES = [
  "Wi-Fi ครอบคลุมทั้งพื้นที่",
  "เดินสาย LAN / Fiber",
  "Switch / Router / Firewall",
  "แยก VLAN & ระบบความปลอดภัย",
  "เชื่อมหลายสาขา (VPN/SD-WAN)",
  "ยังไม่ระบุ ขอคำแนะนำ",
];

export function NetworkInstallDialog({
  open,
  onOpenChange,
  defaultService = "survey",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: NetServiceType;
}) {
  const [service, setService] = useState<NetServiceType>(defaultService);
  const [siteType, setSiteType] = useState<string>(SITE_TYPES[0]);
  const [scope, setScope] = useState<string>(SCOPES[0]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("");
  const [users, setUsers] = useState("");
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
      `ขอบเขตงาน: ${scope}`,
      province.trim() ? `จังหวัด/พื้นที่: ${province.trim()}` : null,
      users.trim() ? `จำนวนผู้ใช้งาน/จุดติดตั้ง: ${users.trim()}` : null,
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
      product_name: `ระบบเครือข่ายองค์กร (Network) – ${label}`,
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมงานเครือข่ายจะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setCompany(""); setPhone(""); setLine(""); setEmail(""); setProvince(""); setUsers(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอคำปรึกษาระบบเครือข่ายองค์กร</DialogTitle>
          <DialogDescription>
            บอกลักษณะพื้นที่และสิ่งที่ต้องการ ทีมงานจะช่วยเลือกอุปกรณ์ที่เหมาะสม เสนอราคา
            และจัดช่างเข้าติดตั้ง หรือแนะนำให้คุณติดตั้งเองได้สำเร็จ
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
            <Label>ขอบเขตงานที่ต้องการ</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    scope === s
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
            <Label htmlFor="nw-name">ชื่อ-นามสกุล *</Label>
            <Input id="nw-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nw-company">บริษัท/หน่วยงาน</Label>
              <Input id="nw-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={150} />
            </div>
            <div>
              <Label htmlFor="nw-phone">เบอร์โทรศัพท์ *</Label>
              <Input id="nw-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nw-line">LINE ID</Label>
              <Input id="nw-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={50} />
            </div>
            <div>
              <Label htmlFor="nw-email">อีเมล</Label>
              <Input id="nw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nw-province">จังหวัด/พื้นที่หน้างาน</Label>
              <Input id="nw-province" value={province} onChange={(e) => setProvince(e.target.value)} maxLength={100} placeholder="เช่น ชลบุรี" />
            </div>
            <div>
              <Label htmlFor="nw-users">จำนวนผู้ใช้งาน/จุดติดตั้ง</Label>
              <Input id="nw-users" value={users} onChange={(e) => setUsers(e.target.value)} maxLength={20} placeholder="เช่น 60 คน / 8 จุด" />
            </div>
          </div>
          <div>
            <Label htmlFor="nw-msg">รายละเอียดเพิ่มเติม</Label>
            <Textarea
              id="nw-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น ออฟฟิศ 2 ชั้น 400 ตร.ม. Wi-Fi หลุดบ่อย อยากได้ AP ใหม่ + แยก VLAN สำหรับแขก"
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
    title: "สำรวจหน้างาน & ออกแบบระบบ",
    icon: Search,
    items: [
      "ช่างเข้าสำรวจพื้นที่จริง วัดสัญญาณ Wi-Fi และจุดอับสัญญาณ",
      "ออกแบบผังเครือข่าย จำนวน Switch/AP และเส้นทางเดินสาย",
      "เลือกอุปกรณ์ให้พอดีกับจำนวนผู้ใช้และงบประมาณ ไม่ขายเกินจำเป็น",
      "ใบเสนอราคาโปร่งใส แยกค่าอุปกรณ์/ค่าติดตั้งชัดเจน",
    ],
  },
  {
    tag: "ระหว่างติดตั้ง",
    title: "ติดตั้ง เดินสาย & คอนฟิก",
    icon: Wrench,
    items: [
      "ทีมช่างกระจายทั่วประเทศ นัดเข้างานได้ทั้งในและต่างจังหวัด",
      "เดินสาย LAN/Fiber เข้าราง เก็บงานเรียบร้อย ติดป้ายพอร์ตครบ",
      "คอนฟิก Router/Switch/AP แยก VLAN ตั้งค่าความปลอดภัยและ Guest Wi-Fi",
      "ทดสอบความเร็ว/สัญญาณทุกจุด พร้อมส่งรายงานผลทดสอบ",
    ],
  },
  {
    tag: "หลังการขาย",
    title: "ส่งมอบ & ดูแลต่อเนื่อง",
    icon: LifeBuoy,
    items: [
      "ส่งมอบผังระบบ รหัสอุปกรณ์ และคู่มือใช้งานภาษาไทย",
      "ประกันศูนย์ของแท้ เคลมผ่านเราได้ ไม่ต้องวิ่งเอง",
      "ทีม Support ทางโทรศัพท์/LINE ช่วยรีโมตแก้ปัญหาเร่งด่วน",
      "แพ็กเกจ MA ตรวจเช็กระบบประจำปี และอัปเดตเฟิร์มแวร์",
    ],
  },
];

export function NetworkInstallBanner({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<NetServiceType>("survey");

  function openWith(s: NetServiceType) {
    setService(s);
    setOpen(true);
  }

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      aria-label="บริการวางระบบเครือข่ายองค์กร Network Solution"
    >
      {/* Hero */}
      <div className="relative bg-slate-900 text-white">
        <img
          src={netInstall}
          alt="ทีมช่างเครือข่ายกำลังติดตั้งและคอนฟิกอุปกรณ์ในตู้ Rack ของสำนักงาน"
          loading="lazy"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/25" />

        <div className="relative grid gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Network className="h-3.5 w-3.5" /> ออกแบบ · เดินสาย · ติดตั้ง · ดูแลระบบเครือข่ายครบวงจร
            </div>
            <h2 className="text-xl font-bold leading-snug sm:text-2xl">
              วางระบบเครือข่ายองค์กร ให้เน็ตนิ่ง Wi-Fi เต็มพื้นที่ — โดยทีมช่างทั่วประเทศ
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              ENT Group ช่วยตั้งแต่เลือกอุปกรณ์ให้เหมาะกับหน้างาน ปรับแต่งคอนฟิก ติดตั้งจริงถึงที่
              และถ้าคุณอยากติดตั้งเอง เราก็จัดส่งพร้อมเซ็ตค่าเบื้องต้นมาให้
              และมีทีมแนะนำทีละขั้นจนคุณใช้งานได้สำเร็จ
            </p>

            <ul className="mt-3 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-2">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-400" /> ทีมช่างกระจายทั่วประเทศ</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-400" /> สำรวจหน้างาน + ใบเสนอราคาฟรี</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> อุปกรณ์ของแท้ ประกันศูนย์</li>
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-400" /> ซื้อไปติดตั้งเอง มีทีมโค้ชจนสำเร็จ</li>
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
              แบรนด์เครือข่ายที่เราติดตั้ง
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { src: CISCO.url, alt: "Cisco" },
                { src: UBIQUITI.url, alt: "Ubiquiti" },
                { src: TPLINK.url, alt: "TP-Link" },
                { src: DLINK.url, alt: "D-Link" },
              ].map((b) => (
                <div key={b.alt} className="flex items-center justify-center rounded-md bg-white px-3 py-3">
                  <img src={b.src} alt={b.alt} loading="lazy" className="h-6 w-auto object-contain" />
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              รวมถึง Huawei, Ruijie, MikroTik และแบรนด์องค์กรอื่น ๆ — สินค้าของแท้
              มีศูนย์บริการในไทย พร้อมอะไหล่และอุปกรณ์เสริมต่อเนื่อง
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

      {/* สองทางเลือก: ให้ช่างติดตั้ง หรือ ติดตั้งเองแบบมีพี่เลี้ยง */}
      <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2">
        <div className="bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Wrench className="h-4 w-4 text-emerald-600" /> ให้ช่างของเราติดตั้งให้
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
            เหมาะกับองค์กรที่ต้องการงานเรียบร้อย ครบจบในครั้งเดียว — สำรวจ ออกแบบ เดินสาย คอนฟิก
            ทดสอบ และส่งมอบพร้อมเอกสาร มีทีมช่างในหลายจังหวัดทั่วประเทศ
          </p>
          <Button size="sm" className="mt-3 bg-emerald-600 text-xs hover:bg-emerald-700" onClick={() => openWith("install")}>
            <Wrench className="mr-1.5 h-3.5 w-3.5" /> ขอช่างเข้าติดตั้ง
          </Button>
        </div>
        <div className="bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <PackageCheck className="h-4 w-4 text-emerald-600" /> ซื้ออุปกรณ์ไปติดตั้งเอง
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
            เราช่วยเลือกรุ่นให้ถูกต้องตั้งแต่แรก จัดส่งทั่วประเทศ พร้อมคู่มือ/คลิปตั้งค่า
            และทีมงานคอยแนะนำทาง LINE หรือรีโมตช่วยตั้งค่า จนคุณใช้งานได้สำเร็จ
          </p>
          <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => openWith("diy")}>
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> ขอคำแนะนำเลือกรุ่น + ติดตั้งเอง
          </Button>
        </div>
      </div>

      {/* แพ็กเกจบริการ */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold text-slate-500">เลือกบริการที่ต้องการ:</span>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("survey")}>
          <Search className="h-3.5 w-3.5" /> สำรวจหน้างาน
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <Cable className="h-3.5 w-3.5" /> เดินสาย LAN/Fiber
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("install")}>
          <Router className="h-3.5 w-3.5" /> คอนฟิก Router/Switch/AP
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openWith("maintenance")}>
          <LifeBuoy className="h-3.5 w-3.5" /> ดูแลระบบต่อเนื่อง (MA)
        </Button>
        <span className="ml-auto hidden items-center gap-3 text-[11px] text-slate-500 sm:flex">
          <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> Wi-Fi 6 / Mesh / PoE</span>
          <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> ทดสอบสัญญาณก่อนส่งมอบ</span>
        </span>
      </div>

      <NetworkInstallDialog open={open} onOpenChange={setOpen} defaultService={service} />
    </section>
  );
}
