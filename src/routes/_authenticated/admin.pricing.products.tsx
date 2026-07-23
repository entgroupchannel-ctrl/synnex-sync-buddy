import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Search, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  filter: fallback(z.string(), "all").default("all"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/admin/pricing/products")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "ราคาสินค้ารายชิ้น · ENT Group" }] }),
  component: PricingProductsPage,
});

const PAGE_SIZE = 25;
const priceFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

type FilterKey = "all" | "unapproved" | "zero" | "override";

type Product = {
  id: string;
  sku: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  cost_price: number | null;
  price: number | null;
  selling_price: number | null;
  markup_override: number | null;
  price_approved: boolean | null;
};

function applyFilter(query: ReturnType<typeof supabase.from<"synnex_products">> extends never ? never : ReturnType<typeof supabase.from>, filter: string) {
  // Not used — kept for structure. Filters are inline below.
  return query;
}

function PricingProductsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [markupChoice, setMarkupChoice] = useState<string>("15");
  const [markupCustom, setMarkupCustom] = useState<string>("");

  const buildFiltered = (base: ReturnType<typeof supabase.from<"synnex_products">>) => {
    let query = base as unknown as ReturnType<typeof supabase.from<"synnex_products">>;
    const s = search.q.trim().replace(/[%,]/g, "");
    // @ts-expect-error dynamic query builder
    if (s) query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
    // @ts-expect-error dynamic query builder
    if (search.filter === "unapproved") query = query.or("price_approved.eq.false,selling_price.is.null");
    // @ts-expect-error dynamic query builder
    else if (search.filter === "zero") query = query.or("selling_price.is.null,selling_price.eq.0");
    // @ts-expect-error dynamic query builder
    else if (search.filter === "override") query = query.not("markup_override", "is", null);
    return query;
  };

  const productsQ = useQuery({
    queryKey: ["pricing-products", search],
    queryFn: async () => {
      const from = (search.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const base = supabase
        .from("synnex_products")
        .select("id, sku, name, brand, category, image_url, cost_price, price, selling_price, markup_override, price_approved", { count: "exact" })
        .order("sku", { ascending: true })
        .range(from, to);
      const query = buildFiltered(base) as unknown as typeof base;
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as Product[], count: count ?? 0 };
    },
  });

  // Tab counts (search-aware)
  const countsQ = useQuery({
    queryKey: ["pricing-products-counts", search.q],
    queryFn: async () => {
      const s = search.q.trim().replace(/[%,]/g, "");
      const mk = () => {
        let q = supabase.from("synnex_products").select("*", { count: "exact", head: true });
        if (s) q = q.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
        return q;
      };
      const [all, unapproved, zero, override] = await Promise.all([
        mk(),
        mk().or("price_approved.eq.false,selling_price.is.null"),
        mk().or("selling_price.is.null,selling_price.eq.0"),
        mk().not("markup_override", "is", null),
      ]);
      return {
        all: all.count ?? 0,
        unapproved: unapproved.count ?? 0,
        zero: zero.count ?? 0,
        override: override.count ?? 0,
      };
    },
  });

  const updateMut = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("synnex_products").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-products"] });
      qc.invalidateQueries({ queryKey: ["pricing-products-counts"] });
      qc.invalidateQueries({ queryKey: ["pricing-unapproved-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkApproveMut = useMutation({
    mutationFn: async ({ ids, markup }: { ids: string[]; markup: number }) => {
      // Fetch cost prices then update per-row.
      const { data, error } = await supabase
        .from("synnex_products")
        .select("id, cost_price, price")
        .in("id", ids);
      if (error) throw error;
      let ok = 0;
      for (const row of data ?? []) {
        const cost = Number((row as { cost_price: number | null; price: number | null }).cost_price ?? (row as { price: number | null }).price ?? 0);
        if (!cost || cost <= 0) continue;
        const selling = Math.round((cost * (1 + markup / 100)) / 10) * 10;
        const { error: uerr } = await supabase
          .from("synnex_products")
          .update({ selling_price: selling, price_approved: true })
          .eq("id", (row as { id: string }).id);
        if (!uerr) ok++;
      }
      return { updated: ok, requested: ids.length };
    },
    onSuccess: (r) => {
      toast.success(`คำนวณ + Approve แล้ว ${r.updated}/${r.requested} รายการ`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["pricing-products"] });
      qc.invalidateQueries({ queryKey: ["pricing-products-counts"] });
      qc.invalidateQueries({ queryKey: ["pricing-unapproved-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalPages = Math.max(1, Math.ceil((productsQ.data?.count ?? 0) / PAGE_SIZE));
  const rows = productsQ.data?.rows ?? [];
  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleAll = () => {
    const s = new Set(selected);
    if (allSelected) pageIds.forEach((id) => s.delete(id));
    else pageIds.forEach((id) => s.add(id));
    setSelected(s);
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const getMarkup = (): number | null => {
    if (markupChoice === "custom") {
      const n = Number(markupCustom);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }
    return Number(markupChoice);
  };

  const runBulk = () => {
    const markup = getMarkup();
    if (markup == null) { toast.error("กรุณาระบุ markup ที่ถูกต้อง"); return; }
    if (selected.size === 0) return;
    bulkApproveMut.mutate({ ids: [...selected], markup });
  };

  const setTab = (f: FilterKey) => {
    setSelected(new Set());
    nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, filter: f, page: 1 }) });
  };

  const counts = countsQ.data;
  const tabs: { key: FilterKey; label: string; count?: number; badgeClass?: string }[] = [
    { key: "all", label: "ทั้งหมด", count: counts?.all },
    { key: "unapproved", label: "รอ Approve", count: counts?.unapproved, badgeClass: "bg-amber-500 text-white" },
    { key: "zero", label: "ราคา ฿0", count: counts?.zero },
    { key: "override", label: "Override", count: counts?.override },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sarabun">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-[#1a237e] text-white">
        <div className="mx-auto flex max-w-[100rem] items-center gap-4 px-4 py-4">
          <h1 className="text-xl font-bold">ราคาสินค้ารายชิ้น</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/pricing">← กฎราคา</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 px-4 py-6">
        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2">
          {tabs.map((t) => {
            const active = search.filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-[#1a237e] text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? "bg-white/25 text-white" : (t.badgeClass ?? "bg-slate-200 text-slate-700")
                  }`}>
                    {t.count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
          <form
            className="relative flex-1 min-w-[240px]"
            onSubmit={(e) => {
              e.preventDefault();
              nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, q, page: 1 }) });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา SKU หรือชื่อ..." className="pl-9" />
          </form>
          <div className="text-sm text-slate-600">
            พบ <b>{(productsQ.data?.count ?? 0).toLocaleString()}</b> รายการ
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-[#1565c0] bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#0d47a1]">
              <CheckCircle2 className="h-5 w-5" />
              เลือก <b>{selected.size}</b> รายการ
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Apply markup:</span>
              <Select value={markupChoice} onValueChange={setMarkupChoice}>
                <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
              {markupChoice === "custom" && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.5"
                    value={markupCustom}
                    onChange={(e) => setMarkupCustom(e.target.value)}
                    placeholder="เช่น 12.5"
                    className="h-9 w-24 bg-white"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              )}
            </div>
            <Button
              onClick={runBulk}
              disabled={bulkApproveMut.isPending}
              className="ml-auto bg-[#1565c0] hover:bg-[#0d47a1]"
            >
              {bulkApproveMut.isPending ? "กำลังคำนวณ..." : `คำนวณ + Approve ${selected.size} รายการ`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              ล้างที่เลือก
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="เลือกทั้งหน้า" />
                </TableHead>
                <TableHead className="w-16">รูป</TableHead>
                <TableHead>ชื่อ / SKU</TableHead>
                <TableHead className="w-28">ต้นทุน</TableHead>
                <TableHead className="w-28">Markup %</TableHead>
                <TableHead className="w-32">ราคาขาย</TableHead>
                <TableHead className="w-24">Override</TableHead>
                <TableHead className="w-24">Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQ.isLoading ? (
                <TableRow><TableCell colSpan={8} className="p-8 text-center text-slate-400">กำลังโหลด...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="p-8 text-center text-slate-400">ไม่พบสินค้า</TableCell></TableRow>
              ) : rows.map((p) => {
                const cost = Number(p.cost_price ?? p.price ?? 0);
                const isSelected = selected.has(p.id);
                return (
                  <TableRow key={p.id} className={isSelected ? "bg-blue-50/60" : undefined}>
                    <TableCell>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(p.id)} aria-label={`เลือก ${p.sku}`} />
                    </TableCell>
                    <TableCell>
                      <div className="grid h-12 w-12 place-items-center rounded border bg-white">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Package className="h-6 w-6 text-slate-300" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{p.name ?? p.sku}</div>
                      <div className="text-xs text-slate-500">
                        {p.sku}{p.brand && <> · <Badge variant="outline" className="ml-1 text-[10px]">{p.brand}</Badge></>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">฿{priceFmt.format(cost)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        defaultValue={p.markup_override ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== p.markup_override) updateMut.mutate({ id: p.id, patch: { markup_override: v } });
                        }}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={p.selling_price ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== p.selling_price) updateMut.mutate({ id: p.id, patch: { selling_price: v } });
                        }}
                        className="h-8 font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      {p.markup_override != null && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">✓</Badge>}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={!!p.price_approved}
                        onCheckedChange={(v) => updateMut.mutate({ id: p.id, patch: { price_approved: !!v } })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, page: s.page - 1 }) })}>← ก่อนหน้า</Button>
            <span className="text-sm">หน้า {search.page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, page: s.page + 1 }) })}>ถัดไป →</Button>
          </div>
        )}
      </main>
    </div>
  );
}

// unused stub to keep TS module structure — no export
void applyFilter;
