import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Package, Zap, Minus, Plus, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  ssr: false,
  component: ProductDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Synnex Store` },
      { name: "description", content: "รายละเอียดสินค้า" },
    ],
  }),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const productQ = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("synnex_products")
        .select("*")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const relatedQ = useQuery({
    enabled: !!productQ.data?.category,
    queryKey: ["related", productQ.data?.category, productQ.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("synnex_products")
        .select("*")
        .eq("category", productQ.data!.category!)
        .neq("id", productQ.data!.id)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const p = productQ.data;
  const ready = p?.stock_status === "พร้อมจัดส่ง";

  const addToCart = (n = qty) => {
    if (!p) return;
    add({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name ?? p.sku,
      price: Number(p.price ?? 0),
      image_url: p.image_url,
    }, n);
    toast.success(`เพิ่ม ${p.sku} จำนวน ${n} ลงตะกร้าแล้ว`);
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Sarabun, system-ui, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1a237e]">
          <ArrowLeft className="h-4 w-4" /> กลับสู่แคตตาล็อก
        </Link>

        {productQ.isLoading ? (
          <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
        ) : !p ? (
          <div className="rounded-lg border bg-white p-12 text-center text-slate-500">ไม่พบสินค้า</div>
        ) : (
          <div className="grid gap-8 rounded-lg border bg-white p-6 md:grid-cols-2">
            <div className="flex aspect-square items-center justify-center rounded-lg bg-slate-50 p-6">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name ?? p.sku} className="h-full w-full object-contain" />
              ) : (
                <Package className="h-24 w-24 text-slate-300" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="text-xs uppercase tracking-wide text-slate-500">{p.category ?? "—"}</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{p.name ?? p.sku}</h1>
              <div className="mt-1 text-sm text-slate-500">SKU / Model: {p.sku}</div>

              <div className="mt-4 flex items-center gap-3">
                <div className="text-3xl font-bold text-[#1a237e]">
                  {p.price != null ? priceFmt.format(Number(p.price)) : "—"}
                </div>
                <Badge className={ready ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                  {p.stock_status ?? "—"}
                </Badge>
              </div>

              {p.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.description}</p>
              )}

              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex items-center rounded-md border">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-slate-100"
                    aria-label="ลด"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="w-10 text-center text-sm">{qty}</div>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3 py-2 hover:bg-slate-100"
                    aria-label="เพิ่ม"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button disabled={!ready} onClick={() => addToCart()} className="bg-[#1565c0] hover:bg-[#0d47a1]" size="lg">
                  <ShoppingCart className="mr-2 h-5 w-5" /> ใส่ตะกร้า
                </Button>
                <Button
                  disabled={!ready}
                  onClick={() => { addToCart(); navigate({ to: "/checkout" }); }}
                  className="bg-[#ff6f00] hover:bg-[#e65100]"
                  size="lg"
                >
                  <Zap className="mr-2 h-5 w-5" /> ซื้อทันที
                </Button>
              </div>
            </div>
          </div>
        )}

        {relatedQ.data && relatedQ.data.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">สินค้าที่คล้ายกัน</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {relatedQ.data.map((r) => (
                <Link
                  key={r.id}
                  to="/product/$slug"
                  params={{ slug: r.slug || r.id }}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md"
                >
                  <div className="flex aspect-square items-center justify-center bg-white p-2">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name ?? r.sku} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <Package className="h-16 w-16 text-slate-300" />
                    )}
                  </div>
                  <div className="border-t p-3">
                    <div className="line-clamp-2 min-h-10 text-sm font-medium">{r.name ?? r.sku}</div>
                    <div className="mt-1 text-sm font-bold text-[#1a237e]">
                      {r.price != null ? priceFmt.format(Number(r.price)) : "—"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
