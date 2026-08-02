import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
      { title: "เข้าสู่ระบบ / สมัครสมาชิก — ENT Group IT Retail Shop" },
      { name: "description", content: "เข้าสู่ระบบหรือสมัครสมาชิก ENT Group IT Retail Shop สำหรับลูกค้าทั่วไปและองค์กร" },
      { property: "og:title", content: "เข้าสู่ระบบ — ENT Group IT Retail Shop" },
      { property: "og:description", content: "สมัครสมาชิกลูกค้าทั่วไปหรือองค์กร (B2B) ที่ ENT Group IT Retail Shop" },
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
  const [profileType, setProfileType] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_type")
        .eq("id", data.user.id)
        .maybeSingle();
      // เพิ่ง Google login มาบนแท็บ B2B แต่ยังไม่ได้กรอกข้อมูลบริษัท → ค้างอยู่หน้านี้
      if (search.tab === "b2b" && profile?.user_type === "b2c") {
        setProfileType("b2c");
        return;
      }
      navigate({ to: search.redirect as never, replace: true });
    });
  }, [navigate, search.redirect, search.tab]);

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
            <p className="mt-1 text-sm text-white/80">ENT Group IT Retail Shop</p>
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
              <SignUpB2BForm alreadySignedIn={profileType === "b2c"} />
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
      <SiteFooter />
    </div>
  );
}

const REMEMBER_EMAIL_KEY = "auth:rememberedEmail";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79v8.44C19.61 23.08 24 18.09 24 12.07z" />
    </svg>
  );
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#06C755">
      <path d="M24 10.3C24 4.62 18.63 0 12 0S0 4.62 0 10.3c0 5.1 4.26 9.37 10.02 10.18.39.08.92.26 1.05.6.12.3.08.78.04 1.09l-.17 1.03c-.05.3-.24 1.18 1.03.65 1.28-.55 6.86-4.03 9.36-6.91C22.94 15 24 12.77 24 10.3zM7.9 13.15H6.15a.42.42 0 0 1-.42-.42V8.34c0-.23.19-.42.42-.42s.42.19.42.42v3.97h1.33c.23 0 .42.19.42.42s-.19.42-.42.42zm1.83-.42c0 .23-.19.42-.42.42s-.42-.19-.42-.42V8.34c0-.23.19-.42.42-.42s.42.19.42.42zm4.68 0c0 .18-.11.34-.28.4a.44.44 0 0 1-.14.02.42.42 0 0 1-.34-.17l-2.05-2.79v2.54c0 .23-.19.42-.42.42s-.42-.19-.42-.42V8.34c0-.18.11-.34.28-.4a.4.4 0 0 1 .13-.02c.13 0 .26.06.34.17l2.05 2.79V8.34c0-.23.19-.42.42-.42s.42.19.42.42zm3.35-3.15c.23 0 .42.19.42.42s-.19.42-.42.42h-1.75v1.06h1.75c.23 0 .42.19.42.42s-.19.42-.42.42h-2.17a.42.42 0 0 1-.42-.42V8.34c0-.23.19-.42.42-.42h2.17c.23 0 .42.19.42.42s-.19.42-.42.42h-1.75v.98z" />
    </svg>
  );
}

type OAuthProvider = "google" | "facebook" | "custom:line";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  "custom:line": "LINE",
};

/** ปุ่ม social login — ใช้ร่วมกัน 3 จุด: signin, สมัคร B2C, สมัคร B2B */
function OAuthButtons({ nextPath, labelPrefix = "เข้าสู่ระบบด้วย" }: { nextPath?: string; labelPrefix?: string }) {
  const [busyProvider, setBusyProvider] = useState<OAuthProvider | null>(null);

  const signIn = async (provider: OAuthProvider) => {
    setBusyProvider(provider);
    try {
      if (nextPath) window.sessionStorage.setItem("auth:nextPath", nextPath);
    } catch { /* sessionStorage ใช้ไม่ได้ ข้ามไป */ }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as never, // custom OIDC provider id ("custom:line") ยังไม่อยู่ใน type ของ supabase-js
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) {
      const m = error.message.toLowerCase();
      const providerName = PROVIDER_LABEL[provider];
      const notConfigured =
        m.includes("provider") ||
        m.includes("redirect") ||
        m.includes("domain") ||
        m.includes("not enabled") ||
        m.includes("client");
      toast.error(
        notConfigured
          ? `ยังตั้งค่า ${providerName} Login ไม่เสร็จ — ใช้อีเมล/รหัสผ่านเข้าสู่ระบบได้ตามปกติ`
          : error.message,
      );
      setBusyProvider(null);
    }

    // สำเร็จแล้วเบราว์เซอร์จะ redirect ออกจากหน้านี้เอง
  };

  return (
    <>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-400">หรือ{labelPrefix ? "" : ""}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" disabled={!!busyProvider} onClick={() => signIn("google")} className="gap-1.5 px-2">
          <GoogleIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{busyProvider === "google" ? "..." : "Google"}</span>
        </Button>
        <Button type="button" variant="outline" disabled={!!busyProvider} onClick={() => signIn("facebook")} className="gap-1.5 px-2">
          <FacebookIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{busyProvider === "facebook" ? "..." : "Facebook"}</span>
        </Button>
        <Button type="button" variant="outline" disabled={!!busyProvider} onClick={() => signIn("custom:line")} className="gap-1.5 px-2">
          <LineIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{busyProvider === "custom:line" ? "..." : "LINE"}</span>
        </Button>
      </div>
    </>
  );
}


