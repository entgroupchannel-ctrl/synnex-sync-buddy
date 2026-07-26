import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_PUBLIC_COLUMNS } from "@/lib/product-columns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Package, Zap, Minus, Plus, ChevronRight, ChevronLeft, FileText, Phone, Mail, MessageCircle, Facebook, Link as LinkIcon, Check, Heart, Twitter, QrCode } from "lucide-react";
import { ProductQrDialog } from "@/components/product-qr-dialog";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HelpChooseBanner } from "@/components/help-choose-banner";
import { SpecTagsFull } from "@/components/spec-tags";
import { hasSpecTags } from "@/lib/parse-spec";
import { UsageInfoBox } from "@/components/usage-badge";
import { CctvSpecGuide } from "@/components/cctv-spec-guide";

import { ProductImage, computerSetPlaceholder, upsPlaceholder, cpuPlaceholder, isCpuProduct, applePlaceholder } from "@/components/product-image";
import { DeliveryInfoBox } from "@/components/delivery-info";
import { ProtectedText } from "@/components/protected-text";
import { ProductTrustBar, ReturnPolicyAccordion } from "@/components/trust-signals";

import { WarrantyBadge } from "@/components/warranty-badge";
import { StockBadge } from "@/components/stock-badge";

import { displayPrice, getSellingPrice, priceFmt, useCart, useCustomerTier, type PricingProduct } from "@/lib/cart";
import { B2BBadgeLarge, MemberBadge, DiscountBadgeRow } from "@/components/discount-badge";
import { QuoteRequestButton, isQuoteOnly } from "@/components/QuoteRequest";
import { computeProductPrice, useProductPrice } from "@/hooks/useProductPrice";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import { usePurchaseHistoryForSku } from "@/lib/reorder";
import { LineQrDialog } from "@/components/line-qr-dialog";
import { ShippingMethodSelector } from "@/components/shipping-method-selector";
import { useVolumeRules, rulesForProduct, tierQtyLabel, tierDiscountLabel } from "@/lib/volume-discount";
import { DeliveryZoneInfoBox } from "@/components/delivery-zone-dialog";
import { VatNote } from "@/components/vat-note";

