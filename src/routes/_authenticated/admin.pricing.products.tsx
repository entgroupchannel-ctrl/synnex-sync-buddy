import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Search, CheckCircle2, AlertTriangle, XCircle, Check, X, LayoutGrid, List, RotateCcw, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bahtFmt, computeSelling, effectiveMarkup, indexPricingRules, type PricingRule } from "@/lib/pricing-helpers";
import { CATEGORIES } from "@/lib/cart";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  distributor: fallback(z.string(), "all").default("all"),
  category: fallback(z.string(), "all").default("all"),
  status: fallback(z.string(), "all").default("all"),
  brands: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "sku_asc").default("sku_asc"),
  view: fallback(z.string(), "grid").default("grid"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/admin/pricing/products")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "ราคาสินค้ารายชิ้น — Admin ENT Group" },
      { name: "description", content: "จัดการราคาขายรายชิ้น พร้อมแยกตาม Distributor และหมวดหมู่" },
      { property: "og:title", content: "Admin — ราคาสินค้ารายชิ้น" },
      { property: "og:description", content: "จัดการราคารายชิ้น + Distributor filter" },
    ],
  }),
  component: PricingProductsPage,
});

const PAGE_SIZE = 24;

type Product = {
  id: string;
  sku: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  distributor: string | null;
  image_url: string | null;
  cost_price: number | null;
  price: number | null;
  selling_price: number | null;
  markup_override: number | null;
  price_approved: boolean | null;
};

