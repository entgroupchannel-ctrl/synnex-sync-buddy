import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Briefcase, CreditCard, CalendarClock, Rocket, ShieldCheck,
  Building2, UserRound, Wallet, FileUp, Loader2, CheckCircle2, LogIn,
} from "lucide-react";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { bahtFmt } from "@/lib/credit";

export const Route = createFileRoute("/credit-application")({
  ssr: false,
  component: CreditApplicationPage,
  head: () => ({
    meta: [
      { title: "สมัครวงเงินเครดิต B2B — ENT Group IT Shop" },
      {
        name: "description",
        content:
          "สมัครวงเงินเครดิตสำหรับองค์กร หน่วยงานราชการ และรัฐวิสาหกิจ วงเงินสูงสุด ฿5,000,000 เครดิต 30-90 วัน อนุมัติภายใน 3-5 วันทำการ",
      },
      { property: "og:title", content: "สมัครวงเงินเครดิต B2B — ENT Group IT Shop" },
      { property: "og:description", content: "วงเงินเครดิตสำหรับองค์กร เครดิต 30-90 วัน อนุมัติไว" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const COMPANY_TYPES = ["บริษัทจำกัด (บจก.)", "ห้างหุ้นส่วนจำกัด (หจก.)", "ราชการ", "รัฐวิสาหกิจ", "อื่นๆ"];
const PRESETS = [50000, 100000, 250000, 500000, 1000000];
const REVENUES = ["ต่ำกว่า 1 ล้าน", "1-5 ล้าน", "5-20 ล้าน", "มากกว่า 20 ล้าน"];
const YEARS = ["น้อยกว่า 1 ปี", "1-3 ปี", "3-5 ปี", "มากกว่า 5 ปี"];

const schema = z.object({
  company_name: z.string().trim().min(2, "กรอกชื่อบริษัท/หน่วยงาน").max(200),
  tax_id: z.string().trim().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้อง 13 หลัก"),
  company_type: z.string().trim().min(1, "เลือกประเภทองค์กร"),
  company_address: z.string().trim().min(5, "กรอกที่อยู่องค์กร").max(500),
  company_phone: z.string().trim().regex(/^0\d{8,9}$/, "เบอร์โทรสำนักงานไม่ถูกต้อง"),
  company_email: z.string().trim().email("อีเมลองค์กรไม่ถูกต้อง").max(255),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  contact_name: z.string().trim().min(2, "กรอกชื่อผู้ติดต่อ").max(120),
  contact_position: z.string().trim().min(1, "กรอกตำแหน่ง").max(120),
  contact_phone: z.string().trim().regex(/^0\d{8,9}$/, "เบอร์มือถือไม่ถูกต้อง"),
  contact_email: z.string().trim().email("อีเมลผู้ติดต่อไม่ถูกต้อง").max(255),
  requested_credit_limit: z.number().min(10000, "วงเงินขั้นต่ำ ฿10,000").max(5000000, "วงเงินสูงสุด ฿5,000,000"),
  annual_revenue: z.string().trim().min(1, "เลือกรายได้ต่อปี"),
  years_in_business: z.string().trim().min(1, "เลือกระยะเวลาดำเนินธุรกิจ"),
});

type Form = z.infer<typeof schema>;

const BENEFITS = [
  { icon: CreditCard, text: "วงเงินสูงสุด ฿5,000,000" },
  { icon: CalendarClock, text: "เครดิต 30-90 วัน" },
  { icon: Rocket, text: "อนุมัติภายใน 3-5 วัน" },
  { icon: ShieldCheck, text: "ปลอดภัย 100%" },
];

function CreditApplicationPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const navigate = useNavigate();

  const [f, setF] = useState<Form>({
    company_name: "", tax_id: "", company_type: COMPANY_TYPES[0], company_address: "",
    company_phone: "", company_email: "", website: "",
    contact_name: "", contact_position: "", contact_phone: "", contact_email: "",
    requested_credit_limit: 100000, annual_revenue: "", years_in_business: "",
  });
  const [custom, setCustom] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{ reg: File | null; vat: File | null; fin: File | null }>({
    reg: null, vat: null, fin: null,
  });
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("user_profiles")
        .select("company_name, tax_id, company_address, phone, full_name, position")
        .eq("id", user.id)
        .maybeSingle();
      setF((prev) => ({
        ...prev,
        company_name: prev.company_name || (p?.company_name ?? ""),
        tax_id: prev.tax_id || (p?.tax_id ?? ""),
        company_address: prev.company_address || (p?.company_address ?? ""),
        contact_name: prev.contact_name || (p?.full_name ?? ""),
        contact_position: prev.contact_position || (p?.position ?? ""),
        contact_phone: prev.contact_phone || (p?.phone ?? ""),
        contact_email: prev.contact_email || (user.email ?? ""),
        company_email: prev.company_email || (user.email ?? ""),
      }));
    })();
  }, [user]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  async function uploadDoc(file: File | null, kind: string): Promise<string | null> {
    if (!file || !user) return null;
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("credit-documents").upload(path, file, { upsert: false });
    if (error) throw new Error(`อัปโหลด${kind}ไม่สำเร็จ: ${error.message}`);
    return path;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("กรุณาเข้าสู่ระบบก่อนสมัครวงเงินเครดิต"); return; }
    const parsed = schema.safeParse(f);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const iss of parsed.error.issues) errs[iss.path.join(".")] = iss.message;
      setErrors(errs);
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!files.reg || !files.vat) { toast.error("กรุณาแนบหนังสือรับรองบริษัท และใบทะเบียน VAT"); return; }
    if (!agree1 || !agree2) { toast.error("กรุณายอมรับข้อตกลงทั้งสองข้อ"); return; }

    setSubmitting(true);
    try {
      const [reg, vat, fin] = await Promise.all([
        uploadDoc(files.reg, "registration"),
        uploadDoc(files.vat, "vat"),
        uploadDoc(files.fin, "financial"),
      ]);

      const { data, error } = await supabase
        .from("credit_applications")
        .insert({
          ...parsed.data,
          website: parsed.data.website || null,
          company_registration_url: reg,
          vat_certificate_url: vat,
          financial_statement_url: fin,
          user_id: user.id,
          status: "pending",
        })
        .select("application_number")
        .single();
      if (error) throw error;

      supabase.functions
        .invoke("send-credit-application", { body: { application_number: data.application_number } })
        .catch((err) => console.warn("[send-credit-application]", err));

      await navigate({
        to: "/credit-application/success",
        search: { app: data.application_number ?? "" },
      });
    } catch (err) {
      console.error("[credit-application]", err);
      toast.error((err as Error).message || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: string) => errors[k];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-emerald-400" />
            <h1 className="text-2xl font-black sm:text-3xl">สมัครวงเงินเครดิต B2B</h1>
          </div>
          <p className="mt-2 text-sm text-white/80">
            สำหรับองค์กรและหน่วยงานที่ต้องการสั่งสินค้าแบบเครดิต
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">
                <b.icon className="h-4 w-4 text-emerald-400" /> {b.text}
              </div>
            ))}
          </div>
        </header>

        {!userLoading && !user && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <span>กรุณาเข้าสู่ระบบก่อน เพื่อให้เราผูกคำขอวงเงินกับบัญชีองค์กรของคุณ</span>
            <Button asChild size="sm"><Link to="/auth"><LogIn className="mr-1 h-4 w-4" /> เข้าสู่ระบบ</Link></Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-5">
          {/* 1 — Company */}
          <section className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
              <Building2 className="h-5 w-5" /> ข้อมูลองค์กร
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อบริษัท/หน่วยงาน *" error={err("company_name")}>
                <Input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} maxLength={200} />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี * (13 หลัก)" error={err("tax_id")}>
                <Input value={f.tax_id} inputMode="numeric" maxLength={13}
                  onChange={(e) => set("tax_id", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
            <Field label="ประเภทองค์กร *" error={err("company_type")}>
              <div className="flex flex-wrap gap-2">
                {COMPANY_TYPES.map((t) => (
                  <Chip key={t} active={f.company_type === t} onClick={() => set("company_type", t)}>{t}</Chip>
                ))}
              </div>
            </Field>
            <Field label="ที่อยู่องค์กร *" error={err("company_address")}>
              <Textarea rows={3} value={f.company_address} onChange={(e) => set("company_address", e.target.value)} maxLength={500} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="เบอร์โทรสำนักงาน *" error={err("company_phone")}>
                <Input value={f.company_phone} inputMode="tel" maxLength={10}
                  onChange={(e) => set("company_phone", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label="อีเมลองค์กร *" error={err("company_email")}>
                <Input type="email" value={f.company_email} onChange={(e) => set("company_email", e.target.value)} maxLength={255} />
              </Field>
              <Field label="เว็บไซต์ (ไม่บังคับ)" error={err("website")}>
                <Input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" maxLength={255} />
              </Field>
            </div>
          </section>

          {/* 2 — Contact */}
          <section className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
              <UserRound className="h-5 w-5" /> ผู้ติดต่อ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อ-นามสกุลผู้ติดต่อ *" error={err("contact_name")}>
                <Input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} maxLength={120} />
              </Field>
              <Field label="ตำแหน่ง *" error={err("contact_position")}>
                <Input value={f.contact_position} onChange={(e) => set("contact_position", e.target.value)} maxLength={120} />
              </Field>
              <Field label="เบอร์โทรมือถือ *" error={err("contact_phone")}>
                <Input value={f.contact_phone} inputMode="tel" maxLength={10}
                  onChange={(e) => set("contact_phone", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label="อีเมลผู้ติดต่อ *" error={err("contact_email")}>
                <Input type="email" value={f.contact_email} onChange={(e) => set("contact_email", e.target.value)} maxLength={255} />
              </Field>
            </div>
          </section>

          {/* 3 — Financial */}
          <section className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
              <Wallet className="h-5 w-5" /> ข้อมูลทางการเงิน
            </h2>
            <Field label="วงเงินที่ต้องการ (THB) *" error={err("requested_credit_limit")}>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Chip key={p} active={!custom && f.requested_credit_limit === p}
                    onClick={() => { setCustom(false); set("requested_credit_limit", p); }}>
                    {bahtFmt.format(p)}
                  </Chip>
                ))}
                <Chip active={custom} onClick={() => setCustom(true)}>กำหนดเอง</Chip>
              </div>
              {custom && (
                <Input className="mt-3 max-w-xs" inputMode="numeric" value={String(f.requested_credit_limit || "")}
                  onChange={(e) => set("requested_credit_limit", Number(e.target.value.replace(/\D/g, "")) || 0)} />
              )}
              <p className="mt-2 text-xs text-slate-500">
                วงเงินที่ขอ: <span className="font-semibold text-slate-700">{bahtFmt.format(f.requested_credit_limit || 0)}</span>
              </p>
            </Field>
            <Field label="รายได้ต่อปีโดยประมาณ *" error={err("annual_revenue")}>
              <div className="flex flex-wrap gap-2">
                {REVENUES.map((r) => (
                  <Chip key={r} active={f.annual_revenue === r} onClick={() => set("annual_revenue", r)}>{r}</Chip>
                ))}
              </div>
            </Field>
            <Field label="ดำเนินธุรกิจมาแล้ว *" error={err("years_in_business")}>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <Chip key={y} active={f.years_in_business === y} onClick={() => set("years_in_business", y)}>{y}</Chip>
                ))}
              </div>
            </Field>
          </section>

          {/* 4 — Documents */}
          <section className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
              <FileUp className="h-5 w-5" /> เอกสารประกอบ
            </h2>
            <UploadRow label="หนังสือรับรองบริษัท (จำเป็น)" file={files.reg}
              onPick={(file) => setFiles((p) => ({ ...p, reg: file }))} />
            <UploadRow label="ใบทะเบียนภาษีมูลค่าเพิ่ม / ภ.พ.20 (จำเป็น)" file={files.vat}
              onPick={(file) => setFiles((p) => ({ ...p, vat: file }))} />
            <UploadRow label="งบการเงินล่าสุด (แนะนำ)" file={files.fin}
              onPick={(file) => setFiles((p) => ({ ...p, fin: file }))} />
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
              🔒 เอกสารจะถูกเก็บอย่างปลอดภัยและใช้เพื่อการพิจารณาเท่านั้น
            </p>
          </section>

          {/* 5 — Agreement */}
          <section className="space-y-3 rounded-xl border bg-white p-6">
            <h2 className="font-bold text-[color:var(--brand-navy)]">ข้อตกลง</h2>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={agree1} onCheckedChange={(v) => setAgree1(v === true)} />
              <span>ข้าพเจ้ายืนยันว่าข้อมูลที่กรอกเป็นความจริงทุกประการ</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={agree2} onCheckedChange={(v) => setAgree2(v === true)} />
              <span>ยอมรับ<Link to="/terms" className="text-emerald-700 underline">เงื่อนไขการใช้วงเงินเครดิต</Link></span>
            </label>
          </section>

          <Button type="submit" size="lg" disabled={submitting || !user}
            className="w-full bg-emerald-600 text-base hover:bg-emerald-700">
            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังส่งคำขอ…</> : "ส่งคำขอวงเงินเครดิต"}
          </Button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}>
      {children}
    </button>
  );
}

function UploadRow({ label, file, onPick }: { label: string; file: File | null; onPick: (f: File | null) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
      <div className="flex items-center gap-2 text-sm">
        {file ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <FileUp className="h-4 w-4 text-slate-400" />}
        <div>
          <div className="font-medium text-slate-700">{label}</div>
          {file && <div className="text-xs text-emerald-700">{file.name}</div>}
        </div>
      </div>
      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="max-w-[220px]"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </div>
  );
}
