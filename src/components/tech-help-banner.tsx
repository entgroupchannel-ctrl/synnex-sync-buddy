/**
 * แบนเนอร์เล็ก "ต้องการช่าง?" ใต้รายละเอียดสินค้า
 * ใช้ร่วมกันในหมวด Solar & Energy, CCTV & Security, Edge AI Box, Computer Set
 * — รูปช่าง + เบอร์โทร + อีเมล + LINE + ฟอร์มฝากข้อความ (บันทึกลง quote_requests)
 */
import { useState } from "react";
import { z } from "zod";
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
import { Phone, Mail, MessageCircle, Send, Wrench } from "lucide-react";
import solarTech from "@/assets/solar/solar-install-team.jpg";
import cctvTech from "@/assets/cctv/cctv-install-team.jpg";
import edgeAiTech from "@/assets/edge-ai/edge-ai-team.jpg";
import pcTech from "@/assets/computer-set/pc-build-tech.jpg";
import conferenceTech from "@/assets/conference/conference-install-team.jpg";
import networkTech from "@/assets/network/network-install-team.jpg";

const PHONE = "02-045-6104";
const PHONE_TEL = "020456104";
const EMAIL = "sales@entgroup.co.th";

type Profile = {
  image: string;
  title: string;
  desc: string;
  topic: string;
};

const PROFILES: Record<string, Profile> = {
  "Solar & Energy": {
    image: solarTech,
    title: "ต้องการช่างติดตั้งโซลาร์เซลล์?",
    desc: "ทีมช่างของเราออกแบบระบบ ประเมินขนาดอินเวอร์เตอร์/แบตเตอรี่ ติดตั้งบนหลังคา และดูแลหลังการขายทั่วประเทศ",
    topic: "ระบบโซลาร์เซลล์",
  },
  "CCTV & Security": {
    image: cctvTech,
    title: "ต้องการช่างติดตั้งกล้องวงจรปิด?",
    desc: "ออกแบบจุดติดตั้ง เดินสาย PoE ตั้งค่า NVR/แอปดูผ่านมือถือ พร้อมบริการดูแลรักษาระบบ HIKVISION / Dahua",
    topic: "ระบบกล้องวงจรปิด",
  },
  "Edge AI Box": {
    image: edgeAiTech,
    title: "ต้องการทีมติดตั้งและ Config ระบบ AI?",
    desc: "เราติดตั้ง เซ็ตอัป JetPack/CUDA และวางระบบ Computer Vision ให้ใช้งานได้จริง ตั้งแต่ PoC จนถึงโครงการเต็มรูปแบบ",
    topic: "ระบบ Edge AI",
  },
  "Computer Set": {
    image: pcTech,
    title: "ต้องการช่างช่วยจัดสเปก/ประกอบคอม?",
    desc: "ช่างของเราช่วยเลือกสเปกให้ตรงงบและงานที่ใช้ ประกอบ ทดสอบ ลงระบบ พร้อมส่งถึงบ้านหรือออฟฟิศ",
    topic: "จัดสเปก/ประกอบคอมพิวเตอร์",
  },
  "Webcam & Conference": {
    image: conferenceTech,
    title: "ต้องการช่างติดตั้งชุดประชุมออนไลน์?",
    desc: "ติดตั้งกล้อง PTZ/Conference Bar ไมค์ประชุม ปรับแต่งซอฟต์แวร์ Zoom/Teams พร้อมทดสอบระบบก่อนใช้งานจริง",
    topic: "ชุดประชุมออนไลน์",
  },
};

export function hasTechHelpBanner(category?: string | null) {
  return !!category && category in PROFILES;
}

const schema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่อ").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")),
  line: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function TechHelpDialog({
  open,
  onOpenChange,
  topic,
  productName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  topic: string;
  productName?: string | null;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", line: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const v = parsed.data;
    setBusy(true);
    const detail = [
      v.line ? `LINE: ${v.line}` : null,
      productName ? `สนใจสินค้า: ${productName}` : null,
      v.message || null,
    ]
      .filter(Boolean)
      .join("\n");
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: v.name,
      customer_phone: v.phone,
      customer_email: v.email || null,
      product_name: `ขอช่าง – ${topic}`,
      message: detail || null,
    });
    setBusy(false);
    if (error) {
      toast.error("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งข้อมูลแล้ว ทีมช่างจะติดต่อกลับโดยเร็วที่สุด");
    onOpenChange(false);
    setForm({ name: "", phone: "", email: "", line: "", message: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอให้ช่างติดต่อกลับ — {topic}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลติดต่อ ทีมช่างจะโทรกลับเพื่อสอบถามหน้างานและเสนอแนวทางให้ครับ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="th-name">ชื่อ-นามสกุล *</Label>
            <Input
              id="th-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="th-phone">เบอร์โทรศัพท์ *</Label>
            <Input
              id="th-phone"
              required
              inputMode="tel"
              maxLength={10}
              placeholder="0812345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="th-line">LINE ID</Label>
              <Input
                id="th-line"
                maxLength={100}
                value={form.line}
                onChange={(e) => setForm({ ...form, line: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="th-email">อีเมล</Label>
              <Input
                id="th-email"
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="th-msg">รายละเอียด/ข้อความ</Label>
            <Textarea
              id="th-msg"
              rows={3}
              maxLength={1000}
              placeholder="เล่าหน้างานคร่าวๆ เช่น พื้นที่ จำนวนจุด งบประมาณ"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[color:var(--brand-green)] hover:opacity-90"
          >
            <Send className="mr-2 h-4 w-4" />
            {busy ? "กำลังส่ง..." : "ส่งข้อมูลให้ช่างติดต่อกลับ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TechHelpBanner({
  category,
  productName,
}: {
  category?: string | null;
  productName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const profile = category ? PROFILES[category] : undefined;
  if (!profile) return null;

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row">
          <img
            src={profile.image}
            alt={profile.title}
            loading="lazy"
            className="h-36 w-full object-cover sm:h-auto sm:w-44 sm:shrink-0"
          />
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--brand-navy)]">
              <Wrench className="h-4 w-4 text-[color:var(--brand-green)]" />
              {profile.title}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{profile.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${PHONE_TEL}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--brand-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Phone className="h-3.5 w-3.5" /> {PHONE}
              </a>
              <LineQrDialog>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> LINE @entgroup
                </button>
              </LineQrDialog>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail className="h-3.5 w-3.5" /> {EMAIL}
              </a>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--brand-green)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" /> ฝากข้อความให้ช่างติดต่อกลับ
              </button>
            </div>
          </div>
        </div>
      </section>

      <TechHelpDialog
        open={open}
        onOpenChange={setOpen}
        topic={profile.topic}
        productName={productName}
      />
    </>
  );
}
