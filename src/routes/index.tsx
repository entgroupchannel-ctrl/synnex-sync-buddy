import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingCart, Search, Package } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Synnex Catalog — สินค้า ASUS จาก Synnex Thailand" },
      {
        name: "description",
        content:
          "เรียกดูแคตตาล็อกสินค้า ASUS จาก Synnex Thailand — ราคา สต็อก และสถานะพร้อมจัดส่ง",
      },
      { property: "og:title", content: "Synnex Catalog — สินค้า ASUS" },
      {
        property: "og:description",
        content: "แคตตาล็อกสินค้า ASUS จาก Synnex Thailand พร้อมราคาและสต็อก",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const PAGE_SIZE = 24;
const priceFmt = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [page, setPage] = useState(1);

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("synnex_products")
        .select("brand")
        .not("brand", "is", null)
        .limit(1000);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of data ?? []) if (row.brand) set.add(row.brand);
      return Array.from(set).sort();
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products", { search, brand, page }],
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
      if (brand !== "all") q = q.eq("brand", brand);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((productsQuery.data?.count ?? 0) / PAGE_SIZE)),
    [productsQuery.data?.count],
  );

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "Sarabun, system-ui, sans-serif" }}
    >
      <header className="border-b bg-[#1a237e] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-2xl font-bold">Synnex Catalog</h1>
            <p className="text-sm text-white/80">แคตตาล็อกสินค้าจาก Synnex Thailand</p>
          </div>
          <Link
            to="/admin/sync"
            className="text-sm text-white/80 underline-offset-4 hover:underline"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="ค้นหาสินค้าด้วยชื่อหรือ SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={brand}
            onValueChange={(v) => {
              setBrand(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="ทุกยี่ห้อ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกยี่ห้อ</SelectItem>
              {(brandsQuery.data ?? []).map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : productsQuery.data && productsQuery.data.rows.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsQuery.data.rows.map((p) => {
                const ready = p.stock_status === "พร้อมจัดส่ง";
                return (
                  <div
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex aspect-square items-center justify-center bg-slate-50">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name ?? p.sku}
                          className="h-full w-full object-contain p-4"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="text-xs text-slate-500">{p.brand ?? "—"} · {p.sku}</div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {p.name ?? p.sku}
                      </h3>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="text-lg font-bold text-[#1565c0]">
                          {p.price != null ? priceFmt.format(Number(p.price)) : "—"}
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            ready
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {p.stock_status ?? "—"}
                        </Badge>
                      </div>
                      <Button
                        disabled={!ready}
                        onClick={() => toast.success(`เพิ่ม ${p.sku} ลงตะกร้าแล้ว`)}
                        className="mt-2 w-full bg-[#1565c0] hover:bg-[#0d47a1]"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
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
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
            ไม่พบสินค้า — ลองซิงก์จากหน้า Admin ก่อน
          </div>
        )}
      </main>
    </div>
  );
}
