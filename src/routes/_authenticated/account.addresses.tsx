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
import { Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  head: () => ({
    meta: [
      { title: "ที่อยู่จัดส่ง — ENT Group IT Shop" },
      { name: "description", content: "จัดการที่อยู่จัดส่งของคุณ" },
      { property: "og:title", content: "ที่อยู่จัดส่ง" },
      { property: "og:description", content: "จัดการที่อยู่จัดส่งของคุณ" },
    ],
  }),
  component: AddressesPage,
});

type Address = {
  id: string;
  label: string | null;
  recipient: string | null;
  phone: string | null;
  address_line: string | null;
  district: string | null;
  province: string | null;
  postcode: string | null;
  is_default: boolean | null;
};

function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "บ้าน",
    recipient: "",
    phone: "",
    address_line: "",
    district: "",
    province: "",
    postcode: "",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const load = async (uid: string) => {
    const { data } = await supabase.from("user_addresses").select("*").eq("user_id", uid).order("is_default", { ascending: false });
    setAddresses((data ?? []) as Address[]);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        load(data.user.id);
      }
    });
  }, []);

  const add = async () => {
    if (!userId) return;
    setSaving(true);
    if (form.is_default) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", userId);
    }
    const { error } = await supabase.from("user_addresses").insert({ ...form, user_id: userId });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("เพิ่มที่อยู่แล้ว");
    setForm({ label: "บ้าน", recipient: "", phone: "", address_line: "", district: "", province: "", postcode: "", is_default: false });
    load(userId);
  };

  const remove = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from("user_addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("ลบแล้ว");
    load(userId);
  };

  const makeDefault = async (id: string) => {
    if (!userId) return;
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    load(userId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-[color:var(--brand-navy)]">ที่อยู่จัดส่ง</h1>

        <div className="mb-6 space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border bg-white p-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-[color:var(--brand-navy)]">{a.label ?? "บ้าน"}</span>
                  {a.is_default && <Badge className="bg-[color:var(--brand-green)] text-white hover:bg-[color:var(--brand-green)]">ค่าเริ่มต้น</Badge>}
                </div>
                <div className="text-sm">{a.recipient} · {a.phone}</div>
                <div className="text-sm text-slate-600">
                  {[a.address_line, a.district, a.province, a.postcode].filter(Boolean).join(" ")}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {!a.is_default && (
                  <button onClick={() => makeDefault(a.id)} className="text-xs text-[color:var(--brand-navy)] hover:underline" title="ตั้งเป็นค่าเริ่มต้น">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="rounded-lg border bg-white p-6 text-center text-sm text-slate-500">ยังไม่มีที่อยู่</div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 font-bold text-[color:var(--brand-navy)]">เพิ่มที่อยู่ใหม่</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>ป้ายกำกับ</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="บ้าน / ที่ทำงาน" maxLength={30} /></div>
            <div><Label>ผู้รับ</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} maxLength={100} /></div>
            <div><Label>เบอร์โทร</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812345678" maxLength={10} /></div>
            <div><Label>รหัสไปรษณีย์</Label><Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.replace(/\D/g, "") })} maxLength={5} inputMode="numeric" /></div>
            <div className="sm:col-span-2"><Label>ที่อยู่ (บ้านเลขที่ ถนน)</Label><Textarea rows={2} value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} maxLength={200} /></div>
            <div><Label>อำเภอ/เขต</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={100} /></div>
            <div><Label>จังหวัด</Label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} maxLength={100} /></div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> ตั้งเป็นค่าเริ่มต้น
          </label>
          <Button onClick={add} disabled={saving} className="mt-4 w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
            <Plus className="mr-1 h-4 w-4" /> {saving ? "กำลังบันทึก..." : "เพิ่มที่อยู่"}
          </Button>
        </div>
      </div>
    </div>
  );
}
