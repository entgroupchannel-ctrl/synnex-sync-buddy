import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductImage } from "@/components/product-image";
import { getSellingPrice, useCustomerTier, priceFmt } from "@/lib/cart";

type Row = {
  id: string; sku: string; slug: string | null; name: string | null;
  image_url: string | null; brand: string | null; category: string | null;
  price: number | null; selling_price: number | null;
  stock_status: string | null; stock_qty: number | null; distributor: string | null;
};

const TABS = [
  { key: "iPhone",     label: "iPhone",     pattern: "%iPhone%" },
  { key: "MacBook",    label: "MacBook",    pattern: "%MacBook%" },
  { key: "iPad",       label: "iPad",       pattern: "%iPad%" },
  { key: "Mac",        label: "Mac",        pattern: "%iMac%,%Mac Mini%,%Mac Studio%" },
  { key: "Accessories",label: "Accessories",pattern: "%AirPods%,%Watch%,%HomePod%,%Magic %,%Apple Pencil%" },
] as const;

export function AppleFeatured() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("iPhone");
  const tier = useCustomerTier();
  const active = TABS.find((t) => t.key === tab)!;

  const q = useQuery({
    queryKey: ["apple-featured", tab],
    queryFn: async () => {
      const filters = active.pattern.split(",").map((p) => `name.ilike.${p}`).join(",");
      const { data } = await supabase
        .from("synnex_products")
        .select("*")
        .or(`brand.ilike.%Apple%,name.ilike.%Apple%`)
        .or(filters)
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: false })
        .limit(8);
      return (data ?? []) as Row[];
    },
    staleTime: 5 * 60_000,
  });

  const products = q.data ?? [];
  if (!q.isLoading && products.length === 0) return null;

  return (
    <section
      className="border-b"
      style={{
        background: "linear-gradient(135deg, #f5f5f7, #ffffff)",
        borderTop: "3px solid #1d1d1f",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] sm:text-3xl">
              🍎 Apple Products / ผลิตภัณฑ์ Apple
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              iPhone 17, MacBook Air M5, iPad Pro · <span className="font-medium">Authorized Reseller</span> — รับประกัน Apple Thailand
            </p>
          </div>
          <Link
            to="/"
            search={{ brands: "APPLE" } as never}
            className="text-sm font-semibold text-[#1d4ed8] hover:underline"
          >
            ดู Apple ทั้งหมด →
          </Link>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-white text-[#1d1d1f] ring-1 ring-slate-200 hover:ring-[#1d1d1f]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-white/70" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl bg-white/70 p-8 text-center text-sm text-slate-500">
            ยังไม่มีสินค้า {active.label} ในสต๊อก
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {products.map((p) => {
              const slug = p.slug || p.id;
              const price = getSellingPrice(p, tier);
              const orig = p.price ?? null;
              return (
                <Link
                  key={p.id}
                  to="/product/$slug"
                  params={{ slug }}
                  className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                >
                  <div className="absolute right-2 top-2 rounded-full bg-[#1d1d1f] px-2 py-0.5 text-[10px] font-semibold text-white">
                    🍎 Apple Authorized
                  </div>
                  <div className="mb-3 grid aspect-square place-items-center">
                    <ProductImage
                      src={p.image_url}
                      alt={p.name ?? p.sku}
                      className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                    />
                  </div>
                  <div className="line-clamp-2 min-h-10 text-sm font-semibold text-[#1d1d1f]">
                    {p.name ?? p.sku}
                  </div>
                  <div className="mt-2 text-lg font-bold text-[#1d4ed8]" style={{ letterSpacing: "-0.01em" }}>
                    {price != null ? priceFmt.format(price) : "—"}
                  </div>
                  {orig != null && price != null && orig > price && (
                    <div className="text-xs text-slate-400 line-through">{priceFmt.format(orig)}</div>
                  )}
                  <div className="mt-1 text-[11px] text-slate-500">ประกัน 1 ปี Apple Thailand</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
