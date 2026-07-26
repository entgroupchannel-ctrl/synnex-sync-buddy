import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_PUBLIC_COLUMNS } from "@/lib/product-columns";
import { ProductImage } from "@/components/product-image";
import { getSellingPrice, useCustomerTier, priceFmt } from "@/lib/cart";

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

type Row = {
  id: string; sku: string; slug: string | null; name: string | null;
  image_url: string | null; brand: string | null; category: string | null;
  price: number | null; selling_price: number | null;
  stock_status: string | null; stock_qty: number | null; distributor: string | null;
};

const TABS = [
  { key: "all",         label: "ทั้งหมด",     pattern: null },
  { key: "iPhone",      label: "iPhone",      pattern: "%iPhone%" },
  { key: "MacBook",     label: "MacBook",     pattern: "%MacBook%" },
  { key: "iPad",        label: "iPad",        pattern: "%iPad%" },
  { key: "Mac",         label: "Mac",         pattern: "%iMac%,%Mac Mini%,%Mac Studio%" },
  { key: "Accessories", label: "Accessories", pattern: "%AirPods%,%Watch%,%HomePod%,%Magic %,%Apple Pencil%" },
] as const;

export function AppleFeatured() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const tier = useCustomerTier();
  const active = TABS.find((t) => t.key === tab)!;

  const q = useQuery({
    queryKey: ["apple-featured", tab],
    queryFn: async () => {
      if (active.pattern === null) {
        // แท็บ "ทั้งหมด" — ดึงมาเยอะกว่าเดิม แล้วสุ่มกระจายทุกประเภทสินค้า Apple แทนเรียงราคาแพงสุดก่อน
        const { data } = await supabase
          .from("synnex_products")
          .select(PRODUCT_PUBLIC_COLUMNS)
          .or(`brand.ilike.%Apple%,name.ilike.%Apple%`)
          .eq("price_approved", true)
          .gt("selling_price", 0)
          .limit(60);

        const rows = (data ?? []) as Row[];
        const buckets: Record<string, Row[]> = { iphone: [], macbook: [], ipad: [], mac: [], other: [] };
        for (const p of rows) {
          const n = (p.name ?? "").toLowerCase();
          if (/iphone/.test(n)) buckets.iphone.push(p);
          else if (/macbook/.test(n)) buckets.macbook.push(p);
          else if (/ipad/.test(n)) buckets.ipad.push(p);
          else if (/\bimac\b|mac mini|mac studio/.test(n)) buckets.mac.push(p);
          else buckets.other.push(p);
        }
        Object.values(buckets).forEach((arr) => arr.sort(() => Math.random() - 0.5));

        const picked: Row[] = [];
        const keys = Object.keys(buckets);
        let i = 0;
        while (picked.length < 10 && keys.some((k) => buckets[k].length > 0)) {
          const k = keys[i % keys.length];
          const item = buckets[k].shift();
          if (item) picked.push(item);
          i++;
        }
        return picked.sort(() => Math.random() - 0.5);
      }

      // แท็บเฉพาะเจาะจง (iPhone/MacBook/iPad/Mac/Accessories) — กรองตรงตามเดิม ไม่ต้องสุ่ม
      const filters = active.pattern.split(",").map((p) => `name.ilike.${p}`).join(",");
      const { data } = await supabase
        .from("synnex_products")
        .select(PRODUCT_PUBLIC_COLUMNS)
        .or(`brand.ilike.%Apple%,name.ilike.%Apple%`)
        .or(filters)
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: false })
        .limit(10);
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
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#1d1d1f] sm:text-3xl">
              <AppleLogo className="h-6 w-6 sm:h-7 sm:w-7" />
              <span>Apple Products / ผลิตภัณฑ์ Apple</span>
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              iPhone 17, MacBook Air M5, iPad Pro · <span className="font-medium">สินค้าของแท้ 100%</span> — รับประกันศูนย์ไทย 1 ปี
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
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-5 lg:gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-white/70" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl bg-white/70 p-8 text-center text-sm text-slate-500">
            ยังไม่มีสินค้า {active.label} ในสต๊อก
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-5 lg:gap-3">
            {products.map((p) => {
              const slug = p.slug || p.id;
              const price = getSellingPrice(p, tier);
              const orig = p.price ?? null;
              return (
                <Link
                  key={p.id}
                  to="/product/$slug"
                  params={{ slug }}
                  className="group relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                >
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#1d1d1f] px-2 py-0.5 text-[10px] font-semibold text-white">
                    <AppleLogo className="h-2.5 w-2.5" /> ของแท้ 100%
                  </div>
                  <div className="mb-2 grid aspect-square place-items-center overflow-hidden rounded-xl">
                    <ProductImage
                      src={p.image_url}
                      alt={p.name ?? p.sku}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="line-clamp-2 min-h-10 text-xs font-semibold text-[#1d1d1f]">
                    {p.name ?? p.sku}
                  </div>
                  <div className="mt-2 text-base font-bold text-[#1d4ed8]" style={{ letterSpacing: "-0.01em" }}>
                    {price != null ? priceFmt.format(price) : "—"}
                  </div>
                  {orig != null && price != null && orig > price && (
                    <div className="text-xs text-slate-400 line-through">{priceFmt.format(orig)}</div>
                  )}
                  <div className="mt-1 text-[11px] text-slate-500">รับประกันศูนย์ไทย 1 ปี</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
