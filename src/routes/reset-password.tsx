import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ตั้งรหัสผ่านใหม่ — ENT Group IT Retail Shop" },
      {
        name: "description",
        content: "ตั้งรหัสผ่านใหม่สำหรับบัญชี ENT Group IT Retail Shop",
      },
      { property: "og:title", content: "ตั้งรหัสผ่านใหม่ — ENT Group IT Retail Shop" },
      {
        property: "og:description",
        content: "ตั้งรหัสผ่านใหม่สำหรับบัญชี ENT Group IT Retail Shop",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "รหัสผ่านไม่ตรงกัน",
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // ลิงก์รีเซ็ตรหัสผ่านจากอีเมลจะพาผ่าน /auth/callback มาตั้ง session ชั่วคราวไว้ก่อนแล้ว
  // ถ้าเปิดหน้านี้ตรงๆ โดยไม่มี session (เช่น ลิงก์หมดอายุ/ถูกเปิดซ้ำ) ต้องกันไว้
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse({ password, confirm });
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-[color:var(--brand-navy)]">
            ตั้งรหัสผ่านใหม่
          </h1>
          <div className="mt-5">
            {hasSession === null ? (
              <p className="text-sm text-slate-500">กำลังตรวจสอบลิงก์...</p>
            ) : hasSession === false ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600">
                  ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรือหมดอายุแล้ว
                </p>
                <Link
                  to="/auth"
                  className="inline-block text-sm font-semibold text-[color:var(--brand-navy)] underline underline-offset-2"
                >
                  กลับไปหน้าเข้าสู่ระบบเพื่อขอลิงก์ใหม่
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rp-pass">รหัสผ่านใหม่ (≥ 8 ตัว)</Label>
                  <PasswordInput
                    id="rp-pass"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rp-confirm">ยืนยันรหัสผ่านใหม่</Label>
                  <PasswordInput
                    id="rp-confirm"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]"
                >
                  {busy ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
