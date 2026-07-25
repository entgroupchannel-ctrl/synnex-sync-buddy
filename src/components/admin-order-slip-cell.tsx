/**
 * src/components/admin-order-slip-cell.tsx  (แทนที่ไฟล์เดิมทั้งไฟล์)
 * ปุ่มตรวจสอบสลิปในตารางออเดอร์ (admin.orders.tsx) — คลิก "ดูสลิป" เปิดเป็น modal กลางจอ
 * (เดิมใช้ popover ลอยข้างปุ่ม แต่คอลัมน์นี้อยู่ริมขวาสุดของตาราง ทำให้ล้นขอบจอ
 *  เปลี่ยนเป็น Dialog กลางจอแทน แก้ปัญหาล้นขอบได้แน่นอนไม่ว่าคอลัมน์จะอยู่ตำแหน่งไหน)
 */
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ImageIcon, Loader2, RefreshCw, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [open, setOpen] = useState(false);
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
    if (!open || !hasSlip || !slipPath) return;
    supabase.storage.from("payment-slips").createSignedUrl(slipPath, 60 * 30).then(({ data }) => {
      setSignedUrl(data?.signedUrl ?? null);
    });
  }, [open, hasSlip, slipPath]);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const runCheck = async () => {
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
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => hasSlip && setOpen(true)}
          disabled={!hasSlip}
          title={hasSlip ? "ดูสลิปและตรวจสอบ" : "ยังไม่มีสลิปแนบมา"}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
            hasSlip
              ? "border-slate-300 text-slate-700 hover:bg-slate-50"
              : "cursor-not-allowed border-slate-200 text-slate-300"
          }`}
        >
          <ImageIcon className="h-3 w-3" />
          ดูสลิป / ตรวจสอบ
        </button>
        {statusBadge}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สลิปการโอนเงิน</DialogTitle>
          </DialogHeader>

          {signedUrl ? (
            <img src={signedUrl} alt="สลิป" className="max-h-80 w-full rounded-md border object-contain bg-slate-50" />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">กำลังโหลดรูป...</div>
          )}

          {v && (
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              {v.error_message ? (
                <div className="text-amber-700">ตรวจสอบไม่สำเร็จ: {v.error_message}</div>
              ) : v.auto_approved ? (
                <div className="space-y-1 text-emerald-700">
                  <div className="font-semibold">✅ ตรวจสอบผ่าน — ยืนยันอัตโนมัติแล้ว</div>
                  <div className="text-xs text-slate-500">
                    เลขอ้างอิง {v.trans_ref} · โอนจาก {v.sender_name} ({v.sender_bank}) · ฿{v.slip_amount?.toLocaleString("th-TH")}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-red-700">
                  <div className="font-semibold">⚠️ พบความผิดปกติ</div>
                  <ul className="ml-4 list-disc space-y-0.5 text-xs">
                    {v.risk_flags.map((f) => <li key={f}>{FLAG_LABEL[f] ?? f}</li>)}
                  </ul>
                  {v.sender_name && (
                    <div className="text-xs text-slate-500">
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
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[color:var(--brand-green,#10B981)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {checking ? "กำลังตรวจสอบ..." : cooldown > 0 ? `ตรวจสอบอีกครั้งใน ${cooldown} วินาที` : v ? "ตรวจสอบอีกครั้ง" : "ตรวจสอบสลิป"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
