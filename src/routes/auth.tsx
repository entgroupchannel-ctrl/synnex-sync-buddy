import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Synnex Product Sync" },
      { name: "description", content: "Admin login for the Synnex Thailand product sync dashboard." },
      { property: "og:title", content: "Synnex Sync — Admin Login" },
      { property: "og:description", content: "Admin login for the Synnex Thailand product sync dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin/sync", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("เข้าสู่ระบบสำเร็จ");
        navigate({ to: "/admin/sync", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin/sync" },
        });
        if (error) throw error;
        toast.success("สร้างบัญชีสำเร็จ กรุณายืนยันอีเมล (ถ้าจำเป็น)");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sarabun flex items-center justify-center px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md rounded-xl border border-slate-200 shadow-sm">
        <div className="rounded-t-xl bg-[#1a237e] px-6 py-5 text-white">
          <h1 className="text-xl font-semibold">Synnex Product Sync</h1>
          <p className="text-sm text-white/80">
            {mode === "signin" ? "เข้าสู่ระบบผู้ดูแล" : "สร้างบัญชีผู้ดูแล"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[#1565c0] hover:bg-[#0d47a1] text-white"
          >
            {busy ? "กำลังดำเนินการ…" : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm text-[#1565c0] hover:underline"
          >
            {mode === "signin" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
