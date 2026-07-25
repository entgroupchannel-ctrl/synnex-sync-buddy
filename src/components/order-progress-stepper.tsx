/**
 * src/components/order-progress-stepper.tsx  (ไฟล์ใหม่)
 * Step tracker แสดงความคืบหน้าออเดอร์ ใช้ PROGRESS_STEPS + STATUS_META ที่มีอยู่แล้ว
 * ไม่ต้องแก้ schema เพิ่ม
 */
import { Check } from "lucide-react";
import { PROGRESS_STEPS, STATUS_META, type OrderStatus } from "@/lib/order-helpers";

export function OrderProgressStepper({
  status,
  compact = false,
}: {
  status: string | null;
  compact?: boolean;
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        ออเดอร์นี้ถูกยกเลิก
      </div>
    );
  }

  const currentIndex = PROGRESS_STEPS.indexOf((status as OrderStatus) ?? "pending");
  const idx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex w-full items-start">
      {PROGRESS_STEPS.map((step, i) => {
        const meta = STATUS_META[step];
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? `${meta.dot} text-white`
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {!compact && (
                <span
                  className={`w-16 text-center text-[10px] leading-tight ${
                    active ? "font-semibold text-slate-800" : "text-slate-400"
                  }`}
                >
                  {meta.label}
                </span>
              )}
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${i < idx ? "bg-emerald-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