function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    try {
      return !!window.localStorage.getItem(REMEMBER_EMAIL_KEY);
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
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
    // จำแค่ "อีเมล" ไว้เพื่อ prefill ครั้งหน้า — ไม่เก็บรหัสผ่านเองฝั่ง client
    try {
      if (remember) window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      else window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch {
      // localStorage ใช้ไม่ได้ (เช่น private mode) ไม่ critical ข้ามไป
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

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + "/auth/callback",
    });
    setForgotBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงถังขยะ/สแปม)", { duration: 6000 });
    setMode("signin");
  };

  if (mode === "forgot") {
    return (
      <form onSubmit={onForgotSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
        <div>
          <Label htmlFor="fp-email">อีเมล</Label>
          <Input
            id="fp-email"
            type="email"
            required
            autoComplete="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={forgotBusy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
          {forgotBusy ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
        </Button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="w-full text-center text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="si-email">อีเมล</Label>
        <Input id="si-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="si-pass">รหัสผ่าน</Label>
        <PasswordInput id="si-pass" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
          จดจำอีเมลของฉัน
        </label>
        <button
          type="button"
          onClick={() => { setForgotEmail(email); setMode("forgot"); }}
          className="text-xs font-medium text-[color:var(--brand-navy)] underline underline-offset-2 hover:text-[color:var(--brand-orange)]"
        >
          ลืมรหัสผ่าน?
        </button>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
        {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>

      <OAuthButtons />

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
          <PasswordInput autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </div>
        <div>
          <Label>ยืนยันรหัสผ่าน *</Label>
          <PasswordInput autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
        {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>
      <OAuthButtons />
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

function SignUpB2BForm({ alreadySignedIn }: { alreadySignedIn: boolean }) {
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
    const schema = alreadySignedIn ? b2bSchema.omit({ email: true, password: true }) : b2bSchema;
    const p = schema.safeParse(form);
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);

    if (alreadySignedIn) {
      const { error } = await supabase.rpc("apply_for_b2b", {
        p_full_name: form.full_name,
        p_phone: form.phone,
        p_company_name: form.company_name,
        p_tax_id: form.tax_id,
        p_company_address: form.company_address,
        p_position: form.position,
        p_wants_tax_invoice: form.wants_tax_invoice,
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("ลงทะเบียน B2B สำเร็จ! ทีมงานจะติดต่อยืนยันบัญชีภายใน 1 วันทำการ", { duration: 6000 });
      return;
    }

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
      {!alreadySignedIn && (
        <div>
          <p className="mb-2 text-xs text-slate-500">สมัคร B2B ด้วย Google/Facebook (กรอกข้อมูลบริษัทต่อหลังล็อกอิน)</p>
          <OAuthButtons nextPath="/auth?tab=b2b" />
        </div>
      )}
      {alreadySignedIn && (
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          ✅ ล็อกอินแล้ว — กรอกข้อมูลบริษัทให้ครบเพื่อส่งคำขอ B2B
        </div>
      )}

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
      <div>
        <Label>เบอร์โทรศัพท์ *</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="0812345678" maxLength={10} />
      </div>
      {!alreadySignedIn && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>อีเมล *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>รหัสผ่าน * (≥ 8 ตัว)</Label>
            <PasswordInput autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
        </div>
      )}
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
        {busy ? "กำลังบันทึก..." : alreadySignedIn ? "ส่งคำขอสมัคร B2B" : "สมัครสมาชิก B2B"}

      </Button>
    </form>
  );
}
