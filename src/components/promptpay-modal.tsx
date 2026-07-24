import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, CreditCard, Landmark, Loader2, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { bahtFmt } from "@/lib/order-helpers";

type Props = {
  orderId: string;
  orderNumber: string;
  amount: number;
  onPaid: () => void;
};

type BankAccount = {
  bank: string;
  account: string;
  name: string;
  branch?: string;
};

type ChargeResp = {
  qr_code_url?: string;
  expires_at?: string;
  charge_id?: string;
  requires_manual_transfer?: boolean;
  bank_accounts?: BankAccount[];
  amount?: number;
};

const BANKS = ["KBank", "SCB", "กรุงไทย", "กรุงเทพ", "ทหารไทย"];

export function PromptPayPaymentModal({ orderId, orderNumber, amount, onPaid }: Props) {
  const [open, setOpen] = useState(true);
  const [charge, setCharge] = useState<ChargeResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const [remaining, setRemaining] = useState<number>(15 * 60);
  const requested = useRef(false);

  const markPaid = () => {
    if (paid) return;
    setPaid(true);
    toast.success("ชำระเงินสำเร็จ ✅");
    setTimeout(() => {
      setOpen(false);
      onPaid();
    }, 3000);
  };

  // Create charge once
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-omise-charge", {
          body: { order_id: orderId, amount },
        });
        if (error) throw error;
        const { qr_code_url, charge_id, expires_at, requires_manual_transfer } = data as ChargeResp;
        if (requires_manual_transfer) {
          setCharge({ requires_manual_transfer: true });
        } else {
          if (!qr_code_url) throw new Error("ไม่ได้รับข้อมูล QR");
          setCharge({ qr_code_url, charge_id, expires_at });
          const exp = new Date(expires_at!).getTime();
          setRemaining(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, amount]);

  // Countdown (only for PromptPay QR)
  useEffect(() => {
    if (!charge || paid || charge.requires_manual_transfer) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [charge, paid]);

  // Poll payment_status every 5s (runs even when modal closed)
  useEffect(() => {
    if (paid) return;
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.payment_status === "paid") {
        clearInterval(iv);
        if (!open) setOpen(true);
        markPaid();
      }
    }, 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paid, open]);

  const checkNow = async () => {
    setChecking(true);
    const { data } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .maybeSingle();
    setChecking(false);
    if (data?.payment_status === "paid") {
      markPaid();
    } else {
      toast.info("ยังไม่พบการชำระเงิน กรุณารอสักครู่");
    }
  };

  const copyAccount = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success("คัดลอกเลขบัญชีแล้ว");
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;
  const timerLow = remaining < 120;

  return (
    <>
      <Dialog open={open} onOpenChange={() => { /* prevent outside/esc close */ }}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm bg-black/20" />
          <DialogContent
            className="max-w-sm gap-0 border border-gray-100 p-0 shadow-2xl [&>button]:hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            {paid ? (
              <div className="rounded-lg bg-white p-8 text-center">
                <CheckCircle2 className="mx-auto h-20 w-20 animate-in zoom-in text-green-600" strokeWidth={2.5} />
                <div className="mt-4 text-2xl font-bold text-green-600">ชำระเงินสำเร็จแล้ว!</div>
                <div className="mt-2 text-sm text-slate-600">
                  ทีมงานจะเตรียมสินค้าและแจ้งการจัดส่งให้ทราบ
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    <X className="h-4 w-4" /> จ่ายภายหลัง
                  </button>
                  <div className="text-xs font-bold text-[color:var(--brand-navy)]">ENT Group</div>
                </div>

                <div className="px-6 pb-6 pt-4 text-center">
                  <h2 className="text-lg font-bold text-slate-800">
                    {charge?.requires_manual_transfer ? "โอนเงินผ่านธนาคาร" : "ชำระเงินด้วย PromptPay"}
                  </h2>
                  {charge?.requires_manual_transfer && (
                    <div className="mt-1 text-xs text-orange-600">(ยอดเกิน ฿150,000)</div>
                  )}
                  <div className="mx-auto mt-1 h-px w-16 bg-slate-200" />

                  <div className="mt-4 text-sm text-slate-500">ยอดที่ต้องชำระ</div>
                  <div className="text-4xl font-bold text-blue-600">{bahtFmt.format(amount)}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{orderNumber}</div>

                  {charge?.requires_manual_transfer ? (
                    <>
                      {/* Bank transfer card */}
                      <div className="mt-4 overflow-hidden rounded-xl border-2 border-amber-100 bg-amber-50 text-left">
                        <div className="bg-gradient-to-b from-amber-500 to-amber-600 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                          💳 โอนเงินผ่านธนาคาร
                        </div>
                        <div className="space-y-3 p-4 text-sm">
                          <div>
                            <div className="font-bold text-slate-800">ธนาคารกสิกรไทย (KBank)</div>
                            <div className="text-slate-600">เลขที่: 841-2-05851-9</div>
                            <div className="text-slate-600">ชื่อ: บริษัท อีเอ็นที กรุ๊ป จำกัด</div>
                          </div>
                          <div className="h-px bg-amber-200" />
                          <div>
                            <div className="font-bold text-slate-800">ธนาคารไทยพาณิชย์ (SCB)</div>
                            <div className="text-slate-600">เลขที่: 406-817747-1</div>
                            <div className="text-slate-600">ชื่อ: บริษัท อีเอ็นที กรุ๊ป จำกัด</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">📸 แนบสลิปหลังโอน</div>
                        <div>Line: @entgroup</div>
                        <div>Email: sales@entgroup.co.th</div>
                      </div>

                      <Button
                        onClick={() => copyAccount("841-2-05851-9")}
                        variant="outline"
                        className="mt-3 w-full rounded-full border-amber-300 text-amber-700 hover:bg-amber-50"
                        size="lg"
                      >
                        <Copy className="mr-2 h-4 w-4" /> คัดลอกเลขบัญชี KBank
                      </Button>

                      <Button
                        onClick={checkNow}
                        disabled={checking}
                        className="mt-3 w-full rounded-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        {checking ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังตรวจสอบ...</>
                        ) : (
                          "ฉันโอนเงินแล้ว"
                        )}
                      </Button>

                      <div className="mt-4 text-[11px] text-slate-400">
                        ระบบตรวจสอบอัตโนมัติทุก 5 วินาที
                      </div>
                    </>
                  ) : (
                    <>
                      {/* QR frame */}
                      <div className="mx-auto mt-4 overflow-hidden rounded-xl border-2 border-blue-100">
                        <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                          Thai QR Payment · PromptPay
                        </div>
                        <div className="grid place-items-center bg-white p-4">
                          {loading || !charge ? (
                            <div className="grid h-[200px] w-[200px] place-items-center">
                              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                          ) : expired ? (
                            <div className="grid h-[200px] w-[200px] place-items-center px-2 text-center text-sm text-red-500">
                              QR หมดอายุ<br />กรุณาสร้างคำสั่งซื้อใหม่
                            </div>
                          ) : (
                            <img
                              src={charge.qr_code_url}
                              alt={`PromptPay QR ${orderNumber}`}
                              width={200}
                              height={200}
                              className="h-[200px] w-[200px] object-contain"
                            />
                          )}
                        </div>
                      </div>

                      <div
                        className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${
                          expired || timerLow ? "text-red-500" : "text-orange-500"
                        }`}
                      >
                        <Timer className="h-4 w-4" />
                        {expired ? "QR หมดอายุแล้ว" : (
                          <>QR หมดอายุใน <span className="font-mono">{mm}:{ss}</span></>
                        )}
                      </div>

                      <Button
                        onClick={checkNow}
                        disabled={loading || expired || checking}
                        className="mt-4 w-full rounded-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        {checking ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังตรวจสอบ...</>
                        ) : (
                          "ฉันโอนเงินแล้ว"
                        )}
                      </Button>

                      <div className="mt-5 text-xs text-slate-500">รองรับทุกธนาคาร</div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 text-xs text-slate-600">
                        {BANKS.map((b, i) => (
                          <span key={b} className="inline-flex items-center">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                              {b}
                            </span>
                            {i < BANKS.length - 1 && <span className="mx-0.5 text-slate-300">·</span>}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 text-[11px] text-slate-400">
                        ระบบตรวจสอบอัตโนมัติทุก 5 วินาที
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Sticky button when modal dismissed & not paid */}
      {!open && !paid && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-blue-700 hover:shadow-2xl"
        >
          <CreditCard className="h-4 w-4" /> ชำระเงิน {bahtFmt.format(amount)}
        </button>
      )}
    </>
  );
}
