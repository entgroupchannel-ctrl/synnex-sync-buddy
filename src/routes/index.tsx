import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ShoppingCart, Search, Package, Grid2x2, List, SlidersHorizontal, Flame, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";
import { SiteFooter } from "@/components/site-footer";

import { CATEGORIES, detectCategory, displayPrice, getSellingPrice, useCart, useCustomerTier } from "@/lib/cart";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import {
  HeroCarousel,
  QuickCategoryGrid,
  TodaysBestDeals,
  PopularNotebooks,
  ShopByBrand,
  TrustBadges,
  RecentlyViewed,
  NewsletterSignup,
} from "@/components/home-sections";
import { FrequentlyBought } from "@/components/frequently-bought";
import { BrandLogo } from "@/components/brand-logo";
import entLogo from "@/assets/entgroup-logo.jpg.asset.json";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "all").default("all"),
  brands: fallback(z.string(), "").default(""),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 100000).default(100000),
  ready: fallback(z.boolean(), false).default(false),
  fulfill: fallback(z.enum(["all", "stock", "by_order"]), "all").default("all"),
  sort: fallback(z.string(), "new").default("new"),
  view: fallback(z.string(), "grid").default("grid"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "ENT Group IT Shop — ราคา Dealer จริง" },
      { name: "description", content: "ร้านค้าออนไลน์ ENT Group จำหน่ายสินค้าไอทีจาก Synnex และ VST ECS ราคา Dealer จริง" },
      { property: "og:title", content: "ENT Group IT Shop — ราคา Dealer จริง" },
      { property: "og:description", content: "ร้านค้าออนไลน์ ENT Group จำหน่ายสินค้าไอทีจาก Synnex และ VST ECS ราคา Dealer จริง" },
    ],
  }),
  component: HomePage,
});

const PAGE_SIZE = 24;
const PRICE_MAX = 100000;

