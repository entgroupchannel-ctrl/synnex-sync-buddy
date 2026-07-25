/**
 * src/components/slip-verification-badge.tsx  (ไฟล์ใหม่)
 * แสดงผลตรวจสอบสลิป + ปุ่มตรวจสอบซ้ำ ใช้ในหน้า admin.orders.$id.tsx
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FLAG_LABEL: Record<string, string> = {
  DUPLICATE_SLIP: "สลิปนี้เคยถูกใช้ยืนยันการโอนมาก่อนแล้ว (อาจเอาสลิปเก่ามาใช้ซ้ำ)",
  DUPLICATE_SLIP_IN_OUR_SYSTEM: "สลิปนี้ถูกใช้ยืนยันกับออเดอร์อื่นในระบบเราไปแล้ว",
  AMOUNT_MISMATCH: "ยอดเงินในสลิปไม่ตรงกับยอดออเดอร์นี้",
  ACCOUNT_MISMATCH: "ปลายทางการโอนไม่ตรงกับบัญชีของบริษัท",
  FAKE_OR_INVALID_SLIP: "รูปนี้ไม่ใช่สลิปโอนเงินจริง หรือ QR Code ไม่มีธุรกรรมอยู่จริง — สัญญาณสลิปปลอมสูง",
};

type SlipVerification = {
  id: string;
  trans_ref: string | null;
  slip_amount: number | null;
  sender_name: string | null;
  sender_bank: string | null;
  receiver_name: string | null;
  receiver_bank: string | null;
  risk_flags: string[];
  auto_approved: boolean;
  error_message: string | null;
  created_at: string;
};

export function SlipVerificationBadge({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const q = useQuery({
    queryKey: ["slip-verification", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slip_verifications")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SlipVerification | null;
    },
  });

  const runCheck = async () => {
    setChecking(true);
    const { data, error } = await supabase.functions.invoke("verify-payment-slip", { body: { order_id: orderId } });
    setChecking(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "ตรวจสอบสลิปไม่สำเร็จ");
      return;
    }
    toast.success(data.auto_approved ? "ตรวจสอบผ่าน ยืนยันการชำระเงินแล้ว" : "ตรวจสอบเสร็จ พบข้อควรระวัง โปรดดูรายละเอียด");
    qc.invalidateQueries({ queryKey: ["slip-verification", orderId] });
  };

  const v = q.data;

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">ผลตรวจสอบสลิป (ธนาคาร)</span>
        <Button size="sm" variant="outline" disabled={checking} onClick={runCheck}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {v ? "ตรวจสอบอีกครั้ง" : "ตรวจสอบสลิป"}
        </Button>
      </div>

      {!v ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldQuestion className="h-4 w-4" /> ยังไม่ได้ตรวจสอบ
        </div>
      ) : v.error_message ? (
        <div className="flex items-start gap-2 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>ตรวจสอบไม่สำเร็จ: {v.error_message}</span>
        </div>
      ) : v.auto_approved ? (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> ตรวจสอบผ่าน — ยืนยันอัตโนมัติแล้ว
          </div>
          <div className="text-xs text-slate-500">
            เลขอ้างอิง {v.trans_ref} · โอนจาก {v.sender_name} ({v.sender_bank}) · ยอด ฿{v.slip_amount?.toLocaleString("th-TH")}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" /> พบความผิดปกติ — ต้องตรวจสอบด้วยตนเอง
          </div>
          <ul className="ml-6 list-disc space-y-0.5 text-xs text-red-600">
            {v.risk_flags.map((f) => (
              <li key={f}>{FLAG_LABEL[f] ?? f}</li>
            ))}
          </ul>
          {v.sender_name && (
            <div className="text-xs text-slate-500">
              โอนจาก {v.sender_name} ({v.sender_bank}) → {v.receiver_name} ({v.receiver_bank}) · ยอด ฿{v.slip_amount?.toLocaleString("th-TH")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
