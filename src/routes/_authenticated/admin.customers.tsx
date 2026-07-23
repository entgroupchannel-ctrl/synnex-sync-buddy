import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, User, Search, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "ลูกค้า — Admin — ENT Group" },
      { name: "description", content: "จัดการรายชื่อลูกค้าและอนุมัติบัญชี B2B" },
      { property: "og:title", content: "Admin — ลูกค้า" },
      { property: "og:description", content: "จัดการรายชื่อลูกค้า" },
    ],
  }),
  component: CustomersAdmin,
});

type Filter = "all" | "b2c" | "b2b" | "pending" | "guest";

function CustomersAdmin() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const customers = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, customer_email, total, created_at, is_guest"),
      ]);
      const totalsByUser = new Map<string, number>();
      const totalsByGuestEmail = new Map<string, { total: number; last: string; count: number }>();
      for (const o of orders ?? []) {
        const total = Number(o.total ?? 0);
        if (o.user_id) totalsByUser.set(o.user_id, (totalsByUser.get(o.user_id) ?? 0) + total);
        else if (o.customer_email) {
          const cur = totalsByGuestEmail.get(o.customer_email) ?? { total: 0, last: "", count: 0 };
          cur.total += total;
          cur.count += 1;
          if (!cur.last || (o.created_at && o.created_at > cur.last)) cur.last = o.created_at ?? "";
          totalsByGuestEmail.set(o.customer_email, cur);
        }
      }
      return { profiles: profiles ?? [], totalsByUser, totalsByGuestEmail };
    },
  });

  const approve = async (id: string, status: "active" | "rejected") => {
    const { error } = await supabase.from("user_profiles").update({ account_status: status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว");
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const profiles = customers.data?.profiles ?? [];
  const filtered = profiles.filter((p) => {
    if (filter === "b2c" && p.user_type !== "b2c") return false;
    if (filter === "b2b" && p.user_type !== "b2b") return false;
    if (filter === "pending" && p.account_status !== "pending_approval") return false;
    if (q) {
      const hay = `${p.full_name ?? ""} ${p.company_name ?? ""} ${p.phone ?? ""} ${p.tax_id ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const guestEntries = filter === "guest"
    ? [...(customers.data?.totalsByGuestEmail.entries() ?? [])].filter(([email]) => !q || email.toLowerCase().includes(q.toLowerCase()))
    : [];

  const pendingCount = profiles.filter((p) => p.account_status === "pending_approval").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[color:var(--brand-navy)]">ลูกค้า</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ, บริษัท, เบอร์, เลขภาษี..." className="w-64 pl-9" />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ["all", "ทั้งหมด", profiles.length],
            ["b2c", "B2C", profiles.filter((p) => p.user_type === "b2c").length],
            ["b2b", "B2B", profiles.filter((p) => p.user_type === "b2b").length],
            ["pending", "รอ approve", pendingCount],
            ["guest", "Guest orders", customers.data?.totalsByGuestEmail.size ?? 0],
          ] as [Filter, string, number][]).map(([f, label, n]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${filter === f ? "bg-[color:var(--brand-navy)] text-white" : "bg-white border hover:bg-slate-100"}`}
            >
              {label} <span className="ml-1 text-xs opacity-70">({n})</span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">บริษัท / เลขภาษี</th>
                <th className="px-4 py-3">เบอร์</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">ยอดสั่งซื้อรวม</th>
                <th className="px-4 py-3">วันสมัคร</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filter === "guest" ? (
                guestEntries.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">ไม่พบข้อมูล</td></tr>
                ) : guestEntries.map(([email, info]) => (
                  <tr key={email} className="border-t">
                    <td className="px-4 py-3">{email}</td>
                    <td className="px-4 py-3"><Badge variant="outline">Guest</Badge></td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">{info.count} ครั้ง</td>
                    <td className="px-4 py-3 text-right font-bold text-[color:var(--brand-orange)]">฿{info.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{info.last ? new Date(info.last).toLocaleDateString("th-TH") : "—"}</td>
                    <td />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">ไม่พบลูกค้า</td></tr>
              ) : filtered.map((p) => {
                const total = customers.data?.totalsByUser.get(p.id) ?? 0;
                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{p.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.user_type === "b2b" ? (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Building2 className="mr-1 h-3 w-3" />B2B</Badge>
                      ) : (
                        <Badge variant="outline"><User className="mr-1 h-3 w-3" />B2C</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.company_name ? (
                        <div>
                          <div className="text-sm">{p.company_name}</div>
                          <div className="font-mono text-xs text-slate-500">{p.tax_id ?? "—"}</div>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.account_status === "pending_approval" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอยืนยัน</Badge>}
                      {p.account_status === "active" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>}
                      {p.account_status === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ปฏิเสธ</Badge>}
                      {p.account_status === "suspended" && <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">ระงับ</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[color:var(--brand-orange)]">฿{total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH") : "—"}</td>
                    <td className="px-4 py-3">
                      {p.account_status === "pending_approval" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => approve(p.id, "active")} className="h-7 bg-[color:var(--brand-green)] px-2 hover:opacity-90">
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => approve(p.id, "rejected")} className="h-7 px-2">
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
