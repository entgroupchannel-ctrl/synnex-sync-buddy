/**
 * src/routes/_authenticated/my-account.payment.tsx  (ไฟล์ใหม่)
 * หน้าจัดการบัตรที่บันทึกไว้ — mirror ของ Shopee "บัญชีธนาคาร&บัตร"
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { OmiseCardForm } from "@/components/omise-card-form";

export const Route = createFileRoute("/_authenticated/my-account/payment")({
  ssr: false,
  head: () => ({ meta: [{ title: "บัตรเครดิต/เดบิต — ENT Group IT Retail Shop" }] }),
  component: PaymentMethodsPage,
});

type SavedCard = {
  id: string;
  brand: string;
  last_digits: string;
  expiration_month: number | null;
  expiration_year: number | null;
  is_default: boolean;
};

const BRAND_LABEL: Record<string, string> = {
  Visa: "VISA", MasterCard: "Master Card", JCB: "JCB", "American Express": "AMEX",
};

function PaymentMethodsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cardsQ = useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_cards")
        .select("id, brand, last_digits, expiration_month, expiration_year, is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SavedCard[];
    },
  });

  const handleAddToken = async (token: string, saveCard: boolean) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("save-omise-card", {
      body: { token, set_default: (cardsQ.data?.length ?? 0) === 0 },
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? "เพิ่มบัตรไม่สำเร็จ");
      return;
    }
    toast.success("เพิ่มบัตรสำเร็จ");
    setAddOpen(false);
    qc.invalidateQueries({ queryKey: ["saved-cards"] });
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    await supabase.from("saved_cards").update({ is_default: false }).neq("id", id);
    await supabase.from("saved_cards").update({ is_default: true }).eq("id", id);
    setBusyId(null);
    qc.invalidateQueries({ queryKey: ["saved-cards"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบบัตรนี้ใช่ไหม?")) return;
    setBusyId(id);
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("delete-omise-card", {
      body: { saved_card_id: id },
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });
    setBusyId(null);
    if (error || data?.error) {
      toast.error(data?.error ?? "ลบบัตรไม่สำเร็จ");
      return;
    }
    toast.success("ลบบัตรแล้ว");
    qc.invalidateQueries({ queryKey: ["saved-cards"] });
  };

  const cards = cardsQ.data ?? [];

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">บัตรเครดิต / บัตรเดบิต</h2>
          <p className="text-sm text-slate-500">บัตรที่บันทึกไว้จะใช้ชำระเงินได้ทันทีตอน checkout โดยไม่ต้องกรอกใหม่</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มบัตรใหม่
        </Button>
      </div>

      <div className="mt-4 divide-y">
        {cardsQ.isLoading ? (
          <p className="py-6 text-sm text-slate-400">กำลังโหลด...</p>
        ) : cards.length === 0 ? (
          <p className="py-10 text-center text-slate-400">คุณยังไม่ได้เพิ่มบัตร</p>
        ) : (
          cards.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-slate-400" />
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {BRAND_LABEL[c.brand] ?? c.brand}
                    {c.is_default && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">ค่าเริ่มต้น</span>
                    )}
                  </div>
                  {c.expiration_month && c.expiration_year && (
                    <div className="text-xs text-slate-400">หมดอายุ {String(c.expiration_month).padStart(2, "0")}/{c.expiration_year}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-slate-500">**** **** **** {c.last_digits}</span>
                <button
                  disabled={busyId === c.id}
                  onClick={() => handleDelete(c.id)}
                  className="inline-flex items-center gap-1 text-slate-500 underline hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> ลบ
                </button>
                {!c.is_default && (
                  <button
                    disabled={busyId === c.id}
                    onClick={() => handleSetDefault(c.id)}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                  >
                    <Star className="h-3.5 w-3.5" /> ตั้งเป็นค่าเริ่มต้น
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มบัตรใหม่</DialogTitle>
          </DialogHeader>
          <OmiseCardForm onToken={handleAddToken} showSaveOption={false} submitLabel="เพิ่มบัตร" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
