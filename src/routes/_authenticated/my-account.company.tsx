import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-account/company")({
  head: () => ({
    meta: [
      { title: "ข้อมูลบริษัท — ENT Group IT Shop" },
      { name: "description", content: "จัดการข้อมูลบริษัทของคุณสำหรับใบกำกับภาษี" },
      { property: "og:title", content: "ข้อมูลบริษัท" },
      { property: "og:description", content: "ข้อมูลบริษัทสำหรับ B2B" },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: "", tax_id: "", company_address: "", position: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) {
        setStatus(p.account_status);
        setUserType(p.user_type);
        setForm({
          company_name: p.company_name ?? "",
          tax_id: p.tax_id ?? "",
          company_address: p.company_address ?? "",
          position: p.position ?? "",
        });
      }
    });
  }, []);

  const save = async () => {
    if (!uid) return;
    setBusy(true);
    const { error } = await supabase.from("user_profiles").update(form).eq("id", uid);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("บันทึกแล้ว");
  };

  if (userType && userType !== "b2b") {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-slate-600">เฉพาะบัญชี B2B เท่านั้น</p>
        <Link to="/my-account/profile" className="mt-3 inline-block text-sm text-[color:var(--brand-navy)] underline">กลับไปข้อมูลส่วนตัว</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        {status === "active" && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5" /> บัญชีได้รับการยืนยัน ✓
          </div>
        )}
        {status === "pending_approval" && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <Clock className="h-5 w-5" /> รอการยืนยันจากทีมงาน (1-2 วันทำการ)
          </div>
        )}
        {status === "rejected" && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle className="h-5 w-5" /> บัญชีถูกปฏิเสธ — โปรดติดต่อทีมงาน
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[color:var(--brand-navy)]">ข้อมูลบริษัท</h2>
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">B2B</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>ชื่อบริษัท</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} maxLength={200} />
          </div>
          <div>
            <Label>เลขประจำตัวผู้เสียภาษี (13 หลัก)</Label>
            <Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value.replace(/\D/g, "") })} maxLength={13} inputMode="numeric" />
          </div>
          <div>
            <Label>ตำแหน่ง</Label>
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} maxLength={100} />
          </div>
          <div className="sm:col-span-2">
            <Label>ที่อยู่บริษัท</Label>
            <Textarea rows={3} value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} maxLength={500} />
          </div>
        </div>

        <Button onClick={save} disabled={busy} className="mt-4 bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
          {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </div>
    </div>
  );
}
