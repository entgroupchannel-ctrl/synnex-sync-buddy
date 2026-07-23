import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Package, Zap, Minus, Plus, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { displayPrice, getSellingPrice, priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  ssr: false,
  component: ProductDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — IT Dealer` },
      { name: "description", content: `รายละเอียดสินค้า ${params.slug}` },
      { property: "og:title", content: `${params.slug} — IT Dealer` },
      { property: "og:description", content: `รายละเอียดสินค้า ${params.slug}` },
    ],
  }),
});

function parseSpecs(desc: string | null | undefined): [string, string][] {
  if (!desc) return [];
  const lines = desc.split(/\n|·|•|;/).map((s) => s.trim()).filter(Boolean);
  const specs: [string, string][] = [];
  for (const l of lines) {
    const m = l.match(/^([^:：-]{2,40})[:：-]\s*(.+)$/);
    if (m) specs.push([m[1].trim(), m[2].trim()]);
  }
  return specs.slice(0, 20);
}

function ProductDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const productQ = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("synnex_products").select("*").or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
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
  const specs = parseSpecs(p?.description);

  const addToCart = (n = qty) => {
    if (!p) return;
    add({ id: p.id, sku: p.sku, slug: p.slug, name: p.name ?? p.sku, price: getSellingPrice(p as { selling_price?: number | null }) ?? 0, image_url: p.image_url, distributor: (p as { distributor?: string | null }).distributor ?? null }, n);
    toast.success(`เพิ่ม ${p.sku} จำนวน ${n} ลงตะกร้าแล้ว`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <Link to="/" className="hover:text-[color:var(--brand-navy)]">หน้าแรก</Link>
          {p?.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to="/" search={{ category: p.category } as never} className="hover:text-[color:var(--brand-navy)]">{p.category}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-slate-900">{p?.name ?? slug}</span>
        </nav>

        {productQ.isLoading ? (
          <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
        ) : !p ? (
          <div className="rounded-lg border bg-white p-12 text-center text-slate-500">ไม่พบสินค้า</div>
        ) : (
          <div className="grid gap-8 rounded-lg border bg-white p-4 md:p-6 lg:grid-cols-2">
            <div className="grid aspect-square place-items-center rounded-lg bg-slate-50 p-6">
              {p.image_url ? <img src={p.image_url} alt={p.name ?? p.sku} className="max-h-full max-w-full object-contain" /> : <Package className="h-24 w-24 text-slate-300" />}
            </div>
            <div className="flex flex-col">
              {p.brand && <div className="mb-1 inline-flex w-fit rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{p.brand}</div>}
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{p.name ?? p.sku}</h1>
              <div className="mt-1 text-sm text-slate-500">SKU / Model: {p.sku}</div>

              <div className="mt-5 flex items-center gap-3">
                <div className="text-4xl font-black text-[color:var(--brand-orange)]">
                  {displayPrice(p as { selling_price?: number | null })}
                </div>
                <Badge className={ready ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                  {p.stock_status ?? "—"}
                </Badge>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm text-slate-600">จำนวน</div>
                <div className="inline-flex items-center overflow-hidden rounded-md border">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="ลด"><Minus className="h-4 w-4" /></button>
                  <div className="w-14 text-center text-sm font-semibold">{qty}</div>
                  <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="เพิ่ม"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button disabled={!ready} onClick={() => addToCart()} className="bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]" size="lg">
                  <ShoppingCart className="mr-2 h-5 w-5" /> ใส่ตะกร้า
                </Button>
                <Button
                  disabled={!ready}
                  onClick={() => { addToCart(); navigate({ to: "/checkout" }); }}
                  className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]"
                  size="lg"
                >
                  <Zap className="mr-2 h-5 w-5" /> สั่งซื้อทันที
                </Button>
              </div>

              {p.description && (
                <div className="mt-8">
                  <h2 className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">รายละเอียดสินค้า</h2>
                  {specs.length >= 3 ? (
                    <table className="w-full overflow-hidden rounded-md border text-sm">
                      <tbody>
                        {specs.map(([k, v], i) => (
                          <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                            <td className="w-1/3 border-b px-3 py-2 font-medium text-slate-600">{k}</td>
                            <td className="border-b px-3 py-2 text-slate-800">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(relatedQ.data?.length ?? 0) > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-bold text-[color:var(--brand-navy)]">สินค้าที่คล้ายกัน</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {relatedQ.data!.map((r) => (
                <Link key={r.id} to="/product/$slug" params={{ slug: r.slug || r.id }} className="group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md">
                  <div className="grid aspect-square place-items-center bg-white p-2">
                    {r.image_url ? <img src={r.image_url} alt={r.name ?? r.sku} className="h-full w-full object-contain" loading="lazy" /> : <Package className="h-16 w-16 text-slate-300" />}
                  </div>
                  <div className="border-t p-3">
                    <div className="line-clamp-2 min-h-10 text-sm font-medium">{r.name ?? r.sku}</div>
                    <div className="mt-1 text-base font-black text-[color:var(--brand-orange)]">{displayPrice(r as { selling_price?: number | null })}</div>
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