const DIST_STYLE: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  SYNNEX: { label: "🔵 SYNNEX", dot: "bg-blue-600", bg: "bg-blue-50", text: "text-blue-800", ring: "border-blue-200" },
  VSTECS: { label: "🟠 VSTECS", dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-800", ring: "border-orange-200" },
};
function distStyle(d: string | null | undefined) {
  return DIST_STYLE[(d ?? "").toUpperCase()] ?? { label: d ?? "—", dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-700", ring: "border-slate-200" };
}

function PricingProductsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [markupChoice, setMarkupChoice] = useState<string>("15");
  const [markupCustom, setMarkupCustom] = useState<string>("");
  const [markupEdits, setMarkupEdits] = useState<Record<string, string>>({});

  const update = (patch: Record<string, unknown>) =>
    nav({ search: (s: Record<string, unknown>) => ({ ...s, ...patch, page: 1 }) });

  const selectedBrands = useMemo(
    () => (search.brands ? search.brands.split(",").filter(Boolean) : []),
    [search.brands],
  );

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    sku_asc: { col: "sku", asc: true },
    sku_desc: { col: "sku", asc: false },
    name_asc: { col: "name", asc: true },
    cost_asc: { col: "cost_price", asc: true },
    cost_desc: { col: "cost_price", asc: false },
    selling_asc: { col: "selling_price", asc: true },
    selling_desc: { col: "selling_price", asc: false },
  };

  const productsQ = useQuery({
    queryKey: ["pricing-products-v2", search],
    queryFn: async () => {
      const from = (search.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const so = sortMap[search.sort] ?? sortMap.sku_asc;
      let qq = supabase
        .from("synnex_products")
        .select("id, sku, name, brand, category, distributor, image_url, cost_price, price, selling_price, markup_override, price_approved", { count: "exact" })
        .order(so.col, { ascending: so.asc, nullsFirst: false })
        .range(from, to);
      const s = search.q.trim().replace(/[%,]/g, "");
      if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
      if (search.distributor !== "all") qq = qq.eq("distributor", search.distributor);
      if (search.category !== "all") qq = qq.eq("category", search.category);
      if (selectedBrands.length > 0) qq = qq.in("brand", selectedBrands);
      if (search.status === "unapproved") qq = qq.or("price_approved.eq.false,selling_price.is.null");
      else if (search.status === "zero") qq = qq.or("selling_price.is.null,selling_price.eq.0");
      else if (search.status === "approved") qq = qq.eq("price_approved", true);
      const { data, error, count } = await qq;
      if (error) throw error;
      return { rows: (data ?? []) as Product[], count: count ?? 0 };
    },
  });

  const rulesQ = useQuery({
    queryKey: ["pricing-rules-idx"],
    queryFn: async () => {
      const { data } = await supabase.from("pricing_rules").select("id, rule_type, target, markup_percent, is_active").eq("is_active", true);
      return indexPricingRules((data ?? []) as PricingRule[]);
    },
  });

  const brandsQ = useQuery({
    queryKey: ["pricing-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products").select("brand").not("brand", "is", null).limit(1000);
      const map = new Map<string, number>();
      for (const r of data ?? []) {
        const b = (r as { brand: string | null }).brand;
        if (!b) continue;
        map.set(b, (map.get(b) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b, n]) => ({ brand: b, count: n }));
    },
    staleTime: 5 * 60_000,
  });

  const distributorCountsQ = useQuery({
    queryKey: ["pricing-dist-counts", search.q, search.category, search.status, search.brands],
    queryFn: async () => {
      const s = search.q.trim().replace(/[%,]/g, "");
      const mk = (dist: string | null) => {
        let qq = supabase.from("synnex_products").select("*", { count: "exact", head: true });
        if (dist) qq = qq.eq("distributor", dist);
        if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
        if (search.category !== "all") qq = qq.eq("category", search.category);
        if (selectedBrands.length > 0) qq = qq.in("brand", selectedBrands);
        if (search.status === "unapproved") qq = qq.or("price_approved.eq.false,selling_price.is.null");
        else if (search.status === "zero") qq = qq.or("selling_price.is.null,selling_price.eq.0");
        else if (search.status === "approved") qq = qq.eq("price_approved", true);
        return qq;
      };
      const [all, syn, vst] = await Promise.all([mk(null), mk("SYNNEX"), mk("VSTECS")]);
      return { all: all.count ?? 0, SYNNEX: syn.count ?? 0, VSTECS: vst.count ?? 0 };
    },
  });

  const statusCountsQ = useQuery({
    queryKey: ["pricing-status-counts", search.q, search.distributor, search.category, search.brands],
    queryFn: async () => {
      const s = search.q.trim().replace(/[%,]/g, "");
      const mk = () => {
        let qq = supabase.from("synnex_products").select("*", { count: "exact", head: true });
        if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
        if (search.distributor !== "all") qq = qq.eq("distributor", search.distributor);
        if (search.category !== "all") qq = qq.eq("category", search.category);
        if (selectedBrands.length > 0) qq = qq.in("brand", selectedBrands);
        return qq;
      };
      const [all, unapproved, zero, approved] = await Promise.all([
        mk(),
        mk().or("price_approved.eq.false,selling_price.is.null"),
        mk().or("selling_price.is.null,selling_price.eq.0"),
        mk().eq("price_approved", true),
      ]);
      return {
        all: all.count ?? 0,
        unapproved: unapproved.count ?? 0,
        zero: zero.count ?? 0,
        approved: approved.count ?? 0,
      };
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["pricing-products-v2"] });
    qc.invalidateQueries({ queryKey: ["pricing-dist-counts"] });
    qc.invalidateQueries({ queryKey: ["pricing-status-counts"] });
    qc.invalidateQueries({ queryKey: ["pricing-unapproved-count"] });
  };

  const applyMut = useMutation({
    mutationFn: async ({ id, cost, markup }: { id: string; cost: number; markup: number }) => {
      const selling = computeSelling(cost, markup);
      const { error } = await supabase.from("synnex_products").update({ markup_override: markup, selling_price: selling, price_approved: true }).eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: ({ id }) => {
      setMarkupEdits((m) => { const c = { ...m }; delete c[id]; return c; });
      toast.success("Apply สำเร็จ");
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: async ({ id, cost, currentMarkup }: { id: string; cost: number; currentMarkup: number }) => {
      const selling = computeSelling(cost, currentMarkup);
      const { error } = await supabase.from("synnex_products").update({ selling_price: selling, price_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Approve แล้ว"); invalidateAll(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkApproveMut = useMutation({
    mutationFn: async ({ ids, markup }: { ids: string[]; markup: number }) => {
      const { data, error } = await supabase.from("synnex_products").select("id, cost_price, price").in("id", ids);
      if (error) throw error;
      let ok = 0;
      for (const row of data ?? []) {
        const r = row as { id: string; cost_price: number | null; price: number | null };
        const cost = Number(r.cost_price ?? r.price ?? 0);
        if (!cost || cost <= 0) continue;
        const selling = computeSelling(cost, markup);
        const { error: uerr } = await supabase.from("synnex_products").update({ selling_price: selling, price_approved: true }).eq("id", r.id);
        if (!uerr) ok++;
      }
      return { updated: ok, requested: ids.length };
    },
    onSuccess: (r) => {
      toast.success(`Apply + Approve แล้ว ${r.updated}/${r.requested} รายการ`);
      setSelected(new Set());
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetBulkMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("synnex_products")
        .update({ selling_price: null, price_approved: false, markup_override: null })
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`รีเซ็ตราคา ${n} รายการแล้ว`);
      setSelected(new Set());
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = productsQ.data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((productsQ.data?.count ?? 0) / PAGE_SIZE));
  const dCounts = distributorCountsQ.data;
  const sCounts = statusCountsQ.data;
  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleAllOnPage = () => {
    const s = new Set(selected);
    if (allSelected) pageIds.forEach((id) => s.delete(id));
    else pageIds.forEach((id) => s.add(id));
    setSelected(s);
  };

  const getMarkup = (): number | null => {
    if (markupChoice === "custom") {
      const n = Number(markupCustom);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }
    return Number(markupChoice);
  };

  const toggleBrand = (b: string) => {
    const set = new Set(selectedBrands);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    update({ brands: [...set].join(",") });
  };

  const runBulk = () => {
    const markup = getMarkup();
    if (markup == null) { toast.error("กรุณาระบุ markup ที่ถูกต้อง"); return; }
    if (selected.size === 0) return;
    bulkApproveMut.mutate({ ids: [...selected], markup });
  };

  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  // Bulk preview: average cost & projected selling
  const bulkPreview = useMemo(() => {
    if (selected.size === 0) return null;
    const markup = getMarkup();
    const sel = rows.filter((r) => selected.has(r.id));
    const costs = sel.map((r) => Number(r.cost_price ?? r.price ?? 0)).filter((n) => n > 0);
    if (costs.length === 0) return { avgCost: 0, avgSelling: 0, markup: markup ?? 0, missing: sel.length };
    const avgCost = costs.reduce((s, n) => s + n, 0) / costs.length;
    const avgSelling = markup != null ? computeSelling(avgCost, markup) : 0;
    return { avgCost, avgSelling, markup: markup ?? 0, missing: sel.length - costs.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, rows, markupChoice, markupCustom]);

  const isSupabaseImage = (u: string | null | undefined) =>
    !!u && (u.includes("supabase.co/storage") || u.includes("/storage/v1/object/"));

  const Sidebar = (
    <div className="space-y-6 text-sm">
      {/* Search */}
      <form
        className="relative"
        onSubmit={(e) => { e.preventDefault(); update({ q }); }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา SKU / ชื่อ..." className="pl-9" />
      </form>

      {/* Distributor filter */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Distributor</div>
        <div className="space-y-1">
          {([
            ["all", "ทั้งหมด", dCounts?.all],
            ["SYNNEX", "🔵 SYNNEX", dCounts?.SYNNEX],
            ["VSTECS", "🟠 VSTECS", dCounts?.VSTECS],
          ] as const).map(([val, label, n]) => (
            <button
              key={val}
              onClick={() => update({ distributor: val })}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                search.distributor === val ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"
              }`}
            >
              <span>{label}</span>
              {n != null && <span className={`text-xs ${search.distributor === val ? "opacity-80" : "text-slate-400"}`}>{n.toLocaleString()}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">หมวดหมู่</div>
        <div className="space-y-0.5">
          <button
            onClick={() => update({ category: "all" })}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
              search.category === "all" ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"
            }`}
          >
            ทั้งหมด
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => update({ category: c })}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                search.category === c ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price status */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">สถานะราคา</div>
        <div className="space-y-1">
          {([
            ["all", "ทั้งหมด", sCounts?.all, "bg-slate-200 text-slate-700"],
            ["unapproved", "รอ Approve", sCounts?.unapproved, "bg-amber-100 text-amber-800"],
            ["zero", "ราคา ฿0", sCounts?.zero, "bg-red-100 text-red-700"],
            ["approved", "Approved", sCounts?.approved, "bg-green-100 text-green-800"],
          ] as const).map(([val, label, n, cls]) => (
            <button
              key={val}
              onClick={() => update({ status: val })}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                search.status === val ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"
              }`}
            >
              <span>{label}</span>
              {n != null && (
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${search.status === val ? "bg-white/20 text-white" : cls}`}>
                  {n.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">แบรนด์ (Top 10)</div>
        <div className="space-y-1.5">
          {(brandsQ.data ?? []).map(({ brand, count }) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} />
              <span className="flex-1 truncate">{brand}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => nav({ search: {} as never })}>
        ล้างตัวกรอง
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-[color:var(--brand-navy)] text-white">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-4">
          <h1 className="text-lg font-bold md:text-xl">ราคาสินค้ารายชิ้น</h1>
          <div className="text-xs text-white/70">
            พบ <b className="text-white">{(productsQ.data?.count ?? 0).toLocaleString()}</b> รายการ
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/pricing">← กฎราคา</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem] gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6 rounded-lg border bg-white p-4">{Sidebar}</div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Distributor tabs + sort/view */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-white p-2">
            <div className="flex flex-wrap gap-1">
              {([
                ["all", "ทั้งหมด", dCounts?.all],
                ["SYNNEX", "🔵 SYNNEX", dCounts?.SYNNEX],
                ["VSTECS", "🟠 VSTECS", dCounts?.VSTECS],
              ] as const).map(([val, label, n]) => (
                <button
                  key={val}
                  onClick={() => update({ distributor: val })}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                    search.distributor === val
                      ? val === "SYNNEX"
                        ? "bg-blue-600 text-white"
                        : val === "VSTECS"
                        ? "bg-orange-500 text-white"
                        : "bg-[color:var(--brand-navy)] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {label}
                  {n != null && (
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${search.distributor === val ? "bg-white/25" : "bg-slate-200 text-slate-700"}`}>
                      {n.toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                <Checkbox checked={allSelected} onCheckedChange={toggleAllOnPage} aria-label="เลือกทั้งหน้า" />
                <span className="text-slate-600">เลือกทั้งหน้า</span>
              </label>
              <Select value={search.sort} onValueChange={(v) => update({ sort: v })}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sku_asc">SKU (A → Z)</SelectItem>
                  <SelectItem value="sku_desc">SKU (Z → A)</SelectItem>
                  <SelectItem value="name_asc">ชื่อ (A → Z)</SelectItem>
                  <SelectItem value="cost_asc">ต้นทุน (น้อย → มาก)</SelectItem>
                  <SelectItem value="cost_desc">ต้นทุน (มาก → น้อย)</SelectItem>
                  <SelectItem value="selling_asc">ราคาขาย (น้อย → มาก)</SelectItem>
                  <SelectItem value="selling_desc">ราคาขาย (มาก → น้อย)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border">
                <button
                  onClick={() => update({ view: "grid" })}
                  aria-label="Grid view"
                  className={`grid h-8 w-8 place-items-center transition ${search.view === "grid" ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => update({ view: "list" })}
                  aria-label="List view"
                  className={`grid h-8 w-8 place-items-center border-l transition ${search.view === "list" ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter bar */}
          <div className="mb-4 flex gap-2 lg:hidden">
            <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); update({ q }); }}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา..." className="pl-9" />
            </form>
          </div>


          {/* Product grid */}
          {productsQ.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-12 text-center text-slate-500">
              ไม่พบสินค้าที่ตรงเงื่อนไข
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p) => {
                const cost = Number(p.cost_price ?? p.price ?? 0);
                const selling = Number(p.selling_price ?? 0);
                const approved = !!p.price_approved;
                const idx = rulesQ.data;
                const mk = idx ? effectiveMarkup(p, idx) : null;
                const currentMarkup = mk?.pct ?? null;

                const editedRaw = markupEdits[p.id];
                const editedNum = editedRaw !== undefined ? Number(editedRaw) : null;
                const hasEdit = editedRaw !== undefined && Number.isFinite(editedNum!) && editedNum! !== currentMarkup;
                const previewSelling = hasEdit && cost > 0 ? computeSelling(cost, editedNum!) : null;

                const isSelected = selected.has(p.id);
                const ds = distStyle(p.distributor);

                let statusIcon: React.ReactNode;
                let statusLabel = "";
                if (approved && selling > 0) {
                  statusIcon = <CheckCircle2 className="h-4 w-4 text-green-500" />;
                  statusLabel = "Approved";
                } else if (selling > 0) {
                  statusIcon = <AlertTriangle className="h-4 w-4 text-amber-500" />;
                  statusLabel = "รอ approve";
                } else {
                  statusIcon = <XCircle className="h-4 w-4 text-red-500" />;
                  statusLabel = "฿0";
                }

                return (
                  <div
                    key={p.id}
                    className={`group relative overflow-hidden rounded-lg border-2 bg-white transition ${
                      isSelected ? "border-[color:var(--brand-navy)] shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Select checkbox */}
                    <div className="absolute left-2 top-2 z-10 rounded bg-white/95 p-1 shadow-sm">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(p.id)} />
                    </div>

                    {/* Distributor badge */}
                    <div className={`absolute right-2 top-2 z-10 rounded px-2 py-0.5 text-[10px] font-bold shadow-sm ${ds.bg} ${ds.text}`}>
                      {ds.label}
                    </div>

                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="grid h-[120px] w-[120px] shrink-0 place-items-center rounded-md border bg-white">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name ?? p.sku} className="max-h-full max-w-full object-contain p-1" loading="lazy" />
                        ) : (
                          <Package className="h-10 w-10 text-slate-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">
                          {p.name ?? p.sku}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">{p.sku}</div>
                        {p.brand && (
                          <Badge variant="outline" className="mt-1 h-4 px-1.5 text-[10px]">{p.brand}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Price block */}
                    <div className="grid grid-cols-3 gap-2 border-t bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">ต้นทุน</div>
                        <div className="font-mono text-xs text-slate-700">
                          {cost > 0 ? `฿${bahtFmt.format(cost)}` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Markup</div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editedRaw ?? (currentMarkup != null ? String(currentMarkup) : "")}
                            onChange={(e) => setMarkupEdits((m) => ({ ...m, [p.id]: e.target.value }))}
                            className={`h-6 w-14 rounded border px-1.5 text-xs font-bold outline-none ${
                              hasEdit ? "border-[color:var(--brand-orange)] bg-orange-50 text-[color:var(--brand-orange-dark)]" : "border-slate-200 bg-white text-blue-700"
                            }`}
                            step="0.5"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-500">ราคาขาย</div>
                        {previewSelling != null ? (
                          <div className="font-bold text-[color:var(--brand-orange)] italic">
                            ฿{bahtFmt.format(previewSelling)}
                          </div>
                        ) : selling > 0 ? (
                          <div className="font-bold text-[color:var(--brand-orange)]">
                            ฿{bahtFmt.format(selling)}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">—</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        {statusIcon}
                        <span className={`font-medium ${
                          approved && selling > 0 ? "text-green-700" : selling > 0 ? "text-amber-700" : "text-red-600"
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                      {hasEdit && cost > 0 ? (
                        <Button
                          size="sm"
                          className="h-7 bg-[color:var(--brand-orange)] px-3 text-xs font-bold hover:bg-[color:var(--brand-orange-dark)]"
                          onClick={() => applyMut.mutate({ id: p.id, cost, markup: editedNum! })}
                          disabled={applyMut.isPending}
                        >
                          Apply
                        </Button>
                      ) : approved && selling > 0 ? (
                        <span className="text-[10px] text-slate-400">พร้อมขาย</span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={approveMut.isPending || cost <= 0 || currentMarkup == null}
                          onClick={() =>
                            currentMarkup != null && approveMut.mutate({ id: p.id, cost, currentMarkup })
                          }
                          className="h-7 bg-[color:var(--brand-navy)] px-3 text-xs font-bold hover:bg-[color:var(--brand-navy-2)]"
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {(productsQ.data?.count ?? 0) > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {productsQ.data!.count.toLocaleString()} รายการ · หน้า {search.page}/{totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => nav({ search: (s: Record<string, unknown>) => ({ ...s, page: search.page - 1 }) })}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => nav({ search: (s: Record<string, unknown>) => ({ ...s, page: search.page + 1 }) })}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}

          <div className="h-24" aria-hidden />
        </main>
      </div>

      {/* Sticky bulk bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[color:var(--brand-orange)] bg-white shadow-2xl">
          <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-[color:var(--brand-navy)]" />
              <span>เลือก <b className="text-[color:var(--brand-navy)]">{selected.size}</b> รายการ</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Markup</span>
              <Select value={markupChoice} onValueChange={setMarkupChoice}>
                <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
              {markupChoice === "custom" && (
                <Input
                  type="number"
                  step="0.5"
                  value={markupCustom}
                  onChange={(e) => setMarkupCustom(e.target.value)}
                  placeholder="เช่น 12.5"
                  className="h-9 w-24"
                />
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="gap-1">
                <X className="h-4 w-4" /> ล้าง
              </Button>
              <Button
                onClick={runBulk}
                disabled={bulkApproveMut.isPending}
                className="gap-1 bg-[color:var(--brand-orange)] font-bold hover:bg-[color:var(--brand-orange-dark)]"
              >
                <Check className="h-4 w-4" />
                {bulkApproveMut.isPending ? "กำลังคำนวณ..." : `Apply + Approve (${selected.size})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
