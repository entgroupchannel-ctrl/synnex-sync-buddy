import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import {
  CreditCard, ClipboardList, Loader2, FileText, CheckCircle2, XCircle, Clock,
  Ban, RotateCcw, Plus, Receipt,
} from "lucide-react";
import { bahtFmt, thaiDate } from "@/lib/credit";

export const Route = createFileRoute("/_authenticated/admin/credit")({
  component: AdminCreditPage,
  head: () => ({
    meta: [
      { title: "จัดการวงเงินเครดิต B2B — Admin ENT Group" },
      { name: "description", content: "อนุมัติคำขอวงเงินเครดิต ปรับวงเงิน ระงับบัญชี และบันทึกการชำระหนี้ของลูกค้าองค์กร" },
      { property: "og:title", content: "จัดการวงเงินเครดิต B2B — Admin" },
      { property: "og:description", content: "ระบบจัดการเครดิต B2B ของ ENT Group IT Shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  website: string | null;
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

type Account = {
  id: string;
  created_at: string;
  user_id: string | null;
  company_name: string;
  tax_id: string;
  credit_limit: number;
  credit_used: number;
  credit_available: number | null;
  payment_terms_days: number;
  is_active: boolean;
  suspended_reason: string | null;
  expires_at: string | null;
  application_id: string | null;
};

type Txn = {
  id: string;
  created_at: string;
  credit_account_id: string | null;
  type: string | null;
  amount: number;
  balance_before: number;
  balance_after: number;
  due_date: string | null;
  paid_at: string | null;
  reference: string | null;
  note: string | null;
  order_id: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "รอพิจารณา", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  reviewing: { label: "กำลังตรวจสอบ", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "ปฏิเสธ", cls: "bg-red-100 text-red-800 border-red-200" },
  suspended: { label: "ระงับ", cls: "bg-slate-200 text-slate-700 border-slate-300" },
};

const TXN_META: Record<string, { label: string; emoji: string; positive: boolean }> = {
  purchase: { label: "ซื้อสินค้า", emoji: "🛍️", positive: false },
  payment: { label: "ชำระหนี้", emoji: "💚", positive: true },
  refund: { label: "คืนเงิน", emoji: "🔄", positive: true },
  adjustment: { label: "ปรับยอด", emoji: "⚙️", positive: true },
};

const ADMIN_EMAIL = "therdpoom@entgroup.co.th";
const dmy = (d: string) => thaiDate(d);

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function AdminCreditPage() {
  const [tab, setTab] = useState<"apps" | "accounts">("apps");

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-xl font-black text-[color:var(--brand-navy)]">
        <CreditCard className="h-5 w-5" /> จัดการวงเงินเครดิต B2B
      </h1>

      <div className="flex gap-2 border-b">
        {([["apps", "📋 คำขอวงเงิน"], ["accounts", "💳 บัญชีเครดิต"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === k ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "apps" ? <ApplicationsTab /> : <AccountsTab />}
    </div>
  );
}

/* ─────────────────────────── TAB 1: applications ─────────────────────────── */

function ApplicationsTab() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<App | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_applications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as App[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending" || a.status === "reviewing").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  }), [apps]);

  const rows = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<ClipboardList className="h-4 w-4" />} label="ทั้งหมด" value={stats.total} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="รอดูแล" value={stats.pending} tone="text-yellow-600" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="อนุมัติ" value={stats.approved} tone="text-emerald-600" />
        <StatCard icon={<XCircle className="h-4 w-4" />} label="ปฏิเสธ" value={stats.rejected} tone="text-red-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "reviewing", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === s ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            }`}>
            {s === "all" ? "ทั้งหมด" : STATUS[s].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">ไม่มีคำขอในสถานะนี้</div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">เลขที่</th><th>บริษัท</th><th>Tax ID</th>
                <th className="text-right">วงเงินที่ขอ</th><th>ประเภท</th><th>วันที่สมัคร</th>
                <th>สถานะ</th><th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t hover:bg-slate-50/60">
                  <td className="p-3 font-mono text-xs">{a.application_number}</td>
                  <td className="p-3 font-semibold text-slate-800">{a.company_name}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{a.tax_id}</td>
                  <td className="p-3 text-right font-semibold">{bahtFmt.format(a.requested_credit_limit)}</td>
                  <td className="p-3"><Badge variant="secondary">{a.company_type ?? "-"}</Badge></td>
                  <td className="p-3 text-xs text-slate-500">{dmy(a.created_at)}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setDetail(a)}>ดูรายละเอียด</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ApplicationDetail app={detail} onClose={() => setDetail(null)} onDone={() => { setDetail(null); load(); }} />
    </div>
  );
}

function ApplicationDetail({ app, onClose, onDone }: { app: App | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("30");
  const [busy, setBusy] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setNote(app?.admin_note ?? "");
    setAmount(app ? String(app.requested_credit_limit) : "");
    setTerms("30");
    setReason("");
  }, [app]);

  if (!app) return null;
  const approvedAmount = Number(amount.replace(/\D/g, ""));

  async function openDoc(path: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from("credit-documents").createSignedUrl(path, 300);
    if (error || !data) { toast.error("เปิดเอกสารไม่สำเร็จ"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function setReviewing() {
    if (!app) return;
    setBusy(true);
    const { error } = await supabase.from("credit_applications")
      .update({ status: "reviewing", admin_note: note || null, reviewed_by: ADMIN_EMAIL }).eq("id", app.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("ส่งเข้าขั้นตอนตรวจสอบแล้ว");
    onDone();
  }

  async function doApprove() {
    if (!app || !approvedAmount) { toast.error("กรอกวงเงินที่อนุมัติ"); return; }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { error: aErr } = await supabase.from("credit_applications").update({
        status: "approved", reviewed_by: ADMIN_EMAIL, reviewed_at: now, admin_note: note || null,
      }).eq("id", app.id);
      if (aErr) throw aErr;

      const { error: cErr } = await supabase.from("credit_accounts").insert({
        user_id: app.user_id,
        company_name: app.company_name,
        tax_id: app.tax_id,
        credit_limit: approvedAmount,
        credit_used: 0,
        payment_terms_days: Number(terms),
        is_active: true,
        application_id: app.id,
        approved_by: ADMIN_EMAIL,
        approved_at: now,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (cErr) throw cErr;

      supabase.functions.invoke("send-credit-approval", {
        body: {
          email: app.contact_email,
          company_name: app.company_name,
          credit_limit: approvedAmount,
          payment_terms_days: Number(terms),
          application_number: app.application_number,
        },
      }).catch((e) => console.warn("[send-credit-approval]", e));

      toast.success("อนุมัติวงเงินเครดิตสำเร็จ!");
      setConfirmApprove(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  async function doReject() {
    if (!app) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("credit_applications").update({
        status: "rejected",
        rejection_reason: reason || null,
        admin_note: note || null,
        reviewed_by: ADMIN_EMAIL,
        reviewed_at: new Date().toISOString(),
      }).eq("id", app.id);
      if (error) throw error;
      supabase.functions.invoke("send-credit-approval", {
        body: {
          email: app.contact_email,
          company_name: app.company_name,
          application_number: app.application_number,
          decision: "rejected",
          rejection_reason: reason,
        },
      }).catch((e) => console.warn("[send-credit-approval]", e));
      toast.success("ปฏิเสธคำขอแล้ว");
      setRejecting(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  const decided = app.status === "approved" || app.status === "rejected";

  return (
    <>
      <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              📋 คำขอ <span className="font-mono text-sm">{app.application_number}</span>
              <StatusBadge status={app.status} />
            </DialogTitle>
          </DialogHeader>

          <Section title="ข้อมูลองค์กร">
            <Field label="บริษัท" value={app.company_name} />
            <Field label="Tax ID" value={app.tax_id} />
            <Field label="ประเภท" value={app.company_type} />
            <Field label="ที่อยู่" value={app.company_address} />
            <Field label="โทร" value={app.company_phone} />
            <Field label="อีเมล" value={app.company_email} />
            <Field label="เว็บไซต์" value={app.website} />
          </Section>

          <Section title="ผู้ติดต่อ">
            <Field label="ชื่อ" value={app.contact_name} />
            <Field label="ตำแหน่ง" value={app.contact_position} />
            <Field label="โทร" value={app.contact_phone} />
            <Field label="อีเมล" value={app.contact_email} />
          </Section>

          <Section title="การเงิน">
            <Field label="วงเงินที่ขอ" value={bahtFmt.format(app.requested_credit_limit)} />
            <Field label="รายได้ต่อปี" value={app.annual_revenue} />
            <Field label="ดำเนินธุรกิจ" value={app.years_in_business} />
          </Section>

          <Section title="เอกสาร">
            <div className="col-span-2 flex flex-wrap gap-2">
              {([["📄 หนังสือรับรอง", app.company_registration_url], ["📄 VAT", app.vat_certificate_url], ["📄 งบการเงิน", app.financial_statement_url]] as const)
                .filter(([, p]) => p)
                .map(([label, p]) => (
                  <button key={label} onClick={() => openDoc(p)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                    <FileText className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              {!app.company_registration_url && !app.vat_certificate_url && !app.financial_statement_url && (
                <span className="text-sm text-slate-500">ไม่มีเอกสารแนบ</span>
              )}
            </div>
          </Section>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-[color:var(--brand-navy)]">Admin Note</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="บันทึกภายในสำหรับทีมงาน" />
          </div>

          {app.rejection_reason && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">เหตุผลการปฏิเสธ: {app.rejection_reason}</p>
          )}

          {!decided && (
            <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
              <div className="text-sm font-bold text-[color:var(--brand-navy)]">การดำเนินการ</div>
              <div>
                <Label className="mb-1.5 block text-xs">วงเงินที่อนุมัติ (THB)</Label>
                <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">เงื่อนไขการชำระ</Label>
                <div className="flex flex-wrap gap-2">
                  {["30", "45", "60", "90"].map((d) => (
                    <button key={d} type="button" onClick={() => setTerms(d)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition ${
                        terms === d ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-white"
                      }`}>{d} วัน</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {decided ? (
              <Button variant="outline" onClick={onClose}>ปิด</Button>
            ) : (
              <>
                <Button variant="outline" disabled={busy} onClick={setReviewing}>🔄 ส่งตรวจสอบ</Button>
                <Button variant="destructive" disabled={busy} onClick={() => setRejecting(true)}>❌ ปฏิเสธ</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy || !approvedAmount}
                  onClick={() => setConfirmApprove(true)}>✅ อนุมัติ</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ยืนยันการอนุมัติ</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-700">
            อนุมัติวงเงิน <b className="text-emerald-700">{bahtFmt.format(approvedAmount || 0)}</b> ให้ <b>{app.company_name}</b>?
          </p>
          <p className="text-sm text-slate-600">เงื่อนไขชำระ: {terms} วัน</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApprove(false)}>ยกเลิก</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={doApprove}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ปฏิเสธคำขอ — {app.company_name}</DialogTitle></DialogHeader>
          <Label className="text-sm">เหตุผลการปฏิเสธ:</Label>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>ยกเลิก</Button>
            <Button variant="destructive" disabled={busy} onClick={doReject}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────── TAB 2: accounts ─────────────────────────── */

function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState<Account | null>(null);

  const load = async () => {
    setLoading(true);
    const [accRes, txnRes] = await Promise.all([
      supabase.from("credit_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (accRes.error) toast.error(accRes.error.message);
    setAccounts((accRes.data as Account[]) ?? []);
    setTxns((txnRes.data as Txn[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const limit = accounts.reduce((s, a) => s + a.credit_limit, 0);
    const used = accounts.reduce((s, a) => s + a.credit_used, 0);
    const today = new Date().toISOString().slice(0, 10);
    const open = txns.filter((t) => t.type === "purchase" && !t.paid_at);
    const outstanding = open.reduce((s, t) => s + Number(t.amount), 0);
    const overdue = open.filter((t) => t.due_date && t.due_date < today).reduce((s, t) => s + Number(t.amount), 0);
    return { count: accounts.length, limit, used, available: limit - used, outstanding, overdue };
  }, [accounts, txns]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold text-[color:var(--brand-navy)]">
          <CreditCard className="h-4 w-4" /> ภาพรวมวงเงินเครดิต B2B
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="บัญชีทั้งหมด" value={summary.count} />
          <StatCard label="วงเงินรวม" value={bahtFmt.format(summary.limit)} />
          <StatCard label="ใช้ไปทั้งหมด" value={bahtFmt.format(summary.used)} tone="text-orange-600" />
          <StatCard label="คงเหลือรวม" value={bahtFmt.format(summary.available)} tone="text-emerald-600" />
          <StatCard label="รอชำระ" value={bahtFmt.format(summary.outstanding)} tone="text-blue-600" />
          <StatCard label="เกินกำหนด" value={bahtFmt.format(summary.overdue)} tone="text-red-600" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">ยังไม่มีบัญชีเครดิต</div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">บริษัท</th><th>Tax ID</th>
                <th className="text-right">วงเงิน</th><th className="text-right">ใช้ไป</th><th className="text-right">คงเหลือ</th>
                <th>เงื่อนไข</th><th>สถานะ</th><th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const available = a.credit_available ?? a.credit_limit - a.credit_used;
                const availPct = a.credit_limit > 0 ? (available / a.credit_limit) * 100 : 0;
                const usedPct = a.credit_limit > 0 ? Math.min(100, (a.credit_used / a.credit_limit) * 100) : 0;
                const availTone = availPct > 50 ? "text-emerald-600" : availPct >= 20 ? "text-yellow-600" : "text-red-600";
                const barTone = usedPct < 50 ? "bg-emerald-500" : usedPct <= 80 ? "bg-yellow-500" : "bg-red-500";
                return (
                  <tr key={a.id} className="border-t hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{a.company_name}</div>
                      <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${usedPct}%` }} />
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">ใช้ไป {Math.round(usedPct)}%</div>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{a.tax_id}</td>
                    <td className="p-3 text-right">{bahtFmt.format(a.credit_limit)}</td>
                    <td className="p-3 text-right text-orange-600">{bahtFmt.format(a.credit_used)}</td>
                    <td className={`p-3 text-right font-bold ${availTone}`}>{bahtFmt.format(available)}</td>
                    <td className="p-3">{a.payment_terms_days} วัน</td>
                    <td className="p-3">
                      {a.is_active
                        ? <Badge className="bg-emerald-600">ใช้งาน</Badge>
                        : <Badge variant="destructive">ระงับ</Badge>}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setManage(a)}>จัดการ</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ManageAccount
        account={manage}
        txns={txns.filter((t) => t.credit_account_id === manage?.id)}
        onClose={() => setManage(null)}
        onDone={() => { setManage(null); load(); }}
      />
    </div>
  );
}

function ManageAccount({ account, txns, onClose, onDone }: {
  account: Account | null; txns: Txn[]; onClose: () => void; onDone: () => void;
}) {
  const [limit, setLimit] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLimit(account ? String(account.credit_limit) : "");
    setSuspendReason(account?.suspended_reason ?? "");
    setPayAmount(""); setPayNote(""); setShowPay(false);
  }, [account]);

  if (!account) return null;

  async function saveLimit() {
    if (!account) return;
    const v = Number(limit.replace(/\D/g, ""));
    if (!v) { toast.error("กรอกวงเงิน"); return; }
    setBusy(true);
    const { error } = await supabase.from("credit_accounts").update({ credit_limit: v }).eq("id", account.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`ปรับวงเงินเป็น ${bahtFmt.format(v)} แล้ว`);
    onDone();
  }

  async function toggleActive() {
    if (!account) return;
    const next = !account.is_active;
    if (!next && !suspendReason.trim()) { toast.error("กรุณาระบุเหตุผลการระงับ"); return; }
    setBusy(true);
    const { error } = await supabase.from("credit_accounts")
      .update({ is_active: next, suspended_reason: next ? null : suspendReason.trim() })
      .eq("id", account.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "เปิดบัญชีคืนแล้ว" : "ระงับบัญชีแล้ว");
    onDone();
  }

  async function addPayment() {
    if (!account) return;
    const amt = Number(payAmount.replace(/[^\d.]/g, ""));
    if (!amt) { toast.error("กรอกจำนวนเงิน"); return; }
    setBusy(true);
    const { error } = await supabase.from("credit_transactions").insert({
      credit_account_id: account.id,
      user_id: account.user_id,
      type: "payment",
      amount: amt,
      balance_before: account.credit_used,
      balance_after: Math.max(0, account.credit_used - amt),
      paid_at: new Date(payDate).toISOString(),
      note: payNote || "บันทึกการชำระโดยแอดมิน",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`บันทึกการชำระ ${bahtFmt.format(amt)} แล้ว`);
    onDone();
  }

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            💳 {account.company_name}
            {account.is_active ? <Badge className="bg-emerald-600">ใช้งาน</Badge> : <Badge variant="destructive">ระงับ</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="วงเงิน" value={bahtFmt.format(account.credit_limit)} />
          <StatCard label="ใช้ไป" value={bahtFmt.format(account.credit_used)} tone="text-orange-600" />
          <StatCard label="คงเหลือ" value={bahtFmt.format(account.credit_available ?? account.credit_limit - account.credit_used)} tone="text-emerald-600" />
        </div>

        <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
          <div className="text-sm font-bold text-[color:var(--brand-navy)]">ปรับวงเงิน</div>
          <div className="flex gap-2">
            <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
            <Button disabled={busy} onClick={saveLimit} className="bg-emerald-600 hover:bg-emerald-700">บันทึก</Button>
          </div>

          <div className="text-sm font-bold text-[color:var(--brand-navy)]">
            {account.is_active ? "ระงับบัญชี" : "เปิดบัญชีคืน"}
          </div>
          {account.is_active ? (
            <div className="flex gap-2">
              <Input placeholder="เหตุผลการระงับ" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
              <Button variant="destructive" disabled={busy} onClick={toggleActive}>
                <Ban className="mr-1 h-4 w-4" /> ระงับ
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {account.suspended_reason && <span className="text-xs text-red-600">เหตุผล: {account.suspended_reason}</span>}
              <Button disabled={busy} onClick={toggleActive} className="ml-auto bg-emerald-600 hover:bg-emerald-700">
                <RotateCcw className="mr-1 h-4 w-4" /> เปิดบัญชีคืน
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--brand-navy)]">
              <Receipt className="h-4 w-4" /> รายการธุรกรรม
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowPay((v) => !v)}>
              <Plus className="mr-1 h-4 w-4" /> บันทึกการชำระ
            </Button>
          </div>

          {showPay && (
            <div className="grid gap-2 rounded-lg border bg-emerald-50/50 p-3 sm:grid-cols-4">
              <div>
                <Label className="mb-1 block text-xs">จำนวนเงิน</Label>
                <Input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block text-xs">วันที่ชำระ</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={addPayment}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            {txns.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">ยังไม่มีธุรกรรม</div>
            ) : (
              <table className="w-full min-w-[720px] text-xs">
                <thead className="bg-slate-50 text-left uppercase text-slate-500">
                  <tr>
                    <th className="p-2">วันที่</th><th>ประเภท</th><th className="text-right">จำนวน</th>
                    <th className="text-right">ยอดก่อน</th><th className="text-right">ยอดหลัง</th>
                    <th>Order</th><th>ครบกำหนด</th><th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => {
                    const m = TXN_META[t.type ?? ""] ?? { label: t.type ?? "-", emoji: "•", positive: true };
                    return (
                      <tr key={t.id} className="border-t">
                        <td className="p-2">{dmy(t.created_at)}</td>
                        <td className="p-2">{m.emoji} {m.label}</td>
                        <td className={`p-2 text-right font-semibold ${m.positive ? "text-emerald-600" : "text-red-600"}`}>
                          {m.positive ? "-" : "+"}{bahtFmt.format(Math.abs(Number(t.amount)))}
                        </td>
                        <td className="p-2 text-right text-slate-500">{bahtFmt.format(Number(t.balance_before ?? 0))}</td>
                        <td className="p-2 text-right text-slate-500">{bahtFmt.format(Number(t.balance_after ?? 0))}</td>
                        <td className="p-2 font-mono text-[10px] text-slate-500">{t.reference ?? "-"}</td>
                        <td className="p-2">{t.due_date ? dmy(t.due_date) : "-"}</td>
                        <td className="p-2">
                          {t.paid_at
                            ? <span className="text-emerald-600">ชำระแล้ว</span>
                            : t.due_date && t.due_date < new Date().toISOString().slice(0, 10)
                              ? <span className="text-red-600">เกินกำหนด</span>
                              : <span className="text-slate-500">รอชำระ</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── shared bits ─────────────────────────── */

function StatCard({ icon, label, value, tone = "text-slate-800" }: {
  icon?: React.ReactNode; label: string; value: string | number; tone?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">{icon} {label}</div>
      <div className={`mt-1 text-lg font-black ${tone}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">── {title} ──</div>
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label}: </span>
      <span className="font-medium text-slate-800">{value || "-"}</span>
    </div>
  );
}
