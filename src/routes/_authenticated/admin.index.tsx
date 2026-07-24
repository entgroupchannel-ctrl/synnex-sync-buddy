import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Tag,
  RefreshCw,
  Ticket,
  Mail,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — ENT Group Admin" },
      { name: "description", content: "Admin dashboard overview." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const money = (n: number) =>
  "฿" + (n ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  action,
  tone = "green",
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  action?: { label: string; to: string };
  tone?: "green" | "amber" | "sky" | "rose";
}) {
  const tones: Record<string, string> = {
    green: "text-[color:var(--brand-green)] bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    sky: "text-sky-600 bg-sky-50",
    rose: "text-rose-600 bg-rose-50",
  };
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {action ? (
          <Link
            to={action.to}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--brand-green)] hover:underline"
          >
            {action.label} <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfYesterday = new Date(startOfDay);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const [todayOrders, yestOrders, pendingOrders, pendingSlips, b2bPending, unapproved, recentOrders, syncMeta] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id,total,status", { count: "exact" })
            .gte("created_at", startOfDay.toISOString()),
          supabase
            .from("orders")
            .select("id,total", { count: "exact" })
            .gte("created_at", startOfYesterday.toISOString())
            .lt("created_at", startOfDay.toISOString()),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .not("payment_slip_url", "is", null)
            .eq("status", "pending"),
          supabase
            .from("user_profiles")
            .select("id", { count: "exact", head: true })
            .eq("account_status", "pending_approval"),
          supabase
            .from("synnex_products")
            .select("id", { count: "exact", head: true })
            .eq("price_approved", false),
          supabase
            .from("orders")
            .select("id,order_number,created_at,customer_name,total,status,payment_status")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("synnex_products")
            .select("id,synced_at", { count: "exact" })
            .order("synced_at", { ascending: false })
            .limit(1),
        ]);

      const todayTotal =
        todayOrders.data?.reduce((a, o: any) => a + Number(o.total || 0), 0) ?? 0;
      const yestTotal =
        yestOrders.data?.reduce((a: number, o: any) => a + Number(o.total || 0), 0) ?? 0;

      return {
        todayCount: todayOrders.count ?? 0,
        yestCount: yestOrders.count ?? 0,
        todayTotal,
        yestTotal,
        pendingCount: pendingOrders.count ?? 0,
        pendingSlips: pendingSlips.count ?? 0,
        b2bPending: b2bPending.count ?? 0,
        unapproved: unapproved.count ?? 0,
        recent: recentOrders.data ?? [],
        productCount: syncMeta.count ?? 0,
        lastSync: syncMeta.data?.[0]?.synced_at ?? null,
      };
    },
  });

  const orderDelta = (data?.todayCount ?? 0) - (data?.yestCount ?? 0);
  const revDelta = data?.yestTotal
    ? Math.round(((data.todayTotal - data.yestTotal) / data.yestTotal) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 md:text-2xl">Dashboard</h1>
          <p className="text-xs text-slate-500">
            ภาพรวมการทำงานประจำวัน · {format(new Date(), "d MMM yyyy · HH:mm")}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="ออเดอร์วันนี้"
          value={isLoading ? "—" : String(data?.todayCount ?? 0)}
          hint={
            isLoading
              ? ""
              : `${orderDelta >= 0 ? "↑ +" : "↓ "}${orderDelta} จากเมื่อวาน`
          }
          tone="green"
        />
        <StatCard
          icon={DollarSign}
          label="ยอดขายวันนี้"
          value={isLoading ? "—" : money(data?.todayTotal ?? 0)}
          hint={
            isLoading
              ? ""
              : `${revDelta >= 0 ? "↑ +" : "↓ "}${revDelta}% จากเมื่อวาน`
          }
          tone="sky"
        />
        <StatCard
          icon={AlertTriangle}
          label="รอดำเนินการ"
          value={isLoading ? "—" : String(data?.pendingCount ?? 0)}
          hint="ออเดอร์รอยืนยัน"
          tone="amber"
          action={{ label: "ดูทั้งหมด", to: "/admin/orders" }}
        />
        <StatCard
          icon={Tag}
          label="รออนุมัติราคา"
          value={isLoading ? "—" : String(data?.unapproved ?? 0)}
          hint="สินค้ารออนุมัติ"
          tone="rose"
          action={{ label: "ไปอนุมัติ", to: "/admin/pricing/products" }}
        />
      </div>

      {/* Quick actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <QuickAction icon={RefreshCw} label="Sync สินค้า" to="/admin/sync" />
        <QuickAction icon={Ticket} label="เพิ่มโค้ดส่วนลด" to="/admin/discount-codes" />
        <QuickAction icon={Mail} label="ส่ง Newsletter" to="/admin/newsletter" />
        <QuickAction icon={BarChart3} label="ดู Report" to="/admin/analytics" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Recent orders */}
        <section className="rounded-xl border bg-white shadow-sm">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-bold text-slate-900">ออเดอร์ล่าสุด</div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-[color:var(--brand-green)] hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Order#</th>
                  <th className="px-3 py-2 text-left">วันที่</th>
                  <th className="px-3 py-2 text-left">ลูกค้า</th>
                  <th className="px-3 py-2 text-right">ยอด</th>
                  <th className="px-3 py-2 text-left">สถานะ</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent ?? []).map((o: any) => (
                  <tr key={o.id} className="border-t hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-[11px]">{o.order_number}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {format(new Date(o.created_at), "d/M HH:mm")}
                    </td>
                    <td className="px-3 py-2 text-xs">{o.customer_name || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{money(o.total)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: o.id }}
                        className="text-xs font-semibold text-[color:var(--brand-green)] hover:underline"
                      >
                        ดู →
                      </Link>
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.recent?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-slate-500">
                      ยังไม่มีออเดอร์
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right rail */}
        <aside className="space-y-4">
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-900">งานที่รอดำเนินการ</div>
            <ul className="mt-3 space-y-2 text-xs">
              <TaskRow color="rose" label="B2B รออนุมัติ" count={data?.b2bPending ?? 0} to="/admin/customers" />
              <TaskRow color="amber" label="ราคารออนุมัติ" count={data?.unapproved ?? 0} to="/admin/pricing/products" />
              <TaskRow color="amber" label="สลิปรอตรวจสอบ" count={data?.pendingSlips ?? 0} to="/admin/orders" />
              <TaskRow color="green" label="ออเดอร์ใหม่" count={data?.todayCount ?? 0} to="/admin/orders" />
            </ul>
          </section>

          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-900">สถานะ Sync</div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <div>
                Last sync:{" "}
                <span className="font-semibold text-slate-900">
                  {data?.lastSync ? format(new Date(data.lastSync), "d MMM yyyy HH:mm") : "—"}
                </span>
              </div>
              <div>
                Products:{" "}
                <span className="font-semibold text-slate-900">{data?.productCount ?? 0} รายการ</span>
              </div>
            </div>
            <Link
              to="/admin/sync"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[color:var(--brand-green)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync ตอนนี้
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to }: { icon: any; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-[color:var(--brand-green)] hover:text-[color:var(--brand-green)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function TaskRow({
  color,
  label,
  count,
  to,
}: {
  color: "rose" | "amber" | "green";
  label: string;
  count: number;
  to: string;
}) {
  const dot: Record<string, string> = {
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
  };
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot[color]}`} />
          {label}
        </span>
        <span className="font-bold text-slate-900">{count}</span>
      </Link>
    </li>
  );
}
