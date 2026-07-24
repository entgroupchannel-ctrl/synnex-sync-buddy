import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building2, LogIn } from "lucide-react";

const searchSchema = z.object({
  tab: fallback(z.enum(["signin", "b2c", "b2b"]), "signin").default("signin"),
  redirect: fallback(z.string(), "/").default("/"),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ / สมัครสมาชิก — ENT Group IT Shop" },
      { name: "description", content: "เข้าสู่ระบบหรือสมัครสมาชิก ENT Group IT Shop สำหรับลูกค้าทั่วไปและองค์กร" },
      { property: "og:title", content: "เข้าสู่ระบบ — ENT Group IT Shop" },
      { property: "og:description", content: "สมัครสมาชิกลูกค้าทั่วไปหรือองค์กร (B2B) ที่ ENT Group IT Shop" },
    ],
  }),
  component: AuthPage,
});

const phoneRe = /^0\d{8,9}$/;
const taxIdRe = /^\d{13}$/;

function AuthPage() {
  const navigate = useNavigate();
  const raw = (useSearch({ strict: false, shouldThrow: false }) ?? {}) as { tab?: "signin" | "b2c" | "b2b"; redirect?: string };
  const search = { tab: raw.tab ?? "signin", redirect: raw.redirect ?? "/" };
  const [tab, setTab] = useState<"signin" | "b2c" | "b2b">(search.tab);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: search.redirect as never, replace: true });
    });
  }, [navigate, search.redirect]);

  useEffect(() => {
    setTab(search.tab);
  }, [search.tab]);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-[color:var(--brand-navy)] px-6 py-5 text-white">
            <h1 className="text-xl font-black">เข้าสู่ระบบ / สมัครสมาชิก</h1>
            <p className="mt-1 text-sm text-white/80">ENT Group IT Shop</p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="p-4 md:p-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin" className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" /> เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="b2c" className="gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" /> บุคคลทั่วไป
              </TabsTrigger>
              <TabsTrigger value="b2b" className="gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" /> องค์กร / B2B
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm redirectTo={search.redirect} />
            </TabsContent>
            <TabsContent value="b2c" className="mt-6">
              <SignUpB2CForm />
            </TabsContent>
            <TabsContent value="b2b" className="mt-6">
              <SignUpB2BForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          ไม่ต้องการสมัคร?{" "}
          <Link to="/" className="text-[color:var(--brand-navy)] hover:underline">
            เลือกซื้อสินค้าต่อโดยไม่สมัคร
          </Link>
        </p>
      </div>
    </div>
  );
}

function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
    let dest = redirectTo;
    if (data.user && (redirectTo === "/" || !redirectTo)) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.is_admin) dest = "/admin";
    }
    navigate({ to: dest as never, replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="si-email">อีเมล</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="si-pass">รหัสผ่าน</Label>
        <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
        {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}

const b2cSchema = z
  .object({
    full_name: z.string().trim().min(2, "กรอกชื่อ-นามสกุล").max(100),
    phone: z.string().trim().regex(phoneRe, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"),
    email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "รหัสผ่านไม่ตรงกัน" });

function SignUpB2CForm() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = b2cSchema.safeParse(form);
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        data: {
          user_type: "b2c",
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("สร้างบัญชีสำเร็จ! กรุณายืนยันอีเมล (ถ้ามี)");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>ชื่อ-นามสกุล *</Label>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>เบอร์โทรศัพท์ *</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="0812345678" maxLength={10} />
        </div>
        <div>
          <Label>อีเมล *</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>รหัสผ่าน * (≥ 8 ตัว)</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </div>
        <div>
          <Label>ยืนยันรหัสผ่าน *</Label>
          <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
        {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>
    </form>
  );
}

const b2bSchema = z
  .object({
    company_name: z.string().trim().min(2, "กรอกชื่อบริษัท").max(200),
    tax_id: z.string().trim().regex(taxIdRe, "เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก"),
    company_address: z.string().trim().min(5, "กรอกที่อยู่บริษัท").max(500),
    full_name: z.string().trim().min(2, "กรอกชื่อผู้ติดต่อ").max(100),
    position: z.string().trim().max(100).optional().or(z.literal("")),
    phone: z.string().trim().regex(phoneRe, "เบอร์โทรไม่ถูกต้อง"),
    email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    wants_tax_invoice: z.boolean(),
  });

function SignUpB2BForm() {
  const [form, setForm] = useState({
    company_name: "",
    tax_id: "",
    company_address: "",
    full_name: "",
    position: "",
    phone: "",
    email: "",
    password: "",
    wants_tax_invoice: true,
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = b2bSchema.safeParse(form);
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        data: {
          user_type: "b2b",
          full_name: form.full_name,
          phone: form.phone,
          company_name: form.company_name,
          tax_id: form.tax_id,
          company_address: form.company_address,
          position: form.position,
          wants_tax_invoice: form.wants_tax_invoice,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("ลงทะเบียนสำเร็จ! ทีมงานจะติดต่อยืนยันบัญชีภายใน 1 วันทำการ", { duration: 6000 });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800">
        บัญชี B2B จะต้องรอทีมงานยืนยัน (1 วันทำการ) — คุณสามารถซื้อสินค้าในฐานะ Guest ระหว่างรอได้
      </div>
      <div>
        <Label>ชื่อบริษัท *</Label>
        <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required maxLength={200} />
      </div>
      <div>
        <Label>เลขประจำตัวผู้เสียภาษี (13 หลัก) *</Label>
        <Input
          value={form.tax_id}
          onChange={(e) => setForm({ ...form, tax_id: e.target.value.replace(/\D/g, "") })}
          required
          inputMode="numeric"
          maxLength={13}
          placeholder="0105558XXXXXX"
        />
        {form.tax_id.length > 0 && form.tax_id.length !== 13 && (
          <p className="mt-1 text-xs text-red-600">ต้องเป็นตัวเลข 13 หลัก (ตอนนี้ {form.tax_id.length}/13)</p>
        )}
      </div>
      <div>
        <Label>ที่อยู่บริษัท (สำหรับใบกำกับภาษี) *</Label>
        <Textarea value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} required rows={3} maxLength={500} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>ชื่อผู้ติดต่อ *</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
        </div>
        <div>
          <Label>ตำแหน่ง</Label>
          <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} maxLength={100} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>เบอร์โทรศัพท์ *</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="0812345678" maxLength={10} />
        </div>
        <div>
          <Label>อีเมล *</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div>
        <Label>รหัสผ่าน * (≥ 8 ตัว)</Label>
        <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
      </div>
      <div>
        <Label className="mb-2 block">ต้องการใบกำกับภาษี</Label>
        <RadioGroup
          value={form.wants_tax_invoice ? "yes" : "no"}
          onValueChange={(v) => setForm({ ...form, wants_tax_invoice: v === "yes" })}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> ใช่</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> ไม่ใช่</label>
        </RadioGroup>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]">
        {busy ? "กำลังสมัคร..." : "สมัครสมาชิก B2B"}
      </Button>
    </form>
  );
}
