import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-account/profile")({
  head: () => ({
    meta: [
      { title: "ข้อมูลส่วนตัว — ENT Group IT Shop" },
      { name: "description", content: "จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ" },
      { property: "og:title", content: "ข้อมูลส่วนตัว" },
      { property: "og:description", content: "จัดการข้อมูลส่วนตัว" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<{ full_name: string; phone: string; user_type: string; account_status: string | null }>({
    full_name: "", phone: "", user_type: "b2c", account_status: null,
  });
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) setProfile({
        full_name: p.full_name ?? "",
        phone: p.phone ?? "",
        user_type: p.user_type ?? "b2c",
        account_status: p.account_status ?? null,
      });
    });
  }, []);

  const saveProfile = async () => {
    if (!uid) return;
    setBusy(true);
    const { error } = await supabase.from("user_profiles").upsert({
      id: uid,
      user_type: profile.user_type,
      full_name: profile.full_name || null,
      phone: profile.phone || null,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("บันทึกแล้ว");
  };

  const saveEmail = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("ส่งอีเมลยืนยันการเปลี่ยนไปที่อีเมลใหม่แล้ว");
  };

  const changePassword = async () => {
    if (!email) return;
    if (pw.next.length < 8) { toast.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว"); return; }
    if (pw.next !== pw.confirm) { toast.error("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    setPwBusy(true);
    // Verify current password by re-authenticating
    const { error: reErr } = await supabase.auth.signInWithPassword({ email, password: pw.current });
    if (reErr) { setPwBusy(false); toast.error("รหัสผ่านปัจจุบันไม่ถูกต้อง"); return; }
    const { error: upErr } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (upErr) toast.error(upErr.message);
    else {
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      setPw({ current: "", next: "", confirm: "" });
    }
  };

  const isB2B = profile.user_type === "b2b";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[color:var(--brand-navy)]">ข้อมูลส่วนตัว</h2>
          <div className="flex items-center gap-2">
            <Badge className={isB2B ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}>
              {isB2B ? "B2B" : "B2C"}
            </Badge>
            {profile.account_status === "pending_approval" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอยืนยัน</Badge>}
            {profile.account_status === "active" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>ชื่อ-นามสกุล</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} maxLength={100} /></div>
          <div><Label>เบอร์โทร</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={10} inputMode="numeric" /></div>
        </div>
        <Button onClick={saveProfile} disabled={busy} className="mt-4 bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
          {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-3 text-lg font-bold text-[color:var(--brand-navy)]">อีเมล</h2>
        <div className="flex flex-wrap gap-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-md" type="email" />
          <Button variant="outline" onClick={saveEmail} disabled={busy}>เปลี่ยนอีเมล</Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Supabase จะส่งอีเมลยืนยันไปที่อีเมลใหม่ก่อนเปลี่ยน</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-3 text-lg font-bold text-[color:var(--brand-navy)]">เปลี่ยนรหัสผ่าน</h2>
        <div className="grid gap-3 sm:max-w-md">
          <div><Label>รหัสผ่านปัจจุบัน</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></div>
          <div><Label>รหัสผ่านใหม่</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></div>
          <div><Label>ยืนยันรหัสผ่านใหม่</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></div>
        </div>
        <Button onClick={changePassword} disabled={pwBusy} className="mt-4 bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
          {pwBusy ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
        </Button>
      </div>
    </div>
  );
}
