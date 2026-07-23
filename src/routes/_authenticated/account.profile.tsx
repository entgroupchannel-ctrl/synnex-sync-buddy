import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({
    meta: [
      { title: "ข้อมูลส่วนตัว — ENT Group IT Shop" },
      { name: "description", content: "จัดการข้อมูลส่วนตัวและข้อมูลบริษัท" },
      { property: "og:title", content: "ข้อมูลส่วนตัว" },
      { property: "og:description", content: "จัดการข้อมูลบัญชี ENT Group IT Shop" },
    ],
  }),
  component: AccountProfile,
});

function AccountProfile() {
  const [profile, setProfile] = useState<{
    id?: string;
    user_type?: string | null;
    full_name?: string | null;
    phone?: string | null;
    company_name?: string | null;
    tax_id?: string | null;
    company_address?: string | null;
    position?: string | null;
    account_status?: string | null;
    wants_tax_invoice?: boolean | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", data.user.id).maybeSingle();
      setProfile(p ?? { id: data.user.id, user_type: "b2c" });
    });
  }, []);

  const save = async () => {
    if (!profile?.id) return;
    setBusy(true);
    const { error } = await supabase.from("user_profiles").upsert({
      id: profile.id,
      user_type: profile.user_type ?? "b2c",
      full_name: profile.full_name ?? null,
      phone: profile.phone ?? null,
      company_name: profile.company_name ?? null,
      tax_id: profile.tax_id ?? null,
      company_address: profile.company_address ?? null,
      position: profile.position ?? null,
      wants_tax_invoice: profile.wants_tax_invoice ?? false,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("บันทึกข้อมูลแล้ว");
  };

  if (!profile) return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-8"><div className="h-40 animate-pulse rounded-lg bg-slate-200" /></div>
    </div>
  );

  const isB2B = profile.user_type === "b2b";

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-[color:var(--brand-navy)]">ข้อมูลส่วนตัว</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{isB2B ? "B2B" : "B2C"}</Badge>
            {profile.account_status === "pending_approval" && (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอยืนยัน</Badge>
            )}
            {profile.account_status === "active" && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-6">
          <div>
            <Label>ชื่อ-นามสกุล</Label>
            <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} maxLength={100} />
          </div>
          <div>
            <Label>เบอร์โทรศัพท์</Label>
            <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="0812345678" maxLength={10} />
          </div>

          {isB2B && (
            <>
              <div className="mt-6 border-t pt-6">
                <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">ข้อมูลบริษัท</h2>
                <div className="space-y-3">
                  <div>
                    <Label>ชื่อบริษัท</Label>
                    <Input value={profile.company_name ?? ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} maxLength={200} />
                  </div>
                  <div>
                    <Label>เลขประจำตัวผู้เสียภาษี (13 หลัก)</Label>
                    <Input
                      value={profile.tax_id ?? ""}
                      onChange={(e) => setProfile({ ...profile, tax_id: e.target.value.replace(/\D/g, "") })}
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </div>
                  <div>
                    <Label>ที่อยู่บริษัท</Label>
                    <Textarea rows={3} value={profile.company_address ?? ""} onChange={(e) => setProfile({ ...profile, company_address: e.target.value })} maxLength={500} />
                  </div>
                  <div>
                    <Label>ตำแหน่ง</Label>
                    <Input value={profile.position ?? ""} onChange={(e) => setProfile({ ...profile, position: e.target.value })} maxLength={100} />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={save} disabled={busy} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
            {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </div>
    </div>
  );
}
