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

/** แบนเนอร์เต็ม — วางท้ายรายการสินค้าของแต่ละหมวด */
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
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[color:var(--brand-navy)] via-[color:var(--brand-navy-2)] to-emerald-900 p-5 text-white sm:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
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
                <MessageCircle className="h-4 w-4" /> LINE @njm2688e
              </button>
            </LineQrDialog>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
              <Mail className="h-4 w-4" /> {EMAIL}
            </a>
          </div>
        </div>
        <div className="shrink-0">
        <div className="flex shrink-0 flex-col items-center gap-3 lg:flex-row">
          <img
            src={supportTeam}
            alt="ทีมงานฝ่ายบริการลูกค้า ENT Group พร้อมให้คำปรึกษา"
            loading="lazy"
            width={1536}
            height={768}
            className="hidden h-32 w-56 rounded-xl object-cover ring-2 ring-white/20 sm:block lg:h-36 lg:w-64"
          />
          <div className="w-full lg:w-auto">
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="w-full bg-[color:var(--brand-green)] font-bold text-white hover:brightness-110 lg:w-auto"
            >
              <Send className="mr-2 h-4 w-4" /> ให้เราติดต่อกลับ
            </Button>
            <p className="mt-2 text-center text-[11px] text-white/70">กรอกชื่อ · เบอร์ · LINE · อีเมล</p>
          </div>
        </div>
      </div>
      <HelpChooseDialog open={open} onOpenChange={setOpen} category={category} />
    </section>
  );
}


/** การ์ดแบบแทรกกลางกริดสินค้า */
export function HelpChooseInlineCard({ category }: { category?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-full flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <HeadphonesIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--brand-green)]" />
        <div>
          <p className="text-sm font-bold text-slate-900">เลือกรุ่นไม่ถูก? โทรปรึกษาทีมงานได้เลย</p>
          <p className="text-xs text-slate-600">
            {PHONE} · {MOBILE} · LINE @njm2688e · {EMAIL}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="border-emerald-300 bg-white">
          <a href={`tel:${PHONE_TEL}`}><Phone className="mr-1.5 h-4 w-4" /> โทรเลย</a>
        </Button>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-[color:var(--brand-green)] font-semibold hover:brightness-110">
          <Send className="mr-1.5 h-4 w-4" /> ให้เราติดต่อกลับ
        </Button>
      </div>
      <HelpChooseDialog open={open} onOpenChange={setOpen} category={category} />
    </div>
  );
}
