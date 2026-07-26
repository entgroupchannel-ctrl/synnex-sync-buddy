import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { bahtFmt } from "@/lib/order-helpers";
import { getOrderPaymentStatus } from "@/lib/order-confirmation.functions";

type Props = {
  orderId: string;
  orderNumber: string;
  amount: number;
  onPaid: () => void;
};

type ChargeResp = {
  qr_code_url: string;
  expires_at: string;
  charge_id: string;
};

const BANKS = ["KBank", "SCB", "กรุงไทย", "กรุงเทพ", "ทหารไทย"];

export function PromptPayQr({ orderId, orderNumber, amount, onPaid }: Props) {
  const [charge, setCharge] = useState<ChargeResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const [remaining, setRemaining] = useState<number>(15 * 60);
  const requested = useRef(false);
  const checkPayment = useServerFn(getOrderPaymentStatus);

  const markPaid = () => {
    if (paid) return;
    setPaid(true);
    toast.success("ชำระเงินสำเร็จ ✅");
    setTimeout(() => onPaid(), 2000);
  };

  // Create charge once
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        const res = await fetch(`${supabaseUrl}/functions/v1/create-omise-charge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ order_id: orderId, amount }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as ChargeResp;
        if (!data?.qr_code_url) throw new Error("ไม่ได้รับข้อมูล QR");
        setCharge(data);
        const exp = new Date(data.expires_at).getTime();
        setRemaining(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, amount]);

  // Countdown
  useEffect(() => {
    if (!charge || paid) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [charge, paid]);

  // Poll payment_status every 5s
  useEffect(() => {
    if (!charge || paid) return;
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.payment_status === "paid") {
        clearInterval(iv);
        markPaid();
      }
    }, 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge, orderId, paid]);

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

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;
  const timerLow = remaining < 120;

  if (paid) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-16 w-16 animate-in zoom-in text-green-600" strokeWidth={2.5} />
        <div className="mt-4 text-2xl font-bold text-green-600">ชำระเงินสำเร็จ ✅</div>
        <div className="mt-2 text-sm text-slate-500">กำลังไปยังหน้าคำสั่งซื้อ...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-lg">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <ShieldCheck className="h-3.5 w-3.5" /> ชำระเงินด้วย PromptPay
        </div>
        <div className="mt-3 text-sm text-slate-500">ยอดที่ต้องชำระ</div>
        <div className="text-3xl font-bold text-blue-600">{bahtFmt.format(amount)}</div>

        <div className="mx-auto mt-4 grid h-[236px] w-[236px] place-items-center rounded-xl border border-slate-200 bg-white p-2">
          {loading || !charge ? (
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          ) : expired ? (
            <div className="px-2 text-sm text-red-500">QR หมดอายุ กรุณาสร้างคำสั่งซื้อใหม่</div>
          ) : (
            <img
              src={charge.qr_code_url}
              alt={`PromptPay QR สำหรับคำสั่งซื้อ ${orderNumber}`}
              width={220}
              height={220}
              className="h-[220px] w-[220px] object-contain"
            />
          )}
        </div>

        <div className={`mt-3 text-sm font-semibold ${expired || timerLow ? "text-red-500" : "text-orange-500"}`}>
          {expired ? "QR หมดอายุแล้ว" : <>QR หมดอายุใน <span className="font-mono">{mm}:{ss}</span></>}
        </div>

        <p className="mt-3 text-sm text-slate-600">
          เปิด Mobile Banking → สแกน QR → ยืนยันการชำระเงิน
        </p>

        <Button
          onClick={checkNow}
          disabled={loading || expired || checking}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
        >
          {checking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังตรวจสอบ...</> : "ฉันโอนเงินแล้ว"}
        </Button>

        <div className="mt-5">
          <div className="mb-2 text-xs text-slate-500">รองรับ Mobile Banking ทุกธนาคาร</div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {BANKS.map((b, i) => (
              <span key={b} className="inline-flex items-center">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {b}
                </span>
                {i < BANKS.length - 1 && <span className="mx-1 text-slate-300">·</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          ระบบตรวจสอบสถานะการชำระเงินอัตโนมัติทุก 5 วินาที
        </div>
      </div>
    </div>
  );
}
