import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { bahtFmt } from "@/lib/order-helpers";

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

const BANKS = [
  { name: "KBank", color: "bg-green-600" },
  { name: "SCB", color: "bg-purple-700" },
  { name: "Bangkok Bank", color: "bg-blue-700" },
  { name: "Krungthai", color: "bg-sky-600" },
];

export function PromptPayQr({ orderId, orderNumber, amount, onPaid }: Props) {
  const [charge, setCharge] = useState<ChargeResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [remaining, setRemaining] = useState<number>(15 * 60);
  const requested = useRef(false);

  // Create charge once
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<ChargeResp>("create-omise-charge", {
          body: { order_id: orderId, amount },
        });
        if (error) throw error;
        if (!data) throw new Error("ไม่ได้รับข้อมูล QR");
        setCharge(data);
        const exp = new Date(data.expires_at).getTime();
        setRemaining(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, amount]);

  // Countdown
  useEffect(() => {
    if (!charge) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [charge]);

  // Poll payment_status every 5s
  useEffect(() => {
    if (!charge) return;
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.payment_status === "paid") {
        clearInterval(iv);
        toast.success("ได้รับการชำระเงินแล้ว ✓");
        onPaid();
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [charge, orderId, onPaid]);

  const checkNow = async () => {
    setChecking(true);
    const { data } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .maybeSingle();
    setChecking(false);
    if (data?.payment_status === "paid") {
      toast.success("ได้รับการชำระเงินแล้ว ✓");
      onPaid();
    } else {
      toast.info("ยังไม่ได้รับการชำระเงิน กรุณารอสักครู่");
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <ShieldCheck className="h-3.5 w-3.5" /> ชำระด้วย PromptPay QR
        </div>
        <div className="mt-3 text-sm text-slate-500">ยอดที่ต้องชำระ</div>
        <div className="text-4xl font-black text-blue-700">{bahtFmt.format(amount)}</div>

        <div className="mx-auto mt-4 grid h-64 w-64 place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-2">
          {loading || !charge ? (
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          ) : expired ? (
            <div className="text-sm text-red-500">QR หมดอายุ กรุณาสร้างคำสั่งซื้อใหม่</div>
          ) : (
            <img
              src={charge.qr_code_url}
              alt={`PromptPay QR สำหรับคำสั่งซื้อ ${orderNumber}`}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        <div className={`mt-3 text-sm font-semibold ${expired ? "text-red-500" : "text-slate-700"}`}>
          {expired ? "QR หมดอายุแล้ว" : <>QR หมดอายุใน <span className="font-mono text-blue-700">{mm}:{ss}</span> นาที</>}
        </div>

        <Button
          onClick={checkNow}
          disabled={loading || expired || checking}
          className="mt-4 w-full max-w-xs bg-blue-700 hover:bg-blue-800"
        >
          {checking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังตรวจสอบ...</> : "ชำระเงินด้วย Mobile Banking แล้ว"}
        </Button>

        <div className="mt-5">
          <div className="mb-2 text-xs text-slate-500">รองรับ Mobile Banking ทุกธนาคาร</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {BANKS.map((b) => (
              <div
                key={b.name}
                className={`rounded-md ${b.color} px-2.5 py-1 text-xs font-semibold text-white shadow-sm`}
              >
                {b.name}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          ระบบจะตรวจสอบสถานะการชำระเงินโดยอัตโนมัติทุก 5 วินาที
        </div>
      </div>
    </div>
  );
}
