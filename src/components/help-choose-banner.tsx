/**
 * Banner "เลือกรุ่นไม่ถูก?" — ช่องทางติดต่อทีมงาน + ฟอร์มให้ติดต่อกลับ
 * ใช้กระจายตามหน้าหมวดสินค้า / หน้ารายละเอียดสินค้า
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
import { Phone, Mail, MessageCircle, HeadphonesIcon, Send } from "lucide-react";
import supportAgent1 from "@/assets/support-agent-1.jpg";
import supportAgent2 from "@/assets/support-agent-2.jpg";
import supportTeam from "@/assets/support-team.jpg";

export const SUPPORT_PHOTOS = { agent1: supportAgent1, agent2: supportAgent2, team: supportTeam };

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const MOBILE = "095-739-1053";
const MOBILE_TEL = "0957391053";
const EMAIL = "sales@entgroup.co.th";

export function HelpChooseDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category?: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");
  const [email, setEmail] = useState("");
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
      message.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      product_name: category ? `ปรึกษาเลือกรุ่น – ${category}` : "ปรึกษาเลือกรุ่นสินค้า",
      message: detail || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setName(""); setPhone(""); setLine(""); setEmail(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ให้ทีมงานช่วยเลือกรุ่นให้</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลติดต่อ ทีมงานจะติดต่อกลับเพื่อแนะนำรุ่นที่เหมาะกับงานและงบประมาณของคุณ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="hc-name">ชื่อ-นามสกุล *</Label>
            <Input id="hc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="hc-phone">เบอร์โทรศัพท์ *</Label>
            <Input id="hc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          </div>
          <div>
            <Label htmlFor="hc-line">LINE ID</Label>
            <Input id="hc-line" value={line} onChange={(e) => setLine(e.target.value)} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="hc-email">อีเมล</Label>
            <Input id="hc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <div>
            <Label htmlFor="hc-msg">สินค้า/งานที่ต้องการใช้</Label>
            <Textarea id="hc-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} placeholder="เช่น อยากได้กล้องวงจรปิด 4 ตัว ติดนอกอาคาร งบ 15,000" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
            <Send className="mr-1.5 h-4 w-4" /> {submitting ? "กำลังส่ง..." : "ส่งข้อมูลให้ทีมงานติดต่อกลับ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** แบนเนอร์เต็ม — วางท้ายรายการสินค้าของแต่ละหมวด
 *  ภาพทีมงานเป็น background ของ block สี่เหลี่ยมใหญ่ฝั่งขวา
 */
export function HelpChooseBanner({
  category,
  className = "",
}: {
  category?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[color:var(--brand-navy)] via-[color:var(--brand-navy-2)] to-emerald-900 text-white ${className}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative grid min-h-[260px] lg:grid-cols-2">
        {/* เนื้อหาด้านซ้าย */}
        <div className="flex flex-col justify-center p-5 sm:p-7">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <HeadphonesIcon className="h-3.5 w-3.5" /> ปรึกษาฟรี ไม่มีค่าใช้จ่าย
          </div>
          <h2 className="text-lg font-bold sm:text-2xl">
            เลือกรุ่นไม่ถูก? ให้ทีมงาน ENT Group ช่วยเลือกให้
          </h2>
          <p className="mt-1.5 text-sm text-white/80">
            บอกงบประมาณและลักษณะงานที่ใช้{category ? ` ในหมวด ${category}` : ""} ทีมงานจะแนะนำรุ่นที่คุ้มค่าที่สุดให้ภายในวันทำการ
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
              <Phone className="h-4 w-4" /> {PHONE}
            </a>
            <a href={`tel:${MOBILE_TEL}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
              <Phone className="h-4 w-4" /> {MOBILE}
            </a>
            <LineQrDialog>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
                <MessageCircle className="h-4 w-4" /> LINE @entgroup
              </button>
            </LineQrDialog>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
              <Mail className="h-4 w-4" /> {EMAIL}
            </a>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="bg-[color:var(--brand-green)] font-bold text-white hover:brightness-110"
            >
              <Send className="mr-2 h-4 w-4" /> ให้เราติดต่อกลับ
            </Button>
            <p className="self-center text-[11px] text-white/70">กรอกชื่อ · เบอร์ · LINE · อีเมล</p>
          </div>
        </div>

        {/* Block สี่เหลี่ยมใหญ่ — ภาพทีมงานเป็น background */}
        <div
          className="relative hidden min-h-[260px] bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${supportTeam})` }}
          aria-label="ทีมงานฝ่ายบริการลูกค้า ENT Group พร้อมให้คำปรึกษา"
          role="img"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--brand-navy)] via-[color:var(--brand-navy)]/40 to-transparent" />
          <div className="absolute bottom-4 right-4 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
            ทีมงาน ENT Group พร้อมให้บริการ
          </div>
        </div>
      </div>
      <HelpChooseDialog open={open} onOpenChange={setOpen} category={category} />
    </section>
  );
}


