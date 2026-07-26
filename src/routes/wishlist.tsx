import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";
import { useWishlist, toggleWishlist } from "@/lib/wishlist";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  ssr: false,
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "รายการที่บันทึกไว้ | ENT Group IT Shop" },
      { name: "description", content: "สินค้าที่คุณบันทึกไว้ดูทีหลังจาก ENT Group IT Shop" },
      { property: "og:title", content: "รายการที่บันทึกไว้ | ENT Group IT Shop" },
      { property: "og:description", content: "สินค้าที่คุณบันทึกไว้ดูทีหลังจาก ENT Group IT Shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function WishlistPage() {
  const ids = useWishlist();
  const q = useQuery({
    enabled: ids.length > 0,
    queryKey: ["wishlist-products", ids.slice().sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("synnex_products")
        .select("id, sku, slug, name, brand, image_url, selling_price, member_price, min_tier_price, stock_status")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = q.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 fill-red-500 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">รายการที่บันทึกไว้</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {ids.length}
          </span>
        </div>

        {ids.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-6 text-slate-500">ยังไม่มีสินค้าที่บันทึกไว้</p>
            <Link to="/" className="inline-flex items-center rounded-md bg-[color:var(--brand-green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              เลือกสินค้า
            </Link>
          </div>
        ) : q.isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <div key={p.id} className="group relative rounded-lg border bg-white p-3 transition-shadow hover:shadow-md">
                <button
                  onClick={() => {
                    toggleWishlist(p.id);
                    toast.success("นำออกจากรายการแล้ว");
                  }}
                  className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-red-50"
                  aria-label="นำออก"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
                <Link to="/product/$slug" params={{ slug: p.slug ?? p.id }}>
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                    <ProductImage src={p.image_url} alt={p.name ?? p.sku} className="max-h-full w-full object-contain" />
                  </div>
                  <div className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-800">{p.name ?? p.sku}</div>
                  {p.selling_price != null && (
                    <div className="mt-1 font-bold text-[color:var(--brand-orange)]">
                      ฿{Number(p.selling_price).toLocaleString("th-TH")}
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                ids.forEach((id) => toggleWishlist(id));
                toast.success("ล้างรายการแล้ว");
              }}
            >
              ล้างรายการทั้งหมด
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
