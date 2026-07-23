import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShoppingCart, Search, Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, detectCategory, priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Synnex Store — แคตตาล็อกสินค้าไอที" },
      { name: "description", content: "เลือกซื้อสินค้าไอที Notebook, Monitor, Printer และอื่นๆ พร้อมจัดส่ง" },
      { property: "og:title", content: "Synnex Store — แคตตาล็อกสินค้าไอที" },
      { property: "og:description", content: "แคตตาล็อกสินค้าไอทีครบวงจร ราคาดี พร้อมจัดส่ง" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const PAGE_SIZE = 24;

function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [readyOnly, setReadyOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [page, setPage] = useState(1);
  const { add } = useCart();

  const productsQuery = useQuery({
    queryKey: ["catalog", { search, category, readyOnly, priceRange, page }],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("synnex_products")
        .select("*", { count: "exact" })
        .order("synced_at", { ascending: false })
        .range(from, to);
      const s = search.trim().replace(/[%,]/g, "");
      if (s) q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%`);
      if (category !== "all") q = q.eq("category", category);
      if (readyOnly) q = q.eq("stock_status", "พร้อมจัดส่ง");
      if (priceRange[0] > 0) q = q.gte("price", priceRange[0]);
      if (priceRange[1] < 200000) q = q.lte("price", priceRange[1]);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((productsQuery.data?.count ?? 0) / PAGE_SIZE)),
    [productsQuery.data?.count],
  );

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "Sarabun, system-ui, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:flex-row flex-col">
        {/* Sidebar categories */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">หมวดหมู่</div>
            <button
              onClick={() => { setCategory("all"); resetPage(); }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${category === "all" ? "bg-[#1a237e] text-white" : "hover:bg-slate-100"}`}
            >
              ทั้งหมด
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); resetPage(); }}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm ${category === c ? "bg-[#1a237e] text-white" : "hover:bg-slate-100"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Filters */}
          <div className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="whitespace-nowrap text-slate-600">ราคา</span>
              <div className="w-40">
                <Slider
                  min={0}
                  max={200000}
                  step={1000}
                  value={priceRange}
                  onValueChange={(v) => { setPriceRange([v[0], v[1]] as [number, number]); resetPage(); }}
                />
              </div>
              <span className="whitespace-nowrap text-xs text-slate-500">
                ฿{priceRange[0].toLocaleString()}–฿{priceRange[1].toLocaleString()}
              </span>
            </div>
            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Switch checked={readyOnly} onCheckedChange={(v) => { setReadyOnly(v); resetPage(); }} />
              <span>เฉพาะพร้อมจัดส่ง</span>
            </label>
          </div>

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : productsQuery.data && productsQuery.data.rows.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {productsQuery.data.rows.map((p) => {
                  const ready = p.stock_status === "พร้อมจัดส่ง";
                  const slug = p.slug || p.id;
                  return (
                    <div key={p.id} className="group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
                      <Link
                        to="/product/$slug"
                        params={{ slug }}
                        className="flex aspect-square items-center justify-center bg-white p-2"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name ?? p.sku}
                            className="h-full w-full object-contain transition group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-16 w-16 text-slate-300" />
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col gap-1.5 border-t p-3">
                        <div className="text-[11px] text-slate-500">
                          {(p.category || detectCategory(p.name))} · {p.sku}
                        </div>
                        <Link
                          to="/product/$slug"
                          params={{ slug }}
                          className="line-clamp-2 min-h-10 text-sm font-medium text-slate-900 hover:text-[#1a237e]"
                        >
                          {p.name ?? p.sku}
                        </Link>
                        <div className="mt-auto flex items-center justify-between pt-1">
                          <div className="text-lg font-bold text-[#1a237e]">
                            {p.price != null ? priceFmt.format(Number(p.price)) : "—"}
                          </div>
                          <Badge className={ready ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                            {p.stock_status ?? "—"}
                          </Badge>
                        </div>
                        <Button
                          disabled={!ready}
                          onClick={() => {
                            add({
                              id: p.id,
                              sku: p.sku,
                              slug: p.slug,
                              name: p.name ?? p.sku,
                              price: Number(p.price ?? 0),
                              image_url: p.image_url,
                            });
                            toast.success(`เพิ่ม ${p.sku} ลงตะกร้าแล้ว`);
                          }}
                          className="mt-1 w-full bg-[#1565c0] hover:bg-[#0d47a1]"
                          size="sm"
                        >
                          <ShoppingCart className="mr-1.5 h-4 w-4" />
                          ใส่ตะกร้า
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {productsQuery.data.count.toLocaleString()} รายการ · หน้า {page}/{totalPages}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ก่อนหน้า
                  </Button>
                  <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    ถัดไป
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed bg-white p-12 text-center text-slate-500">
              ไม่พบสินค้าที่ตรงเงื่อนไข
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