type ProductRow = {
  id: string;
  sku: string;
  slug: string | null;
  name: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  selling_price: number | null;
  member_price: number | null;
  b2b_price: number | null;
  price_approved: boolean | null;
  stock_status: string | null;
  stock_qty: number | null;
  distributor: string | null;
  fulfillment_type: string | null;
};

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(); end.setHours(24, 0, 0, 0);
  const ms = Math.max(0, end.getTime() - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { add } = useCart();
 const { user } = useSupabaseUser();
 const tier = useCustomerTier();
  const [searchInput, setSearchInput] = useState(search.q);
  const countdown = useCountdown();
  const { t } = useLanguage();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search.q) {
        navigate({ to: "/", search: (p: Record<string, unknown>) => ({ ...p, q: searchInput, page: 1 }) });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => { setSearchInput(search.q); }, [search.q]);

  const selectedBrands = useMemo(
    () => search.brands ? search.brands.split(",").filter(Boolean) : [],
    [search.brands]
  );

  const update = (patch: Record<string, unknown>) =>
    navigate({ to: "/", search: (p: Record<string, unknown>) => ({ ...p, ...patch, page: 1 }) });

  // Fetch brand list (top 20)
  const brandsQ = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products").select("brand").not("brand", "is", null).limit(500);
      const map = new Map<string, number>();
      for (const r of data ?? []) {
        const b = (r as { brand: string | null }).brand;
        if (!b) continue;
        map.set(b, (map.get(b) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([b, n]) => ({ brand: b, count: n }));
    },
    staleTime: 5 * 60_000,
  });

  const flashQ = useQuery({
    queryKey: ["flash-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("synnex_products")
        .select("*")
        .eq("stock_status", "พร้อมจัดส่ง")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .not("image_url", "is", null)
        .not("price", "is", null)
        .order("price", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ["catalog", search],
    queryFn: async () => {
      const from = (search.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const s = search.q.trim().replace(/[%,]/g, "");
      type AnyQ = { eq: (...a: unknown[]) => AnyQ; neq: (...a: unknown[]) => AnyQ; gt: (...a: unknown[]) => AnyQ; gte: (...a: unknown[]) => AnyQ; lte: (...a: unknown[]) => AnyQ; in: (...a: unknown[]) => AnyQ; or: (...a: unknown[]) => AnyQ; order: (...a: unknown[]) => AnyQ; range: (...a: unknown[]) => AnyQ };
      const applyCommon = (qi: unknown): AnyQ => {
        let q = qi as AnyQ;
        q = q.eq("price_approved", true).gt("selling_price", 0);
        if (s) q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%`);
        if (search.category !== "all") q = q.eq("category", search.category);
        if (selectedBrands.length > 0) q = q.in("brand", selectedBrands);
        if (search.min > 0) q = q.gte("price", search.min);
        if (search.max < PRICE_MAX) q = q.lte("price", search.max);
        if (search.sort === "price-asc") q = q.order("price", { ascending: true, nullsFirst: false });
        else if (search.sort === "price-desc") q = q.order("price", { ascending: false, nullsFirst: false });
        else if (search.sort === "popular") q = q.order("name", { ascending: true });
        else q = q.order("synced_at", { ascending: false });
        return q;
      };
      type Result = { data: Record<string, unknown>[] | null; error: unknown; count: number | null };
      const table = () => supabase.from("synnex_products");

      // Explicit fulfillment filter
      if (search.fulfill === "stock") {
        const q = applyCommon(table().select("*", { count: "exact" })).eq("stock_status", "พร้อมจัดส่ง").range(from, to);
        const { data, error, count } = await (q as unknown as Promise<Result>);
        if (error) throw error;
        return { rows: (data ?? []) as ProductRow[], count: count ?? 0 };
      }
      if (search.fulfill === "by_order") {
        const q = applyCommon(table().select("*", { count: "exact" })).eq("fulfillment_type", "by_order").range(from, to);
        const { data, error, count } = await (q as unknown as Promise<Result>);
        if (error) throw error;
        return { rows: (data ?? []) as ProductRow[], count: count ?? 0 };
      }

      // ready toggle keeps its stricter meaning: only in-stock stock items
      if (search.ready) {
        const q = applyCommon(table().select("*", { count: "exact" })).eq("stock_status", "พร้อมจัดส่ง").eq("fulfillment_type", "stock").range(from, to);
        const { data, error, count } = await (q as unknown as Promise<Result>);
        if (error) throw error;
        return { rows: (data ?? []) as ProductRow[], count: count ?? 0 };
      }

      // Default: three tiers — in-stock → by_order → out-of-stock
      const inCountRes = await (applyCommon(table().select("*", { count: "exact", head: true })).eq("stock_status", "พร้อมจัดส่ง") as unknown as Promise<Result>);
      const byoCountRes = await (applyCommon(table().select("*", { count: "exact", head: true })).eq("fulfillment_type", "by_order") as unknown as Promise<Result>);
      const outCountRes = await (applyCommon(table().select("*", { count: "exact", head: true })).eq("stock_status", "สินค้าหมด") as unknown as Promise<Result>);
      const inCount = inCountRes.count ?? 0;
      const byoCount = byoCountRes.count ?? 0;
      const outCount = outCountRes.count ?? 0;
      const rows: Record<string, unknown>[] = [];

      // Tier 1: in-stock
      if (from < inCount) {
        const t1To = Math.min(to, inCount - 1);
        const r = await (applyCommon(table().select("*")).eq("stock_status", "พร้อมจัดส่ง").range(from, t1To) as unknown as Promise<Result>);
        if (r.error) throw r.error;
        rows.push(...(r.data ?? []));
      }
      // Tier 2: by_order
      if (to >= inCount && byoCount > 0) {
        const t2From = Math.max(0, from - inCount);
        const t2To = Math.min(to - inCount, byoCount - 1);
        if (t2From <= t2To) {
          const r = await (applyCommon(table().select("*")).eq("fulfillment_type", "by_order").range(t2From, t2To) as unknown as Promise<Result>);
          if (r.error) throw r.error;
          rows.push(...(r.data ?? []));
        }
      }
      // Tier 3: out-of-stock (stock items only; by_order already covered above)
      if (to >= inCount + byoCount && outCount > 0) {
        const t3From = Math.max(0, from - inCount - byoCount);
        const t3To = to - inCount - byoCount;
        const r = await (applyCommon(table().select("*")).eq("stock_status", "สินค้าหมด").eq("fulfillment_type", "stock").range(t3From, t3To) as unknown as Promise<Result>);
        if (r.error) throw r.error;
        rows.push(...(r.data ?? []));
      }
      return { rows: rows as unknown as ProductRow[], count: inCount + byoCount + outCount };
    },
  });

  const totalPages = Math.max(1, Math.ceil((productsQuery.data?.count ?? 0) / PAGE_SIZE));

  const toggleBrand = (b: string) => {
    const set = new Set(selectedBrands);
    if (set.has(b)) set.delete(b); else set.add(b);
    update({ brands: [...set].join(",") });
  };

  const addToCart = (p: Record<string, unknown>) => {
    const name = (p.name as string) ?? (p.sku as string);
    add({
      id: p.id as string,
      sku: p.sku as string,
      slug: p.slug as string | null,
      name,
      price: getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) ?? 0,
      image_url: (p.image_url as string) ?? null,
      distributor: (p.distributor as string | null) ?? null,
    });
    if (!user) {
      triggerAuthPrompt({ name, sku: p.sku as string, image_url: (p.image_url as string) ?? null });
    } else {
      toast.success(`เพิ่ม ${p.sku} ลงตะกร้าแล้ว`);
    }
  };

  const notifyMe = (sku: string) => {
    try {
      const key = "ent_notify_list";
      const arr = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      if (!arr.includes(sku)) arr.push(sku);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch { /* noop */ }
    toast.success(`จะแจ้งเตือนคุณเมื่อ ${sku} กลับมาพร้อมจำหน่าย`);
  };

  const Filters = (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">หมวดหมู่</div>
        <div className="space-y-0.5">
          <button
            onClick={() => update({ category: "all" })}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${search.category === "all" ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"}`}
          >
            ทั้งหมด <ChevronRight className="h-3 w-3 opacity-50" />
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => update({ category: c })}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${search.category === c ? "bg-[color:var(--brand-navy)] text-white" : "hover:bg-slate-100"}`}
            >
              {c} <ChevronRight className="h-3 w-3 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">แบรนด์</div>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {(brandsQ.data ?? []).map(({ brand, count }) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <span className="flex-1 truncate">{brand}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">ช่วงราคา</div>
        <Slider
          min={0}
          max={PRICE_MAX}
          step={1000}
          value={[search.min, search.max]}
          onValueChange={(v) => update({ min: v[0], max: v[1] })}
        />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>฿{search.min.toLocaleString()}</span>
          <span>฿{search.max.toLocaleString()}</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={search.ready} onCheckedChange={(v) => update({ ready: v })} />
        พร้อมจัดส่งเท่านั้น
      </label>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate({ to: "/", search: {} as never })}
      >
        ล้างตัวกรอง
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      {/* Hero Carousel */}
      <HeroCarousel
        onBrowse={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
        onReady={() => update({ ready: true })}
      />

      {/* Quick category icons */}
      <QuickCategoryGrid />


      {/* Flash Deals */}
      {(flashQ.data?.length ?? 0) > 0 && (
        <section className="border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="mx-auto max-w-7xl px-4 py-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--brand-orange)] px-2.5 py-1 text-xs font-bold text-white">
                <Flame className="h-3.5 w-3.5" /> ดีลพิเศษ
              </div>
              <div className="font-mono text-sm font-bold text-[color:var(--brand-orange-dark)]">{countdown}</div>
              <div className="ml-auto text-xs text-slate-500">รีเซ็ตทุก 24 ชม.</div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {flashQ.data!.map((p) => {
                const selling = getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) ?? 0;
                const orig = (p as { price?: number | null }).price ?? 0;
                const pct = orig > 0 && selling > 0 && selling < orig ? Math.round((1 - selling / orig) * 100) : 0;
                const lowStock = p.stock_status === "พร้อมจัดส่ง" && (p.stock_qty ?? 999) < 10;
                return (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug || p.id }}
                    className="group relative w-40 shrink-0 overflow-hidden rounded-lg border-2 border-orange-200 bg-white transition hover:border-[color:var(--brand-orange)] hover:shadow-md md:w-44"
                  >
                    {pct > 0 && (
                      <div className="absolute left-1.5 top-1.5 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow">-{pct}%</div>
                    )}
                    {lowStock && (
                      <div className="absolute right-1.5 top-1.5 z-10 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        เหลือ {p.stock_qty} ชิ้น
                      </div>
                    )}
                    <div className="grid aspect-square place-items-center bg-white p-2">
                      <ProductImage src={p.image_url} alt={p.name ?? p.sku} />

                    </div>
                    <div className="border-t p-2">
                      <div className="line-clamp-2 min-h-9 text-xs font-medium">{p.name ?? p.sku}</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <div className="text-base font-black text-[color:var(--brand-orange)]">
                          {displayPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier)}
                        </div>
                        {pct > 0 && <div className="text-[10px] text-slate-400 line-through">฿{orig.toLocaleString()}</div>}
                      </div>
                      <div className="mt-1 font-mono text-[10px] font-bold text-red-600">⏱ {countdown}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Today's Best Deals */}
      <FrequentlyBought />
      <TodaysBestDeals />

      {/* Popular Notebooks */}
      <PopularNotebooks />

      {/* Shop by Brand */}
      <ShopByBrand />

      {/* Catalog */}
      <div id="product-grid" className="mx-auto flex max-w-7xl gap-6 px-4 py-6 scroll-mt-20">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-32 rounded-lg border bg-white p-4">{Filters}</div>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" /> ตัวกรอง
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                <div className="mt-6">{Filters}</div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 min-w-[200px] lg:hidden">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="ค้นหา..." className="h-9 pl-9" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <select
                value={search.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-md border bg-white px-3 py-1.5 text-sm outline-none"
              >
                <option value="new">ล่าสุด</option>
                <option value="price-asc">ราคาต่ำ-สูง</option>
                <option value="price-desc">ราคาสูง-ต่ำ</option>
                <option value="popular">ยอดนิยม</option>
              </select>
              <div className="hidden overflow-hidden rounded-md border sm:flex">
                <button onClick={() => update({ view: "grid" })} className={`grid h-9 w-9 place-items-center ${search.view === "grid" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button onClick={() => update({ view: "list" })} className={`grid h-9 w-9 place-items-center ${search.view === "list" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {productsQuery.isLoading ? (
            <div className={search.view === "list" ? "space-y-3" : "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={search.view === "list" ? "h-32 animate-pulse rounded-lg bg-slate-200" : "h-80 animate-pulse rounded-lg bg-slate-200"} />
              ))}
            </div>
          ) : (productsQuery.data?.rows.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-12 text-center text-slate-500">
              ไม่พบสินค้าที่ตรงเงื่อนไข
            </div>
          ) : search.view === "list" ? (
            <div className="space-y-3">
              {productsQuery.data!.rows.map((p) => {
                const ready = p.stock_status === "พร้อมจัดส่ง";
                const slug = p.slug || p.id;
                const lowStock = ready && (p.stock_qty ?? 999) < 10;
                const priced = getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) != null && !!p.price_approved;
                return (
                  <div key={p.id} className="flex gap-4 rounded-lg border bg-white p-3 transition hover:shadow-md">
                    <Link to="/product/$slug" params={{ slug }} className="grid h-28 w-28 shrink-0 place-items-center rounded-md bg-white">
                      <ProductImage src={p.image_url} alt={p.name ?? p.sku} />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">{p.brand ?? (p.category || detectCategory(p.name))} · {p.sku}</div>
                      <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 text-sm font-semibold hover:text-[color:var(--brand-navy)]">{p.name ?? p.sku}</Link>
                      {p.description && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</div>}
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        <span className={`inline-block h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-xs text-slate-600">{p.stock_status ?? "—"}</span>
                        {lowStock && <Badge className="bg-red-100 text-[10px] text-red-700 hover:bg-red-100">เหลือน้อย</Badge>}
                      </div>
                    </div>
                    <div className="flex w-40 shrink-0 flex-col items-end justify-between">
                      {priced ? (
                        <div className="text-xl font-black text-[color:var(--brand-orange)]">
                          {displayPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">ติดต่อสอบถาม</span>
                      )}
                      {priced ? (
                        ready ? (
                          <Button onClick={() => addToCart(p as Record<string, unknown>)} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]" size="sm">
                            <ShoppingCart className="mr-1.5 h-4 w-4" /> ใส่ตะกร้า
                          </Button>
                        ) : (
                          <div className="flex w-full flex-col items-end gap-1">
                            <Button disabled className="w-full cursor-not-allowed bg-slate-300 text-slate-600 hover:bg-slate-300" size="sm">
                              <ShoppingCart className="mr-1.5 h-4 w-4" /> สินค้าหมด
                            </Button>
                            <button onClick={() => notifyMe(p.sku)} className="text-[11px] text-[color:var(--brand-navy)] underline underline-offset-2 hover:text-[color:var(--brand-orange)]">
                              🔔 แจ้งเตือนเมื่อมีสินค้า
                            </button>
                          </div>
                        )
                      ) : (
                        <Button asChild className="w-full bg-[color:var(--brand-green)] hover:opacity-90" size="sm">
                          <a href="tel:020456104">📞 สอบถามราคา</a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {productsQuery.data!.rows.map((p) => {
                const ready = p.stock_status === "พร้อมจัดส่ง";
                const slug = p.slug || p.id;
                const lowStock = ready && (p.stock_qty ?? 999) < 10;
                const priced = getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) != null && !!p.price_approved;
                return (
                  <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
                    <BrandLogo brand={p.brand} />
                    {!ready ? (
                      <div className="absolute right-2 top-2 z-10 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        สินค้าหมด
                      </div>
                    ) : lowStock && (
                      <div className="absolute right-2 top-2 z-10 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        เหลือน้อย
                      </div>
                    )}
                    <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
                      <ProductImage
                        src={p.image_url}
                        alt={p.name ?? p.sku}
                        className="h-full w-full object-contain transition group-hover:scale-105"
                        iconClassName="h-16 w-16 text-slate-300"
                      />

                    </Link>
                    <div className="flex flex-1 flex-col gap-1 border-t p-3">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.sku}</div>
                      <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-[color:var(--brand-navy)]">
                        {p.name ?? p.sku}
                      </Link>
                      <div className="mt-auto pt-1">
                        {priced ? (
                          <div className="text-xl font-black text-[color:var(--brand-orange)]">
                            {displayPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">ติดต่อสอบถาม</div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-[11px] text-slate-600">{p.stock_status ?? "—"}</span>
                        </div>
                      </div>
                      {priced ? (
                        ready ? (
                          <Button
                            onClick={() => addToCart(p as Record<string, unknown>)}
                            className="mt-2 w-full bg-[color:var(--brand-navy)] font-semibold hover:bg-[color:var(--brand-navy-2)]"
                            size="sm"
                          >
                            <ShoppingCart className="mr-1.5 h-4 w-4" /> ใส่ตะกร้า
                          </Button>
                        ) : (
                          <>
                            <Button disabled className="mt-2 w-full cursor-not-allowed bg-slate-300 font-semibold text-slate-600 hover:bg-slate-300" size="sm">
                              <ShoppingCart className="mr-1.5 h-4 w-4" /> สินค้าหมด
                            </Button>
                            <button onClick={() => notifyMe(p.sku)} className="mt-1 text-center text-[11px] text-[color:var(--brand-navy)] underline underline-offset-2 hover:text-[color:var(--brand-orange)]">
                              🔔 แจ้งเตือนเมื่อมีสินค้า
                            </button>
                          </>
                        )
                      ) : (
                        <Button asChild className="mt-2 w-full bg-[color:var(--brand-green)] font-semibold hover:opacity-90" size="sm">
                          <a href="tel:020456104">📞 สอบถามราคา</a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(productsQuery.data?.count ?? 0) > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {productsQuery.data!.count.toLocaleString()} รายการ · หน้า {search.page}/{totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => update({ page: search.page - 1 })}>ก่อนหน้า</Button>
                <Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => update({ page: search.page + 1 })}>ถัดไป</Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Trust badges */}
      <TrustBadges />

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Newsletter */}
      <NewsletterSignup />

      <SiteFooter />
    </div>
  );
}
