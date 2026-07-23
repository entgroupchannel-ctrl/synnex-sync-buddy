import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  X,
  LayoutGrid,
  List,
  RotateCcw,
  ImageOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  bahtFmt,
  computeSelling,
  effectiveMarkup,
  indexPricingRules,
  type PricingRule,
} from "@/lib/pricing-helpers";
import { CATEGORIES } from "@/lib/cart";
import { logAudit, logAuditBulk, newSessionId } from "@/lib/pricing-audit";

const LS_KEY = "ent_pricing_v2";
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const EXPORT_WARN_THRESHOLD = 5000;

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  distributor: fallback(z.string(), "all").default("all"),
  category: fallback(z.string(), "all").default("all"),
  status: fallback(z.string(), "all").default("all"),
  brands: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "sku_asc").default("sku_asc"),
  view: fallback(z.string(), "grid").default("grid"),
  page: fallback(z.number().int(), 1).default(1),
  pageSize: fallback(z.number().int(), 50).default(50),
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
  updated_at: string | null;
};

const DIST_STYLE: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  SYNNEX: { label: "🔵 SYNNEX", dot: "bg-blue-600", bg: "bg-blue-50", text: "text-blue-800", ring: "border-blue-200" },
  VSTECS: { label: "🟠 VSTECS", dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-800", ring: "border-orange-200" },
};
function distStyle(d: string | null | undefined) {
  return DIST_STYLE[(d ?? "").toUpperCase()] ?? { label: d ?? "—", dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-700", ring: "border-slate-200" };
}

const SORT_OPTIONS: Array<[string, string]> = [
  ["name_asc", "ชื่อสินค้า A → Z"],
  ["name_desc", "ชื่อสินค้า Z → A"],
  ["cost_asc", "ต้นทุน น้อย → มาก"],
  ["cost_desc", "ต้นทุน มาก → น้อย"],
  ["markup_asc", "Markup % น้อย → มาก"],
  ["markup_desc", "Markup % มาก → น้อย"],
  ["selling_asc", "ราคาขาย น้อย → มาก"],
  ["selling_desc", "ราคาขาย มาก → น้อย"],
  ["status_pending", "สถานะ (รอ Approve ก่อน)"],
  ["status_approved", "สถานะ (Approved ก่อน)"],
  ["updated_desc", "อัปเดตล่าสุด"],
  ["sku_asc", "SKU A → Z"],
  ["sku_desc", "SKU Z → A"],
];

const sortMap: Record<string, { col: string; asc: boolean }> = {
  sku_asc: { col: "sku", asc: true },
  sku_desc: { col: "sku", asc: false },
  name_asc: { col: "name", asc: true },
  name_desc: { col: "name", asc: false },
  cost_asc: { col: "cost_price", asc: true },
  cost_desc: { col: "cost_price", asc: false },
  markup_asc: { col: "markup_override", asc: true },
  markup_desc: { col: "markup_override", asc: false },
  selling_asc: { col: "selling_price", asc: true },
  selling_desc: { col: "selling_price", asc: false },
  status_pending: { col: "price_approved", asc: true },
  status_approved: { col: "price_approved", asc: false },
  updated_desc: { col: "updated_at", asc: false },
};

function PricingProductsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [markupChoice, setMarkupChoice] = useState<string>("15");
  const [markupCustom, setMarkupCustom] = useState<string>("");
  const [markupEdits, setMarkupEdits] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [justApprovedIds, setJustApprovedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  const [exporting, setExporting] = useState(false);
  const [exportConfirmCount, setExportConfirmCount] = useState<number | null>(null);

  // Restore filters from localStorage on first mount (only if URL has no explicit params)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      const hasUrlFilters = window.location.search.length > 1;
      if (hasUrlFilters) return;
      const patch: Record<string, unknown> = {};
      for (const k of ["q", "distributor", "category", "status", "brands", "sort", "view"]) {
        if (typeof saved[k] === "string") patch[k] = saved[k];
      }
      if (typeof saved.pageSize === "number") patch.pageSize = saved.pageSize;
      if (Object.keys(patch).length > 0) {
        setQ(String(patch.q ?? ""));
        nav({ search: (s: Record<string, unknown>) => ({ ...s, ...patch, page: 1 }), replace: true });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          q: search.q,
          distributor: search.distributor,
          category: search.category,
          status: search.status,
          brands: search.brands,
          sort: search.sort,
          view: search.view,
          pageSize: search.pageSize,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [search.q, search.distributor, search.category, search.status, search.brands, search.sort, search.view, search.pageSize]);

  const update = (patch: Record<string, unknown>) =>
    nav({ search: (s: Record<string, unknown>) => ({ ...s, ...patch, page: 1 }), replace: true });

  const goToPage = (page: number) => {
    nav({ search: (s: Record<string, unknown>) => ({ ...s, page }), replace: true });
    setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  const selectedBrands = useMemo(
    () => (search.brands ? search.brands.split(",").filter(Boolean) : []),
    [search.brands],
  );

  const productsQ = useQuery({
    queryKey: ["pricing-products-v3", search],
    queryFn: async () => {
      const from = (search.page - 1) * search.pageSize;
      const to = from + search.pageSize - 1;
      const so = sortMap[search.sort] ?? sortMap.sku_asc;
      let qq = supabase
        .from("synnex_products")
        .select(
          "id, sku, name, brand, category, distributor, image_url, cost_price, price, selling_price, markup_override, price_approved, updated_at",
          { count: "exact" },
        )
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
    qc.invalidateQueries({ queryKey: ["pricing-products-v3"] });
    qc.invalidateQueries({ queryKey: ["pricing-dist-counts"] });
    qc.invalidateQueries({ queryKey: ["pricing-status-counts"] });
    qc.invalidateQueries({ queryKey: ["pricing-unapproved-count"] });
  };

  const markPending = (id: string, on: boolean) =>
    setPendingIds((s) => {
      const c = new Set(s);
      if (on) c.add(id);
      else c.delete(id);
      return c;
    });

  const flashApproved = (id: string) => {
    setJustApprovedIds((s) => new Set(s).add(id));
    setTimeout(() => {
      setJustApprovedIds((s) => {
        const c = new Set(s);
        c.delete(id);
        return c;
      });
    }, 2000);
  };

  // Toast helpers with richer content
  const priceChangeToast = (name: string, oldPrice: number, newPrice: number, mk: number) => {
    toast.success("Approve สำเร็จ", {
      description: (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="mt-0.5 font-mono">
            ฿{bahtFmt.format(oldPrice)} → ฿{bahtFmt.format(newPrice)} (+{mk}%)
          </div>
        </div>
      ),
      duration: 4000,
    });
  };
  const errorToast = (title: string, name: string, message: string, retry?: () => void) => {
    toast.error(title, {
      description: (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="mt-0.5 text-red-700">{message}</div>
        </div>
      ),
      action: retry ? { label: "ลองอีกครั้ง", onClick: retry } : undefined,
      duration: Infinity,
      closeButton: true,
    });
  };

  // Single-card Apply markup change (from inline edit)
  const applyMut = useMutation({
    mutationFn: async (input: { p: Product; markup: number }) => {
      const { p, markup } = input;
      const cost = Number(p.cost_price ?? p.price ?? 0);
      const selling = computeSelling(cost, markup);
      markPending(p.id, true);
      const { error } = await supabase
        .from("synnex_products")
        .update({ markup_override: markup, selling_price: selling, price_approved: true })
        .eq("id", p.id);
      if (error) throw error;
      await logAudit({
        product_sku: p.sku,
        product_name: p.name,
        action: "markup_change",
        old_selling_price: p.selling_price,
        new_selling_price: selling,
        old_markup: p.markup_override,
        new_markup: markup,
      });
      return { p, selling, markup };
    },
    onSuccess: ({ p, selling, markup }) => {
      markPending(p.id, false);
      flashApproved(p.id);
      setMarkupEdits((m) => {
        const c = { ...m };
        delete c[p.id];
        return c;
      });
      priceChangeToast(p.name ?? p.sku, Number(p.selling_price ?? 0), selling, markup);
      invalidateAll();
    },
    onError: (e: Error, vars) => {
      markPending(vars.p.id, false);
      errorToast("บันทึก markup ไม่สำเร็จ", vars.p.name ?? vars.p.sku, e.message, () =>
        applyMut.mutate(vars),
      );
    },
  });

  // Single-card Approve using current effective markup
  const approveMut = useMutation({
    mutationFn: async (input: { p: Product; markup: number }) => {
      const { p, markup } = input;
      const cost = Number(p.cost_price ?? p.price ?? 0);
      const selling = computeSelling(cost, markup);
      markPending(p.id, true);
      const { error } = await supabase
        .from("synnex_products")
        .update({ selling_price: selling, price_approved: true })
        .eq("id", p.id);
      if (error) throw error;
      await logAudit({
        product_sku: p.sku,
        product_name: p.name,
        action: "approve",
        old_selling_price: p.selling_price,
        new_selling_price: selling,
        old_markup: p.markup_override,
        new_markup: markup,
      });
      return { p, selling, markup };
    },
    onSuccess: ({ p, selling, markup }) => {
      markPending(p.id, false);
      flashApproved(p.id);
      priceChangeToast(p.name ?? p.sku, Number(p.cost_price ?? p.price ?? 0), selling, markup);
      invalidateAll();
    },
    onError: (e: Error, vars) => {
      markPending(vars.p.id, false);
      errorToast("Approve ไม่สำเร็จ", vars.p.name ?? vars.p.sku, e.message, () =>
        approveMut.mutate(vars),
      );
    },
  });

  const bulkApproveMut = useMutation({
    mutationFn: async ({ ids, markup }: { ids: string[]; markup: number }) => {
      const sessionId = newSessionId();
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
      let done = 0;
      let ok = 0;
      const auditRows: Parameters<typeof logAuditBulk>[0] = [];
      setBulkProgress({ done: 0, total: ids.length });
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from("synnex_products")
          .select("id, sku, name, cost_price, price, selling_price, markup_override")
          .in("id", chunk);
        if (error) throw error;
        for (const row of data ?? []) {
          const r = row as {
            id: string;
            sku: string;
            name: string | null;
            cost_price: number | null;
            price: number | null;
            selling_price: number | null;
            markup_override: number | null;
          };
          done++;
          const cost = Number(r.cost_price ?? r.price ?? 0);
          if (!cost || cost <= 0) continue;
          const selling = computeSelling(cost, markup);
          const { error: uerr } = await supabase
            .from("synnex_products")
            .update({ selling_price: selling, price_approved: true, markup_override: markup })
            .eq("id", r.id);
          if (!uerr) {
            ok++;
            auditRows.push({
              product_sku: r.sku,
              product_name: r.name,
              action: "bulk_approve",
              old_selling_price: r.selling_price,
              new_selling_price: selling,
              old_markup: r.markup_override,
              new_markup: markup,
              session_id: sessionId,
            });
          }
          setBulkProgress({ done, total: ids.length });
        }
      }
      await logAuditBulk(auditRows);
      const avgSelling =
        auditRows.length > 0
          ? auditRows.reduce((s, r) => s + Number(r.new_selling_price ?? 0), 0) / auditRows.length
          : 0;
      return { updated: ok, requested: ids.length, markup, avgSelling };
    },
    onSuccess: (r) => {
      toast.success("Bulk Approve สำเร็จ", {
        description: (
          <div className="text-xs">
            <div className="font-semibold">
              {r.updated} รายการ | markup +{r.markup}%
            </div>
            {r.avgSelling > 0 && (
              <div className="mt-0.5 font-mono">
                ราคาขายเฉลี่ย ฿{bahtFmt.format(r.avgSelling)}
              </div>
            )}
          </div>
        ),
        duration: 4000,
      });
      setSelected(new Set());
      setBulkProgress(null);
      invalidateAll();
    },
    onError: (e: Error) => {
      toast.error("Bulk Approve ไม่สำเร็จ", { description: e.message, duration: Infinity, closeButton: true });
      setBulkProgress(null);
    },
  });

  const resetBulkMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const sessionId = newSessionId();
      const { data: before } = await supabase
        .from("synnex_products")
        .select("id, sku, name, selling_price, markup_override")
        .in("id", ids);
      const { error } = await supabase
        .from("synnex_products")
        .update({ selling_price: null, price_approved: false, markup_override: null })
        .in("id", ids);
      if (error) throw error;
      await logAuditBulk(
        (before ?? []).map((r) => {
          const row = r as { sku: string; name: string | null; selling_price: number | null; markup_override: number | null };
          return {
            product_sku: row.sku,
            product_name: row.name,
            action: "reset",
            old_selling_price: row.selling_price,
            new_selling_price: null,
            old_markup: row.markup_override,
            new_markup: null,
            session_id: sessionId,
          };
        }),
      );
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`รีเซ็ตราคา ${n} รายการแล้ว`);
      setSelected(new Set());
      invalidateAll();
    },
    onError: (e: Error) =>
      toast.error("Reset ไม่สำเร็จ", { description: e.message, duration: Infinity, closeButton: true }),
  });

  // Build the same filtered query used for the grid, without .range() — for CSV export.
  const buildFilteredQuery = () => {
    const so = sortMap[search.sort] ?? sortMap.sku_asc;
    let qq = supabase
      .from("synnex_products")
      .select(
        "sku, name, brand, category, distributor, cost_price, price, selling_price, markup_override, price_approved, updated_at",
        { count: "exact" },
      )
      .order(so.col, { ascending: so.asc, nullsFirst: false });
    const s = search.q.trim().replace(/[%,]/g, "");
    if (s) qq = qq.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
    if (search.distributor !== "all") qq = qq.eq("distributor", search.distributor);
    if (search.category !== "all") qq = qq.eq("category", search.category);
    if (selectedBrands.length > 0) qq = qq.in("brand", selectedBrands);
    if (search.status === "unapproved") qq = qq.or("price_approved.eq.false,selling_price.is.null");
    else if (search.status === "zero") qq = qq.or("selling_price.is.null,selling_price.eq.0");
    else if (search.status === "approved") qq = qq.eq("price_approved", true);
    return qq;
  };

  const runExport = async () => {
    setExporting(true);
    try {
      // Paginate through the filtered set with .range() to avoid the 1000-row default cap.
      const CHUNK = 1000;
      let start = 0;
      const all: Array<Record<string, unknown>> = [];
      // First call also returns count
      const first = await buildFilteredQuery().range(start, start + CHUNK - 1);
      if (first.error) throw first.error;
      const total = first.count ?? (first.data?.length ?? 0);
      for (const row of first.data ?? []) all.push(row as Record<string, unknown>);
      start += CHUNK;
      while (start < total) {
        const r = await buildFilteredQuery().range(start, start + CHUNK - 1);
        if (r.error) throw r.error;
        for (const row of r.data ?? []) all.push(row as Record<string, unknown>);
        start += CHUNK;
      }
      const headers = [
        "SKU", "ชื่อสินค้า", "แบรนด์", "Distributor", "หมวดหมู่",
        "ราคาต้นทุน", "Markup%", "ราคาขาย", "สถานะ", "อัปเดตล่าสุด",
      ];
      const esc = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const isoLocal = (d: string | null | undefined) => {
        if (!d) return "";
        const dt = new Date(d);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      };
      const lines = [headers.join(",")];
      for (const r of all) {
        const cost = r.cost_price ?? r.price ?? "";
        const status = r.price_approved
          ? "approved"
          : (r.selling_price == null || Number(r.selling_price) === 0)
            ? "no_price"
            : "pending";
        lines.push([
          esc(r.sku),
          esc(r.name),
          esc(r.brand),
          esc(r.distributor),
          esc(r.category),
          esc(cost),
          esc(r.markup_override ?? ""),
          esc(r.selling_price ?? ""),
          esc(status),
          esc(isoLocal(r.updated_at as string | null)),
        ].join(","));
      }
      const csv = "\ufeff" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      a.href = url;
      a.download = `products_export_${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export สำเร็จ (${all.length.toLocaleString()} รายการ)`);
    } catch (e) {
      toast.error("Export ไม่สำเร็จ", { description: (e as Error).message });
    } finally {
      setExporting(false);
    }
  };

  const onExportClick = () => {
    const n = productsQ.data?.count ?? 0;
    if (n > EXPORT_WARN_THRESHOLD) setExportConfirmCount(n);
    else runExport();
  };


  const rows = productsQ.data?.rows ?? [];
  const totalCount = productsQ.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / search.pageSize));
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

  const openConfirmBulk = () => {
    const markup = getMarkup();
    if (markup == null) {
      toast.error("กรุณาระบุ markup ที่ถูกต้อง");
      return;
    }
    if (selected.size === 0) return;
    setConfirmOpen(true);
    setConfirmReady(false);
    setTimeout(() => setConfirmReady(true), 2000);
  };

  const runBulk = () => {
    const markup = getMarkup();
    if (markup == null || selected.size === 0) return;
    setConfirmOpen(false);
    bulkApproveMut.mutate({ ids: [...selected], markup });
  };

  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  // Bulk preview
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

  // Preview rows for the confirm dialog (up to 3 from current page)
  const confirmPreviewRows = useMemo(() => {
    const markup = getMarkup();
    if (markup == null) return [];
    return rows
      .filter((r) => selected.has(r.id))
      .filter((r) => Number(r.cost_price ?? r.price ?? 0) > 0)
      .slice(0, 3)
      .map((r) => {
        const cost = Number(r.cost_price ?? r.price ?? 0);
        return { name: r.name ?? r.sku, cost, selling: computeSelling(cost, markup) };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, rows, markupChoice, markupCustom]);

  const isSupabaseImage = (u: string | null | undefined) =>
    !!u && (u.includes("supabase.co/storage") || u.includes("/storage/v1/object/"));

  const activePageNumbers = useMemo((): (number | "…")[] => {
    const p = search.page;
    const T = totalPages;
    if (T <= 7) return Array.from({ length: T }, (_, i) => i + 1);
    const items: (number | "…")[] = [1];
    if (p > 4) items.push("…");
    for (let i = Math.max(2, p - 1); i <= Math.min(T - 1, p + 1); i++) items.push(i);
    if (p < T - 3) items.push("…");
    items.push(T);
    return items;
  }, [search.page, totalPages]);

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

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setQ("");
          nav({ search: {} as never });
        }}
      >
        ล้างตัวกรอง
      </Button>
    </div>
  );

  const from = totalCount === 0 ? 0 : (search.page - 1) * search.pageSize + 1;
  const to = Math.min(search.page * search.pageSize, totalCount);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" visibleToasts={3} toastOptions={{ style: { zIndex: 9999 } }} />
      <header className="border-b bg-[color:var(--brand-navy)] text-white">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-4">
          <h1 className="text-lg font-bold md:text-xl">ราคาสินค้ารายชิ้น</h1>
          <div className="text-xs text-white/70">
            พบ <b className="text-white">{totalCount.toLocaleString()}</b> รายการ
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/pricing/audit">Audit log</Link>
            </Button>
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
          <div ref={gridTopRef} />
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
                <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
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
            <TooltipProvider delayDuration={200}>
              <div
                className={
                  search.view === "list"
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                }
              >
                {rows.map((p) => {
                  const cost = Number(p.cost_price ?? p.price ?? 0);
                  const selling = Number(p.selling_price ?? 0);
                  const approved = !!p.price_approved;
                  const idx = rulesQ.data;
                  const mk = idx ? effectiveMarkup(p, idx) : null;
                  const currentMarkup = mk?.pct ?? null;

                  const editedRaw = markupEdits[p.id];
                  const editedNum = editedRaw !== undefined ? Number(editedRaw) : null;
                  const hasEdit =
                    editedRaw !== undefined && Number.isFinite(editedNum!) && editedNum! !== currentMarkup;
                  const previewSelling = hasEdit && cost > 0 ? computeSelling(cost, editedNum!) : null;

                  const isSelected = selected.has(p.id);
                  const isPending = pendingIds.has(p.id);
                  const justOk = justApprovedIds.has(p.id);
                  const ds = distStyle(p.distributor);
                  const supaImg = isSupabaseImage(p.image_url);

                  const statusBadge = approved && selling > 0
                    ? { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Approved", cls: "bg-green-100 text-green-800" }
                    : selling > 0
                    ? { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "รอ Approve", cls: "bg-amber-100 text-amber-800" }
                    : { icon: <XCircle className="h-3.5 w-3.5" />, label: "฿0", cls: "bg-red-100 text-red-700" };

                  const isListView = search.view === "list";

                  return (
                    <div
                      key={p.id}
                      className={`relative overflow-hidden rounded-lg border-2 bg-white transition ${
                        isSelected
                          ? "border-[color:var(--brand-navy)] shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      } ${isListView ? "flex" : ""}`}
                    >
                      {/* Per-card loading overlay */}
                      {isPending && (
                        <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 backdrop-blur-[1px]">
                          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--brand-navy)]" />
                        </div>
                      )}

                      {/* Image area */}
                      <div
                        className={`relative bg-slate-50 ${
                          isListView ? "aspect-square w-40 shrink-0" : "aspect-square w-full"
                        }`}
                      >
                        <div className="absolute left-2 top-2 z-10 rounded bg-white/95 p-1 shadow-sm">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(p.id)} />
                        </div>

                        <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold shadow-sm ${ds.bg} ${ds.text}`}>
                            {ds.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${statusBadge.cls}`}>
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </div>

                        {p.image_url && !supaImg && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="absolute bottom-2 left-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-amber-700 shadow-sm">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right">ภาพยังไม่ได้ import เข้า storage</TooltipContent>
                          </Tooltip>
                        )}

                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name ?? p.sku}
                            loading="lazy"
                            className={`absolute inset-0 h-full w-full object-contain p-4 ${supaImg ? "" : "opacity-90 ring-1 ring-slate-300"}`}
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-slate-300">
                            <ImageOff className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      {/* Info + pricing */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="p-3">
                          <div className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">
                            {p.name ?? p.sku}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-mono">{p.sku}</span>
                            {p.brand && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>{p.brand}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="border-t bg-slate-50 px-3 py-2">
                          <div className="text-[11px] text-slate-500">
                            ต้นทุน:{" "}
                            <span className="font-mono text-slate-700">
                              {cost > 0 ? `฿${bahtFmt.format(cost)}` : "—"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                              <span>+</span>
                              <input
                                type="number"
                                value={editedRaw ?? (currentMarkup != null ? String(currentMarkup) : "")}
                                onChange={(e) => setMarkupEdits((m) => ({ ...m, [p.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && hasEdit && cost > 0) {
                                    applyMut.mutate({ p, markup: editedNum! });
                                  }
                                }}
                                className="h-5 w-10 bg-transparent text-center outline-none"
                                step="0.5"
                                aria-label="Markup %"
                              />
                              <span>%</span>
                            </div>
                            <span className="text-slate-400">→</span>
                            {previewSelling != null ? (
                              <span className="font-bold italic text-[color:var(--brand-orange)]">
                                ฿{bahtFmt.format(previewSelling)}
                              </span>
                            ) : selling > 0 ? (
                              <span className="text-base font-bold text-[color:var(--brand-orange)]">
                                ฿{bahtFmt.format(selling)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">ยังไม่มีราคา</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t px-3 py-2">
                          {hasEdit && cost > 0 ? (
                            <Button
                              size="sm"
                              className="h-8 flex-1 bg-[color:var(--brand-orange)] text-xs font-bold hover:bg-[color:var(--brand-orange-dark)]"
                              onClick={() => applyMut.mutate({ p, markup: editedNum! })}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> กำลังบันทึก...</>
                              ) : (
                                <><Check className="mr-1 h-3.5 w-3.5" /> Apply markup</>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                disabled={isPending || cost <= 0 || currentMarkup == null || (approved && selling > 0 && !justOk)}
                                onClick={() =>
                                  currentMarkup != null && approveMut.mutate({ p, markup: currentMarkup })
                                }
                                className={`h-8 flex-1 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500 ${
                                  justOk ? "bg-green-500" : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {isPending ? (
                                  <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> กำลัง Approve...</>
                                ) : justOk ? (
                                  <><Check className="mr-1 h-3.5 w-3.5" /> Approved</>
                                ) : approved && selling > 0 ? (
                                  <>Approved</>
                                ) : (
                                  <><Check className="mr-1 h-3.5 w-3.5" /> Approve</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                disabled={isPending}
                                onClick={() => {
                                  setMarkupEdits((m) => ({
                                    ...m,
                                    [p.id]: currentMarkup != null ? String(currentMarkup) : "15",
                                  }));
                                }}
                              >
                                แก้ไข %
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                แสดง <b>{from.toLocaleString()}–{to.toLocaleString()}</b> จาก{" "}
                <b>{totalCount.toLocaleString()}</b> รายการ
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page <= 1}
                  onClick={() => goToPage(search.page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
                </Button>
                {activePageNumbers.map((n, i) =>
                  n === "…" ? (
                    <span key={`e-${i}`} className="px-2 text-slate-400">…</span>
                  ) : (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === search.page ? "default" : "outline"}
                      className={`h-9 w-9 p-0 ${n === search.page ? "bg-[color:var(--brand-navy)] text-white" : ""}`}
                      onClick={() => goToPage(n)}
                    >
                      {n}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page >= totalPages}
                  onClick={() => goToPage(search.page + 1)}
                  className="gap-1"
                >
                  ถัดไป <ChevronRight className="h-4 w-4" />
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
          <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-4 px-4 py-3">
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

            {bulkPreview && bulkPreview.avgCost > 0 && (
              <div className="hidden rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-700 md:flex md:flex-col">
                <span>
                  ต้นทุนเฉลี่ย{" "}
                  <b className="font-mono">฿{bahtFmt.format(bulkPreview.avgCost)}</b>
                </span>
                <span>
                  ราคาขายเฉลี่ย{" "}
                  <b className="font-mono text-[color:var(--brand-orange)]">
                    ฿{bahtFmt.format(bulkPreview.avgSelling)}
                  </b>
                  {bulkPreview.missing > 0 && (
                    <span className="ml-2 text-amber-700">
                      ({bulkPreview.missing} ไม่มีต้นทุน)
                    </span>
                  )}
                </span>
              </div>
            )}

            {bulkProgress && (
              <div className="text-xs text-slate-600">
                กำลัง Approve... ({bulkProgress.done}/{bulkProgress.total})
              </div>
            )}

            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="gap-1">
                <X className="h-4 w-4" /> ล้าง
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`รีเซ็ตราคาขายและสถานะ approve ของ ${selected.size} รายการ?`)) {
                    resetBulkMut.mutate([...selected]);
                  }
                }}
                disabled={resetBulkMut.isPending}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset ราคา
              </Button>
              <Button
                onClick={openConfirmBulk}
                disabled={bulkApproveMut.isPending}
                className="gap-1 bg-green-600 font-bold text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                {bulkApproveMut.isPending ? "กำลังคำนวณ..." : `คำนวณ + Approve ทั้งหมด (${selected.size})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ยืนยันการ Approve ราคา</DialogTitle>
            <DialogDescription>
              ตรวจสอบข้อมูลก่อนยืนยัน — การดำเนินการนี้จะ override markup ของสินค้าที่เลือกทั้งหมด
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">รายการที่เลือก</span>
              <b>{selected.size} สินค้า</b>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Markup ที่ใช้</span>
              <b>+{getMarkup() ?? 0}%</b>
            </div>

            {confirmPreviewRows.length > 0 && (
              <div className="rounded-md border">
                <div className="border-b bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  ตัวอย่างการคำนวณ
                </div>
                <div className="divide-y">
                  {confirmPreviewRows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                      <span className="line-clamp-1 flex-1 text-slate-700">{r.name}</span>
                      <span className="font-mono text-slate-500">฿{bahtFmt.format(r.cost)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono font-bold text-[color:var(--brand-orange)]">
                        ฿{bahtFmt.format(r.selling)}
                      </span>
                    </div>
                  ))}
                  {selected.size > confirmPreviewRows.length && (
                    <div className="px-3 py-1.5 text-xs text-slate-500">
                      … และอีก {selected.size - confirmPreviewRows.length} รายการ
                    </div>
                  )}
                </div>
              </div>
            )}

            {bulkPreview && bulkPreview.avgCost > 0 && (
              <div className="rounded-md bg-slate-50 p-3 text-xs">
                <div>
                  ราคาขายเฉลี่ย{" "}
                  <b className="font-mono text-[color:var(--brand-orange)]">
                    ฿{bahtFmt.format(bulkPreview.avgSelling)}
                  </b>
                </div>
                <div className="text-slate-500">
                  (จากต้นทุนเฉลี่ย ฿{bahtFmt.format(bulkPreview.avgCost)})
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>การดำเนินการนี้จะ override markup ของสินค้าที่เลือกทั้งหมด</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={runBulk}
              disabled={!confirmReady || bulkApproveMut.isPending}
              className="bg-green-600 font-bold text-white hover:bg-green-700"
            >
              <Check className="mr-1 h-4 w-4" />
              {confirmReady ? "ยืนยัน Approve" : "รอ 2 วินาที..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
