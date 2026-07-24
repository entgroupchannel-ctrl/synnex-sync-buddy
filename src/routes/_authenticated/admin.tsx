import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  BarChart3,
  RefreshCw,
  Tag,
  ScrollText,
  ClipboardList,
  Package,
  Truck,
  Users,
  UserCheck,
  Mail,
  Ticket,
  Flame,
  Settings,
  CreditCard,
  Search,
  ExternalLink,

  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      toast.error("ไม่มีสิทธิ์เข้าถึงหน้านี้");
      throw redirect({ to: "/" });
    }
    return { user: userData.user };
  },
  component: AdminLayout,
});

type NavItem = {
  label: string;
  to?: string;
  href?: string;
  icon: any;
  exact?: boolean;
};
type NavGroup = { header: string; icon: any; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    header: "OVERVIEW",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    header: "สินค้าและราคา",
    icon: Package,
    items: [
      { label: "Sync สินค้า", to: "/admin/sync", icon: RefreshCw },
      { label: "จัดการราคา", to: "/admin/pricing/products", icon: Tag },
      { label: "กฎราคา", to: "/admin/pricing", icon: Tag },
      { label: "Audit Log", to: "/admin/pricing/audit", icon: ScrollText },
    ],
  },
  {
    header: "คำสั่งซื้อ",
    icon: ClipboardList,
    items: [
      { label: "ออเดอร์ทั้งหมด", to: "/admin/orders", icon: ClipboardList },
      { label: "รอยืนยัน", href: "/admin/orders?status=pending", icon: ClipboardList },
      { label: "รอจัดส่ง", href: "/admin/orders?status=confirmed", icon: Truck },
    ],
  },
  {
    header: "ลูกค้า",
    icon: Users,
    items: [
      { label: "ลูกค้าทั้งหมด", to: "/admin/customers", icon: Users },
      { label: "รอ Approve B2B", href: "/admin/customers?status=pending", icon: UserCheck },
      { label: "Newsletter", to: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    header: "โปรโมชั่น",
    icon: Ticket,
    items: [
      { label: "โค้ดส่วนลด", to: "/admin/discount-codes", icon: Ticket },
      { label: "Flash Deals", to: "/admin/flash-deals", icon: Flame },
    ],
  },
  {
    header: "ตั้งค่า",
    icon: Settings,
    items: [
      { label: "ข้อมูลร้าน", to: "/admin/settings", icon: Settings },
      { label: "ธนาคาร/ชำระเงิน", href: "/admin/settings?tab=payment", icon: CreditCard },
      { label: "การจัดส่ง", href: "/admin/settings?tab=shipping", icon: Truck },
      { label: "Email Templates", href: "/admin/settings?tab=email", icon: Mail },
      { label: "SEO Health Check", to: "/admin/seo", icon: Search },
    ],
  },
];


function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const isActive = (item: NavItem) => {
    if (!item.to) return false;
    if (item.exact) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(item.to + "/");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-[color:var(--brand-navy)] text-white/85">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[color:var(--brand-green)] font-black text-white">
            E
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">Admin Panel</div>
            <div className="truncate text-[11px] text-white/50">shop.entgroup.co.th</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => (
          <div key={group.header} className="mb-4">
            <div className="mb-1 flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <group.icon className="h-3 w-3" />
              {group.header}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const base =
                  "group flex items-center gap-2 rounded-md border-l-2 px-3 py-1.5 text-xs transition-colors";
                const cls = active
                  ? `${base} border-[color:var(--brand-green)] bg-white/5 font-semibold text-[color:var(--brand-green)]`
                  : `${base} border-transparent text-white/70 hover:bg-white/5 hover:text-white`;
                if (item.href) {
                  return (
                    <li key={item.label}>
                      <a href={item.href} onClick={onNavigate} className={cls}>
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link to={item.to!} onClick={onNavigate} className={cls}>
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          ดูหน้าร้าน
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 shrink-0 sticky top-0 h-screen">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-white px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle sidebar"
            className="grid h-9 w-9 place-items-center rounded-md border"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="text-sm font-bold">Admin Panel</div>
        </div>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
