import { Link } from "@tanstack/react-router";
import { Package, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useFrequentlyBought } from "@/lib/reorder";
import { useCart, getSellingPrice, priceFmt, useCustomerTier } from "@/lib/cart";
import { toast } from "sonner";

export function FrequentlyBought({ title = "สินค้าที่คุณซื้อบ่อย / Buy Again" }: { title?: string }) {
  const q = useFrequentlyBought(6);
  const tier = useCustomerTier();
  const { add } = useCart();

  if (q.isLoading) return null;
  const items = q.data ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-[color:var(--brand-navy)]">{title}</h2>
        <span className="text-xs text-slate-500">ตามประวัติของคุณ</span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {items.map((it) => {
          const p = it.current;
          const currentPrice = p ? getSellingPrice(p, tier) : null;
          const approved = !!p?.price_approved;
          const diff = currentPrice != null ? currentPrice - it.last_unit_price : 0;
          const link = p?.slug ? `/product/${p.slug}` : null;

          return (
            <div key={it.product_sku} className="w-56 shrink-0 snap-start overflow-hidden rounded-lg border bg-white transition hover:shadow-md">
              {link ? (
                <Link to="/product/$slug" params={{ slug: p!.slug! }} className="block">
                  <ImageBox image={it.product_image_url ?? p?.image_url ?? null} name={it.product_name} />
                </Link>
              ) : (
                <ImageBox image={it.product_image_url} name={it.product_name} />
              )}
              <div className="space-y-2 p-3">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  ซื้อ {it.buy_count} ครั้ง
                </div>
                <div className="line-clamp-2 min-h-[2.5rem] text-xs font-medium text-slate-800">{it.product_name}</div>
                {approved && currentPrice != null ? (
                  <div>
                    <div className="text-base font-black text-[color:var(--brand-orange)]">{priceFmt.format(currentPrice)}</div>
                    {Math.abs(diff) >= 1 && (
                      <div className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold ${diff > 0 ? "text-red-600" : "text-green-700"}`}>
                        {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {diff > 0 ? "ราคาขึ้น" : "ราคาลด"} {priceFmt.format(Math.abs(diff))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">ราคายังไม่พร้อม</div>
                )}
                <button
                  disabled={!p || !approved || currentPrice == null}
                  onClick={() => {
                    if (!p || currentPrice == null) return;
                    add({
                      id: p.id,
                      sku: it.product_sku,
                      slug: p.slug,
                      name: p.name ?? it.product_name,
                      price: currentPrice,
                      image_url: p.image_url ?? it.product_image_url,
                      distributor: p.distributor,
                    }, 1);
                    toast.success(`เพิ่ม ${it.product_sku} ลงตะกร้าแล้ว`);
                  }}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-[color:var(--brand-green)] px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> ใส่ตะกร้า
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ImageBox({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="grid aspect-square place-items-center bg-slate-50 p-3">
      {image ? <img src={image} alt={name} className="max-h-full max-w-full object-contain" loading="lazy" /> : <Package className="h-12 w-12 text-slate-300" />}
    </div>
  );
}
