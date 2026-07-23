import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bahtFmt } from "@/lib/pricing-helpers";

const AUDIT_PAGE_SIZE = 100;

const searchSchema = z.object({
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  action: fallback(z.string(), "all").default("all"),
  sku: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/admin/pricing/audit")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Audit Log ราคาสินค้า — Admin ENT Group" },
      { name: "description", content: "ประวัติการเปลี่ยนแปลงราคา approve/reset/markup" },
      { property: "og:title", content: "Audit Log ราคาสินค้า" },
      { property: "og:description", content: "ประวัติการเปลี่ยนแปลงราคาทั้งหมด" },
    ],
  }),
  component: AuditPage,
});

type Row = {
  id: string;
  created_at: string;
  product_sku: string;
  product_name: string | null;
  action: string;
  old_selling_price: number | null;
  new_selling_price: number | null;
  old_markup: number | null;
  new_markup: number | null;
  approved_by: string | null;
  session_id: string | null;
  notes: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  approve: "Approve",
  bulk_approve: "Bulk Approve",
  reset: "Reset",
  markup_change: "Markup Change",
};
const ACTION_CLS: Record<string, string> = {
  approve: "bg-green-100 text-green-800",
  bulk_approve: "bg-emerald-100 text-emerald-800",
  reset: "bg-slate-200 text-slate-700",
  markup_change: "bg-blue-100 text-blue-800",
};

const dateFmt = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function fmtBaht(n: number | null) {
  return n == null ? "—" : `฿${bahtFmt.format(Number(n))}`;
}
function fmtPct(n: number | null) {
  return n == null ? "—" : `${n}%`;
}

function AuditPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [skuInput, setSkuInput] = useState(search.sku);

  const update = (patch: Record<string, unknown>) =>
    nav({ search: (s: Record<string, unknown>) => ({ ...s, ...patch, page: 1 }), replace: true });

  const goToPage = (page: number) =>
    nav({ search: (s: Record<string, unknown>) => ({ ...s, page }), replace: true });

  const auditQ = useQuery({
    queryKey: ["price-audit", search],
    queryFn: async () => {
      const fromIdx = (search.page - 1) * AUDIT_PAGE_SIZE;
      const toIdx = fromIdx + AUDIT_PAGE_SIZE - 1;
      let q = supabase
        .from("price_audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(fromIdx, toIdx);
      if (search.action !== "all") q = q.eq("action", search.action);
      if (search.sku.trim()) q = q.ilike("product_sku", `%${search.sku.trim()}%`);
      if (search.from) q = q.gte("created_at", new Date(search.from).toISOString());
      if (search.to) {
        const end = new Date(search.to);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Row[], count: count ?? 0 };
    },
  });

  const rows = auditQ.data?.rows ?? [];
  const totalCount = auditQ.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / AUDIT_PAGE_SIZE));


  // Group bulk_approve by session_id; single rows stay standalone
  const groups = useMemo(() => {
    type Group = { key: string; kind: "single" | "session"; rows: Row[] };
    const seen = new Set<string>();
    const out: Group[] = [];
    for (const r of rows) {
      if (r.action === "bulk_approve" && r.session_id) {
        if (seen.has(r.session_id)) continue;
        seen.add(r.session_id);
        const members = rows.filter((x) => x.session_id === r.session_id && x.action === "bulk_approve");
        out.push({ key: `s:${r.session_id}`, kind: "session", rows: members });
      } else if (r.action === "reset" && r.session_id) {
        const key = `r:${r.session_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const members = rows.filter((x) => x.session_id === r.session_id && x.action === "reset");
        if (members.length > 1) {
          out.push({ key, kind: "session", rows: members });
        } else {
          out.push({ key: r.id, kind: "single", rows: [r] });
        }
      } else {
        out.push({ key: r.id, kind: "single", rows: [r] });
      }
    }
    return out;
  }, [rows]);

  const toggleGroup = (k: string) => {
    setExpanded((s) => {
      const c = new Set(s);
      if (c.has(k)) c.delete(k);
      else c.add(k);
      return c;
    });
  };

  const exportCsv = () => {
    const headers = [
      "created_at", "product_sku", "product_name", "action",
      "old_selling_price", "new_selling_price", "old_markup", "new_markup",
      "approved_by", "session_id", "notes",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => esc((r as unknown as Record<string, unknown>)[h])).join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `price-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-[color:var(--brand-navy)] text-white">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-4">
          <h1 className="text-lg font-bold md:text-xl">Audit Log ราคาสินค้า</h1>
          <div className="text-xs text-white/70">
            {rows.length.toLocaleString()} รายการล่าสุด
          </div>
          <div className="ml-auto flex gap-2">
            <Button onClick={exportCsv} size="sm" variant="secondary" className="gap-1">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/pricing/products">← กลับหน้าราคา</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-4 py-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">จากวันที่</div>
            <Input
              type="date"
              value={search.from}
              onChange={(e) => update({ from: e.target.value })}
              className="h-9 w-40"
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">ถึงวันที่</div>
            <Input
              type="date"
              value={search.to}
              onChange={(e) => update({ to: e.target.value })}
              className="h-9 w-40"
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">การกระทำ</div>
            <Select value={search.action} onValueChange={(v) => update({ action: v })}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="bulk_approve">Bulk Approve</SelectItem>
                <SelectItem value="markup_change">Markup Change</SelectItem>
                <SelectItem value="reset">Reset</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              update({ sku: skuInput });
            }}
          >
            <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">ค้นหา SKU</div>
            <Search className="pointer-events-none absolute left-3 top-[calc(50%+6px)] h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="SKU..."
              className="h-9 w-48 pl-9"
            />
          </form>
          {(search.from || search.to || search.action !== "all" || search.sku) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSkuInput("");
                nav({ search: {} as never });
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2 text-left font-semibold">เวลา</th>
                <th className="px-3 py-2 text-left font-semibold">สินค้า</th>
                <th className="px-3 py-2 text-left font-semibold">SKU</th>
                <th className="px-3 py-2 text-left font-semibold">การกระทำ</th>
                <th className="px-3 py-2 text-right font-semibold">ราคาเก่า</th>
                <th className="px-3 py-2 text-right font-semibold">ราคาใหม่</th>
                <th className="px-3 py-2 text-right font-semibold">Markup</th>
                <th className="px-3 py-2 text-left font-semibold">ผู้ Approve</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditQ.isLoading ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-400">กำลังโหลด...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
              ) : (
                groups.map((g) => {
                  if (g.kind === "single") {
                    const r = g.rows[0];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2" />
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                          {dateFmt.format(new Date(r.created_at))}
                        </td>
                        <td className="max-w-xs px-3 py-2">
                          <div className="line-clamp-1">{r.product_name ?? "—"}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{r.product_sku}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${ACTION_CLS[r.action] ?? "bg-slate-100 text-slate-700"}`}>
                            {ACTION_LABEL[r.action] ?? r.action}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{fmtBaht(r.old_selling_price)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-[color:var(--brand-orange)]">{fmtBaht(r.new_selling_price)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {fmtPct(r.old_markup)} → {fmtPct(r.new_markup)}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{r.approved_by ?? "—"}</td>
                      </tr>
                    );
                  }
                  // Group row
                  const head = g.rows[0];
                  const isOpen = expanded.has(g.key);
                  const label = head.action === "bulk_approve" ? "Bulk Approve" : "Bulk Reset";
                  return (
                    <>
                      <tr
                        key={g.key}
                        onClick={() => toggleGroup(g.key)}
                        className="cursor-pointer bg-emerald-50/40 font-semibold hover:bg-emerald-50"
                      >
                        <td className="px-2 py-2 text-slate-500">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">
                          {dateFmt.format(new Date(head.created_at))}
                        </td>
                        <td colSpan={3} className="px-3 py-2 text-sm">
                          {label} {g.rows.length} รายการ
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-slate-500">—</td>
                        <td className="px-3 py-2 text-right text-xs text-slate-500">—</td>
                        <td className="px-3 py-2 text-right text-xs">
                          {head.new_markup != null ? `+${head.new_markup}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{head.approved_by ?? "—"}</td>
                      </tr>
                      {isOpen &&
                        g.rows.map((r) => (
                          <tr key={r.id} className="bg-slate-50/50 text-xs">
                            <td className="px-2 py-1.5" />
                            <td className="whitespace-nowrap px-3 py-1.5 text-slate-500">
                              {dateFmt.format(new Date(r.created_at))}
                            </td>
                            <td className="max-w-xs px-3 py-1.5">
                              <div className="line-clamp-1">{r.product_name ?? "—"}</div>
                            </td>
                            <td className="px-3 py-1.5 font-mono">{r.product_sku}</td>
                            <td className="px-3 py-1.5">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ACTION_CLS[r.action]}`}>
                                {ACTION_LABEL[r.action]}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-500">{fmtBaht(r.old_selling_price)}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-[color:var(--brand-orange)]">{fmtBaht(r.new_selling_price)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              {fmtPct(r.old_markup)} → {fmtPct(r.new_markup)}
                            </td>
                            <td className="px-3 py-1.5 text-slate-600">{r.approved_by ?? "—"}</td>
                          </tr>
                        ))}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
