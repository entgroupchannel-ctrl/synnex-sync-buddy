import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { useAbandonedCartNotice } from "@/lib/cart-reminder";
import { priceFmt } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";

export function CartReminderBell() {
  const { user } = useSupabaseUser();
  const notice = useAbandonedCartNotice(user?.id);
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();
  if (!notice) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--brand-orange)] px-1 text-[10px] font-bold text-white">
          1
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border bg-white p-3 text-slate-800 shadow-xl">
            <div className="mb-1 text-xs font-semibold text-slate-500">
              {lang === "th" ? "การแจ้งเตือน" : "Notifications"}
            </div>
            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="block rounded-md p-3 hover:bg-slate-50"
            >
              <div className="text-sm font-semibold">
                🛒 {lang === "th" ? "คุณมีสินค้าค้างในตะกร้า" : "You have items in your cart"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {notice.itemCount} {lang === "th" ? "รายการ" : "items"} · {priceFmt.format(notice.total)}
              </div>
              <div className="mt-2 text-xs font-medium text-[color:var(--brand-green)]">
                {lang === "th" ? "คลิกเพื่อดำเนินการ →" : "Click to continue →"}
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