/** การ์ดแบบแทรกกลางกริดสินค้า — ภาพ agent เป็น background ของ block สี่เหลี่ยม */
export function HelpChooseInlineCard({ category }: { category?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-full overflow-hidden rounded-lg border border-emerald-200 bg-white">
      <div className="grid md:grid-cols-5">
        {/* Block สี่เหลี่ยมใหญ่ซ้าย — ภาพเป็น background */}
        <div
          className="relative min-h-[160px] bg-cover bg-top md:col-span-2"
          style={{ backgroundImage: `url(${supportAgent1})` }}
          aria-label="เจ้าหน้าที่ฝ่ายบริการลูกค้า ENT Group"
          role="img"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-900/20 to-transparent md:bg-gradient-to-r" />
          <div className="absolute bottom-3 left-3 right-3 text-white md:bottom-auto md:top-1/2 md:-translate-y-1/2">
            <p className="text-sm font-bold">เลือกรุ่นไม่ถูก?</p>
            <p className="text-xs text-white/90">โทรปรึกษาทีมงานได้เลย</p>
          </div>
        </div>

        {/* เนื้อหาขวา */}
        <div className="flex flex-col justify-center gap-3 p-4 md:col-span-3 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <p className="text-sm font-bold text-slate-900">ให้ทีมงาน ENT Group ช่วยเลือกรุ่นให้</p>
            <p className="text-xs text-slate-600">
              {PHONE} · {MOBILE} · LINE @entgroup · {EMAIL}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="border-emerald-300 bg-white">
              <a href={`tel:${PHONE_TEL}`}><Phone className="mr-1.5 h-4 w-4" /> โทรเลย</a>
            </Button>
            <Button size="sm" onClick={() => setOpen(true)} className="bg-[color:var(--brand-green)] font-semibold hover:brightness-110">
              <Send className="mr-1.5 h-4 w-4" /> ให้เราติดต่อกลับ
            </Button>
          </div>
        </div>
      </div>
      <HelpChooseDialog open={open} onOpenChange={setOpen} category={category} />
    </div>
  );
}

/** แถบ "ทีมงานพร้อมให้บริการ" — ภาพ agent เป็น background block สี่เหลี่ยมใหญ่ */
export function SupportPeopleStrip({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`overflow-hidden rounded-xl border bg-white ${className}`}>
      <div className="grid gap-0 lg:grid-cols-2">
        {/* ฝั่งซ้าย: block สี่เหลี่ยมใหญ่พร้อมภาพ background */}
        <div className="relative min-h-[280px] bg-cover bg-center"
          style={{ backgroundImage: `url(${supportAgent2})` }}
          aria-label="ทีมซัพพอร์ตด้านเทคนิค ENT Group"
          role="img"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/30 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
            ทีมงานคนไทย พร้อมให้บริการ
          </div>
        </div>

        {/* ฝั่งขวา: เนื้อหา */}
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <HeadphonesIcon className="h-3.5 w-3.5" /> ทีมงานคนไทย พร้อมให้บริการ
          </div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            มีทีมงานตัวจริงคอยดูแลคุณทุกขั้นตอน
          </h2>
          <p className="text-sm text-slate-600">
            ตั้งแต่เลือกสเปก ออกใบเสนอราคา จนถึงหลังการขาย โทรหาเราได้ทุกวันทำการ 09:00–18:00 น.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-emerald-300">
              <a href={`tel:${PHONE_TEL}`}><Phone className="mr-1.5 h-4 w-4" /> {PHONE}</a>
            </Button>
            <LineQrDialog>
              <Button variant="outline" className="border-emerald-300">
                <MessageCircle className="mr-1.5 h-4 w-4" /> LINE @entgroup
              </Button>
            </LineQrDialog>
            <Button onClick={() => setOpen(true)} className="bg-[color:var(--brand-green)] font-semibold hover:brightness-110">
              <Send className="mr-1.5 h-4 w-4" /> ให้เราติดต่อกลับ
            </Button>
          </div>
        </div>
      </div>
      <HelpChooseDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
