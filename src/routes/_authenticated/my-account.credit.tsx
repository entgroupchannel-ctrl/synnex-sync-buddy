import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, FileText } from "lucide-react";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { bahtFmt, thaiDate, useCreditAccount } from "@/lib/credit";

export const Route = createFileRoute("/_authenticated/my-account/credit")({
  component: CreditPage,
  head: () => ({
    meta: [
      { title: "วงเงินเครดิต B2B — ENT Group IT Retail Shop" },
      { name: "description", content: "ดูวงเงินเครดิตคงเหลือ เงื่อนไขการชำระ และประวัติธุรกรรมเครดิตขององค์กรคุณ" },
      { property: "og:title", content: "วงเงินเครดิต B2B — ENT Group IT Retail Shop" },
      { property: "og:description", content: "จัดการวงเงินเครดิตองค์กรกับ ENT Group" },
    ],
  }),
});

type Txn = {
  id: string;
  created_at: string;
  type: string | null;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  reference: string | null;
  note: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  purchase: "ใช้วงเงิน",
  payment: "ชำระหนี้",
  adjustment: "ปรับวงเงิน",
  refund: "คืนเงิน",
};

function CreditPage() {
  const { user } = useSupabaseUser();
  const { account, loading } = useCreditAccount(user?.id);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [apps, setApps] = useState<{ application_number: string | null; status: string; created_at: string; requested_credit_limit: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("credit_transactions").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setTxns((data as Txn[]) ?? []));
    supabase.from("credit_applications")
      .select("application_number, status, created_at, requested_credit_limit")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setApps(data ?? []));
  }, [user]);

  if (loading) {
    return <div className="flex items-center gap-2 rounded-xl border bg-white p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…</div>;
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-bold text-[color:var(--brand-navy)]">คุณยังไม่มีวงเงินเครดิต</h2>
          <p className="mt-1 text-sm text-slate-500">สมัครวงเงินเครดิต B2B เพื่อสั่งซื้อสินค้าแบบเครดิต 30-90 วัน</p>
          <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <Link to="/credit-application">สมัครวงเงินเครดิต B2B</Link>
          </Button>
        </div>
        {apps.length > 0 && <AppList apps={apps} />}
      </div>
    );
  }

  const pct = account.credit_limit > 0 ? Math.min(100, Math.round((account.credit_used / account.credit_limit) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
            <CreditCard className="h-5 w-5" /> วงเงินเครดิต B2B
          </h2>
          {account.is_active
            ? <Badge className="bg-emerald-600">ใช้งานได้</Badge>
            : <Badge variant="destructive">ระงับชั่วคราว</Badge>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="วงเงินทั้งหมด" value={bahtFmt.format(account.credit_limit)} />
          <Stat label={`ใช้ไปแล้ว (${pct}%)`} value={bahtFmt.format(account.credit_used)} tone="text-orange-600" />
          <Stat label="คงเหลือ" value={bahtFmt.format(account.credit_available)} tone="text-emerald-600" />
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          เงื่อนไข: {account.payment_terms_days} วัน
          {account.expires_at && <> · หมดอายุ: {thaiDate(account.expires_at)}</>}
        </p>
        {account.suspended_reason && (
          <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">เหตุผลการระงับ: {account.suspended_reason}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/my-account/orders">ดูออเดอร์เครดิต</Link></Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Link to="/contact">แจ้งชำระหนี้</Link></Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-3 font-bold text-[color:var(--brand-navy)]">รายการธุรกรรม</h3>
        {txns.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีธุรกรรม</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">วันที่</th><th>ประเภท</th><th>อ้างอิง</th><th className="text-right">จำนวน</th><th>กำหนดชำระ</th></tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2">{thaiDate(t.created_at)}</td>
                    <td>{TYPE_LABEL[t.type ?? ""] ?? t.type}</td>
                    <td className="text-slate-500">{t.reference ?? "-"}</td>
                    <td className={`text-right font-semibold ${t.type === "purchase" ? "text-orange-600" : "text-emerald-600"}`}>
                      {t.type === "purchase" ? "+" : "-"}{bahtFmt.format(Math.abs(t.amount))}
                    </td>
                    <td>{t.paid_at ? <span className="text-emerald-600">ชำระแล้ว</span> : t.due_date ? thaiDate(t.due_date) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {apps.length > 0 && <AppList apps={apps} />}
    </div>
  );
}

function AppList({ apps }: { apps: { application_number: string | null; status: string; created_at: string; requested_credit_limit: number }[] }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-3 flex items-center gap-2 font-bold text-[color:var(--brand-navy)]"><FileText className="h-4 w-4" /> คำขอวงเงินของฉัน</h3>
      <div className="space-y-2 text-sm">
        {apps.map((a) => (
          <div key={a.application_number} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <span className="font-mono">{a.application_number}</span>
            <span>{bahtFmt.format(a.requested_credit_limit)}</span>
            <span className="text-slate-500">{thaiDate(a.created_at)}</span>
            <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "text-slate-800" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-black ${tone}`}>{value}</div>
    </div>
  );
}