export const Route = createFileRoute("/product/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const slugOrId = params.slug;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const selectFields = PRODUCT_PUBLIC_COLUMNS;
    const { data: slugProduct, error: slugError } = await supabase
      .from("synnex_products")
      .select(selectFields)
      .eq("slug", slugOrId)
      .eq("price_approved", true)
      .maybeSingle();
    if (slugProduct || !isUuid || slugError) return { product: slugProduct };
    const { data: idProduct } = await supabase
      .from("synnex_products")
      .select(selectFields)
      .eq("id", slugOrId)
      .eq("price_approved", true)
      .maybeSingle();
    return { product: idProduct };
  },
  component: ProductDetail,
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const name = p?.name ?? params.slug;
    const price = p?.selling_price ?? 0;
    const url = `https://shop.entgroup.co.th/product/${params.slug}`;
    const title = p
      ? `${name} ราคา ฿${Number(price).toLocaleString("th-TH")} | ENT Group IT Retail Shop`.slice(0, 70)
      : `${name} | ENT Group IT Retail Shop`;
    const desc = p
      ? `${name} ราคา ฿${Number(price).toLocaleString("th-TH")} ${p.stock_status === "พร้อมจัดส่ง" ? "พร้อมจัดส่ง" : "สั่งจอง"} รับประกันศูนย์ไทย จาก ENT Group IT Retail Shop`.slice(0, 160)
      : `รายละเอียดสินค้า ${params.slug} จาก ENT Group IT Retail Shop`;

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
      meta.push({ property: "og:image", content: p?.image_url });
      meta.push({ name: "twitter:image", content: p?.image_url });
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
          image: p?.image_url || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "THB",
            price: String(price),
            availability: p.stock_status === "พร้อมจัดส่ง" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            priceValidUntil: validUntil,
            url,
            seller: { "@type": "Organization", name: "ENT Group IT Retail Shop" },
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
  const [copied, setCopied] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const tier = useCustomerTier();

  const productQ = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let { data, error } = await supabase
        .from("synnex_products")
        .select(PRODUCT_PUBLIC_COLUMNS)
        .eq("slug", slug)
        .eq("price_approved", true)
        .maybeSingle();
      if (!data && isUuid) {
        const r = await supabase
          .from("synnex_products")
          .select(PRODUCT_PUBLIC_COLUMNS)
          .eq("id", slug)
          .eq("price_approved", true)
          .maybeSingle();
        data = r.data; error = r.error;
      }
      if (error) throw error;
      return data;
    },
  });


  const relatedQ = useQuery({
    enabled: !!productQ.data?.id,
    queryKey: ["smart-recommendations", productQ.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_smart_recommendations", {
        p_product_id: productQ.data!.id,
        p_limit: 8,
      });
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
  const decodedSku = p?.sku
    ? (() => {
        try {
          return decodeURIComponent(p.sku);
        } catch {
          return p.sku;
        }
      })()
    : "";
  const showSku = decodedSku && !decodedSku.includes("%");

  const hideSpecShots =
    p?.category === "Smart Phone & Tablet" ||
    (p?.brand ?? "").toUpperCase() === "APPLE";

  const baseImages: string[] = !p
    ? []
    : p.category === "Computer Set"
      ? [computerSetPlaceholder(p.name)]
      : p.category === "UPS" && (p.distributor ?? "").toUpperCase() === "ADVICE"
        ? [upsPlaceholder(p.name)]
        : isCpuProduct(p.category, p.subcategory, p.name) &&
            (p.distributor ?? "").toUpperCase() === "ADVICE"
          ? [cpuPlaceholder(p.name)]
          : ([p?.image_url, ...(Array.isArray(p?.image_gallery) ? p?.image_gallery : [])].filter(
              Boolean,
            ) as string[]).filter(
              (src, i) => i === 0 || !(hideSpecShots && /\/[5-8]\.jpg(?:\?.*)?$/i.test(src)),
            );

  // Apple-style fallback: ภาพแทนตระกูลสินค้า + พื้นหลังสไตล์ Apple 3 แบบ
  const appleShot = baseImages.length === 0 ? applePlaceholder(p?.name) : null;
  const APPLE_BACKDROPS = [
    "bg-gradient-to-b from-white via-slate-50 to-slate-100",
    "bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300",
    "bg-gradient-to-br from-slate-800 via-slate-900 to-black",
  ];
  const images: string[] = appleShot ? [appleShot, appleShot, appleShot] : baseImages;
  const activeBackdrop = appleShot ? APPLE_BACKDROPS[activeImg] ?? APPLE_BACKDROPS[0] : "bg-white";





  useEffect(() => {
    if (p?.id) setWishlisted(isWishlisted(p.id));
  }, [p?.id]);

  useEffect(() => {
    if (!p) return;
    try {
      const raw = localStorage.getItem("ent_recently_viewed");
      const arr: Array<{ sku: string; name: string; image?: string | null; price?: number | null; slug?: string | null }> = raw ? JSON.parse(raw) : [];
      const price = getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null; tier_price_guest?: number | null; tier_price_b2c?: number | null; tier_price_b2c_silver?: number | null; tier_price_b2c_gold?: number | null; tier_price_b2c_vip?: number | null; tier_price_b2b?: number | null; tier_price_b2b_silver?: number | null; tier_price_b2b_gold?: number | null }, tier) ?? null;
      const entry = { sku: p.sku, name: p.name ?? p.sku, image: p?.image_url ?? null, price, slug: p.slug ?? null };
      const next = [entry, ...arr.filter((x) => x.sku !== entry.sku)].slice(0, 8);
      localStorage.setItem("ent_recently_viewed", JSON.stringify(next));
    } catch { /* ignore */ }
  }, [p]);

  useEffect(() => {
    setActiveImg(0);
  }, [p?.id]);

  const addToCart = (n = qty) => {
    if (!p) return;
    const name = p.name ?? p.sku;
    const unit = computeProductPrice(p as PricingProduct, tier, n).displayPrice || getSellingPrice(p as PricingProduct, tier) || 0;
    add({ id: p.id, sku: p.sku, slug: p.slug, name, price: unit, image_url: p?.image_url, distributor: (p as { distributor?: string | null }).distributor ?? null, category: p.category ?? null }, n);
    if (!user) {
      triggerAuthPrompt({ name, sku: p.sku, image_url: p?.image_url });
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
          <div className="rounded-lg border bg-white p-12 text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900">ไม่พบสินค้า</h1>
            <p className="mb-6 text-slate-500">สินค้านี้อาจถูกลบหรือไม่มีในระบบ</p>
            <Link to="/" className="inline-flex items-center rounded-md bg-[color:var(--brand-green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">กลับหน้าแรก</Link>
          </div>
        ) : (
          <div className="grid gap-8 rounded-lg border bg-white p-4 md:p-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {/* Main image */}
                <div
                  className={`relative rounded-xl overflow-hidden border border-slate-100 transition-colors duration-300 ${activeBackdrop}`}
                  style={{ paddingBottom: '75%' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img
                      src={images[activeImg]}
                      alt={p.name ?? decodedSku}
                      className="max-h-full max-w-full object-contain transition-all duration-300"
                      onError={(e) => {
                        // fallback to main image if angle not found
                        if (activeImg > 0) setActiveImg(0);
                      }}
                    />
                  </div>

                  {appleShot && (
                    <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
                      ภาพแทน
                    </span>
                  )}

                  {/* Prev/Next arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg((i) => (i > 0 ? i - 1 : images.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-1.5 hover:shadow-lg transition-shadow z-10"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => setActiveImg((i) => (i < images.length - 1 ? i + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-1.5 hover:shadow-lg transition-shadow z-10"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      </button>
                    </>
                  )}

                  {/* Image counter dot indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`rounded-full transition-all ${
                            i === activeImg
                              ? 'w-4 h-1.5 bg-green-500'
                              : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails — show only if multiple images */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all w-16 h-16 p-1 ${appleShot ? APPLE_BACKDROPS[i] ?? "bg-white" : "bg-white"} ${
                          i === activeImg
                            ? 'border-green-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`มุมที่ ${i + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).closest('button')?.remove();
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg border bg-white p-2.5">
                <span className="text-xs text-slate-400 mr-1">แชร์:</span>
                <button
                  type="button"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  aria-label="แชร์ไปยัง Facebook"
                >
                  <Facebook className="h-4 w-4" style={{ color: "#1877F2" }} />
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`, "_blank")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  aria-label="แชร์ไปยัง LINE"
                >
                  <MessageCircle className="h-4 w-4" style={{ color: "#06C755" }} />
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(p.name ?? "")}`, "_blank")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  aria-label="แชร์ไปยัง X"
                >
                  <Twitter className="h-4 w-4 text-slate-900" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("คัดลอกลิงก์แล้ว!");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      toast.error("ไม่สามารถคัดลอกลิงก์");
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  aria-label="คัดลอกลิงก์"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <LinkIcon className="h-4 w-4 text-slate-600" />}
                </button>
                <ProductQrDialog url={typeof window !== "undefined" ? window.location.href : `https://shop.entgroup.co.th/product/${slug}`} productName={p.name ?? ""}>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                    aria-label="สแกน QR Code เปิดในมือถือ"
                  >
                    <QrCode className="h-4 w-4 text-slate-600" />
                  </button>
                </ProductQrDialog>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const added = toggleWishlist(p.id);
                      setWishlisted(added);
                      toast.success(added ? "❤️ บันทึกไว้ดูทีหลังแล้ว" : "นำออกจากรายการแล้ว");
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 hover:bg-slate-50"
                  >
                    <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-400"}`} />
                    <span className="text-xs">{wishlisted ? "บันทึกแล้ว" : "บันทึก"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              {p.brand && <div className="mb-1 inline-flex w-fit rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{p.brand}</div>}
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{p.name ?? decodedSku}</h1>
              {showSku && (
                <div className="mt-1 text-sm text-slate-500">
                  SKU / Model: <ProtectedText text={decodedSku} />
                </div>
              )}


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
                      <StockBadge stockQty={(p as { stock_qty?: number | null }).stock_qty} fulfillmentType={(p as { fulfillment_type?: string | null }).fulfillment_type} stockStatus={(p as { stock_status?: string | null }).stock_status} distributor={(p as { distributor?: string | null }).distributor} />
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
                      <StockBadge stockQty={(p as { stock_qty?: number | null }).stock_qty} fulfillmentType={(p as { fulfillment_type?: string | null }).fulfillment_type} stockStatus={(p as { stock_status?: string | null }).stock_status} distributor={(p as { distributor?: string | null }).distributor} />
                    </div>
                    {isQuoteOnly(p.selling_price as number | null) ? (
                      <div className="mt-1 space-y-3">
                        <div className="text-2xl font-bold text-slate-700">ราคา: กรุณาติดต่อสอบถาม</div>
                        <QuoteRequestButton
                          product={{
                            id: String(p.id),
                            sku: (p.sku as string) ?? "",
                            name: (p.name as string) ?? (p.sku as string) ?? "",
                            selling_price: (p.selling_price as number | null) ?? 0,
                          }}
                        />
                      </div>
                    ) : (
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
                    )}
                    <VatNote size="md" className="mt-1" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <B2BBadgeLarge
                        sellingPrice={p.selling_price as number | null}
                        b2bPrice={(p as { b2b_price?: number | null }).b2b_price}
                      />
                      <MemberBadge
                        sellingPrice={p.selling_price as number | null}
                        memberPrice={(p as { member_price?: number | null }).member_price}
                        className="text-sm px-3 py-1"
                      />
                    </div>
                    {pr.volumeDiscount > 0 && (
                      <div className="mt-1 text-xs font-medium text-emerald-700">
                        รวมส่วนลดตามจำนวน −{Math.round(pr.volumeDiscount * 100)}% (×{qty})
                      </div>
                    )}
                    {pr.userType === "guest" && (
                      <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <div className="font-semibold">🎁 สมาชิก ENT Group รับราคาพิเศษ</div>
                        <Link to="/auth" className="mt-1 inline-block font-bold text-[color:var(--brand-navy)] underline">
                          สมัครฟรี ได้ราคาดีกว่าทันที →
                        </Link>
                      </div>
                    )}
                    {pr.userType === "b2c" && (
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        ✅ ราคาสมาชิกของคุณ
                      </div>
                    )}
                    {pr.userType === "b2b" && (
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        ✅ ราคาองค์กรของคุณ
                      </div>
                    )}
                  </div>
                );
              })()}

              <VolumeDiscountTable brand={p.brand} category={p.category} />



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

              {hasSpecTags(p.category as string | null | undefined) && (
                <div className="mt-6">
                  <SpecTagsFull description={p.description} />
                  <UsageInfoBox category={p.category as string | null | undefined} name={p.name} description={p.description} price={p.selling_price as number | null | undefined} />
                  <CctvSpecGuide category={p.category as string | null | undefined} name={p.name} description={p.description} />
                </div>
              )}



              {getSellingPrice(p as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null; tier_price_guest?: number | null; tier_price_b2c?: number | null; tier_price_b2c_silver?: number | null; tier_price_b2c_gold?: number | null; tier_price_b2c_vip?: number | null; tier_price_b2b?: number | null; tier_price_b2b_silver?: number | null; tier_price_b2b_gold?: number | null }, tier) != null && !!p.price_approved && !isQuoteOnly(p.selling_price as number | null) ? (
                <>
                  <div className="mt-6">
                    <div className="mb-2 text-sm text-slate-600">จำนวน</div>
                    <div className="inline-flex items-center overflow-hidden rounded-md border">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="ลด"><Minus className="h-4 w-4" /></button>
                      <div className="w-14 text-center text-sm font-semibold">{qty}</div>
                      <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center hover:bg-slate-100" aria-label="เพิ่ม"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {!isQuoteOnly(p.selling_price as number | null) && (
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <Button disabled={!available} onClick={() => addToCart()} className="bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]" size="lg">
                        <ShoppingCart className="mr-2 h-5 w-5" /> {byOrder ? "สั่งจอง" : "ใส่ตะกร้า"}
                      </Button>
                      {byOrder ? (
                        <Button asChild variant="outline" size="lg" className="border-blue-300 text-blue-800 hover:bg-blue-50">
                          <a href="mailto:sales@entgroup.co.th?subject=ขอใบเสนอราคา">📄 ขอใบเสนอราคา</a>
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
                  )}

                  {/* Contact section */}
                  <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <div className="text-sm font-medium text-gray-600">💬 สอบถามก่อนสั่งซื้อ</div>
                    <div className="text-xs text-gray-400">ทีมงานพร้อมช่วยเหลือ จ-ศ 9:00-18:00</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <LineQrDialog>
                        <Button
                          type="button"
                          className="w-full gap-1.5 rounded-xl bg-[#06C755] px-4 py-3 font-semibold text-white hover:bg-[#05a548]"
                        >
                          <MessageCircle className="h-4 w-4" /> Line: @entgroup
                        </Button>
                      </LineQrDialog>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full gap-1.5 rounded-xl border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <a href="tel:020456104">
                          <Phone className="h-4 w-4" /> 02-045-6104
                        </a>
                      </Button>
                    </div>
                    <div className="mt-2 text-center text-xs text-gray-400">
                      <a href="tel:020456104" className="hover:text-gray-600">02-045-6104</a> · <a href="tel:0957391053" className="hover:text-gray-600">095-739-1053</a>
                    </div>
                  </div>

                  <DeliveryZoneInfoBox className="mb-3" />
                  <ShippingMethodSelector />

                  <ProductTrustBar />

                  <DeliveryInfoBox category={p.category} name={p.name} price={(p as { selling_price?: number | null }).selling_price ?? undefined} />

                  <ReturnPolicyAccordion />

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
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-3 text-sm font-semibold text-amber-900">💬 สินค้านี้กรุณาติดต่อสอบถามราคา</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <LineQrDialog>
                      <Button type="button" className="w-full gap-1.5 rounded-lg bg-[#06C755] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#05a548]">
                        <MessageCircle className="h-4 w-4" /> Line: @entgroup
                      </Button>
                    </LineQrDialog>
                    <Button asChild className="w-full gap-1.5 rounded-lg bg-[color:var(--brand-green)] px-3 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                      <a href="tel:020456104"><Phone className="h-4 w-4" /> 02-045-6104</a>
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <a href="tel:0957391053" className="inline-flex items-center gap-1 hover:text-gray-900">📱 095-739-1053</a>
                    <a href="tel:0840461315" className="inline-flex items-center gap-1 hover:text-gray-900">📱 084-046-1315</a>
                    <a href="mailto:sales@entgroup.co.th" className="inline-flex items-center gap-1 hover:text-gray-900">
                      <Mail className="h-3.5 w-3.5" /> sales@entgroup.co.th
                    </a>
                  </div>
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

              {/* Edge AI Box / PLINK-AI project terms */}
              {p.distributor === "PLINK-AI" && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="font-semibold">⏱ ระยะเวลาส่งมอบโดยประมาณ 15-20 วัน — เหมาะสำหรับงานโครงการ</div>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    <li>• สั่งจองต้องวางมัดจำอย่างน้อย 70% ของราคาสินค้า</li>
                    <li>• รับส่วนลดเพิ่ม 1% เมื่อชำระเงินสดเต็มจำนวน</li>
                    <li>• ทีมงานจะติดต่อยืนยันรายละเอียดและกำหนดส่งมอบก่อนดำเนินการทุกครั้ง</li>
                  </ul>
                </div>
              )}

              {/* AEO — Answer-Ready Summary (for AI answer engines & voice search) */}
              {(() => {
                const priceNum = Number(p.selling_price ?? 0);
                const isOverseasFactory = p.distributor === "PLINK-AI";
                const stockLabel = isOverseasFactory
                  ? "สั่งผลิตจากโรงงานต่างประเทศ ~15-20 วัน"
                  : ready ? "พร้อมจัดส่ง" : byOrder ? "By Order 30 วัน" : (p.stock_status ?? "สินค้าหมด");
                const summary = [
                  priceNum > 0 ? `${p.name ?? decodedSku} ราคา ฿${priceNum.toLocaleString("th-TH")}` : (p.name ?? decodedSku),
                  stockLabel,
                  p.brand ? `แบรนด์ ${p.brand}` : "",
                  showSku ? `รหัสสินค้า ${decodedSku}` : "",
                  `จำหน่ายโดย ENT Group IT Retail Shop`,
                  "รับประกันศูนย์ไทย",
                ].filter(Boolean).join(" · ");

                return (
                  <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="สรุปรายละเอียดสินค้า">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4" />
                      สรุปรายละเอียดสินค้า
                    </div>
                    <p className="text-sm leading-relaxed text-slate-800">{summary}</p>
                  </section>
                );

              })()}

              {/* AEO — Spec table (structured facts) */}
              <section className="mt-6 overflow-hidden rounded-lg border" aria-label="ข้อมูลจำเพาะสินค้า">
                <table className="w-full text-sm">
                  <tbody>
                    {showSku && (
                      <tr className="border-b last:border-0">
                        <th className="w-40 bg-slate-50 p-3 text-left font-medium text-slate-600">รุ่น / Model</th>
                        <td className="p-3 text-slate-800"><ProtectedText text={decodedSku} /></td>
                      </tr>
                    )}
                    {[

                      ["แบรนด์", p.brand ?? "—"],
                      ...(Number(p.selling_price ?? 0) > 0
                        ? [["ราคา", `฿${Number(p.selling_price ?? 0).toLocaleString("th-TH")}`]]
                        : []),
                      ["สถานะ", p.distributor === "PLINK-AI"
                        ? "สั่งผลิตจากโรงงานต่างประเทศ ~15-20 วัน"
                        : `${p.stock_status ?? "—"}${byOrder ? " (By Order ~30 วัน)" : ""}`],
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
                const a1 = `${name} ราคา ฿${priceNum.toLocaleString("th-TH")} จาก ENT Group IT Retail Shop`;
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
            <h2 className="mb-1 text-lg font-bold text-[color:var(--brand-navy)]">แนะนำสำหรับคุณ</h2>
            <p className="mb-3 text-xs text-slate-500">ระบบพยากรณ์ความต้องการลูกค้าอัจฉริยะ — ประเมินจากพฤติกรรมการซื้อจริงและสินค้าที่ใกล้เคียงกัน</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {relatedQ.data!.map((r) => (
                <Link key={r.id} to="/product/$slug" params={{ slug: r.slug || r.id }} className="group flex flex-col overflow-hidden rounded-lg border bg-white p-2 transition hover:shadow-sm">
                  <div className="grid aspect-square max-h-[150px] place-items-center bg-white md:max-h-[190px]">
                    <ProductImage src={r.image_url} alt={r.name ?? r.sku} className="h-[140px] w-full object-contain md:h-[180px]" iconClassName="h-12 w-12 text-slate-300 md:h-14 md:w-14" />
                  </div>
                  <div className="mt-2 flex flex-col">
                    {r.reason && (
                      <span className="mb-1 w-fit rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        {r.reason}
                      </span>
                    )}
                    <div className="text-xs line-clamp-2 min-h-8 font-medium">{r.name ?? r.sku}</div>

                    <DiscountBadgeRow
                      sellingPrice={(r as { selling_price?: number | null }).selling_price}
                      b2bPrice={(r as { b2b_price?: number | null }).b2b_price}
                      memberPrice={(r as { member_price?: number | null }).member_price}
                      className="mt-1"
                    />
                    <div className="mt-1 text-sm font-bold text-[color:var(--brand-orange)]">{displayPrice(r as { selling_price?: number | null; member_price?: number | null; b2b_price?: number | null; tier_price_guest?: number | null; tier_price_b2c?: number | null; tier_price_b2c_silver?: number | null; tier_price_b2c_gold?: number | null; tier_price_b2c_vip?: number | null; tier_price_b2b?: number | null; tier_price_b2b_silver?: number | null; tier_price_b2b_gold?: number | null }, tier)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10">
        <HelpChooseBanner category={p?.category ?? null} />
      </div>

      <SiteFooter />

    </div>
  );
}

function VolumeDiscountTable({ brand, category }: { brand?: string | null; category?: string | null }) {
  const { data: rules } = useVolumeRules();
  const applicable = rulesForProduct(rules, { brand, category });
  if (applicable.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="text-sm font-bold text-amber-800">🏷️ ส่วนลดพิเศษเมื่อซื้อจำนวนมาก</div>
      <div className="mt-3 space-y-1.5">
        {applicable.map((r) => (
          <div key={r.id} className="flex justify-between text-sm">
            <span className="text-slate-600">{tierQtyLabel(r)}</span>
            <span className="font-bold text-green-600">{tierDiscountLabel(r)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-400">💼 เหมาะสำหรับ B2B / องค์กร</div>
      <div className="text-xs text-slate-400">📞 สั่งจำนวนมาก ติดต่อ 02-045-6104</div>
    </div>
  );
}
