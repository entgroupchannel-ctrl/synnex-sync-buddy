import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User, Building2, X, ShoppingCart, Check } from "lucide-react";
import { useAuthSheetListener } from "@/lib/auth-sheet";

export function AddToCartSheet() {
  const { open, item, close } = useAuthSheetListener();
  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t-4 border-[color:var(--brand-green)] p-0"
      >
        <div className="relative p-6">
          <button
            onClick={close}
            aria-label="ปิด"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--brand-green)] text-white">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">เพิ่มสินค้าลงตะกร้าแล้ว!</div>
              <div className="truncate text-xs text-slate-600">{item?.name}</div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-black text-[color:var(--brand-navy)]">
              สมัครสมาชิกเพื่อดำเนินการสั่งซื้อ
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              เก็บประวัติการสั่งซื้อ · ที่อยู่จัดส่ง · ราคาพิเศษสำหรับสมาชิก
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-center text-sm font-medium text-slate-700">คุณเป็นใคร?</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/auth"
                search={{ tab: "b2c" } as never}
                onClick={close}
                className="group flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 transition hover:border-[color:var(--brand-navy)] hover:bg-slate-50"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-[color:var(--brand-navy)] group-hover:bg-[color:var(--brand-navy)] group-hover:text-white">
                  <User className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">บุคคลทั่วไป</div>
                <div className="text-[11px] text-slate-500">สำหรับใช้งานส่วนตัว</div>
              </Link>
              <Link
                to="/auth"
                search={{ tab: "b2b" } as never}
                onClick={close}
                className="group flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 transition hover:border-[color:var(--brand-orange)] hover:bg-orange-50"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-[color:var(--brand-orange)] group-hover:bg-[color:var(--brand-orange)] group-hover:text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">องค์กร / B2B</div>
                <div className="text-[11px] text-slate-500">ใบกำกับภาษี · ราคาพิเศษ</div>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t pt-4">
            <Button
              asChild
              variant="ghost"
              className="text-sm text-slate-600 hover:text-[color:var(--brand-navy)]"
              onClick={close}
            >
              <Link to="/cart">
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                ดูตะกร้าต่อโดยไม่สมัคร
              </Link>
            </Button>
            <div className="text-center text-[11px] text-slate-400">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/auth" search={{ tab: "signin" } as never} onClick={close} className="font-medium text-[color:var(--brand-navy)] hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
