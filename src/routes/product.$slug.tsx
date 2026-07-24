import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Package, Zap, Minus, Plus, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";

import { displayPrice, getSellingPrice, priceFmt, useCart, useCustomerTier, type PricingProduct } from "@/lib/cart";
import { computeProductPrice, useProductPrice } from "@/hooks/useProductPrice";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import { usePurchaseHistoryForSku } from "@/lib/reorder";

export const Route = createFileRoute("/product/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("synnex_products")
      .select("id, sku, slug, name, brand, category, description, image_url, selling_price, member_price, stock_status")
      .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
      .maybeSingle();
    return { product: data };
  },
  component: ProductDetail,
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const name = p?.name ?? params.slug;
    const price = p?.selling_price ?? 0;
    const url = `https://shop.entgroup.co.th/product/${params.slug}`;
    const title = p
      ? `${name} ราคา ฿${Number(price).toLocaleString("th-TH")} | ENT Group IT Shop`.slice(0, 70)
      : `${name} | ENT Group IT Shop`;
    const desc = p
      ? `${name} ราคา ฿${Number(price).toLocaleString("th-TH")} ${p.stock_status === "พร้อมจัดส่ง" ? "พร้อมจัดส่ง" : "สั่งจอง"} รับประกันศูนย์ไทย จาก ENT Group IT Shop`.slice(0, 160)
      : `รายละเอียดสินค้า ${params.slug} จาก ENT Group IT Shop`;

    const meta = [
      { title },
      { name: "description", content: desc },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "product" },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (p?.image_url) {
      meta.push({ property: "og:image", content: p.image_url });
      meta.push({ name: "twitter:image", content: p.image_url });
    }


    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "หน้าแรก", item: "https://shop.entgroup.co.th/" },
            ...(p?.category ? [{ "@type": "ListItem", position: 2, name: p.category, item: `https://shop.entgroup.co.th/?category=${encodeURIComponent(p.category)}` }] : []),
            { "@type": "ListItem", position: p?.category ? 3 : 2, name },
          ],
        }),
      },
    ];

    if (p && price > 0) {
      // Use a stable date (end of current year) to avoid SSR/CSR hydration mismatch
      const validUntil = `${new Date().getUTCFullYear()}-12-31`;
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: p.description || desc,
          sku: p.sku,
          mpn: p.sku,
          brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
          image: p.image_url || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "THB",
            price: String(price),
            availability: p.stock_status === "พร้อมจัดส่ง" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            priceValidUntil: validUntil,
            url,
            seller: { "@type": "Organization", name: "ENT Group IT Shop" },
          },
        }),
      });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
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
  const { user } = useSupabaseUser();
  const [qty, setQty] = useState(1);
  const tier = useCustomerTier();

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
  const historyQ = usePurchaseHistoryForSku(p?.sku);
  const byOrder = (p as { fulfillment_type?: string | null } | undefined)?.fulfillment_type === "by_order";
  const ready = p?.stock_status === "พร้อมจัดส่ง";
  const available = ready || byOrder;
  const specs = parseSpecs(p?.description);

  useEffect(() => {
    if (!p) return;
    try {
      const raw = localStorage.getItem("ent_recently_viewed");
      const arr: Array<{ sku: string; name: string; image?: string | null; price?: number | null; slug?: string | null }> = raw ? JSON.parse(raw) : [];
      const price = getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) ?? null;
      const entry = { sku: p.sku, name: p.name ?? p.sku, image: p.image_url ?? null, price, slug: p.slug ?? null };
      const next = [entry, ...arr.filter((x) => x.sku !== entry.sku)].slice(0, 8);
      localStorage.setItem("ent_recently_viewed", JSON.stringify(next));
    } catch { /* ignore */ }
  }, [p]);

  const addToCart = (n = qty) => {
    if (!p) return;
    const name = p.name ?? p.sku;
    const unit = computeProductPrice(p as PricingProduct, tier, n).displayPrice || getSellingPrice(p as PricingProduct, tier) || 0;
    add({ id: p.id, sku: p.sku, slug: p.slug, name, price: unit, image_url: p.image_url, distributor: (p as { distributor?: string | null }).distributor ?? null, category: p.category ?? null }, n);
    if (!user) {
      triggerAuthPrompt({ name, sku: p.sku, image_url: p.image_url });
    } else {
      toast.success(`เพิ่ม ${p.sku} จำนวน ${n} ลงตะกร้าแล้ว`);
    }
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
              <ProductImage src={p.image_url} alt={p.name ?? p.sku} className="max-h-full max-w-full object-contain" iconClassName="h-24 w-24 text-slate-300" />
            </div>
            <div className="flex flex-col">
              {p.brand && <div className="mb-1 inline-flex w-fit rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{p.brand}</div>}
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{p.name ?? p.sku}</h1>
              <div className="mt-1 text-sm text-slate-500">SKU / Model: {p.sku}</div>

              {(() => {
                const pr = computeProductPrice(p as PricingProduct, tier, qty);
                const hasPrice = getSellingPrice(p as PricingProduct, tier) != null && !!p.price_approved;
                if (!hasPrice) {
                  return (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="text-lg text-gray-400">ติดต่อสอบถาม</div>
                      <Badge className={ready ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {p.stock_status ?? "—"}
                      </Badge>
                    </div>
                  );
                }
                
                return (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {pr.tierBadge && (
                        <span className="rounded-md bg-[color:var(--brand-navy)] px-2 py-0.5 text-xs font-bold text-white">
                          {pr.tierBadge} Price
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-500">{pr.priceLabel}</span>
                      <Badge className={ready ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {p.stock_status ?? "—"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-3">
                      <div className="text-4xl font-black text-[color:var(--brand-orange)]">
                        ฿{pr.displayPrice.toLocaleString("th-TH")}
                      </div>
                      {pr.savings > 0 && (
                        <>
                          <span className="text-lg text-slate-400 line-through">
                            ฿{pr.originalPrice.toLocaleString("th-TH")}
                          </span>
                          <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                            ประหยัด {pr.savingsPct}%
                          </span>
                        </>
                      )}
                    </div>
                    {pr.volumeDiscount > 0 && (
                      <div className="mt-1 text-xs font-medium text-emerald-700">
                        รวมส่วนลดตามจำนวน −{Math.round(pr.volumeDiscount * 100)}% (×{qty})
                      </div>
                    )}
                    {pr.userType === "guest" && (
                      <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <div>สมาชิกประหยัด 5% · องค์กร B2B ประหยัด 10%</div>
                        <Link to="/auth" className="mt-1 inline-block font-bold text-[color:var(--brand-navy)] underline">
                          สมัครสมาชิกฟรี เพื่อรับราคาพิเศษ →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })()}

              {byOrder && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                    📋 สินค้า By Order
                  </div>
                  <div className="text-blue-900">ระยะเวลาจัดหา: ประมาณ 30 วันทำการ</div>
                  <div className="text-blue-900">เหมาะสำหรับ: องค์กร / B2B</div>
                  <ul className="mt-2 space-y-0.5 text-blue-800">
                    <li>✓ ราคาพิเศษสำหรับองค์กร</li>
                    <li>✓ มีใบกำกับภาษี</li>
                    <li>✓ รับประกันศูนย์ไทย</li>
                  </ul>
                </div>
              )}

              {getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier) != null && !!p.price_approved ? (
                <>
                  <div className="mt-6">
                    <div className="mb-2 text-sm text-slate-600">จำนวน</div>
                    <div className="inline-flex items-center overflow-hidden rounded-md border">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="ลด"><Minus className="h-4 w-4" /></button>
                      <div className="w-14 text-center text-sm font-semibold">{qty}</div>
                      <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="เพิ่ม"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button disabled={!available} onClick={() => addToCart()} className="bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]" size="lg">
                      <ShoppingCart className="mr-2 h-5 w-5" /> {byOrder ? "สั่งจอง" : "ใส่ตะกร้า"}
                    </Button>
                    {byOrder ? (
                      <Button asChild variant="outline" size="lg" className="border-blue-300 text-blue-800 hover:bg-blue-50">
                        <a href="mailto:Sales@entgroup.co.th?subject=ขอใบเสนอราคา">📄 ขอใบเสนอราคา</a>
                      </Button>
                    ) : (
                      <Button
                        disabled={!available}
                        onClick={() => { addToCart(); navigate({ to: "/checkout" }); }}
                        className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]"
                        size="lg"
                      >
                        <Zap className="mr-2 h-5 w-5" /> สั่งซื้อทันที
                      </Button>
                    )}
                  </div>

                  {(() => {
                    const isB2B = tier.startsWith("b2b");
                    const shouldShow = isB2B || (historyQ.data?.count ?? 0) >= 3;
                    if (!shouldShow) return null;
                    const tiers = [
                      { label: "1–2 ชิ้น", qty: 1, pct: 0 },
                      { label: "3–4 ชิ้น", qty: 3, pct: 2 },
                      { label: "5–9 ชิ้น", qty: 5, pct: 4 },
                      { label: "10+ ชิ้น", qty: 10, pct: 7 },
                    ];
                    return (
                      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                        <h4 className="mb-2 text-sm font-bold text-emerald-900">ส่วนลดตามจำนวน / Volume Discount</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-emerald-800">
                              <th className="py-1 font-medium">จำนวน</th>
                              <th className="py-1 font-medium">ราคา/ชิ้น</th>
                              <th className="py-1 text-right font-medium">ประหยัด</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tiers.map((t) => {
                              const row = computeProductPrice(p as PricingProduct, tier, t.qty);
                              const active = qty >= t.qty && (t === tiers[tiers.length - 1] || qty < tiers[tiers.indexOf(t) + 1].qty);
                              return (
                                <tr key={t.qty} className={active ? "bg-emerald-100 font-semibold" : ""}>
                                  <td className="py-1">{t.label}</td>
                                  <td className="py-1">฿{row.displayPrice.toLocaleString("th-TH")}</td>
                                  <td className="py-1 text-right text-emerald-700">{t.pct > 0 ? `−${t.pct}%` : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                  {user && (historyQ.data?.count ?? 0) > 0 && (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                      คุณเคยซื้อสินค้านี้ <b>{historyQ.data!.count}</b> ครั้ง
                      {historyQ.data!.lastDate && (
                        <> — ครั้งล่าสุด: {new Date(historyQ.data!.lastDate).toLocaleDateString("th-TH")} ราคา {priceFmt.format(historyQ.data!.lastPrice)}</>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-6">
                  <Button asChild className="bg-[color:var(--brand-green)] hover:opacity-90" size="lg">
                    <a href="tel:020456104">📞 สอบถามราคา — 02-045-6104</a>
                  </Button>
                </div>
              )}

              {/* Computer Set — extracted spec table + shipping disclaimer */}
              {p.category === "Computer Set" && (() => {
                const src = `${p.name ?? ""} ${p.description ?? ""}`;
                const gpuMatch = src.match(/RTX\s*\d{3,4}\w*/i) ?? src.match(/GTX\s*\d{3,4}/i) ?? src.match(/RX\s*\d{3,4}\w*/i);
                const gpuVram = src.match(/RTX\s*\d{3,4}\w*\s*(\d{1,3})\s*GB/i);
                const ultra = src.match(/(?:Intel\s*Core\s*)?ULTRA\s*\d\s*\w*/i);
                const iSeries = src.match(/\b[iI][3579][-\s]?\d{3,5}\w*/);
                const ryzen = src.match(/Ryzen\s*[3579]\s*\d{3,4}\w*/i);
                const cpuStr = ultra?.[0] ?? iSeries?.[0] ?? ryzen?.[0] ?? null;
                const ramMatch = src.match(/(\d{1,3})\s*GB\s*(DDR\d)?/i);
                const rows = [
                  ["CPU", cpuStr ? cpuStr.replace(/\s+/g, " ").trim() : "—"],
                  ["GPU", gpuMatch ? `NVIDIA GeForce ${gpuMatch[0].toUpperCase().replace(/\s+/g, " ")}${gpuVram ? ` ${gpuVram[1]}GB` : ""}` : "—"],
                  ["RAM", ramMatch ? `${ramMatch[1]}GB${ramMatch[2] ? ` ${ramMatch[2].toUpperCase()}` : ""}` : "—"],
                  ["Brand", p.brand ?? "—"],
                ];
                return (
                  <>
                    <section className="mt-6 overflow-hidden rounded-lg border-2 border-[color:var(--brand-navy)]/20 bg-white" aria-label="สเปคชุดคอมพิวเตอร์">
                      <div className="border-b bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-bold text-white">
                        🖥 สเปคชุดคอมพิวเตอร์ / Computer Set Spec
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {rows.map(([k, v]) => (
                            <tr key={k}>
                              <th scope="row" className="w-[110px] border-b bg-slate-50 px-3 py-2 text-left text-[13px] font-bold text-slate-700">{k}</th>
                              <td className="border-b px-3 py-2 text-[13px] font-medium text-slate-900">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
                      <div>* ราคานี้รวมชุดประกอบพร้อมใช้งาน</div>
                      <div>* ส่งฟรีใน กทม และปริมณฑล เมื่อสั่งซื้อครบ ฿5,000</div>
                      <div>* ต่างจังหวัดคิดค่าจัดส่งตามน้ำหนักจริง (Kerry Express)</div>
                      <div>* รับประกันตามเงื่อนไขของแต่ละชิ้นส่วน</div>
                    </div>
                  </>
                );
              })()}

              {/* Solar & Energy — clean energy info box */}
              {p.category === "Solar & Energy" && (
                <div className="mt-6 rounded-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 text-sm leading-relaxed text-amber-900">
                  <div className="mb-2 font-bold text-amber-950">☀️ สินค้าพลังงานสะอาด</div>
                  <ul className="space-y-1">
                    <li>✓ ประหยัดค่าไฟระยะยาว</li>
                    <li>✓ เหมาะสำหรับบ้านและธุรกิจ</li>
                    <li>✓ ติดตั้งโดยช่างผู้เชี่ยวชาญ</li>
                  </ul>
                  <div className="mt-3 border-t border-amber-200 pt-2 font-semibold">
                    📞 ปรึกษาฟรี <a href="tel:020456104" className="underline">02-045-6104</a>
                  </div>
                </div>
              )}


              {/* AEO — Answer-Ready Summary (for AI answer engines & voice search) */}
              {(() => {
                const priceNum = Number(p.selling_price ?? 0);
                const stockLabel = ready ? "พร้อมจัดส่ง" : byOrder ? "By Order 30 วัน" : (p.stock_status ?? "สินค้าหมด");
                const summary = [
                  `${p.name ?? p.sku} ราคา ฿${priceNum.toLocaleString("th-TH")}`,
                  stockLabel,
                  p.brand ? `แบรนด์ ${p.brand}` : "",
                  `รหัสสินค้า ${p.sku}`,
                  `จำหน่ายโดย ENT Group IT Shop`,
                  "รับประกันศูนย์ไทย",
                ].filter(Boolean).join(" · ");
                return (
                  <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="สรุปสินค้าโดยย่อ">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">สรุปโดยย่อ / Quick Summary</div>
                    <p className="text-sm leading-relaxed text-slate-800">{summary}</p>
                  </section>
                );
              })()}

              {/* AEO — Spec table (structured facts) */}
              <section className="mt-6 overflow-hidden rounded-lg border" aria-label="ข้อมูลจำเพาะสินค้า">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["รุ่น / Model", p.sku],
                      ["แบรนด์", p.brand ?? "—"],
                      ["ราคา", `฿${Number(p.selling_price ?? 0).toLocaleString("th-TH")}`],
                      ["สถานะ", `${p.stock_status ?? "—"}${byOrder ? " (By Order ~30 วัน)" : ""}`],
                      ["หมวดหมู่", p.category ?? "—"],
                      ["รับประกัน", "รับประกันศูนย์ไทย"],
                    ].filter(Boolean).map((row, i) => {
                      const [k, v] = row as [string, string];
                      return (
                        <tr key={k}>
                          <th scope="row" className={`w-[140px] border-b bg-slate-50 px-3 py-2 text-left text-[13px] font-medium text-slate-500 ${i === 0 ? "" : ""}`}>{k}</th>
                          <td className="border-b px-3 py-2 text-[13px] text-slate-800">{v}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {/* AEO — Visible FAQ for voice search / AI answers */}
              {(() => {
                const priceNum = Number(p.selling_price ?? 0);
                const name = p.name ?? p.sku;
                const q1 = `${name} ราคาเท่าไหร่?`;
                const a1 = `${name} ราคา ฿${priceNum.toLocaleString("th-TH")} จาก ENT Group IT Shop`;
                const q2 = `${name} มีสินค้าพร้อมส่งไหม?`;
                const a2 = ready
                  ? `${name} มีสินค้าพร้อมจัดส่งทันที จัดส่งทั่วไทยผ่าน Kerry, Flash, ไปรษณีย์ไทย`
                  : byOrder
                    ? `${name} เป็นสินค้า By Order ใช้เวลาประมาณ 30 วันทำการ เหมาะสำหรับลูกค้าองค์กรที่ต้องการจำนวนมาก`
                    : `${name} สินค้าหมดชั่วคราว สามารถกด Notify Me เพื่อรอรับแจ้งเตือน หรือติดต่อสอบถามได้`;
                return (
                  <section
                    className="mt-6 rounded-lg border bg-white p-4"
                    itemScope
                    itemType="https://schema.org/FAQPage"
                    aria-label="คำถามที่พบบ่อย"
                  >
                    <h2 className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">คำถามที่พบบ่อย / FAQ</h2>
                    {[[q1, a1], [q2, a2]].map(([q, a]) => (
                      <div key={q} itemProp="mainEntity" itemScope itemType="https://schema.org/Question" className="border-t py-3 first:border-t-0">
                        <h3 itemProp="name" className="text-sm font-semibold text-slate-900">{q}</h3>
                        <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                          <p itemProp="text" className="mt-1 text-sm text-slate-700">{a}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })()}



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
                    <ProductImage src={r.image_url} alt={r.name ?? r.sku} iconClassName="h-16 w-16 text-slate-300" />
                  </div>
                  <div className="border-t p-3">
                    <div className="line-clamp-2 min-h-10 text-sm font-medium">{r.name ?? r.sku}</div>
                    <div className="mt-1 text-base font-black text-[color:var(--brand-orange)]">{displayPrice(r as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null }, tier)}</div>
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
