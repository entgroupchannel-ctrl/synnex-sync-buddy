/**
 * src/routes/_authenticated/admin.distributor-contacts.tsx
 * หน้าจัดการข้อมูลติดต่อ + ข้อมูลบริษัทของแต่ละ distributor (สำหรับออก PO / ส่งอีเมล)
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { distMeta } from "@/lib/order-helpers";

export const Route = createFileRoute("/_authenticated/admin/distributor-contacts")({
  ssr: false,
  head: () => ({ meta: [{ title: "ข้อมูล Distributor — ENT Admin" }] }),
  component: DistributorContactsPage,
});

type ContactRow = {
  id: string;
  distributor: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
  notes: string | null;
};

function ContactForm({ row, onSaved }: { row: ContactRow; onSaved: () => void }) {
  const [form, setForm] = useState(row);
  const [saving, setSaving] = useState(false);
  const dm = distMeta(row.distributor);

  const set =
    (k: keyof ContactRow) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("distributor_contacts")
      .update({
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        company_name: form.company_name,
        tax_id: form.tax_id,
        address: form.address,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`บันทึกข้อมูล ${row.distributor} แล้ว`);
    onSaved();
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${dm.bg} ${dm.text} ring-1 ${dm.ring}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} />
          {dm.label}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>ชื่อบริษัท (นิติบุคคล)</Label>
          <Input value={form.company_name ?? ""} onChange={set("company_name")} />
        </div>
        <div>
          <Label>เลขผู้เสียภาษี</Label>
          <Input value={form.tax_id ?? ""} onChange={set("tax_id")} />
        </div>
        <div className="sm:col-span-2">
          <Label>ที่อยู่</Label>
          <Textarea rows={3} value={form.address ?? ""} onChange={set("address")} />
        </div>
        <div>
          <Label>ชื่อผู้ติดต่อ</Label>
          <Input value={form.contact_name ?? ""} onChange={set("contact_name")} />
        </div>
        <div>
          <Label>เบอร์โทร</Label>
          <Input value={form.contact_phone ?? ""} onChange={set("contact_phone")} />
        </div>
        <div className="sm:col-span-2">
          <Label>อีเมลสำหรับส่ง PO</Label>
          <Input
            type="email"
            value={form.contact_email ?? ""}
            onChange={set("contact_email")}
            placeholder="purchasing@distributor.com"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>หมายเหตุ</Label>
          <Textarea rows={2} value={form.notes ?? ""} onChange={set("notes")} />
        </div>
      </div>

      <Button className="mt-4" disabled={saving} onClick={save}>
        <Save className="mr-1.5 h-4 w-4" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </div>
  );
}

function DistributorContactsPage() {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ["distributor-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("distributor_contacts")
        .select("*")
        .order("distributor");
      if (error) throw error;
      return data as ContactRow[];
    },
  });

  if (listQ.isLoading) return <div className="p-6 text-sm text-slate-500">กำลังโหลด...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-6 w-6 text-[color:var(--brand-navy)]" /> ข้อมูล Distributor
        </h1>
        <p className="text-sm text-slate-500">
          ข้อมูลบริษัท + ผู้ติดต่อ ใช้สำหรับออก PO และส่งอีเมลถึง supplier
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(listQ.data ?? []).map((row) => (
          <ContactForm
            key={row.id}
            row={row}
            onSaved={() => qc.invalidateQueries({ queryKey: ["distributor-contacts"] })}
          />
        ))}
      </div>
    </div>
  );
}
