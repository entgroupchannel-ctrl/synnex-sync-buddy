import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Package, ArrowLeft, ShoppingCart, ShoppingBag, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";
import { supabase } from "@/integrations/supabase/client";

import { CATEGORIES, priceFmt, useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { saveCartReminder, deleteCartReminder } from "@/lib/cart-reminder";
import { getWeightBasedShippingFee } from "@/lib/shipping";


export const Route = createFileRoute("/cart")({
  ssr: false,
  component: CartPage,
  head: () => ({
    meta: [
      { title: "ตะกร้าสินค้า — ENT Group IT Shop" },
      { name: "description", content: "ตรวจสอบสินค้าในตะกร้าและดำเนินการชำระเงิน" },
      { property: "og:title", content: "ตะกร้าสินค้า — ENT Group IT Shop" },
      { property: "og:description", content: "ตรวจสอบสินค้าในตะกร้าและดำเนินการชำระเงิน" },
    ],
  }),
});

type RecentItem = { sku: string; name: string; image?: string | null; price?: number | null; slug?: string | null };

function CartPage() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const { user } = useSupabaseUser();
  // Preview shipping under both zones (BKK metro vs. upcountry)
  const weightedItems = items.map((i) => ({ price: i.price, qty: i.qty, weight_kg: getItemWeightKg(i) }));
  const shipBkk = getWeightBasedShippingFee(weightedItems, "กรุงเทพมหานคร");
  const shipOther = getWeightBasedShippingFee(weightedItems, "เชียงใหม่");
  const totalWeight = shipBkk.totalWeight;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ent_recently_viewed");
      const arr = raw ? (JSON.parse(raw) as RecentItem[]) : [];
      setRecent(arr.slice(0, 4));
    } catch { /* ignore */ }
  }, []);

  const skus = useMemo(() => items.map((i) => i.sku).filter(Boolean), [items]);
  const fulfillQ = useQuery({
    enabled: skus.length > 0,
    queryKey: ["cart-fulfill", skus.join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products").select("sku,fulfillment_type").in("sku", skus);
      const map: Record<string, string | null> = {};
      for (const r of data ?? []) map[(r as { sku: string }).sku] = (r as { fulfillment_type: string | null }).fulfillment_type;
      return map;
    },
    staleTime: 60_000,
  });
  const fulfillMap = fulfillQ.data ?? {};
  const hasByOrder = items.some((i) => fulfillMap[i.sku] === "by_order");

  // Cheapest fee across both zones (used for a rough "cart total incl. shipping" preview)
  const cheapestFee = Math.min(shipBkk.fee, shipOther.fee);
  const isBkkFree = shipBkk.freeShipping;
  const remainingForFree = Math.max(0, 5000 - total);


  // Persist cart snapshot for logged-in users so the reminder job can email them.
  useEffect(() => {
    if (!user?.id || !user?.email) return;
    if (items.length === 0) {
      deleteCartReminder(user.id).catch(() => {});
    } else {
      saveCartReminder(user.id, user.email, items, total).catch(() => {});
    }
  }, [user?.id, user?.email, items, total]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Sarabun, system-ui, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> {t("cart.continue")}
        </Link>
        <h1 className="mb-6 text-2xl font-bold">{t("cart.title")}</h1>

        {items.length === 0 ? (
          <EmptyCart recent={recent} onBrowse={() => navigate({ to: "/" })} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {hasByOrder && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="font-bold">⚠️ สินค้า By Order ในตะกร้าของคุณ</div>
                  <div className="mt-1">จะใช้เวลาจัดหาประมาณ 30 วันทำการ</div>
                  <div>ทีมงานจะติดต่อยืนยันก่อนจัดส่ง</div>
                </div>
              )}
              {items.map((it) => {
                const itemByOrder = fulfillMap[it.sku] === "by_order";
                return (
                <div key={it.id} className="flex gap-4 rounded-lg border bg-white p-4">
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-slate-50">
                    <ProductImage src={it.image_url} alt={it.name} className="h-full w-full object-contain p-1" iconClassName="h-8 w-8 text-slate-300" />

                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">{it.sku}</div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: it.slug || it.id }}
                      className="line-clamp-2 text-sm font-medium hover:text-[color:var(--brand-navy)]"
                    >
                      {it.name}
                    </Link>
                    {itemByOrder && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                        📋 สินค้านี้ใช้เวลา 30 วัน
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-md border">
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="px-2 py-1 hover:bg-slate-100">
                          <Minus className="h-3 w-3" />
                        </button>
                        <div className="w-8 text-center text-sm">{it.qty}</div>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="px-2 py-1 hover:bg-slate-100">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[color:var(--brand-navy)]">{priceFmt.format(it.price * it.qty)}</div>
                    <div className="text-xs text-slate-500">{priceFmt.format(it.price)} / ชิ้น</div>
                  </div>
                </div>
              );})}
            </div>

            <aside className="h-fit rounded-lg border bg-white p-5">
              <h2 className="mb-3 font-semibold">{t("cart.summary")}</h2>
              <div className="flex justify-between text-sm">
                <span>{t("cart.subtotal")}</span>
                <span>{priceFmt.format(total)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-slate-600">
                <span>{t("cart.shipping")}</span>
                <span className="text-slate-500">คำนวณตอนชำระเงิน</span>
              </div>

              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <span>🚚</span>
                  <div>
                    <div className="font-semibold text-[color:var(--brand-navy)]">กรุงเทพฯ &amp; ปริมณฑล</div>
                    <div className="text-slate-600">ส่งฟรีเมื่อซื้อครบ ฿5,000 (กทม./นนทบุรี/ปทุมธานี/สมุทรปราการ)</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span>📦</span>
                  <div>
                    <div className="font-semibold text-[color:var(--brand-navy)]">ต่างจังหวัด · Kerry Express</div>
                    <div className="text-slate-600">฿50–฿400 ตามน้ำหนัก (น้ำหนักตะกร้าตอนนี้ {totalWeight.toFixed(1)} กก. ≈ ฿{shipOther.fee})</div>
                  </div>
                </div>
              </div>

              {isBkkFree ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
                  🎉 ยินดีด้วย! คุณได้รับสิทธิ์ส่งฟรีในเขต กทม./ปริมณฑล
                </div>
              ) : remainingForFree > 0 ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-emerald-800">
                        ซื้อเพิ่ม {priceFmt.format(remainingForFree)} รับส่งฟรีในเขต กทม./ปริมณฑล
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(100, Math.round((total / 5000) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="my-4 h-px bg-slate-200" />
              <div className="flex justify-between text-lg font-bold text-[color:var(--brand-navy)]">
                <span>{t("cart.total")}</span>
                <span>{priceFmt.format(total + cheapestFee)}</span>
              </div>
              <Button asChild className="mt-4 w-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]" size="lg">
                <Link to="/checkout">{t("cart.checkout")}</Link>
              </Button>
            </aside>

          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart({ recent, onBrowse }: { recent: RecentItem[]; onBrowse: () => void }) {
  const { t, lang } = useLanguage();
  const th = lang === "th";
  return (
    <div className="rounded-2xl border bg-white p-8 sm:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-slate-100">
          <ShoppingCart className="h-16 w-16" strokeWidth={1.5} style={{ color: "var(--border-strong, #cbd5e1)" }} />
        </div>

        <h2 className="text-2xl font-black text-[color:var(--brand-navy)]">{t("cart.empty")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("cart.empty_en")}</p>

        <p className="mt-4 text-slate-600">{t("cart.empty_sub")}</p>
        <p className="text-sm text-slate-400">{t("cart.empty_sub_en")}</p>

        <Button
          onClick={onBrowse}
          size="lg"
          className="mt-6 w-full bg-[#10b981] text-white hover:bg-[#0ea371] sm:w-auto sm:px-8"
        >
          <ShoppingBag className="mr-2 h-5 w-5" /> {th ? "เลือกสินค้า / Browse Products" : "Browse Products / เลือกสินค้า"}
        </Button>

        <div className="mt-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wider text-slate-400">{t("cart.or_categories")}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/"
              search={{ category: c } as never}
              className="rounded-full border bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-[color:var(--brand-green)] hover:bg-[color:var(--brand-green)]/5 hover:text-[color:var(--brand-navy)]"
            >
              {c}
            </Link>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-10 text-left">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              <div>
                <div className="font-bold text-[color:var(--brand-navy)]">{t("cart.recently_viewed")}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recent.map((r) => (
                <Link
                  key={r.sku}
                  to="/product/$slug"
                  params={{ slug: r.slug || r.sku }}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md"
                >
                  <div className="grid aspect-square place-items-center bg-slate-50">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="h-full w-full object-contain p-2" loading="lazy" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <div className="line-clamp-2 text-xs font-medium text-slate-800 group-hover:text-[color:var(--brand-navy)]">{r.name}</div>
                    {typeof r.price === "number" && r.price > 0 && (
                      <div className="mt-auto text-sm font-bold text-[color:var(--brand-orange)]">{priceFmt.format(r.price)}</div>
                    )}
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
