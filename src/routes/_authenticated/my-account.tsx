import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { User, MapPin, Package, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-account")({
  head: () => ({
    meta: [
      { title: "บัญชีของฉัน — ENT Group IT Shop" },
      { name: "description", content: "จัดการบัญชี ข้อมูลส่วนตัว ที่อยู่ และประวัติการสั่งซื้อของคุณ" },
      { property: "og:title", content: "บัญชีของฉัน" },
      { property: "og:description", content: "จัดการบัญชี ENT Group IT Shop" },
    ],
  }),
  component: MyAccountLayout,
});

function MyAccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("user_profiles").select("user_type").eq("id", data.user.id).maybeSingle();
      setUserType(p?.user_type ?? "b2c");
    });
  }, []);

  const items = [
    { to: "/my-account/profile", label: "ข้อมูลส่วนตัว", icon: User },
    { to: "/my-account/addresses", label: "ที่อยู่จัดส่ง", icon: MapPin },
    { to: "/my-account/orders", label: "ประวัติการสั่งซื้อ", icon: Package },
    ...(userType === "b2b" ? [{ to: "/my-account/company", label: "ข้อมูลบริษัท", icon: Building2 }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-black text-[color:var(--brand-navy)]">บัญชีของฉัน</h1>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-lg border bg-white p-2">
            <nav className="flex flex-col gap-1">
              {items.map((it) => {
                const active = pathname.startsWith(it.to);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${active ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"}`}
                  >
                    <it.icon className="h-4 w-4" /> {it.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main><Outlet /></main>
        </div>
      </div>
    </div>
  );
}
