/**
 * src/components/admin-order-slip-cell.tsx  (แทนที่ไฟล์เดิมทั้งไฟล์)
 * ปุ่ม/badge ตรวจสอบสลิปแบบย่อ ใช้ในตารางรายการออเดอร์ (admin.orders.tsx)
 * แสดงปุ่มไว้ทุกแถวเสมอ — ถ้ายังไม่มีสลิปจะ disable ไว้ก่อน พอมีสลิปแล้วกดตรวจสอบได้ทันที
 * คลิก "ดูสลิป" เพื่อขยายดูรูปสลิปจริง + รายละเอียด + ปุ่มตรวจสอบซ้ำ พร้อม countdown กันกดถี่เกินไป
 */
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FLAG_LABEL: Record<string, string> = {
  DUPLICATE_SLIP: "สลิปนี้เคยถูกใช้ยืนยันการโอนมาก่อนแล้ว",
  DUPLICATE_SLIP_IN_OUR_SYSTEM: "สลิปนี้ถูกใช้ยืนยันกับออเดอร์อื่นในระบบเราไปแล้ว",
  AMOUNT_MISMATCH: "ยอดเงินในสลิปไม่ตรงกับยอดออเดอร์นี้",
  ACCOUNT_MISMATCH: "ปลายทางการโอนไม่ตรงกับบัญชีของบริษัท",
  FAKE_OR_INVALID_SLIP: "รูปนี้ไม่ใช่สลิปโอนเงินจริง หรือ QR Code ไม่มีธุรกรรมอยู่จริง",
};

const COOLDOWN_SECONDS = 15;

type SlipVerification = {
  trans_ref: string | null;
  slip_amount: number | null;
  sender_name: string | null;
  sender_bank: string | null;
  receiver_name: string | null;
  receiver_bank: string | null;
  risk_flags: string[];
  auto_approved: boolean;
  error_message: string | null;
};

export function AdminOrderSlipCell({ orderId, slipPath }: { orderId: string; slipPath: string | null }) {
  const qc = useQueryClient();
  const hasSlip = !!slipPath;
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = useQuery({
    queryKey: ["slip-verification", orderId],
    enabled: hasSlip,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slip_verifications")
        .select("trans_ref, slip_amount, sender_name, sender_bank, receiver_name, receiver_bank, risk_flags, auto_approved, error_message")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SlipVerification | null;
    },
  });

  useEffect(() => {
    if (!expanded || !hasSlip || !slipPath) return;
    supabase.storage.from("payment-slips").createSignedUrl(slipPath, 60 * 30).then(({ data }) => {
      setSignedUrl(data?.signedUrl ?? null);
    });
  }, [expanded, hasSlip, slipPath]);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const runCheck = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasSlip || checking || cooldown > 0) return;
    setChecking(true);
    const { data, error } = await supabase.functions.invoke("verify-payment-slip", { body: { order_id: orderId } });
    setChecking(false);
    setCooldown(COOLDOWN_SECONDS);
    if (error || data?.error) {
      toast.error(data?.error ?? "ตรวจสอบสลิปไม่สำเร็จ");
      return;
    }
    toast.success(data.auto_approved ? "ตรวจสอบผ่าน ยืนยันการชำระเงินแล้ว" : "ตรวจสอบเสร็จ พบข้อควรระวัง");
    qc.invalidateQueries({ queryKey: ["slip-verification", orderId] });
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasSlip) return;
    setExpanded((v) => !v);
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
    <div onClick={(e) => e.stopPropagation()} className="relative">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={runCheck}
          disabled={!hasSlip || checking || cooldown > 0}
          title={hasSlip ? "ตรวจสอบสลิปกับธนาคาร" : "ยังไม่มีสลิปแนบมา"}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
            hasSlip && cooldown === 0
              ? "border-slate-300 text-slate-700 hover:bg-slate-50"
              : "cursor-not-allowed border-slate-200 text-slate-300"
          }`}
        >
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {cooldown > 0 ? `รออีก ${cooldown}s` : "ตรวจสอบสลิป"}
        </button>
        {hasSlip && (
          <button
            type="button"
            onClick={toggleExpand}
            title="ดูสลิป"
            className="inline-flex items-center rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {statusBadge}

      {expanded && hasSlip && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border bg-white p-3 shadow-xl">
          {signedUrl ? (
            <img src={signedUrl} alt="สลิป" className="max-h-56 w-full rounded-md border object-contain bg-slate-50" />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-slate-400">กำลังโหลดรูป...</div>
          )}

          {v && (
            <div className="mt-2 space-y-1 text-xs">
              {v.error_message ? (
                <div className="text-amber-700">ตรวจสอบไม่สำเร็จ: {v.error_message}</div>
              ) : v.auto_approved ? (
                <div className="text-emerald-700">
                  ✅ ผ่าน · เลขอ้างอิง {v.trans_ref} · ฿{v.slip_amount?.toLocaleString("th-TH")}
                  <div className="text-slate-500">โอนจาก {v.sender_name} ({v.sender_bank})</div>
                </div>
              ) : (
                <div className="text-red-700">
                  <ul className="ml-4 list-disc space-y-0.5">
                    {v.risk_flags.map((f) => <li key={f}>{FLAG_LABEL[f] ?? f}</li>)}
                  </ul>
                  {v.sender_name && (
                    <div className="mt-1 text-slate-500">
                      โอนจาก {v.sender_name} ({v.sender_bank}) → {v.receiver_name} ({v.receiver_bank}) · ฿{v.slip_amount?.toLocaleString("th-TH")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={runCheck}
            disabled={checking || cooldown > 0}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[color:var(--brand-green,#10B981)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {checking ? "กำลังตรวจสอบ..." : cooldown > 0 ? `ตรวจสอบอีกครั้งใน ${cooldown} วินาที` : "ตรวจสอบอีกครั้ง"}
          </button>
        </div>
      )}
    </div>
  );
}
