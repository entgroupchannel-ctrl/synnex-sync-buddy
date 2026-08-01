/**
 * src/components/customer-slip-status.tsx  (ไฟล์ใหม่)
 * แสดงผลตรวจสอบสลิปแบบลูกค้าเข้าใจง่าย (แยกจาก slip-verification-badge.tsx ที่เป็นฝั่ง admin)
 * ไม่โชว์ error code ภายใน (เช่น 1013) ตรงๆ แต่แปลเป็นข้อความที่เข้าใจง่ายแทน
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getOrderSlipStatus } from "@/lib/order-confirmation.functions";


const FLAG_MESSAGE: Record<string, string> = {
  DUPLICATE_SLIP: "สลิปนี้เคยถูกใช้ยืนยันการโอนมาก่อนแล้ว กรุณาตรวจสอบว่าแนบสลิปถูกใบหรือไม่",
  DUPLICATE_SLIP_IN_OUR_SYSTEM: "สลิปนี้ถูกใช้ยืนยันกับคำสั่งซื้ออื่นไปแล้ว กรุณาติดต่อทีมงาน",
  AMOUNT_MISMATCH: "ยอดเงินที่โอนไม่ตรงกับยอดที่ต้องชำระของคำสั่งซื้อนี้ กรุณาตรวจสอบยอดโอนอีกครั้ง หากโอนถูกต้องแล้วกรุณาติดต่อทีมงาน",
  ACCOUNT_MISMATCH: "บัญชีปลายทางที่โอนไม่ตรงกับบัญชีของ ENT Group กรุณาตรวจสอบเลขบัญชีก่อนโอนใหม่",
  FAKE_OR_INVALID_SLIP: "ไม่สามารถตรวจสอบสลิปนี้กับธนาคารได้ กรุณาตรวจสอบว่าเป็นไฟล์สลิปที่ถูกต้อง แล้วลองอัปโหลดใหม่",
};

type Verification = {
  risk_flags: string[];
  auto_approved: boolean;
  error_message: string | null;
};

export function CustomerSlipStatus({ orderId }: { orderId: string }) {
  const fetchSlipStatus = useServerFn(getOrderSlipStatus);
  const q = useQuery({
    queryKey: ["customer-slip-status", orderId],
    queryFn: async () =>
      (await fetchSlipStatus({ data: { orderId } })) as Verification | null,
    refetchInterval: 4000, // เผื่อผลตรวจสอบมาช้ากว่าที่ลูกค้าเปิดหน้าดูอยู่
  });


  const v = q.data;

  if (!v) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        <Clock className="h-4 w-4 animate-pulse" /> กำลังตรวจสอบสลิปกับธนาคาร กรุณารอสักครู่...
      </div>
    );
  }

  if (v.error_message && v.risk_flags.length === 0) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{v.error_message}</span>
      </div>
    );
  }

  if (v.auto_approved) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" /> ตรวจสอบสลิปผ่านแล้ว ยืนยันการชำระเงินเรียบร้อย ✓
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" /> ตรวจพบความผิดปกติในสลิป
      </div>
      <ul className="ml-6 list-disc space-y-0.5">
        {v.risk_flags.map((f) => (
          <li key={f}>{FLAG_MESSAGE[f] ?? "กรุณาติดต่อทีมงานเพื่อตรวจสอบสลิปนี้"}</li>
        ))}
      </ul>
      <p className="text-xs text-red-600">ท่านสามารถอัปโหลดสลิปใหม่ได้ที่ปุ่ม "แทนที่สลิป" ด้านบน หรือติดต่อทีมงาน</p>
    </div>
  );
}
