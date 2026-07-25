/**
 * src/components/admin-order-slip-cell.tsx  (ไฟล์ใหม่)
 * ปุ่ม/badge ตรวจสอบสลิปแบบย่อ ใช้ในตารางรายการออเดอร์ (admin.orders.tsx)
 * แสดงปุ่มไว้ทุกแถวเสมอ — ถ้ายังไม่มีสลิปจะ disable ไว้ก่อน พอมีสลิปแล้วกดตรวจสอบได้ทันที
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AdminOrderSlipCell({ orderId, hasSlip }: { orderId: string; hasSlip: boolean }) {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const q = useQuery({
    queryKey: ["slip-verification", orderId],
    enabled: hasSlip,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slip_verifications")
        .select("auto_approved, error_message, risk_flags")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { auto_approved: boolean; error_message: string | null; risk_flags: string[] } | null;
    },
  });

  const runCheck = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasSlip || checking) return;
    setChecking(true);
    const { data, error } = await supabase.functions.invoke("verify-payment-slip", { body: { order_id: orderId } });
    setChecking(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "ตรวจสอบสลิปไม่สำเร็จ");
      return;
    }
    toast.success(data.auto_approved ? "ตรวจสอบผ่าน ยืนยันการชำระเงินแล้ว" : "ตรวจสอบเสร็จ พบข้อควรระวัง");
    qc.invalidateQueries({ queryKey: ["slip-verification", orderId] });
  };

  const v = q.data;
  const statusBadge = !hasSlip ? null : !v ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><ShieldQuestion className="h-3 w-3" /> ยังไม่ตรวจ</span>
  ) : v.error_message ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle className="h-3 w-3" /> ตรวจไม่สำเร็จ</span>
  ) : v.auto_approved ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" /> ผ่าน</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3 w-3" /> พบปัญหา ({v.risk_flags?.length ?? 0})</span>
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={runCheck}
        disabled={!hasSlip || checking}
        title={hasSlip ? "ตรวจสอบสลิปกับธนาคาร" : "ยังไม่มีสลิปแนบมา"}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
          hasSlip
            ? "border-slate-300 text-slate-700 hover:bg-slate-50"
            : "cursor-not-allowed border-slate-200 text-slate-300"
        }`}
      >
        {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        ตรวจสอบสลิป
      </button>
      {statusBadge}
    </div>
  );
}
