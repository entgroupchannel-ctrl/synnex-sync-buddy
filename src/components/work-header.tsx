/**
 * src/components/work-header.tsx
 * Header แบบเรียบง่ายสำหรับหน้า "งาน" (my-account, my-orders) — ไม่มี nav category,
 * ไม่มี flash-sale ticker/promo banner เหมือน SiteHeader ฝั่งร้านค้า
 * ถ้าผู้ใช้เป็น admin จะมีปุ่มสลับกลับไปแผงควบคุม Admin ให้ด้วย
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/lib/auth-sheet";

export function WorkHeader({ title }: { title?: string }) {
  const { user } = useSupabaseUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data?.is_admin));
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-[color:var(--brand-navy)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="rounded bg-white/10 px-2 py-1 text-sm">ENT Group</span>
          </Link>
          {title && <span className="hidden text-sm text-white/70 sm:inline">/ {title}</span>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {isAdmin && (
            <Link
              to="/admin" preload="intent"
              className="inline-flex items-center gap-1 rounded-md bg-[color:var(--brand-green)] px-2.5 py-1.5 font-medium text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-green)]/90"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> กลับไป Admin
            </Link>
          )}
          <Link to="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> กลับสู่หน้าร้าน
          </Link>
          {user?.email && <span className="hidden text-white/60 md:inline">{user.email}</span>}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5 hover:bg-white/20"
          >
            <LogOut className="h-3.5 w-3.5" /> ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
