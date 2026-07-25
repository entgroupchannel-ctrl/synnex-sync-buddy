import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, Loader2, Download } from "lucide-react";
import { bahtFmt, thaiDate } from "@/lib/credit";

export const Route = createFileRoute("/_authenticated/admin/credit-applications")({
  component: AdminCreditApplications,
  head: () => ({
    meta: [
      { title: "คำขอวงเงินเครดิต — Admin ENT Group" },
      { name: "description", content: "จัดการคำขอวงเงินเครดิต B2B อนุมัติ ปฏิเสธ และกำหนดเงื่อนไขการชำระเงิน" },
      { property: "og:title", content: "คำขอวงเงินเครดิต — Admin" },
      { property: "og:description", content: "ระบบจัดการวงเงินเครดิต B2B ของ ENT Group" },
    ],
  }),
});

type App = {
  id: string;
  created_at: string;
  application_number: string | null;
  company_name: string;
  tax_id: string;
  company_type: string | null;
  company_email: string;
  company_phone: string;
  company_address: string;
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  requested_credit_limit: number;
  annual_revenue: string | null;
  years_in_business: string | null;
  company_registration_url: string | null;
  vat_certificate_url: string | null;
  financial_statement_url: string | null;
  status: string;
  rejection_reason: string | null;
  admin_note: string | null;
  user_id: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอตรวจสอบ", reviewing: "กำลังพิจารณา", approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ", suspended: "ระงับ",
};

function AdminCreditApplications() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [approve, setApprove] = useState<App | null>(null);
  const [reject, setReject] = useState<App | null>(null);
  const [limit, setLimit] = useState("");
  const [terms, setTerms] = useState("30");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_applications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as App[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rows = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  async function openDoc(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from("credit-documents").createSignedUrl(path, 300);
    if (error || !data) { toast.error("เปิดเอกสารไม่สำเร็จ"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function doApprove() {
    if (!approve) return;
    const creditLimit = Number(limit.replace(/\D/g, ""));
    if (!creditLimit) { toast.error("กรอกวงเงินที่อนุมัติ"); return; }
    setBusy(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const { error: accErr } = await supabase.from("credit_accounts").upsert({
        user_id: approve.user_id,
        company_name: approve.company_name,
        tax_id: approve.tax_id,
        credit_limit: creditLimit,
        payment_terms_days: Number(terms),
        application_id: approve.id,
        approved_by: me.user?.email ?? "admin",
        approved_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: "user_id" });
      if (accErr) throw accErr;

      const { error: appErr } = await supabase.from("credit_applications").update({
        status: "approved",
        reviewed_by: me.user?.email ?? "admin",
        reviewed_at: new Date().toISOString(),
      }).eq("id", approve.id);
      if (appErr) throw appErr;

      supabase.functions.invoke("send-credit-application", {
        body: { application_number: approve.application_number, decision: "approved", credit_limit: creditLimit, payment_terms_days: Number(terms) },
      }).catch((e) => console.warn("[credit email]", e));

      toast.success(`อนุมัติวงเงิน ${bahtFmt.format(creditLimit)} แล้ว`);
      setApprove(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  async function doReject() {
    if (!reject) return;
    setBusy(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const { error } = await supabase.from("credit_applications").update({
        status: "rejected",
        rejection_reason: reason || null,
        reviewed_by: me.user?.email ?? "admin",
        reviewed_at: new Date().toISOString(),
      }).eq("id", reject.id);
      if (error) throw error;
      supabase.functions.invoke("send-credit-application", {
        body: { application_number: reject.application_number, decision: "rejected", rejection_reason: reason },
      }).catch((e) => console.warn("[credit email]", e));
      toast.success("ปฏิเสธคำขอแล้ว");
      setReject(null); setReason(""); load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-[color:var(--brand-navy)]">
          <CreditCard className="h-5 w-5" /> คำขอวงเงินเครดิต B2B
        </h1>
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "reviewing", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === s ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "text-slate-600"}`}>
              {s === "all" ? "ทั้งหมด" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">ไม่มีคำขอ</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">เลขที่</th><th>บริษัท</th><th>วงเงินที่ขอ</th>
                <th>เอกสาร</th><th>สถานะ</th><th>วันที่</th><th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t align-top">
                  <td className="p-3 font-mono text-xs">{a.application_number}</td>
                  <td className="p-3">
                    <div className="font-semibold">{a.company_name}</div>
                    <div className="text-xs text-slate-500">{a.tax_id} · {a.contact_name} · {a.contact_phone}</div>
                  </td>
                  <td className="p-3 font-semibold">{bahtFmt.format(a.requested_credit_limit)}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {[["หนังสือรับรอง", a.company_registration_url], ["VAT", a.vat_certificate_url], ["งบการเงิน", a.financial_statement_url]]
                        .filter(([, p]) => p)
                        .map(([label, p]) => (
                          <button key={label as string} onClick={() => openDoc(p as string)}
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                            <Download className="h-3 w-3" /> {label}
                          </button>
                        ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{thaiDate(a.created_at)}</td>
                  <td className="p-3 text-right">
                    {a.status !== "approved" && a.status !== "rejected" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => { setApprove(a); setLimit(String(a.requested_credit_limit)); setTerms("30"); }}>
                          อนุมัติ
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setReject(a)}>ปฏิเสธ</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!approve} onOpenChange={(o) => !o && setApprove(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>อนุมัติวงเงิน — {approve?.company_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">วงเงินที่อนุมัติ (THB)</Label>
              <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">เงื่อนไขการชำระ (วัน)</Label>
              <div className="flex gap-2">
                {["30", "45", "60", "90"].map((d) => (
                  <button key={d} type="button" onClick={() => setTerms(d)}
                    className={`rounded-full border px-4 py-1.5 text-sm ${terms === d ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "text-slate-600"}`}>
                    {d} วัน
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprove(null)}>ยกเลิก</Button>
            <Button disabled={busy} className="bg-emerald-600 hover:bg-emerald-700" onClick={doApprove}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันอนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ปฏิเสธคำขอ — {reject?.company_name}</DialogTitle></DialogHeader>
          <Textarea rows={4} placeholder="เหตุผลการปฏิเสธ" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>ยกเลิก</Button>
            <Button disabled={busy} variant="destructive" onClick={doReject}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
