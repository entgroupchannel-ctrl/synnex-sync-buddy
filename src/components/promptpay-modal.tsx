/**
 * PromptPay QR — สร้างเองฝั่ง client ด้วย src/lib/promptpay.ts (มาตรฐาน EMVCo, ไม่พึ่ง Buffer)
 * ไม่ต้องพึ่ง payment gateway; ยืนยันการชำระเงินด้วยการแนบสลิป → SlipOK ตรวจอัตโนมัติ
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import generatePayload from "@/lib/promptpay";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, CreditCard, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { bahtFmt, COMPANY_INFO } from "@/lib/order-helpers";
import { getOrderPaymentStatus } from "@/lib/order-confirmation.functions";

type Props = {
  orderId: string;
  orderNumber: string;
  amount: number;
  onPaid: () => void;
};

const BANKS = ["KBank", "SCB", "กรุงไทย", "กรุงเทพ", "ทหารไทย"];

export function PromptPayPaymentModal({ orderId, orderNumber, amount, onPaid }: Props) {
  const [open, setOpen] = useState(true);
  const [paid, setPaid] = useState(false);
  const checkPayment = useServerFn(getOrderPaymentStatus);

  // สร้าง QR ทันที ไม่ต้องรอ network call ใดๆ (คำนวณล้วนๆ ฝั่ง client)
  const payload = generatePayload(COMPANY_INFO.promptpay_id, { amount });

  const markPaid = () => {
    if (paid) return;
    setPaid(true);
    toast.success("ชำระเงินสำเร็จ ✅");
    setTimeout(() => {
      setOpen(false);
      onPaid();
    }, 3000);
  };

  // Poll payment_status ทุก 5 วิ เผื่อ admin/SlipOK ตรวจสลิปแล้ว mark paid
  useEffect(() => {
    if (paid) return;
    const iv = setInterval(async () => {
      const data = await checkPayment({ data: { orderId } });
      if (data?.payment_status === "paid") {
        clearInterval(iv);
        if (!open) setOpen(true);
        markPaid();
      }
    }, 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paid, open]);

  const goToSlipUpload = () => {
    setOpen(false);
    setTimeout(() => {
      document
        .getElementById("slip-upload-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => { /* prevent outside/esc close */ }}>
        <DialogContent
          className="max-w-sm gap-0 border border-gray-100 p-0 shadow-2xl [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
            <DialogTitle className="sr-only">ชำระเงินด้วย PromptPay</DialogTitle>
            <DialogDescription className="sr-only">
              สแกน QR Code เพื่อชำระยอดคำสั่งซื้อ {orderNumber}
            </DialogDescription>
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
                  <h2 className="text-lg font-bold text-slate-800">ชำระเงินด้วย PromptPay</h2>
                  <div className="mx-auto mt-1 h-px w-16 bg-slate-200" />

                  <div className="mt-4 text-sm text-slate-500">ยอดที่ต้องชำระ</div>
                  <div className="text-4xl font-bold text-blue-600">{bahtFmt.format(amount)}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{orderNumber}</div>

                  {/* QR frame */}
                  <div className="mx-auto mt-4 overflow-hidden rounded-xl border-2 border-blue-100">
                    <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                      Thai QR Payment · PromptPay
                    </div>
                    <div className="grid place-items-center bg-white p-4">
                      <QRCodeSVG value={payload} size={200} level="M" />
                    </div>
                    <div className="border-t bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      {COMPANY_INFO.name}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    เปิด Mobile Banking → สแกน QR → ยืนยันการชำระเงิน
                  </p>

                  <button
                    onClick={goToSlipUpload}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4" /> จ่ายแล้ว แนบสลิปยืนยัน
                  </button>

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
                    หลังสแกนจ่ายแล้ว กรุณาแนบสลิปเพื่อให้ระบบตรวจสอบอัตโนมัติ
                  </div>
                </div>
              </div>
            )}
        </DialogContent>
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
